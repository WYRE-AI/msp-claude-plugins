# Inforcer Plugin

Claude plugins for **Inforcer** — the Microsoft 365 security baseline governance platform used by MSPs to manage policy baselines, measure tenant alignment/drift, and report on security posture across a client portfolio. Conceptually adjacent to CIPP, Inforcer is focused on baseline templates and the drift of each managed tenant against its assigned baseline.

This plugin orients Claude around the Inforcer MCP server exposed through the Wyre MCP Gateway. Skills and agents embed MSP workflow knowledge: how to scope to a tenant, read its alignment/drift against a baseline, roll up portfolio posture, review privileged identity, investigate audit events, and trigger an assessment run.

> **Community-sourced API.** Inforcer publishes **no official public API documentation**. The API surface modelled by this plugin is **community-sourced** from the [`royklo/InforcerCommunity`](https://github.com/royklo/InforcerCommunity) project. Tool names shown here are illustrative of the MCP surface, and endpoint/field shapes may change without notice. Treat everything below as best-effort knowledge derived from that community work, not a vendor contract.

## Scope — read-only, plus one action

This plugin's surface is **read-only governance** with **exactly one write action**: triggering an assessment run (`inforcer_assessments_run`). Everything else lists or reads state.

**Not available via the API (do not expect these):**

- Policy **deployment** / pushing baseline policies to tenants
- **Remediation** of drift
- **Backup / restore** of tenant configuration

These capabilities exist in the Inforcer product UI but are **not exposed through the API**, so this plugin cannot perform them. They appear here only as explicit caveats.

## What's in this plugin

### Skills (7)

| Skill | Tools covered |
|-------|---------------|
| `api-patterns` | gateway headers, upstream auth, base URL, `/beta/` prefix, envelope, pagination, the client-tenant-id gotcha |
| `tenant-management` | `inforcer_tenants_list` |
| `baseline-alignment` | `inforcer_baselines_list`, `inforcer_alignment_scores`, `inforcer_alignment_details`, `inforcer_policies_list` |
| `compliance-reporting` | `inforcer_secure_scores_get`, `inforcer_alignment_scores` |
| `identity-governance` | `inforcer_users_list`, `inforcer_groups_list`, `inforcer_roles_list` |
| `audit-events` | `inforcer_audit_search`, `inforcer_audit_event_types` |
| `assessments` | `inforcer_assessments_list`, `inforcer_assessments_run` |

### Agents (1)

- **`inforcer-drift-reporter`** — pulls alignment details across managed tenants and summarizes drift and posture into a prioritized, portfolio-wide picture (read-only)

### Commands (2)

- **`/inforcer:tenant-posture`** — single-tenant posture snapshot: alignment score, per-policy drift detail, and secure score
- **`/inforcer:drift-report`** — portfolio-wide drift report across all tenants vs their baselines, sorted by drift, with aligned / semi-aligned / drifted classification

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install inforcer
```

The plugin connects to the Inforcer MCP server through Conduit:

```
https://conduit.wyre.ai/v1/inforcer/mcp
```

## Configuration

Your MCP client authenticates to Conduit with OAuth (it prompts you to sign in on first use); there are no environment variables or headers to configure on the client. Connect Inforcer once in the Conduit web UI (**Connections → Inforcer**). Conduit stores both credentials and injects them on every request:

| Field | Required | Notes |
|-------|----------|-------|
| Region | Yes | One of `us`, `uk`, `eu`, `anz`. Selects the regional API host. |
| API Key | Yes | Your Inforcer API key. The MCP server forwards it upstream as the `Inf-Api-Key` header. |

Region is **required**: the upstream base URL is region-specific (`https://api-{region}.inforcer.com/api`), and the MCP server uses it to choose the host.

## The Client Tenant ID gotcha

Inforcer's tenant-scoped API paths take an **integer Client Tenant ID** — **not** the Azure AD tenant GUID and **not** the tenant's domain name.

The MCP server resolves friendly names, DNS domains, and Azure AD GUIDs to the integer Client Tenant ID for you, so you can refer to a tenant naturally. But the underlying path is the integer id. If a tenant-scoped call returns nothing, confirm you are passing a value that resolves to the integer Client Tenant ID rather than a GUID or domain.

## Conduit

Inforcer tools are routed through [Conduit](https://conduit.wyre.ai) and authenticated with the credentials stored on your Inforcer connection. To reach every connected vendor from one endpoint instead, install the `wyre-gateway` plugin.

## Resources

- Inforcer (vendor): https://www.inforcer.com
- Community API project (the source of this plugin's API knowledge): https://github.com/royklo/InforcerCommunity
- Conduit: https://conduit.wyre.ai
