CREATE TYPE "public"."vault_invitation_status" AS ENUM('pending', 'accepted', 'declined', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."vault_membership_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."vault_type" AS ENUM('personal', 'enterprise', 'system_default');--> statement-breakpoint
CREATE TABLE "vault" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"type" "vault_type" NOT NULL,
	"color" text,
	"is_system_managed" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vault_invitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vault_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" "vault_membership_role" DEFAULT 'member' NOT NULL,
	"status" "vault_invitation_status" DEFAULT 'pending' NOT NULL,
	"invited_by_user_id" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vault_membership" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vault_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "vault_membership_role" NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "skill" ADD COLUMN "owner_vault_id" uuid;--> statement-breakpoint
ALTER TABLE "vault_invitation" ADD CONSTRAINT "vault_invitation_vault_id_vault_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vault"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_invitation" ADD CONSTRAINT "vault_invitation_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_membership" ADD CONSTRAINT "vault_membership_vault_id_vault_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vault"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_membership" ADD CONSTRAINT "vault_membership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "vault_slug_idx" ON "vault" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "vault_type_idx" ON "vault" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "vault_invitation_vault_email_pending_idx" ON "vault_invitation" USING btree ("vault_id","email") WHERE "vault_invitation"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "vault_invitation_vault_id_idx" ON "vault_invitation" USING btree ("vault_id");--> statement-breakpoint
CREATE INDEX "vault_invitation_email_idx" ON "vault_invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "vault_invitation_status_idx" ON "vault_invitation" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "vault_membership_vault_user_idx" ON "vault_membership" USING btree ("vault_id","user_id");--> statement-breakpoint
CREATE INDEX "vault_membership_user_id_idx" ON "vault_membership" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "vault_membership_vault_id_idx" ON "vault_membership" USING btree ("vault_id");--> statement-breakpoint
ALTER TABLE "skill" ADD CONSTRAINT "skill_owner_vault_id_vault_id_fk" FOREIGN KEY ("owner_vault_id") REFERENCES "public"."vault"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "skill_owner_vault_id_idx" ON "skill" USING btree ("owner_vault_id");--> statement-breakpoint
CREATE UNIQUE INDEX "skill_vault_slug_idx" ON "skill" USING btree ("owner_vault_id","slug") WHERE "skill"."owner_vault_id" is not null;--> statement-breakpoint

-- backfill: create a personal vault for every existing user
INSERT INTO "vault" ("id", "slug", "name", "type", "is_system_managed", "metadata", "created_at", "updated_at")
SELECT
  gen_random_uuid(),
  'personal-' || u."id",
  u."name" || '''s Vault',
  'personal',
  false,
  '{}'::jsonb,
  now(),
  now()
FROM "user" u
WHERE NOT EXISTS (
  SELECT 1 FROM "vault" v WHERE v."slug" = 'personal-' || u."id"
);--> statement-breakpoint

-- backfill: create owner membership for each personal vault
INSERT INTO "vault_membership" ("id", "vault_id", "user_id", "role", "is_enabled", "created_at", "updated_at")
SELECT
  gen_random_uuid(),
  v."id",
  u."id",
  'owner',
  true,
  now(),
  now()
FROM "user" u
JOIN "vault" v ON v."slug" = 'personal-' || u."id" AND v."type" = 'personal'
WHERE NOT EXISTS (
  SELECT 1 FROM "vault_membership" vm WHERE vm."vault_id" = v."id" AND vm."user_id" = u."id"
);--> statement-breakpoint

-- backfill: set owner_vault_id on all skills from their owner's personal vault
UPDATE "skill" s
SET "owner_vault_id" = v."id"
FROM "vault" v
WHERE v."slug" = 'personal-' || s."owner_user_id"
  AND v."type" = 'personal'
  AND s."owner_vault_id" IS NULL;