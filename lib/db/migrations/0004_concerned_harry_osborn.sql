CREATE TABLE "work_stations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"work_category_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work_stations" ADD CONSTRAINT "work_stations_work_category_id_work_categories_id_fk" FOREIGN KEY ("work_category_id") REFERENCES "public"."work_categories"("id") ON DELETE no action ON UPDATE no action;