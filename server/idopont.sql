-- Creates the tables with sample data. Running it again starts over from the sample data.
-- The sample reservations are placed relative to the current week, so they are always near today.
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS serviceendson;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS resources;

-- Something that can be reserved: a meeting room, a parking space...
CREATE TABLE resources (
  id INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY,
  "title" TEXT NOT NULL,
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
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Set when the reservation is removed; removed reservations are kept but hidden
  "deletedAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  PRIMARY KEY (id),
  CHECK ("startDate" <= "endDate")
);

CREATE INDEX reservations_resource ON reservations ("resourceId") WHERE "deletedAt" IS NULL;

INSERT INTO resources (title) VALUES ('Tárgyaló 1'), ('Tárgyaló 2'), ('Nagy tárgyaló'), ('Parkolóhely 1');

-- Monday 00:00 of the current week, as the base of the sample dates
CREATE TEMPORARY TABLE base AS SELECT date_trunc('week', now()) AS monday;

INSERT INTO reservations ("resourceId", title, description, "startDate", "endDate")
SELECT 1, 'Csapatmegbeszélés', 'Heti tervezés', monday + interval '2 days 10 hours', monday + interval '2 days 11 hours 30 minutes' FROM base;

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
