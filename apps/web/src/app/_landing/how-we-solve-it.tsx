import { GeistPixelSquare } from "geist/font/pixel";

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

function FlowBox({
  label,
  title,
  body,
  accent = false,
}: {
  label: string;
  title: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <div className="relative border border-border bg-background px-5 py-5">
      <span className={`absolute left-0 top-0 h-px w-8 ${accent ? "bg-primary" : "bg-border"}`} />
      <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
      <h4
        className={`mt-3 text-[1.05rem] text-balance leading-[1.12] tracking-tight text-foreground ${GeistPixelSquare.className}`}
      >
        {title}
      </h4>
      <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function AgentChip({ label }: { label: string }) {
  return (
    <div className="border border-border bg-background px-4 py-3 text-center">
      <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function SolutionBlueprint() {
  return (
    <div className="relative h-full min-h-[430px] overflow-hidden bg-muted/[0.18] px-6 py-8 sm:px-8 sm:py-9">
      <div className="absolute left-6 top-0 h-full w-px bg-border/70" />
      <div className="absolute right-6 top-0 h-full w-px bg-border/70" />
      <div className="absolute left-6 right-6 top-20 h-px bg-border/70" />
      <div className="absolute left-6 right-6 bottom-24 h-px bg-border/70" />
      <div className="absolute left-1/2 top-20 h-[190px] w-px -translate-x-1/2 bg-border/70" />
      <div className="absolute left-1/2 top-20 size-2 -translate-x-1/2 -translate-y-1/2 bg-primary" />
      <div className="absolute left-1/2 bottom-24 size-2 -translate-x-1/2 translate-y-1/2 bg-primary" />

      <div className="relative z-10 flex h-full flex-col justify-between gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FlowBox
            label="Vault"
            title="Versioned Skill Vault"
            body="Author the capability once, keep the source visible, and update it without losing the working version."
            accent
          />
          <FlowBox
            label="Graph"
            title="Linked Context"
            body="References, resources, and related skills stay attached so context can be resolved instead of recopied."
          />
        </div>

        <div className="mx-auto w-full max-w-sm">
          <FlowBox
            label="CLI Sync"
            title="Local .agents Mirror"
            body="Pull the same vault into terminal sessions, editor agents, and automation without re-pasting the prompt stack."
            accent
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <AgentChip label="Claude Code" />
          <AgentChip label="Cursor" />
          <AgentChip label="Codex" />
        </div>
      </div>
    </div>
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

        <div className="overflow-hidden border border-border bg-background lg:grid lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
          <div className="flex flex-col divide-y divide-border">
            {stages.map((stage) => (
              <div key={stage.number} className="px-8 py-7 lg:px-9 lg:py-8">
                <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
                  <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
                    <span className="font-mono text-[1.05rem] tracking-[-0.08em] text-primary">
                      {stage.number}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
                      {stage.label}
                    </span>
                  </div>

                  <div>
                    <h3
                      className={`text-[1.45rem] text-balance leading-[1.1] tracking-tight text-foreground ${GeistPixelSquare.className}`}
                    >
                      {stage.title}
                    </h3>
                    <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
                      {stage.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border lg:border-l lg:border-t-0">
            <SolutionBlueprint />
          </div>
        </div>

        <SectionTailSpacer />
      </LandingContainer>
    </section>
  );
}
