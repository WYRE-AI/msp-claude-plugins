---
description: Summarize the PandaDoc proposal pipeline by status, value, and age
argument-hint: "[tag] [days] [show_stale]"
arguments: [tag, days, show_stale]
---

# PandaDoc Proposal Pipeline

Summarize the proposal pipeline -- documents grouped by status (draft, sent, viewed, completed, declined, expired), with total values and age metrics. Provides MSP sales pipeline visibility and identifies stale proposals that need attention.

## Prerequisites

- PandaDoc MCP server connected with a valid API key
- MCP tools `pandadoc-list-documents` and `pandadoc-get-document` available

## Steps

1. **Fetch documents by status**

   Make parallel calls to `pandadoc-list-documents` for each pipeline stage:
   - `status=document.draft` with `count=100`
   - `status=document.sent` with `count=100`
   - `status=document.viewed` with `count=100`
   - `status=document.completed` with `count=100`
   - `status=document.declined` with `count=100`
   - `status=document.expired` with `count=100`
   - `status=document.voided` with `count=100`

   Paginate each status if more than 100 results.

2. **Enrich with details** for key documents

   For documents in active stages (sent, viewed), call `pandadoc-get-document` with `id` to get:
   - Grand total (proposal value)
   - Recipient completion status
   - Expiration date

3. **Calculate pipeline metrics**

   - Count documents per status
   - Sum grand totals per status
   - Calculate average age (days since created) per status
   - Identify stale proposals (sent > 7 days, viewed > 3 days without completion)
   - Calculate win rate (completed / (completed + declined + expired))

4. **Identify action items**

   - Drafts older than 7 days (may be forgotten)
   - Sent documents with no views after 3 days
   - Viewed documents not completed after 3 days
   - Documents expiring within 7 days

5. **Format and present** the pipeline summary

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| tag | string | No | all | Filter by document tag |
| days | integer | No | 90 | Look back period in days |
| show_stale | boolean | No | true | Highlight stale proposals needing follow-up |

## Examples

### Full Pipeline Summary

```
/proposal-pipeline
```

### Last 30 Days

```
/proposal-pipeline --days 30
```

### Specific Client

```
/proposal-pipeline --tag "Acme Corp"
```

### Pipeline Without Stale Alerts

```
/proposal-pipeline --show_stale false
```

## Output

### Full Pipeline Summary

```
PandaDoc Proposal Pipeline
================================================================
Generated: 2026-02-24
Period:    Last 90 days

Pipeline Overview:
+-------------------+-------+--------------+----------+
| Stage             | Count | Total Value  | Avg Age  |
+-------------------+-------+--------------+----------+
| Draft             | 4     | $67,500      | 3 days   |
| Sent              | 7     | $148,200     | 5 days   |
| Viewed            | 3     | $62,000      | 2 days   |
| Completed (Won)   | 18    | $324,000     | -        |
| Declined (Lost)   | 4     | $58,500      | -        |
| Expired           | 2     | $22,000      | -        |
| Voided            | 1     | $8,000       | -        |
+-------------------+-------+--------------+----------+

Active Pipeline: 14 proposals worth $277,700
Closed Won:      18 proposals worth $324,000

Win Rate:        75.0% (18 won / 24 resolved)
Avg. Time to Sign: 4.8 days
Avg. Deal Size:    $18,000

Top Active Proposals (by value):
+--------------------------------------------+-----------+---------+-----------+
| Proposal                                   | Status    | Value   | Age       |
+--------------------------------------------+-----------+---------+-----------+
| Enterprise Holdings - MSA Renewal          | Sent      | $48,000 | 3 days    |
| Global Services - Cloud Migration SOW      | Viewed    | $35,000 | 1 day     |
| TechStart Inc - Security Assessment        | Sent      | $28,500 | 6 days    |
| Acme Corp - Hardware Refresh               | Sent      | $22,800 | 2 days    |
| Metro Industries - Managed Services        | Draft     | $18,000 | 1 day     |
+--------------------------------------------+-----------+---------+-----------+

================================================================
```

### Stale Proposal Alerts

