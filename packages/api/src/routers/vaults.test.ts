import { beforeEach, describe, expect, mock, test } from "bun:test";

type Condition =
  | { op: "eq"; table: string; field: string; value: unknown }
  | { op: "and"; conditions: (Condition | undefined)[] }
  | { op: "ilike"; table: string; field: string; value: string };

type VaultType = "personal" | "enterprise" | "system_default";
type MembershipRole = "owner" | "admin" | "member";
type InvitationStatus = "pending" | "accepted" | "declined" | "revoked" | "expired";

type VaultRow = {
  id: string;
  slug: string;
  name: string;
  type: VaultType;
  color: string | null;
  isSystemManaged: boolean;
};

type MembershipRow = {
  id: string;
  vaultId: string;
  userId: string;
  role: MembershipRole;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type InvitationRow = {
  id: string;
  vaultId: string;
  email: string;
  role: MembershipRole;
  status: InvitationStatus;
  invitedByUserId: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
};

const vaults: VaultRow[] = [];
const memberships: MembershipRow[] = [];
const invitations: InvitationRow[] = [];
const users: UserRow[] = [];

const keyOf = (table: string, field: string) => `${table}.${field}`;

function col(name: string, table: string) {
  return { config: { name, table } };
}

function toDbShape(row: Record<string, unknown>, table: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    out[keyOf(table, key)] = value;
  }
  return out;
}

function matches(row: Record<string, unknown>, condition: Condition | undefined): boolean {
  if (!condition) return true;

  if (condition.op === "and") {
    return condition.conditions.every((item) => matches(row, item));
  }

  const fieldValue = row[keyOf(condition.table, condition.field)];

  if (condition.op === "eq") {
    return fieldValue === condition.value;
  }

  if (typeof fieldValue !== "string") return false;
  return fieldValue.toLowerCase() === condition.value.toLowerCase();
}

function mapSelection(
  selection: Record<string, { config: { name: string; table: string } }>,
  row: Record<string, unknown>,
) {
  const mapped: Record<string, unknown> = {};
  for (const [key, column] of Object.entries(selection)) {
    mapped[key] = row[keyOf(column.config.table, column.config.name)];
  }
  return mapped;
}

let nextId = 1;

function fakeUuid() {
  const suffix = String(nextId++).padStart(12, "0");
  return `00000000-0000-4000-8000-${suffix}`;
}

const vaultTable = {
  __name: "vault",
  id: col("id", "vault"),
  slug: col("slug", "vault"),
  name: col("name", "vault"),
  type: col("type", "vault"),
  color: col("color", "vault"),
  isSystemManaged: col("isSystemManaged", "vault"),
};

const membershipTable = {
  __name: "vault_membership",
  id: col("id", "vault_membership"),
  vaultId: col("vaultId", "vault_membership"),
  userId: col("userId", "vault_membership"),
  role: col("role", "vault_membership"),
  isEnabled: col("isEnabled", "vault_membership"),
  createdAt: col("createdAt", "vault_membership"),
  updatedAt: col("updatedAt", "vault_membership"),
};

const invitationTable = {
  __name: "vault_invitation",
  id: col("id", "vault_invitation"),
  vaultId: col("vaultId", "vault_invitation"),
  email: col("email", "vault_invitation"),
  role: col("role", "vault_invitation"),
  status: col("status", "vault_invitation"),
  invitedByUserId: col("invitedByUserId", "vault_invitation"),
  expiresAt: col("expiresAt", "vault_invitation"),
  createdAt: col("createdAt", "vault_invitation"),
  updatedAt: col("updatedAt", "vault_invitation"),
};

const userTable = {
  __name: "user",
  id: col("id", "user"),
  name: col("name", "user"),
  email: col("email", "user"),
};

mock.module("drizzle-orm", () => ({
  eq: (column: { config: { name: string; table: string } }, value: unknown): Condition => ({
    op: "eq",
    table: column.config.table,
    field: column.config.name,
    value,
  }),
  and: (...conditions: (Condition | undefined)[]): Condition => ({ op: "and", conditions }),
  ilike: (column: { config: { name: string; table: string } }, value: string): Condition => ({
    op: "ilike",
    table: column.config.table,
    field: column.config.name,
    value,
  }),
}));

mock.module("@better-skills/db/schema/vaults", () => ({
  vault: vaultTable,
  vaultMembership: membershipTable,
  vaultInvitation: invitationTable,
}));

