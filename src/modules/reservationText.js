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
