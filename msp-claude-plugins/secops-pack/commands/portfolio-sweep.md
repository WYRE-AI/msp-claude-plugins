---
description: Sweep every connected security tool across all clients/tenants, normalize findings, and report the top most urgent items portfolio-wide
argument-hint: ""
arguments: []
---

# Portfolio Security Sweep

Sweep all connected EDR/MDR/SIEM/identity security tools across every
client in the portfolio, normalize severity across vendors, and report the
most urgent items first — a portfolio-wide equivalent of opening every
client's security console at once and reading only what matters.

## Prerequisites

- Conduit gateway connected (`conduit`) with at least one connected security
  vendor for at least one client
- No specific vendor is required — the sweep discovers and adapts to
  whatever is connected per client

## Steps

1. **Discover available security tools.** Call `conduit__search_tools` to
   determine which security vendors (EDR, MDR, SIEM, CIPP/identity, email
   security, SaaS security) are connected, and for which clients. Do not
   assume any specific vendor from the pack's description — the actual
   connected set varies per organization and per client.

2. **Enumerate the client/tenant list.** Pull the client list from the PSA
   or the gateway's tenant listing so every client with any connected
   security tooling is included in scope.

3. **Query each connected vendor for each client.** For every client, query
   its connected vendors' current open findings/alerts/incidents/threats.
   Record which vendors were queried per client and which vendor families
   had no connector present for that client.

4. **Normalize severity.** Apply the alert-severity-normalization skill's
   Critical/High/Medium/Low model to every finding pulled, regardless of
   source vendor, so results are comparable across the portfolio.

5. **Rank and report.** Sort the combined, normalized finding set
   portfolio-wide by severity (Critical first), then group the top N by
   client so the reader can see both the overall urgency ranking and which
   clients are contributing the most risk.

6. **Report coverage gaps.** For every client with no connected security
   tooling at all, or with a partial vendor mix, state that explicitly —
   a client with nothing to report because nothing is connected must never
   look identical to a client with a genuinely clean sweep.

## Parameters

This command takes no arguments — it always sweeps the full portfolio and
every vendor `conduit__search_tools` reports as connected.

## Examples

```
/secops-pack:portfolio-sweep
```

## Output

```
# Portfolio Security Sweep
**Run date:** [date]  |  **Clients swept:** [N]  |  **Clients with no connected security tooling:** [N]

## Top Urgent Items (Portfolio-Wide)

| Rank | Severity | Client | Vendor | Finding |
|------|----------|--------|--------|---------|
| 1 | Critical | [client] | [vendor] | [finding summary] |

## By Client

### [Client Name]
Vendors queried: [list]  |  Not connected: [list, or "none"]

| Severity | Vendor | Finding |
|----------|--------|---------|
| Critical | [vendor] | [finding] |

*Repeat per client, ordered by highest severity present.*

## Coverage Gaps

| Client | Missing Vendor Families | Impact |
|--------|--------------------------|--------|
| [client] | [e.g. "No EDR, no SIEM — CIPP alert queue only"] | [what could not be checked] |
```

## Related Commands

- `/secops-pack:tenant-exposure` — a risk-ranked view (open findings + MFA
  gaps + coverage gaps) rather than a raw finding sweep
- `/secops-pack:incident-report` — build a full timeline once a specific
  finding from this sweep needs to become an incident report
