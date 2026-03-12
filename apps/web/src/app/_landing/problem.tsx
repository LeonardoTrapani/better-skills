import type { ReactNode } from "react";
import { GeistPixelSquare } from "geist/font/pixel";

import { CARD_EYEBROW_CLASS, CardDivider } from "./card-elements";
import { CornerInsetMarks } from "./corner-inset-marks";
import { LandingContainer, SectionTailSpacer } from "./design-system";
import { SectionBackdrop, SectionHeader } from "./grid-background";

// Card 01 — "Knowledge lives in too many places."
// A regular 7×4 grid of squares with deliberate, irregular gaps — same shape everywhere
// but the voids signal fragmentation. Orange squares mark the surviving "sources".
function ScatteredKnowledgeVisual() {
  // Full grid positions then subtract the gaps
  const COLS = 7;
  const ROWS = 4;
  const GAP = 10; // step between squares (6px square + 4px gap)

  // Which cells are missing (row, col) — creates an intentionally uneven void
  const missing = new Set(["0-2", "0-5", "1-0", "1-4", "2-1", "2-3", "2-6", "3-0", "3-2", "3-5"]);

  // Orange highlight squares — the "still alive" knowledge nodes
  const accents = new Set(["0-0", "1-3", "2-5", "3-4"]);

  const cells: { x: number; y: number; accent: boolean }[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!missing.has(`${r}-${c}`)) {
        cells.push({
          x: c * GAP,
          y: r * GAP,
          accent: accents.has(`${r}-${c}`),
        });
      }
    }
  }

  const W = (COLS - 1) * GAP + 6;
  const H = (ROWS - 1) * GAP + 6;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" aria-hidden="true" className="h-full w-full">
      {cells.map(({ x, y, accent }) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width="6"
          height="6"
          fill={accent ? "var(--primary)" : "var(--border)"}
        />
      ))}
    </svg>
  );
}

// Card 02 — "Every tool gets a different copy."
// One source block on the left; same 2×2 block stamped 3 times to the right,
// each copy shifted down slightly and becoming progressively more faded.
// A thin dashed line connects them — the context trail that degrades.
function ClipboardVisual() {
  const SQ = 8; // square size
  const G = 4; // gap between squares in block

  // Helper: 2×2 block at origin cx,cy with opacity
  function Block({
    cx,
    cy,
    opacity,
    accentTopRight = false,
  }: {
    cx: number;
    cy: number;
    opacity: number;
    accentTopRight?: boolean;
  }) {
    return (
      <>
        <rect x={cx} y={cy} width={SQ} height={SQ} fill="var(--border)" fillOpacity={opacity} />
        <rect
          x={cx + SQ + G}
          y={cy}
          width={SQ}
          height={SQ}
          fill={accentTopRight ? "var(--primary)" : "var(--border)"}
          fillOpacity={accentTopRight ? 1 : opacity}
        />
        <rect
          x={cx}
          y={cy + SQ + G}
          width={SQ}
          height={SQ}
          fill="var(--border)"
          fillOpacity={opacity * 0.7}
        />
        <rect
          x={cx + SQ + G}
          y={cy + SQ + G}
          width={SQ}
          height={SQ}
          fill="var(--border)"
          fillOpacity={opacity * 0.7}
        />
      </>
    );
  }

  // Source block center-y at 20, copies stagger downward
  const blockW = SQ + G + SQ; // 20
  const sourceX = 0;
  const spacing = 34;

  const copies = [
    { x: sourceX + spacing, opacity: 0.9 },
    { x: sourceX + spacing * 2, opacity: 0.55 },
    { x: sourceX + spacing * 3, opacity: 0.25 },
  ];

  const totalW = sourceX + spacing * 3 + blockW;
  const totalH = 40;
  const sourceY = 4;

  return (
    <svg
      viewBox={`0 0 ${totalW} ${totalH}`}
      fill="none"
      aria-hidden="true"
      className="h-full w-full"
    >
      {/* Source */}
      <Block cx={sourceX} cy={sourceY} opacity={1} accentTopRight />

      {/* Copies */}
      {copies.map((c) => (
        <Block key={c.x} cx={c.x} cy={sourceY} opacity={c.opacity} />
      ))}
    </svg>
  );
}

