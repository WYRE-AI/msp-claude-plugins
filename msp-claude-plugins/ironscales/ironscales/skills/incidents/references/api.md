# Ironscales Incident Tools — Full API Reference

Complete parameter lists and request/response examples for the incident,
classification, remediation, statistics, and allowlist tools.

**How to read the response examples.** Only `ironscales_incidents_list`
reshapes what the vendor returns. Every other tool serialises the upstream
JSON verbatim, so the responses below are representative shapes, not a
guaranteed schema. Before branching on a field that is not in the
*Fields this server reads* list under *Get Incident Details*, confirm it is
actually present in the payload you got.

## List Incidents

```
ironscales_incidents_list
```

`GET /api/v1/incidents`

Parameters (all optional):

| Parameter | Type | Values | Default |
|---|---|---|---|
| `status` | string | `open`, `in_progress`, `pending`, `closed` | unset (all) |
| `severity` | string | `low`, `medium`, `high`, `critical` | unset (all) |
| `limit` | number | max 100 | 50 |
| `offset` | number | — | 0 |

There is no `resolved` status and **no `source` parameter**. You cannot ask
the API for only user-reported incidents or only AI-detected ones; if you
need that split, list without it and partition the returned records
client-side.

**Example — list open critical incidents:**

```json
{
  "status": "open",
  "severity": "critical",
  "limit": 50,
  "offset": 0
}
```

**Example response:**

```json
{
  "incidents": [
    {
      "id": "inc-10042",
      "status": "open",
      "severity": "critical",
      "subject": "Your invoice is ready",
      "sender": "billing@suspicious-domain.net",
      "recipient_count": 5,
      "created_at": "2026-03-02T08:30:00Z"
    },
    {
      "id": "inc-10041",
      "status": "open",
      "severity": "high",
      "subject": "Urgent: Verify your account",
      "sender": "security@paypa1.com",
      "recipient_count": 12,
      "created_at": "2026-03-02T07:15:00Z"
    }
  ],
  "offset": 0,
  "limit": 50
}
```

`offset` and `limit` are echoed back from your request. **No total count is
returned** — the server unwraps the vendor's list and drops any envelope
around it. Page until a call returns fewer than `limit` records; you have no
total from which to precompute page count.

## Get Incident Details

```
ironscales_incidents_get
```

`GET /api/v1/incidents/{incident_id}`

Parameters:

| Parameter | Type | Required |
|---|---|---|
| `incident_id` | string | yes |

The parameter is `incident_id` in snake_case. `incidentId` is not accepted.

**Example request:**

```json
{
  "incident_id": "inc-10042"
}
```

**Example response:**

```json
{
  "id": "inc-10042",
  "status": "open",
  "severity": "critical",
  "subject": "Your invoice is ready",
  "sender": "billing@suspicious-domain.net",
  "recipient_count": 5,
  "recipients": [
    "user@client.com",
    "accountspayable@client.com",
    "cfo@client.com"
  ],
  "created_at": "2026-03-02T08:30:00Z",
  "threat_indicators": [
    "suspicious_link",
    "domain_spoofing",
    "reply_to_mismatch"
  ],
  "_card": {
    "id": "inc-10042",
    "subject": "Your invoice is ready",
    "status": "open",
    "severity": "critical",
    "sender": "billing@suspicious-domain.net",
    "recipientCount": 5,
    "recipients": ["user@client.com", "accountspayable@client.com", "cfo@client.com"],
    "threatIndicators": ["suspicious_link", "domain_spoofing", "reply_to_mismatch"],
    "createdAt": "2026-03-02T08:30:00Z"
  }
}
```

### Fields this server reads

The response is the vendor payload with a `_card` object appended. `_card` is
the normalised summary that drives the incident-card UI surface, and it is
built from exactly these incident fields — which makes them the ones you can
rely on:

