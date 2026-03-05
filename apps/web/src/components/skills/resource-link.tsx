"use client";

import type { MouseEvent, ReactNode } from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { NodePreviewCard } from "@/components/skills/graph/node-preview-card";
import { canRenderResourceAsMarkdown } from "@/components/markdown/resource-file";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { trpc } from "@/lib/api/trpc";
import { buildResourceHref, type SkillResourceReference } from "@/lib/skills/resource-links";

export type ResourceLike = SkillResourceReference;

export function ResourceHoverLink({
  resource,
  skillId,
  skillName,
  className,
  children,
  onNavigate,
}: {
  resource: ResourceLike;
  skillId: string;
  skillName?: string;
  className?: string;
  children?: ReactNode;
  onNavigate?: (event: MouseEvent<HTMLElement>, href: ReturnType<typeof buildResourceHref>) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const previewUnavailable = !canRenderResourceAsMarkdown(resource.path, resource.kind);
  const hasInlinePreview = resource.renderedContent.trim().length > 0;
  const previewQuery = useQuery({
    ...trpc.skills.getResourceBySkillIdAndPath.queryOptions({
      skillId,
      resourcePath: resource.path,
    }),
    enabled: isOpen && !previewUnavailable && !hasInlinePreview,
    staleTime: 60_000,
  });
  const contentSnippet = previewUnavailable
    ? null
    : hasInlinePreview
      ? resource.renderedContent
      : (previewQuery.data?.renderedContent ?? null);
  const href = buildResourceHref(skillId, resource.path);

  return (
    <HoverCard onOpenChange={setIsOpen}>
      <HoverCardTrigger
        href={href}
        onClick={(event) => onNavigate?.(event, href)}
        className={className ?? "text-primary underline underline-offset-4"}
      >
        {children ?? resource.path}
      </HoverCardTrigger>
      <HoverCardContent className="w-auto border-none bg-transparent p-0 shadow-none ring-0">
        <NodePreviewCard
          data={{
            label: resource.path,
            type: "resource",
            description: null,
            contentSnippet,
            slug: null,
            kind: resource.kind,
            parentSkillName: skillName ?? null,
            updatedAt: resource.updatedAt,
            previewUnavailable,
            showResourceContentPreview: true,
          }}
        />
      </HoverCardContent>
    </HoverCard>
  );
}
