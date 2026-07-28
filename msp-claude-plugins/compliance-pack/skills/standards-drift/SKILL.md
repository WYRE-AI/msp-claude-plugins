---
name: "Standards Drift Detection"
description: >
  Detecting configuration drift against an established baseline: CIPP standards
  checks and Best Practice Analyser results, Liongard change detections and
  inspection timelines, the three conditions that make a diff real drift rather
  than noise, the signals that separate intentional or authorized change from
  unauthorized weakening (ticket correlation, reversion pattern, direction of
  change), and the priority order for ranking several drift findings at once.
when_to_use: >-
  When comparing current tenant or infrastructure state against a known-good baseline,
  when a standards check or inspection shows something changed, or when deciding which
  of several drift findings is most urgent. Use when: control drift, configuration
  drift, standards drift, has anything changed, drift detection, baseline comparison,
  unauthorized change, what changed since last check, security drift.
---

# Standards Drift Detection

## Overview

A compliance control that was met last quarter is not guaranteed to still be met today. Tenants change constantly — a conditional access policy gets edited during a troubleshooting session and never reverted, a firewall rule gets loosened for a vendor's "temporary" remote session, a new admin account gets created without MFA during an emergency. None of this shows up unless something actively compares current state against a baseline. That comparison is what this skill covers.

Drift detection has two distinct data sources in this pack's grounding:

- **CIPP standards checks** (`cipp__list_standards`, `cipp__run_standards_check`, `cipp__list_bpa`) — these represent MSP-defined or CIS-aligned configuration standards applied to a tenant. A standard that previously passed and now fails is drift. `cipp__list_standards` shows which standards are assigned to a tenant and their last-known state; `cipp__run_standards_check` re-evaluates live.
- **Liongard change detection** (`liongard__detections_list`, `liongard__detections_get`, `liongard__timeline_list`) — Liongard inspects systems on a schedule and diffs each inspection against the prior one, surfacing detections when tracked properties change. The timeline is the authoritative "what changed and when" record for anything Liongard inspects (network gear, servers, cloud tenants, and whatever else an org has connected inspectors for).

## What Counts as Drift

Drift is any observed difference between the current state of a tracked control or configuration item and its last known-good (i.e., previously verified-compliant) state. Three things are required to call something drift rather than noise:

1. A **baseline** exists — a prior standards check that passed, or a prior Liongard inspection/detection that was reviewed and accepted.
2. A **current observation** exists that differs from that baseline.
3. The difference is in a property that matters for compliance or security posture — not every diff Liongard surfaces is drift in the compliance sense (a device's uptime counter changing is not drift; a firewall rule set changing is).

If there is no established baseline (first-ever check, or the client has never had a standards check run), there is nothing to diff against — run the check, record the result as the new baseline, and say so rather than reporting phantom drift.

## Intentional vs. Unauthorized Drift

Not all drift is bad. A technician who disabled a conditional access policy to unblock a locked-out executive, then re-enabled it an hour later, produced drift that resolved itself. A vendor who was granted temporary elevated access for a migration and had it revoked on schedule is not a finding. The skill is in telling these apart from a policy that was quietly loosened and never restored, or a change nobody remembers authorizing.

Signals to check, in order of reliability:

- **Change ticket correlation** — if a PSA is connected (HaloPSA, Autotask, or similar) and a change/service ticket exists covering the same time window and system, treat the drift as authorized and documented. Cite the ticket.
- **Reversion pattern** — if Liongard's timeline shows the setting changed and then changed back within a short window, treat it as transient/intentional unless the "back" state is itself non-compliant.
- **Direction of change** — a change that *weakens* a security-relevant control (MFA requirement removed, conditional access policy scope narrowed, a previously-required standard disabled) is presumptively risky until shown otherwise. A change that *tightens* a control is low-risk by default and rarely needs escalation.
- **No corroboration** — if there is no ticket, no reversion, and the change weakens posture, treat it as unauthorized/risky drift and escalate. Absence of a ticket is not proof of malice, but it is the trigger for asking, not for silently accepting the new state as fine.

## Prioritizing Drift Findings

When a drift pass surfaces multiple findings (common — a single re-run of `cipp__run_standards_check` against a client that hasn't been checked in months can return a dozen deltas), prioritize using this order:

1. **Security-weakening + unauthorized** — a control got weaker and there is no ticket or reversion explaining why. Always highest priority regardless of which framework it maps to.
2. **Security-weakening + authorized** — still worth surfacing (the new state may still be non-compliant even if intentional), but not urgent in the same way.
3. **Administrative/cosmetic drift** — naming changes, non-security metadata, license reassignment within the same tier. Report but do not escalate.
4. **Security-tightening drift** — informational only; note it as a positive change.

Within priority tier 1, further rank by the criticality of the underlying control: identity/MFA and admin-access findings outrank mailbox-rule or naming-convention findings, and anything that touches a system in scope for an active compliance framework (e.g., a system holding PHI for a HIPAA-scoped client) outranks the same finding on an out-of-scope system.

## Common Workflows

1. **Scheduled/on-demand re-check**: pull the last recorded baseline (from a prior standards check or accepted Liongard inspection) → re-run the live check (`cipp__run_standards_check`, fresh `liongard__inspections_run` if a re-inspection is warranted, or just diff against `liongard__timeline_list`) → diff → classify each delta as intentional/unauthorized → prioritize → report.
2. **Reactive investigation** ("has anything changed for this client?"): pull `liongard__timeline_list` and `liongard__detections_list` for the requested window, cross-reference against `cipp__list_audit_logs` for identity-plane changes in the same window, and correlate against PSA tickets if connected.

## Error Handling

- If no baseline exists for a client, do not report drift — report "no baseline established; this check now serves as baseline" and recommend a follow-up check on a defined cadence.
- If `conduit__search_tools` shows no Liongard or CIPP connector for a client, drift detection for that plane is unavailable — say so explicitly rather than reporting "no drift found" (which implies a check occurred).
- If change-ticket correlation cannot be performed because no PSA is connected, do not guess at authorization — report the drift as "unauthorized/unconfirmed" and note that PSA correlation was unavailable.

## Related Skills

- [Evidence Mapping](../evidence-mapping/SKILL.md) — how to resolve the underlying controls being drift-checked to their evidence sources in the first place.
- [Insurance Questionnaires](../insurance-questionnaires/SKILL.md) — a stale or drifted control is exactly the kind of finding that should change how a questionnaire answer is worded.
