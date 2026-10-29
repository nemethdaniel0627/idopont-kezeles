const database = require('./database');
const { ValidationError } = require('./validation');
const { decryptRow, ENCRYPTED_COLUMNS } = require('./encryption');

const ROLES = ['regular', 'admin'];

const COLUMNS = 'id, email, name, phone, role, "canBook", "canPoll", "createdAt"';
const toUser = row => (row ? decryptRow(row, ENCRYPTED_COLUMNS.users) : null);

async function getAll() {
    const rows = await database.query(`SELECT ${COLUMNS} FROM users ORDER BY "createdAt", id`);
    return rows.map(toUser);
}

// Makes the user an admin or a regular user. An admin cannot take their own admin right away, so there is
// always at least one admin. Returns null when there is no such user.
async function setRole(currentUserId, userId, role) {
    if (!ROLES.includes(role)) throw new ValidationError('Hibás jogosultság!');
    if (userId === currentUserId && role !== 'admin') throw new ValidationError('A saját admin jogodat nem veheted el!');
    const rows = await database.query(
        `UPDATE users SET role = $2 WHERE id = $1 RETURNING ${COLUMNS}`, [userId, role]);
    return toUser(rows[0]);
}

// Allows or forbids booking and creating polls: { canBook, canPoll }, either or both.
// Returns null when there is no such user.
async function setPermissions(userId, changes) {
    const columns = ['canBook', 'canPoll'].filter(key => changes && key in changes);
    if (columns.length === 0) throw new ValidationError('Nincs mit menteni!');
    if (columns.some(key => typeof changes[key] !== 'boolean')) throw new ValidationError('Hibás jogosultság!');
    const rows = await database.query(
        `UPDATE users SET ${columns.map((key, i) => `"${key}" = $${i + 2}`).join(', ')} WHERE id = $1 RETURNING ${COLUMNS}`,
        [userId, ...columns.map(key => changes[key])]);
    return toUser(rows[0]);
}

module.exports = { getAll, setRole, setPermissions };
