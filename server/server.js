const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
// Repeating reservations are calculated in this zone's calendar days, wherever the server runs
process.env.TZ = process.env.TZ || 'Europe/Budapest';
const cors = require('cors');
const express = require('express');
const resources = require('./resources');
const reservations = require('./reservations');
const { ValidationError, toId } = require('./validation');
const app = express();


const PORT = process.env.PORT || 5000;

const buildPath = path.join(__dirname, '..', 'build');
app.use(express.static(buildPath));
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello world");
})

// Invalid input is the client's to fix, anything else is logged and only a general message is sent
function sendError(res, err, message) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err.stack);
  res.status(500).json({ error: message });
}

const notFound = (res, message) => res.status(404).json({ error: message });
const NO_RESOURCE = "Nincs ilyen erőforrás!";
const NO_RESERVATION = "Nincs ilyen foglalás!";

app.get("/resources", async (req, res) => {
  try {
    res.json({ result: await resources.getAll() });
  } catch (err) {
    sendError(res, err, "Nem sikerült betölteni az erőforrásokat!");
  }
})

app.post("/resources", async (req, res) => {
  try {
    res.status(201).json({ result: await resources.create(req.body) });
  } catch (err) {
    sendError(res, err, "Nem sikerült menteni az erőforrást!");
  }
})

app.put("/resources/:id", async (req, res) => {
  try {
    const id = toId(req.params.id);
    const result = id === null ? null : await resources.update(id, req.body);
    if (result === null) return notFound(res, NO_RESOURCE);
    res.json({ result });
  } catch (err) {
    sendError(res, err, "Nem sikerült menteni az erőforrást!");
  }
})

// The reservations as stored, a repeating one as a single item
app.get("/resources/:id/reservations", async (req, res) => {
  try {
    const id = toId(req.params.id);
    if (id === null || !await resources.exists(id)) return notFound(res, NO_RESOURCE);
    res.json({ result: await reservations.listByResource(id) });
  } catch (err) {
    sendError(res, err, "Nem sikerült betölteni a foglalásokat!");
  }
})

// Every occurrence between ?from and ?to, repeating reservations expanded
app.get("/resources/:id/occurrences", async (req, res) => {
  try {
    const id = toId(req.params.id);
    if (id === null || !await resources.exists(id)) return notFound(res, NO_RESOURCE);
    res.json({ result: await reservations.occurrences(id, req.query.from, req.query.to) });
  } catch (err) {
    sendError(res, err, "Nem sikerült betölteni a foglalásokat!");
  }
})

app.post("/resources/:id/reservations", async (req, res) => {
  try {
    const id = toId(req.params.id);
    if (id === null || !await resources.exists(id)) return notFound(res, NO_RESOURCE);
    res.status(201).json({ result: await reservations.create(id, req.body) });
  } catch (err) {
    sendError(res, err, "Nem sikerült menteni a foglalást!");
  }
})

app.put("/reservations/:id", async (req, res) => {
  try {
    const id = toId(req.params.id);
    const result = id === null ? null : await reservations.update(id, req.body);
    if (result === null) return notFound(res, NO_RESERVATION);
    res.json({ result });
  } catch (err) {
    sendError(res, err, "Nem sikerült menteni a foglalást!");
  }
})

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
