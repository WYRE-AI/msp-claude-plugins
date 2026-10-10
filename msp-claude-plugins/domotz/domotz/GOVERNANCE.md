# Domotz plugin — governance and safety model

Unofficial. Community-built plugin for the Domotz API. Not affiliated
with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Domotz through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenant the
operator is authorised for.

Consequences worth stating plainly:

- No Domotz API key is stored on the technician's machine, in this
  repo, or in the model's context.
- Credential rotation happens once at Conduit, not per technician.
  Domotz is an API-key vendor, not OAuth, so "rotation" means
  re-submitting the connect form — there is no rotate action.
- Every call carries operator identity, so Conduit's audit log answers
  "who power-cycled that outlet" — Domotz's own log records only the API
  account. The log records *who called what*, never with what arguments,
  so it will tell you the outlet tool ran but not which outlet.
- Complete offboarding in the gateway console, and confirm the person no longer has access before you treat it as done.

## Tool permission groups

Grouped into the four buckets Conduit's access editor presents, with the
tier each bucket actually enforces at.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change Domotz or customer-network state. Safe for autonomous agents. | `read` | `domotz_status`, `domotz_agents_list`, `domotz_agents_get` |
| **Write** | — | `write` | **Empty.** Conduit classifies no Domotz tool as a write. |
| **Delete** | — | `write` — **not** a tier of its own | **Empty.** |
| **Admin** |including outlet power control.| `admin` | see the table below |

Three tools. That is the whole of Domotz's classified surface in
Conduit, and it is the most important fact in this document.

Confirm the live permission grant in the gateway access editor before you rely on a tier in this document. This note does not describe gateway enforcement internals.

### `domotz_power_outlet_control` — the mechanical tier and the author's judgement disagree

`domotz_power_outlet_control` switches an outlet on a monitored PDU
`on`, `off`, or `cycle`. It does not change a monitoring record — it
cuts mains power to whatever is plugged into that outlet. The blast
radius is physical and immediate: an unplanned power cut to a server, a
storage array, or a firewall risks filesystem corruption and an
unattended site with nobody able to press the button back on. There is
no undo, and no confirmation that the connected equipment came back —
only that the outlet is on again.

By blast radius it is the sharpest tool in this batch. Confirm the live
grant in the access editor before an agent can call it.

The vendor server prefixes the tool's own description `DESTRUCTIVE ACTION`
and refuses to run unless `confirm: true` is passed. Treat that as
documentation, not a control.

The remaining twenty tools are `GET` requests against the Domotz API.
There is no tool that deletes an agent, edits a device, changes an alert
profile, or reconfigures monitored hardware.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve deletes.**

- Read tools: allow. Site inventory, topology mapping, IP-conflict
  detection, and cross-site health reporting are the intended autonomous
  use — but be aware that none of those tools is reachable at tier
  `read` today.
- Write tools: none exist.
- Do not grant `admin` on Domotz to a scheduled or unattended agent under any circumstances — "cycle the outlet if the device stops responding" is exactly the automation that takes a site down at 3am with nobody on site.
- For a human-driven outlet control: name an approver per invocation and
  confirm the specific outlet with the customer before the call. Conduit
  will not ask. The `power` skill carries the pre-flight checks that
  belong in front of a mains interruption.

## What it cannot reach

- Only the Domotz agents the connected credential can reach. Conduit
  controls *who in your organisation may use that credential and which
  tools they may call*, not which slice of Domotz's data comes back.
  Scope the credential at Domotz if you need a narrower boundary.
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

- Responses pass through Conduit into model context for the session and
  are not persisted by this plugin.
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
  coordinates, and is one of the three tools reachable at tier `read`.

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
- **Several capabilities the skills used to describe do not exist.** The
  plugin's skills previously documented a Domotz Eyes sensor surface, an
  on-demand network scan trigger, a speed test, a TCP port list, a
  device search, and a fired-alert feed. None of these is registered by
  the server, and all have been removed rather than remapped. Domotz's
  own API does use an `/eye/snmp` path, but the server surfaces only the
  SNMP-sensor slice of it, as `domotz_metrics_snmp_sensors_list` and
  `domotz_metrics_sensor_history` — there is no TCP/HTTP synthetic-probe
  surface here. The tool table above is the authority.
- **Alert tools return configuration, never a fired alert.**
  `domotz_alerts_profiles_list` and `domotz_alerts_device_list` describe
  what *would* notify. Nothing in this integration answers "what is
  alerting right now". Device state from `domotz_devices_list` is a
  reasonable proxy for site health, but presenting it as alert state is
  a misrepresentation, not a shortcut.
- **A denial at tier `read` is expected, not a misconfiguration.** Only
  three Domotz tools are classified, so most calls a `read`-tier agent
  makes will be refused. Check `conduit__my_access` before assuming a
  credential or connection problem.
