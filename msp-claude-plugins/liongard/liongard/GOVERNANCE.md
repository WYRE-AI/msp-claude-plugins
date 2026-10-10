# Liongard plugin — governance and safety model

Unofficial. Community-built plugin for the Liongard (ROAR) API. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

The supported deployment reaches Liongard through the WYRE Conduit
gateway (`https://conduit.wyre.ai/v1/liongard/mcp`), which brokers
authentication centrally and scopes every call to the instance the
operator is authorised for.

Consequences worth stating plainly:

- No Liongard instance name or `X-ROAR-API-KEY` value is stored on the
  technician's machine, in this repo, or in the model's context.
- Credential rotation happens once at Conduit, not per technician.
  Liongard is an API-key vendor, not OAuth, so "rotation" means
  re-submitting the connect form — there is no rotate action.
- Every call carries operator identity, so Conduit's audit log answers
  "who deleted that agent". Liongard's timeline records the API key's
  identity, which is shared. The log records *who called what*, never
  with what arguments — so it will name `liongard_agents_delete` but not
  which agent.
- Complete offboarding in the gateway console, and confirm the person no longer has access before you treat it as done.

**If you run without the gateway**, the plugin README documents a direct
mode where `LIONGARD_INSTANCE` and `LIONGARD_API_KEY` sit in the
technician's MCP config. That mode gives up all four properties above,
and no tier is enforced at all.

## Tool permission groups

That makes this one of the few plugins in the marketplace whose table is enforceable as written.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change Liongard or any inspected system. Safe for autonomous agents. | `read` | `liongard_environments_list`, `liongard_environments_get`, `liongard_environments_count`, `liongard_environments_related`, `liongard_agents_list`, `liongard_inspections_inspectors`, `liongard_inspections_launchpoints`, `liongard_systems_list`, `liongard_systems_get`, `liongard_detections_get`, `liongard_metrics_list`, `liongard_inventory_device_get`, `liongard_inventory_identity_get`, `liongard_timeline_list` |
| **Write** | Creates Liongard-side configuration, or executes an evaluation rule. Reversible. | `write` | `liongard_environments_create`, `liongard_inspections_create_launchpoint`, `liongard_metrics_evaluate`, `liongard_metrics_evaluate_systems` |
| **Delete** | — | `write` — **not** a tier of its own | **Empty.** The one deletion tool this plugin has is classified `admin`, so it is not in this group. See below. |
| **Admin** | Unbounded filter-DSL query surfaces, and anything that acts on customer infrastructure. | `admin` | `liongard_detections_list`, `liongard_inventory_devices`, `liongard_inventory_identities`, `liongard_inspections_run`, `liongard_agents_delete` |

Use `conduit__my_access`.

**This plugin cannot touch a customer endpoint, and that is the headline
governance fact about it.** Liongard reads and documents; it does not
remediate. There is no script execution, no patch push, no reboot, no
account disable. Everything an operator wants to *do* about a Liongard
finding happens in the RMM or PSA, under that plugin's tiers.

### Where the mechanical tier and the risk judgement disagree

An earlier revision of this document grouped these tools by blast radius
into Read / Write / Destructive. Conduit does not have those tiers, and
on six tools its classification lands somewhere different. Both readings
are given, because both are useful: the tier is what will actually be
enforced, and the commentary is why an operator should care.

- **`liongard_agents_delete` is `admin`, not `write` — and that is
  better than it looks.** A Liongard agent is one piece of software per
  customer site that runs every inspection bound to it. Deleting it does
  not remove data already collected, but every launchpoint that depended
  on it silently stops collecting. The failure mode is a monitoring
  blind spot that looks exactly like "no changes detected" — the
  customer's configuration drift becomes invisible rather than alarming.
  Recovery needs a physical or remote reinstall at the site, which this
  plugin cannot do.

Because the presentation-layer **Delete** group is a subset of *write*-classified tools, an admin-classified deletion tool lands in the **Admin** group instead.

