-- Prepares an existing database for encrypted personal data (idopont.sql has it for new installs). Safe to run more
-- than once, and before or after deploying the version that encrypts: that version still reads plain values, and
-- encrypts them itself when it starts (encryptStored.js).
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailHash" TEXT DEFAULT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_email_hash ON users ("emailHash");
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS "contactEmailHash" TEXT DEFAULT NULL;
CREATE INDEX IF NOT EXISTS reservations_contact_email ON reservations ("contactEmailHash");
ALTER TABLE "pollAnswers" ADD COLUMN IF NOT EXISTS "contactEmailHash" TEXT DEFAULT NULL;
