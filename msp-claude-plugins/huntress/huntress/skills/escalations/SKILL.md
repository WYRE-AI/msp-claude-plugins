---
name: "Huntress Escalations"
description: >
  Huntress SOC escalations: how an escalation differs from an incident,
  escalation priority levels, the list/get/resolve tools, escalation-to-incident
  correlation, and the already-resolved and not-found error cases.
when_to_use: >-
  When reviewing or resolving escalations raised by the Huntress SOC team. Use when:
  huntress escalation, escalation review, escalation resolve, soc escalation, or threat
  escalation.
---

# Huntress Escalations

## Overview

Escalations are high-priority notifications from the Huntress SOC to MSP partners. When the Huntress SOC identifies activity requiring partner attention or action, they create an escalation. MSPs must review escalations promptly and resolve them after taking appropriate action.

## Key Concepts

### Escalation vs Incident

- **Incidents** are confirmed threats with recommended remediations
- **Escalations** are SOC-to-partner communications requiring human review and decision-making
- Escalations may be related to incidents but can also cover other situations

### Escalation Priority

Escalations from the Huntress SOC indicate urgency. Treat all open escalations as time-sensitive communications requiring prompt review.

## API Patterns

### List Escalations

```
huntress_escalations_list
```

Parameters:
- `organization_id` — Filter by organization
- `status` — Filter by status
- `page_token` — Pagination token

**Example response:**

```json
{
  "escalations": [
    {
      "id": "esc-321",
      "title": "Active Ransomware — Immediate Action Required",
      "severity": "critical",
      "status": "open",
      "organization_id": "org-456",
      "created_at": "2026-02-26T09:00:00Z",
      "summary": "Huntress SOC has identified active ransomware encryption on ACME-WS-042. Immediate network isolation recommended."
    }
  ],
  "next_page_token": null
}
```

### Get Escalation Details

```
huntress_escalations_get
```

Parameters:
- `escalation_id` — The escalation ID

**Example response:**

```json
{
  "escalation": {
    "id": "esc-321",
    "title": "Active Ransomware — Immediate Action Required",
    "severity": "critical",
    "status": "open",
    "organization_id": "org-456",
    "created_at": "2026-02-26T09:00:00Z",
    "summary": "Huntress SOC has identified active ransomware encryption on ACME-WS-042. Immediate network isolation recommended.",
    "details": "The Huntress SOC detected file encryption activity consistent with ransomware...",
    "recommended_actions": [
      "Isolate ACME-WS-042 from the network immediately",
      "Check for lateral movement to other endpoints",
      "Preserve forensic evidence before remediation"
    ],
    "related_incidents": ["inc-789"]
  }
}
```

### Resolve Escalation

```
huntress_escalations_resolve
```

Parameters:
- `escalation_id` — The escalation to resolve

## Common Workflows

### Escalation Review

1. List open escalations with `huntress_escalations_list`
2. Prioritize by severity
3. Get full details for each escalation
4. Review recommended actions
5. Take appropriate action (isolate, investigate, notify client)
6. Resolve the escalation

### Escalation-Incident Correlation

1. Get escalation details to find `related_incidents`
2. Investigate related incidents with `huntress_incidents_get`
3. Handle remediations for related incidents
4. Resolve both the incident and escalation

## Error Handling

### Escalation Not Found

**Cause:** Invalid escalation ID
**Solution:** List escalations to verify the correct ID

### Escalation Already Resolved

**Cause:** Attempting to resolve an already-resolved escalation
**Solution:** Check escalation status first

## Best Practices

- Check for new escalations multiple times daily
- Treat all escalations as time-sensitive
- Document actions taken before resolving
- Correlate escalations with related incidents
- Create PSA tickets for client-facing escalations
- Track escalation response times for SLA compliance

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Pagination and error handling
- [incidents](../incidents/SKILL.md) - Related incidents
- [organizations](../organizations/SKILL.md) - Client context
- [agents](../agents/SKILL.md) - Affected endpoints
