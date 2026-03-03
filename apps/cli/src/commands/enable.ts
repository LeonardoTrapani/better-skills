import pc from "picocolors";

import { readErrorMessage } from "../lib/errors";
import { trpc } from "../lib/trpc";
import * as ui from "../lib/ui";
import { listVaultMemberships, matchesVaultSelector } from "../lib/vault-lookup";
import { formatVaultName } from "../lib/vault-display";

export async function enableCommand() {
  const targetArg = process.argv[3]?.trim();

  if (!targetArg) {
    ui.log.error("usage: better-skills enable <vault-slug|vault-id>");
    process.exit(1);
  }

  const target = targetArg.toLowerCase();
  const spinner = ui.spinner();
  spinner.start("loading vault memberships");

  try {
    const memberships = await listVaultMemberships();
    const membership = memberships.find((candidate) => matchesVaultSelector(target, candidate));

    if (!membership) {
      spinner.stop(pc.red(`vault "${targetArg}" not found in your memberships`));
      process.exit(1);
    }

    if (membership.isEnabled) {
      spinner.stop(pc.dim(`${formatVaultName(membership.vault)} is already enabled`));
      return;
    }

    spinner.stop(pc.dim(`enabling ${formatVaultName(membership.vault)}`));

    const updateSpinner = ui.spinner();
    updateSpinner.start("updating vault status");
    await trpc.vaults.setEnabled.mutate({ vaultId: membership.vaultId, isEnabled: true });
    updateSpinner.stop(pc.green(`enabled ${formatVaultName(membership.vault)}`));
  } catch (error) {
    spinner.stop(pc.red("enable failed"));
    ui.log.error(readErrorMessage(error));
    process.exit(1);
  }
}
