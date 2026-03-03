import { describe, expect, test } from "bun:test";

import { formatAmbiguousSlugMessage, parseSkillIdentifier } from "./vault-identifiers";

describe("parseSkillIdentifier", () => {
  test("parses uuid identifiers", () => {
    const parsed = parseSkillIdentifier("123E4567-E89B-42D3-A456-426614174000");
    expect(parsed).toEqual({
      kind: "uuid",
      id: "123e4567-e89b-42d3-a456-426614174000",
    });
  });

  test("parses <vault-slug>/<skill-slug> identifiers", () => {
    const parsed = parseSkillIdentifier("Acme-Team/Build-Agent");
    expect(parsed).toEqual({
      kind: "vault-slug",
      vaultSlug: "acme-team",
      skillSlug: "build-agent",
    });
  });

  test("falls back to plain slug", () => {
    const parsed = parseSkillIdentifier("my-skill");
    expect(parsed).toEqual({ kind: "slug", slug: "my-skill" });
  });
});

describe("formatAmbiguousSlugMessage", () => {
  test("renders deterministic candidate list", () => {
    const message = formatAmbiguousSlugMessage("deploy", [
      { vaultSlug: "zeta", vaultName: "Zeta Vault" },
      { vaultSlug: "acme", vaultName: "Acme Team" },
    ]);

    expect(message).toContain('ambiguous skill slug "deploy"');
    expect(message).toContain("- acme/deploy (Acme Team)");
    expect(message).toContain("- zeta/deploy (Zeta Vault)");
    expect(message.indexOf("acme/deploy")).toBeLessThan(message.indexOf("zeta/deploy"));
  });
});
