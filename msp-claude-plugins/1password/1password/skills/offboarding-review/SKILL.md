---
name: "1Password Offboarding Review"
description: >
  How to review a departing or departed user's 1Password footprint with the
  read-only tools: confirm the seat is suspended, find every shared-vault item
  they used so the client can rotate it, catch sign-ins or item access after the
  departure date, and see who suspended them and when. Covers matching users
  across the Events and Users APIs, choosing the time window, and the manual
  console steps the report must hand back, since nothing here can suspend or
  revoke.
when_to_use: >-
  When an employee at a client is leaving or has left and the MSP needs to know what they could
  reach in 1Password and what must be rotated. Use when: 1password offboarding, departed user
  1password, terminated employee password manager, which passwords to rotate, ex-employee vault
  access, or leaver review 1password.
---

# 1Password Offboarding Review

## Overview

When someone leaves a client, the MSP has to answer three questions: is their 1Password
seat closed, did they touch anything after they left, and which shared credentials did they
use that should now be rotated. The Events API answers the last two; the Users API answers
the first. This plugin is read-only, so the output is a findings report plus a list of
console actions for a technician or the client's 1Password owner.

## Tools used

| Tool | Purpose | Conduit tier |
|---|---|---|
| `1password_users_list` | Find the user and their state | read |
| `1password_users_get` | Re-check one user's state | read |
| `1password_item_usages_list` | Shared-vault items they used | admin |
| `1password_signin_attempts_list` | Sign-ins around and after departure | admin |
| `1password_audit_events_list` | Who suspended them; changes they made before leaving | admin |
| `1password_events_introspect` | Confirm the account and which feeds the token can read | read |

The three Events feeds are admin-gated in Conduit. Without the admin tier the review is
limited to seat state; say so in the report.

## Inputs to collect

- The user's email address at the client.
- The departure date and time (with time zone). If only a date is known, use the start of
  that day in the client's time zone.
- How far back to look for item usage. Default: 30 days before departure. Events are kept
  for 120 days, so a departure older than that cannot be reviewed for activity.

## Workflow

1. **Confirm the account.** Call `1password_events_introspect`. Check the `account_uuid` is
   the client you expect and note which of `auditevents`, `itemusages` and `signinattempts`
   the token has. Skip the steps for missing features and record them as gaps.
2. **Find the user.** Page `1password_users_list` (no filter) until you find the email.
   Record the user ID, `state` and `create_time`. If the email is not there, the user may
   have been deleted rather than suspended; note it and continue with the Events feeds,
   matching on email.
3. **Seat state.** `ACTIVE` after the departure date is the first finding: the account is
   still open. `SUSPENDED` is expected.
4. **Post-departure sign-ins.** Page `1password_signin_attempts_list` with `start_time` at
   the departure time. Keep attempts whose target user matches the email. A successful
   sign-in after departure is a critical finding; failed attempts are worth listing (someone
   is still trying the account).
5. **Item usage.** Page `1password_item_usages_list` from the look-back start to now. Keep
   events whose user matches. Build the distinct set of vault UUID + item UUID pairs, with
   the last time and the actions seen for each. Any usage after the departure time is a
   critical finding.
6. **Audit trail.** Page `1password_audit_events_list` over the same window. Keep events
   where the user is the actor (changes they made: group membership, vault sharing, invites)
   or the object (who suspended or removed them, and when).
7. **Report** (format below).

The Events feeds have no user filter. Every step pages the whole window and filters
locally, so keep windows tight on large accounts and state the page budget if you stop
early.

## Matching users across the APIs

Match on email. The Users API returns `email`; the Events feeds carry the user's email
alongside a UUID. UUIDs usually line up with the Users API ID, but email is the field both
APIs show reliably. Watch for aliases and renamed addresses: if the client renamed the
user's email at departure, ask for the old address too.

## Report format

1. **Summary line**: seat state, last successful sign-in, last item usage, and whether any
   activity happened after departure.
2. **Critical findings**: post-departure sign-ins or item usage, an `ACTIVE` seat.
3. **Credentials to rotate**: table of vault UUID, item UUID, last used, actions. These are
   the shared items the user handled in the window. The technician maps UUIDs to names in
   the 1Password console.
4. **Changes they made before leaving**: audit events with the user as actor.
5. **Coverage gaps**: feeds the token lacks, the Conduit admin tier missing, a window that
   reaches past 120 days, or a page budget that cut the review short.
6. **Console actions** (manual, outside this plugin): suspend or delete the user, remove
   them from groups, move any private vault they shared, rotate the listed items, recover
   the account if needed.

## Gotchas

- **Private vault use is not in the feed.** Item usage covers shared vaults. Personal or
  private vault activity does not appear, so "no item usage" does not mean "used nothing".
- **Suspended is not deleted.** A suspended user keeps their account and private vault.
  Flag long-suspended users so the client can decide whether to delete them.
- **No names for items.** Do not guess item names from UUIDs.
- **This plugin cannot suspend.** Never tell the user the seat was closed; hand back the
  console action.
