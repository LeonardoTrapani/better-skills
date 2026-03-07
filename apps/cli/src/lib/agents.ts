import { homedir } from "node:os";
import { existsSync } from "node:fs";
import { join } from "node:path";

import pc from "picocolors";

import { readConfig, saveConfig } from "./config";
import { isPlain } from "./output-mode";
import * as ui from "./ui";

const home = homedir();
const configHome = process.env.XDG_CONFIG_HOME?.trim() || join(home, ".config");
const codexHome = process.env.CODEX_HOME?.trim() || join(home, ".codex");
const claudeHome = process.env.CLAUDE_CONFIG_DIR?.trim() || join(home, ".claude");

type AgentConfig = {
  displayName: string;
  globalSkillsDir: string | string[];
};

function firstExistingPath(paths: string[]): string {
  for (const path of paths) {
    if (existsSync(path)) {
      return path;
    }
  }

  return paths[0]!;
}

function resolveGlobalSkillsDir(config: AgentConfig): string {
  return Array.isArray(config.globalSkillsDir)
    ? firstExistingPath(config.globalSkillsDir)
    : config.globalSkillsDir;
}

function formatHomePath(path: string): string {
  if (path === home) {
    return "~";
  }

  if (path.startsWith(`${home}/`)) {
    return `~/${path.slice(home.length + 1)}`;
  }

  return path;
}

const AGENTS = {
  opencode: {
    displayName: "OpenCode",
    globalSkillsDir: join(configHome, "opencode/skills"),
  },
  "claude-code": {
    displayName: "Claude Code",
    globalSkillsDir: join(claudeHome, "skills"),
  },
  codex: {
    displayName: "Codex",
    globalSkillsDir: join(codexHome, "skills"),
  },
  cursor: {
    displayName: "Cursor",
    globalSkillsDir: join(home, ".cursor/skills"),
  },
  "github-copilot": {
    displayName: "GitHub Copilot",
    globalSkillsDir: join(home, ".copilot/skills"),
  },
  "gemini-cli": {
    displayName: "Gemini CLI",
    globalSkillsDir: join(home, ".gemini/skills"),
  },
  amp: {
    displayName: "Amp",
    globalSkillsDir: join(configHome, "agents/skills"),
  },
  antigravity: {
    displayName: "Antigravity",
    globalSkillsDir: join(home, ".gemini/antigravity/skills"),
  },
  augment: {
    displayName: "Augment",
    globalSkillsDir: join(home, ".augment/skills"),
  },
  openclaw: {
    displayName: "OpenClaw",
    globalSkillsDir: [
      join(home, ".openclaw/skills"),
      join(home, ".clawdbot/skills"),
      join(home, ".moltbot/skills"),
    ],
  },
  cline: {
    displayName: "Cline",
    globalSkillsDir: join(home, ".agents/skills"),
  },
  codebuddy: {
    displayName: "CodeBuddy",
    globalSkillsDir: join(home, ".codebuddy/skills"),
  },
  "command-code": {
    displayName: "Command Code",
    globalSkillsDir: join(home, ".commandcode/skills"),
  },
  continue: {
    displayName: "Continue",
    globalSkillsDir: join(home, ".continue/skills"),
  },
  cortex: {
    displayName: "Cortex Code",
    globalSkillsDir: join(home, ".snowflake/cortex/skills"),
  },
  crush: {
    displayName: "Crush",
    globalSkillsDir: join(configHome, "crush/skills"),
  },
  droid: {
    displayName: "Droid",
    globalSkillsDir: join(home, ".factory/skills"),
  },
  goose: {
    displayName: "Goose",
    globalSkillsDir: join(configHome, "goose/skills"),
  },
  junie: {
    displayName: "Junie",
    globalSkillsDir: join(home, ".junie/skills"),
  },
  "iflow-cli": {
    displayName: "iFlow CLI",
    globalSkillsDir: join(home, ".iflow/skills"),
  },
  kilo: {
    displayName: "Kilo Code",
    globalSkillsDir: join(home, ".kilocode/skills"),
  },
  "kimi-cli": {
    displayName: "Kimi Code CLI",
    globalSkillsDir: join(configHome, "agents/skills"),
  },
  "kiro-cli": {
    displayName: "Kiro CLI",
    globalSkillsDir: join(home, ".kiro/skills"),
  },
  kode: {
    displayName: "Kode",
    globalSkillsDir: join(home, ".kode/skills"),
  },
  mcpjam: {
    displayName: "MCPJam",
    globalSkillsDir: join(home, ".mcpjam/skills"),
  },
  "mistral-vibe": {
    displayName: "Mistral Vibe",
    globalSkillsDir: join(home, ".vibe/skills"),
  },
  mux: {
    displayName: "Mux",
    globalSkillsDir: join(home, ".mux/skills"),
  },
  openhands: {
    displayName: "OpenHands",
    globalSkillsDir: join(home, ".openhands/skills"),
  },
  pi: {
    displayName: "Pi",
    globalSkillsDir: join(home, ".pi/agent/skills"),
  },
  qoder: {
    displayName: "Qoder",
    globalSkillsDir: join(home, ".qoder/skills"),
  },
  "qwen-code": {
    displayName: "Qwen Code",
    globalSkillsDir: join(home, ".qwen/skills"),
  },
  replit: {
    displayName: "Replit",
    globalSkillsDir: join(configHome, "agents/skills"),
  },
  roo: {
    displayName: "Roo Code",
    globalSkillsDir: join(home, ".roo/skills"),
  },
  trae: {
    displayName: "Trae",
    globalSkillsDir: join(home, ".trae/skills"),
  },
  "trae-cn": {
    displayName: "Trae CN",
    globalSkillsDir: join(home, ".trae-cn/skills"),
  },
  windsurf: {
    displayName: "Windsurf",
    globalSkillsDir: join(home, ".codeium/windsurf/skills"),
  },
  zencoder: {
    displayName: "Zencoder",
    globalSkillsDir: join(home, ".zencoder/skills"),
  },
  neovate: {
    displayName: "Neovate",
    globalSkillsDir: join(home, ".neovate/skills"),
  },
  pochi: {
    displayName: "Pochi",
    globalSkillsDir: join(home, ".pochi/skills"),
  },
  adal: {
    displayName: "AdaL",
    globalSkillsDir: join(home, ".adal/skills"),
  },
} as const satisfies Record<string, AgentConfig>;

