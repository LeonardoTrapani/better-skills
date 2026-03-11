"use client";

import { GitBranch, Users, Vault, Network } from "lucide-react";
import { ForceGraph, type GraphData } from "@/components/skills/graph/force-graph";
import { SectionBackdrop, SectionHeader } from "../grid-background";
import { LandingContainer, SectionTailSpacer } from "../design-system";

/**
 * Enhanced graph showing skills (amber) with their resources (gray) connected.
 * Only better-skills is green. Only 2-3 skills are connected to each other.
 * Most connections are skill → resource (parent edges).
 */
const LANDING_GRAPH_DATA: GraphData = {
  nodes: [
    // Central skill - green (better-skills)
    {
      id: "bs-core",
      type: "skill",
      label: "better-skills",
      description:
        "The core skill for managing reusable agent capabilities as structured SKILL.md files with graph links.",
      slug: "better-skills",
      parentSkillId: null,
      kind: null,
      contentSnippet: "Manage reusable capabilities packaged as SKILL.md files...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v1",
        slug: "better-skills-vault",
        name: "better-skills",
        type: "personal",
        color: "#22c55e",
        isReadOnly: false,
        isEnabled: true,
      },
    },
    // Linked skills - all amber
    {
      id: "skill-claude",
      type: "skill",
      label: "claude-api",
      description: "Build apps with the Claude API and Anthropic SDK.",
      slug: "claude-api",
      parentSkillId: null,
      kind: null,
      contentSnippet: "Build apps with the Claude API...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v2",
        slug: "company-vault",
        name: "Company",
        type: "enterprise",
        color: "#f59e0b",
        isReadOnly: true,
        isEnabled: true,
      },
    },
    {
      id: "skill-next",
      type: "skill",
      label: "next-best-practices",
      description: "Next.js best practices for file conventions, RSC, data patterns.",
      slug: "next-best-practices",
      parentSkillId: null,
      kind: null,
      contentSnippet: "Next.js file conventions, RSC boundaries...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v2",
        slug: "company-vault",
        name: "Company",
        type: "enterprise",
        color: "#f59e0b",
        isReadOnly: true,
        isEnabled: true,
      },
    },
    {
      id: "skill-hono",
      type: "skill",
      label: "hono",
      description: "Efficiently develop Hono API applications.",
      slug: "hono",
      parentSkillId: null,
      kind: null,
      contentSnippet: "Hono framework for edge-first APIs...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v2",
        slug: "company-vault",
        name: "Company",
        type: "enterprise",
        color: "#f59e0b",
        isReadOnly: true,
        isEnabled: true,
      },
    },
    {
      id: "skill-turborepo",
      type: "skill",
      label: "turborepo",
      description: "Turborepo monorepo build system guidance.",
      slug: "turborepo",
      parentSkillId: null,
      kind: null,
      contentSnippet: "Turborepo task pipelines, caching, remote cache...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v2",
        slug: "company-vault",
        name: "Company",
        type: "enterprise",
        color: "#f59e0b",
        isReadOnly: true,
        isEnabled: true,
      },
    },
    {
      id: "skill-neon",
      type: "skill",
      label: "neon-postgres",
      description: "Guides and best practices for working with Neon Serverless Postgres.",
      slug: "neon-postgres",
      parentSkillId: null,
      kind: null,
      contentSnippet: "Neon Serverless Postgres, local dev, connection methods...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v2",
        slug: "company-vault",
        name: "Company",
        type: "enterprise",
        color: "#f59e0b",
        isReadOnly: true,
        isEnabled: true,
      },
    },
    {
      id: "skill-react-perf",
      type: "skill",
      label: "vercel-react-best-practices",
      description: "React and Next.js performance optimization guidelines from Vercel.",
      slug: "vercel-react-best-practices",
      parentSkillId: null,
      kind: null,
      contentSnippet: "React performance patterns, memoization...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v2",
        slug: "company-vault",
        name: "Company",
        type: "enterprise",
        color: "#f59e0b",
        isReadOnly: true,
        isEnabled: true,
      },
    },
    {
      id: "skill-webapp-testing",
      type: "skill",
      label: "webapp-testing",
      description: "Toolkit for testing local web apps using Playwright.",
      slug: "webapp-testing",
      parentSkillId: null,
      kind: null,
      contentSnippet: "Playwright testing workflows...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v2",
        slug: "company-vault",
        name: "Company",
        type: "enterprise",
        color: "#f59e0b",
        isReadOnly: true,
        isEnabled: true,
      },
    },
    {
      id: "skill-mcp-builder",
      type: "skill",
      label: "mcp-builder",
      description: "Guide for creating high-quality MCP servers.",
      slug: "mcp-builder",
      parentSkillId: null,
      kind: null,
      contentSnippet: "MCP server development patterns...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v2",
        slug: "company-vault",
        name: "Company",
        type: "enterprise",
        color: "#f59e0b",
        isReadOnly: true,
        isEnabled: true,
      },
    },
    {
      id: "skill-better-auth",
      type: "skill",
      label: "better-auth-best-practices",
      description: "Better Auth integration patterns.",
      slug: "better-auth-best-practices",
      parentSkillId: null,
      kind: null,
      contentSnippet: "Better Auth setup and configuration...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v2",
        slug: "company-vault",
        name: "Company",
        type: "enterprise",
        color: "#f59e0b",
        isReadOnly: true,
        isEnabled: true,
      },
    },
    {
      id: "skill-frontend-design",
      type: "skill",
      label: "frontend-design",
      description: "Create production-grade frontend interfaces.",
      slug: "frontend-design",
      parentSkillId: null,
      kind: null,
      contentSnippet: "UI design patterns and best practices...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v2",
        slug: "company-vault",
        name: "Company",
        type: "enterprise",
        color: "#f59e0b",
        isReadOnly: true,
        isEnabled: true,
      },
    },
    // Resources - each skill has 1-2 resources
    // better-skills resources
    {
      id: "res-bs-1",
      type: "resource",
      label: "SKILL.md",
      description: null,
      slug: null,
      parentSkillId: "bs-core",
      kind: "reference",
      contentSnippet: "Core skill definition...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v1",
        slug: "better-skills-vault",
        name: "better-skills",
        type: "personal",
        color: "#22c55e",
        isReadOnly: false,
        isEnabled: true,
      },
    },
    {
      id: "res-bs-2",
      type: "resource",
      label: "docs/",
      description: null,
      slug: null,
      parentSkillId: "bs-core",
      kind: "reference",
      contentSnippet: "Documentation...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v1",
        slug: "better-skills-vault",
        name: "better-skills",
        type: "personal",
        color: "#22c55e",
        isReadOnly: false,
        isEnabled: true,
      },
    },
    // claude-api resources
    {
      id: "res-claude-1",
      type: "resource",
      label: "SKILL.md",
      description: null,
      slug: null,
      parentSkillId: "skill-claude",
      kind: "reference",
      contentSnippet: "Claude API docs...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v2",
        slug: "company-vault",
        name: "Company",
        type: "enterprise",
        color: "#f59e0b",
        isReadOnly: true,
        isEnabled: true,
      },
    },
    // next-best-practices resources
    {
      id: "res-next-1",
      type: "resource",
      label: "SKILL.md",
      description: null,
      slug: null,
      parentSkillId: "skill-next",
      kind: "reference",
      contentSnippet: "Next.js guidelines...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v2",
        slug: "company-vault",
        name: "Company",
        type: "enterprise",
        color: "#f59e0b",
        isReadOnly: true,
        isEnabled: true,
      },
    },
    {
      id: "res-next-2",
      type: "resource",
      label: "references/",
      description: null,
      slug: null,
      parentSkillId: "skill-next",
      kind: "reference",
      contentSnippet: "Reference docs...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v2",
        slug: "company-vault",
        name: "Company",
        type: "enterprise",
        color: "#f59e0b",
        isReadOnly: true,
        isEnabled: true,
      },
    },
    // hono resources
    {
      id: "res-hono-1",
      type: "resource",
      label: "SKILL.md",
      description: null,
      slug: null,
      parentSkillId: "skill-hono",
      kind: "reference",
      contentSnippet: "Hono framework...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v2",
        slug: "company-vault",
        name: "Company",
        type: "enterprise",
        color: "#f59e0b",
        isReadOnly: true,
        isEnabled: true,
      },
    },
    // turborepo resources
    {
      id: "res-turbo-1",
      type: "resource",
      label: "SKILL.md",
      description: null,
      slug: null,
      parentSkillId: "skill-turborepo",
      kind: "reference",
      contentSnippet: "Turborepo guide...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v2",
        slug: "company-vault",
        name: "Company",
        type: "enterprise",
        color: "#f59e0b",
        isReadOnly: true,
        isEnabled: true,
      },
    },
    // neon resources
    {
      id: "res-neon-1",
      type: "resource",
      label: "SKILL.md",
      description: null,
      slug: null,
      parentSkillId: "skill-neon",
      kind: "reference",
      contentSnippet: "Neon Postgres...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v2",
        slug: "company-vault",
        name: "Company",
        type: "enterprise",
        color: "#f59e0b",
        isReadOnly: true,
        isEnabled: true,
      },
    },
    // react-perf resources
    {
      id: "res-react-1",
      type: "resource",
      label: "SKILL.md",
      description: null,
      slug: null,
      parentSkillId: "skill-react-perf",
      kind: "reference",
      contentSnippet: "React perf...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v2",
        slug: "company-vault",
        name: "Company",
        type: "enterprise",
        color: "#f59e0b",
        isReadOnly: true,
        isEnabled: true,
      },
    },
    // webapp-testing resources
    {
      id: "res-test-1",
      type: "resource",
      label: "SKILL.md",
      description: null,
      slug: null,
      parentSkillId: "skill-webapp-testing",
      kind: "reference",
      contentSnippet: "Testing guide...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v2",
        slug: "company-vault",
        name: "Company",
        type: "enterprise",
        color: "#f59e0b",
        isReadOnly: true,
        isEnabled: true,
      },
    },
    // mcp-builder resources
    {
      id: "res-mcp-1",
      type: "resource",
      label: "SKILL.md",
      description: null,
      slug: null,
      parentSkillId: "skill-mcp-builder",
      kind: "reference",
      contentSnippet: "MCP guide...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v2",
        slug: "company-vault",
        name: "Company",
        type: "enterprise",
        color: "#f59e0b",
        isReadOnly: true,
        isEnabled: true,
      },
    },
    // better-auth resources
    {
      id: "res-auth-1",
      type: "resource",
      label: "SKILL.md",
      description: null,
      slug: null,
      parentSkillId: "skill-better-auth",
      kind: "reference",
      contentSnippet: "Auth patterns...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v2",
        slug: "company-vault",
        name: "Company",
        type: "enterprise",
        color: "#f59e0b",
        isReadOnly: true,
        isEnabled: true,
      },
    },
    // frontend-design resources
    {
      id: "res-design-1",
      type: "resource",
      label: "SKILL.md",
      description: null,
      slug: null,
      parentSkillId: "skill-frontend-design",
      kind: "reference",
      contentSnippet: "Design system...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v2",
        slug: "company-vault",
        name: "Company",
        type: "enterprise",
        color: "#f59e0b",
        isReadOnly: true,
        isEnabled: true,
      },
    },
  ],
  edges: [
    // Parent edges - skills to their resources (gray nodes)
    { id: "pe-bs-1", source: "bs-core", target: "res-bs-1", kind: "parent" },
    { id: "pe-bs-2", source: "bs-core", target: "res-bs-2", kind: "parent" },
    {
      id: "pe-claude-1",
      source: "skill-claude",
      target: "res-claude-1",
      kind: "parent",
    },
    {
      id: "pe-next-1",
      source: "skill-next",
      target: "res-next-1",
      kind: "parent",
    },
    {
      id: "pe-next-2",
      source: "skill-next",
      target: "res-next-2",
      kind: "parent",
    },
    {
      id: "pe-hono-1",
      source: "skill-hono",
      target: "res-hono-1",
      kind: "parent",
    },
    {
      id: "pe-turbo-1",
      source: "skill-turborepo",
      target: "res-turbo-1",
      kind: "parent",
    },
    {
      id: "pe-neon-1",
      source: "skill-neon",
      target: "res-neon-1",
      kind: "parent",
    },
    {
      id: "pe-react-1",
      source: "skill-react-perf",
      target: "res-react-1",
      kind: "parent",
    },
    {
      id: "pe-test-1",
      source: "skill-webapp-testing",
      target: "res-test-1",
      kind: "parent",
    },
    {
      id: "pe-mcp-1",
      source: "skill-mcp-builder",
      target: "res-mcp-1",
      kind: "parent",
    },
    {
      id: "pe-auth-1",
      source: "skill-better-auth",
      target: "res-auth-1",
      kind: "parent",
    },
    {
      id: "pe-design-1",
      source: "skill-frontend-design",
      target: "res-design-1",
      kind: "parent",
    },

    // Only 2-3 skill-to-skill connections (mention edges)
    {
      id: "me-next-react",
      source: "skill-next",
      target: "skill-react-perf",
      kind: "mention",
    },
    {
      id: "me-next-frontend",
      source: "skill-next",
      target: "skill-frontend-design",
      kind: "mention",
    },
  ],
};

