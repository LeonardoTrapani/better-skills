import { and, eq } from "drizzle-orm";

import { db } from "@better-skills/db";
import { user } from "@better-skills/db/schema/auth";
import { vault, vaultMembership } from "@better-skills/db/schema/vaults";

const SYSTEM_DEFAULT_VAULT_SLUG = "system-default";
const SYSTEM_DEFAULT_VAULT_NAME = "Default Skills";

/**
 * Ensures exactly one system_default vault exists. Returns its id.
 * Idempotent — safe to call on every deploy/build.
 */
export async function ensureSystemDefaultVault(): Promise<string> {
  const [existing] = await db
    .select({ id: vault.id })
    .from(vault)
    .where(and(eq(vault.type, "system_default"), eq(vault.slug, SYSTEM_DEFAULT_VAULT_SLUG)));

  if (existing) {
    return existing.id;
  }

  const [created] = await db
    .insert(vault)
    .values({
      slug: SYSTEM_DEFAULT_VAULT_SLUG,
      name: SYSTEM_DEFAULT_VAULT_NAME,
      type: "system_default",
      isSystemManaged: true,
      metadata: {},
    })
    .returning({ id: vault.id });

  if (!created) {
    throw new Error("failed to create system-default vault");
  }

  return created.id;
}

/**
 * Ensures every user has a read-only membership to the system-default vault.
 * Skips users who already have a membership. Idempotent.
 */
export async function backfillSystemDefaultVaultMemberships(): Promise<{
  vaultId: string;
  added: number;
}> {
  const vaultId = await ensureSystemDefaultVault();

  const allUsers = await db.select({ id: user.id }).from(user);

  // get all users who already have a membership
  const existingMemberUserIds = new Set(
    (
      await db
        .select({ userId: vaultMembership.userId })
        .from(vaultMembership)
        .where(eq(vaultMembership.vaultId, vaultId))
    ).map((row) => row.userId),
  );

  const toInsert = allUsers
    .filter((u) => !existingMemberUserIds.has(u.id))
    .map((u) => ({
      vaultId,
      userId: u.id,
      role: "member" as const,
      isEnabled: true,
    }));

  if (toInsert.length === 0) {
    return { vaultId, added: 0 };
  }

  // batch insert in chunks to avoid hitting param limits
  const CHUNK_SIZE = 500;
  let added = 0;

  for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
    const chunk = toInsert.slice(i, i + CHUNK_SIZE);
    await db.insert(vaultMembership).values(chunk).onConflictDoNothing();
    added += chunk.length;
  }

  return { vaultId, added };
}

/**
 * Attach a single user to the system-default vault as a read-only member.
 * No-op if already a member.
 */
export async function attachUserToSystemDefaultVault(userId: string): Promise<void> {
  const vaultId = await ensureSystemDefaultVault();

  await db
    .insert(vaultMembership)
    .values({
      vaultId,
      userId,
      role: "member",
      isEnabled: true,
    })
    .onConflictDoNothing();
}

/**
 * Create a personal vault for a user and return its id.
 * No-op if the user already has a personal vault.
 */
export async function ensurePersonalVault(userId: string, userName: string): Promise<string> {
  const slug = `personal-${userId}`;

  const [existing] = await db
    .select({ id: vault.id })
    .from(vault)
    .where(and(eq(vault.slug, slug), eq(vault.type, "personal")));

  if (existing) {
    return existing.id;
  }

  const [created] = await db
    .insert(vault)
    .values({
      slug,
      name: `${userName}'s Vault`,
      type: "personal",
      isSystemManaged: false,
      metadata: {},
    })
    .returning({ id: vault.id });

  if (!created) {
    throw new Error(`failed to create personal vault for user "${userId}"`);
  }

  await db
    .insert(vaultMembership)
    .values({
      vaultId: created.id,
      userId,
      role: "owner",
      isEnabled: true,
    })
    .onConflictDoNothing();

  return created.id;
}
