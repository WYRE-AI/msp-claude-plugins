---
name: "SpamTitan Lists"
description: >
  SpamTitan sender allowlists and blocklists: entry types, per-domain vs.
  global list scope, allowlisting trusted senders to prevent false
  positives, and blocking unwanted senders and domains.
when_to_use: >-
  When adding, removing, or reviewing SpamTitan allowlist or blocklist entries. Use when:
  allowlist, blocklist, whitelist, blacklist, sender policy, spamtitan allow, spamtitan block,
  trusted sender, block sender, spamtitan allowlist, spamtitan blocklist, allow sender, or block
  domain.
---

# SpamTitan Sender List Management

## Overview

SpamTitan maintains two key sender policy lists that override the spam filtering engine: the allowlist (trusted senders whose mail is always delivered) and the blocklist (blocked senders whose mail is always rejected or quarantined). Proper list management is essential for MSPs to balance effective spam filtering against business continuity — preventing false positives from disrupting client workflows while blocking persistent unwanted senders.

## Key Concepts

### Allowlist (Trusted Senders)

The allowlist contains senders whose email is delivered directly to users' inboxes, bypassing spam scoring. Use the allowlist for:

- Legitimate business partners whose emails are frequently misclassified as spam
- Bulk notification systems (monitoring alerts, business SaaS tools) that trigger spam rules
- Internal relay servers or third-party mailing services used by the client
- Vendors with IP-based reputation issues beyond their control

**Caution:** Allowlisting bypasses spam filtering entirely. Only allowlist senders you have explicitly verified as legitimate. Attackers frequently spoof trusted sender addresses.

### Blocklist (Blocked Senders)

The blocklist causes matching emails to be immediately rejected or quarantined, regardless of their spam score. Use the blocklist for:

- Known spam campaigns with persistent sending addresses
- Domains that have been identified as malicious or compromised
- Senders that bypass spam scoring with low-score messages but are clearly unwanted
- Former vendors or partners whose mail is no longer wanted

### Entry Types

Both lists support multiple entry scopes:

- **Email address** — e.g., `sender@example.com` — matches only that exact address
- **Domain** — e.g., `@example.com` or `example.com` — matches all senders from that domain
- **IP address** — e.g., `203.0.113.45` — matches email from a specific sending IP

### Per-Domain vs. Global Lists

In multi-tenant SpamTitan deployments, lists can be applied at two scopes:

- **Global** — Applies to all client domains managed by the gateway
- **Per-domain** — Applies only to a specific client domain

Always prefer per-domain entries in MSP environments to avoid unintended cross-client effects.

## API Patterns

### List Allowlist Entries

```
spamtitan_list_allowlist
```

Parameters:
- `domain` — Filter entries for a specific client domain (omit for global entries)
- `type` — Filter by entry type (`email`, `domain`, `ip`)
- `page` — Page number (1-based)
- `limit` — Results per page (max 200)

**Example response:**

```json
{
  "entries": [
    {
      "id": "al-00491",
      "entry": "alerts@pagerduty.com",
      "type": "email",
      "domain": "clientcorp.com",
      "added_at": "2026-01-15T10:30:00Z",
      "added_by": "admin@mymsp.com",
      "notes": "PagerDuty monitoring alerts — falsely quarantined"
    },
    {
      "id": "al-00492",
      "entry": "@trusted-partner.com",
      "type": "domain",
      "domain": "clientcorp.com",
      "added_at": "2026-02-01T14:22:00Z",
      "added_by": "admin@mymsp.com",
      "notes": "Accounting partner — invoices frequently quarantined"
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 200
}
```

### Add Allowlist Entry

```
spamtitan_manage_allowlist
```

Parameters:
- `action` — `add` or `remove`
- `entry` — The sender address, domain, or IP to allowlist
- `domain` — Client domain scope (omit for global)
- `notes` — Reason for adding (strongly recommended for audit trail)

**Example — Add email address to allowlist:**

```json
{
  "action": "add",
  "entry": "noreply@vendor-crm.com",
  "domain": "clientcorp.com",
  "notes": "CRM notification emails — quarantined due to bulk mail score"
}
```

**Example response:**

```json
{
  "success": true,
  "id": "al-00499",
  "entry": "noreply@vendor-crm.com",
  "type": "email",
  "domain": "clientcorp.com",
  "added_at": "2026-03-02T11:15:00Z"
}
```

**Example — Remove an entry from allowlist:**

```json
{
  "action": "remove",
  "entry": "noreply@former-vendor.com",
  "domain": "clientcorp.com"
}
```

### List Blocklist Entries

```
spamtitan_list_blocklist
```

Parameters:
- `domain` — Filter entries for a specific client domain (omit for global entries)
- `type` — Filter by entry type (`email`, `domain`, `ip`)
- `page` — Page number (1-based)
- `limit` — Results per page

**Example response:**

