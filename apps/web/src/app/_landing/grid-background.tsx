"use client";

import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

import {
  LandingCenteredOverlay,
  LANDING_CONTENT_MAX_WIDTH_CLASS,
  LANDING_CONTENT_MAX_WIDTH_PX,
} from "./design-system";
import { GeistPixelSquare } from "geist/font/pixel";

const HERO_GRID_SIDE_UNIT_PX = 100;
const HERO_OUTER_FRAME_WIDTH_PX = LANDING_CONTENT_MAX_WIDTH_PX + HERO_GRID_SIDE_UNIT_PX * 2;
const HERO_MID_COLUMN_WIDTH_PX = LANDING_CONTENT_MAX_WIDTH_PX - HERO_GRID_SIDE_UNIT_PX * 2;
const HERO_INNER_COLUMN_WIDTH_PX = LANDING_CONTENT_MAX_WIDTH_PX - HERO_GRID_SIDE_UNIT_PX * 2;
const HERO_UPPER_COLUMN_WIDTH_PX = HERO_INNER_COLUMN_WIDTH_PX - HERO_GRID_SIDE_UNIT_PX * 2;
const HERO_CORE_COLUMN_WIDTH_PX = HERO_INNER_COLUMN_WIDTH_PX - HERO_GRID_SIDE_UNIT_PX * 4;

type IntersectionCorner = "tl" | "tr" | "bl" | "br";
type BackdropVariant = "default" | "how-it-works" | "features" | "pricing" | "cli-demo";

const CROSS_INTERSECTION: readonly IntersectionCorner[] = ["tl", "tr", "bl", "br"];
const LEFT_T_INTERSECTION: readonly IntersectionCorner[] = ["tl", "bl"];
const RIGHT_T_INTERSECTION: readonly IntersectionCorner[] = ["tr", "br"];
const LEFT_EDGE_INTERSECTION: readonly IntersectionCorner[] = ["tr", "br"];
const RIGHT_EDGE_INTERSECTION: readonly IntersectionCorner[] = ["tl", "bl"];

function rowToY(row: number) {
  return `${row}px`;
}

function renderRowIntersections({
  rows,
  x,
  which,
  keyPrefix,
}: {
  rows: readonly number[];
  x: string;
  which: readonly IntersectionCorner[];
  keyPrefix: string;
}) {
  return rows.map((row) => (
    <Intersection key={`${keyPrefix}-${row}`} x={x} y={rowToY(row)} which={which} />
  ));
}

function renderSideRules({
  rows,
  side,
  width,
  keyPrefix,
}: {
  rows: readonly number[];
  side: "left" | "right";
  width: number;
  keyPrefix: string;
}) {
  const sideClass = side === "left" ? "left-0" : "right-0";

  return rows.map((row) => (
    <div
      key={`${keyPrefix}-${row}`}
      className={cn("absolute h-px bg-border", sideClass)}
      style={{ top: row, width }}
    />
  ));
}

function CenteredFrame({
  maxWidth,
  className,
  children,
}: {
  maxWidth: number;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn("absolute left-1/2 -translate-x-1/2", className)}
      style={{ width: maxWidth }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Seeded PRNG                                                       */
/* ------------------------------------------------------------------ */
function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/*  Dot-matrix canvas                                                 */
/* ------------------------------------------------------------------ */
interface DotMatrixProps {
  seed?: number;
  density?: number;
  accentRatio?: number;
  className?: string;
}

export function DotMatrix({
  seed = 42,
  density = 60,
  accentRatio = 0.12,
  className,
}: DotMatrixProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  const dots = useMemo(() => {
    if (dims.w === 0 || dims.h === 0) return [];
    const rng = mulberry32(seed);
    const area = dims.w * dims.h;
    const count = Math.round((area / 1_000_000) * density);
    return Array.from({ length: count }, () => ({
      x: rng() * dims.w,
      y: rng() * dims.h,
      r: 1 + rng() * 1.5,
      accent: rng() < accentRatio,
      phase: rng() * Math.PI * 2,
      speed: 0.3 + rng() * 0.7,
    }));
  }, [seed, density, accentRatio, dims]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      setDims({ w: width, h: height });
    });
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dots.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const style = getComputedStyle(document.documentElement);
    const primary = style.getPropertyValue("--primary").trim();
    const muted = style.getPropertyValue("--muted-foreground").trim();
    const dpr = window.devicePixelRatio || 1;

    let running = true;
    const draw = (t: number) => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const dot of dots) {
        const alpha = 0.25 + 0.18 * Math.sin(t * 0.001 * dot.speed + dot.phase);
        ctx.beginPath();
        ctx.arc(dot.x * dpr, dot.y * dpr, dot.r * dpr, 0, Math.PI * 2);
        ctx.fillStyle = dot.accent
          ? `oklch(from ${primary} l c h / ${alpha})`
          : `oklch(from ${muted} l c h / ${alpha * 0.6})`;
        ctx.fill();
      }
      frameRef.current = requestAnimationFrame(draw);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      draw(0);
    } else {
      frameRef.current = requestAnimationFrame(draw);
    }

    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
    };
  }, [dots]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className ?? ""}`}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Shared SVG primitives                                             */
/* ------------------------------------------------------------------ */

/** Accent node — larger amber square used as focus marker */
function AccentMark({ className }: { className?: string }) {
  return (
    <span
      className={`pointer-events-none absolute z-[3] block size-3 rounded-[2px] bg-amber-500 ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