- Their singular siblings (`liongard_detections_get`, `liongard_inventory_device_get`, `liongard_inventory_identity_get`) take an id and stay `read`. If a reporting agent is denied a "list all devices" call, that asymmetry is the reason, and it is deliberate.

- **`liongard_inspections_run` is `admin`, not `write`.** It triggers a
  data collection using stored credentials. It changes nothing on the
  target — so despite the word "run" it is not an RMM's script execution
  — but it consumes a privileged authenticated session against the
  customer's production domain controller, firewall, or M365 tenant, and
  it can trip conditional-access or lockout policies. Conduit treats an
  infra-discovery probe against customer infrastructure as an unbounded
  tenant-side effect, in the same class as `liongard_agents_delete` and
  `cipp_run_standards_check`. That is a stricter reading than this
  document previously took, and the stricter reading is the one enforced.

- **`liongard_metrics_evaluate` and `liongard_metrics_evaluate_systems` are `write`, not `read`.** They run a JMESPath expression against already-collected inspection data — no remote execution, no change to any customer system — so the earlier "this is a read" argument is defensible on blast radius. Practical effect: a read-only reporting agent cannot evaluate a compliance metric.

- **`liongard_inspections_create_launchpoint` is `write` with weight.** A
  launchpoint binds an inspector, an environment, an agent, stored
  credentials, and a cron schedule. Creating one commits the MSP to
  recurring privileged authentication against a customer system on a
  schedule nobody may revisit. It sits in the same grant as
  `liongard_environments_create`, which is far more benign.

The Liongard REST API's two genuinely catastrophic calls — deleting an environment and deleting a launchpoint — **are not exposed by this MCP surface**. Both cascade: they destroy all associated systems, detections, and historical inspection data with no undo. An agent cannot reach them here. Until then, decommissioning a client is a console operation a human does, and `Status = Inactive` is the reversible alternative.

Confirm the live permission grant in the gateway access editor before you rely on a tier in this document. This note does not describe gateway enforcement internals.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve deletes.**

- Read tools: allow, generously. Cross-environment change review and
  asset correlation by id are exactly what an autonomous agent should be
  doing with Liongard. Note that the bulk list/filter tools are `admin`,
  so a `read` agent works from ids, not sweeps.
- Write tools: agent drafts the exact call, human approves, then it
  runs. For `create_launchpoint`, the approver should confirm which
  credential the launchpoint will use.
- Admin tools: this is where `liongard_inspections_run` and
  `liongard_agents_delete` both live, so the grant means "may spend the
  customer's privileged credentials, and may end a site's data
  collection". Do not give it to scheduled or unattended agents. Before
  any `liongard_agents_delete`, a named human should check which
  launchpoints are bound to that agent
  (`liongard_inspections_launchpoints`) — Conduit will not prompt for
  this, and nothing will stop the call.

## What it cannot reach

- Only the Liongard instance the connected credential can reach. Conduit
  controls *who in your organisation may use that credential and which
  tools they may call*, not which slice of Liongard's data comes back.
  Liongard URLs are instance-scoped
  (`https://{instance}.app.liongard.com`) and a key is valid on exactly
  one instance.
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
  of the customer's environment, and it is classified `read`.
- `liongard_inventory_identities` and `liongard_inventory_identity_get`
  return correlated user identities across platforms — names, email
  addresses, and where each account exists. The bulk form is `admin`
  (credential-adjacent data behind an unbounded filter); the by-id form
  is `read`.
- `liongard_detections_list` reveals security posture changes, including
  MFA policies being disabled. This is reconnaissance-grade intelligence
  about which clients are currently weakest, which is why it is `admin`
  rather than `read`.
- `liongard_timeline_list` is the audit trail. Preserve it; do not let
  automation depend on being able to alter it (nothing here can).
- Responses pass through Conduit into model context for the session
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
  identical in a summary. This is the same failure mode a deleted agent
  produces, which is why that tool is treated as harshly as it is.
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
