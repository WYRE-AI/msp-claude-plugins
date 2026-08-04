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
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who approved this remediation" — Huntress's own log records only the
  API account.
- Revoking gateway access revokes Huntress access with it, immediately.

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Huntress or endpoint state. Safe for autonomous agents. | `huntress_accounts_get`, `huntress_accounts_actor`, `huntress_agents_list`, `huntress_agents_get`, `huntress_incidents_list`, `huntress_incidents_get`, `huntress_incidents_remediations`, `huntress_incidents_remediation_get`, `huntress_signals_list`, `huntress_signals_get`, `huntress_escalations_list`, `huntress_escalations_get`, `huntress_organizations_list`, `huntress_organizations_get`, `huntress_users_list`, `huntress_users_get`, `huntress_billing_reports_list`, `huntress_billing_reports_get`, `huntress_summary_reports_list`, `huntress_summary_reports_get`, `huntress_status` |
| **Write** | Changes Huntress-side records. Reversible, customer-visible. | `huntress_incidents_resolve`, `huntress_escalations_resolve`, `huntress_organizations_create`, `huntress_organizations_update`, `huntress_users_create`, `huntress_users_update` |
| **Destructive** | Acts on customer endpoints, or removes access. Requires explicit per-call human approval. | `huntress_incidents_bulk_approve`, `huntress_incidents_bulk_reject`, `huntress_organizations_delete`, `huntress_users_delete` |

`huntress_incidents_bulk_approve` sits in the destructive tier
deliberately. Approving a remediation is not a bookkeeping change — it
instructs Huntress to act on the endpoint (terminate processes, remove
persistence, isolate the host). The blast radius is the customer's
production machine, and `bulk_` means it lands across many at once.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Cross-tenant triage sweeps and reporting are the
  intended autonomous use.
- Write tools: agent drafts the exact call, human approves, then it runs.
- Destructive tools: require a named human approver per invocation.
  Do not grant these to scheduled or unattended agents.

## What it cannot reach

- Only the Huntress organizations mapped to the operator's gateway
  identity. A standard API credential scopes to one Huntress account;
  only reseller-scoped credentials see multiple.
- No filesystem, no shell, no other vendor's data.
- No live event stream. Every tool is point-in-time; Huntress webhooks
  carry the push feed.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
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
