---
description: Release quarantined email(s) back to recipients in Checkpoint Harmony Email
argument-hint: "<entity-id> [allow-list] [reason] [notify]"
arguments: [entity-id, allow-list, reason, notify]
---

# Release Quarantined Email

Release one or more quarantined emails back to their original recipients in Checkpoint Harmony Email & Collaboration (Avanan).

## Prerequisites

- Valid Checkpoint Harmony API credentials configured (CHECKPOINT_CLIENT_ID, CHECKPOINT_CLIENT_SECRET)
- API key must have quarantine write permissions
- Quarantine entry must exist and be in QUARANTINED status

## Steps

1. **Validate quarantine entries**
   - Verify each entity ID exists
   - Confirm entries are in QUARANTINED status (not already released or deleted)
   - Check quarantine reason and severity for safety warnings

2. **Safety checks**
   - Warn if releasing MALWARE-quarantined email
   - Warn if releasing CRITICAL severity items
   - Display entry details for confirmation

3. **Execute release**
   ```http
   POST /app/hec-api/v1.0/quarantine/release
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "entityIds": ["qe-abc123"],
     "releaseToRecipients": true,
     "addToAllowList": false
   }
   ```

4. **Optionally add to allow list**
   - If --allow-list flag is set, add sender to allow list

5. **Report results**
   - Confirm release success for each entry
   - Note any failures

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| entity-id | string | Yes | - | Quarantine entity ID(s), comma-separated for bulk |
| allow-list | boolean | No | false | Add sender to allow list |
| reason | string | No | - | Reason for releasing (recommended) |
| notify | boolean | No | true | Notify recipient of release |

## Examples

### Release Single Email

```
/release-quarantine qe-abc123
```

### Release with Allow List

```
/release-quarantine qe-abc123 --allow-list --reason "Legitimate email from known vendor"
```

### Bulk Release

```
/release-quarantine qe-abc123,qe-def456,qe-ghi789 --reason "False positive - marketing partner emails"
```

### Release Without Notification

```
/release-quarantine qe-abc123 --notify false
```

### Release with Detailed Reason

```
/release-quarantine qe-abc123 --reason "Confirmed legitimate DocuSign document from known client" --allow-list
```

## Output

### Successful Release

```
Released 1 email from quarantine

Entity ID:   qe-abc123
Subject:     Your DocuSign Document
Sender:      noreply@docusign.com
Recipients:  john@company.com
Released:    2024-02-15 14:30:00 UTC
Allow List:  Sender added to allow list

The email has been delivered to the recipient's inbox.
```

### Bulk Release

```
Released 3 of 3 emails from quarantine

+-----------+---------------------------------+---------+
| Entity ID | Subject                         | Status  |
+-----------+---------------------------------+---------+
| qe-abc123 | Weekly Newsletter               | Released |
| qe-def456 | Monthly Report                  | Released |
| qe-ghi789 | Partner Update                  | Released |
+-----------+---------------------------------+---------+

Reason: False positive - marketing partner emails
Allow List: Not modified
```

### Safety Warning (Malware)

```
WARNING: You are about to release a MALWARE-quarantined email

Entity ID:   qe-xyz789
Subject:     Invoice #4521 Attached
Sender:      billing@unknown-corp.com
Reason:      MALWARE
Severity:    Critical
Confidence:  95%
Attachments: invoice_4521.docm (SHA-256: a1b2c3...)

This email was flagged as containing malware with high confidence.
Releasing this email could expose the recipient to a malicious payload.

Are you sure you want to proceed? This action is strongly discouraged.
If the user confirms, add --force to override the safety check.
```

### Partial Failure

```
Released 2 of 3 emails from quarantine

+-----------+---------------------------------+----------+
| Entity ID | Subject                         | Status   |
+-----------+---------------------------------+----------+
| qe-abc123 | Weekly Newsletter               | Released  |
| qe-def456 | Monthly Report                  | Released  |
| qe-ghi789 | Old Notification                | FAILED    |
+-----------+---------------------------------+----------+

Failures:
- qe-ghi789: Quarantine entry expired (past 30-day retention)
```

## Error Handling

### Entity Not Found

```
Error: Quarantine entry not found: qe-invalid123

The quarantine entry may have:
- Already been deleted
- Expired (past retention period)
- Never existed (check the entity ID)

Use /search-quarantine to find the correct entity ID.
```

### Already Released

```
Error: Quarantine entry already released: qe-abc123

Released by:  admin@company.com
Released on:  2024-02-15 10:00:00 UTC

No action needed - the email was already delivered to the recipient.
```

### Permission Denied

```
Error: Insufficient permissions to release quarantine entries

Your API key does not have quarantine write permissions.
Contact your Checkpoint administrator to update API key scopes.
```

### Rate Limiting

```
Rate limited by Checkpoint API

Retrying in 30 seconds...
For bulk operations, consider releasing in smaller batches (max 100 per request).
```

## Related Commands

- `/search-quarantine` - Search quarantined emails
- `/check-threat` - Get detailed threat analysis before releasing
- `/search-threats` - Search for related threats
