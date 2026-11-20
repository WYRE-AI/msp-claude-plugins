---
name: "Restore-Test Verification"
description: >
  Whether a backup is actually recoverable rather than merely present: the
  ranked hierarchy of restore evidence (actual restore performed, full
  boot/virtualization verification, screenshot verification, spot-check
  restore drill, no evidence at all), adequate test cadence per
  data-criticality tier, and why a never-tested backup is the
  highest-priority finding — outranking even an actively failing job.
  Also scores restore-test recency per client (days since the last real
  evidence against the tier window) so clients with no recent restore test
  are flagged and a test is drafted for review.
when_to_use: >-
  When determining whether a backup is actually recoverable, not just present
  — tracking restore/DR test history, screenshot or boot-verification status,
  and testing cadence adequacy. Use when: restore test, DR test, can we
  actually restore this, backup verification, has this ever been restored,
  restore drill, boot verification, screenshot verification, untested
  backups, restore test recency, when did we last test a restore, clients
  with no recent restore test, overdue restore test.
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

### Restore-test recency per client

Recency is the age of the strongest evidence you can actually find, measured
against the tier window above. Score it per protected system, then roll up per
client so a service manager sees which clients have gone longest without proof
of recovery.

| State | Meaning |
|---|---|
| Current | Evidence of type 1, 2 or 4 dated inside the tier window, or type 3 (screenshot) for Tier 3 |
| Due | Newest qualifying evidence is older than 75% of the window |
| Overdue | Newest qualifying evidence is older than the window |
| Never tested | No type 1-4 evidence found anywhere checked |

For Tier 1 and 2, screenshot verification alone does not make a system
Current: age it by the newest type 1, 2 or 4 evidence, and treat a system with
screenshots but no drill on record as Overdue.

Client roll-up: the client takes the worst state among its Tier 1 systems, then
Tier 2, then Tier 3. SaaS tenants (the semi-annual row above) roll up as Tier 2
unless the org documents them as Tier 1, and the ticket rule below treats them
that way. Report the oldest evidence age and the count of systems in
each state, not an average. A client with ten Current workstations and one
Never-tested domain controller is a Never-tested client.

Where each kind of evidence lives, since few tools log a manual drill:

| Evidence | Where to look |
|---|---|
| Screenshot or boot verification | `datto_bcdr_list_screenshots` per asset; read the status and timestamp of the newest passing result, and count consecutive failures |
| Restore or recovery events on appliances | `unitrends_list_job_history` and `unitrends_list_recovery_points`; look for restore-type entries rather than backup runs. Job history returns only the most recent page whatever `since`/`until` say, so older restore jobs may be missing; treat absence there as inconclusive |
| SaaS restores | `spanning_list_audit_log` (the admin audit log, including restores; Read tier), and for Datto SaaS Protection the PSA or documentation record, since the connector exposes backup status but no restore history |
| Deliberate DR drills and spot-check restores | PSA tickets (search closed tickets with restore, DR test or recovery drill wording against the client) and the client's DR runbook or documentation page in IT Glue or Hudu |

A restore found only in a PSA ticket is type 1 or 4 evidence only if the ticket
says what was restored and that it was validated. A closed ticket titled "DR
test" with no detail is a lead to confirm, not evidence; list it as such.

Do not call `unitrends_queue_restore` or `spanning_queue_restore` to "check" that a restore works. Queueing a restore is a state-changing action
with its own approval path; this skill only reads history and recommends.

**Draft the test, do not schedule it.** For every client that is Overdue or
Never tested on a Tier 1 or Tier 2 system, draft one ticket for review: the
systems and their evidence age, the test type that fits the vendor (boot or
screenshot review plus a file-level restore for appliance backups; a
mailbox or OneDrive file spot-check for SaaS backups), a proposed window, and
the sign-off the client needs to give before a restore touches production.
Check the PSA for an existing open drill ticket first and reference it instead
of drafting a duplicate. Do not call a PSA create tool.

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

### Weekly recency roll-up

1. Run the portfolio sweep above to get the strongest evidence and its date per
   system.
2. Apply the recency states per system, then roll up per client using the worst
   Tier 1 state first.
3. Report clients ordered Never tested, Overdue, Due, Current, each with oldest
   evidence age, system counts per state, and one sentence on the main gap. This
   roll-up sits next to the backup trend label from `backup-job-health` and is
   what a client health score consumes as its restore-recency input.
4. Draft the per-client restore-test tickets described above, for review only.
5. Compare against last week's roll-up if one is available, so a client that
   moved from Overdue to Current (or the reverse) is called out. If no prior
   roll-up exists, say this is the baseline rather than inventing a prior state.

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
