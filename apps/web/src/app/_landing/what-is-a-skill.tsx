import { Database, FileText, Folder, GitBranch, type LucideIcon } from "lucide-react";
import { GeistPixelSquare } from "geist/font/pixel";

import { LandingContainer, SectionTailSpacer } from "./design-system";
import { SectionBackdrop, SectionHeader } from "./grid-background";

type TreeLine = {
  depth: number;
  label: string;
  icon?: LucideIcon;
  accent?: boolean;
};

const treeLines: TreeLine[] = [
  { depth: 0, label: ".agents/", icon: Folder },
  { depth: 1, label: "frontend-design/", icon: Folder },
  { depth: 2, label: "SKILL.md", icon: FileText, accent: true },
  { depth: 2, label: "resources/", icon: Folder },
  { depth: 3, label: "landing-rules.md", icon: FileText },
  { depth: 3, label: "visual-audit.md", icon: FileText },
  { depth: 2, label: "scripts/", icon: Folder },
  { depth: 3, label: "review-ui.ts", icon: FileText },
  { depth: 2, label: "links: next-best-practices", accent: true },
  { depth: 2, label: "links: web-design-guidelines", accent: true },
];

const anatomy = [
  {
    label: "SKILL.md",
    title: "Instructions with intent",
    description:
      "Each skill starts with a durable contract: what the capability does, when to use it, and how the agent should behave.",
    icon: FileText,
  },
  {
    label: "Resources",
    title: "Supporting files stay nearby",
    description:
      "Reference docs, scripts, examples, and assets live beside the skill instead of being scattered across unrelated systems.",
    icon: Folder,
  },
  {
    label: "Graph Links",
    title: "Related context is connected",
    description:
      "Typed links let agents pull neighboring context only when it is relevant, instead of loading a giant prompt every time.",
    icon: GitBranch,
  },
  {
    label: "Vault Metadata",
    title: "Ownership and sync are built in",
    description:
      "Skills live in a vault with shared visibility, update history, and local sync so every agent reads from the same source.",
    icon: Database,
  },
];

function SkillTreeWindow() {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex border-b border-border">
        <div className="flex items-center gap-2 border-r border-border px-4 py-3 sm:px-5 sm:py-4">
          <span className="inline-block size-2 border border-border/80 bg-muted sm:size-2.5" />
          <span className="inline-block size-2 border border-border/80 bg-muted sm:size-2.5" />
          <span className="inline-block size-2 border border-border/80 bg-muted sm:size-2.5" />
        </div>
        <div className="px-5 py-3 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground sm:px-6 sm:py-4">
          Skill Tree
        </div>
      </div>

      <div className="flex-1 bg-muted/[0.12] px-6 py-8 font-mono text-[12px] leading-7 text-muted-foreground">
        {treeLines.map((line) => {
          const Icon = line.icon;
          return (
            <div key={`${line.depth}-${line.label}`} className="flex items-center gap-2">
              <span className="select-none whitespace-pre text-muted-foreground/30">
                {"  ".repeat(line.depth)}
              </span>
              {line.depth > 0 ? <span className="text-muted-foreground/30">|-</span> : null}
              {Icon ? (
                <Icon
                  aria-hidden="true"
                  className={`size-3.5 ${line.accent ? "text-primary" : "text-muted-foreground/70"}`}
                />
              ) : null}
              <span className={line.accent ? "text-primary" : undefined}>{line.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function WhatIsASkill() {
  return (
    <section id="what-is-a-skill" className="relative overflow-hidden scroll-mt-20">
      <SectionBackdrop variant="skill" />

      <LandingContainer>
        <SectionHeader
          decorator="What Is A Skill"
          headline={
            <>
              The unit your agents <span className="text-primary">actually reuse</span>
            </>
          }
          subtitle="Not a one-off prompt. A skill is a portable capability with structure, files, and graph-aware context."
        />

        <div className="overflow-hidden border border-border bg-background lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className="border-b border-border lg:border-b-0 lg:border-r">
            <SkillTreeWindow />
          </div>

          <div className="flex flex-col">
            <div className="border-b border-border px-8 py-10 lg:px-10 lg:py-12">
              <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
                // Skill Anatomy \\
              </p>
              <h3
                className={`mt-4 text-[2rem] text-balance leading-[1.08] tracking-tight text-foreground sm:text-[2.35rem] ${GeistPixelSquare.className}`}
              >
                A reusable capability, <span className="text-primary">packaged for agents.</span>
              </h3>
              <div className="mt-5 max-w-2xl space-y-3 text-pretty text-sm leading-relaxed text-muted-foreground">
                <p>
                  A skill turns repeatable agent behavior into something durable. Instead of pasting
                  context into a chat, you keep it in a structured{" "}
                  <code className="border border-border bg-muted/30 px-1.5 py-0.5 font-mono text-xs text-foreground">
                    SKILL.md
                  </code>{" "}
                  entry that can travel between the CLI, the web app, and your team vault.
                </p>
                <p>
                  That gives the agent more than instructions. It gives it linked references,
                  supporting resources, and enough structure to load the right context on demand.
                </p>
              </div>
            </div>

            <div className="grid gap-px bg-border sm:grid-cols-2">
              {anatomy.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className="bg-background px-6 py-6 lg:px-7 lg:py-7">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex size-8 items-center justify-center border border-border bg-muted/[0.18]">
                        <Icon aria-hidden="true" className="size-4 text-primary" />
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
                        {item.label}
                      </span>
                    </div>

                    <h4
                      className={`mt-4 text-[1.2rem] text-balance leading-[1.15] tracking-tight text-foreground ${GeistPixelSquare.className}`}
                    >
                      {item.title}
                    </h4>
                    <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <SectionTailSpacer />
      </LandingContainer>
    </section>
  );
}
