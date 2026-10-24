// Puts the occurrences of a resource's reservations into the days of a month grid.
// Each day of the grid is { date, services: [], fullscreenServices: [] }:
// - services: one item per occurrence on that day, cut to the day (for the day timeline)
// - fullscreenServices: one item per occurrence and lane (row), so an occurrence spanning several days stays
//   in the same row; empty rows are filled with "ghost" items

function nextDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

const ghost = date => ({ id: -1, serviceDate: new Date(date), name: "", type: "ghost", start: null, end: null, allDay: undefined });

// An occurrence from the server, with its dates as Date objects
export function toOccurrence(item) {
    return { ...item, start: new Date(item.start), end: new Date(item.end) };
}

// The [from, to) range the grid shows
export function getGridRange(days) {
    return { from: days[0].date, to: nextDay(days[days.length - 1].date) };
}

export function placeOccurrences(days, occurrences) {
    // Earlier first, and of those the longer first, so long bars get the upper rows
    const sorted = [...occurrences].sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

    sorted.forEach(occurrence => {
        const covered = days.filter(day => day.date < occurrence.end && nextDay(day.date) > occurrence.start);
        if (covered.length === 0) return;

        const details = {
            id: occurrence.reservationId,
            name: occurrence.title,
            description: occurrence.description,
            repeating: occurrence.repeating,
            start: occurrence.start,
            end: occurrence.end,
            allDay: occurrence.allDay,
            // The viewer's own booking (they may change it without giving the contact)
            mine: occurrence.mine === true,
        };

        covered.forEach(day => {
            const from = occurrence.start > day.date ? occurrence.start : day.date;
            const dayEnd = nextDay(day.date);
            const to = occurrence.end < dayEnd ? occurrence.end : dayEnd;
            day.services.push({
                ...details,
                serviceDate: new Date(day.date),
                serviceStart: `${from.getHours()}:${from.getMinutes()}`,
                serviceLength: Math.round((to - from) / 60000),
            });
        });

        // The first row that is free (empty or a ghost) on every covered day
        const isFree = row => covered.every(day => !day.fullscreenServices[row] || day.fullscreenServices[row].type === "ghost");
        let lane = 0;
        while (!isFree(lane)) lane++;

        covered.forEach((day, index) => {
            let type = "not";
            if (covered.length > 1) {
                type = index === 0 ? "start" : index === covered.length - 1 ? "end" : "middle";
            }
            for (let row = day.fullscreenServices.length; row < lane; row++) day.fullscreenServices.push(ghost(day.date));
            day.fullscreenServices[lane] = { ...details, serviceDate: new Date(day.date), type };
        });
    });
    return days;
}
