import pc from "picocolors";

import { readErrorMessage } from "../lib/errors";
import { rewriteLinksInSkillFolder } from "../lib/rewrite-resource-links";
import * as ui from "../lib/ui";

type RewriteLinksArgs = {
  folder: string | null;
  dryRun: boolean;
};

function printUsage() {
  ui.log.info("usage: better-skills rewrite-links <dir> [--dry-run]");
}

function parseArgs(argv: string[]): RewriteLinksArgs {
  const args = argv.slice(3);
  let folder: string | null = null;
  let dryRun = false;

  for (const arg of args) {
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--help" || arg === "-h" || arg === "help") {
      continue;
    }

    if (arg.startsWith("--")) {
      throw new Error(`unknown option: ${arg}`);
    }

    if (folder) {
      throw new Error(`unexpected argument: ${arg}`);
    }

    folder = arg;
  }

  return {
    folder,
    dryRun,
  };
}

export async function rewriteLinksCommand() {
  const argv = process.argv.slice(3);

  if (argv[0] === "--help" || argv[0] === "-h" || argv[0] === "help") {
    printUsage();
    return;
  }

  let args: RewriteLinksArgs;
  try {
    args = parseArgs(process.argv);
  } catch (error) {
    ui.log.error(readErrorMessage(error));
    printUsage();
    process.exit(1);
    return;
  }

  if (!args.folder) {
    printUsage();
    process.exit(1);
  }

  const spinner = ui.spinner();
  spinner.start(args.dryRun ? "scanning local links" : "rewriting local links");

  try {
    const result = await rewriteLinksInSkillFolder(args.folder, { dryRun: args.dryRun });

    const summary = args.dryRun
      ? `${result.replacements} link(s) would be rewritten in ${result.filesChanged} file(s)`
      : `${result.replacements} link(s) rewritten in ${result.filesChanged} file(s)`;

    spinner.stop(pc.green(args.dryRun ? "dry run complete" : "link rewrite complete"));

    if (result.filesChanged === 0) {
      ui.log.info(pc.dim("no local links to rewrite"));
    } else {
      ui.log.info(pc.dim(summary));
      for (const file of result.files) {
        ui.log.info(pc.dim(`- ${file.path}: ${file.replacements}`));
      }
    }

    ui.log.info(pc.dim(`scanned ${result.filesScanned} file(s)`));
  } catch (error) {
    spinner.stop(pc.red("link rewrite failed"));
    ui.log.error(readErrorMessage(error));
    process.exit(1);
  }
}
