import pc from "picocolors";

import { readErrorMessage } from "../lib/errors";
import { resolveSkillIdentifier } from "../lib/resolve-skill-identifier";
import { trpc } from "../lib/trpc";
import * as ui from "../lib/ui";

export async function referencesCommand() {
  const identifier = process.argv[3];

  if (!identifier) {
    ui.log.error("usage: better-skills references <vault-slug>/<skill-slug>|<slug>|<uuid>");
    process.exit(1);
  }

  const s = ui.spinner();
  s.start("fetching skill");

  try {
    const skill = await resolveSkillIdentifier(trpc, identifier, { linkMentions: false });

    s.stop(pc.dim(`found ${skill.name}`));

    s.start("checking references");

    const { references } = await trpc.skills.references.query({ skillId: skill.id });

    s.stop(pc.dim(`found ${references.length} reference(s)`));

    if (references.length === 0) {
      console.log(`\nno other skills reference ${pc.bold(skill.name)}`);
      return;
    }

    console.log(`\n# skills referencing ${skill.name}\n`);

    for (const ref of references) {
      const source = ref.sourceResourcePath
        ? `${ref.sourceSkillName} (${ref.sourceSkillSlug}) via ${ref.sourceResourcePath}`
        : `${ref.sourceSkillName} (${ref.sourceSkillSlug})`;

      console.log(`- ${source} [${ref.kind}]`);
    }
  } catch (error) {
    s.stop(pc.red("failed"));
    ui.log.error(readErrorMessage(error));
    process.exit(1);
  }
}
