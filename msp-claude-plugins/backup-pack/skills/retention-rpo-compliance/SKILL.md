---
name: "Retention & RPO Compliance"
when_to_use: >-
  When checking whether actual backup retention configuration and cadence
  meet a contracted or required policy, rather than assuming the appliance
  defaults are adequate. Use when: retention compliance, RPO compliance,
  retention policy, recovery point objective, are we meeting retention
  requirements, backup contract compliance, retention gap, how far back can
  we restore.
description: >
  Use this skill to check actual retention configuration and backup cadence
  against contracted/required retention policy and RPO (recovery point
  objective) targets — detecting gaps where a client's contract specifies a
  retention window the appliance isn't actually configured for, or an RPO
  target the current backup frequency can't actually meet.
---

# Retention & RPO Compliance

## Overview

Retention and RPO commitments are made in two places that routinely drift apart: the
contract or SOW (what was promised — "1-year retention," "4-hour RPO") and the actual
backup system configuration (what's actually happening — a 90-day local retention
policy, a nightly-only backup schedule). Nobody discovers the gap until a restore
request for month 8 of a promised 12-month retention window comes back empty, or a
ransomware event reveals that the "4-hour RPO" client's most recent recovery point is
actually 22 hours old. This skill exists to find that gap proactively by comparing
what's promised against what's configured — not to audit whether backups are running
(`backup-job-health`) or recoverable (`restore-test-verification`), both of which are
prerequisites to this check actually meaning anything.

## Key Concepts

### Retention: contracted vs. configured

Retention is the length of time recovery points remain available for restore. The
check here is mechanical but frequently skipped: pull the contracted/required
retention value (from a documentation platform, contract record, or explicit org
policy) and the actual configured retention window from the backup/BCDR tool itself,
and compare them directly.

Two distinct gap types matter differently:

- **Configured-shorter-than-contracted** — e.g. contract specifies 1-year retention,
  appliance is configured for 90 days. This is a direct compliance failure: the MSP
  is not delivering what was promised, and a restore request past the configured
  window will simply fail. Always the higher-severity finding.
- **Storage-forced truncation** — retention is *configured* correctly, but the
  appliance is running out of local storage and silently purging older recovery
  points before the configured window elapses (see `backup-job-health`'s storage-
  trending section for the leading indicator). This is a compliance failure with a
  different root cause and a different fix (capacity, not configuration) — report it
  distinctly rather than merging it with a simple misconfiguration.

Where a client has no documented retention requirement at all, don't fabricate a
default — report the appliance's actual configured retention as informational and
flag the absence of a documented requirement as its own gap ("no contracted retention
policy on file to check against").

### RPO: target vs. achievable

RPO (recovery point objective) is the maximum acceptable amount of data loss,
expressed as time — "we can tolerate losing at most 4 hours of data." RPO is not
something a backup tool configures directly; it's a target that backup *frequency*
either can or cannot meet. The check is: given the current backup schedule (how often
jobs actually run and succeed), what is the realistic worst-case age of the most
recent usable recovery point, and does that fit inside the contracted RPO?

- A nightly-only backup schedule cannot meet an RPO tighter than roughly 24 hours
  (worse, in practice, if the nightly job sometimes fails — the achievable RPO in a
  failure scenario is however old the last *successful* recovery point is, not the
  scheduled cadence).
- Don't evaluate RPO against the schedule alone — cross-reference the job success
  history from `backup-job-health`. A job scheduled hourly but failing three runs in
  a row has an actual achievable RPO much worse than its schedule implies.
- Where no RPO target is documented, report the achievable RPO as informational
  (derived from schedule + recent success rate) and flag the absence of a documented
  target explicitly, the same way as an undocumented retention requirement.

### Sourcing the "contracted/required" side of the comparison

The contracted or required side of this comparison usually isn't in the backup tool
at all — it lives in a PSA contract/service record, a documentation platform entry, or
an explicit statement from the person running the check. Don't infer a retention or
RPO requirement from the backup tool's own defaults; that would just compare the
system to itself and always pass. If no documented requirement can be found anywhere
connected, say so plainly rather than treating "whatever is configured" as
automatically compliant.

### If no backup/BCDR tool is connected

State plainly that retention/RPO compliance cannot be checked: "No backup or BCDR
connector is connected through the gateway, so there's no configured retention or
backup cadence to compare against requirements." Do not fabricate configured values.

## Common Workflows

### Portfolio-wide retention/RPO sweep

1. Discover connected backup/BCDR tools via `conduit__search_tools`.
2. For each client, pull contracted/required retention and RPO values from whatever
   documentation or contract source is connected (or note that none is available).
3. Pull actual configured retention and recent job-cadence/success data from the
   connected backup tool(s).
4. Compute gaps: configured-shorter-than-contracted retention, storage-forced
   truncation risk, and achievable-RPO-vs-target mismatch.
5. Report gaps ranked by severity: contracted-retention violations first, then
   RPO-target misses, then storage-forced-truncation risk, then informational-only
   findings (no documented requirement to compare against).

### Single-client compliance check

1. Resolve the client's contracted retention/RPO requirement and its connected
   backup tool(s).
2. Run the comparison for that client only and report the specific gap, if any, in
   concrete terms (e.g., "contract requires 365-day retention; SIRIS appliance is
   configured for 90 days — 275-day shortfall").

## Error Handling

- **No backup/BCDR connector connected:** stop and say so; do not fabricate
  configured retention or cadence.
- **No documented contracted retention/RPO found:** report the actual configured
  values as informational and flag the missing requirement explicitly — never assume
  the configured value is automatically "compliant" because there's nothing to
  compare it to.
- **Retention value not directly exposed by the connector API:** derive it from the
  oldest available recovery point if possible, note that it's a derived estimate
  rather than a directly-configured value, and say so.

## Best Practices

- Always state both sides of the comparison explicitly in output — the contracted/
  required value and the actual configured value — never just a pass/fail verdict.
- Distinguish configuration gaps from storage-forced truncation; they have different
  owners and different fixes.
- Compute achievable RPO from actual job success history, not just the nominal
  schedule.
- Never treat "no documented requirement" as equivalent to "compliant" — flag the
  missing documentation as its own gap.

## Related Skills

- [Backup Job Health](../backup-job-health/SKILL.md) — storage-consumption trending
  here is the leading indicator for storage-forced retention truncation; job success
  history is required to compute an achievable RPO accurately.
- [Restore-Test Verification](../restore-test-verification/SKILL.md) — a retention
  window that's configured correctly but has never been restore-tested still leaves
  open the question of whether those retained recovery points are actually usable.
