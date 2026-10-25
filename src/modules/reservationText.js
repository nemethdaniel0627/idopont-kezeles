import Calendar from "./Calendar";

const regularityUnits = { day: "napon", week: "héten", month: "hónapban" };
const sameDay = (a, b) => Calendar.getPrefix(a) === Calendar.getPrefix(b);

// A short Hungarian description of a stored reservation's time and repetition,
// e.g. "2026-10-19 14:00 - 15:00, minden 2. héten (hétfő, szerda), eddig: 2027-01-19"
export function describeReservation(reservation) {
    const start = new Date(reservation.startDate);
    let end = new Date(reservation.endDate);
    if (reservation.allDay) end = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const time = reservation.allDay
        ? (sameDay(start, end) ? Calendar.getDateWithFormat(start) : `${Calendar.getDateWithFormat(start)} - ${Calendar.getDateWithFormat(end)}`)
        : `${Calendar.getDateWithFormat(start, true)} - ${sameDay(start, end) ? Calendar.getDateWithFormat(end, true).slice(11) : Calendar.getDateWithFormat(end, true)}`;
    if (reservation.regularityMeasure === "never") return time;

    const every = reservation.regularityRepeatNumber !== 1 ? `${reservation.regularityRepeatNumber}. ` : "";
    const days = reservation.regularityMeasure === "week" ? ` (${reservation.regularityDays.join(", ")})` : "";
    const until = reservation.endsOnType === "occurrence"
        ? `${reservation.endsOnOccurrence} alkalommal`
        : `eddig: ${Calendar.getDateWithFormat(new Date(reservation.endsOnDate))}`;
    return `${time}, minden ${every}${regularityUnits[reservation.regularityMeasure]}${days}, ${until}`;
}

const shortDayNames = { "hétfő": "H", "kedd": "K", "szerda": "Sze", "csütörtök": "Cs", "péntek": "P", "szombat": "Szo", "vasárnap": "V" };
const weekOrder = Object.keys(shortDayNames);

// The days as ranges where they follow each other, e.g. ["hétfő", …, "péntek", "vasárnap"] -> "H–P, V"
function describeDays(days) {
    const indexes = days.map(day => weekOrder.indexOf(day)).sort((a, b) => a - b);
    const ranges = [];
    indexes.forEach(index => {
        const last = ranges[ranges.length - 1];
        if (last && last[1] === index - 1) last[1] = index;
        else ranges.push([index, index]);
    });
    const name = index => shortDayNames[weekOrder[index]];
    return ranges.map(([from, to]) => from === to ? name(from) : `${name(from)}–${name(to)}`).join(", ");
}

// A resource's booking rules in one line, e.g. "H–P 08:00–18:00 · 30–240 perc · legfeljebb 60 nappal előre",
// or "" when it has none
export function describeRules(resource) {
    const parts = [];
    const when = [resource.openDays ? describeDays(resource.openDays) : "", resource.openFrom ? `${resource.openFrom}–${resource.openTo}` : ""]
        .filter(part => part !== "").join(" ");
    if (when !== "") parts.push(when);
    const { minLengthMinutes: min, maxLengthMinutes: max } = resource;
    if (min && max) parts.push(`${min}–${max} perc`);
    else if (min) parts.push(`legalább ${min} perc`);
    else if (max) parts.push(`legfeljebb ${max} perc`);
    if (resource.maxDaysAhead) parts.push(`legfeljebb ${resource.maxDaysAhead} nappal előre`);
    return parts.join(" · ");
}
