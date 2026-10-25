const database = require('./database');
const { hashPassword, verifyPassword, createToken, hashToken } = require('./passwords');
const { parseCookies, serializeCookie } = require('./cookies');
const { ValidationError, HttpError } = require('./validation');

const SESSION_COOKIE = 'session';
const SESSION_DAYS = 30;
const RESET_LINK_MINUTES = 60;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-()/ ]*$/;
const UNIQUE_VIOLATION = '23505';

const USER_COLUMNS = 'id, email, name, phone, role, "canBook", "canPoll"';

// Hashed once, so checking an unknown email takes as long as a wrong password
const dummyHash = hashPassword('nem-letezo-felhasznalo');

// ----- Input checks -----

function toEmail(value) {
    const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (!EMAIL_PATTERN.test(email) || email.length > 254) throw new ValidationError('Hibás e-mail cím!');
    return email;
}

function toPassword(value) {
    if (typeof value !== 'string' || value.length < 8) throw new ValidationError('A jelszó legalább 8 karakter legyen!');
    if (value.length > 200) throw new ValidationError('A jelszó legfeljebb 200 karakter lehet!');
    return value;
}

function toName(value) {
    const name = typeof value === 'string' ? value.trim() : '';
    if (name.length > 100) throw new ValidationError('A név legfeljebb 100 karakter lehet!');
    return name;
}

function toPhone(value) {
    const phone = typeof value === 'string' ? value.trim() : '';
    if (phone.length > 30 || !PHONE_PATTERN.test(phone)) throw new ValidationError('Hibás telefonszám!');
    return phone;
}

// ----- Users -----

async function findByEmail(email) {
    const rows = await database.query(`SELECT ${USER_COLUMNS}, "passwordHash" FROM users WHERE email = $1`, [email]);
    return rows[0] || null;
}

const withoutHash = ({ passwordHash, ...user }) => user;

async function register(body) {
    const email = toEmail(body.email);
    const password = toPassword(body.password);
    const name = toName(body.name);
    const phone = toPhone(body.phone);
    try {
        const rows = await database.query(
            `INSERT INTO users (email, "passwordHash", name, phone) VALUES ($1, $2, $3, $4) RETURNING ${USER_COLUMNS}`,
            [email, await hashPassword(password), name, phone]);
        return rows[0];
    } catch (err) {
        if (err.code === UNIQUE_VIOLATION) throw new ValidationError('Ezzel az e-mail címmel már regisztráltak!');
        throw err;
    }
}

// The user, or an error that does not tell whether the email or the password was wrong
async function login(body) {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const user = await findByEmail(email);
    const valid = await verifyPassword(password, user ? user.passwordHash : await dummyHash);
    if (!user || !valid) throw new HttpError(401, 'Hibás e-mail cím vagy jelszó!');
    return withoutHash(user);
}

async function updateProfile(userId, body) {
    const email = toEmail(body.email);
    const name = toName(body.name);
    const phone = toPhone(body.phone);
    try {
        const rows = await database.query(
            `UPDATE users SET email = $2, name = $3, phone = $4 WHERE id = $1 RETURNING ${USER_COLUMNS}`,
            [userId, email, name, phone]);
        return rows[0];
    } catch (err) {
        if (err.code === UNIQUE_VIOLATION) throw new ValidationError('Ezzel az e-mail címmel már regisztráltak!');
        throw err;
    }
}

// Other logins of the user end, the one making the change stays
async function changePassword(userId, currentSessionToken, body) {
    const rows = await database.query(`SELECT "passwordHash" FROM users WHERE id = $1`, [userId]);
    const current = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    if (rows.length === 0 || !await verifyPassword(current, rows[0].passwordHash)) {
        throw new ValidationError('A jelenlegi jelszó hibás!');
    }
    const passwordHash = await hashPassword(toPassword(body.newPassword));
    await database.transaction(async client => {
        await client.query(`UPDATE users SET "passwordHash" = $2 WHERE id = $1`, [userId, passwordHash]);
        await client.query(`DELETE FROM sessions WHERE "userId" = $1 AND "tokenHash" <> $2`,
            [userId, hashToken(currentSessionToken)]);
    });
}

