---
description: Overall security posture review including open findings by severity, agent coverage, and trends
argument-hint: "[days]"
arguments: [days]
---

# Security Posture

## Prerequisites

- Valid Blumira JWT token configured
- Active findings and agent data in the organization

## Steps

1. Call `blumira_findings_list` with `status.eq=10` to get all open findings
2. Call `blumira_findings_list` with `status.eq=30` and `created.gt=<days ago>` for recent resolutions
3. Call `blumira_agents_devices_list` to get device/agent inventory
4. Compile a posture report:
   - **Open Findings Summary:** Total count, breakdown by severity (CRITICAL/HIGH/MEDIUM/LOW)
   - **Resolution Activity:** Findings resolved in the lookback period, by resolution type
   - **Agent Coverage:** Total devices, active vs inactive, stale agents
   - **Risk Assessment:** Highlight critical gaps (unresolved CRITICAL findings, offline agents)
5. Provide actionable recommendations based on the data

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| days | number | No | Lookback period for trend analysis (default 30) |

## Examples

### Basic Usage

```
/security-posture
```

### 7-Day Review

```
/security-posture --days 7
```

## Error Handling

- **No findings data:** Report clean finding posture, focus on agent coverage
- **No agent data:** Report finding posture only, note agent data unavailable
- **Large dataset:** Use date filters to limit scope

## Related Commands

- `/finding-triage` - Triage the open findings identified in the posture review
- `/agent-inventory` - Detailed device/agent inventory
- `/msp-overview` - MSP-wide posture across all accounts
