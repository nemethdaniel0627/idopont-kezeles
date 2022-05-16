const path = require('path');
const axios = require('axios');
const cors = require('cors');
const express = require('express');
const app = express();

const PORT = process.env.PORT || 5000;

const buildPath = path.join(__dirname, '..', 'build');
app.use(express.static(buildPath));
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello world");
})

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
