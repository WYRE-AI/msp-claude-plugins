---
description: Classify a specific Ironscales incident email as phishing, spam, or legitimate
argument-hint: "<incident_id> [classification] [comment]"
arguments: [incident_id, classification, comment]
---

# Ironscales Email Classification

Investigate and classify a specific Ironscales phishing incident. Retrieves full incident details including AI indicators, URL verdicts, and message metadata, then applies the specified classification. If no classification is provided, presents the investigation findings and asks for input before classifying.

## Prerequisites

- Ironscales MCP server connected with valid API key and company ID
- MCP tools `ironscales_get_incident`, `ironscales_classify_email`, and `ironscales_remediate_incident` available

## Steps

1. **Retrieve full incident details**

   Call `ironscales_get_incident` with the provided `incident_id`. Extract:
   - Subject, sender, reply-to, sender IP
   - AI verdict and confidence score
   - All indicators (suspicious domain, reply-to mismatch, financial language, etc.)
   - URL verdicts for all links
   - Recipient list
   - Current classification status

2. **Analyze indicators**

   Present a structured analysis:
   - **Strong phishing signals:** REPLY_TO_MISMATCH, SUSPICIOUS_DOMAIN (newly registered), malicious URL verdict, FINANCIAL_REQUEST combined with lookalike sender
   - **Moderate signals:** FIRST_TIME_SENDER, unusual sending time, mismatched display name
   - **Legitimate signals:** Established sender domain, no malicious links, consistent reply-to

3. **Apply classification if provided**

   If `classification` is specified, call `ironscales_classify_email` with the incident ID, classification, and optional comment.

4. **If no classification provided, ask for input**

   Present the full indicator analysis and AI verdict, then ask the user to specify:
   - `phishing` — Confirmed malicious
   - `spam` — Unwanted but not targeted/malicious
   - `legitimate` — Safe email, false positive

5. **After classification, report remediation status**

   Report what remediation actions were automatically triggered:
   - For `phishing`: email removal from mailboxes, sender block
   - For `spam`: sender block
   - For `legitimate`: incident closed, optionally add sender to allowlist

6. **Offer follow-up actions**

   Based on the classification:
   - **Phishing with many recipients:** Offer to block the sender domain with `ironscales_remediate_incident`
   - **Legitimate:** Offer to add sender to allowlist with `ironscales_manage_allowlist`

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| incident_id | string | Yes | Ironscales incident ID (e.g. `INC-10042`) |
| classification | string | No | phishing, spam, or legitimate |
| comment | string | No | Classification reason for audit trail |

## Examples

### Investigate and Classify Interactively

```
/classify-email --incident_id "INC-10042"
```

### Classify Directly as Phishing

```
/classify-email --incident_id "INC-10042" --classification phishing --comment "Confirmed credential phishing via lookalike domain"
```

### Classify as Legitimate

```
/classify-email --incident_id "INC-10041" --classification legitimate --comment "Verified with sender — legitimate vendor notification"
```

## Error Handling

- **Incident not found:** Verify the incident ID is correct; use `/triage-incidents` to list current incidents
- **Incident already classified:** The incident may be in `resolved` or `closed` status — only open incidents can be reclassified
- **Classification has no effect:** Verify the API key has write permissions in Ironscales Platform > Settings > API

## Related Commands

- `/triage-incidents` - Triage all open incidents by status and AI confidence
