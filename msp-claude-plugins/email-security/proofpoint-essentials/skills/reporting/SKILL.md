---
name: "Proofpoint Essentials Reporting"
description: >
  Proofpoint Essentials inbound and outbound email flow reporting: time-series
  mail volume and disposition metrics for a customer org, how to interpret
  them, and how to build recurring MSP status reports from them.
when_to_use: >-
  When retrieving or interpreting inbound/outbound mail flow metrics for a
  Proofpoint Essentials org. Use when: proofpoint essentials reporting,
  proofpoint essentials report, mail flow metrics, inbound email stats,
  outbound email stats, email volume report, or proofpoint essentials
  dashboard.
---

# Proofpoint Essentials Reporting

## Overview

Essentials reporting returns **org-level, time-series mail flow metrics** —
volume and disposition of inbound and outbound mail over a date range. This
is aggregate traffic reporting for an org, not per-message search or
quarantine detail (Essentials does not expose the message-level forensics
that Proofpoint TAP does — see the sibling `proofpoint` plugin if that's
what's actually being asked for). Resolve the org's regional pod
first (see `api-patterns`) before requesting a report.

## Anti-triggers

- **Per-message search, quarantine actions, or threat/click forensics** —
  Essentials reporting is aggregate volume only. Message-level detail and
  quarantine management belong to a different capability set than this
  plugin currently documents.
- **User or domain configuration** — that's `user-management` and
  `org-management`. This skill only covers the metrics endpoint.
- **Proofpoint TAP threat/SIEM reporting** — a different product and API;
  use the sibling `proofpoint` plugin's `proofpoint-tap` skill.

## Key Concepts

### Inbound vs. outbound

Reporting is split by direction:

| Direction | What it measures |
|-----------|-------------------|
| Inbound | Mail arriving at the org's protected domains — volume, and how much was allowed vs. filtered |
| Outbound | Mail sent from the org's protected domains through Essentials |

Request each direction explicitly; a report call scoped to `inbound` will
not also return outbound figures.

### It's a time series, not a single snapshot

Reporting data is returned as a series of data points across the requested
date range, not one aggregate total. Always read the granularity of the
returned series (e.g. daily buckets) before summarizing — averaging or
summing without checking bucket size produces numbers that don't mean what
they look like they mean.

## MCP Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `proofpoint_essentials_reporting_get` | Get inbound or outbound mail flow time-series for an org | `org_name`, `direction` (`inbound`\|`outbound`), `start_date`, `end_date` |

There is a single reporting tool covering both directions — call it twice
(once per direction) to build a full inbound + outbound picture.

## Common Workflows

### Monthly MSP status report for a customer

1. Confirm the org's regional pod is resolved.
2. Call `proofpoint_essentials_reporting_get` with `direction=inbound` for
   the reporting month.
3. Call `proofpoint_essentials_reporting_get` with `direction=outbound` for
   the same window.
4. Compare against the prior month's figures (re-run both calls for the
   prior period, or reuse a saved result) to show trend, not just a
   snapshot.
5. Present volume and any notable delta — do not silently drop a direction
   just because it was flat; a flat outbound trend is itself worth stating
   explicitly for a customer expecting growth.

### Investigate a mail-volume anomaly a customer reported

1. Pull a narrower date range around the reported anomaly for both
   directions.
2. Compare the anomalous window against the same period the prior week to
   distinguish a real spike/drop from normal day-of-week variation.
3. If inbound volume dropped sharply, check org and domain state
   (`org-management`) before assuming an Essentials-side problem — a
   deactivated org or a domain that fell out of DNS verification produces
   the same symptom as an actual mail-flow issue.

## Error Handling

| Symptom | Cause | Resolution |
|---------|-------|------------|
| Empty series for an active, known-good org | Wrong regional pod, or date range outside retained reporting data | Re-run endpoint discovery; narrow the date range |
| Inbound and outbound totals don't reconcile with the customer's own mail platform counts | Different measurement points (Essentials counts what transited Essentials, not total mailbox traffic) | State the metric's scope explicitly rather than presenting it as a total traffic count |
| Report looks flat/zero right after onboarding | Domain not yet DNS-verified, so mail isn't routing through Essentials yet | Confirm domain verification state before troubleshooting reporting itself |

## Related Skills

- [Proofpoint Essentials API Patterns](../api-patterns/SKILL.md) - Auth, regional pod resolution, batch semantics
- [Proofpoint Essentials Org Management](../org-management/SKILL.md) - Org, domain, feature, and licensing management
- [Proofpoint Essentials User Management](../user-management/SKILL.md) - Mailbox user CRUD
