import { and, eq, inArray, ne, sql as drizzleSql } from "drizzle-orm";

import { db, sql } from "@better-skills/db";
import { skill, skillLink, skillResource } from "@better-skills/db/schema/skills";
import { parseMentions, remapMentionTargetIds } from "@better-skills/markdown/persisted-mentions";

import { ensureSystemDefaultVault } from "./system-default-vault";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type AutoLinkSource =
  | {
      type: "skill";
      sourceId: string;
      markdown: string;
    }
  | {
      type: "resource";
      sourceId: string;
      markdown: string;
    };

interface MigrationOptions {
  apply: boolean;
}

interface MigrationStats {
  duplicateSkillCount: number;
  duplicateResourceCount: number;
  remappedSkillMentions: number;
  remappedResourceMentions: number;
  unresolvedDuplicateMentions: number;
  deletedDuplicateSkills: number;
  rebuiltSources: number;
}

async function syncMarkdownAutoLinksForSources(
  tx: DbTx,
  sources: AutoLinkSource[],
  createdByUserId: string | null,
): Promise<number> {
  if (sources.length === 0) {
    return 0;
  }

  const dedupedSources = new Map<string, AutoLinkSource>();

  for (const source of sources) {
    const sourceId = source.sourceId.toLowerCase();

    dedupedSources.set(`${source.type}:${sourceId}`, {
      ...source,
      sourceId,
    });
  }

  for (const source of dedupedSources.values()) {
    const sourceCondition =
      source.type === "skill"
        ? eq(skillLink.sourceSkillId, source.sourceId)
        : eq(skillLink.sourceResourceId, source.sourceId);

    await tx
      .delete(skillLink)
      .where(and(sourceCondition, drizzleSql`${skillLink.metadata}->>'origin' = 'markdown-auto'`));

    const mentions = parseMentions(source.markdown);
    if (mentions.length === 0) {
      continue;
    }

    await tx.insert(skillLink).values(
      mentions.map((mention) => ({
        sourceSkillId: source.type === "skill" ? source.sourceId : null,
        sourceResourceId: source.type === "resource" ? source.sourceId : null,
        targetSkillId: mention.type === "skill" ? mention.targetId : null,
        targetResourceId: mention.type === "resource" ? mention.targetId : null,
        kind: "mention",
        metadata: { origin: "markdown-auto" } as Record<string, unknown>,
        createdByUserId,
      })),
    );
  }

  return dedupedSources.size;
}

function countRemappedMentions(
  beforeMarkdown: string,
  afterMarkdown: string,
  idMap: ReadonlyMap<string, string>,
) {
  if (beforeMarkdown === afterMarkdown || idMap.size === 0) {
    return 0;
  }

  let remappedCount = 0;
  for (const mention of parseMentions(beforeMarkdown)) {
    const mapped = idMap.get(mention.targetId);
    if (mapped && mapped !== mention.targetId) {
      remappedCount++;
    }
  }

  return remappedCount;
}

function hasMentionTargetInSet(markdown: string, ids: ReadonlySet<string>): boolean {
  if (ids.size === 0) {
    return false;
  }

  for (const mention of parseMentions(markdown)) {
    if (ids.has(mention.targetId)) {
      return true;
    }
  }

  return false;
}

