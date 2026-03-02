# Create a Skill

Use when user wants to create a new skill from scratch. Not for importing from
external sources — route those to the Import flow.

## Read first

- [[resource:new:references/authoring.md]]
- [[resource:new:references/linking.md]]

## Step 1: Gather requirements (Q&A)

Ask the user the following. Do not proceed until answers are clear:

1. **Name**: What should the skill be called?
   (lowercase, letters/numbers/hyphens, 1-64 chars, no consecutive hyphens)
2. **Purpose**: What does this skill do? What problem does it solve?
3. **Triggers**: When should this skill activate? What user phrases or requests
   should route here?
4. **Negative triggers**: What should NOT trigger this skill?
5. **Scope**: What reference files are needed? (guides, schemas, cheatsheets,
   scripts, templates)

Use the answers to draft a `description` following [[resource:new:references/authoring.md]]:

- Third person, describes capability + when to use + when NOT to use
- Include realistic user phrasings and common variants

## Step 2: Check vault for related skills

```bash
better-skills list --all
```

If any existing skill covers a related domain, present them to the user:

- "These vault skills look related — want to cross-link any of them?"
- Note approved UUIDs for Step 5.

If nothing is relevant, move on.

## Step 3: Create the skill folder

Create the folder in cwd (never use a tmp directory):

```bash
mkdir -p ./<skill-name>/references
```

Write `SKILL.md` with:

- Frontmatter: `name` and `description` from the Q&A
- Routing section pointing to reference files via `\[[resource:new:<path>]]` mentions
- Flow/workflow sections as needed

Write reference files under `references/`, `scripts/`, or `assets/`.

Since the content is authored fresh, use proper `\[[resource:new:<path>]]` mention
syntax directly — no `rewrite-links` step needed.

Ensure every file under `references/`, `scripts/`, or `assets/` has at least
one inbound mention.

## Step 4: Validate

```bash
better-skills validate "./<skill-name>"
```

Validation is strict — any warning is a failure. Fix all issues before proceeding.

## Step 5: Add cross-skill links

If the user approved cross-links in Step 2, add `\[[skill:<uuid>]]` mentions
in relevant sections — not in a generic "Related Skills" list.

## Step 6: Create

```bash
better-skills create --from "./<skill-name>" [--slug <slug>]
```

## Step 7: Sync and confirm

```bash
better-skills sync
better-skills get <slug-or-uuid>
```

Tell the user to start a new session so updated skills are reloaded.
