"use client";

import { ArrowRight, Users, Shield, Link2, LayoutDashboard } from "lucide-react";
import { motion } from "motion/react";
import { SectionHeader, SectionBackdrop } from "../grid-background";
import { LandingContainer, SectionTailSpacer } from "../design-system";
import { ForceGraph, type GraphData } from "@/components/skills/graph/force-graph";

/**
 * Multi-vault graph: shows skills from three different team vaults
 * (Engineering, Design, Data) all visible in the same enterprise graph.
 * Clicking any node redirects to /login.
 */
const ENTERPRISE_GRAPH_DATA: GraphData = {
  nodes: [
    // ── Engineering vault (amber/primary) ──
    {
      id: "eng-react-perf",
      type: "skill",
      label: "react-perf-audit",
      description: "React performance audit capability for the engineering team.",
      slug: "react-perf-audit",
      parentSkillId: null,
      kind: null,
      contentSnippet: "Performance audit for React applications...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v-eng",
        slug: "engineering",
        name: "Engineering",
        type: "enterprise",
        color: "oklch(72% 0.18 50)",
        isReadOnly: false,
        isEnabled: true,
      },
    },
    {
      id: "eng-code-review",
      type: "skill",
      label: "code-review",
      description: "Structured code review process and checklist.",
      slug: "code-review",
      parentSkillId: null,
      kind: null,
      contentSnippet: "Code review guidelines and checklist...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v-eng",
        slug: "engineering",
        name: "Engineering",
        type: "enterprise",
        color: "oklch(72% 0.18 50)",
        isReadOnly: false,
        isEnabled: true,
      },
    },
    {
      id: "eng-deploy",
      type: "skill",
      label: "deploy-checklist",
      description: "Pre-deployment checklist and runbook.",
      slug: "deploy-checklist",
      parentSkillId: null,
      kind: null,
      contentSnippet: "Deployment steps and verification...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v-eng",
        slug: "engineering",
        name: "Engineering",
        type: "enterprise",
        color: "oklch(72% 0.18 50)",
        isReadOnly: false,
        isEnabled: true,
      },
    },
    // Resources
    {
      id: "res-eng-1",
      type: "resource",
      label: "lighthouse-guide.md",
      description: null,
      slug: null,
      parentSkillId: "eng-react-perf",
      kind: "reference",
      contentSnippet: "Lighthouse audit guide...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v-eng",
        slug: "engineering",
        name: "Engineering",
        type: "enterprise",
        color: "oklch(72% 0.18 50)",
        isReadOnly: false,
        isEnabled: true,
      },
    },
    // ── Design vault (blue) ──
    {
      id: "des-brand",
      type: "skill",
      label: "brand-guidelines",
      description: "Brand colors, typography, and visual identity guidelines.",
      slug: "brand-guidelines",
      parentSkillId: null,
      kind: null,
      contentSnippet: "Brand color palette and typography system...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v-des",
        slug: "design",
        name: "Design",
        type: "enterprise",
        color: "oklch(62% 0.19 250)",
        isReadOnly: false,
        isEnabled: true,
      },
    },
    {
      id: "des-a11y",
      type: "skill",
      label: "accessibility-audit",
      description: "WCAG accessibility review and testing process.",
      slug: "accessibility-audit",
      parentSkillId: null,
      kind: null,
      contentSnippet: "Accessibility audit checklist and testing...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v-des",
        slug: "design",
        name: "Design",
        type: "enterprise",
        color: "oklch(62% 0.19 250)",
        isReadOnly: false,
        isEnabled: true,
      },
    },
    {
      id: "res-des-1",
      type: "resource",
      label: "color-tokens.md",
      description: null,
      slug: null,
      parentSkillId: "des-brand",
      kind: "reference",
      contentSnippet: "Color token definitions...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v-des",
        slug: "design",
        name: "Design",
        type: "enterprise",
        color: "oklch(62% 0.19 250)",
        isReadOnly: false,
        isEnabled: true,
      },
    },
    // ── Data vault (green) ──
    {
      id: "dat-analytics",
      type: "skill",
      label: "analytics-queries",
      description: "Standard analytics query patterns and dashboards.",
      slug: "analytics-queries",
      parentSkillId: null,
      kind: null,
      contentSnippet: "Analytics query templates and patterns...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v-dat",
        slug: "data",
        name: "Data",
        type: "enterprise",
        color: "oklch(62% 0.19 145)",
        isReadOnly: false,
        isEnabled: true,
      },
    },
    {
      id: "dat-pipeline",
      type: "skill",
      label: "data-pipeline",
      description: "ETL pipeline design patterns and best practices.",
      slug: "data-pipeline",
      parentSkillId: null,
      kind: null,
      contentSnippet: "Data pipeline architecture patterns...",
      updatedAt: new Date().toISOString(),
      vault: {
        id: "v-dat",
        slug: "data",
        name: "Data",
        type: "enterprise",
        color: "oklch(62% 0.19 145)",
        isReadOnly: false,
        isEnabled: true,
      },
    },
  ],
  edges: [
    // parent edges
    { id: "pe-eng-1", source: "eng-react-perf", target: "res-eng-1", kind: "parent" },
    { id: "pe-des-1", source: "des-brand", target: "res-des-1", kind: "parent" },
    // cross-vault mention links
    { id: "me-1", source: "eng-react-perf", target: "des-a11y", kind: "mention" },
    { id: "me-2", source: "eng-code-review", target: "eng-deploy", kind: "mention" },
    { id: "me-3", source: "des-brand", target: "des-a11y", kind: "mention" },
    { id: "me-4", source: "dat-analytics", target: "dat-pipeline", kind: "mention" },
    { id: "me-5", source: "eng-deploy", target: "dat-pipeline", kind: "mention" },
  ],
};

