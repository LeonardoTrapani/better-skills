---
name: better-skills
description: |
  Index and route better-skills vault operations from the CLI.
  Trigger when users ask to manage better-skills or a skill vault
  (create, edit, delete, remove, search, import, clone, link, sync, backup, onboard).
  Do not use when asked to use a skill.
---

# better-skills

## Flows

| Trigger                                                             | Flow                                              |
| ------------------------------------------------------------------- | ------------------------------------------------- |
| GitHub URL, skills.sh link, npm URL, blog post, any external source | [[resource:new:references/import-skill.md]]       |
| User wants to create/write a new skill from scratch                 | [[resource:new:references/create-skill.md]]       |
| User wants to update/edit an existing vault skill                   | [[resource:new:references/edit-skill.md]]         |
| Asked to onboard, Existing local skill folders not yet in the vault | [[resource:new:references/onboard-skills.md]]     |
| User wants to delete/remove a skill                                 | [[resource:new:references/delete-skill.md]]       |
| "What skills do I have?", find related skills, linking requests     | [[resource:new:references/search-and-propose.md]] |

## Shared references

- Authoring guidelines → [[resource:new:references/authoring.md]]
- Mention linking → [[resource:new:references/linking.md]]
- CLI command reference (load only when stuck with CLI syntax) → [[resource:new:references/commands.md]]

## Rules

1. Every resource file must have a `\[[resource:new:<path>]]` mention — either
   in SKILL.md or in another resource. Never run create/update until validate exits clean.
2. Never use bare markdown links for internal resource references.
3. Always read authoring guidelines before creating or editing a skill.
