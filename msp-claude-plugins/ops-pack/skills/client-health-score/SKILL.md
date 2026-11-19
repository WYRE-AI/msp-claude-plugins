---
name: "Client Health Score"
description: >
  A weekly per-client health roll-up across the whole managed portfolio:
  five risk dimensions (device failure risk, repeat-ticket patterns,
  patch/end-of-life/known-exploited exposure, backup health trend,
  renewals and capacity), a transparent scoring and trend method, an
  unbilled-time flag that ties service load to profitability, and QBR
  talking points. It composes existing skills for each dimension instead of
  re-implementing them.
when_to_use: >-
  When ranking clients by overall health, preparing a quarterly business
  review, or deciding where proactive work should go next. Use when: client
  health score, which clients are getting worse, QBR prep, account review,
  weekly client digest, proactive review, clients costing us time, unbilled
  time, underbilled client, client risk ranking.
---

# Client Health Score

## Overview

Each dimension of client health already has a tool. What MSPs lack is one
weekly view that says which clients are trending worse, what to fix first, and
what to say at the next review. This skill assembles that view from the
connected PSA, RMM, backup, security and billing tools. It is read-only and
built to run weekly. Every action it suggests is a draft ticket or a
suggestion for a person to approve.

## Anti-triggers

- **One dimension only**, for just backups use `backup-pack-backup-job-health`; for
  just end-of-life use `assets-pack-eol-eos-flagging`; for just margin use
  `finance-pack-margin-analysis`. This skill is the roll-up, not a replacement.
- **Churn or renewal-pricing decisions**, use `finance-pack-churn-scanner` or
  `finance-pack-renewal-and-price-increase-prep`.
- **Board-level ticket hygiene**, use `ops-pack-board-hygiene`.

## Key Concepts

### Five dimensions and where each comes from

| Dimension | Question | Source skill or data |
|---|---|---|
| Device failure risk | How many devices show early failure signs? | `ops-pack-device-failure-early-warning` |
| Repeat-ticket patterns | Is the same device, user or issue coming back? | PSA tickets, last 90 days (below) |
| Patch, end-of-life, exploited exposure | How much of the estate is unpatched, unsupported or hit by actively exploited bugs? | `assets-pack-eol-eos-flagging`; RMM patch status; the exploited edge-device sweep where it exists |
| Backup health trend | Are backups getting worse, not just failing? | `backup-pack-backup-job-health`, `backup-pack-restore-test-verification` |
| Renewals and capacity | What expires or fills up in the next 90 days? | `finance-pack-renewal-and-price-increase-prep`, `assets-pack-warranty-tracking` |

Run only the dimensions whose tools are connected. A dimension with no data is
shown as "not assessed", never as healthy and never as zero risk.

### Repeat-ticket pattern

Within the last 90 days, flag a pattern when 3 or more tickets share the same
device, the same user, or the same normalized issue type (fuzzy subject match,
as in `ops-pack-board-hygiene`). Report the pattern and the count, not each
ticket, and say whether it is closed-and-returned or still open.

### Scoring

Score each available dimension 0 to 100 (100 healthy) with a rule a reader can
check, for example: start at 100, subtract points per finding by severity, floor
at 0. Show the findings behind every score. Overall score is the average of
assessed dimensions, with a note listing any not assessed; a client with only
two assessed dimensions should not be compared directly to one with five.
State the weights you used. Default to equal weights unless the org has its own.

### Trend

Compare with the previous run: improved by 5 or more points, worse by 5 or more,
or steady. Without a saved previous run, report "first run, no trend" and ask the
user to keep the output (or store it where the org keeps skill notes) so next
week has a baseline. Rank the worsening clients first; a steady 70 is less
urgent than a client who fell from 85 to 68.

### Unbilled-time flag

Compare the client's service effort with what they pay. Pull PSA time entries
for the last 90 days and the client's billable and contract data (see
`finance-pack-margin-analysis` for the revenue and labor-cost method). Flag a
client when hours worked are well above what the agreement covers, or when much
of the logged time is non-billable or on a flat fee with no cap. Report hours,
the share that is unbilled, and the likely cause (repeat problems, scope creep,
missing contract line), because the cause decides the fix: fixing a repeat
problem lowers the load, while renegotiating scope raises revenue.

Where time entry is incomplete the number is understated. Say so rather than
presenting a precise-looking figure. Tie each flagged client to the health
findings above: a client who is both unhealthy and under-billed is the clearest
case for a conversation.

## Common Workflows

### Weekly digest

1. Call `conduit__search_tools` for PSA, RMM, backup, security and billing
   tools to see which dimensions can run.
2. For each client, collect findings per dimension from the source skills.
   Do not re-pull what a source skill already returned in this run.
3. Score, compute trend, and compute the unbilled-time flag.
4. Output, worst-trending first: client, overall score and trend, top three
   fixes, not-assessed dimensions, unbilled-time flag.
5. For each client in the bottom tier, draft one proactive ticket or
   suggested action list. Stop before creating anything.

### QBR talking points for one client

1. Run the digest for that client only.
2. Produce 3 to 5 points in plain language: what improved, what got worse,
   what the MSP fixed or recommends, what is coming up (renewals, end of
   life), and the cost of leaving risks open. Lead with outcomes the client
   cares about (fewer repeat problems, protected data), not tool names.
3. Keep unbilled-time findings internal. They are for the account manager and
   do not belong in the client-facing points.

### Sample digest row

```
Acme Co    71 (was 82, worse)   Fix first: replace SRV-FS01 disk; clear 14 devices past end of support; verify last restore test (none in 120 days)
           Not assessed: renewals (no distributor connected)
           Unbilled: 38 h in 90 days, 61% non-billable, mostly 4 repeat VPN tickets. Internal only.
```

## Error Handling

- **No PSA connected:** the repeat-ticket and unbilled-time parts cannot run. Say
  so and score only what the RMM and backup tools support.
- **A source skill fails for one client:** mark that dimension "not assessed" for
  that client with the reason and continue.
- **Client names differ across tools:** match on documented client IDs or
  domains where possible, and list unmatched names rather than guessing.

## Best Practices

- Keep the score explainable. A number nobody can trace to findings gets
  ignored or argued with.
- Never share raw scores with clients; share findings and recommendations.

## Related Skills

- [Device Failure Early Warning](../device-failure-early-warning/SKILL.md), the device-risk input
- [Board Hygiene](../board-hygiene/SKILL.md), duplicate and stale-ticket detection that the repeat-ticket pattern builds on
