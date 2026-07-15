---
description: Human risk score report for one client or the whole portfolio, built from training completion and phishing-simulation performance
argument-hint: "[client]"
arguments: [client]
---

# Risk Report

Run the human-risk scoring used by the `human-risk-scorer` agent: per-user
risk tiers (Low / Elevated / High) built from training-overdue status and
phishing-simulation performance, with optional real-world click-signal
enrichment, rolled up into a per-org risk distribution — for one client, or
across the whole portfolio if `client` is omitted.

## Prerequisites

- Conduit gateway connected (`conduit`)
- No specific vendor is required — clients with zero connected
  training/simulation tooling are still included in the output, flagged as
  unmeasured rather than excluded or defaulted to Low risk

## Steps

1. **Establish scope.** If `client` is provided, resolve it against the
   PSA/tenant list and scope the run to that one client. If omitted, run
   portfolio-wide across every client.

2. **Discover connected inputs per client.** Call `conduit__search_tools` to
   determine which of training-completion data, phishing-simulation data,
   and optional real-world click signal (Proofpoint, Checkpoint Avanan) are
   actually available. Any client with zero connected inputs is flagged
   immediately as unmeasured.

3. **Pull training-overdue status** per user via the
   `training-completion-tracking` skill, where a training platform is
   connected.

4. **Pull phishing-simulation click/fail and repeat-clicker status** per
   user via the `phishing-simulation-analysis` skill, where a simulation
   platform is connected.

5. **Score each user** into Low / Elevated / High risk using the visible
   factor table from the `risk-scoring` skill, and label the score type
   (Full / Training-only / Simulation-only) based on which inputs were
   actually available for that user's client.

6. **Roll up to a per-org risk-tier distribution**, paired with the named
   highest-risk individuals — never present the org rollup alone.

7. **Surface unmeasured clients prominently**, separate from the ranked
   results, rather than letting them default to looking safe.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|--------------|
| client | string | No | *(omit for portfolio-wide)* | Client/tenant name or ID to scope the risk report to a single client |

## Examples

### Portfolio-wide risk report

```
/awareness-pack:risk-report
```

### Single client

```
/awareness-pack:risk-report "Riverside Medical"
```

## Output

```
# Human Risk Report
**Scope:** [Client name | Full portfolio]  |  **Run date:** [date]
**Users scored:** [N]  |  **Clients unmeasured:** [N]

## Unmeasured — No Connected Training/Simulation Data
| Client | Status |
|--------|--------|

## Highest-Risk Users
| Client | User | Risk Tier | Triggering Factors | Score Type |
|--------|------|-----------|----------------------|------------|

## Per-Client Risk Distribution
### [Client Name] — Score Type: [Full | Training-only | Simulation-only]
High: [N] ([%])  Elevated: [N] ([%])  Low: [N] ([%])
Named highest-risk individuals: [list]

## Portfolio Summary
[one paragraph]
```

## Error Handling

### Client Not Found

```
Client not found: "[client]"

Verify the client name/ID against the PSA or gateway tenant list, or omit
the argument to run a portfolio-wide risk report instead.
```

### No Clients Have Any Connected Input

```
No connected training or phishing-simulation data was found across any
client in scope.

conduit__search_tools returned no matching connections. Every client will
be reported as unmeasured — no risk scores can be computed. Confirm gateway
connections before treating this as a clean result.
```

### Partial Input Available

Client is scored on whatever subset is available (training-only or
simulation-only), and the score is explicitly labeled as partial rather than
presented as a full score.

## Related Commands

- `/awareness-pack:training-status [client]` — training completion detail,
  the primary input for training-overdue severity
- `/awareness-pack:phishing-results [window]` — click-rate trend and
  repeat-clicker detail, the primary input for simulation-based severity
