---
description: Correlate data across PSA, RMM, documentation, and config monitoring for a unified incident summary
argument-hint: "<ticket> [device] [company] [depth]"
arguments: [ticket, device, company, depth]
---

# Correlate Incident

Fetch a ticket from the PSA, identify the company and device, then query RMM, documentation, and config monitoring to produce a unified incident correlation summary.

## Prerequisites

- At least one PSA tool configured (Autotask, ConnectWise Manage, HaloPSA, Syncro, Atera, or SuperOps)
- Additional vendor tools (RMM, documentation, config monitoring) enhance the summary but are not required

## Steps

1. **Fetch ticket from PSA**
   - Look up the ticket by ID or number using the configured PSA
   - Extract company ID, contact ID, title, priority, status, created date

2. **Identify company**
   - Resolve company name from the PSA company ID
   - Use company name as the cross-vendor correlation key
   - If `--company` override provided, use that instead

3. **Find the affected device**
   - Check ticket for linked configuration item / asset
   - Parse title and description for hostnames, IPs, or device names
   - If `--device` override provided, use that instead
   - If no device found, ask the user

4. **Query RMM for device state**
   - Look up device by hostname in the RMM platform
   - Fetch: online/offline status, last seen, last reboot, open alerts

5. **Query documentation platform** (skipped in quick mode)
   - Search for asset record matching hostname and company
   - Fetch: related documents (titles), related passwords (names only)

6. **Query config monitoring** (skipped in quick mode)
   - Find the environment matching the company name
   - Fetch: recent detections (last 7 days), changes near ticket creation time

7. **Compile unified summary**
   - Normalize priorities and statuses using vendor mappings
   - Generate correlation insights (temporal, alert-ticket alignment)
   - Output structured summary with all sections

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| ticket | string | Yes | - | Ticket ID or number |
| device | string | No | - | Device hostname override |
| company | string | No | - | Company name override |
| depth | string | No | full | quick or full |

## Examples

### Basic Correlation

```
/correlate-incident "T20240215.0042"
```

Fetches ticket T20240215.0042, auto-detects company and device, queries all available vendor tools, and produces a full incident summary.

### With Device Override

```
/correlate-incident "T20240215.0042" --device "ACME-DC01"
```

Skips device auto-detection and directly looks up ACME-DC01 in RMM, documentation, and config monitoring.

### Quick Mode

```
/correlate-incident "T20240215.0042" --depth quick
```

Fetches only PSA ticket details and RMM device state. Faster for initial triage — skips documentation and config monitoring queries.

### With Company Override

```
/correlate-incident "12345" --company "Acme Corporation"
```

Uses "Acme Corporation" as the cross-vendor correlation key instead of extracting it from the ticket. Useful when the ticket's company name doesn't match other platforms exactly.

### Combined Options

```
/correlate-incident "T20240215.0042" --device "ACME-EXCH01" --company "Acme Corporation" --depth full
```

## Output

```
═══════════════════════════════════════════════════
INCIDENT CORRELATION SUMMARY
═══════════════════════════════════════════════════

TICKET
  ID:          T20240215.0042
  Title:       Email not working for multiple users
  Priority:    High (normalized)
  Status:      In Progress
  Created:     2024-02-15 09:23 UTC

COMPANY
  Name:        Acme Corporation
  Contract:    Managed Services (Active)

DEVICE
  Hostname:    ACME-EXCH01
  RMM Status:  Online
  Open Alerts: 2

CONFIG CHANGES (last 7 days)
  1 detection near ticket creation:
    - HIGH: Exchange transport rules modified

CORRELATION INSIGHTS
  ! Config change detected 10 hours before ticket
  ! RMM alert matches ticket description

SUGGESTED NEXT STEPS
  1. Review Exchange transport rule changes
  2. Restart Exchange transport service
  3. Verify mail flow
═══════════════════════════════════════════════════
```

### Quick Mode Output

```
═══════════════════════════════════════════════════
INCIDENT CORRELATION SUMMARY (QUICK)
═══════════════════════════════════════════════════

TICKET
  ID:          T20240215.0042
  Title:       Email not working for multiple users
  Priority:    High
  Status:      In Progress

COMPANY
  Name:        Acme Corporation

DEVICE
  Hostname:    ACME-EXCH01
  RMM Status:  Online
  Open Alerts: 2
    - HIGH: Exchange transport service stopped

Documentation:  [skipped - use --depth full]
Config Changes: [skipped - use --depth full]
═══════════════════════════════════════════════════
```

## Error Handling

### Ticket Not Found

```
Ticket "T99999" not found in the PSA.

Suggestions:
- Check the ticket number format
- Verify the ticket exists and you have access
- Try searching: /search-tickets "T99999"
```

### No Device Identified

```
No device could be identified from this ticket.

The ticket title and description don't contain a recognizable hostname or device name,
and no configuration item is linked.

Options:
- Provide a device: /correlate-incident "T20240215.0042" --device "HOSTNAME"
- Continue without device data (company and ticket context only)
```

### Vendor Unavailable

```
Note: Datto RMM is not configured. Device status and alerts are unavailable.
The summary will include PSA, documentation, and config monitoring data only.
```

## Related Commands

- `/search-tickets` - Find tickets by various criteria
- `/device-lookup` - Look up a device in RMM
- `/lookup-asset` - Find an asset in IT Glue
- `/liongard-health-check` - Check Liongard environment health
