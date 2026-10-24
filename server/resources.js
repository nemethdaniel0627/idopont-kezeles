const database = require('./database');
const mailer = require('./mailer');
const { expand, WEEK_DAYS } = require('./recurrence');
const { ValidationError, toTitle } = require('./validation');

const MAX_CUSTOM_FIELDS = 20;
const SMALLINT_MAX = 32767;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const COLUMNS = `id, title, "customFields", "minLengthMinutes", "maxLengthMinutes",
    to_char("openFrom", 'HH24:MI') AS "openFrom", to_char("openTo", 'HH24:MI') AS "openTo", "openDays", "maxDaysAhead"`;

const isEmpty = value => value === undefined || value === null || value === '';

// A list of { label, value }, e.g. capacity or floor
function toCustomFields(value) {
    if (isEmpty(value)) return [];
    if (!Array.isArray(value)) throw new ValidationError('Hibás egyedi mezők!');
    if (value.length > MAX_CUSTOM_FIELDS) throw new ValidationError(`Legfeljebb ${MAX_CUSTOM_FIELDS} egyedi mező adható meg!`);
    return value.map(field => {
        const label = field && typeof field.label === 'string' ? field.label.trim() : '';
        const fieldValue = field && typeof field.value === 'string' ? field.value.trim() : '';
        if (label === '') throw new ValidationError('Minden egyedi mezőnek legyen neve!');
        if (label.length > 50 || fieldValue.length > 200) throw new ValidationError('Túl hosszú egyedi mező!');
        return { label, value: fieldValue };
    });
}

// An optional positive whole number; empty means no limit
function toOptionalLimit(value, message) {
    if (isEmpty(value)) return null;
    const number = Number(value);
    if (!Number.isInteger(number) || number < 1 || number > SMALLINT_MAX) throw new ValidationError(message);
    return number;
}

function toOptionalTime(value, message) {
    if (isEmpty(value)) return null;
    if (typeof value !== 'string' || !TIME_PATTERN.test(value)) throw new ValidationError(message);
    return value;
}

// Booking rules; every one is optional. Enforced for user bookings from step 4.
function toRules(body) {
    const minLengthMinutes = toOptionalLimit(body.minLengthMinutes, 'Hibás legrövidebb foglalási idő!');
    const maxLengthMinutes = toOptionalLimit(body.maxLengthMinutes, 'Hibás leghosszabb foglalási idő!');
    if (minLengthMinutes !== null && maxLengthMinutes !== null && minLengthMinutes > maxLengthMinutes) {
        throw new ValidationError('A legrövidebb foglalás nem lehet hosszabb a leghosszabbnál!');
    }

    const openFrom = toOptionalTime(body.openFrom, 'Hibás nyitási idő!');
    const openTo = toOptionalTime(body.openTo, 'Hibás zárási idő!');
    if ((openFrom === null) !== (openTo === null)) throw new ValidationError('A nyitvatartáshoz nyitási és zárási idő is kell!');
    if (openFrom !== null && openFrom >= openTo) throw new ValidationError('A nyitási idő a zárási idő előtt legyen!');

    let openDays = null;
    if (!isEmpty(body.openDays)) {
        if (!Array.isArray(body.openDays)) throw new ValidationError('Hibás nyitvatartási napok!');
        openDays = WEEK_DAYS.filter(day => body.openDays.includes(day));
        if (openDays.length === 0) throw new ValidationError('Válassz legalább egy nyitvatartási napot!');
        // Every day selected is the same as no day limit
        if (openDays.length === WEEK_DAYS.length) openDays = null;
    }

    const maxDaysAhead = toOptionalLimit(body.maxDaysAhead, 'Hibás előre foglalható napok száma!');
    return { minLengthMinutes, maxLengthMinutes, openFrom, openTo, openDays, maxDaysAhead };
}

function toResourceValues(body) {
    return {
        title: toTitle(body.title, 'Nincs megadva az erőforrás neve!'),
        customFields: toCustomFields(body.customFields),
        ...toRules(body),
    };
}

