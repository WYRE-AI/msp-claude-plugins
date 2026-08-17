---
name: "IRONSCALES Incidents"
description: >
  Ironscales phishing incidents end to end: incident statuses and severities, the
  five remediation actions and which of them are irreversible, the stateless AI
  email-classification tool and the message content it exports, allowlist entries
  for email/domain/IP, daily-triage and campaign workflows, and the failure modes —
  already-closed incidents, partial remediation, and allowlist scope.
when_to_use: >-
  When triaging, investigating, or remediating an Ironscales phishing incident, managing
  the sender allowlist, asking Ironscales' AI to classify raw email content, or reviewing
  company phishing statistics. Use when:
  ironscales incident, phishing incident, ironscales remediation, classify email ironscales,
  ironscales phishing, ironscales allowlist, ironscales triage, ironscales quarantine, ironscales
  legitimate, or ironscales dashboard.
---

# Ironscales Phishing Incidents

## Overview

Ironscales combines AI-powered threat detection with crowdsourced employee phishing reports to identify and remediate phishing attacks. When a user reports a suspicious email (via the Ironscales Outlook add-in or Gmail extension) or Ironscales AI auto-detects a threat, an incident is created. Security administrators triage these incidents and take remediation actions against the delivered mail. Ironscales uses federated learning — decisions made on one tenant inform the global threat model, improving detection over time.

## Anti-triggers

- **A phishing report that arrived in a different platform** — Ironscales
  incidents originate from its own add-in or its own AI. Abnormal's abuse
  mailbox produces separate objects with separate IDs; use
  `Abnormal Security Cases`.
- **A simulated phish, or who clicked one** — Ironscales incidents come
  from real inbound mail. Campaign results and click rates are
  `KnowBe4 Phishing`.
- **Mail held at a gateway before it reached anyone** — Ironscales acts
  on mail already sitting in mailboxes and has no pre-delivery queue. Use
  `SpamTitan Quarantine` or `Mimecast Message Tracking`.
- **Resetting the credentials a phish harvested** — remediation here
  removes mail and blocks senders. The identity action happens in the
  tenant; use `cipp-users`.
- **A phish caught by the other API-based platform on the tenant** —
  Check Point Harmony Email (Avanan) inspects the same mailboxes and
  detects the same mail independently. It has no incident object to
  correlate against — its API surfaces the offending mail itself — so use
  `avanan-threats` and match on the message, not on an ID.

## Key Concepts

### Incident Status

`ironscales_incidents_list` accepts exactly these four values in `status`:

| Status | Description |
|--------|-------------|
| `open` | Newly reported, awaiting review |
| `in_progress` | Under active investigation |
| `pending` | Awaiting an external step before it can progress |
| `closed` | Incident closed (false positive, or remediation complete) |

There is no `resolved` status. Passing one is a 400.

### Incident Severity

`ironscales_incidents_list` also accepts `severity`, which is the only
prioritisation filter the API offers:

| Severity | Meaning |
|----------|---------|
| `critical` / `high` | Triage first |
| `medium` | Routine queue |
| `low` | Batch review |

### Incident Sources — not a filter

Incidents originate either from a user's add-in report or from Ironscales
AI. **There is no `source` parameter.** You cannot ask the API for only
user-reported incidents. If you need the split, list without a source
filter and partition the returned records yourself.

### Classifying an email is not an incident action

`ironscales_email_classify` is a stateless AI lookup. You assemble a raw
email — `sender` is required, everything else optional — POST it to
Ironscales, and get a verdict back. It does **not** reference an incident,
does not set `classification` on anything, and changes no state anywhere.
There is no tool on this server that writes a phishing/spam/legitimate
verdict onto an existing incident. The only way this server changes
incident state is `ironscales_remediation_act`.

Because you supply the content, this tool sends the customer's message —
subject, plain-text body, HTML body, URLs, headers — outbound to
Ironscales for analysis. Its schema explicitly says to pass attachment
*metadata* only (`filename`, `content_type`, `size_bytes`); never the file
contents.

### Remediation Actions

`ironscales_remediation_act` accepts exactly five values in `action`.
They are not all tightenings:

