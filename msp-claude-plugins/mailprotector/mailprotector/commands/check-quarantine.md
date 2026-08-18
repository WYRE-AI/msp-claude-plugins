---
description: Review the Mailprotector quarantine at any scope and summarize held messages
argument-hint: "[scope] [scope-id] [address] [type]"
arguments: [scope, scope-id, address, type]
---

# Check Quarantine

Review quarantined messages for a reseller, customer, domain, user group, or single user, and produce a triage summary.

## Steps

1. **Resolve the scope**
   - If `address` is provided, call `mailprotector_users_find_by_address` to resolve the user, then use `scope: user` with that ID
   - Otherwise use `scope` + `scope-id` as given; default to `scope: reseller` (the bound reseller) when nothing is specified
2. **List held messages**
   - Call `mailprotector_messages_list` with the scope; filter by `type` (`spam`, `policy`, `virus`) when given
   - Paginate — the page size caps at 50; keep fetching until a short page so counts are complete
3. **Summarize**
   - Group by `quarantine_type` and by sender; surface score and the top fired scoring results per message
   - Flag likely false positives (low score, reputation-only results, known business senders) separately from confident holds
4. **Suggest next actions**
   - For releasable candidates, point at `/release-message` with the message IDs
   - For recurring false-positive senders, point at an allow rule via the allow-block-rules skill — do not create one from this command

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| scope | string | No | reseller | `reseller`, `customer`, `domain`, `user_group`, or `user` |
| scope-id | number | No* | bound reseller | Entity ID for the scope |
| address | string | No | - | Email address; resolves to user scope automatically |
| type | string | No | all | Filter: `spam`, `policy`, or `virus` |

*Required for any scope other than `reseller`.

## Examples

```
/check-quarantine
/check-quarantine --scope customer --scope-id 2111
/check-quarantine --address "john@acme.com"
/check-quarantine --scope domain --scope-id 102 --type policy
```

## Output

```
Quarantine Summary — customer 2111 (Acme Corp)

Total held:   34   (spam: 29, policy: 4, virus: 1)

Likely false positives (3):
  1985056110  invoices@vendor.com -> ap@acme.com   "March invoice"   score 340  [SPF softfail, Bulk]
  ...

Confident holds (31):
  1989091611  EraseMyBackPain@memoryhacksplus.bid  score 940  [XBL, Barracuda RBL]
  ...

Next: /release-message --id 1985056110
```

## Error Handling

- **404 on the scope entity** — the ID is not under your reseller; re-list from the parent to find the right one
- **Empty first page** — report "no held messages in scope", never assume an error
- Reseller-scope listings contain every customer's mail metadata; note that in the output when running fleet-wide

## Related Commands

- `/release-message` - Release specific held messages
- `/block-sender` - Create a block rule for an abusive sender
