// Places one day's reservations within the hours, like the old day view did: each from its start minute, as
// tall as its length. Reservations that overlap share the width: each gets a lane, and the lanes of a group of
// overlapping reservations split the column.

// "9:30" -> 570
const startMinute = serviceStart => {
    const [hours, minutes] = serviceStart.split(":").map(Number);
    return hours * 60 + minutes;
};

// `services` are a day's items from placeOccurrences (already cut to the day). Returns the all-day ones and the
// timed ones as { service, start, end, lane, lanes }, start and end in minutes of the day.
export function layoutDay(services) {
    const allDay = services.filter(service => service.allDay);
    const timed = services
        .filter(service => !service.allDay)
        .map(service => {
            const start = startMinute(service.serviceStart);
            return { service, start, end: start + Math.max(service.serviceLength, 1) };
        })
        .sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

    // Groups of reservations that overlap one another, directly or through others
    const groups = [];
    for (const item of timed) {
        const group = groups[groups.length - 1];
        if (group && item.start < group.end) {
            group.items.push(item);
            group.end = Math.max(group.end, item.end);
        } else {
            groups.push({ items: [item], end: item.end });
        }
    }

    for (const group of groups) {
        const laneEnds = [];
        for (const item of group.items) {
            let lane = laneEnds.findIndex(end => end <= item.start);
            if (lane === -1) lane = laneEnds.length;
            laneEnds[lane] = item.end;
            item.lane = lane;
        }
        group.items.forEach(item => { item.lanes = laneEnds.length; });
    }
    return { allDay, timed };
}

// The time range a drag in a day column selects: from the slot it started on (`anchor`) toward the slot
// under the pointer (`current`), both start minutes, but only as far as the slots stay free, so it never
// runs into a closed hour or another booking. Returns { start, end } in minutes of the day.
export function dragRange(anchor, current, isFree, slotMinutes = 30) {
    const step = current >= anchor ? slotMinutes : -slotMinutes;
    let reached = anchor;
    for (let minute = anchor + step; step > 0 ? minute <= current : minute >= current; minute += step) {
        if (!isFree(minute)) break;
        reached = minute;
    }
    return { start: Math.min(anchor, reached), end: Math.max(anchor, reached) + slotMinutes };
}
