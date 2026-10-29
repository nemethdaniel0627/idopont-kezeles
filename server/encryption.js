const crypto = require('crypto');

// Personal data is stored encrypted (AES-256-GCM), so the database alone (a leaked login or backup) shows none of it.
// The key is DATA_ENCRYPTION_KEY: 32 random bytes in base64, kept outside the database (Secret Manager, .env).
// Losing it makes the stored personal data unreadable, so keep a copy somewhere safe.
//
// Stored form: "enc:v1:<iv>:<tag>:<ciphertext>", all base64. A value without the prefix is plain text: data saved
// before encryption, which reads as it is until the server encrypts it (encryptStored.js).
// For looking a value up (login by email, the owner of a booking, one answer per name) a keyed hash is stored next
// to it: the same input always gives the same hash, but the hash can't be turned back into the input.

const PREFIX = 'enc:v1:';
let keys = null;

// The encryption and hash keys, both derived from DATA_ENCRYPTION_KEY
function getKeys() {
    if (keys) return keys;
    const master = Buffer.from(process.env.DATA_ENCRYPTION_KEY || '', 'base64');
    if (master.length !== 32) {
        throw new Error('DATA_ENCRYPTION_KEY must be 32 bytes in base64. Make one with: npm run make-key');
    }
    keys = {
        cipher: Buffer.from(crypto.hkdfSync('sha256', master, Buffer.alloc(0), 'idopont personal data', 32)),
        index: Buffer.from(crypto.hkdfSync('sha256', master, Buffer.alloc(0), 'idopont lookup index', 32)),
    };
    return keys;
}

const isEncrypted = value => typeof value === 'string' && value.startsWith(PREFIX);

// An empty value stays empty, so "is there a contact?" can still be asked of the database
function encrypt(value) {
    if (value === null || value === undefined || value === '') return value === undefined ? '' : value;
    if (isEncrypted(value)) return value;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', getKeys().cipher, iv);
    const data = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
    return `${PREFIX}${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${data.toString('base64')}`;
}

function decrypt(value) {
    if (!isEncrypted(value)) return value;
    const [iv, tag, data] = value.slice(PREFIX.length).split(':').map(part => Buffer.from(part, 'base64'));
    const decipher = crypto.createDecipheriv('aes-256-gcm', getKeys().cipher, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

// The lookup hash of a value, case and surrounding spaces ignored; null for an empty value
function lookupHash(value) {
    const normalized = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').toLowerCase() : '';
    if (normalized === '') return null;
    return crypto.createHmac('sha256', getKeys().index).update(normalized).digest('base64');
}

// A copy of the row with the given columns decrypted
function decryptRow(row, columns) {
    if (!row) return row;
    const copy = { ...row };
    columns.forEach(column => { if (column in copy) copy[column] = decrypt(copy[column]); });
    return copy;
}

// The personal-data columns of each table (encryptStored.js encrypts these)
const ENCRYPTED_COLUMNS = {
    users: ['email', 'name', 'phone'],
    reservations: ['title', 'description', 'contactEmail', 'contactPhone'],
    polls: ['title', 'description'],
    pollAnswers: ['name', 'contactEmail', 'contactPhone'],
};

// Throws at start when the key is missing or wrong, instead of at the first request
const checkKey = () => { getKeys(); };

module.exports = { encrypt, decrypt, decryptRow, lookupHash, isEncrypted, checkKey, ENCRYPTED_COLUMNS };
