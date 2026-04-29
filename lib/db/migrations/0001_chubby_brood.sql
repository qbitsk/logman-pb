CREATE TABLE "work_component_defects" (
	"id" text PRIMARY KEY NOT NULL,
	"submission_id" text NOT NULL,
	"work_component_id" text NOT NULL,
	"work_component_defect_category_id" text NOT NULL,
	"units" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work_component_defects" ADD CONSTRAINT "work_component_defects_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_component_defects" ADD CONSTRAINT "work_component_defects_work_component_id_work_components_id_fk" FOREIGN KEY ("work_component_id") REFERENCES "public"."work_components"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_component_defects" ADD CONSTRAINT "work_component_defects_work_component_defect_category_id_work_component_defect_categories_id_fk" FOREIGN KEY ("work_component_defect_category_id") REFERENCES "public"."work_component_defect_categories"("id") ON DELETE no action ON UPDATE no action;