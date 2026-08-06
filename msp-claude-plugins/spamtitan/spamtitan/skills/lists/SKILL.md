---
name: "SpamTitan Lists"
description: >
  SpamTitan sender allowlists and blocklists: the add/remove/list action
  parameter, entry types, allowlisting trusted senders to prevent false
  positives, blocking unwanted senders and domains, and the scoping limit —
  neither manage tool takes a domain parameter.
when_to_use: >-
  When adding, removing, or reviewing SpamTitan allowlist or blocklist entries. Use when:
  allowlist, blocklist, whitelist, blacklist, sender policy, spamtitan allow, spamtitan block,
  trusted sender, block sender, spamtitan allowlist, spamtitan blocklist, allow sender, or block
  domain.
---

# SpamTitan Sender List Management

## Overview

SpamTitan maintains two key sender policy lists that override the spam filtering engine: the allowlist (trusted senders whose mail is always delivered) and the blocklist (blocked senders whose mail is always rejected or quarantined). Proper list management is essential for MSPs to balance effective spam filtering against business continuity — preventing false positives from disrupting client workflows while blocking persistent unwanted senders.

## Anti-triggers

- **Deciding what to do with a message already sitting in quarantine** —
  use `SpamTitan Quarantine`.
- **Blocking a sender in another vendor's engine** — sender lists do not
  federate. Ironscales keeps its own allowlist behind
  `IRONSCALES Incidents`, and every other gateway keeps its own too;
  allowlisting here changes nothing anywhere else.
- **Mail-flow rules inside the tenant** — these lists live in the
  SpamTitan gateway, upstream of Exchange Online. Forwarding, inbox
  rules, and mailbox-level mail flow are `Microsoft 365 Mailboxes` or
  `cipp-mailboxes`.

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

The `sender` parameter on both tools accepts:

- **Email address** — e.g., `sender@example.com` — matches only that exact address
- **Domain** — e.g., `@example.com` — matches all senders from that domain

The appliance also supports IP-based entries, but this connector's `sender`
parameter is documented for addresses and domains only
(`spamtitan-mcp/src/domains/lists.ts:30-34`). Add IP entries in the SpamTitan
admin interface.

### Per-Domain vs. Global Lists

The SpamTitan appliance itself distinguishes global entries from per-domain
ones, and per-domain entries are what you want in an MSP environment — a
global entry affects every client the gateway filters for.

**But this connector cannot express that distinction.**
`spamtitan_manage_allowlist` and `spamtitan_manage_blocklist` take only
`action`, `sender`, and `note` (`spamtitan-mcp/src/domains/lists.ts:15-79`).
There is no `domain` or `scope` parameter, so an entry added through these
tools lands at whatever default scope the appliance and API key give it. If a
client-scoped entry is required, add it in the SpamTitan admin interface and
record the reason there; do not claim a per-domain scope you did not set.

## API Patterns

### List Allowlist Entries

Listing is an argument, not a separate tool: call `spamtitan_manage_allowlist`
with `action: "list"`.

```json
{
  "action": "list"
}
```

Parameters (complete — there is no `domain`, `type`, `page`, or `limit`):
- `action` — **Required.** `add`, `remove`, or `list`
- `sender` — Email address or domain. Required by the handler for `add` and
  `remove`; ignored for `list`
- `note` — Free-text reason recorded with the entry (for `add`)

Omitting `action` makes the server elicit it from the caller. An unattended
agent cannot answer an elicitation, so the call stalls instead of proceeding.

The list is returned whole — there is no pagination on this call, so a large
list arrives in one response.

**Example response:**

The server wraps whatever the appliance returns as `{ "allowlist": [...] }`.
Entry shape is the appliance's, not this connector's — expect something like:

```json
{
  "allowlist": [
    {
      "id": "al-00491",
      "entry": "alerts@pagerduty.com",
      "type": "email",
      "domain": "clientcorp.com",
      "added_at": "2026-01-15T10:30:00Z",
      "added_by": "admin@mymsp.com",
      "notes": "PagerDuty monitoring alerts — falsely quarantined"
    }
  ]
}
```

