---
description: Add or remove entries from SpamTitan sender allowlists and blocklists
argument-hint: "<action> [sender] [domain] [notes]"
arguments: [action, sender, domain, notes]
---

# SpamTitan List Management

Add or remove entries from SpamTitan sender allowlists and blocklists, or review existing list entries. Allowlisting trusted senders prevents false positives; blocklisting unwanted senders stops persistent spam and phishing. For MSPs, list management is a core part of tuning email security for each client.

## Prerequisites

- SpamTitan MCP server connected with valid API credentials
- MCP tools `spamtitan_manage_allowlist`, `spamtitan_manage_blocklist`, `spamtitan_list_allowlist`, and `spamtitan_list_blocklist` available

## Steps

### When action is `review`

1. Call `spamtitan_list_allowlist` with the `domain` filter (if provided) to retrieve current allowlist entries
2. Call `spamtitan_list_blocklist` with the `domain` filter (if provided) to retrieve current blocklist entries
3. Display both lists with entry value, type, scope (global/per-domain), date added, and notes
4. Flag entries older than 6 months as candidates for review and potential removal
5. Note any overlapping or overly broad entries (e.g., entire domain allowlists) that may create security risk

### When action is `allow`

1. Check `spamtitan_list_allowlist` to confirm the sender is not already allowlisted
2. Confirm with the user that the sender is legitimate before proceeding
3. Call `spamtitan_manage_allowlist` with `action=add`, the `sender` value, the `domain` scope (if provided), and `notes`
4. Display the created entry ID and confirm success

### When action is `block`

1. Check `spamtitan_list_blocklist` to confirm the sender is not already blocked
2. Warn if the `sender` is a broad domain that may be a shared sending service (e.g., Google, Outlook, SendGrid)
3. Confirm the scope — if multiple clients are affected, omit `domain` to apply globally
4. Call `spamtitan_manage_blocklist` with `action=add`, the `sender` value, the `domain` scope, and `notes`
5. Display the created entry ID and confirm success

### When action is `remove-allow`

1. Call `spamtitan_list_allowlist` to find the exact entry matching `sender`
2. Confirm the entry exists and display its details for verification
3. Call `spamtitan_manage_allowlist` with `action=remove` and the `sender` value
4. Confirm the removal was successful

### When action is `remove-block`

1. Call `spamtitan_list_blocklist` to find the exact entry matching `sender`
2. Confirm the entry exists and display its details for verification
3. Call `spamtitan_manage_blocklist` with `action=remove` and the `sender` value
4. Confirm the removal was successful

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| action | string | Yes | — | Action: allow, block, remove-allow, remove-block, review |
| sender | string | No (required for non-review) | — | Email address, domain (@example.com), or IP |
| domain | string | No | global | Client domain scope for the entry |
| notes | string | No | — | Reason for the action (strongly recommended) |

## Examples

### Review All List Entries

```
/manage-lists --action review
```

### Review Lists for a Specific Client

```
/manage-lists --action review --domain clientcorp.com
```

### Allowlist a Sender for a Specific Client

```
/manage-lists --action allow --sender "alerts@pagerduty.com" --domain clientcorp.com --notes "PagerDuty monitoring alerts — falsely quarantined"
```

### Allowlist an Entire Domain for a Specific Client

```
/manage-lists --action allow --sender "@trusted-partner.com" --domain clientcorp.com --notes "Accounting partner invoices quarantined due to bulk mail scoring"
```

### Block a Spam Domain Globally

```
/manage-lists --action block --sender "@persistent-spammer.net" --notes "Confirmed spam campaign — multiple clients targeted 2026-03-02"
```

### Block a Specific Phishing Address

```
/manage-lists --action block --sender "invoice@fake-billing.ru" --domain clientcorp.com --notes "Phishing address identified in 2026-03-02 quarantine review"
```

### Remove an Allowlist Entry

```
/manage-lists --action remove-allow --sender "noreply@former-vendor.com" --domain clientcorp.com
```

### Remove a Blocklist Entry (False Positive Block)

```
/manage-lists --action remove-block --sender "notifications@legitimate-service.com"
```

## Error Handling

- **Authentication Error:** Verify `SPAMTITAN_API_KEY` is set correctly
- **Duplicate Entry:** Entry already exists in the list; no action needed — display the existing entry
- **Entry Not Found on Remove:** List the current entries to find the exact format of the entry and retry
- **Invalid Entry Format:** Ensure domain entries use `@domain.com` format; email addresses must include `@`; IP addresses must be valid IPv4 or IPv6
- **Permission Denied on Domain:** API key may not have per-domain access; try without the domain parameter for global scope

## Related Commands

- `/review-quarantine` - Review the quarantine queue where list management decisions typically originate
