const database = require('./database');
const { verifyPassword } = require('./passwords');
const { ValidationError } = require('./validation');
const { encrypt, decrypt, decryptRow, lookupHash, ENCRYPTED_COLUMNS } = require('./encryption');

// The user's data rights (GDPR): everything stored about them, deleting the account, and erasing contact
// details that are no longer needed.

// Contacts of a booking or a poll answer are erased this many months after the booking ended or the poll closed
const RETENTION_MONTHS = 12;

// When a reservation's last occurrence ends. A repeating one repeats for at most 6 months from its first date,
// so that is its latest end even when it repeats a number of times.
const LAST_END = `(CASE WHEN "regularityMeasure" = 'never' THEN "endDate"
    ELSE LEAST(COALESCE("endsOnDate", 'infinity'), "startDate" + interval '6 months') + ("endDate" - "startDate") END)`;

// A booking (or a poll answer) is the user's when they made it logged in, or gave their account's email as its
// contact: found by the email's lookup hash, or by the plain email when saved before encryption.
// The parameters are [user.id, lookupHash(user.email), user.email].
const OWN = `("userId" = $1 OR "contactEmailHash" = $2 OR ("contactEmailHash" IS NULL AND "contactEmail" = $3))`;
const OWN_ANSWER = `(a."userId" = $1 OR a."contactEmailHash" = $2 OR (a."contactEmailHash" IS NULL AND a."contactEmail" = $3))`;
const ownParams = user => [user.id, lookupHash(user.email), user.email];

// Everything stored about the user, as one object for them to download
async function exportData(user) {
    const [account] = (await database.query(
        `SELECT name, email, phone, role, "canBook", "canPoll", "createdAt", "termsVersion", "privacyVersion", "termsAcceptedAt"
        FROM users WHERE id = $1`, [user.id])).map(row => decryptRow(row, ENCRYPTED_COLUMNS.users));
    const bookings = (await database.query(
        `SELECT (SELECT title FROM resources WHERE id = r."resourceId") AS resource, title, description, "startDate", "endDate",
            "allDay", "regularityMeasure", "regularityRepeatNumber", "regularityDays", "endsOnType", "endsOnDate",
            "endsOnOccurrence", "contactEmail", "contactPhone", "createdAt", "deletedAt" AS "cancelledAt"
        FROM reservations r WHERE ${OWN} ORDER BY "startDate"`, ownParams(user)))
        .map(row => decryptRow(row, ENCRYPTED_COLUMNS.reservations));
    const polls = (await database.query(
        `SELECT title, description, mode, dates, "weekDays", to_char("dayStart", 'HH24:MI') AS "dayStart",
            to_char("dayEnd", 'HH24:MI') AS "dayEnd", "slotMinutes", deadline, "createdAt", "closedAt", "deletedAt",
            (SELECT count(*)::int FROM "pollAnswers" a WHERE a."pollId" = p.id) AS "answerCount"
        FROM polls p WHERE "organizerId" = $1 ORDER BY "createdAt"`, [user.id])).map(row => decryptRow(row, ENCRYPTED_COLUMNS.polls));
    const pollAnswers = (await database.query(
        `SELECT p.title AS poll, a.name, a."contactEmail", a."contactPhone", a.slots, a."createdAt", a."updatedAt"
        FROM "pollAnswers" a JOIN polls p ON p.id = a."pollId"
        WHERE ${OWN_ANSWER} ORDER BY a."createdAt"`, ownParams(user)))
        .map(row => ({ ...decryptRow(row, ENCRYPTED_COLUMNS.pollAnswers), poll: decrypt(row.poll) }));
    const logins = await database.query(
        `SELECT "createdAt", "expiresAt" FROM sessions WHERE "userId" = $1 AND "expiresAt" > now() ORDER BY "createdAt"`, [user.id]);
    return { exportedAt: new Date().toISOString(), account, bookings, polls, pollAnswers, logins };
}

