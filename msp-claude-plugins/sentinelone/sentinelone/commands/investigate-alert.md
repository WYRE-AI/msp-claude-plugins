---
description: Deep investigation of a specific SentinelOne alert with timeline and context
argument-hint: "<alert_id>"
arguments: [alert_id]
---

# Investigate SentinelOne Alert

Perform a deep investigation of a specific alert. Retrieves full alert details, analyst notes, change history, and optionally uses Purple AI to investigate the threat context and generate follow-up hunting queries.

## Prerequisites

- SentinelOne Purple MCP server connected with a valid Service User token
- MCP tools `get_alert`, `get_alert_notes`, `get_alert_history`, and `purple_ai` available
- Token must be Account or Site level (NOT Global)
- A valid alert ID (obtain from `/alert-triage` or `list_alerts`)

## Steps

1. **Get alert details**

   Call `get_alert` with the provided `alertId` to retrieve the full alert record including threat name, severity, status, affected endpoint, MITRE ATT&CK mappings, and indicators of compromise.

2. **Get alert notes**

   Call `get_alert_notes` with the `alertId` to retrieve any existing analyst comments or investigation notes.

3. **Get alert history**

   Call `get_alert_history` with the `alertId` to retrieve the complete timeline of status changes, assignments, and updates.

4. **Investigate with Purple AI** (optional but recommended)

   Call `purple_ai` with a natural language query based on the alert details. For example: "Investigate [threat name] on endpoint [endpoint name] -- what is the attack chain and are there related indicators?"

5. **Present investigation summary**

   Combine all data into a structured investigation report with alert context, timeline, MITRE mappings, and recommended next steps.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| alert_id | string | Yes | - | The SentinelOne alert ID to investigate |

## Examples

### Basic Investigation

```
/investigate-alert --alert_id "1234567890"
```

### Investigate from Triage

```
# First, triage alerts:
/alert-triage

# Then investigate a specific alert from the results:
/investigate-alert --alert_id "1234567890"
```

## Output

### Full Investigation Report

```
SentinelOne Alert Investigation
================================================================
Alert ID:    1234567890
Name:        Suspicious PowerShell Execution
Severity:    HIGH
Status:      NEW
Detected:    2026-02-24T08:15:00.000Z
View Type:   ALL

Affected Asset:
  Endpoint:  ACME-WS-042
  Site:      Acme Corporation
  OS:        Windows 11 Enterprise
  User:      jsmith

Description:
  PowerShell process executed an encoded command that downloads and
  executes a remote payload from an external IP address.

MITRE ATT&CK Techniques:
  - T1059.001 - Command and Scripting Interpreter: PowerShell
  - T1027 - Obfuscated Files or Information
  - T1105 - Ingress Tool Transfer

Indicators of Compromise:
  - IP: 203.0.113.42 (destination)
  - SHA256: a1b2c3d4e5f6...
  - Command: powershell.exe -enc aQBlAHgA...

Alert Timeline:
+---------------------------+------------------+----------------------------------------+
| Timestamp                 | Action           | Details                                |
+---------------------------+------------------+----------------------------------------+
| 2026-02-24T08:15:00.000Z | CREATED          | Alert created by detection engine       |
| 2026-02-24T08:15:01.000Z | SEVERITY_SET     | Severity set to HIGH                   |
+---------------------------+------------------+----------------------------------------+

Analyst Notes:
  (No notes yet)

Purple AI Analysis:
  This alert indicates a multi-stage attack:
  1. PowerShell was launched with a Base64-encoded command
  2. The decoded command downloads a payload from 203.0.113.42
  3. The payload is executed in memory (fileless technique)

  This is consistent with:
  - Initial access via phishing or compromised website
  - Execution via PowerShell with obfuscation
  - C2 communication to external infrastructure

  Suggested PowerQuery for further investigation:
  EventType = "IP Connect" AND SrcProcName = "powershell.exe" AND
  DstIP = "203.0.113.42"
  | columns EndpointName, SrcProcCmdLine, DstPort, EventTime
  | sort -EventTime
  | limit 100

Recommended Actions:
  1. Execute the suggested PowerQuery to check for other affected endpoints:
     /hunt-threat --description "Find all connections to 203.0.113.42"
  2. Check if other endpoints in Acme Corporation have similar alerts:
     /alert-triage --severity HIGH
  3. Review the user account (jsmith) for compromise indicators
  4. Check vulnerability status of ACME-WS-042:
     /vuln-report --severity CRITICAL
  5. Escalate to Acme Corporation's IT contact if confirmed threat
================================================================
```

### Alert Not Found

```
Error: Alert not found: "9999999999"

The alert ID does not exist or you do not have access to it.

Suggestions:
  - Verify the alert ID from /alert-triage output
  - Check that your Service User token has access to the alert's site
  - The alert may have been deleted or merged
```

### Minimal Alert (No History or Notes)

```
SentinelOne Alert Investigation
================================================================
Alert ID:    1234567895
Name:        Informational Network Scan Detected
Severity:    LOW
Status:      NEW
Detected:    2026-02-24T09:30:00.000Z

Affected Asset:
  Endpoint:  METRO-WS-021
  Site:      Metro Industries
  OS:        Windows 10 Pro

Description:
  Network scanning activity detected from this endpoint.

MITRE ATT&CK Techniques:
  - T1046 - Network Service Discovery

Indicators of Compromise:
  (None)

Alert Timeline:
  - 2026-02-24T09:30:00.000Z: Alert created

Analyst Notes:
  (No notes)

Purple AI Analysis:
  This is a low-severity informational alert. Network scanning from
  a workstation may indicate legitimate IT activity or vulnerability
  scanning tools. Verify with the user or IT team.

Recommended Actions:
  1. Verify if this is authorized scanning activity
  2. Check if the user (IT team) was running a vulnerability scan
  3. If unauthorized, investigate for reconnaissance activity
================================================================
```

## Error Handling

### MCP Connection Error

```
Error: Unable to connect to SentinelOne Purple MCP server

Check your MCP configuration and verify your Service User token.
Token must be Account or Site level (NOT Global).
```

### Authentication Error

```
Error: 401 Unauthorized

Your Service User token may be invalid or Global-level.
Regenerate at: SentinelOne Console > Policy & Settings > User Management > Service Users
```

### Partial Data

```
Warning: Could not retrieve alert notes or history.

Alert details are available but supplementary data is incomplete.
This may be a temporary issue. Try again in a moment.

Alert details shown below...
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `get_alert` | Retrieve full alert details |
| `get_alert_notes` | Retrieve analyst comments and investigation notes |
| `get_alert_history` | Retrieve timeline of status changes |
| `purple_ai` | Investigate threat context and generate hunting queries |

## Related Commands

- `/alert-triage` - Triage new alerts to find alert IDs
- `/hunt-threat` - Execute threat hunting based on investigation findings
- `/vuln-report` - Check vulnerabilities on affected endpoints
- `/asset-inventory` - Get details on the affected asset
