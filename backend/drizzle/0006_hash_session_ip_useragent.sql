-- Convert ip column from inet to text so it can store SHA-256 hex hashes.
-- Existing plaintext IPs are cast to text (lossless); future inserts will be hashed.
ALTER TABLE "refresh_sessions" ALTER COLUMN "ip" TYPE text USING "ip"::text;
