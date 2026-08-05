# Meraki plugin — governance and safety model

Unofficial. Community-built plugin for the Cisco Meraki Dashboard API.
Not affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Meraki through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenant the
operator is authorised for.

- No Meraki Dashboard API key is stored on the technician's machine, in
  this repo, or in the model's context.
- Credential rotation happens once at Conduit, not per technician.
- Every call carries operator identity, so Conduit's audit log answers
  "who replaced that firewall ruleset". The Meraki change log records
  only the Dashboard account that owns the API key, which for an MSP is
  usually a shared service account. Conduit records *who called what*,
  never with what arguments — for `meraki_raw_request`, the method and
  path are exactly what the log will not show you.
- Removing a technician's Conduit org membership stops their Meraki
  access on their next call, because membership is re-read per request.
  It does **not** revoke an already-issued token, and it does not touch
  credentials they connected personally. Full offboarding is more than
  one step — see `wyre-gateway/GOVERNANCE.md`, *Revocation*.

## Tool permission groups

Conduit's access editor presents four groups — Read, Write, Delete, Admin
— so these are the buckets an owner actually clicks. Enforcement knows
only three tiers, `read`, `write` and `admin` (plus `none`, meaning deny)
— `src/access/permission-tier.ts:27`. All 27 tools below are classified in
`VENDOR_TOOL_CONFIG` under the slug `meraki`.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change Meraki or device state. Safe for autonomous agents. | `read` | `meraki_status`, `meraki_organizations_list`, `meraki_organizations_get`, `meraki_organizations_inventory_list`, `meraki_networks_list`, `meraki_networks_get`, `meraki_devices_list`, `meraki_devices_get`, `meraki_clients_list`, `meraki_clients_get`, `meraki_clients_get_policy`, `meraki_wireless_ssids_list`, `meraki_wireless_rf_profiles_list`, `meraki_switch_ports_list`, `meraki_switch_port_statuses_list`, `meraki_appliance_firewall_l3_get`, `meraki_appliance_vpn_status_get`, `meraki_navigate` † |
| **Write** | Changes Dashboard configuration. **Four of these six can take a site off the network** — see below. | `write` | `meraki_networks_update`, `meraki_clients_update_policy`, `meraki_appliance_firewall_l3_update`, `meraki_switch_ports_update`, `meraki_wireless_ssids_update`, `meraki_devices_reboot` |
| **Delete** | **Empty** — and not because Meraki has no delete tools. Both are pinned to `admin` instead, so they sit in the Admin row rather than here. | `write` — **not** a tier of its own | *(none)* |
| **Admin** | Removes Dashboard objects, or reaches the whole API surface. | `admin` | `meraki_networks_delete`, `meraki_devices_remove`, `meraki_raw_request` |

† `meraki_navigate` is classified `read`, but Conduit refuses it for
**everyone** — owners and personal connections included — before any tier
check runs (`src/proxy/discovery-tools.ts:48`,
`src/proxy/tool-call-enforcement.ts:125`). It answers with the container's
full tool list without knowing the caller's tier, so it advertises tools
the session may be forbidden to call. Use `conduit__my_access` for the
tier-true answer. `meraki_status` is deliberately kept — it reports
credential health and enumerates nothing.

**The empty Delete row is doing real work here.** Delete is a presentation
group, and a delete-group tool normally compiles to and enforces at tier
`write` (`src/access/tier-group-mapping.ts`, `GROUP_ENFORCEMENT_TIER`) —
which would mean a `write` grant carried every delete. Meraki avoids that
because `meraki_networks_delete` and `meraki_devices_remove` carry
`isAdmin`, and `isAdmin` outranks `isWrite`
(`src/access/tool-classification.ts:33-38`). Admin classification lifts
them out of the write-tier bucket the Delete group is drawn from, so they
land in Admin. **A `write` grant on Meraki therefore does *not* include
the deletes** — one of the few vendors where that holds.

That is the good news. **The bad news is what `write` does include**: the
four site-outage-capable config tools in the Write row. Granting a
technician `write` for Meraki grants them the firewall replace, the switch
port update, the SSID update, and the device reboot, alongside the benign
`meraki_networks_update`. There is no setting that separates them; the
only way to admit some write tools but not those four is a granular
per-tool grant, which compiles to an explicit `customTools` allowlist.

