---
name: "Acronis API Patterns"
description: >
  Acronis Cyber Protect Cloud MCP fundamentals through Conduit: the three
  `X-Acronis-*` headers (data center URL, API client ID and secret), the
  partner → customer → unit tenant hierarchy and what an API client can see,
  the 37-tool surface (34 reads plus 3 writes that are off by default, one of
  them admin-only in Conduit), the `path` / `query` / `body` argument shape,
  the different pagination styles per API family, filter operator syntax,
  nanosecond alert timestamps, response size caps, and the error shape.
when_to_use: >-
  When connecting to Acronis through Conduit, building any Acronis tool call,
  paging through Acronis results, or diagnosing a failed Acronis call. Use
  when: acronis api, acronis authentication, acronis api client, acronis data
  center url, acronis pagination, acronis error, acronis mcp, acronis tools,
  or upstream_unavailable.
---

# Acronis MCP Tools & API Patterns

## Overview

Acronis Cyber Protect Cloud is a multi-tenant backup, disaster recovery and
endpoint protection platform. MSPs run it as a partner tenant with one
customer tenant per client. The Conduit connector wraps Acronis's own MCP
server and exposes a curated set of 37 tools. Tool names are `acronis_` plus
the Acronis operation name, such as `acronis_fetch_all_alerts`.

## Connection & Authentication

Conduit sends three headers to the Acronis connector:

| Header | Conduit field | Value |
|--------|---------------|-------|
| `X-Acronis-Base-Url` | Data center URL | The data center Acronis shows when you create the API client, such as `https://us5-cloud.acronis.com`. Origin only: nothing after `.com`. |
| `X-Acronis-Client-Id` | Client ID | The API client's ID |
| `X-Acronis-Client-Secret` | Client Secret | The API client's secret |

For the plugin's `.mcp.json`, export them as environment variables:

```bash
export ACRONIS_BASE_URL="https://us5-cloud.acronis.com"
export ACRONIS_CLIENT_ID="your-api-client-id"
export ACRONIS_CLIENT_SECRET="your-api-client-secret"
```

How to get them:

1. In the Acronis management portal, open **Settings → API clients**.
2. Create an API client. Copy the Client ID, the Secret and the data center
   URL that Acronis shows. The secret is only shown once.
3. Don't use your Acronis portal email and password. Conduit needs an API
   client, which signs in with the OAuth `client_credentials` flow.

When you connect, Conduit checks the data center URL (it must be `https` on an
`acronis.com` host) and does a real token exchange with Acronis, so a wrong
secret or the wrong data center fails at connect time, not on the first tool
call.

### What the connection can see

- Everyone in your Conduit org shares this one connection.
- The API client sees only the tenant that owns it and the tenants under it.
  An API client created in the partner tenant sees every customer. One created
  inside a customer tenant sees only that customer.

## Tenant Hierarchy

```
Partner (the MSP) → [Folder] → Customer (a client) → [Unit]
```

Almost every read filters by a tenant UUID. The parameter name differs by API
family, which is the most common source of empty results:

| API family | Tenant parameter |
|-----------|------------------|
| Account management (tenants, users, usage, MFA) | `tenant_id` in `path`, or `parent_id` / `subtree_root_id` / `uuids` in `query` |
| Alerts | `tenant` (an array) in `query`; per-customer tools use `customer_id` |
| Policies, resources, protection status | `tenant_id` in `query` |
| Agents | `tenant_id` in `query`, meaning a subtree root |
| EDR incidents | `customer_id` in `query` |

## Tool Surface

All tools are listed directly. There is no navigation step.

| Area | Tools |
|------|-------|
| Tenants and users | `acronis_fetch_tenant`, `acronis_fetch_tenants_batch`, `acronis_fetch_tenant_children`, `acronis_fetch_tenant_users`, `acronis_fetch_users_batch`, `acronis_fetch_user`, `acronis_fetch_current_user_info`, `acronis_search`, `acronis_fetch_tenant_mfa_status`, `acronis_fetch_tenant_usages` |
| Alerts | `acronis_fetch_all_alerts`, `acronis_fetch_alert`, `acronis_fetch_categories`, `acronis_fetch_alert_counters`, `acronis_fetch_alerts_grouped_by_scope`, `acronis_fetch_all_alert_types`, `acronis_fetch_resources_with_top_severity_alerts`, `acronis_fetch_alert_counts_per_customer`, `acronis_fetch_alerts_grouped_per_customer`, `acronis_fetch_active_alert_count` |
| Protection policies (protection plans) | `acronis_fetch_policies`, `acronis_fetch_policy`, `acronis_fetch_policy_applications`, `acronis_fetch_applications_issue_statistics`, `acronis_fetch_application_statuses_by_policy` |
| Resources (machines, mailboxes, workloads) | `acronis_fetch_resources`, `acronis_fetch_resource_count`, `acronis_fetch_resource`, `acronis_fetch_resource_protection_status` |
| Agents | `acronis_fetch_agents`, `acronis_fetch_agent` |
| EDR incidents | `acronis_fetch_incidents`, `acronis_fetch_incident`, `acronis_fetch_response_action_status` |
| Writes (off by default) | `acronis_mark_alert_as_false_positive`, `acronis_update_investigation_state`, `acronis_execute_protection_policy` |

### Writes and Conduit permission tiers

The three write tools are **off by default**. They don't appear in the tool
list until WYRE turns writes on for the Acronis connector. When they are on,
Conduit gates them by permission tier:

