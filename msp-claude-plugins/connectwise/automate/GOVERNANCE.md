# ConnectWise Automate plugin — governance and safety model

Unofficial. Community-built plugin for the ConnectWise Automate (formerly
LabTech) API. Not affiliated with, endorsed by, or sponsored by the
vendor.

## What it connects as

This plugin does not hold credentials. It reaches ConnectWise Automate
through the WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which
brokers authentication centrally and scopes every call to the tenant the
operator is authorised for.

- No Automate server hostname, integrator username, password or 2FA
  bypass key is stored on the technician's machine, in this repo, or in
  the model's context.
- The org's ConnectWise Automate credential is stored once at the
  gateway, so replacing it is one edit rather than a change on every
  technician's machine. There is no rotate action, though — you
  re-submit the connect form, which overwrites the stored credential in
  place, and nothing tracks its age or prompts you.

- Every call carries operator identity, so Conduit's audit log answers
  "who ran that script on that server". Automate's own log records the
  integrator account the API authenticates as, which is the same value for
  every technician. Note that Conduit records *who called what*, never
  with what arguments — argument capture is off unconditionally, which for
  a `script_id` is exactly the field you would want.
- Removing a technician's Conduit org membership stops their Automate
  access on their next call, because membership is re-read per request. It
  does **not** revoke an already-issued token, and it does not touch
  credentials they connected personally. Full offboarding is more than one
  step — see `wyre-gateway/GOVERNANCE.md`, *Revocation*.

Automate is usually an on-premise or hosted-per-partner server rather than
a multi-tenant SaaS. Centralising auth at Conduit matters more here than
for a SaaS vendor: without it, integrator credentials to a server that can
execute code on every managed endpoint end up pasted into technician
environments.

## Tool permission groups

Conduit's access editor presents four groups — Read, Write, Delete, Admin
— so these are the buckets an owner actually clicks. Enforcement knows
only three tiers, `read`, `write` and `admin` (plus `none`, meaning deny)
— `src/access/permission-tier.ts:27`. All 17 tools below are classified in
`VENDOR_TOOL_CONFIG` under the slug `connectwise-automate`.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change Automate or endpoint state. Safe for autonomous agents. | `read` | `cwautomate_status`, `cwautomate_computers_list`, `cwautomate_computers_get`, `cwautomate_computers_search`, `cwautomate_clients_list`, `cwautomate_clients_get`, `cwautomate_scripts_list`, `cwautomate_scripts_get`, `cwautomate_alerts_list`, `cwautomate_alerts_get`, `cwautomate_navigate` † |
| **Write** | Changes Automate-side records — and, for one tool, restarts a customer's machine. | `write` | `cwautomate_alerts_acknowledge`, `cwautomate_clients_create`, `cwautomate_clients_update`, `cwautomate_computers_reboot` |
| **Delete** | **Empty.** This plugin exposes no delete tool. | `write` — **not** a tier of its own | *(none)* |
| **Admin** | Runs operator-chosen code on customer production endpoints. | `admin` | `cwautomate_scripts_execute`, `cwautomate_computers_run_script` |

† `cwautomate_navigate` is classified `read`, but Conduit refuses it for
**everyone** — owners and personal connections included — before any tier
check runs (`src/proxy/discovery-tools.ts:48`,
`src/proxy/tool-call-enforcement.ts:125`). It answers with the container's
full domain tool list and the sentence "You can call any of these tools
directly", which is false behind a gateway that filters by tier. This
plugin's own history is the reason the suppression exists: an admin saw
six write/admin-tier `cwautomate` tools advertised by `cwautomate_navigate`,
called them, and got "not found". Use `conduit__my_access` for the
tier-true answer. `cwautomate_status` is deliberately kept — it reports
credential health and enumerates nothing.

**The Delete row being empty changes nothing about what `write` grants.**
Delete is a presentation group, and a delete-group tool compiles to and
enforces at tier `write` (`src/access/tier-group-mapping.ts`,
`GROUP_ENFORCEMENT_TIER`). For this vendor there is no delete tool for
that rule to apply to — but the rule that matters here is the same shape:
**granting a technician `write` for Automate grants them
`cwautomate_computers_reboot` along with the three record-edit tools.**
There is no setting that separates them. The only way to admit alert
acknowledgement and client edits without admitting reboot is a granular
per-tool grant, which compiles to an explicit `customTools` allowlist.

Conduit has no approval step, no per-call confirmation, and no interactive
prompt. It compares tiers. Any per-call human approval described below is
a workflow you impose on your agents, and it is only as good as the agent
configuration that carries it.

### Blast radius and tier do not line up here, in both directions

The tier column is a mechanical function of `isWrite`/`isAdmin` in
`VENDOR_TOOL_CONFIG`. It is not a risk judgement, and for this plugin the
two diverge at two specific tools.

