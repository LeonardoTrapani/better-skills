import { describe, expect, test } from "bun:test";

import { formatVaultName, formatVaultSkillLabel, formatVaultWithType } from "./vault-display";

describe("formatVaultName", () => {
  test("returns trimmed vault name", () => {
    expect(
      formatVaultName({
        name: "  Team Alpha  ",
        type: "enterprise",
      }),
    ).toBe("Team Alpha");
  });

  test("falls back when name is empty", () => {
    expect(
      formatVaultName({
        name: "   ",
        type: "personal",
      }),
    ).toBe("unnamed vault");
  });
});

describe("formatVaultWithType", () => {
  test("shows friendly type label", () => {
    expect(
      formatVaultWithType({
        name: "Default Skills",
        type: "system_default",
      }),
    ).toBe("Default Skills (default)");
  });
});

describe("formatVaultSkillLabel", () => {
  test("uses vault name and skill label", () => {
    expect(
      formatVaultSkillLabel(
        {
          name: "Acme Team",
          type: "enterprise",
        },
        "Deploy Skill",
      ),
    ).toBe("Acme Team / Deploy Skill");
  });
});
