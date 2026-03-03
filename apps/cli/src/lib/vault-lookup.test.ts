import { describe, expect, test } from "bun:test";

import { matchesVaultSelector, type VaultMembership } from "./vault-lookup";

function makeMembership(overrides: Partial<VaultMembership> = {}): VaultMembership {
  return {
    membershipId: "123e4567-e89b-42d3-a456-426614174001",
    vaultId: "123e4567-e89b-42d3-a456-426614174000",
    role: "owner",
    isEnabled: true,
    canRead: true,
    canWrite: true,
    canAdmin: true,
    isReadOnly: false,
    vault: {
      id: "123e4567-e89b-42d3-a456-426614174000",
      slug: "acme-vault",
      name: "Acme Vault",
      type: "enterprise",
      color: null,
      isSystemManaged: false,
    },
    ...overrides,
  };
}

describe("matchesVaultSelector", () => {
  test("matches by vault slug (case-insensitive)", () => {
    const membership = makeMembership();
    expect(matchesVaultSelector("Acme-Vault", membership)).toBe(true);
  });

  test("matches by vault id (case-insensitive)", () => {
    const membership = makeMembership();
    expect(matchesVaultSelector("123E4567-E89B-42D3-A456-426614174000", membership)).toBe(true);
  });

  test("returns false when selector does not match", () => {
    const membership = makeMembership();
    expect(matchesVaultSelector("other-vault", membership)).toBe(false);
  });
});
