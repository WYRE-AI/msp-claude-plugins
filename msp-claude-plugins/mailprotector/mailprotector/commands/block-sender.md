---
description: Create a Mailprotector block rule for a sender address or domain at a chosen scope
argument-hint: "[value] [scope] [scope-id] [confirm]"
arguments: [value, scope, scope-id, confirm]
---

# Block Sender

Create an allow/block rule of type `block` for a sender. A block rule silently stops the sender's mail for everything at and below the chosen scope — no bounce anyone sees.

## Steps

1. **Validate the value** — must be a full address (`user@domain.com`) or a bare domain (`domain.com`); no wildcards. A domain value blocks **every** address at that domain
2. **Check for existing rules** — `mailprotector_allow_block_rules_list` at the target scope and the scopes above it; an inherited allow rule for the same value will fight the new block, and a duplicate block is noise
3. **State the blast radius** — name exactly what the scope covers (`user` = one mailbox; `customer` = every domain/user under the client; `reseller` = the entire client base). Warn extra loudly for domain values on shared sending services
4. **Confirm** — require explicit confirmation for any scope wider than `user`, or any bare-domain value, unless `--confirm` is set
5. **Create** — `mailprotector_allow_block_rules_create` with `{"value": ..., "rule_type": "block"}` at the scope; report the new rule ID (needed for any future delete via `mailprotector_allow_block_rules_delete`)

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| value | string | Yes | - | Sender address or bare domain to block |
| scope | string | No | user | `reseller`, `customer`, `domain`, `user_group`, or `user` |
| scope-id | number | Yes* | bound reseller | Entity ID for the scope |
| confirm | boolean | No | false | Skip confirmation for wide scopes / domain values |

*Required for any scope other than `reseller`.

## Examples

```
/block-sender --value "phisher@badcorp.com" --scope user --scope-id 883326
/block-sender --value "spam-blaster.net" --scope customer --scope-id 2111
```

## Output

```
Block rule created

Rule ID:  2445356
Value:    spam-blaster.net (domain — blocks every address at this domain)
Type:     block
Scope:    customer 2111 (Acme Corp) — applies to all domains, groups, and users beneath

Existing related rules found: none
To undo: mailprotector_allow_block_rules_delete 2445356
```

## Error Handling

- **Responses may echo `rule_type` capitalized** (`"Block"`) — that is the same rule, not a different type
- **Sender still arriving after the block** — check for an allow rule for the same value at a scope above; scoped rules interact and an audit of the full chain (reseller → ... → user) settles it
- **422** — malformed value; only plain addresses and domains are accepted

## Related Commands

- `/check-quarantine` - Where blocked-sender complaints usually surface first
- `/release-message` - For the false-positive direction instead
