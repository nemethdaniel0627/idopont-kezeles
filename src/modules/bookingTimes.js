const DEFAULT_LENGTH = 60;
const DEFAULT_FIRST_HOUR = 8;

const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// "08:30" on the day of `date`
function atTime(date, time) {
    const [hours, minutes] = time.split(":").map(Number);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
}

// The start and end a new booking's form opens with: at `time` when a time slot was clicked, otherwise on `day`
// from the opening time (or 08:00), and today from the next whole hour. One hour long, or as long as the
// resource's rules allow.
export function suggestTimes(resource, day, time = null, now = new Date()) {
    let length = DEFAULT_LENGTH;
    if (resource.minLengthMinutes && length < resource.minLengthMinutes) length = resource.minLengthMinutes;
    if (resource.maxLengthMinutes && length > resource.maxLengthMinutes) length = resource.maxLengthMinutes;

    let start;
    if (time) {
        start = new Date(time);
    } else {
        const opening = resource.openFrom ? atTime(day, resource.openFrom) : atTime(day, `${DEFAULT_FIRST_HOUR}:00`);
        start = opening;
        if (sameDay(day, now)) {
            const nextHour = new Date(now);
            nextHour.setHours(now.getHours() + 1, 0, 0, 0);
            if (nextHour > start) start = nextHour;
        }
    }
    return { start, end: new Date(start.getTime() + length * 60000) };
}

// Whether `day` is before today, so it can't be booked any more
export function isPastDay(day, now = new Date()) {
    return new Date(day.getFullYear(), day.getMonth(), day.getDate()) < new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
