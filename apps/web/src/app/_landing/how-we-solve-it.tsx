"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GeistPixelSquare } from "geist/font/pixel";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { ForceGraph, type GraphData, type GraphNode } from "@/components/skills/graph/force-graph";
import { GridBackground } from "@/components/ui/grid-background";
import { authClient } from "@/lib/auth/auth-client";
import { trpc } from "@/lib/api/trpc";
import { CARD_EYEBROW_CLASS, CardDivider } from "./card-elements";
import { CornerInsetMarks } from "./corner-inset-marks";
import { LandingContainer, SectionTailSpacer } from "./design-system";
import { SectionBackdrop, SectionHeader } from "./grid-background";

const stages = [
  {
    number: "01",
    label: "Author",
    title: "Turn repeatable work into a skill.",
    description:
      "Capture the instructions, constraints, and references once instead of rewriting them inside every prompt and tool.",
  },
  {
    number: "02",
    label: "Link",
    title: "Keep related context connected.",
    description:
      "Skills reference nearby resources and neighboring capabilities, so agents can pull only the context they need at runtime.",
  },
  {
    number: "03",
    label: "Sync",
    title: "Mirror the same vault locally.",
    description:
      "The CLI keeps a local copy in sync, so editor agents, terminal sessions, and automations read from the same working knowledge.",
  },
  {
    number: "04",
    label: "Resolve",
    title: "Load the right skill in the moment.",
    description:
      "Instead of one giant system prompt, the agent can resolve the specific capability and context that match the task in front of it.",
  },
];

const MOCK_VAULT = {
  id: "mock-default-vault",
  slug: "default",
  name: "Default Vault",
  type: "system_default" as const,
  color: "oklch(0.73 0.17 70)",
  isReadOnly: true,
  isEnabled: true,
};

