---
description: Triage open Ironscales phishing incidents — list by status, classify, and remediate
argument-hint: "[status] [source] [auto_classify] [limit]"
arguments: [status, source, auto_classify, limit]
---

# Ironscales Incident Triage

Triage open phishing incidents in Ironscales. Lists incidents by status, reviews AI verdicts and confidence scores, classifies high-confidence detections, and surfaces ambiguous incidents for manual review. This is the primary daily security operations command for Ironscales-protected tenants.

## Prerequisites

- Ironscales MCP server connected with valid API key and company ID
- MCP tools `ironscales_list_incidents`, `ironscales_get_incident`, `ironscales_classify_email`, and `ironscales_remediate_incident` available

## Steps

1. **Retrieve open incidents**

   Call `ironscales_list_incidents` with `status=open` (or as specified). Apply `source` filter if provided. Paginate through all results up to `limit`.

2. **Sort and categorize**

   Sort incidents into three categories:
   - **High confidence** (`aiConfidence >= 0.9`) — AI is highly confident in the verdict
   - **Medium confidence** (`aiConfidence 0.5–0.89`) — Requires manual review
   - **Low confidence / Likely legitimate** (`aiConfidence < 0.5`) — Likely false positives

3. **Build triage summary**

   Present a table of all incidents with: ID, status, source, subject, sender, AI verdict, confidence score, and recipient count.

4. **Auto-classify if requested**

   If `auto_classify=true`, classify all `aiVerdict=phishing` incidents with `aiConfidence >= 0.9` using `ironscales_classify_email`. Show a summary of auto-classified incidents.

5. **Flag high-priority items**

   Escalate immediately:
   - Any incident with `recipientCount > 20` (broad campaign)
   - Any incident where `aiVerdict=phishing` and `source=USER_REPORT` with `aiConfidence >= 0.9` (user-confirmed and AI-confirmed)

6. **Provide next-step recommendations**

   For each category:
   - High confidence phishing: recommend classification and remediation
   - Medium confidence: recommend reviewing full incident details with `/classify-email`
   - Low confidence / likely legitimate: recommend classifying as `legitimate` and allowlisting frequent senders

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| status | string | No | open | Incident status filter |
| source | string | No | all | USER_REPORT or AI_DETECTION |
| auto_classify | boolean | No | false | Auto-classify high-confidence phishing detections |
| limit | integer | No | 50 | Max incidents to return |

## Examples

### Triage All Open Incidents

```
/triage-incidents
```

### Triage with Auto-Classification

```
/triage-incidents --auto_classify true
```

### Triage User-Reported Incidents Only

```
/triage-incidents --source USER_REPORT
```

### Triage All In-Progress Incidents

```
/triage-incidents --status in_progress
```

## Error Handling

- **Authentication errors:** Verify `IRONSCALES_API_KEY` and `IRONSCALES_COMPANY_ID` are correct
- **Empty results when incidents expected:** Confirm the `status` filter matches the expected state; check the Ironscales Platform directly
- **Classification errors:** Verify the incident is still in `open` or `in_progress` status before classifying

## Related Commands

- `/classify-email` - Classify a specific email with full investigation context
