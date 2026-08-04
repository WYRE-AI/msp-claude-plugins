# SaaS Alerts plugin — governance and safety model

Unofficial. Community-built plugin for the SaaS Alerts API. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches SaaS Alerts through
the WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which
brokers authentication centrally and scopes every call to the tenant the
operator is authorised for.

- No SaaS Alerts partner API key is stored on the technician's machine,
  in this repo, or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who suppressed that alert" — SaaS Alerts' own log records only the
  partner API account.
- Revoking gateway access revokes SaaS Alerts access with it,
  immediately.

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change SaaS Alerts state or monitored tenants. Safe for autonomous agents. | `saas_alerts_status`, `saas_alerts_navigate`, `saas_alerts_customers_list`, `saas_alerts_customers_get`, `saas_alerts_events_query`, `saas_alerts_events_query_advanced`, `saas_alerts_events_count`, `saas_alerts_events_count_advanced`, `saas_alerts_events_scroll`, `saas_alerts_recommended_actions`, `saas_alerts_users_get_msp`, `saas_alerts_users_list_partner`, `saas_alerts_users_list_by_customer`, `saas_alerts_devices_list_mapped`, `saas_alerts_devices_list_unmapped`, `saas_alerts_devices_list_ignored`, `saas_alerts_devices_list_orgs`, `saas_alerts_reports_list_scheduled`, `saas_alerts_reports_get_scheduled`, `saas_alerts_billing_list_dates`, `saas_alerts_billing_get_details`, `saas_alerts_partner_get_profile` |
| **Write** | Creates or modifies records. Reversible, but visible to the customer. | `saas_alerts_customers_create`, `saas_alerts_customers_update`, `saas_alerts_reports_create_scheduled`, `saas_alerts_partner_update_branding` |
| **Destructive** | Removes monitoring or blinds detection. Requires explicit per-call human approval. | `saas_alerts_customers_set_whitelists`, `saas_alerts_customers_set_account_whitelists`, `saas_alerts_customers_delete`, `saas_alerts_reports_delete_scheduled` |

The two whitelist setters are the entries most likely to be
mis-classified, so state the reasoning plainly. A whitelist in SaaS
Alerts **suppresses detection**. Adding an entry does not adjust a
preference — it stops the platform raising alerts for that condition, in
that customer's tenant, from that moment on. Nothing fires to announce
it; the effect is an absence, and absences do not show up in a triage
sweep. That is a security control being switched off for a paying
client, which is destructive by blast radius no matter how ordinary the
HTTP verb looks.

They are also **set**, not **add**. Each call replaces the customer's
whitelist with whatever payload it is given, so an agent that
"adds an entry" by sending a single item silently deletes every existing
entry. Always read the current list first, and require the approver to
confirm the full resulting list rather than just the new item.

`saas_alerts_customers_delete` removes a monitored customer outright,
which ends monitoring for that tenant and takes its alert history with
it.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve a suppression.**

- Read tools: allow. Cross-tenant critical sweeps, per-customer
  summaries, and impossible-travel pattern hunts are the intended
  autonomous use.
- Write tools: agent drafts the exact call, human approves, then it runs.
  `saas_alerts_partner_update_branding` reaches customer-facing reports,
  so treat it as customer-visible even though it is trivially
  reversible.
- Destructive tools: require a named human approver per invocation. Do
  not grant these to scheduled or unattended agents. Whitelist changes
  in particular should carry a documented reason and an expiry review —
  a suppression added during one incident tends to outlive it by years.

## What it cannot reach

- Only the SaaS Alerts customers beneath the partner account mapped to
  the operator's gateway identity.
- No filesystem, no shell, no other vendor's data.
- **No Microsoft 365 or Google Workspace tenant.** This is the boundary
  that surprises people most. SaaS Alerts observes SaaS audit logs; it
  cannot disable an account, revoke sessions, reset MFA, block a
  sign-in, or remove a mailbox rule. `saas_alerts_recommended_actions`
  returns guidance for a human to carry out elsewhere, not an executable
  step. Actual M365 remediation runs through the CIPP connector, under
  its own governance.
- No live event stream. Every query is point-in-time.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `saas_alerts_users_list_by_customer` and `saas_alerts_users_list_partner`
  return end-user PII — names and email addresses — for every managed
  tenant. Event payloads add source IP addresses, geolocation, device
  fingerprints, and sign-in times, which together describe an
  identifiable person's movements. Restrict these if your agents run
  unattended.
- `saas_alerts_billing_*` returns commercial data. `saas_alerts_partner_get_profile`
  returns MSP account details.
- Cross-tenant queries (`*_advanced`) can pull the whole customer base
  into a single context window. Scope them.

## Known sharp edges

- **An empty result is a real answer.** No events for a customer means
  no events, not a failed call. An agent that invents alerts to fill a
  quiet report is worse than one that reports nothing; the MCP server's
  `emptyGuard` signal distinguishes a genuine empty from an error.
- **Missing alerts may be suppressed, not absent.** If an expected alert
  never appears, check the customer's whitelist configuration before
  concluding the tenant is clean.
- **Time window changes the answer.** A one-hour sweep that returns
  nothing may return dozens at twenty-four hours. Every finding an agent
  reports must state the window it used.
- **Per-partner rate limits bite mid-sweep.** A large multi-tenant run
  can start returning 429s partway through, which looks like "those
  customers were clean". Back off and re-run rather than reporting a
  truncated sweep as complete.
- **Recommended actions are vendor-generated text.** They are a starting
  point for an analyst, not a validated runbook, and they assume
  permissions this plugin does not have.
