---
name: "Mimecast Threat Intelligence"
description: >
  Mimecast threat data: Targeted Threat Protection logs for URL clicks,
  attachment analysis, and impersonation attempts; threat remediation
  incidents; and audit events.
when_to_use: >-
  When investigating Mimecast threat activity, reviewing TTP detections, or auditing admin
  actions. Use when: mimecast threat, TTP, mimecast URL protection, mimecast attachment
  protection, mimecast impersonation, mimecast incident, mimecast threat remediation, mimecast
  targeted threat protection, mimecast phishing, or mimecast malware.
---

# Mimecast Threat Intelligence

## Overview

Mimecast's Targeted Threat Protection (TTP) is an advanced security layer that inspects URLs and attachments in real time and detects impersonation attempts. When TTP events occur — a user clicking a suspicious URL, a malicious attachment being sandboxed, or an impersonation attempt being identified — Mimecast logs these as TTP events that feed into threat remediation incidents. This skill covers reading TTP logs, reviewing threat remediation incidents, and using audit events to investigate security events.

## Key Concepts

### Targeted Threat Protection (TTP)

TTP has three components:

1. **URL Protection** — Rewrites URLs in emails and checks them at click time against reputation databases. Tracks every URL click attempt, whether blocked or permitted.
2. **Attachment Protection** — Sandboxes email attachments before delivery. Detects malware, zero-day exploits, and suspicious macros.
3. **Impersonation Protection** — Detects emails that spoof trusted senders — executives, trusted domains, or known contacts.

### Threat Remediation Incidents

When TTP identifies a confirmed threat (e.g. a URL classified as malicious after delivery, or a sandboxed attachment containing malware), Mimecast can create a threat remediation incident — a structured record of the threat and recommended remediation actions, such as removing emails from user mailboxes.

### Audit Events

The Mimecast audit log records all administrative actions and significant security events — policy changes, user login events, held message releases, and API operations. Useful for compliance investigations and detecting unauthorized admin activity.

## API Patterns

### Get TTP Logs

```
mimecast_get_ttp_logs
```

Retrieves TTP event logs across URL protection, attachment protection, and impersonation protection.

Parameters:
- `type` — Log type: `url`, `attachment`, or `impersonation`
- `start` — Start datetime (ISO 8601)
- `end` — End datetime (ISO 8601)
- `pageToken` — Pagination cursor

**Example — URL click logs:**

```json
{
  "type": "url",
  "start": "2026-03-01T00:00:00Z",
  "end": "2026-03-02T23:59:59Z"
}
```

**Example URL TTP response:**

```json
{
  "meta": {
    "status": 200,
    "pagination": {
      "pageSize": 25,
      "totalCount": 18,
      "next": null
    }
  },
  "data": [
    {
      "date": "2026-03-01T14:35:22Z",
      "url": "https://malicious-site.com/payload",
      "action": "block",
      "userEmail": "user@client.com",
      "from": "phishing@external-domain.com",
      "subject": "Your account needs attention",
      "messageId": "<abc123@external-domain.com>",
      "scanResult": "malicious",
      "category": "phishing"
    },
    {
      "date": "2026-03-01T09:12:05Z",
      "url": "https://legitimate-site.com/page",
      "action": "allow",
      "userEmail": "another@client.com",
      "from": "newsletter@legitimate-site.com",
      "subject": "Monthly Update",
      "messageId": "<def456@legitimate-site.com>",
      "scanResult": "clean",
      "category": null
    }
  ]
}
```

Key fields:
- `action` — `block` (URL blocked) or `allow` (URL permitted)
- `scanResult` — `malicious`, `suspicious`, or `clean`
- `category` — Threat category (phishing, malware, spam, etc.)

**Example — Attachment TTP response:**

```json
{
  "meta": { "status": 200 },
  "data": [
    {
      "date": "2026-03-01T11:20:00Z",
      "filename": "invoice_march.xlsm",
      "result": "malicious",
      "definition": "Macro dropper — Emotet variant",
      "from": "billing@fake-vendor.net",
      "to": "accountspayable@client.com",
      "messageId": "<ghi789@fake-vendor.net>",
      "action": "block"
    }
  ]
}
```

**Example — Impersonation TTP response:**

```json
{
  "meta": { "status": 200 },
  "data": [
    {
      "date": "2026-03-01T16:44:00Z",
      "from": "ceo@c1ient.com",
      "to": "cfo@client.com",
      "subject": "Urgent Wire Transfer",
      "action": "hold",
      "definition": "Domain lookalike — executive impersonation",
      "similarDomain": "client.com"
    }
  ]
}
```

### Get Threat Remediation Incidents

```
mimecast_get_threat_incidents
```

Returns threat remediation incidents — confirmed threats requiring mailbox remediation.

Parameters:
- `start` — Start datetime (ISO 8601)
- `end` — End datetime (ISO 8601)
- `pageToken` — Pagination cursor

**Example response:**

