---
name: "1Password Sign-in Triage"
description: >
  Triage of 1Password sign-in attempts for one client account: pulling the
  sign-in feed over a window, grouping failures by user, category and country,
  separating password-guessing from MFA failures and firewall blocks, spotting
  successes from new countries after a run of failures, and deciding what is
  noise and what goes to the client. The sign-in feed is admin-gated in
  Conduit and read-only.
when_to_use: >-
  When an MSP needs to investigate failed or suspicious sign-ins to a client's 1Password
  account, or wants a periodic sign-in health check. Use when: 1password failed sign-in,
  1password brute force, 1password mfa failure, 1password suspicious login, 1password sign-in
  report, or password manager login alerts.
---

# 1Password Sign-in Triage

## Overview

A 1Password account is a high-value target: one compromised member can expose every shared
vault they can open. The sign-in attempts feed records every attempt with its outcome, so an
MSP can spot password guessing, MFA fatigue, and sign-ins from places the client does not
operate. This skill reads that feed and produces a triage list. It cannot lock accounts or
change policy; those are console actions.

## Tools used

| Tool | Purpose | Conduit tier |
|---|---|---|
| `1password_events_introspect` | Confirm the account and that the token has `signinattempts` | read |
| `1password_signin_attempts_list` | The sign-in feed | admin |
| `1password_users_list` | Resolve targets to users and their state | read |
| `1password_audit_events_list` | Optional: what a suspicious session did next | admin |

The sign-in feed is admin-gated in Conduit. Without the admin tier, stop and say so.

## Key fields

Each attempt carries a `category` (the outcome), a more specific `type`, the target user,
the client app and the location (including country). 1Password documents categories such as
`success`, `credentials_failed`, `mfa_failed`, `sso_failed`, `firewall_failed` and
`modern_version_failed`. Group on the values the feed actually returns rather than assuming
this list is complete.

| Pattern | Likely meaning |
|---|---|
| Many `credentials_failed` on one user, few countries | Forgotten password, or guessing from one source |
| `credentials_failed` across many users from one country | Password spraying |
| `mfa_failed` on a user who also has `success` on credentials | The password is known to someone; the second factor stopped them |
| `firewall_failed` | The client's 1Password firewall rules blocked the attempt; the control worked |
| `modern_version_failed` | An outdated 1Password app; a support issue, not a security one |
| `success` from a country with no prior activity | Travel, VPN, or compromise; needs confirmation |

## Workflow

1. **Introspect.** Call `1password_events_introspect`; confirm the account and that
   `signinattempts` is among the features.
2. **Pull the window.** Call `1password_signin_attempts_list` with `start_time` (default:
   7 days ago for a routine check, 24 hours for an active alert) and `limit` 200. Page with
   `cursor` while `has_more` is true.
3. **Group.** Count by category, then by target user and country within each failure
   category.
4. **Baseline countries.** From the `success` attempts in the window, list each user's usual
   countries. A success outside that set is a finding; a failure outside it is context.
5. **Correlate.** For a user with `mfa_failed`, or failures followed by a success from a new
   country, pull `1password_audit_events_list` for the same period and look for actions by
   that user after the success (invites, vault sharing, group changes).
6. **Resolve users.** Check flagged users against `1password_users_list` to see whether they
   are `ACTIVE` or `SUSPENDED`. Attempts against a suspended user are someone trying an old
   account.
7. **Report.**

## Report format

- **Verdict**: quiet, noisy-but-benign, or needs client contact.
- **Needs client contact**: successes from unexpected countries, `mfa_failed` on a known
  password, spraying across users. Give user, times (in the client's time zone), country,
  client app and count.
- **Benign noise**: forgotten passwords, outdated apps, firewall blocks working as intended.
- **Console actions** (manual): ask the user to change their account password, review their
  trusted devices, sign out sessions, tighten firewall rules or MFA policy.
- **Coverage**: window, events read, and whether paging was cut short.

## Gotchas

- **One hour by default.** Without `start_time` the feed covers only the last hour.
- **No user filter.** The feed returns all users; filter locally and keep windows short on
  large accounts.
- **Policy is not readable.** No tool returns whether MFA is enforced. Do not infer the
  policy from the feed; recommend the client confirm it in the console.
- **Times are UTC.** Convert before comparing with the client's working hours.
