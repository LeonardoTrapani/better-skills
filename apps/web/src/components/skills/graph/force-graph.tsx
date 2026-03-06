"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import * as d3 from "d3";
import { ChevronDown, Settings2 } from "lucide-react";

import { canRenderResourceAsMarkdown } from "@/components/markdown/resource-file";
import { NodePreviewCard } from "@/components/skills/graph/node-preview-card";
import { buildResourceHref, buildSkillHref } from "@/lib/skills/routes";
import { getEffectiveVaultColor } from "@/lib/skills/vault-colors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  type: "skill" | "resource";
  label: string;
  description: string | null;
  slug: string | null;
  parentSkillId: string | null;
  kind: string | null;
  contentSnippet: string | null;
  updatedAt: string | null;
  vault?: {
    id: string;
    slug: string;
    name: string;
    type: "personal" | "enterprise" | "system_default";
    color: string | null;
    isReadOnly: boolean;
    isEnabled: boolean;
  } | null;
}

export interface GraphEdge extends d3.SimulationLinkDatum<GraphNode> {
  id: string;
  kind: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Optional callback fired when a graph node is clicked.
 * Return `true` to prevent the default `router.push` navigation.
 */
export type OnNodeClick = (node: GraphNode) => boolean | void;

interface ForceGraphProps {
  data: GraphData;
  height?: number;
  focusNodeId?: string;
  className?: string;
  centerXBias?: number;
  mobileInitialScale?: number;
  onNodeClick?: OnNodeClick;
  showSettingsButton?: boolean;
}

// ── Graph config ──────────────────────────────────────────────────────────────

interface GraphConfig {
  directionArrows: "none" | "hover" | "always";
  showSkillLabels: boolean;
  showNodePreview: boolean;
  /** Repulsion strength (negative = push apart). Range: -300 → -20 */
  repulsion: number;
  /** Link distance for mention edges. Range: 40 → 200 */
  linkDistance: number;
  /** Gravity pull toward center. Range: 0 → 0.3 */
  gravity: number;
}

const DEFAULT_CONFIG: GraphConfig = {
  directionArrows: "hover",
  showSkillLabels: true,
  showNodePreview: true,
  repulsion: -120,
  linkDistance: 80,
  gravity: 0.05,
};

const GRAPH_CONFIG_STORAGE_KEY = "better-skills.force-graph.config.v1";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getEdgeSourceId(edge: GraphEdge) {
  return typeof edge.source === "object" ? (edge.source as GraphNode).id : (edge.source as string);
}

function getEdgeTargetId(edge: GraphEdge) {
  return typeof edge.target === "object" ? (edge.target as GraphNode).id : (edge.target as string);
}

/** Build a map of nodeId → Set of connected nodeIds */
function buildAdjacency(edges: GraphEdge[]): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  for (const e of edges) {
    const sId = getEdgeSourceId(e);
    const tId = getEdgeTargetId(e);
    if (!adj.has(sId)) adj.set(sId, new Set());
    if (!adj.has(tId)) adj.set(tId, new Set());
    adj.get(sId)!.add(tId);
    adj.get(tId)!.add(sId);
  }
  return adj;
}

function dedupeDisplayEdges(edges: GraphEdge[]) {
  const byPair = new Map<string, GraphEdge>();

  for (const edge of edges) {
    const sourceId = getEdgeSourceId(edge);
    const targetId = getEdgeTargetId(edge);
    const key = `${sourceId}->${targetId}`;
    const current = byPair.get(key);
    if (!current) {
      byPair.set(key, edge);
      continue;
    }

    if (current.kind === "parent" && edge.kind !== "parent") {
      byPair.set(key, edge);
    }
  }

  return [...byPair.values()];
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function parseStoredGraphConfig(raw: string | null): GraphConfig | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<GraphConfig>;

    if (
      parsed.directionArrows !== "none" &&
      parsed.directionArrows !== "hover" &&
      parsed.directionArrows !== "always"
    ) {
      return null;
    }

    if (
      typeof parsed.showSkillLabels !== "boolean" ||
      typeof parsed.showNodePreview !== "boolean" ||
      typeof parsed.repulsion !== "number" ||
      typeof parsed.linkDistance !== "number" ||
      typeof parsed.gravity !== "number"
    ) {
      return null;
    }

    return {
      directionArrows: parsed.directionArrows,
      showSkillLabels: parsed.showSkillLabels,
      showNodePreview: parsed.showNodePreview,
      repulsion: clamp(parsed.repulsion, -300, -20),
      linkDistance: clamp(parsed.linkDistance, 40, 200),
      gravity: clamp(parsed.gravity, 0, 0.3),
    };
  } catch {
    return null;
  }
}

