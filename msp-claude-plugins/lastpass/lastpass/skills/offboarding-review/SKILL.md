---
name: "LastPass Offboarding Review"
description: >
  Leaver access review in LastPass: finding a departing user in the
  MSP's own company or a client company, reading their account status,
  admin level and group memberships, catching a pending invite that was
  never revoked, and producing the checklist of actions a LastPass admin
  must take in the Admin Console, because this connector cannot disable
  or remove anyone.
when_to_use: >-
  When someone is leaving a client (or the MSP) and you need to know
  what LastPass access they still hold, or to confirm an offboarding was
  finished. Use when: lastpass offboarding, leaver lastpass, remove user
  from lastpass, is this user still in lastpass, terminated employee
  password manager, disable lastpass account, or offboarding checklist
  lastpass.
---

# LastPass Offboarding Review

## Overview

A password manager is one of the last places an ex-employee's access
lingers: an enrolled account keeps working after the Microsoft 365
account is gone if the user logs in with a master password, and an admin
level or group membership can carry shared-folder access with it. This
skill answers "what does this person still have in LastPass?" and hands
back a checklist.

**This connector is read-only.** Disabling, deleting or transferring a
user, revoking an invite and removing an admin level all happen in the
LastPass Admin Console. Every tool used here is tier **read** in Conduit;
none is admin-gated.

## Common Workflows

### Check one leaver

1. **Pick the company.** If the leaver belongs to a client, find the
   client with `lastpass_managed_companies_list` (`name: "%client%"`) and
   keep its `id` as `child_company_id`. If they belong to the key's own
   company (a Business key, or the MSP's own staff), use the
   own-company tools instead.
2. **Find the user.** Search by email first, which is unique:
   `lastpass_managed_company_users_list` (or `lastpass_users_list`) with
   `email: "jane.doe@client.com"`. If nothing comes back, try a
   wildcard on the local part (`%jane%`) and on `name`, because people
   are often enrolled under an alias or an old domain.
3. **Check invites.** Run `lastpass_managed_company_invites_list` (or
   `lastpass_invites_list`) with the same email. The users list omits
   some Pending invitation and Staged users, so a leaver can be missing
   from it and still have an outstanding invite that would let them
   enrol after they leave.
4. **Read the record.** `lastpass_managed_company_user_get` (or
   `lastpass_user_get`) gives `accountStatus`, `lastLoginTime`,
   `adminLevelId`, `enabledMfa` and `federatedStatus`.
5. **Check privilege.** If `adminLevelId` is set, resolve it with
   `lastpass_managed_company_admin_level_get` (or
   `lastpass_admin_level_get`) and record the level's name and
   permissions. An admin leaver is the highest-priority case.
6. **Check groups.** There is no "groups for this user" call. List the
   groups (`lastpass_managed_company_user_groups_list` or
   `lastpass_user_groups_list`), then page each group's members
   (`lastpass_managed_company_user_group_users_list` or
   `lastpass_user_group_users_list`) and look for the user's `id` or
   email. Groups usually carry shared-folder access, so list every
   group they are in.

### Confirm an offboarding was finished

Run the same lookups. The offboarding is complete when the user is
`disabled` or no longer listed, has no admin level, is in no groups, and
has no pending invite. Anything else goes back on the ticket.

## Decision Table

| What you find | Meaning | Action for the LastPass admin |
|---------------|---------|-------------------------------|
| `accountStatus: enrolled` | Can still log in | Disable or delete the user in the Admin Console; decide on vault transfer first |
| `disabled` | Cannot log in | Delete when the retention period ends |
| `pending-invitation` / outstanding invite | Could still enrol | Revoke the invite |
| `adminLevelId` set | Holds admin rights | Remove the admin level now, before anything else |
| Member of groups | Likely shared-folder access | Remove from each group; review shared folders in the Admin Console |
| `federatedStatus` other than `not-federated` | Login tied to the identity provider | Disabling the IdP account blocks login, but still remove the LastPass account |
| `lastLoginTime` after the leave date | Account used after departure | Escalate as a possible security incident |

## Output

Report per leaver: company, user ID and email, current status, last
login, admin level (name or none), groups, pending invite (yes or no),
then a numbered checklist of Admin Console actions in the order above.
State that shared-folder membership and vault contents cannot be seen
through this connector, so the admin must check shared folders in the
Admin Console.

## Gotchas

- **Do not report "not found" from one page.** The default page is 10
  users. Use an email filter, or set `max_results` and page with
  `page_token` until `nextPageToken` is gone.
- **Awaiting approval users never appear** in any list. If the client
  uses approval workflows, ask the admin to check that queue.
- **A users list is not proof of removal.** A leaver absent from the
  list may still be Staged or have an invite; step 3 covers that.
- **Business key, client leaver**: the `lastpass_managed_company_*`
  tools return 403 with a Business key. Use the client's own key or an
  MSP key.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - pagination, filters, errors
- [privileged-access](../privileged-access/SKILL.md) - full admin-level review
