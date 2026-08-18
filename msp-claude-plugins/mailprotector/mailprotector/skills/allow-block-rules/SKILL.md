---
name: "Mailprotector Allow/Block Rules"
description: >
  Sender allow/block rules at all five scopes: downward inheritance
  (reseller rules apply to everything beneath), the listing that returns
  only directly-attached rules, create with `rule_type: allow|block` and
  address-or-domain values, and the flat delete endpoint.
when_to_use: >-
  When managing Mailprotector sender rules. Use when: allow rule, block
  rule, allowlist, blocklist, whitelist, blacklist, block sender,
  mailprotector rule_type, allow_block_rules, sender exception.
---

# Mailprotector Allow/Block Rules

## Overview

Allow/block rules override filtering per sender: an allow rule bypasses
spam scoring for that sender; a block rule stops the sender's mail
outright. Rules attach to any level of the hierarchy and inherit
downward, so scope choice is the whole game.

## Key Concepts

| Concept | Detail |
|---------|--------|
| `rule_type` | Send lowercase `allow` or `block`; responses may echo `"Allow"`/`"Block"` capitalized — compare case-insensitively |
| `value` | A full address (`user@domain.com`) or a bare domain (`domain.com`) — nothing else, no wildcards |
| `entity` | The owner in responses: `{id, entity_type, name}` with `entity_type` `Account` (reseller **or** customer), `Domain`, `UserGroup`, or `User` |
| Inheritance | A rule applies to the entity it's attached to and everything beneath it |

## Common Workflows

### Listing rules at a scope

`mailprotector_allow_block_rules_list` with `scope` + `scope_id` →
`GET /{resellers|customers|domains|user_groups|users}/{id}/allow_block_rules`.

**The listing returns only rules attached directly to that entity** —
neither rules on entities beneath it nor rules inherited from above.
The effective rule set for a user is the union of five listings:
reseller → customer → domain → user group → user. Audit the whole chain
before declaring "no rule exists for this sender".

### Creating a rule

`mailprotector_allow_block_rules_create` with `scope`, `scope_id`, and

```json
{"value": "user@domain.com", "rule_type": "block"}
```

→ `POST /{scope}/{scope_id}/allow_block_rules`, 201 with the rule `id`.

Pick the narrowest scope that solves the problem:

- One user's newsletter complaint → user scope.
- A customer-wide vendor false positive → customer scope.
- A reseller-scope rule applies to **every customer, domain, group, and
  user** under the MSP — reserve it for universally-true decisions
  (e.g. blocking a known-abusive domain fleet-wide), and say the blast
  radius out loud before creating one.

### Deleting a rule

`mailprotector_allow_block_rules_delete` →
`DELETE /allow_block_rules/{allow_block_rule_id}` → 204. The endpoint is
flat (no scope in the path) — the `id` from a listing is all you need,
which also means a listing at any scope hands you enough to delete rules
you can see. Deletes are irreversible; re-creating needs the original
`value`/`rule_type`, so record them before deleting.

## Gotchas

- **Allow rules are a durable filtering hole.** Spam scoring is bypassed
  for the matched sender, and spoofed mail claiming that sender inherits
  the exemption. Prefer address values over whole domains, and prefer
  narrow scopes over wide ones.
- **A domain value matches every address at that domain** — allowing
  `gmail.com` at any scope is allowing all of Gmail.
- **Block rules fail silent.** The sender's mail simply stops arriving —
  no bounce the recipient sees. A block on a shared sending service
  (e.g. a marketing platform's domain) takes out every legitimate
  customer of that service under the rule's scope.
- **`entity_type: "Account"` is ambiguous** between reseller and
  customer in responses — resolve by the `entity.id` you queried, not
  the type label.
- **Duplicate-looking rules at different scopes are normal** after
  years of per-user self-service; when auditing, collapse by
  `value` + `rule_type` across scopes to see the real posture.

## Related Skills

- [quarantine-and-messages](../quarantine-and-messages/SKILL.md) — where the false-positive evidence comes from
- [api-patterns](../api-patterns/SKILL.md) — scope/scope_id fundamentals
