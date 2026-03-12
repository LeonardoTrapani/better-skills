import type { ReactNode } from "react";
import { GeistPixelSquare } from "geist/font/pixel";

import { CARD_EYEBROW_CLASS, CardDivider } from "./card-elements";
import { CornerInsetMarks } from "./corner-inset-marks";
import { SectionHeader } from "./grid-background";
import { LandingSection } from "./landing-section";
import { PROBLEM_VISUALS } from "./problem-visuals";

type ProblemCardProps = {
  label: string;
  title: string;
  description: string;
  visual: ReactNode;
};

function ProblemCard({ label, title, description, visual }: ProblemCardProps) {
  return (
    <article className="group relative flex min-w-[280px] flex-1 basis-full flex-col overflow-hidden border border-border bg-background transition-colors duration-200 hover:bg-muted/[0.14] lg:basis-[calc(33.333%-1.1rem)]">
      <CornerInsetMarks />

      {/* Illustration zone — centered, generous height */}
      <div className="flex items-center justify-center px-8 py-10">
        <div className="flex h-16 w-full max-w-[160px] items-center justify-center">{visual}</div>
      </div>

      <CardDivider className="px-8" />

      {/* Text zone */}
      <div className="flex flex-col gap-4 px-8 py-8">
        <p className={CARD_EYEBROW_CLASS}>{label}</p>

        <h3
          className={`${GeistPixelSquare.className} text-balance text-[1.7rem] leading-[1.1] tracking-tight text-foreground`}
        >
          {title}
        </h3>

        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </article>
  );
}

export default function Problem() {
  return (
    <LandingSection id="problem" className="scroll-mt-20" variant="problem" bottomSpacer>
      <SectionHeader
        decorator="The Problem"
        headline={
          <>
            Why agent knowledge <span className="text-primary">breaks down</span>
          </>
        }
        subtitle="The failure mode is rarely missing prompts. It is scattered context, manual handoffs, and no durable source of truth."
      />

      <div className="flex flex-wrap gap-4">
        <ProblemCard
          label="Scattered Context"
          title="Knowledge lives in too many places."
          description="Prompts drift between docs, IDE settings, local folders, and chat threads. Teams stop knowing which version is current before an agent even runs."
          visual={<PROBLEM_VISUALS.scattered />}
        />

        <ProblemCard
          label="Clipboard Sync"
          title="Every tool gets a different copy."
          description="Switch between agents and you paste the same context again. Knowledge lives on the clipboard instead of in a system."
          visual={<PROBLEM_VISUALS.clipboard />}
        />

        <ProblemCard
          label="Ownership"
          title="Teams cannot see who owns what."
          description="Without roles, visibility, or a shared graph, new teammates inherit stale skills and nobody can tell what the working version should be."
          visual={<PROBLEM_VISUALS.ownership />}
        />
      </div>
    </LandingSection>
  );
}
