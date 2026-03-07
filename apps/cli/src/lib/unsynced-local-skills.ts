import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import matter from "gray-matter";

import type { SupportedAgent } from "./agents";
import { formatAgentDisplayNames, getAgentSkillDir, groupAgentsBySkillDir } from "./agents";

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
  const grouped: UnsyncedSkillsByAgent[] = [];

  for (const group of groupAgentsBySkillDir([...new Set(agents)])) {
    const skillsDir = getAgentSkillDir(group.agents[0]!);
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
      displayName: formatAgentDisplayNames(group.agents, " / "),
      skillsDir,
      slugs: [...slugs].sort((a, b) => a.localeCompare(b)),
    });
  }

  return grouped;
}
