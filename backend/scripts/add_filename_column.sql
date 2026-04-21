-- Migration: Add filename column to upload_documents table
-- Date: April 20, 2026
-- Purpose: Store original filenames for document records

BEGIN TRANSACTION;

-- Add filename column to upload_documents table if it doesn't exist
ALTER TABLE upload_documents
ADD COLUMN IF NOT EXISTS filename VARCHAR(255) NOT NULL DEFAULT '';

-- Update existing records to extract filename from filepath (format: claim-id/uuid_filename)
UPDATE upload_documents
SET filename = SUBSTRING(filepath FROM POSITION('_' IN filepath) + 1)
WHERE filename = '' OR filename IS NULL;

-- Make the column non-nullable after populating
ALTER TABLE upload_documents
ALTER COLUMN filename SET NOT NULL,
ALTER COLUMN filename DROP DEFAULT;

COMMIT;
