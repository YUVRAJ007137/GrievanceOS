-- Add optional file attachment URLs to complaints and responses.

ALTER TABLE complaints
ADD COLUMN IF NOT EXISTS file_url TEXT;

ALTER TABLE complaint_responses
ADD COLUMN IF NOT EXISTS file_url TEXT;