// Card 03 — "Teams cannot see who owns what."
// A structured 3-row hierarchy of squares. Top row: filled (owners know).
// Middle row: mix of filled + ghost outlines-only (partial visibility).
// Bottom row: mostly ghost, one orange — the one person who actually knows.
function OwnershipVisual() {
  const SQ = 7;
  const GX = 12; // horizontal step
  const GY = 14; // vertical step

  type Cell = { col: number; row: number; kind: "filled" | "ghost" | "accent" };

  const cells: Cell[] = [
    // Row 0 — top tier, all visible
    { col: 0, row: 0, kind: "filled" },
    { col: 1, row: 0, kind: "filled" },
    { col: 2, row: 0, kind: "filled" },
    { col: 3, row: 0, kind: "filled" },
    { col: 4, row: 0, kind: "filled" },

    // Row 1 — middle tier, some ghost
    { col: 0, row: 1, kind: "ghost" },
    { col: 1, row: 1, kind: "filled" },
    { col: 2, row: 1, kind: "ghost" },
    { col: 3, row: 1, kind: "filled" },
    { col: 4, row: 1, kind: "ghost" },

    // Row 2 — bottom tier, mostly invisible, one accent
    { col: 0, row: 2, kind: "ghost" },
    { col: 1, row: 2, kind: "ghost" },
    { col: 2, row: 2, kind: "accent" },
    { col: 3, row: 2, kind: "ghost" },
    { col: 4, row: 2, kind: "ghost" },
  ];

  const W = 4 * GX + SQ;
  const H = 2 * GY + SQ;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" aria-hidden="true" className="h-full w-full">
      {/* vertical connectors between rows */}
      {[0, 1, 2, 3, 4].map((col) => (
        <line
          key={col}
          x1={col * GX + SQ / 2}
          y1={SQ}
          x2={col * GX + SQ / 2}
          y2={GY}
          stroke="var(--border)"
          strokeOpacity="0.5"
          strokeDasharray="2 2"
        />
      ))}
      {[0, 1, 2, 3, 4].map((col) => (
        <line
          key={col}
          x1={col * GX + SQ / 2}
          y1={GY + SQ}
          x2={col * GX + SQ / 2}
          y2={GY * 2}
          stroke="var(--border)"
          strokeOpacity="0.3"
          strokeDasharray="2 2"
        />
      ))}

      {cells.map(({ col, row, kind }) => {
        const x = col * GX;
        const y = row * GY;
        if (kind === "ghost") {
          return (
            <rect
              key={`${col}-${row}`}
              x={x}
              y={y}
              width={SQ}
              height={SQ}
              fill="none"
              stroke="var(--border)"
              strokeOpacity="0.5"
            />
          );
        }
        return (
          <rect
            key={`${col}-${row}`}
            x={x}
            y={y}
            width={SQ}
            height={SQ}
            fill={kind === "accent" ? "var(--primary)" : "var(--border)"}
            fillOpacity={kind === "accent" ? 1 : 0.7}
          />
        );
      })}
    </svg>
  );
}

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

        <div className="flex flex-wrap gap-4">
          <ProblemCard
            label="Scattered Context"
            title="Knowledge lives in too many places."
            description="Prompts drift between docs, IDE settings, local folders, and chat threads. Teams stop knowing which version is current before an agent even runs."
            visual={<ScatteredKnowledgeVisual />}
          />

          <ProblemCard
            label="Clipboard Sync"
            title="Every tool gets a different copy."
            description="Switch between agents and you paste the same context again. Knowledge lives on the clipboard instead of in a system."
            visual={<ClipboardVisual />}
          />

          <ProblemCard
            label="Ownership"
            title="Teams cannot see who owns what."
            description="Without roles, visibility, or a shared graph, new teammates inherit stale skills and nobody can tell what the working version should be."
            visual={<OwnershipVisual />}
          />
        </div>

        <SectionTailSpacer />
      </LandingContainer>
    </section>
  );
}
