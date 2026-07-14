---
description: Build a client-facing incident summary for a given client and time window, assembling a chronological timeline across every connected security, PSA, and documentation tool
argument-hint: "<client> [window]"
arguments: [client, window]
---

# Incident Report

Build a client-facing incident summary for a specific client and time
window, using the same reconstruction approach as the
incident-timeline-builder agent: discover what's connected, pull every
relevant event, normalize timestamps, and assemble a defensible
chronological timeline.

## Prerequisites

- Conduit gateway connected (`conduit`) with the PSA connector present at
  minimum — a timeline can be built from PSA ticket history alone if no
  security vendor is connected, but will be evidence-limited
- `client` must resolve to a known client/tenant in the PSA or gateway

## Steps

1. **Resolve the client and window.** Match `client` against the PSA/tenant
   list. If `window` is not provided, default to the last 24 hours. If
   `window` is provided as a relative value (e.g. `72h`, `7d`) or an
   explicit date range, use it as given.

2. **Discover connected tools for this client.** Call
   `conduit__search_tools` scoped to the client to determine which
   security, PSA, and documentation systems are actually connected. Do not
   assume any specific vendor — build the evidence-gathering plan from what
   this call returns.

3. **Pull evidence-timeline events.** From every connected security tool,
   pull events touching this client's affected identity/asset within the
   window. From documentation, pull any runbook or record referenced or
   updated in connection with the incident.

4. **Pull response-timeline events.** From the PSA, pull the relevant
   ticket's action/note history and status changes for the window.

5. **Normalize timestamps** to a single stated timezone and merge both
   timelines into one chronologically sorted sequence, tagged by source and
   type (evidence vs. response).

6. **Flag temporal correlations** distinctly from confirmed causal
   sequence — never assert causation the source systems don't confirm.

7. **Report evidence gaps** for any relevant tool not connected or that
   returned no data for the window.

8. **Assemble the client-facing report**, leading with a plain-language
   summary before the full timeline and technical appendix.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|--------------|
| client | string | Yes | — | Client/tenant name or ID to build the report for |
| window | string | No | `24h` | Time window to cover — relative (`24h`, `72h`, `7d`) or an explicit date range |

## Examples

### Default 24-hour window

```
/secops-pack:incident-report "Acme Corp"
```

### Explicit window

```
/secops-pack:incident-report "Acme Corp" 7d
```

### Explicit date range

```
/secops-pack:incident-report "Acme Corp" "2026-07-10 to 2026-07-13"
```

## Output

```
# Incident Report — [Client Name]
**Window:** [start] – [end] ([timezone])
**Systems queried:** [list]  |  **Evidence gaps:** [list, or "none"]

## Summary
[2-3 sentence plain-language description]

## Timeline
| Time | Type | Source | Event |
|------|------|--------|-------|
| [ts] | Evidence | [system] | [event] |
| [ts] | Response | PSA | [action] |

## Evidence Gaps
| System | Status | Impact |
|--------|--------|--------|

## Technical Appendix
[Source citations for each timeline entry]
```

## Error Handling

### Client Not Found

```
Client not found: "[client]"

Verify the client name/ID against the PSA or gateway tenant list and retry.
```

### No Connected Tools for Client

```
No security, PSA, or documentation tools are connected for "[client]".

conduit__search_tools returned no results for this client. A timeline
cannot be built without at least one connected system. Confirm the
client's gateway connection.
```

## Related Commands

- `/secops-pack:portfolio-sweep` — find the finding worth building a report for
- `/secops-pack:tenant-exposure` — check this client's broader risk posture beyond a single incident
