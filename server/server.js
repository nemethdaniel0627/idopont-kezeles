const path = require('path');
const axios = require('axios');
const cors = require('cors');
const express = require('express');
const database = require('./database');
const { Pool, Client } = require('pg');
const app = express();


const PORT = process.env.PORT || 5000;

const buildPath = path.join(__dirname, '..', 'build');
app.use(express.static(buildPath));
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello world");
})

app.get("/services", async (req, res) => {
  const queryResult = await database.select(
    "*",
    "services",
    "INNER JOIN serviceendson " +
    'ON "regularityEndsOnId" = serviceendson.id; ');
  queryResult.forEach(row => {
    row.id = Number(row.id);
  });

  console.log(queryResult);
  res.json({ result: queryResult });
  // const pool = new Pool({
  //   user: 'postgres',
  //   host: 'localhost',
  //   database: 'idopont',
  //   password: 'Dani0234!',
  //   port: 5432,
  // });

  // pool.query(`SELECT * FROM users`, (err, res) => {
  //   console.log(res);
  //   console.log(err);
  //   pool.end();
  // })
})

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
