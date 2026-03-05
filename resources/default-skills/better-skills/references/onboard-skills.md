# Onboard Unmanaged Skills

Use when user asks to bring existing local skill folders into the vault.
These are skills that already exist on disk but are not tracked by better-skills.

Do NOT use for GitHub URLs, skills.sh links, or external sources — route those
to the Import flow.

## Read first

- [[resource:new:references/authoring.md]]
- [[resource:new:references/linking.md]]

## Step 1: Discover unmanaged skills

```bash
better-skills get-unmanaged-skills
```

This scans every configured agent's skill directory and lists local skill
folders that have no `.better-skills-install.json` (i.e. not managed by the
vault). If the output is empty, tell the user and stop.

## Step 2: Pick target vault and check related skills

List available vaults first so the user can choose where onboarded skills should
live:

```bash
better-skills vaults
```

Record a vault selector (`<vault-slug>` or `<vault-id>`). If the user does not
specify one, default to personal vault (omit `--vault` later).

Then inspect existing skills:

```bash
better-skills list --all
```

Note existing skills for:

- Avoiding duplicates — if a local skill already exists in the vault, route to
  the Edit flow instead
- Proposing cross-links later in Step 7 (same-vault only)

If any existing vault skill covers a related domain, present them to the user:

- "These vault skills in the target vault look related — want to cross-link any
  of them to the onboarded skill?"
- Note approved UUIDs for Step 6.

If nothing is relevant, move on.

## Step 3: Select skills to onboard

Present the list of unmanaged skills from Step 1. Ask the user:

- Which ones to onboard (accept "all" or a subset)
- For unselected skills: keep locally (default) or delete
  (requires explicit confirmation — never delete without it)

## Step 4: Rewrite links (per skill)

For each selected skill:

1. Run link rewrite:

```bash
better-skills rewrite-links <skill-folder>
```

2. Manually scan for remaining bare markdown links or plain-text paths.
   Convert to `\[[resource:new:<path>]]` mentions.

3. Ensure every file under `references/`, `scripts/`, `assets/` has at least
   one inbound mention.

## Step 5: Review and propose changes (per skill)

For each selected skill:

1. Read the skill content (SKILL.md and all resource files)
2. Compare against [[resource:new:references/authoring.md]] guidelines. Check:
   - Frontmatter: `name` and `description` present and well-written
   - Description: third person, trigger phrases, negative triggers
   - Structure: SKILL.md as router, details in references
   - Naming: folder name matches `name` field, lowercase-hyphenated
3. If improvements are needed, present a summary to the user:
   - List each proposed change with a short reason
   - Ask for approval before making edits
4. Apply approved changes. Skip if everything already looks good.

## Step 6: Validate (per skill)

```bash
better-skills validate <skill-folder>
```

If errors: fix the issues, re-run rewrite-links if link problems persist,
re-validate until clean.

## Step 7: Add cross-skill links

If the user approved cross-links in Step 2, add `\[[skill:<uuid>]]` mentions
in the relevant sections of SKILL.md or reference files — not in a generic
"Related Skills" list at the bottom. Only add links to skills in the same
vault as the onboarded skill.

## Step 8: Create or update (per skill)

For each skill:

- If it does not exist in the vault:

```bash
better-skills create --from <skill-folder> [--slug <slug>] [--vault <vault-slug|vault-id>]
```

- If it already exists:

```bash
better-skills update <vault-slug>/<skill-slug>|<slug>|<uuid> --from <skill-folder> [--vault <vault-slug|vault-id>]
```

## Step 9: Sync and confirm

```bash
better-skills sync
better-skills get <vault-slug>/<skill-slug>|<slug>|<uuid>
```

## Step 10: Report

Summarize results:

- Skills onboarded: count and names
- Skills skipped: count and reason
- Cross-links added
- Any errors encountered

Tell the user to start a new session so updated skills are reloaded.
