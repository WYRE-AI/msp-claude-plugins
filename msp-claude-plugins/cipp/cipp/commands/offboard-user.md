---
description: Run the complete CIPP M365 offboarding workflow for a departing user — capture audit state, revoke access, handle mailbox, reclaim licenses
argument-hint: "<user> [tenant] [posture] [mailbox-action] [forward-to] [dry-run]"
arguments: [user, tenant, posture, mailbox-action, forward-to, dry-run]
---

# Offboard CIPP User

Delegate to the **`user-offboarding-runner`** agent. The agent handles the full sequence: tenant + user resolution, audit-state capture, account lock, mailbox handling, license reclaim, and structured offboarding record output.

## Arguments

- `user` (required) — UPN or display name of the user being offboarded
- `tenant` (optional) — Tenant default domain or display name (skip if user is unique across all tenants)
- `posture` (optional) — standard, termination, or contractor — controls action ordering and defaults (defaults to standard)
- `mailbox-action` (optional) — shared, forward, archive, or hold — what to do with the mailbox (defaults to shared)
- `forward-to` (optional) — UPN to forward mail to (defaults to user's manager if set in M365)
- `dry-run` (optional) — Show every action that would be taken without executing (true/false)

## Posture defaults

| Posture | Action ordering | Mailbox default | Confirmation depth |
|---------|----------------|-----------------|-------------------|
| `standard` | Audit first → disable | Convert to shared | One confirmation before destructive sequence |
| `termination` | Disable + revoke + reset MFA first → audit second | Convert to shared | Single combined confirmation; speed-first |
| `contractor` | Audit first → disable | Archive (no shared conversion) | One confirmation; no forwarding by default |

## What the workflow does

1. Resolve tenant via `cipp_list_tenants` and user via `cipp_list_users`
2. Confirm the match with the requester
3. Capture audit state: `cipp_list_user_groups`, `cipp_list_user_devices`, `cipp_list_mailbox_permissions`
4. Run `cipp_offboard_user` with options derived from `posture` and `mailbox-action`
5. (If forwarding requested) verify `cipp_set_email_forwarding` was applied
6. (If OOO requested) set `cipp_set_out_of_office`
7. Produce a structured offboarding record for the ticket

## Manual steps the agent will flag

CIPP doesn't handle these — the agent surfaces them in the final record:

- OneDrive ownership transfer (Graph API or M365 admin center)
- SharePoint site permission cleanup
- Third-party SaaS deprovisioning (Slack, Notion, GitHub, etc.)
- Physical device retrieval coordination
- HR systems sync (BambooHR, Rippling, etc.)
