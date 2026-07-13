---
description: Generate a Huntress billing summary for a period
argument-hint: "[report_id] [include_summary]"
arguments: [report_id, include_summary]
---

# Billing Report

Generate a billing summary showing per-organization agent counts and optionally include a security summary report. Useful for MSP invoicing and client QBR preparation.

## Prerequisites

- Huntress MCP server connected with valid API credentials
- MCP tools `huntress_billing_reports_list`, `huntress_billing_reports_get`, `huntress_summary_reports_list`, and `huntress_summary_reports_get` available

## Steps

1. **List available billing reports**

   Call `huntress_billing_reports_list` to see available periods. If `report_id` is specified, skip to step 2.

2. **Get billing report**

   Call `huntress_billing_reports_get` for the specified or most recent report. Extract per-organization agent counts.

3. **Optionally get summary report**

   If `include_summary` is true, call `huntress_summary_reports_get` for the same period to include incident and escalation counts.

4. **Compile billing summary**

   Present: total agents, per-organization breakdown, agent count trends, and security summary if included.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| report_id | string | No | latest | Specific billing report ID |
| include_summary | boolean | No | true | Include security summary report |

## Examples

### Latest Billing Report

```
/billing-report
```

### Specific Period Report

```
/billing-report --report_id "bill-2026-02"
```

### Billing Only (No Security Summary)

```
/billing-report --include_summary false
```

## Error Handling

- **Report Not Found:** Check available reports with the list endpoint; report may not be generated yet
- **No Reports Available:** New accounts may not have billing reports yet
- **Authentication Error:** Verify API credentials

## Related Commands

- `/org-health` - Detailed health check per organization
- `/agent-inventory` - Verify agent counts match billing
- `/incident-triage` - Review incidents referenced in summary
