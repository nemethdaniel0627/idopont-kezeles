const database = require('./database');
const { ValidationError } = require('./validation');
const { DEFAULT_TEXTS } = require('./legalDefaults');

// The two texts users accept when registering: the terms and the privacy notice. Every saved text is kept,
// so which text a user accepted can be looked up by its version.
const KINDS = ['terms', 'privacy'];
const isKind = kind => KINDS.includes(kind);
const MAX_LENGTH = 50000;

// The current text: the newest saved one, or the built-in draft as version 1
async function current(kind) {
    const rows = await database.query(
        `SELECT version, body, "createdAt" FROM "legalDocuments" WHERE kind = $1 ORDER BY id DESC LIMIT 1`, [kind]);
    return rows.length ? { kind, ...rows[0] } : { kind, version: 1, body: DEFAULT_TEXTS[kind], createdAt: null };
}

// { terms: 2, privacy: 1 }: the versions a user must have accepted
async function versions() {
    const [terms, privacy] = await Promise.all(KINDS.map(current));
    return { terms: terms.version, privacy: privacy.version };
}

// Saves the text. With `major` its version grows, and users must accept it again; without, it only fixes
// the wording of the version they accepted.
async function save(kind, body, major) {
    if (!isKind(kind)) throw new ValidationError('Ismeretlen szöveg!');
    const text = typeof body === 'string' ? body.replace(/\r\n/g, '\n').trim() : '';
    if (text === '') throw new ValidationError('A szöveg nem lehet üres!');
    if (text.length > MAX_LENGTH) throw new ValidationError(`A szöveg legfeljebb ${MAX_LENGTH} karakter lehet!`);
    const now = await current(kind);
    const rows = await database.query(
        `INSERT INTO "legalDocuments" (kind, version, body) VALUES ($1, $2, $3) RETURNING version, body, "createdAt"`,
        [kind, major === true ? now.version + 1 : now.version, text]);
    return { kind, ...rows[0] };
}

// Records that the user accepted the current texts
async function accept(userId) {
    const now = await versions();
    await database.query(
        `UPDATE users SET "termsVersion" = $2, "privacyVersion" = $3, "termsAcceptedAt" = now() WHERE id = $1`,
        [userId, now.terms, now.privacy]);
    return now;
}

module.exports = { KINDS, isKind, current, versions, save, accept };
