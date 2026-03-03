import { and, eq, inArray } from "drizzle-orm";

import { db } from "@better-skills/db";
import { vault, vaultMembership } from "@better-skills/db/schema/vaults";

// ── types ──

export type VaultType = "personal" | "enterprise" | "system_default";
export type MembershipRole = "owner" | "admin" | "member";

export type VaultMembershipRow = {
  membershipId: string;
  vaultId: string;
  vaultSlug: string;
  vaultName: string;
  vaultType: VaultType;
  vaultColor: string | null;
  isSystemManaged: boolean;
  role: MembershipRole;
  isEnabled: boolean;
};

export type VaultPermissions = {
  canRead: boolean;
  canWrite: boolean;
  canAdmin: boolean;
  isReadOnly: boolean;
  reason?: string;
};

// ── permission logic (pure, no db) ──

/**
 * Derive read/write/admin permissions from vault type + membership role.
 *
 * Rules:
 * - system_default vault: always read-only regardless of role
 * - personal vault owner: full access
 * - enterprise owner/admin: full access
 * - enterprise member: read-only
 */
export function resolvePermissions(vaultType: VaultType, role: MembershipRole): VaultPermissions {
  if (vaultType === "system_default") {
    return {
      canRead: true,
      canWrite: false,
      canAdmin: false,
      isReadOnly: true,
      reason: "System default vault is read-only",
    };
  }

  if (vaultType === "personal") {
    // personal vaults only have owner role
    return {
      canRead: true,
      canWrite: true,
      canAdmin: true,
      isReadOnly: false,
    };
  }

  // enterprise vault
  if (role === "owner" || role === "admin") {
    return {
      canRead: true,
      canWrite: true,
      canAdmin: role === "owner",
      isReadOnly: false,
    };
  }

  // enterprise member
  return {
    canRead: true,
    canWrite: false,
    canAdmin: false,
    isReadOnly: true,
    reason: "Enterprise vault members have read-only access",
  };
}

// ── db queries ──

/**
 * Fetch all vault memberships for a user (both enabled and disabled).
 * Joins vault metadata so callers get everything in one query.
 */
export async function getUserMemberships(userId: string): Promise<VaultMembershipRow[]> {
  const rows = await db
    .select({
      membershipId: vaultMembership.id,
      vaultId: vault.id,
      vaultSlug: vault.slug,
      vaultName: vault.name,
      vaultType: vault.type,
      vaultColor: vault.color,
      isSystemManaged: vault.isSystemManaged,
      role: vaultMembership.role,
      isEnabled: vaultMembership.isEnabled,
    })
    .from(vaultMembership)
    .innerJoin(vault, eq(vault.id, vaultMembership.vaultId))
    .where(eq(vaultMembership.userId, userId));

  return rows;
}

/**
 * Legacy helper retained for compatibility.
 *
 * Despite the name, this now returns all vault IDs the user is a member of.
 * `isEnabled` is surfaced as status metadata in read outputs instead of
 * filtering list/search/graph visibility.
 */
export async function getEnabledVaultIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ vaultId: vaultMembership.vaultId })
    .from(vaultMembership)
    .where(eq(vaultMembership.userId, userId));

  return rows.map((r) => r.vaultId);
}

/**
 * Look up a user's membership for a specific vault.
 * Returns null if the user is not a member.
 */
export async function getMembershipForVault(
  userId: string,
  vaultId: string,
): Promise<VaultMembershipRow | null> {
  const rows = await db
    .select({
      membershipId: vaultMembership.id,
      vaultId: vault.id,
      vaultSlug: vault.slug,
      vaultName: vault.name,
      vaultType: vault.type,
      vaultColor: vault.color,
      isSystemManaged: vault.isSystemManaged,
      role: vaultMembership.role,
      isEnabled: vaultMembership.isEnabled,
    })
    .from(vaultMembership)
    .innerJoin(vault, eq(vault.id, vaultMembership.vaultId))
    .where(and(eq(vaultMembership.userId, userId), eq(vaultMembership.vaultId, vaultId)));

  return rows[0] ?? null;
}

