const database = require('./database');

const REGULARITY_MEASURES = ["never", "day", "week", "month", "year"];
const ENDS_ON_TYPES = ["never", "onDate", "occurrence"];
const WEEK_DAYS = ["hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat", "vasárnap"];
const SMALLINT_MAX = 32767;

// A service row with its serviceendson columns: the shape the calendar works with
const SELECT_SERVICES = `
    SELECT services.*, "endsOnType", "endsOnDate", "endsOnOccurrence"
    FROM services
    LEFT JOIN serviceendson ON "regularityEndsOnId" = serviceendson.id`;

// A problem with the request itself, its message is shown to the user
class ValidationError extends Error { }

function toPositiveSmallint(value, message) {
    const number = Number(value);
    if (!Number.isInteger(number) || number < 1 || number > SMALLINT_MAX) {
        throw new ValidationError(message);
    }
    return number;
}

function toDate(value, message) {
    const date = new Date(value);
    if (value === null || value === undefined || isNaN(date)) {
        throw new ValidationError(message);
    }
    return date;
}

// Checks a request body and returns the values to store
function toServiceValues(body) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (title === "") throw new ValidationError("Nincs megadva erőforrás cím!");

    const startDate = toDate(body.startDate, "Hibás kezdő időpont!");
    const endDate = toDate(body.endDate, "Hibás záró időpont!");
    if (startDate > endDate) throw new ValidationError("A kezdő időpont nem lehet a záró időpont után!");

    const regularityMeasure = body.regularityMeasure || "never";
    if (!REGULARITY_MEASURES.includes(regularityMeasure)) throw new ValidationError("Hibás ismétlődés!");
    const repeats = regularityMeasure !== "never";

    const regularityDays = regularityMeasure === "week" && Array.isArray(body.regularityDays)
        ? WEEK_DAYS.filter(day => body.regularityDays.includes(day))
        : null;
    if (regularityMeasure === "week" && regularityDays.length === 0) {
        throw new ValidationError("Válassz legalább egy napot!");
    }

    const endsOnType = repeats ? body.endsOnType || "never" : "never";
    if (!ENDS_ON_TYPES.includes(endsOnType)) throw new ValidationError("Hibás ismétlődés vége!");

    return {
        title,
        startDate,
        endDate,
        allDay: body.allDay === true,
        regularityMeasure,
        regularityRepeatNumber: repeats ? toPositiveSmallint(body.regularityRepeatNumber, "Hibás ismétlődési szám!") : null,
        regularityDays,
        endsOnType,
        endsOnDate: endsOnType === "onDate" ? toDate(body.endsOnDate, "Hibás ismétlődés vége dátum!") : null,
        endsOnOccurrence: endsOnType === "occurrence" ? toPositiveSmallint(body.endsOnOccurrence, "Hibás előfordulás szám!") : null,
        maxParticipants: toPositiveSmallint(body.maxParticipants, "A jelentkezők száma legalább 1 legyen!")
    };
}

function toResult(row) {
    row.id = Number(row.id);
    return row;
}

async function insertEndsOn(client, values) {
    const res = await client.query(
        `INSERT INTO serviceendson ("endsOnType", "endsOnDate", "endsOnOccurrence")
        VALUES ($1, $2, $3) RETURNING id`,
        [values.endsOnType, values.endsOnDate, values.endsOnOccurrence]);
    return res.rows[0].id;
}

async function selectService(client, id) {
    const res = await client.query(`${SELECT_SERVICES} WHERE services.id = $1`, [id]);
    return res.rows.length === 0 ? null : toResult(res.rows[0]);
}

async function getAll() {
    const rows = await database.query(`${SELECT_SERVICES} ORDER BY services.id`);
    return rows.map(toResult);
}

async function create(body) {
    const values = toServiceValues(body);
    return database.transaction(async client => {
        const endsOnId = await insertEndsOn(client, values);
        const res = await client.query(
            `INSERT INTO services ("startDate", "endDate", "allDay", title, "regularityMeasure", "regularityRepeatNumber",
                "regularityDays", "regularityEndsOnId", participants, "maxParticipants")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9) RETURNING id`,
            [values.startDate, values.endDate, values.allDay, values.title, values.regularityMeasure,
            values.regularityRepeatNumber, values.regularityDays, endsOnId, values.maxParticipants]);
        return selectService(client, res.rows[0].id);
    });
}

// Returns null when there is no service with this id
async function update(id, body) {
    const values = toServiceValues(body);
    return database.transaction(async client => {
        const existing = await client.query(
            `SELECT "regularityEndsOnId" FROM services WHERE id = $1 FOR UPDATE`, [id]);
        if (existing.rows.length === 0) return null;
        const oldEndsOnId = existing.rows[0].regularityEndsOnId;

        // A new serviceendson row, because the old one can be shared with other services
        const endsOnId = await insertEndsOn(client, values);
        await client.query(
            `UPDATE services SET "startDate" = $1, "endDate" = $2, "allDay" = $3, title = $4, "regularityMeasure" = $5,
                "regularityRepeatNumber" = $6, "regularityDays" = $7, "regularityEndsOnId" = $8, "maxParticipants" = $9
            WHERE id = $10`,
            [values.startDate, values.endDate, values.allDay, values.title, values.regularityMeasure,
            values.regularityRepeatNumber, values.regularityDays, endsOnId, values.maxParticipants, id]);

        // Deleting a serviceendson row deletes its services too, so only remove it once nothing uses it
        if (oldEndsOnId !== null) {
            await client.query(
                `DELETE FROM serviceendson WHERE id = $1
                AND NOT EXISTS (SELECT 1 FROM services WHERE "regularityEndsOnId" = $1)`, [oldEndsOnId]);
        }
        return selectService(client, id);
    });
}

module.exports = { getAll, create, update, ValidationError };
