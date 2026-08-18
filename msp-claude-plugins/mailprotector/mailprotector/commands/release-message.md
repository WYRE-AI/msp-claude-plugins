---
description: Release one or more quarantined Mailprotector messages to their recipients
argument-hint: "[id] [ids] [scope] [scope-id] [recipients] [confirm]"
arguments: [id, ids, scope, scope-id, recipients, confirm]
---

# Release Message

Release held messages from the Mailprotector quarantine. A release is a delivery — once released, the message is in the recipient's inbox and cannot be recalled.

## Steps

1. **Identify the messages**
   - Single `id` → `mailprotector_messages_release`
   - Multiple `ids` → `mailprotector_messages_release_many`, which needs `scope` + `scope-id` for the entity whose quarantine holds them
2. **Show what is about to be released**
   - Display sender, recipients, subject, `quarantine_type`, and score from the listing row for each ID
   - **Message bodies cannot be read** — the decision is metadata-only; say so rather than implying content was checked
3. **Confirm**
   - Require explicit confirmation for anything with `quarantine_type` `virus` or `policy`, or a score ≥ 500
   - Skip confirmation only when `--confirm` is set, and never for `virus`
4. **Execute and verify**
   - Single release returns 204 (empty body = success)
   - Bulk release returns `delivered_messages` — diff it against the requested IDs; IDs outside the scope entity are **silently skipped**, so report any shortfall explicitly
   - Never pass `all_selected: true` from this command
5. **Report** released IDs, skipped IDs with the likely reason, and any extra `recipients` the delivery was sent to

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | number | No* | - | Single message ID |
| ids | string | No* | - | Comma-separated message IDs |
| scope | string | With `ids` | - | Scope owning the quarantine (`reseller`/`customer`/`domain`/`user_group`/`user`) |
| scope-id | number | With `ids` | bound reseller | Entity ID for the scope |
| recipients | string | No | - | Extra comma-separated addresses to also deliver to |
| confirm | boolean | No | false | Skip confirmation (never honored for virus holds) |

*Exactly one of `id` or `ids` is required.

## Examples

```
/release-message --id 1985056110
/release-message --ids "2015573567,2015573173" --scope customer --scope-id 2111
/release-message --id 1985056110 --recipients "manager@acme.com"
```

## Output

```
Released 2 of 3 requested messages (customer 2111)

Released:
  2015573173  invoices@vendor.com -> ap@acme.com     "March invoice"
  2015573567  invoices@vendor.com -> ap@acme.com     "April invoice"

Skipped:
  2015570001  — not under customer 2111 (deliver_many skips out-of-scope IDs silently)
```

## Error Handling

- **204 with empty body is success** for a single release — do not retry it
- **Empty `delivered_messages`** with no error usually means a wrong `scope-id`, not an empty quarantine
- **Release refused for a virus/spam/policy type** — check `permissions.messages.allow_*_release` via `mailprotector_configuration_get`; a disabled flag is the control working, not an error to route around

## Related Commands

- `/check-quarantine` - Find and triage held messages first
- `/block-sender` - The opposite action, for confirmed-bad senders