| Action | Effect | Reversible? |
|--------|--------|-------------|
| `quarantine` | Moves the message out of inboxes into quarantine | Yes — the message can be released |
| `delete` | Permanently removes the message from **all** mailboxes | **No** — the evidence goes with it |
| `block_sender` | Adds the sender address to the blocklist | Yes, by editing the blocklist |
| `mark_false_positive` | Marks the mail legitimate and **restores** it to recipients | Reverses containment |
| `report_to_microsoft` | Submits the message to Microsoft for analysis | **No** — cannot be recalled |

`quarantine` is the default choice. Reach for `delete` only when the
message is confirmed malicious and you have already captured whatever
evidence the investigation needs, because `delete` destroys it.

`notify_users` (boolean, default `false`) mails the affected end users
about the remediation. It is an outbound communication to your customer's
staff and it cannot be unsent. Leave it `false` unless someone has
explicitly asked for the notification.

There is **no `block_domain` action**. Campaign-wide domain blocking is
not exposed by this server — see *Handle a Phishing Campaign* below.

### Allowlist Entries

`ironscales_allowlist_manage` takes an `operation` (not an `action`), and
entries are typed: an entry is an `email`, a `domain`, or an `ip`. An
allowlist entry exempts its target from phishing detection for the whole
company, so a `domain` entry is a far larger trust grant than an `email`
one.

## API Patterns

`ironscales_incidents_list` is offset-paginated. All tools are scoped to
the connected company ID.

| Tool | Key parameters |
|------|----------------|
| `ironscales_incidents_list` | `status` (`open`/`closed`/`in_progress`/`pending`), `severity` (`low`/`medium`/`high`/`critical`), `limit` (default 50, max 100), `offset` (default 0) |
| `ironscales_incidents_get` | `incident_id` (required) |
| `ironscales_email_classify` | `sender` (required), `subject`, `sender_display_name`, `reply_to`, `body_text`, `body_html`, `headers`, `urls`, `attachments` |
| `ironscales_remediation_act` | `incident_id` (required), `action` (required — `quarantine`/`delete`/`block_sender`/`mark_false_positive`/`report_to_microsoft`), `reason`, `notify_users` (default `false`) |
| `ironscales_stats_company` | `period` (`7d`/`30d`/`90d`/`1y`, default `30d`) |
| `ironscales_allowlist_manage` | `operation` (required — `add`/`remove`/`list`), `entry_type` (`email`/`domain`/`ip`, required for add/remove), `value` (required for add/remove), `reason` |

The incident fields this server reads and normalises for the incident
card, and therefore the ones you can rely on:

- `id`, `subject`, `status`, `severity`, `sender`, `created_at`
- `recipients[]` and `recipient_count` — the campaign-breadth signal.
- `threat_indicators[]` — why the mail was flagged.

`ironscales_incidents_get` returns the vendor payload verbatim, so it may
carry further fields; treat anything beyond the list above as
tenant-dependent and verify it is present before branching on it.

See [references/api.md](references/api.md) for full parameter lists and
request/response examples for every tool.

## Common Workflows

### Daily Incident Triage

1. Call `ironscales_incidents_list` with `status=open`.
2. Work `severity=critical` and `severity=high` first — re-run the list
   with the `severity` filter rather than sorting client-side, so you page
   through less.
3. For each incident, call `ironscales_incidents_get` with `incident_id`
   and review `threat_indicators`, `sender`, and `recipient_count`.
4. Decide an action per incident and call `ironscales_remediation_act`.
   Default to `quarantine`; escalate to `delete` only for confirmed
   malicious mail whose evidence you no longer need.
5. Incidents you judge benign take `mark_false_positive`, which restores
   the message to its recipients.

There is no auto-classification step. Nothing in this server labels an
incident for you, so nothing can be labelled in bulk without a human
deciding each remediation.

### Investigate Before Remediating

1. Call `ironscales_incidents_get` with the incident ID.
2. Review `threat_indicators` — each entry explains why the mail was
   flagged.
3. Check `recipient_count` and `recipients` — breadth tells you whether
   this is a campaign or a one-off.
4. Compare the reply-to against `sender` if the payload carries it;
   mismatches are a common BEC indicator.
