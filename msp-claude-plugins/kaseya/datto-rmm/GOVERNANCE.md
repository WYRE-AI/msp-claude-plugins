# Datto RMM plugin — governance and safety model

Unofficial. Community-built plugin for the Datto RMM API. Not affiliated
with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Datto RMM through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenant the
operator is authorised for.

- No Datto RMM API key or secret is stored on the technician's machine,
  in this repo, or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who ran this script on the customer's server" — Datto RMM's job
  history records only the API account.
- Removing a technician's Conduit org membership stops their Datto RMM
  access on their next call, because membership is re-read per request.
  It does **not** revoke an already-issued token, and it does not touch
  credentials they connected personally. Full offboarding is more than
  one step — see `wyre-gateway/GOVERNANCE.md`, *Revocation*.

## Tool permission groups

Datto RMM is classified in Conduit's `VENDOR_TOOL_CONFIG`
(`src/proxy/result-cache.ts`) under the slug `datto-rmm`. All ten tools
are classified; none fall through to the unclassified-means-`admin`
rule.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change Datto RMM or endpoint state. Safe for autonomous agents. | `read` | `datto_list_devices`, `datto_get_device`, `datto_find_device`, `datto_list_sites`, `datto_get_site`, `datto_list_alerts`, `datto_get_alert` |
| **Write** | Changes Datto RMM records. Reversible, but suppresses signal. | `write` | `datto_resolve_alert` |
| **Delete** | — | — | **None.** This plugin exposes no delete-group tool, so the usual "a `write` grant also admits the deletes" trap does not apply here. |
| **Admin** | Executes code on a customer endpoint, or reads forensics-class inventory. | `admin` | `datto_run_quickjob`, `datto_get_device_audit` |

Conduit compares tiers. It has no approval step, no per-call
confirmation, and no interactive prompt — its source contains no
elicitation handling at all. Per-call approval for anything below is a
policy you impose on your agents, and it is only as good as the agent
configuration that carries it.

### `datto_run_quickjob` enforces at `admin`, and should

It is the only tool here that leaves the Datto RMM platform and touches
the customer's machine. It executes a component script on a named device
with whatever privileges the Datto agent holds — which is SYSTEM on
Windows. The component decides what happens; "install this update" and
"wipe this directory" are the same tool call with a different
`componentUid`. Blast radius is a production endpoint, so it is
dangerous regardless of which component is chosen.

Conduit classifies it `admin` rather than `write` for exactly that
reason — its own comment puts it in the same class as
`autotask_execute_tool`, on the grounds that the blast radius is bounded
by execution scope rather than by the verb in the name. A technician
with `write` on Datto RMM **cannot** call it. That is a real control,
and it is stronger than the per-call approval this document used to
claim.

### `datto_get_device_audit` enforces at `admin`, which may surprise you

It reads like a `get_*` tool and it changes nothing, but Conduit
classifies it `isAdmin` because a device audit is forensics-class
sensitive data: full hardware and software inventory for a customer
endpoint. **A read-only agent cannot call it.** If your fleet-audit or
patch-coverage workflow depends on this tool, it needs an `admin` grant
on Datto RMM — which also admits `datto_run_quickjob`. There is no tier
between them; separating the two requires a per-tool `customTools`
allowlist.

### `datto_resolve_alert` is the whole Write group

It is a write rather than a read because closing an alert removes it
from the queue the on-call technician is watching. It does not fix the
underlying condition — the monitor will re-fire — but an agent that
resolves alerts in bulk can hide a live outage. Granting `write` on
Datto RMM grants exactly this one tool plus the reads.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never let an
agent hold `admin` on this vendor.**

- Read tools: allow. Fleet audits, patch-coverage reporting, and alert
  triage summaries are the intended autonomous use — noting that
  `datto_get_device_audit` is not in this group.
- Write tools: agent drafts the exact call, human approves, then it runs.
  Never allow bulk alert resolution without a human reading the list.
- Admin tools: treat an `admin` grant on Datto RMM as arbitrary remote
  code execution on every managed endpoint, because
  `datto_run_quickjob` is exactly that. Do not grant it to scheduled or
  unattended agents. For an interactive operator, require that they be
  told which component is being run against which device — Conduit will
  not ask.

## What it cannot reach

- Only the Datto RMM account mapped to the operator's gateway identity,
  on that account's regional platform (Pinotage, Merlot, Concord, Vidal,
  Zinfandel, or Syrah). There is no cross-platform API.
- No filesystem, no shell, and no other vendor's data on the operator's
  own machine — `datto_run_quickjob` runs on the *managed endpoint*, not
  locally.
- No Datto backup data. BCDR and SaaS Protection are separate products
  with separate credentials and separate plugins.
- No live event stream. Every tool is point-in-time; Datto RMM webhooks
  carry the push feed.

## Tool surface is narrower than the skills

The skills in this plugin document device, site, and variable
create/update/delete operations that exist in the Datto RMM REST API but
are **not exposed as MCP tools**. The ten tools above are the complete
callable surface. Treat the skills' coverage of write operations as API
reference, not as something an agent can invoke here.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `datto_get_device_audit` returns full hardware and software inventory
  for a customer endpoint, including installed application names and
  versions — useful to an attacker profiling the estate. This is why
  Conduit enforces it at `admin` rather than `read`.
- `datto_list_devices` and `datto_get_device` return internal and
  external IP addresses, hostnames, MAC addresses, and logged-in user
  names.
- Job output from `datto_run_quickjob` returns raw stdout/stderr, which
  will contain whatever the component script printed — including
  credentials if the script is careless.

## Known sharp edges

- **Site variables are readable by any component.** Anything stored as a
  Datto RMM variable is available to every script that runs on that
  site's devices. It is configuration storage, not a secret store.
- **Quick jobs are fire-and-forget.** The tool returns once the job is
  queued, not once it has finished. An agent that reports success has
  reported successful *scheduling*; check job status separately.
- **Audit data goes stale.** Audits are collected on a cadence, not on
  demand. A device that was patched an hour ago may still report the old
  inventory, so audit output is not evidence of current state.
- **Resolving an alert does not fix it.** The monitor re-evaluates and
  raises a new alert with a new UID, which breaks naive "is it fixed
  yet" loops that watch a single alert UID.
