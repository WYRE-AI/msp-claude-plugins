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
- Removing a technician's Conduit org membership stops their Domotz
  access on their next call, because membership is re-read per request.
  It does **not** revoke an already-issued token, and it does not touch
  credentials they connected personally. Full offboarding is more than
  one step — see `wyre-gateway/GOVERNANCE.md`, *Revocation*.

## Tool permission groups

Grouped into the four buckets Conduit's access editor presents, with the
tier each bucket actually enforces at.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change Domotz or customer-network state. Safe for autonomous agents. | `read` | `domotz_status`, `domotz_agents_list`, `domotz_agents_get` |
| **Write** | — | `write` | **Empty.** Conduit classifies no Domotz tool as a write. |
| **Delete** | — | `write` — **not** a tier of its own | **Empty.** |
| **Admin** | Everything else the server serves, by fail-closed default rather than by judgement — including outlet power control. | `admin` | see the table below |

Three tools. That is the whole of Domotz's classified surface in
Conduit, and it is the most important fact in this document.

### Sixteen tools require `admin` because Conduit has not classified them

The Domotz MCP server registers 21 tools. Conduit's `VENDOR_TOOL_CONFIG`
(`src/proxy/result-cache.ts`) classifies **4** of them —
`domotz_navigate`, `domotz_status`, `domotz_agents_list`,
`domotz_agents_get`. Classification is fail-closed: an unclassified tool
is coerced to the highest tier at the enforcement gate —
`const requiredTier: PermissionTier = classified ?? 'admin';`
(`src/access/access-enforcement.ts:63`).

So sixteen tools require `admin` today:

`domotz_devices_list`, `domotz_devices_get`, `domotz_devices_inventory`,
`domotz_devices_history`, `domotz_devices_uptime`,
`domotz_alerts_device_list`, `domotz_alerts_profiles_list`,
`domotz_metrics_snmp_sensors_list`, `domotz_metrics_sensor_history`,
`domotz_metrics_variables_list`, `domotz_metrics_variable_history`,
`domotz_network_interfaces`, `domotz_network_ip_conflicts`,
`domotz_network_topology`, `domotz_power_outlets_list`, and
**`domotz_power_outlet_control`**.

And two — `domotz_navigate` and `domotz_back` — are refused for *every*
caller at *every* tier, org owners included. Conduit suppresses
`*_navigate` and `*_back` unconditionally before any tier check
(`src/proxy/tool-call-enforcement.ts:125-130`,
`src/proxy/discovery-tools.ts:41-50`), because a vendor menu advertises
tools without knowing the caller's access. `domotz_navigate` is
classified `read` in `VENDOR_TOOL_CONFIG`; that classification is dead
letter. Use `conduit__my_access` instead.

Net effect: a technician granted `read` on Domotz can call exactly three
tools, and none of them returns a device. Everything an operator
actually wants from Domotz — the LAN census, the topology, the sensor
history — needs `admin`, and `admin` carries outlet power control with
it. **There is no setting today that gives an agent Domotz's read
surface without also giving it the ability to cut mains power.**
Classifying this vendor would be a privilege reduction, not an addition;
it is the single highest-value change available for this plugin.

### `domotz_power_outlet_control` — the mechanical tier and the author's judgement disagree

`domotz_power_outlet_control` switches an outlet on a monitored PDU
`on`, `off`, or `cycle`. It does not change a monitoring record — it
cuts mains power to whatever is plugged into that outlet. The blast
radius is physical and immediate: an unplanned power cut to a server, a
storage array, or a firewall risks filesystem corruption and an
unattended site with nobody able to press the button back on. There is
no undo, and no confirmation that the connected equipment came back —
only that the outlet is on again.

By blast radius it is the sharpest tool in this batch. By Conduit's
mechanics it is `admin` — but only because nobody has classified it. The
two agree today by accident, and that accident is load-bearing:

