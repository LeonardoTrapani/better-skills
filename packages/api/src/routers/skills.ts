import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";
import {
  and,
  desc,
  eq,
  exists,
  getTableColumns,
  gt,
  ilike,
  inArray,
  lt,
  or,
  sql,
} from "drizzle-orm";
import { z } from "zod";

import { db } from "@better-skills/db";
import {
  skill,
  skillLink,
  skillResource,
  skillShare,
  type SkillShareSnapshot as SkillShareSnapshotRecord,
} from "@better-skills/db/schema/skills";
import { vault } from "@better-skills/db/schema/vaults";
import {
  renderPersistedMentionsWithLinks,
  type MentionResourceRenderInfo,
} from "@better-skills/markdown/render-persisted-mentions";

import { protectedProcedure, publicProcedure, router } from "../trpc";
import {
  type AutoLinkSourceInput,
  MentionSyntaxError,
  MentionValidationError,
  syncAutoLinksForSources,
  validateMentionTargets,
} from "../lib/link-sync";
import { parseMentions, remapMentionTargetIds } from "../lib/mentions";
import { renderMentions, renderMentionsBatch } from "../lib/render-mentions";
import {
  type VaultType,
  getUserMemberships,
  getVaultMetadataByIds,
  assertCanRead,
  assertCanWrite,
  getPersonalVaultId,
  resolvePermissions,
  VaultAccessError,
} from "../lib/vault-access";

// -- shared enums --

const resourceKindEnum = z.enum(["reference", "script", "asset", "other"]);

// -- pagination --

const cursorPaginationInput = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

// -- resource schemas --

const resourceOutput = z.object({
  id: z.string().uuid(),
  skillId: z.string().uuid(),
  path: z.string(),
  kind: resourceKindEnum,
  content: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const resourceInput = z.object({
  path: z.string().min(1),
  kind: resourceKindEnum.default("reference"),
  content: z.string(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

const resourceReadOutput = resourceOutput.extend({
  renderedContent: z.string(),
  skillId: z.string().uuid(),
  skillSlug: z.string(),
  skillName: z.string(),
});

const resourceInSkillOutput = resourceOutput.extend({
  renderedContent: z.string(),
});

type SkillResourceForOutput = Omit<typeof skillResource.$inferSelect, "content"> & {
  content?: string;
};

// -- vault metadata schema (attached to skill outputs) --

const vaultMetaOutput = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  type: z.enum(["personal", "enterprise", "system_default"]),
  color: z.string().nullable(),
  isReadOnly: z.boolean(),
  isEnabled: z.boolean(),
});

// -- skill output --

const skillOutput = z.object({
  id: z.string().uuid(),
  ownerUserId: z.string().nullable(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  originalMarkdown: z.string(),
  renderedMarkdown: z.string(),
  frontmatter: z.record(z.string(), z.unknown()),
  metadata: z.record(z.string(), z.unknown()),
  isDefault: z.boolean(),
  sourceUrl: z.string().nullable(),
  sourceIdentifier: z.string().nullable(),
  resources: z.array(resourceInSkillOutput),
  vault: vaultMetaOutput,
  createdAt: z.date(),
  updatedAt: z.date(),
});

const skillListItem = skillOutput.omit({
  originalMarkdown: true,
  renderedMarkdown: true,
  resources: true,
});

const paginatedSkillList = z.object({
  items: z.array(skillListItem),
  nextCursor: z.string().uuid().nullable(),
});

const syncResourceOutput = z.object({
  path: z.string(),
  renderedContent: z.string(),
});

const syncSkillItemOutput = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  updatedAt: z.date(),
  originalMarkdown: z.string(),
  renderedMarkdown: z.string(),
  frontmatter: z.record(z.string(), z.unknown()),
  resources: z.array(syncResourceOutput),
  vault: vaultMetaOutput,
  sourceUrl: z.string().nullable(),
  sourceIdentifier: z.string().nullable(),
});

const paginatedSyncSkillList = z.object({
  items: z.array(syncSkillItemOutput),
  nextCursor: z.string().uuid().nullable(),
});

// -- helpers --

function throwMentionValidationError(error: unknown): never {
  if (error instanceof MentionSyntaxError || error instanceof MentionValidationError) {
    throw new TRPCError({ code: "BAD_REQUEST", message: error.message, cause: error });
  }

  throw error;
}

function formatAmbiguousSlugMessage(
  slug: string,
  candidates: Array<{ vaultSlug: string; vaultName: string }>,
): string {
  const lines = [
    `ambiguous skill slug "${slug}"; provide <vault-slug>/<skill-slug>`,
    "matches:",
    ...candidates
      .slice()
      .sort((a, b) => a.vaultSlug.localeCompare(b.vaultSlug))
      .map((candidate) => `- ${candidate.vaultSlug}/${slug} (${candidate.vaultName})`),
  ];

  return lines.join("\n");
}

// -- graph helpers --

const graphOutput = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["skill", "resource"]),
      label: z.string(),
      description: z.string().nullable(),
      slug: z.string().nullable(),
      parentSkillId: z.string().nullable(),
      kind: z.string().nullable(),
      contentSnippet: z.string().nullable(),
      updatedAt: z.string().nullable(),
      vault: vaultMetaOutput.nullable(),
    }),
  ),
  edges: z.array(
    z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      kind: z.string(),
    }),
  ),
});

const shareSnapshotResource = z.object({
  id: z.string().uuid(),
  path: z.string(),
  kind: resourceKindEnum,
  content: z.string(),
  metadata: z.record(z.string(), z.unknown()),
});

const shareSnapshotSkill = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  skillMarkdown: z.string(),
  frontmatter: z.record(z.string(), z.unknown()),
  metadata: z.record(z.string(), z.unknown()),
  sourceUrl: z.string().nullable(),
  sourceIdentifier: z.string().nullable(),
  resources: z.array(shareSnapshotResource),
});

const shareSnapshotLink = z.object({
  sourceSkillId: z.string().uuid().nullable(),
  sourceResourceId: z.string().uuid().nullable(),
  targetSkillId: z.string().uuid().nullable(),
  targetResourceId: z.string().uuid().nullable(),
  kind: z.string(),
  note: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()),
});

const shareSnapshotSchema = z.object({
  version: z.literal(1),
  rootSkillId: z.string().uuid(),
  skills: z.array(shareSnapshotSkill),
  links: z.array(shareSnapshotLink),
});

const createShareOutput = z.object({
  shareId: z.string().uuid(),
});

const sharePreviewOutput = z.object({
  rootSkillId: z.string().uuid(),
  includedSkills: z.array(
    z.object({
      id: z.string().uuid(),
      slug: z.string(),
      name: z.string(),
    }),
  ),
  stats: z.object({
    skills: z.number().int().nonnegative(),
    resources: z.number().int().nonnegative(),
    links: z.number().int().nonnegative(),
  }),
});

const sharedSkillDetailOutput = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  originalMarkdown: z.string(),
  renderedMarkdown: z.string(),
  sourceUrl: z.string().nullable(),
  sourceIdentifier: z.string().nullable(),
  resources: z.array(
    z.object({
      id: z.string().uuid(),
      path: z.string(),
      kind: resourceKindEnum,
      content: z.string(),
      renderedContent: z.string(),
      metadata: z.record(z.string(), z.unknown()),
    }),
  ),
});

const sharedSkillPreviewOutput = z.object({
  shareId: z.string().uuid(),
  createdAt: z.date(),
  includedSkills: z.array(
    z.object({
      id: z.string().uuid(),
      slug: z.string(),
      name: z.string(),
    }),
  ),
  stats: z.object({
    skills: z.number().int().nonnegative(),
    resources: z.number().int().nonnegative(),
    links: z.number().int().nonnegative(),
  }),
  rootSkill: sharedSkillDetailOutput,
  activeSkill: sharedSkillDetailOutput,
});

const shareInstallPackageOutput = z.object({
  shareId: z.string().uuid(),
  rootSkillId: z.string().uuid(),
  createdAt: z.date(),
  includedSkills: z.array(
    z.object({
      id: z.string().uuid(),
      slug: z.string(),
      name: z.string(),
    }),
  ),
  skills: z.array(
    z.object({
      id: z.string().uuid(),
      slug: z.string(),
      name: z.string(),
      description: z.string(),
      frontmatter: z.record(z.string(), z.unknown()),
      originalMarkdown: z.string(),
      renderedMarkdown: z.string(),
      sourceUrl: z.string().nullable(),
      sourceIdentifier: z.string().nullable(),
      resources: z.array(
        z.object({
          path: z.string(),
          kind: resourceKindEnum,
          renderedContent: z.string(),
        }),
      ),
    }),
  ),
});

const importShareOutput = z.object({
  rootSkillId: z.string().uuid(),
  importedSkills: z.number().int().nonnegative(),
  importedResources: z.number().int().nonnegative(),
  importedLinks: z.number().int().nonnegative(),
});

type GraphEdge = { id: string; source: string; target: string; kind: string };
type ShareSnapshot = z.infer<typeof shareSnapshotSchema>;

function buildGraphPayload(
  skills: (typeof skill.$inferSelect)[],
  resources: (typeof skillResource.$inferSelect)[],
  explicitLinks?: (typeof skillLink.$inferSelect)[],
  vaultMap?: Map<string, { slug: string; name: string; type: VaultType; color: string | null }>,
  vaultMembershipStateMap?: Map<string, { isEnabled: boolean }>,
) {
  const nodeIds = new Set([...skills.map((s) => s.id), ...resources.map((r) => r.id)]);

  // build a lookup from skillId → vault metadata for resource nodes
  const skillVaultLookup = new Map<string, VaultMeta | null>();
  for (const s of skills) {
    skillVaultLookup.set(
      s.id,
      vaultMap
        ? buildVaultMeta(s.ownerVaultId, vaultMap, {
            isEnabled: vaultMembershipStateMap?.get(s.ownerVaultId)?.isEnabled,
          })
        : null,
    );
  }

  const nodes = [
    ...skills.map((s) => ({
      id: s.id,
      type: "skill" as const,
      label: s.name,
      description: s.description,
      slug: s.slug,
      parentSkillId: null,
      kind: null,
      contentSnippet: s.skillMarkdown ? s.skillMarkdown.slice(0, 200) : null,
      updatedAt: s.updatedAt.toISOString(),
      vault: vaultMap
        ? buildVaultMeta(s.ownerVaultId, vaultMap, {
            isEnabled: vaultMembershipStateMap?.get(s.ownerVaultId)?.isEnabled,
          })
        : null,
    })),
    ...resources.map((r) => ({
      id: r.id,
      type: "resource" as const,
      label: r.path,
      description: null,
      slug: null,
      parentSkillId: r.skillId,
      kind: r.kind,
      contentSnippet: r.content ? r.content.slice(0, 200) : null,
      updatedAt: r.updatedAt.toISOString(),
      vault: skillVaultLookup.get(r.skillId) ?? null,
    })),
  ];

  const edges: GraphEdge[] = [];

  if (explicitLinks) {
    for (const link of explicitLinks) {
      const sourceId = link.sourceSkillId ?? link.sourceResourceId;
      const targetId = link.targetSkillId ?? link.targetResourceId;
      if (sourceId && targetId && nodeIds.has(sourceId) && nodeIds.has(targetId)) {
        edges.push({ id: link.id, source: sourceId, target: targetId, kind: link.kind });
      }
    }
  }

  for (const r of resources) {
    edges.push({ id: `parent-${r.id}`, source: r.skillId, target: r.id, kind: "parent" });
  }

  return { nodes, edges };
}

