# Vault Model Rollout Checklist

This runbook documents the production rollout sequence for the multi-vault model.

## Scope

- Move ownership semantics from user-owned skills to vault-owned skills.
- Keep one canonical shared `system-default` vault for default skills.
- Ensure all users have memberships and defaults remain read-only where required.
- Remove per-user duplicated default skills during the vault migration.

## Preconditions

- Production DB backup/snapshot completed.
- `apps/server/.env` has valid `DATABASE_URL` and auth variables.
- Deploy artifact contains current migrations and auth sync scripts.
- Rollout window has owner on-call for DB + API.

## Migration Order (Do Not Reorder)

Run from repository root:

```bash
bun run db:migrate
bun run sync-default-skills
```

Why this order:

- `db:migrate` creates vault tables/columns and backfills base ownership state.
- `db:migrate` also removes legacy per-user default-skill rows (`is_default=true` + `owner_user_id is not null`).
- `sync-default-skills` ensures canonical defaults exist in `system-default`.

## Post-Deploy Validation Commands

Run from repository root after rollout:

```bash
bun run check-types
bun run check
```

Data validation (requires DB access):

```bash
psql "$DATABASE_URL" -c "select type, count(*) from vault group by type order by type;"
psql "$DATABASE_URL" -c "select count(*) as users_without_default_membership from \"user\" u where not exists (select 1 from vault_membership vm join vault v on v.id = vm.vault_id where vm.user_id = u.id and v.type = 'system_default');"
psql "$DATABASE_URL" -c "select count(*) as default_skills_not_in_system_default from skill s join vault v on v.id = s.owner_vault_id where s.is_default = true and v.type <> 'system_default';"
psql "$DATABASE_URL" -c "select count(*) as unresolved_default_dupes from skill s where s.owner_user_id is not null and s.is_default = true;"
```

Expected results:

- One `system_default` vault row.
- `users_without_default_membership = 0`.
- `default_skills_not_in_system_default = 0`.
- `unresolved_default_dupes = 0`.

## Fallback Plan

If rollout fails before `sync-default-skills`:

1. stop new deploys
2. restore DB snapshot
3. redeploy previous app version

If rollout fails after `sync-default-skills` started:

1. treat as rollout incident (do not run ad-hoc deletes)
2. restore DB snapshot and previous app version together
3. rerun rollout in staging with captured failure inputs

Notes:

- legacy default cleanup now runs inside `db:migrate`; keep DB backup logs for incident analysis.
- never partially rerun cleanup SQL by hand in production.

## Operational Notes

- `sync-default-skills` is idempotent and should remain in deploy/build flow.
- Membership `is_enabled` is user preference only; disabling does not remove membership rows.
- Mention validation enforces same-vault targets, so cross-vault links are intentionally rejected.
