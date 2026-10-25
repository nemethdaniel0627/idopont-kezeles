# AI.md — a fast start for AI agents

Read this before changing the code. [README.md](README.md) has the architecture and the coding style for people;
this file is the short map, the recipes and the traps. Keep it up to date when you change something it describes.

## In one paragraph

A Hungarian booking and scheduling app. It's a React 17 SPA (Create React App 3.4, MUI 5, react-router 6) in
`src/`, and one Express server in `server/` that serves the built SPA and a JSON API over plain SQL (`pg`) on
PostgreSQL. The server is the source of truth for every rule; the browser repeats a few rules only to explain them
up front. The UI text is Hungarian; code, comments and commits are English.

## Glossary (the UI's words → the code's)

| Hungarian (UI) | Code | Notes |
|---|---|---|
| erőforrás | resource | `resources` table, `server/resources.js` |
| foglalás | reservation / booking | `reservations` table. The **old front-end code calls them "services"** (`Szolgaltatas.jsx`, `serviceDetails`, `fullscreenServices`) |
| alkalom | occurrence | One concrete time of a (possibly repeating) reservation, `server/recurrence.js` |
| egyeztetés | poll | `polls` + `pollAnswers`; the link is `/egyeztetes/:publicKey` |
| idősáv | slot | Id `"<day> <HH:MM>"`: day is `"2026-11-03"` or a Hungarian weekday (`"kedd"`) |
| szabályok | booking rules | `openDays`, `openFrom`/`openTo`, min/max length, `maxDaysAhead` |
| jogosultság | right | `canBook`, `canPoll`, `role` (`admin` / `regular`) |
| felhasználási feltételek / adatkezelési tájékoztató | terms / privacy notice | `legalDocuments`, kinds `terms` / `privacy` |

Weekday names are stored in Hungarian lower case: `hétfő, kedd, szerda, csütörtök, péntek, szombat, vasárnap`.

## Where things are

```
server/server.js        every API route (look here first), sendError(), allowed(req, res, what)
server/<domain>.js      the logic: auth, resources, reservations (+ booking, recurrence), polls (+ pollSlots),
                        users, settings, legal (+ legalDefaults), privacy, mailer
server/idopont.sql      the whole schema (+ sample data after the "Sample data" marker)
server/scripts/*.sql    updates for existing databases (one per schema change)
src/App.jsx             page routes
src/auth/               AuthContext (user), SettingsContext (site switches + `can`), route guards
src/pages/              pages; src/pages/admin/ for /admin/*
src/layouts/FullscreenCalendar.jsx + src/components/WeekView.jsx   the booking calendar
src/components/         dialogs and widgets (booking/, polls/, admin/, legal/)
src/modules/            pure functions with *.test.js next to them
src/scss/               one file per area, all @use-d by styles.scss
```

### API (server/server.js)

| Area | Routes |
|---|---|
| Account | `POST /auth/register` (needs `acceptTerms: true`), `/auth/login`, `/auth/logout`; `GET /auth/me`; `PUT /auth/profile`, `/auth/password`; `POST /auth/password-reset`, `/auth/password-reset/confirm`; `POST /auth/accept-terms`; `GET /auth/my-data`; `DELETE /auth/account` |
| Texts | `GET /legal` (current versions); `GET /legal/:kind`; `PUT /legal/:kind` (admin; `{ body, major }`) |
| Settings | `GET /settings` (public); `PUT /settings` (admin) |
| Resources | `GET /resources`; `POST /resources`, `PUT /resources/:id`, `DELETE /resources/:id`, `GET /resources/:id/removal-preview` (admin) |
| Bookings | `GET /resources/:id/occurrences?from&to`; `POST /resources/:id/reservations`; `GET /reservations/mine`; `POST /reservations/:id/access`; `PUT`/`DELETE /reservations/:id` (owner, admin, or `{ contact }`); `GET /resources/:id/reservations` (admin) |
| Users | `GET /users`; `PUT /users/:id/role`; `PUT /users/:id/permissions` (admin) |
| Polls | `POST /polls`; `GET /polls/mine`; `GET /admin/polls`; `GET /polls/:key`; `POST /polls/:key/my-answer`; `PUT /polls/:key/answer`; `PUT /polls/:key`, `POST /polls/:key/close`, `DELETE /polls/:key` (organizer or admin) |

Every response is `{ result }` or `{ error }`, where `error` is a Hungarian message the UI shows as it is
(`errorMessage()` in `src/modules/api.js`).

### Pages (src/App.jsx)

`/` home and calendars · `/foglalasaim` · `/egyeztetesek`, `/egyeztetesek/uj`, `/egyeztetes/:key`,
`/egyeztetes/:key/attekintes` · `/bejelentkezes`, `/regisztracio`, `/elfelejtett-jelszo`,
`/jelszo-visszaallitas`, `/profil` · `/admin`, `/admin/eroforrasok[/:id]`, `/admin/egyeztetesek`,
`/admin/felhasznalok`, `/admin/jogi-szovegek`

## Rules that live in two places (change both)

| Rule | Server (decides) | Browser (explains) |
|---|---|---|
| Booking rules (closed day, hours, length, days ahead) | `server/booking.js` | `src/modules/bookingRules.js` |
| Who may book or create polls | `server/settings.js` `permissions()` | `src/modules/permissions.js` |
| Poll slots and their labels | `server/pollSlots.js` | `src/modules/pollSlots.js` |
| Site setting defaults | `server/settings.js` `DEFAULTS` | `src/auth/SettingsContext.jsx` `DEFAULTS` |
| Poll slot sizes (15/30/60) | `server/polls.js` `SLOT_SIZES` + the `CHECK` in `idopont.sql` | `src/pages/polls/PollCreate.jsx` buttons |

