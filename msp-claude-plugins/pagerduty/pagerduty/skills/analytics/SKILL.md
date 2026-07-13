---
name: "PagerDuty Analytics"
description: >
  Use this skill when working with PagerDuty analytics -- incident analytics,
  MTTA and MTTR metrics, service-level performance, team workload reporting,
  and operational maturity assessment.
when_to_use: >-
  When working with incident analytics, MTTA and MTTR metrics, service-level performance, team
  workload reporting, and operational maturity assessment in PagerDuty analytics. Use when:
  pagerduty analytics, mtta, mttr, incident metrics, pagerduty reporting, service performance,
  incident frequency, on-call load, or operational metrics.
---

# PagerDuty Analytics

## Overview

PagerDuty Analytics provides data-driven insights into incident response performance. Key metrics include Mean Time to Acknowledge (MTTA), Mean Time to Resolve (MTTR), incident frequency, and responder workload. These metrics help MSPs identify operational bottlenecks, measure SLA compliance, and demonstrate value to clients.

## Key Concepts

### Core Metrics

| Metric | Description |
|--------|-------------|
| **MTTA** | Mean Time to Acknowledge -- average time from incident trigger to first acknowledgement |
| **MTTR** | Mean Time to Resolve -- average time from incident trigger to resolution |
| **MTTE** | Mean Time to Engage -- average time from trigger to first responder engagement |
| **MTTS** | Mean Time to Start -- average time from trigger to first status change |
| **Incident Count** | Total number of incidents in the time period |
| **Interruptions** | Number of off-hours notifications that interrupted responders |

### Aggregation Levels

Analytics can be aggregated at different levels:
- **Account** -- Overall account performance
- **Service** -- Per-service performance
- **Team** -- Per-team workload and performance
- **Escalation Policy** -- Policy-level response metrics

### Time Ranges

All analytics queries require a time range:
- `since` -- Start of the analysis period (ISO 8601)
- `until` -- End of the analysis period (ISO 8601)
- Maximum range varies by endpoint (typically 6 months)

## API Patterns

### Get Incident Analytics

```
pagerduty_get_analytics_incidents
```

Parameters:
- `since` -- Start of date range (ISO 8601)
- `until` -- End of date range (ISO 8601)
- `urgency` -- Filter by urgency (high, low)
- `service_ids[]` -- Filter by service
- `team_ids[]` -- Filter by team

**Example response:**

```json
{
  "data": {
    "mean_seconds_to_acknowledge": 180,
    "mean_seconds_to_resolve": 3600,
    "mean_seconds_to_engage": 120,
    "mean_seconds_to_first_ack": 180,
    "mean_seconds_to_mobilize": 300,
    "total_incident_count": 42,
    "total_interruptions": 8,
    "up_time_pct": 99.5
  },
  "filters": {
    "since": "2026-03-01T00:00:00Z",
    "until": "2026-03-27T00:00:00Z"
  }
}
```

### Get Service Analytics

```
pagerduty_get_analytics_services
```

Parameters:
- `since` -- Start of date range (ISO 8601)
- `until` -- End of date range (ISO 8601)
- `service_ids[]` -- Filter to specific services

**Example response:**

```json
{
  "data": [
    {
      "service_id": "PSVC123",
      "service_name": "Payment API",
      "mean_seconds_to_acknowledge": 120,
      "mean_seconds_to_resolve": 2400,
      "total_incident_count": 15,
      "total_interruptions": 3,
      "up_time_pct": 99.8
    },
    {
      "service_id": "PSVC456",
      "service_name": "Auth Service",
      "mean_seconds_to_acknowledge": 300,
      "mean_seconds_to_resolve": 7200,
      "total_incident_count": 27,
      "total_interruptions": 5,
      "up_time_pct": 98.9
    }
  ]
}
```

## Common Workflows

### Monthly Performance Report

1. Call `pagerduty_get_analytics_incidents` for the past month
2. Call `pagerduty_get_analytics_services` to break down by service
3. Calculate trends by comparing to the previous month
4. Highlight services with degrading MTTA/MTTR
5. Report on total incident count and interruption frequency

### Service-Level SLA Compliance

1. Get analytics for the target service over the SLA period
2. Compare MTTA against the acknowledgement SLA (e.g., < 5 minutes)
3. Compare MTTR against the resolution SLA (e.g., < 4 hours)
4. Calculate uptime percentage
5. Flag any SLA violations

### Identify Problem Services

1. Get per-service analytics for the past 30 days
2. Sort by `total_incident_count` descending to find noisiest services
3. Sort by `mean_seconds_to_resolve` to find slowest-to-resolve services
4. Cross-reference with service dependencies to assess impact
5. Recommend alert tuning or architectural improvements

### On-Call Workload Assessment

1. Get analytics filtered by team for the past month
2. Review `total_interruptions` to measure off-hours impact
3. Compare workload across teams to identify imbalances
4. Review escalation frequency to assess coverage gaps
5. Recommend schedule adjustments for better distribution

### Trend Analysis

1. Query analytics for multiple time periods (e.g., each of the last 6 months)
2. Track MTTA and MTTR trends over time
3. Identify whether incident response is improving or degrading
4. Correlate changes with team size, tool changes, or process improvements
5. Present trends in a summary table

## Metric Interpretation Guide

### MTTA Benchmarks

| MTTA | Assessment |
|------|------------|
| < 1 min | Excellent -- likely automated acknowledgement |
| 1-5 min | Good -- responders are engaged |
| 5-15 min | Acceptable -- room for improvement |
| 15-30 min | Needs attention -- review notification rules |
| > 30 min | Critical -- escalation policies may not be working |

### MTTR Benchmarks

| MTTR | Assessment |
|------|------------|
| < 30 min | Excellent -- fast resolution |
| 30 min - 2 hr | Good -- effective incident response |
| 2-4 hr | Acceptable for complex issues |
| 4-8 hr | Needs review -- investigate bottlenecks |
| > 8 hr | Critical -- consider runbooks and automation |

## Error Handling

### Insufficient Data

**Cause:** No incidents in the requested time range
**Solution:** Expand the time range or remove filters

### Analytics API Rate Limit

**Cause:** Exceeded 60 requests per minute for analytics endpoints
**Solution:** Cache results and reduce query frequency; use broader time ranges

### Time Range Too Large

**Cause:** Requested time range exceeds the maximum (typically 6 months)
**Solution:** Break the query into smaller time windows

## Best Practices

- Generate reports on a weekly or monthly cadence
- Track MTTA and MTTR trends over time, not just point-in-time values
- Compare metrics across services to identify outliers
- Use service-level analytics to justify infrastructure investments
- Monitor interruption counts to protect on-call responder wellbeing
- Set SLA targets for MTTA and MTTR and measure compliance
- Include analytics in client-facing reports to demonstrate operational maturity
- Correlate metric changes with process or tooling changes

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Rate limits and error handling
- [incidents](../incidents/SKILL.md) - Incident data that feeds analytics
- [services](../services/SKILL.md) - Service-level performance context
- [oncall](../oncall/SKILL.md) - On-call workload related to interruptions
