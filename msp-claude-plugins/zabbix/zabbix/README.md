# Zabbix Plugin

Claude plugin for [Zabbix](https://www.zabbix.com), the open-source infrastructure
monitoring platform, through the Conduit gateway. Backed by
[`WYRE-AI/zabbix-mcp`](https://github.com/WYRE-AI/zabbix-mcp), a read-only server for
the Zabbix JSON-RPC API of a customer's own self-hosted Zabbix frontend.

## What It Does

- **Problem triage**: open problems by severity and customer host group, with
  acknowledgement, suppression and maintenance context, and whether anyone was paged.
- **Monitoring coverage and site-collector health**: hosts, templates, proxies and
  maintenance windows, to find unmonitored hosts and site proxies that stopped reporting.
- **SLA and availability reporting**: business services, SLA definitions, SLI figures
  and hourly trend aggregates for customer reviews and capacity planning.

Everything is read-only. Each tool calls exactly one allowlisted Zabbix `*.get` method
(or `apiinfo.version`). The plugin cannot acknowledge, close, or suppress a problem,
create maintenance, or run scripts: there is no write tool and no generic JSON-RPC
passthrough.

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install zabbix
```

This plugin ships no `.mcp.json`. Install the `wyre-gateway` plugin (or any workflow
pack), which connects Claude Code to [Conduit](https://conduit.wyre.ai) at
`https://conduit.wyre.ai/v1/mcp`, then connect Zabbix in the Conduit web UI
(`/connect/zabbix`) as described below. Conduit stores the credentials and injects them
on every request, so there are no environment variables or headers to set on the client.

## Connecting Zabbix in Conduit

Conduit asks for two fields:

| Field | Header Conduit sends |
|-------|----------------------|
| Zabbix frontend URL | `X-Zabbix-Base-Url` |
| API token | `X-Zabbix-Api-Token` |

Conduit drops any `X-Zabbix-*` header a client sends, so the token lives only in the
Conduit connection.

1. In the Zabbix frontend, create a dedicated user for Conduit. Give it a role that can
   only **read** the host groups you want Conduit to see (a User role, or Admin with
   read-only host-group permissions).
2. Create an API token for that user under **Users > API tokens**. Set an expiry date.
   A real token is 64 letters and digits.
3. Paste the frontend URL: the address you open Zabbix at, for example
   `https://zabbix.acme.com/zabbix`. It must be `https://` with no query string.
4. The frontend must be reachable from the internet over https, or through a Conduit
   tunnel. If it sits behind a firewall, allowlist Conduit's egress IP or use the tunnel.

When you save, Conduit calls `apiinfo.version`, then a one-row `host.get` with your
token, and rejects the connection if either fails.

**Do not use a Super admin token.** A Super admin can run `script.execute` (remote
commands on every monitored agent), so a leaked Super admin token is remote code
execution across the customer estate. This plugin never needs it.

### Zabbix versions

The sidecar reads the frontend version first and picks the auth style: Zabbix 6.4 and
later get `Authorization: Bearer`, 6.0 and 6.2 LTS get the JSON-RPC body `auth`
property. Parameter names follow the Zabbix 8.0 API reference. A few older names
differ (6.0 `host.get` uses `selectGroups`, not `selectHostGroups`), and Zabbix
returns an "unexpected parameter" error when that happens. Proxy groups need 7.0+.

## Tools

18 tools are listed through Conduit. All are reads.

| Tool | Zabbix method | Used for |
|------|---------------|----------|
| `zabbix_api_version` | `apiinfo.version` | Connection test and version check |
| `zabbix_hostgroups_list` | `hostgroup.get` | Customer / site scoping |
| `zabbix_hosts_list` | `host.get` | Host inventory, tags, templates |
| `zabbix_problems_list` | `problem.get` | Open problems for triage |
| `zabbix_events_list` | `event.get` | Problem and recovery history |
| `zabbix_triggers_list` | `trigger.get` | Trigger state and dependencies |
| `zabbix_alerts_list` | `alert.get` | Whether someone was paged |
| `zabbix_maintenance_list` | `maintenance.get` | Active and scheduled maintenance |
| `zabbix_templates_list` | `template.get` | Monitoring coverage review |
| `zabbix_proxies_list` | `proxy.get` | Site collector health |
| `zabbix_proxy_groups_list` | `proxygroup.get` | Proxy HA state (7.0+) |
| `zabbix_web_scenarios_list` | `httptest.get` | Synthetic HTTP checks |
| `zabbix_services_list` | `service.get` | Business service tree and status |
| `zabbix_slas_list` | `sla.get` | SLA definitions |
| `zabbix_sla_sli_get` | `sla.getsli` | SLI figures for customer reports |
| `zabbix_trends_get` | `trend.get` | Hourly min / avg / max |
| `zabbix_dashboards_list` | `dashboard.get` | Deep links into the frontend |
| `zabbix_auditlog_list` | `auditlog.get` | Audit log (see below) |

### Admin-gated and restricted tools

- **`zabbix_auditlog_list` is admin-gated in Conduit**: only members with the `admin`
  permission tier can call it. Zabbix itself also allows `auditlog.get` only for Super
  admin tokens, so with the recommended read-only token it returns a permission error
  even for a Conduit admin. Treat it as unavailable unless the customer deliberately
  connected a Super admin token (which this plugin advises against).
- **Opt-in tools that Conduit does not list.** The sidecar has three more tools that
  are off unless the container runs with `ZABBIX_ENABLE_SENSITIVE_TOOLS=1`:
  `zabbix_items_list` (item last values can contain log text), `zabbix_history_get`
  (raw history) and `zabbix_host_interfaces_list` (interface availability; SNMP secrets
  redacted). Conduit's deployment does not enable them, so the skills here do not rely
  on them and fall back to triggers, problems and trends.
- The sidecar deliberately never requests `selectMacros`, `selectItems` on hosts and
  templates, `selectMediatypes`, `selectUsers` or `selectPreprocessing`, because those
  carry passwords, media credentials, user PII or scripts.

## Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | Conduit headers, JSON-RPC `get` parameters, keyset paging, limits, errors |
| `problem-triage` | NOC triage of open problems by severity and customer |
| `monitoring-coverage` | Unmonitored hosts, template coverage, proxy and maintenance health |
| `sla-reporting` | Business services, SLA/SLI figures and trends for customer reviews |

## Agents

| Agent | Description |
|-------|-------------|
| `noc-triage-analyst` | Multi-customer problem sweep that ranks problems, adds context and drafts the ticket notes |

## Limitations

- Read-only. Acknowledging, closing or suppressing problems happens in the Zabbix
  frontend.
- No offset paging. Zabbix pages by event ID or time range, and `limit` is capped at 500.
- Zabbix has no API rate limiting of its own, so wide unscoped queries land directly on
  the customer's database. Scope by host group and time range.
- Customer separation depends on how the Zabbix instance is organized, usually one host
  group per customer or site. The token sees only the host groups its user role allows.

## API Documentation

- [Zabbix API manual](https://www.zabbix.com/documentation/current/en/manual/api)
- [Zabbix API tokens](https://www.zabbix.com/documentation/current/en/manual/web_interface/frontend_sections/users/api_tokens)

## License

Apache-2.0
