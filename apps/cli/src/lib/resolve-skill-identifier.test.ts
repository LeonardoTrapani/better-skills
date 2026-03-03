import { describe, expect, mock, test } from "bun:test";

import { resolveSkillIdentifier } from "./resolve-skill-identifier";

describe("resolveSkillIdentifier", () => {
  test("resolves UUID via getById", async () => {
    const getById = mock(async () => ({ id: "skill-1" }));
    const getBySlug = mock(async () => ({ id: "unused" }));

    const skill = await resolveSkillIdentifier(
      {
        skills: {
          getById: { query: getById },
          getBySlug: { query: getBySlug },
        },
      },
      "123E4567-E89B-42D3-A456-426614174000",
      { linkMentions: false },
    );

    expect(skill).toEqual({ id: "skill-1" });
    expect(getById).toHaveBeenCalledWith({
      id: "123e4567-e89b-42d3-a456-426614174000",
      linkMentions: false,
    });
    expect(getBySlug).not.toHaveBeenCalled();
  });

  test("resolves vault-qualified slug via getBySlug(vaultSlug)", async () => {
    const getById = mock(async () => ({ id: "unused" }));
    const getBySlug = mock(async () => ({ id: "skill-2" }));

    const skill = await resolveSkillIdentifier(
      {
        skills: {
          getById: { query: getById },
          getBySlug: { query: getBySlug },
        },
      },
      "Acme/Deploy",
      { linkMentions: false },
    );

    expect(skill).toEqual({ id: "skill-2" });
    expect(getBySlug).toHaveBeenCalledWith({
      slug: "deploy",
      vaultSlug: "acme",
      linkMentions: false,
    });
    expect(getById).not.toHaveBeenCalled();
  });

  test("resolves plain slug via getBySlug without vaultSlug", async () => {
    const getById = mock(async () => ({ id: "unused" }));
    const getBySlug = mock(async () => ({ id: "skill-3" }));

    const skill = await resolveSkillIdentifier(
      {
        skills: {
          getById: { query: getById },
          getBySlug: { query: getBySlug },
        },
      },
      "deploy",
      { linkMentions: false },
    );

    expect(skill).toEqual({ id: "skill-3" });
    expect(getBySlug).toHaveBeenCalledWith({ slug: "deploy", linkMentions: false });
    expect(getById).not.toHaveBeenCalled();
  });
});
