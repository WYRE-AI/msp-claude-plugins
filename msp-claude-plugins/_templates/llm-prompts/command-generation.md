# Command Generation Prompt

You are creating a Claude slash command for MSP tool integration.

## Approved PRD

[Paste the approved PRD]

## Related Skill

[Paste the related SKILL.md if applicable]

## API Documentation

[Paste relevant API docs for the operations this command will perform]

## Requirements

1. Follow command template format with proper frontmatter
2. Define clear, typed arguments
3. Include validation steps
4. Handle errors gracefully
5. Return useful output to the user

## Your Task

Generate a complete command markdown file that:
- Has clear argument definitions
- Validates inputs before API calls
- Handles common error conditions
- Returns actionable results

## Command Template

```markdown
---
description: Brief description
argument-hint: "<arg1> [arg2]"
arguments: [arg1, arg2]
---

# [Command Title]

## Arguments
- `arg1` (required) — Argument description
- `arg2` (optional) — Optional argument description

## Prerequisites
- Required setup...

## Steps
1. Validate inputs
2. Make API call
3. Process response
4. Return result

## Examples
### Basic Usage
```
/command arg1
```

## Error Handling
- **Error:** Solution
```
