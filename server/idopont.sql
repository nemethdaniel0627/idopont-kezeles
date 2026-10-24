-- Creates the tables with sample data. Running it again starts over from the sample data.
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS serviceendson;

CREATE TABLE services (
  id INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY,
  "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "allDay" BOOLEAN NOT NULL,
  "title" TEXT NOT NULL,
  "regularityMeasure" TEXT NOT NULL,
  "regularityRepeatNumber" SMALLINT DEFAULT NULL,
  "regularityDays" TEXT[] DEFAULT NULL,
  "regularityEndsOnId" INTEGER DEFAULT NULL,
  "participants" SMALLINT NOT NULL,
  "maxParticipants" SMALLINT NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE serviceendson (
  id INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY,
  "endsOnType" TEXT NOT NULL,
  "endsOnDate" TIMESTAMP WITH TIME ZONE,
  "endsOnOccurrence" SMALLINT,
  PRIMARY KEY (id)
);

ALTER TABLE services
  ADD CONSTRAINT FK_services_serviceendson_id FOREIGN KEY ("regularityEndsOnId")
    REFERENCES serviceendson(id) ON DELETE CASCADE ON UPDATE NO ACTION;

-- The services below refer to these rows, one row for each service
INSERT INTO serviceendson
("endsOnType", "endsOnDate")
VALUES('onDate', TIMESTAMPTZ '2022-07-13 0:0:0 Europe/Budapest');

INSERT INTO serviceendson ("endsOnType") VALUES('never');
INSERT INTO serviceendson ("endsOnType") VALUES('never');
INSERT INTO serviceendson ("endsOnType") VALUES('never');

INSERT INTO services
("startDate", "endDate", "allDay", title, "regularityMeasure", "regularityRepeatNumber", "regularityEndsOnId", "participants", "maxParticipants")
VALUES(TIMESTAMPTZ '2022-07-01 0:0:0 Europe/Budapest', TIMESTAMPTZ '2022-07-03 0:0:0 Europe/Budapest', true, 'Tárgyaló 1', 'day', 5, 1, 0, 1);

INSERT INTO services
("startDate", "endDate", "allDay", title, "regularityMeasure", "regularityRepeatNumber", "regularityDays", "regularityEndsOnId", "participants", "maxParticipants")
VALUES(TIMESTAMPTZ '2022-07-01 8:0:0 Europe/Budapest', TIMESTAMPTZ '2022-07-02 9:0:0 Europe/Budapest', false, 'Tárgyaló 2', 'week', 2, '{hétfő, péntek}', 2, 0, 1);

INSERT INTO services
("startDate", "endDate", "allDay", title, "regularityMeasure", "regularityRepeatNumber", "regularityEndsOnId", "participants", "maxParticipants")
VALUES(TIMESTAMPTZ '2022-07-09 0:0:0 Europe/Budapest', TIMESTAMPTZ '2022-07-11 0:0:0 Europe/Budapest', true, 'Tárgyaló 3', 'month', 1, 3, 0, 1);

INSERT INTO services
("startDate", "endDate", "allDay", title, "regularityMeasure", "regularityRepeatNumber", "regularityEndsOnId", "participants", "maxParticipants")
VALUES(TIMESTAMPTZ '2022-07-19 0:0:0 Europe/Budapest', TIMESTAMPTZ '2022-07-22 0:0:0 Europe/Budapest', true, 'Tárgyaló 4', 'year', 1, 4, 0, 1);
