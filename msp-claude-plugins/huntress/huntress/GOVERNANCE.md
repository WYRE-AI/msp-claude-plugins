# Huntress plugin — governance and safety model

Unofficial. Community-built plugin for the Huntress API. Not affiliated
with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Huntress through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenant the
operator is authorised for.

- No Huntress API key or secret is stored on the technician's machine,
  in this repo, or in the model's context.
- Credential rotation happens once at Conduit, not per technician.
  Huntress is not an OAuth vendor, so rotation means re-submitting the
  connect form; nothing tracks credential age for you.
- Every call carries operator identity, so Conduit's audit log answers
  "who approved this remediation" — Huntress's own log records only the
  API account. It records *who called what*, never with what arguments.
- Complete offboarding in the gateway console, and confirm the person no longer has access before you treat it as done.

## Tool permission groups

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change Huntress or endpoint state. Safe for autonomous agents. | `read` | `huntress_accounts_get`, `huntress_accounts_actor`, `huntress_agents_list`, `huntress_agents_get`, `huntress_incidents_list`, `huntress_incidents_get`, `huntress_incidents_remediations`, `huntress_incidents_remediation_get`, `huntress_signals_list`, `huntress_signals_get`, `huntress_escalations_list`, `huntress_escalations_get`, `huntress_organizations_list`, `huntress_organizations_get`, `huntress_users_list`, `huntress_users_get`, `huntress_billing_reports_list`, `huntress_billing_reports_get`, `huntress_summary_reports_list`, `huntress_summary_reports_get`, `huntress_status` |
| **Write** | Changes Huntress-side records — **and instructs Huntress to act on customer endpoints.** | `write` | `huntress_incidents_resolve`, `huntress_escalations_resolve`, `huntress_organizations_create`, `huntress_organizations_update`, `huntress_incidents_bulk_approve`, `huntress_incidents_bulk_reject` |
| **Delete** |confirm the live grant|`write`| *None.* |
| **Admin** | Creates, changes, or removes people and organizations in the Huntress account itself. | `admin` | `huntress_users_create`, `huntress_users_update`, `huntress_users_delete`, `huntress_organizations_delete` |

One tool shipped by the server is absent from the table.

### The Write row is the one to read twice

`huntress_incidents_bulk_approve` enforces at tier **`write`**. That is
the most consequential line in this document, because approving a
remediation is not a bookkeeping change — it instructs Huntress to act on
the endpoint (terminate processes, remove persistence, isolate the host).
The blast radius is the customer's production machine, and `bulk_` means
it lands across many at once.

That is a defensible mechanical judgement. It does not change the operational one: **anyone holding `write` on Huntress can order endpoint remediation across a customer's fleet, with no further gate.** If that is not what you meant by "write", use a granular per-tool selection.

`huntress_incidents_bulk_reject` is the same tier for the same reason,
and rejection is not undo — see *Known sharp edges*.

The provisioning split runs the other way and is worth noticing:
`huntress_organizations_create` and `_update` are `write`, while
`huntress_organizations_delete` and the whole `huntress_users_*` mutation
family are `admin`. Adding a Huntress user is an `admin` action here even
though it reads like a routine write.

Confirm the live permission grant in the gateway access editor before you rely on a tier in this document. This note does not describe gateway enforcement internals.

### There is no per-call approval step

An earlier revision of this document said destructive tools "require explicit per-call human approval"; nothing enforced that sentence, and it has been removed rather than softened. Per-call approval is a workflow you impose on your agents, and it is only as good as the agent configuration that carries it.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve a remediation.**

- Read tools: allow. Cross-tenant triage sweeps and reporting are the
  intended autonomous use.
- Write tools: agent drafts the exact call, human approves, then it runs.
- `huntress_incidents_bulk_approve` / `huntress_incidents_bulk_reject`: require a named human approver per invocation and do not grant them to scheduled or unattended agents.
- Admin tools: treat the grant as equivalent to full Huntress account
  administrator. It is the only tier that can delete an organization or a
  user, and it also unlocks every write tool beneath it.

## What it cannot reach

- Only the Huntress organizations the connected credential can reach.
  Conduit controls *who in your organisation may use that credential and
  which tools they may call*, not which slice of Huntress's data comes
  back. A standard API credential scopes to one Huntress account; only
  reseller-scoped credentials see multiple. Scope the credential at
  Huntress if you need a narrower boundary.
- No filesystem, no shell, no other vendor's data.
- No live event stream. Every tool is point-in-time; Huntress webhooks
  carry the push feed.

## Data handling

- Responses pass through Conduit into model context for the session and
  are not persisted by this plugin.
- `huntress_users_list` / `huntress_users_get` return partner staff PII
  (names, email addresses). `huntress_billing_reports_*` returns
  commercial data. Restrict these if your agents run unattended.

## Known sharp edges

- **Ordering constraint.** An incident resolves only after every
  attached remediation is approved or rejected. An agent that calls
  `huntress_incidents_resolve` first will get an error that reads like a
  permissions failure.
- **Rejection is not undo.** `huntress_incidents_bulk_reject` declines a
  SOC recommendation; it does not roll back a remediation already
  approved and executed.
- **Deployed agents ≠ invoiced seats.** The two legitimately diverge.
  Do not let an agent "correct" billing from agent counts without a
  human reconciling first.
