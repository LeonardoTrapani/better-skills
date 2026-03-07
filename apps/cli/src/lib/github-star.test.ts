import { describe, expect, test } from "bun:test";

import { getGithubCliStatus, maybePromptGithubStar, PROJECT_GITHUB_REPO } from "./github-star";

describe("getGithubCliStatus", () => {
  test("returns missing when github cli is not installed", async () => {
    const status = await getGithubCliStatus(async () => ({ exitCode: null, errorCode: "ENOENT" }));

    expect(status).toBe("missing");
  });

  test("returns unauthenticated when auth status fails", async () => {
    const calls: string[][] = [];
    const status = await getGithubCliStatus(async (_command, args) => {
      calls.push(args);

      if (args[0] === "--version") {
        return { exitCode: 0 };
      }

      return { exitCode: 1 };
    });

    expect(status).toBe("unauthenticated");
    expect(calls).toEqual([["--version"], ["auth", "status", "--hostname", "github.com"]]);
  });

  test("returns authenticated when github cli is available and authed", async () => {
    const status = await getGithubCliStatus(async () => ({ exitCode: 0 }));

    expect(status).toBe("authenticated");
  });
});

describe("maybePromptGithubStar", () => {
  test("skips when prompt already shown", async () => {
    let confirmed = false;

    const result = await maybePromptGithubStar({
      hasPrompted: () => true,
      getStatus: async () => "authenticated",
      confirm: async () => {
        confirmed = true;
        return true;
      },
    });

    expect(result).toBe("skipped");
    expect(confirmed).toBe(false);
  });

  test("skips when github cli is unavailable or unauthenticated", async () => {
    const unavailable = await maybePromptGithubStar({
      hasPrompted: () => false,
      getStatus: async () => "missing",
    });
    const unauthenticated = await maybePromptGithubStar({
      hasPrompted: () => false,
      getStatus: async () => "unauthenticated",
    });

    expect(unavailable).toBe("skipped");
    expect(unauthenticated).toBe("skipped");
  });

  test("marks prompt shown and stars repo when user accepts", async () => {
    const calls: string[] = [];

    const result = await maybePromptGithubStar({
      hasPrompted: () => false,
      getStatus: async () => "authenticated",
      confirm: async () => true,
      markPrompted: async () => {
        calls.push("mark");
      },
      starRepo: async (repo) => {
        calls.push(`star:${repo}`);
        return true;
      },
    });

    expect(result).toBe("starred");
    expect(calls).toEqual(["mark", `star:${PROJECT_GITHUB_REPO}`]);
  });

  test("marks prompt shown and stops when user declines", async () => {
    const calls: string[] = [];

    const result = await maybePromptGithubStar({
      hasPrompted: () => false,
      getStatus: async () => "authenticated",
      confirm: async () => false,
      markPrompted: async () => {
        calls.push("mark");
      },
      starRepo: async () => {
        calls.push("star");
        return true;
      },
    });

    expect(result).toBe("declined");
    expect(calls).toEqual(["mark"]);
  });

  test("does not mark prompt when user cancels", async () => {
    const cancel = Symbol("cancel");
    const calls: string[] = [];

    const result = await maybePromptGithubStar({
      hasPrompted: () => false,
      getStatus: async () => "authenticated",
      confirm: async () => cancel,
      isCancel: (value) => value === cancel,
      markPrompted: async () => {
        calls.push("mark");
      },
      starRepo: async () => {
        calls.push("star");
        return true;
      },
    });

    expect(result).toBe("cancelled");
    expect(calls).toEqual([]);
  });
});
