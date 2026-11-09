# Acronis Cyber Protect Cloud Plugin

Claude Code plugin for [Acronis Cyber Protect Cloud](https://www.acronis.com/en/products/cloud/cyber-protect/), the multi-tenant backup, disaster recovery and endpoint protection platform for MSPs.

## What It Does

- **Backup health triage** - Rank customers by active backup alerts, find the worst machines, and group failures by protection plan
- **Protection coverage** - Find machines with no protection plan, plans that failed to deploy, and offline, outdated or unsupported agents
- **EDR incident review** - List open incidents by severity and mitigation state, read detections and activities, and check response actions started in the console
- **Tenants and usage** - Map Acronis customer tenants to your clients, reconcile usage against billing, review user access, and check MFA enrollment

Most of the plugin is read-only. Read [Writes are off by default](#writes-are-off-by-default) before you plan on changing anything in Acronis from Claude.

## Connect Acronis in Conduit

The plugin connects through [Conduit](https://conduit.wyre.ai) at `https://conduit.wyre.ai/v1/acronis/mcp`. If Acronis isn't in your Conduit connector list yet, it hasn't been released to your account.

1. In the Acronis management portal, go to **Settings → API clients** and create an API client. Create it in your partner tenant if you want Conduit to see all your customers.
2. Copy its **Client ID** and **Secret**, and the **data center URL** Acronis shows, such as `https://us5-cloud.acronis.com`. Leave off anything after `.com`.
3. In Conduit, connect **Acronis Cyber Protect Cloud** and fill in:

| Conduit field | Value | Sent as header |
|---------------|-------|----------------|
| Data center URL | The data center URL from step 2 | `X-Acronis-Base-Url` |
| Client ID | The API client's Client ID | `X-Acronis-Client-Id` |
| Client Secret | The API client's Secret | `X-Acronis-Client-Secret` |

Don't use your Acronis portal email and password. Everyone in your org shares this connection, and Conduit can see only what the tenant that owns this API client can see.

Conduit checks the connection when you save it: the data center URL must be `https` on `acronis.com`, and Conduit signs in to Acronis with the API client to confirm the Client ID and Secret.

See Acronis's guides to [creating an API client](https://www.acronis.com/en/support/documentation/AcronisCyberCloud/creating-api-client.html) and [managing API clients](https://www.acronis.com/en/support/documentation/AcronisCyberCloud/managing-api-clients.html).

### Plugin configuration

The plugin's `.mcp.json` sends the same three headers from environment variables:

| Variable | Header |
|----------|--------|
| `ACRONIS_BASE_URL` | `X-Acronis-Base-Url` |
| `ACRONIS_CLIENT_ID` | `X-Acronis-Client-Id` |
| `ACRONIS_CLIENT_SECRET` | `X-Acronis-Client-Secret` |

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install acronis
```

## Writes are off by default

The connector has 37 tools: 34 reads and 3 writes. Marking alerts as false positives, changing investigation states and running protection policies are off by default, so those three tools don't appear until writes are turned on for the connector. When they're turned on, only admins can run protection policies.

| Tool | Conduit tier | Effect |
|------|--------------|--------|
| `acronis_mark_alert_as_false_positive` | write | Sets or clears an alert's false-positive flag for everyone in Acronis |
| `acronis_update_investigation_state` | write | Changes an EDR incident's investigation state, or adds a comment or ticket link |
| `acronis_execute_protection_policy` | **admin** | Runs a protection plan now, starting backup or protection jobs on every machine it covers |

Not available at all: creating or deleting tenants, users or API clients, any delete, pricing and offering changes, registration tokens, branding, and starting EDR response actions such as isolating a machine.

## Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | Conduit headers, tenant hierarchy, tool surface and tiers, argument shape, pagination per API family, filter syntax, errors and response size |
| `backup-health` | Alert-driven daily backup triage across customers, reading alerts, and false positives |
| `protection-coverage` | Machines with no plan, plan deployment issues, agent hygiene, and the admin-only run-now write |
| `edr-incidents` | EDR incident review, response action status, and investigation state updates |
| `tenants-and-usage` | Finding customer tenants, usage reconciliation, user access review, and MFA posture |

## Agents

| Agent | Description |
|-------|-------------|
| `acronis-backup-health-reviewer` | Cross-customer backup health review that ranks clients and combines alert data with coverage and agent checks into a fix-first list |

## Tools

All tools are listed directly; there is no navigation step.

### Tenants and users
- `acronis_fetch_tenant`, `acronis_fetch_tenants_batch`, `acronis_fetch_tenant_children`
- `acronis_fetch_tenant_users`, `acronis_fetch_users_batch`, `acronis_fetch_user`, `acronis_fetch_current_user_info`
- `acronis_search`, `acronis_fetch_tenant_mfa_status`, `acronis_fetch_tenant_usages`

### Alerts
- `acronis_fetch_all_alerts`, `acronis_fetch_alert`, `acronis_fetch_categories`, `acronis_fetch_all_alert_types`
- `acronis_fetch_alert_counters`, `acronis_fetch_active_alert_count`, `acronis_fetch_alert_counts_per_customer`
- `acronis_fetch_alerts_grouped_by_scope`, `acronis_fetch_alerts_grouped_per_customer`, `acronis_fetch_resources_with_top_severity_alerts`
- `acronis_mark_alert_as_false_positive` (write, off by default)

### Protection plans and resources
- `acronis_fetch_policies`, `acronis_fetch_policy`, `acronis_fetch_policy_applications`
- `acronis_fetch_applications_issue_statistics`, `acronis_fetch_application_statuses_by_policy`
- `acronis_fetch_resources`, `acronis_fetch_resource_count`, `acronis_fetch_resource`, `acronis_fetch_resource_protection_status`
- `acronis_execute_protection_policy` (write, admin only, off by default)

### Agents
- `acronis_fetch_agents`, `acronis_fetch_agent`

### EDR incidents
- `acronis_fetch_incidents`, `acronis_fetch_incident`, `acronis_fetch_response_action_status`
- `acronis_update_investigation_state` (write, off by default)

## Troubleshooting

- **Conduit won't save the connection** - The data center URL must be the one Acronis showed for the API client, `https`, ending in `.com`. Check the API client is active under Settings → API clients.
- **`upstream_unavailable` on a tool call** - The connector couldn't sign in to Acronis. The API client may have been disabled or its secret rotated; reconnect Acronis in Conduit.
- **Only one customer's data comes back** - The API client was created inside a customer tenant. Create one in the partner tenant to see every customer.
- **A write tool is missing** - Writes are off for the connector. Make the change in the Acronis console.
- **A result ends with a truncation marker** - The result was over about 100 KB. Add filters or page with a smaller `limit`.

## Security Considerations

- The API client secret gives access to every tenant under the API client's tenant. Never commit it; Conduit stores it for you.
- Everyone in your Conduit org shares the connection, so everyone who can use it sees the same customers.
- `acronis_execute_protection_policy` starts real jobs on client machines. It's admin-only in Conduit and should be run only on purpose, never as part of a review.

## License

Apache-2.0

## Changelog

### 1.0.0 (2026-11-09)

- Initial release
- 5 skills: api-patterns, backup-health, protection-coverage, edr-incidents, tenants-and-usage
- 1 agent: acronis-backup-health-reviewer