mock.module("@better-skills/db/schema/auth", () => ({
  user: userTable,
}));

function getRowsForTable(tableName: string) {
  if (tableName === "vault") return vaults as Record<string, unknown>[];
  if (tableName === "vault_membership") return memberships as Record<string, unknown>[];
  if (tableName === "vault_invitation") return invitations as Record<string, unknown>[];
  if (tableName === "user") return users as Record<string, unknown>[];
  throw new Error(`unknown table ${tableName}`);
}

mock.module("@better-skills/db", () => ({
  db: {
    select: (selection: Record<string, { config: { name: string; table: string } }>) => ({
      from: (table: { __name: string }) => {
        const baseRows = getRowsForTable(table.__name);

        return {
          innerJoin: (joinTable: { __name: string }) => {
            const joinedRows = getRowsForTable(joinTable.__name);

            return {
              where: async (condition?: Condition) => {
                const merged: Record<string, unknown>[] = [];
                for (const base of baseRows) {
                  for (const joined of joinedRows) {
                    const baseId = base.id;
                    const joinedId = joined.id;
                    const baseVaultId = base.vaultId;
                    const joinedVaultId = joined.vaultId;

                    const shouldJoin =
                      (table.__name === "vault_invitation" &&
                        joinTable.__name === "vault" &&
                        baseVaultId === joinedId) ||
                      (table.__name === "vault_membership" &&
                        joinTable.__name === "vault" &&
                        baseVaultId === joinedId) ||
                      (table.__name === "vault_membership" &&
                        joinTable.__name === "user" &&
                        base.userId === joinedId) ||
                      (table.__name === "vault" &&
                        joinTable.__name === "vault_membership" &&
                        baseId === joinedVaultId);

                    if (!shouldJoin) continue;

                    merged.push({
                      ...toDbShape(base, table.__name),
                      ...toDbShape(joined, joinTable.__name),
                    });
                  }
                }

                return merged
                  .filter((row) => matches(row, condition))
                  .map((row) => mapSelection(selection, row));
              },
            };
          },
          where: async (condition?: Condition) => {
            return baseRows
              .map((row) => toDbShape(row, table.__name))
              .filter((row) => matches(row, condition))
              .map((row) => mapSelection(selection, row));
          },
        };
      },
    }),
    insert: (table: { __name: string }) => ({
      values: (value: Record<string, unknown>) => {
        const now = new Date();

        if (table.__name === "vault") {
          const row: VaultRow = {
            id: fakeUuid(),
            slug: value.slug as string,
            name: value.name as string,
            type: value.type as VaultType,
            color: (value.color as string | null | undefined) ?? null,
            isSystemManaged: Boolean(value.isSystemManaged),
          };

          if (vaults.some((v) => v.slug === row.slug)) {
            const error = new Error("duplicate slug") as Error & { code: string };
            error.code = "23505";
            throw error;
          }

          vaults.push(row);

          return {
            returning: async (
              selection: Record<string, { config: { name: string; table: string } }>,
            ) => {
              return [
                mapSelection(
                  selection,
                  toDbShape(row as unknown as Record<string, unknown>, "vault"),
                ),
              ];
            },
          };
        }

        if (table.__name === "vault_membership") {
          const row: MembershipRow = {
            id: fakeUuid(),
            vaultId: value.vaultId as string,
            userId: value.userId as string,
            role: value.role as MembershipRole,
            isEnabled: (value.isEnabled as boolean | undefined) ?? true,
            createdAt: now,
            updatedAt: now,
          };

          const existing = memberships.find(
            (item) => item.vaultId === row.vaultId && item.userId === row.userId,
          );

          if (!existing) memberships.push(row);

          return {
            onConflictDoUpdate: ({ set }: { set: Partial<MembershipRow> }) => {
              const conflict = memberships.find(
                (item) => item.vaultId === row.vaultId && item.userId === row.userId,
              );

              if (conflict) {
                Object.assign(conflict, set, { updatedAt: new Date() });
              }

              return Promise.resolve();
            },
          };
        }

        if (table.__name === "vault_invitation") {
          const row: InvitationRow = {
            id: fakeUuid(),
            vaultId: value.vaultId as string,
            email: value.email as string,
            role: value.role as MembershipRole,
            status: (value.status as InvitationStatus | undefined) ?? "pending",
            invitedByUserId: (value.invitedByUserId as string | null | undefined) ?? null,
            expiresAt: (value.expiresAt as Date | null | undefined) ?? null,
            createdAt: now,
            updatedAt: now,
          };
          invitations.push(row);

          return {
            returning: async (
              selection: Record<string, { config: { name: string; table: string } }>,
            ) => {
              return [
                mapSelection(
                  selection,
                  toDbShape(row as unknown as Record<string, unknown>, "vault_invitation"),
                ),
              ];
            },
          };
        }

        throw new Error(`insert not implemented for ${table.__name}`);
      },
    }),
    update: (table: { __name: string }) => ({
      set: (updates: Record<string, unknown>) => ({
        where: (condition?: Condition) => ({
          returning: async (
            selection: Record<string, { config: { name: string; table: string } }>,
          ) => {
            const rows = getRowsForTable(table.__name);
            const updated: Record<string, unknown>[] = [];

            for (const row of rows) {
              const dbRow = toDbShape(row, table.__name);
              if (!matches(dbRow, condition)) continue;
              Object.assign(row, updates, { updatedAt: new Date() });
              updated.push(row);
            }

            return updated.map((row) => mapSelection(selection, toDbShape(row, table.__name)));
          },
        }),
      }),
    }),
    delete: (table: { __name: string }) => ({
      where: async (condition?: Condition) => {
        const rows = getRowsForTable(table.__name);
        for (let i = rows.length - 1; i >= 0; i--) {
          const row = rows[i];
          if (!row) continue;
          if (matches(toDbShape(row, table.__name), condition)) {
            rows.splice(i, 1);
          }
        }
      },
    }),
  },
}));