const MOCK_GRAPH_DATA: GraphData = {
  nodes: [
    {
      id: "skill-frontend-design",
      type: "skill",
      label: "frontend-design",
      description: "Design and ship polished UI patterns.",
      slug: "frontend-design",
      parentSkillId: null,
      kind: null,
      contentSnippet: null,
      updatedAt: "2026-02-11T10:00:00.000Z",
      vault: MOCK_VAULT,
    },
    {
      id: "skill-next-best-practices",
      type: "skill",
      label: "next-best-practices",
      description: "Apply modern Next.js architecture defaults.",
      slug: "next-best-practices",
      parentSkillId: null,
      kind: null,
      contentSnippet: null,
      updatedAt: "2026-02-12T11:00:00.000Z",
      vault: MOCK_VAULT,
    },
    {
      id: "skill-better-auth-best-practices",
      type: "skill",
      label: "better-auth-best-practices",
      description: "Implement secure auth and session patterns.",
      slug: "better-auth-best-practices",
      parentSkillId: null,
      kind: null,
      contentSnippet: null,
      updatedAt: "2026-02-13T12:00:00.000Z",
      vault: MOCK_VAULT,
    },
    {
      id: "skill-neon-postgres",
      type: "skill",
      label: "neon-postgres",
      description: "Use Neon Postgres in serverless environments.",
      slug: "neon-postgres",
      parentSkillId: null,
      kind: null,
      contentSnippet: null,
      updatedAt: "2026-02-14T09:00:00.000Z",
      vault: MOCK_VAULT,
    },
    {
      id: "skill-hono",
      type: "skill",
      label: "hono",
      description: "Build fast edge-friendly APIs with Hono.",
      slug: "hono",
      parentSkillId: null,
      kind: null,
      contentSnippet: null,
      updatedAt: "2026-02-15T08:00:00.000Z",
      vault: MOCK_VAULT,
    },
    {
      id: "skill-doc-coauthoring",
      type: "skill",
      label: "doc-coauthoring",
      description: "Structure proposals and specs with shared templates.",
      slug: "doc-coauthoring",
      parentSkillId: null,
      kind: null,
      contentSnippet: null,
      updatedAt: "2026-02-15T11:00:00.000Z",
      vault: MOCK_VAULT,
    },
    {
      id: "skill-internal-comms",
      type: "skill",
      label: "internal-comms",
      description: "Write consistent internal updates and status reports.",
      slug: "internal-comms",
      parentSkillId: null,
      kind: null,
      contentSnippet: null,
      updatedAt: "2026-02-15T12:00:00.000Z",
      vault: MOCK_VAULT,
    },
    {
      id: "skill-web-design-guidelines",
      type: "skill",
      label: "web-design-guidelines",
      description: "Review UI quality and accessibility against standards.",
      slug: "web-design-guidelines",
      parentSkillId: null,
      kind: null,
      contentSnippet: null,
      updatedAt: "2026-02-15T13:00:00.000Z",
      vault: MOCK_VAULT,
    },
    {
      id: "skill-vercel-composition-patterns",
      type: "skill",
      label: "vercel-composition-patterns",
      description: "Refactor UIs with scalable React composition patterns.",
      slug: "vercel-composition-patterns",
      parentSkillId: null,
      kind: null,
      contentSnippet: null,
      updatedAt: "2026-02-15T14:00:00.000Z",
      vault: MOCK_VAULT,
    },
    {
      id: "skill-opentui",
      type: "skill",
      label: "opentui",
      description: "Build terminal interfaces with OpenTUI.",
      slug: "opentui",
      parentSkillId: null,
      kind: null,
      contentSnippet: null,
      updatedAt: "2026-02-15T15:00:00.000Z",
      vault: MOCK_VAULT,
    },
    {
      id: "skill-turborepo",
      type: "skill",
      label: "turborepo",
      description: "Manage monorepo pipelines and cache strategies.",
      slug: "turborepo",
      parentSkillId: null,
      kind: null,
      contentSnippet: null,
      updatedAt: "2026-02-15T16:00:00.000Z",
      vault: MOCK_VAULT,
    },
    {
      id: "resource-landing-rules.md",
      type: "resource",
      label: "landing-rules.md",
      description: "Landing page layout guidance",
      slug: null,
      parentSkillId: "skill-frontend-design",
      kind: "reference",
      contentSnippet: "Use strong hierarchy and purposeful spacing.",
      updatedAt: "2026-02-16T10:00:00.000Z",
      vault: null,
    },
    {
      id: "resource-micro-interactions.md",
      type: "resource",
      label: "micro-interactions.md",
      description: "Motion and interaction patterns",
      slug: null,
      parentSkillId: "skill-frontend-design",
      kind: "reference",
      contentSnippet: "Animate feedback with intent, not noise.",
      updatedAt: "2026-02-16T10:30:00.000Z",
      vault: null,
    },
    {
      id: "resource-data-patterns.md",
      type: "resource",
      label: "data-patterns.md",
      description: "Data fetching architecture notes",
      slug: null,
      parentSkillId: "skill-next-best-practices",
      kind: "reference",
      contentSnippet: "Choose server-first data boundaries.",
      updatedAt: "2026-02-17T09:00:00.000Z",
      vault: null,
    },
    {
      id: "resource-cache-components.md",
      type: "resource",
      label: "cache-components.md",
      description: "Caching and revalidation docs",
      slug: null,
      parentSkillId: "skill-next-best-practices",
      kind: "reference",
      contentSnippet: "Tag, invalidate, and cache intentionally.",
      updatedAt: "2026-02-17T11:00:00.000Z",
      vault: null,
    },
    {
      id: "resource-session-lifecycles.md",
      type: "resource",
      label: "session-lifecycles.md",
      description: "Session and token lifecycle strategy",
      slug: null,
      parentSkillId: "skill-better-auth-best-practices",
      kind: "reference",
      contentSnippet: "Rotate tokens and keep expiry explicit.",
      updatedAt: "2026-02-18T08:45:00.000Z",
      vault: null,
    },
    {
      id: "resource-team-access.md",
      type: "resource",
      label: "team-access.md",
      description: "Role and permission mapping",
      slug: null,
      parentSkillId: "skill-better-auth-best-practices",
      kind: "reference",
      contentSnippet: "Separate ownership from execution rights.",
      updatedAt: "2026-02-18T09:45:00.000Z",
      vault: null,
    },
    {
      id: "resource-connection-pooling.md",
      type: "resource",
      label: "connection-pooling.md",
      description: "Connection strategy for Neon",
      slug: null,
      parentSkillId: "skill-neon-postgres",
      kind: "reference",
      contentSnippet: "Use pooled or HTTP mode per workload.",
      updatedAt: "2026-02-18T12:00:00.000Z",
      vault: null,
    },
    {
      id: "resource-route-handlers.md",
      type: "resource",
      label: "route-handlers.md",
      description: "Route composition examples",
      slug: null,
      parentSkillId: "skill-hono",
      kind: "reference",
      contentSnippet: "Keep handlers thin and composable.",
      updatedAt: "2026-02-19T13:00:00.000Z",
      vault: null,
    },
    {
      id: "resource-proposal-template.md",
      type: "resource",
      label: "proposal-template.md",
      description: "Template for product and engineering proposals",
      slug: null,
      parentSkillId: "skill-doc-coauthoring",
      kind: "reference",
      contentSnippet: "Align context, decisions, risks, and rollout plan.",
      updatedAt: "2026-02-19T14:00:00.000Z",
      vault: null,
    },
    {
      id: "resource-update-format.md",
      type: "resource",
      label: "update-format.md",
      description: "Leadership and team update structures",
      slug: null,
      parentSkillId: "skill-internal-comms",
      kind: "reference",
      contentSnippet: "Lead with outcomes, then status, blockers, next steps.",
      updatedAt: "2026-02-19T14:45:00.000Z",
      vault: null,
    },
    {
      id: "resource-composition-recipes.md",
      type: "resource",
      label: "composition-recipes.md",
      description: "Reusable composition patterns for component systems",
      slug: null,
      parentSkillId: "skill-vercel-composition-patterns",
      kind: "reference",
      contentSnippet: "Prefer composition over boolean prop proliferation.",
      updatedAt: "2026-02-19T15:00:00.000Z",
      vault: null,
    },
  ],
  edges: [
    {
      id: "edge-parent-frontend-1",
      kind: "parent",
      source: "skill-frontend-design",
      target: "resource-landing-rules.md",
    },
    {
      id: "edge-parent-frontend-2",
      kind: "parent",
      source: "skill-frontend-design",
      target: "resource-micro-interactions.md",
    },
    {
      id: "edge-parent-next-1",
      kind: "parent",
      source: "skill-next-best-practices",
      target: "resource-data-patterns.md",
    },
    {
      id: "edge-parent-next-2",
      kind: "parent",
      source: "skill-next-best-practices",
      target: "resource-cache-components.md",
    },
    {
      id: "edge-parent-auth-1",
      kind: "parent",
      source: "skill-better-auth-best-practices",
      target: "resource-session-lifecycles.md",
    },
    {
      id: "edge-parent-auth-2",
      kind: "parent",
      source: "skill-better-auth-best-practices",
      target: "resource-team-access.md",
    },
    {
      id: "edge-parent-neon-1",
      kind: "parent",
      source: "skill-neon-postgres",
      target: "resource-connection-pooling.md",
    },
    {
      id: "edge-parent-hono-1",
      kind: "parent",
      source: "skill-hono",
      target: "resource-route-handlers.md",
    },
    {
      id: "edge-parent-doc-1",
      kind: "parent",
      source: "skill-doc-coauthoring",
      target: "resource-proposal-template.md",
    },
    {
      id: "edge-parent-comms-1",
      kind: "parent",
      source: "skill-internal-comms",
      target: "resource-update-format.md",
    },
    {
      id: "edge-parent-composition-1",
      kind: "parent",
      source: "skill-vercel-composition-patterns",
      target: "resource-composition-recipes.md",
    },
    {
      id: "edge-link-frontend-next",
      kind: "mention",
      source: "skill-frontend-design",
      target: "skill-next-best-practices",
    },
    {
      id: "edge-link-next-auth",
      kind: "mention",
      source: "skill-next-best-practices",
      target: "skill-better-auth-best-practices",
    },
    {
      id: "edge-link-auth-neon",
      kind: "mention",
      source: "skill-better-auth-best-practices",
      target: "skill-neon-postgres",
    },
    {
      id: "edge-link-hono-next",
      kind: "mention",
      source: "skill-hono",
      target: "skill-next-best-practices",
    },
    {
      id: "edge-link-route-next",
      kind: "mention",
      source: "resource-route-handlers.md",
      target: "skill-next-best-practices",
    },
    {
      id: "edge-link-design-frontend",
      kind: "mention",
      source: "skill-web-design-guidelines",
      target: "skill-frontend-design",
    },
    {
      id: "edge-link-doc-comms",
      kind: "mention",
      source: "skill-doc-coauthoring",
      target: "skill-internal-comms",
    },
  ],
};

