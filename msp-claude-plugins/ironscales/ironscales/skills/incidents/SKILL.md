---
name: "IRONSCALES Incidents"
description: >
  Ironscales phishing incidents end to end: incident sources and statuses, the
  phishing/spam/legitimate classification model and the remediation each one
  triggers, the response fields that drive triage decisions, daily-triage and
  campaign-blocking workflows, and the failure modes — already-closed incidents,
  partial remediation, and allowlist scope.
when_to_use: >-
  When triaging, classifying, or remediating an Ironscales phishing incident, managing
  the sender allowlist, or reviewing company phishing statistics. Use when:
  ironscales incident, phishing incident, ironscales remediation, classify email ironscales,
  ironscales phishing, ironscales allowlist, ironscales triage, ironscales spam, ironscales
  legitimate, or ironscales dashboard.
---

# Ironscales Phishing Incidents

## Overview

Ironscales combines AI-powered threat detection with crowdsourced employee phishing reports to identify and remediate phishing attacks. When a user reports a suspicious email (via the Ironscales Outlook add-in or Gmail extension) or Ironscales AI auto-detects a threat, an incident is created. Security administrators triage these incidents, classify each email, and take remediation actions. Ironscales uses federated learning — decisions made on one tenant inform the global threat model, improving detection over time.

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
  raises its own incident objects with their own IDs; use
  `checkpoint-avanan-incidents`.

## Key Concepts

### Incident Sources

| Source | Description |
|--------|-------------|
| `USER_REPORT` | Employee used the Ironscales add-in to report a suspicious email |
| `AI_DETECTION` | Ironscales AI automatically flagged the email without a user report |

### Incident Status

| Status | Description |
|--------|-------------|
| `open` | Newly reported, awaiting review |
| `in_progress` | Under active investigation |
| `resolved` | Classification applied and remediation complete |
| `closed` | Incident closed (may be false positive or resolved) |

### Email Classifications

| Classification | Description |
|----------------|-------------|
| `phishing` | Confirmed phishing email — malicious intent, credential harvesting, or fraud |
| `spam` | Unwanted bulk email — not targeted/malicious, but should be blocked |
| `legitimate` | Safe email — false positive report from user |

Once classified, Ironscales can take automatic remediation actions based on the classification:
- **Phishing** → Remove from all mailboxes, block sender, update threat intelligence
- **Spam** → Block sender, optionally remove from mailboxes
- **Legitimate** → Close incident, optionally add sender to allowlist

### Remediation Actions

| Action | Description |
|--------|-------------|
| `remove_emails` | Remove the email from all affected mailboxes |
| `block_sender` | Block the sender email address globally |
| `block_domain` | Block the entire sender domain |
| `allowlist_sender` | Add sender to allowlist (for false positives) |

## API Patterns

All incident tools are offset-paginated and scoped to the connected company ID.

| Tool | Key parameters |
|------|----------------|
| `ironscales_list_incidents` | `status` (`open`/`in_progress`/`resolved`/`closed`), `source` (`USER_REPORT`/`AI_DETECTION`), `offset`, `limit` (default 50, max 100) |
| `ironscales_get_incident` | `incidentId` |
| `ironscales_classify_email` | `incidentId`, `classification` (`phishing`/`spam`/`legitimate`), optional `comment` |
| `ironscales_remediate_incident` | `incidentId`, `action` (`remove_emails`/`block_sender`/`block_domain`/`allowlist_sender`), optional `comment` |
| `ironscales_get_company_stats` | `period` (`7d`/`30d`/`90d`, default `30d`) |
| `ironscales_manage_allowlist` | `action` (`add`/`remove`/`list`), `senderEmail`, optional `senderDomain`, optional `comment` |

The fields that drive triage decisions:

- `aiVerdict` — Ironscales AI's pre-classified verdict, **not** yet confirmed by an admin.
- `aiConfidence` — 0–1 score; above 0.9 is high confidence.
- `classification` — stays `null` until an admin explicitly classifies the incident.
- `recipientCount` — mailboxes that received the email; the campaign-breadth signal.
- `indicators[]` — why the AI flagged it (e.g. `SUSPICIOUS_DOMAIN`, `REPLY_TO_MISMATCH`, `FINANCIAL_REQUEST`), returned only by `ironscales_get_incident`.
- `links[].verdict` — per-URL verdict; a `malicious` link is a strong phishing signal.
- `remediationTriggered` / `remediationActions` — whether classification auto-fired remediation, and which actions ran.

