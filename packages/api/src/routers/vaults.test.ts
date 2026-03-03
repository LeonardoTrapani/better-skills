import { beforeEach, describe, expect, mock, test } from "bun:test";

type Condition =
  | { op: "eq"; field: string; value: unknown }
  | { op: "and"; conditions: (Condition | undefined)[] };

type Membership = {
  membershipId: string;
  vaultId: string;
  vaultSlug: string;
  vaultName: string;
  vaultType: "personal" | "enterprise" | "system_default";
  vaultColor: string | null;
  isSystemManaged: boolean;
  role: "owner" | "admin" | "member";
  isEnabled: boolean;
  userId: string;
};

const memberships: Membership[] = [];

const col = (name: string) => ({ config: { name } });

mock.module("drizzle-orm", () => ({
  eq: (column: { config: { name: string } }, value: unknown): Condition => ({
    op: "eq",
    field: column.config.name,
    value,
  }),
  and: (...conditions: (Condition | undefined)[]): Condition => ({ op: "and", conditions }),
  ilike: (_column: unknown, _value: string) => ({ op: "eq", field: "status", value: "pending" }),
}));

mock.module("@better-skills/db/schema/vaults", () => ({
  vault: {
    id: col("id"),
    slug: col("slug"),
    name: col("name"),
    type: col("type"),
    color: col("color"),
  },
  vaultMembership: {
    userId: col("userId"),
    vaultId: col("vaultId"),
    isEnabled: col("isEnabled"),
  },
  vaultInvitation: {
    id: col("id"),
    vaultId: col("vaultId"),
    role: col("role"),
    status: col("status"),
    invitedByUserId: col("invitedByUserId"),
    expiresAt: col("expiresAt"),
    createdAt: col("createdAt"),
    updatedAt: col("updatedAt"),
    email: col("email"),
  },
}));

function matches(row: Record<string, unknown>, condition: Condition | undefined): boolean {
  if (!condition) return true;
  if (condition.op === "eq") return row[condition.field] === condition.value;
  return condition.conditions.every((c) => matches(row, c));
}

mock.module("@better-skills/db", () => ({
  db: {
    update: (_table: unknown) => ({
      set: (updates: Partial<Membership>) => ({
        where: (condition?: Condition) => ({
          returning: async () => {
            const updated = memberships.filter((m) =>
              matches(m as unknown as Record<string, unknown>, condition),
            );
            for (const row of updated) Object.assign(row, updates);
            return updated.map((row) => ({ vaultId: row.vaultId, isEnabled: row.isEnabled }));
          },
        }),
      }),
    }),
    select: () => ({
      from: () => ({
        innerJoin: () => ({ where: async () => [] }),
      }),
    }),
  },
}));

mock.module("../lib/vault-access", () => ({
  getUserMemberships: async (userId: string) => memberships.filter((m) => m.userId === userId),
  resolvePermissions: (vaultType: Membership["vaultType"], role: Membership["role"]) => {
    if (vaultType === "system_default") {
      return { canRead: true, canWrite: false, canAdmin: false, isReadOnly: true };
    }
    if (vaultType === "enterprise" && role === "member") {
      return { canRead: true, canWrite: false, canAdmin: false, isReadOnly: true };
    }
    return { canRead: true, canWrite: true, canAdmin: role === "owner", isReadOnly: false };
  },
  getEnabledVaultIds: async (userId: string) =>
    memberships.filter((m) => m.userId === userId && m.isEnabled).map((m) => m.vaultId),
}));

const { t } = await import("../trpc");
const { vaultsRouter } = await import("./vaults");
const { getEnabledVaultIds } = await import("../lib/vault-access");

const createCaller = t.createCallerFactory(vaultsRouter);

function caller(userId: string, email: string) {
  return createCaller({ session: { user: { id: userId, email } } } as never);
}

beforeEach(() => {
  memberships.length = 0;
  memberships.push(
    {
      membershipId: "123e4567-e89b-42d3-a456-426614174001",
      vaultId: "123e4567-e89b-42d3-a456-426614174011",
      vaultSlug: "personal-user-1",
      vaultName: "Personal",
      vaultType: "personal",
      vaultColor: "#1f6feb",
      isSystemManaged: false,
      role: "owner",
      isEnabled: true,
      userId: "user-1",
    },
    {
      membershipId: "123e4567-e89b-42d3-a456-426614174002",
      vaultId: "123e4567-e89b-42d3-a456-426614174012",
      vaultSlug: "system-default",
      vaultName: "System Default",
      vaultType: "system_default",
      vaultColor: null,
      isSystemManaged: true,
      role: "member",
      isEnabled: false,
      userId: "user-1",
    },
  );
});

describe("vaults.listMine", () => {
  test("returns memberships including disabled vaults", async () => {
    const result = await caller("user-1", "user@example.com").listMine();

    expect(result).toHaveLength(2);
    expect(result.some((row) => row.isEnabled === false)).toBe(true);
  });
});

describe("vaults.setEnabled", () => {
  test("toggle changes enabled vault ids used by skill readers", async () => {
    const c = caller("user-1", "user@example.com");

    const before = await getEnabledVaultIds("user-1");
    expect(before).toEqual(["123e4567-e89b-42d3-a456-426614174011"]);

    await c.setEnabled({
      vaultId: "123e4567-e89b-42d3-a456-426614174012",
      isEnabled: true,
    });

    const after = await getEnabledVaultIds("user-1");
    expect(new Set(after)).toEqual(
      new Set(["123e4567-e89b-42d3-a456-426614174011", "123e4567-e89b-42d3-a456-426614174012"]),
    );
  });
});
