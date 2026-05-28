---
name: "Warmly Visitor Intelligence"
description: >
  Use this skill when triaging or acting on identified website visitors and
  account-level engagement from Warmly - prioritizing warm accounts for
  outreach, filtering visitors by ICP fit, scoring engagement depth,
  matching visitors to CRM records, or watching identification credit burn.
  Covers list_warm_visitors, list_warm_accounts, and get_credits_remaining.
when_to_use: "When triaging warm accounts, exporting visitor lists, scoring engagement, matching visitors to CRM records, or checking credit balance with Warmly"
triggers:
  - warmly visitors
  - warmly accounts
  - warmly warm leads
  - warmly identified
  - warmly site visitors
  - warmly company visits
  - warmly icp
  - warmly outreach
  - warmly engagement
  - warmly prospecting
  - warmly credits remaining
  - who visited our site
  - identified visitors
---

# Warmly Visitor Intelligence

## What Warmly tells you

Warmly identifies anonymous website visitors by IP-to-company reverse lookup, third-party data overlays, and (where consented) contact-level deanonymization. For an MSP or B2B sales team, the practical outputs are:

- **Which companies are on the site right now** (or were in the recent window)
- **Which identified people from those companies** showed up, with title and contact info when available
- **How deeply they engaged** — pages viewed, time on page, return visits

That is the raw material for prioritizing outreach: warm > cold, deep engagement > a single bounce, target ICP > unrelated traffic.

## Tool selection

| Task | Tool |
|---|---|
| "Who visited the site today?" | `list_warm_visitors` |
| "Which companies are showing pipeline-grade engagement this week?" | `list_warm_accounts` |
| "Are we about to run out of identifications?" | `get_credits_remaining` |

`list_warm_visitors` is the right starting point when you want contact-level signal (a named person you can email/call). `list_warm_accounts` is right when you want to triage at the account level (which companies are worth a salesperson's time at all).

## Common workflows

### Triage warm accounts for the morning outreach list

1. `list_warm_accounts` to pull current account-level engagement.
2. Filter by ICP fit (industry, employee count, geography — fields are on every account).
3. Sort by an engagement signal that matches your sales motion: returning visitors, pricing-page hits, or session duration depending on what you're optimizing for.
4. For the top N accounts, `list_warm_visitors` filtered to those companies to pull individual contact-level signal.

### Cross-reference with CRM before reaching out

Each visitor/account in Warmly's response includes intersection flags indicating whether the company or contact already exists in your CRM. Use this to route:

- **Known contact, recent activity** → hand to the AE who owns it; don't re-outreach
- **Known account, new contact** → enrich the existing account; queue the new contact for AE review
- **Net-new account, ICP-matched** → SDR outbound, with the visit as the warming signal

Pair the Warmly tools with the HubSpot, ConnectWise, or Autotask plugins to do the lookups in-place.

### Engagement-depth scoring

The raw payload exposes pageviews and session timing — derive a simple score (`pageviews * recency_weight + session_minutes`) rather than asking Claude to eyeball "high engagement." Surface only the top decile to outreach queues so SDR attention isn't diluted.

### Credit-burn check before a campaign

Before launching a workflow that depends on Warmly identifications scaling up (e.g. "enrich every visitor for the next 30 days"), call `get_credits_remaining` and confirm the balance covers expected volume. Identifications silently stop when the credit budget is exhausted — already-identified visitors stay visible, but new ones don't appear.

## What Warmly does NOT tell you

- **Confirmed buyer intent.** A page visit, even from a named contact, is not a qualified opportunity. Warmly is a top-of-funnel signal, not a closing one.
- **Intent across other channels.** Warmly only sees your site. Cross-reference with intent platforms (G2, 6sense, Bombora) for a fuller picture.
- **Outbound delivery.** Warmly identifies; sending is your CRM/sequencer's job. Use the HubSpot or sequencing tools to actually contact the people Warmly surfaces.

## Tying it to MSP sales motions

For an MSP-specific motion, the practical combinations are:

- **Audit-page interest** → `list_warm_accounts` filtered to visits on the security/M365/Azure audit pages → SDR sequence offering a free audit assessment.
- **Pricing-page visits without an active deal** → cross-reference HubSpot deals; if no open opportunity, route to the AE for outbound.
- **Returning visitor from a closed-lost account** → re-engagement play; the AE who lost the deal originally is best-placed to re-open.

Run these as repeatable workflows rather than one-off lookups — the value of visitor identification compounds when it consistently feeds the outreach engine.
