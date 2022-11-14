const { Pool, Client } = require('pg');

class Database {

    async select(rows, table, innerJoins = "", where = "") {
        let result;
        const _pool = new Pool({
            user: 'postgres',
            host: 'localhost',
            database: 'idopont',
            password: 'Dani0234!',
            port: 5432,
        });
        // await _pool.query(`SELECT ${rows} FROM ${table} ${where}`, async (err, res) => {

        //     if (err)
        //         result = err;
        //     else result = res;
        //     _pool.end();

        // })
        await (async () => {
            const client = await _pool.connect()
            try {
                const res = await client.query(`SELECT ${rows} FROM ${table} ${innerJoins} ${where}`)
                result = res.rows;
            } finally {
                // Make sure to release the client before any error handling,
                // just in case the error handling itself throws an error.
                client.release()
            }
        })().catch(err => console.log(err.stack))

        return result;

    }

    getAllItems() {

    }
}

module.exports = new Database();