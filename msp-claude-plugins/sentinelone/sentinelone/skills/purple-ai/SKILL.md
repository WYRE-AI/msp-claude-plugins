---
name: "SentinelOne Purple AI"
description: >
  The `purple_ai` tool — SentinelOne's natural language investigation assistant over
  the full Singularity telemetry model. Covers how to phrase investigative prompts,
  behavioral anomaly and MITRE ATT&CK TTP analysis, PowerQuery generation, and
  handing generated queries to the `powerquery` tool for execution.
when_to_use: >-
  When starting a SentinelOne investigation from a natural-language question, or generating
  PowerQuery rather than writing it by hand. Use when: sentinelone purple ai, purple ai, threat
  investigation, threat hunting sentinelone, sentinelone investigate, sentinelone natural
  language, sentinelone mitre, sentinelone ttp, powerquery generation, sentinelone behavioral,
  sentinelone anomaly, or purple ai query.
---

# SentinelOne Purple AI

## Overview

Purple AI is SentinelOne's natural language cybersecurity assistant built into the Singularity platform. Through the `purple_ai` MCP tool, you can ask investigative questions in plain English and receive threat analysis, PowerQuery strings for hunting, MITRE ATT&CK TTP mappings, and contextual security intelligence. Purple AI understands the full SentinelOne telemetry model and can reason across endpoints, cloud workloads, identities, and network data.

Purple AI is the primary starting point for any investigation -- describe what you want to find and it will generate the appropriate PowerQuery or provide analysis. It is **read-only** and cannot take any remediation actions.

## Anti-triggers

- **Executing a query you already have.** `purple_ai` writes PowerQuery;
  it does not run it. Hand the generated string to
  `sentinelone-threat-hunting`.
- **Working the existing alert queue.** Purple AI answers open-ended
  questions against telemetry — listing, filtering, or reading notes on
  alerts that already exist is `sentinelone-alerts`.
- **Hunting on non-SentinelOne telemetry.** Purple AI reasons only over
  the Singularity Data Lake. Huntress detections are `huntress-signals`;
  ThreatLocker execution history is `threatlocker-audit-log`.

## MCP Tools

### Available Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `purple_ai` | Natural language cybersecurity assistant | `query` (required) - natural language investigation prompt |

### Using purple_ai

Call `purple_ai` with a natural language `query` describing what you want to investigate:

**Example: Investigate suspicious PowerShell activity:**
- `purple_ai` with `query="Find PowerShell processes that have established network connections to external IP addresses in the last 24 hours"`

**Example: Generate a threat hunting query:**
- `purple_ai` with `query="I need to find evidence of lateral movement using PsExec or WMI across managed endpoints"`

**Example: MITRE ATT&CK analysis:**
- `purple_ai` with `query="What MITRE ATT&CK techniques are associated with recent alert activity?"`

## Key Concepts

### Natural Language Investigation

Purple AI interprets natural language descriptions of threats, behaviors, and investigation goals. The key to effective use is describing **what you want to find**, not how to query for it.

**Good prompts:**
- "Find processes that are connecting to known C2 infrastructure"
- "Show me evidence of credential dumping on Windows endpoints"
- "Are there any endpoints where LSASS memory was accessed by unusual processes?"
- "Find PowerShell scripts that download and execute content from the internet"

**Avoid:**
- "Generate a PowerQuery for..." (Purple AI works better when you describe the threat, not the output format)
- "SELECT * FROM..." (Purple AI does not use SQL)
- Overly generic requests like "Show me everything suspicious"

### PowerQuery Generation

Purple AI frequently returns PowerQuery strings as part of its response. These queries can then be executed against the Singularity Data Lake using the `powerquery` tool. The typical workflow is:

1. Ask Purple AI a natural language question
2. Purple AI returns analysis and one or more PowerQuery strings
3. Execute the PowerQuery with the `powerquery` tool
4. Analyze the results

### MITRE ATT&CK Integration

Purple AI maps threats and behaviors to the MITRE ATT&CK framework:

| Category | Examples |
|----------|---------|
| **Initial Access** | Phishing, drive-by compromise, supply chain |
| **Execution** | PowerShell, command-line, scripting engines |
| **Persistence** | Registry run keys, scheduled tasks, services |
| **Privilege Escalation** | Token manipulation, UAC bypass |
| **Defense Evasion** | Process injection, timestomping, obfuscation |
| **Credential Access** | LSASS dump, Kerberoasting, brute force |
| **Discovery** | Network scanning, account enumeration |
| **Lateral Movement** | PsExec, WMI, RDP, SMB |
| **Collection** | Data staging, clipboard capture |
| **Command & Control** | Beaconing, DNS tunneling, encrypted channels |
| **Exfiltration** | Data compression, exfil over C2 |
| **Impact** | Encryption (ransomware), data destruction |

### What Purple AI Is NOT For

Purple AI is an investigative assistant. It does **not**:
- Modify alert status or assignments
- Quarantine or isolate endpoints
- Block threats or take response actions
- Replace the `list_alerts`, `get_alert`, or other specific tools for structured data retrieval
- Execute PowerQuery -- use the `powerquery` tool for execution

For active alert management, use the alert tools (`list_alerts`, `get_alert`, etc.). For running queries against the Data Lake, use the `powerquery` tool.

## Common Investigation Queries

### Endpoint Threats

| Investigation | Purple AI Query |
|--------------|----------------|
| Suspicious PowerShell | "Find PowerShell processes connecting to external IP addresses on non-standard ports" |
| LOLBIN Activity | "Show me Living-off-the-Land Binary activity like certutil, mshta, or regsvr32 downloading files" |
| Process Lineage | "Trace the parent process chain for any suspicious child processes of explorer.exe" |
| Ransomware Indicators | "Find evidence of mass file encryption or modification of shadow copies" |
| Fileless Malware | "Detect processes running entirely from memory without a backing file on disk" |