const capabilities = [
  {
    icon: LayoutDashboard,
    title: "Enterprise vaults",
    description:
      "Create a shared vault for your organization. All skills, resources, and graph links live in one place your whole team accesses.",
  },
  {
    icon: Users,
    title: "Roles and access",
    description:
      "Assign owner, admin, or member roles to every team member. Control who can publish, edit, or view skills at the vault level.",
  },
  {
    icon: Shield,
    title: "Invitations and team management",
    description:
      "Invite teammates by email. Manage your roster, adjust roles, and remove access as your team changes — without touching config files.",
  },
  {
    icon: Link2,
    title: "Synced knowledge across all tools",
    description:
      "Every engineer on the team runs the same skills in their local setup. No more knowledge silos between Claude Code, Cursor, or Codex users.",
  },
];

export default function Enterprise() {
  return (
    <section id="enterprise" className="relative overflow-hidden">
      <SectionBackdrop variant="enterprise" />

      <LandingContainer>
        <SectionHeader
          decorator="Enterprise"
          headline={
            <>
              Share one company vault <span className="text-primary">across your team</span>
            </>
          }
          subtitle="One graph, multiple vaults, every team. better-skills gives engineering organizations a shared source of truth for agent capabilities — with the roles and access controls that teams require."
        />

        {/* Full-width interactive graph — multiple vault colors visible */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="relative border border-border/70 bg-background overflow-hidden"
        >
          {/* Vault legend */}
          <div className="absolute top-4 left-5 z-10 flex flex-wrap items-center gap-4">
            {[
              { name: "Engineering", color: "oklch(72% 0.18 50)" },
              { name: "Design", color: "oklch(62% 0.19 250)" },
              { name: "Data", color: "oklch(62% 0.19 145)" },
            ].map((v) => (
              <div key={v.name} className="flex items-center gap-1.5">
                <span className="inline-block size-2.5" style={{ backgroundColor: v.color }} />
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                  {v.name}
                </span>
              </div>
            ))}
          </div>

          <ForceGraph
            data={ENTERPRISE_GRAPH_DATA}
            height={380}
            mobileInitialScale={0.7}
            showSettingsButton={false}
            onNodeClick={() => {
              window.location.href = "/login";
              return true;
            }}
          />
        </motion.div>

        {/* 4-capability strip */}
        <div className="mt-px flex flex-wrap gap-px border border-t-0 border-border bg-border">
          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0.08 + i * 0.06 }}
              className="flex min-w-[240px] flex-1 basis-full flex-col gap-4 bg-background px-8 py-7 sm:basis-[calc(50%-1px)] lg:basis-[calc(25%-1px)]"
            >
              <div className="flex size-8 items-center justify-center border border-border bg-background">
                <cap.icon className="size-3.5 text-primary" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-foreground">{cap.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{cap.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-4 py-12 sm:flex-row sm:justify-center">
          <a
            href="mailto:hello@better-skills.dev"
            className="inline-flex h-10 items-center gap-2 bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Talk to us about team rollout
            <ArrowRight className="size-3.5" />
          </a>
          <a
            href="#pricing"
            onClick={(e) => {
              const el = document.querySelector<HTMLElement>("#pricing");
              if (!el) return;
              e.preventDefault();
              window.scrollTo({
                top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 60),
                behavior: "smooth",
              });
            }}
            className="inline-flex h-10 items-center gap-2 border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            See pricing
            <ArrowRight className="size-3.5" />
          </a>
        </div>

        <SectionTailSpacer />
      </LandingContainer>
    </section>
  );
}
