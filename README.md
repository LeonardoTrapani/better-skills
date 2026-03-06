# better-skills

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="apps/web/public/brand/logo-dark.svg">
    <img alt="better-skills logo" src="apps/web/public/brand/logo-light.svg" width="96">
  </picture>
</p>

<p align="center">
  <strong>your agent's second brain</strong><br />
  build, share, and manage a graph of reusable skills for your ai agents.
</p>

<p align="center">
  <a href="https://better-skills.dev">website</a> •
  <a href="https://github.com/LeonardoTrapani/better-skills/releases">releases</a> •
  <a href="#quickstart-cli">quickstart</a> •
  <a href="#local-development">local development</a>
</p>

<p align="center">
  <img alt="status prototype" src="https://img.shields.io/badge/status-prototype-fe9a00">
  <img alt="bun version" src="https://img.shields.io/badge/bun-1.3.5-black">
  <img alt="stack" src="https://img.shields.io/badge/stack-next.js%2016%20%2B%20hono%20%2B%20trpc-0ea5e9">
  <img alt="license mit" src="https://img.shields.io/badge/license-MIT-22c55e">
</p>

<p align="center">
  <img src="apps/web/public/readme/landing-hero.png" alt="better-skills hero" width="100%">
</p>

> better-skills is in active development, focused on understanding and nailing product and market needs.
> for now we prioritize fast iteration and real-world feedback, intentionally leaving code quality temporarly behind

## Table Of Contents

