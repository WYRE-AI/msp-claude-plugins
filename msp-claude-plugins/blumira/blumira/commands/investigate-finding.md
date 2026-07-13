---
description: Deep investigation of a specific Blumira finding with details, context, and comment history
argument-hint: "<finding_id>"
arguments: [finding_id]
---

# Investigate Finding

## Prerequisites

- Valid Blumira JWT token configured
- A finding ID to investigate

## Steps

1. Call `blumira_findings_get` with the provided finding ID to get basic finding data
2. Call `blumira_findings_details` for enriched context, evidence, and recommended actions
3. Call `blumira_findings_comments_list` to retrieve investigation history
4. Present a comprehensive report including:
   - Finding summary (severity, status, detection rule, timestamps)
   - Detailed evidence and context from the details endpoint
   - Timeline of comments and investigation notes
   - Recommended next steps based on finding type
5. If finding is Open, suggest assignment or resolution actions

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| finding_id | string | Yes | UUID of the finding to investigate |

## Examples

### Basic Usage

```
/investigate-finding --finding_id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

## Error Handling

- **Finding not found:** Verify the ID and suggest using `/finding-triage` to find valid IDs
- **Insufficient permissions:** Check token scope
- **MSP finding:** Suggest using MSP-specific tools with account context

## Related Commands

- `/finding-triage` - Find findings to investigate
- `/resolve-finding` - Resolve after investigation