// Deletes the account after checking the password. Upcoming bookings are cancelled; all bookings and answers
// to others' polls lose the user's link and contacts; the user's own polls are deleted with their answers.
async function deleteAccount(user, password) {
    const [stored] = await database.query(`SELECT "passwordHash" FROM users WHERE id = $1`, [user.id]);
    if (!stored || typeof password !== 'string' || !await verifyPassword(password, stored.passwordHash)) {
        throw new ValidationError('Hibás jelszó!');
    }
    if (user.role === 'admin') {
        const [others] = await database.query(`SELECT count(*)::int AS count FROM users WHERE role = 'admin' AND id <> $1`, [user.id]);
        if (others.count === 0) {
            throw new ValidationError('Te vagy az egyetlen admin: előbb tegyél adminná valaki mást, csak utána törölheted a fiókodat!');
        }
    }
    await database.transaction(async client => {
        await client.query(
            `UPDATE reservations SET "deletedAt" = now() WHERE "deletedAt" IS NULL AND ${OWN} AND ${LAST_END} > now()`,
            ownParams(user));
        // A booking named after the user (the form suggests the name) gets a neutral name. The titles are
        // encrypted, so they are compared here, not in the database.
        const own = await client.query(`SELECT id, title FROM reservations WHERE ${OWN}`, ownParams(user));
        const name = (user.name || '').trim().toLowerCase();
        const namedAfter = own.rows.filter(row => name !== '' && decrypt(row.title).trim().toLowerCase() === name).map(row => row.id);
        if (namedAfter.length) {
            await client.query(`UPDATE reservations SET title = $2 WHERE id = ANY($1)`, [namedAfter, encrypt('Foglalás')]);
        }
        await client.query(
            `UPDATE reservations SET "userId" = NULL, "contactEmail" = '', "contactPhone" = '', "contactEmailHash" = NULL
            WHERE id = ANY($1)`, [own.rows.map(row => row.id)]);
        await client.query(`DELETE FROM polls WHERE "organizerId" = $1`, [user.id]);
        await client.query(
            `UPDATE "pollAnswers" SET "userId" = NULL, "contactEmail" = '', "contactPhone" = '', "contactEmailHash" = NULL
            WHERE ${OWN}`, ownParams(user));
        // The logins and password reset links go with the user
        await client.query(`DELETE FROM users WHERE id = $1`, [user.id]);
    });
}

// Erases the contacts that are no longer needed, and expired logins and reset links. Returns what it erased.
async function cleanup() {
    const reservations = await database.query(
        `UPDATE reservations SET "contactEmail" = '', "contactPhone" = '', "contactEmailHash" = NULL
        WHERE ("contactEmail" <> '' OR "contactPhone" <> '') AND ${LAST_END} < now() - $1 * interval '1 month'
        RETURNING id`, [RETENTION_MONTHS]);
    // A poll is over at the latest of its closing, deadline and last day; an answer is kept at least as long
    // after its last change (for polls of weekdays that never close)
    const answers = await database.query(
        `UPDATE "pollAnswers" a SET "contactEmail" = '', "contactPhone" = '', "contactEmailHash" = NULL FROM polls p
        WHERE p.id = a."pollId" AND (a."contactEmail" <> '' OR a."contactPhone" <> '')
            AND GREATEST(p."closedAt", p.deadline, ((SELECT max(d) FROM unnest(p.dates) AS d)::date + 1)::timestamptz, a."updatedAt")
                < now() - $1 * interval '1 month'
        RETURNING a.id`, [RETENTION_MONTHS]);
    const sessions = await database.query(`DELETE FROM sessions WHERE "expiresAt" < now() RETURNING "userId"`);
    const resets = await database.query(`DELETE FROM "passwordResets" WHERE "expiresAt" < now() - interval '1 day' RETURNING "userId"`);
    return { reservations: reservations.length, pollAnswers: answers.length, sessions: sessions.length, passwordResets: resets.length };
}

module.exports = { RETENTION_MONTHS, exportData, deleteAccount, cleanup };
