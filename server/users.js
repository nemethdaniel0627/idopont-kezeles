const database = require('./database');
const { ValidationError } = require('./validation');

const ROLES = ['regular', 'admin'];

async function getAll() {
    return database.query(`SELECT id, email, name, phone, role, "createdAt" FROM users ORDER BY "createdAt", id`);
}

// Makes the user an admin or a regular user. An admin cannot take their own admin right away, so there is
// always at least one admin. Returns null when there is no such user.
async function setRole(currentUserId, userId, role) {
    if (!ROLES.includes(role)) throw new ValidationError('Hibás jogosultság!');
    if (userId === currentUserId && role !== 'admin') throw new ValidationError('A saját admin jogodat nem veheted el!');
    const rows = await database.query(
        `UPDATE users SET role = $2 WHERE id = $1 RETURNING id, email, name, phone, role, "createdAt"`, [userId, role]);
    return rows[0] || null;
}

module.exports = { getAll, setRole };
