const database = require('./database');
const { expand, getRepeatLimit, WEEK_DAYS } = require('./recurrence');
const { ValidationError, HttpError, toPositiveSmallint, toDate, toTitle } = require('./validation');
const { toEmail, toPhone } = require('./auth');
const resources = require('./resources');
const { checkRules, checkConflicts, isOwner, matchesContact } = require('./booking');
const { encrypt, decryptRow, lookupHash, ENCRYPTED_COLUMNS } = require('./encryption');

const REGULARITY_MEASURES = ["never", "day", "week", "month"];
// "sixMonths" is only accepted as input; it is stored as an end date at the 6-month limit
const ENDS_ON_TYPES = ["sixMonths", "onDate", "occurrence"];
const MAX_RANGE_DAYS = 400;

const COLUMNS = `id, "resourceId", title, description, "startDate", "endDate", "allDay", "regularityMeasure",
    "regularityRepeatNumber", "regularityDays", "endsOnType", "endsOnDate", "endsOnOccurrence", "contactEmail", "contactPhone", "userId"`;

// A reservation row as stored, with the personal data (title, description, contacts) decrypted
const toReservation = row => (row ? decryptRow(row, ENCRYPTED_COLUMNS.reservations) : null);

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

    // Only admins see them. Optional for admins; users need at least one (checked in checkBooking).
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

// The values to store, the personal data encrypted, and the contact email's lookup hash last
const valueList = values => [encrypt(values.title), encrypt(values.description), values.startDate, values.endDate, values.allDay,
values.regularityMeasure, values.regularityRepeatNumber, values.regularityDays, values.endsOnType,
values.endsOnDate, values.endsOnOccurrence, encrypt(values.contactEmail), encrypt(values.contactPhone), lookupHash(values.contactEmail)];

// The resource's reservations, as stored (a repeating one is a single row)
async function listByResource(resourceId) {
    const rows = await database.query(
        `SELECT ${COLUMNS} FROM reservations WHERE "resourceId" = $1 AND "deletedAt" IS NULL ORDER BY "startDate", id`,
        [resourceId]);
    return rows.map(toReservation);
}

// Every occurrence of the resource's reservations that overlaps [from, to), ordered by start. `mine` marks the
// viewer's own bookings; contacts are never included.
async function occurrences(resourceId, fromValue, toValue, user = null) {
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
            mine: isOwner(reservation, user),
        })))
        .sort((a, b) => a.start - b.start || a.reservationId - b.reservationId);
}

// The user's bookings that still have an occurrence from now on, with their resource and next occurrence,
// the soonest first. Booked while logged in, or with the account's email (found by its lookup hash; a booking
// saved before encryption by the plain email).
async function listMine(user, now = new Date()) {
    const rows = await database.query(
        `SELECT ${COLUMNS}, (SELECT title FROM resources WHERE id = "resourceId") AS "resourceTitle" FROM reservations
        WHERE "deletedAt" IS NULL
            AND ("userId" = $1 OR "contactEmailHash" = $2 OR ("contactEmailHash" IS NULL AND "contactEmail" = $3))
            AND "resourceId" IN (SELECT id FROM resources WHERE "deletedAt" IS NULL)`,
        [user.id, lookupHash(user.email), user.email]);
    return rows
        .map(toReservation)
        .map(reservation => ({ reservation, next: expand(reservation, now)[0] }))
        .filter(item => item.next !== undefined)
        .sort((a, b) => a.next.start - b.next.start)
        .map(({ reservation, next }) => ({ ...reservation, nextStart: next.start, nextEnd: next.end }));
}

const WRONG_CONTACT = "A megadott e-mail cím vagy telefonszám nem egyezik a foglaláskor megadottal!";

// The checks of a new or edited reservation, inside the transaction that holds the resource's lock.
// Admins may book outside the booking rules; overlaps are refused for everyone.
async function checkBooking(client, resource, values, { isAdmin, ignoreId = null }) {
    if (!isAdmin && values.contactEmail === "" && values.contactPhone === "") {
        throw new ValidationError("Adj meg e-mail címet vagy telefonszámot, ezzel tudod később módosítani vagy lemondani a foglalást!");
    }
    const newOccurrences = expand(values);
    if (!isAdmin) checkRules(resource, values.allDay, newOccurrences, new Date(), { ignorePast: ignoreId !== null });
    const existing = await client.query(
        `SELECT ${COLUMNS} FROM reservations WHERE "resourceId" = $1 AND "deletedAt" IS NULL`, [resource.id]);
    checkConflicts(newOccurrences, existing.rows.map(toReservation), ignoreId);
}

