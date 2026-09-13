CREATE TYPE "public"."badge_status" AS ENUM('pending_verification', 'active', 'expired', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."club_admin_level" AS ENUM('owner', 'editor');--> statement-breakpoint
CREATE TYPE "public"."exam_type" AS ENUM('cat_1', 'cat_2', 'main_exam', 'assignment');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('push', 'in_app', 'both');--> statement-breakpoint
CREATE TYPE "public"."resource_status" AS ENUM('pending', 'approved');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('past_paper', 'notes', 'slides', 'other');--> statement-breakpoint
CREATE TYPE "public"."subscription_subject" AS ENUM('club', 'course', 'cohort');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('student', 'class_rep', 'club_admin', 'esa_admin', 'super_admin');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"badge_number" varchar(20),
	"status" "badge_status" DEFAULT 'pending_verification' NOT NULL,
	"payment_reference" varchar(40) NOT NULL,
	"academic_year" varchar(9),
	"approved_by" integer,
	"approved_at" timestamp with time zone,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "badges_badge_number_unique" UNIQUE("badge_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "club_admins" (
	"user_id" integer NOT NULL,
	"club_id" integer NOT NULL,
	"level" "club_admin_level" DEFAULT 'editor' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "club_admins_user_id_club_id_pk" PRIMARY KEY("user_id","club_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clubs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"slug" varchar(160) NOT NULL,
	"description" text,
	"logo_blob_url" text,
	"category" varchar(80),
	"external_url" text,
	"is_platform_owner" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clubs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cohorts" (
	"id" serial PRIMARY KEY NOT NULL,
	"department_id" integer NOT NULL,
	"entry_year" smallint NOT NULL,
	"label" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"department_id" integer NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(160) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"code" varchar(20) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "departments_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"club_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"location" varchar(200),
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone,
	"cover_image_blob_url" text,
	"created_by" integer,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(40) NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text,
	"link" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "resource_type" NOT NULL,
	"department_id" integer NOT NULL,
	"course_id" integer,
	"academic_year" varchar(9),
	"exam_type" "exam_type",
	"title" varchar(200) NOT NULL,
	"blob_url" text NOT NULL,
	"file_size_bytes" bigint,
	"uploaded_by" integer,
	"status" "resource_status" DEFAULT 'pending' NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"subject_type" "subscription_subject" NOT NULL,
	"subject_id" integer NOT NULL,
	"channel" "notification_channel" DEFAULT 'both' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "timetable_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"cohort_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"day_of_week" smallint NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"venue" varchar(120),
	"lecturer_name" varchar(120),
	"semester_label" varchar(40),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(160) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"photo_blob_url" text,
	"department_id" integer,
	"cohort_id" integer,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"email_verified_at" timestamp with time zone,
	"verification_token" text,
	"verification_token_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "badges" ADD CONSTRAINT "badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "badges" ADD CONSTRAINT "badges_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "club_admins" ADD CONSTRAINT "club_admins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "club_admins" ADD CONSTRAINT "club_admins_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "courses" ADD CONSTRAINT "courses_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications_log" ADD CONSTRAINT "notifications_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resources" ADD CONSTRAINT "resources_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resources" ADD CONSTRAINT "resources_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resources" ADD CONSTRAINT "resources_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cohorts_department_id_entry_year_idx" ON "cohorts" USING btree ("department_id","entry_year");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_user_subject_idx" ON "subscriptions" USING btree ("user_id","subject_type","subject_id");