CREATE TYPE "public"."budget_type" AS ENUM('income', 'expense', 'savings');--> statement-breakpoint
CREATE TYPE "public"."day_of_week_type" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');--> statement-breakpoint
CREATE TYPE "public"."frequency_type" AS ENUM('weekly', 'bi-weekly', 'semi-monthly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('spend', 'save', 'transfer');--> statement-breakpoint
CREATE TABLE "budget_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "budget_type" NOT NULL,
	"emoji" text,
	"name" text NOT NULL,
	"color" text,
	"sort_order" double precision DEFAULT 0 NOT NULL,
	"is_archived" boolean DEFAULT false,
	"archived_at" timestamp,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "budget_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"budget_caftegory_id" integer NOT NULL,
	"type" "budget_type" NOT NULL,
	"name" text NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"frequency" "frequency_type" NOT NULL,
	"start_date" timestamp NOT NULL,
	"day_of_week" "day_of_week_type",
	"day_of_month" integer,
	"day_of_month_is_last" boolean DEFAULT false NOT NULL,
	"second_day_of_month" integer,
	"second_day_of_month_is_last" boolean DEFAULT false NOT NULL,
	"sort_order" double precision DEFAULT 0 NOT NULL,
	"is_archived" boolean DEFAULT false,
	"archived_at" timestamp,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "spending_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"emoji" text,
	"name" text NOT NULL,
	"color" text,
	"balance" integer DEFAULT 0 NOT NULL,
	"sort_order" double precision NOT NULL,
	"pin_order" double precision DEFAULT 0 NOT NULL,
	"is_archived" boolean DEFAULT false,
	"archived_at" timestamp,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "spending_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"emoji" text,
	"name" text NOT NULL,
	"color" text,
	"sort_order" double precision DEFAULT 0 NOT NULL,
	"is_archived" boolean DEFAULT false,
	"archived_at" timestamp,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "spending_top_up_occurences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"spending_top_up_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"is_archived" boolean DEFAULT false,
	"is_executed" boolean DEFAULT false,
	"archived_at" timestamp,
	"executed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "spending_top_ups" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"spending_account_id" integer NOT NULL,
	"spending_category_id" integer NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"frequency" "frequency_type" NOT NULL,
	"start_date" timestamp NOT NULL,
	"day_of_week" "day_of_week_type",
	"day_of_month" integer,
	"day_of_month_is_last" boolean DEFAULT false NOT NULL,
	"second_day_of_month" integer,
	"second_day_of_month_is_last" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false,
	"archived_at" timestamp,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "spending_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"spending_account_id" integer NOT NULL,
	"spending_category_id" integer NOT NULL,
	"type" "transaction_type" NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"memo" text,
	"date" timestamp,
	"is_archived" boolean DEFAULT false,
	"archived_at" timestamp,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"auth_id" uuid NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"image_url" text,
	"currency" text DEFAULT 'USD',
	"theme" text DEFAULT 'system',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_auth_id_unique" UNIQUE("auth_id")
);
--> statement-breakpoint
ALTER TABLE "budget_categories" ADD CONSTRAINT "budget_categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_budget_caftegory_id_budget_categories_id_fk" FOREIGN KEY ("budget_caftegory_id") REFERENCES "public"."budget_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spending_accounts" ADD CONSTRAINT "spending_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spending_categories" ADD CONSTRAINT "spending_categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spending_top_up_occurences" ADD CONSTRAINT "spending_top_up_occurences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spending_top_up_occurences" ADD CONSTRAINT "spending_top_up_occurences_spending_top_up_id_spending_top_ups_id_fk" FOREIGN KEY ("spending_top_up_id") REFERENCES "public"."spending_top_ups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spending_top_ups" ADD CONSTRAINT "spending_top_ups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spending_top_ups" ADD CONSTRAINT "spending_top_ups_spending_account_id_spending_accounts_id_fk" FOREIGN KEY ("spending_account_id") REFERENCES "public"."spending_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spending_top_ups" ADD CONSTRAINT "spending_top_ups_spending_category_id_spending_categories_id_fk" FOREIGN KEY ("spending_category_id") REFERENCES "public"."spending_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spending_transactions" ADD CONSTRAINT "spending_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spending_transactions" ADD CONSTRAINT "spending_transactions_spending_account_id_spending_accounts_id_fk" FOREIGN KEY ("spending_account_id") REFERENCES "public"."spending_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spending_transactions" ADD CONSTRAINT "spending_transactions_spending_category_id_spending_categories_id_fk" FOREIGN KEY ("spending_category_id") REFERENCES "public"."spending_categories"("id") ON DELETE cascade ON UPDATE no action;