---
name: "LastPass Security Posture"
description: >
  Per-client LastPass account hygiene from user records: MFA coverage
  (`advancedMfaStatus`, `enabledMfa`), weak Security Challenge and
  master-password scores, stale master passwords, dormant enrolled
  accounts, invitations that never converted, and how to roll those into
  a client-facing posture summary. Covers what the API cannot show
  (policies, shared folders, events) so the summary does not overclaim.
when_to_use: >-
  When reviewing how well a client (or the MSP itself) is using
  LastPass: MFA adoption, weak or reused master passwords, low security
  scores, dormant accounts, or unenrolled staff, for a QBR, security
  review or compliance evidence. Use when: lastpass mfa, lastpass
  security score, weak master password, lastpass adoption, lastpass
  posture, lastpass compliance, who has not enrolled in lastpass, or
  lastpass qbr.
---

# LastPass Security Posture

## Overview

LastPass rates each user with a **Security Challenge score**
(`securityChallengeScore`, the vault hygiene score: weak, reused and old
passwords) and a **master password score** (`masterPasswordScore`), and
records their MFA state, last login and last master password change.
Those per-user fields are what this skill turns into a posture review.

Every tool here is tier **read** in Conduit; none is admin-gated.

**Scope limits.** The LastPass REST API does not expose company
policies (for example "require MFA"), shared folders, or event logs. A
posture summary from this connector describes what users have done, not
what policy enforces. Say that in the report.

## Key Fields

| Field | Use |
|-------|-----|
| `accountStatus` | Only `enrolled` users count toward coverage |
| `advancedMfaStatus`, `enabledMfa` | MFA state and which authenticator |
| `federatedStatus` | Federated users authenticate through the IdP; judge their MFA there |
| `securityChallengeScore` | 0 to 100; low means weak, reused or old vault passwords |
| `masterPasswordScore` | 0 to 100; low means a weak master password |
| `lastMasterPasswordChangeTime` | Age of the master password |
| `lastLoginTime` | Dormant accounts |
| `creationTime`, `lastInvitationTime` | Unconverted invites |

## Common Workflows

### One client

1. Resolve the client's `child_company_id` with
   `lastpass_managed_companies_list` (MSP key). For a Business key, use
   the own-company tools throughout.
2. Pull every enrolled user: `lastpass_managed_company_users_list` (or
   `lastpass_users_list`) with `account_status: "enrolled"` and
   `max_results: 500`, paging with `page_token` until `nextPageToken` is
   gone. You need the full set for honest percentages.
3. Pull the weak tail directly with the range filter, e.g.
   `security_challenge_score: "[:50]"`, to cross-check your counts.
4. Pull unconverted invites: `lastpass_managed_company_invites_list` (or
   `lastpass_invites_list`), plus users with `account_status` of
   `pending-invitation` and `expired-invitation`.
5. Compute the findings below and write the summary.

### Across the client book

Use `lastpass_managed_companies_list` with `status: ["active"]`, then
run the single-client workflow per company. Pace the calls: some
LastPass rate limits are shared by every key in the company, and a 429
tells you how long to wait. For a large book, hand this to the
`posture-sweep` agent.

## Findings and Default Thresholds

Report the threshold you used next to every count. These are starting
points; the MSP should adjust them.

| Finding | Default rule | Severity |
|---------|--------------|----------|
| Enrolled user without MFA | `advancedMfaStatus` not enabled and not federated | High |
| Admin without MFA | Above, and `adminLevelId` set | Critical |
| Weak master password | `masterPasswordScore` below 50 | High |
| Poor vault hygiene | `securityChallengeScore` below 50 | Medium |
| Stale master password | `lastMasterPasswordChangeTime` older than 365 days | Low |
| Dormant account | Enrolled, `lastLoginTime` older than 90 days | Medium (likely a missed leaver) |
| Never enrolled | Invite or `pending-invitation` older than 14 days | Low (adoption gap) |
| Expired invite | `expired-invitation` | Low (re-invite or close out) |

## Output

Per client:

- Enrolled users, and the share with MFA (excluding federated users from
  the denominator if their MFA lives at the IdP; say which you did).
- Median and lowest `securityChallengeScore` and `masterPasswordScore`.
- Counts per finding, then a named list of the High and Critical
  findings.
- Adoption: invited but not enrolled.
- A line stating that policies, shared folders and events are not
  visible through this connector.

Keep names and scores inside the client's own report. Across the book,
report counts and percentages per client, not names.

## Gotchas

- **Never report a percentage from one page.** The default page size is
  10.
- **Missing statuses.** Awaiting approval users never appear, and some
  Staged and Pending invitation users are omitted, so adoption figures
  are a floor. Say so.
- **`advancedMfaStatus` values** are reported as LastPass sends them.
  Treat anything other than an enabled state as "no MFA" and quote the
  raw value in the detail list rather than guessing.
- **Dormancy comes first.** A dormant enrolled account is an access
  problem before it is a hygiene problem. List it under dormant
  accounts, and do not let its score drag the client's median without
  saying so.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - pagination, filters, errors
- [privileged-access](../privileged-access/SKILL.md) - admin-level review
- [offboarding-review](../offboarding-review/SKILL.md) - for dormant accounts that turn out to be leavers
