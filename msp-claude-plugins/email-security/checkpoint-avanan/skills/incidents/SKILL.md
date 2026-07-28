---
name: "Checkpoint Avanan Incidents"
description: >
  Checkpoint Harmony Email & Collaboration (Avanan) incident management:
  incident lifecycle and status transitions, severity levels, investigation
  and remediation workflows, notes and evidence collection, and the incident
  field reference for email security events.
when_to_use: >-
  When investigating, triaging, or managing the lifecycle of a Checkpoint Harmony
  Email security incident. Use when: checkpoint incident, avanan incident, email
  security incident, incident investigation, incident response, incident triage,
  incident status, incident escalation, incident notes, incident evidence, incident
  remediation, security incident email, incident closure, or incident timeline.
---

# Checkpoint Harmony Email Incident Investigation

## Overview

Checkpoint Harmony Email & Collaboration (Avanan) provides an incident management system for tracking and investigating email security events. Incidents are created when threats require coordinated investigation and response beyond simple quarantine actions. This skill covers the full incident lifecycle from creation through investigation, remediation, and closure.

## Incident Status Codes

| Status ID | Name | Description | Business Logic |
|-----------|------|-------------|----------------|
| **NEW** | New | Newly created incident | Default for auto-generated incidents |
| **TRIAGING** | Triaging | Under initial assessment | Analyst evaluating scope and severity |
| **INVESTIGATING** | Investigating | Active investigation underway | Evidence being collected and analyzed |
| **REMEDIATING** | Remediating | Threat confirmed, remediation in progress | Containment and cleanup actions active |
| **WAITING** | Waiting on Info | Waiting for additional information | Pending customer/vendor response |
| **ESCALATED** | Escalated | Escalated to senior analyst or vendor | Requires higher-tier expertise |
| **RESOLVED** | Resolved | Investigation complete, threat remediated | All remediation actions completed |
| **CLOSED** | Closed | Incident closed after review | Final documentation complete |
| **FALSE_POSITIVE** | False Positive | Determined not to be a real threat | Detection was incorrect |

### Status Transition Rules

```
NEW ──────────────────────────────────> CLOSED
 │                                        ↑
 ↓                                        │
TRIAGING ─────────────────────────────> FALSE_POSITIVE
 │                                        ↑
 ↓                                        │
INVESTIGATING ────────────────────────>───┤
 │         │                              │
 │         ↓                              │
 │    WAITING ──────> INVESTIGATING       │
 │                                        │
 ↓                                        │
REMEDIATING ──────────────────────────> RESOLVED ──> CLOSED
 │
 ↓
ESCALATED ──────> INVESTIGATING ──────> REMEDIATING
```

**Validation Rules:**
- RESOLVED requires remediation summary
- CLOSED requires final review notes
- FALSE_POSITIVE requires justification
- ESCALATED requires escalation reason
- REMEDIATING requires at least one remediation action logged

## Incident Severity Levels

| Severity | Name | Response SLA | Description | Examples |
|----------|------|-------------|-------------|---------|
| **P1** | Critical | 1 hour | Active data breach or widespread compromise | ATO with data exfiltration, ransomware delivery |
| **P2** | High | 4 hours | Confirmed targeted attack or limited compromise | Successful phishing, BEC with financial impact |
| **P3** | Medium | 24 hours | Detected threat, no confirmed compromise | Quarantined phishing campaign, blocked malware |
| **P4** | Low | 72 hours | Minor security event, informational | Spam campaign, policy violation, anomaly |

## Complete Incident Field Reference

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `incidentId` | string | Unique incident identifier |
| `title` | string | Brief incident summary |
| `description` | string | Detailed incident description |
| `status` | string | Current status (see codes above) |
| `severity` | string | P1, P2, P3, P4 |
| `assignedTo` | string | Analyst assigned to the incident |
| `createdDate` | datetime | When incident was created |
| `modifiedDate` | datetime | Last modification timestamp |

### Classification Fields

