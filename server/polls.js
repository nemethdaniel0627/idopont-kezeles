const database = require('./database');
const { WEEK_DAYS } = require('./recurrence');
const { ValidationError, HttpError, toTitle } = require('./validation');
const { toEmail, toPhone } = require('./auth');
const { createToken, hashToken } = require('./passwords');
const { daysOf, timesOf, slotsOf, computeResults, isClosed, toMinutes } = require('./pollSlots');

const MAX_DATES = 31;
const SLOT_SIZES = [15, 30, 60];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const START_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
// The window may end at midnight
const END_PATTERN = /^(([01]\d|2[0-3]):[0-5]\d|24:00)$/;
const DEFAULT_TIME_ZONE = 'Europe/Budapest';

const COLUMNS = `id, "publicKey", "organizerId", title, description, mode, dates, "weekDays",
    to_char("dayStart", 'HH24:MI') AS "dayStart", to_char("dayEnd", 'HH24:MI') AS "dayEnd", "slotMinutes",
    "meetingMinutes", deadline, "timeZone", "answersVisible", "closedAt", "createdAt"`;
const ANSWER_COLUMNS = `id, name, "userId", "contactEmail", "contactPhone", slots, "createdAt", "updatedAt"`;

const isEmpty = value => value === undefined || value === null || value === '';

function isValidTimeZone(zone) {
    try {
        new Intl.DateTimeFormat('en', { timeZone: zone });
        return true;
    } catch (err) {
        return false;
    }
}

// Today's date ("2026-11-03") in the time zone
const todayIn = (zone, now) => new Intl.DateTimeFormat('en-CA', { timeZone: zone }).format(now);