- **If Domotz is classified without pinning this tool explicitly, it
  will not be caught by a verb heuristic.** Conduit's name-based tier
  inference (`src/access/tool-naming.ts`) recognises `create`, `delete`,
  `reboot`, `reset` and forty-odd other mutation verbs. `control` is in
  neither the write set nor the read set, so
  `domotz_power_outlet_control` implies *nothing* and there is no entry
  for it in `tool-naming-exceptions.ts`. It cannot be auto-seeded; it
  requires a deliberate decision. That decision should be `isWrite: true,
  isAdmin: true`, for the same reason `liongard_agents_delete` and
  `datto_run_quickjob` are admin: a tool that acts on customer hardware
  is not a records write.
- **`write` would not be enough.** Its name carries no delete-verb token
  (`delete`, `remove`, `dismiss`, `archive` —
  `src/access/tool-naming.ts:136`), so classifying it merely as
  `isWrite` would put it in the **Write** presentation group, where the
  first technician granted `write` on Domotz gets it silently.

The vendor server does prefix the tool's own description
`DESTRUCTIVE ACTION` and refuse to run unless `confirm: true` is passed.
Treat that as documentation, not a control. Conduit is a
non-interactive client; vendor-side confirmations and destructive hints
are advisory to it — see `wyre-gateway/GOVERNANCE.md`, *Where Conduit is
the only enforcement point*.

The remaining twenty tools are `GET` requests against the Domotz API.
There is no tool that deletes an agent, edits a device, changes an alert
profile, or reconfigures monitored hardware.

### What granting `write` would mean

Conduit's enforcement tiers are only `read`, `write`, and `admin` (plus
`none`, meaning deny) — `src/access/permission-tier.ts:27`. "Delete" is a
presentation group in the access editor, and a delete-group tool compiles
to and enforces at tier `write` (`src/access/tier-group-mapping.ts`,
`GROUP_ENFORCEMENT_TIER`). **Granting a technician `write` for a vendor
also grants every delete tool on it**; the only way to admit some write
tools but not the delete ones is a granular per-tool grant, which
compiles to an explicit `customTools` allowlist.

For Domotz that consequence is currently vacuous — both groups are
empty, and a `write` grant buys nothing a `read` grant does not. It stops
being vacuous the moment this vendor is classified.

Conduit has no approval step, no per-call confirmation, and no
interactive prompt. It compares tiers. The per-call approval discipline
below is a workflow you impose on your agents, and it is only as good as
the agent configuration that carries it.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve deletes.**

- Read tools: allow. Site inventory, topology mapping, IP-conflict
  detection, and cross-site health reporting are the intended autonomous
  use — but be aware that none of those tools is reachable at tier
  `read` today.
- Write tools: none exist.
- Admin tools: this grant currently means both "read a customer's LAN"
  and "cut power to their hardware", because the fail-closed default
  puts them in the same bucket. Do not grant `admin` on Domotz to a
  scheduled or unattended agent under any circumstances — "cycle the
  outlet if the device stops responding" is exactly the automation that
  takes a site down at 3am with nobody on site. If an agent needs the
  read surface, give it a granular grant whose `customTools` lists the
  read tools and omits `domotz_power_outlet_control`; that is the only
  mechanism Conduit offers to separate them.
- For a human-driven outlet control: name an approver per invocation and
  confirm the specific outlet with the customer before the call. Conduit
  will not ask.

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
- **Documented tool names lag the server, in the skills.** The tool table
  above matches the 21 tools the server registers today. Some skills in
  this plugin still describe tools under older names (for example
  `domotz_list_devices` or `domotz_scan_network`) that the current server
  does not expose — tracked as issue #178. Prefer the table when the two
  disagree.
- **A denial at tier `read` is expected, not a misconfiguration.** Only
  three Domotz tools are classified, so most calls a `read`-tier agent
  makes will be refused. Check `conduit__my_access` before assuming a
  credential or connection problem.
