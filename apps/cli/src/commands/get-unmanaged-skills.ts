import pc from "picocolors";

import { resolveInstallAgents } from "../lib/agents";
import { findUnsyncedLocalSkills } from "../lib/unsynced-local-skills";
import { isPlain } from "../lib/output-mode";
import * as ui from "../lib/ui";

export async function getUnmanagedSkillsCommand() {
  const selectedAgents = await resolveInstallAgents();

  if (selectedAgents.length === 0) {
    ui.log.error("no agents configured - run better-skills config first");
    return;
  }

  const s = ui.spinner();
  s.start("scanning for unmanaged skills");

  const groups = await findUnsyncedLocalSkills(selectedAgents);
  const totalUnmanaged = groups.reduce((sum, g) => sum + g.slugs.length, 0);

  if (totalUnmanaged === 0) {
    s.stop(pc.dim("no unmanaged skills found"));
    return;
  }

  s.stop(pc.green(`found ${totalUnmanaged} unmanaged skill(s)`));

  if (isPlain) {
    for (const group of groups) {
      if (group.slugs.length === 0) continue;
      console.log(`\n${group.displayName} (${group.skillsDir}):`);
      for (const slug of group.slugs) {
        console.log(`  ${slug}`);
      }
    }

    return;
  }

  for (const group of groups) {
    if (group.slugs.length === 0) continue;

    console.log();
    ui.log.info(`${pc.bold(group.displayName)} ${pc.dim(`(${group.skillsDir})`)}`);

    for (const slug of group.slugs) {
      ui.log.info(`  ${slug}`);
    }
  }
}