// A real calendar date in "YYYY-MM-DD" form
function isDate(value) {
    if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function toDeadline(value, now) {
    if (isEmpty(value)) return null;
    const deadline = new Date(value);
    if (isNaN(deadline)) throw new ValidationError('Hibás határidő!');
    if (deadline <= now) throw new ValidationError('A határidő a jövőben legyen!');
    return deadline;
}

function toDescription(value) {
    const description = typeof value === 'string' ? value.trim() : '';
    if (description.length > 1000) throw new ValidationError('A leírás legfeljebb 1000 karakter lehet!');
    return description;
}

function toPollTitle(value) {
    const title = toTitle(value, 'Nincs megadva az egyeztetés neve!');
    if (title.length > 100) throw new ValidationError('A név legfeljebb 100 karakter lehet!');
    return title;
}

// Checks a new poll and returns the values to store
function toPollValues(body, now = new Date()) {
    const timeZone = isEmpty(body.timeZone) ? DEFAULT_TIME_ZONE : body.timeZone;
    if (typeof timeZone !== 'string' || !isValidTimeZone(timeZone)) throw new ValidationError('Hibás időzóna!');

    const mode = body.mode;
    let dates = null;
    let weekDays = null;
    if (mode === 'dates') {
        if (!Array.isArray(body.dates) || !body.dates.every(isDate)) throw new ValidationError('Hibás dátum!');
        dates = [...new Set(body.dates)].sort();
        if (dates.length === 0) throw new ValidationError('Válassz legalább egy napot!');
        if (dates.length > MAX_DATES) throw new ValidationError(`Legfeljebb ${MAX_DATES} nap választható!`);
        if (dates[0] < todayIn(timeZone, now)) throw new ValidationError('Múltbeli nap nem választható!');
    } else if (mode === 'weekdays') {
        weekDays = Array.isArray(body.weekDays) ? WEEK_DAYS.filter(day => body.weekDays.includes(day)) : [];
        if (weekDays.length === 0) throw new ValidationError('Válassz legalább egy napot!');
    } else {
        throw new ValidationError('Hibás egyeztetés típus!');
    }

    const slotMinutes = Number(body.slotMinutes);
    if (!SLOT_SIZES.includes(slotMinutes)) throw new ValidationError('Az idősáv 15, 30 vagy 60 perces lehet!');
    if (typeof body.dayStart !== 'string' || !START_PATTERN.test(body.dayStart)
        || typeof body.dayEnd !== 'string' || !END_PATTERN.test(body.dayEnd)) {
        throw new ValidationError('Hibás napi időablak!');
    }
    const windowMinutes = toMinutes(body.dayEnd) - toMinutes(body.dayStart);
    if (windowMinutes <= 0) throw new ValidationError('A napi időablak kezdete a vége előtt legyen!');
    if (windowMinutes % slotMinutes !== 0) throw new ValidationError(`A napi időablak hossza legyen ${slotMinutes} perc többszöröse!`);

    let meetingMinutes = null;
    if (!isEmpty(body.meetingMinutes)) {
        meetingMinutes = Number(body.meetingMinutes);
        if (!Number.isInteger(meetingMinutes) || meetingMinutes < slotMinutes || meetingMinutes % slotMinutes !== 0) {
            throw new ValidationError(`A megbeszélés hossza legyen ${slotMinutes} perc többszöröse!`);
        }
        if (meetingMinutes > windowMinutes) throw new ValidationError('A megbeszélés nem lehet hosszabb a napi időablaknál!');
    }

    return {
        title: toPollTitle(body.title),
        description: toDescription(body.description),
        mode, dates, weekDays,
        dayStart: body.dayStart,
        dayEnd: body.dayEnd,
        slotMinutes, meetingMinutes,
        deadline: toDeadline(body.deadline, now),
        timeZone,
        answersVisible: body.answersVisible !== false,
    };
}

// "Kiss  Anna " and "kiss anna" are the same respondent
const toNameKey = name => name.trim().replace(/\s+/g, ' ').toLowerCase();

function toAnswerValues(poll, body) {
    const name = toTitle(body.name, 'Add meg a neved!').replace(/\s+/g, ' ');
    if (name.length > 50) throw new ValidationError('A név legfeljebb 50 karakter lehet!');
    if (!Array.isArray(body.slots)) throw new ValidationError('Hibás időpontok!');
    const allSlots = slotsOf(poll);
    const chosen = new Set(body.slots);
    if ([...chosen].some(slot => !allSlots.includes(slot))) throw new ValidationError('Hibás időpont!');
    return {
        name,
        nameKey: toNameKey(name),
        // In the poll's order
        slots: allSlots.filter(slot => chosen.has(slot)),
        contactEmail: typeof body.contactEmail === 'string' && body.contactEmail.trim() !== '' ? toEmail(body.contactEmail) : '',
        contactPhone: toPhone(body.contactPhone),
    };
}

// ----- Database -----

async function create(userId, body) {
    const values = toPollValues(body);
    const rows = await database.query(
        `INSERT INTO polls ("publicKey", "organizerId", title, description, mode, dates, "weekDays", "dayStart", "dayEnd",
            "slotMinutes", "meetingMinutes", deadline, "timeZone", "answersVisible")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING ${COLUMNS}`,
        [createToken(), userId, values.title, values.description, values.mode, values.dates, values.weekDays,
            values.dayStart, values.dayEnd, values.slotMinutes, values.meetingMinutes, values.deadline, values.timeZone,
            values.answersVisible]);
    return rows[0];
}

// The poll behind a link, or null (also for a removed poll)
async function getByKey(key) {
    if (typeof key !== 'string' || key.length > 100) return null;
    const rows = await database.query(`SELECT ${COLUMNS} FROM polls WHERE "publicKey" = $1 AND "deletedAt" IS NULL`, [key]);
    return rows[0] || null;
}

const canManage = (poll, user) => Boolean(user && (user.id === poll.organizerId || user.role === 'admin'));

// What anyone may see of an answer, and what only its owner and the poll's managers may see
const publicAnswer = answer => ({ id: answer.id, name: answer.name, slots: answer.slots });
const fullAnswer = answer => ({ ...publicAnswer(answer), contactEmail: answer.contactEmail, contactPhone: answer.contactPhone });

function publicPoll(poll, organizerName) {
    const { id, organizerId, ...rest } = poll;
    return { ...rest, organizerName };
}

// The poll page's data for this viewer. Answers and the result only when they are visible to everyone,
// or the viewer is the organizer or an admin; contacts only for them.
async function view(poll, user, now = new Date()) {
    const answers = await database.query(
        `SELECT ${ANSWER_COLUMNS} FROM "pollAnswers" WHERE "pollId" = $1 ORDER BY "createdAt", id`, [poll.id]);
    const organizer = await database.query(`SELECT name FROM users WHERE id = $1`, [poll.organizerId]);
    const manage = canManage(poll, user);
    const visible = poll.answersVisible || manage;
    const mine = user ? answers.find(answer => answer.userId === user.id) : undefined;
    return {
        poll: publicPoll(poll, organizer.length ? organizer[0].name : ''),
        days: daysOf(poll),
        times: timesOf(poll),
        closed: isClosed(poll, now),
        canManage: manage,
        isOrganizer: Boolean(user && user.id === poll.organizerId),
        answerCount: answers.length,
        answers: visible ? answers.map(manage ? fullAnswer : publicAnswer) : null,
        results: visible ? computeResults(poll, answers) : null,
        myAnswer: mine ? fullAnswer(mine) : null,
    };
}

// The answer that belongs to the private edit key, or null
async function answerByKey(poll, editKey) {
    if (typeof editKey !== 'string' || editKey === '') return null;
    const rows = await database.query(
        `SELECT ${ANSWER_COLUMNS} FROM "pollAnswers" WHERE "pollId" = $1 AND "editKeyHash" = $2`, [poll.id, hashToken(editKey)]);
    return rows.length ? fullAnswer(rows[0]) : null;
}

const CLOSED = 'Ez az egyeztetés lezárult, már nem lehet válaszolni.';
const NAME_TAKEN = 'Ezzel a névvel már válaszolt valaki!';
const UNIQUE_VIOLATION = '23505';

// Saves an answer: the one with the edit key, else the one with the same name, else a new one. Returns
// { answer, editKey }; the edit key only for a new answer (it is stored only as a hash). An answer found by
// name keeps its name as first written, and an empty contact keeps the stored one, since the person may not see it.
async function saveAnswer(poll, body, user, now = new Date()) {
    if (isClosed(poll, now)) throw new HttpError(409, CLOSED);
    const values = toAnswerValues(poll, body);
    const userId = user ? user.id : null;

    try {
        if (typeof body.editKey === 'string' && body.editKey !== '') {
            const rows = await database.query(
                `UPDATE "pollAnswers" SET name = $3, "nameKey" = $4, slots = $5, "contactEmail" = $6, "contactPhone" = $7,
                    "userId" = COALESCE("userId", $8), "updatedAt" = now()
                WHERE "pollId" = $1 AND "editKeyHash" = $2 RETURNING ${ANSWER_COLUMNS}`,
                [poll.id, hashToken(body.editKey), values.name, values.nameKey, values.slots, values.contactEmail,
                    values.contactPhone, userId]);
            if (rows.length) return { answer: fullAnswer(rows[0]), editKey: null };
            // An unknown key (e.g. from another browser's storage): go on by name
        }

        const editKey = createToken();
        const rows = await database.query(
            `INSERT INTO "pollAnswers" ("pollId", name, "nameKey", "editKeyHash", "userId", "contactEmail", "contactPhone", slots)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT ("pollId", "nameKey") DO UPDATE SET slots = EXCLUDED.slots,
                "contactEmail" = CASE WHEN EXCLUDED."contactEmail" = '' THEN "pollAnswers"."contactEmail" ELSE EXCLUDED."contactEmail" END,
                "contactPhone" = CASE WHEN EXCLUDED."contactPhone" = '' THEN "pollAnswers"."contactPhone" ELSE EXCLUDED."contactPhone" END,
                "userId" = COALESCE("pollAnswers"."userId", EXCLUDED."userId"), "updatedAt" = now()
            RETURNING ${ANSWER_COLUMNS}, (xmax = 0) AS created`,
            [poll.id, values.name, values.nameKey, hashToken(editKey), userId, values.contactEmail, values.contactPhone, values.slots]);
        const row = rows[0];
        // Found by name: the stored contacts stay hidden unless the answer is the logged-in user's own,
        // so typing someone else's name never shows their email or phone
        const own = row.created || (user && row.userId === user.id);
        const answer = own ? fullAnswer(row) : { ...publicAnswer(row), contactEmail: values.contactEmail, contactPhone: values.contactPhone };
        return { answer, editKey: row.created ? editKey : null };
    } catch (err) {
        // Renaming with the edit key to a name someone else already has
        if (err.code === UNIQUE_VIOLATION) throw new ValidationError(NAME_TAKEN);
        throw err;
    }
}

// The organizer (or an admin) may change these, any of them (the others stay as they are); the days and times
// stay, so the answers stay valid
async function update(poll, body, now = new Date()) {
    const has = key => Boolean(body) && Object.prototype.hasOwnProperty.call(body, key);
    if (has('answersVisible') && typeof body.answersVisible !== 'boolean') throw new ValidationError('Hibás láthatóság!');
    const rows = await database.query(
        `UPDATE polls SET title = $2, description = $3, "answersVisible" = $4, deadline = $5 WHERE id = $1 RETURNING ${COLUMNS}`,
        [poll.id,
            has('title') ? toPollTitle(body.title) : poll.title,
            has('description') ? toDescription(body.description) : poll.description,
            has('answersVisible') ? body.answersVisible : poll.answersVisible,
            has('deadline') ? toDeadline(body.deadline, now) : poll.deadline]);
    return rows[0];
}

async function close(poll) {
    const rows = await database.query(
        `UPDATE polls SET "closedAt" = COALESCE("closedAt", now()) WHERE id = $1 RETURNING ${COLUMNS}`, [poll.id]);
    return rows[0];
}

// Soft delete: the poll and its answers stay, hidden
async function remove(poll) {
    await database.query(`UPDATE polls SET "deletedAt" = now() WHERE id = $1`, [poll.id]);
}

// A list item: the poll with its answer count and status
const LIST_COLUMNS = `p."publicKey", p.title, p.mode, p.dates, p."weekDays", p.deadline, p."closedAt", p."createdAt",
    (SELECT count(*)::int FROM "pollAnswers" a WHERE a."pollId" = p.id) AS "answerCount"`;
const withStatus = now => poll => ({ ...poll, closed: isClosed(poll, now) });

async function listByOrganizer(userId, now = new Date()) {
    const rows = await database.query(
        `SELECT ${LIST_COLUMNS} FROM polls p WHERE p."organizerId" = $1 AND p."deletedAt" IS NULL ORDER BY p."createdAt" DESC`, [userId]);
    return rows.map(withStatus(now));
}

async function listAll(now = new Date()) {
    const rows = await database.query(
        `SELECT ${LIST_COLUMNS}, u.email AS "organizerEmail", u.name AS "organizerName"
        FROM polls p JOIN users u ON u.id = p."organizerId" WHERE p."deletedAt" IS NULL ORDER BY p."createdAt" DESC`);
    return rows.map(withStatus(now));
}

module.exports = {
    create, getByKey, canManage, view, answerByKey, saveAnswer, update, close, remove, listByOrganizer, listAll,
    toPollValues, toAnswerValues, toNameKey,
};
