# CLI Commands

Quick syntax reference. For step-by-step execution flows, use the dedicated
flow docs (`create-skill.md`, `edit-skill.md`, `import-skill.md`,
`onboard-skills.md`, `delete-skill.md`, `search-and-propose.md`).

## Auth

```bash
better-skills health
better-skills login
better-skills whoami
better-skills logout
```

## Vaults

```bash
better-skills vaults
better-skills enable <vault-slug|vault-id>
better-skills disable <vault-slug|vault-id>
```

- Run `vaults` first to discover vault `slug`/`id` values and access.
- `enable` and `disable` toggle vault status for the current user.
- Enterprise member admin actions are API/web-only (not top-level CLI commands).

## Skill discovery

```bash
better-skills list [search] [--all] [--limit N]
better-skills search "<query>" [--limit N]
better-skills get <vault-slug>/<skill-slug>|<slug>|<uuid>
better-skills clone <vault-slug>/<skill-slug>|<slug>|<uuid> [--to <dir>] [--force]
```

- In multi-vault setups, prefer fully qualified `<vault-slug>/<skill-slug>`.

## Sharing

```bash
better-skills install-share <share-url|share-uuid>
```

- Installs a shared package directly to local coding agents from a public share link.
- Accepts either the full `/share/<uuid>` URL or just the share UUID.
- Uses the same agent selection/setup flow as `better-skills sync`.
- This is local install only (no vault copy). For a vault copy, use web import.

## Create and update

```bash
better-skills rewrite-links <dir> [--dry-run]
better-skills create --from <dir> [--slug <slug>] [--vault <vault-slug|vault-id>]
better-skills update <vault-slug>/<skill-slug>|<slug>|<uuid> --from <dir> [--slug <slug>] [--vault <vault-slug|vault-id>]
better-skills validate <dir>
```

- `create` without `--vault` targets personal vault.
- `update --vault` moves a skill to another writable vault.
- Use `rewrite-links` + `validate` before create/update when editing/importing.

## References and delete

```bash
better-skills references <vault-slug>/<skill-slug>|<slug>|<uuid>
better-skills delete <vault-slug>/<skill-slug>|<slug>|<uuid> [--yes]
```

- Check `references` before delete to avoid orphaned links.
- `--yes` is required for non-interactive delete.

## Config, onboarding, sync

```bash
better-skills config
better-skills get-unmanaged-skills
better-skills backup [--source <dir>] [--out <tmp-dir>] [--agent <agent>]...
better-skills sync
```

`get-unmanaged-skills` lists local skill folders not managed by better-skills
yet (used before onboarding).

## Non-interactive usage

The CLI auto-detects non-interactive environments (no TTY, `AGENT=1`,
`OPENCODE=1`, `CI=true`) and suppresses spinners.

- Destructive commands require `--yes` in non-interactive mode.
- create/update print JSON on success (`id`, `slug`, `name`).
- Failures return non-zero with actionable error text.
