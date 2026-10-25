-- Brings an existing database up to the rights and switches (idopont.sql has them for new installs).
-- Users who are already registered keep booking and creating polls; new users need an admin's approval.
-- Safe to run more than once.
ALTER TABLE users ADD COLUMN IF NOT EXISTS "canBook" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ALTER COLUMN "canBook" SET DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "canPoll" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ALTER COLUMN "canPoll" SET DEFAULT false;
CREATE TABLE IF NOT EXISTS settings (
  "key" TEXT NOT NULL,
  "value" BOOLEAN NOT NULL,
  PRIMARY KEY ("key")
);