// ----- Sessions -----

async function createSession(userId) {
    const token = createToken();
    await database.query(`DELETE FROM sessions WHERE "expiresAt" < now()`);
    await database.query(
        `INSERT INTO sessions ("tokenHash", "userId", "expiresAt") VALUES ($1, $2, now() + $3 * interval '1 day')`,
        [hashToken(token), userId, SESSION_DAYS]);
    return token;
}

async function userForSession(token) {
    const rows = await database.query(
        `SELECT ${USER_COLUMNS.split(', ').map(column => `users.${column}`).join(', ')} FROM sessions
        JOIN users ON users.id = sessions."userId"
        WHERE sessions."tokenHash" = $1 AND sessions."expiresAt" > now()`,
        [hashToken(token)]);
    return rows[0] || null;
}

async function deleteSession(token) {
    await database.query(`DELETE FROM sessions WHERE "tokenHash" = $1`, [hashToken(token)]);
}

function setSessionCookie(res, token) {
    res.setHeader('Set-Cookie', serializeCookie(SESSION_COOKIE, token, {
        maxAge: SESSION_DAYS * 24 * 60 * 60,
        secure: process.env.NODE_ENV === 'production',
    }));
}

function clearSessionCookie(res) {
    res.setHeader('Set-Cookie', serializeCookie(SESSION_COOKIE, '', { maxAge: 0, secure: process.env.NODE_ENV === 'production' }));
}

// ----- Password reset -----

// A new reset link token for the email's user, or null when nobody has that email
async function createPasswordReset(emailValue) {
    const email = typeof emailValue === 'string' ? emailValue.trim().toLowerCase() : '';
    const user = await findByEmail(email);
    if (!user) return null;
    const token = createToken();
    await database.transaction(async client => {
        // Only the newest link works
        await client.query(`DELETE FROM "passwordResets" WHERE "userId" = $1 AND "usedAt" IS NULL`, [user.id]);
        await client.query(
            `INSERT INTO "passwordResets" ("tokenHash", "userId", "expiresAt") VALUES ($1, $2, now() + $3 * interval '1 minute')`,
            [hashToken(token), user.id, RESET_LINK_MINUTES]);
    });
    return { user: withoutHash(user), token };
}

// Sets the new password, uses up the link and ends every login of the user
async function confirmPasswordReset(body) {
    const password = toPassword(body.password);
    const passwordHash = await hashPassword(password);
    await database.transaction(async client => {
        const res = await client.query(
            `SELECT "userId" FROM "passwordResets"
            WHERE "tokenHash" = $1 AND "usedAt" IS NULL AND "expiresAt" > now() FOR UPDATE`,
            [hashToken(body.token)]);
        if (res.rows.length === 0) throw new ValidationError('A link érvénytelen vagy lejárt, kérj újat!');
        const userId = res.rows[0].userId;
        await client.query(`UPDATE users SET "passwordHash" = $2 WHERE id = $1`, [userId, passwordHash]);
        await client.query(`UPDATE "passwordResets" SET "usedAt" = now() WHERE "tokenHash" = $1`, [hashToken(body.token)]);
        await client.query(`DELETE FROM sessions WHERE "userId" = $1`, [userId]);
    });
}

// ----- Middleware -----

// Sets req.user (or null) and req.sessionToken from the session cookie
async function loadUser(req, res, next) {
    try {
        const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
        req.sessionToken = token || null;
        req.user = token ? await userForSession(token) : null;
        next();
    } catch (err) {
        next(err);
    }
}

function requireUser(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Ehhez be kell jelentkezned!' });
    next();
}

function requireAdmin(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Ehhez be kell jelentkezned!' });
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Ehhez nincs jogosultságod!' });
    next();
}

module.exports = {
    toEmail, toPassword, toName, toPhone,
    register, login, updateProfile, changePassword,
    createSession, deleteSession, setSessionCookie, clearSessionCookie,
    createPasswordReset, confirmPasswordReset,
    loadUser, requireUser, requireAdmin,
};
