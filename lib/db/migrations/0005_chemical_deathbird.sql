ALTER TABLE "submissions" ADD COLUMN "work_station_id" text;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "units" integer;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_work_station_id_work_stations_id_fk" FOREIGN KEY ("work_station_id") REFERENCES "public"."work_stations"("id") ON DELETE no action ON UPDATE no action;