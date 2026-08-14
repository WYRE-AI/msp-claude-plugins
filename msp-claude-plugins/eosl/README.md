# EOSL Hardware Lifecycle (`eosl`)

Hardware end-of-service-life (EOSL) lookups for MSPs, backed by the
**public [EOSL.ai](https://eosl.ai) MCP server** — a free, read-only,
no-auth hardware-lifecycle data service. This plugin orients Claude around
the EOSL.ai tools so you can check a single part, search a product family,
or audit a whole client inventory for renewal and migration planning.

> **Third-party service — not WYRE-operated, not a WYRE endorsement.** These
> skills query the **public EOSL.ai endpoint** (`https://eosl.ai/mcp`). The
> service is new and its operator is anonymous; treat it as one convenient
> data source, not authoritative fact. Every EOSL record links a vendor
> bulletin — confirm any date against that bulletin before a purchase,
> renewal, or migration decision. The connector is a single `.mcp.json`
> entry, deliberately easy to swap for another data source or remove.

> **Privacy note.** Running any skill in this plugin **sends the part
> numbers / models you look up to EOSL.ai, a third party.** Don't submit
> data you're not comfortable disclosing to an external service.

## What's in this plugin

### Skills (3)

| Skill | Canonical id | Coverage |
|-------|--------------|----------|
| `lookup` | `eosl-lookup` | Single-part and product-family EOSL lookups — status, end-of-sale date, EOSL date, support-runway score, and the vendor-bulletin link. Wraps the individual-part-lookup and product-family-search tools. |
| `hardware-lifecycle-audit` | `eosl-hardware-lifecycle-audit` | Takes a client hardware inventory (list or CSV), runs the bulk-check tool in batches of 200, and produces a prioritized renewal/migration report: already past EOSL, approaching within a configurable window (default 12 months), each with its vendor-bulletin URL. |
| `psa-lifecycle-audit` | `eosl-psa-lifecycle-audit` | **Documented workflow scaffold** wiring EOSL data to PSA asset/configuration records (Autotask, ConnectWise PSA): pull assets → run the lifecycle audit → flag renewals. The PSA-pull step is a marked integration point / TODO. |

This plugin ships **no agents or commands** — it is a data-source plugin;
the judgment layer for cross-vendor fleet lifecycle work already lives in
`assets-pack`, which this plugin complements rather than replaces (see
Boundary below).

## The EOSL.ai tool surface

EOSL.ai exposes **five read-only tools**. Tool names are described here at
the capability level; confirm the exact registered names in the tool list
your session shows after connecting, as they may differ from the labels
below.

| Capability | Referred to here as | What it returns |
|------------|--------------------|-----------------|
| Individual part lookup | `eosl__lookup_part` | Status + end-of-sale + EOSL date + support-runway score + vendor-bulletin URL for one part/model |
| Bulk inventory check (≤ 200 items) | `eosl__bulk_check` | The same record set for up to 200 items in one call |
| Product-family search | `eosl__search_families` | Families matching a vendor/series query |
| Full family lifecycle | `eosl__get_family_lifecycle` | Complete lifecycle records for a product family |
| Vendor directory | `eosl__list_vendors` | Vendors the service has data for |

Every record carries: `status`, `end-of-sale date`, `EOSL date`,
`support-runway score`, and a `vendor-bulletin` source URL.

## Install

```
/plugin marketplace add wyre-technology/msp-claude-plugins
/plugin install eosl@msp-claude-plugins
```

On first use, Claude Code prompts to connect the `eosl` MCP server
(`https://eosl.ai/mcp`) — a public, no-auth HTTP endpoint. If you prefer to
wire it manually instead of via the bundled `.mcp.json`:

```
claude mcp add --transport http eosl https://eosl.ai/mcp
```

To remove or swap the data source, delete (or repoint) the single
`mcpServers.eosl` entry in this plugin's `.mcp.json`.

## Boundary: how this differs from `assets-pack`

- **`assets-pack`** is the cross-vendor judgment layer — it discovers
  whatever RMM(s) you have connected through Conduit, pulls live device
  inventory, and applies warranty/EOL-EOS/criticality reasoning from general
  knowledge (always caveated). It answers "across my connected fleet, what
  needs attention," and does **not** depend on EOSL.ai.
- **`eosl`** is a single external **data source**: it turns a part number or
  a supplied inventory list into concrete, vendor-bulletin-sourced EOSL
  records via the EOSL.ai MCP. It doesn't discover RMMs and doesn't grade
  criticality.

They compose: `assets-pack` finds the devices and ranks the risk; `eosl`
supplies authoritative-per-vendor-bulletin EOSL dates for the specific
parts/models involved. Use `eosl` when you have a part number or an
inventory list and want sourced dates; use `assets-pack` when you want a
criticality-weighted sweep of a connected fleet.

## Related

- [assets-pack](../assets-pack) — cross-vendor asset lifecycle judgment
  layer (warranty, EOL/EOS, refresh planning) over connected RMMs
- [autotask](../kaseya/autotask) and
  [connectwise/manage](../connectwise/manage) — PSA plugins the
  `psa-lifecycle-audit` workflow wires against for asset/configuration pulls

## License

Apache-2.0
