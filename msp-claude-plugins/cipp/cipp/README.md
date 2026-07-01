# CIPP Plugin

Claude plugins for **CIPP (CyberDrain Improved Partner Portal)** — the open-source Microsoft 365 multi-tenant management platform widely used by MSPs.

This plugin orients Claude around the [`cipp-mcp`](https://github.com/wyre-technology/cipp-mcp) server, which exposes ~37 typed tools across the CIPP REST API. Skills and agents in this plugin embed MSP workflow knowledge: how to onboard a tenant, drive a Secure Score review, run an offboarding sequence, and detect standards drift across a portfolio.

## What's in this plugin

### Skills (9)

| Skill | Tools covered |
|-------|---------------|
| `cipp-tenants` | `cipp_list_tenants`, `cipp_get_tenant_details` |
| `cipp-users` | `cipp_list_users`, `cipp_create_user`, `cipp_edit_user`, `cipp_disable_user`, `cipp_reset_password`, `cipp_reset_mfa`, `cipp_revoke_sessions`, `cipp_offboard_user`, `cipp_bec_check`, `cipp_list_mfa_users`, `cipp_list_user_devices`, `cipp_list_user_groups` |
| `cipp-groups` | `cipp_list_groups`, `cipp_create_group` |
| `cipp-mailboxes` | `cipp_list_mailboxes`, `cipp_list_mailbox_permissions`, `cipp_set_out_of_office`, `cipp_set_email_forwarding` |
| `cipp-security` | `cipp_list_conditional_access_policies`, `cipp_list_named_locations` |
| `cipp-standards` | `cipp_list_standards`, `cipp_run_standards_check`, `cipp_list_bpa`, `cipp_list_domain_health` |
| `cipp-licenses` | `cipp_list_licenses`, `cipp_list_csp_licenses` |
| `cipp-alerts` | `cipp_list_audit_logs`, `cipp_list_alert_queue` |
| `cipp-ops` | `cipp_list_gdap_roles`, `cipp_list_gdap_invites`, `cipp_list_scheduled_items`, `cipp_add_scheduled_item`, `cipp_ping`, `cipp_get_version`, `cipp_list_logs` |

### Agents (2)

- **`security-posture-reviewer`** — sweeps tenants for Secure Score drops, MFA gaps, conditional access regressions, and BPA failures
- **`user-offboarding-runner`** — orchestrates the full M365 offboarding sequence: disable, revoke sessions, reset MFA, set forwarding, reclaim licenses

### Commands (4)

- **`/cipp:offboard-user`** — guided offboarding for a single user
- **`/cipp:tenant-health`** — quick health snapshot for one tenant (Secure Score, MFA, CA, domain health)
- **`/cipp:secure-score-report`** — portfolio-wide Secure Score and security posture summary
- **`/cipp:standards-drift`** — find tenants out of compliance with deployed standards

## Setup

1. Stand up the [cipp-mcp](https://github.com/wyre-technology/cipp-mcp) server (Docker, npx, or Smithery).
2. Issue API credentials in CIPP at **Settings → API Client Management**.
3. Copy `.env.example` to `.env` and fill in `CIPP_BASE_URL` plus either a bearer token or OAuth client-credentials.
   `CIPP_BASE_URL` must be the CIPP-API **Azure Function App** URL (`https://<function-app-name>.azurewebsites.net`, named like `cippXXXXX` in your CIPP resource group) — **not** the Static Web App / custom-domain UI URL. The SWA redirects bearer-token requests to its interactive login page, so API calls fail.
4. Add the cipp-mcp server to your Claude config (Desktop, Code, or via the Wyre MCP Gateway).

## Authentication options

CIPP exposes two auth modes — pick one:

- **Bearer token** (`CIPP_API_KEY`) — simplest; good for dev, single-tenant use, or pinned-key automations.
- **OAuth client-credentials** (`CIPP_TENANT_ID` + `CIPP_CLIENT_ID` + `CIPP_CLIENT_SECRET`) — the production path. CIPP's API Clients integration registers a service principal in your CIPP tenant with scoped roles (e.g. `editor`, `admin`, `readonly`). This is what you want for shared deployments.

## Wyre MCP Gateway

If you connect through the [Wyre MCP Gateway](https://mcp.wyre.ai), CIPP tools are automatically routed and authenticated via your gateway session — no per-user CIPP credentials required. See the `wyre-gateway` plugin for setup.

## Resources

- CIPP project: https://docs.cipp.app
- CIPP API docs: https://docs.cipp.app/api-documentation/endpoints
- cipp-mcp server: https://github.com/wyre-technology/cipp-mcp
- CIPP repo: https://github.com/KelvinTegelaar/CIPP
