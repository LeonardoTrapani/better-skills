import pc from "picocolors";

import { getAgentDisplayName, resolveInstallAgents } from "../lib/agents";
import type { SupportedAgent } from "../lib/agents";
import { readErrorMessage } from "../lib/errors";
import {
  installSkill,
  readInstallLock,
  uninstallSkill,
  type InstallableSkill,
} from "../lib/skills-installer";
import { formatVaultSkillLabel } from "../lib/vault-display";
import { buildVaultScopedInstallKey, collectStaleVaultScopedKeys } from "../lib/vault-sync";
import { trpc } from "../lib/trpc";
import * as ui from "../lib/ui";

const SYNC_PAGE_LIMIT = 100;

type SkillListOutput = Awaited<ReturnType<typeof trpc.skills.listByOwner.query>>;
type SkillListItem = SkillListOutput["items"][number];
type SkillDetails = Awaited<ReturnType<typeof trpc.skills.getBySlug.query>>;

export type SyncRunResult = {
  ok: boolean;
  authenticated: boolean;
  totalSkills: number;
  syncedSkills: number;
  failedSkills: number;
  removedStaleSkills: number;
};

function toInstallableSkill(skill: SkillDetails): InstallableSkill {
  return {
    id: skill.id,
    slug: skill.slug,
    name: skill.name,
    description: skill.description,
    originalMarkdown: skill.originalMarkdown,
    renderedMarkdown: skill.renderedMarkdown,
    frontmatter: skill.frontmatter,
    resources: skill.resources.map((resource) => ({
      path: resource.path,
      content: resource.renderedContent,
    })),
    vault: skill.vault,
    sourceUrl: skill.sourceUrl,
    sourceIdentifier: skill.sourceIdentifier,
  };
}

async function fetchAllSkills(): Promise<SkillListItem[]> {
  const items: SkillListItem[] = [];
  let cursor: string | undefined;

  for (;;) {
    const result = await trpc.skills.listByOwner.query({
      limit: SYNC_PAGE_LIMIT,
      cursor,
    });

    items.push(...result.items);

    if (!result.nextCursor) {
      return items;
    }

    cursor = result.nextCursor;
  }
}

export async function syncSkills(selectedAgents: SupportedAgent[]): Promise<SyncRunResult> {
  ui.log.info(`targets: ${selectedAgents.map((agent) => getAgentDisplayName(agent)).join(", ")}`);

  const authSpinner = ui.spinner();
  authSpinner.start("checking authentication");

  try {
    await trpc.me.query();
    authSpinner.stop(pc.green("authenticated"));
  } catch {
    authSpinner.stop(pc.red("not authenticated - run better-skills login"));
    return {
      ok: false,
      authenticated: false,
      totalSkills: 0,
      syncedSkills: 0,
      failedSkills: 0,
      removedStaleSkills: 0,
    };
  }

  const fetchSpinner = ui.spinner();
  fetchSpinner.start("loading skills");

  let skillsToSync: SkillListItem[];
  try {
    skillsToSync = await fetchAllSkills();
  } catch (error) {
    fetchSpinner.stop(pc.red(`failed to load skills: ${readErrorMessage(error)}`));
    return {
      ok: false,
      authenticated: true,
      totalSkills: 0,
      syncedSkills: 0,
      failedSkills: 0,
      removedStaleSkills: 0,
    };
  }

  if (skillsToSync.length === 0) {
    fetchSpinner.stop(pc.dim("no skills to sync"));
    return {
      ok: true,
      authenticated: true,
      totalSkills: 0,
      syncedSkills: 0,
      failedSkills: 0,
      removedStaleSkills: 0,
    };
  }

  fetchSpinner.stop(pc.green(`syncing ${skillsToSync.length} skill(s)`));

  const serverSkillIds = new Set(skillsToSync.map((s) => s.id));
  const expectedServerKeys = new Set(
    skillsToSync.map((skill) => buildVaultScopedInstallKey(skill.vault.slug, skill.slug)),
  );

  let synced = 0;
  let failed = 0;

  for (const [index, item] of skillsToSync.entries()) {
    const installKey = buildVaultScopedInstallKey(item.vault.slug, item.slug);
    const skillLabel = formatVaultSkillLabel(item.vault, item.name);
    const spinner = ui.spinner();
    spinner.start(`syncing ${skillLabel} (${index + 1}/${skillsToSync.length})`);

    try {
      const skill = await trpc.skills.getById.query({ id: item.id, linkMentions: false });
      await installSkill(toInstallableSkill(skill), selectedAgents, { skillFolder: installKey });
      synced += 1;
      spinner.stop(pc.green(`synced ${skillLabel}`));
    } catch (error) {
      failed += 1;
      spinner.stop(pc.red(`failed ${skillLabel}: ${readErrorMessage(error)}`));
    }
  }

  // prune skills that no longer exist on the server
  const latestLock = await readInstallLock();
  const lockSkillIdsByKey = new Map(
    Object.entries(latestLock.skills).map(([key, entry]) => [key, entry.skillId]),
  );
  const staleKeys = collectStaleVaultScopedKeys(
    expectedServerKeys,
    serverSkillIds,
    lockSkillIdsByKey,
  );
  const staleEntries = staleKeys
    .map((key) => {
      const entry = latestLock.skills[key];
      if (!entry) return null;
      return [key, entry] as const;
    })
    .filter((entry): entry is readonly [string, (typeof latestLock.skills)[string]] =>
      Boolean(entry),
    );

  let removedStaleSkills = 0;

  if (staleEntries.length > 0) {
    for (const [folder, entry] of staleEntries) {
      const spinner = ui.spinner();
      spinner.start(`removing ${entry.name}`);

      try {
        await uninstallSkill(folder);
        removedStaleSkills += 1;
        spinner.stop(pc.green(`removed ${entry.name}`));
      } catch (error) {
        spinner.stop(pc.red(`failed to remove ${entry.name}: ${readErrorMessage(error)}`));
      }
    }

    ui.log.info(pc.dim(`removed ${removedStaleSkills} skill(s) no longer on server`));
  }

  ui.log.info(pc.dim(`synced ${synced}/${skillsToSync.length} skill(s)`));

  return {
    ok: failed === 0,
    authenticated: true,
    totalSkills: skillsToSync.length,
    syncedSkills: synced,
    failedSkills: failed,
    removedStaleSkills,
  };
}

export async function syncCommand() {
  const selectedAgents = await resolveInstallAgents();

  if (selectedAgents.length === 0) {
    ui.log.error("no agents selected");
    return;
  }

  await syncSkills(selectedAgents);
}
