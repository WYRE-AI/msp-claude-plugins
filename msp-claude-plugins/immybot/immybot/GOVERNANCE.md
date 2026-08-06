# ImmyBot plugin — governance and safety model

Unofficial. Community-built plugin for the ImmyBot API. Not affiliated
with, endorsed by, or sponsored by the vendor.

Read this one before granting access. ImmyBot exists to change Windows
endpoints, so most of its interesting tools act on customer production
machines by design.

## What it connects as

This plugin does not hold credentials. It reaches ImmyBot through the
WYRE gateway (`https://conduit.wyre.ai/v1/immybot/mcp`), which brokers
authentication centrally and scopes every call to the instance the
operator is authorised for.

- No ImmyBot instance subdomain, Entra tenant ID, client ID, or client
  secret is stored in this repo or in the model's context. The four
  connection fields are supplied once through the gateway's connect
  page, not per technician.
- The gateway exchanges them for a token and manages refresh; no token
  lifecycle happens client-side.
- Every call carries operator identity, so the gateway audit log answers
  "who approved that maintenance session". ImmyBot's own log records
  only the Entra app registration.
- Revoking a technician's gateway access revokes ImmyBot access with it,
  immediately.

The Entra app registration is the real credential here, and it is
long-lived. Its ImmyBot RBAC role is the only thing standing between an
agent and every endpoint in every tenant — scope it deliberately rather
than granting the app full administrative rights for convenience.

## Tool permission tiers

Grouped by blast radius, not HTTP verb. Several tools that look like
reads or harmless writes are classified destructive below, with the
reasoning stated.

> **Not classified in Conduit — every tool in the table below requires
> tier `admin` today.** Conduit derives each tool's tier from
> `VENDOR_TOOL_CONFIG` (`src/proxy/result-cache.ts`) and fails closed for
> anything absent from it:
> `const requiredTier: PermissionTier = classified ?? 'admin';`
> (`src/access/access-enforcement.ts:63`). `immybot` has no entry, so the
> grouping below carries no enforcement weight right now — read tools
> require `admin` exactly as the rest do, and there is no narrower grant
> that admits them. The grouping is still the right *risk* reading, and it
> becomes the enforcement reading on the day this vendor is classified.
> The list of unclassified vendors moves whenever one of them is
> classified, so it is stated in one place only:
> `wyre-gateway/GOVERNANCE.md`, *Fail-closed, and the vendors Conduit has
> not classified*.
>
> *This blockquote is the whole of the not-classified caveat. When
> `immybot` appears in `VENDOR_TOOL_CONFIG`, delete this blockquote and
> change nothing else.*

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change ImmyBot or endpoint state. Safe for autonomous agents. | `immybot_navigate`, `immybot_back`, `immybot_status`, `immybot_computers_list`, `immybot_computers_get`, `immybot_computers_search`, `immybot_computers_inventory`, `immybot_computers_deployments`, `immybot_software_list`, `immybot_software_list_global`, `immybot_software_get`, `immybot_software_search`, `immybot_software_versions`, `immybot_software_latest_version`, `immybot_software_categories`, `immybot_software_publishers`, `immybot_software_stats`, `immybot_deployments_list`, `immybot_deployments_get`, `immybot_deployments_compliance`, `immybot_deployments_for_computer`, `immybot_deployments_for_software`, `immybot_scripts_list`, `immybot_scripts_get`, `immybot_scripts_search`, `immybot_scripts_categories`, `immybot_scripts_validate`, `immybot_scripts_execution_history`, `immybot_scripts_execution_result`, `immybot_tenants_list`, `immybot_tenants_get`, `immybot_tenants_search`, `immybot_tenants_stats`, `immybot_tenants_computers`, `immybot_tenants_deployments`, `immybot_tenants_compliance`, `immybot_tenants_software_inventory`, `immybot_maintenance_sessions_list`, `immybot_maintenance_sessions_get`, `immybot_maintenance_sessions_active`, `immybot_maintenance_sessions_summary`, `immybot_maintenance_sessions_logs`, `immybot_maintenance_sessions_results`, `immybot_tasks_list`, `immybot_tasks_get`, `immybot_tasks_logs`, `immybot_tasks_history`, `immybot_tasks_queued`, `immybot_tasks_running`, `immybot_tasks_failed`, `immybot_tasks_for_computer`, `immybot_tasks_for_tenant`, `immybot_tasks_by_type`, `immybot_tasks_child_tasks`, `immybot_tasks_dependencies`, `immybot_tasks_estimated_completion`, `immybot_tasks_queue_stats`, `immybot_tasks_metrics` |
| **Write** | Changes ImmyBot-side records or session flow. Reversible. | `immybot_computers_create`, `immybot_maintenance_sessions_pause`, `immybot_maintenance_sessions_resume` |
| **Destructive** | Acts on customer Windows endpoints, or arms an action that will. | `immybot_scripts_run`, `immybot_software_install`, `immybot_deployments_trigger`, `immybot_deployments_create`, `immybot_maintenance_sessions_start`, `immybot_maintenance_sessions_cancel`, `immybot_computers_trigger_checkin` |

### Why each destructive tool is there

