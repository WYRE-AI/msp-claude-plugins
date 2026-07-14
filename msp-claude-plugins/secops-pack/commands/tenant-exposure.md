---
description: Run the exposure ranking for one client or the whole portfolio — open critical findings, unmitigated threats, MFA gaps, and stale EDR coverage
argument-hint: "[client]"
arguments: [client]
---

# Tenant Exposure

Run the exposure ranking used by the tenant-exposure-ranker agent: current
open critical findings, unmitigated/uncontained threats, MFA coverage gaps
(with emphasis on privileged accounts), and stale or missing EDR/agent
coverage — for one client, or across the whole portfolio if `client` is
omitted.

## Prerequisites

- Conduit gateway connected (`conduit`)
- No specific vendor is required — clients with zero connected security
  tooling are still included in the output, flagged as unmeasured rather
  than excluded

## Steps

1. **Establish scope.** If `client` is provided, resolve it against the
   PSA/tenant list and scope the run to that one client. If omitted, run
   portfolio-wide across every client.

2. **Discover connected tooling per client.** Call `conduit__search_tools`
   scoped to the run. Build a per-client coverage map. Any client with zero
   connected security tooling is flagged immediately as unmeasured.

3. **Pull open findings and normalize severity** for every client with
   connected tooling, using the alert-severity-normalization skill.

4. **Pull unmitigated threat status**, MFA enforcement status (privileged
   accounts weighted most heavily), and EDR/agent coverage against RMM
   inventory, per client.

5. **Cross-reference the PSA** to note which open findings are already
   being actively worked via an open ticket.

6. **Rank clients** by combined exposure — unmitigated active threats and
   privileged-account MFA gaps weighted heaviest, then open critical
   findings, then EDR coverage gaps — showing the top contributing factors
   per client alongside its rank.

7. **Surface unmeasured clients prominently**, separate from the ranked
   list, rather than letting them default to looking safe.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|--------------|
| client | string | No | *(omit for portfolio-wide)* | Client/tenant name or ID to scope the exposure ranking to a single client |

## Examples

### Portfolio-wide ranking

```
/secops-pack:tenant-exposure
```

### Single client

```
/secops-pack:tenant-exposure "Acme Corp"
```

## Output

```
# Tenant Exposure Ranking
**Scope:** [Client name | Full portfolio]  |  **Run date:** [date]
**Clients assessed:** [N]  |  **Clients unmeasured:** [N]

## Unmeasured — No Connected Security Tooling
| Client | Recommended Action |
|--------|----------------------|

## Ranked Exposure
| Rank | Client | Top Contributing Factors | Open Critical/High | Unmitigated Threats | MFA Gaps (privileged) | EDR Coverage Gap |
|------|--------|---------------------------|---------------------|----------------------|-------------------------|---------------------|

## Per-Client Detail
### [Client Name] — Rank [N]
[findings, threats, MFA gaps, EDR coverage detail]

## Portfolio Summary
[one paragraph]
```

## Error Handling

### Client Not Found

```
Client not found: "[client]"

Verify the client name/ID against the PSA or gateway tenant list, or omit
the argument to run a portfolio-wide ranking instead.
```

### No Clients Have Connected Tooling

```
No connected security tooling was found across any client in scope.

conduit__search_tools returned no security vendor connections. Every
client will be reported as unmeasured. Confirm gateway connections before
treating this as a clean result.
```

## Related Commands

- `/secops-pack:portfolio-sweep` — raw normalized finding sweep rather than
  a weighted risk ranking
- `/secops-pack:incident-report` — build a full timeline for a specific
  finding surfaced by this ranking
