CREATE TABLE "work_components" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"work_category_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_component_defects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"work_component_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work_components" ADD CONSTRAINT "work_components_work_category_id_work_categories_id_fk" FOREIGN KEY ("work_category_id") REFERENCES "public"."work_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_component_defects" ADD CONSTRAINT "work_component_defects_work_component_id_work_components_id_fk" FOREIGN KEY ("work_component_id") REFERENCES "public"."work_components"("id") ON DELETE no action ON UPDATE no action;