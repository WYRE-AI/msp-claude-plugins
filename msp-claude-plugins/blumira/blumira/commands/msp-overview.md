---
description: MSP dashboard showing all managed accounts with open finding counts and severity breakdown
argument-hint: "[severity]"
arguments: [severity]
---

# MSP Overview

## Prerequisites

- Valid Blumira MSP-level JWT token configured
- MSP account with managed client organizations

## Steps

1. Call `blumira_msp_accounts_list` to enumerate all managed accounts
2. Call `blumira_msp_findings_all` with `status.eq=10` to get all open findings across accounts
3. Group findings by account, then by severity within each account
4. Present a dashboard table:
   - Account name
   - Total open findings
   - CRITICAL / HIGH / MEDIUM / LOW counts
5. Sort accounts by risk (most critical findings first)
6. Highlight accounts that need immediate attention

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| severity | string | No | Filter to specific severity level |

## Examples

### Basic Usage

```
/msp-overview
```

### Critical Findings Only

```
/msp-overview --severity CRITICAL
```

## Error Handling

- **Not an MSP account:** Suggest using org-level commands instead
- **No managed accounts:** Verify MSP credentials and account setup
- **Timeout on large MSP:** Narrow with severity filter

## Related Commands

- `/finding-triage` - Triage findings for a specific account
- `/security-posture` - Detailed posture for a single org
- `/agent-inventory` - Device coverage across accounts
