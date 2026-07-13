# Skill Generation Prompt

You are creating a Claude skill for MSP tool integration.

## Approved PRD

[Paste the approved PRD]

## API Documentation

[Paste relevant API docs]

## Requirements

1. Follow SKILL.md format with proper frontmatter
2. Include practical examples from MSP workflows
3. Document API patterns with real endpoint examples
4. Cover error handling and edge cases
5. Use MSP-appropriate terminology

## Your Task

Generate a complete SKILL.md file that:
- Teaches Claude about this product/feature
- Includes working API examples
- Covers common MSP scenarios
- Handles errors gracefully

## SKILL.md Template

```markdown
---
name: "[Vendor] [Topic]"
when_to_use: >-
  When [specific action or scenario]. Use when: [keyword 1], [keyword 2],
  or [keyword 3].
description: >
  Use this skill when [trigger conditions]. Include the keyword phrases
  users are likely to say - do NOT add a separate triggers: list.
---

# [Skill Title]

## Overview
Brief description...

## Key Concepts
### Concept 1
...

## API Patterns
### Operation 1
```json
POST /v1.0/endpoint
{...}
```

## Common Workflows
### Workflow 1
1. Step one
2. Step two

## Error Handling
### Error 1
**Cause:** ...
**Solution:** ...

## Best Practices
- Practice 1
- Practice 2
```