Conduit has no approval step, no per-call confirmation, and no interactive
prompt. It compares tiers. Any per-call human approval described below is
a workflow you impose on your agents, and it is only as good as the agent
configuration that carries it.

### Why the passthrough is admin-pinned

`meraki_raw_request` reaches **any** Dashboard API v1 endpoint with any
method. The caller supplies method and path, so it reaches every operation
on the surface — including the DELETEs that `meraki_networks_delete` and
`meraki_devices_remove` pin to admin, and org-administrator surfaces that
have no curated tool at all.

Conduit's policy matches on tool name only; arguments are never inspected
(`ToolCallGateInput` carries no `arguments` field, and the only component
that reads arguments is the observe-only security tap, which never
denies). So the general rule, now enforced by a guard test across the
fleet: **every arbitrary-request passthrough is admin-pinned, because a
tool whose blast radius is chosen by its arguments cannot be gated by its
name.** `meraki_raw_request` was for a period classified `isWrite` only —
a `write`-tier caller could issue arbitrary DELETEs and bypass the admin
pin on the two curated delete tools. It is now `isWrite` **and**
`isAdmin`, consistent with `autotask_raw_request` and every sibling
passthrough.

Two consequences worth acting on. **Never put `meraki_raw_request` in a
`customTools` list you are using to restrict anything** — admitting it
grants the entire Meraki surface, including every tool you deliberately
left out of that same list, and the restriction becomes decorative. And
because argument capture is off unconditionally, `meraki_raw_request` is
the *only* thing the audit trail will ever show you, never what it
dispatched.

### Four write-tier tools that can take a site offline

These are `PUT`/`POST` calls that delete nothing, and they enforce at
`write` exactly like a network rename. They deserve more care than their
tier implies, because of a property peculiar to network management: **the
operator applies the change over the link the change can break.**

- **`meraki_appliance_firewall_l3_update` replaces the entire ruleset.**
  It is not additive. Any rule omitted from the payload is gone, and the
  new ruleset takes effect immediately. A mistake either cuts the site
  off the internet or silently opens it up. If it cuts the site off, the
  MX loses its Dashboard connection — and the Dashboard is how you would
  push the fix. Recovery becomes a site visit or an out-of-band line.
- **`meraki_switch_ports_update` can partition a site.** Changing a
  port's VLAN or disabling it is a single-port operation until the port
  in question is the uplink to the rest of the building, or the one the
  customer's server is on. Same lockout property as the firewall.
- **`meraki_wireless_ssids_update` can drop every wireless client at
  once.** Changing auth mode, PSK, or VLAN on an SSID disconnects every
  device using it, and they cannot rejoin with the old credentials. At
  sites where wireless *is* the network — retail, warehousing, clinical
  carts — that is a full outage, and a technician working over that SSID
  has cut their own connection.
- **`meraki_devices_reboot` drops the site when the target is an MX or a
  core MS.** The vendor server's own description calls it "HIGH-IMPACT",
  and a reboot is not selective about who was mid-call or
  mid-transaction.

`meraki_networks_update` is the one genuinely modest tool in the Write
row: its documented surface is name, tags, and timezone. One caveat —
Meraki tags can bind a network to a configuration template, so a tag
change is not always cosmetic.

### The vendor's own controls are advisory, not gates

The Meraki MCP server ships two controls. Neither is enforcement once
Conduit is the client.

1. **`READ_ONLY_MODE`** defaults to true and blocks every write tool. It
   is a container environment variable — a fleet-wide on/off setting, not
   per-operator or per-org policy. It cannot express "Priya may write, the
   overnight agent may not." While it is on, this plugin is effectively
   read-only regardless of the grants above.
2. **`confirm_destructive_action`** is required by only three tools:
   `meraki_devices_remove`, `meraki_networks_delete`, and
   `meraki_raw_request` when the method is mutating.

So once `READ_ONLY_MODE` is off, the firewall replace, switch port update,
SSID update, and device reboot execute **with no confirmation argument at
all** — the four highest-blast-radius config changes are the ones the flag
does not guard. The vendor server marks all four `destructiveHint: true`
in their tool annotations while their handlers call
`guardWrite({ destructive: false })`, so no confirmation is required and
the call proceeds. An annotation is advice to the model, not an enforced
gate.

