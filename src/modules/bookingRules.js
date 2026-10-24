// A resource's booking rules in the browser, so the calendar and the form can say what can't be booked before
// it is tried. The server checks the same rules (server/booking.js) and has the last word.
import { WEEK_DAYS, toMinutes } from "./pollSlots";
import { isPastDay } from "./bookingTimes";

const MINUTES_PER_DAY = 1440;
const startOfDay = date => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / 86400000);
const weekDayName = date => WEEK_DAYS[(date.getDay() + 6) % 7];
const minuteOfDay = date => date.getHours() * 60 + date.getMinutes();

// "past", "closed" (not an open day), "tooFar" (beyond the days it can be booked ahead) or "open".
// Admins may book outside the rules, but not in the past.
export function dayStatus(resource, date, { isAdmin = false, now = new Date() } = {}) {
    if (isPastDay(date, now)) return "past";
    if (isAdmin) return "open";
    if (resource.openDays && !resource.openDays.includes(weekDayName(date))) return "closed";
    if (resource.maxDaysAhead && daysBetween(now, date) > resource.maxDaysAhead) return "tooFar";
    return "open";
}

export const DAY_STATUS_TEXT = {
    past: "Elmúlt nap",
    closed: "Ezen a napon zárva",
    tooFar: "Ilyen messzire előre nem foglalható",
};

// The first rule a single booking breaks, in words, or "" when it fits. For an all-day booking `end` is its
// last day, as in the form.
export function ruleProblem(resource, start, end, allDay, now = new Date()) {
    const valid = date => date instanceof Date && !isNaN(date);
    if (!valid(start) || !valid(end)) return "";
    if (allDay ? startOfDay(start) < startOfDay(now) : start < now) return "Múltbeli időpontra nem lehet foglalni.";
    if (allDay ? end < startOfDay(start) : end <= start) return "";

    if (allDay && resource.openFrom) {
        return `Ez az erőforrás csak ${resource.openFrom} és ${resource.openTo} között foglalható, egész napra nem.`;
    }

    const length = allDay ? (daysBetween(start, end) + 1) * MINUTES_PER_DAY : Math.round((end - start) / 60000);
    if (resource.minLengthMinutes && length < resource.minLengthMinutes) {
        return `Ez az erőforrás legalább ${resource.minLengthMinutes} percre foglalható.`;
    }
    if (resource.maxLengthMinutes && length > resource.maxLengthMinutes) {
        return `Ez az erőforrás legfeljebb ${resource.maxLengthMinutes} percre foglalható.`;
    }

    if (resource.openFrom) {
        const hours = `${resource.openFrom} és ${resource.openTo}`;
        if (daysBetween(start, end) !== 0 || minuteOfDay(start) < toMinutes(resource.openFrom)
            || minuteOfDay(end) > toMinutes(resource.openTo)) {
            return `Ez az erőforrás csak ${hours} között foglalható.`;
        }
    }

    if (resource.openDays) {
        const lastDay = allDay ? end : new Date(end.getTime() - 1);
        for (let day = startOfDay(start); day <= lastDay; day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)) {
            if (!resource.openDays.includes(weekDayName(day))) {
                const name = weekDayName(day);
                return `${name.charAt(0).toUpperCase()}${name.slice(1)} zárva. Foglalható: ${resource.openDays.join(", ")}.`;
            }
        }
    }

    if (resource.maxDaysAhead && daysBetween(now, start) > resource.maxDaysAhead) {
        return `Ez az erőforrás legfeljebb ${resource.maxDaysAhead} nappal előre foglalható.`;
    }
    return "";
}

// The hours a week view shows, in minutes of the day: the opening hours (or 07:00–20:00), widened to whole
// hours that fit every timed booking in `minutes` ([{ start, end }] in minutes of the day)
export function visibleHours(resource, minutes = []) {
    let from = resource.openFrom ? toMinutes(resource.openFrom) : 7 * 60;
    let to = resource.openTo ? toMinutes(resource.openTo) : 20 * 60;
    for (const item of minutes) {
        from = Math.min(from, item.start);
        to = Math.max(to, item.end);
    }
    return { from: Math.floor(from / 60) * 60, to: Math.min(MINUTES_PER_DAY, Math.ceil(to / 60) * 60) };
}

// Whether a booking may start at `time` (a Date) for this resource: within an open day, the opening hours,
// and not in the past. Admins may start any time not in the past.
export function isBookableTime(resource, time, { isAdmin = false, now = new Date() } = {}) {
    if (time < now) return false;
    if (dayStatus(resource, time, { isAdmin, now }) !== "open") return false;
    if (isAdmin || !resource.openFrom) return true;
    const minute = minuteOfDay(time);
    return minute >= toMinutes(resource.openFrom) && minute < toMinutes(resource.openTo);
}
