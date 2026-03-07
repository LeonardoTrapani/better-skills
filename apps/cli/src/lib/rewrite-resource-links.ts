import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { extname, join, posix, relative } from "node:path";

import { normalizeResourcePath } from "./new-resource-mentions";

// ---- Configuration ----

const REWRITABLE_EXTENSIONS = new Set([".md", ".mdx", ".txt"]);

// ---- Types ----

export type RewrittenFile = { path: string; replacements: number };

export type RewriteLinksResult = {
  folder: string;
  dryRun: boolean;
  filesScanned: number;
  filesChanged: number;
  replacements: number;
  files: RewrittenFile[];
};

// ---- File Index ----
//
// Discovers all resource files and builds a lookup so any reference format
// (absolute, relative, bare basename) can be resolved to the canonical path
// used by [[resource:new:...]] mentions.

type SkillFileIndex = {
  /** Every normalized resource path, e.g. "references/guide.md" */
  allPaths: ReadonlySet<string>;
  /** lowercase basename → normalized paths (for unambiguous fallback) */
  byBasename: ReadonlyMap<string, readonly string[]>;
};

function buildFileIndex(paths: ReadonlySet<string>): SkillFileIndex {
  const byBasename = new Map<string, string[]>();
  for (const p of paths) {
    const key = posix.basename(p).toLowerCase();
    const bucket = byBasename.get(key);
    if (bucket) bucket.push(p);
    else byBasename.set(key, [p]);
  }
  return { allPaths: paths, byBasename };
}

function shouldSkipDiscoveredPath(path: string): boolean {
  if (path === "SKILL.md") return true;
  return path.split("/").some((segment) => segment.startsWith("."));
}

async function discoverResourceFiles(folder: string): Promise<Set<string>> {
  const paths = new Set<string>();

  const rootStat = await stat(folder).catch(() => null);
  if (!rootStat?.isDirectory()) return paths;

  const entries = await readdir(folder, { recursive: true });
  for (const entry of entries) {
    const full = join(folder, entry);
    const entryStat = await stat(full).catch(() => null);
    if (!entryStat?.isFile()) continue;
    const normalizedPath = normalizeResourcePath(relative(folder, full));
    if (normalizedPath.length === 0 || shouldSkipDiscoveredPath(normalizedPath)) continue;
    paths.add(normalizedPath);
  }

  return paths;
}

// ---- Path Resolution ----
//
// Tries three strategies in order:
//   1. Absolute — treat raw path as rooted at the skill folder
//   2. Relative — resolve from the directory of the file containing the link
//   3. Basename — if exactly one resource has that filename, use it
//
// Returns the normalized resource path or null.

function isUrlScheme(value: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(value);
}

