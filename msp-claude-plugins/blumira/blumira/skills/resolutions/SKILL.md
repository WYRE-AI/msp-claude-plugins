---
name: "Blumira Resolutions"
description: >
  Use this skill when resolving Blumira findings, choosing the correct
  resolution type, or understanding resolution workflows and their impact
  on security metrics.
when_to_use: >-
  When resolving Blumira findings, choosing the correct resolution type, or understanding
  resolution workflows and their impact on security metrics. Use when: resolution type, resolve
  finding, false positive, valid finding, not applicable, or close finding.
---

# Blumira Resolutions

## Overview

Resolutions are the final disposition applied to findings when closing them. Choosing the correct resolution type is critical for accurate security metrics, detection tuning, and compliance reporting.

## Key Concepts

### Resolution Types

| Code | Label | Description | When to Use |
|------|-------|-------------|-------------|
| 10 | Valid | Confirmed real threat | The finding represents a genuine security event. Action was taken (blocked, remediated, etc.) |
| 20 | Not Applicable | Doesn't apply | The detection is correct but irrelevant to this environment (e.g., policy doesn't apply to test lab) |
| 30 | False Positive | Incorrect detection | The detection fired incorrectly — the activity was benign |

### Impact on Metrics

- **Valid** resolutions count toward your confirmed threat statistics
- **False Positive** resolutions feed back into detection tuning — high FP rates indicate rules that need adjustment
- **Not Applicable** resolutions help identify rules to disable for specific environments

## API Patterns

### List Available Resolutions

```
blumira_resolutions_list
```

Returns all resolution types with their codes, labels, and descriptions.

### Resolve a Finding

```
blumira_findings_resolve
  finding_id=<UUID>
  resolution_type=10
  notes="Confirmed credential stuffing attack from IP 203.0.113.50. Account locked, password reset forced."
```

### MSP Finding Resolution

```
blumira_msp_findings_resolve
  account_id=<UUID>
  finding_id=<UUID>
  resolution_type=30
  notes="False positive - scheduled backup job triggers this detection. Added to allowlist."
```

## Common Workflows

### Choosing the Right Resolution

1. **Is the detected activity real?**
   - Yes → Was it malicious or a policy violation? → **Valid (10)**
   - Yes → But it's expected/allowed in this environment → **Not Applicable (20)**
   - No → The detection was wrong → **False Positive (30)**

2. Always include detailed notes explaining the decision
3. For False Positives, note what the activity actually was to help with tuning

### Bulk Resolution of False Positives

1. `blumira_findings_list` filtered by the specific detection rule
2. Review a sample to confirm all are false positives
3. Resolve each with resolution type 30 and consistent notes
4. Consider requesting a rule tuning in the Blumira portal

## Error Handling

### Invalid Resolution Type

**Cause:** Resolution code is not 10, 20, or 30
**Solution:** Use `blumira_resolutions_list` to confirm valid codes.

### Missing Notes

**Cause:** Some resolution workflows may require notes
**Solution:** Always provide descriptive notes for audit trail purposes.

## Best Practices

- Always provide detailed notes — they're the audit trail for compliance
- Track false positive rates by detection rule to identify tuning opportunities
- Use "Not Applicable" instead of "False Positive" when the detection is correct but the policy doesn't apply
- Review resolution statistics regularly to improve detection quality
- For MSP accounts, maintain consistent resolution standards across tenants

## Related Skills

- [Findings](../findings/SKILL.md) — Finding lifecycle and resolution workflow
- [MSP](../msp/SKILL.md) — Cross-account resolution management