| Field | Notes |
|---|---|
| `id` | Required for the card to build at all |
| `subject` | Required for the card to build at all |
| `status` | |
| `severity` | |
| `sender` | |
| `created_at` | |
| `recipients[]` | Array of strings; the card keeps the first 5 |
| `recipient_count` | Number; the card falls back to `recipients.length` |
| `threat_indicators[]` | Array of strings; the card keeps the first 10 |

The card is best-effort progressive enhancement — if it cannot be built,
`_card` is simply absent and the payload is unchanged.

Anything outside that list (reply-to, sender IP, per-URL verdicts, AI verdict
and confidence, attachment lists) is tenant-dependent vendor pass-through.
It may be present and it may be useful, but verify it before branching on it.

## Classify an Email

```
ironscales_email_classify
```

`POST /api/v1/email/classify`

**This tool takes a raw email, not an incident ID.** It is a stateless AI
lookup: it references no incident, sets no verdict on anything, and changes
no state. There is no tool on this server that writes a
phishing/spam/legitimate verdict onto an existing incident — the only tool
that changes incident state is `ironscales_remediation_act`.

Parameters:

| Parameter | Type | Required |
|---|---|---|
| `sender` | string | **yes** |
| `subject` | string | no |
| `sender_display_name` | string | no |
| `reply_to` | string | no |
| `body_text` | string | no |
| `body_html` | string | no |
| `headers` | object (key/value pairs) | no |
| `urls` | string[] | no |
| `attachments` | array of `{ filename, content_type, size_bytes }` | no |

Because you supply the content, this call sends the customer's message —
subject, plain-text body, HTML body, URLs, headers — outbound to Ironscales
for analysis. The `attachments` schema is **metadata only**: filename,
content type, and size. Never put file contents in it.

**Example request:**

```json
{
  "sender": "billing@suspicious-domain.net",
  "sender_display_name": "Billing Department",
  "reply_to": "payments@attacker.com",
  "subject": "Your invoice is ready",
  "body_text": "Please review the attached invoice and remit payment today.",
  "urls": ["https://suspicious-domain.net/invoice"],
  "attachments": [
    { "filename": "invoice.pdf", "content_type": "application/pdf", "size_bytes": 48213 }
  ]
}
```

**Example response:**

```json
{
  "classification": "phishing",
  "confidence": 0.97,
  "threat_types": ["credential_harvesting", "brand_impersonation"],
  "indicators": ["suspicious_link", "lookalike_domain"]
}
```

The response is a verdict and nothing more. Nothing in the Ironscales tenant
changed as a result of this call.

## Remediate an Incident

```
ironscales_remediation_act
```

`POST /api/v1/incidents/{incident_id}/remediate`

The only tool here that changes state. Parameters:

| Parameter | Type | Required | Default |
|---|---|---|---|
| `incident_id` | string | **yes** | — |
| `action` | string (enum below) | **yes** | — |
| `reason` | string | no | — |
| `notify_users` | boolean | no | `false` |

The audit-trail field is `reason`, not `comment`.

### The five actions

| Action | Effect | Reversible? |
|---|---|---|
| `quarantine` | Moves the message out of inboxes into quarantine | Yes — the message can be released |
| `delete` | Permanently removes the message from **all** mailboxes | **No** — the evidence goes with it |
| `block_sender` | Adds the sender address to the blocklist | Yes, by editing the blocklist |
| `mark_false_positive` | Marks the mail legitimate and **restores** it to recipients | Reverses containment |
| `report_to_microsoft` | Submits the message to Microsoft for analysis | **No** — cannot be recalled |

These five are the whole enum. There is no `remove_emails`, no
`block_domain`, and no `allowlist_sender`.

`quarantine` is the recoverable default. Reach for `delete` only when the
message is confirmed malicious *and* you have already captured whatever
evidence the investigation needs, because `delete` destroys it.

`mark_false_positive` is not a filing action — it puts the message back in
front of the people who received it. Do not describe every remediation
action as tightening security; this one deliberately loosens it.

`notify_users: true` mails the customer's end users about the remediation.
That is an outbound communication to someone else's staff and it cannot be
unsent. Leave it `false` unless someone explicitly asked for it.

