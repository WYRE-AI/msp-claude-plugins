# Skill Quality Checklist

Use this checklist to validate skills before submission. It reflects the
context-engineering guidance for Claude 5-generation models: skills are
loaded on demand, so every line should either teach a concept, shape a
workflow, or document a gotcha.

## Structure

- [ ] SKILL.md file exists in `skills/skill-name/` directory
- [ ] Frontmatter includes `name`, `description`, and `when_to_use`
- [ ] `description` states what the skill covers; `when_to_use` states
      trigger conditions and keywords — no duplicated content between them
- [ ] No `triggers:` array (trigger phrases belong in `when_to_use`)
- [ ] `## Anti-triggers` present where a sibling or adjacent-vendor skill
      is genuinely confusable, and absent where it would only negate
      `when_to_use`; every bullet names the skill to load instead
- [ ] SKILL.md is under ~350 lines; exhaustive reference material
      (full field tables, complete error catalogs, long request/response
      examples) lives in `references/*.md` and is linked from the
      relevant section

## Content Quality

- [ ] Overview is brief — one paragraph on the domain and its MSP use
- [ ] Content focuses on what Claude can't infer on its own: domain
      concepts, non-obvious constraints, workflow ordering, gotchas
- [ ] No generic filler ("test before deploying", "use meaningful
      names") — if a Best Practices bullet applies to every vendor,
      cut it
- [ ] Each instruction appears once — no repetition for emphasis, no
      ALL-CAPS warnings unless the operation destroys data or money
- [ ] Enums and status codes are in compact tables
- [ ] API examples show the request shapes that aren't guessable
      (auth quirks, pagination casing, filter syntax)
- [ ] Errors documented with cause and resolution, error codes where
      applicable
- [ ] Sections that would only hold boilerplate are omitted entirely

## Security

- [ ] No hardcoded credentials
- [ ] No real customer data in examples
- [ ] API keys referenced via environment variables
- [ ] Sensitive fields marked appropriately

## Accuracy

- [ ] API examples validated against documentation
- [ ] Tested with actual API (if access available)
- [ ] Version compatibility noted

## Final Review

- [ ] Spell-checked
- [ ] Links to `references/*.md` files resolve
- [ ] Related Skills section only present if the links genuinely route
      somewhere useful