The general form is worth internalising: **a control that depends on the
client being interactive, or on the client reading and acting on
annotations, is not a control when the client is a gateway.** Conduit's
tier model, and your approval workflow above it, are the enforcement.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve a config change that can break connectivity.**

- **Read tools: allow.** Offline-device sweeps, firmware and lifecycle
  audits, firewall rule *reviews*, and VPN health checks are the intended
  autonomous use.
- **Write tools: agent drafts the exact call, human approves, then it
  runs.** For the four site-outage-capable tools, the approval must
  include a before/after diff — fetch current state with the matching
  `_get` or `_list` tool and show it. Do not grant these to scheduled or
  unattended agents. Conduit cannot enforce that separation for you — a
  `write` grant already admits all six — so it has to live in the agent's
  own configuration, or in a granular `customTools` grant that admits
  `meraki_networks_update` and `meraki_clients_update_policy` only.
- **Admin tools: treat the grant as equivalent to full Meraki
  administrator**, because for an arbitrary passthrough that is exactly
  what it is. If `meraki_raw_request` is genuinely needed, give it its own
  grant whose `customTools` contains that tool and nothing else. Never
  grant it to a scheduled agent or a service client, at any tier.
- Leave `READ_ONLY_MODE=true` unless a specific change window needs
  otherwise — but treat it as a coarse safety catch, not as policy.

## What it cannot reach

- Only the Meraki organizations the API key can see, and only the tenants
  mapped to the operator's Conduit identity. Conduit controls *who in your
  organisation may use that credential and which tools they may call*, not
  which slice of Meraki's data comes back. Scope the credential at the
  vendor if you need a narrower boundary.
- **Only Meraki-branded hardware.** Anything else on the customer's
  network is invisible here regardless of permissions.
- Only the regional Meraki cloud the key belongs to; keys are not
  shared between the global and China clouds.
- No filesystem, no shell, no other vendor's data.
- No device CLI or SSH. All changes go through the Dashboard cloud,
  which is also why a change that breaks connectivity cannot be undone
  remotely.
- The key inherits the permissions of the Dashboard account that
  generated it. A full-org admin key gives this plugin full-org admin
  reach — prefer a least-privilege service account.

## Data handling

- Responses pass through Conduit into model context for the session and
  are not persisted by this plugin.
- **`meraki_clients_list` and `meraki_clients_get` return end-user
  device data** — hostnames, MAC addresses, IPs, and usage. Hostnames
  routinely identify individuals ("sarahs-iphone"), which makes this
  personal data in most jurisdictions, not just network telemetry.
- `meraki_appliance_firewall_l3_get` exposes the customer's security
  posture in full. A leaked ruleset tells an attacker exactly what is
  and is not filtered.
- `meraki_appliance_vpn_status_get` maps inter-site topology and
  exported subnets.
- All three are `read`-tier, so a plain `read` grant includes them.
  Separating them requires a granular `customTools` grant.

## Known sharp edges

- **Read before every write, without exception.** The firewall update
  replaces rather than merges. An agent that constructs a ruleset from
  its own assumptions, rather than from a fresh
  `meraki_appliance_firewall_l3_get`, will silently drop every rule it
  did not think to include.
- **You cannot fix a lockout through this plugin.** Every tool depends
  on the device reaching the Meraki cloud. A change that breaks WAN
  connectivity removes the only path you had to revert it. Treat MX
  and core-switch changes as requiring someone reachable on site.
- **The rate limit is shared with the customer.** Meraki allows roughly
  10 requests/second per organization across *all* callers — this
  plugin, the customer's own Dashboard users, and any other MSP
  tooling. A fan-out sweep across devices can rate-limit the
  customer's own admins out of their dashboard. Prefer the org-wide
  aggregate endpoints over per-device loops.
- **Reboot is idempotent, its consequences are not.** The tool is
  marked idempotent because rebooting twice yields the same end state.
  It does not mean the second reboot was free — it means another
  outage.
- **Removal returns hardware to inventory, it does not delete it.**
  `meraki_devices_remove` unassigns from a network. Recovering from a
  mistaken removal means re-adding and reconfiguring the device, since
  network-level config does not follow it back.