**Campaign-wide domain blocking is not exposed by this server.**
`block_sender` blocks one address. A domain-level block has to be done in
the Ironscales console or in the upstream mail filter. Do not promise a
customer a domain block from here.

**Example — quarantine:**

```json
{
  "incident_id": "inc-10042",
  "action": "quarantine",
  "reason": "Lookalike billing domain with malicious link",
  "notify_users": false
}
```

**Example response:**

```json
{
  "incident_id": "inc-10042",
  "action": "quarantine",
  "status": "completed",
  "affected_mailboxes": 5,
  "timestamp": "2026-03-02T09:02:00Z"
}
```

Partial success is normal — reach depends on the customer's M365/Exchange
integration, not on this plugin's permissions. If the response reports fewer
affected mailboxes than the incident's `recipient_count`, verify the
integration in the Ironscales platform and clear the remainder manually.

## Get Company Statistics

```
ironscales_stats_company
```

`GET /api/v1/company/stats?period=`

Parameters:

| Parameter | Type | Values | Default |
|---|---|---|---|
| `period` | string | `7d`, `30d`, `90d`, `1y` | `30d` |

`1y` is accepted — use it for annual reporting.

This payload is passed through verbatim; the server does not normalise it.
Field names and nesting are tenant- and version-dependent, so read the
response before writing logic against any key in it.

**Example response:**

```json
{
  "period": "30d",
  "total_incidents": 42,
  "open_incidents": 7,
  "closed_incidents": 35,
  "by_severity": { "low": 10, "medium": 20, "high": 10, "critical": 2 },
  "top_attack_types": ["phishing", "bec", "malware"],
  "remediation_rate": 0.83
}
```

What the response is *for*, independent of exact key names:

- **Incident volume and its severity breakdown** — scope and trend.
- **Attack type ranking** — where security awareness training should focus.
- **Most-targeted users**, when the tenant returns them — a named list of the
  customer's most-attacked employees. Treat that as sensitive security
  information, not a metric to paste into a slide deck.
- **Remediation/resolution rates** — operational throughput.

## Manage the Allowlist

```
ironscales_allowlist_manage
```

`GET /api/v1/allowlist` for `list`; `POST` to add; `DELETE` to remove.

Parameters:

| Parameter | Type | Required | Values |
|---|---|---|---|
| `operation` | string | **yes** | `add`, `remove`, `list` |
| `entry_type` | string | required for `add`/`remove` | `email`, `domain`, `ip` |
| `value` | string | required for `add`/`remove` | the address, domain, or IP |
| `reason` | string | no | audit note |

The first argument is `operation`, not `action`. There are no `senderEmail`
or `senderDomain` parameters — an entry is a typed `entry_type` plus a
`value`. Calling `add` or `remove` without both is rejected by the server
before any HTTP request is made.

An allowlist entry exempts its target from phishing detection **for the whole
company**. An `entry_type=domain` entry therefore exempts every sender on
that domain — a far larger trust grant than a single `email` entry, and one
that produces no alert and no visible change until an attacker spoofs it.
Reserve `domain` for cases you can justify in writing.

**Example — allowlist one address:**

```json
{
  "operation": "add",
  "entry_type": "email",
  "value": "newsletter@trusted-vendor.com",
  "reason": "Legitimate marketing newsletter — added per CFO request"
}
```

**Example add/remove response:**

```json
{
  "success": true,
  "message": "Entry added to allowlist"
}
```

**Example — list the current allowlist:**

```json
{
  "operation": "list"
}
```

**Example list response:**

```json
{
  "entries": [
    { "type": "domain", "value": "trusted-partner.com", "added_at": "2026-01-15T09:00:00Z" },
    { "type": "email", "value": "newsletter@legit.com", "added_at": "2026-02-01T12:00:00Z" }
  ]
}
```

Note the asymmetry: you send `entry_type`, and the vendor's stored records
come back keyed `type`.
