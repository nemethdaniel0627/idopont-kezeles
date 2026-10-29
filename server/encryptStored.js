const database = require('./database');
const { encrypt, decrypt, lookupHash, isEncrypted, ENCRYPTED_COLUMNS } = require('./encryption');

// Encrypts the personal data saved before encryption (plain text, e.g. the sample data or a database from an
// older version) and fills in the lookup hashes. Runs when the server starts. Encrypted values are left as they
// are, so running it again changes nothing. Returns how many rows it changed per table.

const isPlain = value => typeof value === 'string' && value !== '' && !isEncrypted(value);

// The lookup hash columns of each table, and the column each is the hash of
const HASHES = {
    users: { emailHash: 'email' },
    reservations: { contactEmailHash: 'contactEmail' },
    polls: {},
    pollAnswers: { nameKey: 'name', contactEmailHash: 'contactEmail' },
};

async function encryptTable(client, table, columns, hashes) {
    const hashColumns = Object.keys(hashes);
    const rows = await client.query(`SELECT id, ${[...columns, ...hashColumns].map(c => `"${c}"`).join(', ')} FROM "${table}"`);
    let changed = 0;
    for (const row of rows.rows) {
        const hashesNow = Object.fromEntries(hashColumns.map(c => [c, lookupHash(decrypt(row[hashes[c]]))]));
        const needed = columns.some(c => isPlain(row[c])) || hashColumns.some(c => row[c] !== hashesNow[c]);
        if (!needed) continue;
        const values = [...columns.map(c => encrypt(row[c])), ...hashColumns.map(c => hashesNow[c])];
        const set = [...columns, ...hashColumns].map((c, i) => `"${c}" = $${i + 2}`).join(', ');
        await client.query(`UPDATE "${table}" SET ${set} WHERE id = $1`, [row.id, ...values]);
        changed++;
    }
    return changed;
}

async function encryptStored() {
    return database.transaction(async client => {
        const changed = {};
        for (const [table, columns] of Object.entries(ENCRYPTED_COLUMNS)) {
            changed[table] = await encryptTable(client, table, columns, HASHES[table]);
        }
        return changed;
    });
}

module.exports = { encryptStored };
