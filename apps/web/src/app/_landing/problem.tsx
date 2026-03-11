import type { ReactNode } from "react";
import { ClipboardCopy, FolderKanban, type LucideIcon, Users } from "lucide-react";
import { GeistPixelSquare } from "geist/font/pixel";

import { CornerInsetMarks } from "./corner-inset-marks";
import { LandingContainer, SectionTailSpacer } from "./design-system";
import { SectionBackdrop, SectionHeader } from "./grid-background";

function ScatteredKnowledgeVisual() {
  return (
    <svg viewBox="0 0 260 150" className="w-full max-w-[340px]" fill="none" aria-hidden="true">
      <rect x="8" y="12" width="86" height="46" stroke="var(--border)" />
      <rect x="166" y="8" width="86" height="46" stroke="var(--border)" />
      <rect x="14" y="96" width="86" height="42" stroke="var(--border)" />
      <rect x="160" y="98" width="86" height="42" stroke="var(--border)" />

      <rect x="24" y="24" width="44" height="4" fill="var(--foreground)" fillOpacity="0.12" />
      <rect x="24" y="34" width="54" height="3" fill="var(--foreground)" fillOpacity="0.08" />
      <rect x="182" y="20" width="40" height="4" fill="var(--foreground)" fillOpacity="0.12" />
      <rect x="182" y="30" width="52" height="3" fill="var(--foreground)" fillOpacity="0.08" />
      <rect x="30" y="108" width="36" height="4" fill="var(--foreground)" fillOpacity="0.12" />
      <rect x="30" y="118" width="50" height="3" fill="var(--foreground)" fillOpacity="0.08" />
      <rect x="176" y="110" width="38" height="4" fill="var(--foreground)" fillOpacity="0.12" />
      <rect x="176" y="120" width="48" height="3" fill="var(--foreground)" fillOpacity="0.08" />

      <text
        x="51"
        y="50"
        fill="var(--muted-foreground)"
        fillOpacity="0.72"
        fontFamily="var(--font-geist-mono)"
        fontSize="9"
        textAnchor="middle"
      >
        docs
      </text>
      <text
        x="209"
        y="46"
        fill="var(--muted-foreground)"
        fillOpacity="0.72"
        fontFamily="var(--font-geist-mono)"
        fontSize="9"
        textAnchor="middle"
      >
        ide
      </text>
      <text
        x="57"
        y="130"
        fill="var(--muted-foreground)"
        fillOpacity="0.72"
        fontFamily="var(--font-geist-mono)"
        fontSize="9"
        textAnchor="middle"
      >
        local
      </text>
      <text
        x="203"
        y="132"
        fill="var(--muted-foreground)"
        fillOpacity="0.72"
        fontFamily="var(--font-geist-mono)"
        fontSize="9"
        textAnchor="middle"
      >
        chat
      </text>

      <path d="M94 35C120 35 128 42 132 72" stroke="var(--border)" strokeDasharray="4 4" />
      <path d="M166 31C142 31 136 40 132 72" stroke="var(--border)" strokeDasharray="4 4" />
      <path d="M100 114C122 114 128 104 132 78" stroke="var(--border)" strokeDasharray="4 4" />
      <path d="M160 118C142 118 136 104 132 78" stroke="var(--border)" strokeDasharray="4 4" />

      <rect x="126" y="68" width="12" height="12" fill="var(--primary)" fillOpacity="0.8" />
      <text
        x="132"
        y="102"
        fill="var(--muted-foreground)"
        fillOpacity="0.42"
        fontFamily="var(--font-geist-mono)"
        fontSize="20"
        textAnchor="middle"
      >
        ?
      </text>
    </svg>
  );
}

function ClipboardVisual() {
  return (
    <svg viewBox="0 0 260 150" className="w-full max-w-[300px]" fill="none" aria-hidden="true">
      <rect x="106" y="10" width="48" height="60" stroke="var(--primary)" strokeOpacity="0.45" />
      <rect x="118" y="4" width="24" height="12" stroke="var(--primary)" strokeOpacity="0.45" />
      <rect x="118" y="24" width="24" height="4" fill="var(--primary)" fillOpacity="0.32" />
      <rect x="118" y="36" width="18" height="3" fill="var(--primary)" fillOpacity="0.2" />
      <rect x="118" y="46" width="22" height="3" fill="var(--primary)" fillOpacity="0.2" />

      <rect x="10" y="100" width="68" height="38" stroke="var(--border)" />
      <rect x="96" y="100" width="68" height="38" stroke="var(--border)" />
      <rect x="182" y="100" width="68" height="38" stroke="var(--border)" />

      <path d="M130 70L44 98" stroke="var(--border)" strokeDasharray="4 4" />
      <path d="M130 70V98" stroke="var(--border)" strokeDasharray="4 4" />
      <path d="M130 70L216 98" stroke="var(--border)" strokeDasharray="4 4" />

      <rect x="36" y="112" width="16" height="16" fill="var(--primary)" fillOpacity="0.16" />
      <rect x="122" y="112" width="16" height="16" fill="var(--primary)" fillOpacity="0.16" />
      <rect x="208" y="112" width="16" height="16" fill="var(--primary)" fillOpacity="0.16" />

      <text
        x="44"
        y="92"
        fill="var(--muted-foreground)"
        fillOpacity="0.62"
        fontFamily="var(--font-geist-mono)"
        fontSize="9"
        textAnchor="middle"
      >
        v1.2
      </text>
      <text
        x="130"
        y="92"
        fill="var(--muted-foreground)"
        fillOpacity="0.62"
        fontFamily="var(--font-geist-mono)"
        fontSize="9"
        textAnchor="middle"
      >
        v1.5
      </text>
      <text
        x="216"
        y="92"
        fill="var(--muted-foreground)"
        fillOpacity="0.62"
        fontFamily="var(--font-geist-mono)"
        fontSize="9"
        textAnchor="middle"
      >
        v1.3
      </text>
    </svg>
  );
}