// ── high-level authorization ──

/**
 * Check whether a user can perform an action on a skill, given the skill's
 * ownerVaultId. Returns permissions or throws-friendly error info.
 *
 * This is the single reusable function procedures should call instead of
 * doing ad-hoc ownership checks.
 */
export async function authorizeSkillAccess(
  userId: string,
  skillOwnerVaultId: string,
): Promise<VaultPermissions & { membership: VaultMembershipRow }> {
  const membership = await getMembershipForVault(userId, skillOwnerVaultId);

  if (!membership) {
    return {
      canRead: false,
      canWrite: false,
      canAdmin: false,
      isReadOnly: true,
      reason: "Not a member of this vault",
      membership: null as unknown as VaultMembershipRow,
    };
  }

  const permissions = resolvePermissions(membership.vaultType, membership.role);

  return { ...permissions, membership };
}

/**
 * Assert a user can read a skill's vault. Throws structured error info
 * that callers can wrap in TRPCError.
 */
export async function assertCanRead(
  userId: string,
  skillOwnerVaultId: string,
): Promise<VaultMembershipRow> {
  const { canRead, membership, reason } = await authorizeSkillAccess(userId, skillOwnerVaultId);

  if (!canRead) {
    throw new VaultAccessError("FORBIDDEN", reason ?? "No read access to this vault");
  }

  return membership;
}

/**
 * Assert a user can write (create/update/delete) in a skill's vault.
 */
export async function assertCanWrite(
  userId: string,
  skillOwnerVaultId: string,
): Promise<VaultMembershipRow> {
  const { canWrite, membership, reason } = await authorizeSkillAccess(userId, skillOwnerVaultId);

  if (!canWrite) {
    throw new VaultAccessError("FORBIDDEN", reason ?? "No write access to this vault");
  }

  return membership;
}

/**
 * Assert a user has admin privileges on a vault (owner-only for enterprise,
 * full access for personal).
 */
export async function assertCanAdmin(userId: string, vaultId: string): Promise<VaultMembershipRow> {
  const { canAdmin, membership, reason } = await authorizeSkillAccess(userId, vaultId);

  if (!canAdmin) {
    throw new VaultAccessError("FORBIDDEN", reason ?? "Admin access required");
  }

  return membership;
}

// ── utility: resolve a user's personal vault ──

export async function getPersonalVaultId(userId: string): Promise<string> {
  const rows = await db
    .select({ vaultId: vault.id })
    .from(vault)
    .innerJoin(vaultMembership, eq(vaultMembership.vaultId, vault.id))
    .where(
      and(
        eq(vaultMembership.userId, userId),
        eq(vault.type, "personal"),
        eq(vaultMembership.role, "owner"),
      ),
    );

  const row = rows[0];
  if (!row) {
    throw new VaultAccessError("NOT_FOUND", "Personal vault not found");
  }

  return row.vaultId;
}

// ── utility: bulk vault metadata for skill lists ──

export async function getVaultMetadataByIds(
  vaultIds: string[],
): Promise<Map<string, { slug: string; name: string; type: VaultType; color: string | null }>> {
  if (vaultIds.length === 0) return new Map();

  const unique = [...new Set(vaultIds)];
  const rows = await db
    .select({
      id: vault.id,
      slug: vault.slug,
      name: vault.name,
      type: vault.type,
      color: vault.color,
    })
    .from(vault)
    .where(inArray(vault.id, unique));

  const map = new Map<
    string,
    { slug: string; name: string; type: VaultType; color: string | null }
  >();
  for (const row of rows) {
    map.set(row.id, { slug: row.slug, name: row.name, type: row.type, color: row.color });
  }
  return map;
}

// ── error class ──

export type VaultAccessErrorCode = "FORBIDDEN" | "NOT_FOUND";

export class VaultAccessError extends Error {
  public readonly code: VaultAccessErrorCode;

  constructor(code: VaultAccessErrorCode, message: string) {
    super(message);
    this.name = "VaultAccessError";
    this.code = code;
  }
}
