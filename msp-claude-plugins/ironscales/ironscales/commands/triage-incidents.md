---
description: Triage open Ironscales phishing incidents — list by status and severity, investigate, and remediate
argument-hint: "[status] [severity] [limit]"
arguments: [status, severity, limit]
---

# Ironscales Incident Triage

Triage open phishing incidents in Ironscales. Lists incidents by status and severity, pulls full detail on the ones that matter, and recommends a remediation action per incident. This is the primary daily security operations command for Ironscales-protected tenants.

## Prerequisites

- Ironscales MCP server connected with valid API key and company ID
- MCP tools `ironscales_incidents_list`, `ironscales_incidents_get`, and `ironscales_remediation_act` available

## Steps

1. **Retrieve open incidents**

   Call `ironscales_incidents_list` with `status=open` (or as specified) and `severity` if provided. Page with `offset`/`limit` until a call returns fewer than `limit` records — the response carries no total count, so there is no page count to precompute.

   The only filters this tool accepts are `status` and `severity`. There is **no `source` parameter**: you cannot ask the API for only user-reported or only AI-detected incidents. If a report needs that split, partition the returned records client-side and say that is what you did.

2. **Prioritise by severity**

   Work `critical` and `high` first. Re-run the list with the `severity` filter rather than pulling the whole queue and sorting locally.

3. **Build the triage summary**

   Present a table of all incidents with: ID, status, severity, subject, sender, recipient count, and created-at. These are the fields this server reads and normalises, so they are the ones safe to tabulate.

4. **Investigate before acting**

   For each incident you intend to remediate, call `ironscales_incidents_get` with `incident_id` and review `threat_indicators` (why the mail was flagged), `recipients`/`recipient_count` (breadth), and the sender-versus-reply-to comparison where the tenant's payload carries a reply-to.

   Optionally, get a second opinion on message content by assembling the raw email into `ironscales_email_classify` (`sender` required). Be explicit that this exports customer message content to Ironscales, that attachments must be metadata only, and that **it changes nothing** — it returns a verdict and does not touch the incident.

5. **Flag high-priority items**

   Escalate immediately:
   - Any incident with a high `recipient_count` (broad campaign)
   - Any cluster of incidents sharing a sending domain or URL pattern — the API has no campaign object, so you must correlate these yourself

6. **Recommend and take remediation**

   Remediation is the only state change available. Call `ironscales_remediation_act` with `incident_id` and one of the five real actions, putting the justification in `reason`:

   - `quarantine` — the recoverable default; the message can be released
   - `delete` — permanent across **all** mailboxes and it destroys the evidence; only for confirmed-malicious mail whose evidence you have already captured
   - `block_sender` — one address, not a domain
   - `mark_false_positive` — **restores** the message to its recipients; a release, not a filing action
   - `report_to_microsoft` — cannot be recalled

   Leave `notify_users` at `false` unless the customer explicitly asked for the notification; that mail goes to their end users and cannot be unsent.

   **There is no auto-classification step.** Nothing on this server labels an incident phishing, spam, or legitimate, so nothing can be labelled in bulk. Every remediation is a human decision on a reviewed incident. Do not batch-remediate incidents you have not opened, and never sweep `delete` across a queue.

7. **State what you could not do**

   If the queue is a campaign, say plainly that campaign-wide **domain blocking is not exposed by this server** — `block_sender` is per-address, and a domain block has to be done in the Ironscales console or the upstream mail filter.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| status | string | No | open | `open`, `in_progress`, `pending`, or `closed`. There is no `resolved` |
| severity | string | No | all | `low`, `medium`, `high`, or `critical` |
| limit | integer | No | 50 | Records per page, max 100 |

## Examples

### Triage All Open Incidents

```
/triage-incidents
```

### Triage the Top of the Queue

```
/triage-incidents --severity critical
```

### Triage All In-Progress Incidents

```
/triage-incidents --status in_progress
```

## Error Handling

- **Authentication errors:** Verify `IRONSCALES_API_KEY` and `IRONSCALES_COMPANY_ID` are correct
- **Empty results when incidents expected:** Confirm the `status` filter matches the expected state; check the Ironscales Platform directly
- **A 400 on the list call:** Usually an enum value that does not exist — `status` accepts only `open`/`in_progress`/`pending`/`closed`, and there is no `source` parameter to pass
- **Remediation fails on an incident:** Check whether it is already `closed`; the resulting error often reads like a permissions failure
- **Remediation reports partial success:** Normal. Reach depends on the customer's M365/Exchange integration. Verify the integration and clear remaining mailboxes manually

## Related Commands

- `/classify-email` - Get an Ironscales AI verdict on raw email content, and act on the result
