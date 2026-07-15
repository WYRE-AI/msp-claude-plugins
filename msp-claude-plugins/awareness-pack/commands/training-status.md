---
description: Training completion snapshot for one client or the whole portfolio — completion rates, overdue users, and cadence status
argument-hint: "[client]"
arguments: [client]
---

# Training Status

Run the training-completion sweep used by the `training-compliance-auditor`
agent: per-campaign completion rates, named overdue users with days overdue,
and cadence-compliance status where the expected training cadence is known
— for one client, or across the whole portfolio if `client` is omitted.

## Prerequisites

- Conduit gateway connected (`conduit`)
- No specific vendor is required — clients with zero connected
  training/awareness tooling are still included in the output, flagged as
  unmeasured rather than excluded

## Steps

1. **Establish scope.** If `client` is provided, resolve it against the
   PSA/tenant list and scope the run to that one client. If omitted, run
   portfolio-wide across every client.

2. **Discover connected tooling per client.** Call `conduit__search_tools`
   scoped to the run. KnowBe4 is the primary training/phishing-simulation
   source; Proofpoint and Checkpoint Avanan are optional secondary sources
   of awareness-adjacent signal where connected. Any client with zero
   connected training/awareness tooling is flagged immediately as
   unmeasured.

3. **Pull campaign and completion data** for every client with connected
   tooling, per the `training-completion-tracking` skill.

4. **Compute per-campaign completion rates and identify overdue users**,
   named individually with days overdue, not just an aggregate percentage.

5. **Apply cadence-compliance judgment only where the expected cadence is
   known** (documentation, PSA contract, or explicit input). Where unknown,
   report completion status without a cadence verdict and say so.

6. **Surface unmeasured clients prominently**, separate from the completion
   detail, rather than letting them read as compliant by omission.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|--------------|
| client | string | No | *(omit for portfolio-wide)* | Client/tenant name or ID to scope the training snapshot to a single client |

## Examples

### Portfolio-wide snapshot

```
/awareness-pack:training-status
```

### Single client

```
/awareness-pack:training-status "Meridian Health"
```

## Output

```
# Training Status
**Scope:** [Client name | Full portfolio]  |  **Run date:** [date]
**Clients assessed:** [N]  |  **Clients unmeasured:** [N]

## Unmeasured — No Connected Training/Awareness Tooling
| Client | Recommended Action |
|--------|----------------------|

## Overdue Users
| Client | User | Assignment | Due Date | Days Overdue |
|--------|------|------------|----------|---------------|

## Per-Client Completion Detail
### [Client Name]
Cadence status: [On cadence | Behind cadence by N days | Cadence unconfirmed]
Per-campaign completion: [Campaign] — [X/Y complete, Z%]

## Portfolio Summary
[one paragraph]
```

## Error Handling

### Client Not Found

```
Client not found: "[client]"

Verify the client name/ID against the PSA or gateway tenant list, or omit
the argument to run a portfolio-wide snapshot instead.
```

### No Clients Have Connected Training/Awareness Tooling

```
No connected training or phishing-simulation tooling was found across any
client in scope.

conduit__search_tools returned no matching connections. Every client will
be reported as unmeasured. Confirm gateway connections before treating this
as a clean result.
```

## Related Commands

- `/awareness-pack:phishing-results` — click-rate trend and repeat-clicker
  detail, the companion metric to training completion
- `/awareness-pack:risk-report` — combines this data with simulation
  performance into a single human risk score