mock.module("../lib/vault-access", () => ({
  getUserMemberships: async (userId: string) => {
    return memberships
      .filter((membership) => membership.userId === userId)
      .map((membership) => {
        const joinedVault = vaults.find((item) => item.id === membership.vaultId);
        if (!joinedVault) throw new Error("vault not found");

        return {
          membershipId: membership.id,
          membershipCreatedAt: membership.createdAt,
          vaultId: joinedVault.id,
          vaultSlug: joinedVault.slug,
          vaultName: joinedVault.name,
          vaultType: joinedVault.type,
          vaultColor: joinedVault.color,
          isSystemManaged: joinedVault.isSystemManaged,
          role: membership.role,
          isEnabled: membership.isEnabled,
        };
      });
  },
  getMembershipForVault: async (userId: string, vaultId: string) => {
    const membership = memberships.find(
      (item) => item.userId === userId && item.vaultId === vaultId,
    );
    if (!membership) return null;

    const joinedVault = vaults.find((item) => item.id === membership.vaultId);
    if (!joinedVault) return null;

    return {
      membershipId: membership.id,
      membershipCreatedAt: membership.createdAt,
      vaultId: joinedVault.id,
      vaultSlug: joinedVault.slug,
      vaultName: joinedVault.name,
      vaultType: joinedVault.type,
      vaultColor: joinedVault.color,
      isSystemManaged: joinedVault.isSystemManaged,
      role: membership.role,
      isEnabled: membership.isEnabled,
    };
  },
  resolvePermissions: (vaultType: VaultType, role: MembershipRole) => {
    if (vaultType === "system_default") {
      return { canRead: true, canWrite: false, canAdmin: false, isReadOnly: true };
    }
    if (vaultType === "enterprise" && role === "member") {
      return { canRead: true, canWrite: false, canAdmin: false, isReadOnly: true };
    }
    return {
      canRead: true,
      canWrite: true,
      canAdmin: role === "owner" || role === "admin",
      isReadOnly: false,
    };
  },
}));

const { t } = await import("../trpc");
const { vaultsRouter } = await import("./vaults");

const createCaller = t.createCallerFactory(vaultsRouter);

function caller(userId: string, email: string) {
  return createCaller({ session: { user: { id: userId, email } } } as never);
}

const ENTERPRISE_VAULT_ID = "123e4567-e89b-42d3-a456-426614174001";

