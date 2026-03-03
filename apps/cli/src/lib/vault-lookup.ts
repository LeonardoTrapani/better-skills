import { trpc } from "./trpc";
import { UUID_RE } from "./uuid";

export type VaultMembership = Awaited<ReturnType<typeof trpc.vaults.listMine.query>>[number];

export async function listVaultMemberships(): Promise<VaultMembership[]> {
  return await trpc.vaults.listMine.query();
}

export function matchesVaultSelector(selector: string, membership: VaultMembership): boolean {
  const normalizedSelector = selector.trim().toLowerCase();

  if (UUID_RE.test(normalizedSelector)) {
    return membership.vaultId.toLowerCase() === normalizedSelector;
  }

  return membership.vault.slug.toLowerCase() === normalizedSelector;
}

export async function resolveVaultId(selector: string): Promise<string> {
  const memberships = await listVaultMemberships();
  const match = memberships.find((membership) => matchesVaultSelector(selector, membership));

  if (!match) {
    throw new Error(`Vault not found: ${selector}`);
  }

  return match.vaultId;
}
