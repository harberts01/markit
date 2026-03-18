CREATE TABLE "booth_reservations" (
	"id" serial PRIMARY KEY NOT NULL,
	"market_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"booth_id" varchar(100) NOT NULL,
	"market_day_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'confirmed' NOT NULL,
	"reserved_at" timestamp with time zone DEFAULT now(),
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "market_days" (
	"id" serial PRIMARY KEY NOT NULL,
	"market_id" uuid NOT NULL,
	"market_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "booth_reservations" ADD CONSTRAINT "booth_reservations_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booth_reservations" ADD CONSTRAINT "booth_reservations_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booth_reservations" ADD CONSTRAINT "booth_reservations_market_day_id_market_days_id_fk" FOREIGN KEY ("market_day_id") REFERENCES "public"."market_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_days" ADD CONSTRAINT "market_days_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "booth_reservations_active_unique" ON "booth_reservations" USING btree ("market_id","booth_id","market_day_id") WHERE status = 'confirmed';--> statement-breakpoint
CREATE UNIQUE INDEX "market_days_market_date_unique" ON "market_days" USING btree ("market_id","market_date");