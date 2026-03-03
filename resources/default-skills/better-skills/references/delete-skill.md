# Delete a Skill

Use when user wants to permanently remove a skill from the vault.

## Step 1: Identify the skill

Resolve the skill by slug or UUID:

```bash
better-skills get <vault-slug>/<skill-slug>|<slug>|<uuid>
```

Confirm with the user that this is the correct skill.

## Step 2: Check for inbound references

```bash
better-skills references <vault-slug>/<skill-slug>|<slug>|<uuid>
```

This lists every other vault skill that has a `\[[skill:<uuid>]]` mention
pointing to the target skill.

If references exist:

1. Present the list to the user — each referencing skill and where the
   mention lives (SKILL.md or a specific resource file).
2. Explain that deleting will leave orphaned `\[[skill:<uuid>]]` tokens in
   those skills' markdown — the DB link rows cascade-delete, but the raw
   mention text remains.
3. Ask the user how to proceed:
   - **Clean up first** — for each referencing skill, clone it via the Edit
     flow, remove or replace the `\[[skill:<uuid>]]` mention, update, then
     come back and delete.
   - **Delete anyway** — proceed knowing some skills will have broken mentions.
   - **Cancel** — abort the delete.

If no references exist, move to Step 3.

## Step 3: Delete

```bash
better-skills delete <vault-slug>/<skill-slug>|<slug>|<uuid> [--yes]
```

`--yes` skips interactive confirmation. Required in non-interactive environments.

Deletion is permanent. FK cascades remove all resources and link rows.

## Step 4: Sync and confirm

```bash
better-skills sync
```

Tell the user to start a new session so updated skills are reloaded.