function getResourceNodeColors(isDarkMode: boolean) {
  if (isDarkMode) {
    return {
      defaultFill: "var(--muted-foreground)",
      activeFill: "oklch(87% 0 0)",
    };
  }

  return {
    defaultFill: "oklch(87% 0 0)",
    activeFill: "var(--muted-foreground)",
  };
}

function getDisabledSkillColor(isDarkMode: boolean) {
  return isDarkMode ? "oklch(72% 0 0)" : "oklch(55% 0 0)";
}

function getNodeVaultColor(node: GraphNode, isDarkMode: boolean) {
  if (node.vault && !node.vault.isEnabled) {
    return getDisabledSkillColor(isDarkMode);
  }

  return getEffectiveVaultColor(node.vault);
}

function getSkillNodeColor(node: GraphNode, isDarkMode: boolean) {
  return getNodeVaultColor(node, isDarkMode) ?? "var(--primary)";
}

function getResourceNodeFillColor({
  isFocused,
  isActive,
  colors,
}: {
  isFocused: boolean;
  isActive: boolean;
  colors: ReturnType<typeof getResourceNodeColors>;
}) {
  if (isFocused || isActive) return colors.activeFill;
  return colors.defaultFill;
}

// ── Settings panel ────────────────────────────────────────────────────────────

function DisplayToggleRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-left py-0.5">
      <span className="text-xs tracking-wide leading-none text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

const DIRECTION_ARROW_LABELS: Record<GraphConfig["directionArrows"], string> = {
  none: "None",
  hover: "Hover",
  always: "Always",
};

function EdgeArrowsControl({
  value,
  onChange,
}: {
  value: GraphConfig["directionArrows"];
  onChange: (value: GraphConfig["directionArrows"]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <span className="text-xs tracking-wide leading-none text-foreground">Edge arrows</span>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="inline-flex h-7 items-center gap-1.5 border border-border bg-muted/20 px-2.5 text-[10px] font-mono uppercase tracking-[0.12em] text-foreground transition-colors hover:bg-background"
            >
              {DIRECTION_ARROW_LABELS[value]}
              <ChevronDown className="size-3 text-muted-foreground" />
            </button>
          }
        />
        <DropdownMenuContent
          align="end"
          sideOffset={6}
          className="w-32 border-border/80 bg-[color-mix(in_oklab,var(--popover)_96%,var(--background))] p-1 shadow-md"
        >
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(next) => {
              onChange(next as GraphConfig["directionArrows"]);
              setIsOpen(false);
            }}
          >
            <DropdownMenuRadioItem
              value="none"
              className="font-mono text-[10px] uppercase tracking-[0.12em]"
            >
              None
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value="hover"
              className="font-mono text-[10px] uppercase tracking-[0.12em]"
            >
              Hover
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value="always"
              className="font-mono text-[10px] uppercase tracking-[0.12em]"
            >
              Always
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface SliderRowProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue?: string;
  onChange: (v: number) => void;
}