### Lateral Movement

| Investigation | Purple AI Query |
|--------------|----------------|
| PsExec Usage | "Detect PsExec or similar remote execution tools being used across the network" |
| WMI Remote Exec | "Find WMI-based remote process creation events" |
| RDP Anomalies | "Show unusual RDP connections, especially from endpoints that don't normally use RDP" |
| SMB Lateral | "Find SMB connections followed by service creation on remote hosts" |
| Pass-the-Hash | "Detect NTLM authentication attempts that may indicate pass-the-hash attacks" |

### Credential Access

| Investigation | Purple AI Query |
|--------------|----------------|
| LSASS Access | "Find processes accessing LSASS memory, excluding known legitimate tools" |
| Kerberoasting | "Detect Kerberos TGS requests for service accounts that may indicate Kerberoasting" |
| Credential Files | "Find access to files commonly containing credentials like SAM, NTDS.dit, or browser credential stores" |
| Brute Force | "Show accounts with failed login attempts exceeding 10 in the last hour" |

### Command & Control

| Investigation | Purple AI Query |
|--------------|----------------|
| Beaconing | "Detect periodic outbound connections that may indicate C2 beaconing behavior" |
| DNS Tunneling | "Find DNS queries with unusually long subdomain names or high query volumes to a single domain" |
| Encoded Traffic | "Show processes making HTTPS connections to recently registered domains" |
| Non-Standard Ports | "Find outbound connections on unusual ports from common applications" |

### Data Exfiltration

| Investigation | Purple AI Query |
|--------------|----------------|
| Large Transfers | "Detect large outbound data transfers exceeding 100MB to external destinations" |
| Archive Creation | "Find creation of compressed archives (zip, rar, 7z) followed by network activity" |
| Cloud Upload | "Show uploads to cloud storage services like Dropbox, Google Drive, or OneDrive from unauthorized endpoints" |
| Staging | "Detect files being copied to a common staging directory before exfiltration" |

### Phishing

| Investigation | Purple AI Query |
|--------------|----------------|
| Phishing Artifacts | "Find Outlook or browser processes spawning PowerShell, cmd, or script interpreters" |
| Macro Execution | "Detect Office applications launching child processes that indicate macro execution" |
| Link Clicks | "Show browser navigations to newly registered or low-reputation domains from email link clicks" |

## Response Examples

**Purple AI Response (PowerQuery Generated):**

```
Based on your investigation, I've generated a PowerQuery to find PowerShell
processes with external network connections:

EventType = "IP Connect" AND SrcProcName = "powershell.exe" AND
NetConnStatus = "SUCCESS" AND NOT DstIP In ("10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16")
| columns EndpointName, SrcProcName, SrcProcCmdLine, DstIP, DstPort, EventTime
| sort -EventTime
| limit 100

This query looks for:
- Process: powershell.exe
- Event: Successful IP connections
- Destination: External IPs (excluding RFC 1918 private ranges)

MITRE ATT&CK Mapping:
- T1059.001 - Command and Scripting Interpreter: PowerShell
- T1071 - Application Layer Protocol
```

**Purple AI Response (Analysis):**

```
Based on the alert data, this activity is consistent with a multi-stage
attack chain:

1. Initial Access: Phishing email with malicious attachment (T1566.001)
2. Execution: Word document macro launching PowerShell (T1059.001)
3. Defense Evasion: Base64-encoded commands (T1027)
4. C2: Beaconing to external IP 203.0.113.42 every 60 seconds (T1071.001)

Recommended next steps:
- Investigate the source email and other recipients
- Check for lateral movement from the affected endpoint
- Review the PowerShell command line for IOCs
- Check if the C2 IP appears on other endpoints
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Empty response | Query too vague | Be more specific about the threat or behavior you're investigating |
| Authentication error | Invalid token | Verify Service User token is Account or Site level |
| Timeout | Complex query or overloaded system | Simplify the query or try again later |
| No matching data | No telemetry matching the criteria | Widen the time range or adjust the investigation scope |

## Best Practices

1. **Describe the threat, not the query format** - Say "Find PowerShell connecting to external IPs" not "Generate a PowerQuery for PowerShell"
2. **Be specific about behaviors** - Include details like process names, network indicators, or file paths
3. **Include context** - Mention the client, time frame, or related alerts when relevant
4. **Follow up on results** - Use Purple AI iteratively to dig deeper into findings
5. **Execute generated queries** - Always run Purple AI's PowerQuery output through the `powerquery` tool for actual results
6. **Combine with alert tools** - Use Purple AI for investigation, then cross-reference with `list_alerts` or `get_alert` for specific alert context
7. **Map to MITRE** - Ask Purple AI to map findings to MITRE ATT&CK for consistent reporting
8. **Use for QBR preparation** - Generate threat summaries for quarterly business reviews with clients
9. **Think in attack chains** - Investigate related TTPs, not just isolated events
10. **Document investigation steps** - Keep notes on Purple AI queries and findings for incident reports

## Related Skills

- [Threat Hunting](../threat-hunting/SKILL.md) - PowerQuery execution against the Data Lake
- [Alerts](../alerts/SKILL.md) - Structured alert retrieval and triage
- [API Patterns](../api-patterns/SKILL.md) - MCP tools reference and connection info
- [Vulnerabilities](../vulnerabilities/SKILL.md) - Vulnerability context for investigations
- [Inventory](../inventory/SKILL.md) - Asset context for investigations