// -- vault metadata helper --

type VaultMeta = {
  id: string;
  slug: string;
  name: string;
  type: VaultType;
  color: string | null;
  isReadOnly: boolean;
  isEnabled: boolean;
};

type BuildVaultMetaOptions = {
  overrideReadOnly?: boolean;
  isEnabled?: boolean;
};

/**
 * Build VaultMeta for a skill row given a pre-fetched vault metadata map.
 * Personal vault is always writable; system_default is always read-only;
 * enterprise depends on role (but for list outputs we default to read-only
 * since we don't have per-row role info — callers can override).
 */
function buildVaultMeta(
  vaultId: string,
  vaultMap: Map<string, { slug: string; name: string; type: VaultType; color: string | null }>,
  options?: BuildVaultMetaOptions,
): VaultMeta {
  const v = vaultMap.get(vaultId);
  if (!v) {
    return {
      id: vaultId,
      slug: "unknown",
      name: "Unknown",
      type: "personal",
      color: null,
      isReadOnly: false,
      isEnabled: true,
    };
  }
  const isReadOnly =
    options?.overrideReadOnly !== undefined
      ? options.overrideReadOnly
      : v.type === "system_default" || v.type === "enterprise";
  return {
    id: vaultId,
    slug: v.slug,
    name: v.name,
    type: v.type,
    color: v.color,
    isReadOnly,
    isEnabled: options?.isEnabled ?? true,
  };
}

async function getUserVaultScope(userId: string): Promise<{
  vaultIds: string[];
  membershipByVaultId: Map<string, { isEnabled: boolean }>;
}> {
  const memberships = await getUserMemberships(userId);
  const membershipByVaultId = new Map<string, { isEnabled: boolean }>();

  for (const membership of memberships) {
    membershipByVaultId.set(membership.vaultId, { isEnabled: membership.isEnabled });
  }

  return {
    vaultIds: [...membershipByVaultId.keys()],
    membershipByVaultId,
  };
}

function normalizeEntityId(id: string) {
  return id.toLowerCase();
}

function resolveLinkEndpointSkillId(
  linkRow: typeof skillLink.$inferSelect,
  endpoint: "source" | "target",
  resourceSkillById: ReadonlyMap<string, string>,
): string | null {
  if (endpoint === "source") {
    if (linkRow.sourceSkillId) return linkRow.sourceSkillId;
    if (!linkRow.sourceResourceId) return null;
    return resourceSkillById.get(linkRow.sourceResourceId) ?? null;
  }

  if (linkRow.targetSkillId) return linkRow.targetSkillId;
  if (!linkRow.targetResourceId) return null;
  return resourceSkillById.get(linkRow.targetResourceId) ?? null;
}

function parseShareSnapshot(snapshot: unknown): ShareSnapshot {
  const parsedSnapshot = shareSnapshotSchema.safeParse(snapshot);
  if (!parsedSnapshot.success) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Invalid shared skill snapshot",
    });
  }

  return parsedSnapshot.data;
}

function buildUniqueImportSlug(originalSlug: string, usedSlugs: Set<string>) {
  const normalizedBase = originalSlug.trim().toLowerCase() || "shared-skill";

  if (!usedSlugs.has(normalizedBase)) {
    usedSlugs.add(normalizedBase);
    return normalizedBase;
  }

  let index = 1;

  while (true) {
    const candidate = index === 1 ? `${normalizedBase}-copy` : `${normalizedBase}-copy-${index}`;
    if (!usedSlugs.has(candidate)) {
      usedSlugs.add(candidate);
      return candidate;
    }
    index++;
  }
}

function renderSnapshotMarkdown(
  markdown: string,
  context: {
    skillNameById: ReadonlyMap<string, string>;
    resourceInfoById: ReadonlyMap<string, MentionResourceRenderInfo>;
    currentSkillId?: string;
  },
) {
  return renderPersistedMentionsWithLinks(markdown, context);
}

async function buildShareSnapshotForSkill(
  rootSkillId: string,
  readableVaultIds: string[],
): Promise<SkillShareSnapshotRecord> {
  const readableVaultIdSet = new Set(readableVaultIds);

  const [rootSkillRow] = await db.select().from(skill).where(eq(skill.id, rootSkillId));
  if (!rootSkillRow || !readableVaultIdSet.has(rootSkillRow.ownerVaultId)) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Skill not found" });
  }

  const depthBySkillId = new Map<string, number>([[rootSkillRow.id, 0]]);
  const queue = [rootSkillRow.id];
  const processedSkillIds = new Set<string>();

  const skillsById = new Map<string, typeof skill.$inferSelect>([[rootSkillRow.id, rootSkillRow]]);
  const resourcesBySkillId = new Map<string, (typeof skillResource.$inferSelect)[]>();
  const resourcesById = new Map<string, typeof skillResource.$inferSelect>();
  const resourceSkillById = new Map<string, string>();
  const linkCandidates = new Map<string, typeof skillLink.$inferSelect>();

  while (queue.length > 0) {
    const currentSkillId = queue.shift();
    if (!currentSkillId) break;
    if (processedSkillIds.has(currentSkillId)) continue;

    processedSkillIds.add(currentSkillId);

    const currentSkill = skillsById.get(currentSkillId);
    if (!currentSkill) continue;
    if (!readableVaultIdSet.has(currentSkill.ownerVaultId)) continue;

    const currentDepth = depthBySkillId.get(currentSkill.id) ?? 0;

    let currentResources = resourcesBySkillId.get(currentSkill.id);
    if (!currentResources) {
      currentResources = await db
        .select()
        .from(skillResource)
        .where(eq(skillResource.skillId, currentSkill.id));

      resourcesBySkillId.set(currentSkill.id, currentResources);
      for (const resourceRow of currentResources) {
        resourcesById.set(resourceRow.id, resourceRow);
        resourceSkillById.set(resourceRow.id, currentSkill.id);
      }
    }

    const sourceResourceIds = currentResources.map((resourceRow) => resourceRow.id);
    const outgoingLinks = await db
      .select()
      .from(skillLink)
      .where(
        or(
          eq(skillLink.sourceSkillId, currentSkill.id),
          ...(sourceResourceIds.length > 0
            ? [inArray(skillLink.sourceResourceId, sourceResourceIds)]
            : []),
        ),
      );

    if (outgoingLinks.length === 0) continue;

    const unresolvedTargetResourceIds = [
      ...new Set(
        outgoingLinks
          .map((linkRow) => linkRow.targetResourceId)
          .filter((targetResourceId): targetResourceId is string => {
            if (!targetResourceId) return false;
            return !resourceSkillById.has(targetResourceId);
          }),
      ),
    ];

    if (unresolvedTargetResourceIds.length > 0) {
      const targetResourceRows = await db
        .select({
          id: skillResource.id,
          skillId: skillResource.skillId,
          ownerVaultId: skill.ownerVaultId,
        })
        .from(skillResource)
        .innerJoin(skill, eq(skillResource.skillId, skill.id))
        .where(inArray(skillResource.id, unresolvedTargetResourceIds));

      for (const targetResourceRow of targetResourceRows) {
        if (!readableVaultIdSet.has(targetResourceRow.ownerVaultId)) continue;
        resourceSkillById.set(targetResourceRow.id, targetResourceRow.skillId);
      }
    }

    const candidateTargetSkillIds = [
      ...new Set(
        outgoingLinks
          .map((linkRow) => resolveLinkEndpointSkillId(linkRow, "target", resourceSkillById))
          .filter((skillId): skillId is string => Boolean(skillId)),
      ),
    ];

    if (candidateTargetSkillIds.length === 0) continue;

    const uncachedTargetSkillIds = candidateTargetSkillIds.filter(
      (skillId) => !skillsById.has(skillId),
    );
    if (uncachedTargetSkillIds.length > 0) {
      const targetSkillRows = await db
        .select()
        .from(skill)
        .where(inArray(skill.id, uncachedTargetSkillIds));

      for (const targetSkillRow of targetSkillRows) {
        if (!readableVaultIdSet.has(targetSkillRow.ownerVaultId)) continue;
        skillsById.set(targetSkillRow.id, targetSkillRow);
      }
    }

    const readableTargetSkillIds = new Set(
      candidateTargetSkillIds.filter((candidateTargetSkillId) => {
        const candidateSkillRow = skillsById.get(candidateTargetSkillId);
        return Boolean(candidateSkillRow && readableVaultIdSet.has(candidateSkillRow.ownerVaultId));
      }),
    );

    for (const outgoingLink of outgoingLinks) {
      const targetSkillId = resolveLinkEndpointSkillId(outgoingLink, "target", resourceSkillById);
      if (!targetSkillId || !readableTargetSkillIds.has(targetSkillId)) continue;

      linkCandidates.set(outgoingLink.id, outgoingLink);

      if (!depthBySkillId.has(targetSkillId)) {
        depthBySkillId.set(targetSkillId, currentDepth + 1);
        queue.push(targetSkillId);
      }
    }
  }

  const includedSkillIds = new Set(depthBySkillId.keys());

  for (const includedSkillId of includedSkillIds) {
    if (resourcesBySkillId.has(includedSkillId)) continue;

    const includedResources = await db
      .select()
      .from(skillResource)
      .where(eq(skillResource.skillId, includedSkillId));

    resourcesBySkillId.set(includedSkillId, includedResources);
    for (const resourceRow of includedResources) {
      resourcesById.set(resourceRow.id, resourceRow);
      resourceSkillById.set(resourceRow.id, includedSkillId);
    }
  }

  const includedResourceIds = new Set(resourcesById.keys());

  const includedLinks = [...linkCandidates.values()].filter((linkRow) => {
    const sourceSkillId = resolveLinkEndpointSkillId(linkRow, "source", resourceSkillById);
    const targetSkillId = resolveLinkEndpointSkillId(linkRow, "target", resourceSkillById);

    if (!sourceSkillId || !targetSkillId) return false;
    if (!includedSkillIds.has(sourceSkillId) || !includedSkillIds.has(targetSkillId)) return false;
    if (linkRow.sourceResourceId && !includedResourceIds.has(linkRow.sourceResourceId))
      return false;
    if (linkRow.targetResourceId && !includedResourceIds.has(linkRow.targetResourceId))
      return false;

    const sourceDepth = depthBySkillId.get(sourceSkillId);
    const targetDepth = depthBySkillId.get(targetSkillId);
    if (sourceDepth === undefined || targetDepth === undefined) return false;

    return targetDepth >= sourceDepth;
  });

  const snapshotSkills = [...includedSkillIds]
    .map((includedSkillId) => skillsById.get(includedSkillId))
    .filter((skillRow): skillRow is typeof skill.$inferSelect => Boolean(skillRow))
    .toSorted((left, right) => {
      if (left.id === rootSkillId) return -1;
      if (right.id === rootSkillId) return 1;
      return left.name.localeCompare(right.name) || left.id.localeCompare(right.id);
    })
    .map((skillRow) => ({
      id: skillRow.id,
      slug: skillRow.slug,
      name: skillRow.name,
      description: skillRow.description,
      skillMarkdown: skillRow.skillMarkdown,
      frontmatter: skillRow.frontmatter,
      metadata: skillRow.metadata,
      sourceUrl: skillRow.sourceUrl,
      sourceIdentifier: skillRow.sourceIdentifier,
      resources: (resourcesBySkillId.get(skillRow.id) ?? [])
        .toSorted(
          (left, right) => left.path.localeCompare(right.path) || left.id.localeCompare(right.id),
        )
        .map((resourceRow) => ({
          id: resourceRow.id,
          path: resourceRow.path,
          kind: resourceRow.kind,
          content: resourceRow.content,
          metadata: resourceRow.metadata,
        })),
    }));

  const snapshotLinks = includedLinks
    .toSorted((left, right) => {
      const createdAtDiff = left.createdAt.getTime() - right.createdAt.getTime();
      if (createdAtDiff !== 0) return createdAtDiff;
      return left.id.localeCompare(right.id);
    })
    .map((linkRow) => ({
      sourceSkillId: linkRow.sourceSkillId,
      sourceResourceId: linkRow.sourceResourceId,
      targetSkillId: linkRow.targetSkillId,
      targetResourceId: linkRow.targetResourceId,
      kind: linkRow.kind,
      note: linkRow.note,
      metadata: linkRow.metadata,
    }));

  return {
    version: 1,
    rootSkillId,
    skills: snapshotSkills,
    links: snapshotLinks,
  };
}

