DROP INDEX "vault_slug_idx";--> statement-breakpoint
ALTER TABLE "vault" ADD COLUMN "owner_user_id" text;--> statement-breakpoint
ALTER TABLE "vault" ADD CONSTRAINT "vault_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
UPDATE "vault" AS v
SET "owner_user_id" = m."user_id"
FROM (
  SELECT DISTINCT ON ("vault_id") "vault_id", "user_id"
  FROM "vault_membership"
  WHERE "role" = 'owner'
  ORDER BY "vault_id", "created_at" ASC
) AS m
WHERE v."type" = 'personal'
  AND v."id" = m."vault_id";--> statement-breakpoint
UPDATE "vault" AS v
SET "owner_user_id" = m."user_id"
FROM (
  SELECT DISTINCT ON ("vault_id") "vault_id", "user_id"
  FROM "vault_membership"
  ORDER BY "vault_id", "created_at" ASC
) AS m
WHERE v."type" = 'personal'
  AND v."owner_user_id" IS NULL
  AND v."id" = m."vault_id";--> statement-breakpoint
UPDATE "vault"
SET "slug" = 'personal'
WHERE "type" = 'personal';--> statement-breakpoint
CREATE UNIQUE INDEX "vault_slug_non_personal_idx" ON "vault" USING btree ("slug") WHERE "vault"."type" <> 'personal';--> statement-breakpoint
CREATE UNIQUE INDEX "vault_personal_owner_slug_idx" ON "vault" USING btree ("owner_user_id","slug") WHERE "vault"."type" = 'personal' and "vault"."owner_user_id" is not null;--> statement-breakpoint
ALTER TABLE "vault" ADD CONSTRAINT "vault_personal_owner_required" CHECK ("vault"."type" <> 'personal' or "vault"."owner_user_id" is not null);--> statement-breakpoint
ALTER TABLE "vault" ADD CONSTRAINT "vault_personal_slug_check" CHECK ("vault"."type" <> 'personal' or "vault"."slug" = 'personal');--> statement-breakpoint
ALTER TABLE "vault" ADD CONSTRAINT "vault_non_personal_slug_check" CHECK ("vault"."type" = 'personal' or "vault"."slug" <> 'personal');
