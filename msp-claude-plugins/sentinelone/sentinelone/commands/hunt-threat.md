---
description: Threat hunting via Purple AI and PowerQuery execution
argument-hint: "<description>"
arguments: [description]
---

# Hunt Threat via Purple AI + PowerQuery

Hunt for a specific threat across managed environments using a two-step process: describe the threat in natural language to Purple AI, which generates a PowerQuery, then execute that query against the Singularity Data Lake for results. This is the primary proactive threat hunting workflow for MSPs.

## Prerequisites

- SentinelOne Purple MCP server connected with a valid Service User token
- MCP tools `purple_ai`, `powerquery`, and `get_timestamp_range` available
- Token must be Account or Site level (NOT Global)

## Steps

1. **Describe the threat to Purple AI**

   Call `purple_ai` with the user's natural language `description`. Purple AI will analyze the threat and generate one or more PowerQuery strings.

2. **Extract the generated PowerQuery**

   Parse the PowerQuery string(s) from Purple AI's response.

3. **Check data availability**

   Call `get_timestamp_range` to verify the Data Lake has data covering the desired time period.

4. **Execute the PowerQuery**

   Call `powerquery` with the generated query string. If Purple AI generated multiple queries, execute each one.

5. **Analyze results**

   Review the returned rows for indicators of compromise, affected endpoints, and timeline of events.

6. **Present findings**

   Show the generated query, results, affected clients/endpoints, and recommended follow-up actions.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| description | string | Yes | - | Natural language description of the threat to hunt for |

## Examples

### Hunt for PowerShell Threats

```
/hunt-threat --description "PowerShell processes connecting to external IP addresses on non-standard ports"
```

### Hunt for Lateral Movement

```
/hunt-threat --description "PsExec or WMI-based remote execution across managed endpoints"
```

### Hunt for Credential Access

```
/hunt-threat --description "Processes accessing LSASS memory that are not standard Windows system processes"
```

### Hunt for Ransomware Indicators

```
/hunt-threat --description "Mass file encryption activity or shadow copy deletion"
```

### Hunt for Beaconing

```
/hunt-threat --description "Periodic outbound connections from the same process to the same IP, consistent with C2 beaconing"
```

### Hunt for Specific IOC

```
/hunt-threat --description "Any connections to IP address 203.0.113.42 or domain evil-c2.example.com"
```

## Output

### Threat Found

```
SentinelOne Threat Hunt
================================================================
Description: PowerShell processes connecting to external IP addresses
             on non-standard ports
Time Range:  Last 24 hours
Generated:   2026-02-24

Purple AI Analysis:
  Looking for PowerShell establishing outbound network connections to
  external IPs on ports other than 80 and 443. This pattern may indicate
  command-and-control communication or data exfiltration.

  MITRE ATT&CK Mapping:
  - T1059.001 - PowerShell Execution
  - T1071 - Application Layer Protocol (non-standard port)

Generated PowerQuery:
  EventType = "IP Connect" AND SrcProcName = "powershell.exe" AND
  NetConnStatus = "SUCCESS" AND
  NOT DstIP In ("10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16") AND
  DstPort NOT In (80, 443)
  | columns EndpointName, SiteName, SrcProcCmdLine, DstIP, DstPort, EventTime
  | sort -EventTime
  | limit 100

Results: 3 matches found

+------------------+------------------+-----------------------------------------+---------------+------+---------------------+
| Endpoint         | Client           | Command Line                            | Dest IP       | Port | Time                |
+------------------+------------------+-----------------------------------------+---------------+------+---------------------+
| ACME-WS-042      | Acme Corp        | powershell.exe -enc aQBlAHgA...        | 203.0.113.42  | 4444 | 2026-02-24 08:12    |
| ACME-WS-015      | Acme Corp        | powershell.exe -nop -w hidden -c ...   | 203.0.113.42  | 4444 | 2026-02-24 07:58    |
| TS-WS-003        | TechStart Inc    | powershell.exe IEX(New-Object...)       | 198.51.100.55 | 8443 | 2026-02-24 06:30    |
+------------------+------------------+-----------------------------------------+---------------+------+---------------------+

Findings:
  - 2 endpoints in Acme Corporation connecting to same C2 IP (203.0.113.42:4444)
  - 1 endpoint in TechStart Inc with separate suspicious connection
  - All connections use encoded or hidden PowerShell commands

Recommended Actions:
  1. Investigate Acme Corporation endpoints immediately -- likely active compromise
     /investigate-alert --alert_id <check for related alerts>
  2. Block 203.0.113.42 and 198.51.100.55 at the firewall
  3. Check for additional indicators:
     /hunt-threat --description "All processes connecting to 203.0.113.42"
  4. Notify Acme Corporation and TechStart Inc IT contacts
  5. Review affected user accounts for compromise
================================================================
```

### No Threats Found

```
SentinelOne Threat Hunt
================================================================
Description: Processes accessing LSASS memory that are not standard
             Windows system processes
Time Range:  Last 24 hours
Generated:   2026-02-24

Purple AI Analysis:
  Looking for non-standard processes opening handles to LSASS (Local
  Security Authority Subsystem Service), which may indicate credential
  dumping attempts.

Generated PowerQuery:
  EventType = "Process Creation" AND
  TgtProcCmdLine contains "lsass" AND
  SrcProcName != "svchost.exe" AND SrcProcName != "csrss.exe" AND
  SrcProcName != "services.exe"
  | columns EndpointName, SiteName, SrcProcName, TgtProcCmdLine, User, EventTime
  | sort -EventTime
  | limit 100

Results: 0 matches

No LSASS access from non-standard processes detected in the last 24 hours.
This is a positive finding -- no credential dumping activity observed.

Suggestions:
  - Expand the time range to 7 days for a broader search
  - Check related techniques:
    /hunt-threat --description "Kerberoasting attempts or TGS ticket requests"
    /hunt-threat --description "Access to SAM or NTDS.dit files"
================================================================
```

## Error Handling

### MCP Connection Error

```
Error: Unable to connect to SentinelOne Purple MCP server

Check your MCP configuration and verify your Service User token.
Token must be Account or Site level (NOT Global).
```

### PowerQuery Syntax Error

```
Warning: PowerQuery generated by Purple AI returned a syntax error.

This occasionally happens with complex queries. Trying simplified version...

If the issue persists:
  - Rephrase your threat description
  - Be more specific about what you're looking for
  - Try breaking the hunt into smaller, focused queries
```

### Query Timeout

```
Warning: PowerQuery timed out after 5 minutes.

The query may be too broad. Suggestions:
  - Add a time constraint (default is 24 hours)
  - Be more specific about the threat behavior
  - Add endpoint or client filters to narrow scope
```

### No Data Available

```
Warning: No Data Lake data available for the requested time range.

Call get_timestamp_range to check available data:
  Earliest data: 2026-01-25T00:00:00Z
  Latest data: 2026-02-24T10:00:00Z

Adjust your hunt to fall within the available range.
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `purple_ai` | Generate PowerQuery from natural language threat description |
| `powerquery` | Execute the generated PowerQuery against the Data Lake |
| `get_timestamp_range` | Verify data availability for the time range |

## Related Commands

- `/alert-triage` - Check for related alerts from the same threat
- `/investigate-alert` - Deep-dive into a specific alert found during hunting
- `/vuln-report` - Check if hunted threats exploit known vulnerabilities
- `/asset-inventory` - Get details on endpoints found in hunt results
