const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
// Repeating reservations are calculated in this zone's calendar days, wherever the server runs
process.env.TZ = process.env.TZ || 'Europe/Budapest';
const cors = require('cors');
const express = require('express');
const resources = require('./resources');
const reservations = require('./reservations');
const auth = require('./auth');
const mailer = require('./mailer');
const { AttemptLimiter } = require('./limiter');
const { ValidationError, HttpError, toId } = require('./validation');
const app = express();


const PORT = process.env.PORT || 5000;

const buildPath = path.join(__dirname, '..', 'build');
app.use(express.static(buildPath));
app.use(express.json());
app.use(cors());
app.use(auth.loadUser);

app.get("/", (req, res) => {
  res.send("Hello world");
})

// Invalid input is the client's to fix, anything else is logged and only a general message is sent
function sendError(res, err, message) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err.stack);
  res.status(500).json({ error: message });
}

// Against password guessing: failed logins and reset requests per IP and email
const loginAttempts = new AttemptLimiter(10, 15 * 60 * 1000);
const resetRequests = new AttemptLimiter(5, 60 * 60 * 1000);
const TOO_MANY = "Túl sok próbálkozás, kérjük próbáld újra később!";
const attemptKey = (req) => `${req.ip}|${String(req.body.email || '').trim().toLowerCase()}`;

app.post("/auth/register", async (req, res) => {
  try {
    const user = await auth.register(req.body);
    auth.setSessionCookie(res, await auth.createSession(user.id));
    res.status(201).json({ result: user });
  } catch (err) {
    sendError(res, err, "Nem sikerült a regisztráció!");
  }
})

app.post("/auth/login", async (req, res) => {
  const key = attemptKey(req);
  try {
    if (loginAttempts.isLimited(key)) throw new HttpError(429, TOO_MANY);
    let user;
    try {
      user = await auth.login(req.body);
    } catch (err) {
      if (err instanceof HttpError) loginAttempts.record(key);
      throw err;
    }
    loginAttempts.reset(key);
    auth.setSessionCookie(res, await auth.createSession(user.id));
    res.json({ result: user });
  } catch (err) {
    sendError(res, err, "Nem sikerült a bejelentkezés!");
  }
})

app.post("/auth/logout", async (req, res) => {
  try {
    if (req.sessionToken) await auth.deleteSession(req.sessionToken);
    auth.clearSessionCookie(res);
    res.json({ result: null });
  } catch (err) {
    sendError(res, err, "Nem sikerült a kijelentkezés!");
  }
})

// The logged in user, or null
app.get("/auth/me", (req, res) => {
  res.json({ result: req.user });
})

app.put("/auth/profile", auth.requireUser, async (req, res) => {
  try {
    res.json({ result: await auth.updateProfile(req.user.id, req.body) });
  } catch (err) {
    sendError(res, err, "Nem sikerült menteni az adatokat!");
  }
})

app.put("/auth/password", auth.requireUser, async (req, res) => {
  try {
    await auth.changePassword(req.user.id, req.sessionToken, req.body);
    res.json({ result: true });
  } catch (err) {
    sendError(res, err, "Nem sikerült megváltoztatni a jelszót!");
  }
})

// Always answers the same, so it does not tell whether the email is registered
app.post("/auth/password-reset", async (req, res) => {
  const key = attemptKey(req);
  try {
    if (resetRequests.isLimited(key)) throw new HttpError(429, TOO_MANY);
    resetRequests.record(key);
    const reset = await auth.createPasswordReset(req.body.email);
    if (reset) {
      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const link = `${appUrl}/jelszo-visszaallitas?token=${encodeURIComponent(reset.token)}`;
      await mailer.send({
        to: reset.user.email,
        subject: "Jelszó visszaállítása",
        text: [
          `Szia${reset.user.name ? ` ${reset.user.name}` : ""}!`,
          "",
          "Jelszó-visszaállítást kértek a fiókodhoz. Új jelszót ezen a linken adhatsz meg (1 óráig érvényes):",
          link,
          "",
          "Ha nem te kérted, nyugodtan hagyd figyelmen kívül ezt a levelet, a jelszavad nem változik.",
        ].join("\n"),
      });
    }
    res.json({ result: true });
  } catch (err) {
    sendError(res, err, "Nem sikerült elküldeni a levelet!");
  }
})

app.post("/auth/password-reset/confirm", async (req, res) => {
  try {
    await auth.confirmPasswordReset(req.body);
    res.json({ result: true });
  } catch (err) {
    sendError(res, err, "Nem sikerült beállítani az új jelszót!");
  }
})

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

app.post("/resources", auth.requireAdmin, async (req, res) => {
  try {
    res.status(201).json({ result: await resources.create(req.body) });
  } catch (err) {
    sendError(res, err, "Nem sikerült menteni az erőforrást!");
  }
})

app.put("/resources/:id", auth.requireAdmin, async (req, res) => {
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
app.get("/resources/:id/reservations", auth.requireAdmin, async (req, res) => {
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

app.post("/resources/:id/reservations", auth.requireAdmin, async (req, res) => {
  try {
    const id = toId(req.params.id);
    if (id === null || !await resources.exists(id)) return notFound(res, NO_RESOURCE);
    res.status(201).json({ result: await reservations.create(id, req.body) });
  } catch (err) {
    sendError(res, err, "Nem sikerült menteni a foglalást!");
  }
})

app.put("/reservations/:id", auth.requireAdmin, async (req, res) => {
  try {
    const id = toId(req.params.id);
    const result = id === null ? null : await reservations.update(id, req.body);
    if (result === null) return notFound(res, NO_RESERVATION);
    res.json({ result });
  } catch (err) {
    sendError(res, err, "Nem sikerült menteni a foglalást!");
  }
})

// Pages of the app (e.g. /admin, /profil, the password reset link) load the app when opened directly
app.get("*", (req, res, next) => {
  if (!req.accepts("html")) return next();
  res.sendFile(path.join(buildPath, "index.html"));
})

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
