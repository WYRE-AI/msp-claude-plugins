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
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who ran that script on that server". Automate's own log records the
  integrator account the API authenticates as, which is the same value for
  every technician.
- Revoking gateway access revokes Automate access with it, immediately.

Automate is usually an on-premise or hosted-per-partner server rather than
a multi-tenant SaaS. Centralising auth at the gateway matters more here
than for a SaaS vendor: without it, integrator credentials to a server
that can execute code on every managed endpoint end up pasted into
technician environments.

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Automate or endpoint state. Safe for autonomous agents. | `cwautomate_navigate`, `cwautomate_status`, `cwautomate_computers_list`, `cwautomate_computers_get`, `cwautomate_computers_search`, `cwautomate_clients_list`, `cwautomate_clients_get`, `cwautomate_scripts_list`, `cwautomate_scripts_get`, `cwautomate_alerts_list`, `cwautomate_alerts_get` |
| **Write** | Changes Automate-side records. Reversible, and confined to the RMM console. | `cwautomate_alerts_acknowledge`, `cwautomate_clients_create`, `cwautomate_clients_update` |
| **Destructive** | Acts on customer production endpoints. Requires explicit per-call human approval. | `cwautomate_scripts_execute`, `cwautomate_computers_run_script`, `cwautomate_computers_reboot` |

The destructive tier here contains no delete tool, and that is the point.
Blast radius, not HTTP verb, decides the tier: all three are ordinary
POSTs that change nothing inside Automate and everything on somebody
else's server.

`cwautomate_scripts_execute` and `cwautomate_computers_run_script` are the
sharpest tools in this plugin. The payload is not in the call — the agent
passes a `script_id`, and what that ID does was authored in the Automate
script engine and runs with the agent service's local privileges. There is
no dry run, no diff, and nothing in the tool arguments that tells a
reviewer whether script 412 collects a log file or uninstalls a security
product. `cwautomate_scripts_execute` additionally takes an array of
`computer_ids`, so a single approved call fans out across as many
endpoints as the agent chose to include.

`cwautomate_computers_reboot` accepts `force: true`, which restarts the
machine regardless of logged-in users and their unsaved work. On a
customer's domain controller or line-of-business server that is an
unplanned outage, and it is not recoverable by a follow-up API call.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Fleet health sweeps, offline/patch/disk reporting and
  alert triage across clients are the intended autonomous use.
- Write tools: agent drafts the exact call, human approves, then it runs.
- Destructive tools: require a named human approver per invocation. The
  approver needs the script's actual content and the resolved target list
  in front of them, not just the tool call — a `script_id` and a list of
  integers is not enough to consent to. Do not grant these to scheduled or
  unattended agents.

## What it cannot reach

- Only the Automate server mapped to the operator's gateway identity, and
  within it only what the underlying integrator or user account's
  permissions allow. Automate permissions are per-user-class; a read-only
  class makes the write and destructive tiers fail at the server rather
  than at the gateway.
- No filesystem or shell on the technician's own machine — script
  execution targets managed endpoints only.
- No other vendor's data, and not ConnectWise PSA or ConnectWise CPQ.
  Those are separate products with separate APIs and separate gateway
  connectors. An Automate `ClientID` is not a PSA `company/id`.
- No monitor management. This plugin's tools cover computers, clients,
  scripts and alerts; monitor thresholds and templates are documented in
  the skills but are not exposed as tools here.
- No live event stream. Every tool is point-in-time.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
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
