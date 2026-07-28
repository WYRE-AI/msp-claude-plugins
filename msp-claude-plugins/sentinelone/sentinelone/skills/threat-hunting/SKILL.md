---
name: "SentinelOne Threat Hunting"
description: >
  PowerQuery against the Singularity Data Lake: the Scalyr-based pipeline syntax
  (distinct from SPL, SQL, KQL, and Elasticsearch DSL), the powerquery,
  get_timestamp_range, and iso_to_unix_timestamp tools, time-range and row-limit
  handling, common hunting scenarios, and the Purple AI generation path.
when_to_use: >-
  When running forensic or threat-hunting queries over SentinelOne telemetry, or debugging
  PowerQuery syntax and time ranges. Use when: sentinelone powerquery, sentinelone data lake,
  sentinelone query, sentinelone hunt, threat hunting, powerquery, singularity data lake,
  sentinelone forensic, sentinelone telemetry, sentinelone search, sentinelone log, or scalyr
  query.
---

# SentinelOne PowerQuery / Singularity Data Lake

## Overview

PowerQuery is SentinelOne's query language for searching the Singularity Data Lake -- the centralized telemetry repository containing process events, network connections, file operations, registry changes, and other security-relevant data from all managed endpoints and cloud workloads. For MSPs, PowerQuery is the primary tool for deep forensic analysis, threat hunting, and incident investigation across client environments.

> **IMPORTANT:** PowerQuery is a Scalyr-based pipeline query language. It is **NOT** Splunk SPL, SQL, KQL (Kusto), or Elasticsearch Query DSL. The syntax is fundamentally different. The recommended approach is to use the `purple_ai` tool to generate PowerQuery strings from natural language descriptions, then execute them with the `powerquery` tool.

## MCP Tools

### Available Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `powerquery` | Execute a PowerQuery against the Singularity Data Lake | `query` (required), `fromDate`, `toDate` |
| `get_timestamp_range` | Get the available time range for PowerQuery data | None |
| `iso_to_unix_timestamp` | Convert ISO 8601 timestamp to Unix epoch milliseconds | `timestamp` (required) |

### Execute a PowerQuery

Call `powerquery` with a query string and optional time range:

- **query:** PowerQuery string (required)
- **fromDate:** Start of time range (ISO 8601 or Unix epoch ms)
- **toDate:** End of time range (ISO 8601 or Unix epoch ms)

**Default time range:** Last 24 hours if not specified.

**Example: Find PowerShell network connections:**
- `powerquery` with `query="EventType = \"IP Connect\" AND SrcProcName = \"powershell.exe\" | columns EndpointName, SrcProcCmdLine, DstIP, DstPort | limit 100"`

**Example: With custom time range:**
- `powerquery` with `query="EventType = \"Process Creation\" AND TgtProcName = \"mimikatz.exe\" | limit 50"`, `fromDate="2026-02-23T00:00:00Z"`, `toDate="2026-02-24T00:00:00Z"`

### Get Available Time Range

Call `get_timestamp_range` to determine how far back the Data Lake has data. Returns the earliest and latest available timestamps.

### Convert Timestamps

Call `iso_to_unix_timestamp` to convert ISO 8601 timestamps to Unix epoch milliseconds, which is required by some query parameters.

## Key Concepts

### PowerQuery Syntax

PowerQuery uses a pipeline model with filters, columns, sorting, and aggregation:

```
<filter expression>
| columns <field1>, <field2>, ...
| sort -<field>
| limit <n>
| group <field> calculate count() as cnt
```

### Filter Expressions

Filters use `field operator value` syntax:

| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Equals | `EventType = "Process Creation"` |
| `!=` | Not equals | `SrcProcName != "explorer.exe"` |
| `contains` | Substring match | `TgtProcCmdLine contains "powershell"` |
| `In` | Match list | `DstPort In (80, 443, 8080)` |
| `NOT In` | Exclude list | `NOT DstIP In ("10.0.0.0/8")` |
| `AND` | Logical AND | `EventType = "IP Connect" AND DstPort = 4444` |
| `OR` | Logical OR | `SrcProcName = "cmd.exe" OR SrcProcName = "powershell.exe"` |

### Pipeline Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `columns` | Select specific fields | `\| columns EndpointName, SrcProcName, DstIP` |
| `sort` | Sort results (prefix `-` for descending) | `\| sort -EventTime` |
| `limit` | Limit result count (max 100) | `\| limit 100` |
| `group` | Aggregate data | `\| group EndpointName calculate count() as cnt` |
| `filter` | Post-pipeline filter | `\| filter cnt > 10` |

