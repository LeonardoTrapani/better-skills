"use client";

import { GeistPixelSquare } from "geist/font/pixel";

import { LandingContainer, SectionTailSpacer } from "./design-system";
import { SectionBackdrop, SectionHeader } from "./grid-background";

type StepPatternVariant = "cli" | "graph" | "agent";

const steps: {
  num: string;
  title: string;
  titleAccent: string;
  description: string;
  pattern: StepPatternVariant;
}[] = [
  {
    num: "01",
    title: "Start from the Terminal with the",
    titleAccent: " CLI.",
    description:
      "Install Better Skills CLI, sign in once, and sync your local vault so the right context is already in place when work begins.",
    pattern: "cli",
  },
  {
    num: "02",
    title: "See it in your ",
    titleAccent: "Dashboard and Graph.",
    description:
      "Open the dashboard to manage skills, then jump into the graph for a quick read on structure, relationships, and knowledge flow.",
    pattern: "graph",
  },
  {
    num: "03",
    title: "Use it with your favorites",
    titleAccent: " AI and Agent.",
    description:
      "Bring the same skills into the agent you already use and keep refining them as your prompts, tools, and projects evolve.",
    pattern: "agent",
  },
];

function PixelSquare({ x, y, accent = false }: { x: number; y: number; accent?: boolean }) {
  return (
    <rect x={x} y={y} width="6" height="6" fill={accent ? "var(--primary)" : "currentColor"} />
  );
}

function StepIllustration({ pattern }: { pattern: StepPatternVariant }) {
  if (pattern === "graph") {
    return (
      <svg
        className="h-full w-full text-border transition-colors duration-200 group-hover:text-muted-foreground/50"
        viewBox="0 0 84 48"
        fill="none"
        aria-hidden="true"
      >
        <path d="M12 12H32" stroke="currentColor" strokeWidth="1" />
        <path d="M32 12V24" stroke="currentColor" strokeWidth="1" />
        <path d="M32 24H52" stroke="currentColor" strokeWidth="1" />
        <path d="M52 24V12" stroke="currentColor" strokeWidth="1" />
        <path d="M52 24V36" stroke="currentColor" strokeWidth="1" />
        <path d="M52 12H68" stroke="currentColor" strokeWidth="1" />
        <path d="M52 36H68" stroke="currentColor" strokeWidth="1" />

        <PixelSquare x={9} y={9} />
        <PixelSquare x={29} y={9} />
        <PixelSquare x={29} y={21} />
        <PixelSquare x={49} y={21} accent />
        <PixelSquare x={65} y={9} />
        <PixelSquare x={65} y={33} />
      </svg>
    );
  }

  if (pattern === "agent") {
    const robotCells = [
      [12, 0, true],
      [18, 0, true],
      [24, 0, true],
      [30, 0, true],
      [36, 0, true],
      [42, 0, true],
      [48, 0, true],
      [54, 0, true],

      [12, 6, true],
      [18, 6, false],
      [24, 6, true],
      [30, 6, true],
      [36, 6, true],
      [42, 6, true],
      [48, 6, false],
      [54, 6, true],

      [0, 12, true],
      [6, 12, true],
      [12, 12, true],
      [18, 12, true],
      [24, 12, true],
      [30, 12, true],
      [36, 12, true],
      [42, 12, true],
      [48, 12, true],
      [54, 12, true],
      [60, 12, true],
      [66, 12, true],

      [0, 18, true],
      [6, 18, true],
      [12, 18, true],
      [18, 18, true],
      [24, 18, true],
      [30, 18, true],
      [36, 18, true],
      [42, 18, true],
      [48, 18, true],
      [54, 18, true],
      [60, 18, true],
      [66, 18, true],

      [12, 24, true],
      [18, 24, true],
      [24, 24, true],
      [30, 24, true],
      [36, 24, true],
      [42, 24, true],
      [48, 24, true],
      [54, 24, true],

      [12, 30, true],
      [18, 30, true],
      [24, 30, true],
      [30, 30, true],
      [36, 30, true],
      [42, 30, true],
      [48, 30, true],
      [54, 30, true],

      [12, 36, true],
      [24, 36, true],
      [42, 36, true],
      [54, 36, true],

      [12, 42, true],
      [24, 42, true],
      [42, 42, true],
      [54, 42, true],
    ] as const;

    return (
      <svg
        className="h-full w-full text-background transition-colors duration-200 group-hover:text-foreground"
        viewBox="0 0 72 54"
        fill="none"
        aria-hidden="true"
      >
        {robotCells.map(([x, y, accent]) => (
          <PixelSquare key={`${x}-${y}`} x={x} y={y} accent={accent} />
        ))}
      </svg>
    );
  }

  const cliCells = [
    [0, 10, true],
    [8, 6, false],
    [16, 6, false],
    [24, 6, false],
    [40, 6, false],
    [48, 6, false],
    [56, 6, true],
    [8, 18, false],
    [16, 18, true],
    [24, 18, false],
    [32, 18, false],
    [40, 18, false],
    [48, 18, false],
    [56, 18, false],
    [64, 18, false],
    [0, 30, true],
    [8, 30, false],
    [24, 30, false],
    [32, 30, false],
    [40, 30, true],
    [48, 30, false],
    [56, 30, false],
    [64, 30, false],
  ] as const;

  return (
    <svg
      className="h-full w-full text-border transition-colors duration-200 group-hover:text-muted-foreground/50"
      viewBox="0 0 84 48"
      fill="none"
      aria-hidden="true"
    >
      {cliCells.map(([x, y, accent]) => (
        <PixelSquare key={`${x}-${y}`} x={x} y={y} accent={accent} />
      ))}
    </svg>
  );
}

