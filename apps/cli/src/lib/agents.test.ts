import { describe, expect, test } from "bun:test";

import {
  defaultSupportedAgents,
  getDefaultAgentSelection,
  getAgentSkillDir,
  getAgentSkillDirHint,
  groupAgentsBySkillDir,
  supportedAgents,
} from "./agents";

describe("agents", () => {
  test("keeps the default first-run selection focused", () => {
    expect(getDefaultAgentSelection()).toEqual([...defaultSupportedAgents]);
  });

  test("includes the expanded skills.sh agent set", () => {
    expect(supportedAgents).toEqual(
      expect.arrayContaining([
        "augment",
        "cline",
        "continue",
        "goose",
        "kiro-cli",
        "openclaw",
        "openhands",
        "qwen-code",
        "roo",
        "windsurf",
        "zencoder",
      ]),
    );
  });

  test("groups agents that share the same skills directory", () => {
    const groups = groupAgentsBySkillDir(["amp", "kimi-cli", "replit", "opencode"]);
    const sharedAgents = groups.find((group) => group.agents.includes("amp"));

    expect(sharedAgents).toBeDefined();
    expect(sharedAgents?.agents).toEqual(["amp", "kimi-cli", "replit"]);
    expect(sharedAgents?.skillsDir).toBe(getAgentSkillDir("amp"));
    expect(
      groups.some((group) => group.agents.length === 1 && group.agents[0] === "opencode"),
    ).toBe(true);
  });

  test("formats skill dir hints with home shorthand", () => {
    expect(getAgentSkillDirHint("opencode")).toBe("~/.config/opencode/skills");
  });
});
