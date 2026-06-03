ALTER TABLE "users" ADD COLUMN "nfc_key" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_nfc_key_unique" UNIQUE("nfc_key");