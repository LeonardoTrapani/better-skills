import { describe, expect, test } from "bun:test";

import { buildVaultScopedInstallKey, collectStaleVaultScopedKeys } from "./vault-sync";

describe("buildVaultScopedInstallKey", () => {
  test("namespaces identical skill slugs by vault", () => {
    const personal = buildVaultScopedInstallKey("personal-jane", "deploy");
    const enterprise = buildVaultScopedInstallKey("acme-team", "deploy");

    expect(personal).toBe("personal-jane--deploy");
    expect(enterprise).toBe("acme-team--deploy");
    expect(personal).not.toBe(enterprise);
  });
});

describe("collectStaleVaultScopedKeys", () => {
  test("returns stale keys only", () => {
    const serverSkillIds = new Set(["skill-1", "skill-3"]);
    const lockSkillIdsByKey = new Map<string, string>([
      ["acme--deploy", "skill-1"],
      ["personal-jane--deploy", "skill-2"],
      ["default--readme", "skill-3"],
    ]);

    const stale = collectStaleVaultScopedKeys(serverSkillIds, lockSkillIdsByKey);
    expect(stale).toEqual(["personal-jane--deploy"]);
  });
});
