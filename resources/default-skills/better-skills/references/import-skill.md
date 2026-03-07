# Import a Skill

Use when user provides a GitHub URL, skills.sh link, npm package, blog post,
or any external source to bring into the vault as a skill.

## Read first

- [[resource:new:references/authoring.md]]
- [[resource:new:references/linking.md]]

## Step 1: Pick target vault and check related skills

List available vaults first so the user can choose where the imported skill
should be created:

```bash
better-skills vaults
```

Record a vault selector (`<vault-slug>` or `<vault-id>`). If omitted, default
to personal vault (omit `--vault` at create time).

List existing skills to identify potential cross-links:

```bash
better-skills list --all
```

If any existing skill in the target vault covers a related domain, present them
to the user:

- "These vault skills in the target vault look related — want to cross-link any
  of them to the new skill?"
- Note approved UUIDs for Step 6.

If nothing is relevant, move on.

## Step 2: Obtain the source

Clone or fetch the source material into cwd. Never use a tmp directory.

If the user pastes a third-party install command (`npx skills add ...`,
`skills add ...`, similar) while asking for a better-skills vault import, do not
execute that command. Treat it as source context only:

- Extract the real source (`https://skills.sh/...`, GitHub URL, npm package,
  docs/blog URL, repo shorthand) and continue with the matching option below.
- Extract any skill selector (`--skill <name>`) and use it when resolving the
  target skill folder.
- When the prompt says both "better-skills vault" and an external install
  command, the vault import request wins.
- Only run third-party install commands if the user explicitly wants local agent
  installation instead of a vault import.

### A. skills.sh URL

URL pattern: `https://skills.sh/<org>/<repo>/<skill-name>`

The path segments map to a GitHub repo plus the skill folder name.

If the pasted command already includes a `skills.sh` URL, use the URL as the
source and treat `--skill <name>` as the folder selector when needed.

```bash
git clone --depth 1 https://github.com/<org>/<repo>.git ./<repo>
```

Locate the skill folder:

1. `./<repo>/skills/<skill-name>/` → use that
2. `./<repo>/<skill-name>/` → use that
3. `./<repo>/SKILL.md` at root → repo root is the skill
4. Otherwise search for the directory containing a SKILL.md matching `<skill-name>`

Set `$skill_dir` to the resolved path.

### B. GitHub URL

Handle both repo URLs and subdirectory URLs.

If the pasted command includes a GitHub URL, use that URL as the source and
carry over any `--skill <name>` selector while resolving `$skill_dir`.

Never clone a `/tree/...` or `/blob/...` URL directly.

```bash
git clone --depth 1 https://github.com/<org>/<repo>.git ./<repo>
```

Resolve `$skill_dir` from the original URL:

- `.../tree/<ref>/<path>` → `./<repo>/<path>`
- `.../blob/<ref>/.../SKILL.md` → parent directory of that `SKILL.md`
- Repo root URL with root `SKILL.md` → `./<repo>`

### C. Other URL (blog post, docs page, npm package)

This also covers pasted install commands whose source is an npm package or other
non-GitHub URL. Extract the package/URL from the command instead of running it.

1. WebFetch the URL.
2. If the page links to a source repo (e.g. npm → GitHub), clone it (path B).
3. If no repo exists, extract the content and create the folder in cwd:

```bash
mkdir -p ./<skill-name>/references
```

Use the fetched content as source material to author SKILL.md and references.

This also applies if a command was provided and you can't find a source, in that case execute that and use that as the source.

## Step 3: Rewrite links

```bash
better-skills rewrite-links "$skill_dir"
```

## Step 4: Review and propose changes

Read [[resource:new:references/authoring.md]] and compare the imported content
against the guidelines. Check:

- Frontmatter: `name` and `description` present and well-written
- Description: third person, trigger phrases, negative triggers
- Structure: SKILL.md as router, details in references
- Naming: folder name matches `name` field, lowercase-hyphenated

Default import mode is **minimal and as-is**:

- Apply only changes required for successful create/update
  (mention conversion, broken local links, invalid frontmatter, etc.).
- Do not make optional polish edits unless the user explicitly asks for
  improvements.
- If some things are expicitly very bad practice, you can propose the change to the user.

If user-requested improvements are needed, present a summary:

- List each proposed change with a short reason
- Ask for approval before making edits

Apply approved optional changes. Skip if not requested.

## Step 5: Validate

```bash
better-skills validate "$skill_dir"
```

Validation is strict — any warning is a failure.

If errors:

1. Fix the reported issues (missing mentions, bad frontmatter, etc.).
2. If error says missing local resources for `:new:` mentions:
   - Verify the referenced files exist under `$skill_dir`.
   - Verify edited paths and validated path point to the same clone/workspace.
   - Manually locate unresolved internal links/paths anywhere under `$skill_dir`.
   - Replace each unresolved local link/path with a `\[[resource:new:<path>]]`
     mention token using the real relative path.
   - Keep existing folder names unless paths are actually wrong.
3. Re-validate until clean.

## Step 6: Add cross-skill links

If the user approved cross-links in Step 1, add `\[[skill:<uuid>]]` mentions
in the relevant sections of SKILL.md or reference files — not in a generic
"Related Skills" list at the bottom. Only add links to skills in the same
vault as the imported skill.

## Step 7: Create

```bash
better-skills create --from "$skill_dir" [--slug <slug>] [--vault <vault-slug|vault-id>]
```

## Step 8: Sync and confirm

```bash
better-skills sync
better-skills get <vault-slug>/<skill-slug>|<slug>|<uuid>
```

## Step 9: Clean up local import workspace

Delete disposable folders created during import after Step 8 succeeds:

- Cloned repo folder(s)
- Any extracted or copied staging folder used only for import
- `$skill_dir` itself if it was created only for this run

Keep local copies only when the user explicitly asks to keep them.

Tell the user to start a new session so updated skills are reloaded.
