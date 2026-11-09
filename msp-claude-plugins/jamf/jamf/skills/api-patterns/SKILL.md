---
name: "Jamf Pro API Patterns"
description: >
  Jamf Pro MCP fundamentals through Conduit: the three X-Jamf-* credential
  headers and the API client they come from, the read/write/admin tool tiers
  and how Conduit and the sidecar each gate them, zero-based paging and RSQL
  filters on the Jamf Pro API tools, contains/limit on the Classic API list
  tools, inventory sections, response caps, and the error and rate-limit
  messages the sidecar returns.
when_to_use: >-
  When connecting Jamf Pro, choosing filters or page sizes for Jamf inventory
  calls, working out why a Jamf tool is missing or denied, or interpreting a
  Jamf error. Use when: jamf api, jamf authentication, jamf api client, jamf
  403, jamf pagination, jamf rsql filter, jamf tool missing, jamf admin tools.
---

# Jamf Pro API Patterns

## Overview

WYRE's Jamf Pro sidecar exposes 45 tools over one Jamf Pro tenant per Conduit connection. Most read tools wrap the modern Jamf Pro API (paged, RSQL-filterable). A few wrap the older Classic API, which has no server-side search, so the sidecar filters those by name itself. Knowing which family a tool belongs to tells you how to page and filter it.

## Connection and Authentication

Each Conduit connection holds one Jamf Pro **API client** (Settings → System → API Roles and Clients). Conduit passes three headers to the sidecar:

| Conduit field | Header | `.mcp.json` env var |
|---------------|--------|---------------------|
| Jamf Pro URL | `X-Jamf-Base-Url` | `JAMF_BASE_URL` |
| Client ID | `X-Jamf-Client-Id` | `JAMF_CLIENT_ID` |
| Client Secret | `X-Jamf-Client-Secret` | `JAMF_CLIENT_SECRET` |

The sidecar exchanges the client ID and secret for a short-lived bearer token, caches it, and retries once with a fresh token on HTTP 401. The base URL must be public `https://`. Private, loopback, and placeholder URLs are refused by both Conduit and the sidecar.

The API client's **API Role** is the real permission boundary. A tool that is listed can still fail with 403 if the role lacks the privilege. Use one API client per client tenant, scoped to the tiers that client needs.

**One tenant per connection.** If an MSP runs one Jamf Pro instance for several clients, those clients are usually separated by **sites**. Use `jamf_list_sites`, then scope by site (for example the `computerFilter` example `general.site.name=="Contoso"` that `jamf_backup_check` documents).

## Tool Tiers and Gating

| Tier | Count | Sidecar default | Conduit requirement |
|------|-------|-----------------|---------------------|
| read | 21 | on | read |
| write | 11 | on | write, except `jamf_remove_computers_from_static_group`, which Conduit treats as admin |
| admin | 13 | **off** | admin |

Two gates apply, and both must pass:

1. **The sidecar deployment** lists only the tiers it enables. Admin is off unless the deployment turns it on.
2. **Conduit** forwards only the tiers your access grant allows for Jamf Pro. A read grant forwards `read`; a write grant forwards `read,write`; an admin grant forwards all three. The sidecar intersects that with its own tiers. An empty result means no tools at all.

Jamf tools are not yet classified in Conduit's tool table, so Conduit derives each tool's required tier from its MCP annotations: read-only tools need read, destructive tools need admin, and the rest need write. That is why `jamf_remove_computers_from_static_group` (annotated destructive) is admin-gated in Conduit even though the sidecar ships it in the write tier.

**Admin-gated in Conduit:** `jamf_prepare_computer_lock`, `jamf_wipe_computer`, `jamf_unmanage_computer`, `jamf_delete_computer`, `jamf_lock_mobile_device`, `jamf_wipe_mobile_device`, `jamf_unmanage_mobile_device`, `jamf_delete_user`, `jamf_delete_computer_group`, `jamf_list_api_roles`, `jamf_list_api_integrations`, `jamf_create_api_role`, `jamf_delete_api_role`, and `jamf_remove_computers_from_static_group`.

Every admin-tier tool except `jamf_prepare_computer_lock` requires `"confirm": true`. Set it only after the user has confirmed the exact action and target in this conversation.

## Paging and Filtering

### Jamf Pro API tools (paged)

`jamf_search_computers`, `jamf_search_mobile_devices`, `jamf_search_users`, `jamf_get_patch_report`, `jamf_list_software_update_plans`, `jamf_list_computer_prestages`, `jamf_list_mobile_device_prestages`, `jamf_list_buildings`, and `jamf_list_departments` take:

