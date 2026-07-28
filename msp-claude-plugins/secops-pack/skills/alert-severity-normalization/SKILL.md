---
name: "Alert Severity Normalization"
description: >
  A common Critical/High/Medium/Low normalized severity model for security
  alerts, incidents, and findings, with the judgment axes (confidence,
  mitigation state, blast radius) that place a record in a tier and the
  mapping from each vendor's native terminology — Huntress incident status,
  SentinelOne threat confidence, Blumira finding priority, CIPP alert queue
  severity, Blackpoint Cyber SOC severity, SaaS Alerts risk level — plus how
  to discover which security vendors are actually connected.
when_to_use: >-
  When normalizing, comparing, or ranking security alerts, incidents, or
  findings across more than one connected security vendor. Use when: alert
  severity, normalize severity, severity mapping, which alert is worse,
  portfolio severity ranking, cross-vendor severity, triage priority,
  severity scale, compare incidents across tools, rank alerts by urgency.
---

# Alert Severity Normalization

## Overview

Every EDR/MDR/SIEM vendor scores urgency differently, and the scales are not
interchangeable. A Huntress "incident" carries no numeric severity at all —
urgency is implied by incident type and remediation status. A SentinelOne
threat carries an analyst/engine confidence level plus a mitigation state.
Blumira ships findings with a priority field that already resembles a
normalized scale. CIPP's alert queue mirrors whatever severity Microsoft's
own signals assigned. None of these numbers or labels mean the same thing,
and none of them are directly comparable — a Huntress "Critical" incident
report is not necessarily worse than a SentinelOne threat with high
confidence and no mitigation.

This skill exists so that a sweep across a client's stack — or across an
entire portfolio — produces one ranked list instead of five vendor-shaped
lists that can't be stacked against each other. The normalization is a
judgment mapping, not a lookup table: read the vendor's own signal (status,
confidence, mitigation state, classification) and place it into the
normalized tier using the criteria below, not by naively copying the
vendor's label across.

## Step Zero: Discover What's Actually Connected

Never assume a vendor is connected. Before running any severity sweep, call
`conduit__search_tools` to discover which security vendors are actually
wired up for the org in question. A portfolio-wide sweep will typically see
a different vendor mix per client — one tenant may only have Huntress, the
next may run SentinelOne and CIPP side by side, and a third may have no EDR
connected at all beyond CIPP's M365 alert queue. Build the vendor list from
what `conduit__search_tools` returns, not from the vendor list in this
document — this document exists to teach the mapping, not to enumerate every
tool that will ever be connected. Once a vendor's tools are confirmed
connected, use its own list/search tool (for example `huntress__list_incidents`,
`cipp__list_users` for the identity side of a finding, or `sentinelone__list_threats`)
to pull the native records; the exact tool name for any given vendor is
whatever `conduit__search_tools` reports for it — don't guess.

## The Normalized Model

| Tier | Definition | Response expectation |
|------|------------|----------------------|
| **Critical** | Active, unmitigated compromise: confirmed malicious execution, ransomware behavior, confirmed account takeover with session activity, or data exfiltration in progress. Nothing is automatically contained. | Immediate action, regardless of business hours. Page/escalate now. |
| **High** | Confirmed malicious or highly suspicious activity that is contained or auto-mitigated, OR unmitigated activity with lower confirmed blast radius (single low-privilege endpoint, single mailbox rule). Not actively spreading, but not resolved. | Same-business-day human validation and closure. |
| **Medium** | Suspicious activity, a policy violation, or a finding that raises risk with no evidence of exploitation (e.g., a risky sign-in that was blocked, a suspicious-but-quarantined attachment, a config drift finding). | Review within normal SLA (commonly next business day). |
| **Low** | Informational, hygiene, or low-confidence findings — noise reduction candidates, benign anomalies, or advisory-only items. | Batched for periodic review; not individually tracked. |

Two judgment calls apply at every tier boundary:

- **Confidence vs. impact are separate axes.** A high-confidence detection of
  a low-impact event (e.g., a confirmed but immediately blocked phishing
  click with no follow-on activity) does not automatically outrank a
  lower-confidence detection of a high-impact event (e.g., a "suspicious"
  process spawning from an unmanaged scheduled task on a domain controller).
  When they conflict, weight impact and blast radius over confidence, and
  say so explicitly in the ranking rationale.
