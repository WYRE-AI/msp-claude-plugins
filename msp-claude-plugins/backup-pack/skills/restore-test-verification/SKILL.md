---
name: "Restore-Test Verification"
description: >
  Whether a backup is actually recoverable rather than merely present: the
  ranked hierarchy of restore evidence (actual restore performed, full
  boot/virtualization verification, screenshot verification, spot-check
  restore drill, no evidence at all), adequate test cadence per
  data-criticality tier, and why a never-tested backup is the
  highest-priority finding — outranking even an actively failing job.
when_to_use: >-
  When determining whether a backup is actually recoverable, not just present
  — tracking restore/DR test history, screenshot or boot-verification status,
  and testing cadence adequacy. Use when: restore test, DR test, can we
  actually restore this, backup verification, has this ever been restored,
  restore drill, boot verification, screenshot verification, untested
  backups.
---

# Restore-Test Verification

## Overview

A backup job reporting "success" proves that data was copied somewhere. It proves
nothing about whether that data can be turned back into a working system or a usable
file when someone actually needs it. Corruption, encryption-key problems, application-
consistency failures, and format incompatibilities routinely surface only at restore
time — never during the backup run itself. The gap between "backed up" and
"recoverable" is where most DR failures actually happen, and it is invisible from a
job-success dashboard. This skill exists to make that gap visible: tracking what
restore-test evidence actually exists per protected system, and flagging where it
doesn't.

This skill assumes backup jobs are already running (see `backup-job-health` for that
layer) and asks the next question: if this needed to be restored today, is there any
evidence it actually could be?

## Anti-triggers

- **Fetching a screenshot or boot-verification record** — the screenshot,
  activity, and asset endpoints are the appliance's own API surface; use
  `datto-bcdr-api-patterns`. This skill weighs what that evidence proves and
  flags where none exists.
- **Answering "are backups tested?" on an insurance or audit form** — the
  evidence-labelling discipline for that context lives in
  `insurance-questionnaires` (compliance-pack), which draws on this skill's
  finding rather than reproducing it.

## Key Concepts

### "Exists" vs. "recoverable" evidence, ranked

Not all restore evidence is equally strong. From strongest to weakest:

1. **Actual restore performed** — a real recovery event (production failover, file
   recovery request, or a deliberate DR drill) where the data was genuinely restored
   and validated. Strongest possible evidence; also the rarest.
2. **Full boot/virtualization verification** — the protected system was virtualized
   from its backup image and confirmed to boot and respond (some BCDR appliances,
   e.g. Datto BCDR, run this automatically). Strong evidence for image-based
   appliance backups — it proves the image is bootable, though it doesn't fully
   validate application-level data integrity inside the guest.
3. **Screenshot verification** — an automated screenshot of the virtualized boot
   screen, confirming the OS reached a login prompt or desktop rather than a boot
   error. Weaker than full boot verification but far stronger than nothing — it's
   the closest-to-continuous proxy most appliance vendors offer. Treat a "successful
   backup" with a *failed* screenshot verification as a recovery risk, not a pass —
   see `backup-job-health` for the point that both signals must be checked together.
4. **Spot-check restore drill** — a manual, periodic restore of a sample file,
   mailbox, or object to confirm data integrity, without a full system failover. This
   is the primary evidence type available for SaaS-data snapshot backups (Datto SaaS
   Protection, Spanning), which generally don't offer a "boot" concept at all — a
   spot-check restore of a mailbox or SharePoint file is the equivalent verification
   action.
5. **No test evidence at all** — a backup with a clean job-success history and no
   restore, boot-verification, screenshot, or spot-check record of any kind. Treat
   this explicitly as **untested**, not merely "unverified" — it should be reported
   as a finding in its own right, not omitted because nothing failed.

Never let a long streak of successful backup *jobs* stand in for restore evidence.
They answer different questions.

### Adequate testing cadence by data-criticality tier

There is no universal "right" cadence — it should scale with how critical the
protected system is to the client's operations. In the absence of an org-documented
policy, apply these as defaults and state explicitly that they're defaults:

| Criticality tier | Example systems | Suggested minimum test cadence |
|---|---|---|
| Tier 1 — mission-critical | Line-of-business database/ERP, domain controllers, production file servers | Quarterly full or partial restore drill; continuous screenshot/boot verification where the vendor supports it |
| Tier 2 — important | Departmental servers, secondary application servers | Semi-annual restore drill |
| Tier 3 — standard | Workstations, non-critical file shares | Annual restore drill, or continuous screenshot verification alone if the vendor offers it and no drill has occurred |
| SaaS mailboxes/files (Datto SaaS Protection, Spanning) | M365/Google Workspace/Salesforce data | Semi-annual spot-check restore of a sample of mailboxes/files per protected tenant |

Where the org has documented its own required cadence (e.g., in a connected
documentation platform or contract), use that instead and say so.

### Flagging never-tested backups

A backup that has never been restore-tested by any of the evidence types above,
regardless of job-success history or how long it's been running, is the single
highest-priority finding this skill produces. Rank never-tested Tier 1 systems above
everything else, including active job failures caught by `backup-job-health` — a
currently-failing job is at least a known, visible problem; a never-tested backup is
an unknown one that looks fine until the moment it matters most.

### If no backup/BCDR tool is connected

State plainly that restore-test verification cannot run: "No backup or BCDR connector
is connected through the gateway, so there's no restore-test history to check."
Do not fabricate test dates or pass/fail status.

## Common Workflows

### Portfolio-wide untested-backup sweep

1. Discover connected backup/BCDR tools via `conduit__search_tools`.
2. For each protected unit, pull the strongest available restore-evidence type (per
   the ranking above) and its most recent date.
3. Classify against the criticality-tiered cadence table: current, due, overdue, or
   never-tested.
4. Report never-tested Tier 1 systems first, then overdue Tier 1, then the rest in
   descending criticality/staleness order.

### Single-client restore-readiness check

1. Resolve the client to its protected units across connected tools.
2. Pull restore-evidence history for each unit.
3. Report per-unit status against the applicable cadence, with a recommended next
   test date.

## Error Handling

- **No backup/BCDR connector connected:** stop and say so; do not fabricate restore
  history.
- **A connector doesn't expose restore/screenshot history via its API:** report job
  health normally (per `backup-job-health`) and mark restore-test status "unable to
  verify — connector does not expose restore-test history" rather than assuming
  untested or omitting the system from the report.
- **Criticality tier unknown for a given system:** state that the default (Tier 2)
  cadence was applied pending a documented criticality classification, rather than
  guessing a tier silently.

## Best Practices

- Recommend, don't schedule or execute, an actual restore drill — this skill flags
  the gap; performing the drill is a human/scheduled action with its own change-
  control considerations.

## Related Skills

- [Backup Job Health](../backup-job-health/SKILL.md) — confirms jobs are running at
  all; this skill assumes that and asks whether the result is recoverable.
- [Retention/RPO Compliance](../retention-rpo-compliance/SKILL.md) — a recoverable
  backup that doesn't retain far enough back, or isn't frequent enough to meet an
  RPO target, is still a compliance gap even when restore-tested successfully.
