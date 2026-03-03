export const SYSTEM_DEFAULT_VAULT_COLOR = "#0f766e";

type VaultColorInput = {
  type: "personal" | "enterprise" | "system_default";
  color: string | null;
};

export function getEffectiveVaultColor(vault: VaultColorInput | null | undefined): string | null {
  if (!vault) return null;

  const color = vault.color?.trim();
  if (color) return color;

  if (vault.type === "system_default") {
    return SYSTEM_DEFAULT_VAULT_COLOR;
  }

  return null;
}