const solvingPoints = [
  {
    icon: Vault,
    title: "One vault, one source of truth",
    description:
      "Skills live in a versioned vault — not scattered across Notion, Confluence, and local folders. One place, always current.",
  },
  {
    icon: Network,
    title: "Sync to every agent at once",
    description:
      "Pull your vault locally with one command. Claude Code, Cursor, Codex, and Gemini CLI all read from the same files.",
  },
  {
    icon: GitBranch,
    title: "Graph links keep skills connected",
    description:
      "Skills reference each other through typed edges. Related capabilities stay together and agents can follow the graph.",
  },
  {
    icon: Users,
    title: "Team vaults with roles and access",
    description:
      "Share a vault with your team. Assign owner, admin, and member roles. Everyone works from the same structured knowledge.",
  },
];

export default function HowWeSolveIt() {
  return (
    <section id="how-we-solve-it" className="relative overflow-hidden">
      <SectionBackdrop variant="solution" />

      <SectionHeader
        decorator="How we solve it"
        headline={
          <span>
            How we <span className="text-primary">solve it!</span>
          </span>
        }
        subtitle="What are skills, what are their limitations and how we solve them! "
      />

      {/* Custom layout */}
      <LandingContainer>
        <div className="flex flex-col border-y border-border/50 bg-background">
          {/* Header section */}
          <div className="flex flex-col gap-4 px-8 py-12 lg:px-12 lg:py-16 border-b border-border/50">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              // How We Solve It \\
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground leading-[1.15] sm:text-4xl">
              Structured skills, <span className="text-primary">shared across your ecosystem</span>
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground max-w-xl">
              One unified system that gives every agent access to the same structured knowledge —
              versioned, connected, and always current.
            </p>
          </div>
          <div className="flex flex-col lg:flex-row">
            {/* Left: Header + 2x2 Cards grid (50% width on desktop) */}

            <div className="lg:w-3/5 border-r border-border/70 lg:order-1 order-2">
              {/* 2x2 Cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {solvingPoints.map((point, i) => {
                  const Icon = point.icon;
                  const isLastRow = i >= 2;
                  const isRightColumn = i % 2 === 1;

                  return (
                    <div
                      key={point.title}
                      className={`flex flex-col gap-4 p-6 lg:p-8 ${
                        !isLastRow ? "border-b" : ""
                      } ${isRightColumn ? "" : "border-r"} border-border/70`}
                    >
                      <div className="flex size-12 items-center justify-center border border-primary/30 bg-primary/5">
                        <Icon className="size-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">{point.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {point.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Enhanced graph (50% width on desktop) */}
            <div className="relative flex w-full flex-col overflow-hidden bg-muted/[0.03] lg:w-2/5 lg:order-2 order-1 min-h-auto">
              <ForceGraph
                data={LANDING_GRAPH_DATA}
                height={500}
                focusNodeId="bs-core"
                centerXBias={0}
                mobileInitialScale={0.65}
                showSettingsButton={false}
                onNodeClick={() => {
                  // redirect to login instead of skill page
                  window.location.href = "/login";
                  return true;
                }}
              />
            </div>
          </div>
        </div>
        <SectionTailSpacer />
      </LandingContainer>
    </section>
  );
}
