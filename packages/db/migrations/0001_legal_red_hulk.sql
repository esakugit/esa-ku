ALTER TABLE "users" ADD COLUMN "reg_no" varchar(30);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_reg_no_unique" UNIQUE("reg_no");