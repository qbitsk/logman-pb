TRUNCATE "submissions";--> statement-breakpoint
CREATE TYPE "public"."work_category_type" AS ENUM('assembly', 'other');--> statement-breakpoint
CREATE TABLE "work_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "work_category_type",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "work_category_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_work_category_id_work_categories_id_fk" FOREIGN KEY ("work_category_id") REFERENCES "public"."work_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" DROP COLUMN "category";