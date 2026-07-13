---
description: Run the complete M365 offboarding workflow for a departing user - revoke access, handle mailbox, transfer data
argument-hint: "<user> [mailbox-action] [transfer-to] [dry-run]"
arguments: [user, mailbox-action, transfer-to, dry-run]
---

# Offboard M365 User

Execute a structured, safe Microsoft 365 offboarding workflow for a departing employee. Each step is performed in order with confirmation where needed.

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
