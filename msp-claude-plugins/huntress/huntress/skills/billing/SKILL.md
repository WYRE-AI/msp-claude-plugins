---
name: "Huntress Billing"
description: >
  Huntress billing and summary reports: what each report type contains, the
  list/get tools for both, and the monthly reconciliation, QBR security
  summary, and cost-analysis workflows an MSP builds from them.
when_to_use: >-
  When pulling Huntress billing or summary reports for invoicing, reconciliation, or a
  client-facing security summary. Use when: huntress
  billing, huntress report, billing report, summary report, client invoice, or msp billing.
---

# Huntress Billing & Reports

## Overview

Huntress provides billing and summary reports for MSP partners. Billing reports detail per-organization agent counts for invoicing, while summary reports provide security posture overviews for client-facing communications.

## Key Concepts

### Billing Reports

Billing reports show agent counts per organization for a billing period. Use these for client invoicing and cost reconciliation.

### Summary Reports

Summary reports provide security posture overviews including incidents detected, escalations raised, and overall threat landscape — ideal for client QBRs and monthly security reviews.

## API Patterns

### List Billing Reports

```
huntress_billing_reports_list
```

Parameters:
- `page_token` — Pagination token

**Example response:**

```json
{
  "billing_reports": [
    {
      "id": "bill-2026-02",
      "period": "2026-02",
      "generated_at": "2026-03-01T00:00:00Z",
      "total_agents": 1250,
      "organization_count": 45
    }
  ],
  "next_page_token": null
}
```

### Get Billing Report

```
huntress_billing_reports_get
```

Parameters:
- `report_id` — The billing report ID

**Example response:**

```json
{
  "billing_report": {
    "id": "bill-2026-02",
    "period": "2026-02",
    "organizations": [
      {
        "id": "org-456",
        "name": "Acme Corporation",
        "agent_count": 150
      },
      {
        "id": "org-789",
        "name": "TechStart Inc",
        "agent_count": 75
      }
    ],
    "total_agents": 1250
  }
}
```

### List Summary Reports

```
huntress_summary_reports_list
```

Parameters:
- `page_token` — Pagination token

### Get Summary Report

```
huntress_summary_reports_get
```

Parameters:
- `report_id` — The summary report ID

**Example response:**

```json
{
  "summary_report": {
    "id": "sum-2026-02",
    "period": "2026-02",
    "total_incidents": 23,
    "total_escalations": 5,
    "incidents_by_severity": {
      "critical": 2,
      "high": 8,
      "low": 13
    },
    "top_threat_categories": [
      "Persistent Footholds",
      "Malicious Scripts",
      "Unauthorized Access"
    ]
  }
}
```

## Common Workflows

### Monthly Billing Reconciliation

1. List billing reports with `huntress_billing_reports_list`
2. Get the current period's report
3. Compare agent counts per organization with expected counts
4. Flag discrepancies for review
5. Generate invoices based on per-org agent counts

### Client Security Summary (QBR)

1. Get summary report for the review period
2. Get billing report for agent counts
3. List incidents filtered by organization
4. Compile per-client security posture summary
5. Present: agents protected, threats detected, incidents resolved

### Cost Analysis

1. Pull billing reports for multiple periods
2. Track agent count trends per organization
3. Identify growing or shrinking clients
4. Forecast billing for upcoming periods

## Error Handling

### Report Not Found

**Cause:** Report for the specified period hasn't been generated yet
**Solution:** Check available reports with the list endpoint first

### No Reports Available

**Cause:** Account is new or billing hasn't been processed yet
**Solution:** Reports are typically generated monthly; wait for the billing cycle

## Best Practices

- Pull billing reports at the start of each month for invoicing
- Use summary reports for client-facing communications
- Track agent count trends for capacity planning
- Cross-reference billing reports with PSA contract terms
- Archive reports for historical trend analysis
- Combine billing and summary reports for comprehensive QBR materials

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Pagination and authentication
- [organizations](../organizations/SKILL.md) - Organization details for billing context
- [incidents](../incidents/SKILL.md) - Incident data for summary reports
- [agents](../agents/SKILL.md) - Agent counts for billing verification
