const database = require('./database');
const { expand, getRepeatLimit, WEEK_DAYS } = require('./recurrence');
const { ValidationError, toPositiveSmallint, toDate, toTitle } = require('./validation');
const { toEmail, toPhone } = require('./auth');

const REGULARITY_MEASURES = ["never", "day", "week", "month"];
// "sixMonths" is only accepted as input; it is stored as an end date at the 6-month limit
const ENDS_ON_TYPES = ["sixMonths", "onDate", "occurrence"];
const MAX_RANGE_DAYS = 400;

const COLUMNS = `id, "resourceId", title, description, "startDate", "endDate", "allDay", "regularityMeasure",
    "regularityRepeatNumber", "regularityDays", "endsOnType", "endsOnDate", "endsOnOccurrence", "contactEmail", "contactPhone"`;

const startOfDay = date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

// Checks a request body and returns the values to store
function toReservationValues(body) {
    const title = toTitle(body.title, "Nincs megadva a foglalás neve!");
    const description = typeof body.description === "string" ? body.description.trim() : "";

    const startDate = toDate(body.startDate, "Hibás kezdő időpont!");
    const endDate = toDate(body.endDate, "Hibás záró időpont!");
    if (startDate > endDate) throw new ValidationError("A kezdő időpont nem lehet a záró időpont után!");

    const regularityMeasure = body.regularityMeasure || "never";
    if (!REGULARITY_MEASURES.includes(regularityMeasure)) throw new ValidationError("Hibás ismétlődés!");

    // Optional; only admins see them
    const contactEmail = typeof body.contactEmail === "string" && body.contactEmail.trim() !== "" ? toEmail(body.contactEmail) : "";
    const contactPhone = toPhone(body.contactPhone);

    const values = {
        title, description, startDate, endDate, contactEmail, contactPhone,
        allDay: body.allDay === true,
        regularityMeasure,
        regularityRepeatNumber: null,
        regularityDays: null,
        endsOnType: null,
        endsOnDate: null,
        endsOnOccurrence: null,
    };
    if (regularityMeasure === "never") return values;

    values.regularityRepeatNumber = toPositiveSmallint(body.regularityRepeatNumber, "Hibás ismétlődési szám!");
    if (regularityMeasure === "week") {
        values.regularityDays = Array.isArray(body.regularityDays)
            ? WEEK_DAYS.filter(day => body.regularityDays.includes(day))
            : [];
        if (values.regularityDays.length === 0) throw new ValidationError("Válassz legalább egy napot!");
    }

    const endsOnType = body.endsOnType || "sixMonths";
    if (!ENDS_ON_TYPES.includes(endsOnType)) throw new ValidationError("Hibás ismétlődés vége!");
    const limit = getRepeatLimit(startDate);
    const tooLong = new ValidationError("Az ismétlődés legfeljebb 6 hónapig tarthat az első alkalomtól!");

    if (endsOnType === "sixMonths") {
        values.endsOnType = "onDate";
        values.endsOnDate = limit;
    } else if (endsOnType === "onDate") {
        const endsOnDate = startOfDay(toDate(body.endsOnDate, "Hibás ismétlődés vége dátum!"));
        if (endsOnDate < startOfDay(startDate)) throw new ValidationError("Az ismétlődés vége nem lehet az első alkalom előtt!");
        if (endsOnDate > limit) throw tooLong;
        values.endsOnType = "onDate";
        values.endsOnDate = endsOnDate;
    } else {
        values.endsOnType = "occurrence";
        values.endsOnOccurrence = toPositiveSmallint(body.endsOnOccurrence, "Hibás előfordulás szám!");
        // Fewer occurrences fit inside the 6 months than asked for
        if (expand(values).length < values.endsOnOccurrence) throw tooLong;
    }
    return values;
}

const valueList = values => [values.title, values.description, values.startDate, values.endDate, values.allDay,
values.regularityMeasure, values.regularityRepeatNumber, values.regularityDays, values.endsOnType,
values.endsOnDate, values.endsOnOccurrence, values.contactEmail, values.contactPhone];

// The resource's reservations, as stored (a repeating one is a single row)
async function listByResource(resourceId) {
    return database.query(
        `SELECT ${COLUMNS} FROM reservations WHERE "resourceId" = $1 AND "deletedAt" IS NULL ORDER BY "startDate", id`,
        [resourceId]);
}

// Every occurrence of the resource's reservations that overlaps [from, to), ordered by start
async function occurrences(resourceId, fromValue, toValue) {
    const from = toDate(fromValue, "Hibás kezdő dátum!");
    const to = toDate(toValue, "Hibás záró dátum!");
    if (to <= from || (to - from) / 86400000 > MAX_RANGE_DAYS) throw new ValidationError("Hibás időszak!");

    const reservations = await listByResource(resourceId);
    return reservations
        .flatMap(reservation => expand(reservation, from, to).map(occurrence => ({
            reservationId: reservation.id,
            title: reservation.title,
            description: reservation.description,
            allDay: reservation.allDay,
            repeating: reservation.regularityMeasure !== "never",
            start: occurrence.start,
            end: occurrence.end,
        })))
        .sort((a, b) => a.start - b.start || a.reservationId - b.reservationId);
}

async function create(resourceId, body) {
    const values = toReservationValues(body);
    const rows = await database.query(
        `INSERT INTO reservations ("resourceId", title, description, "startDate", "endDate", "allDay", "regularityMeasure",
            "regularityRepeatNumber", "regularityDays", "endsOnType", "endsOnDate", "endsOnOccurrence", "contactEmail", "contactPhone")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING ${COLUMNS}`,
        [resourceId, ...valueList(values)]);
    return rows[0];
}

// Returns null when there is no such reservation
async function update(id, body) {
    const values = toReservationValues(body);
    const rows = await database.query(
        `UPDATE reservations SET title = $2, description = $3, "startDate" = $4, "endDate" = $5, "allDay" = $6,
            "regularityMeasure" = $7, "regularityRepeatNumber" = $8, "regularityDays" = $9, "endsOnType" = $10,
            "endsOnDate" = $11, "endsOnOccurrence" = $12, "contactEmail" = $13, "contactPhone" = $14
        WHERE id = $1 AND "deletedAt" IS NULL RETURNING ${COLUMNS}`,
        [id, ...valueList(values)]);
    return rows.length === 1 ? rows[0] : null;
}

// Soft delete: the row stays, hidden. Returns false when there is no such reservation.
async function remove(id) {
    const rows = await database.query(
        `UPDATE reservations SET "deletedAt" = now() WHERE id = $1 AND "deletedAt" IS NULL RETURNING id`, [id]);
    return rows.length === 1;
}

module.exports = { listByResource, occurrences, create, update, remove, toReservationValues };
