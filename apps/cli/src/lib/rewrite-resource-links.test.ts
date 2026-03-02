import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, test } from "bun:test";

import {
  rewriteLinksInSkillFolder,
  rewriteResourceLinksInMarkdown,
  resolveToKnownFile,
} from "./rewrite-resource-links";

function resourceSet(...paths: string[]): Set<string> {
  return new Set(paths);
}

describe("rewriteResourceLinksInMarkdown", () => {
  test("rewrites markdown links, autolinks, wikilinks, and bare local paths", () => {
    const source = [
      "See [Guide](references/guide.md).",
      "Also <references/guide.md#intro>.",
      "And [[references/guide.md|Guide]].",
      "Tree entry -> references/guide.md",
    ].join("\n");

    const result = rewriteResourceLinksInMarkdown(
      source,
      "SKILL.md",
      resourceSet("references/guide.md"),
    );

    expect(result.replacements).toBe(4);
    expect(result.text).toBe(
      [
        "See [[resource:new:references/guide.md]].",
        "Also [[resource:new:references/guide.md]].",
        "And [[resource:new:references/guide.md]].",
        "Tree entry -> [[resource:new:references/guide.md]]",
      ].join("\n"),
    );
  });

  test("resolves relative local paths from nested files", () => {
    const source = "Read ../guide.md then ./local.md and ../../scripts/setup.ts";
    const result = rewriteResourceLinksInMarkdown(
      source,
      "references/setup/flow.md",
      resourceSet("references/guide.md", "references/setup/local.md", "scripts/setup.ts"),
    );

    expect(result.replacements).toBe(3);
    expect(result.text).toBe(
      "Read [[resource:new:references/guide.md]] then [[resource:new:references/setup/local.md]] and [[resource:new:scripts/setup.ts]]",
    );
  });

  test("rewrites tree-style plain references with anchors", () => {
    const source = "├─ Specify build outputs → references/configuration/tasks.md#outputs";
    const result = rewriteResourceLinksInMarkdown(
      source,
      "SKILL.md",
      resourceSet("references/configuration/tasks.md"),
    );

    expect(result.replacements).toBe(1);
    expect(result.text).toBe(
      "├─ Specify build outputs → [[resource:new:references/configuration/tasks.md]]",
    );
  });

  test("normalizes windows separators and strips hash/query parts", () => {
    const source = ["- references\\guide.md#top", "- [Guide](.\\references\\guide.md?raw=1)"].join(
      "\n",
    );

    const result = rewriteResourceLinksInMarkdown(
      source,
      "SKILL.md",
      resourceSet("references/guide.md"),
    );

    expect(result.replacements).toBe(2);
    expect(result.text).toBe(
      ["- [[resource:new:references/guide.md]]", "- [[resource:new:references/guide.md]]"].join(
        "\n",
      ),
    );
  });

  test("skips fenced code blocks and inline code", () => {
    const source = [
      "Inline `references/guide.md` should stay.",
      "```md",
      "references/guide.md",
      "[Guide](references/guide.md)",
      "```",
      "Outside references/guide.md should change.",
    ].join("\n");

    const result = rewriteResourceLinksInMarkdown(
      source,
      "SKILL.md",
      resourceSet("references/guide.md"),
    );

    expect(result.replacements).toBe(1);
    expect(result.text).toBe(
      [
        "Inline `references/guide.md` should stay.",
        "```md",
        "references/guide.md",
        "[Guide](references/guide.md)",
        "```",
        "Outside [[resource:new:references/guide.md]] should change.",
      ].join("\n"),
    );
  });

  test("skips escaped forms and tokens starting with backslash", () => {
    const source = [
      "\\references/guide.md",
      "\\[Guide](references/guide.md)",
      "[Guide](\\references\\guide.md)",
      "references\\guide.md",
    ].join("\n");

    const result = rewriteResourceLinksInMarkdown(
      source,
      "SKILL.md",
      resourceSet("references/guide.md"),
    );

    expect(result.replacements).toBe(1);
    expect(result.text).toBe(
      [
        "\\references/guide.md",
        "\\[Guide](references/guide.md)",
        "[Guide](\\references\\guide.md)",
        "[[resource:new:references/guide.md]]",
      ].join("\n"),
    );
  });

  test("does not rewrite external urls or missing local files", () => {
    const source = [
      "https://example.com/references/guide.md",
      "[External](https://example.com/references/guide.md)",
      "references/missing.md",
    ].join("\n");

    const result = rewriteResourceLinksInMarkdown(
      source,
      "SKILL.md",
      resourceSet("references/guide.md"),
    );

    expect(result.replacements).toBe(0);
    expect(result.text).toBe(source);
  });

  test("is idempotent after the first rewrite", () => {
    const input = "See [Guide](references/guide.md) and references/guide.md";
    const first = rewriteResourceLinksInMarkdown(
      input,
      "SKILL.md",
      resourceSet("references/guide.md"),
    );
    const second = rewriteResourceLinksInMarkdown(
      first.text,
      "SKILL.md",
      resourceSet("references/guide.md"),
    );

    expect(first.replacements).toBe(2);
    expect(second.replacements).toBe(0);
    expect(second.text).toBe(first.text);
  });
});

