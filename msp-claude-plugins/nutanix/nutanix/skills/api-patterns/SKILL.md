---
name: "Nutanix API Patterns"
description: >
  Nutanix MCP fundamentals: the discovery-driven tool surface (4 discovery
  tools plus one `<namespace>_execute` tool per v4 API namespace — not
  per-entity CRUD tools), the listOperations → getOperationSchema →
  execute workflow, Conduit gateway credential configuration for Prism
  Central, OData query parameters, the read-only enforcement mode, and
  namespace availability rules.
when_to_use: >-
  When authenticating to or calling Nutanix Prism Central through the MCP
  tools, or when discovering which Nutanix operation to run. Use when:
  nutanix api, prism central api, nutanix authentication, nutanix mcp,
  nutanix tools, listOperations, getOperationSchema, namespace execute,
  nutanix odata, nutanix filter, or nutanix read-only.
---

# Nutanix MCP Tools & API Patterns

## Overview

The Nutanix integration is backed by Nutanix's official v4 API MCP server
([ntnx-api-mcp-server](https://github.com/nutanix/ntnx-api-mcp-server),
pinned at v0.8), reached through the WYRE Conduit gateway. It exposes the
Prism Central v4 REST APIs — Nutanix's management plane for multi-cluster
infrastructure.

The tool surface is **not** a flat catalog of per-entity CRUD tools. It is:

- **4 discovery tools** that query an in-memory index of every available
  operation (no Nutanix API call is made)
- **Up to 19 namespace executor tools**, one per v4 API namespace, each
  named `<namespace>_execute` (e.g. `vmm_execute`, `clustermgmt_execute`,
  `networking_execute`)

Every real API call goes through an executor tool with an `operation` id
you found via discovery. If you guess operation ids or invent tool names
like a hypothetical `nutanix_list_vms`, calls fail — discover first.

## The canonical workflow

Every Nutanix task follows the same three steps:

1. **`listOperations`** — find the operation. Filter by `namespace`
   (e.g. `vmm`) and/or `search` keyword (e.g. `search="list vms"`).
   Supports `limit` and `offset` pagination.
2. **`getOperationSchema`** — get the full contract for the chosen
   `operation` id: parameters, HTTP method, path, request/response shape.
   Never call an executor without checking the schema first; required
   path parameters (usually `extId`) are not guessable.
3. **`<namespace>_execute`** — run it, passing the `operation` id plus
   the parameters the schema requires.

Two more discovery tools round out the surface:

- `getCodeSample` — language-specific sample (`python`, `curl`, ...) for
  an operation, useful when handing a runbook to a human.
- `getOperationPermissions` — the Nutanix RBAC roles an operation
  requires. Check this before diagnosing a 403 as a credential problem.

## Connection & Authentication

Credentials are configured **in the Conduit gateway UI**, not on the
technician's machine and not via local environment variables. When
connecting the Nutanix vendor in Conduit you supply:

| Field | Value |
|-------|-------|
| Prism Central host | IP or FQDN of the Prism Central instance (port 9440 unless overridden) |
| Username + password | A Prism Central account — one auth method, not both |
| API key | Alternative to username/password; sent upstream as `X-ntnx-api-key` and takes priority if both are set |

Conduit holds the credential and injects it per request; the MCP server
translates it to the upstream Prism Central auth format. Nothing is
stored in this repo, on disk, or in model context. See `GOVERNANCE.md`.

The credential's Nutanix RBAC role bounds what every operator can see —
a Viewer credential cannot be widened from the client side, and
`getOperationPermissions` tells you which role each operation needs.

## Read-only mode

The server runs in **read-only mode** (`READ_ONLY_MODE=true`): all
non-GET operations are blocked server-side before any API call is made.
In this deployment (v1) that is not configurable from the client.

- Discovery still lists POST/PUT/PATCH/DELETE operations — the index
  covers the whole API — but executing them returns a structured
  "blocked by read-only mode" error, not a permissions error.
- Do not promise or plan write workflows (create VM, delete snapshot,
  trigger failover, run upgrade). Offer the read-side equivalent:
  inventory, health, capacity, and audit queries, plus a
  `getCodeSample` handoff so a human can run the write step in their
  own tooling.

## Executor call shape

Every `<namespace>_execute` tool takes:

| Parameter | Type | Description |
|-----------|------|-------------|
| `operation` | string (required) | Operation id from `listOperations` |
| `request_body` | object | JSON body for POST/PUT/PATCH — irrelevant under read-only mode |

List/search operations additionally accept OData query parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `_filter` | string | OData `$filter` expression, e.g. `name eq 'my-vm'` |
| `_limit` | integer | Max results, 1–100 |
| `_page` | integer | Page offset, 0-based |
| `_orderby` | string | OData `$orderby` expression |
| `_select` | string | OData `$select` expression |
| `_expand` | string | OData `$expand` expression |

Pagination pattern: request with `_limit=100`, walk `_page` upward until
a page comes back short. Never claim an inventory is complete from page
0 alone.

## Namespace availability

Namespaces are registered from artifacts fetched from the connected
Prism Central — only namespaces that PC version exposes get an executor
tool. A missing `<namespace>_execute` tool means that service is not
deployed or not exposed on the connected PC; it is expected behavior,
not an error. Confirm what is actually available with
`listOperations` before promising coverage.

See [REFERENCE.md](REFERENCE.md) for the full 19-namespace table and
what each namespace covers.

## Error handling

| Symptom | Meaning | Action |
|---------|---------|--------|
| Read-only block error | Operation is non-GET | Stay read-side; offer `getCodeSample` instead |
| 401 | Credential invalid/expired | Re-submit the connection in the Conduit gateway UI |
| 403 | Credential lacks the required RBAC role | Check `getOperationPermissions`; fix the role in Prism Central |
| 404 on operation id | Operation not in the index | Re-run `listOperations`; the namespace may be absent on this PC |
| Validation error on call | Payload doesn't match the contract; unknown fields are rejected | Re-check `getOperationSchema` — do not retry blind |

## Best Practices

- Filter server-side with `_filter` before filtering client-side — the
  v4 APIs are OData-capable and clusters can host thousands of VMs.
- Use `_select` to trim large entities when you only need a few fields.
- Cache discovery results within a session; `listOperations` and
  `getOperationSchema` are index lookups, but their output rarely
  changes mid-session.
- Entity identifiers in the v4 APIs are `extId` UUIDs. Resolve
  human-readable names to `extId` via a list operation with a `_filter`
  before any get-by-id call.

## Related Skills

- [vm-management](../vm-management/SKILL.md) — vmm namespace workflows
- [cluster-operations](../cluster-operations/SKILL.md) — clustermgmt, lifecycle, prism
- [storage](../storage/SKILL.md) — storage, volumes, objects, files
- [networking](../networking/SKILL.md) — networking, microseg
- [monitoring-aiops](../monitoring-aiops/SKILL.md) — monitoring, aiops