```json
{
  "meta": { "status": 200 },
  "data": [
    {
      "id": "TRI-20260301-001",
      "created": "2026-03-01T15:00:00Z",
      "type": "url",
      "status": "open",
      "severity": "high",
      "reason": "URL reclassified as malicious post-delivery",
      "url": "https://malicious-site.com/payload",
      "affectedUsers": [
        "user@client.com",
        "manager@client.com"
      ],
      "affectedMessages": 4,
      "remediationAction": "remove_from_mailbox",
      "remediationStatus": "pending"
    }
  ]
}
```

### Get Audit Events

```
mimecast_get_audit_events
```

Retrieves the Mimecast audit log for administrative and security events.

Parameters:
- `start` — Start datetime (ISO 8601)
- `end` — End datetime (ISO 8601)
- `category` — Event category filter (optional): `authentication`, `policy`, `message`, `user`
- `pageToken` — Pagination cursor

**Example response:**

```json
{
  "meta": { "status": 200 },
  "data": [
    {
      "id": "audit-001",
      "timestamp": "2026-03-01T08:00:00Z",
      "category": "authentication",
      "action": "admin_login",
      "user": "admin@client.com",
      "ip": "203.0.113.10",
      "result": "success"
    },
    {
      "id": "audit-002",
      "timestamp": "2026-03-01T08:45:00Z",
      "category": "message",
      "action": "held_message_release",
      "user": "admin@client.com",
      "messageId": "<abc123@external-domain.com>",
      "result": "success"
    }
  ]
}
```

## Common Workflows

### Daily Threat Review

1. Call `mimecast_get_ttp_logs` with `type=url` for the past 24 hours
2. Filter for `action=block` and `scanResult=malicious` — these are confirmed threats
3. Identify users who clicked blocked URLs — they attempted to access malicious content
4. Call `mimecast_get_ttp_logs` with `type=attachment` for same period
5. Check for `result=malicious` — these are blocked malware attachments
6. Call `mimecast_get_threat_incidents` to see any new post-delivery reclassifications
7. Create PSA tickets for affected users requiring security awareness follow-up

### Investigate a Specific Phishing Campaign

1. Identify the phishing domain or URL from a user report
2. Call `mimecast_get_ttp_logs` with `type=url` and a broad time range
3. Filter results for the phishing domain across all users
4. Identify all recipients who received the phishing URL
5. Check `action` field — `allow` means the URL was not blocked at click time (user may have visited)
6. If users accessed the URL, escalate to credential compromise investigation
7. Call `mimecast_find_message` to trace all emails containing that domain to understand campaign scope

### Detect BEC / Executive Impersonation

1. Call `mimecast_get_ttp_logs` with `type=impersonation` for the past 7 days
2. Look for `action=allow` entries — impersonation attempts that were not blocked
3. Identify sender domains in `similarDomain` field — these are lookalike domains
4. Cross-reference with `mimecast_find_message` to confirm if those emails reached inboxes
5. Alert affected executives and implement additional impersonation policy rules

### Post-Delivery Threat Remediation

1. Call `mimecast_get_threat_incidents` to identify open incidents
2. For each incident, note `affectedUsers` and `affectedMessages`
3. Review `remediationAction` — typically `remove_from_mailbox`
4. Confirm `remediationStatus` — if `pending`, Mimecast may require administrator approval in the console
5. Notify affected users that suspicious emails have been or will be removed from their mailboxes

### Compliance Audit Investigation

1. Call `mimecast_get_audit_events` with `category=authentication` for a time range
2. Review admin logins — unexpected IP addresses or off-hours access are suspicious
3. Call with `category=policy` to identify configuration changes
4. Document findings with timestamps and actor email addresses for the compliance report

## Error Handling

### No TTP Data Returned

**Cause:** TTP is not enabled for the tenant, or the date range has no events.
**Solution:** Verify TTP is licensed and enabled in the Mimecast Administration Console under **Services > Targeted Threat Protection**.

### Incident Remediation Status Stuck at Pending

**Cause:** Threat remediation incidents may require manual approval in the Mimecast console depending on the tenant's remediation policy.
**Solution:** Log into the Mimecast Administration Console and navigate to **Security > Threat Remediation** to manually approve pending remediations.

### Audit Log Returns Empty for Recent Events

**Cause:** Audit log propagation can have a short delay (up to 15 minutes).
**Solution:** Retry with a slight delay; also verify the correct region is configured.

## Best Practices

- Check TTP URL logs daily — blocked clicks indicate active threats targeting your users
- `action=allow` URL entries where `scanResult=malicious` mean Mimecast reclassified the URL after the click — treat these as confirmed user exposures
- Always cross-reference TTP attachment detections with `mimecast_find_message` to confirm whether other users received the same attachment
- Impersonation TTP logs with `action=allow` are the most dangerous — the email reached the inbox despite being flagged
- Use audit event logs to detect unauthorized admin activity, especially after a security incident
- Export TTP logs weekly for trend analysis — increasing block counts may indicate a targeted campaign

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Authentication, pagination, error codes
- [message-tracking](../message-tracking/SKILL.md) - Trace and manage specific messages
- [queue-management](../queue-management/SKILL.md) - Delivery queue monitoring