## Recipes

**A new API endpoint**
1. Write the logic as an exported async function in the domain module. Throw `ValidationError` for bad input and
   `HttpError(status, message)` for other refusals, both with Hungarian messages.
2. Add the route in `server.js`, next to its area:

   ```js
   app.put("/x/:id", auth.requireAdmin, async (req, res) => {
     try {
       res.json({ result: await x.update(...) });
     } catch (err) {
       sendError(res, err, "Hungarian fallback message!");
     }
   })
   ```

   Use `auth.requireUser` or `auth.requireAdmin`, and for booking or poll features also `allowed(req, res, ...)`
   with `booking`, `book`, `polls` or `createPolls`.
3. Test the pure parts in `server/*.test.js` (`node:test`).

**A new database column or table**
1. Edit `server/idopont.sql` between the `-- ----- Schema` and `-- ----- Sample data` markers (add a `DROP TABLE`
   for a new table at the top).
2. Add an idempotent `server/scripts/<name>.sql` (`ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`).
3. If a column belongs on the user object, add it to `USER_COLUMNS` in `server/auth.js`.
4. Mention the script in the PR. Existing databases (local, production) need it before the new code runs.

**A new site-wide switch**
1. Add the key to `DEFAULTS` in `server/settings.js` and in `src/auth/SettingsContext.jsx`.
2. Read it with `settings.get()` on the server and with `useSettings()` in the browser. Admins save it with
   `PUT /settings`.

**A new page**
1. Create the component in `src/pages/…`, using `AdminPage` (or `AuthPage`) for the frame.
2. Add the route in `App.jsx`, wrapped in `UserRoute` or `AdminRoute` if needed, and a nav item in
   `components/Nav.jsx` if it needs one.
3. Put the styles in the matching `src/scss/*.scss`, or a new file `@use`-d in `styles.scss`.

**New personal data** (a field holding a name, email, phone, …): handle it in all of these:
- `server/privacy.js`: `exportData`, `deleteAccount` and, if it should expire, `cleanup`;
- the privacy notice draft in `server/legalDefaults.js`;
- the admin's saved text, which needs a note in the PR asking them to update it.

## Traps

- **Node 17+ builds:** CRA 3 needs `NODE_OPTIONS=--openssl-legacy-provider`. `CI=true npm run build` turns lint
  warnings, such as unused variables, into errors. Build before you call it done.
- **Old syntax:** CRA 3.4's Babel and ESLint are old. Avoid very new syntax; the code base uses `a && a.b`, not
  `a?.b`.
- **MUI theme:** `appTheme` sets `htmlFontSize: 10`, matching `html { font-size: 62.5% }`. A dialog or component
  rendered outside a `ThemeProvider theme={appTheme}` gets the wrong (tiny) text size.
- **Time zone:** the server sets `process.env.TZ = 'Europe/Budapest'`. Repetitions are calculated in local
  calendar days.
- **Soft deletes:** filter with `"deletedAt" IS NULL` in every query that lists resources, reservations or polls.
- **Ownership:** a booking is the user's when `"userId" = user.id` **or** `"contactEmail" = user.email` (see
  `isOwner` in `server/booking.js`). Guests prove it with `{ contact }`, which is rate-limited per IP.
- **Admins skip the booking rules**, but never the overlap check, and are never limited by the site switches or
  rights.
- **Emails:** only `MAIL_TRANSPORT=console` exists. Choosing an email provider is the owner's decision: ask, and
  don't add one on your own.
- **The `$` in replacements:** when editing files with a script, `String.prototype.replace(a, b)` treats `$$`,
  `$&` and `` $` `` in `b` specially. Use `replace(a, () => b)`.
- **Line endings:** files are checked out with CRLF on Windows. Normalise before matching multi-line text in
  scripts.
- **Release tags:** `package.json`'s `version` is bumped by the Release workflow on every merge into `prod`. Don't
  bump it on a feature branch unless you mean a bigger version step.

## Checking your work

| What | Command (from the repository root unless noted) |
|---|---|
| Server unit tests | `cd server && npm test` |
| Front-end unit tests | `CI=true npm test` (on Windows PowerShell: `$env:CI='true'; npm test -- --watchAll=false`) |
| Production build | `CI=true NODE_OPTIONS=--openssl-legacy-provider npm run build` |
| Full app | build, then `cd server && npm start`, and open http://localhost:5000 |

Test against a throwaway database, never one with real data: `idopont.sql` drops every table. Check UI changes in
a browser at desktop width and at 375px (phone).

## Conventions in brief

- **Language:** code, comments and commit messages in English; everything a user sees in Hungarian. Server errors
  end with `!`.
- **Comments:** one or two sentences on *why*, above the function or block.
- **Formatting:** 4-space indent, but match the file. Double quotes in `src/`, single quotes in server modules,
  double quotes in `server.js` routes.
- **CSS classes:** `block_element` (`.week-view_slot`), with modifiers as extra classes (`.closed`, `.mine`).
- **State:** dialog state is `null` (closed) or the data it works on. Shared state goes in a context.
- **Commits:** an imperative summary line, then a short list of what changed. Merge PRs with merge commits.
