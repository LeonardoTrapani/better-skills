import { UUID_RE } from "./uuid";

export type ParsedSkillIdentifier =
  | { kind: "uuid"; id: string }
  | { kind: "vault-slug"; vaultSlug: string; skillSlug: string }
  | { kind: "slug"; slug: string };

export type VaultSlugCandidate = {
  vaultSlug: string;
  vaultName?: string;
};

export function parseSkillIdentifier(input: string): ParsedSkillIdentifier {
  const trimmed = input.trim();

  if (UUID_RE.test(trimmed)) {
    return { kind: "uuid", id: trimmed.toLowerCase() };
  }

  const slashIndex = trimmed.indexOf("/");
  if (slashIndex > 0 && slashIndex < trimmed.length - 1) {
    const vaultSlug = trimmed.slice(0, slashIndex).trim();
    const skillSlug = trimmed.slice(slashIndex + 1).trim();
    if (vaultSlug.length > 0 && skillSlug.length > 0) {
      return {
        kind: "vault-slug",
        vaultSlug: vaultSlug.toLowerCase(),
        skillSlug: skillSlug.toLowerCase(),
      };
    }
  }

  return { kind: "slug", slug: trimmed.toLowerCase() };
}

export function formatAmbiguousSlugMessage(slug: string, candidates: VaultSlugCandidate[]): string {
  const lines = [
    `ambiguous skill slug "${slug}"; provide <vault-slug>/<skill-slug>`,
    "matches:",
    ...candidates
      .slice()
      .sort((a, b) => a.vaultSlug.localeCompare(b.vaultSlug))
      .map((candidate) =>
        candidate.vaultName
          ? `- ${candidate.vaultSlug}/${slug} (${candidate.vaultName})`
          : `- ${candidate.vaultSlug}/${slug}`,
      ),
  ];

  return lines.join("\n");
}
