# CIPP plugin — governance and safety model

Unofficial. Community-built plugin for the CIPP (CyberDrain Improved
Partner Portal) API. Not affiliated with, endorsed by, or sponsored by
the vendor.

**Read this one carefully.** CIPP is the highest-blast-radius connector
in this marketplace. It acts through a CSP/GDAP delegation, which means
a single tool call reaches into a customer's production Microsoft 365
tenant with partner-level privilege — and `tenantFilter='allTenants'`
reaches into every one of them at once.

## What it connects as

This plugin does not hold credentials. It reaches CIPP through the WYRE
Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenants the
operator is authorised for.

- No CIPP API client ID or secret is stored on the technician's machine,
  in this repo, or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who reset this user's MFA" — CIPP's own log records the API client,
  and the customer's M365 audit log records the delegated partner
  principal. Neither names the technician.
- Revoking gateway access revokes CIPP access with it, immediately.

## Tool permission tiers

Classified by blast radius in the **customer's** tenant, not by HTTP
verb. Several tools whose names read like reads or routine updates sit
in the destructive tier; the justifications follow the table.

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change tenant or CIPP state. Safe for autonomous agents. | `cipp_ping`, `cipp_get_version`, `cipp_list_logs`, `cipp_list_tenants`, `cipp_get_tenant_details`, `cipp_get_tenant_alignment`, `cipp_get_tenant_drift`, `cipp_list_users`, `cipp_list_mfa_users`, `cipp_list_user_devices`, `cipp_list_user_groups`, `cipp_list_groups`, `cipp_list_mailboxes`, `cipp_list_mailbox_permissions`, `cipp_list_licenses`, `cipp_list_csp_licenses`, `cipp_list_conditional_access_policies`, `cipp_list_named_locations`, `cipp_list_standards`, `cipp_list_standard_templates`, `cipp_list_bpa`, `cipp_list_domain_health`, `cipp_list_alert_queue`, `cipp_list_audit_logs`, `cipp_list_enterprise_apps`, `cipp_list_gdap_roles`, `cipp_list_gdap_invites`, `cipp_list_scheduled_items`, `cipp_bec_check` |
| **Write** | Creates or modifies records. Reversible, but visible to the customer. | `cipp_create_user`, `cipp_edit_user`, `cipp_create_group`, `cipp_set_out_of_office`, `cipp_create_standard_template` |
| **Destructive** | Locks users out, revokes access, rewrites tenant configuration, or schedules unattended execution. Requires explicit per-call human approval. | `cipp_disable_user`, `cipp_offboard_user`, `cipp_reset_password`, `cipp_reset_mfa`, `cipp_revoke_sessions`, `cipp_set_email_forwarding`, `cipp_run_standards_check`, `cipp_add_scheduled_item`, `cipp_delete_standard_template` |

`cipp_get_tenant_alignment`, `cipp_get_tenant_drift`,
`cipp_list_enterprise_apps`, `cipp_list_standard_templates`,
`cipp_create_standard_template`, and `cipp_delete_standard_template` are
registered by the MCP server but not yet covered by a skill. They are
tiered here because a gateway allowlist has to account for everything
the server exposes, not just what the plugin documents.

### Why these sit in the destructive tier

The account-lockout group is the obvious half. `cipp_disable_user`,
`cipp_reset_password`, `cipp_reset_mfa`, and `cipp_revoke_sessions` all
read like routine updates and all end with a real person unable to sign
in to a production tenant. `cipp_reset_mfa` clears **every** registered
method — under a Conditional Access policy that requires MFA, the user
cannot authenticate at all until they re-enrol, and they usually cannot
re-enrol without signing in. `cipp_offboard_user` bundles the whole
sequence behind one call.

The other four are the ones a reviewer is most likely to challenge:

- **`cipp_run_standards_check`** — the name says "check" and the skill
  describes it as an on-demand evaluation. But any standard configured
  in `Remediate` mode **auto-fixes tenant configuration when the
  evaluation runs**, with no further confirmation. Against
  `tenantFilter='allTenants'` this is a portfolio-wide configuration
  push triggered by a call that looks like a read. This is the closest
  analogue in CIPP to Huntress's `huntress_incidents_bulk_approve`: a
  bookkeeping-shaped verb whose real effect lands on production.
- **`cipp_add_scheduled_item`** — takes an arbitrary CIPP `command` and
  a recurrence. Scheduling a job defers execution past every approval
  gate: whatever a human declined to approve now runs unattended later.
  CIPP does not validate the command against known job types and does
  not dedupe by name, so a typo creates a silently-failing job and a
  repeat call creates a duplicate that fires twice.
