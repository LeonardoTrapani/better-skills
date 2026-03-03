import { parseSkillIdentifier } from "./vault-identifiers";

type SkillGetByIdInput = {
  id: string;
  linkMentions?: boolean;
};

type SkillGetBySlugInput = {
  slug: string;
  vaultSlug?: string;
  linkMentions?: boolean;
};

type SkillLookupClient<TSkill> = {
  skills: {
    getById: {
      query(input: SkillGetByIdInput): Promise<TSkill>;
    };
    getBySlug: {
      query(input: SkillGetBySlugInput): Promise<TSkill>;
    };
  };
};

export async function resolveSkillIdentifier<TSkill>(
  client: SkillLookupClient<TSkill>,
  identifier: string,
  options?: { linkMentions?: boolean },
): Promise<TSkill> {
  const parsed = parseSkillIdentifier(identifier);

  if (parsed.kind === "uuid") {
    return await client.skills.getById.query({
      id: parsed.id,
      linkMentions: options?.linkMentions,
    });
  }

  if (parsed.kind === "vault-slug") {
    return await client.skills.getBySlug.query({
      slug: parsed.skillSlug,
      vaultSlug: parsed.vaultSlug,
      linkMentions: options?.linkMentions,
    });
  }

  return await client.skills.getBySlug.query({
    slug: parsed.slug,
    linkMentions: options?.linkMentions,
  });
}