describe("resolveToKnownFile", () => {
  function makeIndex(paths: string[]) {
    const allPaths = new Set(paths);
    const byBasename = new Map<string, string[]>();
    for (const p of paths) {
      const key = p.split("/").pop()!.toLowerCase();
      const bucket = byBasename.get(key);
      if (bucket) bucket.push(p);
      else byBasename.set(key, [p]);
    }
    return { allPaths, byBasename };
  }

  test("resolves absolute path from skill root", () => {
    const index = makeIndex(["references/guide.md", "scripts/setup.ts"]);
    expect(resolveToKnownFile("references/guide.md", "SKILL.md", index)).toBe(
      "references/guide.md",
    );
  });

  test("resolves relative path from nested file", () => {
    const index = makeIndex(["references/guide.md", "references/setup/flow.md"]);
    expect(resolveToKnownFile("../guide.md", "references/setup/flow.md", index)).toBe(
      "references/guide.md",
    );
  });

  test("resolves unambiguous basename fallback", () => {
    const index = makeIndex(["references/deep/nested/unique-file.md"]);
    expect(resolveToKnownFile("unique-file.md", "SKILL.md", index)).toBe(
      "references/deep/nested/unique-file.md",
    );
  });

  test("returns null for ambiguous basename (multiple files with same name)", () => {
    const index = makeIndex(["references/a/config.md", "references/b/config.md"]);
    expect(resolveToKnownFile("config.md", "SKILL.md", index)).toBeNull();
  });

  test("rejects path traversal above skill root", () => {
    const index = makeIndex(["references/guide.md"]);
    expect(resolveToKnownFile("../../etc/passwd", "references/setup/flow.md", index)).toBeNull();
  });

  test("returns null for external URLs", () => {
    const index = makeIndex(["references/guide.md"]);
    expect(resolveToKnownFile("https://example.com/guide.md", "SKILL.md", index)).toBeNull();
    expect(resolveToKnownFile("mailto:user@example.com", "SKILL.md", index)).toBeNull();
  });

  test("strips fragment and query before resolving", () => {
    const index = makeIndex(["references/guide.md"]);
    expect(resolveToKnownFile("references/guide.md#section", "SKILL.md", index)).toBe(
      "references/guide.md",
    );
    expect(resolveToKnownFile("references/guide.md?raw=1", "SKILL.md", index)).toBe(
      "references/guide.md",
    );
  });

  test("returns null for fragment-only references", () => {
    const index = makeIndex(["references/guide.md"]);
    expect(resolveToKnownFile("#section", "SKILL.md", index)).toBeNull();
  });

  test("returns null for missing files", () => {
    const index = makeIndex(["references/guide.md"]);
    expect(resolveToKnownFile("references/missing.md", "SKILL.md", index)).toBeNull();
  });
});

