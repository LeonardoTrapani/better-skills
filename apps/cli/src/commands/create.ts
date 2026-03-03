import pc from "picocolors";

import {
  loadLocalSkillDraft,
  readErrorMessage,
  resolveNewResourceMentions,
  slugify,
} from "../lib/skill-io";
import { trpc } from "../lib/trpc";
import * as ui from "../lib/ui";
import { UUID_RE } from "../lib/uuid";

function parseArgs(argv: string[]) {
  const args = argv.slice(3);
  let from: string | undefined;
  let slug: string | undefined;
  let vault: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === "--from" && args[i + 1]) {
      from = args[++i];
    } else if (arg === "--slug" && args[i + 1]) {
      slug = args[++i];
    } else if (arg === "--vault" && args[i + 1]) {
      vault = args[++i];
    }
  }

  return { from, slug, vault };
}

async function resolveVaultId(vault: string): Promise<string> {
  const trimmedVault = vault.trim();
  if (UUID_RE.test(trimmedVault)) {
    return trimmedVault;
  }

  const memberships = await trpc.vaults.listMine.query();
  const match = memberships.find(
    (membership) => membership.vault.slug.toLowerCase() === trimmedVault.toLowerCase(),
  );

  if (!match) {
    throw new Error(`Vault not found: ${vault}`);
  }

  return match.vaultId;
}

export async function createCommand() {
  const { from, slug: slugOverride, vault: vaultSelector } = parseArgs(process.argv);

  if (!from) {
    ui.log.error(
      "usage: better-skills create --from <dir> [--slug <s>] [--vault <vault-slug|vault-id>]",
    );
    process.exit(1);
  }

  let draft;
  try {
    draft = await loadLocalSkillDraft(from);
  } catch (error) {
    ui.log.error(readErrorMessage(error));
    process.exit(1);
  }

  const slug =
    slugOverride ||
    (typeof draft.frontmatter.slug === "string" ? draft.frontmatter.slug : null) ||
    slugify(draft.name);

  const s = ui.spinner();
  s.start("creating skill");

  let createdSkill: Awaited<ReturnType<typeof trpc.skills.create.mutate>> | null = null;
  let vaultId: string | undefined;

  try {
    if (vaultSelector) {
      s.message("resolving vault");
      vaultId = await resolveVaultId(vaultSelector);
    }

    createdSkill = await trpc.skills.create.mutate({
      slug,
      name: draft.name,
      description: draft.description,
      skillMarkdown: draft.markdownForMutation,
      frontmatter: draft.frontmatter,
      resources: draft.resourcesForMutation,
      vaultId,
    });

    if (draft.newResourcePaths.length > 0) {
      s.message("resolving local new resource mentions");
      const resolved = await resolveNewResourceMentions(
        createdSkill.id,
        draft,
        createdSkill.resources,
      );
      if (resolved) createdSkill = resolved;
    }

    s.stop(pc.green("skill created"));

    console.log(
      JSON.stringify({
        id: createdSkill.id,
        slug: createdSkill.slug,
        name: createdSkill.name,
      }),
    );
  } catch (error) {
    s.stop(pc.red("creation failed"));

    if (createdSkill) {
      ui.log.error(`skill was created but finalization failed: ${createdSkill.id}`);
    }

    ui.log.error(readErrorMessage(error));
    process.exit(1);
  }
}
