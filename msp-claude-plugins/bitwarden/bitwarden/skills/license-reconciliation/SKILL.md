---
name: "Bitwarden License Reconciliation"
description: >
  Reconciling a client's Bitwarden subscription against its real membership:
  Password Manager and Secrets Manager seats and autoscale limits from the
  subscription, member counts by status, invites that never completed,
  revoked members still listed, and the figures to check against the MSP's
  billing agreement. Read-only; seat changes happen in the Admin Console.
when_to_use: >-
  When checking whether a client is paying for the right number of Bitwarden
  seats, preparing a renewal or true-up, or explaining an autoscale charge.
  Use when: bitwarden seats, bitwarden license count, bitwarden billing,
  bitwarden subscription, autoscale seats, unused bitwarden seats, or
  bitwarden true-up.
---

# Bitwarden License Reconciliation

## Overview

MSPs resell or manage Bitwarden seats and bill clients for them. Drift
creeps in from both sides: invites that were never accepted, leavers who
were revoked but not removed, and autoscale quietly adding seats. This skill
compares `bitwarden_subscription_get` with `bitwarden_members_list` and
produces numbers the MSP can check against its own agreement or invoice.

Both tools are read tier in Conduit; no admin grant is needed. The plugin
cannot change seats or autoscale limits; an owner does that in the Admin
Console under Billing > Subscription.

## Key Concepts

`bitwarden_subscription_get` returns:

- **Password Manager**: purchased seats, the maximum autoscale seats, and
  storage.
- **Secrets Manager** (if the organization has it): seats and service
  accounts, with their own autoscale limits.

An autoscale limit that is empty or null means Bitwarden may keep adding
seats as members join. That is the usual source of a surprise invoice.

`bitwarden_members_list` gives each member's `status`: Revoked (-1),
Invited (0), Accepted (1), Confirmed (2), Staged (3). Which of these occupy
a paid seat is Bitwarden's rule, not this plugin's: the occupied-seat figure
on the Admin Console billing page is the authority. Report the counts by
status and let that page settle the arithmetic.

## Common Workflows

### Seat reconciliation for one client

1. Call `bitwarden_subscription_get`. Record Password Manager seats and the
   autoscale limit; record Secrets Manager seats and service accounts if
   present.
2. Call `bitwarden_members_list`. If the response is `truncated`, stop and
   report that the member count is partial; a seat reconciliation on a cut
   list is wrong by definition.
3. Count members by `status`.
4. Flag:
   - **Headroom**: purchased seats minus members. Large headroom is paid
     but unused.
   - **Autoscale exposure**: no autoscale limit, or a limit far above the
     purchased seats.
   - **Stale invites**: Invited and Accepted members. Each is either a
     person who never finished onboarding or a seat held for no one.
   - **Revoked members**: offboarded people still listed. Confirm with the
     client whether they should be removed.
5. Compare the purchased seats with the quantity on the MSP's billing
   agreement for this client (from the PSA or distributor plugin, if one is
   connected) and note any mismatch.

### Output

A small table: purchased seats, autoscale limit, members by status, and the
agreement quantity if known. Then a list of actions, each for a person:
remove these revoked members, chase or cancel these invites, set an
autoscale limit, adjust the agreement.

## Gotchas

- **Service accounts are Secrets Manager machine identities**, billed
  separately from people. Do not add them to the Password Manager seat
  comparison.
- **Seats change between calls.** A member who joins mid-review can make the
  numbers disagree by one. Re-run both calls together if the totals look
  off by a small amount.
- **Email is not a unique person.** A contractor with two addresses holds two
  seats; look for near-duplicate emails before declaring the count right.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - member status enum and truncation
- [offboarding-access-review](../offboarding-access-review/SKILL.md) - before removing a revoked member, check what they could reach
