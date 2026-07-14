---
description: List currently-warm leads with routing recommendations
argument-hint: ""
arguments: []
---

# Warm Leads

Lists leads currently scoring Warm or above from whatever intent and
engagement signals are connected (Warmly, Calendly, CRM form fills/email
engagement), with a proposed rep-routing recommendation and rationale per
lead.

## Prerequisites

- WYRE MCP Gateway connected (`conduit`) with at least a CRM connector.
  Without one, there is no lead data or routing context to work from.
- Optional: Warmly (website-visitor intent) and Calendly (booking activity).
  Without them, scoring falls back to CRM-only signals (form fills, email
  engagement) and this is stated explicitly in the output.

## Steps

1. **Discover available tools.** Call `conduit__search_tools` to determine
   which of Warmly, Calendly, and a CRM are actually connected. Never assume
   all three — this command commonly runs with partial coverage.

2. **Pull recent signal activity.** Warmly visitor sessions (last 7–14
   days), Calendly bookings (last 7 days), and CRM form fills/email
   engagement (last 14 days) — whichever sources are connected.

3. **Score each lead** using the `warm-lead-routing` skill's tiered approach
   (Hot / Warm / Warm-Cool / Cool / Cold), starting from the strongest
   available signal and adjusting for convergence and recency.

4. **Propose routing** for every lead scoring Warm or above: existing CRM
   owner if one exists, otherwise a CRM-exposed routing rule, otherwise
   round-robin by rep capacity — stating explicitly which basis was used.

5. **Assemble and return the report**, Hot leads first, then Warm, each with
   a one-line rationale. State which signal sources were used for this run.

## Arguments

This command takes no arguments — it always reports current warm-and-above
leads across whatever signal sources are connected.

## Examples

### Basic Usage

```
/sales-pack:warm-leads
```

## Output

```
================================================================================
Warm Leads — [Date]
Signal Sources Used: [Warmly / Calendly / CRM — whichever connected]
================================================================================

HOT — ROUTE NOW
--------------------------------------------------------------------------------
[Lead/Company] — [signal, recency] — Proposed: [rep] ([rationale])

WARM — ROUTE TODAY
--------------------------------------------------------------------------------
[Lead/Company] — [signal, recency] — Proposed: [rep] ([rationale])

SIGNAL COVERAGE NOTE
--------------------------------------------------------------------------------
[e.g. "Warmly not connected — website-visitor intent not reflected in these
scores; routing based on CRM engagement and Calendly bookings only."]
================================================================================
```

## Error Handling

- **No CRM connected:** Report plainly that warm-lead routing can't run
  without a CRM connector, and stop rather than fabricating leads.
- **Warmly and/or Calendly not connected:** Score from whatever remains
  connected and state the narrower signal basis explicitly — never present a
  CRM-only score with the same confidence as a full-signal score.
- **No leads currently score Warm or above:** Report that plainly — an empty
  result is itself useful information, not a reason to lower the scoring
  bar.

## Related Commands

- `/sales-pack:pipeline-pulse` - Once a warm lead converts to an open deal,
  its ongoing health is tracked there
