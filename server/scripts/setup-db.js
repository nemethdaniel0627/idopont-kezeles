// Creates the tables on an empty database, without the sample data: for production (e.g. Supabase).
//   npm run setup-db
// The connection comes from the PG* environment variables or server/.env. It refuses to run when the tables
// already exist, so it never touches real data. (idopont.sql itself starts over with sample data: local only.)
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const database = require('../database');

const SCHEMA_START = '-- ----- Schema';
const SAMPLE_START = '-- ----- Sample data';

(async () => {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'idopont.sql'), 'utf8');
    const start = sql.indexOf(SCHEMA_START);
    const end = sql.indexOf(SAMPLE_START);
    if (start === -1 || end === -1 || end < start) throw new Error('idopont.sql has no schema markers');
    const schema = sql.slice(start, end);

    const existing = await database.query(`SELECT to_regclass('public.users') AS users`);
    if (existing[0].users !== null) {
        console.error(`The tables already exist in ${process.env.PGDATABASE} on ${process.env.PGHOST}; nothing was changed.`);
        process.exitCode = 1;
        return;
    }
    await database.transaction(client => client.query(schema));
    console.log(`Tables created in ${process.env.PGDATABASE} on ${process.env.PGHOST}.`);
    console.log('Next: register in the app, then make yourself an admin with: npm run make-admin -- your@email');
})()
    .catch(err => {
        console.error(err.message);
        process.exitCode = 1;
    })
    .finally(() => database.close());
