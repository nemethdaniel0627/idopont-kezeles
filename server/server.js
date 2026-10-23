const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const axios = require('axios');
const cors = require('cors');
const express = require('express');
const database = require('./database');
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
  try {
    // services.* instead of *, so serviceendson.id does not overwrite the service id
    const queryResult = await database.select(
      'services.*, "endsOnType", "endsOnDate", "endsOnOccurrence"',
      "services",
      "INNER JOIN serviceendson " +
      'ON "regularityEndsOnId" = serviceendson.id; ');
    queryResult.forEach(row => {
      row.id = Number(row.id);
    });

    res.json({ result: queryResult });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: "Could not load services" });
  }
})

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
