# AGENTS.md

This package is the authenticated Next.js web console for browsing and managing skills, graph links, and account state.

## Local defaults

- Run from repo root with `bun run dev:web`.
- Use `NEXT_PUBLIC_SERVER_URL` for server calls; do not hardcode host URLs.
- Keep API access through shared tRPC and auth clients unless a route is intentionally outside that surface.
- Keep cookie-based auth request behavior intact for cross-origin calls.
- If request/response contracts change, update `packages/api` and `apps/server` in the same change.

## Validation

- `bun run check-types`
- `bun run check`

## Additional guidance

- `docs/mention-link-sync-flow.md`
- `.agents/skills/next-best-practices/SKILL.md`
- `.agents/skills/vercel-react-best-practices/SKILL.md`
- `.agents/skills/vercel-composition-patterns/SKILL.md`

## Components Placement

- Only shadcn components should be placed under `src/components/ui`
- If a component is used only in a specific page, it should be placed under that page folder
  - e.g. `src/app/_landing`, there are only landing related components
  - e.g. `src/app/vault/_components`, there are only vault related components
- Any shared component should be placed under a already existing or new folder under `src/components/`, but NOT under `/ui/` since that's only for shadcn
  - e.g. `src/components/skill`, there are skill components shared under different pages
