const { Pool } = require('pg');

// Connection settings come from environment variables (see .env.example). PGSSLCA is the database's CA
// certificate (PEM text), for a hosted database whose certificate is not signed by a public CA (e.g. Supabase);
// without it PGSSLMODE decides (unset: no SSL, as locally).
const _pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    ssl: process.env.PGSSLCA ? { ca: process.env.PGSSLCA } : undefined,
    // Kept small on a hosted database, where every server instance's connections count against one limit
    max: Number(process.env.PGPOOL_MAX) || 10,
});

// An idle client losing its connection must not crash the server
_pool.on('error', err => console.error(err.stack));

class Database {

    // Errors are passed on to the caller, so it can answer the request with an error status
    async query(text, params = []) {
        const res = await _pool.query(text, params);
        return res.rows;
    }

    // Runs callback(client) in one transaction, rolled back if callback throws
    async transaction(callback) {
        const client = await _pool.connect();
        try {
            await client.query("BEGIN");
            const result = await callback(client);
            await client.query("COMMIT");
            return result;
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    }

    // Ends the connections, for scripts that should exit when done
    async close() {
        await _pool.end();
    }
}

module.exports = new Database();
