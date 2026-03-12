export type StepPatternVariant = "cli" | "graph" | "agent";

export type HowItWorksStep = {
  num: string;
  label: string;
  title: string;
  titleAccent: string;
  description: string;
  pattern: StepPatternVariant;
};

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
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
