DROP INDEX "skill_vault_slug_idx";--> statement-breakpoint
ALTER TABLE "skill" ALTER COLUMN "owner_vault_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "skill_vault_slug_idx" ON "skill" USING btree ("owner_vault_id","slug");