const database = require('./database');
const { ValidationError } = require('./validation');

// The site-wide switches an admin can turn on or off. A missing row means the default.
const DEFAULTS = {
    bookingEnabled: true,   // resource booking: the resources on the home page and their calendars
    pollsEnabled: true,     // common time scheduling (polls)
    guestsCanBook: true,    // booking without logging in
    newUsersCanBook: false, // the rights a newly registered user starts with (admins change them per user)
    newUsersCanPoll: false,
};

async function get() {
    const rows = await database.query(`SELECT "key", "value" FROM settings`);
    const settings = { ...DEFAULTS };
    rows.forEach(row => { if (row.key in DEFAULTS) settings[row.key] = row.value; });
    return settings;
}

// Saves the given switches ({ bookingEnabled: false, ... }); returns every setting
async function update(changes) {
    const entries = Object.entries(changes || {});
    if (entries.length === 0) throw new ValidationError('Nincs mit menteni!');
    entries.forEach(([key, value]) => {
        if (!(key in DEFAULTS)) throw new ValidationError(`Ismeretlen beállítás: ${key}`);
        if (typeof value !== 'boolean') throw new ValidationError('A beállítás értéke igen vagy nem lehet!');
    });
    await database.transaction(async client => {
        for (const [key, value] of entries) {
            await client.query(
                `INSERT INTO settings ("key", "value") VALUES ($1, $2) ON CONFLICT ("key") DO UPDATE SET "value" = $2`,
                [key, value]);
        }
    });
    return get();
}

// What the viewer (a user or null for a guest) may do. Admins may do everything, whatever the switches.
function permissions(settings, user) {
    const admin = Boolean(user && user.role === 'admin');
    return {
        booking: admin || (settings.bookingEnabled && (settings.guestsCanBook || Boolean(user && user.canBook))),
        book: admin || (settings.bookingEnabled && (user ? Boolean(user.canBook) : settings.guestsCanBook)),
        polls: admin || settings.pollsEnabled,
        createPolls: admin || (settings.pollsEnabled && Boolean(user && user.canPoll)),
    };
}

// Why the viewer can't book: the feature is off, guests must log in, or the user has no right yet
function bookingDenied(settings, user) {
    if (!settings.bookingEnabled) return { status: 403, error: 'A foglalás jelenleg nem elérhető.' };
    if (!user) return { status: 401, error: 'A foglaláshoz be kell jelentkezned!' };
    return { status: 403, error: 'Még nincs jogod foglalni – egy admin adhatja meg.' };
}

function pollCreationDenied(settings) {
    if (!settings.pollsEnabled) return { status: 403, error: 'Az időpont-egyeztetés jelenleg nem elérhető.' };
    return { status: 403, error: 'Még nincs jogod egyeztetést létrehozni – egy admin adhatja meg.' };
}

module.exports = { DEFAULTS, get, update, permissions, bookingDenied, pollCreationDenied };
