import pc from "picocolors";

import { resolveInstallAgents, getAgentDisplayName } from "../lib/agents";
import { readErrorMessage } from "../lib/errors";
import { installSkill, type InstallableSkill } from "../lib/skills-installer";
import { trpc } from "../lib/trpc";
import * as ui from "../lib/ui";
import { UUID_RE } from "../lib/uuid";

type ShareInstallPackage = Awaited<ReturnType<typeof trpc.skills.getShareInstallPackage.query>>;
type ShareInstallSkill = ShareInstallPackage["skills"][number];

function parseArgs(argv: string[]) {
  const args = argv.slice(3);
  const source = args.find((arg) => !arg.startsWith("--"));
  return { source };
}

function resolveShareId(source: string): string {
  const trimmed = source.trim();

  if (UUID_RE.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  try {
    const parsed = new URL(trimmed);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const shareIndex = segments.findIndex((segment) => segment === "share");

    if (shareIndex === -1 || !segments[shareIndex + 1]) {
      throw new Error("no share id in url");
    }

    const shareId = segments[shareIndex + 1]!;
    if (!UUID_RE.test(shareId)) {
      throw new Error("invalid share id in url");
    }

    return shareId.toLowerCase();
  } catch {
    throw new Error("invalid share identifier. expected a share uuid or /share/<uuid> url");
  }
}

function buildShareInstallKey(shareId: string, skillSlug: string): string {
  return `shared-${shareId.slice(0, 8)}-${skillSlug}`;
}

function toInstallableSkill(
  shareId: string,
  createdAt: Date | string,
  skill: ShareInstallSkill,
): InstallableSkill {
  const normalizedCreatedAt = createdAt instanceof Date ? createdAt : new Date(createdAt);

  return {
    id: skill.id,
    slug: skill.slug,
    name: skill.name,
    description: skill.description,
    remoteUpdatedAt: Number.isNaN(normalizedCreatedAt.getTime())
      ? new Date().toISOString()
      : normalizedCreatedAt.toISOString(),
    originalMarkdown: skill.originalMarkdown,
    renderedMarkdown: skill.renderedMarkdown,
    frontmatter: skill.frontmatter,
    resources: skill.resources.map((resource) => ({
      path: resource.path,
      content: resource.renderedContent,
    })),
    vault: {
      id: `shared-${shareId}`,
      slug: `shared-${shareId.slice(0, 8)}`,
      name: "Shared package",
      type: "system_default",
      color: null,
      isReadOnly: true,
    },
    sourceUrl: skill.sourceUrl,
    sourceIdentifier: skill.sourceIdentifier,
  };
}

export async function installShareCommand() {
  const { source } = parseArgs(process.argv);

  if (!source) {
    ui.log.error("usage: better-skills install-share <share-url|share-uuid>");
    process.exit(1);
  }

  let shareId: string;
  try {
    shareId = resolveShareId(source);
  } catch (error) {
    ui.log.error(readErrorMessage(error));
    process.exit(1);
  }

  const selectedAgents = await resolveInstallAgents();
  if (selectedAgents.length === 0) {
    ui.log.error("no agents selected");
    process.exit(1);
  }

  ui.log.info(`targets: ${selectedAgents.map((agent) => getAgentDisplayName(agent)).join(", ")}`);

  const loadSpinner = ui.spinner();
  loadSpinner.start("loading shared package");

  let sharedPackage: ShareInstallPackage;
  try {
    sharedPackage = await trpc.skills.getShareInstallPackage.query({ shareId });
    loadSpinner.stop(pc.green(`loaded ${sharedPackage.skills.length} skill(s)`));
  } catch (error) {
    loadSpinner.stop(pc.red("failed to load shared package"));
    ui.log.error(readErrorMessage(error));
    process.exit(1);
  }

  const installSpinner = ui.spinner();
  installSpinner.start(`installing shared skills (0/${sharedPackage.skills.length})`);

  let installed = 0;
  const failures: string[] = [];

  for (const [index, skill] of sharedPackage.skills.entries()) {
    const skillLabel = `${skill.name} (${skill.slug})`;
    installSpinner.message(
      `installing ${skillLabel} (${index + 1}/${sharedPackage.skills.length})`,
    );

    try {
      await installSkill(
        toInstallableSkill(sharedPackage.shareId, sharedPackage.createdAt, skill),
        selectedAgents,
        {
          skillFolder: buildShareInstallKey(sharedPackage.shareId, skill.slug),
        },
      );
      installed += 1;
    } catch (error) {
      failures.push(`${skillLabel}: ${readErrorMessage(error)}`);
    }
  }

  if (failures.length > 0) {
    installSpinner.stop(
      pc.yellow(
        `installed ${installed}/${sharedPackage.skills.length} skill(s), ${failures.length} failed`,
      ),
    );
    for (const failure of failures) {
      ui.log.error(pc.red(`failed ${failure}`));
    }
    process.exit(1);
  }

  installSpinner.stop(pc.green(`installed ${installed} shared skill(s)`));
  ui.log.success(pc.green("shared package installed locally"));
}
