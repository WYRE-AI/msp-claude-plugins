---
name: "1Password Account Hygiene"
description: >
  Periodic hygiene review of a client's 1Password account for QBRs and license
  true-ups: reconciling active and suspended seats against the client's
  headcount, finding long-suspended and never-used seats, and summarising the
  admin changes made during the review period (who was invited, who gained or
  lost group and vault access, who changed account settings). Seat inventory
  uses read-tier tools; the change summary uses the admin-gated audit feed.
when_to_use: >-
  When an MSP prepares a quarterly or monthly review of a client's 1Password account, checks
  seat counts before a renewal, or wants to know what admins changed. Use when: 1password seat
  audit, 1password license count, 1password qbr, 1password admin changes, who changed 1password,
  or password manager user review.
---

# 1Password Account Hygiene

## Overview

Two things drift in a client's 1Password account between reviews: the user list (people
leave, are suspended and never removed, or were invited and never signed in) and access
(groups and vaults gain members). This skill produces a seat reconciliation and a change log
for the period. It reads only; every fix is a console action.

## Tools used

| Tool | Purpose | Conduit tier |
|---|---|---|
| `1password_users_list` | Full seat inventory with state and create time | read |
| `1password_users_get` | Detail on one user | read |
| `1password_events_introspect` | Confirm the account and available feeds | read |
| `1password_audit_events_list` | Admin and membership changes over the period | admin |
| `1password_signin_attempts_list` | Optional: last successful sign-in per user, within 120 days | admin |

With only the read tier, deliver the seat reconciliation and say the change log needs the
Conduit admin tier.

## Workflow

### 1. Seat inventory

Page `1password_users_list` with `max_page_size` 500 until `next_page_token` is absent.
Count `ACTIVE` and `SUSPENDED`. Keep email, display name, state and `create_time` per user.

### 2. Reconcile against headcount

Ask for, or pull from another connected system, the client's current staff list (for
example the M365 licensed users or the PSA contact list). Then classify:

| Finding | Meaning | Suggested action |
|---|---|---|
| `ACTIVE`, not on the staff list | Possible leaver with an open account | Run the offboarding review |
| `SUSPENDED` for a long time | Account kept but unused | Client decides whether to delete |
| On the staff list, no 1Password user | Not onboarded, or using a personal vault | Confirm with the client |
| Shared or generic mailbox as a user | Shared login, weak accountability | Recommend named users |

### 3. Activity check (optional, admin tier)

Page `1password_signin_attempts_list` from 90 days ago, keep `success` attempts, and record
each user's latest. `ACTIVE` users with no successful sign-in in 90 days are candidates for
review. The feed only reaches back 120 days, so "never" means "not in 120 days".

### 4. Change log (admin tier)

Page `1password_audit_events_list` from the start of the review period. Group events by
action and object type, and list who did what. Pay attention to:

- invitations and new users;
- users added to or removed from groups, especially administrative groups;
- vault access granted or removed;
- account-level setting and policy changes;
- suspensions, reactivations and deletions.

Use the action and object-type values the feed returns; do not rename them into categories
the data does not support. List the actor for each change so the client can confirm it was
expected.

### 5. Report

1. **Seats**: active, suspended, total; change since the last review if known.
2. **Reconciliation table**: users in each finding category above.
3. **Inactive accounts**: `ACTIVE` with no recent successful sign-in.
4. **Change log**: grouped by type, with actor and time.
5. **Console actions** (manual): delete or suspend, remove from groups, review admin
   membership, confirm settings changes.
6. **Gaps**: missing feeds, missing admin tier, period longer than 120 days.

## Gotchas

- **Seats are not billing.** The Users API reports users and state, not the client's
  subscription size or invoice. Compare with the 1Password billing page before a renewal.
- **Policies are not readable.** No tool returns current MFA, password or firewall policy.
  Only changes made inside the window show up, as audit events.
- **Retention.** A quarterly review fits inside 120 days; anything longer does not.
- **Large accounts.** Audit feeds on big accounts run to many pages. Keep `limit` at a few
  hundred and state the page budget if you stop.