describe("rewriteResourceLinksInMarkdown – additional patterns", () => {
  test("does not double-rewrite existing [[resource:new:...]] tokens", () => {
    const source = "Already converted: [[resource:new:references/guide.md]]";
    const result = rewriteResourceLinksInMarkdown(
      source,
      "SKILL.md",
      resourceSet("references/guide.md"),
    );
    expect(result.replacements).toBe(0);
    expect(result.text).toBe(source);
  });

  test("handles table cells with markdown links", () => {
    const source = "| Feature | [Docs](references/guide.md) | Status |";
    const result = rewriteResourceLinksInMarkdown(
      source,
      "SKILL.md",
      resourceSet("references/guide.md"),
    );
    expect(result.replacements).toBe(1);
    expect(result.text).toBe("| Feature | [[resource:new:references/guide.md]] | Status |");
  });

  test("resolves basename fallback in markdown links", () => {
    const source = "[Guide](guide.md)";
    const result = rewriteResourceLinksInMarkdown(
      source,
      "SKILL.md",
      resourceSet("references/guide.md"),
    );
    expect(result.replacements).toBe(1);
    expect(result.text).toBe("[[resource:new:references/guide.md]]");
  });

  test("does not resolve ambiguous basename", () => {
    const source = "[Config](config.md)";
    const result = rewriteResourceLinksInMarkdown(
      source,
      "SKILL.md",
      resourceSet("references/a/config.md", "references/b/config.md"),
    );
    expect(result.replacements).toBe(0);
    expect(result.text).toBe(source);
  });

  test("turborepo-style tree references with arrows", () => {
    const source = [
      "├─ Configure caching → references/configuration/caching.md#remote-caching",
      "└─ Task pipelines → references/configuration/tasks.md",
    ].join("\n");
    const result = rewriteResourceLinksInMarkdown(
      source,
      "SKILL.md",
      resourceSet("references/configuration/caching.md", "references/configuration/tasks.md"),
    );
    expect(result.replacements).toBe(2);
    expect(result.text).toBe(
      [
        "├─ Configure caching → [[resource:new:references/configuration/caching.md]]",
        "└─ Task pipelines → [[resource:new:references/configuration/tasks.md]]",
      ].join("\n"),
    );
  });

  test("opentui-style relative links from nested reference files", () => {
    const source = [
      "See [Core API](../core/REFERENCE.md) for details.",
      "Also check [React](../react/REFERENCE.md#hooks).",
    ].join("\n");
    const result = rewriteResourceLinksInMarkdown(
      source,
      "references/solid/REFERENCE.md",
      resourceSet(
        "references/core/REFERENCE.md",
        "references/react/REFERENCE.md",
        "references/solid/REFERENCE.md",
      ),
    );
    expect(result.replacements).toBe(2);
    expect(result.text).toBe(
      [
        "See [[resource:new:references/core/REFERENCE.md]] for details.",
        "Also check [[resource:new:references/react/REFERENCE.md]].",
      ].join("\n"),
    );
  });

  test("next-best-practices-style ./relative links", () => {
    const source =
      "Read [routing](./references/routing.md) and [caching](./references/caching.md).";
    const result = rewriteResourceLinksInMarkdown(
      source,
      "SKILL.md",
      resourceSet("references/routing.md", "references/caching.md"),
    );
    expect(result.replacements).toBe(2);
    expect(result.text).toBe(
      "Read [[resource:new:references/routing.md]] and [[resource:new:references/caching.md]].",
    );
  });

  test("skips tilde-fenced code blocks", () => {
    const source = [
      "Before references/guide.md",
      "~~~",
      "references/guide.md",
      "~~~",
      "After references/guide.md",
    ].join("\n");
    const result = rewriteResourceLinksInMarkdown(
      source,
      "SKILL.md",
      resourceSet("references/guide.md"),
    );
    expect(result.replacements).toBe(2);
    expect(result.text).toContain("~~~\nreferences/guide.md\n~~~");
  });
});

describe("rewriteLinksInSkillFolder", () => {
  test("supports dry-run and write mode", async () => {
    const folder = await mkdtemp(join(tmpdir(), "better-skills-rewrite-links-"));

    await mkdir(join(folder, "references", "setup"), { recursive: true });
    await mkdir(join(folder, "scripts"), { recursive: true });

    await writeFile(join(folder, "references", "guide.md"), "# guide\n", "utf8");
    await writeFile(
      join(folder, "references", "setup", "flow.md"),
      "Read ../guide.md then ../../scripts/setup.ts\n",
      "utf8",
    );
    await writeFile(join(folder, "scripts", "setup.ts"), "#!/usr/bin/env bun\n", "utf8");

    await writeFile(
      join(folder, "SKILL.md"),
      [
        "---",
        "name: rewrite-test",
        "description: rewrite",
        "---",
        "",
        "See [Guide](references/guide.md)",
        "And references/setup/flow.md",
      ].join("\n"),
      "utf8",
    );

    const before = await readFile(join(folder, "SKILL.md"), "utf8");

    const dryRun = await rewriteLinksInSkillFolder(folder, { dryRun: true });
    expect(dryRun.filesChanged).toBe(2);
    expect(dryRun.replacements).toBe(4);

    const afterDryRun = await readFile(join(folder, "SKILL.md"), "utf8");
    expect(afterDryRun).toBe(before);

    const write = await rewriteLinksInSkillFolder(folder);
    expect(write.filesChanged).toBe(2);
    expect(write.replacements).toBe(4);

    const afterWriteSkill = await readFile(join(folder, "SKILL.md"), "utf8");
    const afterWriteFlow = await readFile(join(folder, "references", "setup", "flow.md"), "utf8");

    expect(afterWriteSkill).toContain("[[resource:new:references/guide.md]]");
    expect(afterWriteSkill).toContain("[[resource:new:references/setup/flow.md]]");
    expect(afterWriteFlow).toContain("[[resource:new:references/guide.md]]");
    expect(afterWriteFlow).toContain("[[resource:new:scripts/setup.ts]]");
  });
});
