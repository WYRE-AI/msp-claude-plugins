---
description: Resolve a Blumira finding with the appropriate resolution type and notes
argument-hint: "<finding_id> <resolution_type> <notes>"
arguments: [finding_id, resolution_type, notes]
---

# Resolve Finding

## Prerequisites

- Valid Blumira JWT token configured
- Finding ID and investigation context

## Steps

1. Call `blumira_findings_get` to confirm the finding exists and review its current status
2. Map the resolution type argument to the numeric code:
   - `valid` → 10
   - `not-applicable` → 20
   - `false-positive` → 30
3. Add an investigation comment with `blumira_findings_comments_add` documenting the resolution rationale
4. Call `blumira_findings_resolve` with the finding ID, resolution type code, and notes
5. Confirm resolution was successful
6. Report the updated finding status

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| finding_id | string | Yes | UUID of the finding to resolve |
| resolution_type | string | Yes | One of: valid, not-applicable, false-positive |
| notes | string | Yes | Explanation of the resolution decision |

## Examples

### Resolve as Valid

```
/resolve-finding --finding_id "a1b2c3d4-..." --resolution_type valid --notes "Confirmed brute force. Source IP blocked."
```

### Resolve as False Positive

```
/resolve-finding --finding_id "a1b2c3d4-..." --resolution_type false-positive --notes "Scheduled backup job triggers this alert."
```

## Error Handling

- **Already resolved:** Report current resolution status
- **Invalid resolution type:** Show valid options (valid, not-applicable, false-positive)
- **Finding not found:** Suggest using `/finding-triage` to find valid IDs

## Related Commands

- `/investigate-finding` - Investigate before resolving
- `/finding-triage` - Find findings that need resolution
