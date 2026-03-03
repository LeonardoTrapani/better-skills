# Search and Propose

Use for discovery, recommendations, and cross-skill linking suggestions.

## Step 1: Search vault

```bash
better-skills search "<query>"
```

Or list all for broader exploration:

```bash
better-skills list --all
```

## Step 2: Inspect candidates

```bash
better-skills get <vault-slug>/<skill-slug>|<slug>|<uuid>
```

Review the skill content to understand overlap and relevance.

## Step 3: Propose

Present to the user:

1. Candidate skill(s) and why they match.
2. Confirm vault compatibility for each proposed link. `\[[skill:<uuid>]]` targets
   must be in the same vault as the source skill.
3. For each proposed link: the specific file and section where the
   `\[[skill:<uuid>]]` mention should go — prefer the most relevant
   reference file and section over SKILL.md. See
   [[resource:new:references/linking.md]] for placement rules.
4. Exact commands to run once approved.

For linking, update the target skill via the Edit flow.
