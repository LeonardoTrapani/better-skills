import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import type { SupportedAgent } from "./agents";
import { supportedAgents } from "./agents";

const CONFIG_VERSION = 1;

type StoredConfig = {
  version: number;
  agents: string[];
};

function getConfigDir() {
  const xdgConfigHome = process.env.XDG_CONFIG_HOME;
  if (xdgConfigHome) {
    return join(xdgConfigHome, "better-skills");
  }

  return join(homedir(), ".config", "better-skills");
}

export function getConfigFilePath() {
  return join(getConfigDir(), "config.json");
}

function parseStoredConfig(raw: string): StoredConfig | null {
  try {
    const parsed = JSON.parse(raw);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.version !== "number" ||
      !Array.isArray(parsed.agents) ||
      !parsed.agents.every((a: unknown) => typeof a === "string")
    ) {
      return null;
    }

    return {
      version: parsed.version,
      agents: parsed.agents,
    };
  } catch {
    return null;
  }
}

function readStoredConfig(): StoredConfig | null {
  const configPath = getConfigFilePath();
  if (!existsSync(configPath)) {
    return null;
  }

  const parsed = parseStoredConfig(readFileSync(configPath, "utf8"));
  if (!parsed || parsed.version !== CONFIG_VERSION) {
    return null;
  }

  return parsed;
}

function getValidAgents(agents: string[]): SupportedAgent[] {
  return agents.filter((a): a is SupportedAgent => supportedAgents.includes(a as SupportedAgent));
}

async function writeConfigFile(config: StoredConfig) {
  const configDir = getConfigDir();
  await mkdir(configDir, { recursive: true });
  await writeFile(getConfigFilePath(), JSON.stringify(config, null, 2), "utf8");
}

export function readConfig(): SupportedAgent[] | null {
  const parsed = readStoredConfig();
  if (!parsed) {
    return null;
  }

  const valid = getValidAgents(parsed.agents);

  return valid.length > 0 ? valid : null;
}

export async function saveConfig(agents: SupportedAgent[]) {
  const config: StoredConfig = {
    version: CONFIG_VERSION,
    agents,
  };

  await writeConfigFile(config);
}