Note the response may carry a `domain` on an entry even though you cannot set
one through this connector — that reflects how the entry was created, which
may have been in the admin interface.

### Add or Remove Allowlist Entries

Same tool, different `action`.

```
spamtitan_manage_allowlist
```

Parameters:
- `action` — **Required.** `add`, `remove`, or `list`
- `sender` — The sender address or domain (e.g. `user@example.com` or
  `@example.com`). Required for `add` and `remove`
- `note` — Reason for adding (strongly recommended for audit trail; applies to
  `add`). Singular `note`, not `notes`

**Example — Add email address to allowlist:**

```json
{
  "action": "add",
  "sender": "noreply@vendor-crm.com",
  "note": "CRM notification emails — quarantined due to bulk mail score"
}
```

**Example response:**

```json
{
  "success": true,
  "message": "'noreply@vendor-crm.com' added to allowlist"
}
```

**Example — Remove an entry from allowlist:**

```json
{
  "action": "remove",
  "sender": "noreply@former-vendor.com"
}
```

### List Blocklist Entries

Same shape as the allowlist: `spamtitan_manage_blocklist` with
`action: "list"`.

```json
{
  "action": "list"
}
```

Parameters (complete — there is no `domain`, `type`, `page`, or `limit`):
- `action` — **Required.** `add`, `remove`, or `list`
- `sender` — Required for `add` and `remove`
- `note` — Free-text reason (for `add`)

**Example response** (wrapped as `{ "blocklist": [...] }`):

```json
{
  "blocklist": [
    {
      "id": "bl-00201",
      "entry": "@persistent-spammer.net",
      "type": "domain",
      "scope": "global",
      "added_at": "2026-02-28T09:00:00Z",
      "notes": "Confirmed spam campaign — multiple clients targeted"
    }
  ]
}
```

### Add or Remove Blocklist Entries

```
spamtitan_manage_blocklist
```

> **⚠ HIGH-IMPACT — the server marks this tool `destructiveHint: true` and
> opens its own description with a warning.** One `add` can silently stop a
> customer's legitimate mail: there is no bounce visible to the recipient and
> no alert, so the sender simply stops arriving, sometimes for weeks before
> anyone notices. A domain-scoped entry against a shared sending service takes
> out every customer using it. And because this connector has no `domain`
> parameter, you cannot confine the entry to one client from here. Confirm with
> a human before every `add` and every `remove`; `action: "list"` is the only
> benign call on this tool.

Parameters:
- `action` — **Required.** `add`, `remove`, or `list`
- `sender` — The sender address or domain to block (e.g. `spammer@evil.com` or
  `@evil.com`). Required for `add` and `remove`
- `note` — Reason for blocking (required as audit-trail practice, optional to
  the API). Singular `note`, not `notes`

**Example — Block a domain:**

```json
{
  "action": "add",
  "sender": "@confirmed-malicious.ru",
  "note": "Confirmed phishing domain — identified in multiple client incidents 2026-03-02"
}
```

**Example response:**

```json
{
  "success": true,
  "message": "'@confirmed-malicious.ru' added to blocklist"
}
```

**Example — Remove a blocklist entry (e.g., false positive block):**

```json
{
  "action": "remove",
  "sender": "notifications@legitimate-service.com"
}
```

## Common Workflows

### Resolving a Quarantine False Positive with Allowlisting

1. Identify the falsely quarantined sender via the quarantine queue
2. Confirm the sender is legitimate by reviewing headers, links, and content
3. Call `spamtitan_manage_allowlist` with `action=list` to check if the sender is already listed (may need to be updated)
4. Call `spamtitan_manage_allowlist` with `action=add` and the `sender` address or domain
5. Release the quarantined message with `spamtitan_release_message` — a separate call; release does not allowlist
6. Document the allowlist entry with a clear `note` value explaining why the sender is trusted

### Blocking a Persistent Spam Campaign

