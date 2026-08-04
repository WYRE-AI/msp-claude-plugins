# Liongard plugin — governance and safety model

Unofficial. Community-built plugin for the Liongard (ROAR) API. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

The supported deployment reaches Liongard through the WYRE Conduit
gateway (`https://conduit.wyre.ai/v1/liongard/mcp`), which brokers
authentication centrally and scopes every call to the instance the
operator is authorised for.

- No Liongard instance name or `X-ROAR-API-KEY` value is stored on the
  technician's machine, in this repo, or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who deleted that agent". Liongard's timeline records the API key's
  identity, which is shared.
- Revoking a technician's gateway access revokes Liongard access with
  it, immediately.

**If you run without the gateway**, the plugin README documents a direct
mode where `LIONGARD_INSTANCE` and `LIONGARD_API_KEY` sit in the
technician's MCP config. That mode gives up all four properties above.

## Tool permission tiers

Grouped by blast radius, not HTTP verb.

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Liongard or any inspected system. Safe for autonomous agents. | `liongard_navigate`, `liongard_environments_list`, `liongard_environments_get`, `liongard_environments_count`, `liongard_environments_related`, `liongard_agents_list`, `liongard_inspections_inspectors`, `liongard_inspections_launchpoints`, `liongard_systems_list`, `liongard_systems_get`, `liongard_detections_list`, `liongard_detections_get`, `liongard_metrics_list`, `liongard_metrics_evaluate`, `liongard_metrics_evaluate_systems`, `liongard_inventory_devices`, `liongard_inventory_device_get`, `liongard_inventory_identities`, `liongard_inventory_identity_get`, `liongard_timeline_list` |
| **Write** | Creates Liongard-side configuration, or authenticates to a customer system. Reversible. | `liongard_environments_create`, `liongard_inspections_create_launchpoint`, `liongard_inspections_run` |
| **Destructive** | Removes a customer's data collection. Requires explicit per-call human approval. | `liongard_agents_delete` |

**This plugin cannot touch a customer endpoint, and that is the headline
governance fact about it.** Liongard reads and documents; it does not
remediate. There is no script execution, no patch push, no reboot, no
account disable. Everything an operator wants to *do* about a Liongard
finding happens in the RMM or PSA, under that plugin's tiers.

### Why the classifications land where they do

- **`liongard_agents_delete` is the only destructive tool.** A Liongard
  agent is one piece of software per customer site that runs every
  inspection bound to it. Deleting it does not remove data already
  collected, but every launchpoint that depended on it silently stops
  collecting. The failure mode is a monitoring blind spot that looks
  exactly like "no changes detected" — the customer's configuration
  drift becomes invisible rather than alarming. Recovery needs a
  physical or remote reinstall at the site, which this plugin cannot do.
- **`liongard_inspections_run` is Write, not Destructive**, and that is
  deliberate. It triggers a data collection using stored credentials. It
  changes nothing on the target, so despite the word "run" it does not
  belong in the same tier as an RMM's script execution. Over-classifying
  it would make the destructive tier meaningless. It is not a Read
  either: it consumes a privileged authenticated session against the
  customer's production domain controller, firewall, or M365 tenant, and
  it can trip conditional-access or lockout policies.
- **`liongard_inspections_create_launchpoint` is Write with weight.** A
  launchpoint binds an inspector, an environment, an agent, stored
  credentials, and a cron schedule. Creating one commits the MSP to
  recurring privileged authentication against a customer system on a
  schedule nobody may revisit.
- **`liongard_metrics_evaluate` stays in Read.** It runs a JMESPath
  expression against already-collected inspection data. The expression
  is caller-supplied, but it evaluates over a JSON document — it is not
  a remote-execution surface.

