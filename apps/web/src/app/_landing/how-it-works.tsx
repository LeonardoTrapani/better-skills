"use client";

import { SectionHeader, SectionBackdrop } from "./grid-background";
import { LandingContainer, SectionTailSpacer } from "./design-system";
import { GeistPixelSquare } from "geist/font/pixel";

const steps: {
  num: string;
  titlePlain: string;
  titleAccent: string;
  titleSuffix?: string;
  description: string;
  pattern: "cli" | "graph" | "agent";
}[] = [
  {
    num: "01",
    titlePlain: "Install &",
    titleAccent: " run",
    titleSuffix: " in seconds",
    description:
      "One command installs the CLI, authenticates your account, and syncs your vault. Your agent workflow is live before you finish your coffee.",
    pattern: "cli",
  },
  {
    num: "02",
    titlePlain: "Explore the",
    titleAccent: " graph",
    description:
      "Browse and manage every skill from the dashboard, then jump into the graph to trace connections, structure, and knowledge flow at a glance.",
    pattern: "graph",
  },
  {
    num: "03",
    titlePlain: "Ship with any",
    titleAccent: " agent",
    description:
      "Drop your skills into Claude, Cursor, or any other agent. Refine and evolve them in place — your second brain grows with every project.",
    pattern: "agent",
  },
];

// ── CLI illustration: pixel-art "code lines" using squares ──────────────────
function CliIllustration() {
  // Each row: array of [x, kind] where kind = "accent" | "dim" | "off"
  const rows: { x: number; kind: "accent" | "dim" | "off" }[][] = [
    [
      { x: 0, kind: "accent" },
      { x: 1, kind: "dim" },
      { x: 2, kind: "dim" },
      { x: 3, kind: "dim" },
      { x: 4, kind: "dim" },
      { x: 5, kind: "off" },
    ],
    [
      { x: 0, kind: "off" },
      { x: 1, kind: "accent" },
      { x: 2, kind: "dim" },
      { x: 3, kind: "dim" },
      { x: 4, kind: "off" },
      { x: 5, kind: "off" },
    ],
    [
      { x: 0, kind: "accent" },
      { x: 1, kind: "dim" },
      { x: 2, kind: "accent" },
      { x: 3, kind: "dim" },
      { x: 4, kind: "dim" },
      { x: 5, kind: "dim" },
    ],
    [
      { x: 0, kind: "off" },
      { x: 1, kind: "accent" },
      { x: 2, kind: "dim" },
      { x: 3, kind: "off" },
      { x: 4, kind: "off" },
      { x: 5, kind: "off" },
    ],
    [
      { x: 0, kind: "accent" },
      { x: 1, kind: "accent" },
      { x: 2, kind: "dim" },
      { x: 3, kind: "dim" },
      { x: 4, kind: "accent" },
      { x: 5, kind: "off" },
    ],
  ];
  const S = 7; // square size
  const G = 3; // gap
  const step = S + G;

  const fill = (kind: "accent" | "dim" | "off") => {
    if (kind === "accent") return "var(--primary)";
    if (kind === "dim") return "var(--border)";
    return "transparent";
  };

  return (
    <svg
      width={6 * step - G}
      height={5 * step - G}
      viewBox={`0 0 ${6 * step - G} ${5 * step - G}`}
      fill="none"
      aria-hidden="true"
    >
      {rows.map((row, ri) =>
        row.map(({ x, kind }) =>
          kind === "off" ? null : (
            <rect
              key={`${ri}-${x}`}
              x={x * step}
              y={ri * step}
              width={S}
              height={S}
              fill={fill(kind)}
            />
          ),
        ),
      )}
    </svg>
  );
}

