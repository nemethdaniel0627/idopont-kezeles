// Labels and helpers for polls. A slot id is "<day> <HH:MM>", the day a date ("2026-11-03") or a
// Hungarian day name ("kedd"), all in the poll's time zone.

export const WEEK_DAYS = ["hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat", "vasárnap"];
const SHORT_DAYS = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];

const pad = number => String(number).padStart(2, "0");
export const toMinutes = time => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
export const toTime = minutes => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
export const slotId = (day, time) => `${day} ${time}`;

const isDate = day => /^\d{4}-\d{2}-\d{2}$/.test(day);

// "2026-11-03" -> the local Date of that day
export function parseDay(day) {
    const [year, month, date] = day.split("-").map(Number);
    return new Date(year, month - 1, date);
}

// A local Date -> "2026-11-03"
export const formatDay = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const weekDayIndex = date => (date.getDay() + 6) % 7;

// "kedd, 11. 03." for a date, "kedd" for a week day
export function dayLabel(day) {
    if (!isDate(day)) return day;
    const date = parseDay(day);
    return `${WEEK_DAYS[weekDayIndex(date)]}, ${pad(date.getMonth() + 1)}. ${pad(date.getDate())}.`;
}

// The grid's column header: { top: "K", bottom: "11. 03." } or { top: "kedd", bottom: "" }
export function dayHeader(day) {
    if (!isDate(day)) return { top: day, bottom: "" };
    const date = parseDay(day);
    return { top: SHORT_DAYS[weekDayIndex(date)], bottom: `${pad(date.getMonth() + 1)}. ${pad(date.getDate())}.` };
}

// "kedd, 11. 03. 09:00–11:00"
export const rangeText = range => `${dayLabel(range.day)} ${range.from}–${range.to}`;

// The poll's days in a short line: "11. 03., 11. 04., 11. 06." or "hétfő, szerda"
export function describeDays(poll) {
    if (poll.mode === "weekdays") return WEEK_DAYS.filter(day => poll.weekDays.includes(day)).join(", ");
    return [...poll.dates].sort().map(day => dayHeader(day).bottom).join(", ");
}

// "30 perc", "1 óra", "1,5 óra"
export function durationText(minutes) {
    if (minutes < 60) return `${minutes} perc`;
    return `${String(minutes / 60).replace(".", ",")} óra`;
}

// Times of the day in `step` minute steps, from `from` to `to` (both included), e.g. for the time window selects
export function timeOptions(step, from = 0, to = 24 * 60) {
    const options = [];
    for (let minutes = from; minutes <= to; minutes += step) options.push(toTime(minutes));
    return options;
}

// The week rows (Monday first) of a month view; each day a Date, or null outside the month
export function monthWeeks(year, month) {
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = Array(weekDayIndex(first)).fill(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
}