beforeEach(() => {
  nextId = 100;
  vaults.length = 0;
  memberships.length = 0;
  invitations.length = 0;
  users.length = 0;

  users.push(
    { id: "owner-1", name: "Owner", email: "owner@example.com" },
    { id: "admin-1", name: "Admin", email: "admin@example.com" },
    { id: "member-1", name: "Member", email: "member@example.com" },
    { id: "invitee-1", name: "Invitee", email: "invitee@example.com" },
  );

  vaults.push({
    id: ENTERPRISE_VAULT_ID,
    slug: "acme-team",
    name: "Acme Team",
    type: "enterprise",
    color: "#2f855a",
    isSystemManaged: false,
  });

  const now = new Date();
  memberships.push(
    {
      id: "123e4567-e89b-42d3-a456-426614174101",
      vaultId: ENTERPRISE_VAULT_ID,
      userId: "owner-1",
      role: "owner",
      isEnabled: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "123e4567-e89b-42d3-a456-426614174102",
      vaultId: ENTERPRISE_VAULT_ID,
      userId: "admin-1",
      role: "admin",
      isEnabled: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "123e4567-e89b-42d3-a456-426614174103",
      vaultId: ENTERPRISE_VAULT_ID,
      userId: "member-1",
      role: "member",
      isEnabled: true,
      createdAt: now,
      updatedAt: now,
    },
  );
});

describe("vaults.listMine", () => {
  test("returns memberships including disabled vaults", async () => {
    memberships[2]!.isEnabled = false;

    const result = await caller("member-1", "member@example.com").listMine();

    expect(result).toHaveLength(1);
    expect(result[0]?.isEnabled).toBe(false);
  });

  test("setEnabled persists and listMine reflects new state", async () => {
    const member = caller("member-1", "member@example.com");

    const disabled = await member.setEnabled({
      vaultId: ENTERPRISE_VAULT_ID,
      isEnabled: false,
    });
    expect(disabled.isEnabled).toBe(false);

    const mine = await member.listMine();
    expect(mine).toHaveLength(1);
    expect(mine[0]?.isEnabled).toBe(false);
  });
});

describe("vaults enterprise membership flows", () => {
  test("admin can invite member and invited user can accept from pending invites", async () => {
    const admin = caller("admin-1", "admin@example.com");
    const invitee = caller("invitee-1", "invitee@example.com");

    const invited = await admin.inviteMember({
      vaultId: ENTERPRISE_VAULT_ID,
      email: "invitee@example.com",
      role: "member",
    });

    const pending = await invitee.invitations.listPending();
    expect(pending).toHaveLength(1);
    expect(pending[0]?.id).toBe(invited.id);

    const accepted = await invitee.invitations.acceptInvitation({ invitationId: invited.id });
    expect(accepted.status).toBe("accepted");

    const membership = memberships.find(
      (item) => item.vaultId === ENTERPRISE_VAULT_ID && item.userId === "invitee-1",
    );
    expect(membership?.role).toBe("member");
  });

  test("non-admin cannot call admin membership procedures", async () => {
    const member = caller("member-1", "member@example.com");

    await expect(
      member.inviteMember({
        vaultId: ENTERPRISE_VAULT_ID,
        email: "new-person@example.com",
        role: "member",
      }),
    ).rejects.toThrow("Owner or admin role required");
  });

  test("admin can update member role", async () => {
    const admin = caller("admin-1", "admin@example.com");

    const updated = await admin.members.updateRole({
      vaultId: ENTERPRISE_VAULT_ID,
      userId: "member-1",
      role: "admin",
    });

    expect(updated.role).toBe("admin");

    const membership = memberships.find(
      (item) => item.vaultId === ENTERPRISE_VAULT_ID && item.userId === "member-1",
    );
    expect(membership?.role).toBe("admin");
  });

  test("admin can remove enterprise member", async () => {
    const admin = caller("admin-1", "admin@example.com");

    const removed = await admin.members.remove({
      vaultId: ENTERPRISE_VAULT_ID,
      userId: "member-1",
    });

    expect(removed.success).toBe(true);

    const membership = memberships.find(
      (item) => item.vaultId === ENTERPRISE_VAULT_ID && item.userId === "member-1",
    );
    expect(membership).toBeUndefined();
  });

  test("vault color updates are visible through vaults.listMine", async () => {
    const admin = caller("admin-1", "admin@example.com");

    await admin.updateColor({ vaultId: ENTERPRISE_VAULT_ID, color: "#0ea5e9" });

    const mine = await admin.listMine();
    expect(mine[0]?.vault.color).toBe("#0ea5e9");
  });
});