5. If you want a second opinion on the content itself, assemble the
   message into `ironscales_email_classify` (`sender` required, plus
   subject/body/URLs). Remember this ships that content to Ironscales and
   returns only a verdict — it will not change the incident.
6. Call `ironscales_remediation_act` with the chosen action.

### Process False Positive Reports

1. Call `ironscales_incidents_list` with `status=open`. There is no
   `source` filter, so if you only want user-reported items, partition the
   returned records yourself after the call.
2. For each incident you judge benign, call `ironscales_remediation_act`
   with `action=mark_false_positive`. This restores the message to the
   people who received it — confirm that is what you want before calling.
3. To stop the same sender recurring, call `ironscales_allowlist_manage`
   with `operation=add`, `entry_type=email`, and the address as `value`.
   Use `entry_type=domain` only when you intend to exempt every sender on
   that domain.
4. Respond to the reporting user confirming the email is safe.

### Handle a Phishing Campaign

1. Identify the campaign — multiple incidents sharing a sending domain or
   URL pattern. You will have to correlate these yourself; the API has no
   campaign object.
2. Remediate each incident individually with
   `ironscales_remediation_act`. `quarantine` contains the mail;
   `block_sender` stops that one address.
3. **Campaign-wide domain blocking is not available through this server.**
   `block_sender` is per-address and there is no `block_domain` action.
   A domain-level block has to be done in the Ironscales console or in the
   upstream mail filter. Do not promise a customer a domain block from
   here.
4. `ironscales_allowlist_manage` is the opposite operation — it exempts a
   domain from detection. Never reach for it to "handle" a campaign.
5. Call `ironscales_stats_company` for the period to quantify scope.

### Weekly Statistics Review

1. Call `ironscales_stats_company` with `period=7d`. `30d`, `90d`, and
   `1y` are also accepted — use `1y` for annual reporting.
2. Review the top targeted users — these people need additional security
   awareness training. Treat the list as sensitive security information.
3. Review trending attack types to inform awareness focus areas.
4. Compare confirmed phishing against false positives — a high false
   positive rate indicates aggressive tuning or a gap in user education.

## Error Handling

### Remediation Fails — Incident Already Closed

**Cause:** The incident status is `closed`. The resulting error often reads
like a permissions failure.
**Solution:** Call `ironscales_incidents_list` and confirm the status
before acting. Remember the valid statuses are `open`, `in_progress`,
`pending`, and `closed` — there is no `resolved`.

### Remediation Reports Partial Success

**Cause:** Some mailboxes may be offline, the email may have been deleted
by the user, or Exchange/M365 integration permissions may be incomplete.
**Solution:** Verify the Ironscales M365 integration in the platform. For
remaining mailboxes, remove the email manually.

### Allowlist Not Preventing New Incidents

**Cause:** An `email` entry does not cover other addresses on the same
domain.
**Solution:** Use `entry_type=domain` — but understand you are exempting
the entire domain from phishing detection, which is a much larger grant.

### Classification Returned a Verdict but Nothing Changed

**Cause:** Working as designed. `ironscales_email_classify` is stateless.
**Solution:** If you wanted incident state to change, call
`ironscales_remediation_act`.

## Best Practices

- Triage open incidents at least once per business day — user-reported
  incidents reflect real user exposure.
- Filter on `severity` rather than pulling the whole queue; it is the only
  prioritisation the API offers.
- Prefer `quarantine` over `delete`. `delete` is permanent and takes the
  evidence with it.
- Leave `notify_users` at `false` unless the customer asked to be
  notified — that mail cannot be unsent.
- Treat `mark_false_positive` as a release, not a filing action: it puts
  the message back in front of the recipients.
- Never assume `ironscales_email_classify` did anything to an incident.
  Verify with `ironscales_incidents_get` if you are unsure.
- Before pasting message content into `ironscales_email_classify`, confirm
  you are authorised for that tenant — the content leaves your control.
- Build the allowlist proactively with `entry_type=email` for internal
  notification senders, HR systems, and monitoring tools. Reserve
  `entry_type=domain` for cases you can justify in writing.
- Always investigate incidents with a high `recipient_count` — these are
  broad campaigns affecting many users.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Authentication, pagination, error codes