- **`cipp_set_email_forwarding`** — destructive in both directions.
  Setting a forwarding address routes a user's mail to a third party,
  which is the exact shape of a BEC exfiltration rule. Setting
  `disable=true` removes **all** forwarding including legitimate
  business rules, and the prior configuration is not recoverable through
  this API.
- **`cipp_delete_standard_template`** — deletes a baseline definition
  the MSP's tenants are measured against.

`cipp_create_user` stays in Write. It is additive and reversible — but
note that it consumes a licence, so it has a billing consequence, and
`usageLocation` must be set at create time or no licence can be
assigned later.

`cipp_bec_check` stays in Read. It is a forensic report and changes
nothing; its risk is what it returns, not what it does. See Data
handling.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Portfolio audits, MFA gap reports, licence
  rightsizing, and BPA sweeps are the intended autonomous use.
- Write tools: agent drafts the exact call — including the resolved
  `tenantFilter` and `userId` — a human approves, then it runs.
- Destructive tools: require a **named human approver per invocation**.
  Do not grant these to scheduled or unattended agents. `cipp_offboard_user`
  and `cipp_run_standards_check` in particular should never be reachable
  by an agent running without a person watching.
- **Treat `tenantFilter='allTenants'` as its own permission.** It turns
  any tool into a portfolio-wide operation. Several read tools accept
  it, and `cipp_run_standards_check` does too.
- Require the agent to resolve and **state the tenant by display name**
  before any write or destructive call. `cipp_list_tenants` returns
  several tenants with similar names in most portfolios, and
  `tenantFilter` accepts four different identifier formats.

## What it cannot reach

- Only the M365 tenants CIPP has onboarded **and** for which an active
  GDAP relationship grants the required roles. A broken or expired GDAP
  relationship silently narrows what any tool can do.
- No filesystem, no shell, no other vendor's data.
- **No Conditional Access writes.** CA policies are readable only. Policy
  rollout happens through standards or the CIPP UI — which is precisely
  why `cipp_run_standards_check` is tiered destructive.
- No inbox-rule, transport-rule, mail-flow, or quarantine management —
  those require the CIPP UI or Exchange Online PowerShell.
- No group membership writes. Groups can be listed and created; adding
  or removing a member is not in this surface.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- **`cipp_reset_password` returns a plaintext password** when called
  without one — CIPP generates it. That credential lands in the model's
  context and in the transcript. Treat any session that calls it as
  containing a live secret, and deliver the password through a secure
  channel rather than the chat surface.
- **`cipp_bec_check` is the heaviest PII read here.** It returns a
  user's recent sign-in locations and IPs, mailbox forwarding and inbox
  rules, MFA changes, and app-consent grants — a complete behavioural
  profile of one employee.
- `cipp_list_users`, `cipp_list_mfa_users`, `cipp_list_mailboxes`,
  `cipp_list_mailbox_permissions`, and `cipp_list_user_devices` return
  customer-employee PII: names, UPNs, device identifiers, and who can
  read whose mailbox.
- `cipp_list_audit_logs` returns the customer's activity trail
  attributable to named users.
- `cipp_list_licenses` and `cipp_list_csp_licenses` return commercial
  data — the MSP's CSP position across the portfolio. Do not let
  portfolio-level licence output reach a single customer's report.
- `cipp_list_tenants` returns the MSP's full client roster.

## Known sharp edges

- **Two near-identical log tools.** `cipp_list_logs` returns CIPP's own
  application log; `cipp_list_audit_logs` returns the *customer's* M365
  unified audit log. An investigation run against the wrong one produces
  a confident, empty, wrong answer.
- **Ordering matters in a BEC response.** Run `cipp_bec_check` **before**
  revoking sessions or resetting credentials — it captures the forensic
  snapshot while session telemetry is still live. An agent that disables
  the account first destroys the evidence it was asked to gather.
- **`enabledForReportingButNotEnforced` looks like coverage.** A CA
  policy in that state enforces nothing. Any posture summary that counts
  policies rather than checking `state == 'enabled'` overstates the
  tenant's security.
- **Standards `Remediate` mode changes tenants without asking.** The
  progression `Report` → `Alert` → `Remediate` exists so a human
  validates auto-remediation before it is live. An agent must never
  promote a standard's mode, and should treat any tenant with
  `Remediate` standards as one where evaluation is a write.
- **Audit retention is licence-dependent.** 90 days on E3, a year on E5.
  An investigation window that predates retention returns empty results
  that look like "nothing happened."
- **Stale GDAP is the number one cause of partial failures.** Bulk
  operations against a tenant with a broken relationship fail silently
  or apply to only some users. Run the `cipp-ops` pre-flight check
  before any bulk run.
- **`consumedUnits` lags the live tenant.** Do not let an agent make
  licence-reclaim decisions from a number that is minutes stale.
