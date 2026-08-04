---
name: "Warm Lead Routing"
description: >
  Lead-warmth scoring from intent and engagement signals — Warmly
  website-visitor identification, CRM form fills and email engagement, and
  Calendly booking activity — using an explainable Hot/Warm/Warm-Cool/Cool
  tiering, plus routing recommendations based on owner continuity, CRM
  routing rules, or rep capacity, and the degradation path to CRM-only
  signals when intent tools aren't connected.
when_to_use: >-
  When identifying which leads are showing real buying intent right now and
  who should follow up on them. Use when: warm leads, hot leads, who should
  follow up on this lead, lead routing, lead scoring, which leads are
  engaged, intent signals, website visitor identification.
---

# Warm Lead Routing

## Overview

Most inbound lead volume is noise — a form fill from a student researching a
term paper looks identical in a CRM to a form fill from an IT director who
just had an outage. Warmth is what separates the two, and it comes from
signals CRM stage alone doesn't capture: is this account revisiting the
pricing page, did the same person book a call, did an email actually get
opened. This skill combines those signals into a practical warmth score and
turns that into a routing recommendation — the right rep, contacted soon
enough to matter, with the reasoning shown so a sales manager can override
it.

This skill is explicitly tiered: the richer the connected tool set, the more
precise the scoring, but a CRM alone (no Warmly, no Calendly) still produces
a usable, if coarser, read. Never treat missing intent tools as a reason to
skip lead scoring entirely — degrade the signal set, not the output.

## Anti-triggers

- **Warmly's own visitor and account surface** — choosing between the
  visitor and account lists, ICP filtering, and credit-burn checks belong to
  `warmly-visitor-intelligence`. This skill blends that signal with CRM
  activity into one warmth tier and a routing proposal.
- **Contact records and email engagement as data** — use `hubspot-contacts`
  or `hubspot-activities`.

## Signal sources and what they contribute

| Signal source | Signal | Weight (relative) |
|---|---|---|
| Warmly (if connected) | Anonymous or identified website-visitor activity — repeat visits, pricing/product-page views, session recency | High — this is the earliest, least-solicited intent signal available |
| Calendly (if connected) | A booked call/meeting — the strongest possible intent signal, since the lead took a deliberate action | Highest — a booking should almost always push a lead into "warm" regardless of other signals |
| HubSpot (or connected CRM) form fills | A submitted form — contact info plus whatever context the form captured (use case, company size, urgency language) | Medium — real intent, but lower-effort than a booking |
| HubSpot (or connected CRM) email engagement | Opens, clicks, and replies on marketing or sales sequence emails | Medium-low individually, but a rising trend (multiple opens/clicks over a short window) is a meaningful signal |
| HubSpot (or connected CRM) lifecycle/lead status | Existing lead score or lifecycle stage, if the CRM tracks one | Contextual — use as a prior, not a replacement for the signals above |

## Discovering available tools first

Before scoring anything, call `conduit__search_tools` to determine which of
Warmly, Calendly, and a CRM (typically HubSpot) are actually connected for
this org. Do not assume all three — this is the skill in this pack most
likely to run with partial coverage, since Warmly and Calendly are both
explicitly optional enrichments per this pack's README. Scope scoring to
whatever is actually live, and state which signal sources were used (and
which weren't available) in every output.

## Scoring approach

Keep this explainable rather than a black-box formula — a rep or sales
manager needs to see why a lead is scored warm to trust routing it.

1. **Start from a base tier using the strongest available signal:**
   - A Calendly booking in the last 7 days → start at **Hot**.
   - Warmly-identified repeat visits (2+ sessions in 7 days) or a pricing/
     product page view → start at **Warm**.
   - A CRM form fill in the last 14 days with no other signal → start at
     **Warm-Cool** (real intent, but lower urgency than a booking or repeat
     visit).
   - Email engagement only (opens/clicks, no form fill, no booking) → start
     at **Cool**.
   - No recent signal of any kind → **Cold** — do not include in a warm-lead
     routing output; this skill surfaces leads worth acting on now, not the
     full lead database.

2. **Adjust up or down based on secondary signals:**
   - Multiple signal sources agreeing (e.g. a Warmly repeat visit *and* a
     form fill within the same week) moves a lead up one tier — convergent
     signals are more reliable than any single one.
   - A signal that's aging (e.g. a form fill 12 days old with nothing since)
     should not be scored as fresh as one from yesterday — recency matters
     within a tier, not just which tier it lands in.
   - Company-fit context, if available (existing client's employee vs. a
     brand-new domain, or a company size wildly outside the org's typical
     client profile) can be noted as a qualifier, but should not override a
     strong behavioral signal — a bad-fit account that books a call is still
     worth a fast, brief qualifying response.

3. **Only "Hot" and "Warm" tiers get a routing recommendation** in normal
   output; "Warm-Cool" and "Cool" can be included in a fuller sweep if asked,
   but shouldn't clutter a default "who's warm right now" answer.

## Routing recommendation

Once a lead clears the Warm threshold, propose an assignee:

1. If the lead is already associated with an owner in the CRM (e.g. an
   existing named account, or a rep already assigned to the deal/contact),
   route to that owner by default — continuity beats round-robin.
2. If unowned, and the CRM exposes territory, industry, or account-size
   routing rules, apply them.
3. If no routing rule is available, propose round-robin among the reps
   with capacity (open-deal count, if visible) rather than always defaulting
   to the same person, and say explicitly that this is a default proposal in
   the absence of a documented routing rule.
4. Always state the rationale in one line per lead: signal(s) that earned
   the tier, and why this rep — e.g. "Booked a Calendly call 2 days ago;
   existing deal owner Maria S."

Do not write the assignment back to the CRM unless the operator explicitly
asks for it — default to a proposal, matching this pack's other skills.

## Graceful Degradation

| Missing / Unavailable | Handling |
|---|---|
| Warmly not connected | Skip website-visitor signals; score from CRM form fills/email engagement and Calendly (if connected) only. State plainly that anonymous visitor intent isn't visible. |
| Calendly not connected | Skip booking signal; the "Hot" tier can then only be reached via strongly convergent Warmly + CRM signals — state that bookings can't be checked. |
| No CRM connected | This skill cannot run meaningfully — form fills, email engagement, and owner/routing data all live in the CRM. State this plainly and stop, the same way `pipeline-health` does. |
| Only a CRM connected (no Warmly, no Calendly) | Score from form fills and email engagement only; state explicitly that the warmth read is CRM-only and coarser than it would be with intent-signal tools connected. |
| No routing rule available in the CRM | Propose round-robin by open-deal capacity and say so explicitly, rather than presenting round-robin as a documented policy. |

## Error Handling

### No signal sources connected at all

State plainly that warm-lead routing requires at least a CRM to be
connected, and that none was found. Do not fabricate leads or scores.

### Signal sources connected but return no activity in the lookback window

Report that no leads currently meet the Warm threshold, rather than lowering
the bar to force a result — an empty warm-leads list is itself useful
information.

## Related Skills

- [Pipeline Health](../pipeline-health/SKILL.md) — once a warm lead
  converts to an open deal, pipeline health picks up its ongoing tracking
- [Quote-to-Close Tracking](../quote-to-close-tracking/SKILL.md) — downstream
  of this skill, once a warm lead has progressed to a quote or proposal
