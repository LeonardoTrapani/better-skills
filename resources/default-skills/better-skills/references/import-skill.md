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

### A. skills.sh URL

URL pattern: `https://skills.sh/<org>/<repo>/<skill-name>`

The path segments map to a GitHub repo plus the skill folder name.

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

```bash
git clone --depth 1 <repo-url> ./<repo-name>
```

If the URL points to a subdirectory, `$skill_dir` is that subfolder.
If root contains `SKILL.md`, `$skill_dir` is the repo root.

### C. Other URL (blog post, docs page, npm package)

1. WebFetch the URL.
2. If the page links to a source repo (e.g. npm → GitHub), clone it (path B).
3. If no repo exists, extract the content and create the folder in cwd:

```bash
mkdir -p ./<skill-name>/references
```

Use the fetched content as source material to author SKILL.md and references.

## Step 3: Review and propose changes

Read [[resource:new:references/authoring.md]] and compare the imported content
against the guidelines. Check:

- Frontmatter: `name` and `description` present and well-written
- Description: third person, trigger phrases, negative triggers
- Structure: SKILL.md as router, details in references
- Naming: folder name matches `name` field, lowercase-hyphenated

If improvements are needed, present a summary to the user:

- List each proposed change with a short reason
- Ask for approval before making edits

Apply approved changes. Skip if everything looks good.

## Step 4: Rewrite links

```bash
better-skills rewrite-links "$skill_dir"
```

Then manually scan for any remaining bare markdown links (`[text](references/...)`)
or plain-text paths to local files that the rewriter missed. Convert them to
`\[[resource:new:<path>]]` mention tokens.

Ensure every file under `references/`, `scripts/`, or `assets/` has at least
one inbound mention — in SKILL.md or in another resource file.

## Step 5: Validate

```bash
better-skills validate "$skill_dir"
```

Validation is strict — any warning is a failure.

If errors:

1. Fix the reported issues (missing mentions, bad frontmatter, etc.)
2. Run `better-skills rewrite-links "$skill_dir"` again if link issues persist
3. Re-validate until clean

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

Clean up the cloned repo folder if it is separate from the skill directory.

Tell the user to start a new session so updated skills are reloaded.