### Common Event Types

| Event Type | Description |
|-----------|-------------|
| `Process Creation` | New process started |
| `Process Exit` | Process terminated |
| `IP Connect` | Network connection established |
| `IP Listen` | Port opened for listening |
| `File Creation` | File created |
| `File Modification` | File modified |
| `File Deletion` | File deleted |
| `Registry Key Creation` | Registry key created |
| `Registry Value Modified` | Registry value changed |
| `DNS` | DNS query |
| `Login` | User login event |
| `Logout` | User logout event |
| `Module Load` | DLL or shared library loaded |
| `URL` | URL accessed |

### Common Fields

| Field | Description |
|-------|-------------|
| `EndpointName` | Hostname of the endpoint |
| `SiteName` | SentinelOne site (MSP client) |
| `EventTime` | Event timestamp |
| `EventType` | Type of event |
| `SrcProcName` | Source (parent) process name |
| `SrcProcCmdLine` | Source process command line |
| `SrcProcPid` | Source process ID |
| `TgtProcName` | Target (child) process name |
| `TgtProcCmdLine` | Target process command line |
| `TgtProcPid` | Target process ID |
| `DstIP` | Destination IP address |
| `DstPort` | Destination port |
| `SrcIP` | Source IP address |
| `SrcPort` | Source port |
| `NetConnStatus` | Network connection status |
| `TgtFileName` | Target file name/path |
| `TgtFileHashSha256` | Target file SHA256 hash |
| `RegistryKeyPath` | Registry key path |
| `RegistryValueName` | Registry value name |
| `DNSRequest` | DNS query domain |
| `URL` | Accessed URL |
| `User` | User account |

### Query Constraints

| Constraint | Value |
|-----------|-------|
| Maximum rows returned | 100 |
| Default time range | Last 24 hours |
| Query timeout | 5 minutes |
| Empty results | Valid (no matching data, not an error) |

## Common Hunting Scenarios

### Lateral Movement

```
EventType = "Process Creation" AND
(TgtProcName = "psexec.exe" OR TgtProcName = "psexesvc.exe" OR
 TgtProcCmdLine contains "wmic" AND TgtProcCmdLine contains "/node:")
| columns EndpointName, SiteName, SrcProcName, TgtProcName, TgtProcCmdLine, EventTime
| sort -EventTime
| limit 100
```

### Credential Access (LSASS)

```
EventType = "Process Creation" AND
TgtProcCmdLine contains "lsass" AND
SrcProcName != "svchost.exe" AND SrcProcName != "csrss.exe"
| columns EndpointName, SiteName, SrcProcName, TgtProcName, TgtProcCmdLine, User, EventTime
| sort -EventTime
| limit 100
```

### Persistence (Scheduled Tasks)

```
EventType = "Process Creation" AND
TgtProcName = "schtasks.exe" AND TgtProcCmdLine contains "/create"
| columns EndpointName, SiteName, SrcProcName, TgtProcCmdLine, User, EventTime
| sort -EventTime
| limit 100
```

### Command & Control (Beaconing)

```
EventType = "IP Connect" AND NetConnStatus = "SUCCESS" AND
NOT DstIP In ("10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16") AND
DstPort NOT In (80, 443)
| group DstIP, SrcProcName, EndpointName calculate count() as connections
| filter connections > 50
| sort -connections
| limit 100
```

### Data Staging

```
EventType = "Process Creation" AND
(TgtProcName In ("7z.exe", "rar.exe", "zip.exe", "tar.exe") OR
 TgtProcCmdLine contains "Compress-Archive")
| columns EndpointName, SiteName, SrcProcName, TgtProcCmdLine, User, EventTime
| sort -EventTime
| limit 100
```

### LOLBIN Activity

```
EventType = "Process Creation" AND
TgtProcName In ("certutil.exe", "mshta.exe", "regsvr32.exe", "rundll32.exe",
                 "wscript.exe", "cscript.exe", "bitsadmin.exe") AND
(TgtProcCmdLine contains "http" OR TgtProcCmdLine contains "ftp" OR
 TgtProcCmdLine contains "/decode" OR TgtProcCmdLine contains "script:")
| columns EndpointName, SiteName, SrcProcName, TgtProcName, TgtProcCmdLine, EventTime
| sort -EventTime
| limit 100
```

