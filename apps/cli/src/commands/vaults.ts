import pc from "picocolors";

import { readErrorMessage } from "../lib/errors";
import * as ui from "../lib/ui";
import { listVaultMemberships } from "../lib/vault-lookup";
import { formatVaultWithType } from "../lib/vault-display";

const VAULT_TYPE_ORDER = {
  personal: 0,
  enterprise: 1,
  system_default: 2,
} as const;

export async function vaultsCommand() {
  const spinner = ui.spinner();
  spinner.start("loading vault memberships");

  try {
    const memberships = await listVaultMemberships();

    if (memberships.length === 0) {
      spinner.stop(pc.dim("no vault memberships found"));
      return;
    }

    const sorted = memberships.slice().sort((a, b) => {
      const typeOrder = VAULT_TYPE_ORDER[a.vault.type] - VAULT_TYPE_ORDER[b.vault.type];
      if (typeOrder !== 0) return typeOrder;
      return a.vault.name.localeCompare(b.vault.name);
    });

    spinner.stop(pc.dim(`${sorted.length} vault membership(s)`));
    console.log(`\n${sorted.length} vault membership(s):\n`);

    for (let i = 0; i < sorted.length; i++) {
      const membership = sorted[i]!;
      const access = membership.canAdmin ? "admin" : membership.canWrite ? "write" : "read";
      const status = membership.isEnabled ? "enabled" : "disabled";
      const flags = [
        membership.isReadOnly ? "read-only" : null,
        membership.vault.isSystemManaged ? "system-managed" : null,
      ].filter(Boolean);

      console.log(`[${i + 1}] ${formatVaultWithType(membership.vault)}`);
      console.log(`    slug: ${membership.vault.slug}`);
      console.log(`    id: ${membership.vault.id}`);
      console.log(`    role: ${membership.role} | access: ${access} | status: ${status}`);

      if (flags.length > 0) {
        console.log(`    flags: ${flags.join(", ")}`);
      }

      if (i < sorted.length - 1) {
        console.log();
      }
    }
  } catch (error) {
    spinner.stop(pc.red("vault listing failed"));
    ui.log.error(readErrorMessage(error));
    process.exit(1);
  }
}