const valueList = values => [values.title, JSON.stringify(values.customFields), values.minLengthMinutes,
values.maxLengthMinutes, values.openFrom, values.openTo, values.openDays, values.maxDaysAhead];

// Removed resources (deletedAt set) are kept in the database but never listed
async function getAll() {
    return database.query(`SELECT ${COLUMNS} FROM resources WHERE "deletedAt" IS NULL ORDER BY id`);
}

async function exists(id) {
    const rows = await database.query(`SELECT 1 FROM resources WHERE id = $1 AND "deletedAt" IS NULL`, [id]);
    return rows.length === 1;
}

async function create(body) {
    const rows = await database.query(
        `INSERT INTO resources (title, "customFields", "minLengthMinutes", "maxLengthMinutes", "openFrom", "openTo",
            "openDays", "maxDaysAhead") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING ${COLUMNS}`,
        valueList(toResourceValues(body)));
    return rows[0];
}

// Returns null when there is no such resource
async function update(id, body) {
    const rows = await database.query(
        `UPDATE resources SET title = $2, "customFields" = $3, "minLengthMinutes" = $4, "maxLengthMinutes" = $5,
            "openFrom" = $6, "openTo" = $7, "openDays" = $8, "maxDaysAhead" = $9
        WHERE id = $1 AND "deletedAt" IS NULL RETURNING ${COLUMNS}`,
        [id, ...valueList(toResourceValues(body))]);
    return rows.length === 1 ? rows[0] : null;
}

// The reservations that still have an occurrence from now on, grouped by contact email
async function upcomingReservations(resourceId) {
    const rows = await database.query(
        `SELECT id, title, "startDate", "endDate", "allDay", "regularityMeasure", "regularityRepeatNumber",
            "regularityDays", "endsOnType", "endsOnDate", "endsOnOccurrence", "contactEmail"
        FROM reservations WHERE "resourceId" = $1 AND "deletedAt" IS NULL`, [resourceId]);
    const now = new Date();
    const upcoming = rows.filter(reservation => expand(reservation, now).length > 0);
    const byEmail = new Map();
    upcoming.forEach(reservation => {
        const email = reservation.contactEmail.trim().toLowerCase();
        if (email === '') return;
        byEmail.set(email, [...(byEmail.get(email) || []), reservation.title]);
    });
    return { count: upcoming.length, byEmail };
}

// What removing the resource would affect; null when there is no such resource
async function removalPreview(id) {
    if (!await exists(id)) return null;
    const { count, byEmail } = await upcomingReservations(id);
    return { upcomingReservations: count, notifiable: byEmail.size };
}

// Soft delete: the resource and its reservations stay in the database, hidden. With notify, everyone with an
// upcoming reservation and a contact email gets an email. Returns { notified }, or null when there is no such resource.
async function remove(id, notify) {
    const rows = await database.query(`SELECT title FROM resources WHERE id = $1 AND "deletedAt" IS NULL`, [id]);
    if (rows.length === 0) return null;
    const title = rows[0].title;
    const { byEmail } = notify ? await upcomingReservations(id) : { byEmail: new Map() };

    await database.query(`UPDATE resources SET "deletedAt" = now() WHERE id = $1`, [id]);

    for (const [email, titles] of byEmail) {
        await mailer.send({
            to: email,
            subject: `Megszűnt erőforrás: ${title}`,
            text: [
                'Kedves Foglaló!',
                '',
                `A(z) „${title}” erőforrás megszűnt, ezért az alábbi foglalásaidat nem tudjuk megtartani:`,
                ...titles.map(reservationTitle => `- ${reservationTitle}`),
                '',
                'Kérjük, válassz másik időpontot vagy erőforrást. Elnézést a kellemetlenségért!',
            ].join('\n'),
        });
    }
    return { notified: byEmail.size };
}

module.exports = { getAll, exists, create, update, removalPreview, remove, toCustomFields, toRules };
