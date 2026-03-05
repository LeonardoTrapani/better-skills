import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, test } from "bun:test";

import { loadLocalSkillDraft, scanResources } from "./skill-io";

async function createTempSkillFolder(name: string): Promise<string> {
  return await mkdtemp(join(tmpdir(), `${name}-`));
}

describe("scanResources", () => {
  test("scans all local subpaths and keeps non-standard folders as kind=other", async () => {
    const folder = await createTempSkillFolder("better-skills-scan-resources");

    await mkdir(join(folder, "reference"), { recursive: true });
    await mkdir(join(folder, "references"), { recursive: true });

    await writeFile(join(folder, "SKILL.md"), "---\nname: t\ndescription: t\n---\n", "utf8");
    await writeFile(join(folder, "reference", "guide.md"), "guide\n", "utf8");
    await writeFile(join(folder, "references", "faq.md"), "faq\n", "utf8");

    const resources = await scanResources(folder);

    expect(resources.map((r) => r.path)).toEqual(["reference/guide.md", "references/faq.md"]);
    expect(resources.find((r) => r.path === "reference/guide.md")?.kind).toBe("other");
    expect(resources.find((r) => r.path === "references/faq.md")?.kind).toBe("reference");
  });
});

describe("loadLocalSkillDraft", () => {
  test("accepts :new: mentions targeting non-standard subpaths", async () => {
    const folder = await createTempSkillFolder("better-skills-load-draft-subpath");

    await mkdir(join(folder, "reference"), { recursive: true });
    await writeFile(join(folder, "reference", "guide.md"), "guide\n", "utf8");
    await writeFile(
      join(folder, "SKILL.md"),
      [
        "---",
        "name: test-skill",
        "description: validate draft loading",
        "---",
        "",
        "Use [[resource:new:reference/guide.md]]",
      ].join("\n"),
      "utf8",
    );

    const draft = await loadLocalSkillDraft(folder);

    expect(draft.newResourcePaths).toEqual(["reference/guide.md"]);
    expect(draft.resources.map((r) => r.path)).toContain("reference/guide.md");
  });
});
