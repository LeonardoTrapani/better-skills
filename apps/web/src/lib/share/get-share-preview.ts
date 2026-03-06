import "server-only";

import { env } from "@better-skills/env/web";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SharedSkillResource = {
  id: string;
  path: string;
  kind: string;
  content: string;
  renderedContent: string;
  metadata: Record<string, unknown>;
};

type SharedSkillDetail = {
  id: string;
  slug: string;
  name: string;
  description: string;
  originalMarkdown: string;
  renderedMarkdown: string;
  sourceUrl: string | null;
  sourceIdentifier: string | null;
  resources: SharedSkillResource[];
};

export type SharedSkillPreview = {
  shareId: string;
  createdAt: string | Date;
  includedSkills: Array<{
    id: string;
    slug: string;
    name: string;
  }>;
  stats: {
    skills: number;
    resources: number;
    links: number;
  };
  rootSkill: SharedSkillDetail;
  activeSkill: SharedSkillDetail;
};

type TrpcDataEnvelope = SharedSkillPreview | { json?: SharedSkillPreview };

type TrpcResponse = {
  result?: {
    data?: TrpcDataEnvelope;
  };
};

function isUuid(value: string | null | undefined): value is string {
  return Boolean(value && UUID_PATTERN.test(value));
}

function unwrapTrpcData(data: TrpcDataEnvelope | undefined): SharedSkillPreview | null {
  if (!data) return null;

  if ("shareId" in data) {
    return data;
  }

  if (data.json && "shareId" in data.json) {
    return data.json;
  }

  return null;
}

export async function getSharePreview({ shareId, skillId }: { shareId: string; skillId?: string }) {
  if (!isUuid(shareId)) {
    return null;
  }

  const normalizedSkillId = isUuid(skillId) ? skillId : undefined;

  try {
    const input = normalizedSkillId ? { shareId, skillId: normalizedSkillId } : { shareId };
    const url = `${env.NEXT_PUBLIC_SERVER_URL}/trpc/skills.getShareById?input=${encodeURIComponent(JSON.stringify(input))}`;

    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const json = (await res.json()) as TrpcResponse;
    return unwrapTrpcData(json.result?.data);
  } catch {
    return null;
  }
}
