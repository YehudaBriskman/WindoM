ALTER TABLE "oauth_accounts" ADD COLUMN "provider_client_id" text;--> statement-breakpoint
ALTER TABLE "oauth_states" ADD COLUMN "client_id" text;