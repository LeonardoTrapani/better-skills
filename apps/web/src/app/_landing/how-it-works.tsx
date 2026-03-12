"use client";

import { GeistPixelSquare } from "geist/font/pixel";

import { CARD_EYEBROW_CLASS, CardDivider } from "./card-elements";
import { CornerInsetMarks } from "./corner-inset-marks";
import { LandingContainer, SectionTailSpacer } from "./design-system";
import { SectionBackdrop, SectionHeader } from "./grid-background";

type StepPatternVariant = "cli" | "graph" | "agent";

const steps: {
  num: string;
  label: string;
  title: string;
  titleAccent: string;
  description: string;
  pattern: StepPatternVariant;
}[] = [
  {
    num: "01",
    label: "Terminal",
    title: "Start from the Terminal through our",
    titleAccent: " CLI.",
    description:
      "Install Better Skills CLI, sign in once, and sync your local vault so the right context is already in place when work begins.",
    pattern: "cli",
  },
  {
    num: "02",
    label: "Dashboard",
    title: "See it in your ",
    titleAccent: "Dashboard and Graph.",
    description:
      "Open the dashboard to manage skills, then jump into the graph for a quick read on structure, relationships, and knowledge flow.",
    pattern: "graph",
  },
  {
    num: "03",
    label: "Agent",
    title: "Use it with your favorites",
    titleAccent: " AI and Agent.",
    description:
      "Bring the same skills into the agent you already use and keep refining them as your prompts, tools, and projects evolve.",
    pattern: "agent",
  },
];

function PixelSquare({
  x,
  y,
  accent = false,
  muted = false,
  opacity,
}: {
  x: number;
  y: number;
  accent?: boolean;
  muted?: boolean;
  opacity?: number;
}) {
  const fill = accent ? "var(--primary)" : muted ? "var(--muted-foreground)" : "var(--border)";
  const fillOpacity = opacity ?? (muted ? 0.38 : 1);
  return <rect x={x} y={y} width="6" height="6" fill={fill} fillOpacity={fillOpacity} />;
}

function StepIllustration({ pattern }: { pattern: StepPatternVariant }) {
  if (pattern === "graph") {
    return (
      <svg className="h-full w-full" viewBox="0 0 112 64" fill="none" aria-hidden="true">
        <path d="M12 32H36" stroke="var(--border)" strokeOpacity="0.7" />
        <path d="M36 32L56 16" stroke="var(--border)" strokeOpacity="0.7" />
        <path d="M36 32L56 48" stroke="var(--border)" strokeOpacity="0.7" />
        <path d="M56 16H80" stroke="var(--border)" strokeOpacity="0.7" />
        <path d="M56 48H80" stroke="var(--border)" strokeOpacity="0.7" />
        <path d="M80 32V16" stroke="var(--border)" strokeOpacity="0.6" strokeDasharray="2 3" />
        <path d="M80 32V48" stroke="var(--border)" strokeOpacity="0.6" strokeDasharray="2 3" />
        <path d="M80 32H100" stroke="var(--border)" strokeOpacity="0.6" strokeDasharray="2 3" />

        <PixelSquare x={9} y={29} />
        <PixelSquare x={33} y={29} />
        <PixelSquare x={53} y={13} />
        <PixelSquare x={53} y={45} />
        <PixelSquare x={77} y={13} />
        <PixelSquare x={77} y={29} accent />
        <PixelSquare x={77} y={45} />
        <PixelSquare x={97} y={29} />
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

    const orbitAgentCells = [
      [0, 0],
      [8, 0],
      [8, 8],
      [16, 0],
      [0, 8],
      [16, 8],
      [0, 16],
      [8, 16],
      [16, 16],
    ] as const;

    const orbitAgents = [
      { id: "lt", x: 0, y: 10, opacity: 0.32 },
      { id: "lb", x: 2, y: 38, opacity: 0.2 },
      { id: "top", x: 45, y: 0, opacity: 0.22 },
      { id: "rt", x: 90, y: 10, opacity: 0.32 },
      { id: "rb", x: 88, y: 38, opacity: 0.2 },
    ] as const;

    return (
      <svg className="h-full w-full" viewBox="0 0 112 64" fill="none" aria-hidden="true">
        <g>
          {orbitAgents.map((agent) => (
            <line
              key={`line-${agent.id}`}
              x1={agent.x + 11}
              y1={agent.y + 11}
              x2={56}
              y2={32}
              stroke="var(--border)"
              strokeOpacity={0.18}
              strokeDasharray="2 3"
            />
          ))}

          {orbitAgents.map((agent) => (
            <g key={agent.id}>
              {orbitAgentCells.map(([x, y]) => (
                <PixelSquare
                  key={`${agent.id}-${x}-${y}`}
                  x={agent.x + x}
                  y={agent.y + y}
                  muted
                  opacity={agent.opacity}
                />
              ))}
            </g>
          ))}
        </g>

        <g transform="translate(20 10)">
          {robotCells.map(([x, y, accent]) => (
            <PixelSquare key={`${x}-${y}`} x={x} y={y} accent={accent} />
          ))}
        </g>
      </svg>
    );
  }

  const cliCells = [
    [4, 0, false],
    [12, 0, false],
    [20, 0, false],

    [6, 12, true],
    [22, 12, false],
    [30, 12, false],
    [38, 12, false],
    [46, 12, false],
    [54, 12, false],
    [62, 12, false],
    [70, 12, true],

    [6, 24, true],
    [22, 24, false],
    [30, 24, false],
    [38, 24, false],
    [46, 24, false],
    [54, 24, false],

    [6, 36, true],
    [22, 36, false],
    [30, 36, false],
    [38, 36, false],
    [46, 36, true],
    [54, 36, false],
    [62, 36, false],
    [70, 36, false],
    [78, 36, false],
  ] as const;

  return (
    <svg className="h-full w-full" viewBox="0 0 86 44" fill="none" aria-hidden="true">
      {cliCells.map(([x, y, accent]) => (
        <PixelSquare key={`${x}-${y}`} x={x} y={y} accent={accent} />
      ))}
    </svg>
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
              className="group relative flex min-w-[280px] flex-1 basis-full flex-col gap-6 overflow-hidden border border-border bg-background px-8 py-9 text-left transition-colors duration-200 hover:bg-muted/[0.14] lg:basis-[calc(33.333%-1.1rem)]"
            >
              <CornerInsetMarks />

              <div className="relative flex min-h-[132px] items-center justify-center px-4 pt-2">
                <div className="flex h-20 w-full max-w-[176px] items-center justify-center">
                  <StepIllustration pattern={step.pattern} />
                </div>

                <span className="absolute right-0 top-0 pt-1 font-mono text-[1.15rem] leading-none tracking-[-0.08em] text-primary transition-colors duration-200">
                  {step.num}
                </span>
              </div>

              <CardDivider />

              <div className="flex flex-col gap-4">
                <p className={CARD_EYEBROW_CLASS}>{step.label}</p>
                <h3
                  className={`text-2xl leading-[1.15] tracking-tight text-foreground ${GeistPixelSquare.className}`}
                >
                  <span>{step.title}</span>
                  <span className="text-primary">{step.titleAccent}</span>
                </h3>

                <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <SectionTailSpacer />
      </LandingContainer>
    </section>
  );
}
