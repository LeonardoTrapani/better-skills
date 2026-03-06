"use client";

import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { NodePreviewCard } from "@/components/skills/graph/node-preview-card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { trpc } from "@/lib/api/trpc";
import { buildSharedSkillViewHref } from "@/lib/skills/routes";

export function SharedSkillHoverLink({
  shareId,
  skillId,
  href,
  className,
  children,
}: {
  shareId: string;
  skillId: string;
  href?: string;
  className?: string;
  children?: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { data } = useQuery({
    ...trpc.skills.getShareById.queryOptions({
      shareId,
      skillId,
    }),
    enabled: isOpen,
    staleTime: 60_000,
  });

  const activeSkill = data?.activeSkill;
  const targetHref = href ?? buildSharedSkillViewHref(shareId, skillId);

  return (
    <HoverCard onOpenChange={setIsOpen}>
      <HoverCardTrigger
        href={targetHref}
        className={className ?? "text-primary underline underline-offset-4"}
      >
        {children ?? activeSkill?.name ?? skillId}
      </HoverCardTrigger>
      <HoverCardContent className="w-auto border-none bg-transparent p-0 shadow-none ring-0">
        <NodePreviewCard
          data={{
            label: activeSkill?.name ?? skillId,
            type: "skill",
            description: activeSkill?.description ?? null,
            contentSnippet: activeSkill?.renderedMarkdown ?? activeSkill?.originalMarkdown ?? null,
            slug: activeSkill?.slug ?? null,
            kind: null,
            parentSkillName: null,
            updatedAt: data?.createdAt ?? null,
            resourceCount: activeSkill?.resources.length,
          }}
        />
      </HoverCardContent>
    </HoverCard>
  );
}