function OwnershipVisual() {
  return (
    <svg viewBox="0 0 260 150" className="w-full max-w-[300px]" fill="none" aria-hidden="true">
      <rect x="32" y="18" width="56" height="24" stroke="var(--border)" />
      <rect x="102" y="18" width="56" height="24" stroke="var(--border)" />
      <rect x="172" y="18" width="56" height="24" stroke="var(--border)" />

      <text
        x="60"
        y="33"
        fill="var(--muted-foreground)"
        fillOpacity="0.72"
        fontFamily="var(--font-geist-mono)"
        fontSize="9"
        textAnchor="middle"
      >
        owner
      </text>
      <text
        x="130"
        y="33"
        fill="var(--muted-foreground)"
        fillOpacity="0.72"
        fontFamily="var(--font-geist-mono)"
        fontSize="9"
        textAnchor="middle"
      >
        admin
      </text>
      <text
        x="200"
        y="33"
        fill="var(--muted-foreground)"
        fillOpacity="0.72"
        fontFamily="var(--font-geist-mono)"
        fontSize="9"
        textAnchor="middle"
      >
        member
      </text>

      <path d="M60 42V74" stroke="var(--border)" strokeDasharray="4 4" />
      <path d="M130 42V74" stroke="var(--border)" strokeDasharray="4 4" />
      <path d="M200 42V74" stroke="var(--border)" strokeDasharray="4 4" />

      <rect x="52" y="80" width="156" height="48" stroke="var(--border)" />
      <rect x="64" y="92" width="72" height="4" fill="var(--foreground)" fillOpacity="0.12" />
      <rect x="64" y="102" width="86" height="3" fill="var(--foreground)" fillOpacity="0.08" />
      <rect x="64" y="112" width="54" height="3" fill="var(--foreground)" fillOpacity="0.08" />
      <rect x="180" y="74" width="12" height="12" fill="var(--primary)" fillOpacity="0.8" />

      <text
        x="130"
        y="122"
        fill="var(--muted-foreground)"
        fillOpacity="0.72"
        fontFamily="var(--font-geist-mono)"
        fontSize="9"
        textAnchor="middle"
      >
        company-vault
      </text>
    </svg>
  );
}

type ProblemCardProps = {
  number: string;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  visual: ReactNode;
  className?: string;
  compact?: boolean;
};

function ProblemCard({
  number,
  label,
  title,
  description,
  icon: Icon,
  visual,
  className,
  compact = false,
}: ProblemCardProps) {
  return (
    <article
      className={`group relative overflow-hidden border border-border bg-background transition-colors hover:bg-muted/[0.14] ${className ?? ""}`}
    >
      <CornerInsetMarks />

      <div
        className={`flex h-full flex-col ${compact ? "gap-6 px-8 py-8" : "gap-8 px-8 py-9 lg:px-10 lg:py-10"}`}
      >
        <div className="flex items-center justify-between gap-4">
          <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </span>
          <span className="font-mono text-[1.05rem] tracking-[-0.08em] text-primary">{number}</span>
        </div>

        <div
          className={`flex items-center justify-center border border-dashed border-border bg-muted/[0.14] ${compact ? "min-h-[170px] px-4 py-6" : "min-h-[220px] px-5 py-8"}`}
        >
          {visual}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-9 items-center justify-center border border-border bg-background">
              <Icon aria-hidden="true" className="size-4 text-primary" />
            </span>
            <h3
              className={`${GeistPixelSquare.className} ${compact ? "text-[1.45rem]" : "text-[1.85rem] sm:text-[2rem]"} text-balance leading-[1.08] tracking-tight text-foreground`}
            >
              {title}
            </h3>
          </div>

          <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function Problem() {
  return (
    <section id="problem" className="relative overflow-hidden scroll-mt-20">
      <SectionBackdrop variant="problem" />

      <LandingContainer>
        <SectionHeader
          decorator="The Problem"
          headline={
            <>
              Why agent knowledge <span className="text-primary">breaks down</span>
            </>
          }
          subtitle="The failure mode is rarely missing prompts. It is scattered context, manual handoffs, and no durable source of truth."
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <ProblemCard
            number="01"
            label="Scattered Context"
            title="Knowledge lives in too many places."
            description="Prompts drift between docs, IDE settings, local folders, and chat threads. Teams stop knowing which version is current before an agent even runs."
            icon={FolderKanban}
            visual={<ScatteredKnowledgeVisual />}
          />

          <div className="grid gap-4">
            <ProblemCard
              number="02"
              label="Clipboard Sync"
              title="Every tool gets a different copy."
              description="Switch between agents and you paste the same context again. Knowledge lives on the clipboard instead of in a system."
              icon={ClipboardCopy}
              visual={<ClipboardVisual />}
              compact
            />
            <ProblemCard
              number="03"
              label="Ownership"
              title="Teams cannot see who owns what."
              description="Without roles, visibility, or a shared graph, new teammates inherit stale skills and nobody can tell what the working version should be."
              icon={Users}
              visual={<OwnershipVisual />}
              compact
            />
          </div>
        </div>

        <SectionTailSpacer />
      </LandingContainer>
    </section>
  );
}
