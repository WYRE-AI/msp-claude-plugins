# SaaS Alerts Plugin

Claude Code plugin for [SaaS Alerts](https://saasalerts.com) — SaaS security monitoring and alerting for M365 and Google Workspace tenants managed by MSPs.

## What It Does

- **Events & Alerts** - Query security events by severity, type, and time window across all managed tenants
- **Advanced Event Queries** - Cross-tenant pattern detection and anomaly correlation via `saas_alerts_events_query_advanced`
- **Recommended Actions** - Pull vendor-generated remediation guidance for specific alerts
- **Customer Management** - Navigate the MSP/customer/account hierarchy
- **Devices & Users** - Enumerate users and devices per customer for attribution and impact scoping
- **Billing** - Review per-customer billing and usage data

> The tool surface covers event queries, recommended actions, customer hierarchy, users, devices, and billing. Multi-tenant operations are first-class — every alert carries customer context.

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
- `saas_alerts_users_list`, `saas_alerts_users_get`, `saas_alerts_users_get_msp`

### Devices
- `saas_alerts_devices_list`, `saas_alerts_devices_get`

### Billing
- `saas_alerts_billing_list`, `saas_alerts_billing_get`

### Reports
- `saas_alerts_reports_list_scheduled`, `saas_alerts_reports_get_scheduled`
- `saas_alerts_reports_create_scheduled`, `saas_alerts_reports_delete_scheduled`

### Partner
- `saas_alerts_partner_get_profile`, `saas_alerts_partner_update_branding`

## License

Apache-2.0
