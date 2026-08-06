# Azure MCP Plugin

Claude plugins for the **Azure MCP Server** — Microsoft's official MCP server (`mcr.microsoft.com/azure-sdk/azure-mcp`) for observing Azure resources in natural language.

This plugin orients Claude around the `azure-mcp` vendor as deployed in the **WYRE MCP Gateway**: a WYRE-built sidecar that runs the Azure MCP Server with per-tenant credential isolation. Each connecting MSP supplies its own Azure **service principal**, and the gateway scopes every request to that tenant.

> **Read-only by design.** The gateway runs the Azure MCP Server with `--read-only` and a deliberately constrained namespace allowlist. As shipped, this plugin is an Azure **observability, cost, and resource-health** tool. It cannot provision, modify, or delete Azure infrastructure.

## What's in this plugin

### Skills (3)

| Skill | Coverage |
|-------|----------|
| `connection` | Connecting `azure-mcp` through the WYRE gateway, registering an Azure service principal, and least-privilege RBAC guidance |
| `observability` | `monitor` (metrics, Log Analytics KQL, alerts), `resourcehealth`, `applens`, `advisor` |
| `cost-and-capacity` | `pricing`, `quota`, `subscription`, `group` |

### Agents (1)

- **`azure-ops-analyst`** — investigates resource health, summarizes cost and Advisor findings, and reports observability posture. A diagnostician and reporter — never an operator.

### Commands (2)

- **`/azure-mcp:azure-cost`** — cost and pricing analysis (Advisor cost recommendations + retail pricing + subscription scoping)
- **`/azure-mcp:azure-diagnostics`** — resource health and diagnostics triage (Resource Health + AppLens + Monitor alerts)

## Enabled namespaces

The gateway deployment enables exactly **eight** read-leaning namespaces on day one. Tool names follow the Azure MCP Server's namespace convention (`azmcp` / `azure_mcp` prefixes) — described here at the capability level.

| Namespace | What it does |
|-----------|--------------|
| `monitor` | Azure Monitor — metrics, Log Analytics / KQL queries, alert state |
| `pricing` | Azure retail pricing lookups |
| `quota` | Subscription quota and usage limits |
| `advisor` | Azure Advisor recommendations — cost, security, reliability, performance, operational excellence |
| `resourcehealth` | Resource Health — availability and status of Azure resources |
| `applens` | AppLens diagnostics — deep diagnostics for app/resource problems |
| `subscription` | List and inspect Azure subscriptions |
| `group` | List and inspect resource groups |

### Deliberately excluded

Write- and delete-capable namespaces — `storage`, `keyvault`, `compute`, `role`, `aks`, and others — are **not enabled**. They are excluded on purpose so the connector cannot mutate Azure infrastructure or read secret material. Do not document or attempt those operations through this plugin.

## How to connect

1. In your Azure tenant, register (or reuse) an Azure AD **service principal** — an app registration with a client secret.
2. Grant the service principal **least-privilege, Reader-tier RBAC** at subscription scope — `Reader` plus `Cost Management Reader` is sufficient for all eight enabled namespaces. No write or contributor roles are needed.
3. In the WYRE MCP Gateway connection UI, connect the **`azure-mcp`** vendor and supply: **Tenant ID**, **Service Principal Client ID**, and **Service Principal Client Secret**.
4. The gateway routes and authenticates Azure MCP tools through your gateway session, scoped to the credentials you supplied.

See the `connection` skill for the full step-by-step, including the exact RBAC roles and the security rationale.

## Resources

- Azure MCP Server: https://github.com/Azure/azure-mcp
- Azure MCP Server image: `mcr.microsoft.com/azure-sdk/azure-mcp`
- WYRE MCP Gateway: https://conduit.wyre.ai
- Azure RBAC built-in roles: https://learn.microsoft.com/azure/role-based-access-control/built-in-roles
