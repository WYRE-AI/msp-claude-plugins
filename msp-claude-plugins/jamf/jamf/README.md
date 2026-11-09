# Jamf Pro Plugin

Claude Code plugin for [Jamf Pro](https://www.jamf.com/products/jamf-pro/), Apple device management for macOS, iOS, and iPadOS.

## Overview

This plugin gives Claude working knowledge of Jamf Pro so MSP technicians can review a client's Mac and iPhone/iPad fleet, find encryption and check-in gaps, track OS and third-party app patching, and onboard new users and devices. It talks to Jamf Pro through [Conduit](https://conduit.wyre.ai) and WYRE's Jamf Pro sidecar. You do not need a local SDK or proxy.

This plugin manages devices in a client's Jamf Pro tenant. Conduit also has a separate **Jamf Developer Docs** connector that searches Jamf's API documentation and never touches a tenant. This plugin does not use it.

> **Preview.** Conduit currently hides the Jamf Pro connector from the public catalog while the sidecar finishes security review. Until it is approved, it may not appear under **Connections** for your org.

## What This Plugin Does

- **Device compliance**: FileVault and recovery-key escrow on Macs, passcode and data protection on iOS, stale inventory and check-in, unmanaged devices
- **Patch posture**: available macOS/iOS versions, OS version spread, managed software update plans, and per-title third-party patch reports
- **User onboarding**: create Jamf user records, assign Macs and mobile devices, scope serials to a PreStage enrollment, add Macs to static groups
- **Device loss and offboarding**: admin-gated lock, wipe, unmanage, and record deletion, with operator-only Mac locking

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install jamf
```

The plugin connects through Conduit at `https://conduit.wyre.ai/v1/jamf/mcp`.

## Connecting Jamf Pro

Jamf Pro uses an **API client** with the OAuth 2.0 client-credentials grant. Conduit checks the client ID and secret against your Jamf Pro token endpoint when you save the connection. The sidecar exchanges them for short-lived bearer tokens on each request.

Create a dedicated API client for each Jamf Pro tenant in **Settings → System → API Roles and Clients**, and give it only the API Roles it needs. Generating a new client secret for that API client can invalidate the previous secret, so update the Conduit connection whenever you rotate it.

1. In Jamf Pro, open **Settings → System → API Roles and Clients**.
2. On **API Roles**, create a role with the privileges for the tiers you want (table below).
3. On **API Clients**, create a client, assign the role, set an access token lifetime, and **enable** it.
4. Click **Generate client secret** and copy the client ID and secret. Jamf shows the secret only once.
5. In Conduit, connect **Jamf Pro** with these fields:

| Conduit field | Header | Env var (`.mcp.json`) | Notes |
|---------------|--------|-----------------------|-------|
| Jamf Pro URL | `X-Jamf-Base-Url` | `JAMF_BASE_URL` | e.g. `https://org.jamfcloud.com`. Must be a public `https://` URL. |
| Client ID | `X-Jamf-Client-Id` | `JAMF_CLIENT_ID` | The API client's ID |
| Client Secret | `X-Jamf-Client-Secret` | `JAMF_CLIENT_SECRET` | The API client's secret |

Jamf's own guide: [API Roles and Clients](https://learn.jamf.com/bundle/jamf-pro-documentation-current/page/API_Roles_and_Clients.html).

### Least-privilege API role

| Tier | Jamf Pro privileges |
|------|---------------------|
| read | Read Computers, Read Mobile Devices, Read User, Read Policies, Read Patch Management Software Titles, Read Managed Software Updates, Read Smart Computer Groups, Read Static Computer Groups, Read Smart Mobile Device Groups, Read Static Mobile Device Groups, Read Computer PreStage Enrollments, Read Mobile Device PreStage Enrollments, Read Buildings, Read Departments, Read Sites |
| write | Create User, Update User, Update Computers, Update Mobile Devices, Update Static Computer Groups, Create Smart Computer Groups, Update Computer PreStage Enrollments, Create Managed Software Updates, Send Computer Remote Command to Download and Install OS X Update, Send Mobile Device Remote Command to Download and Install iOS Update, Send Computer Remote Command to Install Package, Read Computer Check-In, Send Inventory Requests to Mobile Devices |
| admin | Send Computer Remote Lock Command, Send Computer Remote Wipe Command, Send Computer Unmanage Command, Send Mobile Device Remote Lock Command, Send Mobile Device Remote Wipe Command, Unmanage Mobile Devices, View MDM command information in Jamf Pro API, Delete Computers, Delete User, Delete Static Computer Groups, Delete Smart Computer Groups, Read API Roles, Create API Roles, Delete API Roles, Read API Integrations |

Some privilege names (the lock and mobile inventory commands) sit under **Jamf Pro Server Actions** in the role editor and are worded slightly differently there. If a call fails with HTTP 403, the error names the endpoint. Add the missing privilege to the role.

## Tool Tiers and Gating

Two independent gates decide which tools you see:

1. **Sidecar deployment tiers.** The sidecar groups its 45 tools into `read` (21), `write` (11), and `admin` (13). `read` and `write` are on by default. `admin` is **off by default** and is only listed when the deployment explicitly enables it.
2. **Your Conduit access.** Conduit forwards only the tiers your access grant allows for Jamf Pro, and the sidecar intersects that with its deployment tiers. A read-only grant sees only read tools.

Jamf tools are not yet classified in Conduit's tool table. Until they are, Conduit sets each tool's required tier from the sidecar's MCP annotations: read-only tools need `read`, destructive tools need `admin`, and everything else needs `write`. In practice:

| Gate | Tools |
|------|-------|
| Read | `jamf_search_computers`, `jamf_get_computer`, `jamf_search_mobile_devices`, `jamf_get_mobile_device`, `jamf_search_users`, `jamf_get_user`, `jamf_list_policies`, `jamf_get_policy`, `jamf_list_patch_titles`, `jamf_get_patch_report`, `jamf_list_available_os_updates`, `jamf_list_software_update_plans`, `jamf_list_computer_groups`, `jamf_get_computer_group`, `jamf_list_mobile_device_groups`, `jamf_list_computer_prestages`, `jamf_list_mobile_device_prestages`, `jamf_list_buildings`, `jamf_list_departments`, `jamf_list_sites`, `jamf_backup_check` |
| Write | `jamf_create_user`, `jamf_update_user`, `jamf_assign_computer`, `jamf_assign_mobile_device`, `jamf_add_computers_to_static_group`, `jamf_create_smart_computer_group`, `jamf_add_serials_to_computer_prestage`, `jamf_redeploy_management_framework`, `jamf_update_mobile_device_inventory`, `jamf_schedule_os_update` |
| **Admin-gated in Conduit** | `jamf_remove_computers_from_static_group` (sidecar write tier, but annotated destructive, so Conduit requires admin) |
| **Admin tier (off by default) and admin-gated in Conduit** | `jamf_prepare_computer_lock`, `jamf_wipe_computer`, `jamf_unmanage_computer`, `jamf_delete_computer`, `jamf_lock_mobile_device`, `jamf_wipe_mobile_device`, `jamf_unmanage_mobile_device`, `jamf_delete_user`, `jamf_delete_computer_group`, `jamf_list_api_roles`, `jamf_list_api_integrations`, `jamf_create_api_role`, `jamf_delete_api_role` |

Every admin-tier tool except `jamf_prepare_computer_lock` also requires `"confirm": true`. That argument guards against accidental calls. It does not prove a human approved the action, so confirm the exact target with the user first.

What the sidecar never exposes, at any tier:

- **Mac Device Lock PINs.** A locked Mac can only be unlocked with its 6-digit PIN. `jamf_prepare_computer_lock` sends nothing: it returns a Jamf Pro console link and steps for a human operator to set the PIN and send the lock.
- **Forced OS installs and restarts.** `jamf_schedule_os_update` offers download-only, install with user deferrals, or install at a scheduled local time.
- **Secrets.** FileVault recovery keys, Recovery Lock passwords, Device Lock PINs, and new API client credentials are never returned or minted.

## Skills Bundled

| Skill | Covers |
|-------|--------|
| `jamf-api-patterns` | Conduit headers, tool tiers, paging and RSQL filters, inventory sections, errors and rate limits |
| `jamf-device-compliance` | FileVault/escrow, passcode, stale check-in, unmanaged devices; fleet compliance reports |
| `jamf-patch-management` | OS version spread, available updates, update plans, third-party patch reports, scheduling updates |
| `jamf-user-onboarding` | New-hire user records, device assignment, PreStage scoping, static groups |
| `jamf-device-offboarding` | Lost or stolen devices and departing users: lock, wipe, unmanage, delete (all admin-gated) |

## Available Agents

| Agent | Use For |
|-------|---------|
| `jamf-posture-auditor` | Read-only per-client posture review: compliance, patch currency, and stale devices, as a QBR-ready report |

## Common Workflows

**Monthly compliance check.** Ask "Which of Contoso's Macs aren't encrypted or haven't checked in this month?" Claude runs `jamf_backup_check` and follows up per device with `jamf_get_computer`.

**Monthly Mac patch review.** Ask "How many Macs are behind the latest macOS minor, and who is still on an old Chrome?" Claude compares `jamf_list_available_os_updates` against computer inventory and reads `jamf_get_patch_report` for the title.

**New hire.** Ask "Set up Jane Smith with the MacBook serial C02XXXXXXX." Claude checks `jamf_search_users`, creates the user, scopes the serial to a PreStage, and assigns the device after it enrolls.

## Troubleshooting

- **Connection rejected when saving.** Conduit's check posts to your Jamf Pro token endpoint. A 400 or 401 means the client ID/secret is wrong or the API client is disabled. Re-generate the secret and update the connection.
- **HTTP 403 on a tool.** The API role is missing a privilege. The error names the endpoint, so add the matching privilege from the table above.
- **A tool you expect is missing.** Either the sidecar deployment does not enable that tier (admin is off by default) or your Conduit access grant for Jamf Pro is below that tier.
- **HTTP 429.** Jamf Pro rate-limited the request. The error includes a retry delay when Jamf sends one. Wait, then retry with smaller pages.
- **Truncated output.** Each tool response is capped (60,000 characters by default). Request fewer inventory sections or a smaller `pageSize`.

## License

Apache-2.0

## Links

- [Jamf Pro product](https://www.jamf.com/products/jamf-pro/)
- [Jamf developer documentation](https://developer.jamf.com/)
- [API Roles and Clients](https://learn.jamf.com/bundle/jamf-pro-documentation-current/page/API_Roles_and_Clients.html)
