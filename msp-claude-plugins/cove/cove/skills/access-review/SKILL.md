---
name: "Cove Console Access Review"
description: >
  Reviewing who can sign in to the Cove Management Console for each customer
  and with which role, spotting leavers and over-privileged accounts, and
  reading the user-action audit log (cove_audit_actions_list, admin-gated in
  Conduit and needing an Administrator API user in Cove) to see who changed
  devices, retention, users or customers.
when_to_use: >-
  When someone runs a quarterly access review of the backup console, offboards
  a technician, or needs to know who changed or deleted something in Cove.
  Use when: cove users, cove access review, cove roles, backup console
  access, cove audit log, who deleted backup, who changed retention,
  technician offboarding, or cove superuser.
---

# Cove Console Access Review

## Overview

Backup console access is high-value: a console user can delete devices,
change retention, or restore data to another machine. MSPs review it each
quarter, after a technician leaves, and when a client's security
questionnaire asks who can reach their backups. These tools only read. Remove
or change users in the Cove console.

## Permissions

| Tool | Conduit tier | Cove role needed |
|------|--------------|------------------|
| `cove_users_list` | read | Supporter |
| `cove_user_roles_list` | read | Supporter |
| `cove_audit_actions_list` | **admin-gated**: only Conduit members with the admin tier can call it | Administrator or SuperUser. Other roles get error 13501. |

`cove_users_list` returns names and email addresses of your staff and your
customers' staff. Keep the output with the people doing the review.

If the user is not a Conduit admin, or the connected API user is a
Supporter, do the user and role review and say plainly that the audit log
part needs both a Conduit admin and an Administrator API user.

## Anti-triggers

- **Device backup status**: use `cove-backup-health`.
- **Customer states, products or storage**: use `cove-customer-inventory`.

## Workflows

### Quarterly access review

1. `cove_auth_context_get` for the root `PartnerId`.
2. `cove_partners_list` with `fetch_recursively: true` and `fields: [0, 1]`
   to get every customer ID and name.
3. `cove_users_list` with `partner_ids`: the root plus the customers to
   review, at most 100 IDs per call. Split larger trees into batches.
4. `cove_user_roles_list` to name the roles.
5. Flag, in this order:
   - **SuperUser** accounts. There should be very few; each needs an owner
     who can justify it.
   - **API users** with Administrator or SuperUser. The connector itself
     needs only Supporter unless someone uses the audit log.
   - Users at the root customer who are not on the current staff list the
     reviewer gives you.
   - Users at an end customer whose email domain is not the MSP's or that
     customer's.
   - Shared or generic logins (`admin`, `backup`, `support`).
6. Report one row per user: customer, login, name, email, role, and the flag
   that applies. Users with no flag go in a count, not the table.

### Technician offboarding check

1. Run steps 1 to 4 above for the whole tree.
2. Find every account that matches the leaver's name or email, at every
   customer level. MSP staff often have logins at several end customers.
3. If the audit log is available, call `cove_audit_actions_list` for the
   last 30 days with `user_id` set to each matching account, to see what
   they did before leaving.
4. List the accounts to remove. Removal happens in the console.

### Who changed or deleted something (admin-gated)

`cove_audit_actions_list` needs `from` and `to` as Unix seconds. Narrow it:

| Argument | Use |
|----------|-----|
| `partner_id` | Actions performed in this customer |
| `entity_partner_id` | Actions on things owned by this customer |
| `include_all_sub_partners` | Include every sub-customer |
| `user_id` | Actions by one console user |
| `entity` | e.g. `Account` (device), `AccountProfile`, `Partner`, `User`, `Product` |
| `operation` | e.g. `Remove`, `Delete`, `Modify`, `Add`, `PasswordReset` |
| `result` | `Succeeded` or `Restricted` |
| `count_limit` | 1 to 1000, default 100 |
| `reverse_order` | `true` for newest first |

Common questions:

- **Who removed a device?** `entity: "Account"`, `operation: "Remove"`, over
  the window the device disappeared in.
- **Who changed retention or a profile?** `entity: "AccountProfile"` or
  `entity: "Product"`, `operation: "Modify"`.
- **Failed attempts?** `result: "Restricted"` shows actions Cove refused.

If the result reaches `count_limit`, there may be more. Split the window in
half and query each part instead of reporting a partial list as complete.

## Gotchas

- Error 13501 on `cove_audit_actions_list` means the API user's Cove role is
  below Administrator. A Conduit permission denial is a different message and
  means the Conduit member is below the admin tier. Tell the user which one
  happened.
- Cove adds a suffix to API user login names, so they look different from
  the name typed when they were created.
- Passwords are never returned; password fields come back redacted.
- `cove_user_roles_list` takes an optional `partner_id`; whether Cove uses it
  is unconfirmed, so do not rely on it to show per-customer roles.
