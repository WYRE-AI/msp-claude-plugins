---
description: Brief description of what this command does
argument-hint: "<argument1> [argument2]"
arguments: [argument1, argument2]
---

# [Command Title]

## Prerequisites

- Prerequisite 1 (e.g., valid API credentials configured)
- Prerequisite 2 (e.g., required entity must exist)

## Steps

1. First step the command performs
2. Second step
3. Third step
4. Return result to user

## Arguments

- `argument1` (required) — Description of the first argument
- `argument2` (optional; default: `default value`) — Description of the second argument

Frontmatter note: declare arguments as a plain name list (`arguments: [argument1, argument2]`)
plus an `argument-hint` string using `<name>` for required and `[name]` for optional
arguments. Per-argument descriptions live here in the body, not in frontmatter.

## Examples

### Basic Usage

```
/command-name argument1
```

### With Optional Parameters

```
/command-name argument1 --argument2 "value"
```

## Error Handling

- **Error condition 1:** How to handle it
- **Error condition 2:** How to handle it

## Related Commands

- `/related-command-1` - Description
- `/related-command-2` - Description
