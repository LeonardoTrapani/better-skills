import { TRPCError } from "@trpc/server";
import { and, eq, ilike } from "drizzle-orm";
import { z } from "zod";

import { db } from "@better-skills/db";
import { user } from "@better-skills/db/schema/auth";
import { vault, vaultInvitation, vaultMembership } from "@better-skills/db/schema/vaults";

import { getMembershipForVault, getUserMemberships, resolvePermissions } from "../lib/vault-access";
import { adminApiProcedure, protectedProcedure, router } from "../trpc";

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

const enterpriseRoleEnum = z.enum(["admin", "member"]);

const enterpriseVaultOutput = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  type: z.literal("enterprise"),
  color: z.string().nullable(),
  defaultAdminEmail: z.string().email(),
  bootstrapStatus: z.enum(["membership_created", "invitation_created"]),
  invitationId: z.string().uuid().nullable(),
});

const invitationActionOutput = z.object({
  success: z.literal(true),
  invitationId: z.string().uuid(),
  vaultId: z.string().uuid(),
  role: membershipRoleEnum,
  status: invitationStatusEnum,
});

const vaultMemberOutput = z.object({
  userId: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: membershipRoleEnum,
  isEnabled: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const updateColorOutput = z.object({
  success: z.literal(true),
  vaultId: z.string().uuid(),
  color: z.string().nullable(),
});

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function assertCanManageEnterpriseVault(userId: string, vaultId: string) {
  const membership = await getMembershipForVault(userId, vaultId);
  if (!membership) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this vault" });
  }

  if (membership.vaultType !== "enterprise") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This operation is only allowed for enterprise vaults",
    });
  }

  if (membership.role !== "owner" && membership.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Owner or admin role required" });
  }

  return membership;
}

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

    acceptInvitation: protectedProcedure
      .input(
        z.object({
          invitationId: z.string().uuid(),
        }),
      )
      .output(invitationActionOutput)
      .mutation(async ({ ctx, input }) => {
        const currentEmail = normalizeEmail(ctx.session.user.email);
        const userId = ctx.session.user.id;

        const [invite] = await db
          .select({
            id: vaultInvitation.id,
            vaultId: vaultInvitation.vaultId,
            email: vaultInvitation.email,
            role: vaultInvitation.role,
            status: vaultInvitation.status,
            expiresAt: vaultInvitation.expiresAt,
          })
          .from(vaultInvitation)
          .where(eq(vaultInvitation.id, input.invitationId));

        if (!invite) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" });
        }

        if (invite.status !== "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invitation is no longer pending" });
        }

        if (normalizeEmail(invite.email) !== currentEmail) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Invitation email does not match current user",
          });
        }

        if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
          await db
            .update(vaultInvitation)
            .set({ status: "expired" })
            .where(eq(vaultInvitation.id, invite.id));

          throw new TRPCError({ code: "BAD_REQUEST", message: "Invitation has expired" });
        }

        await db
          .insert(vaultMembership)
          .values({
            vaultId: invite.vaultId,
            userId,
            role: invite.role,
            isEnabled: true,
          })
          .onConflictDoUpdate({
            target: [vaultMembership.vaultId, vaultMembership.userId],
            set: { role: invite.role, isEnabled: true },
          });

        await db
          .update(vaultInvitation)
          .set({ status: "accepted" })
          .where(eq(vaultInvitation.id, invite.id));

        return {
          success: true as const,
          invitationId: invite.id,
          vaultId: invite.vaultId,
          role: invite.role,
          status: "accepted" as const,
        };
      }),

    declineInvitation: protectedProcedure
      .input(
        z.object({
          invitationId: z.string().uuid(),
        }),
      )
      .output(invitationActionOutput)
      .mutation(async ({ ctx, input }) => {
        const currentEmail = normalizeEmail(ctx.session.user.email);

        const [invite] = await db
          .select({
            id: vaultInvitation.id,
            vaultId: vaultInvitation.vaultId,
            email: vaultInvitation.email,
            role: vaultInvitation.role,
            status: vaultInvitation.status,
            expiresAt: vaultInvitation.expiresAt,
          })
          .from(vaultInvitation)
          .where(eq(vaultInvitation.id, input.invitationId));

        if (!invite) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" });
        }

        if (invite.status !== "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invitation is no longer pending" });
        }

        if (normalizeEmail(invite.email) !== currentEmail) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Invitation email does not match current user",
          });
        }

        if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
          await db
            .update(vaultInvitation)
            .set({ status: "expired" })
            .where(eq(vaultInvitation.id, invite.id));

          throw new TRPCError({ code: "BAD_REQUEST", message: "Invitation has expired" });
        }

        await db
          .update(vaultInvitation)
          .set({ status: "declined" })
          .where(eq(vaultInvitation.id, invite.id));

        return {
          success: true as const,
          invitationId: invite.id,
          vaultId: invite.vaultId,
          role: invite.role,
          status: "declined" as const,
        };
      }),
  }),

  createEnterprise: adminApiProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1).max(64).optional(),
        color: z.string().nullable().optional(),
        defaultAdminEmail: z.string().email(),
      }),
    )
    .output(enterpriseVaultOutput)
    .mutation(async ({ input }) => {
      const name = input.name.trim();
      const slug = toSlug(input.slug ?? name);
      const defaultAdminEmail = normalizeEmail(input.defaultAdminEmail);

      if (!slug) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid enterprise vault slug" });
      }

      try {
        return await db.transaction(async (tx) => {
          const [created] = await tx
            .insert(vault)
            .values({
              slug,
              name,
              type: "enterprise",
              color: input.color ?? null,
              isSystemManaged: false,
            })
            .returning({
              id: vault.id,
              slug: vault.slug,
              name: vault.name,
              color: vault.color,
            });

          if (!created) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create enterprise vault",
            });
          }

          const [existingUser] = await tx
            .select({ id: user.id })
            .from(user)
            .where(ilike(user.email, defaultAdminEmail))
            .limit(1);

          if (existingUser) {
            await tx
              .insert(vaultMembership)
              .values({
                vaultId: created.id,
                userId: existingUser.id,
                role: "owner",
                isEnabled: true,
              })
              .onConflictDoUpdate({
                target: [vaultMembership.vaultId, vaultMembership.userId],
                set: { role: "owner", isEnabled: true },
              });

            return {
              ...created,
              type: "enterprise" as const,
              defaultAdminEmail,
              bootstrapStatus: "membership_created" as const,
              invitationId: null,
            };
          }

          const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
          const [invite] = await tx
            .insert(vaultInvitation)
            .values({
              vaultId: created.id,
              email: defaultAdminEmail,
              role: "owner",
              status: "pending",
              invitedByUserId: null,
              expiresAt,
            })
            .returning({ id: vaultInvitation.id });

          if (!invite) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create bootstrap invitation",
            });
          }

          return {
            ...created,
            type: "enterprise" as const,
            defaultAdminEmail,
            bootstrapStatus: "invitation_created" as const,
            invitationId: invite.id,
          };
        });
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          typeof error.code === "string" &&
          error.code === "23505"
        ) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Vault slug already exists" });
        }
        throw error;
      }
    }),

  inviteMember: protectedProcedure
    .input(
      z.object({
        vaultId: z.string().uuid(),
        email: z.string().email(),
        role: enterpriseRoleEnum.default("member"),
      }),
    )
    .output(pendingInvitationOutput)
    .mutation(async ({ ctx, input }) => {
      await assertCanManageEnterpriseVault(ctx.session.user.id, input.vaultId);

      const invitedByUserId = ctx.session.user.id;
      const normalizedEmail = normalizeEmail(input.email);

      if (normalizedEmail === normalizeEmail(ctx.session.user.email)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot invite your own account" });
      }

      const [vaultRow] = await db
        .select({
          id: vault.id,
          slug: vault.slug,
          name: vault.name,
          type: vault.type,
          color: vault.color,
        })
        .from(vault)
        .where(eq(vault.id, input.vaultId));

      if (!vaultRow || vaultRow.type !== "enterprise") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Enterprise vault not found" });
      }

      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);

      const [pending] = await db
        .select({
          id: vaultInvitation.id,
          status: vaultInvitation.status,
        })
        .from(vaultInvitation)
        .where(
          and(
            eq(vaultInvitation.vaultId, input.vaultId),
            ilike(vaultInvitation.email, normalizedEmail),
            eq(vaultInvitation.status, "pending"),
          ),
        );

      if (pending) {
        const [updatedInvite] = await db
          .update(vaultInvitation)
          .set({
            role: input.role,
            email: normalizedEmail,
            invitedByUserId,
            status: "pending",
            expiresAt,
          })
          .where(eq(vaultInvitation.id, pending.id))
          .returning({
            id: vaultInvitation.id,
            role: vaultInvitation.role,
            status: vaultInvitation.status,
            invitedByUserId: vaultInvitation.invitedByUserId,
            expiresAt: vaultInvitation.expiresAt,
            createdAt: vaultInvitation.createdAt,
            updatedAt: vaultInvitation.updatedAt,
          });

        if (!updatedInvite) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update invitation",
          });
        }

        return {
          id: updatedInvite.id,
          vaultId: vaultRow.id,
          vaultSlug: vaultRow.slug,
          vaultName: vaultRow.name,
          vaultType: vaultRow.type,
          vaultColor: vaultRow.color,
          role: updatedInvite.role,
          status: updatedInvite.status,
          invitedByUserId: updatedInvite.invitedByUserId,
          expiresAt: updatedInvite.expiresAt,
          createdAt: updatedInvite.createdAt,
          updatedAt: updatedInvite.updatedAt,
        };
      }

      const [insertedInvite] = await db
        .insert(vaultInvitation)
        .values({
          vaultId: input.vaultId,
          email: normalizedEmail,
          role: input.role,
          status: "pending",
          invitedByUserId,
          expiresAt,
        })
        .returning({
          id: vaultInvitation.id,
          role: vaultInvitation.role,
          status: vaultInvitation.status,
          invitedByUserId: vaultInvitation.invitedByUserId,
          expiresAt: vaultInvitation.expiresAt,
          createdAt: vaultInvitation.createdAt,
          updatedAt: vaultInvitation.updatedAt,
        });

      if (!insertedInvite) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create invitation",
        });
      }

      return {
        id: insertedInvite.id,
        vaultId: vaultRow.id,
        vaultSlug: vaultRow.slug,
        vaultName: vaultRow.name,
        vaultType: vaultRow.type,
        vaultColor: vaultRow.color,
        role: insertedInvite.role,
        status: insertedInvite.status,
        invitedByUserId: insertedInvite.invitedByUserId,
        expiresAt: insertedInvite.expiresAt,
        createdAt: insertedInvite.createdAt,
        updatedAt: insertedInvite.updatedAt,
      };
    }),

  members: router({
    list: protectedProcedure
      .input(
        z.object({
          vaultId: z.string().uuid(),
        }),
      )
      .output(z.array(vaultMemberOutput))
      .query(async ({ ctx, input }) => {
        await assertCanManageEnterpriseVault(ctx.session.user.id, input.vaultId);

        const members = await db
          .select({
            userId: vaultMembership.userId,
            name: user.name,
            email: user.email,
            role: vaultMembership.role,
            isEnabled: vaultMembership.isEnabled,
            createdAt: vaultMembership.createdAt,
            updatedAt: vaultMembership.updatedAt,
          })
          .from(vaultMembership)
          .innerJoin(user, eq(user.id, vaultMembership.userId))
          .where(eq(vaultMembership.vaultId, input.vaultId));

        return members;
      }),

    updateRole: protectedProcedure
      .input(
        z.object({
          vaultId: z.string().uuid(),
          userId: z.string(),
          role: enterpriseRoleEnum,
        }),
      )
      .output(vaultMemberOutput)
      .mutation(async ({ ctx, input }) => {
        await assertCanManageEnterpriseVault(ctx.session.user.id, input.vaultId);

        const [existing] = await db
          .select({
            role: vaultMembership.role,
          })
          .from(vaultMembership)
          .where(
            and(
              eq(vaultMembership.vaultId, input.vaultId),
              eq(vaultMembership.userId, input.userId),
            ),
          );

        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Vault membership not found" });
        }

        if (existing.role === "owner") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Owner role cannot be changed" });
        }

        const [updatedMember] = await db
          .update(vaultMembership)
          .set({ role: input.role })
          .where(
            and(
              eq(vaultMembership.vaultId, input.vaultId),
              eq(vaultMembership.userId, input.userId),
            ),
          )
          .returning({
            userId: vaultMembership.userId,
            role: vaultMembership.role,
            isEnabled: vaultMembership.isEnabled,
            createdAt: vaultMembership.createdAt,
            updatedAt: vaultMembership.updatedAt,
          });

        if (!updatedMember) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Vault membership not found" });
        }

        const [userRow] = await db
          .select({
            name: user.name,
            email: user.email,
          })
          .from(user)
          .where(eq(user.id, updatedMember.userId));

        if (!userRow) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        return {
          userId: updatedMember.userId,
          name: userRow.name,
          email: userRow.email,
          role: updatedMember.role,
          isEnabled: updatedMember.isEnabled,
          createdAt: updatedMember.createdAt,
          updatedAt: updatedMember.updatedAt,
        };
      }),

    remove: protectedProcedure
      .input(
        z.object({
          vaultId: z.string().uuid(),
          userId: z.string(),
        }),
      )
      .output(
        z.object({
          success: z.literal(true),
          vaultId: z.string().uuid(),
          userId: z.string(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await assertCanManageEnterpriseVault(ctx.session.user.id, input.vaultId);

        const [existing] = await db
          .select({
            role: vaultMembership.role,
          })
          .from(vaultMembership)
          .where(
            and(
              eq(vaultMembership.vaultId, input.vaultId),
              eq(vaultMembership.userId, input.userId),
            ),
          );

        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Vault membership not found" });
        }

        if (existing.role === "owner") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Owner cannot be removed" });
        }

        await db
          .delete(vaultMembership)
          .where(
            and(
              eq(vaultMembership.vaultId, input.vaultId),
              eq(vaultMembership.userId, input.userId),
            ),
          );

        return {
          success: true as const,
          vaultId: input.vaultId,
          userId: input.userId,
        };
      }),
  }),

  updateColor: protectedProcedure
    .input(
      z.object({
        vaultId: z.string().uuid(),
        color: z.string().nullable(),
      }),
    )
    .output(updateColorOutput)
    .mutation(async ({ ctx, input }) => {
      await assertCanManageEnterpriseVault(ctx.session.user.id, input.vaultId);

      const [updated] = await db
        .update(vault)
        .set({ color: input.color })
        .where(eq(vault.id, input.vaultId))
        .returning({
          id: vault.id,
          color: vault.color,
        });

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Vault not found" });
      }

      return {
        success: true as const,
        vaultId: updated.id,
        color: updated.color,
      };
    }),
});
