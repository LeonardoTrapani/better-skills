"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { ForceGraph, type GraphNode } from "@/components/skills/graph/force-graph";
import { GridBackground } from "@/components/ui/grid-background";
import { trpc } from "@/lib/api/trpc";
import { authClient } from "@/lib/auth/auth-client";

import { CornerInsetMarks } from "./corner-inset-marks";
import { MOCK_GRAPH_DATA } from "./landing-graph.data";

const GRAPH_HEIGHT = 420;

export function LandingGraphCard() {
  const router = useRouter();
  const [hasHydrated, setHasHydrated] = useState(false);
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const isSignedIn = hasHydrated && Boolean(session);
  const shouldLoadUserGraph = isSignedIn;
  const {
    data: userGraphData,
    isLoading: isUserGraphLoading,
    isError: isUserGraphError,
  } = useQuery({
    ...trpc.skills.graph.queryOptions(),
    enabled: shouldLoadUserGraph,
  });

  const graphData = shouldLoadUserGraph ? userGraphData : MOCK_GRAPH_DATA;
  const isLoading = !hasHydrated || isSessionPending || (shouldLoadUserGraph && isUserGraphLoading);
  const isError = shouldLoadUserGraph && isUserGraphError;
  const skillCount = graphData?.nodes.filter((node) => node.type === "skill").length ?? 0;

  const handleNodeClick = useCallback(
    (_node: GraphNode): boolean => {
      if (isSignedIn) {
        return false;
      }

      router.push("/login");
      return true;
    },
    [isSignedIn, router],
  );

  return (
    <article className="group relative overflow-hidden border border-border bg-background">
      <CornerInsetMarks />

      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground/65">
          // Skill Graph
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-primary/80">
          {skillCount} skills
        </span>
      </div>

      <div className="relative" style={{ height: GRAPH_HEIGHT }}>
        <GridBackground className="opacity-32" />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/[0.03]">
            <Loader2 className="size-5 animate-spin text-muted-foreground/50" />
          </div>
        )}

        {isError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/[0.03]">
            <p className="text-sm text-muted-foreground">Could not load your graph</p>
          </div>
        )}

        {!isLoading && !isError && graphData && (
          <ForceGraph
            data={graphData}
            height={GRAPH_HEIGHT}
            mobileInitialScale={0.85}
            onNodeClick={handleNodeClick}
            showSettingsButton={false}
          />
        )}
      </div>
    </article>
  );
}
