import { sql } from "@better-skills/db";

import { syncDefaultSkillsToDefaultVault } from "./default-skills";
import { backfillSystemDefaultVaultMemberships } from "./system-default-vault";

async function main(): Promise<void> {
  try {
    // ensure the system-default vault exists and all users are members
    const vaultResult = await backfillSystemDefaultVaultMemberships();
    console.log(
      `[vault] system-default vault=${vaultResult.vaultId} memberships added=${vaultResult.added}`,
    );

    const startedAt = Date.now();
    const result = await syncDefaultSkillsToDefaultVault();
    const durationMs = Date.now() - startedAt;

    console.log(
      `[default-skills] templates=${result.templates} matched=${result.matched} updated=${result.updated} skipped=${result.skipped} failed=${result.failed} durationMs=${durationMs}`,
    );

    if (result.failed > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("[default-skills] sync failed", error);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main();
