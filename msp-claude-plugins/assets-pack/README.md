# IT Asset Lifecycle (`assets-pack`)

Cross-vendor IT asset lifecycle management for MSPs — warranty tracking,
end-of-life/end-of-support (EOL/EOS) flagging, and hardware refresh-cycle
planning, all cross-vendor, wired to whatever RMM platforms and
documentation tools you have connected through the WYRE MCP Gateway /
[Conduit](https://conduit.wyre.ai).

This is a **workflow pack**, not a vendor plugin: it doesn't teach any
single tool's API. It bundles the judgment layer — warranty-data reliability
grading, EOL/EOS risk classification weighted by device criticality, and
tiered refresh-cycle planning — on top of whatever device-lifecycle data
your connected RMM(s) and documentation tools return.

This pack is about the **physical/endpoint hardware itself**: is a device's
warranty about to lapse, is it running an OS or firmware past
end-of-support, and when should it realistically be replaced. It does not
manage network or cloud infrastructure, and it does not manage tickets —
see the Boundary section below for how it relates to the other packs in
this marketplace.

## What it needs connected

`assets-pack` connects through Conduit and works with **partial
coverage** — it discovers what's actually connected at run time (via
`conduit__search_tools`) rather than assuming a fixed stack. It gets more
useful the more of the following you have connected, but none of them are
individually required:

- **RMM platforms (device-lifecycle data)** — Datto RMM, NinjaOne,
  N-central, Kaseya VSA, ConnectWise Automate, Atera, SuperOps, Syncro,
  Action1, ImmyBot
- **Documentation platforms (warranty-data fallback)** — IT Glue, Hudu, for
  manually-documented asset/warranty records when RMM data is incomplete or
  stale

A client with only one RMM connected still gets a useful warranty and
EOL/EOS sweep, even with no documentation platform connected — the pack
reports what it can verify from the RMM alone and calls out, explicitly,
what it can't. IT Glue/Hudu are a fallback source for gaps, not a
requirement — RMM device inventory is always the primary source of truth
for "what devices exist."

## What's in it

**Skills**
- `warranty-tracking` — pulling and normalizing warranty status across
  connected RMMs' device inventories (different RMMs expose warranty with
  different completeness/reliability — some resolve it from an OEM API,
  some rely on manually-entered fields that go stale), flagging expired and
  soon-expiring devices, and cross-referencing IT Glue/Hudu when RMM
  warranty data is missing
- `eol-eos-flagging` — identifying devices, OS versions, and firmware
  approaching or past end-of-life/end-of-support, combining live device
  inventory (make/model/OS version) with general knowledge of common
  EOL/EOS dates (always caveated — verify against current vendor lifecycle
  pages, since dates change), and prioritizing risk by device criticality
- `refresh-cycle-planning` — building a forward-looking hardware refresh
  calendar from warranty expiration + EOL/EOS timing + device age, and
  bucketing devices into replace-now / plan-this-year / monitor tiers so
  refresh conversations happen proactively, not after a failure

**Agents**
- `warranty-status-auditor` — portfolio-wide (or single-client) warranty
  report across all connected RMM/documentation tools, ranked by urgency
- `eol-risk-assessor` — devices at EOL/EOS risk across all connected RMMs,
  prioritized by criticality
- `refresh-planner` — forward-looking refresh calendar with
  replace-now/plan-this-year/monitor tiers

**Commands**
- `/assets-pack:warranty-status [client]` — warranty status snapshot for
  one client or the whole portfolio (omit `client` for portfolio-wide)
- `/assets-pack:eol-report [client]` — EOL/EOS risk report for one client
  or the whole portfolio (omit `client` for portfolio-wide)
- `/assets-pack:refresh-calendar [window]` — forward-looking refresh
  calendar for the given window (default `12mo`)

## Boundary: how this differs from the other packs

This marketplace has several packs that can sound adjacent at a glance.
Here's the explicit split:

**vs. `cloudops-pack` (Cloud & Network Infrastructure)** — this is the
closest sibling pack, and the two are easy to conflate because both draw on
RMM/monitoring data. The split is physical/endpoint hardware vs.
network/cloud substrate:

- `cloudops-pack` answers "is the network healthy right now" and "is
  capacity/spend under control" — device-up/down state, interface errors,
  topology changes, cloud resource right-sizing and cost, across network
  monitoring tools (Auvik, Meraki, Domotz) and cloud platforms (Azure,
  DigitalOcean). It is about the *operational state* of network and cloud
  infrastructure, checked continuously.
- `assets-pack` answers "is this physical device's warranty about to lapse"
  and "is this device's OS/firmware past end-of-support" and "when should
  we budget to replace it" — across RMM device inventories. It is about the
  *lifecycle state* of endpoint hardware, checked on a planning cadence.

A concrete example: "is this switch's firmware past end-of-life" is
`assets-pack` (a lifecycle/support question about the device itself). "Is
this network segment healthy right now, and is that switch dropping
packets" is `cloudops-pack` (an operational-state question). The same
physical device can show up in both packs' reports for entirely different
reasons — `cloudops-pack` because it's misbehaving right now,
`assets-pack` because its firmware support clock is running out — and
neither pack duplicates the other's judgment.

**vs. `ops-pack` (MSP Operations)** — `ops-pack` is service-desk/ticket
focused: board health, dispatch prioritization, SLA monitoring, and shift
handoffs against whatever PSA you have connected. It answers "is the queue
under control." `assets-pack` doesn't touch tickets or PSAs at all — it
answers "what does the hardware itself need," independent of whether
anyone has filed a ticket about it. A laptop three weeks from warranty
expiration that nobody has reported a problem with yet is exactly the kind
of finding `assets-pack` surfaces that `ops-pack` has no visibility into.

**vs. individual RMM vendor plugins** (`datto-rmm`, `ninjaone`, `ncentral`,
etc.) — several RMM plugins expose device-lifecycle primitives directly
(for example, N-central's `ncentral_get_device_lifecycle` /
`ncentral_update_device_lifecycle` tools, which read and write a single
device's warranty/purchase/replacement-date record). Those are per-vendor
data primitives. `assets-pack` deliberately does not duplicate any single
vendor's device-listing or lifecycle-record skill — it normalizes and acts
across whichever RMM(s) an org actually has connected, applies the same
warranty-reliability grading and EOL/EOS criticality weighting regardless
of which RMM the data came from, and composes IT Glue/Hudu fallback data on
top. For deep, single-vendor lifecycle-field work (e.g. bulk-stamping
warranty dates from a vendor export into N-central), use the vendor plugin
directly.

## Install

```
/plugin marketplace add wyre-technology/msp-claude-plugins
/plugin install assets-pack@msp-claude-plugins
```

On first use, Claude Code will prompt to connect the `conduit` MCP server
(`https://conduit.wyre.ai/v1/mcp`). Connect at least one RMM platform
through Conduit before running any command in this pack; connect IT
Glue/Hudu as well for warranty-data fallback coverage.

## Related

- [wyre-gateway](../wyre-gateway) — the underlying multi-vendor gateway
  plugin these packs are built on top of
- Individual RMM vendor plugins (`datto-rmm`, `ninjaone`, `ncentral`,
  `kaseya-vsa`, `atera`, `superops`, `syncro`, `immybot`) — for deep,
  single-vendor device/lifecycle-field work this pack deliberately does not
  duplicate
- [cloudops-pack](../cloudops-pack) — network/cloud infrastructure
  operational health, not endpoint hardware lifecycle
- [ops-pack](../ops-pack) — service-desk/ticket operations, not asset
  inventory

## License

Apache-2.0