The Liongard REST API's two genuinely catastrophic calls — deleting an
environment and deleting a launchpoint — **are not exposed by this MCP
surface**. Both cascade: they destroy all associated systems,
detections, and historical inspection data with no undo. An agent
cannot reach them here, and if either is ever added it belongs in the
destructive tier immediately. Until then, decommissioning a client is a
console operation a human does, and `Status = Inactive` is the
reversible alternative.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow, generously. Cross-environment change review,
  compliance metric evaluation, and asset correlation are exactly what
  an autonomous agent should be doing with Liongard.
- Write tools: agent drafts the exact call, human approves, then it
  runs. For `liongard_inspections_run`, name the launchpoint and the
  customer; for `create_launchpoint`, the approver should confirm which
  credential the launchpoint will use.
- Destructive tools: `liongard_agents_delete` needs a named human
  approver who has checked which launchpoints are bound to that agent
  first (`liongard_inspections_launchpoints`). Do not grant it to
  scheduled or unattended agents.

## What it cannot reach

- Only the Liongard instance mapped to the operator's gateway identity.
  Liongard URLs are instance-scoped (`https://{instance}.app.liongard.com`)
  and a key is valid on exactly one instance.
- No customer endpoint, in any sense. No shell, no script, no file, no
  reboot.
- Not the credentials themselves. Launchpoint credentials are stored in
  Liongard's vault; no tool in this surface returns a stored secret.
- No filesystem, no shell on the technician's machine, no other
  vendor's data.
- No live event stream. Detections appear only after the next
  inspection runs.

## Data handling

This is the most sensitive read surface in this batch. Liongard's whole
purpose is to concentrate the configuration of every system an MSP
manages into one queryable store, which means an agent with read access
has an unusually complete picture of the client estate.

- `liongard_systems_get` returns raw inspection detail: Active Directory
  users and group membership, firewall rules and VPN configuration,
  Microsoft 365 security settings and licence assignments, backup job
  state, certificate inventory. This is a full configuration blueprint
  of the customer's environment.
- `liongard_inventory_identities` and `liongard_inventory_identity_get`
  return correlated user identities across platforms — names, email
  addresses, and where each account exists.
- `liongard_detections_list` reveals security posture changes, including
  MFA policies being disabled. Read access here is reconnaissance-grade
  intelligence about which clients are currently weakest.
- `liongard_timeline_list` is the audit trail. Preserve it; do not let
  automation depend on being able to alter it (nothing here can).
- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.

## Known sharp edges

- **"Agent" means something different here.** A Liongard agent is a
  per-site inspection runner, not a per-endpoint sensor. An operator who
  reads `liongard_agents_list` expecting an endpoint count will
  misreport coverage by orders of magnitude, and an agent deletion that
  seems to affect "one machine" affects an entire site's collection.
- **Stale data reads as good news.** A system whose inspection stopped
  running keeps returning its last snapshot. Always check
  `LastInspection` before reporting a configuration as current;
  "no detections this month" and "no inspections this month" look
  identical in a summary.
- **Inspections carry privileged credentials.** A launchpoint holds
  Domain Admin or Global Admin-class credentials for the customer's
  environment. Running or scheduling one is spending that privilege.
- **Detections are change events, not alerts.** A detection means
  something changed, not that something is wrong. An agent that escalates
  every `Added` detection will bury the operator in noise and train them
  to ignore the real ones.
- **Credential rotation on the target breaks inspections silently.**
  When a customer changes the Domain Admin password, the launchpoint
  stays `Active` and its runs fail with an authentication error. The
  failure appears in the timeline, not in the launchpoint's own status,
  so a "healthy launchpoints" report can be entirely wrong.
- **Environment names are unique instance-wide.** A create collision
  returns 409 rather than a validation body. An agent retrying a failed
  onboarding can end up creating "ACME 2" and splitting one client's
  history across two environments.
- **300 requests/minute.** Batch-triggering an environment's
  launchpoints needs pacing — roughly 500 ms between runs — both to stay
  under the limit and to avoid swamping the single site agent that has
  to execute all of them.
