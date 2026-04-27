ALTER TABLE "refresh_sessions" ALTER COLUMN "ip" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "email_tokens" ADD COLUMN "token_hash" text;--> statement-breakpoint
ALTER TABLE "email_tokens" ADD COLUMN "token_lookup" text;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "email_tokens_lookup_idx" ON "email_tokens" USING btree ("token_lookup");