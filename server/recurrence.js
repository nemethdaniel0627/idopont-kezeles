// Turns a reservation into its concrete occurrences.
// All calculations use local calendar days, so an occurrence keeps its clock time across daylight saving changes.

const WEEK_DAYS = ["hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat", "vasárnap"];
const MAX_MONTHS = 6;

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function startOfDay(date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}

// Calendar days from a to b
function daysBetween(a, b) {
    return Math.round((startOfDay(b) - startOfDay(a)) / 86400000);
}

// The same day of the month `months` later, or null when that month has no such day (e.g. 31 April)
function addMonthsExact(date, months) {
    const result = new Date(date);
    result.setDate(1);
    result.setMonth(result.getMonth() + months);
    result.setDate(date.getDate());
    return result.getDate() === date.getDate() ? result : null;
}

// The last day a repetition may fall on: 6 months after the first date, at the end of shorter months
// (31 August -> 28 February)
function getRepeatLimit(firstStart) {
    const limit = startOfDay(firstStart);
    const day = limit.getDate();
    limit.setDate(1);
    limit.setMonth(limit.getMonth() + MAX_MONTHS);
    const lastDayOfMonth = new Date(limit.getFullYear(), limit.getMonth() + 1, 0).getDate();
    limit.setDate(Math.min(day, lastDayOfMonth));
    return limit;
}

// 0 = hétfő ... 6 = vasárnap
function weekdayIndex(date) {
    return (date.getDay() + 6) % 7;
}

// The days the repetition falls on, in order, up to and including `limit`
function* candidateDays(reservation, first, limit) {
    const every = reservation.regularityRepeatNumber || 1;
    switch (reservation.regularityMeasure) {
        case "day":
            for (let day = first; day <= limit; day = addDays(day, every)) yield day;
            return;
        case "week": {
            const weekDays = (reservation.regularityDays || [])
                .map(day => WEEK_DAYS.indexOf(day))
                .filter(index => index !== -1)
                .sort((a, b) => a - b);
            if (weekDays.length === 0) weekDays.push(weekdayIndex(first));
            const firstMonday = addDays(first, -weekdayIndex(first));
            for (let monday = firstMonday; monday <= limit; monday = addDays(monday, 7 * every)) {
                for (const weekDay of weekDays) {
                    const day = addDays(monday, weekDay);
                    if (day >= first && day <= limit) yield day;
                }
            }
            return;
        }
        case "month":
            for (let n = 0; new Date(first.getFullYear(), first.getMonth() + n, 1) <= limit; n += every) {
                // Months without this day (e.g. 31 April) are skipped
                const day = addMonthsExact(first, n);
                if (day !== null && day <= limit) yield day;
            }
            return;
        default:
            yield first;
    }
}

// The days of all occurrences, honouring the end of the repetition and the 6-month limit
function occurrenceDays(reservation) {
    const first = startOfDay(reservation.startDate);
    const repeats = reservation.regularityMeasure && reservation.regularityMeasure !== "never";
    if (!repeats) return [first];

    const endDay = reservation.endsOnType === "onDate" && reservation.endsOnDate
        ? startOfDay(reservation.endsOnDate)
        : null;
    const repeatLimit = getRepeatLimit(first);
    const limit = endDay && endDay < repeatLimit ? endDay : repeatLimit;
    const maxCount = reservation.endsOnType === "occurrence" ? reservation.endsOnOccurrence : Infinity;

    const result = [];
    for (const day of candidateDays(reservation, first, limit)) {
        if (result.length >= maxCount) break;
        result.push(day);
    }
    return result;
}

// The occurrences that overlap [from, to), each { start, end }. For an all-day reservation start and end
// are the start of its first day and the start of the day after its last day.
function expand(reservation, from = new Date(-8.64e15), to = new Date(8.64e15)) {
    const startDate = new Date(reservation.startDate);
    const endDate = new Date(reservation.endDate);
    const lengthInDays = daysBetween(startDate, endDate);
    const days = occurrenceDays({ ...reservation, startDate });

    const occurrences = [];
    for (const day of days) {
        const offset = daysBetween(startDate, day);
        let start = addDays(startDate, offset);
        let end = addDays(endDate, offset);
        if (reservation.allDay) {
            start = startOfDay(start);
            end = addDays(startOfDay(start), lengthInDays + 1);
        }
        if (end > from && start < to) {
            occurrences.push({ start, end });
        }
    }
    return occurrences;
}

module.exports = { expand, occurrenceDays, getRepeatLimit, WEEK_DAYS };
