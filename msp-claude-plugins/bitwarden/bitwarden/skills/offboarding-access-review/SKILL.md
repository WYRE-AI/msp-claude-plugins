---
name: "Bitwarden Offboarding Access Review"
description: >
  Mapping everything a departing user could reach in a client's Bitwarden
  organization: their membership, role and status, collections granted
  directly and through groups, their recent vault activity from the
  admin-gated event log, and the follow-up list (revoke in the Admin
  Console, rotate exposed shared credentials, rotate the organization API
  key if they were an owner). Read-only: the plugin reports, people act.
when_to_use: >-
  When an employee or contractor leaves a client, changes role, or is
  suspected of misuse, and you need to know what shared credentials they
  could see. Use when: bitwarden offboarding, departing user bitwarden,
  what could this user access, which passwords need rotating, leaver access
  review, revoke bitwarden access, or bitwarden user audit.
---

# Bitwarden Offboarding Access Review

## Overview

When someone leaves, the MSP has to answer two questions: is their
Bitwarden access gone, and which shared credentials did they hold that now
need rotating? This skill answers both from the read-only Public API and
hands back a checklist. It cannot revoke or remove anyone; an owner or admin
does that in the Admin Console (Members > the member > Revoke access or
Remove).

Tool tiers in Conduit:

- Read: `bitwarden_members_list`, `bitwarden_members_get`,
  `bitwarden_members_list_group_ids`, `bitwarden_groups_get`,
  `bitwarden_collections_list`, `bitwarden_collections_get`.
- **Admin-gated:** `bitwarden_events_list`. Step 5 needs it. Without the
  admin grant, the review still produces the access map but cannot say what
  the user actually opened or copied; state that gap in the report.

## Anti-triggers

- **Organization-wide 2FA or policy review** — use
  [security-posture](../security-posture/SKILL.md).
- **Investigating events with no specific user in mind** — use
  [event-log-review](../event-log-review/SKILL.md).

## Key Concepts

- **Two IDs per person.** The member `id` is the organization membership and
  drives `bitwarden_members_get` and `bitwarden_members_list_group_ids`. The
  `userId` is the Bitwarden account and is what `actingUserId` takes in
  `bitwarden_events_list`. Invited members have no `userId` yet.
- **Access is the union of direct and group grants.** A member's own
  `collections` array lists direct grants. Each group they belong to adds
  that group's collections. Each grant carries `readOnly`, `hidePasswords`
  and `manage` flags; `hidePasswords: true` means the member could fill but
  not view the password.
- **Collections are identified by ID.** Collection names are end-to-end
  encrypted in Bitwarden. If the response carries no readable name, report
  the collection ID and `externalId` and let a person match them in the
  Admin Console.
- **Vault item contents are never visible.** Events give an `itemId`, not
  the item's name or secret.
- **externalId means directory sync.** A member with an `externalId` is
  usually provisioned from the client's directory (Directory Connector or
  SCIM). Remove them there too, or the sync may restore them.

## Common Workflows

### Leaver review

1. **Find the member.** Call `bitwarden_members_list` and match the email
   case-insensitively. If the list is `truncated`, and the person is not in
   the returned part, say so rather than concluding they are absent. Record
   `id`, `userId`, `type` (role), `status`, `twoFactorEnabled` and
   `externalId`.
2. **Direct grants.** Call `bitwarden_members_get` with the member `id`.
   Note each collection with its `readOnly`, `hidePasswords` and `manage`
   flags.
3. **Group grants.** Call `bitwarden_members_list_group_ids`, then
   `bitwarden_groups_get` for each group to read its name and collections.
4. **Name the collections.** Use `bitwarden_collections_list` (or
   `bitwarden_collections_get` per ID) to attach whatever identifying
   metadata the API returns, and to see which other groups share each
   collection.
5. **Recent activity (admin-gated).** Call `bitwarden_events_list` with
   `actingUserId` set to the `userId` and a window that covers at least the
   last 90 days (`start`/`end`, under 367 days). Page with
   `continuationToken` until it is `null`. Pull out item views, password
   copies, vault exports and failed logins; see the event table in
   [event-log-review](../event-log-review/SKILL.md).
6. **Write the checklist** (below).

### The checklist to hand back

1. **Revoke or remove** the member in the Admin Console. Revoking keeps the
   record and its history; removing deletes the membership.
2. **If `externalId` is set**, remove the person from the synced directory
   group as well.
3. **If they were an Owner** (`type` 0): they could view the organization
   API key. An owner rotates it (Settings > Organization info > View API
   key > Rotate), then re-submits the Conduit Bitwarden connect form with
   the new client_secret. Until then this plugin keeps working on the old
   key, which the leaver may have copied.
4. **Rotate shared credentials**, in this order:
   - items the events show they viewed or copied (by `itemId`);
   - collections they could manage or view passwords in
     (`hidePasswords: false`);
   - collections they could only fill from (`hidePasswords: true`); still
     worth rotating for high-value systems, since autofill reveals the
     value to a determined user.
5. **Vault export events** (their own or the organization's) mean everything
   they could see may have left the building; escalate to the client.
6. **Personal vault.** If OrganizationDataOwnership (policy type 5) is off,
   they may have saved company credentials in their personal vault, which
   no API can see. Note it as a residual risk.

## Gotchas

- **Revoked is not removed.** A `status` of -1 means no access but the
  member is still listed. That is a valid end state for an offboarding;
  just do not report the member as "still active".
- **Group membership changes over time.** The access map shows grants now,
  not what they had last month. If the account was already partly cleaned
  up, the events (step 5) are the only record of earlier access.
- **Events need the admin tier.** If `bitwarden_events_list` is denied, do
  not imply the user touched nothing; say the activity check was not run.
- **Events are personal data.** IPs and device details belong in the
  ticket, not in a client-wide email.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - IDs, truncation, errors
- [event-log-review](../event-log-review/SKILL.md) - event type reference and paging
- [security-posture](../security-posture/SKILL.md) - organization-wide follow-up
