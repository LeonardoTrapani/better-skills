import { describe, expect, mock, test } from "bun:test";

// ── mock db ──

type MembershipRow = {
  membershipId: string;
  vaultId: string;
  vaultSlug: string;
  vaultName: string;
  vaultType: string;
  vaultColor: string | null;
  isSystemManaged: boolean;
  role: string;
  isEnabled: boolean;
};

type VaultRow = {
  id: string;
  slug: string;
  name: string;
  type: string;
  color: string | null;
};

let membershipRows: MembershipRow[] = [];
let vaultRows: VaultRow[] = [];

const drizzleNameSym = Symbol.for("drizzle:Name");

function getTableName(table: unknown): string {
  if (table && typeof table === "object" && drizzleNameSym in table) {
    return (table as Record<symbol, string>)[drizzleNameSym]!;
  }
  return "unknown";
}

mock.module("@better-skills/db", () => {
  const createChain = () => {
    const chain: Record<string, unknown> = {};

    const queryResult = <T>(rows: T[]) => ({
      limit: (n: number) => ({
        execute: async () => rows.slice(0, n),
      }),
      execute: async () => rows,
    });

    chain.select = (_fields?: unknown) => ({
      from: (table: unknown) => {
        const tableName = getTableName(table);

        const buildResult = () => {
          if (tableName === "vault_membership") {
            let filtered = [...membershipRows];
            // the query always joins vault, so return membership rows
            return queryResult(filtered);
          }
          if (tableName === "vault") {
            return queryResult([...vaultRows]);
          }
          return queryResult([]);
        };

        return {
          innerJoin: (_joinTable: unknown, _condition: unknown) => ({
            where: (_condition?: unknown) => buildResult(),
          }),
          where: (_condition?: unknown) => buildResult(),
        };
      },
    });

    return chain;
  };

  return { db: createChain() };
});

// import after mock
const { resolvePermissions, VaultAccessError } = await import("./vault-access");

// ── resolvePermissions tests (pure logic, no db) ──

describe("resolvePermissions", () => {
  describe("system_default vault", () => {
    test("member is read-only", () => {
      const p = resolvePermissions("system_default", "member");
      expect(p.canRead).toBe(true);
      expect(p.canWrite).toBe(false);
      expect(p.canAdmin).toBe(false);
      expect(p.isReadOnly).toBe(true);
    });

    test("owner is still read-only (system default overrides role)", () => {
      const p = resolvePermissions("system_default", "owner");
      expect(p.canRead).toBe(true);
      expect(p.canWrite).toBe(false);
      expect(p.canAdmin).toBe(false);
      expect(p.isReadOnly).toBe(true);
    });

    test("admin is still read-only", () => {
      const p = resolvePermissions("system_default", "admin");
      expect(p.canWrite).toBe(false);
      expect(p.isReadOnly).toBe(true);
    });
  });

  describe("personal vault", () => {
    test("owner has full access", () => {
      const p = resolvePermissions("personal", "owner");
      expect(p.canRead).toBe(true);
      expect(p.canWrite).toBe(true);
      expect(p.canAdmin).toBe(true);
      expect(p.isReadOnly).toBe(false);
    });
  });

  describe("enterprise vault", () => {
    test("owner has full access with admin", () => {
      const p = resolvePermissions("enterprise", "owner");
      expect(p.canRead).toBe(true);
      expect(p.canWrite).toBe(true);
      expect(p.canAdmin).toBe(true);
      expect(p.isReadOnly).toBe(false);
    });

    test("admin can read and write but not admin", () => {
      const p = resolvePermissions("enterprise", "admin");
      expect(p.canRead).toBe(true);
      expect(p.canWrite).toBe(true);
      expect(p.canAdmin).toBe(false);
      expect(p.isReadOnly).toBe(false);
    });

    test("member is read-only", () => {
      const p = resolvePermissions("enterprise", "member");
      expect(p.canRead).toBe(true);
      expect(p.canWrite).toBe(false);
      expect(p.canAdmin).toBe(false);
      expect(p.isReadOnly).toBe(true);
    });
  });

  describe("full permission matrix", () => {
    const matrix: Array<{
      type: "personal" | "enterprise" | "system_default";
      role: "owner" | "admin" | "member";
      read: boolean;
      write: boolean;
      admin: boolean;
    }> = [
      { type: "personal", role: "owner", read: true, write: true, admin: true },
      { type: "enterprise", role: "owner", read: true, write: true, admin: true },
      { type: "enterprise", role: "admin", read: true, write: true, admin: false },
      { type: "enterprise", role: "member", read: true, write: false, admin: false },
      { type: "system_default", role: "owner", read: true, write: false, admin: false },
      { type: "system_default", role: "admin", read: true, write: false, admin: false },
      { type: "system_default", role: "member", read: true, write: false, admin: false },
    ];

    for (const { type, role, read, write, admin } of matrix) {
      test(`${type}/${role}: read=${read} write=${write} admin=${admin}`, () => {
        const p = resolvePermissions(type, role);
        expect(p.canRead).toBe(read);
        expect(p.canWrite).toBe(write);
        expect(p.canAdmin).toBe(admin);
      });
    }
  });
});

describe("VaultAccessError", () => {
  test("has correct code and message", () => {
    const err = new VaultAccessError("FORBIDDEN", "No write access");
    expect(err.code).toBe("FORBIDDEN");
    expect(err.message).toBe("No write access");
    expect(err.name).toBe("VaultAccessError");
    expect(err).toBeInstanceOf(Error);
  });

  test("NOT_FOUND code", () => {
    const err = new VaultAccessError("NOT_FOUND", "Vault missing");
    expect(err.code).toBe("NOT_FOUND");
  });
});