- [What Is better-skills?](#what-is-better-skills)
- [Core Concepts](#core-concepts)
- [What You Can Do Today](#what-you-can-do-today)
- [Architecture At A Glance](#architecture-at-a-glance)
- [Quickstart (CLI)](#quickstart-cli)
- [CLI Commands](#cli-commands)
- [CLI Versions And Releases](#cli-versions-and-releases)
- [Skill Package Format](#skill-package-format)
- [Agent Compatibility](#agent-compatibility)
- [Local Development](#local-development)
- [Workspace Structure](#workspace-structure)
- [Useful Docs](#useful-docs)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## What Is better-skills?

better-skills is an open, graph-native skills system for coding agents.

it gives you a shared "skills layer" that works across terminal agents and a web dashboard:

- author and update skills from the cli
- sync those skills locally for your agents
- visualize relationships between skills/resources in a graph ui
- manage ownership and permissions with personal, enterprise, and system-default vaults
- share skill bundles and import them into your workspace

## Core Concepts

| Term     | Meaning                                                                             |
| -------- | ----------------------------------------------------------------------------------- |
| Skill    | A reusable capability packaged as `SKILL.md` plus resource files                    |
| Resource | A file attached to a skill (for example `references/*.md`, `scripts/*`, `assets/*`) |
| Vault    | Ownership boundary for skills (`personal`, `enterprise`, `system_default`)          |
| Link     | Directed graph edge between skills/resources (`mention`, `depends_on`, etc.)        |

## What You Can Do Today

- **cli-first workflows**: create, validate, update, search, clone, and sync skills from your terminal
- **web console**: browse your vault, inspect skills, edit markdown resources, and view graph connections
- **multi-vault model**: personal defaults, enterprise collaboration, and shared system defaults
- **share + import**: publish skill bundles and install/import them in other environments
- **mention-aware graph sync**: `[[skill:<uuid>]]`, `[[resource:<uuid>]]`, and `[[resource:new:<path>]]` are parsed and linked automatically
- **agent installs**: sync the same skill set to multiple coding agents with one command

## Architecture At A Glance

```text
cli (apps/cli)         web (apps/web)
      \                  /
       \                /
        ---- hono server (apps/server) ----
                  |  better-auth
                  |  trpc
                  v
         postgres / neon (drizzle)
               packages/db

shared domain logic: packages/api
shared mention tooling: packages/markdown
```

## Quickstart CLI

install the latest cli:

```bash
curl -fsSL https://better-skills.dev/install | bash
```

verify install:

```bash
better-skills --version
better-skills health
```

login and sync:

```bash
better-skills login
better-skills sync
better-skills list --limit 10
```

pin to a specific release if needed:

```bash
curl -fsSL https://better-skills.dev/install | bash -s -- --version v0.1.0
```

notes:

- installer default server is `https://server.better-skills.dev`
- override at install time with `--server-url`, or at runtime with `SERVER_URL`
- installer source is `apps/web/public/install`

## CLI Commands

run `better-skills --help` for full usage. most-used commands:

```bash
# auth and status
better-skills health
better-skills login
better-skills whoami
better-skills logout

# vaults
better-skills vaults
better-skills enable <vault-slug|vault-id>
better-skills disable <vault-slug|vault-id>

# discover and inspect
better-skills list [search] [--all] [--limit N]
better-skills search "<query>" [--limit N]
better-skills get <vault-slug>/<skill-slug>|<slug>|<uuid>
better-skills clone <vault-slug>/<skill-slug>|<slug>|<uuid> [--to <dir>] [--force]

# authoring
better-skills validate <dir>
better-skills rewrite-links <dir> [--dry-run]
better-skills create --from <dir> [--slug <slug>] [--vault <vault-slug|vault-id>]
better-skills update <vault-slug>/<skill-slug>|<slug>|<uuid> --from <dir>
better-skills references <vault-slug>/<skill-slug>|<slug>|<uuid>
better-skills delete <vault-slug>/<skill-slug>|<slug>|<uuid> [--yes]

# install/share and setup
better-skills install-share <share-url|share-uuid>
better-skills get-unmanaged-skills
better-skills config
better-skills backup [--source <dir>] [--out <tmp-dir>] [--agent <agent>]...
better-skills sync
```

non-interactive mode is auto-enabled for no-tty/ci contexts (`CI=true`, `AGENT=1`, `OPENCODE=1`).

## CLI Versions And Releases

- releases are published from git tags matching `v*`
- installer defaults to `latest` github release
- `better-skills --version` reads `BETTER_SKILLS_VERSION` (falls back to `dev`)
- binaries are currently published for:
  - `darwin-x64`
  - `darwin-arm64`
  - `linux-x64`
- release workflow: `.github/workflows/release-cli.yml`

## Skill Package Format

minimum shape:

```text
my-skill/
  SKILL.md
  references/
    notes.md
```

`SKILL.md` needs yaml frontmatter with at least:

```yaml
---
name: my-skill
description: short summary of what this skill does
---
```

mention tokens used by better-skills:

- `[[skill:<uuid>]]`
- `[[resource:<uuid>]]`
- `[[resource:new:path/to/file.md]]` (draft-local before persistence)

recommended authoring flow:

```bash
better-skills validate ./my-skill
better-skills rewrite-links ./my-skill --dry-run
better-skills create --from ./my-skill
```

## Agent Compatibility

the cli can sync skills to these agent skill directories:

- OpenCode: `~/.config/opencode/skills`
- Claude Code: `~/.claude/skills`
- Codex: `~/.codex/skills`
- Cursor: `~/.cursor/skills`
- GitHub Copilot: `~/.copilot/skills`
- Gemini CLI: `~/.gemini/skills`
- Amp: `~/.config/agents/skills`
- Goose: `~/.config/goose/skills`
- Continue.dev: `~/.continue/skills`

canonical skill storage used by better-skills:

- `~/.better-skills/skills`

## Local Development

### Prerequisites

- bun `1.3.5`
- postgres (or neon postgres)
- oauth app credentials for github/google login flows

### 1) Install Dependencies

```bash
bun install
```

### 2) Configure Environment

`apps/server/.env`:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/better_skills
BETTER_AUTH_SECRET=replace-with-at-least-32-characters
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3001
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
NODE_ENV=development
```

`apps/web/.env`:

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

optional for cli (when targeting local server):

```bash
export SERVER_URL=http://localhost:3000
```

### 3) Push Database Schema

```bash
bun run db:push
```

### 4) Start The Stack

```bash
bun run dev
```

this starts:

- web: `http://localhost:3001`
- api/auth server: `http://localhost:3000`

run cli directly from repo root:

```bash
bun cli --help
```

### 5) Validate Changes

```bash
bun run check-types
bun run check
```

there is no single shared monorepo test runner yet; add/run package-local tests when you introduce new behavior.

## Workspace Structure

```text
apps/
  cli/       # terminal cli built with @clack/prompts + trpc client
  server/    # hono runtime hosting better-auth + trpc routes
  web/       # next.js dashboard + graph + share/import ui

packages/
  api/       # shared trpc router + domain behavior
  auth/      # better-auth setup and vault bootstrap hooks
  config/    # shared tsconfig presets
  db/        # drizzle schema + migrations + db client
  env/       # typed env contracts (server/web/cli)
  markdown/  # mention parsing/rendering and markdown helpers

resources/
  default-skills/  # seeded default skill templates

docs/
  mention-link-sync-flow.md
  skills-schema.md
```

## Useful Docs

- data model and vault semantics: `docs/skills-schema.md`
- mention parsing and graph link sync flow: `docs/mention-link-sync-flow.md`
- default seeded skill: `resources/default-skills/better-skills/SKILL.md`

## Contributing

issues and prs are welcome.

please keep contributions aligned with these repo conventions:

1. use bun workspaces (`bun`, not npm/pnpm/yarn)
2. keep transport concerns in `apps/server` and domain logic in `packages/api`
3. keep db schema + migration changes together
4. run `bun run check-types` and `bun run check` before opening a pr
5. never commit secrets or `.env` files

for larger feature ideas, open an issue first so we can align on product direction (prototype moves fast).

## Security

- do not commit credentials or live tokens
- use local `.env` files for secrets
- if you discover a security issue, please report it privately to the maintainers before public disclosure

## License

licensed under the [MIT License](LICENSE).

## Acknowledgements

- bootstrapped from [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack)
- built with Next.js, Hono, tRPC, Better Auth, Drizzle, Turborepo, and Bun