### DNS Tunneling

```
EventType = "DNS" AND
DNSRequest contains "." AND
NOT DNSRequest In ("*.microsoft.com", "*.windows.com", "*.windowsupdate.com",
                    "*.office.com", "*.sentinelone.net")
| group DNSRequest calculate count() as queries
| filter queries > 100
| sort -queries
| limit 100
```

### Phishing (Office Macro Execution)

```
EventType = "Process Creation" AND
SrcProcName In ("winword.exe", "excel.exe", "powerpnt.exe") AND
TgtProcName In ("powershell.exe", "cmd.exe", "wscript.exe", "cscript.exe", "mshta.exe")
| columns EndpointName, SiteName, SrcProcName, TgtProcName, TgtProcCmdLine, User, EventTime
| sort -EventTime
| limit 100
```

## Typical Workflow

The recommended threat hunting workflow is:

1. **Describe the threat to Purple AI** - Call `purple_ai` with a natural language description of what you want to find
2. **Review the generated PowerQuery** - Purple AI returns one or more PowerQuery strings
3. **Check time range** - Call `get_timestamp_range` to verify data availability
4. **Execute the query** - Call `powerquery` with the generated query string
5. **Analyze results** - Review returned rows for indicators of compromise
6. **Iterate** - Refine the query based on initial results, or ask Purple AI for follow-up queries

## Response Examples

**PowerQuery Result:**

```json
{
  "rows": [
    {
      "EndpointName": "ACME-WS-042",
      "SrcProcName": "winword.exe",
      "TgtProcName": "powershell.exe",
      "TgtProcCmdLine": "powershell.exe -enc aQBlAHgA...",
      "EventTime": "2026-02-24T08:12:34.000Z"
    },
    {
      "EndpointName": "ACME-WS-015",
      "SrcProcName": "excel.exe",
      "TgtProcName": "cmd.exe",
      "TgtProcCmdLine": "cmd.exe /c whoami && net user",
      "EventTime": "2026-02-24T07:45:12.000Z"
    }
  ],
  "totalRows": 2
}
```

**Empty Result (Valid):**

```json
{
  "rows": [],
  "totalRows": 0
}
```

> Empty results are valid and common in threat hunting. No results means no matching telemetry was found -- which is often a positive finding.

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Syntax error | Invalid PowerQuery syntax | Use `purple_ai` to generate correct syntax |
| Timeout | Query too broad or time range too large | Narrow the time range or add more filters |
| No data available | Time range outside Data Lake retention | Call `get_timestamp_range` to check availability |
| Authentication error | Invalid token | Verify Service User token is Account or Site level |
| Rate limited | Too many queries | Wait before retrying |

### PowerQuery Syntax Tips

- String values must be in double quotes: `SrcProcName = "powershell.exe"`
- Use `In` (capital I) for list matches: `DstPort In (80, 443)`
- Use `NOT` before conditions for negation: `NOT DstIP In ("10.0.0.0/8")`
- Pipeline operators start with `|` on a new line or after a space
- Comments are not supported in PowerQuery

## Best Practices

1. **Use Purple AI to generate queries** - Do not write PowerQuery manually unless you are familiar with the syntax
2. **Always set a time range** - Avoid scanning the entire Data Lake; default to 24 hours
3. **Start narrow, then broaden** - Begin with specific filters and widen if no results
4. **Use the columns operator** - Select only the fields you need for faster results
5. **Limit results** - Always include `| limit 100` to stay within the row limit
6. **Check for empty results** - Empty results are valid; they mean no matching data
7. **Iterate on findings** - Use initial results to refine follow-up queries
8. **Filter by site** - Add `SiteName = "Client Name"` to scope hunts to specific clients
9. **Combine with alerts** - Cross-reference PowerQuery findings with alert data
10. **Document queries** - Save successful hunting queries for reuse across client environments

## Related Skills

- [Purple AI](../purple-ai/SKILL.md) - Generate PowerQuery strings from natural language
- [Alerts](../alerts/SKILL.md) - Alert context for threat hunting findings
- [API Patterns](../api-patterns/SKILL.md) - MCP tools reference and connection info
- [Inventory](../inventory/SKILL.md) - Asset context for endpoints in query results
- [Vulnerabilities](../vulnerabilities/SKILL.md) - Vulnerability context for compromised endpoints
