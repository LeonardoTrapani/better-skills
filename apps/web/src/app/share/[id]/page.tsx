import type { Metadata } from "next";

import SkillDetail from "@/app/vault/skills/[id]/skill-detail";
import { getSharePreview } from "@/lib/share/get-share-preview";

type SharedSkillPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ skill?: string | string[] }>;
};

function normalizeSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function compactText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxChars: number) {
  if (value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
}

export async function generateMetadata({
  params,
  searchParams,
}: SharedSkillPageProps): Promise<Metadata> {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const selectedSkillId = normalizeSearchParam(resolvedSearchParams.skill);

  const preview = await getSharePreview({
    shareId: id,
    skillId: selectedSkillId,
  });

  if (!preview) {
    const fallbackTitle = "Shared skill | BETTER-SKILLS";
    const fallbackDescription =
      "Open this BETTER-SKILLS share link to preview the skill and import it into your vault.";

    return {
      title: fallbackTitle,
      description: fallbackDescription,
      openGraph: {
        title: fallbackTitle,
        description: fallbackDescription,
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: fallbackTitle,
        description: fallbackDescription,
      },
    };
  }

  const activeSkill = preview.activeSkill;
  const skillName = compactText(activeSkill.name) || "Shared skill";
  const skillSummary = truncateText(
    compactText(activeSkill.description) ||
      "Preview this shared skill and import it into your vault.",
    170,
  );

  const statsLabel = `${preview.stats.skills} skills, ${preview.stats.resources} resources, ${preview.stats.links} links`;
  const title = `${skillName} | Shared skill`;
  const description = `${skillSummary} ${statsLabel}.`;

  return {
    title,
    description,
    openGraph: {
      title: `${skillName} | BETTER-SKILLS share`,
      description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function SharedSkillPage({ params }: SharedSkillPageProps) {
  const { id } = await params;

  return <SkillDetail shareId={id} />;
}