| Tool | Conduit tier | What it changes |
|------|--------------|-----------------|
| All 34 reads | read | Nothing |
| `acronis_mark_alert_as_false_positive` | write | Sets or clears the false-positive flag on an alert, for everyone in Acronis |
| `acronis_update_investigation_state` | write | Changes an EDR incident's investigation state or adds a comment |
| `acronis_execute_protection_policy` | **admin** | Runs a protection plan now on every machine it covers, starting backup or protection jobs |

If a write tool is missing from the tool list, writes are off. Say so plainly
and give the operator the console path instead of looking for a workaround.

### Not available through this connector

Creating or deleting tenants, users or API clients, any delete, pricing and
offering items, registration tokens, branding, and starting EDR response
actions (such as isolating a machine) are not exposed at all. Reading the
status of a response action that was started in the console is available
through `acronis_fetch_response_action_status`.

## Argument Shape

Arguments are grouped the way the Acronis REST API groups them: `path` for
URL path parameters, `query` for query-string filters, and `body` for write
payloads. A few tools also take `headers`.

```json
{
  "path": { "tenant_id": "0f8fad5b-d9cb-469f-a165-70867728950e" },
  "query": { "embed_path": true }
}
```

Tenant, user and policy IDs are lowercase UUIDs. Several filters take a
comma-separated list of up to 100 UUIDs in one string, such as `uuids` on
`acronis_fetch_tenants_batch` and `tenant_id` on `acronis_fetch_resources`.

## Pagination

Each Acronis API family pages differently. Check for a next cursor before you
say a list is complete.

| Tools | How to page |
|-------|-------------|
| `acronis_fetch_tenants_batch`, `acronis_fetch_users_batch`, `acronis_fetch_tenant_children` | `limit` plus `after`. Read the next cursor from `paging.cursors.after`. The cursor carries the filters, so pass only `after` on later pages. |
| `acronis_fetch_policies`, `acronis_fetch_policy_applications`, `acronis_fetch_application_statuses_by_policy`, `acronis_fetch_resources`, `acronis_fetch_resource_protection_status` | `limit` plus `after` / `before` cursors |
| `acronis_fetch_agents` | `limit` plus `after` / `before`. Leaving `limit` out or setting it to 0 returns every agent, which can hit the response size cap. |
| `acronis_fetch_incidents` | `limit` plus `cursor`. Every other filter and the sort order must stay exactly the same between pages. |
| `acronis_fetch_all_alerts` | No cursor. `limit` caps the result. Narrow with filters (`tenant`, `category`, `severity`, `created_at`) and use `skip` to leave out alert IDs you've already seen. |

For counts, use the count tools instead of paging: `acronis_fetch_resource_count`,
`acronis_fetch_alert_counters`, `acronis_fetch_alert_counts_per_customer` and
`acronis_fetch_active_alert_count`.

## Filter Syntax

- **Alerts** use operator functions: `severity: "or(warning,critical)"`,
  `severity: "gt(warning)"`, `planName: ["eq(Daily backup)"]`. A bare
  `planName` or `resourceName` value matches a substring. IDs passed with
  `or(...)` match exactly.
- **Alert timestamps** (`created_at`, `updated_at`, `deleted_at`) are Unix
  time in **nanoseconds**, with an operator:
  `created_at: "gt(1793491200000000000)"` means after 2026-11-01 00:00 UTC.
  Seconds or milliseconds silently match nothing useful.
- **EDR incidents** use `range(date_from, date_to)` and `ge(date_from)` for
  `created_at` / `updated_at`, and `or(a,b)` for `state`, `severity` and
  `mitigation_state`.
- **Policies and resources** take a `search` string with an SQL-like syntax
  over name, type and tags.

## Errors

The connector returns errors as JSON:

```json
{ "error": { "code": "upstream_unavailable", "message": "..." } }
```

Messages are capped at 500 characters and never contain the client secret.

| Symptom | Cause | What to do |
|---------|-------|-----------|
| `upstream_unavailable` | The connector could not start a session with Acronis: the API client was disabled or its secret rotated, or the data center can't be reached | Re-check the API client under Settings → API clients and reconnect Acronis in Conduit |
| HTTP 401 from Conduit before any Acronis call | A header is missing, or the data center URL is not `https` on `acronis.com` | Reconnect with the data center URL Acronis showed for the API client |
| 403 from Acronis | The tenant is outside the API client's tenant | Use a tenant under the API client's tenant, or create the API client higher up |
| 404 from Acronis | Wrong ID, or the wrong ID type (a resource ID where an agent ID belongs) | Re-list from the parent and retry |
| 429 from Acronis | Acronis is throttling the API client | Wait and retry. Use count tools for fleet-wide sweeps. |

Conduit doesn't document a fixed Acronis rate limit for this connector. The
first call after a quiet period is slower because the connector signs in to
Acronis again.

## Response Size

Each tool result is capped at about 100 KB. A larger result is cut off with a
truncation marker. When you see one, the data is incomplete: lower `limit`,
add filters, or page. Don't summarize a truncated result as if it were the
whole set.

## Related Skills

- [backup-health](../backup-health/SKILL.md) - Alert-driven backup triage across customers
- [protection-coverage](../protection-coverage/SKILL.md) - Unprotected machines, plan issues and agent hygiene
- [edr-incidents](../edr-incidents/SKILL.md) - EDR incident review and investigation state
- [tenants-and-usage](../tenants-and-usage/SKILL.md) - Customer mapping, usage, users and MFA posture
