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

type SyncPageOutput = Awaited<ReturnType<typeof trpc.skills.syncPage.query>>;
type SyncSkillItem = SyncPageOutput["items"][number];
type LockSkillEntry = Awaited<ReturnType<typeof readInstallLock>>["skills"][string];

export type SyncRunResult = {
  ok: boolean;
  authenticated: boolean;
  totalSkills: number;
  syncedSkills: number;
  failedSkills: number;
  removedStaleSkills: number;
};

function toInstallableSkill(skill: SyncSkillItem): InstallableSkill {
  return {
    id: skill.id,
    slug: skill.slug,
    name: skill.name,
    description: skill.description,
    remoteUpdatedAt: toIsoTimestamp(skill.updatedAt),
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

function toIsoTimestamp(value: Date | string): string {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }
  return parsed.toISOString();
}

function readStoredRemoteUpdatedAt(entry: LockSkillEntry): string | null {
  const raw = entry.source?.remoteUpdatedAt;
  if (typeof raw !== "string") {
    return null;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function classifySyncChange(
  skill: SyncSkillItem,
  existingEntry: LockSkillEntry | undefined,
  selectedAgents: SupportedAgent[],
): "added" | "synced" | null {
  if (!existingEntry) {
    return "added";
  }

  if (existingEntry.skillId !== skill.id) {
    return "synced";
  }

  const storedUpdatedAt = readStoredRemoteUpdatedAt(existingEntry);
  if (storedUpdatedAt === null || storedUpdatedAt !== toIsoTimestamp(skill.updatedAt)) {
    return "synced";
  }

  const hasAllTargets = selectedAgents.every((agent) => Boolean(existingEntry.targets?.[agent]));
  if (!hasAllTargets) {
    return "synced";
  }

  return null;
}

function formatInstalledSkillLabel(entry: LockSkillEntry): string {
  const vault = entry.source?.vault;
  if (
    vault &&
    typeof vault.name === "string" &&
    (vault.type === "personal" || vault.type === "enterprise" || vault.type === "system_default")
  ) {
    return formatVaultSkillLabel(vault, entry.name);
  }

  return entry.name;
}

export async function syncSkills(selectedAgents: SupportedAgent[]): Promise<SyncRunResult> {
  const uniqueSelectedAgents = [...new Set(selectedAgents)];

  ui.log.info(
    `targets: ${uniqueSelectedAgents.map((agent) => getAgentDisplayName(agent)).join(", ")}`,
  );

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

  let page: SyncPageOutput;
  try {
    page = await trpc.skills.syncPage.query({ limit: SYNC_PAGE_LIMIT });
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

  fetchSpinner.stop(pc.green("loaded skills"));

  const lockBeforeSync = await readInstallLock();

  const serverSkillIds = new Set<string>();
  const expectedServerKeys = new Set<string>();

  let totalSkills = 0;
  let synced = 0;
  let failed = 0;
  const addedSkillLabels: string[] = [];
  const syncedSkillLabels: string[] = [];
  const failedSkillMessages: string[] = [];

  const syncSpinner = ui.spinner();
  syncSpinner.start("checking skills (0)");

  for (;;) {
    for (const item of page.items) {
      totalSkills += 1;
      const installKey = buildVaultScopedInstallKey(item.vault.slug, item.slug);
      const skillLabel = formatVaultSkillLabel(item.vault, item.name);
      serverSkillIds.add(item.id);
      expectedServerKeys.add(installKey);

      syncSpinner.message(`checking ${skillLabel} (${totalSkills})`);

      const changeType = classifySyncChange(
        item,
        lockBeforeSync.skills[installKey],
        uniqueSelectedAgents,
      );

      if (!changeType) {
        continue;
      }

      syncSpinner.message(`${changeType === "added" ? "adding" : "syncing"} ${skillLabel}`);

      try {
        await installSkill(toInstallableSkill(item), uniqueSelectedAgents, {
          skillFolder: installKey,
        });
        synced += 1;
        if (changeType === "added") {
          addedSkillLabels.push(skillLabel);
        } else {
          syncedSkillLabels.push(skillLabel);
        }
      } catch (error) {
        failed += 1;
        failedSkillMessages.push(`${skillLabel}: ${readErrorMessage(error)}`);
      }
    }

    if (!page.nextCursor) {
      break;
    }

    try {
      page = await trpc.skills.syncPage.query({
        limit: SYNC_PAGE_LIMIT,
        cursor: page.nextCursor,
      });
    } catch (error) {
      syncSpinner.stop(pc.red(`failed to load more skills: ${readErrorMessage(error)}`));

      for (const failure of failedSkillMessages) {
        ui.log.error(pc.red(`failed ${failure}`));
      }

      return {
        ok: false,
        authenticated: true,
        totalSkills,
        syncedSkills: synced,
        failedSkills: failed,
        removedStaleSkills: 0,
      };
    }
  }

  const appliedChanges = addedSkillLabels.length + syncedSkillLabels.length;

  syncSpinner.stop(
    failed === 0
      ? appliedChanges === 0
        ? pc.green("skills are up to date")
        : pc.green(`applied ${appliedChanges} change(s)`)
      : pc.yellow(`applied ${appliedChanges} change(s), ${failed} failed`),
  );

  for (const failure of failedSkillMessages) {
    ui.log.error(pc.red(`failed ${failure}`));
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
  const removedSkillLabels: string[] = [];
  const staleRemovalFailures: string[] = [];

  if (staleEntries.length > 0) {
    const removeSpinner = ui.spinner();
    removeSpinner.start(`removing stale skills (0/${staleEntries.length})`);

    for (const [index, [folder, entry]] of staleEntries.entries()) {
      removeSpinner.message(`removing ${entry.name} (${index + 1}/${staleEntries.length})`);

      try {
        await uninstallSkill(folder);
        removedStaleSkills += 1;
        removedSkillLabels.push(formatInstalledSkillLabel(entry));
      } catch (error) {
        staleRemovalFailures.push(`${entry.name}: ${readErrorMessage(error)}`);
      }
    }

    removeSpinner.stop(
      staleRemovalFailures.length === 0
        ? pc.green(`removed ${removedStaleSkills}/${staleEntries.length} stale skill(s)`)
        : pc.yellow(
            `removed ${removedStaleSkills}/${staleEntries.length} stale skill(s), ${staleRemovalFailures.length} failed`,
          ),
    );

    for (const failure of staleRemovalFailures) {
      ui.log.error(pc.red(`failed to remove ${failure}`));
    }
  }

  if (addedSkillLabels.length > 0) {
    ui.log.success(pc.green(`added: ${addedSkillLabels.join(", ")}`));
  }

  if (syncedSkillLabels.length > 0) {
    ui.log.info(pc.dim(`synced: ${syncedSkillLabels.join(", ")}`));
  }

  if (removedSkillLabels.length > 0) {
    ui.log.info(pc.dim(`removed: ${removedSkillLabels.join(", ")}`));
  }

  if (
    addedSkillLabels.length === 0 &&
    syncedSkillLabels.length === 0 &&
    removedSkillLabels.length === 0 &&
    failedSkillMessages.length === 0 &&
    staleRemovalFailures.length === 0
  ) {
    ui.log.success(pc.green("everything up to date"));
  }

  return {
    ok: failed === 0 && staleRemovalFailures.length === 0,
    authenticated: true,
    totalSkills,
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
