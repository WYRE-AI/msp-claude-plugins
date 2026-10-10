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
- Credential rotation happens once at Conduit, not per technician. CIPP
  is not an OAuth vendor there, so rotation means re-submitting the
  connect form; nothing tracks credential age for you.
- Every call carries operator identity, so Conduit's audit log answers
  "who reset this user's MFA" — CIPP's own log records the API client,
  and the customer's M365 audit log records the delegated partner
  principal. Neither names the technician. Conduit records *who called
  what*, never with what arguments, so the log will not tell you which
  `tenantFilter` a call used.
- Complete offboarding in the gateway console, and confirm the person no longer has access before you treat it as done.

## Tool permission groups

CIPP is the vendor where the mechanical tier and an author's risk
judgement diverge most, in both directions. The table states the tier;
the sections after it state the risk.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change tenant or CIPP state, and returns nothing Conduit treats as security-assessment data. | `read` | `cipp_ping`, `cipp_get_version`, `cipp_list_tenants`, `cipp_list_users`, `cipp_list_user_groups`, `cipp_list_mailboxes`, `cipp_list_licenses`, `cipp_list_csp_licenses`, `cipp_list_standards`, `cipp_list_domain_health`, `cipp_list_scheduled_items` |
| **Write** | Creates or modifies records. Reversible, but visible to the customer. | `write` | `cipp_create_group` — **and nothing else.** |
| **Delete** | Empty for this vendor. `cipp_delete_standard_template` is listed with the admin tools. | confirm the live grant | *None.* |
| **Admin** | Everything that touches identity, tenant configuration, scheduling, or security-assessment data — reads included. | `admin` | **Sensitive reads:** `cipp_list_logs`, `cipp_list_audit_logs`, `cipp_list_alert_queue`, `cipp_get_tenant_details`, `cipp_get_tenant_alignment`, `cipp_get_tenant_drift`, `cipp_list_mfa_users`, `cipp_list_user_devices`, `cipp_list_groups`, `cipp_list_mailbox_permissions`, `cipp_list_conditional_access_policies`, `cipp_list_named_locations`, `cipp_list_bpa`, `cipp_list_gdap_roles`, `cipp_list_gdap_invites`, `cipp_bec_check`. **Mutations:** `cipp_create_user`, `cipp_edit_user`, `cipp_set_out_of_office`, `cipp_disable_user`, `cipp_offboard_user`, `cipp_reset_password`, `cipp_reset_mfa`, `cipp_revoke_sessions`, `cipp_set_email_forwarding`, `cipp_run_standards_check`, `cipp_add_scheduled_item`, `cipp_delete_standard_template` |

Confirm the live permission grant in the gateway access editor before you rely on a tier in this document. This note does not describe gateway enforcement internals.

### There is no per-call approval step

An earlier revision of this document said the destructive tier "requires explicit per-call human approval"; nothing enforced that sentence, and it has been removed rather than softened. Per-call approval is a workflow you impose on your agents, and it is only as good as the agent configuration that carries it.

### Why several `admin` tools deserve more care than their tier implies

It puts these tools in the right bucket, but it does not tell you why they are the ones to lose sleep over.

The account-lockout group is the obvious half. `cipp_disable_user`,
`cipp_reset_password`, `cipp_reset_mfa`, and `cipp_revoke_sessions` all
read like routine updates and all end with a real person unable to sign
in to a production tenant. `cipp_reset_mfa` clears **every** registered
method — under a Conditional Access policy that requires MFA, the user
cannot authenticate at all until they re-enrol, and they usually cannot
re-enrol without signing in. `cipp_offboard_user` bundles the whole
sequence behind one call.

The other four are the ones a reviewer is most likely to challenge:

- **`cipp_run_standards_check`** — the name says "check" and the skill describes it as an on-demand evaluation. But any standard configured in `Remediate` mode **auto-fixes tenant configuration when the evaluation runs**, with no further confirmation. Against `tenantFilter='allTenants'` this is a portfolio-wide configuration push triggered by a call that looks like a read.
- **`cipp_add_scheduled_item`** — takes an arbitrary CIPP `command` and
  a recurrence. Scheduling a job defers execution past every approval
  gate your own workflow imposes: whatever a human declined to approve
  now runs unattended later. CIPP does not validate the command against
  known job types and does not dedupe by name, so a typo creates a
  silently-failing job and a repeat call creates a duplicate that fires
  twice.
- **`cipp_set_email_forwarding`** — damaging in both directions.
  Setting a forwarding address routes a user's mail to a third party,
  which is the exact shape of a BEC exfiltration rule. Setting
  `disable=true` removes **all** forwarding including legitimate
  business rules, and the prior configuration is not recoverable through
  this API.
- **`cipp_delete_standard_template`** — deletes a baseline definition the MSP's tenants are measured against.

`cipp_create_user` is `admin` too. It is additive and reversible — but
note that it consumes a licence, so it has a billing consequence, and
`usageLocation` must be set at create time or no licence can be assigned
later.

`cipp_bec_check` changes nothing in the tenant; Conduit still requires
`admin` for it, because the risk is what it returns rather than what it
does. See *Data handling*. The same reasoning puts `cipp_list_bpa`,
`cipp_get_tenant_drift`, `cipp_get_tenant_alignment`, and the audit-log
readers at `admin`: they are security-assessment data about a customer,
and Conduit tiers them by what a leak would cost, not by HTTP verb.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve an identity or configuration change.**

- Read tools: allow. Licence rightsizing and tenant inventory are the
  intended autonomous use — but note that most of the interesting
  posture reads are `admin`-tiered, so an agent restricted to `read`
  sees far less of CIPP than the word suggests.
- `cipp_create_group` is the only `write`-tier tool. The agent should
  draft the exact call — including the resolved `tenantFilter` — and a
  human approves before it runs.
- Admin tools: treat the grant as equivalent to full CSP/GDAP partner administrator across every onboarded tenant, because that is what it is. Do not grant it to scheduled or unattended agents.
- Several reads accept it, and `cipp_run_standards_check` does too.
- Require the agent to resolve and **state the tenant by display name**
  before any mutating call. `cipp_list_tenants` returns several tenants
  with similar names in most portfolios, and `tenantFilter` accepts four
  different identifier formats.

## What it cannot reach

- Only the M365 tenants CIPP has onboarded **and** for which an active
  GDAP relationship grants the required roles. A broken or expired GDAP
  relationship silently narrows what any tool can do. Conduit controls
  *who in your organisation may use the CIPP credential and which tools
  they may call*, not which tenants come back; scope at CIPP and at GDAP
  if you need a narrower boundary.
- No filesystem, no shell, no other vendor's data.
- **No Conditional Access writes.** CA policies are readable only. Policy
  rollout happens through standards or the CIPP UI — which is precisely
  why `cipp_run_standards_check` carries the risk it does.
- No inbox-rule, transport-rule, mail-flow, or quarantine management —
  those require the CIPP UI or Exchange Online PowerShell.
- No group membership writes. Groups can be listed and created; adding
  or removing a member is not in this surface.

## Data handling

- Responses pass through Conduit into model context for the session and
  are not persisted by this plugin.
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
