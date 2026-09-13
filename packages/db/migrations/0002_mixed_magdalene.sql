CREATE TABLE IF NOT EXISTS "legacy_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(160) NOT NULL,
	"badge_number" varchar(20) NOT NULL,
	"reg_no" varchar(30),
	"notes" text,
	"matched_user_id" integer,
	"matched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "legacy_members_badge_number_unique" UNIQUE("badge_number")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "legacy_members" ADD CONSTRAINT "legacy_members_matched_user_id_users_id_fk" FOREIGN KEY ("matched_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
