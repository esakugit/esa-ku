ALTER TABLE "events" ADD COLUMN "registration_url" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;