// Creates an admin user for local testing, or resets it if it is already there (password, admin right):
//   npm run create-test-admin
// The email and password come from TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD in .env (see .env.example).
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const database = require('../database');
const { toEmail, toPassword } = require('../auth');
const { hashPassword } = require('../passwords');

const DEFAULT_EMAIL = 'admin@example.hu';
const DEFAULT_PASSWORD = 'admin1234';

(async () => {
    if (process.env.NODE_ENV === 'production') {
        console.error('This makes a user with a known password, so it does not run with NODE_ENV=production.');
        process.exitCode = 1;
        return;
    }
    const email = toEmail(process.env.TEST_ADMIN_EMAIL || DEFAULT_EMAIL);
    const password = toPassword(process.env.TEST_ADMIN_PASSWORD || DEFAULT_PASSWORD);
    const rows = await database.query(
        `INSERT INTO users (email, "passwordHash", name, role) VALUES ($1, $2, 'Teszt Admin', 'admin')
         ON CONFLICT (email) DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", role = 'admin'
         RETURNING email, (xmax = 0) AS created`,
        [email, await hashPassword(password)]);
    const { email: savedEmail, created } = rows[0];
    console.log(created
        ? `Created the test admin ${savedEmail}. Log in with the password from TEST_ADMIN_PASSWORD (.env.example).`
        : `${savedEmail} was already there: its password is reset and it is an admin.`);
})()
    .catch(err => {
        console.error(err.message);
        process.exitCode = 1;
    })
    .finally(() => database.close());
