const { Pool } = require('pg');

// Connection settings come from environment variables (see .env.example)
const _pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
});

// An idle client losing its connection must not crash the server
_pool.on('error', err => console.error(err.stack));

class Database {

    // Errors are passed on to the caller, so it can answer the request with an error status
    async select(rows, table, innerJoins = "", where = "") {
        const res = await _pool.query(`SELECT ${rows} FROM ${table} ${innerJoins} ${where}`);
        return res.rows;
    }

    getAllItems() {

    }
}

module.exports = new Database();
