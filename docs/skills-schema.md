# Skills Schema

This document explains how better-skills stores skills as a multi-vault graph in Postgres with Drizzle.

## Goal

Model skills so they can be:

- Scoped to a vault (personal, enterprise, or system-default)
- Visible through per-user vault memberships (with per-vault enable/disable)
- Stored with full `SKILL.md` content and parsed metadata
- Split into subfiles (`references`, `scripts`, `assets`, etc.)
- Linked in a many-to-many graph, including resource-level links

## Core Tables

### `vault`

Logical ownership boundary for skills.

- `id`: UUID PK
- `slug`: globally unique stable key
- `name`: display name
- `type`: enum `personal | enterprise | system_default`
- `color`: optional display color used by UI/graph
- `is_system_managed`: guard for immutable/managed vaults
- `metadata`: app/system metadata JSONB
- timestamps (`created_at`, `updated_at`)

Rules and semantics:

- Exactly one shared `system_default` vault is expected in production.
- Personal vaults are created per user and hold their writable defaults.
- Enterprise vaults are collaborative and membership-driven.

### `vault_membership`

Per-user access and preference state for a vault.

- `id`: UUID PK
- `vault_id`: FK to `vault.id`
- `user_id`: FK to `user.id`
- `role`: enum `owner | admin | member`
- `is_enabled`: user preference toggle for read surfaces
- timestamps

Rules:

- Unique membership per `(vault_id, user_id)`.
- Disabled memberships are still memberships; they are hidden from normal list/search/graph reads but remain manageable in settings.

### `vault_invitation`

Invitation lifecycle for enterprise vault access.

- `id`: UUID PK
- `vault_id`: FK to `vault.id`
- `email`: invite target (normalized for matching)
- `role`: enum `owner | admin | member` (default `member`)
- `status`: enum `pending | accepted | declined | revoked | expired`
- `invited_by_user_id`: FK to `user.id` (`SET NULL` on user delete)
- `expires_at`: optional expiry timestamp
- timestamps

Rules:

- At most one pending invite per `(vault_id, email)` via partial unique index.
- Accept/decline transitions invitation state and creates membership when accepted.

### `skill`

Core node for a skill.

- `id`: UUID PK
- `owner_vault_id`: non-null FK to `vault.id` (ownership boundary)
- `owner_user_id`: nullable legacy creator/reference field
- `slug`, `name`, `description`
- `skill_markdown`: full raw `SKILL.md` content
- `frontmatter`: parsed YAML frontmatter as JSONB
- `metadata`: app/system metadata as JSONB
- `is_default`: boolean marker for canonical default templates
- `source_url`, `source_identifier`
- timestamps (`created_at`, `updated_at`)

Ownership rules:

- Vault ownership is canonical (`owner_vault_id`), not `owner_user_id`.
- Slug uniqueness is per vault via unique `(owner_vault_id, slug)`.
- System-default skills live in the shared `system_default` vault and are read-only for normal users.

### `skill_resource`

Subfiles that belong to a skill.

- `id`: UUID PK
- `skill_id`: FK to `skill.id`
- `path`: relative path inside the skill (example: `references/api.md`)
- `kind`: enum `reference | script | asset | other`
- `content`: raw file content
- `metadata`: JSONB
- timestamps

Rule: unique path per skill (`skill_id + path`).

### `skill_link`

Directed graph edge between polymorphic nodes.

- Source is exactly one of: `source_skill_id` or `source_resource_id`
- Target is exactly one of: `target_skill_id` or `target_resource_id`
- `kind`: edge label (`related`, `depends_on`, `mention`, etc.)
- `note`, `metadata`
- `created_by_user_id`, `created_at`

Supported link shapes:

- Skill -> Skill
- Skill -> Resource
- Resource -> Skill
- Resource -> Resource

Important behavior:

- Duplicate edges are allowed by design.
- Deleting a skill or resource cascades and removes affected edges.
- Markdown mention validation only allows same-vault targets.

## Access and Read-Only Semantics

Read/write/admin permissions are derived from `vault.type` + membership `role`:

- `system_default`: always read-only
- `personal`: owner writable/admin; non-owner membership is read-only
- `enterprise`: owner/admin writable; member read-only

`vault_membership.is_enabled` controls visibility in bulk read paths (`list/search/graph`) but does not delete access metadata.

## Semantics: `frontmatter` vs `metadata`

- `frontmatter`: author-defined structured data parsed from `SKILL.md` YAML
- `metadata`: application-owned enrichment (indexes, diagnostics, ranking flags, hashes, etc.)

## Mapping from Agent Skill Convention

- `SKILL.md` -> `skill.skill_markdown` + `skill.frontmatter`
- Files under `references/`, `scripts/`, `assets/` -> `skill_resource`
- Cross references between skills/resources -> `skill_link`