1. Identify the spam sender from the quarantine queue or a user complaint
2. Check if other clients are receiving the same mail (cross-domain pattern)
3. Recognise that you cannot choose the scope from here — these tools take no `domain` parameter, so the entry lands wherever the appliance and API key put it. If the block must be confined to one client, do it in the SpamTitan admin interface instead
4. Call `spamtitan_manage_blocklist` with `action=add`, the `sender`, and a descriptive `note`. Get a human to confirm first — this is the high-impact tool
5. If blocking a domain rather than a single address, confirm the domain is not a legitimate shared sending service (e.g., never block `@gmail.com`)
6. Delete any existing quarantined messages from the same sender with `spamtitan_delete_message`, one `message_id` per call

### Reviewing and Auditing List Entries

1. Call `spamtitan_manage_allowlist` and `spamtitan_manage_blocklist`, each with `action=list`. Both return the appliance-wide list — there is no per-client filter, so attribute entries to clients yourself from the sender values
2. Review entries older than 6 months — vendors and partners may have changed, and allowlist entries should be periodically revalidated
3. Look for overly broad domain allowlists that may create a security risk (e.g., allowlisting an entire popular domain)
4. Remove stale entries with `spamtitan_manage_allowlist` or `spamtitan_manage_blocklist` using `action=remove`
5. Document the review in the client's PSA ticket for compliance records

### Blocking After a Phishing Campaign

1. After identifying and deleting a phishing campaign in the quarantine queue, note the sending domain
2. Add the sending domain with `spamtitan_manage_blocklist`, `action=add`. It applies at the appliance's default scope, not a client's — confirm that is acceptable before you call
3. IP-based entries are not expressible through this connector's `sender` parameter; block a sending IP in the SpamTitan admin interface
4. Check whether any related domains (typosquats or same registrant) should also be blocked
5. Verify the block is effective by checking subsequent quarantine entries — the sender should no longer appear

## Error Handling

### Duplicate Entry

**Cause:** Attempting to add an entry that already exists in the list
**Solution:** Call the same tool with `action=list` to check existing entries before adding

### Missing `action`

**Cause:** `action` is the only required parameter, and it was omitted
**Solution:** The server elicits it interactively. An unattended agent cannot answer, so pass `action` explicitly on every call

### Missing `sender`

**Cause:** `action=add` or `action=remove` without a `sender`
**Solution:** The handler returns `'sender' is required when action is 'add'` (or `'remove'`). Supply it; `sender` is ignored only for `action=list`

### Entry Not Found on Remove

**Cause:** Attempting to remove an entry that doesn't exist or uses a different format than what was added
**Solution:** Call `action=list` and use the exact sender value that appears in the response

### Invalid Entry Format

**Cause:** Submitting an improperly formatted email address or domain
**Solution:** Ensure domains use the `@domain.com` format and email addresses include both local part and domain. IP entries are not addressable through the `sender` parameter — use the SpamTitan admin interface

### Permission Denied

**Cause:** API key does not have permission to manage lists
**Solution:** Verify API key scope with your SpamTitan admin. There is no per-call domain scope to adjust — these tools take no `domain` parameter

## Best Practices

- Always provide a `note` when adding list entries — six months from now, no one will remember why a sender was allowlisted
- Prefer allowlisting specific email addresses over entire domains when possible; domain allowlisting is a broader trust grant
- Never allowlist based on a user's request alone — always verify the sender is legitimate before adding
- Review allowlists and blocklists quarterly with `action=list`; stale entries accumulate and become a security and maintenance burden
- Document the threat intelligence source in the `note` on every blocklist entry (e.g., "Confirmed phishing — seen across 3 client accounts on 2026-03-02"). Since scope cannot be confined from here, treat every entry as potentially appliance-wide and write the note accordingly
- Be cautious about blocking shared sending services (SendGrid, Mailchimp, etc.) — block the specific sending address or subdomain, not the entire service
- Cross-reference blocklist additions with allowlists — a sender cannot be in both lists simultaneously

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Authentication, pagination, and error handling
- [quarantine](../quarantine/SKILL.md) - Quarantine queue management where list decisions originate
