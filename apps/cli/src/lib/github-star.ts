import { spawn } from "node:child_process";

import pc from "picocolors";

import { hasSeenGithubStarPrompt, markGithubStarPromptSeen } from "./config";
import * as ui from "./ui";

export const PROJECT_GITHUB_REPO = "LeonardoTrapani/better-skills";

export type GithubCliStatus = "missing" | "unauthenticated" | "authenticated";
export type GithubStarPromptResult = "skipped" | "cancelled" | "declined" | "starred" | "failed";

type CommandResult = {
  exitCode: number | null;
  errorCode?: string;
};

type CommandRunner = (command: string, args: string[]) => Promise<CommandResult>;

type PromptDeps = {
  isInteractive: boolean;
  hasPrompted: () => boolean;
  markPrompted: () => Promise<void>;
  getStatus: () => Promise<GithubCliStatus>;
  confirm: () => Promise<boolean | symbol>;
  isCancel: (value: unknown) => boolean;
  starRepo: (repo: string) => Promise<boolean>;
  repo: string;
};

async function runCommandSilently(command: string, args: string[]): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const child = spawn(command, args, { stdio: "ignore" });

    const finish = (result: CommandResult) => {
      if (settled) {
        return;
      }

      settled = true;
      resolve(result);
    };

    child.once("error", (error) => {
      const errorCode = (error as NodeJS.ErrnoException).code;
      if (errorCode === "ENOENT") {
        finish({ exitCode: null, errorCode });
        return;
      }

      reject(error);
    });

    child.once("close", (code) => {
      finish({ exitCode: code });
    });
  });
}

export async function getGithubCliStatus(
  runCommand: CommandRunner = runCommandSilently,
): Promise<GithubCliStatus> {
  const versionCheck = await runCommand("gh", ["--version"]);
  if (versionCheck.errorCode === "ENOENT" || versionCheck.exitCode !== 0) {
    return "missing";
  }

  const authCheck = await runCommand("gh", ["auth", "status", "--hostname", "github.com"]);
  if (authCheck.exitCode === 0) {
    return "authenticated";
  }

  return "unauthenticated";
}

export async function starGithubRepo(
  repo: string,
  runCommand: CommandRunner = runCommandSilently,
): Promise<boolean> {
  const result = await runCommand("gh", ["repo", "star", repo, "--yes"]);
  return result.exitCode === 0;
}

export async function maybePromptGithubStar(
  deps: Partial<PromptDeps> = {},
): Promise<GithubStarPromptResult> {
  const resolved: PromptDeps = {
    isInteractive: true,
    hasPrompted: hasSeenGithubStarPrompt,
    markPrompted: () => markGithubStarPromptSeen(),
    getStatus: getGithubCliStatus,
    confirm: () =>
      ui.confirm({
        message: `want to star ${pc.bold("better-skills")} on github?`,
        initialValue: true,
      }),
    isCancel: ui.isCancel,
    starRepo: (repo) => starGithubRepo(repo),
    repo: PROJECT_GITHUB_REPO,
    ...deps,
  };

  if (!resolved.isInteractive || resolved.hasPrompted()) {
    return "skipped";
  }

  const status = await resolved.getStatus();
  if (status !== "authenticated") {
    return "skipped";
  }

  const answer = await resolved.confirm();
  if (resolved.isCancel(answer)) {
    return "cancelled";
  }

  await resolved.markPrompted();

  if (!answer) {
    return "declined";
  }

  const starred = await resolved.starRepo(resolved.repo);
  return starred ? "starred" : "failed";
}