export type SupportedAgent = keyof typeof AGENTS;

export const supportedAgents = Object.keys(AGENTS) as SupportedAgent[];

export const defaultSupportedAgents = [
  "claude-code",
  "opencode",
  "codex",
] as const satisfies readonly SupportedAgent[];

export type AgentSkillDirGroup = {
  skillsDir: string;
  agents: SupportedAgent[];
};

export function getDefaultAgentSelection(): SupportedAgent[] {
  return [...defaultSupportedAgents];
}

export function getAgentDisplayName(agent: SupportedAgent): string {
  return AGENTS[agent].displayName;
}

export function getAgentSkillDir(agent: SupportedAgent): string {
  return resolveGlobalSkillsDir(AGENTS[agent]);
}

export function getAgentSkillDirHint(agent: SupportedAgent): string {
  return formatHomePath(getAgentSkillDir(agent));
}

export function formatAgentDisplayNames(agents: SupportedAgent[], separator = ", "): string {
  return agents.map((agent) => getAgentDisplayName(agent)).join(separator);
}

export function groupAgentsBySkillDir(agents: SupportedAgent[]): AgentSkillDirGroup[] {
  const groups = new Map<string, SupportedAgent[]>();

  for (const agent of agents) {
    const skillsDir = getAgentSkillDir(agent);
    const existing = groups.get(skillsDir);

    if (existing) {
      existing.push(agent);
      continue;
    }

    groups.set(skillsDir, [agent]);
  }

  return [...groups.entries()].map(([skillsDir, groupedAgents]) => ({
    skillsDir,
    agents: groupedAgents,
  }));
}

export async function promptAgentSelection(
  initial?: SupportedAgent[],
): Promise<SupportedAgent[] | null> {
  const initialSelection = initial ?? getDefaultAgentSelection();

  if (isPlain) {
    return initialSelection;
  }

  const options: Array<{
    value: SupportedAgent;
    label: string;
    hint: string;
  }> = supportedAgents.map((key) => ({
    value: key,
    label: AGENTS[key].displayName,
    hint: getAgentSkillDirHint(key),
  }));

  const result = await ui.autocompleteMultiselect({
    message: "pick the agents you want better-skills to sync into",
    placeholder: "search by agent name, id, or folder",
    maxItems: 12,
    options: options as never,
    filter: (value, option) => {
      const search = value.trim().toLowerCase();

      if (search.length === 0) {
        return true;
      }

      return [option.label, option.value, option.hint]
        .filter((part): part is string => Boolean(part))
        .some((part) => part.toLowerCase().includes(search));
    },
    initialValues: initialSelection,
    required: true,
  });

  if (ui.isCancel(result)) {
    return null;
  }

  return result as SupportedAgent[];
}

export async function resolveInstallAgents(): Promise<SupportedAgent[]> {
  const saved = readConfig();
  const defaultSelection = getDefaultAgentSelection();

  if (saved) {
    return saved;
  }

  if (isPlain) {
    await saveConfig(defaultSelection);
    return defaultSelection;
  }

  ui.log.info(pc.dim("no agent configuration found - let's set one up"));

  const selected = await promptAgentSelection(defaultSelection);

  if (!selected || selected.length === 0) {
    return [];
  }

  await saveConfig(selected);
  ui.log.success(pc.dim("saved agent configuration"));

  return selected;
}
