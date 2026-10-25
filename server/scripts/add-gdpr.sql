-- Brings an existing database up to the GDPR features (idopont.sql has them for new installs). Safe to run more
-- than once. Users registered before are asked to accept the terms and the privacy notice at their next visit.
ALTER TABLE users ADD COLUMN IF NOT EXISTS "termsVersion" INTEGER DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "privacyVersion" INTEGER DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL;
CREATE TABLE IF NOT EXISTS "legalDocuments" (
  id INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('terms', 'privacy')),
  "version" INTEGER NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);