| Field | Type | Description |
|-------|------|-------------|
| `category` | string | PHISHING, MALWARE, BEC, ATO, DLP, OTHER |
| `subcategory` | string | More specific classification |
| `attackVector` | string | EMAIL_ATTACHMENT, EMAIL_LINK, EMAIL_CONTENT, ACCOUNT_COMPROMISE |
| `source` | string | AUTO_DETECTED, USER_REPORTED, ADMIN_CREATED |
| `affectedUsers` | string[] | List of affected user email addresses |
| `affectedUserCount` | int | Number of affected users |

### Related Entity Fields

| Field | Type | Description |
|-------|------|-------------|
| `relatedThreats` | string[] | Threat IDs associated with this incident |
| `relatedQuarantineEntries` | string[] | Quarantine entry IDs |
| `relatedPolicies` | string[] | Policies that triggered |
| `iocs` | object[] | Indicators of compromise collected |

### Resolution Fields

| Field | Type | Description |
|-------|------|-------------|
| `remediationSummary` | string | Summary of remediation actions taken |
| `remediationActions` | object[] | List of actions with timestamps |
| `rootCause` | string | Root cause analysis |
| `lessonsLearned` | string | Post-incident lessons learned |
| `falsePositiveReason` | string | Justification if marked false positive |
| `resolvedDate` | datetime | When marked as resolved |
| `closedDate` | datetime | When incident was closed |

## MCP Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `avanan_incidents_list` | List incidents with filters | `startDate`, `endDate`, `status`, `severity`, `category`, `limit`, `offset` |
| `avanan_incidents_get` | Get detailed incident information | `incidentId` |
| `avanan_incidents_create` | Create a new incident | `title`, `description`, `severity`, `category`, `relatedThreats` |
| `avanan_incidents_update` | Update incident status and fields | `incidentId`, `status`, `severity`, `assignedTo`, etc. |
| `avanan_incidents_add_note` | Add investigation note to incident | `incidentId`, `note`, `noteType`, `visibility` |
| `avanan_incidents_add_evidence` | Attach evidence to incident | `incidentId`, `evidenceType`, `data`, `description` |
| `avanan_incidents_list_notes` | List all notes for an incident | `incidentId` |
| `avanan_incidents_timeline` | Get incident activity timeline | `incidentId` |
| `avanan_incidents_stats` | Get incident statistics | `startDate`, `endDate`, `groupBy` |

### Tool Usage Examples

**List open critical incidents:**
```json
{
  "tool": "avanan_incidents_list",
  "parameters": {
    "status": "NEW,TRIAGING,INVESTIGATING,REMEDIATING",
    "severity": "P1",
    "limit": 50
  }
}
```

**Create incident from detected threat:**
```json
{
  "tool": "avanan_incidents_create",
  "parameters": {
    "title": "Targeted phishing campaign against finance team",
    "description": "Multiple phishing emails detected targeting finance@company.com with credential harvesting links impersonating DocuSign.",
    "severity": "P2",
    "category": "PHISHING",
    "relatedThreats": ["threat-abc123", "threat-def456"]
  }
}
```

**Add investigation note:**
```json
{
  "tool": "avanan_incidents_add_note",
  "parameters": {
    "incidentId": "inc-abc123",
    "note": "Confirmed 3 users clicked the phishing link. Password resets initiated for all 3 accounts. Checking for signs of credential use.",
    "noteType": "INVESTIGATION",
    "visibility": "INTERNAL"
  }
}
```

**Update incident to resolved:**
```json
{
  "tool": "avanan_incidents_update",
  "parameters": {
    "incidentId": "inc-abc123",
    "status": "RESOLVED",
    "remediationSummary": "All phishing emails quarantined. 3 affected users had passwords reset. No evidence of credential use. Sender domain added to block list."
  }
}
```

## Common Workflows

### Incident Triage Workflow

1. **Review new incident** - Read title, description, severity, related threats
2. **Assess initial severity:**
   - How many users affected?
   - What threat type?
   - Any evidence of user interaction (clicks, downloads)?
