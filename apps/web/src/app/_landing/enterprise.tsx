import { ArrowRight, Building2, Link2, Shield, Users } from "lucide-react";
import { GeistPixelSquare } from "geist/font/pixel";

import { Button } from "@/components/ui/button";
import { SectionHeader } from "./grid-background";
import { LandingSection } from "./landing-section";

const enterpriseCapabilities = [
  {
    label: "Vaults",
    title: "Shared team spaces",
    description:
      "Separate engineering, design, and data knowledge without losing a common system for how agent capabilities are authored.",
    icon: Building2,
  },
  {
    label: "Access",
    title: "Roles with clear ownership",
    description:
      "Owners, admins, and members can share the same vault while keeping edit rights and responsibility visible.",
    icon: Shield,
  },
  {
    label: "Rollout",
    title: "Fast onboarding for new teammates",
    description:
      "New engineers pull the same local mirror instead of reconstructing the team prompt stack from scratch.",
    icon: Users,
  },
  {
    label: "Sync",
    title: "One local mirror per workflow",
    description:
      "Claude Code, Cursor, Codex, and internal automation all read from the same connected knowledge once sync is in place.",
    icon: Link2,
  },
];

function VaultLane({ title, description }: { title: string; description: string }) {
  return (
    <div className="relative border border-border bg-background px-5 py-4">
      <span className="absolute left-0 top-0 h-px w-8 bg-primary" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="min-w-0 text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
          {title}
        </span>
        <div className="flex flex-wrap gap-1.5 text-[9px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
          <span className="border border-border px-1.5 py-0.5">owner</span>
          <span className="border border-border px-1.5 py-0.5">admin</span>
          <span className="border border-border px-1.5 py-0.5">member</span>
        </div>
      </div>
      <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function EnterpriseBlueprint() {
  return (
    <div className="relative h-full min-h-[480px] overflow-hidden bg-muted/[0.18] px-6 py-8 sm:px-8 sm:py-9">
      <div className="absolute left-6 top-0 h-full w-px bg-border/70" />
      <div className="absolute right-6 top-0 h-full w-px bg-border/70" />
      <div className="absolute left-6 right-6 top-20 h-px bg-border/70" />
      <div className="absolute left-6 right-6 bottom-24 h-px bg-border/70" />
      <div className="absolute right-[32%] top-20 bottom-24 w-px bg-border/70" />

      <div className="relative z-10 flex h-full flex-col justify-between gap-6">
        <div className="space-y-4">
          <VaultLane
            title="Engineering Vault"
            description="Code review, deployment, architecture, and runtime practices stay in one team-managed space."
          />
          <VaultLane
            title="Design Vault"
            description="Brand rules, UI review flows, and accessibility guidance remain visible to both humans and agents."
          />
          <VaultLane
            title="Data Vault"
            description="Analytics playbooks, query conventions, and pipeline knowledge stay versioned alongside the rest of the system."
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.84fr)]">
          <div className="border border-border bg-background px-5 py-5">
            <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
              Shared Graph
            </span>
            <h4
              className={`mt-3 text-[1.1rem] text-balance leading-[1.12] tracking-tight text-foreground ${GeistPixelSquare.className}`}
            >
              One source of truth across teams.
            </h4>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
              Team vaults stay distinct, but their skills can still link, sync, and resolve inside
              the same operating model.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="border border-border bg-background px-4 py-3 text-center text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
              Claude Code
            </div>
            <div className="border border-border bg-background px-4 py-3 text-center text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
              Cursor
            </div>
            <div className="border border-border bg-background px-4 py-3 text-center text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground sm:col-span-2 lg:col-span-1">
              Codex
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Enterprise() {
  return (
    <LandingSection id="enterprise" className="scroll-mt-20" variant="enterprise" bottomSpacer>
      <SectionHeader
        decorator="Enterprise"
        headline={
          <>
            One company system, <span className="text-primary">multiple team vaults</span>
          </>
        }
        subtitle="Bring shared governance to agent knowledge without forcing every team into the same folder, workflow, or toolchain."
      />

      <div className="overflow-hidden border border-border bg-background lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="flex flex-col border-b border-border lg:border-b-0 lg:border-r">
          <div className="px-8 py-10 lg:px-10 lg:py-12">
            <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
              // Company Rollout \\
            </p>
            <h3
              className={`mt-4 text-[2rem] text-balance leading-[1.08] tracking-tight text-foreground sm:text-[2.35rem] ${GeistPixelSquare.className}`}
            >
              Shared knowledge without <span className="text-primary">copy-paste ops.</span>
            </h3>
            <p className="mt-5 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
              Better Skills gives teams a governed path from authoring to rollout: shared vaults,
              visible ownership, and synced local mirrors for every engineer who uses agents.
            </p>
          </div>

          <div className="grid gap-px bg-border sm:grid-cols-2">
            {enterpriseCapabilities.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="bg-background px-6 py-6 lg:px-7 lg:py-7">
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

        <div className="border-t border-border lg:border-t-0">
          <EnterpriseBlueprint />
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 pt-8 sm:flex-row sm:justify-center">
        <Button
          size="lg"
          animated
          className="h-11 w-full gap-2 px-6 text-sm sm:w-auto"
          render={<a href="mailto:hello@better-skills.dev" />}
        >
          Talk to Founders
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Button>

        <Button
          variant="outline"
          size="lg"
          animated
          className="h-11 w-full gap-2 px-6 text-sm sm:w-auto"
          render={<a href="#pricing" />}
        >
          See Pricing
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
    </LandingSection>
  );
}