async function migrateDuplicateDefaultSkillReferences(
  options: MigrationOptions,
): Promise<MigrationStats> {
  const defaultVaultId = await ensureSystemDefaultVault();

  return db.transaction(async (tx) => {
    const canonicalDefaultSkills = await tx
      .select({ id: skill.id, slug: skill.slug })
      .from(skill)
      .where(and(eq(skill.ownerVaultId, defaultVaultId), eq(skill.isDefault, true)));

    const canonicalSkillIdBySlug = new Map(canonicalDefaultSkills.map((row) => [row.slug, row.id]));
    const canonicalSkillIds = new Set(canonicalDefaultSkills.map((row) => row.id));

    const duplicateDefaultSkills = await tx
      .select({ id: skill.id, slug: skill.slug })
      .from(skill)
      .where(and(eq(skill.isDefault, true), ne(skill.ownerVaultId, defaultVaultId)));

    const duplicateSkillIds = duplicateDefaultSkills.map((row) => row.id);
    const duplicateSkillIdSet = new Set(duplicateSkillIds);

    if (duplicateSkillIds.length === 0) {
      return {
        duplicateSkillCount: 0,
        duplicateResourceCount: 0,
        remappedSkillMentions: 0,
        remappedResourceMentions: 0,
        unresolvedDuplicateMentions: 0,
        deletedDuplicateSkills: 0,
        rebuiltSources: 0,
      };
    }

    const duplicateSkillToCanonicalSkill = new Map<string, string>();
    for (const duplicateSkill of duplicateDefaultSkills) {
      const canonicalSkillId = canonicalSkillIdBySlug.get(duplicateSkill.slug);
      if (!canonicalSkillId) {
        continue;
      }
      duplicateSkillToCanonicalSkill.set(duplicateSkill.id, canonicalSkillId);
    }

    const canonicalResources = canonicalSkillIds.size
      ? await tx
          .select({
            skillId: skillResource.skillId,
            id: skillResource.id,
            path: skillResource.path,
          })
          .from(skillResource)
          .where(inArray(skillResource.skillId, [...canonicalSkillIds]))
      : [];

    const canonicalResourceIdBySlugAndPath = new Map<string, string>();
    for (const canonicalResource of canonicalResources) {
      const canonicalSkill = canonicalDefaultSkills.find(
        (row) => row.id === canonicalResource.skillId,
      );
      if (!canonicalSkill) {
        continue;
      }

      canonicalResourceIdBySlugAndPath.set(
        `${canonicalSkill.slug}:${canonicalResource.path}`,
        canonicalResource.id,
      );
    }

    const duplicateResources = await tx
      .select({
        id: skillResource.id,
        skillId: skillResource.skillId,
        path: skillResource.path,
      })
      .from(skillResource)
      .where(inArray(skillResource.skillId, duplicateSkillIds));

    const duplicateResourceIdSet = new Set(duplicateResources.map((row) => row.id));
    const duplicateSkillById = new Map(duplicateDefaultSkills.map((row) => [row.id, row]));

    const duplicateResourceToCanonicalResource = new Map<string, string>();
    for (const duplicateResource of duplicateResources) {
      const duplicateSkill = duplicateSkillById.get(duplicateResource.skillId);
      if (!duplicateSkill) {
        continue;
      }

      const canonicalResourceId = canonicalResourceIdBySlugAndPath.get(
        `${duplicateSkill.slug}:${duplicateResource.path}`,
      );

      if (!canonicalResourceId) {
        continue;
      }

      duplicateResourceToCanonicalResource.set(duplicateResource.id, canonicalResourceId);
    }

    const mentionRemapMap = new Map<string, string>([
      ...duplicateSkillToCanonicalSkill.entries(),
      ...duplicateResourceToCanonicalResource.entries(),
    ]);

    let remappedSkillMentions = 0;
    let remappedResourceMentions = 0;

    const touchedSkillIds = new Set<string>();

    const allSkills = await tx
      .select({ id: skill.id, skillMarkdown: skill.skillMarkdown })
      .from(skill);

    for (const row of allSkills) {
      const remapped = remapMentionTargetIds(row.skillMarkdown, mentionRemapMap);
      if (remapped === row.skillMarkdown) {
        continue;
      }

      remappedSkillMentions += countRemappedMentions(row.skillMarkdown, remapped, mentionRemapMap);

      touchedSkillIds.add(row.id);

      if (options.apply) {
        await tx
          .update(skill)
          .set({ skillMarkdown: remapped, updatedAt: new Date() })
          .where(eq(skill.id, row.id));
      }
    }

    const allResources = await tx
      .select({
        id: skillResource.id,
        skillId: skillResource.skillId,
        content: skillResource.content,
      })
      .from(skillResource);

    for (const row of allResources) {
      const remapped = remapMentionTargetIds(row.content, mentionRemapMap);
      if (remapped === row.content) {
        continue;
      }

      remappedResourceMentions += countRemappedMentions(row.content, remapped, mentionRemapMap);

      touchedSkillIds.add(row.skillId);

      if (options.apply) {
        await tx
          .update(skillResource)
          .set({ content: remapped })
          .where(eq(skillResource.id, row.id));
      }
    }

    let unresolvedDuplicateMentions = 0;

    for (const row of allSkills) {
      const markdown = options.apply
        ? remapMentionTargetIds(row.skillMarkdown, mentionRemapMap)
        : row.skillMarkdown;

      if (hasMentionTargetInSet(markdown, duplicateSkillIdSet)) {
        unresolvedDuplicateMentions++;
      }
    }

    for (const row of allResources) {
      const markdown = options.apply
        ? remapMentionTargetIds(row.content, mentionRemapMap)
        : row.content;

      if (hasMentionTargetInSet(markdown, duplicateResourceIdSet)) {
        unresolvedDuplicateMentions++;
      }
    }

    if (options.apply && unresolvedDuplicateMentions > 0) {
      throw new Error(
        `refusing to delete duplicated defaults: ${unresolvedDuplicateMentions} markdown blobs still reference old ids`,
      );
    }

    let rebuiltSources = 0;

    if (options.apply && touchedSkillIds.size > 0) {
      for (const touchedSkillId of touchedSkillIds) {
        const [sourceSkill] = await tx
          .select({
            id: skill.id,
            skillMarkdown: skill.skillMarkdown,
            ownerUserId: skill.ownerUserId,
          })
          .from(skill)
          .where(eq(skill.id, touchedSkillId))
          .limit(1);

        if (!sourceSkill) {
          continue;
        }

        const sourceResources = await tx
          .select({ id: skillResource.id, content: skillResource.content })
          .from(skillResource)
          .where(eq(skillResource.skillId, touchedSkillId));

        rebuiltSources += await syncMarkdownAutoLinksForSources(
          tx,
          [
            {
              type: "skill",
              sourceId: sourceSkill.id,
              markdown: sourceSkill.skillMarkdown,
            },
            ...sourceResources.map((resource) => ({
              type: "resource" as const,
              sourceId: resource.id,
              markdown: resource.content,
            })),
          ],
          sourceSkill.ownerUserId,
        );
      }
    }

    let deletedDuplicateSkills = 0;
    if (options.apply) {
      const deleted = await tx
        .delete(skill)
        .where(inArray(skill.id, duplicateSkillIds))
        .returning({ id: skill.id });
      deletedDuplicateSkills = deleted.length;
    }

    return {
      duplicateSkillCount: duplicateSkillIds.length,
      duplicateResourceCount: duplicateResources.length,
      remappedSkillMentions,
      remappedResourceMentions,
      unresolvedDuplicateMentions,
      deletedDuplicateSkills,
      rebuiltSources,
    };
  });
}

