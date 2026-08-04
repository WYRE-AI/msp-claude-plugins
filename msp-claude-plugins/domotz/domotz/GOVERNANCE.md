# Domotz plugin — governance and safety model

Unofficial. Community-built plugin for the Domotz API. Not affiliated
with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Domotz through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenant the
operator is authorised for.

- No Domotz API key is stored on the technician's machine, in this
  repo, or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log
  answers "who power-cycled that outlet" — Domotz's own log records
  only the API account.
- Revoking gateway access revokes Domotz access with it, immediately.

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Domotz or customer-network state. Safe for autonomous agents. | `domotz_status`, `domotz_navigate`, `domotz_back`, `domotz_agents_list`, `domotz_agents_get`, `domotz_devices_list`, `domotz_devices_get`, `domotz_devices_inventory`, `domotz_devices_history`, `domotz_devices_uptime`, `domotz_alerts_device_list`, `domotz_alerts_profiles_list`, `domotz_metrics_snmp_sensors_list`, `domotz_metrics_sensor_history`, `domotz_metrics_variables_list`, `domotz_metrics_variable_history`, `domotz_network_interfaces`, `domotz_network_ip_conflicts`, `domotz_network_topology`, `domotz_power_outlets_list` |
| **Write** | Nothing in this plugin creates or edits a Domotz record. | — |
| **Destructive** | Physically interrupts power to customer hardware. Requires explicit per-call human approval. | `domotz_power_outlet_control` |

This plugin is **read-only with a single exception**, and that
exception is the sharpest tool in this batch.

`domotz_power_outlet_control` switches an outlet on a monitored PDU
`on`, `off`, or `cycle`. It does not change a monitoring record — it
cuts mains power to whatever is plugged into that outlet. The blast
radius is physical and immediate: an unplanned power cut to a server,
a storage array, or a firewall risks filesystem corruption and an
unattended site with nobody able to press the button back on. It sits
in the destructive tier for that reason, and the vendor server agrees
— the tool's own description is prefixed `DESTRUCTIVE ACTION` and it
refuses to run unless `confirm: true` is passed explicitly.

The remaining twenty tools are `GET` requests against the Domotz API.
There is no tool that deletes an agent, edits a device, changes an
alert profile, or reconfigures monitored hardware.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Site inventory, topology mapping, IP-conflict
  detection, and cross-site health reporting are the intended
  autonomous use.
- Write tools: none exist.
- `domotz_power_outlet_control`: require a named human approver per
  invocation, and confirm the specific outlet with the customer before
  the call. Do not grant this to scheduled or unattended agents under
  any circumstances — "cycle the outlet if the device stops
  responding" is exactly the automation that takes a site down at 3am
  with nobody on site.

## What it cannot reach

- Only the Domotz agents mapped to the operator's gateway identity.
- Only the Domotz region cluster the credential belongs to
  (`us-east-1` or `eu-central-1`); a credential for one cannot see the
  other's data.
- No filesystem, no shell, no other vendor's data.
- Nothing beyond a site's own LAN. Every device query is scoped to one
  agent, so there is no cross-site or fleet-wide query surface — a
  fleet report means iterating agents explicitly.
- No device configuration. Domotz observes the network and switches
  outlets; it does not change device settings.

## Data handling

- Responses pass through the gateway into model context for the
  session and are not persisted by this plugin.
- **`domotz_devices_list` and `domotz_devices_inventory` return a full
  LAN census** — MAC addresses, hostnames, vendor, and IP for every
  device that answered a scan. At a small business this includes
  personal phones, laptops, and smart TVs belonging to staff, not just
  managed assets. Treat it as premises data about people, not just an
  equipment list.
- **`domotz_network_topology` and `domotz_network_interfaces` describe
  the internal shape of a customer network.** Combined with the device
  census this is close to what an attacker would want for lateral
  movement. Restrict it if your agents run unattended or if transcripts
  are retained.
- `domotz_agents_get` returns licence counts and site location
  coordinates.

## Known sharp edges

- **The device inventory is only as fresh as the agent.** If a
  collector is offline, device records persist and read as last-known
  rather than current. An agent reporting "all devices online" from
  stale data at a site whose collector died is worse than no report.
  Check the agent's own status before trusting device status.
- **Power control has no undo.** `cycle` is not a soft restart of a
  service; it is a mains interruption. There is no confirmation that
  the connected equipment came back, only that the outlet is on again.
- **Every device query needs an agent ID.** Omitting it does not
  return everything — it fails, or worse, an agent picks an arbitrary
  site and reports one customer's devices under another's name.
- **Documented tool names lag the server.** The skills in this plugin
  describe some tools under older names (for example `domotz_list_devices`
  or `domotz_scan_network`) that the current server does not expose. The
  table above reflects what the server actually serves; prefer it when
  the two disagree.
