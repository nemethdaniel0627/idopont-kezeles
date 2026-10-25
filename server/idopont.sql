-- Creates the tables with sample data. Running it again starts over from the sample data.
-- The sample reservations are placed relative to the current week, so they are always near today.
DROP TABLE IF EXISTS "pollAnswers";
DROP TABLE IF EXISTS polls;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS serviceendson;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS "passwordResets";
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS "legalDocuments";

-- ----- Schema (scripts/setup-db.js creates only this part, on an empty database) -----

-- A registered user. The first admin is made with: npm run make-admin -- email@example.com
CREATE TABLE users (
  id INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY,
  "email" TEXT NOT NULL UNIQUE CHECK ("email" = lower("email")),
  "passwordHash" TEXT NOT NULL,
  "name" TEXT NOT NULL DEFAULT '',
  "phone" TEXT NOT NULL DEFAULT '',
  "role" TEXT NOT NULL DEFAULT 'regular' CHECK ("role" IN ('regular', 'admin')),
  -- May book and create polls; new users may not until an admin allows it. Admins may anyway.
  "canBook" BOOLEAN NOT NULL DEFAULT false,
  "canPoll" BOOLEAN NOT NULL DEFAULT false,
  -- The versions of the terms and the privacy notice the user accepted, and when (see legal.js)
  "termsVersion" INTEGER DEFAULT NULL,
  "privacyVersion" INTEGER DEFAULT NULL,
  "termsAcceptedAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- The site-wide switches (see settings.js); a missing row means the default
CREATE TABLE settings (
  "key" TEXT NOT NULL,
  "value" BOOLEAN NOT NULL,
  PRIMARY KEY ("key")
);

-- The terms ("terms") and the privacy notice ("privacy"). Every saved text is kept; the newest is the current one.
-- The version grows when users have to accept the text again. Without a row the built-in draft is version 1.
CREATE TABLE "legalDocuments" (
  id INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('terms', 'privacy')),
  "version" INTEGER NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- A login. The cookie holds a random token, only its SHA-256 hash is stored.
CREATE TABLE sessions (
  "tokenHash" TEXT NOT NULL,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY ("tokenHash")
);

-- A single-use password reset link, valid for 1 hour. Only the token's hash is stored.
CREATE TABLE "passwordResets" (
  "tokenHash" TEXT NOT NULL,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "usedAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  PRIMARY KEY ("tokenHash")
);

-- A common time scheduling (lettucemeet-like). Created by a registered user, answered by anyone with the link.
-- The days and times are wall-clock times in the poll's time zone.
CREATE TABLE polls (
  id INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY,
  -- The long random string in the poll's link
  "publicKey" TEXT NOT NULL UNIQUE,
  "organizerId" INTEGER NOT NULL REFERENCES users(id),
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  -- "dates": the days in "dates" ("2026-11-03"); "weekdays": the Hungarian day names in "weekDays"
  "mode" TEXT NOT NULL CHECK ("mode" IN ('dates', 'weekdays')),
  "dates" TEXT[] DEFAULT NULL,
  "weekDays" TEXT[] DEFAULT NULL,
  -- The daily time window, divided into slots
  "dayStart" TIME NOT NULL,
  "dayEnd" TIME NOT NULL,
  "slotMinutes" SMALLINT NOT NULL CHECK ("slotMinutes" IN (15, 30, 60)),
  -- Only common times at least this long are a result. NULL: any length.
  "meetingMinutes" SMALLINT DEFAULT NULL,
  -- After the deadline no answers are accepted, like after closing
  "deadline" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  "timeZone" TEXT NOT NULL DEFAULT 'Europe/Budapest',
  -- Whether everyone sees all answers and the result, or only the organizer and admins
  "answersVisible" BOOLEAN NOT NULL DEFAULT true,
  "closedAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "deletedAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  PRIMARY KEY (id)
);

-- One respondent's availability. Typing the same name again edits it; so does the private edit key.
CREATE TABLE "pollAnswers" (
  id INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY,
  "pollId" INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  -- The name trimmed and lower-cased, so "Anna" and " anna " are the same respondent
  "nameKey" TEXT NOT NULL,
  -- SHA-256 of the private edit key; the key itself is given to the respondent once
  "editKeyHash" TEXT NOT NULL,
  "userId" INTEGER DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  "contactEmail" TEXT NOT NULL DEFAULT '',
  "contactPhone" TEXT NOT NULL DEFAULT '',
  -- The available slots, e.g. "2026-11-03 09:30" or "kedd 09:30"
  "slots" TEXT[] NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE ("pollId", "nameKey")
);

-- Something that can be reserved: a meeting room, a parking space...
CREATE TABLE resources (
  id INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY,
  "title" TEXT NOT NULL,
  -- Set by the admin, e.g. [{"label": "Férőhely", "value": "8 fő"}]
  "customFields" JSONB NOT NULL DEFAULT '[]',
  -- Booking rules (enforced for user bookings from step 4). NULL means no limit.
  "minLengthMinutes" SMALLINT DEFAULT NULL,
  "maxLengthMinutes" SMALLINT DEFAULT NULL,
  "openFrom" TIME DEFAULT NULL,
  "openTo" TIME DEFAULT NULL,
  -- Hungarian day names (hétfő ... vasárnap) the resource can be booked on
  "openDays" TEXT[] DEFAULT NULL,
  -- How many days ahead it can be booked
  "maxDaysAhead" SMALLINT DEFAULT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Set when the resource is removed; removed resources are kept but hidden
  "deletedAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  PRIMARY KEY (id)
);

-- A booking of a resource. A repeating reservation repeats for at most 6 months from its first date.
CREATE TABLE reservations (
  id INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY,
  "resourceId" INTEGER NOT NULL REFERENCES resources(id),
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "allDay" BOOLEAN NOT NULL DEFAULT false,
  "regularityMeasure" TEXT NOT NULL DEFAULT 'never'
    CHECK ("regularityMeasure" IN ('never', 'day', 'week', 'month')),
  "regularityRepeatNumber" SMALLINT DEFAULT NULL,
  -- Hungarian day names (hétfő ... vasárnap) for weekly repetition
  "regularityDays" TEXT[] DEFAULT NULL,
  "endsOnType" TEXT DEFAULT NULL CHECK ("endsOnType" IN ('onDate', 'occurrence')),
  "endsOnDate" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  "endsOnOccurrence" SMALLINT DEFAULT NULL,
  -- Only admins see these; used to notify the person if the resource is removed
  "contactEmail" TEXT NOT NULL DEFAULT '',
  "contactPhone" TEXT NOT NULL DEFAULT '',
  -- Who booked it, when they were logged in; they change or cancel it without giving the contact again
  "userId" INTEGER DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Set when the reservation is removed; removed reservations are kept but hidden
  "deletedAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  PRIMARY KEY (id),
  CHECK ("startDate" <= "endDate")
);

CREATE INDEX reservations_resource ON reservations ("resourceId") WHERE "deletedAt" IS NULL;

-- ----- Sample data -----

INSERT INTO resources (title, "customFields", "minLengthMinutes", "maxLengthMinutes", "openFrom", "openTo", "openDays", "maxDaysAhead") VALUES
  ('Tárgyaló 1', '[{"label": "Férőhely", "value": "6 fő"}, {"label": "Emelet", "value": "2."}]',
    30, 240, '08:00', '18:00', '{hétfő, kedd, szerda, csütörtök, péntek}', 60),
  ('Tárgyaló 2', '[{"label": "Férőhely", "value": "4 fő"}, {"label": "Emelet", "value": "2."}]',
    30, 120, '08:00', '18:00', '{hétfő, kedd, szerda, csütörtök, péntek}', 60),
  ('Nagy tárgyaló', '[{"label": "Férőhely", "value": "20 fő"}, {"label": "Helyszín", "value": "Földszint, A szárny"}, {"label": "Felszereltség", "value": "projektor"}]',
    60, NULL, NULL, NULL, NULL, 90),
  ('Parkolóhely 1', '[{"label": "Helyszín", "value": "Mélygarázs, -1"}]',
    NULL, 600, '06:00', '22:00', NULL, 14);

-- Monday 00:00 of the current week, as the base of the sample dates
CREATE TEMPORARY TABLE base AS SELECT date_trunc('week', now()) AS monday;

INSERT INTO reservations ("resourceId", title, description, "startDate", "endDate")
SELECT 1, 'Csapatmegbeszélés', 'Heti tervezés', monday + interval '2 days 10 hours', monday + interval '2 days 11 hours 30 minutes' FROM base;
UPDATE reservations SET "contactEmail" = 'kiss.anna@example.hu', "contactPhone" = '+36 30 111 2222' WHERE title = 'Csapatmegbeszélés';

INSERT INTO reservations ("resourceId", title, description, "startDate", "endDate",
  "regularityMeasure", "regularityRepeatNumber", "regularityDays", "endsOnType", "endsOnDate")
SELECT 1, 'Ügyfélhívás', 'Kéthetente hétfőn és szerdán', monday + interval '14 hours', monday + interval '15 hours',
  'week', 2, '{hétfő, szerda}', 'onDate', monday + interval '3 months' FROM base;

INSERT INTO reservations ("resourceId", title, description, "startDate", "endDate",
  "regularityMeasure", "regularityRepeatNumber", "endsOnType", "endsOnOccurrence")
SELECT 2, 'Reggeli egyeztetés', 'Minden nap reggel, 10 alkalommal', monday + interval '8 hours 30 minutes', monday + interval '9 hours',
  'day', 1, 'occurrence', 10 FROM base;

INSERT INTO reservations ("resourceId", title, description, "startDate", "endDate", "allDay")
SELECT 3, 'Tréning', 'Kétnapos képzés', monday + interval '3 days', monday + interval '4 days', true FROM base;

INSERT INTO reservations ("resourceId", title, description, "startDate", "endDate",
  "regularityMeasure", "regularityRepeatNumber", "endsOnType", "endsOnDate")
SELECT 3, 'Havi összesítő', 'Minden hónapban', monday + interval '1 day 13 hours', monday + interval '1 day 15 hours',
  'month', 1, 'onDate', monday + interval '1 day 6 months' FROM base;

INSERT INTO reservations ("resourceId", title, description, "startDate", "endDate")
SELECT 4, 'Vendég parkolás', 'Szállító érkezik', monday + interval '4 days 9 hours', monday + interval '4 days 12 hours' FROM base;

UPDATE reservations SET "contactEmail" = 'nagy.bela@example.hu' WHERE title IN ('Ügyfélhívás', 'Havi összesítő');
UPDATE reservations SET "contactPhone" = '+36 20 333 4444' WHERE title = 'Vendég parkolás';
