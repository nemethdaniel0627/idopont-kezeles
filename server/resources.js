const database = require('./database');
const { toTitle } = require('./validation');

// Removed resources (deletedAt set) are kept in the database but never listed
async function getAll() {
    return database.query(`SELECT id, title FROM resources WHERE "deletedAt" IS NULL ORDER BY id`);
}

async function exists(id) {
    const rows = await database.query(`SELECT 1 FROM resources WHERE id = $1 AND "deletedAt" IS NULL`, [id]);
    return rows.length === 1;
}

async function create(body) {
    const title = toTitle(body.title, "Nincs megadva az erőforrás neve!");
    const rows = await database.query(`INSERT INTO resources (title) VALUES ($1) RETURNING id, title`, [title]);
    return rows[0];
}

// Returns null when there is no such resource
async function update(id, body) {
    const title = toTitle(body.title, "Nincs megadva az erőforrás neve!");
    const rows = await database.query(
        `UPDATE resources SET title = $1 WHERE id = $2 AND "deletedAt" IS NULL RETURNING id, title`, [title, id]);
    return rows.length === 1 ? rows[0] : null;
}

module.exports = { getAll, exists, create, update };
