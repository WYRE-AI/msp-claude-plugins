# SaaS Alerts Plugin

Claude Code plugin for [SaaS Alerts](https://saasalerts.com) — SaaS security monitoring and alerting for M365 and Google Workspace tenants managed by MSPs.

## What It Does

- **Events & Alerts** - Query security events by severity, type, and time window across all managed tenants
- **Advanced Event Queries** - Cross-tenant pattern detection and anomaly correlation via `saas_alerts_events_query_advanced`
- **Recommended Actions** - Pull vendor-generated remediation guidance for specific alerts
- **Customer Management** - Navigate the MSP/customer/account hierarchy
- **Users** - List the users of a customer or of the whole partner account, for impact scoping
- **Device Mapping** - Review which devices are mapped, unmapped, or ignored per device organization
- **Billing** - Review per-date partner billing and usage data

> The tool surface covers event queries, recommended actions, customer hierarchy, user lists, device mapping, and billing. Multi-tenant operations are first-class — every alert carries customer context. Note what is *not* here: there is no per-user or per-device lookup, so attributing an event to a named person or machine means listing and matching client-side. See **Tools** below.

## Installation

```
/plugin marketplace add wyre-technology/msp-claude-plugins
/plugin install saas-alerts
```

The plugin connects through [Conduit](https://conduit.wyre.ai) at `https://conduit.wyre.ai/v1/saas-alerts/mcp`.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `SAAS_ALERTS_API_KEY` | Yes | SaaS Alerts partner API key |

## Skills

- `triage` - Sweep and prioritize the SaaS Alerts queue across tenants; produce a shift-ready response plan
- `api-patterns` - Auth, MSP/customer/account hierarchy, navigation, pagination, and event filters

## Tools

Provided by the SaaS Alerts MCP server through the WYRE MCP Gateway:

### Navigation
- `saas_alerts_navigate`, `saas_alerts_status`

### Events
- `saas_alerts_events_query`
- `saas_alerts_events_query_advanced`
- `saas_alerts_recommended_actions`

### Customers
- `saas_alerts_customers_list`, `saas_alerts_customers_get`
- `saas_alerts_customers_create`, `saas_alerts_customers_update`, `saas_alerts_customers_delete`
- `saas_alerts_customers_set_whitelists`, `saas_alerts_customers_set_account_whitelists`

### Users
- `saas_alerts_users_list_partner` — every user on the partner account
- `saas_alerts_users_list_by_customer` (`customer_id`) — every user of one customer
- `saas_alerts_users_get_msp` — the MSP user profile behind the authenticating API key; doubles as a credential check

> **There is no get-user-by-id tool.** An earlier revision of this list named
> two that do not exist: a bare users-list and a per-user get. The user surface
> is exactly the three above
> (`saas-alerts-mcp/src/domains/users.ts`). **Resolving a user ID to a name and
> role is not available through this plugin as a single call** — list the
> customer's users once with `saas_alerts_users_list_by_customer` and match the
> ID client-side. Do not reach for `saas_alerts_users_get_msp` for this: it
> ignores any ID you pass and always returns the API key's own profile.

### Devices
- `saas_alerts_devices_list_orgs` — device organizations visible to the partner (no arguments)
- `saas_alerts_devices_list_mapped` (`organization_ids`) — devices unified to a customer org
- `saas_alerts_devices_list_unmapped` (`organization_ids`, `confidence`, `only_with_suggestions`) — devices not yet mapped
- `saas_alerts_devices_list_ignored` (`organization_ids`) — devices explicitly ignored

> **There is no per-device get.** An earlier revision named a bare devices-list
> and a per-device get; neither exists. The device surface is the four list
> tools above (`saas-alerts-mcp/src/domains/devices.ts`), and they exist to
> manage device-to-organization *mapping* — **attributing an event to a specific
> device is not available through this plugin.** Note also that
> `organization_ids` here are device-organization IDs, not the `customer_id`
> used elsewhere; start from `saas_alerts_devices_list_orgs`.

### Billing
- `saas_alerts_billing_list_dates` — available billing dates (no arguments)
- `saas_alerts_billing_get_details` (`billing_date`) — details for one date; list the dates first

### Reports
- `saas_alerts_reports_list_scheduled`, `saas_alerts_reports_get_scheduled`
- `saas_alerts_reports_create_scheduled`, `saas_alerts_reports_delete_scheduled`

### Partner
- `saas_alerts_partner_get_profile`, `saas_alerts_partner_update_branding`

## License

Apache-2.0
