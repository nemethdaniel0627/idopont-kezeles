-- Allows 15-minute poll slots in an existing database (idopont.sql has it for new installs). Safe to run more than once.
ALTER TABLE polls DROP CONSTRAINT IF EXISTS "polls_slotMinutes_check";
ALTER TABLE polls ADD CONSTRAINT "polls_slotMinutes_check" CHECK ("slotMinutes" IN (15, 30, 60));