```
Action Required - Stale Proposals
================================================================

SENT > 7 DAYS (no response):
  1. Riverside Dental - Managed Services Agreement
     Value: $4,500/month | Sent: 2026-02-14 (10 days ago)
     Recipient: Dr. Martinez <martinez@riverside.com> - NOT VIEWED
     Action: Follow up with phone call or email

  2. Cedar Grove Realty - IT Proposal
     Value: $3,200/month | Sent: 2026-02-12 (12 days ago)
     Recipient: Tom Adams <tom@cedargrove.com> - NOT VIEWED
     Action: Follow up or void and revise

VIEWED > 3 DAYS (opened but not signed):
  1. Summit Financial - SOW Phase 2
     Value: $45,000 | Viewed: 2026-02-19 (5 days ago)
     Recipient: Emily Walsh <emily@summit.com> - VIEWED, NOT SIGNED
     Action: Follow up to address concerns

EXPIRING WITHIN 7 DAYS:
  1. Harbor Consulting - Annual MSA Renewal
     Value: $6,000/month | Expires: 2026-02-28 (4 days remaining)
     Recipient: James Liu <james@harbor.com> - SENT, NOT VIEWED
     Action: Contact urgently before expiration

DRAFTS > 7 DAYS (may be forgotten):
  1. Lakewood Partners - Security Proposal
     Value: $8,000 | Created: 2026-02-10 (14 days ago)
     Action: Complete and send, or delete if no longer needed

================================================================
```

### Empty Pipeline

```
No proposals found in the last 90 days.

Get started:
  - Create a proposal: /create-document --template "Service Proposal"
  - List available templates: /list-templates
  - Visit PandaDoc to create your first template: app.pandadoc.com
```

### Rate Limit During Aggregation

```
Warning: Rate limit reached during pipeline data collection.

Partial results available for 4 of 7 status categories.
Retry in 60 seconds to complete the pipeline summary.

Tip: The proposal-pipeline command makes multiple API calls.
Use --tag to filter and reduce the number of calls.
```

## Metrics Reference

| Metric | Formula | Description |
|--------|---------|-------------|
| Win Rate | Completed / (Completed + Declined + Expired) | Percentage of resolved proposals that were won |
| Avg. Time to Sign | Mean(date_completed - date_sent) for completed docs | Average days from send to completion |
| Avg. Deal Size | Sum(grand_total) / Count for completed docs | Average value of won proposals |
| Active Pipeline | Sum(grand_total) for draft + sent + viewed | Total value of proposals in progress |
| Stale Rate | Stale proposals / Active proposals | Percentage of active proposals needing attention |

## Error Handling

### MCP Connection Error

```
Error: Unable to connect to PandaDoc MCP server

Check your MCP configuration and regenerate the API key at app.pandadoc.com > Settings > API
```

### Rate Limit

```
Error: Rate limit exceeded (429)

The proposal-pipeline command makes multiple API calls to aggregate data.
Please wait a moment and try again.

Tip: Use --tag to filter and reduce API calls.
```

### Timeout

```
Warning: Data collection timed out.

Partial pipeline results collected.
This can happen with large document volumes.

Suggestions:
  - Use --days 30 to narrow the time window
  - Use --tag to filter by client or type
  - Try again during off-peak hours
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `pandadoc-list-documents` | Fetch documents by status (multiple calls) |
| `pandadoc-get-document` | Get document details, value, and recipients |

## Use Cases

### Weekly Sales Meeting

Generate a pipeline overview for your weekly team meeting:
```
/proposal-pipeline --days 30
```

### Client QBR Preparation

Review all proposals for a specific client:
```
/proposal-pipeline --tag "Acme Corp"
```

### End-of-Quarter Push

Find stale proposals to follow up on before quarter end:
```
/proposal-pipeline --show_stale true
```

### Monthly Performance Review

Analyze win rates and deal sizes over the last quarter:
```
/proposal-pipeline --days 90
```

## Related Commands

- `/create-document` - Create a new proposal
- `/send-document` - Send a proposal for signature
- `/document-status` - Check a specific proposal's status
- `/list-templates` - Browse proposal templates
