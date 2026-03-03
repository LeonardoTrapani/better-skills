import { TRPCError } from "@trpc/server";
import { and, eq, ilike } from "drizzle-orm";
import { z } from "zod";

import { db } from "@better-skills/db";
import { vault, vaultInvitation, vaultMembership } from "@better-skills/db/schema/vaults";

import { getUserMemberships, resolvePermissions } from "../lib/vault-access";
import { protectedProcedure, router } from "../trpc";

const vaultTypeEnum = z.enum(["personal", "enterprise", "system_default"]);
const membershipRoleEnum = z.enum(["owner", "admin", "member"]);
const invitationStatusEnum = z.enum(["pending", "accepted", "declined", "revoked", "expired"]);

const vaultMembershipOutput = z.object({
  membershipId: z.string().uuid(),
  vaultId: z.string().uuid(),
  role: membershipRoleEnum,
  isEnabled: z.boolean(),
  canRead: z.boolean(),
  canWrite: z.boolean(),
  canAdmin: z.boolean(),
  isReadOnly: z.boolean(),
  vault: z.object({
    id: z.string().uuid(),
    slug: z.string(),
    name: z.string(),
    type: vaultTypeEnum,
    color: z.string().nullable(),
    isSystemManaged: z.boolean(),
  }),
});

const pendingInvitationOutput = z.object({
  id: z.string().uuid(),
  vaultId: z.string().uuid(),
  vaultSlug: z.string(),
  vaultName: z.string(),
  vaultType: vaultTypeEnum,
  vaultColor: z.string().nullable(),
  role: membershipRoleEnum,
  status: invitationStatusEnum,
  invitedByUserId: z.string().nullable(),
  expiresAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const vaultsRouter = router({
  listMine: protectedProcedure.output(z.array(vaultMembershipOutput)).query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const memberships = await getUserMemberships(userId);

    return memberships.map((membership) => {
      const permissions = resolvePermissions(membership.vaultType, membership.role);
      return {
        membershipId: membership.membershipId,
        vaultId: membership.vaultId,
        role: membership.role,
        isEnabled: membership.isEnabled,
        canRead: permissions.canRead,
        canWrite: permissions.canWrite,
        canAdmin: permissions.canAdmin,
        isReadOnly: permissions.isReadOnly,
        vault: {
          id: membership.vaultId,
          slug: membership.vaultSlug,
          name: membership.vaultName,
          type: membership.vaultType,
          color: membership.vaultColor,
          isSystemManaged: membership.isSystemManaged,
        },
      };
    });
  }),

  setEnabled: protectedProcedure
    .input(
      z.object({
        vaultId: z.string().uuid(),
        isEnabled: z.boolean(),
      }),
    )
    .output(
      z.object({
        success: z.literal(true),
        vaultId: z.string().uuid(),
        isEnabled: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const [updated] = await db
        .update(vaultMembership)
        .set({ isEnabled: input.isEnabled })
        .where(and(eq(vaultMembership.userId, userId), eq(vaultMembership.vaultId, input.vaultId)))
        .returning({
          vaultId: vaultMembership.vaultId,
          isEnabled: vaultMembership.isEnabled,
        });

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Vault membership not found" });
      }

      return {
        success: true as const,
        vaultId: updated.vaultId,
        isEnabled: updated.isEnabled,
      };
    }),

  invitations: router({
    listPending: protectedProcedure
      .output(z.array(pendingInvitationOutput))
      .query(async ({ ctx }) => {
        const currentEmail = ctx.session.user.email;

        const invitations = await db
          .select({
            id: vaultInvitation.id,
            vaultId: vaultInvitation.vaultId,
            vaultSlug: vault.slug,
            vaultName: vault.name,
            vaultType: vault.type,
            vaultColor: vault.color,
            role: vaultInvitation.role,
            status: vaultInvitation.status,
            invitedByUserId: vaultInvitation.invitedByUserId,
            expiresAt: vaultInvitation.expiresAt,
            createdAt: vaultInvitation.createdAt,
            updatedAt: vaultInvitation.updatedAt,
          })
          .from(vaultInvitation)
          .innerJoin(vault, eq(vault.id, vaultInvitation.vaultId))
          .where(
            and(eq(vaultInvitation.status, "pending"), ilike(vaultInvitation.email, currentEmail)),
          );

        return invitations;
      }),
  }),
});
