# Edit a Skill

Use when user wants to update an existing vault skill.

## Read first

- [[resource:new:references/authoring.md]]

## Step 1: Clone the skill

Clone to a folder in cwd:

```bash
better-skills clone <vault-slug>/<skill-slug>|<slug>|<uuid> --to ./<folder> [--force]
```

The clone writes the folder in update-ready format: `SKILL.md` + `references/`

- `scripts/` + `assets/`. It prints a link context table (`uuid -> resource path`)
  for existing mentions.

## Step 2: Edit local files

Edit `SKILL.md` and resource files as needed.

If content was imported or copied from another source, run:

```bash
better-skills rewrite-links ./<folder>
```

Then wire mentions per [[resource:new:references/linking.md]]. If adding a new
file, create it under `references/`, `scripts/`, or `assets/` and add a
`\[[resource:new:<path>]]` mention. Replace any remaining bare markdown links
with mention tokens.

## Step 3: Validate

```bash
better-skills validate ./<folder>
```

Validation is strict — any warning is a failure. Fix all issues before proceeding.

## Step 4: Update

```bash
better-skills update <vault-slug>/<skill-slug>|<slug>|<uuid> --from ./<folder> [--slug <slug>] [--vault <vault-slug|vault-id>]
```

The CLI will:

- Diff local resources against the server (insert/update/delete)
- Resolve `\[[resource:new:...]]` mentions to `\[[resource:<uuid>]]` in both
  SKILL.md and resource file content
- Move the skill to another writable vault when `--vault` is provided
- Re-validate mention targets against the destination vault when moving

## Step 5: Sync and confirm

```bash
better-skills sync
better-skills get <vault-slug>/<skill-slug>|<slug>|<uuid>
```

Tell the user to start a new session so updated skills are reloaded.

## Behavior

- Local folder is desired state for resources.
- Missing local file on update removes the remote resource.
- Renamed file path → delete old + create new.
