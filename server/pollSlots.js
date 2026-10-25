// A poll's time slots and its result. A slot is a wall-clock time in the poll's time zone, its id is
// "<day> <HH:MM>", the day being a date ("2026-11-03") or a Hungarian day name ("kedd").
const { WEEK_DAYS } = require('./recurrence');

const pad = number => String(number).padStart(2, '0');
const toMinutes = time => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const toTime = minutes => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

// The poll's days in order: its dates, or its week days from Monday
function daysOf(poll) {
    return poll.mode === 'dates'
        ? [...poll.dates].sort()
        : WEEK_DAYS.filter(day => poll.weekDays.includes(day));
}

// The start times of a day's slots, e.g. ["09:00", "09:30", ...]; the last one ends at dayEnd
function timesOf(poll) {
    const times = [];
    for (let minutes = toMinutes(poll.dayStart); minutes + poll.slotMinutes <= toMinutes(poll.dayEnd); minutes += poll.slotMinutes) {
        times.push(toTime(minutes));
    }
    return times;
}

// Every slot id of the poll, day by day
function slotsOf(poll) {
    const times = timesOf(poll);
    return daysOf(poll).flatMap(day => times.map(time => `${day} ${time}`));
}

// How many respondents marked each slot, and the times good for everyone: the slots every respondent
// marked, merged where they follow each other within a day, kept when at least the meeting length.
function computeResults(poll, answers) {
    const counts = {};
    for (const answer of answers) {
        for (const slot of answer.slots) counts[slot] = (counts[slot] || 0) + 1;
    }

    const common = [];
    if (answers.length > 0) {
        const times = timesOf(poll);
        for (const day of daysOf(poll)) {
            let range = null;
            for (const time of times) {
                if (counts[`${day} ${time}`] === answers.length) {
                    const end = toTime(toMinutes(time) + poll.slotMinutes);
                    if (range) range.to = end;
                    else range = { day, from: time, to: end };
                } else if (range) {
                    common.push(range);
                    range = null;
                }
            }
            if (range) common.push(range);
        }
    }

    const minimum = poll.meetingMinutes || 0;
    return {
        respondents: answers.length,
        counts,
        common: common.filter(range => toMinutes(range.to) - toMinutes(range.from) >= minimum),
    };
}

// Closed by the organizer, or its deadline has passed
function isClosed(poll, now = new Date()) {
    return poll.closedAt !== null || (poll.deadline !== null && new Date(poll.deadline) <= now);
}

module.exports = { daysOf, timesOf, slotsOf, computeResults, isClosed, toMinutes };
