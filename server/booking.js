// The checks a booking must pass: the resource's booking rules, no overlap with other reservations, and
// for editing or cancelling without login, the contact given at booking.
const { expand, WEEK_DAYS } = require('./recurrence');
const { ValidationError, HttpError } = require('./validation');

const MINUTES_PER_DAY = 1440;

const pad = number => String(number).padStart(2, '0');
const formatDay = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const formatTime = date => `${pad(date.getHours())}:${pad(date.getMinutes())}`;
const minuteOfDay = date => date.getHours() * 60 + date.getMinutes();
const timeToMinutes = time => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const startOfDay = date => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / 86400000);
const weekDayName = date => WEEK_DAYS[(date.getDay() + 6) % 7];

// "2026-10-28 10:00–11:30", "2026-10-28 (egész nap)" or "2026-10-28 22:00 – 2026-10-29 02:00"
function describeOccurrence(occurrence, allDay) {
    const { start, end } = occurrence;
    if (allDay) {
        const lastDay = addDays(end, -1);
        return daysBetween(start, lastDay) === 0
            ? `${formatDay(start)} (egész nap)`
            : `${formatDay(start)} – ${formatDay(lastDay)} (egész nap)`;
    }
    return daysBetween(start, end) === 0
        ? `${formatDay(start)} ${formatTime(start)}–${formatTime(end)}`
        : `${formatDay(start)} ${formatTime(start)} – ${formatDay(end)} ${formatTime(end)}`;
}

// The days an occurrence touches; one that ends at midnight does not touch the next day
function coveredDays(occurrence) {
    const days = [];
    for (let day = startOfDay(occurrence.start); day < occurrence.end; day = addDays(day, 1)) days.push(day);
    return days;
}

function lengthInMinutes(occurrence, allDay) {
    // An all-day booking counts as 24 hours a day, also on the days the clock changes
    return allDay
        ? daysBetween(occurrence.start, occurrence.end) * MINUTES_PER_DAY
        : Math.round((occurrence.end - occurrence.start) / 60000);
}

// Throws a ValidationError naming the first broken rule. Occurrences that started before `now` are
// skipped when `ignorePast` is set (editing a repetition that is already under way); otherwise they are an error.
function checkRules(resource, allDay, occurrences, now, { ignorePast = false } = {}) {
    const started = occurrence => allDay ? occurrence.start < startOfDay(now) : occurrence.start < now;
    const toCheck = ignorePast ? occurrences.filter(occurrence => !started(occurrence)) : occurrences;
    if (toCheck.length === 0 || toCheck.some(started)) {
        throw new ValidationError('Múltbeli időpontra nem lehet foglalni!');
    }

    if (allDay && resource.openFrom !== null) {
        throw new ValidationError(`Ez az erőforrás csak nyitvatartási időben (${resource.openFrom}–${resource.openTo}) foglalható, egész napra nem!`);
    }

    for (const occurrence of toCheck) {
        const where = occurrences.length > 1 ? ` (${describeOccurrence(occurrence, allDay)})` : '';
        const length = lengthInMinutes(occurrence, allDay);
        if (resource.minLengthMinutes !== null && length < resource.minLengthMinutes) {
            throw new ValidationError(`Ez az erőforrás legalább ${resource.minLengthMinutes} percre foglalható!${where}`);
        }
        if (resource.maxLengthMinutes !== null && length > resource.maxLengthMinutes) {
            throw new ValidationError(`Ez az erőforrás legfeljebb ${resource.maxLengthMinutes} percre foglalható!${where}`);
        }

        if (resource.openFrom !== null) {
            const hours = `${resource.openFrom}–${resource.openTo}`;
            const sameDay = daysBetween(occurrence.start, occurrence.end) === 0;
            if (!sameDay || minuteOfDay(occurrence.start) < timeToMinutes(resource.openFrom)
                || minuteOfDay(occurrence.end) > timeToMinutes(resource.openTo)) {
                throw new ValidationError(`Ez az erőforrás csak nyitvatartási időben (${hours}) foglalható!${where}`);
            }
        }

        if (resource.openDays !== null && coveredDays(occurrence).some(day => !resource.openDays.includes(weekDayName(day)))) {
            throw new ValidationError(`Ez az erőforrás csak ezeken a napokon foglalható: ${resource.openDays.join(', ')}!${where}`);
        }

        if (resource.maxDaysAhead !== null && daysBetween(now, occurrence.start) > resource.maxDaysAhead) {
            throw new ValidationError(`Ez az erőforrás legfeljebb ${resource.maxDaysAhead} nappal előre foglalható!${where}`);
        }
    }
}

// Throws a 409 naming the first stored reservation (other than `ignoreId`) that overlaps an occurrence.
// Touching is fine: one may end when the next starts.
function checkConflicts(occurrences, existing, ignoreId = null) {
    if (occurrences.length === 0) return;
    const from = new Date(Math.min(...occurrences.map(occurrence => occurrence.start)));
    const to = new Date(Math.max(...occurrences.map(occurrence => occurrence.end)));

    for (const reservation of existing) {
        if (reservation.id === ignoreId) continue;
        for (const other of expand(reservation, from, to)) {
            if (occurrences.some(occurrence => occurrence.start < other.end && other.start < occurrence.end)) {
                throw new HttpError(409,
                    `Ez az időpont már foglalt: „${reservation.title}” (${describeOccurrence(other, reservation.allDay)})`);
            }
        }
    }
}

// Digits only, with the Hungarian prefixes 06 and 0036 written as 36
function normalizePhone(value) {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.startsWith('0036')) return digits.slice(2);
    if (digits.startsWith('06')) return '36' + digits.slice(2);
    return digits;
}

// The logged-in user who booked it, or whose account email is the booking's contact email
function isOwner(reservation, user) {
    if (!user) return false;
    return reservation.userId === user.id || (reservation.contactEmail !== '' && reservation.contactEmail === user.email);
}

// Whether `contact` is the email (any case) or the phone number (any format) given at booking
function matchesContact(reservation, contact) {
    const value = typeof contact === 'string' ? contact.trim() : '';
    if (value === '') return false;
    if (value.includes('@')) {
        return reservation.contactEmail !== '' && value.toLowerCase() === reservation.contactEmail.toLowerCase();
    }
    const phone = normalizePhone(value);
    return phone.length >= 6 && phone === normalizePhone(reservation.contactPhone);
}

module.exports = { checkRules, checkConflicts, isOwner, matchesContact, describeOccurrence };
