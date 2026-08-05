# RocketCyber plugin — governance and safety model

Unofficial. Community-built plugin for the RocketCyber managed SOC API.
Not affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches RocketCyber through
the WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which
brokers authentication centrally and scopes every call to the tenant the
operator is authorised for.

- No RocketCyber API key is stored on the technician's machine, in this
  repo, or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who pulled this customer's incident data" — RocketCyber's own log
  records only the provider API key.
- Removing a technician's Conduit org membership stops their RocketCyber
  access on their next call, because membership is re-read per request.
  It does **not** revoke an already-issued token, and it does not touch
  credentials they connected personally. Full offboarding is more than
  one step — see `wyre-gateway/GOVERNANCE.md`, *Revocation*.

## Tool permission groups

RocketCyber is classified in Conduit's `VENDOR_TOOL_CONFIG`
(`src/proxy/result-cache.ts`), but the entry covers only **eight** of
the plugin's ten tools. Conduit is fail-closed, and the enforcement gate
coerces an unclassified tool to the *highest* tier:

```ts
const requiredTier: PermissionTier = classified ?? 'admin'; // UNCLASSIFIED -> ADMIN
```
— `src/access/access-enforcement.ts:63`. So two read-only tools require
tier `admin` to invoke.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change RocketCyber or endpoint state. | `read` | `rocketcyber_get_account`, `rocketcyber_list_agents`, `rocketcyber_list_incidents`, `rocketcyber_list_events`, `rocketcyber_get_event_summary`, `rocketcyber_get_defender`, `rocketcyber_get_office`, `rocketcyber_test_connection` |
| **Write** | — | — | **None.** No tool in this plugin is classified `isWrite`. |
| **Delete** | — | — | **None.** |
| **Admin** | Nothing dangerous — these are reads Conduit has not classified. | `admin` (by fail-closed coercion, not by classification) | `rocketcyber_list_apps`, `rocketcyber_list_firewalls` |

**This plugin is still read-only in blast-radius terms.** Every tool it
exposes is an observation. An agent granted the full surface cannot
resolve an incident, change an account, deploy or remove an agent, or
alter a security policy. For an MSP owner deciding what to allow, that
remains the main answer: the worst case is disclosure, not damage.

But read-only is not the same as reachable at tier `read`.
`rocketcyber_list_apps` and `rocketcyber_list_firewalls` are absent from
`VENDOR_TOOL_CONFIG`, so a technician granted `read` on RocketCyber will
be denied on both. Getting them requires `admin` on this vendor — which,
here, admits nothing worse, because there is nothing worse to admit.
This is classification drift rather than a security decision, and
classifying the two tools would be a privilege *reduction*: it would
move them down from `admin` to `read`.

Conduit compares tiers. It has no approval step, no per-call
confirmation, and no interactive prompt — its source contains no
elicitation handling at all. There is nothing here to approve anyway.

## Recommended agent policy

- Read tools: allow, subject to the disclosure considerations below.
  Cross-tenant threat sweeps, coverage reporting, and incident
  summarisation are the intended autonomous use.
- Write and delete policies are not applicable — do not configure
  approval workflows for tools that do not exist.
- If a workflow needs `rocketcyber_list_apps` or
  `rocketcyber_list_firewalls`, prefer a per-tool `customTools` grant
  over a blanket `admin` grant on the vendor. The blanket grant is
  harmless today only because this plugin has no mutating tool; a future
  one would inherit it.

Because the whole surface is read-only, the governance question shifts
from "what can it break" to "who should see this". Incident and event
data describes live compromises at named customers. Scope access by
operator, not by tool.

## Tool surface is narrower than the skills

The `rocketcyber-accounts` skill documents account CRUD, account
settings, and security policy configuration, and the
`rocketcyber-agents` skill documents agent installation. **None of these
are exposed as MCP tools.** The ten tools above are the complete
callable surface. Treat the skills' coverage of write operations as API
reference for the underlying REST API, not as something an agent can
invoke through this plugin.

## What it cannot reach

- Only the RocketCyber provider account mapped to the operator's gateway
  identity, and the customer sub-accounts beneath it. The API key is
  scoped at the provider level, so an operator with access sees every
  customer under that provider — there is no per-customer key.
- No endpoint. Nothing here isolates a host, kills a process, or
  quarantines a file; those actions happen in the RocketCyber console.
- No filesystem, no shell, no other vendor's data.
- No live event stream. Every tool is point-in-time.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `rocketcyber_list_incidents` and `rocketcyber_list_events` return
  security-sensitive detail about live or recent compromises at named
  customers: affected hostnames, user accounts, process names, and file
  paths. This is the most sensitive data in the plugin and it is in the
  read tier.
- `rocketcyber_list_agents` returns endpoint hostnames and coverage
  gaps — effectively a map of which customer machines are unmonitored.
- `rocketcyber_list_apps` returns installed software inventory per
  endpoint. It is one of the two tools currently gated at `admin`.

Restrict this plugin to operators who are already entitled to see
customer incident data. Read-only does not mean low-sensitivity.

## Known sharp edges

- **Provider scope is all-or-nothing.** A single API key grants every
  customer sub-account. There is no way to expose one client's incidents
  to an agent without exposing all of them; scope at the gateway
  identity instead.
- **An incident is a verdict, not an alert.** RocketCyber incidents have
  been through SOC analysis. Do not let an agent reconcile them
  one-to-one against Datto RMM alerts, which are unreviewed monitor
  output — the counts will never match and the mismatch is not an error.
- **"Agent" means an endpoint sensor.** In this plugin an agent is a
  RocketAgent on a customer machine, never an AI subagent. Worth
  enforcing in any policy text your team writes on top of this document.
- **No remediation path.** An agent can identify a compromise and cannot
  act on it. Make sure the workflow around this plugin ends in a human
  or a ticket, not in a report nobody reads.