function SliderRow({
  label,
  description,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
}: SliderRowProps) {
  return (
    <div className="flex flex-col gap-3 py-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-xs font-medium leading-none text-foreground">{label}</span>
          {description ? (
            <span className="text-[10px] font-mono tracking-wide leading-tight text-muted-foreground">
              {description}
            </span>
          ) : null}
        </div>
        <span className="shrink-0 text-[10px] font-mono tabular-nums text-muted-foreground">
          {displayValue ?? value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none bg-border/60 accent-muted-foreground [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-muted-foreground [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-muted-foreground [&::-webkit-slider-thumb]:cursor-pointer"
      />
    </div>
  );
}

function ShadcnSliderRow({
  label,
  description,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
}: SliderRowProps) {
  return (
    <div className="flex flex-col gap-3 py-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-xs font-medium leading-none text-foreground">{label}</span>
          {description ? (
            <span className="text-[10px] font-mono tracking-wide leading-tight text-muted-foreground">
              {description}
            </span>
          ) : null}
        </div>
        <span className="shrink-0 text-[10px] font-mono tabular-nums text-muted-foreground">
          {displayValue ?? value}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => {
          const updated = Array.isArray(next) ? next[0] : next;
          if (typeof updated === "number") onChange(updated);
        }}
      />
    </div>
  );
}

interface GraphSettingsPanelProps {
  config: GraphConfig;
  onChange: <K extends keyof GraphConfig>(key: K, value: GraphConfig[K]) => void;
}

function GraphSettingsPanel({ config, onChange }: GraphSettingsPanelProps) {
  const useLegacyHtmlRange = false;
  const SliderRowComponent = useLegacyHtmlRange ? SliderRow : ShadcnSliderRow;

  return (
    <div className="flex w-[20rem] flex-col">
      <div className="flex items-center gap-2 px-3 py-3">
        <Settings2 className="size-3.5 text-muted-foreground" aria-hidden="true" />
        <span className="text-xs font-medium font-mono uppercase text-foreground">
          Graph settings
        </span>
      </div>

      <Separator />

      <section className="flex flex-col gap-2 px-3 py-3">
        <div className="flex items-center gap-2 pb-2">
          <span className="text-[10px] font-mono font-medium text-muted-foreground/60 uppercase tracking-wider">
            Display
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <EdgeArrowsControl
            value={config.directionArrows}
            onChange={(v) => onChange("directionArrows", v)}
          />
          <DisplayToggleRow
            label="Skill labels"
            checked={config.showSkillLabels}
            onCheckedChange={(v) => onChange("showSkillLabels", v)}
          />
          <DisplayToggleRow
            label="Node preview"
            checked={config.showNodePreview}
            onCheckedChange={(v) => onChange("showNodePreview", v)}
          />
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-2 px-3 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-medium text-muted-foreground/60 uppercase tracking-wider">
            Physics
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <SliderRowComponent
            label="Repulsion"
            description="Node spacing"
            value={config.repulsion}
            min={-300}
            max={-20}
            step={10}
            displayValue={String(Math.abs(config.repulsion))}
            onChange={(v) => onChange("repulsion", v)}
          />
          <SliderRowComponent
            label="Link distance"
            description="Edge length"
            value={config.linkDistance}
            min={40}
            max={200}
            step={10}
            onChange={(v) => onChange("linkDistance", v)}
          />
          <SliderRowComponent
            label="Gravity"
            description="Center pull"
            value={config.gravity}
            min={0}
            max={0.3}
            step={0.01}
            displayValue={config.gravity.toFixed(2)}
            onChange={(v) => onChange("gravity", v)}
          />
        </div>
      </section>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ForceGraph({
  data,
  height = 450,
  focusNodeId,
  className,
  centerXBias = 0,
  mobileInitialScale = 1,
  onNodeClick,
  showSettingsButton = false,
}: ForceGraphProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(null);
  const applyHighlightRef = useRef<((hoveredId: string | null) => void) | null>(null);
  const focusNodeIdRef = useRef<string | undefined>(focusNodeId);
  const hoveredNodeIdRef = useRef<string | null>(null);
  const zoomRafRef = useRef<number | null>(null);
  const isGraphInteractingRef = useRef(false);
  const tooltipRafRef = useRef<number | null>(null);
  const pendingTooltipPosRef = useRef({ x: 0, y: 0 });

  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [config, setConfig] = useState<GraphConfig>(DEFAULT_CONFIG);
  const [hasHydratedConfig, setHasHydratedConfig] = useState(false);

  // Refs so D3 tick/highlight callbacks read latest values without stale closure
  const configRef = useRef<GraphConfig>(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Refs to live D3 selections so we can imperatively update them when config changes
  const applyLabelVisibilityRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    try {
      const stored = parseStoredGraphConfig(window.localStorage.getItem(GRAPH_CONFIG_STORAGE_KEY));
      if (stored) {
        setConfig(stored);
        configRef.current = stored;
      }
    } finally {
      setHasHydratedConfig(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedConfig) return;
    try {
      window.localStorage.setItem(GRAPH_CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch {
      // no-op: storage may be unavailable in some browser modes
    }
  }, [config, hasHydratedConfig]);

  const isDarkMode = resolvedTheme === "dark";

  const resourceNodeColors = useMemo(() => getResourceNodeColors(isDarkMode), [isDarkMode]);

  const nodeById = useMemo(() => new Map(data.nodes.map((n) => [n.id, n])), [data.nodes]);

  const parentSkillName = useMemo(() => {
    if (!hoveredNode || hoveredNode.type !== "resource" || !hoveredNode.parentSkillId) return null;
    return nodeById.get(hoveredNode.parentSkillId)?.label ?? null;
  }, [hoveredNode, nodeById]);

  const resourceCountBySkillId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const edge of data.edges) {
      if (edge.kind !== "parent") continue;
      const sourceId = getEdgeSourceId(edge);
      counts.set(sourceId, (counts.get(sourceId) ?? 0) + 1);
    }
    return counts;
  }, [data.edges]);

  const scheduleTooltipPosUpdate = useCallback((clientX: number, clientY: number) => {
    pendingTooltipPosRef.current = {
      x: clientX + 12,
      y: clientY - 10,
    };

    if (tooltipRafRef.current !== null) return;

    tooltipRafRef.current = window.requestAnimationFrame(() => {
      tooltipRafRef.current = null;
      const next = pendingTooltipPosRef.current;
      setTooltipPos((prev) => {
        if (prev.x === next.x && prev.y === next.y) return prev;
        return next;
      });
    });
  }, []);

  const buildGraph = useCallback(
    (container: HTMLDivElement) => {
      if (data.nodes.length === 0) return;

      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
      if (zoomRafRef.current !== null) {
        window.cancelAnimationFrame(zoomRafRef.current);
        zoomRafRef.current = null;
      }
      d3.select(container).select("svg").remove();

      const width = container.clientWidth;
      const clampedCenterXBias = Math.max(-0.3, Math.min(0.3, centerXBias));
      const centerX = width * (0.5 + clampedCenterXBias);
      const centerY = height / 2;
      const nodes: GraphNode[] = data.nodes.map((n) => ({ ...n }));
      const edges: GraphEdge[] = dedupeDisplayEdges(data.edges.map((e) => ({ ...e })));
      const adjacency = buildAdjacency(edges);

      const svg = d3
        .select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("display", "block");

      /* ── Grid background pattern ── */
      const defs = svg.append("defs");
      const gridSize = 34;
      const pattern = defs
        .append("pattern")
        .attr("id", "graph-grid")
        .attr("width", gridSize)
        .attr("height", gridSize)
        .attr("patternUnits", "userSpaceOnUse");
      pattern
        .append("line")
        .attr("x1", gridSize)
        .attr("y1", 0)
        .attr("x2", gridSize)
        .attr("y2", gridSize)
        .attr("stroke", "var(--border)")
        .attr("stroke-opacity", 0.45)
        .attr("stroke-width", 1);

      pattern
        .append("line")
        .attr("x1", 0)
        .attr("y1", gridSize)
        .attr("x2", gridSize)
        .attr("y2", gridSize)
        .attr("stroke", "var(--border)")
        .attr("stroke-opacity", 0.45)
        .attr("stroke-width", 1);

      // grid background rect (behind everything, not affected by zoom)
      svg
        .append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "url(#graph-grid)")
        .attr("opacity", 0.3);

      const g = svg.append("g");

      const zoomBehavior = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 3]);

      /* ── Edges ── */
      // Use solid neutral colors instead of opacity to prevent stacking artifacts
      const edgeColorDefault = isDarkMode ? "rgb(64 64 64)" : "rgb(212 212 212)"; // neutral-700 : muted-foreground/60
      const edgeColorActive = isDarkMode ? "rgb(82 82 82)" : "rgb(163 163 163)"; // neutral-600 : neutral-400
      const edgeColorDimmed = isDarkMode ? "rgb(23 23 23)" : "rgb(245 245 245)"; // neutral-900 : neutral-100

      const arrowColorDefault = isDarkMode ? "rgb(64 64 64)" : "rgb(212 212 212)";
      const arrowColorActive = isDarkMode ? "rgb(82 82 82)" : "rgb(163 163 163)";

      const linkG = g.append("g");
      const link = linkG
        .selectAll<SVGLineElement, GraphEdge>("line")
        .data(edges)
        .join("line")
        .attr("stroke", edgeColorDefault)
        .attr("stroke-width", 1.5)
        .attr("stroke-linecap", "round");

      const directionArrowG = g.append("g").style("pointer-events", "none");

      const directionArrow = directionArrowG
        .selectAll<SVGPolygonElement, GraphEdge>("polygon")
        .data(edges)
        .join("polygon")
        .attr("points", "0,0 -5.5,2.8 -5.5,-2.8")
        .attr("fill", arrowColorDefault)
        .style("visibility", "hidden");

      /* ── Node groups ── */
      const nodeG = g.append("g");
      const node = nodeG
        .selectAll<SVGGElement, GraphNode>("g")
        .data(nodes)
        .join("g")
        .style("cursor", "pointer");

      /* ── Circles ── */
      const isFocus = (d: GraphNode) =>
        !!(focusNodeIdRef.current && d.id === focusNodeIdRef.current);
      const baseRadius = (d: GraphNode) => (d.type === "skill" ? 8 : 3.5);
      const focusRadius = (d: GraphNode) => (d.type === "skill" ? 9 : 4.5);
      const getResourceFill = (d: GraphNode, isActive: boolean) =>
        getResourceNodeFillColor({
          isFocused: isFocus(d),
          isActive,
          colors: resourceNodeColors,
        });

      const circles = node
        .append("circle")
        .attr("r", (d) => (isFocus(d) ? focusRadius(d) : baseRadius(d)))
        .attr("fill", (d) => {
          if (d.type === "skill") return getSkillNodeColor(d, isDarkMode);
          return getResourceFill(d, false);
        })
        .attr("fill-opacity", (d) => (d.type === "skill" ? 1 : 1))
        .attr("stroke", (d) => {
          return d.type === "skill" ? getSkillNodeColor(d, isDarkMode) : "none";
        })
        .attr("stroke-width", (d) => (d.type === "skill" ? 1.5 : 0))
        .attr("stroke-opacity", (d) => {
          if (d.type !== "skill") return 0;
          return isFocus(d) ? 0.35 : 0.25;
        });

      const skillNodeCount = nodes.reduce(
        (count, graphNode) => count + (graphNode.type === "skill" ? 1 : 0),
        0,
      );

      /* ── Skill labels ── */
      let skillLabelSel: d3.Selection<SVGTextElement, GraphNode, SVGGElement, unknown> | null =
        null;
      if (skillNodeCount <= 120) {
        skillLabelSel = node
          .filter((d) => d.type === "skill")
          .append("text")
          .text((d) => d.label)
          .attr("dx", 12)
          .attr("dy", 4)
          .attr("font-size", "11px")
          .attr("font-family", "var(--font-mono), monospace")
          .attr("fill", "var(--foreground)")
          .attr("pointer-events", "none");

        // apply initial visibility from configRef
        skillLabelSel.attr("opacity", configRef.current.showSkillLabels ? 0.6 : 0);
      }

      // Imperative update for label visibility (called when config changes)
      applyLabelVisibilityRef.current = () => {
        skillLabelSel?.attr("opacity", configRef.current.showSkillLabels ? 0.6 : 0);
      };

      /* ── Hover highlight logic ── */
      const applyHighlight = (hoveredId: string | null) => {
        const connected = hoveredId ? (adjacency.get(hoveredId) ?? new Set<string>()) : null;
        const isActive = (d: GraphNode) =>
          !hoveredId || d.id === hoveredId || (connected !== null && connected.has(d.id));

        node.style("opacity", (d) => (isActive(d) ? 1 : 0.12));

        circles
          .attr("fill", (d) => {
            if (d.type === "skill") return getSkillNodeColor(d, isDarkMode);
            return getResourceFill(d, !!hoveredId && !!isActive(d));
          })
          .attr("r", (d) => (isFocus(d) ? focusRadius(d) : baseRadius(d)));

        link.attr("stroke", (d) => {
          if (!hoveredId) return edgeColorDefault;
          const sourceId = getEdgeSourceId(d);
          const targetId = getEdgeTargetId(d);
          const isConnected = sourceId === hoveredId || targetId === hoveredId;
          if (isConnected) return edgeColorActive;
          return edgeColorDimmed;
        });

        const arrowMode = configRef.current.directionArrows;
        directionArrow
          .style("visibility", (d) => {
            if (arrowMode === "none") return "hidden";
            const sourceId = getEdgeSourceId(d);
            const targetId = getEdgeTargetId(d);
            const isConnected = sourceId === hoveredId || targetId === hoveredId;
            if (arrowMode === "hover") {
              if (!hoveredId || !isConnected) return "hidden";
              return "visible";
            }
            return "visible";
          })
          .attr("fill", (d) => {
            const sourceId = getEdgeSourceId(d);
            const targetId = getEdgeTargetId(d);
            const isConnected = sourceId === hoveredId || targetId === hoveredId;
            if (hoveredId && isConnected) return arrowColorActive;
            return arrowColorDefault;
          });
      };

      applyHighlightRef.current = applyHighlight;

      const highlightNode = (hovId: string) => {
        applyHighlight(hovId);
      };

      const resetHighlight = () => {
        applyHighlight(null);
      };

      let pendingZoomTransform: d3.ZoomTransform | null = null;
      zoomBehavior
        .on("start", () => {
          isGraphInteractingRef.current = true;
          hoveredNodeIdRef.current = null;
          setHoveredNode(null);
          resetHighlight();
        })
        .on("zoom", (event) => {
          pendingZoomTransform = event.transform;
          if (zoomRafRef.current !== null) return;
          zoomRafRef.current = window.requestAnimationFrame(() => {
            zoomRafRef.current = null;
            if (!pendingZoomTransform) return;
            g.attr("transform", pendingZoomTransform.toString());
          });
        })
        .on("end", () => {
          isGraphInteractingRef.current = false;
        });

      svg.call(zoomBehavior);

      // keep desktop zoom unchanged; allow mobile-only zoom-out
      const isMobileViewport = window.innerWidth < 1024;
      const initialScale = isMobileViewport ? mobileInitialScale : 1.1;
      const initialTransform = d3.zoomIdentity
        .translate(centerX * (1 - initialScale), centerY * (1 - initialScale))
        .scale(initialScale);
      svg.call(zoomBehavior.transform, initialTransform);

      /* ── Hover & click ── */
      node
        .on("mouseenter", (event, d) => {
          if (isGraphInteractingRef.current) return;
          hoveredNodeIdRef.current = d.id;
          if (configRef.current.showNodePreview) {
            setHoveredNode(d);
            scheduleTooltipPosUpdate(event.clientX, event.clientY);
          }
          highlightNode(d.id);
        })
        .on("mousemove", (event) => {
          if (isGraphInteractingRef.current) return;
          if (configRef.current.showNodePreview) {
            scheduleTooltipPosUpdate(event.clientX, event.clientY);
          }
        })
        .on("mouseleave", () => {
          if (isGraphInteractingRef.current) return;
          hoveredNodeIdRef.current = null;
          setHoveredNode(null);
          resetHighlight();
        })
        .on("click", (_event, d) => {
          if (onNodeClick?.(d) === true) return;
          if (d.type === "skill") {
            router.push(buildSkillHref(d.id));
          } else if (d.parentSkillId) {
            const href = buildResourceHref(d.parentSkillId, d.label);
            router.push(href);
          }
        });

      /* ── Drag ── */
      const drag = d3
        .drag<SVGGElement, GraphNode>()
        .on("start", (event, d) => {
          isGraphInteractingRef.current = true;
          setHoveredNode(null);
          resetHighlight();
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
          isGraphInteractingRef.current = false;
        });

      node.call(drag);

      /* ── Simulation ── */
      const simulation = d3
        .forceSimulation<GraphNode>(nodes)
        .force(
          "link",
          d3
            .forceLink<GraphNode, GraphEdge>(edges)
            .id((d) => d.id)
            .distance((d) => (d.kind === "parent" ? 40 : configRef.current.linkDistance)),
        )
        .force(
          "charge",
          d3
            .forceManyBody<GraphNode>()
            .strength((d) =>
              d.type === "skill" ? configRef.current.repulsion : configRef.current.repulsion / 4,
            ),
        )
        .force("center", d3.forceCenter(centerX, centerY))
        .force("x", d3.forceX<GraphNode>(centerX).strength(configRef.current.gravity))
        .force("y", d3.forceY<GraphNode>(centerY).strength(configRef.current.gravity))
        .force(
          "collide",
          d3.forceCollide<GraphNode>().radius((d) => (d.type === "skill" ? 30 : 12)),
        )
        .on("tick", () => {
          link
            .attr("x1", (d) => (d.source as GraphNode).x ?? 0)
            .attr("y1", (d) => (d.source as GraphNode).y ?? 0)
            .attr("x2", (d) => (d.target as GraphNode).x ?? 0)
            .attr("y2", (d) => (d.target as GraphNode).y ?? 0);

          directionArrow.attr("transform", (d) => {
            const source = d.source as GraphNode;
            const target = d.target as GraphNode;
            const sourceX = source.x ?? 0;
            const sourceY = source.y ?? 0;
            const targetX = target.x ?? 0;
            const targetY = target.y ?? 0;
            const midX = (sourceX + targetX) / 2;
            const midY = (sourceY + targetY) / 2;
            const dx = targetX - sourceX;
            const dy = targetY - sourceY;
            const length = Math.hypot(dx, dy);
            if (length < 1) return `translate(${midX},${midY})`;

            let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
            const hoveredId = hoveredNodeIdRef.current;
            if (hoveredId && configRef.current.directionArrows === "hover") {
              const sourceId = getEdgeSourceId(d);
              const targetId = getEdgeTargetId(d);
              if (targetId === hoveredId && sourceId !== hoveredId) {
                angle += 180;
              }
            }

            return `translate(${midX},${midY}) rotate(${angle})`;
          });

          node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
        });

      simulationRef.current = simulation;

      applyHighlight(hoveredNodeIdRef.current);
    },
    [
      data,
      height,
      router,
      centerXBias,
      mobileInitialScale,
      onNodeClick,
      resourceNodeColors,
      isDarkMode,
      scheduleTooltipPosUpdate,
    ],
  );

  useEffect(() => {
    focusNodeIdRef.current = focusNodeId;
    applyHighlightRef.current?.(hoveredNodeIdRef.current);
  }, [focusNodeId]);

  useEffect(() => {
    setIsMounted(true);

    return () => {
      isGraphInteractingRef.current = false;
      applyHighlightRef.current = null;
      hoveredNodeIdRef.current = null;
      if (zoomRafRef.current !== null) {
        window.cancelAnimationFrame(zoomRafRef.current);
        zoomRafRef.current = null;
      }
      if (tooltipRafRef.current !== null) {
        window.cancelAnimationFrame(tooltipRafRef.current);
        tooltipRafRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || data.nodes.length === 0) return;

    buildGraph(container);

    const ro = new ResizeObserver(() => buildGraph(container));
    ro.observe(container);

    return () => {
      ro.disconnect();
      applyHighlightRef.current = null;
      hoveredNodeIdRef.current = null;
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
    };
  }, [data, buildGraph]);

  /* ── Imperative config updates (no rebuild needed) ── */

  // showSkillLabels: toggle label opacity live
  useEffect(() => {
    applyLabelVisibilityRef.current?.();
  }, [config.showSkillLabels]);

  // directionArrows / showNodePreview: re-run highlight so arrows
  // appear/disappear immediately, tooltip state also cleared if turned off
  useEffect(() => {
    if (!config.showNodePreview) {
      setHoveredNode(null);
    }
    applyHighlightRef.current?.(hoveredNodeIdRef.current);
  }, [config.directionArrows, config.showNodePreview]);

  // Physics changes: restart simulation with new forces
  useEffect(() => {
    const sim = simulationRef.current;
    if (!sim) return;

    const linkForce = sim.force<d3.ForceLink<GraphNode, GraphEdge>>("link");
    if (linkForce) {
      linkForce.distance((d) => ((d as GraphEdge).kind === "parent" ? 40 : config.linkDistance));
    }

    const chargeForce = sim.force<d3.ForceManyBody<GraphNode>>("charge");
    if (chargeForce) {
      chargeForce.strength((d) => (d.type === "skill" ? config.repulsion : config.repulsion / 4));
    }

    const xForce = sim.force<d3.ForceX<GraphNode>>("x");
    const yForce = sim.force<d3.ForceY<GraphNode>>("y");
    if (xForce) xForce.strength(config.gravity);
    if (yForce) yForce.strength(config.gravity);

    sim.alpha(0.3).restart();
  }, [config.repulsion, config.linkDistance, config.gravity]);

  const handleConfigChange = useCallback(
    <K extends keyof GraphConfig>(key: K, value: GraphConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // Count resources connected to the hovered skill
  const hoveredResourceCount = useMemo(() => {
    if (!hoveredNode || hoveredNode.type !== "skill") return 0;
    return resourceCountBySkillId.get(hoveredNode.id) ?? 0;
  }, [hoveredNode, resourceCountBySkillId]);

  const tooltipLeft = isMounted
    ? Math.max(12, Math.min(tooltipPos.x, window.innerWidth - 352))
    : tooltipPos.x;
  const tooltipTop = isMounted
    ? Math.max(12, Math.min(tooltipPos.y, window.innerHeight - 280))
    : tooltipPos.y;

  const tooltip =
    hoveredNode && isMounted ? (
      <div
        className="pointer-events-none fixed z-[80]"
        style={{ left: tooltipLeft, top: tooltipTop }}
      >
        <NodePreviewCard
          data={{
            label: hoveredNode.label,
            type: hoveredNode.type,
            description: hoveredNode.description,
            contentSnippet: hoveredNode.contentSnippet,
            slug: hoveredNode.slug,
            kind: hoveredNode.kind,
            parentSkillName,
            updatedAt: hoveredNode.updatedAt,
            resourceCount: hoveredResourceCount,
            previewUnavailable:
              hoveredNode.type === "resource" &&
              !canRenderResourceAsMarkdown(hoveredNode.label, hoveredNode.kind ?? "reference"),
          }}
        />
      </div>
    ) : null;

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className={cn("relative w-full overflow-hidden", className)}
    >
      {tooltip ? createPortal(tooltip, document.body) : null}

      {/* ── Floating settings button ── */}
      {showSettingsButton && data.nodes.length > 0 && (
        <div className="absolute top-3 right-5 lg:right-6 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 border-border bg-background/95 px-3.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground hover:text-foreground"
                >
                  <Settings2 className="size-3.5" />
                  <span>Settings</span>
                </Button>
              }
            />
            <DropdownMenuContent
              side="bottom"
              align="end"
              sideOffset={8}
              className="w-[20rem] border-border/80 bg-[color-mix(in_oklab,var(--popover)_96%,var(--background))] p-0 shadow-md"
            >
              <GraphSettingsPanel config={config} onChange={handleConfigChange} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {data.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted-foreground text-center px-6">
            No connections to visualize
          </p>
        </div>
      )}
    </div>
  );
}
