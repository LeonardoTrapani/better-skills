function sanitizeSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function buildVaultScopedInstallKey(vaultSlug: string, skillSlug: string): string {
  const vault = sanitizeSegment(vaultSlug) || "unknown-vault";
  const skill = sanitizeSegment(skillSlug) || "unnamed-skill";
  return `${vault}--${skill}`;
}

export function collectStaleVaultScopedKeys(
  expectedServerKeys: Set<string>,
  serverSkillIds: Set<string>,
  lockSkillIdsByKey: Map<string, string>,
): string[] {
  const stale: string[] = [];

  for (const [key, skillId] of lockSkillIdsByKey) {
    if (!expectedServerKeys.has(key) || !serverSkillIds.has(skillId)) {
      stale.push(key);
    }
  }

  return stale.sort((a, b) => a.localeCompare(b));
}
