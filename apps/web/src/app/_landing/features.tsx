import { Brain, TerminalSquare, Globe, Bot, Network, RefreshCcw } from "lucide-react";
import { GeistPixelSquare } from "geist/font/pixel";

import { SectionHeader } from "./grid-background";
import { LandingSection } from "./landing-section";

const features = [
  {
    icon: Brain,
    label: "Second Brain",
    title: "A persistent",
    titleBold: " knowledge graph.",
    description:
      "Every skill, resource, and connection lives in a structured graph your agents can query at runtime. Knowledge that persists across sessions.",
  },
  {
    icon: TerminalSquare,
    label: "CLI",
    title: "Terminal-first ",
    titleBold: "workflow.",
    description:
      "Create, edit, sync, and publish skills directly from your terminal. The CLI is the primary interface for power users and CI pipelines.",
  },
  {
    icon: Globe,
    label: "Web Console",
    title: "Visual skill ",
    titleBold: "management.",
    description:
      "Explore the skill graph, edit resources with a rich markdown editor, manage account settings, and browse the marketplace from any browser.",
  },
  {
    icon: Bot,
    label: "Agent Ready",
    title: "Use it with your ",
    titleBold: "favourite agent.",
    description:
      "Run the same skills across your preferred agents and tools. Keep your workflow consistent while switching between CLI, editor, and web.",
  },
  {
    icon: Network,
    label: "Graph Links",
    title: "Connected skill ",
    titleBold: "topology.",
    description:
      "Skills aren't isolated files. They link to each other through typed edges, mentions, and parent-child relationships that agents can traverse.",
  },
  {
    icon: RefreshCcw,
    label: "Sync",
    title: "Local-remote ",
    titleBold: "synchronization.",
    description:
      "Sync your second brain locally so every agent you use shares the same up-to-date knowledge. Changes propagate bidirectionally between CLI and cloud.",
  },
];

export default function Features() {
  return (
    <LandingSection id="features" variant="features" bottomSpacer>
      <SectionHeader
        decorator="Features"
        headline={
          <>
            Everything your agent
            <span className="text-primary"> needs</span>
          </>
        }
        subtitle="Fully interactive through an API, MCP, or CLI. Open source and extensible."
      />

      <div className="flex flex-wrap gap-px border border-border bg-border">
        {features.map((feat) => (
          <div
            key={feat.label}
            className="flex min-w-[280px] flex-1 basis-full flex-col gap-4 bg-background p-10 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900 sm:basis-[calc(50%-1px)] lg:basis-[calc(33.333%-1px)] group"
          >
            <div className="flex items-center gap-3 transition-all">
              <feat.icon className="size-4 text-primary" />
              <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground group-hover:text-foreground transition-all">
                {feat.label}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-lg text-foreground">
                <span className={`font-semibold ${GeistPixelSquare.className}`}>{feat.title}</span>
                {feat.titleBold && (
                  <span className={`text-primary ${GeistPixelSquare.className}`}>
                    {feat.titleBold}
                  </span>
                )}
              </h3>

              <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                {feat.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </LandingSection>
  );
}
