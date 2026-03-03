import pc from "picocolors";

import { readErrorMessage } from "../lib/errors";
import { trpc } from "../lib/trpc";
import * as ui from "../lib/ui";
import { UUID_RE } from "../lib/uuid";
import { formatVaultName } from "../lib/vault-display";

function matchesVaultTarget(
  target: string,
  membership: Awaited<ReturnType<typeof trpc.vaults.listMine.query>>[number],
) {
  if (UUID_RE.test(target)) {
    return membership.vaultId.toLowerCase() === target;
  }

  return membership.vault.slug.toLowerCase() === target;
}

export async function disableCommand() {
  const targetArg = process.argv[3]?.trim();

  if (!targetArg) {
    ui.log.error("usage: better-skills disable <vault-slug|vault-id>");
    process.exit(1);
  }

  const target = targetArg.toLowerCase();
  const spinner = ui.spinner();
  spinner.start("loading vault memberships");

  try {
    const memberships = await trpc.vaults.listMine.query();
    const membership = memberships.find((candidate) => matchesVaultTarget(target, candidate));

    if (!membership) {
      spinner.stop(pc.red(`vault "${targetArg}" not found in your memberships`));
      process.exit(1);
    }

    if (!membership.isEnabled) {
      spinner.stop(pc.dim(`${formatVaultName(membership.vault)} is already disabled`));
      return;
    }

    spinner.stop(pc.dim(`disabling ${formatVaultName(membership.vault)}`));

    const updateSpinner = ui.spinner();
    updateSpinner.start("updating vault status");
    await trpc.vaults.setEnabled.mutate({ vaultId: membership.vaultId, isEnabled: false });
    updateSpinner.stop(pc.green(`disabled ${formatVaultName(membership.vault)}`));
  } catch (error) {
    spinner.stop(pc.red("disable failed"));
    ui.log.error(readErrorMessage(error));
    process.exit(1);
  }
}
