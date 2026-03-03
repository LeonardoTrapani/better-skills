import pc from "picocolors";

import {
  buildUpdateResourcesPayload,
  loadLocalSkillDraft,
  readErrorMessage,
  resolveNewResourceMentions,
} from "../lib/skill-io";
import { resolveSkillIdentifier } from "../lib/resolve-skill-identifier";
import { trpc } from "../lib/trpc";
import * as ui from "../lib/ui";
import { resolveVaultId } from "../lib/vault-lookup";

function parseArgs(argv: string[]) {
  const args = argv.slice(3);
  let identifier: string | undefined;
  let from: string | undefined;
  let slug: string | undefined;
  let vault: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;

    if (!arg.startsWith("--") && !identifier) {
      identifier = arg;
      continue;
    }

    if (arg === "--from" && args[i + 1]) {
      from = args[++i];
      continue;
    }

    if (arg === "--slug" && args[i + 1]) {
      slug = args[++i];
      continue;
    }

    if (arg === "--vault" && args[i + 1]) {
      vault = args[++i];
      continue;
    }
  }

  return { identifier, from, slug, vault };
}

export async function updateCommand() {
  const { identifier, from, slug, vault: vaultSelector } = parseArgs(process.argv);

  if (!identifier || !from) {
    ui.log.error(
      "usage: better-skills update <vault-slug>/<skill-slug>|<slug>|<uuid> --from <dir> [--slug <s>] [--vault <vault-slug|vault-id>]",
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

  const s = ui.spinner();
  s.start("loading skill");

  let targetSkill: Awaited<ReturnType<typeof trpc.skills.getById.query>>;
  try {
    targetSkill = await resolveSkillIdentifier(trpc, identifier, { linkMentions: false });
    s.stop(pc.dim(`loaded ${targetSkill.slug}`));
  } catch (error) {
    s.stop(pc.red("load failed"));
    ui.log.error(readErrorMessage(error));
    process.exit(1);
  }

  const resourcesPayload = buildUpdateResourcesPayload(
    targetSkill.resources,
    draft.resourcesForMutation,
  );

  s.start("updating skill");

  let updatedSkill: Awaited<ReturnType<typeof trpc.skills.update.mutate>> | null = null;
  let vaultId: string | undefined;

  try {
    if (vaultSelector) {
      s.message("resolving vault");
      vaultId = await resolveVaultId(vaultSelector);
    }

    updatedSkill = await trpc.skills.update.mutate({
      id: targetSkill.id,
      slug,
      name: draft.name,
      description: draft.description,
      skillMarkdown: draft.markdownForMutation,
      frontmatter: draft.frontmatter,
      resources: resourcesPayload,
      vaultId,
    });

    if (draft.newResourcePaths.length > 0) {
      s.message("resolving local new resource mentions");
      const resolved = await resolveNewResourceMentions(
        updatedSkill.id,
        draft,
        updatedSkill.resources,
      );
      if (resolved) updatedSkill = resolved;
    }

    s.stop(pc.green("skill updated"));

    console.log(
      JSON.stringify({
        id: updatedSkill.id,
        slug: updatedSkill.slug,
        name: updatedSkill.name,
      }),
    );
  } catch (error) {
    s.stop(pc.red("update failed"));

    if (updatedSkill) {
      ui.log.error(`skill was updated but finalization failed: ${updatedSkill.id}`);
    }

    ui.log.error(readErrorMessage(error));
    process.exit(1);
  }
}
