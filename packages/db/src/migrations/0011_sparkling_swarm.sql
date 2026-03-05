CREATE TABLE "skill_share" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by_user_id" text,
	"root_skill_id" uuid NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "skill_share" ADD CONSTRAINT "skill_share_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_share" ADD CONSTRAINT "skill_share_root_skill_id_skill_id_fk" FOREIGN KEY ("root_skill_id") REFERENCES "public"."skill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "skill_share_created_by_user_id_idx" ON "skill_share" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "skill_share_root_skill_id_idx" ON "skill_share" USING btree ("root_skill_id");--> statement-breakpoint
