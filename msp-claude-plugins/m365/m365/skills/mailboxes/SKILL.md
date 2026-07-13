---
name: "Microsoft 365 Mailboxes"
description: >
  Use this skill when working with Microsoft 365 mailboxes - reading email,
  searching messages, managing shared mailboxes, setting out-of-office replies,
  checking mailbox size, or diagnosing mail flow issues. Covers Exchange Online
  via Microsoft Graph for MSP technicians supporting customer email environments.
when_to_use: >-
  When reading email, searching messages, managing shared mailboxes, setting out-of-office
  replies, checking mailbox size, or diagnosing mail flow issues. Use when: m365 email, m365
  mailbox, exchange online, search email m365, shared mailbox, out of office m365, mail flow
  issue, email quota, forward email m365, or inbox rules m365.
---

# Microsoft 365 Mailbox Management

## Overview

Microsoft 365 mailboxes are managed through Exchange Online, accessible via Microsoft Graph. For MSPs, mailbox tasks range from diagnosing delivery failures and searching for lost emails to managing shared mailboxes and offboarding users. Graph provides a unified API across all mailbox types.

## Mailbox Types

| Type | Description | Common MSP Tasks |
|------|-------------|-----------------|
| **User Mailbox** | Standard licensed user | Search, out-of-office, size, rules |
| **Shared Mailbox** | Team inbox, no license required | Access management, forwarding |
| **Room/Equipment** | Calendar resource booking | Availability, booking policies |
| **Distribution Group** | Email alias to multiple users | Membership, send-as |

## Graph API Patterns

### List a User's Emails

```http
GET /v1.0/users/{userId}/messages?$select=id,subject,from,receivedDateTime,isRead&$top=25&$orderby=receivedDateTime desc
```

### Search for a Specific Email

```http
GET /v1.0/users/{userId}/messages?$search="subject:invoice 2024"&$select=id,subject,from,receivedDateTime
```

Also supports KQL search operators:
- `$search="from:john@example.com"` — by sender
- `$search="subject:urgent hasAttachments:true"` — combined
- `$search="received>=2024-01-01"` — date range

### Get Message Details (with body)

```http
GET /v1.0/users/{userId}/messages/{messageId}?$select=id,subject,from,body,receivedDateTime,attachments
```

### Get Mailbox Settings (out-of-office, timezone)

```http
GET /v1.0/users/{userId}/mailboxSettings
```

**Response:**
```json
{
  "automaticRepliesSetting": {
    "status": "disabled",
    "internalReplyMessage": "",
    "externalReplyMessage": ""
  },
  "timeZone": "Eastern Standard Time",
  "language": { "locale": "en-US" }
}
```

### Set Out-of-Office Reply

```http
PATCH /v1.0/users/{userId}/mailboxSettings
Content-Type: application/json

{
  "automaticRepliesSetting": {
    "status": "alwaysEnabled",
    "internalReplyMessage": "<html>I'm out of office until Jan 15.</html>",
    "externalReplyMessage": "<html>I'm out of office. For urgent matters contact support@company.com.</html>"
  }
}
```

### Disable Out-of-Office Reply

```http
PATCH /v1.0/users/{userId}/mailboxSettings
Content-Type: application/json

{
  "automaticRepliesSetting": { "status": "disabled" }
}
```

### Get Mailbox Usage / Size

```http
GET /v1.0/users/{userId}/mailFolders/inbox?$select=totalItemCount,sizeInBytes
```

For full mailbox statistics (requires Exchange admin permissions):
```http
GET /v1.0/reports/getMailboxUsageDetail(period='D7')
```

### Get Inbox Rules

```http
GET /v1.0/users/{userId}/mailFolders/inbox/messageRules
```

**Response shows rules that may affect mail delivery:**
```json
{
  "value": [
    {
      "id": "rule1",
      "displayName": "Move newsletters",
      "conditions": { "senderContains": ["newsletter"] },
      "actions": { "moveToFolder": "Newsletters" },
      "isEnabled": true
    }
  ]
}
```

