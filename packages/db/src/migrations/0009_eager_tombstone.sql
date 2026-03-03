ALTER TABLE "skill" DROP CONSTRAINT "skill_owner_user_id_user_id_fk";
--> statement-breakpoint
DROP INDEX "skill_private_owner_slug_idx";--> statement-breakpoint
ALTER TABLE "skill" ALTER COLUMN "owner_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "skill" ADD CONSTRAINT "skill_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
DELETE FROM "skill"
WHERE "is_default" = true
  AND "owner_user_id" IS NOT NULL;
