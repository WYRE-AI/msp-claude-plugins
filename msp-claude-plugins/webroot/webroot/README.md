# Webroot (OpenText) Plugin

Claude plugin for **Webroot Business Endpoint Protection** (OpenText), through the
Conduit gateway. Backed by [`WYRE-AI/webroot-mcp`](https://github.com/WYRE-AI/webroot-mcp):
25 read-only tools over the Webroot Unity API for an MSP's GSM console.

**Read-only.** Every tool is a `GET`. Nothing here can issue agent commands (scan,
cleanup, uninstall, isolate), change policies, deactivate devices, add admins, or touch
the shop. Remediation still happens in the GSM console.

**Preview.** The Webroot connector is new in Conduit and may not be visible in your
Conduit catalog yet. Treat early results as unconfirmed until your first live connection
completes a few calls.

## What It Does

- **Endpoint protection health**: infected, attention-required and stale endpoints per
  site; agent versions; endpoints on detect-only or unmanaged policies.
- **Threat review**: threat history per site or endpoint, Web Threat Shield URL actions,
  and DNS Protection blocks.
- **Usage and seat reconciliation**: per-site usage reports, seats allowed vs. deployed,
  and expiring or trial sites, for checking PSA billing.
- **Console access and command audit** (admin-gated): who has GSM or site access, and the
  history of agent commands (uninstall, deactivate, keycode changes) issued to endpoints.

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install webroot
```

The plugin connects through [Conduit](https://conduit.wyre.ai) at
`https://conduit.wyre.ai/v1/webroot/mcp`.

## Connect Webroot in Conduit

Conduit asks for five values. Webroot's Unity API signs in **as a GSM console user**
(OAuth password grant), so this is a real console login, not just an API key.

| Conduit field | Where it comes from | Header |
|---|---|---|
| API client ID | GSM console > Settings > API Access > New | `X-Webroot-Client-Id` |
| API client secret | Same screen; shown once | `X-Webroot-Client-Secret` |
| Console username (email) | The console user the API acts as | `X-Webroot-Username` |
| Console password | That user's password | `X-Webroot-Password` |
| GSM key (parent keycode) | Your GSM parent keycode | `X-Webroot-Gsm-Key` |

Create a **dedicated API-only console user with the lowest role that works**, and limit
its site permissions if the assistant does not need every site. The console user's role
decides what the API can see. Conduit checks the client and login against Webroot's token
endpoint and then reads the GSM console with the key, so a wrong value fails at connect
time, not on the first tool call.

If you run the plugin's `.mcp.json` directly instead of through a Conduit-managed
connection, set these environment variables:

| Variable | Header |
|---|---|
| `WEBROOT_CLIENT_ID` | `X-Webroot-Client-Id` |
| `WEBROOT_CLIENT_SECRET` | `X-Webroot-Client-Secret` |
| `WEBROOT_USERNAME` | `X-Webroot-Username` |
| `WEBROOT_PASSWORD` | `X-Webroot-Password` |
| `WEBROOT_GSM_KEY` | `X-Webroot-Gsm-Key` |

Vendor API reference: <https://unityapi.webrootcloudav.com/Docs>

## Skills

- [api-patterns](skills/api-patterns/SKILL.md): auth through Conduit, the three paging styles, errors, response size limits.
- [endpoint-health](skills/endpoint-health/SKILL.md): protection posture triage across the console or one site.
- [threat-review](skills/threat-review/SKILL.md): threat history, Web Threat Shield and DNS Protection review.
- [usage-reconciliation](skills/usage-reconciliation/SKILL.md): seat and usage checks for billing.
- [console-audit](skills/console-audit/SKILL.md): console admin access review and agent command history (admin-gated tools).

## Agents

- [site-security-reviewer](agents/site-security-reviewer.md): monthly or QBR security review of one customer site.

## Tools

All 25 tools are read-only. In Conduit, 21 are in the **Read** group and 4 are in the
**Admin** group. A user with only Read access to the Webroot connection cannot call the
Admin tools; confirm the live grant in Conduit's access editor.

| Area | Tools | Conduit group |
|---|---|---|
| Health | `webroot_health_ping` (no credentials) | Read |
| Console | `webroot_console_get`, `webroot_statistics_console_get` | Read |
| Sites | `webroot_sites_list`, `webroot_sites_get`, `webroot_sites_lookup`, `webroot_statistics_site_get` | Read |
| Endpoints and groups | `webroot_endpoints_list`, `webroot_endpoints_get`, `webroot_groups_list`, `webroot_groups_list_endpoints` | Read |
| Policies | `webroot_policies_list`, `webroot_policies_list_site` | Read |
| Threats | `webroot_threats_list_site`, `webroot_threats_list_endpoint` | Read |
| Web and DNS protection | `webroot_blockedurls_list`, `webroot_dnsp_traffic_summary`, `webroot_dnsp_blocked_list` | Read |
| Agent status (SkyStatus) | `webroot_agent_status_gsm`, `webroot_agent_status_site` | Read |
| Usage | `webroot_usage_sites_report` | Read |
| Command history | `webroot_commands_list_site`, `webroot_commands_list_endpoint` (history only; issues nothing) | **Admin** |
| Console admins (PII) | `webroot_admins_list`, `webroot_admins_list_site` | **Admin** |

The admin listing tools return administrators' names, email addresses and phone numbers.

## Limitations

- No writes of any kind. The plugin can tell you an endpoint needs a scan or cleanup; a
  technician issues it in the GSM console.
- The GSM key is bound to the connection. One Conduit connection sees one GSM console;
  no tool can be pointed at another.
- Webroot does not document rate limits. Page through large sites rather than raising
  page sizes to the maximum.
- `webconsoleurl` (a short-lived auto-login console link) is deliberately not exposed.

## License

Apache-2.0
