---
description: Review the SpamTitan quarantine queue, show email statistics summary, and list recent held messages with release and delete actions
argument-hint: "[domain] [reason] [period] [per_page]"
arguments: [domain, reason, period, per_page]
---

# SpamTitan Quarantine Review

Review the SpamTitan quarantine queue for held messages. Starts with an email flow statistics summary, then lists recent quarantined messages grouped by type. Presents release and delete recommendations based on message content and spam scores. This is the primary daily workflow for MSP email security management.

## Prerequisites

- SpamTitan MCP server connected with valid API credentials
- MCP tools `spamtitan_get_stats`, `spamtitan_get_queue`, `spamtitan_get_message`, `spamtitan_release_message`, and `spamtitan_delete_message` available

> **⚠ `domain` scopes the statistics, not the queue.** `spamtitan_get_stats`
> accepts a `domain` argument; `spamtitan_get_queue` does not — its complete
> input schema is `page`, `per_page`, `sender`, `recipient`, `subject`,
> `reason` (`spamtitan-mcp/src/domains/quarantine.ts:21-53`). On a
> multi-tenant appliance the queue listing therefore covers **every tenant**,
> and this command has to narrow it client-side on the recipient address.
> Never present an unnarrowed listing as one customer's quarantine.

## Steps

1. **Get email statistics summary**

   Call `spamtitan_get_stats` with the specified `period` (default: `today`) and `domain` if provided. This call *is* domain-scoped. Display a summary showing total inbound volume, quarantine counts by type, spam rate, and top quarantine senders.

2. **Fetch the quarantine queue**

   Call `spamtitan_get_queue` with `per_page` and `reason` if provided. There is no `domain` filter and no date filter on this call:

   - If a `domain` was given, page through the results and **discard every
     message whose recipient is not in that domain before doing anything
     else.** State in the output that the filter was applied client-side and
     that the underlying listing was appliance-wide.
   - To restrict by time, page and cut on the message `received_at` yourself —
     last 24 hours, extending to 48 if the queue is small.
   - Calling with none of `sender`, `recipient`, `subject`, `reason` makes the
     server elicit a recipient filter from the caller.

3. **Group messages by type**

   Organize the queue by quarantine type:
   - **Phishing** — Always present first; these require urgent attention
   - **Virus** — Display but do not recommend release; deletion is the only safe action
   - **Spam** — High-confidence spam; recommend deletion
   - **Probable Spam** — Lower-confidence; present for manual review
   - **Blocked** — Rule-based blocks; review for intended vs. unintended blocks

4. **Identify likely false positives**

   For probable_spam messages, flag likely false positives based on:
   - Low spam score (below 5.0)
   - Passing SPF and DKIM authentication
   - Presence of `List-Unsubscribe` header (legitimate bulk mail)
   - Sender domain is a recognizable service (monitoring systems, SaaS vendors)

5. **Present release and delete recommendations**

   For each message, recommend either:
   - **Release** — Confirmed false positive; will deliver to recipient inbox
   - **Release + Allowlist** — Repeat false positive; release, then make a second call to add the sender to the allowlist
   - **Delete** — Confirmed spam, phishing, or virus
   - **Review** — Ambiguous; present details for manual decision

6. **Execute actions**

   For messages with clear recommendations, call `spamtitan_release_message` or `spamtitan_delete_message` — one `message_id` per call; there is no bulk tool. Release does **not** allowlist: to stop a repeat false positive recurring, make a separate `spamtitan_manage_allowlist` call with `action=add`, the `sender`, and a `note`.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| domain | string | No | all | Client domain. Passed to `spamtitan_get_stats` as `domain`; applied **client-side** to the queue results, because `spamtitan_get_queue` has no domain filter |
| reason | string | No | all | Quarantine reason to filter the queue by, passed as the tool's `reason` (e.g. `spam`, `virus`, `policy`) |
| period | string | No | today | Statistics period: `today`, `yesterday`, `last_7_days`, `last_30_days`, `last_90_days` |
| per_page | integer | No | 50 | Messages per page, passed as `per_page` (max 200) |

## Examples

### Full Quarantine Review (All Tenants, Today)

```
/review-quarantine
```

### Review One Client (statistics scoped server-side, queue filtered client-side)

```
/review-quarantine --domain clientcorp.com
```

### Review Virus-Quarantined Mail Only

```
/review-quarantine --reason virus
```

### Weekly Summary Review

```
/review-quarantine --period last_7_days --per_page 200
```

## Error Handling

- **Authentication Error:** Verify `SPAMTITAN_API_KEY` is set correctly
- **Domain Not Found:** Check that the domain name matches exactly what is configured in SpamTitan. This affects `spamtitan_get_stats` only — the queue never saw the domain
- **No Statistics Returned:** The `domain` value may not match; call `spamtitan_get_stats` without it to confirm connectivity
- **Cannot Release Virus Message:** Virus-quarantined messages cannot be released via API; this is a security control — delete instead
- **Queue results span other customers:** Expected. `spamtitan_get_queue` has no domain filter; narrow on the recipient address before acting

## Related Commands

- `/manage-lists` - Add or remove sender allowlist and blocklist entries after identifying patterns from the quarantine queue
