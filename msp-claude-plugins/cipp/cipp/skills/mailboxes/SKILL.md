---
name: "cipp-mailboxes"
description: "Use this skill when working with Exchange Online mailboxes through CIPP — listing mailboxes, auditing mailbox permissions, configuring out-of-office auto-replies, and setting email forwarding. Covers the mailbox surface most relevant to MSP operations: offboarding, leave coverage, BEC remediation."
when_to_use: >-
  When listing mailboxes, checking mailbox delegate/full-access permissions, configuring
  out-of-office, or setting email forwarding for a tenant. Use when: cipp mailbox, mailbox
  permissions, out of office, auto reply, email forwarding, mail forwarding, shared mailbox,
  mailbox delegate, or full access mailbox.
---

# CIPP Mailboxes

Exchange Online mailbox operations through CIPP. The four supported tools cover the highest-frequency MSP mailbox tasks: listing mailboxes for inventory, auditing permissions during BEC investigations, setting OOO for leave/offboarding, and configuring forwarding for transition periods.

## Tools

### `cipp_list_mailboxes`

```
cipp_list_mailboxes(tenantFilter='contoso.onmicrosoft.com')
```

Returns all mailboxes (User, Shared, Resource, Equipment, Room) with `userPrincipalName`, `recipientTypeDetails`, `archiveStatus`, `litigationHoldEnabled`, and storage usage. Use as the entry point for any mailbox audit.

### `cipp_list_mailbox_permissions`

```
cipp_list_mailbox_permissions(tenantFilter, userPrincipalName='user@contoso.com')
```

Lists all delegates and full-access trustees on a mailbox. **Critical during BEC investigations** — attackers commonly grant themselves Full Access or add a forwarding rule. Always run this on a compromised mailbox before remediation.

### `cipp_set_out_of_office`

```
cipp_set_out_of_office(tenantFilter, userPrincipalName,
                       enabled=true|false,
                       internalMessage?, externalMessage?,
                       startTime?, endTime?)
```

Use during offboarding (permanent), planned leave (scheduled), or as a tactical control after disabling an account so external senders get a clear bounce-equivalent.

### `cipp_set_email_forwarding`

```
cipp_set_email_forwarding(tenantFilter, userPrincipalName,
                          forwardingAddress?,
                          deliverToBoth=true|false,
                          disable=true|false)
```

Set `disable=true` to remove existing forwarding — this is the **first action** during BEC remediation. Set `forwardingAddress` to redirect a leaver's mail to their manager during transition.

## Workflow patterns

### BEC investigation — mailbox layer

1. `cipp_list_mailbox_permissions` — capture current delegates before changes
2. Check the BEC report from `cipp_bec_check` for forwarding rules and inbox rules
3. `cipp_set_email_forwarding(disable=true)` — remove any forwarding the attacker added
4. (Outside CIPP scope: review and remove malicious inbox rules via Graph or PowerShell)
5. Document the original delegate list — restore legitimate ones after cleanup

### Offboarding — mailbox handling

If `cipp_offboard_user` is run with `convertToShared=true`, CIPP handles the mailbox conversion internally. For manual control:

1. `cipp_set_out_of_office(enabled=true)` with a clear "no longer with the company" message
2. `cipp_set_email_forwarding(forwardingAddress=manager@contoso.com, deliverToBoth=true)` to keep a paper trail while routing to the manager

### Planned leave coverage

```
cipp_set_out_of_office(tenantFilter, userPrincipalName, enabled=true,
                       internalMessage='Out until 2026-05-15. Contact teamlead@.',
                       externalMessage='I am out of office. Please contact our team at...',
                       startTime='2026-05-01T00:00:00Z',
                       endTime='2026-05-15T00:00:00Z')
```

Scheduled OOO with start/end times is preferred over `enabled=true` without dates — it auto-disables on return.

## Caveats

- These tools are scoped to the mailbox-level operations CIPP exposes. Transport rules, mail flow, quarantine, and per-tenant Exchange settings require either CIPP UI workflows or direct Exchange Online PowerShell.
- `cipp_set_email_forwarding(disable=true)` removes all forwarding — including legitimate ones. Capture state first.
