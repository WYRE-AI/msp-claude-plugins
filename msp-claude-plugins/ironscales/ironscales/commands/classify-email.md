---
description: Get an Ironscales AI verdict on a raw email, then act on it with a remediation action
argument-hint: "<sender> [subject] [body] [incident_id]"
arguments: [sender, subject, body, incident_id]
---

# Ironscales Email Classification

Submit a raw email to Ironscales' AI classifier and get a verdict back, then — separately and deliberately — take a remediation action if the email corresponds to an incident.

**Read this first.** `ironscales_email_classify` is stateless. It POSTs an email you assemble and returns a verdict. It takes **no incident ID**, sets no classification on any incident, and changes no state anywhere. There is no tool on this server that writes a phishing/spam/legitimate verdict onto an existing incident. If you want incident state to change, that is a separate `ironscales_remediation_act` call, and this command will not make it for you without saying so.

This command therefore does two distinct things, and reports them separately:

1. **Analysis** — a verdict on message content. Changes nothing.
2. **Action** — an optional remediation on a named incident. Changes mail delivery.

## Prerequisites

- Ironscales MCP server connected with valid API key and company ID
- MCP tools `ironscales_email_classify`, `ironscales_remediation_act`, `ironscales_incidents_get`, and `ironscales_allowlist_manage` available

## Steps

1. **Confirm authorisation before sending content**

   This call ships the customer's message — subject, plain-text body, HTML body, URLs, headers — outbound to Ironscales for analysis. Confirm you are authorised for that tenant before pasting anything in. Pass attachment **metadata only** (`filename`, `content_type`, `size_bytes`); the schema has no field for file contents and you must not invent one.

2. **Assemble the email**

   Build the `ironscales_email_classify` payload. `sender` is required; everything else is optional: `subject`, `sender_display_name`, `reply_to`, `body_text`, `body_html`, `headers`, `urls`, `attachments`.

   If an `incident_id` was supplied, call `ironscales_incidents_get` first and use the incident to populate what you can — `sender`, `subject`, and whatever else that tenant's payload carries. Do not fabricate fields the incident did not contain.

3. **Classify**

   Call `ironscales_email_classify`. The response is a verdict — typically a classification, a confidence score, and threat-type/indicator lists — and nothing else.

   Report it as analysis. Do **not** say the incident was classified, resolved, or updated, because none of that happened.

4. **Combine with incident indicators**

   Where an `incident_id` was supplied, present the AI verdict alongside the incident's own `threat_indicators`, its `recipient_count` and `recipients` (breadth), and a sender-versus-reply-to comparison if the payload carries a reply-to. A reply-to that diverges from the sender domain is the strongest BEC signal available here.

5. **Decide, then act — as a separate step**

   State the recommended action and why, then take it only with the user's agreement. `ironscales_remediation_act` requires `incident_id` and `action`, with an optional `reason` for the audit trail:

   | Action | Effect | Reversible? |
   |---|---|---|
   | `quarantine` | Moves the message out of inboxes | Yes — can be released |
   | `delete` | Permanently removes it from **all** mailboxes | **No** — destroys the evidence |
   | `block_sender` | Blocks that one sender address | Yes, via the blocklist |
   | `mark_false_positive` | Marks it legitimate and **restores** it to recipients | Reverses containment |
   | `report_to_microsoft` | Submits the message to Microsoft | **No** — cannot be recalled |

   `quarantine` is the default. Use `delete` only on confirmed-malicious mail whose evidence you have already captured. `mark_false_positive` puts the message back in front of its recipients — confirm that is intended before calling it. Leave `notify_users` at `false` unless the customer explicitly asked; that mail cannot be unsent.

6. **Offer follow-up**

   - **Benign, recurring sender:** offer an allowlist entry via `ironscales_allowlist_manage` with `operation=add`, `entry_type=email`, and the address as `value`. Use `entry_type=domain` only when the intent really is to exempt every sender on that domain from phishing detection company-wide.
   - **Campaign:** say plainly that campaign-wide domain blocking is **not exposed by this server**. `block_sender` is per-address; a domain block belongs in the Ironscales console or the upstream mail filter.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sender | string | Yes* | Sender email address — the only required field of `ironscales_email_classify` |
| subject | string | No | Email subject line |
| body | string | No | Plain-text body, passed as `body_text` |
| incident_id | string | No | An Ironscales incident to pull context from and, optionally, remediate afterwards |

\* If `incident_id` is supplied and `sender` is not, take `sender` from the incident.

## Examples

### Classify a Raw Email

```
/classify-email --sender "billing@suspicious-domain.net" --subject "Your invoice is ready"
```

### Classify with Body Content

```
/classify-email --sender "security@paypa1.com" --subject "Urgent: Verify your account" --body "Click here to confirm your login within 24 hours."
```

### Investigate an Incident and Then Remediate

```
/classify-email --incident_id "inc-10042"
```

The verdict comes back first. The remediation is a separate, explicit call.

## Error Handling

- **`sender` missing:** `ironscales_email_classify` requires it; supply it directly or pull it from the incident
- **Incident not found:** verify the ID with `/triage-incidents`. The parameter is `incident_id` in snake_case
- **"Nothing changed after classification":** working as designed — the tool is stateless. Call `ironscales_remediation_act` if you wanted state to change
- **Remediation rejected:** the incident may already be `closed`; the error often reads like a permissions failure. Valid statuses are `open`, `in_progress`, `pending`, `closed` — there is no `resolved`
- **Remediation reports partial success:** normal. Reach depends on the customer's M365/Exchange integration; clear remaining mailboxes manually

## Related Commands

- `/triage-incidents` - Triage the open incident queue by status and severity