```json
{
  "entries": [
    {
      "id": "bl-00201",
      "entry": "@persistent-spammer.net",
      "type": "domain",
      "domain": null,
      "scope": "global",
      "added_at": "2026-02-28T09:00:00Z",
      "added_by": "admin@mymsp.com",
      "notes": "Confirmed spam campaign — multiple clients targeted"
    },
    {
      "id": "bl-00202",
      "entry": "invoice@fake-billing.ru",
      "type": "email",
      "domain": "clientcorp.com",
      "scope": "per-domain",
      "added_at": "2026-03-02T08:30:00Z",
      "added_by": "admin@mymsp.com",
      "notes": "Phishing sender — quarantined 2026-03-02 campaign"
    }
  ],
  "total": 8,
  "page": 1,
  "limit": 200
}
```

### Add Blocklist Entry

```
spamtitan_manage_blocklist
```

Parameters:
- `action` — `add` or `remove`
- `entry` — The sender address, domain, or IP to block
- `domain` — Client domain scope (omit for global)
- `notes` — Reason for blocking (required for audit trail best practice)

**Example — Block a domain globally:**

```json
{
  "action": "add",
  "entry": "@confirmed-malicious.ru",
  "notes": "Confirmed phishing domain — identified in multiple client incidents 2026-03-02"
}
```

**Example response:**

```json
{
  "success": true,
  "id": "bl-00209",
  "entry": "@confirmed-malicious.ru",
  "type": "domain",
  "scope": "global",
  "added_at": "2026-03-02T12:00:00Z"
}
```

**Example — Remove a blocklist entry (e.g., false positive block):**

```json
{
  "action": "remove",
  "entry": "notifications@legitimate-service.com"
}
```

## Common Workflows

### Resolving a Quarantine False Positive with Allowlisting

1. Identify the falsely quarantined sender via the quarantine queue
2. Confirm the sender is legitimate by reviewing headers, links, and content
3. Call `spamtitan_list_allowlist` to check if the sender is already listed (may need to be updated)
4. Call `spamtitan_manage_allowlist` with `action=add` and the sender address or domain
5. Release the quarantined message with `spamtitan_release_message`
6. Document the allowlist entry with a clear `notes` value explaining why the sender is trusted

### Blocking a Persistent Spam Campaign

1. Identify the spam sender from the quarantine queue or a user complaint
2. Check if other clients are receiving the same mail (cross-domain pattern)
3. Decide on scope: per-domain if only one client is affected, global if multiple clients are targeted
4. Call `spamtitan_manage_blocklist` with `action=add` and include descriptive notes
5. If blocking a domain rather than a single address, confirm the domain is not a legitimate shared sending service (e.g., never block `@gmail.com`)
6. Delete any existing quarantined messages from the same sender with `spamtitan_delete_message`

### Reviewing and Auditing List Entries

1. Call `spamtitan_list_allowlist` and `spamtitan_list_blocklist` for each client domain
2. Review entries older than 6 months — vendors and partners may have changed, and allowlist entries should be periodically revalidated
3. Look for overly broad domain allowlists that may create a security risk (e.g., allowlisting an entire popular domain)
4. Remove stale entries with `spamtitan_manage_allowlist` or `spamtitan_manage_blocklist` using `action=remove`
5. Document the review in the client's PSA ticket for compliance records

### Blocking After a Phishing Campaign

1. After identifying and deleting a phishing campaign in the quarantine queue, note the sending domain and IP
2. Add the sending domain to the global blocklist with `spamtitan_manage_blocklist`
3. If the phishing mail arrived from a specific sending IP, also blocklist the IP address
4. Check whether any related domains (typosquats or same registrant) should also be blocked
5. Verify the block is effective by checking subsequent quarantine entries — the sender should no longer appear

## Error Handling

### Duplicate Entry

**Cause:** Attempting to add an entry that already exists in the list
**Solution:** Call `spamtitan_list_allowlist` or `spamtitan_list_blocklist` to check existing entries before adding

### Entry Not Found on Remove

**Cause:** Attempting to remove an entry that doesn't exist or uses a different format than what was added
**Solution:** List the current entries and use the exact `entry` value that appears in the list response

### Invalid Entry Format

**Cause:** Submitting an improperly formatted email address, domain, or IP
**Solution:** Ensure domains use the `@domain.com` format; IP addresses must be valid IPv4 or IPv6; email addresses must include both local part and domain

### Permission Denied on Domain

**Cause:** API key does not have permission to manage lists for the specified domain
**Solution:** Verify API key scope; use global scope or contact your SpamTitan admin to grant per-domain access

## Best Practices

- Always provide `notes` when adding list entries — six months from now, no one will remember why a sender was allowlisted
- Prefer allowlisting specific email addresses over entire domains when possible; domain allowlisting is a broader trust grant
- Never allowlist based on a user's request alone — always verify the sender is legitimate before adding
- Review allowlists and blocklists quarterly; stale entries accumulate and become a security and maintenance burden
- For global blocklist entries, document the threat intelligence source (e.g., "Confirmed phishing — seen across 3 client accounts on 2026-03-02")
- Be cautious about blocking shared sending services (SendGrid, Mailchimp, etc.) — block the specific sending address or subdomain, not the entire service
- Cross-reference blocklist additions with allowlists — a sender cannot be in both lists simultaneously

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Authentication, pagination, and error handling
- [quarantine](../quarantine/SKILL.md) - Quarantine queue management where list decisions originate
