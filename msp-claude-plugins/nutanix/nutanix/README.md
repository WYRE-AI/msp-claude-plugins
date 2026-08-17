# Nutanix Plugin

Claude Code plugin for Nutanix infrastructure management via the Prism
Central v4 APIs.

## Overview

This plugin provides Claude with deep knowledge of the Nutanix v4 API
surface as exposed by Nutanix's official MCP server
([ntnx-api-mcp-server](https://github.com/nutanix/ntnx-api-mcp-server),
pinned v0.8), enabling:

- **VM Management** - Inventory, lookup, and configuration inspection across AHV clusters
- **Cluster Operations** - Cluster/host health, Prism Central tasks, LCM upgrade posture
- **Storage** - Container and volume group capacity, attachment audits, Files/Objects visibility
- **Networking** - Subnet/VPC inventory and Flow Network Security policy review
- **Monitoring & AIOps** - Alert triage, audit trails, capacity runway, VM rightsizing

## How the tool surface works

This is **not** a per-entity CRUD tool catalog. The server exposes:

- **4 discovery tools** — `listOperations`, `getOperationSchema`,
  `getCodeSample`, `getOperationPermissions` — that query an index of
  every available v4 operation
- **Up to 20 namespace executors**, one per v4 API namespace, each named
  `<namespace>_execute` (`vmm_execute`, `clustermgmt_execute`,
  `storage_execute`, `monitoring_execute`, ...)

Every workflow is: `listOperations` (filter by namespace/keyword) →
`getOperationSchema` → `<namespace>_execute` with the operation id and
parameters. Namespaces register only if the connected Prism Central
exposes them.

**Read-only:** the server runs with `READ_ONLY_MODE=true` — all non-GET
operations are blocked server-side. This plugin's workflows are
inventory, health, audit, and capacity analysis; changes are delivered
as recommendations with code samples for operator execution.

## Prerequisites

### Connection

Nutanix connects through the [WYRE Conduit gateway](https://conduit.wyre.ai).
Credentials are configured **in the gateway UI**, not on your machine —
there are no local environment variables for this plugin. When
connecting the Nutanix vendor in Conduit you provide:

- **Prism Central host** (IP or FQDN; port 9440 unless overridden)
- **Username + password** for a Prism Central account, **or** an
  **API key** (sent upstream as `X-ntnx-api-key`)

The credential's Nutanix RBAC role bounds what every call can see. Use
a Viewer-class account where read-only analysis is all you need.

### Prism Central

- A Prism Central deployment reporting a v4 API
  (`https://<pc-host>:9440/api/prism/unversioned/info` returns `"data": "v4.x"`)
- Optional services (Files, Objects, Flow/microseg, AIOps features)
  surface their namespaces only where deployed and licensed

## Installation

### Via MCP Gateway (Recommended)

Use the [MCP Gateway](https://conduit.wyre.ai) to connect — enter your
Prism Central host and credentials in the connection form and you're
done.

### Self-Hosted

Run the official [ntnx-api-mcp-server](https://github.com/nutanix/ntnx-api-mcp-server)
behind the self-hosted [mcp-gateway](https://github.com/wyre-technology/mcp-gateway).
See the [MCP Gateway documentation](https://mcp.wyre.ai) for setup.

## Available Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | The discovery→schema→execute workflow, gateway auth, OData parameters, read-only mode |
| `vm-management` | VM inventory and configuration via the vmm namespace |
| `cluster-operations` | Clusters, hosts, Prism Central tasks, LCM posture |
| `storage` | Containers, volume groups, Files and Objects capacity |
| `networking` | AHV networking inventory and Flow security policy review |
| `monitoring-aiops` | Alerts, events, audits, capacity planning, rightsizing |

## Available Commands

| Command | Description |
|---------|-------------|
| `/find-vm` | Find a VM by name and show its configuration |
| `/vm-inventory` | Full VM estate listing with sizing and power state |
| `/cluster-health` | Node, alert, and failed-task health check per cluster |
| `/capacity-report` | AIOps capacity runway and VM rightsizing report |
| `/storage-usage` | Container and volume group utilization report |

## Available Agents

| Agent | Description |
|-------|-------------|
| `nutanix-infra-expert` | Deep Prism Central v4 API navigator — discovery-driven investigation across all namespaces |
| `nutanix-capacity-planner` | Capacity runway, rightsizing, and refresh planning specialist |

## Quick Start

### Check cluster health

```
/cluster-health
```

### Find a VM

```
/find-vm --vm_name "web-prod-01"
```

### Build a capacity report

```
/capacity-report --cluster_name "prod-east"
```

## Security Considerations

- Credentials live only in the Conduit gateway; rotate them there by
  re-submitting the connection form after rotating in Prism Central
- The upstream server enforces read-only mode server-side — no write
  reaches Prism Central through this integration
- Scope the Prism Central account to the minimum RBAC role needed;
  `getOperationPermissions` documents per-operation requirements
- See `GOVERNANCE.md` for the full safety model