export function resolveToKnownFile(
  rawTarget: string,
  fromFile: string,
  index: SkillFileIndex,
): string | null {
  const trimmed = rawTarget.trim();
  // skip escaped forms: leading backslash signals "don't rewrite"
  if (trimmed.startsWith("\\")) return null;
  const cleaned = trimmed.replace(/\\/g, "/");
  if (cleaned.length === 0 || cleaned.startsWith("#") || isUrlScheme(cleaned)) return null;

  // strip fragment (#...) and query (?...)
  const pathOnly = cleaned.replace(/[#?].*$/, "");
  if (pathOnly.length === 0) return null;

  // strategy 1: absolute from skill root
  const absolute = normalizeResourcePath(pathOnly);
  if (absolute.length > 0 && index.allPaths.has(absolute)) return absolute;

  // strategy 2: relative to source file
  const fromDir = posix.dirname(fromFile);
  const joined = fromDir === "." ? pathOnly : posix.join(fromDir, pathOnly);
  const asRelative = normalizeResourcePath(posix.normalize(joined));
  if (asRelative.startsWith("..") || asRelative.startsWith("/")) return null;
  if (asRelative.length > 0 && index.allPaths.has(asRelative)) return asRelative;

  // strategy 3: unambiguous basename fallback
  const basename = posix.basename(pathOnly).toLowerCase();
  const matches = index.byBasename.get(basename);
  if (matches?.length === 1) return matches[0]!;

  return null;
}

// ---- Link Detection Patterns ----

const MARKDOWN_LINK_RE = /(?<!!)(?<!\\)\[([^\]\n]+)\]\(([^)\n]+)\)/g;
const AUTOLINK_RE = /(?<!\\)<([^<>\n]+)>/g;
const WIKILINK_RE = /(?<!\\)\[\[([^\]\n]+)\]\]/g;
// bare paths: require whitespace / line-start / tree-drawing chars as boundary
// deliberately excludes ":" to avoid matching inside [[resource:new:...]] tokens
const BARE_PATH_RE =
  /(^|[\s>→├└│─-])((?:\.\.?[\\/])?[^\s`"'<>()[\]{}]+(?:[\\/][^\s`"'<>()[\]{}]+)*(?:[?#][^\s`"'<>()[\]{}]+)?)/g;

const FENCE_START_RE = /^\s{0,3}(`{3,}|~{3,})/;
const MENTION_TOKEN_RE = /(?<!\\)\[\[[^\]\n]+\]\]/g;

// ---- Helpers ----

function mentionToken(path: string): string {
  return `[[resource:new:${path}]]`;
}

function extractInlineLinkTarget(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.startsWith("<")) {
    const close = trimmed.indexOf(">", 1);
    return close === -1 ? null : trimmed.slice(1, close).trim();
  }
  // markdown link target ends at first whitespace (rest is title)
  const ws = trimmed.search(/\s/);
  return ws === -1 ? trimmed : trimmed.slice(0, ws);
}

function stripTrailingPunctuation(value: string): { token: string; suffix: string } {
  let token = value;
  let suffix = "";
  while (token.length > 0) {
    const last = token[token.length - 1];
    if (!last || !".,;:!?".includes(last)) break;
    suffix = `${last}${suffix}`;
    token = token.slice(0, -1);
  }
  return { token, suffix };
}

function rewriteBarePathsInPlainText(
  text: string,
  fromFile: string,
  index: SkillFileIndex,
): { text: string; replacements: number } {
  let replacements = 0;
  const rewritten = text.replace(BARE_PATH_RE, (match, prefix: string, rawToken: string) => {
    const { token, suffix } = stripTrailingPunctuation(rawToken);
    const resolved = resolveToKnownFile(token, fromFile, index);
    if (!resolved) return match;
    replacements++;
    return `${prefix}${mentionToken(resolved)}${suffix}`;
  });

  return { text: rewritten, replacements };
}

function rewriteBarePathsOutsideMentions(
  text: string,
  fromFile: string,
  index: SkillFileIndex,
): { text: string; replacements: number } {
  let cursor = 0;
  let replacements = 0;
  let output = "";

  for (const match of text.matchAll(MENTION_TOKEN_RE)) {
    const start = match.index ?? -1;
    if (start < 0) continue;
    const token = match[0] ?? "";
    const before = rewriteBarePathsInPlainText(text.slice(cursor, start), fromFile, index);
    output += before.text;
    replacements += before.replacements;
    output += token;
    cursor = start + token.length;
  }

  const tail = rewriteBarePathsInPlainText(text.slice(cursor), fromFile, index);
  output += tail.text;
  replacements += tail.replacements;

  return { text: output, replacements };
}

// ---- Segment Rewriter ----
//
// Applies all link patterns to a text segment (already outside code spans).
// Order matters: structured patterns (markdown link, autolink, wikilink) run
// first and consume their syntax; bare-path runs last on whatever remains.

function rewriteSegment(
  segment: string,
  fromFile: string,
  index: SkillFileIndex,
): { text: string; replacements: number } {
  let n = 0;

  // 1. Markdown links: [text](target)
  let text = segment.replace(MARKDOWN_LINK_RE, (match, _label: string, rawTarget: string) => {
    const target = extractInlineLinkTarget(rawTarget);
    if (!target) return match;
    const resolved = resolveToKnownFile(target, fromFile, index);
    if (!resolved) return match;
    n++;
    return mentionToken(resolved);
  });

  // 2. Autolinks: <target>
  text = text.replace(AUTOLINK_RE, (match, rawTarget: string) => {
    const resolved = resolveToKnownFile(rawTarget, fromFile, index);
    if (!resolved) return match;
    n++;
    return mentionToken(resolved);
  });

  // 3. Wikilinks: [[target]] / [[target|label]] — skip existing mentions
  text = text.replace(WIKILINK_RE, (match, rawContent: string) => {
    const lower = rawContent.trim().toLowerCase();
    if (lower.startsWith("resource:") || lower.startsWith("skill:")) return match;
    const target = (rawContent.split("|")[0] ?? "").trim();
    const resolved = resolveToKnownFile(target, fromFile, index);
    if (!resolved) return match;
    n++;
    return mentionToken(resolved);
  });

  // 4. Bare paths — last pass picks up unstructured references, but must not
  // scan inside mention tokens created by earlier passes.
  const barePathRewrite = rewriteBarePathsOutsideMentions(text, fromFile, index);
  text = barePathRewrite.text;
  n += barePathRewrite.replacements;

  return { text, replacements: n };
}

// ---- Inline-Code Skipping ----

function rewriteLineOutsideCode(
  line: string,
  fromFile: string,
  index: SkillFileIndex,
): { text: string; replacements: number } {
  let cursor = 0;
  let replacements = 0;
  let output = "";

  while (cursor < line.length) {
    const tickStart = line.indexOf("`", cursor);

    if (tickStart === -1) {
      const r = rewriteSegment(line.slice(cursor), fromFile, index);
      output += r.text;
      replacements += r.replacements;
      break;
    }

    const r = rewriteSegment(line.slice(cursor, tickStart), fromFile, index);
    output += r.text;
    replacements += r.replacements;

    let runEnd = tickStart;
    while (runEnd < line.length && line[runEnd] === "`") runEnd++;
    const tickRun = line.slice(tickStart, runEnd);
    const closing = line.indexOf(tickRun, runEnd);

    if (closing === -1) {
      output += line.slice(tickStart);
      break;
    }

    output += line.slice(tickStart, closing + tickRun.length);
    cursor = closing + tickRun.length;
  }

  return { text: output, replacements };
}

// ---- Fenced Code Block Tracking ----

function parseFenceStart(line: string): { char: "`" | "~"; len: number } | null {
  const m = FENCE_START_RE.exec(line);
  if (!m) return null;
  const marker = m[1] ?? "";
  const ch = marker[0] as "`" | "~" | undefined;
  if (!ch) return null;
  return { char: ch, len: marker.length };
}

function isFenceEnd(line: string, fence: { char: string; len: number }): boolean {
  return new RegExp(`^\\s{0,3}${fence.char}{${fence.len},}\\s*$`).test(line);
}

// ---- Main Rewrite Function ----

export function rewriteResourceLinksInMarkdown(
  markdown: string,
  fromFile: string,
  resourceFiles: ReadonlySet<string>,
): { text: string; replacements: number } {
  const index = buildFileIndex(resourceFiles);
  const lines = markdown.match(/[^\r\n]*(?:\r?\n|$)/g) ?? [markdown];
  let fence: { char: "`" | "~"; len: number } | null = null;
  let replacements = 0;
  let output = "";

  for (const raw of lines) {
    if (raw === "") continue;

    const nlMatch = raw.match(/\r?\n$/);
    const nl = nlMatch?.[0] ?? "";
    const line = nl.length > 0 ? raw.slice(0, -nl.length) : raw;

    if (fence) {
      output += raw;
      if (isFenceEnd(line, fence)) fence = null;
      continue;
    }

    const f = parseFenceStart(line);
    if (f) {
      fence = f;
      output += raw;
      continue;
    }

    const r = rewriteLineOutsideCode(line, fromFile, index);
    replacements += r.replacements;
    output += `${r.text}${nl}`;
  }

  return { text: output, replacements };
}

// ---- Folder-Level Orchestrator ----

function collectMarkdownFiles(resourceFiles: ReadonlySet<string>): string[] {
  const files = new Set<string>(["SKILL.md"]);
  for (const p of resourceFiles) {
    if (REWRITABLE_EXTENSIONS.has(extname(p).toLowerCase())) files.add(p);
  }
  return [...files].toSorted((a, b) => a.localeCompare(b));
}

export async function rewriteLinksInSkillFolder(
  folder: string,
  options: { dryRun?: boolean } = {},
): Promise<RewriteLinksResult> {
  const dryRun = options.dryRun ?? false;

  const folderStat = await stat(folder).catch(() => null);
  if (!folderStat?.isDirectory()) {
    throw new Error(folderStat ? `not a directory: ${folder}` : `directory not found: ${folder}`);
  }
  if (!(await stat(join(folder, "SKILL.md")).catch(() => null))?.isFile()) {
    throw new Error(`SKILL.md not found in ${folder}`);
  }

  const resourceFiles = await discoverResourceFiles(folder);
  const markdownFiles = collectMarkdownFiles(resourceFiles);

  const files: RewrittenFile[] = [];
  let filesChanged = 0;
  let totalReplacements = 0;

  for (const filePath of markdownFiles) {
    const abs = join(folder, filePath);
    const original = await readFile(abs, "utf8");
    const result = rewriteResourceLinksInMarkdown(
      original,
      filePath.replace(/\\/g, "/"),
      resourceFiles,
    );

    if (result.replacements === 0 || result.text === original) continue;

    if (!dryRun) await writeFile(abs, result.text, "utf8");

    filesChanged++;
    totalReplacements += result.replacements;
    files.push({ path: filePath, replacements: result.replacements });
  }

  return {
    folder,
    dryRun,
    filesScanned: markdownFiles.length,
    filesChanged,
    replacements: totalReplacements,
    files,
  };
}