function StageCard({
  number,
  label,
  title,
  description,
}: {
  number: string;
  label: string;
  title: string;
  description: string;
}) {
  return (
    <article className="group relative h-full min-h-[220px] overflow-hidden border border-border bg-background px-7 py-6 transition-colors duration-200 hover:bg-muted/[0.14] sm:px-8 sm:py-7">
      <CornerInsetMarks />

      <div className="flex items-start justify-between gap-2">
        <span className={CARD_EYEBROW_CLASS}>{label}</span>
        <span className="font-mono text-[1rem] leading-none tracking-[-0.06em] text-primary">
          {number}
        </span>
      </div>

      <CardDivider className="mb-5 mt-5" />

      <h3
        className={`text-[1.1rem] text-balance leading-[1.15] tracking-tight text-foreground ${GeistPixelSquare.className}`}
      >
        {title}
      </h3>
      <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </article>
  );
}

function LandingGraphCard() {
  const router = useRouter();
  const [hasHydrated, setHasHydrated] = useState(false);
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const isSignedIn = hasHydrated && Boolean(session);
  const shouldLoadUserGraph = isSignedIn;
  const {
    data: userGraphData,
    isLoading: isUserGraphLoading,
    isError: isUserGraphError,
  } = useQuery({
    ...trpc.skills.graph.queryOptions(),
    enabled: shouldLoadUserGraph,
  });

  const graphData = shouldLoadUserGraph ? userGraphData : MOCK_GRAPH_DATA;
  const isLoading = !hasHydrated || isSessionPending || (shouldLoadUserGraph && isUserGraphLoading);
  const isError = shouldLoadUserGraph && isUserGraphError;

  const handleNodeClick = useCallback(
    (_node: GraphNode): boolean => {
      if (isSignedIn) return false;
      router.push("/login");
      return true;
    },
    [isSignedIn, router],
  );

  const skillCount = graphData?.nodes.filter((node) => node.type === "skill").length ?? 0;

  return (
    <article className="group relative overflow-hidden border border-border bg-background">
      <CornerInsetMarks />

      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground/65">
          // Skill Graph
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-primary/80">
          {skillCount} skills
        </span>
      </div>

      <div className="relative" style={{ height: 420 }}>
        <GridBackground className="opacity-32" />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/[0.03]">
            <Loader2 className="size-5 animate-spin text-muted-foreground/50" />
          </div>
        )}

        {isError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/[0.03]">
            <p className="text-sm text-muted-foreground">Could not load your graph</p>
          </div>
        )}

        {!isLoading && !isError && graphData && (
          <ForceGraph
            data={graphData}
            height={420}
            mobileInitialScale={0.85}
            onNodeClick={handleNodeClick}
            showSettingsButton={false}
          />
        )}
      </div>
    </article>
  );
}

export default function HowWeSolveIt() {
  return (
    <section id="how-we-solve-it" className="relative overflow-hidden scroll-mt-20">
      <SectionBackdrop variant="solution" />

      <LandingContainer>
        <SectionHeader
          decorator="How We Solve It"
          headline={
            <>
              A system for <span className="text-primary">durable agent context</span>
            </>
          }
          subtitle="Better Skills turns scattered prompts into versioned, linked, locally synced capabilities that agents can resolve on demand."
        />

        <div className="grid grid-cols-1 gap-4">
          <LandingGraphCard />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <div className="xl:col-span-3">
              <StageCard {...stages[0]!} />
            </div>
            <div className="xl:col-span-3">
              <StageCard {...stages[1]!} />
            </div>
            <div className="xl:col-span-2">
              <StageCard {...stages[2]!} />
            </div>
            <div className="xl:col-span-4">
              <StageCard {...stages[3]!} />
            </div>
          </div>
        </div>

        <SectionTailSpacer />
      </LandingContainer>
    </section>
  );
}
