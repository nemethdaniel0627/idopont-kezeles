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
	
INSERT INTO services 
("startDate", "endDate", "allDay", title, "regularityMeasure", "regularityRepeatNumber", "regularityEndsOnId", "participants", "maxParticipants") 
VALUES(TIMESTAMP '2022-07-01 0:0:0 Europe/Budapest', TIMESTAMP '2022-07-03 0:0:0 Europe/Budapest', true, 'Tárgyaló 1', 'day', 5, 1, 0, 0);

INSERT INTO services 
("startDate", "endDate", "allDay", title, "regularityMeasure", "regularityRepeatNumber", "regularityDays", "regularityEndsOnId", "participants", "maxParticipants") 
VALUES(TIMESTAMP '2022-07-01 8:0:0 Europe/Budapest', TIMESTAMP '2022-07-02 9:0:0 Europe/Budapest', false, 'Tárgyaló 2', 'week', 2, '{hétfő, péntek}', 2, 0, 0);

INSERT INTO services 
("startDate", "endDate", "allDay", title, "regularityMeasure", "regularityRepeatNumber", "regularityEndsOnId", "participants", "maxParticipants") 
VALUES(TIMESTAMP '2022-07-09 0:0:0 Europe/Budapest', TIMESTAMP '2022-07-11 0:0:0 Europe/Budapest', true, 'Tárgyaló 3', 'month', 1, 2, 0, 0);

INSERT INTO services 
("startDate", "endDate", "allDay", title, "regularityMeasure", "regularityRepeatNumber", "regularityEndsOnId", "participants", "maxParticipants") 
VALUES(TIMESTAMP '2022-07-19 0:0:0 Europe/Budapest', TIMESTAMP '2022-07-22 0:0:0 Europe/Budapest', true, 'Tárgyaló 4', 'year', 1, 2, 0, 0);

INSERT INTO serviceendson
("endsOnType", "endsOnDate")
VALUES('onDate', TIMESTAMP '2022-07-13 0:0:0 Europe/Budapest');

INSERT INTO serviceendson
("endsOnType")
VALUES('never');

SELECT
  services.id,
  "startDate",
  "endDate", 
  "allDay", 
  "title", 
  "regularityMeasure", 
  "regularityRepeatNumber", 
  "endsOnType",
  "endsOnDate",
  "endsOnOccurrence",   
  "participants", 
  "maxParticipants",
  "regularityEndsOnId"
FROM services
  INNER JOIN serviceendson
    ON "regularityEndsOnId" = serviceendson.id;
	
	
SELECT * FROM services;
SELECT * FROM serviceendson;


DROP TABLE services;
DROP TABLE serviceendson;