- **Mitigation state moves the tier, not the classification.** A malicious
  threat that a vendor auto-killed and auto-quarantined is still a
  malicious threat — it should not be silently dropped to Low just because
  it was handled. It typically lands at High rather than Critical: real
  malice, contained blast radius.

## Vendor Mapping Reference

| Vendor | Native terminology | How to map it |
|--------|--------------------|----------------|
| **Huntress** | No numeric severity — incidents carry a *status* (New / In Progress / Closed) and an incident *type*. Ransomware Canary trips and confirmed footholds are inherently severe regardless of status. | Confirmed foothold / ransomware canary / active incident, status New or In Progress → **Critical**. Confirmed foothold already remediated by Huntress or the SOC → **High**. Suspicious-but-unconfirmed detections still open → **Medium**. Closed/resolved with no confirmed compromise → **Low**. |
| **SentinelOne** | Threat *confidence* (Malicious / Suspicious / N/A) plus a *mitigation status* (mitigated / not mitigated) and analyst verdict. | Malicious + not mitigated → **Critical**. Malicious + mitigated, or Suspicious + not mitigated on a sensitive asset → **High**. Suspicious + mitigated → **Medium**. Benign/resolved or false-positive verdict → **Low**. |
| **Blumira** | Finding *priority* (already Critical/High/Medium/Low-shaped, sometimes with an "Informational" tier). | Near 1:1 — pass the native priority through. Collapse "Informational" into **Low**. Re-check Critical/High findings for whether they were auto-suppressed by a detection rule tune; a suppressed finding that fired anyway deserves a second look before trusting the native label. |
| **CIPP alert queue** | Mirrors Microsoft's own signal severity for the tenant (risky sign-ins, mailbox rule changes, admin role changes, standards drift, BEC indicators). | Confirmed risky sign-in with subsequent mailbox/inbox rule change, or a BEC indicator from `cipp__bec_check`-style checks → **Critical**. Risky sign-in blocked/challenged by Conditional Access, or a new inbox forwarding rule to an external domain → **High**. Standards/config drift with no activity evidence → **Medium**. Informational audit-log entries → **Low**. |
| **Blackpoint Cyber** | SOC-assigned incident severity, typically already tiered by their analysts (their own P1–P4 or Critical/High/Medium/Low convention varies by portfolio configuration). | Treat a Blackpoint SOC escalation as **Critical** or **High** by default — their model already filters for analyst-reviewed, actionable events; do not downgrade an escalated incident without evidence. Anything still labeled advisory/informational by their console → **Low**/**Medium** per their own label. |
| **SaaS Alerts** | Per-event *risk level* tied to the specific SaaS activity (impossible travel, mass file download, new admin, forwarding rule, third-party app grant). | Impossible travel + mass download/exfil-shaped activity, or a high-risk OAuth grant → **Critical**. New admin role grant or a forwarding rule to an external domain → **High**. Single anomalous sign-in with no follow-on activity → **Medium**. Routine policy-hygiene notices → **Low**. |
| **RocketCyber / other SOC-managed feeds** | SOC-reviewed event clusters, generally pre-filtered for actionability. | Default to **High** for anything the SOC surfaced as an incident (it already passed a human filter); reserve **Critical** for confirmed active compromise language in the SOC's own writeup. |

When a vendor shows up that isn't in this table, don't block on it — apply
the same judgment axes (confidence, mitigation state, blast radius) using
whatever severity/status fields `conduit__search_tools` surfaces for it, and
note in the output that the mapping is best-effort for an unlisted vendor.

## Worked Example

A portfolio sweep returns: a Huntress incident (status: New, type: foothold),
a SentinelOne threat (confidence: Suspicious, mitigated: true), and a CIPP
alert queue entry (a new external forwarding rule on an executive mailbox).
Normalized: the Huntress foothold is **Critical** (unmitigated, confirmed
foothold), the CIPP forwarding rule is **High** (classic BEC precursor, not
yet confirmed as active exfiltration), and the SentinelOne threat is
**Medium** (suspicious confidence, already mitigated). The portfolio-wide
ranking leads with the Huntress incident even though it may be the
numerically "smallest" record returned by its API — normalization, not
vendor ordering, drives the ranking.

## Related Skills

- [Containment Playbooks](../containment-playbooks/SKILL.md) — what to do
  once an item is ranked Critical or High.
- [BEC Response](../bec-response/SKILL.md) — the specific sequence for
  business email compromise, one of the most common Critical/High findings
  this normalization surfaces.
