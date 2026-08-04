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
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log
  answers "who replaced that firewall ruleset". The Meraki change log
  records only the Dashboard account that owns the API key, which for
  an MSP is usually a shared service account.
- Revoking gateway access revokes Meraki access with it, immediately.

## Tool permission tiers

Meraki is the plugin in this batch that can actually change a
customer's network, so the tiering below is driven by blast radius
rather than by HTTP verb.

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Meraki or device state. Safe for autonomous agents. | `meraki_status`, `meraki_navigate`, `meraki_organizations_list`, `meraki_organizations_get`, `meraki_organizations_inventory_list`, `meraki_networks_list`, `meraki_networks_get`, `meraki_devices_list`, `meraki_devices_get`, `meraki_clients_list`, `meraki_clients_get`, `meraki_clients_get_policy`, `meraki_wireless_ssids_list`, `meraki_wireless_rf_profiles_list`, `meraki_switch_ports_list`, `meraki_switch_port_statuses_list`, `meraki_appliance_firewall_l3_get`, `meraki_appliance_vpn_status_get` |
| **Write** | Changes Dashboard records. Reversible, bounded to one object, no site-wide effect. | `meraki_networks_update`, `meraki_clients_update_policy` |
| **Destructive** | Can interrupt connectivity for a whole site, or delete Dashboard objects. Requires explicit per-call human approval. | `meraki_appliance_firewall_l3_update`, `meraki_switch_ports_update`, `meraki_wireless_ssids_update`, `meraki_devices_reboot`, `meraki_devices_remove`, `meraki_networks_delete`, `meraki_raw_request` |

### Why four non-delete tools sit in the destructive tier

The four config-write tools below are `PUT`/`POST` calls that delete
nothing. They are destructive because of a property peculiar to
network management: **the operator applies the change over the link
the change can break.**

- **`meraki_appliance_firewall_l3_update` replaces the entire
  ruleset.** It is not additive. Any rule omitted from the payload is
  gone, and the new ruleset takes effect immediately. A mistake either
  cuts the site off the internet or silently opens it up. If it cuts
  the site off, the MX loses its Dashboard connection — and the
  Dashboard is how you would push the fix. Recovery becomes a site
  visit or an out-of-band line.
- **`meraki_switch_ports_update` can partition a site.** Changing a
  port's VLAN or disabling it is a single-port operation until the
  port in question is the uplink to the rest of the building, or the
  one the customer's server is on. Same lockout property as the
  firewall.
- **`meraki_wireless_ssids_update` can drop every wireless client at
  once.** Changing auth mode, PSK, or VLAN on an SSID disconnects
  every device using it, and they cannot rejoin with the old
  credentials. At sites where wireless *is* the network — retail,
  warehousing, clinical carts — that is a full outage, and a
  technician working over that SSID has cut their own connection.
- **`meraki_devices_reboot` drops the site when the target is an MX or
  a core MS.** The vendor server's own description calls it
  "HIGH-IMPACT", and a reboot is not selective about who was mid-call
  or mid-transaction.

`meraki_raw_request` is destructive-tier because it reaches **any**
Dashboard API v1 endpoint with any method. It is not bounded by the
curated tool set, so it can VLAN-delete, change VPN topology, or touch
org administrators — surfaces that have no curated safety wrapper at
all.

`meraki_networks_update` stays in the write tier because its
documented surface is name, tags, and timezone. Note the one caveat:
Meraki tags can bind a network to a configuration template, so a tag
change is not always cosmetic.

### The confirmation flag does not cover what you would expect

The server enforces two independent controls, and it is worth knowing
exactly where each applies:

1. **`READ_ONLY_MODE`** defaults to **true** and blocks every write
   tool. While it is on, this plugin is effectively read-only and the
   tiering above is advisory.
2. **`confirm_destructive_action`** is required by only three tools:
   `meraki_devices_remove`, `meraki_networks_delete`, and
   `meraki_raw_request` when the method is mutating.

So once `READ_ONLY_MODE` is off, the firewall replace, switch port
update, SSID update, and device reboot execute **with no confirmation
argument at all** — the four highest-blast-radius config changes are
the ones the flag does not guard. The vendor server marks all of them
`destructiveHint: true` in their tool annotations, but that hint is
advice to the model, not an enforced gate. Human approval for these
has to come from your agent policy; do not rely on the tool schema to
stop them.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Offline-device sweeps, firmware and lifecycle
  audits, firewall rule *reviews*, and VPN health checks are the
  intended autonomous use.
- Write tools: agent drafts the exact call, human approves, then it
  runs.
- Destructive tools: require a named human approver per invocation.
  For the config-write tools, the approval must include a
  before/after diff — fetch current state with the matching `_get` or
  `_list` tool and show it. Do not grant these to scheduled or
  unattended agents.
- Leave `READ_ONLY_MODE=true` unless a specific change window needs
  otherwise.

## What it cannot reach

- Only the Meraki organizations the API key can see, and only the
  tenants mapped to the operator's gateway identity.
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

- Responses pass through the gateway into model context for the
  session and are not persisted by this plugin.
- **`meraki_clients_list` and `meraki_clients_get` return end-user
  device data** — hostnames, MAC addresses, IPs, and usage. Hostnames
  routinely identify individuals ("sarahs-iphone"), which makes this
  personal data in most jurisdictions, not just network telemetry.
- `meraki_appliance_firewall_l3_get` exposes the customer's security
  posture in full. A leaked ruleset tells an attacker exactly what is
  and is not filtered.
- `meraki_appliance_vpn_status_get` maps inter-site topology and
  exported subnets.

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