function parseOptions(argv: string[]): MigrationOptions {
  return {
    apply: argv.includes("--apply"),
  };
}

async function verifyNoPerUserDefaultSkillsRemain(): Promise<number> {
  const [row] = await db
    .select({ count: drizzleSql<number>`count(*)::int` })
    .from(skill)
    .where(and(eq(skill.isDefault, true), drizzleSql`${skill.ownerUserId} is not null`));

  return row?.count ?? 0;
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));

  try {
    const stats = await migrateDuplicateDefaultSkillReferences(options);

    console.log(
      [
        `[default-skill-ref-migration] mode=${options.apply ? "apply" : "dry-run"}`,
        `duplicates.skills=${stats.duplicateSkillCount}`,
        `duplicates.resources=${stats.duplicateResourceCount}`,
        `mentions.remapped.skill=${stats.remappedSkillMentions}`,
        `mentions.remapped.resource=${stats.remappedResourceMentions}`,
        `mentions.unresolved=${stats.unresolvedDuplicateMentions}`,
        `links.rebuiltSources=${stats.rebuiltSources}`,
        `duplicates.deleted.skills=${stats.deletedDuplicateSkills}`,
      ].join(" "),
    );

    if (options.apply) {
      const remainingPerUserDefaults = await verifyNoPerUserDefaultSkillsRemain();
      console.log(
        `[default-skill-ref-migration] verify remainingPerUserDefaultSkills=${remainingPerUserDefaults}`,
      );
      if (remainingPerUserDefaults > 0) {
        throw new Error("per-user default skill rows still exist after migration");
      }
    } else {
      console.log("[default-skill-ref-migration] dry-run only; pass --apply to write changes");
    }
  } catch (error) {
    console.error("[default-skill-ref-migration] failed", error);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main();
