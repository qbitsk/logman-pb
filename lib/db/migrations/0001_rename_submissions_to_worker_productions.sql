CREATE TABLE "worker_productions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"work_product_id" text NOT NULL,
	"work_station_id" text,
	"units" integer,
	"shift" integer,
	"notes" text,
	"status" "submission_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worker_production_defects" (
	"id" text PRIMARY KEY NOT NULL,
	"worker_production_id" text NOT NULL,
	"work_defect_id" text NOT NULL,
	"units" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "submissions" CASCADE;--> statement-breakpoint
DROP TABLE "work_submission_defects" CASCADE;--> statement-breakpoint
ALTER TABLE "worker_productions" ADD CONSTRAINT "worker_productions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_productions" ADD CONSTRAINT "worker_productions_work_product_id_work_products_id_fk" FOREIGN KEY ("work_product_id") REFERENCES "public"."work_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_productions" ADD CONSTRAINT "worker_productions_work_station_id_work_stations_id_fk" FOREIGN KEY ("work_station_id") REFERENCES "public"."work_stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_production_defects" ADD CONSTRAINT "worker_production_defects_worker_production_id_worker_productions_id_fk" FOREIGN KEY ("worker_production_id") REFERENCES "public"."worker_productions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_production_defects" ADD CONSTRAINT "worker_production_defects_work_defect_id_work_defects_id_fk" FOREIGN KEY ("work_defect_id") REFERENCES "public"."work_defects"("id") ON DELETE no action ON UPDATE no action;