import { GeistPixelSquare } from "geist/font/pixel";

import { CARD_EYEBROW_CLASS, CardDivider } from "./card-elements";
import { CornerInsetMarks } from "./corner-inset-marks";
import { SectionHeader } from "./grid-background";
import { LandingGraphCard } from "./landing-graph-card";
import { LandingSection } from "./landing-section";

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

export default function HowWeSolveIt() {
  return (
    <LandingSection id="how-we-solve-it" className="scroll-mt-20" variant="solution" bottomSpacer>
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
    </LandingSection>
  );
}