3. **Set status to TRIAGING**
4. **Assign to appropriate analyst** based on severity and expertise
5. **Add initial triage note** documenting assessment
6. **Escalate if needed** - P1 incidents require immediate escalation

### Investigation Workflow

1. **Set status to INVESTIGATING**
2. **Collect evidence:**
   - Email headers and content
   - URL analysis results
   - Attachment sandbox results
   - User activity logs
3. **Determine scope:**
   - Search for related threats across all users
   - Check if attack is part of a broader campaign
   - Identify all affected users
4. **Extract and document IOCs:**
   - Malicious URLs, domains, IPs
   - File hashes
   - Sender addresses
5. **Add investigation notes** documenting each finding
6. **Determine if remediation is needed**

### Remediation Workflow

1. **Set status to REMEDIATING**
2. **Containment actions:**
   - Quarantine all related emails
   - Block malicious sender/domain
   - Disable compromised accounts (if ATO)
3. **Eradication actions:**
   - Reset passwords for affected users
   - Revoke active sessions
   - Remove malicious inbox rules
4. **Recovery actions:**
   - Re-enable accounts after securing
   - Restore legitimate emails if over-quarantined
   - Update security policies to prevent recurrence
5. **Log each remediation action** with timestamps
6. **Set status to RESOLVED** with remediation summary

### Post-Incident Review Workflow

1. **Review incident timeline** from creation to resolution
2. **Document root cause** - How did the threat bypass initial defenses?
3. **Document lessons learned:**
   - What worked well in the response?
   - What could be improved?
   - Are policy changes needed?
4. **Update policies** based on findings
5. **Set status to CLOSED** with final notes

## Note Types

| Type | Code | Description | Visibility |
|------|------|-------------|------------|
| **Triage** | `TRIAGE` | Initial assessment notes | Internal |
| **Investigation** | `INVESTIGATION` | Investigation findings | Internal |
| **Remediation** | `REMEDIATION` | Actions taken | Internal |
| **Communication** | `COMMUNICATION` | Stakeholder updates | Internal or External |
| **Review** | `REVIEW` | Post-incident review notes | Internal |

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid status transition | Check allowed transitions in diagram above |
| 400 | Missing required field | RESOLVED requires remediationSummary |
| 401 | Unauthorized | Check API credentials and token expiry |
| 403 | Insufficient permissions | API key needs incident management scope |
| 404 | Incident not found | Verify incident ID exists |
| 409 | Incident locked | Another analyst is editing the incident |
| 422 | Invalid severity | Use P1, P2, P3, or P4 |
| 429 | Rate limited | Implement exponential backoff |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Status transition not allowed | Invalid state change | Follow transition diagram |
| Remediation summary required | Resolving without summary | Add remediationSummary field |
| False positive reason required | Marking FP without justification | Add falsePositiveReason field |
| Escalation reason required | Escalating without reason | Add escalation note first |

## Best Practices

1. **Triage within SLA** - Acknowledge and assess incidents within the severity SLA
2. **Document as you go** - Add notes at each investigation step, not just at the end
3. **Use structured notes** - Include timestamps, findings, and next steps in each note
4. **Escalate early** - If uncertain about severity, escalate rather than under-classify
5. **Track all remediation actions** - Every action should be logged with timestamp
6. **Coordinate with affected users** - Keep them informed without revealing sensitive details
7. **Link related incidents** - Campaigns may span multiple incidents
8. **Conduct post-incident reviews** - Even for minor incidents, document lessons learned
9. **Update playbooks** - Incorporate new findings into investigation procedures
10. **Maintain chain of custody** - Evidence handling should be documented for potential legal action

## Related Skills

- [Checkpoint Quarantine](../quarantine/SKILL.md) - Quarantine management
- [Checkpoint Threats](../threats/SKILL.md) - Threat detection and analysis
- [Checkpoint Policies](../policies/SKILL.md) - Policy management
- [Checkpoint API Patterns](../api-patterns/SKILL.md) - Authentication and API usage
