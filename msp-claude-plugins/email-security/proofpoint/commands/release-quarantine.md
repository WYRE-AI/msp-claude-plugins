---
description: Release one or more quarantined messages to their intended recipients
argument-hint: "[id] [ids] [sender] [confirm]"
arguments: [id, ids, sender, confirm]
---

# Release Quarantined Messages

Release quarantined messages from Proofpoint quarantine to deliver them to the intended recipients.

## Prerequisites

- Valid Proofpoint service principal and secret configured
- User must have quarantine management permissions
- Message must still exist in quarantine (not expired or deleted)

## Steps

1. **Identify messages to release**
   - If `id` is provided, look up the single message
   - If `ids` are provided, validate each ID
   - If `sender` is provided, search for all quarantined messages from that sender

2. **Preview message(s) before release**
   - Call `proofpoint_quarantine_preview` for each message
   - Display sender, recipient, subject, and quarantine reason
   - Show threat scores if available

3. **Confirm release action**
   - Display warning if message has high threat scores
   - Require explicit confirmation for malware-quarantined messages
   - Skip confirmation if `--confirm` flag is set

4. **Execute release**
   - For single message: call `proofpoint_quarantine_release`
   - For bulk release: call `proofpoint_quarantine_bulk_release`

5. **Report results**
   - Confirm successful releases
   - Report any failures

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | string | No* | - | Single message ID |
| ids | string | No* | - | Comma-separated IDs |
| sender | string | No* | - | Release all from sender |
| confirm | boolean | No | false | Skip confirmation |

*At least one of `id`, `ids`, or `sender` is required.

## Examples

### Release Single Message

```
/release-quarantine --id "msg-abc123"
```

### Release Multiple Messages

```
/release-quarantine --ids "msg-abc123,msg-def456,msg-ghi789"
```

### Release All from Sender

```
/release-quarantine --sender "newsletter@trustedvendor.com"
```

### Release with Confirmation Skip

```
/release-quarantine --id "msg-abc123" --confirm
```

### Release After Searching

```
# First search to find the message
/search-quarantine --recipient "john@acmecorp.com" --sender "partner@vendor.com"

# Then release by ID from results
/release-quarantine --id "msg-abc123"
```

## Output

### Successful Release

```
Message Released Successfully

ID:        msg-abc123
Subject:   Monthly newsletter
Sender:    newsletter@trustedvendor.com
Recipient: john@acmecorp.com
Reason:    spam (false positive)

The message has been delivered to john@acmecorp.com.
```

### Bulk Release

```
Bulk Release Results

Total:     5
Released:  4
Failed:    1

Released:
  1. msg-abc123 - "Monthly newsletter" -> john@acmecorp.com
  2. msg-def456 - "Weekly digest" -> jane@acmecorp.com
  3. msg-ghi789 - "Project update" -> john@acmecorp.com
  4. msg-jkl012 - "Meeting notes" -> team@acmecorp.com

Failed:
  1. msg-mno345 - Message expired and is no longer available
```

### High Threat Warning

```
WARNING: This message has high threat scores

ID:        msg-abc123
Subject:   Urgent: Update your password
Sender:    security@suspicious-domain.com
Phish Score: 85/100
Impostor Score: 72/100

This message was quarantined for: phish
Releasing this message may expose the recipient to a phishing attack.

Are you sure you want to release? [y/N]
```

## Error Handling

### Message Not Found

```
Error: Message not found

ID "msg-abc123" does not exist in quarantine.
The message may have expired or been deleted.
```

### Already Released

```
Error: Message already released

ID "msg-abc123" was already released on 2024-02-15 at 10:30:00.
Released by: admin@msp.com
```

### Permission Denied

```
Error: Permission denied

You do not have permission to release messages from the admin quarantine.
Contact your Proofpoint administrator.
```

### Delivery Failure

```
Warning: Release succeeded but delivery failed

The message was released from quarantine but could not be delivered.
Possible causes:
- Recipient mailbox is full
- Recipient address no longer exists
- Downstream mail server rejected the message
```

## Related Commands

- `/search-quarantine` - Search quarantined messages
- `/check-threats` - View recent TAP threats
- `/investigate-threat` - Deep-dive threat investigation
