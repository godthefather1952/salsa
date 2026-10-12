CREATE TYPE "public"."account_kind" AS ENUM('checking', 'savings', 'credit_card', 'mortgage', 'auto_loan', 'student_loan');--> statement-breakpoint
CREATE TYPE "public"."filing_status" AS ENUM('single', 'married_joint', 'married_separate', 'head_of_household', 'qualifying_surviving_spouse');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('purchase', 'deposit', 'transfer', 'bill_payment', 'loan_interest', 'loan_principal');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"external_ref" text NOT NULL,
	"kind" "account_kind" NOT NULL,
	"name" text NOT NULL,
	"mask" char(4) NOT NULL,
	"opened_on" date NOT NULL,
	"loan" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_tenant_external_ref" UNIQUE("tenant_id","external_ref"),
	CONSTRAINT "accounts_tenant_customer_id" UNIQUE("tenant_id","customer_id","id")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"external_ref" text NOT NULL,
	"display_name" text NOT NULL,
	"birth_year" integer,
	"filing_status" "filing_status",
	"state" char(2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_tenant_external_ref" UNIQUE("tenant_id","external_ref"),
	CONSTRAINT "customers_tenant_id" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"branding" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"external_ref" text NOT NULL,
	"posted_on" date NOT NULL,
	"amount_cents" bigint NOT NULL,
	"description" text NOT NULL,
	"merchant_name" text,
	"mcc" char(4),
	"type" "transaction_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_tenant_external_ref" UNIQUE("tenant_id","external_ref")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_customer_fk" FOREIGN KEY ("tenant_id","customer_id") REFERENCES "public"."customers"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_fk" FOREIGN KEY ("tenant_id","customer_id","account_id") REFERENCES "public"."accounts"("tenant_id","customer_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_customer_idx" ON "accounts" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "transactions_customer_posted_idx" ON "transactions" USING btree ("customer_id","posted_on");--> statement-breakpoint
CREATE INDEX "transactions_account_posted_idx" ON "transactions" USING btree ("account_id","posted_on");