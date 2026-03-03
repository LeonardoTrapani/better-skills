type VaultDisplay = {
  name: string;
  type: "personal" | "enterprise" | "system_default";
};

const VAULT_TYPE_LABEL: Record<VaultDisplay["type"], string> = {
  personal: "personal",
  enterprise: "enterprise",
  system_default: "default",
};

export function formatVaultName(vault: VaultDisplay): string {
  const trimmed = vault.name.trim();
  return trimmed.length > 0 ? trimmed : "unnamed vault";
}

export function formatVaultWithType(vault: VaultDisplay): string {
  return `${formatVaultName(vault)} (${VAULT_TYPE_LABEL[vault.type]})`;
}

export function formatVaultSkillLabel(vault: VaultDisplay, skillLabel: string): string {
  return `${formatVaultName(vault)} / ${skillLabel}`;
}
