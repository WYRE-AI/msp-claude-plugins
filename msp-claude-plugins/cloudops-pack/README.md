# Cloud & Network Infrastructure (`cloudops-pack`)

Cross-vendor network and cloud infrastructure operations for MSPs — device
and network health, capacity planning, and cost management, all cross-vendor,
wired to whatever network-monitoring tools and cloud platforms you have
connected through the WYRE MCP Gateway / [Conduit](https://conduit.wyre.ai).

This is a **workflow pack**, not a vendor plugin: it doesn't teach any single
tool's API. It bundles the judgment layer — health normalization across
different device models, capacity-vs-variance discipline, cost-anomaly
detection — on top of whatever infrastructure data your connected tools
return.

This pack is about the **infrastructure substrate itself**: is the network
healthy, is capacity adequate, is cloud spend under control. It does not
manage tickets, and it does not reason about application code or deploys —
see the Boundary section below for how it relates to the other packs in this
marketplace.

## What it needs connected

`cloudops-pack` connects through Conduit and works with **partial
coverage** — it discovers what's actually connected at run time (via
`conduit__search_tools`) rather than assuming a fixed stack. It gets more
useful the more of the following you have connected, but none of them are
individually required:

- **Network monitoring** — Auvik, Meraki, Domotz
- **Cloud platforms** — Azure (via Azure MCP), DigitalOcean (Droplets,
  Kubernetes/DOKS, Databases, Networking, and related services)

A client with only a network-monitoring tool connected still gets a useful
network health sweep, even with no cloud platform connected — the pack
reports what it can verify and calls out, explicitly, what it can't. The
same holds in reverse for cloud-only environments.

## What's in it

**Skills**
- `network-health-sweep` — device-down detection, interface error/utilization
  thresholds, and topology-change detection, normalized across Auvik's
  device/interface model, Meraki's dashboard-org/network model, and Domotz's
  agent-based collector model
- `cloud-capacity-planning` — right-sizing and growth-trend-based capacity
  forecasting for Azure and DigitalOcean resources, and how to tell a
  genuine capacity risk from normal variance
- `cloud-cost-management` — spend-anomaly detection and orphaned/idle
  resource discovery (unattached volumes, idle load balancers,
  stopped-but-not-deallocated compute), plus how to build a monthly cost
  trend view from whatever billing/usage data is exposed

**Agents**
- `network-health-auditor` — portfolio-wide network health sweep across all
  connected network-monitoring tools, ranked by severity
- `capacity-forecaster` — cloud capacity forecast across connected cloud
  platforms, flagging resources approaching capacity limits with a forecast
  timeline
- `cost-anomaly-detector` — cloud cost anomalies and reclaimable spend,
  ranked by dollar impact

**Commands**
- `/cloudops-pack:network-sweep` — full network health sweep (no arguments)
- `/cloudops-pack:capacity-check [resource_type]` — capacity forecast, scoped
  to a resource type (`compute`, `storage`, `database`) or everything
  (default: all)
- `/cloudops-pack:cost-report [window]` — cost anomaly report for a time
  window (default `30d`)

## Boundary: how this differs from the other packs

This marketplace has several packs that can sound adjacent at a glance.
Here's the explicit split:

**vs. `ops-pack` (MSP Operations)** — `ops-pack` is service-desk/ticket
focused: board health, dispatch prioritization, SLA monitoring, and shift
handoffs against whatever PSA you have connected. It answers "is the queue
under control." `cloudops-pack` doesn't touch tickets or PSAs at all — it
answers "is the infrastructure itself healthy," independent of whether
anyone has filed a ticket about it. A down switch that nobody has reported
yet is exactly the kind of finding `cloudops-pack` surfaces that `ops-pack`
has no visibility into.

**vs. `devops-pack` (if connected in your marketplace)** — `devops-pack` is
application-layer: incident response, deploy health, and SLO/reliability
tracking for the software running on top of the infrastructure.
`cloudops-pack` is the substrate underneath that software — the network
fabric and the cloud resources (compute, storage, database, Kubernetes
nodes) themselves. A `devops-pack` finding might be "the checkout service's
error-rate SLO is burning fast"; a `cloudops-pack` finding is "the database
node backing it is trending toward a storage capacity wall" or "the uplink
to that region's load balancer is dropping packets." The two packs compose
well together on the same incident, but neither duplicates the other:
`cloudops-pack` doesn't reason about application code, deploy pipelines, or
service-level objectives, and `devops-pack` doesn't reason about network
topology, cloud quota, or infrastructure spend.

**vs. individual vendor plugins** (`auvik`, `meraki`, `domotz`, `azure-mcp`)
— for deep, single-vendor API work (e.g. pulling a specific Auvik interface
statistic, reviewing a specific Meraki firewall rule set), use the vendor
plugin directly. `cloudops-pack` deliberately does not duplicate any single
vendor's deep API surface — it composes across whatever subset of these
you have connected into one normalized view.

## Install

```
/plugin marketplace add wyre-technology/msp-claude-plugins
/plugin install cloudops-pack@msp-claude-plugins
```

On first use, Claude Code will prompt to connect the `conduit` MCP server
(`https://conduit.wyre.ai/v1/mcp`). Connect at least one network-monitoring
tool or cloud platform through Conduit before running any command in this
pack.

## Related

- [wyre-gateway](../wyre-gateway) — the underlying multi-vendor gateway
  plugin these packs are built on top of
- Individual vendor plugins (`auvik`, `meraki`, `domotz`, `azure-mcp`) — for
  deep, single-vendor API work this pack deliberately does not duplicate
- [ops-pack](../ops-pack) — service-desk/ticket operations, not
  infrastructure health

## License

Apache-2.0
