const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const axios = require('axios');
const cors = require('cors');
const express = require('express');
const services = require('./services');
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
  if (err instanceof services.ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err.stack);
  res.status(500).json({ error: message });
}

app.get("/services", async (req, res) => {
  try {
    res.json({ result: await services.getAll() });
  } catch (err) {
    sendError(res, err, "Could not load services");
  }
})

app.post("/services", async (req, res) => {
  try {
    res.status(201).json({ result: await services.create(req.body) });
  } catch (err) {
    sendError(res, err, "Nem sikerült menteni az erőforrást!");
  }
})

app.put("/services/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = Number.isInteger(id) ? await services.update(id, req.body) : null;
    if (result === null) {
      return res.status(404).json({ error: "Nincs ilyen erőforrás!" });
    }
    res.json({ result });
  } catch (err) {
    sendError(res, err, "Nem sikerült menteni az erőforrást!");
  }
})

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
