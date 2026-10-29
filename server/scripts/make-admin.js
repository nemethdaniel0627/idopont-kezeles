// Makes a registered user an admin. The first admin is made this way, there is no page for it:
//   npm run make-admin -- email@example.com
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const database = require('../database');
const { lookupHash } = require('../encryption');

(async () => {
    const email = String(process.argv[2] || '').trim().toLowerCase();
    if (email === '') {
        console.error('Usage: npm run make-admin -- email@example.com');
        process.exitCode = 1;
        return;
    }
    // By the email's lookup hash (the email itself is stored encrypted), or the plain email when saved before encryption
    const rows = await database.query(
        `UPDATE users SET role = 'admin' WHERE "emailHash" = $1 OR ("emailHash" IS NULL AND email = $2) RETURNING id`,
        [lookupHash(email), email]);
    if (rows.length === 0) {
        console.error(`Nobody is registered with ${email}. Register first, then run this again.`);
        process.exitCode = 1;
    } else {
        console.log(`${email} is now an admin. Reload the app to see the Admin page.`);
    }
})()
    .catch(err => {
        console.error(err.message);
        process.exitCode = 1;
    })
    .finally(() => database.close());
