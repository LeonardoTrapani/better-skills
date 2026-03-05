"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import * as d3 from "d3";

import { canRenderResourceAsMarkdown } from "@/components/markdown/resource-file";
import { NodePreviewCard } from "@/components/skills/graph/node-preview-card";
import { buildResourceHref, buildSkillHref } from "@/lib/skills/routes";
import { getEffectiveVaultColor } from "@/lib/skills/vault-colors";
import { cn } from "@/lib/utils";

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
}

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

export function ForceGraph({
  data,
  height = 450,
  focusNodeId,
  className,
  centerXBias = 0,
  mobileInitialScale = 1,
  onNodeClick,
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
      const edges: GraphEdge[] = data.edges.map((e) => ({ ...e }));
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
      const linkG = g.append("g");
      const link = linkG
        .selectAll<SVGLineElement, GraphEdge>("line")
        .data(edges)
        .join("line")
        .attr("stroke", "var(--muted-foreground)")
        .attr("stroke-opacity", (d) => (d.kind === "parent" ? 0.12 : 0.3))
        .attr("stroke-width", (d) => (d.kind === "parent" ? 0.75 : 1.5))
        .attr("stroke-linecap", "round");

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
      if (skillNodeCount <= 120) {
        /* ── Labels for skills ── */
        node
          .filter((d) => d.type === "skill")
          .append("text")
          .text((d) => d.label)
          .attr("dx", 12)
          .attr("dy", 4)
          .attr("font-size", "11px")
          .attr("font-family", "var(--font-mono), monospace")
          .attr("fill", "var(--foreground)")
          .attr("opacity", 0.6)
          .attr("pointer-events", "none");
      }

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

        link.attr("stroke-opacity", (d) => {
          if (!hoveredId) return d.kind === "parent" ? 0.12 : 0.3;
          const sourceId = getEdgeSourceId(d);
          const targetId = getEdgeTargetId(d);
          const isConnected = sourceId === hoveredId || targetId === hoveredId;
          if (isConnected) return d.kind === "parent" ? 0.4 : 0.7;
          return 0.04;
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
          setHoveredNode(d);
          scheduleTooltipPosUpdate(event.clientX, event.clientY);
          highlightNode(d.id);
        })
        .on("mousemove", (event) => {
          if (isGraphInteractingRef.current) return;
          scheduleTooltipPosUpdate(event.clientX, event.clientY);
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
            .distance((d) => (d.kind === "parent" ? 40 : 80)),
        )
        .force(
          "charge",
          d3.forceManyBody<GraphNode>().strength((d) => (d.type === "skill" ? -120 : -30)),
        )
        .force("center", d3.forceCenter(centerX, centerY))
        .force("x", d3.forceX<GraphNode>(centerX).strength(0.05))
        .force("y", d3.forceY<GraphNode>(centerY).strength(0.05))
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
