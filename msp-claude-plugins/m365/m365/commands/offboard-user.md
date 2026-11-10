---
description: Run the complete M365 offboarding workflow for a departing user - revoke access, handle mailbox, transfer data
argument-hint: "<user> [mailbox-action] [transfer-to] [dry-run]"
arguments: [user, mailbox-action, transfer-to, dry-run]
---

# Offboard M365 User

Execute a structured, safe Microsoft 365 offboarding workflow for a departing employee. Each step is performed in order with confirmation where needed.

## Conduit tools

The Conduit `m365` connector has no user, licence or MFA tools, so this command runs on the `cipp` and `microsoft-graph` connectors. The Graph requests further down show what each step reads; through Conduit, send a read as `microsoft_graph_get` with that path as `relativeUrl` (call `microsoft_graph_suggest_queries` first if unsure of the query), and perform writes through the CIPP tool named for that step.

The whole workflow is one CIPP job: `cipp_offboard_user` (`tenantFilter`, `userId`) with the step flags turned on. Conduit classifies `cipp_offboard_user` as an admin-tier write, so the caller needs admin access to the `cipp` connector. It is irreversible and queued, so run it once, after the operator confirms the exact flag set. Queuing is not completion: check the job's outcome in CIPP (`cipp_list_logs`, admin tier) and report the offboarding as done only once the job has succeeded. Report a pending or failed job as not complete.

| Step | `cipp_offboard_user` flag |
|------|-----------------------------|
| Revoke sessions | `RevokeSessions` |
| Reset password | `ResetPass` |
| Disable sign-in | `DisableSignIn` |
| Out-of-office | `OOO` (message text) |
| Convert to shared mailbox | `ConvertToShared` |
| Forward mail | `forward` (UPN), `KeepCopy` |
| Mailbox access for the manager | `AccessAutomap` / `AccessNoAutomap` |
| OneDrive access | `OnedriveAccess` |
| Remove from **all** groups and Teams | `RemoveGroups` (all memberships, including Teams the user solely owns; leave it off and remove memberships by hand if an ownership transfer is pending) |
| Free licences | `RemoveLicenses` |
| Remove MFA methods and mobile devices | `RemoveMFADevices`, `RemoveMobile` |

Use `cipp_list_users` to resolve the user first, and `cipp_list_mailbox_permissions` or `cipp_list_user_groups` to show the dry-run picture before the job is queued.

## Arguments

- `user` (required) — UPN or display name of the user being offboarded
- `mailbox-action` (optional) — What to do with the mailbox - "shared" (convert to shared), "forward" (auto-forward to manager), "archive" (export and close), or "ask" (default)
- `transfer-to` (optional) — UPN of person receiving OneDrive access and/or mail forwarding (defaults to user's manager)
- `dry-run` (optional) — Show what would happen without executing (true/false)

## Prerequisites

- `Directory.ReadWrite.All` — revoke sessions, disable account
- `User.ReadWrite.All` — update account properties
- `MailboxSettings.ReadWrite` — configure auto-reply and forwarding
- `Sites.ReadWrite.All` — OneDrive ownership transfer

## Workflow Steps

### Phase 1: Immediate Security (Do First)

1. **Resolve user and confirm**
   ```
   Found: Jane Smith (jsmith@contoso.com)
   Manager: Bob Manager (bmanager@contoso.com)
   Confirm offboarding Jane Smith? [y/n]
   ```

2. **Revoke all active sessions**
   ```http
   POST /v1.0/users/{id}/revokeSignInSessions
   ```
   This immediately terminates all active browser sessions, Teams, mobile apps.

3. **Reset password** (prevents re-authentication even if session cookie reused)

4. **Disable account**
   ```http
   PATCH /v1.0/users/{id}
   { "accountEnabled": false }
   ```

### Phase 2: Mailbox Handling

5. **Set out-of-office reply**
   ```http
   PATCH /v1.0/users/{id}/mailboxSettings
   {
     "automaticRepliesSetting": {
       "status": "alwaysEnabled",
       "internalReplyMessage": "Jane Smith has left the company. Please contact their manager Bob Manager at bmanager@contoso.com.",
       "externalReplyMessage": "Jane Smith is no longer with Contoso. For assistance, please contact support@contoso.com."
     }
   }
   ```

6. **Handle mailbox** (per `--mailbox-action`):
   - `shared`: Convert to shared mailbox, grant manager full access
   - `forward`: Configure mail forwarding to manager/transfer-to
   - `archive`: Note for admin to export via Compliance Center

### Phase 3: Data and Access

7. **Check for Teams ownership** — list teams where user is sole owner
   ```http
   GET /v1.0/users/{id}/joinedTeams
   ```
   For each: check members, warn if sole owner.

8. **Remove from Teams** (after transferring ownership where needed)
   ```http
   DELETE /v1.0/teams/{teamId}/members/{memberId}
   ```

9. **OneDrive ownership transfer**
   - Grant manager access to OneDrive: `POST /v1.0/drives/{driveId}/root/invite`
   - Note: Full transfer requires SharePoint admin actions

10. **Remove licenses** (frees seats, retains data for 30 days)
    ```http
    POST /v1.0/users/{id}/assignLicense
    { "addLicenses": [], "removeLicenses": ["<all-sku-guids>"] }
    ```

## Output

```
Offboarding: Jane Smith (jsmith@contoso.com)
Transfer to: Bob Manager (bmanager@contoso.com)

Phase 1: Security
  ✅ Sessions revoked (3 active sessions terminated)
  ✅ Account disabled
  ✅ Password reset

Phase 2: Mailbox
  ✅ Out-of-office set (internal + external)
  ✅ Mailbox converted to shared
  ✅ bmanager@contoso.com granted Full Access

Phase 3: Data & Access
  ⚠️  Teams: Jane is sole owner of "2024 Project Alpha" — reassign owner
       → Suggested owner: Bob Manager
  ✅ Removed from 4 other teams
  ✅ OneDrive access granted to Bob Manager
  ✅ Licenses removed: M365 Business Premium (1 seat freed)

PENDING (manual actions required):
  - Assign new Teams owner for "2024 Project Alpha"
  - Review and archive OneDrive data within 30 days
  - Open PSA ticket to document offboarding completion

Offboarding complete: 4 automated | 3 require manual follow-up
```

## Dry Run Output

```
/offboard-user jsmith@contoso.com --dry-run true

DRY RUN — No changes will be made

Would execute:
  1. POST /users/{id}/revokeSignInSessions
  2. PATCH /users/{id} { accountEnabled: false }
  3. PATCH /users/{id}/mailboxSettings { auto-reply }
  4. Convert mailbox to shared
  5. Grant bmanager@contoso.com mailbox access
  6. Remove from 5 Teams
  7. Grant OneDrive access to manager
  8. Remove M365 Business Premium license

Manual steps required:
  - "2024 Project Alpha" needs new Team owner
  - OneDrive archival decision
```

## Error Handling

### User Not Found
```
User not found: "Jane"

Did you mean:
- Jane Smith (jsmith@contoso.com) — Active
- Jane Adams (jadams@contoso.com) — Active
```

### No Manager Set
```
⚠️  No manager configured for this user.
Who should receive OneDrive access and mailbox forwarding?
Enter UPN or name:
```

## Related Commands

- `/get-user` — View current state before starting
- `/check-mfa-status` — Post-offboarding audit
- `/list-licenses` — Verify license was freed