### Send an Email on Behalf of a User

```http
POST /v1.0/users/{userId}/sendMail
Content-Type: application/json

{
  "message": {
    "subject": "Your IT support request has been resolved",
    "body": { "contentType": "HTML", "content": "<p>Your ticket #1234 is now closed.</p>" },
    "toRecipients": [{ "emailAddress": { "address": "user@contoso.com" } }]
  },
  "saveToSentItems": true
}
```

## Shared Mailbox Management

### Add User Access to Shared Mailbox

Shared mailbox access is managed via Microsoft 365 admin or Exchange PowerShell, not directly via Graph mailbox endpoints. Use Graph group membership or delegate access patterns.

### List Users With Shared Mailbox Access

Access is represented as `mailboxPermissions` — check via admin APIs or Exchange PowerShell:
```powershell
Get-MailboxPermission -Identity "sharedmailbox@contoso.com" | Where-Object { $_.AccessRights -eq "FullAccess" }
```

## Mail Flow Diagnostics

### Check Recent Delivery Failures

Look for NDRs (Non-Delivery Reports) in the user's inbox or sent items:

```http
GET /v1.0/users/{userId}/messages?$filter=senderEmailAddress/address eq 'postmaster@domain.com'&$select=subject,receivedDateTime,body
```

### Common Delivery Failure Reasons

| NDR Code | Meaning | Resolution |
|----------|---------|------------|
| `5.1.1` | Recipient doesn't exist | Verify UPN / check aliases |
| `5.1.8` | Sender blocked (spam) | Review anti-spam policy |
| `5.2.2` | Mailbox full | Check quota, remove items |
| `5.7.1` | Unauthorized relay | SMTP auth settings |
| `5.7.606` | Sender IP blocked | Submit to Microsoft for delisting |

## Common MSP Workflows

### Lost Email Investigation

1. Confirm exact sender address and approximate date
2. Search user's mailbox including Junk and Deleted folders
3. Check inbox rules that might divert messages
4. Review message trace in Microsoft 365 admin (requires admin access)
5. Check anti-spam quarantine if IT admin access available

### Offboarding Mailbox Handling

**Option A: Convert to shared mailbox** (no license needed, data accessible)
1. Disable user account
2. Convert mailbox to shared via admin center or Graph
3. Grant departing user's manager full access

**Option B: Forward and archive**
1. Set auto-forward to manager
2. Export mailbox to PST/archive
3. Remove license after retention period

**Option C: Auto-reply and close**
1. Set out-of-office explaining user has left
2. Leave mailbox active during handover period
3. Remove license after business decides archival approach

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `MailboxNotEnabledForRESTAPI` | User has no Exchange license | Assign Exchange/M365 license |
| `ErrorItemNotFound` | Message ID expired or moved | Search by subject/date instead |
| `AuthenticationError` | Token expired | Re-authenticate via OAuth flow |
| `TooManyRequests` | Graph throttling (429) | Retry with exponential backoff |
| `Forbidden (403)` | Missing Mail.Read permission | Check app registration |

## Permissions Required

| Task | Microsoft Graph Permission |
|------|---------------------------|
| Read emails | `Mail.Read` or `Mail.ReadWrite` |
| Send email | `Mail.Send` |
| Mailbox settings | `MailboxSettings.ReadWrite` |
| All users' mail (admin) | `Mail.Read` (delegated + admin consent) |

## Related Skills

- [M365 Users](../users/SKILL.md) - Account status, disable, license
- [M365 Calendar](../calendar/SKILL.md) - Calendar and out-of-office coordination
- [M365 Security](../security/SKILL.md) - Forwarding rule abuse, account compromise signs
- [M365 API Patterns](../api-patterns/SKILL.md) - Auth, pagination, search syntax