/**
 * Place a graph-like node at an absolute intersection point.
 * `which` is kept only for call-site compatibility in the hero map.
 */
function Intersection({
  x,
  y,
  which,
}: {
  x: string;
  y: string;
  which: readonly IntersectionCorner[];
}) {
  const size = 7;
  const half = Math.floor(size / 2);
  const normalizedX = x.replaceAll(" ", "");
  const normalizedY = y.replaceAll(" ", "");
  const xOffset = normalizedX === "100%" ? -1 : 0;
  const yOffset = normalizedY === "100%" ? -1 : 0;
  const _shape = which;

  return (
    <span
      className="pointer-events-none absolute z-[2] block rounded-[2px] border border-border bg-background"
      style={{
        width: size,
        height: size,
        left: `calc(${x} - ${half}px + ${xOffset}px)`,
        top: `calc(${y} - ${half}px + ${yOffset}px)`,
      }}
      data-shape={_shape.length}
      aria-hidden="true"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Block-pattern decorations (dot-matrix squares)                    */
/*  Generates grid of small squares like Firecrawl's ASCII blocks     */
/* ------------------------------------------------------------------ */

function DotBlock({
  rows,
  cols,
  cellSize = 8,
  gap = 3,
  seed = 1,
  className,
}: {
  rows: number;
  cols: number;
  cellSize?: number;
  gap?: number;
  seed?: number;
  className?: string;
}) {
  const rng = mulberry32(seed);
  const totalW = cols * (cellSize + gap) - gap;
  const totalH = rows * (cellSize + gap) - gap;

  const cells: { x: number; y: number; opacity: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = rng();
      if (v > 0.35) {
        cells.push({
          x: c * (cellSize + gap),
          y: r * (cellSize + gap),
          opacity: 0.2 + v * 0.2,
        });
      }
    }
  }

  return (
    <svg
      width={totalW}
      height={totalH}
      viewBox={`0 0 ${totalW} ${totalH}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {cells.map((cell, i) => (
        <rect
          key={i}
          x={cell.x}
          y={cell.y}
          width={cellSize}
          height={cellSize}
          fill="var(--border)"
          fillOpacity={cell.opacity}
        />
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero grid overlay                                                 */
/*  Dense structural grid visible only within the hero section        */
/*  Multiple nested columns + horizontal rules + curvy-rect corners   */
/* ------------------------------------------------------------------ */

export function HeroGridOverlay() {
  const contentToMidInset = Math.round(
    (LANDING_CONTENT_MAX_WIDTH_PX - HERO_MID_COLUMN_WIDTH_PX) / 2,
  );
  const contentToInnerInset = Math.round(
    (LANDING_CONTENT_MAX_WIDTH_PX - HERO_INNER_COLUMN_WIDTH_PX) / 2,
  );
  const outerRuleReach = Math.round((HERO_OUTER_FRAME_WIDTH_PX - HERO_INNER_COLUMN_WIDTH_PX) / 2);

  const contentToMidInsetX = `${contentToMidInset}px`;
  const contentToMidInsetMirrorX = `calc(100% - ${contentToMidInset}px)`;
  const contentToInnerInsetX = `${contentToInnerInset}px`;
  const contentToInnerInsetMirrorX = `calc(100% - ${contentToInnerInset}px)`;

  const majorRows = [100, 200, 300, 400] as const;
  const topAndMajorRows = [0, 100, 200, 300, 400] as const;
  const contentInnerBoundaryRows = [300, 400] as const;
  const innerColumnNodeRows = [0, 100] as const;

  const sideGraphPrimaryOffset = Math.round((contentToMidInset - 36) / 2);
  const sideGraphSecondaryOffset = contentToMidInset + 14;
  const topClusterInnerOffset = contentToMidInset + 19;
  const topRightClusterOffset = contentToMidInset - 1;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 lg:hidden">
        <div className="absolute top-0 bottom-0 left-4 w-px bg-border" />
        <div className="absolute top-0 bottom-0 right-4 w-px bg-border" />
        <Intersection x="1rem" y="0px" which={CROSS_INTERSECTION} />
        <Intersection x="calc(100% - 1rem)" y="0px" which={CROSS_INTERSECTION} />
        <div className="absolute top-[100px] left-4 right-4 h-px bg-border" />
        <AccentMark className="absolute left-4 top-[100px] -translate-x-1/2 -translate-y-1/2" />
        <AccentMark className="absolute right-4 top-[100px] translate-x-1/2 -translate-y-1/2" />

        {/* Small graph accents on mobile */}
        <div className="absolute left-5 bottom-[120px]">
          <SkillGraph variant="b" />
        </div>
        <div className="absolute right-5 bottom-[120px]">
          <SkillGraph variant="b" mirror />
        </div>
      </div>

      <div className="absolute inset-0 hidden lg:block">
        <CenteredFrame maxWidth={HERO_OUTER_FRAME_WIDTH_PX} className="top-0 bottom-0 z-[2]">
          {/* Bracket labels */}
          <span className="absolute top-6 -left-1 w-[102px] select-none text-center font-mono text-[10px] tracking-widest text-muted-foreground">
            [ SKILL ]
          </span>
          <span className="absolute top-6 -right-1 w-[102px] select-none text-center font-mono text-[10px] tracking-widest text-muted-foreground">
            [ SYNC ]
          </span>
          <span className="absolute bottom-6 -left-1 w-[102px] select-none text-center font-mono text-[10px] tracking-widest text-muted-foreground">
            [ .MD ]
          </span>
          <span className="absolute bottom-6 -right-1 w-[102px] select-none text-center font-mono text-[10px] tracking-widest text-muted-foreground">
            [ GRAPH ]
          </span>

          {renderSideRules({
            rows: majorRows,
            side: "left",
            width: outerRuleReach,
            keyPrefix: "outer-left-rule",
          })}
          {renderSideRules({
            rows: majorRows,
            side: "right",
            width: outerRuleReach,
            keyPrefix: "outer-right-rule",
          })}
          {renderRowIntersections({
            rows: topAndMajorRows,
            x: "0px",
            which: LEFT_EDGE_INTERSECTION,
            keyPrefix: "outer-left-int",
          })}
          {renderRowIntersections({
            rows: topAndMajorRows,
            x: "100%",
            which: RIGHT_EDGE_INTERSECTION,
            keyPrefix: "outer-right-int",
          })}
        </CenteredFrame>

        <LandingCenteredOverlay className="top-0 bottom-0 z-[2]">
          {renderRowIntersections({
            rows: topAndMajorRows,
            x: "0px",
            which: CROSS_INTERSECTION,
            keyPrefix: "content-left-edge-int",
          })}
          {renderRowIntersections({
            rows: topAndMajorRows,
            x: "100%",
            which: CROSS_INTERSECTION,
            keyPrefix: "content-right-edge-int",
          })}
          {renderRowIntersections({
            rows: topAndMajorRows,
            x: contentToMidInsetX,
            which: CROSS_INTERSECTION,
            keyPrefix: "content-mid-left-int",
          })}
          {renderRowIntersections({
            rows: topAndMajorRows,
            x: contentToMidInsetMirrorX,
            which: CROSS_INTERSECTION,
            keyPrefix: "content-mid-right-int",
          })}
          {renderRowIntersections({
            rows: contentInnerBoundaryRows,
            x: contentToInnerInsetX,
            which: LEFT_T_INTERSECTION,
            keyPrefix: "content-inner-left-int",
          })}
          {renderRowIntersections({
            rows: contentInnerBoundaryRows,
            x: contentToInnerInsetMirrorX,
            which: RIGHT_T_INTERSECTION,
            keyPrefix: "content-inner-right-int",
          })}
        </LandingCenteredOverlay>

        <CenteredFrame
          maxWidth={HERO_MID_COLUMN_WIDTH_PX}
          className="top-0 bottom-0 border-x border-border"
        />

        <CenteredFrame
          maxWidth={HERO_INNER_COLUMN_WIDTH_PX}
          className="top-0 bottom-0 border-x border-border"
        >
          {/* Full-width h-lines at y=100 and y=200 */}
          <div className="absolute top-[100px] left-0 h-px w-full bg-border" />
          <div className="absolute top-[200px] left-0 h-px w-full bg-border" />
          {renderRowIntersections({
            rows: innerColumnNodeRows,
            x: "0px",
            which: CROSS_INTERSECTION,
            keyPrefix: "inner-column-left-int",
          })}
          {renderRowIntersections({
            rows: innerColumnNodeRows,
            x: "100%",
            which: CROSS_INTERSECTION,
            keyPrefix: "inner-column-right-int",
          })}
          {/* Bottom column endpoints as graph nodes */}
          <Intersection x="0px" y="100%" which={CROSS_INTERSECTION} />
          <Intersection x="100%" y="100%" which={CROSS_INTERSECTION} />
        </CenteredFrame>

        <CenteredFrame maxWidth={HERO_INNER_COLUMN_WIDTH_PX} className="top-0 bottom-0 z-[3]">
          <AccentMark className="absolute top-[200px] -left-[6px] -translate-y-1/2" />
          <AccentMark className="absolute top-[200px] -right-[6px] -translate-y-1/2" />
        </CenteredFrame>

        <CenteredFrame
          maxWidth={HERO_UPPER_COLUMN_WIDTH_PX}
          className="top-0 h-[200px] border-x border-border"
        >
          {/* Top-edge half nodes */}
          <Intersection x="0px" y="0px" which={["bl", "br"]} />
          <Intersection x="100%" y="0px" which={["bl", "br"]} />
          {/* Midpoint nodes where top rule crosses */}
          <Intersection x="0px" y="50%" which={CROSS_INTERSECTION} />
          <Intersection x="100%" y="50%" which={CROSS_INTERSECTION} />
          {/* Upper-column edges × y=200: T-intersection (column ends) → tl + tr */}
          <Intersection x="0px" y="100%" which={["tl", "tr"]} />
          <Intersection x="100%" y="100%" which={["tl", "tr"]} />
        </CenteredFrame>
        <CenteredFrame
          maxWidth={HERO_CORE_COLUMN_WIDTH_PX}
          className="top-0 h-[200px] border-x border-border"
        >
          <Intersection x="0px" y="0px" which={["bl", "br"]} />
          <Intersection x="100%" y="0px" which={["bl", "br"]} />
          <Intersection x="0px" y="50%" which={CROSS_INTERSECTION} />
          <Intersection x="100%" y="50%" which={CROSS_INTERSECTION} />
          <Intersection x="0px" y="100%" which={["tl", "tr"]} />
          <Intersection x="100%" y="100%" which={["tl", "tr"]} />
        </CenteredFrame>

        <LandingCenteredOverlay className="top-0">
          <div className="absolute left-[10px] top-0">
            <DotBlock rows={6} cols={10} seed={101} />
          </div>
          <div className="absolute top-[5px]" style={{ left: topClusterInnerOffset }}>
            <DotBlock rows={6} cols={6} seed={102} />
          </div>
          <div className="absolute top-[80px]" style={{ left: topClusterInnerOffset }}>
            <DotBlock rows={4} cols={4} seed={103} cellSize={6} gap={2} />
          </div>
        </LandingCenteredOverlay>

        <LandingCenteredOverlay className="top-0">
          <div className="absolute right-[10px] top-0">
            <DotBlock rows={3} cols={8} seed={201} cellSize={6} gap={2} />
          </div>
          <div className="absolute right-[10px] top-[35px]">
            <DotBlock rows={2} cols={12} seed={202} cellSize={4} gap={2} />
          </div>
          <div className="absolute top-[10px]" style={{ right: topRightClusterOffset }}>
            <DotBlock rows={4} cols={4} seed={203} />
          </div>
        </LandingCenteredOverlay>

        <CenteredFrame maxWidth={HERO_OUTER_FRAME_WIDTH_PX} className="top-[220px]">
          <div className="absolute left-[20px] top-[120px]">
            <DotBlock rows={6} cols={6} seed={301} cellSize={6} gap={3} />
          </div>
          <div className="absolute left-[100px]">
            <DotBlock rows={2} cols={10} seed={302} cellSize={4} gap={2} />
          </div>
          <div className="absolute top-[50px] left-[0px]">
            <DotBlock rows={4} cols={6} seed={210} cellSize={5} gap={2} />
          </div>
        </CenteredFrame>

        <CenteredFrame maxWidth={HERO_OUTER_FRAME_WIDTH_PX} className="top-[250px]">
          <div className="absolute right-[10px] top-0">
            <DotBlock rows={5} cols={5} seed={401} cellSize={7} gap={3} />
          </div>
          <div className="absolute -top-[130px] right-[200px]">
            <DotBlock rows={10} cols={6} seed={210} cellSize={6} gap={2} />
          </div>
          <div className="absolute top-[120px] right-[120px]">
            <DotBlock rows={4} cols={6} seed={402} cellSize={4} gap={2} />
          </div>
        </CenteredFrame>

        <LandingCenteredOverlay className="top-0 bottom-0">
          <div className="absolute left-[220px] top-[40px]">
            <SkillGraph variant="b" />
          </div>
          <div className="absolute top-[150px] -left-[80px]">
            <SkillGraph variant="a" />
          </div>
          <div className="absolute top-[150px]" style={{ left: sideGraphSecondaryOffset }}>
            <SkillGraph variant="c" />
          </div>
          <div className="absolute top-[330px]" style={{ left: sideGraphPrimaryOffset }}>
            <SkillGraph variant="b" />
          </div>

          <div className="absolute right-[220px] top-[40px]">
            <SkillGraph variant="b" mirror />
          </div>
          <div className="absolute top-[120px]" style={{ right: sideGraphPrimaryOffset }}>
            <SkillGraph variant="b" mirror />
          </div>
          <div className="absolute top-[225px] -right-[80px]">
            <SkillGraph variant="a" mirror />
          </div>
          <div className="absolute top-[330px]" style={{ right: sideGraphPrimaryOffset }}>
            <SkillGraph variant="c" mirror />
          </div>
        </LandingCenteredOverlay>
      </div>
    </div>
  );
}

/**
 * SkillGraph — a compact graph diagram with square nodes + orthogonal edges.
 * Sized to fit cleanly inside the grid gutters without overlapping rules.
 */
function hashToSeed(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

function PrimaryPulseNode({
  x,
  y,
  size,
  seed,
  baseOpacity = 0.72,
}: {
  x: number;
  y: number;
  size: number;
  seed: number;
  baseOpacity?: number;
}) {
  const reduceMotion = useReducedMotion();
  const pulse = useMemo(() => {
    const rng = mulberry32(seed);
    const peak = Math.min(1, baseOpacity + 0.14 + rng() * 0.2);
    const low = Math.max(0.18, baseOpacity - (0.2 + rng() * 0.16));
    const settle = Math.min(0.95, baseOpacity + 0.04 + rng() * 0.12);
    return {
      duration: 1.7 + rng() * 1.5,
      delay: rng() * 1.3,
      repeatDelay: 0.1 + rng() * 0.8,
      opacity: [baseOpacity, peak, low, settle, baseOpacity],
    };
  }, [baseOpacity, seed]);

  if (reduceMotion) {
    return (
      <rect
        x={x}
        y={y}
        width={size}
        height={size}
        fill="var(--primary)"
        fillOpacity={baseOpacity}
      />
    );
  }

  return (
    <motion.rect
      x={x}
      y={y}
      width={size}
      height={size}
      fill="var(--primary)"
      initial={{ opacity: baseOpacity }}
      animate={{ opacity: pulse.opacity }}
      transition={{
        duration: pulse.duration,
        ease: "easeInOut",
        times: [0, 0.22, 0.5, 0.78, 1],
        repeat: Number.POSITIVE_INFINITY,
        delay: pulse.delay,
        repeatDelay: pulse.repeatDelay,
      }}
    />
  );
}

function SkillGraph({
  className,
  mirror = false,
  variant = "a",
  size = "sm",
}: {
  className?: string;
  mirror?: boolean;
  variant?: "a" | "b" | "c";
  size?: "sm" | "md";
}) {
  const s = size === "md" ? 1.25 : 1;
  const nodeSize = 6 * s;
  const instanceId = useId();
  const instanceSeed = hashToSeed(
    `${instanceId}-${variant}-${mirror ? "mirror" : "default"}-${size}`,
  );

  const graphs = {
    /* L-shape: 3 nodes */
    a: {
      w: 36 * s,
      h: 30 * s,
      content: (
        <>
          <line
            x1={4 * s}
            y1={4 * s}
            x2={4 * s}
            y2={26 * s}
            stroke="var(--border)"
            strokeOpacity="0.52"
          />
          <line
            x1={4 * s}
            y1={26 * s}
            x2={32 * s}
            y2={26 * s}
            stroke="var(--border)"
            strokeOpacity="0.45"
          />
          <PrimaryPulseNode
            x={1 * s}
            y={1 * s}
            size={nodeSize}
            seed={instanceSeed + 11}
            baseOpacity={0.75}
          />
          <rect x={1 * s} y={23 * s} width={nodeSize} height={nodeSize} fill="var(--border)" />
          <PrimaryPulseNode
            x={29 * s}
            y={23 * s}
            size={nodeSize}
            seed={instanceSeed + 29}
            baseOpacity={0.86}
          />
        </>
      ),
    },
    /* Staircase: 3 nodes */
    b: {
      w: 32 * s,
      h: 32 * s,
      content: (
        <>
          <line
            x1={4 * s}
            y1={4 * s}
            x2={4 * s}
            y2={17 * s}
            stroke="var(--border)"
            strokeOpacity="0.5"
          />
          <line
            x1={4 * s}
            y1={17 * s}
            x2={28 * s}
            y2={17 * s}
            stroke="var(--border)"
            strokeOpacity="0.45"
          />
          <line
            x1={28 * s}
            y1={17 * s}
            x2={28 * s}
            y2={28 * s}
            stroke="var(--border)"
            strokeOpacity="0.4"
          />
          <PrimaryPulseNode
            x={1 * s}
            y={1 * s}
            size={nodeSize}
            seed={instanceSeed + 41}
            baseOpacity={0.6}
          />
          <rect x={1 * s} y={14 * s} width={nodeSize} height={nodeSize} fill="var(--border)" />
          <PrimaryPulseNode
            x={25 * s}
            y={25 * s}
            size={nodeSize}
            seed={instanceSeed + 59}
            baseOpacity={0.88}
          />
        </>
      ),
    },
    /* T-shape: 3 nodes */
    c: {
      w: 36 * s,
      h: 28 * s,
      content: (
        <>
          <line
            x1={4 * s}
            y1={4 * s}
            x2={32 * s}
            y2={4 * s}
            stroke="var(--border)"
            strokeOpacity="0.5"
          />
          <line
            x1={18 * s}
            y1={4 * s}
            x2={18 * s}
            y2={24 * s}
            stroke="var(--border)"
            strokeOpacity="0.42"
          />
          <PrimaryPulseNode
            x={1 * s}
            y={1 * s}
            size={nodeSize}
            seed={instanceSeed + 71}
            baseOpacity={0.7}
          />
          <rect x={29 * s} y={1 * s} width={nodeSize} height={nodeSize} fill="var(--border)" />
          <PrimaryPulseNode
            x={15 * s}
            y={21 * s}
            size={nodeSize}
            seed={instanceSeed + 89}
            baseOpacity={0.86}
          />
        </>
      ),
    },
  };

  const g = graphs[variant];

  return (
    <svg
      width={g.w}
      height={g.h}
      viewBox={`0 0 ${g.w} ${g.h}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      style={mirror ? { transform: "scaleX(-1)" } : undefined}
    >
      {g.content}
    </svg>
  );
}

/**
 * SectionBackdrop — decorative background for landing sections.
 * `variant` gives each section a distinct but cohesive look.
 */
export function SectionBackdrop({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: BackdropVariant;
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
      aria-hidden="true"
    >
      {/* ── Mobile decorations ── */}
      <div className="lg:hidden">
        {/* Structural lines */}
        <div className="absolute top-0 bottom-0 left-4 w-px bg-border" />
        <div className="absolute top-0 bottom-0 right-4 w-px bg-border" />
        <div className="absolute top-1/2 left-4 right-4 h-px bg-border" />

        {/* Graph accents — mobile */}
        <div className="absolute left-6 top-20">
          <SkillGraph variant="a" />
        </div>
        <div className="absolute right-6 top-20">
          <SkillGraph variant="a" mirror />
        </div>

        {/* Extra mobile-only elements per variant */}
        {variant === "features" && (
          <>
            <div className="absolute left-6 bottom-16">
              <SkillGraph variant="b" />
            </div>
            <div className="absolute right-6 bottom-16">
              <SkillGraph variant="c" mirror />
            </div>
          </>
        )}
        {variant === "how-it-works" && (
          <>
            <div className="absolute right-7 bottom-20">
              <SkillGraph variant="b" mirror />
            </div>
            <DotBlock
              rows={3}
              cols={4}
              seed={7701}
              cellSize={3}
              gap={2}
              className="absolute left-6 bottom-24"
            />
          </>
        )}
        {variant === "pricing" && (
          <>
            <div className="absolute left-6 bottom-20">
              <SkillGraph variant="c" />
            </div>
            <DotBlock
              rows={2}
              cols={5}
              seed={7702}
              cellSize={3}
              gap={2}
              className="absolute right-7 bottom-28"
            />
          </>
        )}
        {variant === "cli-demo" && (
          <div className="absolute right-6 bottom-16">
            <SkillGraph variant="b" mirror />
          </div>
        )}
      </div>

      {/* ── Desktop decorations ── */}
      <LandingCenteredOverlay className="top-0 bottom-0 hidden lg:block">
        {/* Horizontal rules — structural rhythm */}
        <div className="absolute top-20 left-0 h-px w-[140px] bg-border" />
        <div className="absolute top-20 right-0 h-px w-[140px] bg-border" />
        <div className="absolute bottom-20 left-0 h-px w-[140px] bg-border" />
        <div className="absolute bottom-20 right-0 h-px w-[140px] bg-border" />

        {/* Per-variant graph decorations — positioned cleanly below/above rules */}
        {variant === "default" && (
          <>
            <div className="absolute left-4 top-28">
              <SkillGraph variant="a" size="md" />
            </div>
            <div className="absolute right-4 top-28">
              <SkillGraph variant="a" size="md" mirror />
            </div>
            <div className="absolute left-6 bottom-28">
              <SkillGraph variant="b" />
            </div>
            <div className="absolute right-6 bottom-28">
              <SkillGraph variant="b" mirror />
            </div>
          </>
        )}
        {variant === "features" && (
          <>
            <div className="absolute left-4 top-28">
              <SkillGraph variant="a" size="md" />
            </div>
            <div className="absolute right-4 top-28">
              <SkillGraph variant="c" size="md" mirror />
            </div>
            <div className="absolute left-8 bottom-28">
              <SkillGraph variant="c" />
            </div>
            <div className="absolute right-8 bottom-28">
              <SkillGraph variant="b" mirror />
            </div>
            <DotBlock
              rows={3}
              cols={5}
              seed={5501}
              cellSize={4}
              gap={2}
              className="absolute left-[60px] top-24"
            />
            <DotBlock
              rows={3}
              cols={5}
              seed={5502}
              cellSize={4}
              gap={2}
              className="absolute right-[60px] top-24"
            />
          </>
        )}
        {variant === "how-it-works" && (
          <>
            <div className="absolute left-4 top-28">
              <SkillGraph variant="b" size="md" />
            </div>
            <div className="absolute right-4 top-28">
              <SkillGraph variant="b" size="md" mirror />
            </div>
            <div className="absolute left-6 bottom-28">
              <SkillGraph variant="a" />
            </div>
            <div className="absolute right-6 bottom-28">
              <SkillGraph variant="c" mirror />
            </div>
            <DotBlock
              rows={3}
              cols={6}
              seed={5503}
              cellSize={4}
              gap={2}
              className="absolute left-[50px] bottom-24"
            />
            <DotBlock
              rows={3}
              cols={6}
              seed={5504}
              cellSize={4}
              gap={2}
              className="absolute right-[50px] bottom-24"
            />
          </>
        )}
        {variant === "pricing" && (
          <>
            <div className="absolute left-4 top-28">
              <SkillGraph variant="c" size="md" />
            </div>
            <div className="absolute right-4 top-28">
              <SkillGraph variant="a" size="md" mirror />
            </div>
            <div className="absolute left-6 bottom-28">
              <SkillGraph variant="b" />
            </div>
            <div className="absolute right-6 bottom-28">
              <SkillGraph variant="a" mirror />
            </div>
          </>
        )}
        {variant === "cli-demo" && (
          <>
            <div className="absolute left-4 top-28">
              <SkillGraph variant="a" size="md" />
            </div>
            <div className="absolute right-4 top-28">
              <SkillGraph variant="b" size="md" mirror />
            </div>
            <div className="absolute left-8 bottom-28">
              <SkillGraph variant="c" />
            </div>
            <div className="absolute right-8 bottom-28">
              <SkillGraph variant="c" mirror />
            </div>
          </>
        )}
      </LandingCenteredOverlay>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page-level structural overlay (Firecrawl-style)                   */
/*  Persistent vertical column borders visible across all sections    */
/* ------------------------------------------------------------------ */

export function PageOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[0]" aria-hidden="true">
      <div className="absolute top-[52px] bottom-0 left-4 w-px bg-border lg:hidden" />
      <div className="absolute top-[52px] bottom-0 right-4 w-px bg-border lg:hidden" />

      {/* Outer columns - max content width */}
      <CenteredFrame
        maxWidth={HERO_OUTER_FRAME_WIDTH_PX}
        className="top-[52px] bottom-0 hidden border-x border-border lg:block"
      />

      {/* Inner columns - content width */}
      <LandingCenteredOverlay className="top-[52px] bottom-0 hidden border-x border-border lg:block" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section divider with index number                                 */
/* ------------------------------------------------------------------ */
interface SectionDividerProps {
  index: number;
  total: number;
  label: string;
}

export function SectionDivider({ index, total, label }: SectionDividerProps) {
  const idx = String(index).padStart(2, "0");
  const tot = String(total).padStart(2, "0");
  return (
    <div className="border-y border-border">
      <div className="flex w-full justify-center py-6">
        <div className={cn("relative w-full px-4 lg:px-0", LANDING_CONTENT_MAX_WIDTH_CLASS)}>
          <span className="absolute lg:left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 bg-primary" />
          <div className="flex items-center gap-3 px-6 lg:px-12">
            <span className="font-mono text-xs tracking-wider text-muted-foreground">
              [ <span className="text-primary">{idx}</span> / {tot} ] &middot;{" "}
              <span className="uppercase">{label}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section header (centered label + headline + subtitle)             */
/* ------------------------------------------------------------------ */
interface SectionHeaderProps {
  decorator: string;
  headline: React.ReactNode;
  subtitle?: string;
}

export function SectionHeader({ decorator, headline, subtitle }: SectionHeaderProps) {
  return (
    <div className="relative flex flex-col items-center gap-4 px-14 py-20 text-center lg:py-24">
      {/* Desktop: horizontal rails — extend from heading to page edges */}
      <div className="absolute left-0 top-1/2 hidden h-px w-[80px] bg-border lg:block" />
      <div className="absolute left-[80px] top-1/2 hidden size-1.5 -translate-y-1/2 bg-primary lg:block" />
      <div className="absolute right-0 top-1/2 hidden h-px w-[80px] bg-border lg:block" />
      <div className="absolute right-[80px] top-1/2 hidden size-1.5 -translate-y-1/2 bg-primary lg:block" />

      {/* Mobile: shorter rails */}
      <div className="absolute left-0 top-1/2 h-px w-[40px] bg-border lg:hidden" />
      <div className="absolute left-[40px] top-1/2 size-1 -translate-y-1/2 bg-primary lg:hidden" />
      <div className="absolute right-0 top-1/2 h-px w-[40px] bg-border lg:hidden" />
      <div className="absolute right-[40px] top-1/2 size-1 -translate-y-1/2 bg-primary lg:hidden" />

      <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-muted-foreground/50">
        // {decorator} \\
      </p>
      <h2
        className={`text-3xl font-semibold tracking-tight text-foreground sm:text-[2.75rem] ${GeistPixelSquare.className}`}
      >
        {headline}
      </h2>
      {subtitle && (
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