function buildGraphPayloadFromShareSnapshot(snapshot: ShareSnapshot) {
  const nodes: z.infer<typeof graphOutput>["nodes"] = [];
  const edges: z.infer<typeof graphOutput>["edges"] = [];
  const nodeIds = new Set<string>();

  for (const snapshotSkill of snapshot.skills) {
    nodeIds.add(snapshotSkill.id);
    nodes.push({
      id: snapshotSkill.id,
      type: "skill",
      label: snapshotSkill.name,
      description: snapshotSkill.description,
      slug: snapshotSkill.slug,
      parentSkillId: null,
      kind: null,
      contentSnippet: snapshotSkill.skillMarkdown.slice(0, 200),
      updatedAt: null,
      vault: null,
    });

    for (const snapshotResource of snapshotSkill.resources) {
      nodeIds.add(snapshotResource.id);

      nodes.push({
        id: snapshotResource.id,
        type: "resource",
        label: snapshotResource.path,
        description: null,
        slug: null,
        parentSkillId: snapshotSkill.id,
        kind: snapshotResource.kind,
        contentSnippet: snapshotResource.content.slice(0, 200),
        updatedAt: null,
        vault: null,
      });

      edges.push({
        id: `share-parent-${snapshotResource.id}`,
        source: snapshotSkill.id,
        target: snapshotResource.id,
        kind: "parent",
      });
    }
  }

  for (const [index, snapshotLink] of snapshot.links.entries()) {
    const sourceId = snapshotLink.sourceSkillId ?? snapshotLink.sourceResourceId;
    const targetId = snapshotLink.targetSkillId ?? snapshotLink.targetResourceId;

    if (!sourceId || !targetId) {
      continue;
    }

    if (!nodeIds.has(sourceId) || !nodeIds.has(targetId)) {
      continue;
    }

    edges.push({
      id: `share-link-${index}-${sourceId}-${targetId}`,
      source: sourceId,
      target: targetId,
      kind: snapshotLink.kind,
    });
  }

  return { nodes, edges };
}

function summarizeShareSnapshot(snapshot: ShareSnapshot) {
  return {
    includedSkills: snapshot.skills.map((snapshotSkill) => ({
      id: snapshotSkill.id,
      slug: snapshotSkill.slug,
      name: snapshotSkill.name,
    })),
    stats: {
      skills: snapshot.skills.length,
      resources: snapshot.skills.reduce((accumulator, snapshotSkill) => {
        return accumulator + snapshotSkill.resources.length;
      }, 0),
      links: snapshot.links.length,
    },
  };
}

function buildShareSnapshotRenderContext(snapshot: ShareSnapshot) {
  const skillNameById = new Map<string, string>();
  const resourceInfoById = new Map<string, MentionResourceRenderInfo>();
  const resourceOwnerSkillIdById = new Map<string, string>();
  let totalResources = 0;

  for (const skillSnapshot of snapshot.skills) {
    skillNameById.set(normalizeEntityId(skillSnapshot.id), skillSnapshot.name);
    totalResources += skillSnapshot.resources.length;

    for (const resourceSnapshot of skillSnapshot.resources) {
      const normalizedResourceId = normalizeEntityId(resourceSnapshot.id);

      resourceOwnerSkillIdById.set(normalizedResourceId, normalizeEntityId(skillSnapshot.id));
      resourceInfoById.set(normalizedResourceId, {
        resourcePath: resourceSnapshot.path,
        skillName: skillSnapshot.name,
        skillId: skillSnapshot.id,
      });
    }
  }

  return {
    skillNameById,
    resourceInfoById,
    resourceOwnerSkillIdById,
    totalResources,
  };
}

type ShareSnapshotRenderContext = ReturnType<typeof buildShareSnapshotRenderContext>;

function toSharedSkillDetailOutput(
  snapshotSkill: ShareSnapshot["skills"][number],
  context: ShareSnapshotRenderContext,
) {
  const { skillNameById, resourceInfoById, resourceOwnerSkillIdById } = context;

  return {
    id: snapshotSkill.id,
    slug: snapshotSkill.slug,
    name: snapshotSkill.name,
    description: snapshotSkill.description,
    originalMarkdown: snapshotSkill.skillMarkdown,
    renderedMarkdown: renderSnapshotMarkdown(snapshotSkill.skillMarkdown, {
      skillNameById,
      resourceInfoById,
      currentSkillId: snapshotSkill.id,
    }),
    sourceUrl: snapshotSkill.sourceUrl,
    sourceIdentifier: snapshotSkill.sourceIdentifier,
    resources: snapshotSkill.resources
      .slice()
      .sort((left, right) => left.path.localeCompare(right.path) || left.id.localeCompare(right.id))
      .map((snapshotResource) => ({
        id: snapshotResource.id,
        path: snapshotResource.path,
        kind: snapshotResource.kind,
        content: snapshotResource.content,
        renderedContent: renderSnapshotMarkdown(snapshotResource.content, {
          skillNameById,
          resourceInfoById,
          currentSkillId:
            resourceOwnerSkillIdById.get(normalizeEntityId(snapshotResource.id)) ??
            snapshotSkill.id,
        }),
        metadata: snapshotResource.metadata,
      })),
  };
}

/** map a skill row + resources array to the output shape, rendering mentions */
async function toSkillOutput(
  row: typeof skill.$inferSelect,
  resources: SkillResourceForOutput[],
  vaultMeta: VaultMeta,
  options?: {
    linkMentions?: boolean;
    includeResourceContent?: boolean;
  },
) {
  const linkMentions = options?.linkMentions ?? false;
  const includeResourceContent = options?.includeResourceContent ?? true;
  const renderInputs = includeResourceContent
    ? [
        { markdown: row.skillMarkdown, currentSkillId: row.id },
        ...resources.map((resource) => ({
          markdown: resource.content ?? "",
          currentSkillId: row.id,
        })),
      ]
    : [{ markdown: row.skillMarkdown, currentSkillId: row.id }];
  const renderedEntries = await renderMentionsBatch(renderInputs, { linkMentions });

  const renderedMarkdown = renderedEntries[0] ?? row.skillMarkdown;
  const renderedResources = resources.map((resource, index) => ({
    id: resource.id,
    skillId: resource.skillId,
    path: resource.path,
    kind: resource.kind,
    content: includeResourceContent ? (resource.content ?? "") : "",
    metadata: resource.metadata,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
    renderedContent: includeResourceContent
      ? (renderedEntries[index + 1] ?? resource.content ?? "")
      : "",
  }));

  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    slug: row.slug,
    name: row.name,
    description: row.description,
    originalMarkdown: row.skillMarkdown,
    renderedMarkdown,
    frontmatter: row.frontmatter,
    metadata: row.metadata,
    isDefault: row.isDefault,
    sourceUrl: row.sourceUrl,
    sourceIdentifier: row.sourceIdentifier,
    resources: renderedResources,
    vault: vaultMeta,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toSkillListItem(row: typeof skill.$inferSelect, vaultMeta: VaultMeta) {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    slug: row.slug,
    name: row.name,
    description: row.description,
    frontmatter: row.frontmatter,
    metadata: row.metadata,
    isDefault: row.isDefault,
    sourceUrl: row.sourceUrl,
    sourceIdentifier: row.sourceIdentifier,
    vault: vaultMeta,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function loadSkillResources(skillId: string) {
  return await db.select().from(skillResource).where(eq(skillResource.skillId, skillId));
}

async function loadSkillResourcesMetadata(skillId: string): Promise<SkillResourceForOutput[]> {
  const { content: _content, ...resourceColumnsWithoutContent } = getTableColumns(skillResource);

  return await db
    .select(resourceColumnsWithoutContent)
    .from(skillResource)
    .where(eq(skillResource.skillId, skillId));
}

async function loadSkillResourceByPath(skillId: string, resourcePath: string) {
  const resourceRows = await db
    .select()
    .from(skillResource)
    .where(and(eq(skillResource.skillId, skillId), eq(skillResource.path, resourcePath)));

  const resource = resourceRows[0];
  if (!resource) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
  }

  return resource;
}

// -- search helpers --

// strict_word_similarity normalizes by max(|trgm(query)|, |trgm(best_substr)|),
// producing tighter scores than word_similarity which only uses |trgm(query)|.
const FUZZY_THRESHOLD = 0.15;

function extractSnippet(text: string, query: string, contextChars = 80): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, contextChars).replace(/\n/g, " ").trim() + "...";

  const start = Math.max(0, idx - Math.floor(contextChars / 2));
  const end = Math.min(text.length, idx + query.length + Math.floor(contextChars / 2));
  let snippet = text.slice(start, end).replace(/\n/g, " ").trim();
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet += "...";
  return snippet;
}

/**
 * Build the WHERE condition for fuzzy search.
 * Uses strict_word_similarity for >= 3 char queries (typo tolerance),
 * falls back to ILIKE for shorter queries where trigrams don't work well.
 */
function searchCondition(query: string) {
  const pattern = `%${query}%`;

  if (query.length >= 3) {
    return or(
      sql`strict_word_similarity(${query}, ${skill.name}) > ${FUZZY_THRESHOLD}`,
      sql`strict_word_similarity(${query}, ${skill.description}) > ${FUZZY_THRESHOLD}`,
      sql`strict_word_similarity(${query}, ${skill.slug}) > ${FUZZY_THRESHOLD}`,
      ilike(skill.skillMarkdown, pattern),
    );
  }

  return or(
    ilike(skill.name, pattern),
    ilike(skill.description, pattern),
    ilike(skill.skillMarkdown, pattern),
  );
}

