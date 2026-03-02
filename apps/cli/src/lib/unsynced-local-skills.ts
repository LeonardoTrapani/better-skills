import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import matter from "gray-matter";

import type { SupportedAgent } from "./agents";
import { getAgentDisplayName, getAgentSkillDir } from "./agents";

const INSTALL_METADATA_FILE = ".better-skills-install.json";

export type UnsyncedSkillsByAgent = {
  displayName: string;
  skillsDir: string;
  slugs: string[];
};

function readSkillSlug(skillMarkdown: string, fallback: string): string {
  try {
    const { data } = matter(skillMarkdown);
    const parsed = typeof data.slug === "string" ? data.slug.trim() : "";
    return parsed || fallback;
  } catch {
    return fallback;
  }
}

export async function findUnsyncedLocalSkills(
  agents: SupportedAgent[],
): Promise<UnsyncedSkillsByAgent[]> {
  const uniqueAgents = [...new Set(agents)];
  const grouped: UnsyncedSkillsByAgent[] = [];

  for (const agent of uniqueAgents) {
    const skillsDir = getAgentSkillDir(agent);
    const entries = await readdir(skillsDir, { withFileTypes: true }).catch(() => []);
    const slugs = new Set<string>();

    for (const entry of entries) {
      if (!entry.isDirectory() && !entry.isSymbolicLink()) {
        continue;
      }

      const skillDir = join(skillsDir, entry.name);
      const skillMarkdown = await readFile(join(skillDir, "SKILL.md"), "utf8").catch(() => null);
      if (!skillMarkdown) {
        continue;
      }

      const installMetadata = await readFile(join(skillDir, INSTALL_METADATA_FILE), "utf8").catch(
        () => null,
      );

      if (installMetadata) {
        continue;
      }

      slugs.add(readSkillSlug(skillMarkdown, entry.name));
    }

    grouped.push({
      displayName: getAgentDisplayName(agent),
      skillsDir,
      slugs: [...slugs].sort((a, b) => a.localeCompare(b)),
    });
  }

  return grouped;
}
