CREATE TYPE "public"."category_type" AS ENUM('product', 'defect');--> statement-breakpoint
CREATE TYPE "public"."work_defect_type" AS ENUM('unit', 'component');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('draft', 'submitted', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "category_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_products" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_stations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"work_product_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_components" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"work_product_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_defects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "work_defect_type" NOT NULL,
	"work_product_id" text NOT NULL,
	"work_component_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_products" ADD CONSTRAINT "work_products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_stations" ADD CONSTRAINT "work_stations_work_product_id_work_products_id_fk" FOREIGN KEY ("work_product_id") REFERENCES "public"."work_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_components" ADD CONSTRAINT "work_components_work_product_id_work_products_id_fk" FOREIGN KEY ("work_product_id") REFERENCES "public"."work_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_defects" ADD CONSTRAINT "work_defects_work_product_id_work_products_id_fk" FOREIGN KEY ("work_product_id") REFERENCES "public"."work_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_defects" ADD CONSTRAINT "work_defects_work_component_id_work_components_id_fk" FOREIGN KEY ("work_component_id") REFERENCES "public"."work_components"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_productions" ADD CONSTRAINT "worker_productions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_productions" ADD CONSTRAINT "worker_productions_work_product_id_work_products_id_fk" FOREIGN KEY ("work_product_id") REFERENCES "public"."work_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_productions" ADD CONSTRAINT "worker_productions_work_station_id_work_stations_id_fk" FOREIGN KEY ("work_station_id") REFERENCES "public"."work_stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_production_defects" ADD CONSTRAINT "worker_production_defects_worker_production_id_worker_productions_id_fk" FOREIGN KEY ("worker_production_id") REFERENCES "public"."worker_productions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_production_defects" ADD CONSTRAINT "worker_production_defects_work_defect_id_work_defects_id_fk" FOREIGN KEY ("work_defect_id") REFERENCES "public"."work_defects"("id") ON DELETE no action ON UPDATE no action;