---
name: "[Vendor] [Topic]"
description: >
  [What this skill covers — the domain knowledge inside: entities, API
  surface, workflows, gotchas. One clear statement of coverage; do not
  restate the trigger conditions from when_to_use.]
when_to_use: >-
  When [specific action or scenario that should trigger this skill].
  Use when: [keyword 1], [keyword 2], or [phrase that triggers this skill].
---

# [Skill Title]

<!--
  Structure guidance (delete this comment in real skills):

  - Keep SKILL.md lean. It should carry the knowledge Claude can't infer
    from the API itself: domain concepts, non-obvious constraints,
    workflow shape, and gotchas.
  - `description` and `when_to_use` have distinct jobs — coverage vs.
    trigger conditions. Don't duplicate content between them, and never
    add a `triggers:` list.
  - State each instruction once. No repetition for emphasis, no ALL-CAPS
    warnings unless something genuinely destroys data or money.
  - Skip any section below that would only hold generic filler. A skill
    with three real gotchas beats one with eight boilerplate sections.
  - Progressive disclosure: if SKILL.md grows past ~350 lines, move
    exhaustive reference material (full field tables, complete error
    catalogs, long request/response examples) into `references/*.md`
    files in this skill's directory and link them from the relevant
    section. SKILL.md keeps the concepts and workflows; references hold
    the lookup tables.
-->

## Overview

One short paragraph: what this domain is and what an MSP does with it.

## Key Concepts

The entities, relationships, and terminology Claude needs before touching
the API. Prefer a compact table for enums and status codes. If the full
field reference is long, summarize the important fields here and link the
complete table:

See [references/fields.md](references/fields.md) for the complete field reference.

## Common Workflows

### Workflow name

1. Step one
2. Step two

Include decision points and the non-obvious ordering constraints. Skip
workflows that are just "call the endpoint."

## API Patterns

The request shapes that aren't guessable — auth quirks, pagination
casing, filter syntax. Link `references/api.md` for the exhaustive
endpoint catalog if it's long.

## Gotchas

The section that earns the skill its tokens: rate-limit behavior,
case-sensitive parameters, fields that silently drop, errors whose
messages mislead. Each entry: what happens, why, what to do instead.

## Related Skills

Only if the links genuinely route the reader somewhere (e.g., a shared
auth skill). Omit otherwise.