| Arg | Meaning |
|-----|---------|
| `page` | Zero-based page number. Default 0. |
| `pageSize` | 1-200. Default 50 (100 for buildings and departments). |
| `sort` | Up to 5 entries like `"general.name:asc"` |
| `filter` | Raw RSQL, up to 2,000 characters |

Responses carry `totalCount` and `results`. Keep paging until you have read `totalCount` results before you call a list complete.

The search tools also take convenience args that the sidecar turns into RSQL and ANDs with `filter`. All support `*` wildcards:

- `jamf_search_computers`: `name`, `serialNumber`, `username`
- `jamf_search_mobile_devices`: `name`, `serialNumber`, `username`, `email`
- `jamf_search_users`: `username`, `realname`, `email` (e.g. `email: "*@contoso.com"`)

RSQL examples from the sidecar's own tool descriptions: `general.name=="MBP-*"`, `version!="120.0"` (patch report), `device.deviceId=="42"` (update plans). Jamf answers an unknown filter field with an HTTP 4xx error. Fall back to the convenience args or sort and page.

### Classic API tools (sidecar-filtered)

`jamf_list_policies` has no paging. It takes `contains` (case-insensitive substring of the name) and `limit` (1-500, default 100), and returns `totalMatched` and `returned`. When `totalMatched` is larger than `returned`, narrow `contains` or raise `limit`.

`jamf_list_computer_groups`, `jamf_list_mobile_device_groups`, `jamf_list_patch_titles`, `jamf_list_available_os_updates`, and `jamf_list_sites` take no arguments and return everything.

### Inventory sections

`jamf_search_computers` and `jamf_get_computer` take a `sections` array. Search defaults to `GENERAL`, `HARDWARE`, `OPERATING_SYSTEM`, `USER_AND_LOCATION`. Get adds `DISK_ENCRYPTION` and `SECURITY`. `jamf_search_mobile_devices` defaults to `GENERAL`, `HARDWARE`, `USER_AND_LOCATION`. Request only what you need: `APPLICATIONS` and `PACKAGE_RECEIPTS` are large.

## Response Limits

- Each tool response is capped (60,000 characters by default) after redaction. Large pages with many sections get truncated. Lower `pageSize` or drop sections.
- Responses are redacted before you see them: secret-named fields, recovery-key-shaped values, bearer tokens, and the caller's client secret are masked.
- IDs are numeric strings (`"42"`). Path-like or non-numeric IDs are rejected before any call to Jamf.
- Only arguments declared in a tool's schema reach Jamf. Extra arguments are dropped silently.

## Errors

| Error text | Cause | What to do |
|------------|-------|------------|
| `No Jamf Pro credentials on this request` | Conduit connection missing or incomplete | Reconnect Jamf Pro in Conduit |
| `rejected the access token ... after one retry` (401) | Client secret rotated or API client disabled | Update the Conduit connection |
| `denied ... (HTTP 403). The API client's role is missing the privilege` | API Role lacks a privilege | Add the privilege for that endpoint in Jamf |
| `returned 404 ... object not found` | Wrong id, or the record was deleted | Re-search, then retry with the new id |
| `rate-limited ... (HTTP 429). Retry after Ns.` | Jamf Pro throttling | Wait the stated seconds, then retry with smaller pages |
| `redirected ... refusing to follow` | Base URL points at a redirecting host | Use the canonical `https://<org>.jamfcloud.com` URL |
| `did not respond in time` | Jamf Pro slow or unreachable | Retry once, then narrow the query |
| `Unknown tool: <name>` | Tool not in your effective tiers | See Tool Tiers and Gating above |

## Gotchas

- A missing tool is not a bug. Check the tier tables above before telling the user a capability doesn't exist.
- `jamf_backup_check` is not a backup check. Jamf Pro is not a backup product. The tool reports Jamf-native data-protection signals and says so in its `disclaimer`. Confirm actual backups in the backup product.
- `jamf_get_computer_group` returns current members for static and smart groups. Smart-group membership is criteria-driven, and `jamf_add_computers_to_static_group` refuses smart groups.

## Related Skills

- [device-compliance](../device-compliance/SKILL.md): fleet compliance and data-protection review
- [patch-management](../patch-management/SKILL.md): OS and third-party patch posture
- [user-onboarding](../user-onboarding/SKILL.md): new-hire users and device assignment
- [device-offboarding](../device-offboarding/SKILL.md): lost devices and departing users