Statistics metrics worth tracking: `averageTimeToResolve` (mean minutes to
classification), `userReportRate` (share of incidents caught by user reports
rather than AI alone), and `topTargetedUsers` (high-value targets).

See [references/api.md](references/api.md) for full parameter lists and
request/response examples for every tool.

## Common Workflows

### Daily Incident Triage

1. Call `ironscales_list_incidents` with `status=open`
2. Sort incidents by `aiConfidence` descending — high-confidence AI detections first
3. For each incident:
   - Review `subject`, `senderEmail`, and `aiVerdict`
   - For high-confidence phishing (`aiConfidence > 0.9`), call `ironscales_classify_email` with `phishing`
   - For ambiguous cases, call `ironscales_get_incident` to review full indicators before classifying
4. For incidents where classification is spam or legitimate, classify accordingly
5. Review `remediationTriggered` — verify automatic remediation fired for phishing classifications

### Investigate Before Classification

1. Call `ironscales_get_incident` with the incident ID
2. Review `indicators` array — each indicator explains why AI flagged this email
3. Check `links` — malicious URL verdict is a strong phishing signal
4. Review `replyTo` vs. `senderEmail` — mismatches are a common BEC/phishing indicator
5. Check `senderIp` against known threat intelligence sources if available
6. Based on findings, call `ironscales_classify_email` with the appropriate classification

### Process False Positive Reports

1. Call `ironscales_list_incidents` with `status=open` and `source=USER_REPORT`
2. For each incident where `aiVerdict=legitimate` or `aiConfidence < 0.5`:
   - The user likely reported a safe email
   - Call `ironscales_classify_email` with `legitimate`
3. After classifying as legitimate, consider adding the sender to the allowlist with `ironscales_manage_allowlist` (action=add)
4. Respond to the reporting user confirming the email is safe

### Block a Phishing Campaign

1. Identify a phishing campaign — multiple incidents from the same domain or with the same URL pattern
2. Classify each incident as `phishing` using `ironscales_classify_email`
3. For the first incident, use `ironscales_remediate_incident` with `action=block_domain` to block the entire sending domain
4. Verify `remediationStatus` confirms the block is active
5. Check `ironscales_get_company_stats` for the period to quantify campaign scope

### Weekly Statistics Review

1. Call `ironscales_get_company_stats` with `period=7d`
2. Review `topTargetedUsers` — these users need additional security awareness training
3. Check `userReportRate` — below 50% indicates users are not using the Ironscales add-in frequently
4. Review `topAttackTypes` — trending attack types inform security awareness focus areas
5. Compare `phishingConfirmed` vs. `falsePositives` — a high false positive rate indicates overly aggressive AI tuning or user education needed

## Error Handling

### Classification Fails — Incident Already Closed

**Cause:** The incident status is `closed` or `resolved` — only open/in-progress incidents can be classified.
**Solution:** Use `ironscales_list_incidents` to verify incident status before classifying.

### Remediation Reports Partial Success

**Cause:** Some mailboxes may be offline, the email may have been deleted by the user, or Exchange/M365 integration permissions may be incomplete.
**Solution:** Verify the Ironscales M365 integration in the platform. For remaining mailboxes, manually delete the email.

### Allowlist Not Preventing New Incidents

**Cause:** An allowlist entry for a sender email does not block incidents from the same domain via different addresses.
**Solution:** Use `senderDomain` in the allowlist entry to allowlist the entire domain instead of a single address.

### Low AI Confidence Score with Phishing Indicators

**Cause:** Ironscales AI scores based on multiple factors; a legitimate-looking sender or domain may reduce confidence even if individual indicators are strong.
**Solution:** Review `indicators` manually — a REPLY_TO_MISMATCH combined with a SUSPICIOUS_DOMAIN is a strong phishing signal regardless of AI confidence score.

## Best Practices

- Triage all open incidents at least once per business day — user-reported incidents reflect real user exposure
- Trust high-confidence AI verdicts (`aiConfidence > 0.9`) and classify quickly to keep queue clear
- Always investigate incidents with `recipientCount > 10` — these are broad campaigns affecting many users
- Use `block_domain` sparingly — block entire domains only when you are confident all mail from that domain is malicious
- Build the allowlist proactively — common internal notification senders, HR systems, and monitoring tools should be added to prevent recurring false positives
- Review `topTargetedUsers` monthly and ensure those users have MFA enabled and recent security awareness training
- Track `averageTimeToResolve` — reducing this metric minimizes user exposure window

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Authentication, pagination, error codes
