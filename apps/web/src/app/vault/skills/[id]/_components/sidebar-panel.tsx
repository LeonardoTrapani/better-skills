"use client";

import { useState } from "react";
import { Network, Paperclip } from "lucide-react";

import { cn } from "@/lib/utils";

type SidebarTab = "graph" | "resources";

export function SidebarPanel({
  graphContent,
  resourcesContent,
}: {
  graphContent: React.ReactNode;
  resourcesContent: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("graph");
  const graphTabId = "sidebar-tab-graph";
  const resourcesTabId = "sidebar-tab-resources";
  const graphPanelId = "sidebar-panel-graph";
  const resourcesPanelId = "sidebar-panel-resources";

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Tab buttons */}
      <div className="flex border-b border-border" role="tablist">
        <button
          type="button"
          id={graphTabId}
          role="tab"
          aria-controls={graphPanelId}
          aria-selected={activeTab === "graph"}
          tabIndex={activeTab === "graph" ? 0 : -1}
          onClick={() => setActiveTab("graph")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider transition-colors",
            activeTab === "graph"
              ? "text-foreground border-b-2 border-primary -mb-[1px]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Network className="size-3" aria-hidden="true" />
          Graph
        </button>
        <button
          type="button"
          id={resourcesTabId}
          role="tab"
          aria-controls={resourcesPanelId}
          aria-selected={activeTab === "resources"}
          tabIndex={activeTab === "resources" ? 0 : -1}
          onClick={() => setActiveTab("resources")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider transition-colors",
            activeTab === "resources"
              ? "text-foreground border-b-2 border-primary -mb-[1px]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Paperclip className="size-3" aria-hidden="true" />
          Resources
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div
          id={graphPanelId}
          role="tabpanel"
          aria-labelledby={graphTabId}
          hidden={activeTab !== "graph"}
          className={cn("h-full", activeTab === "graph" ? "block" : "hidden")}
        >
          {graphContent}
        </div>
        <div
          id={resourcesPanelId}
          role="tabpanel"
          aria-labelledby={resourcesTabId}
          hidden={activeTab !== "resources"}
          className={cn("h-full overflow-y-auto", activeTab === "resources" ? "block" : "hidden")}
        >
          {resourcesContent}
        </div>
      </div>
    </div>
  );
}