function CornerInsetMarks() {
  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-px w-7 bg-border transition-colors duration-200 group-hover:bg-foreground/45"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-7 w-px bg-border transition-colors duration-200 group-hover:bg-foreground/45"
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-px w-7 bg-border transition-colors duration-200 group-hover:bg-foreground/45"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-7 w-px bg-border transition-colors duration-200 group-hover:bg-foreground/45"
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 h-px w-7 bg-border transition-colors duration-200 group-hover:bg-foreground/45"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 h-7 w-px bg-border transition-colors duration-200 group-hover:bg-foreground/45"
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-px w-7 bg-border transition-colors duration-200 group-hover:bg-foreground/45"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-7 w-px bg-border transition-colors duration-200 group-hover:bg-foreground/45"
      />
    </>
  );
}

export default function HowItWorks() {
  return (
    <section className="relative overflow-hidden">
      <SectionBackdrop variant="how-it-works" />

      <LandingContainer>
        <SectionHeader
          decorator="How It Works"
          headline={
            <>
              Three steps to <span className="text-primary">smarter agents</span>
            </>
          }
          subtitle="From install to publish in minutes. No configuration required."
        />

        <div className="flex flex-wrap gap-4">
          {steps.map((step) => (
            <div
              key={step.num}
              className="group relative flex min-w-[280px] flex-1 basis-full flex-col gap-6 overflow-hidden border border-border bg-background px-8 py-9 text-left transition-colors duration-200 lg:basis-[calc(33.333%-1.1rem)]"
            >
              <CornerInsetMarks />

              <div className="flex h-16 items-start justify-between">
                <div className="flex h-12 w-[104px] items-center">
                  <StepIllustration pattern={step.pattern} />
                </div>

                <span className="pt-1 font-mono text-[1.15rem] leading-none tracking-[-0.08em] text-primary transition-colors duration-200">
                  {step.num}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-px w-10 bg-primary/70 transition-colors duration-200" />
                <span className="h-px flex-1 bg-border transition-colors duration-200" />
              </div>

              <div className="flex flex-col gap-4">
                <h3
                  className={`text-2xl leading-[1.15] tracking-tight text-foreground ${GeistPixelSquare.className}`}
                >
                  <span>{step.title}</span>
                  <span className="text-primary">{step.titleAccent}</span>
                </h3>

                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <SectionTailSpacer />
      </LandingContainer>
    </section>
  );
}