// -- search output --

const searchResultItem = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  vault: vaultMetaOutput,
  matchType: z.enum(["title", "description", "content"]),
  score: z.number(),
  snippet: z.string().nullable(),
  updatedAt: z.date(),
});

// -- router --

export const skillsRouter = router({
  count: publicProcedure.output(z.object({ count: z.number() })).query(async () => {
    try {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(skill)
        .where(sql`${skill.ownerUserId} is not null`);
      return { count: result?.count ?? 0 };
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `skills.count failed: ${details}`,
      });
    }
  }),

  countByOwner: protectedProcedure
    .output(z.object({ count: z.number() }))
    .query(async ({ ctx }) => {
      try {
        const userId = ctx.session.user.id;
        const { vaultIds } = await getUserVaultScope(userId);
        if (vaultIds.length === 0) return { count: 0 };
        const [result] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(skill)
          .where(inArray(skill.ownerVaultId, vaultIds));
        return { count: result?.count ?? 0 };
      } catch (error) {
        const details = error instanceof Error ? error.message : String(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `skills.countByOwner failed: ${details}`,
        });
      }
    }),

  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().int().min(1).max(50).default(5),
      }),
    )
    .output(z.object({ items: z.array(searchResultItem), total: z.number() }))
    .query(async ({ ctx, input }) => {
      const { query, limit } = input;
      const userId = ctx.session.user.id;
      const { vaultIds, membershipByVaultId } = await getUserVaultScope(userId);
      if (vaultIds.length === 0) return { items: [], total: 0 };

      const pattern = `%${query}%`;
      const useFuzzy = query.length >= 3;

      const matchCondition = searchCondition(query);
      const whereClause = and(matchCondition, inArray(skill.ownerVaultId, vaultIds));

      // additive score: trigram similarity base + exact substring bonuses.
      // the ILIKE bonuses ensure "docker" in a description outranks "doc" trigram overlaps.
      const scoreExpr = useFuzzy
        ? sql<number>`LEAST(
            GREATEST(strict_word_similarity(${query}, ${skill.name}), strict_word_similarity(${query}, ${skill.slug}))
            + strict_word_similarity(${query}, ${skill.description}) * 0.3
            + CASE WHEN ${skill.name} ILIKE ${pattern} OR ${skill.slug} ILIKE ${pattern} THEN 0.5
                   WHEN ${skill.description} ILIKE ${pattern} THEN 0.2
                   WHEN ${skill.skillMarkdown} ILIKE ${pattern} THEN 0.05
                   ELSE 0 END,
            1.0)`
        : sql<number>`CASE
            WHEN ${skill.name} ILIKE ${pattern} THEN 1.0
            WHEN ${skill.description} ILIKE ${pattern} THEN 0.8
            WHEN ${skill.skillMarkdown} ILIKE ${pattern} THEN 0.5
            ELSE 0
          END`;

      const [rows, countResult] = await Promise.all([
        db
          .select({
            ...getTableColumns(skill),
            score: scoreExpr.as("score"),
            nameScore: useFuzzy
              ? sql<number>`strict_word_similarity(${query}, ${skill.name})`.as("name_score")
              : sql<number>`CASE WHEN ${skill.name} ILIKE ${pattern} THEN 1.0 ELSE 0 END`.as(
                  "name_score",
                ),
            descScore: useFuzzy
              ? sql<number>`strict_word_similarity(${query}, ${skill.description})`.as("desc_score")
              : sql<number>`CASE WHEN ${skill.description} ILIKE ${pattern} THEN 1.0 ELSE 0 END`.as(
                  "desc_score",
                ),
            contentMatch: sql<boolean>`${skill.skillMarkdown} ILIKE ${pattern}`.as("content_match"),
          })
          .from(skill)
          .where(whereClause)
          .orderBy(sql`score DESC`, skill.name)
          .limit(limit),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(skill)
          .where(whereClause),
      ]);

      const total = countResult[0]?.count ?? 0;
      const vaultMap = await getVaultMetadataByIds([
        ...new Set(rows.map((row) => row.ownerVaultId)),
      ]);

      const items = rows.map((row) => {
        const matchType: "title" | "description" | "content" =
          row.nameScore >= row.descScore && row.nameScore > 0.1
            ? "title"
            : row.descScore > 0.1
              ? "description"
              : "content";

        const snippet =
          matchType === "content" && row.contentMatch
            ? extractSnippet(row.skillMarkdown, query)
            : null;

        return {
          id: row.id,
          slug: row.slug,
          name: row.name,
          description: row.description,
          vault: buildVaultMeta(row.ownerVaultId, vaultMap, {
            isEnabled: membershipByVaultId.get(row.ownerVaultId)?.isEnabled,
          }),
          matchType,
          score: Math.round(row.score * 100) / 100,
          snippet,
          updatedAt: row.updatedAt,
        };
      });

      return { items, total };
    }),

  searchMentions: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        skillId: z.string().uuid().optional(),
        /** When provided, restricts search to a specific vault the user belongs to. */
        vaultId: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(10).default(6),
      }),
    )
    .output(
      z.object({
        items: z.array(
          z.object({
            type: z.enum(["skill", "resource"]),
            id: z.string().uuid(),
            label: z.string(),
            subtitle: z.string().nullable(),
            parentSkillId: z.string().uuid().nullable(),
            vault: vaultMetaOutput.nullable(),
          }),
        ),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { query, skillId, vaultId, limit } = input;

      const halfLimit = Math.max(Math.ceil(limit / 2), 2);

      type MentionItem = {
        type: "skill" | "resource";
        id: string;
        label: string;
        subtitle: string | null;
        parentSkillId: string | null;
        vault: VaultMeta | null;
      };

      const { vaultIds, membershipByVaultId } = await getUserVaultScope(userId);
      if (vaultIds.length === 0) return { items: [] };

      let readableVaultIds = vaultIds;

      // If a specific vaultId is requested, verify the user is a member and narrow scope
      if (vaultId) {
        if (!vaultIds.includes(vaultId)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this vault" });
        }
        readableVaultIds = [vaultId];
      }

      if (skillId) {
        const [editingSkill] = await db
          .select({ ownerVaultId: skill.ownerVaultId })
          .from(skill)
          .where(eq(skill.id, skillId));

        if (!editingSkill) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Skill not found" });
        }

        try {
          await assertCanWrite(userId, editingSkill.ownerVaultId);
        } catch (e) {
          if (e instanceof VaultAccessError) {
            throw new TRPCError({ code: "FORBIDDEN", message: e.message });
          }
          throw e;
        }

        readableVaultIds = [editingSkill.ownerVaultId];
      }

      const items: MentionItem[] = [];

      // --- skill results ---
      const skillConditions = [inArray(skill.ownerVaultId, readableVaultIds)];
      if (query.length > 0) {
        const pattern = `%${query}%`;
        skillConditions.push(or(ilike(skill.name, pattern), ilike(skill.slug, pattern))!);
      }
      if (skillId) {
        // exclude the skill being edited from its own mentions
        skillConditions.push(sql`${skill.id} != ${skillId}`);
      }

      const skillRows = await db
        .select({
          id: skill.id,
          name: skill.name,
          slug: skill.slug,
          ownerVaultId: skill.ownerVaultId,
        })
        .from(skill)
        .where(and(...skillConditions))
        .orderBy(skill.name)
        .limit(halfLimit);

      const mentionVaultIds = new Set<string>();
      for (const row of skillRows) {
        mentionVaultIds.add(row.ownerVaultId);
      }

      for (const row of skillRows) {
        items.push({
          type: "skill",
          id: row.id,
          label: row.name,
          subtitle: row.slug,
          parentSkillId: null,
          vault: null,
        });
      }

      // --- resource results ---
      const resourceConditions = [inArray(skill.ownerVaultId, readableVaultIds)];
      if (query.length > 0) {
        const pattern = `%${query}%`;
        resourceConditions.push(
          or(ilike(skillResource.path, pattern), ilike(skill.name, pattern))!,
        );
      }

      const resourceRows = await db
        .select({
          id: skillResource.id,
          path: skillResource.path,
          skillId: skillResource.skillId,
          skillName: skill.name,
          ownerVaultId: skill.ownerVaultId,
        })
        .from(skillResource)
        .innerJoin(skill, eq(skillResource.skillId, skill.id))
        .where(and(...resourceConditions))
        .orderBy(skillResource.path)
        .limit(halfLimit);

      for (const row of resourceRows) {
        mentionVaultIds.add(row.ownerVaultId);
      }

      const mentionVaultMap =
        mentionVaultIds.size > 0 ? await getVaultMetadataByIds([...mentionVaultIds]) : new Map();

      for (const item of items) {
        if (item.type !== "skill") continue;
        const row = skillRows.find((candidate) => candidate.id === item.id);
        if (!row) continue;
        item.vault = buildVaultMeta(row.ownerVaultId, mentionVaultMap, {
          isEnabled: membershipByVaultId.get(row.ownerVaultId)?.isEnabled,
        });
      }

      for (const row of resourceRows) {
        items.push({
          type: "resource",
          id: row.id,
          label: row.path,
          subtitle: row.skillName,
          parentSkillId: row.skillId,
          vault: buildVaultMeta(row.ownerVaultId, mentionVaultMap, {
            isEnabled: membershipByVaultId.get(row.ownerVaultId)?.isEnabled,
          }),
        });
      }

      // trim to requested limit
      return { items: items.slice(0, limit) };
    }),

  list: protectedProcedure
    .input(
      cursorPaginationInput.extend({
        search: z.string().optional(),
      }),
    )
    .output(paginatedSkillList)
    .query(async ({ ctx, input }) => {
      const { cursor, limit, search } = input;
      const userId = ctx.session.user.id;
      const { vaultIds, membershipByVaultId } = await getUserVaultScope(userId);
      if (vaultIds.length === 0) return { items: [], nextCursor: null };

      const conditions = [inArray(skill.ownerVaultId, vaultIds)];

      if (search) {
        const pattern = `%${search}%`;
        conditions.push(
          or(
            ilike(skill.name, pattern),
            ilike(skill.slug, pattern),
            ilike(skill.description, pattern),
            exists(
              db
                .select({ id: vault.id })
                .from(vault)
                .where(and(eq(vault.id, skill.ownerVaultId), ilike(vault.name, pattern))),
            ),
          )!,
        );
      }

      if (cursor) {
        const cursorRows = await db
          .select({ id: skill.id, createdAt: skill.createdAt })
          .from(skill)
          .where(and(eq(skill.id, cursor), ...conditions));

        const cursorRow = cursorRows[0];
        if (!cursorRow) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid cursor" });
        }

        conditions.push(
          or(
            lt(skill.createdAt, cursorRow.createdAt),
            and(eq(skill.createdAt, cursorRow.createdAt), gt(skill.id, cursorRow.id)),
          )!,
        );
      }

      const rows = await db
        .select()
        .from(skill)
        .where(and(...conditions))
        .orderBy(desc(skill.createdAt), skill.id)
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;

      const vaultMap = await getVaultMetadataByIds(items.map((r) => r.ownerVaultId));

      return {
        items: items.map((row) =>
          toSkillListItem(
            row,
            buildVaultMeta(row.ownerVaultId, vaultMap, {
              isEnabled: membershipByVaultId.get(row.ownerVaultId)?.isEnabled,
            }),
          ),
        ),
        nextCursor: hasMore ? items[items.length - 1]!.id : null,
      };
    }),

  listByOwner: protectedProcedure
    .input(
      cursorPaginationInput.extend({
        search: z.string().optional(),
      }),
    )
    .output(paginatedSkillList)
    .query(async ({ ctx, input }) => {
      const { cursor, limit, search } = input;
      const userId = ctx.session.user.id;
      const { vaultIds, membershipByVaultId } = await getUserVaultScope(userId);
      if (vaultIds.length === 0) return { items: [], nextCursor: null };

      const conditions = [inArray(skill.ownerVaultId, vaultIds)];

      if (search) {
        const pattern = `%${search}%`;
        conditions.push(
          or(
            ilike(skill.name, pattern),
            ilike(skill.slug, pattern),
            ilike(skill.description, pattern),
            exists(
              db
                .select({ id: vault.id })
                .from(vault)
                .where(and(eq(vault.id, skill.ownerVaultId), ilike(vault.name, pattern))),
            ),
          )!,
        );
      }

      if (cursor) {
        const cursorRows = await db
          .select({ id: skill.id, createdAt: skill.createdAt })
          .from(skill)
          .where(and(eq(skill.id, cursor), ...conditions));

        const cursorRow = cursorRows[0];
        if (!cursorRow) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid cursor" });
        }

        conditions.push(
          or(
            lt(skill.createdAt, cursorRow.createdAt),
            and(eq(skill.createdAt, cursorRow.createdAt), gt(skill.id, cursorRow.id)),
          )!,
        );
      }

      const rows = await db
        .select()
        .from(skill)
        .where(and(...conditions))
        .orderBy(desc(skill.createdAt), skill.id)
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;

      const vaultMap = await getVaultMetadataByIds(items.map((r) => r.ownerVaultId));

      return {
        items: items.map((row) =>
          toSkillListItem(
            row,
            buildVaultMeta(row.ownerVaultId, vaultMap, {
              isEnabled: membershipByVaultId.get(row.ownerVaultId)?.isEnabled,
            }),
          ),
        ),
        nextCursor: hasMore ? items[items.length - 1]!.id : null,
      };
    }),

  syncPage: protectedProcedure
    .input(cursorPaginationInput)
    .output(paginatedSyncSkillList)
    .query(async ({ ctx, input }) => {
      const { cursor, limit } = input;
      const userId = ctx.session.user.id;
      const { vaultIds, membershipByVaultId } = await getUserVaultScope(userId);
      if (vaultIds.length === 0) return { items: [], nextCursor: null };

      const conditions = [inArray(skill.ownerVaultId, vaultIds)];

      if (cursor) {
        const cursorRows = await db
          .select({ id: skill.id, createdAt: skill.createdAt })
          .from(skill)
          .where(and(eq(skill.id, cursor), ...conditions));

        const cursorRow = cursorRows[0];
        if (!cursorRow) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid cursor" });
        }

        conditions.push(
          or(
            lt(skill.createdAt, cursorRow.createdAt),
            and(eq(skill.createdAt, cursorRow.createdAt), gt(skill.id, cursorRow.id)),
          )!,
        );
      }

      const rows = await db
        .select()
        .from(skill)
        .where(and(...conditions))
        .orderBy(desc(skill.createdAt), skill.id)
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;

      if (items.length === 0) {
        return {
          items: [],
          nextCursor: null,
        };
      }

      const skillIds = items.map((row) => row.id);
      const resourceRows = await db
        .select()
        .from(skillResource)
        .where(inArray(skillResource.skillId, skillIds));

      const resourcesBySkillId = new Map<string, (typeof resourceRows)[number][]>();
      for (const resourceRow of resourceRows) {
        const existing = resourcesBySkillId.get(resourceRow.skillId);
        if (existing) {
          existing.push(resourceRow);
        } else {
          resourcesBySkillId.set(resourceRow.skillId, [resourceRow]);
        }
      }

      for (const [skillId, groupedResources] of resourcesBySkillId) {
        resourcesBySkillId.set(
          skillId,
          groupedResources.toSorted((a, b) => a.path.localeCompare(b.path)),
        );
      }

      const renderInputs: Array<{ markdown: string; currentSkillId: string }> = [];
      const renderRefs: Array<
        | { kind: "skill"; id: string; fallback: string }
        | { kind: "resource"; id: string; fallback: string }
      > = [];

      for (const row of items) {
        renderInputs.push({ markdown: row.skillMarkdown, currentSkillId: row.id });
        renderRefs.push({ kind: "skill", id: row.id, fallback: row.skillMarkdown });

        for (const resourceRow of resourcesBySkillId.get(row.id) ?? []) {
          renderInputs.push({ markdown: resourceRow.content, currentSkillId: row.id });
          renderRefs.push({ kind: "resource", id: resourceRow.id, fallback: resourceRow.content });
        }
      }

      const renderedEntries = await renderMentionsBatch(renderInputs, { linkMentions: false });
      const renderedSkillMarkdownById = new Map<string, string>();
      const renderedResourceContentById = new Map<string, string>();

      for (const [index, renderRef] of renderRefs.entries()) {
        const rendered = renderedEntries[index] ?? renderRef.fallback;
        if (renderRef.kind === "skill") {
          renderedSkillMarkdownById.set(renderRef.id, rendered);
        } else {
          renderedResourceContentById.set(renderRef.id, rendered);
        }
      }

      const vaultMap = await getVaultMetadataByIds(items.map((row) => row.ownerVaultId));

      return {
        items: items.map((row) => ({
          id: row.id,
          slug: row.slug,
          name: row.name,
          description: row.description,
          updatedAt: row.updatedAt,
          originalMarkdown: row.skillMarkdown,
          renderedMarkdown: renderedSkillMarkdownById.get(row.id) ?? row.skillMarkdown,
          frontmatter: row.frontmatter,
          resources: (resourcesBySkillId.get(row.id) ?? []).map((resourceRow) => ({
            path: resourceRow.path,
            renderedContent: renderedResourceContentById.get(resourceRow.id) ?? resourceRow.content,
          })),
          vault: buildVaultMeta(row.ownerVaultId, vaultMap, {
            isEnabled: membershipByVaultId.get(row.ownerVaultId)?.isEnabled,
          }),
          sourceUrl: row.sourceUrl,
          sourceIdentifier: row.sourceIdentifier,
        })),
        nextCursor: hasMore ? items[items.length - 1]!.id : null,
      };
    }),

  getById: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        linkMentions: z.boolean().optional(),
        includeResourceContent: z.boolean().optional(),
      }),
    )
    .output(skillOutput)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const rows = await db.select().from(skill).where(eq(skill.id, input.id));

      const row = rows[0];
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Skill not found" });
      }

      let membership: Awaited<ReturnType<typeof assertCanRead>>;
      try {
        membership = await assertCanRead(userId, row.ownerVaultId);
      } catch (e) {
        if (e instanceof VaultAccessError) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Skill not found" });
        }
        throw e;
      }

      const vaultMap = await getVaultMetadataByIds([row.ownerVaultId]);
      const permissions = resolvePermissions(membership.vaultType, membership.role);
      const vaultMeta = buildVaultMeta(row.ownerVaultId, vaultMap, {
        overrideReadOnly: permissions.isReadOnly,
        isEnabled: membership.isEnabled,
      });

      const includeResourceContent = input.includeResourceContent ?? true;
      const resources = includeResourceContent
        ? await loadSkillResources(row.id)
        : await loadSkillResourcesMetadata(row.id);

      return await toSkillOutput(row, resources, vaultMeta, {
        linkMentions: input.linkMentions,
        includeResourceContent,
      });
    }),

  getBySlug: protectedProcedure
    .input(
      z.object({
        slug: z.string().min(1),
        vaultSlug: z.string().min(1).optional(),
        linkMentions: z.boolean().optional(),
        includeResourceContent: z.boolean().optional(),
      }),
    )
    .output(skillOutput)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const normalizedSlug = input.slug.trim().toLowerCase();
      const normalizedVaultSlug = input.vaultSlug?.trim().toLowerCase();

      // slug is unique per vault — find all matches across caller memberships
      const { vaultIds } = await getUserVaultScope(userId);
      if (vaultIds.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Skill not found" });
      }

      const rows = await db
        .select()
        .from(skill)
        .where(and(eq(skill.slug, normalizedSlug), inArray(skill.ownerVaultId, vaultIds)));

      if (rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Skill not found" });
      }

      const vaultMap = await getVaultMetadataByIds(rows.map((row) => row.ownerVaultId));

      let selectedRow: (typeof rows)[number] | undefined = rows[0];
      if (normalizedVaultSlug) {
        selectedRow =
          rows.find(
            (candidate) => vaultMap.get(candidate.ownerVaultId)?.slug === normalizedVaultSlug,
          ) ?? undefined;
        if (!selectedRow) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Skill not found" });
        }
      } else if (rows.length > 1) {
        const candidates = rows
          .map((candidate) => ({
            vaultSlug: vaultMap.get(candidate.ownerVaultId)?.slug,
            vaultName: vaultMap.get(candidate.ownerVaultId)?.name,
          }))
          .filter((candidate): candidate is { vaultSlug: string; vaultName: string } => {
            return Boolean(candidate.vaultSlug && candidate.vaultName);
          });

        throw new TRPCError({
          code: "CONFLICT",
          message: formatAmbiguousSlugMessage(normalizedSlug, candidates),
        });
      }

      if (!selectedRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Skill not found" });
      }

      const membership = await assertCanRead(userId, selectedRow.ownerVaultId);
      const permissions = resolvePermissions(membership.vaultType, membership.role);
      const vaultMeta = buildVaultMeta(selectedRow.ownerVaultId, vaultMap, {
        overrideReadOnly: permissions.isReadOnly,
        isEnabled: membership.isEnabled,
      });

      const includeResourceContent = input.includeResourceContent ?? true;
      const resources = includeResourceContent
        ? await loadSkillResources(selectedRow.id)
        : await loadSkillResourcesMetadata(selectedRow.id);

      return await toSkillOutput(selectedRow, resources, vaultMeta, {
        linkMentions: input.linkMentions,
        includeResourceContent,
      });
    }),

  getResourceByPath: protectedProcedure
    .input(
      z.object({
        skillSlug: z.string().min(1),
        resourcePath: z.string().min(1),
      }),
    )
    .output(resourceReadOutput)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { vaultIds } = await getUserVaultScope(userId);
      if (vaultIds.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Skill not found" });
      }

      const skillRows = await db
        .select()
        .from(skill)
        .where(and(eq(skill.slug, input.skillSlug), inArray(skill.ownerVaultId, vaultIds)));

      const skillRow = skillRows[0];
      if (!skillRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Skill not found" });
      }

      const resource = await loadSkillResourceByPath(skillRow.id, input.resourcePath);
      const renderedContent = await renderMentions(resource.content, {
        currentSkillId: skillRow.id,
        linkMentions: true,
      });

      return {
        ...resource,
        renderedContent,
        skillId: skillRow.id,
        skillSlug: skillRow.slug,
        skillName: skillRow.name,
      };
    }),

  getResourceBySkillIdAndPath: protectedProcedure
    .input(
      z.object({
        skillId: z.string().uuid(),
        resourcePath: z.string().min(1),
      }),
    )
    .output(resourceReadOutput)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const skillRows = await db.select().from(skill).where(eq(skill.id, input.skillId));

      const skillRow = skillRows[0];
      if (!skillRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Skill not found" });
      }

      try {
        await assertCanRead(userId, skillRow.ownerVaultId);
      } catch (e) {
        if (e instanceof VaultAccessError) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Skill not found" });
        }
        throw e;
      }

      const resource = await loadSkillResourceByPath(skillRow.id, input.resourcePath);
      const renderedContent = await renderMentions(resource.content, {
        currentSkillId: skillRow.id,
        linkMentions: true,
      });

      return {
        ...resource,
        renderedContent,
        skillId: skillRow.id,
        skillSlug: skillRow.slug,
        skillName: skillRow.name,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        slug: z.string().min(1),
        name: z.string().min(1),
        description: z.string().min(1),
        skillMarkdown: z.string(),
        frontmatter: z.record(z.string(), z.unknown()).default({}),
        metadata: z.record(z.string(), z.unknown()).default({}),
        sourceUrl: z.string().url().nullish(),
        sourceIdentifier: z.string().nullish(),
        resources: z.array(resourceInput).default([]),
        vaultId: z.string().uuid().optional(),
      }),
    )
    .output(skillOutput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // resolve target vault: explicit vaultId or default to personal
      let targetVaultId: string;
      if (input.vaultId) {
        targetVaultId = input.vaultId;
      } else {
        try {
          targetVaultId = await getPersonalVaultId(userId);
        } catch (e) {
          if (e instanceof VaultAccessError) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Personal vault not found",
            });
          }
          throw e;
        }
      }

      let writableMembership;
      try {
        writableMembership = await assertCanWrite(userId, targetVaultId);
      } catch (e) {
        if (e instanceof VaultAccessError) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: e.message,
          });
        }
        throw e;
      }

      try {
        await validateMentionTargets(input.skillMarkdown, targetVaultId);
      } catch (error) {
        throwMentionValidationError(error);
      }

      for (const resource of input.resources) {
        try {
          await validateMentionTargets(resource.content, targetVaultId);
        } catch (error) {
          throwMentionValidationError(error);
        }
      }

      const [created] = await db
        .insert(skill)
        .values({
          ownerUserId: userId,
          ownerVaultId: targetVaultId,
          slug: input.slug,
          name: input.name,
          description: input.description,
          skillMarkdown: input.skillMarkdown,
          frontmatter: input.frontmatter,
          metadata: input.metadata,
          sourceUrl: input.sourceUrl ?? null,
          sourceIdentifier: input.sourceIdentifier ?? null,
        })
        .returning();

      if (!created) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create skill" });
      }

      let resources: (typeof skillResource.$inferSelect)[] = [];

      if (input.resources.length > 0) {
        resources = await db
          .insert(skillResource)
          .values(
            input.resources.map((resource) => ({
              skillId: created.id,
              path: resource.path,
              kind: resource.kind,
              content: resource.content,
              metadata: resource.metadata,
            })),
          )
          .returning();
      }

      try {
        const linkSyncSources: AutoLinkSourceInput[] = [
          {
            type: "skill",
            sourceId: created.id,
            sourceOwnerVaultId: created.ownerVaultId,
            markdown: input.skillMarkdown,
          },
          ...resources.map((resource) => ({
            type: "resource" as const,
            sourceId: resource.id,
            sourceOwnerVaultId: created.ownerVaultId,
            markdown: resource.content,
          })),
        ];

        await syncAutoLinksForSources(linkSyncSources, userId);
      } catch (error) {
        if (error instanceof MentionSyntaxError || error instanceof MentionValidationError) {
          await db.delete(skill).where(eq(skill.id, created.id));
          throwMentionValidationError(error);
        }
        throw error;
      }

      const vaultMap = await getVaultMetadataByIds([targetVaultId]);
      const vaultMeta = buildVaultMeta(targetVaultId, vaultMap, {
        overrideReadOnly: false,
        isEnabled: writableMembership.isEnabled,
      });
      return await toSkillOutput(created, resources, vaultMeta);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        slug: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        skillMarkdown: z.string().optional(),
        frontmatter: z.record(z.string(), z.unknown()).optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
        sourceUrl: z.string().url().nullish(),
        sourceIdentifier: z.string().nullish(),
        vaultId: z.string().uuid().optional(),
        resources: z
          .array(
            resourceInput.extend({
              /** null path = new resource, existing path = upsert, omitted = no change */
              id: z.string().uuid().optional(),
              delete: z.boolean().optional(),
            }),
          )
          .optional(),
      }),
    )
    .output(skillOutput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const [existing] = await db.select().from(skill).where(eq(skill.id, input.id));

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Skill not found" });
      }

      const targetVaultId = input.vaultId ?? existing.ownerVaultId;
      const isVaultMove = targetVaultId !== existing.ownerVaultId;

      let sourceWritableMembership;
      try {
        sourceWritableMembership = await assertCanWrite(userId, existing.ownerVaultId);
      } catch (e) {
        if (e instanceof VaultAccessError) {
          throw new TRPCError({ code: "FORBIDDEN", message: e.message });
        }
        throw e;
      }

      let writableMembership = sourceWritableMembership;

      if (isVaultMove) {
        try {
          writableMembership = await assertCanWrite(userId, targetVaultId);
        } catch (e) {
          if (e instanceof VaultAccessError) {
            throw new TRPCError({ code: "FORBIDDEN", message: e.message });
          }
          throw e;
        }
      }

      const existingResources = await db
        .select({ id: skillResource.id, content: skillResource.content })
        .from(skillResource)
        .where(eq(skillResource.skillId, input.id));
      const existingResourceIds = new Set(existingResources.map((resource) => resource.id));

      const toDeleteResourceIds = new Set(
        input.resources
          ?.filter((resource) => resource.delete && resource.id)
          .map((resource) => resource.id!) ?? [],
      );

      const allowedSkillIds = new Set([existing.id]);
      const allowedResourceIds = new Set(
        existingResources
          .map((resource) => resource.id)
          .filter((resourceId) => !toDeleteResourceIds.has(resourceId)),
      );

      const assertNoDeletedResourceMentions = (markdown: string) => {
        if (toDeleteResourceIds.size === 0) return;

        const deletedResourceMentions = parseMentions(markdown)
          .filter((mention) => mention.type === "resource")
          .filter((mention) => toDeleteResourceIds.has(mention.targetId));

        if (deletedResourceMentions.length === 0) return;

        throw new MentionValidationError(
          deletedResourceMentions.map((mention) => ({
            type: "resource" as const,
            targetId: mention.targetId,
            reason: "target_not_found" as const,
          })),
        );
      };

      const validateMarkdownTargets = async (markdown: string) => {
        assertNoDeletedResourceMentions(markdown);
        await validateMentionTargets(markdown, targetVaultId, {
          allowSkillIds: allowedSkillIds,
          allowResourceIds: allowedResourceIds,
        });
      };

      const effectiveSkillMarkdown = input.skillMarkdown ?? existing.skillMarkdown;
      const shouldValidateSkillMarkdown =
        input.skillMarkdown !== undefined || input.resources !== undefined || isVaultMove;

      if (shouldValidateSkillMarkdown) {
        try {
          await validateMarkdownTargets(effectiveSkillMarkdown);
        } catch (error) {
          throwMentionValidationError(error);
        }
      }

      const shouldValidateResources = input.resources !== undefined || isVaultMove;

      if (shouldValidateResources) {
        const updatedContentById = new Map(
          input.resources
            ?.filter((resource) => resource.id && !resource.delete)
            .map((resource) => [resource.id!, resource.content]) ?? [],
        );

        for (const resource of existingResources) {
          if (toDeleteResourceIds.has(resource.id)) continue;

          const nextContent = updatedContentById.get(resource.id) ?? resource.content;

          try {
            await validateMarkdownTargets(nextContent);
          } catch (error) {
            throwMentionValidationError(error);
          }
        }

        const insertedResources = input.resources?.filter(
          (resource) => !resource.id && !resource.delete,
        );

        if (insertedResources) {
          for (const resource of insertedResources) {
            try {
              await validateMarkdownTargets(resource.content);
            } catch (error) {
              throwMentionValidationError(error);
            }
          }
        }

        const unmatchedUpdatedResources = input.resources?.filter(
          (resource) => resource.id && !resource.delete && !existingResourceIds.has(resource.id),
        );

        if (unmatchedUpdatedResources) {
          for (const resource of unmatchedUpdatedResources) {
            try {
              await validateMarkdownTargets(resource.content);
            } catch (error) {
              throwMentionValidationError(error);
            }
          }
        }
      }

      // build partial update set
      const updates: Partial<typeof skill.$inferInsert> = {};
      if (input.slug !== undefined) updates.slug = input.slug;
      if (input.name !== undefined) updates.name = input.name;
      if (input.description !== undefined) updates.description = input.description;
      if (input.skillMarkdown !== undefined) updates.skillMarkdown = input.skillMarkdown;
      if (input.frontmatter !== undefined) updates.frontmatter = input.frontmatter;
      if (input.metadata !== undefined) updates.metadata = input.metadata;
      if (input.sourceUrl !== undefined) updates.sourceUrl = input.sourceUrl ?? null;
      if (input.sourceIdentifier !== undefined)
        updates.sourceIdentifier = input.sourceIdentifier ?? null;
      if (isVaultMove) updates.ownerVaultId = targetVaultId;

      let updatedSkill = existing;

      if (Object.keys(updates).length > 0) {
        const [row] = await db.update(skill).set(updates).where(eq(skill.id, input.id)).returning();
        if (row) updatedSkill = row;
      }

      const linkSyncSources: AutoLinkSourceInput[] = [];

      if (input.skillMarkdown !== undefined) {
        linkSyncSources.push({
          type: "skill",
          sourceId: input.id,
          sourceOwnerVaultId: targetVaultId,
          markdown: input.skillMarkdown,
        });
      }

      // handle resource mutations when provided
      if (input.resources) {
        const toDelete = input.resources.filter((resource) => resource.delete && resource.id);
        const toUpdate = input.resources.filter((resource) => resource.id && !resource.delete);
        const toInsert = input.resources.filter((resource) => !resource.id && !resource.delete);

        if (toDelete.length > 0) {
          await db.delete(skillResource).where(
            and(
              eq(skillResource.skillId, input.id),
              inArray(
                skillResource.id,
                toDelete.map((resource) => resource.id!),
              ),
            ),
          );
        }

        for (const r of toUpdate) {
          await db
            .update(skillResource)
            .set({
              path: r.path,
              kind: r.kind,
              content: r.content,
              metadata: r.metadata,
            })
            .where(and(eq(skillResource.id, r.id!), eq(skillResource.skillId, input.id)));

          linkSyncSources.push({
            type: "resource",
            sourceId: r.id!,
            sourceOwnerVaultId: targetVaultId,
            markdown: r.content,
          });
        }

        if (toInsert.length > 0) {
          const insertedResources = await db
            .insert(skillResource)
            .values(
              toInsert.map((r) => ({
                skillId: input.id,
                path: r.path,
                kind: r.kind,
                content: r.content,
                metadata: r.metadata,
              })),
            )
            .returning({ id: skillResource.id, content: skillResource.content });

          for (const insertedResource of insertedResources) {
            linkSyncSources.push({
              type: "resource",
              sourceId: insertedResource.id,
              sourceOwnerVaultId: targetVaultId,
              markdown: insertedResource.content,
            });
          }
        }
      }

      if (linkSyncSources.length > 0) {
        try {
          await syncAutoLinksForSources(linkSyncSources, userId);
        } catch (error) {
          throwMentionValidationError(error);
        }
      }

      // fetch final resources state
      const resources = await db
        .select()
        .from(skillResource)
        .where(eq(skillResource.skillId, input.id));

      const vaultMap = await getVaultMetadataByIds([targetVaultId]);
      const vaultMeta = buildVaultMeta(targetVaultId, vaultMap, {
        overrideReadOnly: false,
        isEnabled: writableMembership.isEnabled,
      });
      return await toSkillOutput(updatedSkill, resources, vaultMeta);
    }),

  graph: protectedProcedure.output(graphOutput).query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const { vaultIds, membershipByVaultId } = await getUserVaultScope(userId);
    if (vaultIds.length === 0) return { nodes: [], edges: [] };

    const skills = await db.select().from(skill).where(inArray(skill.ownerVaultId, vaultIds));

    if (skills.length === 0) return { nodes: [], edges: [] };

    const skillIds = skills.map((s) => s.id);

    const resources = await db
      .select()
      .from(skillResource)
      .where(inArray(skillResource.skillId, skillIds));

    const resourceIds = resources.map((r) => r.id);

    const links =
      skillIds.length > 0 || resourceIds.length > 0
        ? await db
            .select()
            .from(skillLink)
            .where(
              or(
                ...(skillIds.length > 0
                  ? [
                      inArray(skillLink.sourceSkillId, skillIds),
                      inArray(skillLink.targetSkillId, skillIds),
                    ]
                  : []),
                ...(resourceIds.length > 0
                  ? [
                      inArray(skillLink.sourceResourceId, resourceIds),
                      inArray(skillLink.targetResourceId, resourceIds),
                    ]
                  : []),
              ),
            )
        : [];

    const vaultMap = await getVaultMetadataByIds(skills.map((s) => s.ownerVaultId));
    return buildGraphPayload(skills, resources, links, vaultMap, membershipByVaultId);
  }),

  // connected component around a single skill in the caller's vaults
  graphForSkill: protectedProcedure
    .input(z.object({ skillId: z.string().uuid() }))
    .output(graphOutput)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { vaultIds, membershipByVaultId } = await getUserVaultScope(userId);
      if (vaultIds.length === 0) return { nodes: [], edges: [] };

      const visitedSkillIds = new Set<string>();
      const queue = [input.skillId];
      const allSkills: (typeof skill.$inferSelect)[] = [];
      const allResources: (typeof skillResource.$inferSelect)[] = [];
      const allLinks: (typeof skillLink.$inferSelect)[] = [];
      const seenLinkIds = new Set<string>();

      const MAX_ITERATIONS = 10;
      let iteration = 0;

      while (queue.length > 0 && iteration < MAX_ITERATIONS) {
        iteration++;
        const batch = queue.splice(0, queue.length).filter((id) => !visitedSkillIds.has(id));
        if (batch.length === 0) break;

        for (const id of batch) visitedSkillIds.add(id);

        const skills = await db
          .select()
          .from(skill)
          .where(and(inArray(skill.id, batch), inArray(skill.ownerVaultId, vaultIds)));

        const foundIds = skills.map((s) => s.id);
        if (foundIds.length === 0) break;

        allSkills.push(...skills);

        const resources = await db
          .select()
          .from(skillResource)
          .where(inArray(skillResource.skillId, foundIds));

        allResources.push(...resources);

        const resourceIds = resources.map((r) => r.id);
        const linkConditions = [
          inArray(skillLink.sourceSkillId, foundIds),
          inArray(skillLink.targetSkillId, foundIds),
          ...(resourceIds.length > 0
            ? [
                inArray(skillLink.sourceResourceId, resourceIds),
                inArray(skillLink.targetResourceId, resourceIds),
              ]
            : []),
        ];

        const links = await db
          .select()
          .from(skillLink)
          .where(or(...linkConditions));

        for (const l of links) {
          if (!seenLinkIds.has(l.id)) {
            seenLinkIds.add(l.id);
            allLinks.push(l);
          }
        }

        // queue newly discovered skill IDs from direct skill references
        for (const l of links) {
          if (l.sourceSkillId && !visitedSkillIds.has(l.sourceSkillId)) queue.push(l.sourceSkillId);
          if (l.targetSkillId && !visitedSkillIds.has(l.targetSkillId)) queue.push(l.targetSkillId);
        }

        // for resource references, look up parent skills we haven't visited yet
        const unknownResourceIds = links
          .flatMap((l) => [l.sourceResourceId, l.targetResourceId])
          .filter((id): id is string => !!id && !allResources.some((r) => r.id === id));

        if (unknownResourceIds.length > 0) {
          const extra = await db
            .select({ skillId: skillResource.skillId })
            .from(skillResource)
            .where(inArray(skillResource.id, unknownResourceIds));

          for (const row of extra) {
            if (!visitedSkillIds.has(row.skillId)) queue.push(row.skillId);
          }
        }
      }

      const vaultMap = await getVaultMetadataByIds(allSkills.map((s) => s.ownerVaultId));
      return buildGraphPayload(allSkills, allResources, allLinks, vaultMap, membershipByVaultId);
    }),

  graphForShare: publicProcedure
    .input(z.object({ shareId: z.string().uuid() }))
    .output(graphOutput)
    .query(async ({ input }) => {
      const [shareRow] = await db.select().from(skillShare).where(eq(skillShare.id, input.shareId));

      if (!shareRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Shared skill not found" });
      }

      const snapshot = parseShareSnapshot(shareRow.snapshot);
      return buildGraphPayloadFromShareSnapshot(snapshot);
    }),

  previewShare: protectedProcedure
    .input(z.object({ skillId: z.string().uuid() }))
    .output(sharePreviewOutput)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const [existingSkill] = await db
        .select({ id: skill.id, ownerVaultId: skill.ownerVaultId })
        .from(skill)
        .where(eq(skill.id, input.skillId));

      if (!existingSkill) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Skill not found" });
      }

      let membership: Awaited<ReturnType<typeof assertCanRead>>;
      try {
        membership = await assertCanRead(userId, existingSkill.ownerVaultId);
      } catch (error) {
        if (error instanceof VaultAccessError) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Skill not found" });
        }

        throw error;
      }

      if (
        membership.vaultType === "enterprise" &&
        membership.role !== "owner" &&
        membership.role !== "admin"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only enterprise admins can share enterprise skills",
        });
      }

      const { vaultIds } = await getUserVaultScope(userId);
      const snapshot = await buildShareSnapshotForSkill(existingSkill.id, vaultIds);
      const summary = summarizeShareSnapshot(snapshot);

      return {
        rootSkillId: snapshot.rootSkillId,
        includedSkills: summary.includedSkills,
        stats: summary.stats,
      };
    }),

  createShare: protectedProcedure
    .input(z.object({ skillId: z.string().uuid() }))
    .output(createShareOutput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const [existingSkill] = await db
        .select({ id: skill.id, ownerVaultId: skill.ownerVaultId })
        .from(skill)
        .where(eq(skill.id, input.skillId));

      if (!existingSkill) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Skill not found" });
      }

      let membership;
      try {
        membership = await assertCanRead(userId, existingSkill.ownerVaultId);
      } catch (error) {
        if (error instanceof VaultAccessError) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Skill not found" });
        }

        throw error;
      }

      if (
        membership.vaultType === "enterprise" &&
        membership.role !== "owner" &&
        membership.role !== "admin"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only enterprise admins can share enterprise skills",
        });
      }

      const { vaultIds } = await getUserVaultScope(userId);
      const snapshot = await buildShareSnapshotForSkill(existingSkill.id, vaultIds);

      const [createdShare] = await db
        .insert(skillShare)
        .values({
          createdByUserId: userId,
          rootSkillId: existingSkill.id,
          snapshot,
        })
        .returning({ id: skillShare.id });

      if (!createdShare) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create share link",
        });
      }

      return { shareId: createdShare.id };
    }),

  getShareById: publicProcedure
    .input(
      z.object({
        shareId: z.string().uuid(),
        skillId: z.string().uuid().optional(),
      }),
    )
    .output(sharedSkillPreviewOutput)
    .query(async ({ input }) => {
      const [shareRow] = await db.select().from(skillShare).where(eq(skillShare.id, input.shareId));

      if (!shareRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Shared skill not found" });
      }

      const snapshot = parseShareSnapshot(shareRow.snapshot);
      const rootSkillSnapshot = snapshot.skills.find((skillSnapshot) => {
        return normalizeEntityId(skillSnapshot.id) === normalizeEntityId(snapshot.rootSkillId);
      });

      if (!rootSkillSnapshot) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Shared skill snapshot is missing the root skill",
        });
      }

      const requestedSkillId = input.skillId ? normalizeEntityId(input.skillId) : null;
      const requestedSkillSnapshot = requestedSkillId
        ? snapshot.skills.find((skillSnapshot) => {
            return normalizeEntityId(skillSnapshot.id) === requestedSkillId;
          })
        : null;

      const activeSkillSnapshot = requestedSkillSnapshot ?? rootSkillSnapshot;

      const renderContext = buildShareSnapshotRenderContext(snapshot);

      const summary = summarizeShareSnapshot(snapshot);

      return {
        shareId: shareRow.id,
        createdAt: shareRow.createdAt,
        includedSkills: summary.includedSkills,
        stats: {
          skills: summary.stats.skills,
          resources: renderContext.totalResources,
          links: summary.stats.links,
        },
        rootSkill: toSharedSkillDetailOutput(rootSkillSnapshot, renderContext),
        activeSkill: toSharedSkillDetailOutput(activeSkillSnapshot, renderContext),
      };
    }),

  getShareInstallPackage: publicProcedure
    .input(z.object({ shareId: z.string().uuid() }))
    .output(shareInstallPackageOutput)
    .query(async ({ input }) => {
      const [shareRow] = await db.select().from(skillShare).where(eq(skillShare.id, input.shareId));

      if (!shareRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Shared skill not found" });
      }

      const snapshot = parseShareSnapshot(shareRow.snapshot);
      const summary = summarizeShareSnapshot(snapshot);
      const { skillNameById, resourceInfoById, resourceOwnerSkillIdById } =
        buildShareSnapshotRenderContext(snapshot);

      return {
        shareId: shareRow.id,
        rootSkillId: snapshot.rootSkillId,
        createdAt: shareRow.createdAt,
        includedSkills: summary.includedSkills,
        skills: snapshot.skills.map((snapshotSkill) => ({
          id: snapshotSkill.id,
          slug: snapshotSkill.slug,
          name: snapshotSkill.name,
          description: snapshotSkill.description,
          frontmatter: snapshotSkill.frontmatter,
          originalMarkdown: snapshotSkill.skillMarkdown,
          renderedMarkdown: renderSnapshotMarkdown(snapshotSkill.skillMarkdown, {
            skillNameById,
            resourceInfoById,
            currentSkillId: snapshotSkill.id,
          }),
          sourceUrl: snapshotSkill.sourceUrl,
          sourceIdentifier: snapshotSkill.sourceIdentifier,
          resources: snapshotSkill.resources
            .slice()
            .sort(
              (left, right) =>
                left.path.localeCompare(right.path) || left.id.localeCompare(right.id),
            )
            .map((snapshotResource) => ({
              path: snapshotResource.path,
              kind: snapshotResource.kind,
              renderedContent: renderSnapshotMarkdown(snapshotResource.content, {
                skillNameById,
                resourceInfoById,
                currentSkillId:
                  resourceOwnerSkillIdById.get(normalizeEntityId(snapshotResource.id)) ??
                  snapshotSkill.id,
              }),
            })),
        })),
      };
    }),

  importShare: protectedProcedure
    .input(z.object({ shareId: z.string().uuid() }))
    .output(importShareOutput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const [shareRow] = await db.select().from(skillShare).where(eq(skillShare.id, input.shareId));

      if (!shareRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Shared skill not found" });
      }

      const snapshot = parseShareSnapshot(shareRow.snapshot);

      let targetVaultId: string;
      try {
        targetVaultId = await getPersonalVaultId(userId);
      } catch (error) {
        if (error instanceof VaultAccessError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Personal vault not found",
          });
        }
        throw error;
      }

      try {
        await assertCanWrite(userId, targetVaultId);
      } catch (error) {
        if (error instanceof VaultAccessError) {
          throw new TRPCError({ code: "FORBIDDEN", message: error.message });
        }

        throw error;
      }

      const existingSlugsInVault = await db
        .select({ slug: skill.slug })
        .from(skill)
        .where(eq(skill.ownerVaultId, targetVaultId));

      const usedSlugs = new Set(existingSlugsInVault.map((existingSlug) => existingSlug.slug));

      const skillIdMap = new Map<string, string>();
      const resourceIdMap = new Map<string, string>();

      for (const sharedSkill of snapshot.skills) {
        skillIdMap.set(normalizeEntityId(sharedSkill.id), randomUUID());
        for (const sharedResource of sharedSkill.resources) {
          resourceIdMap.set(normalizeEntityId(sharedResource.id), randomUUID());
        }
      }

      const mentionIdMap = new Map<string, string>([
        ...skillIdMap.entries(),
        ...resourceIdMap.entries(),
      ]);

      const importedSkillValues: (typeof skill.$inferInsert)[] = snapshot.skills.map(
        (sharedSkill) => {
          const nextSkillId = skillIdMap.get(normalizeEntityId(sharedSkill.id));
          if (!nextSkillId) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to map imported skill IDs",
            });
          }

          return {
            id: nextSkillId,
            ownerUserId: userId,
            ownerVaultId: targetVaultId,
            slug: buildUniqueImportSlug(sharedSkill.slug, usedSlugs),
            name: sharedSkill.name,
            description: sharedSkill.description,
            skillMarkdown: remapMentionTargetIds(sharedSkill.skillMarkdown, mentionIdMap),
            frontmatter: sharedSkill.frontmatter,
            metadata: sharedSkill.metadata,
            sourceUrl: sharedSkill.sourceUrl,
            sourceIdentifier: sharedSkill.sourceIdentifier,
          };
        },
      );

      if (importedSkillValues.length > 0) {
        await db.insert(skill).values(importedSkillValues).execute();
      }

      const importedResourceValues: (typeof skillResource.$inferInsert)[] = [];

      for (const sharedSkill of snapshot.skills) {
        const mappedSkillId = skillIdMap.get(normalizeEntityId(sharedSkill.id));
        if (!mappedSkillId) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to map imported skill IDs",
          });
        }

        for (const sharedResource of sharedSkill.resources) {
          const mappedResourceId = resourceIdMap.get(normalizeEntityId(sharedResource.id));
          if (!mappedResourceId) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to map imported resource IDs",
            });
          }

          importedResourceValues.push({
            id: mappedResourceId,
            skillId: mappedSkillId,
            path: sharedResource.path,
            kind: sharedResource.kind,
            content: remapMentionTargetIds(sharedResource.content, mentionIdMap),
            metadata: sharedResource.metadata,
          });
        }
      }

      if (importedResourceValues.length > 0) {
        await db.insert(skillResource).values(importedResourceValues).execute();
      }

      const importedLinkValues: (typeof skillLink.$inferInsert)[] = [];

      for (const sharedLink of snapshot.links) {
        const mappedSourceSkillId = sharedLink.sourceSkillId
          ? (skillIdMap.get(normalizeEntityId(sharedLink.sourceSkillId)) ?? null)
          : null;
        const mappedSourceResourceId = sharedLink.sourceResourceId
          ? (resourceIdMap.get(normalizeEntityId(sharedLink.sourceResourceId)) ?? null)
          : null;
        const mappedTargetSkillId = sharedLink.targetSkillId
          ? (skillIdMap.get(normalizeEntityId(sharedLink.targetSkillId)) ?? null)
          : null;
        const mappedTargetResourceId = sharedLink.targetResourceId
          ? (resourceIdMap.get(normalizeEntityId(sharedLink.targetResourceId)) ?? null)
          : null;

        const sourceCount =
          Number(Boolean(mappedSourceSkillId)) + Number(Boolean(mappedSourceResourceId));
        const targetCount =
          Number(Boolean(mappedTargetSkillId)) + Number(Boolean(mappedTargetResourceId));

        if (sourceCount !== 1 || targetCount !== 1) continue;

        importedLinkValues.push({
          sourceSkillId: mappedSourceSkillId,
          sourceResourceId: mappedSourceResourceId,
          targetSkillId: mappedTargetSkillId,
          targetResourceId: mappedTargetResourceId,
          kind: sharedLink.kind,
          note: sharedLink.note,
          metadata: sharedLink.metadata,
          createdByUserId: userId,
        });
      }

      if (importedLinkValues.length > 0) {
        await db.insert(skillLink).values(importedLinkValues).execute();
      }

      const importedRootSkillId = skillIdMap.get(normalizeEntityId(snapshot.rootSkillId));
      if (!importedRootSkillId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to resolve imported root skill",
        });
      }

      return {
        rootSkillId: importedRootSkillId,
        importedSkills: importedSkillValues.length,
        importedResources: importedResourceValues.length,
        importedLinks: importedLinkValues.length,
      };
    }),

  references: protectedProcedure
    .input(z.object({ skillId: z.string().uuid() }))
    .output(
      z.object({
        references: z.array(
          z.object({
            linkId: z.string().uuid(),
            sourceSkillId: z.string().uuid(),
            sourceSkillName: z.string(),
            sourceSkillSlug: z.string(),
            sourceResourcePath: z.string().nullable(),
            kind: z.string(),
          }),
        ),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const [existing] = await db
        .select({ id: skill.id, ownerVaultId: skill.ownerVaultId })
        .from(skill)
        .where(eq(skill.id, input.skillId));

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Skill not found" });
      }

      try {
        await assertCanRead(userId, existing.ownerVaultId);
      } catch (e) {
        if (e instanceof VaultAccessError) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Skill not found" });
        }
        throw e;
      }

      // get this skill's resource IDs to detect resource-level inbound refs
      const ownResources = await db
        .select({ id: skillResource.id })
        .from(skillResource)
        .where(eq(skillResource.skillId, input.skillId));
      const ownResourceIds = ownResources.map((r) => r.id);

      // find all links targeting this skill or its resources
      const targetConditions = [eq(skillLink.targetSkillId, input.skillId)];
      if (ownResourceIds.length > 0) {
        targetConditions.push(inArray(skillLink.targetResourceId, ownResourceIds));
      }

      const links = await db
        .select({
          linkId: skillLink.id,
          sourceSkillId: skillLink.sourceSkillId,
          sourceResourceId: skillLink.sourceResourceId,
          kind: skillLink.kind,
        })
        .from(skillLink)
        .where(or(...targetConditions));

      // batch-resolve source skills and resources
      const sourceSkillIds = new Set<string>();
      const sourceResourceIds = new Set<string>();

      for (const link of links) {
        if (link.sourceSkillId && link.sourceSkillId !== input.skillId) {
          sourceSkillIds.add(link.sourceSkillId);
        } else if (link.sourceResourceId && !ownResourceIds.includes(link.sourceResourceId)) {
          sourceResourceIds.add(link.sourceResourceId);
        }
      }

      const sourceResources =
        sourceResourceIds.size > 0
          ? await db
              .select({
                id: skillResource.id,
                skillId: skillResource.skillId,
                path: skillResource.path,
              })
              .from(skillResource)
              .where(inArray(skillResource.id, [...sourceResourceIds]))
          : [];

      const resourceMap = new Map(sourceResources.map((r) => [r.id, r]));

      for (const r of sourceResources) {
        sourceSkillIds.add(r.skillId);
      }

      const sourceSkills =
        sourceSkillIds.size > 0
          ? await db
              .select({ id: skill.id, name: skill.name, slug: skill.slug })
              .from(skill)
              .where(inArray(skill.id, [...sourceSkillIds]))
          : [];

      const skillMap = new Map(sourceSkills.map((s) => [s.id, s]));

      // build results, filtering out self-references
      const results = [];

      for (const link of links) {
        let resolvedSkillId: string;
        let sourceResourcePath: string | null = null;

        if (link.sourceSkillId) {
          if (link.sourceSkillId === input.skillId) continue;
          resolvedSkillId = link.sourceSkillId;
        } else if (link.sourceResourceId) {
          if (ownResourceIds.includes(link.sourceResourceId)) continue;
          const srcResource = resourceMap.get(link.sourceResourceId);
          if (!srcResource) continue;
          resolvedSkillId = srcResource.skillId;
          sourceResourcePath = srcResource.path;
        } else {
          continue;
        }

        const srcSkill = skillMap.get(resolvedSkillId);
        if (!srcSkill) continue;

        results.push({
          linkId: link.linkId,
          sourceSkillId: srcSkill.id,
          sourceSkillName: srcSkill.name,
          sourceSkillSlug: srcSkill.slug,
          sourceResourcePath,
          kind: link.kind,
        });
      }

      return { references: results };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const [existing] = await db
        .select({ id: skill.id, ownerVaultId: skill.ownerVaultId })
        .from(skill)
        .where(eq(skill.id, input.id));

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Skill not found" });
      }

      try {
        await assertCanWrite(userId, existing.ownerVaultId);
      } catch (e) {
        if (e instanceof VaultAccessError) {
          throw new TRPCError({ code: "FORBIDDEN", message: e.message });
        }
        throw e;
      }

      // hard delete — FK cascades handle resources and links
      await db.delete(skill).where(eq(skill.id, input.id));

      return { success: true as const };
    }),
});
