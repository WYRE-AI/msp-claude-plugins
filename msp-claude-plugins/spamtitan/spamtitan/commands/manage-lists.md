---
description: Add, remove, or list entries in SpamTitan sender allowlists and blocklists
argument-hint: "<action> [sender] [note]"
arguments: [action, sender, note]
---

# SpamTitan List Management

Add or remove entries from SpamTitan sender allowlists and blocklists, or review existing list entries. Allowlisting trusted senders prevents false positives; blocklisting unwanted senders stops persistent spam and phishing. For MSPs, list management is a core part of tuning email security for each client.

## Prerequisites

- SpamTitan MCP server connected with valid API credentials
- MCP tools `spamtitan_manage_allowlist` and `spamtitan_manage_blocklist` available

Both lists are reached through those two tools. Listing is the tool's own
`action: "list"` argument — there is no separate list tool.

> **Neither tool takes a `domain` or `scope` parameter.** Their complete input
> schema is `action` (required: `add` | `remove` | `list`), `sender`, and
> `note` (`spamtitan-mcp/src/domains/lists.ts:15-79`). An entry added here
> lands at whatever scope the appliance and API key give it; you cannot confine
> it to one client from this command. If a client-scoped entry is required, add
> it in the SpamTitan admin interface.

## Steps

### When action is `review`

1. Call `spamtitan_manage_allowlist` with `action=list` to retrieve current allowlist entries
2. Call `spamtitan_manage_blocklist` with `action=list` to retrieve current blocklist entries
3. Display both lists in full. Both return everything the appliance holds — there is no per-client filter, so group entries by sender domain yourself and say plainly that the listing is appliance-wide
4. Flag entries older than 6 months as candidates for review and potential removal
5. Note any overlapping or overly broad entries (e.g., entire domain allowlists) that may create security risk

### When action is `allow`

1. Call `spamtitan_manage_allowlist` with `action=list` to confirm the sender is not already allowlisted
2. Confirm with the user that the sender is legitimate before proceeding — an allowlist entry is a durable bypass of spam scoring, and spoofed mail claiming to be that sender inherits it
3. Call `spamtitan_manage_allowlist` with `action=add`, the `sender` value, and a `note`
4. Report the returned confirmation message

### When action is `block`

1. Call `spamtitan_manage_blocklist` with `action=list` to confirm the sender is not already blocked
2. Warn if the `sender` is a broad domain that may be a shared sending service (e.g., Google, Outlook, SendGrid) — blocking one takes out every legitimate sender on it
3. Tell the user the entry cannot be confined to one client from here, and get explicit confirmation. This is the high-impact tool: a block produces no bounce and no alert, so the sender simply stops arriving, sometimes for weeks before anyone notices
4. Call `spamtitan_manage_blocklist` with `action=add`, the `sender` value, and a `note`
5. Report the returned confirmation message

### When action is `remove-allow`

1. Call `spamtitan_manage_allowlist` with `action=list` to find the exact entry matching `sender`
2. Confirm the entry exists and display its details for verification
3. Call `spamtitan_manage_allowlist` with `action=remove` and the `sender` value
4. Confirm the removal was successful

### When action is `remove-block`

1. Call `spamtitan_manage_blocklist` with `action=list` to find the exact entry matching `sender`
2. Confirm the entry exists and display its details for verification. Removing a block restores delivery for that sender — confirm that is intended
3. Call `spamtitan_manage_blocklist` with `action=remove` and the `sender` value
4. Confirm the removal was successful

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| action | string | Yes | — | Action: allow, block, remove-allow, remove-block, review. Maps to the tool's `action` (`add`/`remove`/`list`) plus which of the two tools to call |
| sender | string | No (required for non-review) | — | Email address or domain (`@example.com`). Passed as the tool's `sender`. IP entries are not addressable here |
| note | string | No | — | Reason for the action, passed as the tool's `note` (singular). Strongly recommended |

## Examples

### Review All List Entries

```
/manage-lists --action review
```

### Allowlist a Sender

```
/manage-lists --action allow --sender "alerts@pagerduty.com" --note "PagerDuty monitoring alerts — falsely quarantined"
```

### Allowlist an Entire Domain

```
/manage-lists --action allow --sender "@trusted-partner.com" --note "Accounting partner invoices quarantined due to bulk mail scoring"
```

### Block a Spam Domain

```
/manage-lists --action block --sender "@persistent-spammer.net" --note "Confirmed spam campaign — multiple clients targeted 2026-03-02"
```

### Block a Specific Phishing Address

```
/manage-lists --action block --sender "invoice@fake-billing.ru" --note "Phishing address identified in 2026-03-02 quarantine review"
```

### Remove an Allowlist Entry

```
/manage-lists --action remove-allow --sender "noreply@former-vendor.com"
```

### Remove a Blocklist Entry (False Positive Block)

```
/manage-lists --action remove-block --sender "notifications@legitimate-service.com"
```

## Error Handling

- **Authentication Error:** Verify `SPAMTITAN_API_KEY` is set correctly
- **Duplicate Entry:** Entry already exists in the list; no action needed — display the existing entry
- **`'action' is required`:** `action` is the only required tool parameter. If omitted the server elicits it interactively, which an unattended agent cannot answer — always pass it
- **`'sender' is required when action is 'add'` / `'remove'`:** supply `sender`; it is only optional for `action=list`
- **Entry Not Found on Remove:** Call `action=list` to find the exact format of the entry and retry
- **Invalid Entry Format:** Ensure domain entries use `@domain.com` format and email addresses include `@`. IP entries cannot be added through these tools — use the SpamTitan admin interface
- **Permission Denied:** Verify API key scope with your SpamTitan admin. There is no `domain` parameter to adjust or omit

## Related Commands

- `/review-quarantine` - Review the quarantine queue where list management decisions typically originate
