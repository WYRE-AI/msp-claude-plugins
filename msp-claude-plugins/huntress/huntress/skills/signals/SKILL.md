---
name: "Huntress Signals"
description: >
  Huntress security signals: how signals differ from incidents, the signal
  types, listing and filtering by organization, and the threat-hunting and
  pattern-analysis workflows built on signal data.
when_to_use: >-
  When monitoring, filtering, or investigating Huntress signals, or hunting for threat
  patterns across managed endpoints. Use when: huntress signal, security signal, threat
  signal, detection signal, or signal investigation.
---

# Huntress Signals

## Overview

Signals are security-relevant events detected by Huntress agents on managed endpoints. Not all signals become incidents — they represent the raw detection layer that feeds into Huntress SOC analysis. Monitoring signals provides visibility into the threat landscape before incidents are formally created.

## Key Concepts

### Signals vs Incidents

- **Signals** are raw detections from endpoint agents
- **Incidents** are confirmed threats escalated by the Huntress SOC
- Many signals are benign or informational; only confirmed threats become incidents
- Reviewing signals provides early warning and proactive threat hunting context

### Signal Types

Signals cover various detection categories including:
- Suspicious process execution
- Persistence mechanism changes
- Network connection anomalies
- File system modifications
- Registry changes

## API Patterns

### List Signals

```
huntress_signals_list
```

Parameters:
- `organization_id` — Filter by organization
- `page_token` — Pagination token

**Example response:**

```json
{
  "signals": [
    {
      "id": "sig-555",
      "type": "suspicious_process",
      "description": "PowerShell execution with encoded command",
      "organization_id": "org-456",
      "hostname": "ACME-WS-042",
      "severity": "medium",
      "created_at": "2026-02-26T14:00:00Z"
    }
  ],
  "next_page_token": "eyJwYWdlIjoyfQ=="
}
```

### Get Signal Details

```
huntress_signals_get
```

Parameters:
- `signal_id` — The signal ID

**Example response:**

```json
{
  "signal": {
    "id": "sig-555",
    "type": "suspicious_process",
    "description": "PowerShell execution with encoded command",
    "organization_id": "org-456",
    "hostname": "ACME-WS-042",
    "severity": "medium",
    "created_at": "2026-02-26T14:00:00Z",
    "details": {
      "process_name": "powershell.exe",
      "command_line": "powershell.exe -EncodedCommand ...",
      "parent_process": "cmd.exe",
      "user": "ACME\\jsmith"
    }
  }
}
```

## Common Workflows

### Proactive Signal Monitoring

1. List recent signals with `huntress_signals_list`
2. Filter by organization for client-specific views
3. Review signal types and severity distribution
4. Investigate unusual patterns or high-severity signals
5. Correlate with known incidents

### Signal Investigation

1. Get signal details with `huntress_signals_get`
2. Review process chain and command details
3. Check if related incidents exist
4. Assess whether the signal indicates a genuine threat
5. If concerning, check for related signals on the same host

### Threat Pattern Analysis

1. List signals across all organizations
2. Group by type and severity
3. Identify trending signal types
4. Detect patterns that may indicate widespread attacks
5. Proactively alert affected clients

## Error Handling

### Signal Not Found

**Cause:** Invalid signal ID or signal has been archived
**Solution:** List signals to verify available IDs

### Large Result Sets

**Cause:** Unfiltered signal queries return many results
**Solution:** Use organization filters and pagination; signals are high-volume

## Best Practices

- Use signals for proactive threat hunting, not just reactive incident response
- Filter by organization to manage volume
- Correlate signals with incidents for complete threat context
- Monitor signal trends to detect emerging threats early
- Don't treat every signal as an incident — trust the Huntress SOC triage process
- Use signal data in client security reports for added value

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Pagination for high-volume data
- [incidents](../incidents/SKILL.md) - Incidents created from signals
- [agents](../agents/SKILL.md) - Agents generating signals
- [organizations](../organizations/SKILL.md) - Organization context for signals