// Admins, the booking's owner, and whoever gives its contact may open, change or cancel it
const mayChange = (reservation, { isAdmin, contact, user }) =>
    isAdmin || isOwner(reservation, user) || matchesContact(reservation, contact);

// Locks the reservation's resource first (the same order as a new booking), then returns the reservation,
// or null when there is no such reservation. Refused (403) when the caller may not change it.
async function lockReservation(client, id, options) {
    const locked = await client.query(
        `SELECT id FROM resources WHERE id = (SELECT "resourceId" FROM reservations WHERE id = $1) FOR UPDATE`, [id]);
    if (locked.rows.length === 0) return null;
    const rows = await client.query(`SELECT ${COLUMNS} FROM reservations WHERE id = $1 AND "deletedAt" IS NULL`, [id]);
    const reservation = toReservation(rows.rows[0]);
    if (reservation !== null && !mayChange(reservation, options)) throw new HttpError(403, WRONG_CONTACT);
    return reservation;
}

// Returns null when there is no such resource. A logged-in booker is stored as the owner.
async function create(resourceId, body, { isAdmin, user = null }) {
    const values = toReservationValues(body);
    return database.transaction(async client => {
        const resource = await resources.lockForBooking(client, resourceId);
        if (resource === null) return null;
        await checkBooking(client, resource, values, { isAdmin });
        const rows = await client.query(
            `INSERT INTO reservations ("resourceId", title, description, "startDate", "endDate", "allDay", "regularityMeasure",
                "regularityRepeatNumber", "regularityDays", "endsOnType", "endsOnDate", "endsOnOccurrence", "contactEmail", "contactPhone",
                "contactEmailHash", "userId")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING ${COLUMNS}`,
            [resourceId, ...valueList(values), user ? user.id : null]);
        return toReservation(rows.rows[0]);
    });
}

// The stored reservation for its edit form, for those who may change it. Null when there is no such reservation.
async function access(id, options) {
    const rows = await database.query(`SELECT ${COLUMNS} FROM reservations WHERE id = $1 AND "deletedAt" IS NULL`, [id]);
    if (rows.length === 0) return null;
    const reservation = toReservation(rows[0]);
    if (!mayChange(reservation, options)) throw new HttpError(403, WRONG_CONTACT);
    return reservation;
}

// Returns null when there is no such reservation
async function update(id, body, options) {
    const { isAdmin } = options;
    const values = toReservationValues(body);
    return database.transaction(async client => {
        const reservation = await lockReservation(client, id, options);
        if (reservation === null) return null;
        const resource = await resources.lockForBooking(client, reservation.resourceId);
        // The resource was removed: its reservations are gone with it
        if (resource === null) return null;
        await checkBooking(client, resource, values, { isAdmin, ignoreId: id });
        const rows = await client.query(
            `UPDATE reservations SET title = $2, description = $3, "startDate" = $4, "endDate" = $5, "allDay" = $6,
                "regularityMeasure" = $7, "regularityRepeatNumber" = $8, "regularityDays" = $9, "endsOnType" = $10,
                "endsOnDate" = $11, "endsOnOccurrence" = $12, "contactEmail" = $13, "contactPhone" = $14, "contactEmailHash" = $15
            WHERE id = $1 RETURNING ${COLUMNS}`,
            [id, ...valueList(values)]);
        return toReservation(rows.rows[0]);
    });
}

// Soft delete: the row stays, hidden. Returns false when there is no such reservation.
async function remove(id, options) {
    return database.transaction(async client => {
        const reservation = await lockReservation(client, id, options);
        if (reservation === null) return false;
        await client.query(`UPDATE reservations SET "deletedAt" = now() WHERE id = $1`, [id]);
        return true;
    });
}

module.exports = { listByResource, occurrences, listMine, create, access, update, remove, toReservationValues };
