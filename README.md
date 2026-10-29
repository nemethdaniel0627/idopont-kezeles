# Időpontfoglaló

A Hungarian web app for booking shared resources (meeting rooms, parking spaces…) and for finding a common time
with others (lettucemeet-like polls).

- **Booking:**
  - month and week calendars per resource, with booking rules (opening days and hours, length, how far ahead);
  - overlaps are refused;
  - repeating bookings;
  - guests book without an account, and change or cancel with the email or phone given at booking.
- **Polls:**
  - the organizer picks days and a time window;
  - respondents mark when they are available on a grid;
  - the common times are calculated;
  - answers can be hidden from the respondents.
- **Accounts:** registration, login, password reset, profile, "Foglalásaim" (my bookings), "Egyeztetéseim" (my polls).
- **Admin:**
  - resources and their rules, all bookings and polls;
  - users and their rights (book, create polls, admin);
  - site-wide switches (booking or polls off, guest booking, new users' rights);
  - the terms and the privacy notice.
- **GDPR:**
  - consent at registration, with versioned texts that users accept again when they change;
  - data export, account deletion;
  - contact details erased automatically after 12 months.

Production: Google Cloud Run + Supabase PostgreSQL, see [DEPLOY.md](DEPLOY.md). Working on the code with an AI agent:
see [AI.md](AI.md).

## Architecture

```
Browser (React SPA)  ──HTTP/JSON, session cookie──▶  Express server  ──SQL (pg)──▶  PostgreSQL
  src/                                                server/                         schema: server/idopont.sql
```

- **One server for everything.** `server/server.js` serves the built React app (`build/`) and the JSON API. In
  development the React dev server (port 3000) proxies API calls to it (port 5000).
- **The server is the source of truth.** Every rule is checked there: booking rules, overlaps, rights, site
  switches. The browser repeats some of them only to explain things before they are tried:
  - `src/modules/bookingRules.js` repeats `server/booking.js`;
  - `src/modules/permissions.js` repeats `server/settings.js`;
  - `src/modules/pollSlots.js` repeats `server/pollSlots.js`.
- **Encrypted personal data:** names, emails, phones, and booking and poll texts are stored encrypted with
  AES-256-GCM (`server/encryption.js`). The key is `DATA_ENCRYPTION_KEY`, kept outside the database, so a leaked
  database login or backup shows none of it. Lookups (login by email, a user's bookings, one answer per name) use
  keyed hashes stored next to the values. Data stored before encryption is encrypted when the server starts
  (`server/encryptStored.js`).
- **Sessions:** a random token in an HttpOnly cookie; only its SHA-256 hash is stored (`sessions` table).
  Passwords are hashed with scrypt.
- **Times:** reservations are stored as timestamps. Repetitions are expanded on the server in Europe/Budapest
  calendar days (`server/recurrence.js`). Polls use wall-clock slots in the poll's time zone.
- **Soft deletes:** resources, reservations and polls get a `deletedAt` instead of being removed. Removing a
  user's personal data (account deletion, the 12-month cleanup) really erases it.
- **Emails:** go through `server/mailer.js`. No provider is chosen yet, so emails are only printed to the server
  log (`MAIL_TRANSPORT=console`).

### Server (`server/`)

| File | What it does |
|---|---|
| `server.js` | Express app: every API route, the error-to-status mapping (`sendError`), permission checks (`allowed`), static files |
| `database.js` | `pg` pool from the `PG*` environment variables; `query()` and `transaction()` |
| `auth.js`, `passwords.js`, `cookies.js`, `limiter.js` | Registration, login, sessions, password reset; scrypt; cookie parsing; failed-attempt limits |
| `resources.js` | Resources and their booking rules |
| `reservations.js`, `booking.js`, `recurrence.js` | Bookings: storing, rule and overlap checks, expanding repetitions into occurrences |
| `polls.js`, `pollSlots.js` | Polls, answers, the slots and the common-time result |
| `users.js`, `settings.js` | Users' rights; site-wide switches and the permission rules |
| `legal.js`, `legalDefaults.js`, `privacy.js` | Terms and privacy notice (versioned); data export, account deletion, cleanup |
| `mailer.js`, `validation.js` | Email sending; input checks with `ValidationError` (400) and `HttpError` |
| `idopont.sql` | The schema and the sample data (local only: it drops every table) |
| `scripts/` | `setup-db.js` (production schema), `make-admin.js`, `create-test-admin.js`, SQL updates for existing databases |

### Front end (`src/`)

| Folder | What it holds |
|---|---|
| `App.jsx`, `index.js` | Routes (react-router v6), resource loading, the providers |
| `auth/` | `AuthContext` (the user), `SettingsContext` (site switches and what the viewer may do), route guards |
| `pages/` | One component per page: `Home`, `MyBookings`, `auth/`, `polls/`, `admin/` |
| `layouts/FullscreenCalendar.jsx` | A resource's calendar: month and week views, the rules panel |
| `components/` | Shared UI: booking dialogs, poll grid, admin editors, the terms' links and dialogs, nav, footer |
| `modules/` | Plain functions (no React), each with Jest tests where it has logic |
| `scss/` | One stylesheet per area, all loaded by `styles.scss` |

## Tech stack

- **Front end:**
  - React 17 with Create React App (react-scripts 3.4);
  - react-router 6;
  - MUI 5 (with the @mui/lab date pickers, date-fns, Hungarian locale);
  - axios and Sass.
- **Server:** Node.js with Express 4 and pg, against PostgreSQL. It has no ORM, just plain SQL with parameters.
- **Tests:**
  - Jest (front end);
  - `node:test` (server);
  - API check scripts against a running server (`pgtest/`, kept outside this repository).
- **Deployment:**
  - a Dockerfile, built by Cloud Build and deployed to Cloud Run;
  - the database on Supabase;
  - releases versioned by a GitHub Action.

## Running it locally

You need Node.js and a PostgreSQL database. On Node 17 or later the React tooling needs
`NODE_OPTIONS=--openssl-legacy-provider`.

```bash
# The server (terminal 1)
cd server
npm install
cp .env.example .env         # then fill in your PostgreSQL connection, and DATA_ENCRYPTION_KEY (npm run make-key)
psql -f idopont.sql           # tables + sample data, in the database from .env (it starts over every time)
npm run create-test-admin     # an admin for local testing (TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD in .env)
npm start                     # http://localhost:5000

# The front end (terminal 2), with live reload
npm install
npm start                     # http://localhost:3000, API calls go to :5000
```

Instead of the dev server you can also build once (`npm run build`), and open the app on the server's port
(http://localhost:5000).

### Scripts

| Where | Command | What it does |
|---|---|---|
| root | `npm start` / `npm run build` / `npm test` | React dev server / production build into `build/` / Jest |
| `server/` | `npm start` / `npm run dev` | The server / with nodemon |
| `server/` | `npm test` | Server unit tests (`node --test`) |
| `server/` | `npm run setup-db` | Creates the tables on an **empty** database, without sample data (refuses otherwise) |
| `server/` | `npm run make-admin -- email` | Makes a registered user an admin |
| `server/` | `npm run make-key` | Prints a new random `DATA_ENCRYPTION_KEY` |

### Configuration (`server/.env`, see `.env.example`)

| Variable | Meaning |
|---|---|
| `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` | The database connection |
| `PGSSLCA` / `PGSSLMODE`, `PGPOOL_MAX` | SSL for a hosted database (Supabase's CA certificate); connections per instance |
| `DATA_ENCRYPTION_KEY` | **Required.** The key of the stored personal data, made with `npm run make-key`. Keep a copy safe: without it the data can't be read |
| `APP_URL` | The public address, used in emailed links |
| `MAIL_TRANSPORT` | How emails are sent; only `console` exists |
| `NODE_ENV=production` | Secure cookies, trusting Google's proxy |
| `PORT` | The server's port (default 5000) |

The root `.env` only passes the version from `package.json` into the build (`REACT_APP_VERSION`), for the
footer.

### Database changes

`server/idopont.sql` is the schema. `setup-db.js` takes its part between the `-- ----- Schema` and
`-- ----- Sample data` markers. For a change:
1. Edit `idopont.sql`.
2. Add an idempotent update script (`server/scripts/*.sql`, e.g. `ALTER TABLE … ADD COLUMN IF NOT EXISTS`) for
   databases that already exist.
3. Run that script on each existing database, including production.

## Coding style

- **Language:** code, comments and commit messages are in English. Everything a user sees is in Hungarian,
  including the server's error messages, which the app shows as they are.
- **Comments** say why, or what is not obvious, in a sentence or two above the function or the block. There is
  no JSDoc, and no comments that repeat the code.
- **Formatting:** 4-space indentation (except the older `server/server.js`, which uses 2). Use double quotes in
  `src/`, single quotes in the server modules. Match the file you are editing.
- **React:**
  - function components with hooks, one page or component per file;
  - a dialog's state is `null` when closed, or the object it works on;
  - shared state goes in a context (`AuthContext`, `SettingsContext`), not prop chains;
  - logic without UI goes into `src/modules/`, with tests;
  - MUI components are themed by `appTheme` (`components/AuthPage.jsx`); wrap dialogs in it, or they render small.
- **Styles:**
  - one SCSS file per area, with class names like `block_element` (e.g. `.poll-grid_cell`) and modifiers as extra
    classes (`.marked`, `.closed`);
  - `1rem` is 10px (`html { font-size: 62.5% }`);
  - phones are `max-width: 600px` (layouts also break at 700px or 900px);
  - touch screens are `(pointer: coarse)`.
- **Server:**
  - a domain module exports plain async functions, and `server.js` routes call them;
  - bad input throws `ValidationError` (400), other refusals throw `HttpError(status)`;
  - SQL uses `$1` parameters and quoted camelCase columns (`"startDate"`), with `database.transaction()` when
    several statements must hold together.
- **Rules live on the server.** When the browser repeats one (see Architecture), change both copies together.
- **Personal data:** a new field that holds personal data must also be handled by `server/privacy.js` (export,
  deletion, cleanup) and described in the privacy notice (`server/legalDefaults.js` and the admin's saved text).

## Workflow

- **Branches:**
  - one branch per feature or fix, from `master`;
  - a pull request into `master`, merged with a merge commit (not squashed, so stacked branches keep working).
- **Commits:** a short imperative summary, then a list of what changed and why.
- **Releases:**
  - merge `master` into `prod`;
  - the GitHub Action `.github/workflows/release.yml` gives the release the next version (`1.0.0`, `1.0.1`, …),
    writes it into `package.json` on both branches, and tags it `vX.Y.Z`;
  - Cloud Build deploys the tag, and the version shows in the footer;
  - for a bigger step, set the version in `package.json` on `master` first (see [DEPLOY.md](DEPLOY.md)).
- **Before a pull request:**
  - `npm test` in `server/`;
  - `CI=true npm test` and `CI=true npm run build` in the root (with `CI=true`, lint warnings fail the build);
  - try the change in the browser, at desktop and phone width.
