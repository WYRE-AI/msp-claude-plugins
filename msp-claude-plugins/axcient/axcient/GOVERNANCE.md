# Axcient plugin — governance and safety model

Unofficial. Community-built plugin for the Axcient x360Recover API. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Axcient through the WYRE
Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenant the operator
is authorised for.

Consequences worth stating plainly:

- No Axcient API key is stored on the technician's machine, in this repo,
  or in the model's context.
- Credential rotation happens once at Conduit, not per technician. Axcient
  is an API-key vendor (no OAuth), so "rotation" means re-submitting the
  connect form — there is no separate rotate action.
- Every call carries operator identity, so Conduit's audit log answers who
  called what. Axcient's own API-side logging is per API key, not per
  technician.
- Removing a technician's Conduit org membership stops their Axcient access
  on their next call, because membership is re-read per request. It does
  **not** revoke an already-issued token, and it does not touch credentials
  they connected personally. Full offboarding is more than one step — see
  `wyre-gateway/GOVERNANCE.md`, *Revocation*.

## Tool permission groups

**As of this plugin's initial release, `axcient-mcp` is not yet a
staging-deployed vendor in Conduit, and none of its 19 tools are classified
in `VENDOR_TOOL_CONFIG`.** Conduit's enforcement is fail-closed on
unclassified tools — every Axcient tool currently requires `admin`
regardless of whether it reads or writes, identical to the situation
`domotz`'s plugin documents in detail before that vendor was classified.

This means, today:

| Group | What it can do | Enforcement tier |
|---|---|---|
| **Read** | Nothing — no Axcient tool is classified `read` | n/a |
| **Write** | Nothing — no Axcient tool is classified `write` | n/a |
| **Admin** | Every Axcient tool, including read-only lookups | `admin` |

A technician granted only `read` on Axcient today can call **zero**
Axcient tools. Anything useful — client lookup, device status, backup
history — currently requires `admin`. Classifying this vendor's tools
(splitting the 17 genuine reads from the 2 writes below) is the
single highest-value follow-up for this plugin, mirroring the fix already
identified for `domotz`.

### The two tools that are not reads, regardless of classification

Whenever classification does land, these two should **not** be grouped
with the 17 read-only lookups:

- **`axcient_vaults_set_threshold`** — changes a vault's connectivity-loss
  alert threshold. Not destructive to data, but it changes what technicians
  and monitoring see as "healthy." Should classify `isWrite: true`.
- **`axcient_clients_get_d2c_agent_token`** — mints new direct-to-cloud
  agent enrollment credential material via `POST`. Does not affect any
  already-enrolled agent, but it is a provisioning action with real
  side effects (a live, usable token is created), not a read. Should
  classify `isWrite: true`.

The remaining 17 tools (`axcient_status`, `axcient_organization_get`,
`axcient_clients_list`, `axcient_clients_get`, `axcient_devices_*`,
`axcient_jobs_*`, `axcient_vaults_list`/`get`/`get_threshold`,
`axcient_appliances_*`) are `GET` requests against the x360Recover API with
no mutating side effects.

### Conduit has no approval step

Conduit compares tiers; it has no per-call confirmation and no interactive
prompt. The per-call approval discipline below is a workflow you impose on
your own agents — it is only as good as the agent configuration that
carries it.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve mutations** — with the caveat that, until this vendor is
classified in Conduit, "read" and "admin" are the same grant in practice.

- Read tools: intend to allow autonomously once classified. Until then,
  any grant sufficient to use this plugin at all is `admin`-equivalent —
  factor that into who you give it to.
- Write tools (`axcient_vaults_set_threshold`,
  `axcient_clients_get_d2c_agent_token`): require explicit human
  confirmation of the target ID and new value/vault before calling, every
  time. Do not let a scheduled or unattended agent call either of these.
- If you need to grant a technician the read surface without the two write
  tools before classification lands, use a granular `customTools`
  allowlist naming the 17 read tools explicitly and omitting the two
  writes — the same mechanism `domotz`'s governance doc documents for its
  power-control tool.

## What it cannot reach

- Only the Axcient organization the connected API key belongs to. Conduit
  controls *who in your organisation may use that credential and which
  tools they may call*, not which slice of Axcient's data comes back.
- Axcient's Billing API and x360Cloud API are separate products with
  separate API surfaces — this plugin wraps x360Recover only. Nothing
  here returns invoice line items or x360Cloud-specific backup data.
- No filesystem, no shell, no other vendor's data.
- No job scheduling, no appliance reconfiguration, no device
  add/remove — those remain portal-only operations not exposed by this
  API surface.

## Data handling

- Responses pass through Conduit into model context for the session and
  are not persisted by this plugin.
- Device and client responses include organizational structure (client
  names, codes) and infrastructure detail (IP addresses, OS versions,
  volume lists) — treat it as customer environment data, not public
  information, when deciding what to include in a shared report.
- `axcient_devices_get_autoverify` returns screenshot URLs of a recovered
  system's boot screen. These can reveal what's on-screen at boot
  (desktop wallpaper, login prompts, occasionally visible file names) —
  be judicious about resharing them outside the technician context that
  requested the check.

## Known sharp edges

- **Error responses are not uniform.** The same conceptual failure (bad
  API key vs. a malformed path parameter) can surface as HTTP 401 with two
  different, differently-shaped bodies. See the `api-patterns` skill
  before assuming a 401 means the credential is bad.
- **The job history endpoint has known upstream reliability issues**
  (documented by community API clients, not just this plugin). An
  unexpectedly empty result deserves corroboration against restore points
  before being reported as "job has never run."
- **`axcient_vaults_set_threshold` has no confirmation prompt of its
  own.** The upstream API accepts the change immediately on a valid
  request; Conduit does not add one. The agent-side confirmation
  discipline above is the only gate.
- **This vendor is unclassified in Conduit as of this release.** See
  *Tool permission groups* above — do not assume a `read`-tier grant gets
  a technician anything until classification lands.
