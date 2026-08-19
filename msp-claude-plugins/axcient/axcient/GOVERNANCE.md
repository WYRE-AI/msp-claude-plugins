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

`axcient-mcp` is deployed in Conduit-prod and all 20 tools are classified in
`VENDOR_TOOL_CONFIG` (`src/proxy/result-cache.ts`):

| Group | What it can do | Enforcement tier |
|---|---|---|
| **Read** | The 18 lookups below | `read` |
| **Write** | `axcient_set_vault_threshold` | `write` |
| **Admin** | `axcient_get_d2c_agent_token` | `admin` |

A technician granted only `read` can call all 18 lookup tools — client,
device, job, vault, and appliance data, AutoVerify results, and restore
points — but not either mutation.

### The two tools that are not plain reads

- **`axcient_set_vault_threshold`** — changes a vault's connectivity-loss
  alert threshold. Not destructive to data, but it changes what technicians
  and monitoring see as "healthy." Classified `isWrite: true`.
- **`axcient_get_d2c_agent_token`** — mints a new direct-to-cloud agent
  enrollment token via `POST`. Classified `isWrite: true, isAdmin: true`:
  it doesn't touch any already-enrolled agent or existing data, but the
  token itself is access-granting bearer material (whoever holds it can
  enroll a new protected system into that vault), the same class as
  ScalePad's `scalepad_lm_enrollment_tokens_create` — Conduit's
  tool-naming guard enforces this precedent for any tool whose name
  contains `token`.

The remaining 18 tools (`axcient_test_connection`, `axcient_get_organization`,
`axcient_list_clients`, `axcient_get_client`, `axcient_list_devices`,
`axcient_list_devices_by_client`, `axcient_get_device`,
`axcient_get_device_autoverify`, `axcient_get_device_restore_points`,
`axcient_list_jobs_by_device`, `axcient_get_job`, `axcient_get_job_history`,
`axcient_list_vaults`, `axcient_get_vault`, `axcient_get_vault_threshold`,
`axcient_list_appliances`, `axcient_list_appliances_by_client`,
`axcient_get_appliance`) are `GET` requests against the x360Recover API with
no mutating side effects, classified `read`.

### Conduit has no approval step

Conduit compares tiers; it has no per-call confirmation and no interactive
prompt. The per-call approval discipline below is a workflow you impose on
your own agents — it is only as good as the agent configuration that
carries it.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve mutations**.

- Read tools: safe to allow autonomously — a `read`-tier grant gets a
  technician exactly the 18 lookup tools and nothing more.
- `axcient_set_vault_threshold` (write): require explicit human
  confirmation of the target vault ID and new threshold value before
  calling, every time. Do not let a scheduled or unattended agent call it.
- `axcient_get_d2c_agent_token` (admin): requires an `admin` grant in
  Conduit already, on top of any agent-side confirmation discipline —
  treat minting an enrollment token with the same care as any other
  bearer-credential mint.
- If you need to grant a technician the read surface without either
  mutation, Conduit's `read` tier already does this — a granular
  `customTools` allowlist is only needed if you want to carve out a
  subset of the 18 reads.

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
- `axcient_get_device_autoverify` returns screenshot URLs of a recovered
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
- **`axcient_set_vault_threshold` has no confirmation prompt of its
  own.** The upstream API accepts the change immediately on a valid
  request; Conduit does not add one. The agent-side confirmation
  discipline above is the only gate.