- **`immybot_scripts_run`** — executes PowerShell on a live endpoint in
  SYSTEM context. It can install and uninstall software, change system
  settings, read any file, and reboot the machine. This is the plainest
  case in the batch.
- **`immybot_software_install`** and **`immybot_deployments_trigger`** —
  install software and force immediate reconciliation. Both land on the
  endpoint now.
- **`immybot_maintenance_sessions_start`** — installs, updates, removes
  software and reboots, across a single computer or an entire tenant
  depending on the scope argument. One parameter is the difference
  between one machine and every machine a client owns.
- **`immybot_maintenance_sessions_cancel`** — cancelling mid-run can
  leave an install half-applied on a production machine. Stopping a
  destructive operation is itself destructive here.
- **`immybot_deployments_create`** — this is the non-obvious one. On its
  own it changes nothing, which is why it looks like a write. But it
  asserts desired state, and the next scheduled maintenance window will
  act on that assertion across the whole scope with no further human
  approval. It is a delayed-action version of
  `immybot_maintenance_sessions_start`, and **there is no
  `immybot_deployments_delete` in this tool surface** — an agent that
  creates the wrong deployment cannot undo it through this plugin. A
  latent, unrevocable, fleet-wide install is a destructive-tier blast
  radius no matter how quiet the API call is.
- **`immybot_computers_trigger_checkin`** — forces an agent to phone
  home immediately. Innocuous on an idle machine; on one with a staged
  deployment or pending session it is the trigger that makes the install
  happen now. Its blast radius is the pending work's, not its own, and
  the caller usually cannot see what is pending.

`immybot_scripts_validate` is safe and belongs in Read: it checks
PowerShell syntax without executing anything. Use it before every
`immybot_scripts_run`.

Conduit does not enforce any of that as an approval requirement. It
compares tiers — it has no approval step, no per-call confirmation, and
no interactive prompt. Per-call approval is a workflow you impose on your
agents, and it is only as good as the agent configuration that carries
it.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Compliance scorecards, task-queue audits, per-tenant
  QBR assembly, and failed-install investigation are the intended
  autonomous use and cover most day-to-day work.
- Write tools: agent drafts the exact call, human approves, then it
  runs.
- Destructive tools: require a named human approver per invocation. The
  approval must state the **exact target scope** — computer ID or tenant
  ID — because ImmyBot's scope argument is where the damage multiplies.
  Do not grant any destructive tool to a scheduled or unattended agent.
- Additional rule for `immybot_scripts_run`: name the script ID and the
  target computer ID in the approval request, and validate custom script
  content with `immybot_scripts_validate` first. The MCP server returns
  its own SYSTEM-context confirmation warning; surface that warning to
  the approver rather than summarising it.
- Additional rule for tenant-scoped sessions: pilot on one computer,
  read `immybot_maintenance_sessions_results`, then expand. Never let
  the first run of anything be tenant-wide.

## What it cannot reach

- Only the ImmyBot instance mapped to the operator's gateway identity,
  and within it only the tenants the Entra app registration's ImmyBot
  role can see.
- Windows only. ImmyBot does not manage macOS or Linux endpoints, so
  the mac and Linux half of a mixed fleet is invisible here and lives in
  the RMM.
- Endpoints that are enrolled but offline. Work queues rather than
  failing, which is its own hazard — see below.
- No filesystem or shell on the technician's machine, no other vendor's
  data.
- No PSA, no ticketing, no billing. Nothing here opens a ticket or tells
  a customer what happened.

## Data handling

- ImmyBot responses pass through the gateway into model context for the
  session and are not persisted by this plugin.
- `immybot_computers_inventory` and
  `immybot_tenants_software_inventory` return a complete per-endpoint
  software bill of materials including versions — effectively a
  vulnerability map of the client's fleet. `immybot_computers_*` returns
  hostnames and serial numbers.
- `immybot_scripts_get` returns full PowerShell source. Scripts written
  in-house frequently contain embedded endpoints, service account
  names, or credentials that the author assumed nobody would read. Treat
  script bodies as potentially secret-bearing before pasting them into a
  ticket or a chat.
- `immybot_maintenance_sessions_logs` and `immybot_tasks_logs` return
  raw execution output, which can include anything the script printed.

## Known sharp edges

- **Nothing happens until a session runs.** Creating a deployment is
  step one of two. An agent that reports "software deployed" after
  `immybot_deployments_create` is wrong, and the operator will not find
  out until the next maintenance window proves it.
- **Offline endpoints queue rather than fail.** Targeting an offline
  computer returns success and does nothing until it checks in — at
  which point the work runs unattended, possibly days later, with
  nobody watching. Confirm the target is online before starting
  anything.
- **Reboots are a flag, not a prompt.** `reboot` on a session start
  authorises restarts across the whole scope. A tenant-wide session with
  reboots allowed will restart production servers.
- **Cancel is not undo.** `immybot_maintenance_sessions_cancel` stops
  further work; it does not roll back what already ran.
- **Conflicting deployments fight.** Two deployments covering the same
  software on the same scope produce install/uninstall churn on the
  endpoint. Check `immybot_deployments_for_computer` before adding one —
  and remember you cannot delete the loser through this plugin.
- **HTTP 409 means a session is already running.** Retrying is the wrong
  response; find and inspect the existing session first.