// ── Graph illustration (unchanged) ──────────────────────────────────────────
function GraphIllustration() {
  return (
    <svg width="58" height="34" viewBox="0 0 58 34" fill="none" aria-hidden="true">
      {/* edges */}
      <line x1="7" y1="7" x2="25" y2="7" stroke="var(--border)" strokeOpacity="0.5" />
      <line x1="25" y1="7" x2="25" y2="21" stroke="var(--border)" strokeOpacity="0.5" />
      <line x1="25" y1="21" x2="43" y2="21" stroke="var(--border)" strokeOpacity="0.4" />
      <line x1="7" y1="7" x2="7" y2="21" stroke="var(--border)" strokeOpacity="0.3" />
      <line x1="7" y1="21" x2="25" y2="21" stroke="var(--border)" strokeOpacity="0.3" />
      {/* nodes */}
      <rect x="4" y="4" width="6" height="6" fill="var(--border)" />
      <rect x="22" y="4" width="6" height="6" fill="var(--border)" />
      <rect x="4" y="18" width="6" height="6" fill="var(--border)" />
      <rect x="22" y="18" width="6" height="6" fill="var(--border)" />
      <rect x="40" y="18" width="6" height="6" fill="var(--primary)" />
    </svg>
  );
}

// ── Agent illustration: pixel-art robot using squares ────────────────────────
function AgentIllustration() {
  // Pixel grid: 1 = border colour, 2 = primary colour, 0 = transparent
  // 11-wide × 13-tall grid (each cell = 4px, gap = 1px)
  const grid = [
    //  0  1  2  3  4  5  6  7  8  9 10
    [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], // 0  antenna top
    [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0], // 1  antenna base
    [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], // 2  neck
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0], // 3  head top
    [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0], // 4  head upper
    [0, 0, 1, 0, 2, 0, 2, 0, 1, 0, 0], // 5  eyes
    [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0], // 6  head lower
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0], // 7  head bottom
    [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1], // 8  arms + shoulder
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 9  arms mid
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], // 10 torso
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], // 11 legs upper
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], // 12 legs lower
  ];

  const S = 4; // cell size
  const G = 1; // gap
  const step = S + G;
  const cols = grid[0]!.length;
  const rows = grid.length;

  return (
    <svg
      width={cols * step - G}
      height={rows * step - G}
      viewBox={`0 0 ${cols * step - G} ${rows * step - G}`}
      fill="none"
      aria-hidden="true"
    >
      {grid.map((row, ri) =>
        row.map((v, ci) => {
          if (v === 0) return null;
          return (
            <rect
              key={`${ri}-${ci}`}
              x={ci * step}
              y={ri * step}
              width={S}
              height={S}
              fill={v === 2 ? "var(--primary)" : "var(--border)"}
            />
          );
        }),
      )}
    </svg>
  );
}

function StepIllustration({ pattern }: { pattern: "cli" | "graph" | "agent" }) {
  if (pattern === "cli") return <CliIllustration />;
  if (pattern === "graph") return <GraphIllustration />;
  return <AgentIllustration />;
}

function CornerInsetMarks() {
  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l border-t border-foreground/25 transition-colors duration-300 group-hover:border-foreground/60"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r border-t border-foreground/25 transition-colors duration-300 group-hover:border-foreground/60"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b border-r border-foreground/25 transition-colors duration-300 group-hover:border-foreground/60"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b border-l border-foreground/25 transition-colors duration-300 group-hover:border-foreground/60"
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

        <div className="flex lg:flex-row flex-col gap-px border border-border bg-border">
          {steps.map((step) => (
            <div
              key={step.num}
              className="group relative flex flex-1 flex-col gap-7 overflow-hidden bg-background px-8 py-9 text-left"
            >
              <CornerInsetMarks />

              {/* Top row: illustration + step number */}
              <div className="flex items-start justify-between gap-4">
                <StepIllustration pattern={step.pattern} />
                <span
                  className={`font-mono text-lg font-semibold tracking-tight text-border/60 ${GeistPixelSquare.className}`}
                >
                  {step.num}
                </span>
              </div>

              {/* Divider */}
              <div className="h-px w-full bg-gradient-to-r from-primary/30 via-border/60 to-transparent" />

              {/* Content */}
              <div className="flex flex-col gap-3">
                <h3
                  className={`text-xl font-semibold leading-tight tracking-tight ${GeistPixelSquare.className}`}
                >
                  <span className="text-foreground">{step.titlePlain}</span>
                  <span className="text-primary">{step.titleAccent}</span>
                  {step.titleSuffix && <span className="text-foreground">{step.titleSuffix}</span>}
                </h3>
                <p className="max-w-[36ch] text-sm leading-relaxed text-muted-foreground">
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
