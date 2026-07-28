---
name: "azure-mcp-observability"
description: >
  The read-only observability half of the azure-mcp connector — the monitor,
  resourcehealth, applens, and advisor namespaces: Azure Monitor metrics, Log
  Analytics KQL, alert-rule state, platform health states, AppLens detectors, and
  Advisor recommendation categories, plus the degraded-resource investigation order.
when_to_use: >-
  When investigating a degraded or unhealthy Azure resource, querying logs/metrics, checking
  alerts, or triaging Advisor recommendations across a subscription. Use when: azure monitor, log
  analytics, kql query, azure metrics, azure alerts, resource health, azure resource down,
  applens, azure diagnostics, azure advisor, or azure recommendations.
---

# Azure Observability & Diagnostics

This skill covers the monitoring, diagnostics, and health side of the `azure-mcp` connector: the `monitor`, `resourcehealth`, `applens`, and `advisor` namespaces. All four are **read-only** — they observe and report on Azure, they never change it.

Tool names follow the Azure MCP Server's namespace convention (`azmcp` / `azure_mcp` prefixes, e.g. tools grouped under `monitor`, `resourcehealth`, `applens`, `advisor`). Describe and invoke them by capability — the connector exposes one or more tools per namespace.

## Namespace surface

### `monitor` — Azure Monitor

Azure Monitor is the workhorse. Capabilities:

- **Metrics** — query platform and custom metric series for a resource (CPU, memory, request count, latency, throttling, etc.) over a time window.
- **Log Analytics / KQL** — run Kusto Query Language queries against a Log Analytics workspace. This is how you reach application traces, `AzureDiagnostics`, `AzureActivity`, sign-in logs, and any custom tables.
- **Alerts** — list configured alert rules and their current fired/resolved state.

KQL queries should be scoped tightly — always include a `where TimeGenerated > ago(...)` bound and a column projection so results stay small and fast.

### `resourcehealth` — Resource Health

Reports the platform-reported availability of an Azure resource: `Available`, `Degraded`, `Unavailable`, or `Unknown`, plus the reason (platform-initiated, customer-initiated, or unplanned) and any active health events on the subscription. This is the fastest "is it Azure's fault" check.

### `applens` — AppLens diagnostics

AppLens runs Microsoft's deep diagnostic detectors against a resource — the same engine behind the Azure portal's "Diagnose and solve problems" blade. Use it when Resource Health says a resource is degraded but you need the *why*: which detector tripped, what dependency failed, what the recommended mitigation is.

### `advisor` — Azure Advisor

Azure Advisor produces recommendations across five categories: **Cost**, **Security**, **Reliability**, **Performance**, and **Operational Excellence**. Each recommendation has an impact rating (High/Medium/Low) and affected resources. The `advisor` namespace lists and filters these.

## Workflow patterns

### Investigating a degraded resource

1. **`resourcehealth`** — check the resource's current health state. If `Unavailable`/`Degraded` with a *platform-initiated* reason, it's an Azure-side event — capture the event ID and stop; there's nothing to fix on the customer side beyond waiting or failing over.
2. **`applens`** — if Resource Health is `Available` or the reason is customer-initiated, run AppLens detectors to find the failing detector and its dependency chain.
3. **`monitor` metrics** — pull the relevant metric series around the incident window (e.g. CPU/memory for a VM, HTTP 5xx and response time for an App Service) to confirm and quantify the impact.
4. **`monitor` Log Analytics** — run a targeted KQL query against the workspace for error-level traces in the same window.
5. **`monitor` alerts** — confirm whether an alert rule already fired; if the incident was real but no alert fired, that's an alerting-coverage gap worth flagging.

### Pulling KQL query results

When asked for log data, write a bounded KQL query and run it through the `monitor` namespace's Log Analytics capability:

```kql
AzureDiagnostics
| where TimeGenerated > ago(1h)
| where Level == "Error"
| project TimeGenerated, ResourceId, OperationName, Message
| order by TimeGenerated desc
| take 100
```

Always include a time bound, a `project` to limit columns, and a `take`/`limit`. Report the workspace and time range alongside results so the query is reproducible.

### Triaging Advisor recommendations

1. **`advisor`** — list recommendations for the subscription, then group by category.
2. Sort within each category by impact (High first) and by number of affected resources.
3. Separate **Reliability** and **Security** findings (act soon) from **Cost** and **Operational Excellence** (plan and batch).
4. For each High-impact item, name the affected resources and the recommended action — but remember the connector cannot apply the fix. Report the recommendation; the actual remediation happens through a separate, write-capable path.

### Alert-coverage review

Use `monitor` alerts to list configured alert rules for a subscription, then compare against the critical resources you see via the `group` and `subscription` namespaces. Resources with no alert rule covering availability or error rate are coverage gaps.

## Constraints & caveats

- **Read-only.** Nothing in this skill changes Azure. You can read metrics, logs, health, and recommendations — you cannot acknowledge alerts, apply Advisor fixes, or restart resources. If asked to act on a finding, state that clearly and hand off.
- **Scope.** Most calls need a subscription ID and often a resource ID or resource group — resolve these first via the `subscription` and `group` namespaces (see the `cost-and-capacity` skill).
- **KQL workspace access.** Log Analytics queries require the service principal to have Reader inheritance to the workspace. If a query returns an authorization error, the workspace is outside the granted RBAC scope.
- **Advisor freshness.** Advisor recommendations refresh periodically, not in real time — a recommendation may lag a recent change by hours.