**`cwautomate_scripts_execute` and `cwautomate_computers_run_script` are
`admin`, and they are the sharpest tools in this plugin.** Here the tier
and the risk agree. The payload is not in the call — the agent passes a
`script_id`, and what that ID does was authored in the Automate script
engine and runs with the agent service's local privileges. There is no dry
run, no diff, and nothing in the tool arguments that tells a reviewer
whether script 412 collects a log file or uninstalls a security product.
`cwautomate_scripts_execute` additionally takes an array of
`computer_ids`, so a single call fans out across as many endpoints as the
agent chose to include. Conduit pins both to `admin` under the same rule
that pins `datto_run_quickjob` and every arbitrary-request passthrough: a
tool whose blast radius is chosen by its arguments cannot be gated by its
name, and the gate never reads arguments.

**`cwautomate_computers_reboot` is `write`, and that is the row to read
twice.** It accepts `force: true`, which restarts the machine regardless
of logged-in users and their unsaved work. On a customer's domain
controller or line-of-business server that is an unplanned outage, and it
is not recoverable by a follow-up API call. Conduit classifies it `write`
rather than `admin` because it is bounded — one endpoint, one operation,
no operator-supplied code — which is a defensible line for the tier model
and a poor line for an approval policy. **Anyone you grant `write` on
Automate can reboot any managed endpoint, and Conduit will not ask.**

`cwautomate_clients_create` and `cwautomate_clients_update` sit in the same
`write` bucket and change nothing outside the RMM console. The tier cannot
tell them apart from the reboot.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve an endpoint action.**

- **Read tools: allow.** Fleet health sweeps, offline/patch/disk reporting
  and alert triage across clients are the intended autonomous use.
- **Write tools: agent drafts the exact call, human approves, then it
  runs.** Treat `cwautomate_computers_reboot` as the exception inside this
  group: it belongs to the endpoint-action policy below even though it
  carries the same tier as an alert acknowledgement. Remember that Conduit
  cannot enforce that separation for you — a `write` grant already admits
  it — so it has to live in the agent's own configuration, or in a
  granular `customTools` grant that omits it.
- **Admin tools: treat the grant as equivalent to full Automate
  administrator**, because for a script-execution tool that is exactly
  what it is. The approver needs the script's actual content and the
  resolved target list in front of them, not just the tool call — a
  `script_id` and a list of integers is not enough to consent to. Never
  grant these to scheduled or unattended agents, or to a service client.
- Because argument capture is off, `cwautomate_scripts_execute` is the
  *only* thing the audit trail will ever show you — never which script it
  ran or on how many machines. Do not plan to review these after the fact.

## What it cannot reach

- Only the Automate server mapped to the operator's Conduit identity, and
  within it only what the underlying integrator or user account's
  permissions allow. Conduit controls *who in your organisation may use
  that credential and which tools they may call*, not which slice of
  Automate's data comes back. Automate permissions are per-user-class; a
  read-only class makes the write and admin tools fail at the server
  rather than at Conduit. Scope the credential at the vendor if you need a
  narrower boundary.
- No filesystem or shell on the technician's own machine — script
  execution targets managed endpoints only.
- No other vendor's data, and not ConnectWise PSA or ConnectWise CPQ.
  Those are separate products with separate APIs and separate Conduit
  connectors. An Automate `ClientID` is not a PSA `company/id`.
- No monitor management. This plugin's tools cover computers, clients,
  scripts and alerts; monitor thresholds and templates are documented in
  the skills but are not exposed as tools here.
- No live event stream. Every tool is point-in-time.

## Data handling

- Responses pass through Conduit into model context for the session and
  are not persisted by this plugin.
- `cwautomate_computers_get` returns full endpoint inventory — hostnames,
  logged-in usernames, IP and MAC addresses, installed software and agent
  version. That is a map of the customer's estate and a useful one to an
  attacker; treat transcripts accordingly.
- Script execution results include captured stdout. If a script prints
  credentials, connection strings or customer data, those land in model
  context via `cwautomate_scripts_execute`.

## Known sharp edges

- **Fan-out is not transactional.** Automate rejects execution against an
  offline computer with a 400, so a batch across a mixed fleet partially
  succeeds. The result is a set of machines that ran the change and a set
  that did not, with no rollback — the failure mode to plan for is drift,
  not a clean abort.
- **Approval covers one call, not the fleet.** Because
  `cwautomate_scripts_execute` takes a `computer_ids` array, the
  difference between approving one endpoint and approving four hundred is
  the length of a list inside the arguments. Read the array, not the tool
  name.
- **`condition` is singular here; PSA's is plural.** The two ConnectWise
  products do not share filter syntax. Treat any target list an agent
  built under a borrowed filter as unverified before it becomes the input
  to a script execution.
- **Client counts drift from PSA.** Automate clients and PSA companies are
  maintained separately and legitimately diverge. Do not let an agent
  "reconcile" one against the other without a human confirming the
  mapping — `cwautomate_clients_create` will happily add duplicates.
