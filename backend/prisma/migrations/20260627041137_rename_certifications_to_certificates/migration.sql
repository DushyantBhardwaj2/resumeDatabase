-- Rename Profile.certifications → Profile.certificates to align with domain/frontend naming.
-- Preserves existing data. Safe to re-run (idempotent guards below).

DO $$
BEGIN
  -- Only rename if the old column exists AND the new name does not already exist.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Profile' AND column_name = 'certifications'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Profile' AND column_name = 'certificates'
  ) THEN
    ALTER TABLE "Profile" RENAME COLUMN "certifications" TO "certificates";
    RAISE NOTICE 'Renamed certifications → certificates on Profile';
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Profile' AND column_name = 'certifications'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Profile' AND column_name = 'certificates'
  ) THEN
    RAISE NOTICE 'Column already named certificates — nothing to do';
  ELSE
    RAISE NOTICE 'Neither certifications nor certificates column found on Profile — skipping rename';
  END IF;
END $$;
