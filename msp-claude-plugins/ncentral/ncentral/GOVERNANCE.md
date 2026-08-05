# N-central plugin — governance and safety model

Unofficial. Community-built plugin for the N-able N-central API. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches N-central through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/ncentral/mcp`), which
brokers authentication centrally and scopes every call to the server the
operator is authorised for.

- No User-API Token (JWT) or server URL is stored on the technician's
  machine, in this repo, or in the model's context. Both are entered
  once in Conduit's connect page and injected server-side per request.
- The gateway exchanges the permanent JWT for short-lived access and
  refresh tokens and rotates them transparently. No token lifecycle
  happens client-side.
- Every call carries operator identity, so the gateway audit log answers
  "who dispatched that direct task". N-central's own log records only
  the API user the token belongs to.
- Revoking a technician's gateway access revokes N-central access with
  it, immediately.

Unlike the SaaS RMMs in this batch, every MSP runs its own N-central
server. Conduit must be able to reach it over HTTPS, which for an
on-prem deployment means deliberately opening an inbound path. That is a
network-perimeter decision, not just a plugin decision.

The API user behind the JWT is the real boundary. It must have MFA
disabled — N-central rejects token auth for MFA-enabled users — so it is
a standing, non-MFA account whose role and access groups determine
everything an agent can see or do. Create a dedicated least-privilege
API user; do not attach the token to a technician's own account.

## Tool permission tiers

Grouped by blast radius, not HTTP verb. Two of the three destructive
entries are GET requests.

> **Not classified in Conduit — every tool in the table below requires tier
> `admin` today.** Conduit derives a tool's tier from `VENDOR_TOOL_CONFIG`
> (`src/proxy/result-cache.ts`) and fails closed:
> `const requiredTier: PermissionTier = classified ?? 'admin';`
> (`src/access/access-enforcement.ts:63`). `ncentral` has no entry there, so
> the grouping below carries no enforcement meaning at present — read tools
> included. A `read` or `write` grant on this vendor admits nothing; an
> `admin` grant admits everything, including `ncentral_create_direct_task`.
> The grouping becomes what Conduit actually enforces once the vendor is
> classified, and classifying it is a privilege *reduction*, not an
> expansion. For the live list of unclassified vendors see
> `wyre-gateway/GOVERNANCE.md`, *Fail-closed, and the vendors Conduit has not
> classified* — it is stated once there because it moves.
>
> *Editor's note: when `ncentral` gains a `VENDOR_TOOL_CONFIG` entry, delete
> this blockquote and nothing else. No other part of this document depends on
> it.*

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change N-central or endpoint state. Safe for autonomous agents. | `ncentral_navigate`, `ncentral_back`, `ncentral_status`, `ncentral_health`, `ncentral_server_info`, `ncentral_validate_token`, `ncentral_list_service_orgs`, `ncentral_list_customers`, `ncentral_get_customer`, `ncentral_list_sites`, `ncentral_get_site`, `ncentral_list_org_units`, `ncentral_get_org_unit`, `ncentral_list_org_unit_children`, `ncentral_list_devices`, `ncentral_list_devices_by_org_unit`, `ncentral_list_device_filters`, `ncentral_get_device`, `ncentral_get_device_assets`, `ncentral_get_device_lifecycle`, `ncentral_get_device_service_status`, `ncentral_list_active_issues`, `ncentral_list_job_statuses`, `ncentral_list_device_tasks`, `ncentral_get_task`, `ncentral_get_task_status`, `ncentral_get_task_status_details`, `ncentral_list_org_custom_properties`, `ncentral_get_org_custom_property`, `ncentral_list_device_custom_properties`, `ncentral_get_device_custom_property`, `ncentral_list_maintenance_windows`, `ncentral_list_access_groups`, `ncentral_get_access_group` |
| **Write** | Changes N-central-side records. Reversible, but see the custom-property caveat. | `ncentral_update_device_lifecycle`, `ncentral_update_org_custom_property`, `ncentral_update_device_custom_property`, `ncentral_add_maintenance_windows`, `ncentral_create_device_access_group`, `ncentral_create_org_unit_access_group` |
| **Destructive** | Executes on a live endpoint, discloses a credential, or removes alert suppression. | `ncentral_create_direct_task`, `ncentral_get_registration_token`, `ncentral_delete_maintenance_windows` |

### Why each destructive tool is there

- **`ncentral_create_direct_task`** — executes a task, script, or
  command **immediately** on a live production device as SYSTEM/root.
  There is no scheduling, no dry run, and no cancel once dispatched.
  Whatever the script does, it does now. This is the only tool in the
  plugin that changes machine state, and it is the reason the plugin
  needs a governance document at all.
- **`ncentral_get_registration_token`** — a GET, and destructive
  anyway. It returns the token embedded in agent installers for an org
  unit. Anyone holding it can enrol a device into that customer's
  N-central environment. Classifying it as a read because HTTP says so
  would put credential disclosure in the tier marked "safe for
  autonomous agents". Fetch it only when a human is actively deploying
  an agent, paste it to that human and nowhere else, and never write it
  to a ticket, a file, or a chat log. If one leaks, it is rotated in the
  N-central UI, which this plugin cannot do.
- **`ncentral_delete_maintenance_windows`** — deleting a window does not
  touch an endpoint, but it removes the suppression that was keeping a
  planned outage quiet. Delete one mid-patch-run and the NOC floods,
  tickets auto-generate, and on-call gets paged for expected behaviour.
  It is also irreversible through this surface: the original window
  definition is gone and `ncentral_add_maintenance_windows` cannot
  recreate what you did not record.

### The custom-property caveat

`ncentral_update_device_custom_property` and
`ncentral_update_org_custom_property` sit in Write, but **treat them as
destructive whenever the property drives automation.** N-central
automation policies and device filters commonly key off custom property
values — "Patch Ring", "Maintenance Group", "Backup Policy". Changing
one of those does not look like an endpoint operation and is not
recorded as one, yet it can silently move a device into a different
patch schedule and cause patches to be pushed to a production server
that was deliberately excluded. Updates also overwrite with no history:
there is no undo and no record of the previous value unless the caller
read it first.

Rule: before any custom-property write, read the current value, echo
before-and-after to the operator, and ask explicitly whether the
property is policy-keyed. If the answer is yes or unknown, require the
same approval as a direct task.

`ncentral_update_device_lifecycle` is the mildest write here — warranty
dates, purchase cost, expected replacement. It touches no monitoring and
no endpoint. It still overwrites without history, so a bulk stamp from a
vendor export can quietly destroy hand-entered data.

**Conduit does not enforce per-call approval.** It compares tiers — there
is no approval step, no per-call confirmation, and no interactive prompt
anywhere in its enforcement path. Nothing sits between an agent and
`ncentral_create_direct_task` once the tier is granted. Where this
document asks for a named human approver, that is a policy you impose on
your agents, and it is only as good as the agent configuration that
carries it.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Cross-customer active-issue sweeps, warranty
  audits, task-outcome drill-downs, and monitor-health triage are the
  intended autonomous use, and the bundled `device-auditor` and
  `issue-triager` agents are built to stay inside this tier.
- Write tools: agent drafts the exact call with before-and-after values,
  human approves, then it runs.
- Destructive tools: require a named human approver per invocation. For
  `ncentral_create_direct_task` the approval must name the device (name
  **and** ID), the customer, the task or script, and its parameters —
  and it must be a fresh approval, never one chained silently onto the
  end of a triage. Target one device per task; fleet-wide remediation
  belongs in a scheduled task authored in the N-central UI, not a loop
  of direct tasks.
- After any direct task, poll `ncentral_get_task_status` and report the
  real outcome. "Task created" is not "task succeeded", and an agent
  that stops at dispatch has told the operator nothing.
- Do not grant any destructive tool to a scheduled or unattended agent.

## What it cannot reach

- Only the single N-central server whose URL and JWT are registered in
  Conduit. There is no shared cloud endpoint and no cross-server scope;
  credentials are valid on exactly one server.
- Within that server, only what the API user's role and access groups
  permit. A least-privilege API user is a real, enforced boundary here,
  unlike vendors with a single all-powerful key.
- No filesystem or shell on the technician's machine, no other vendor's
  data.
- No PSA. Active issues are not tickets, and nothing here opens one.
- No SO-level active-issue query. Issues list per customer or site only,
  so a cross-client sweep is an explicit loop, not a firehose.
- No live event stream. Every tool is point-in-time.

## Data handling

- N-central responses pass through the gateway into model context for
  the session and are not persisted by this plugin.
- `ncentral_get_registration_token` returns a **credential**. It is the
  only tool in this batch whose normal output should be treated as a
  secret. Do not let it land in a transcript that gets pasted anywhere.
- `ncentral_get_device_assets` returns full hardware and software
  inventory — OS build, installed software, disks, NICs — per endpoint.
  `ncentral_get_task_status_details` returns captured script output,
  which can contain anything the script printed, including credentials
  a script author embedded.
- `ncentral_list_customers` and the org-unit tools return the MSP's
  entire client list; `ncentral_get_device_lifecycle` returns purchase
  cost and lease terms.

## Known sharp edges

- **Stale monitors are not healthy monitors.** A device whose service
  status reads `Stale` or `Disconnected` has stopped reporting; every
  other monitor on it is untrustworthy until the agent checks in. An
  agent that reads "no failures" off a disconnected device reports a
  green light on a dark machine. `Misconfigured` is a setup error, not
  an outage.
- **A "down" server inside its maintenance window is expected.** Check
  `ncentral_list_maintenance_windows` before escalating anything, and
  before deleting a window check what is running inside it.
- **Preview-stage endpoints vary by release.** Active issues, scheduled
  tasks, maintenance windows, and custom properties sit on preview
  endpoints in some N-central versions. A 404 may mean "your server does
  not ship this", not "the ID is wrong" — check
  `https://<server>/api-explorer`.
- **Device IDs are per-server.** When correlating with a PSA or
  documentation tool, match on hostname or serial number, never on ID.
- **Private-CA certificates.** On-prem servers presenting an internal CA
  certificate need the CA bundle supplied to the sidecar via
  `NODE_EXTRA_CA_CERTS`. Disabling TLS verification to get past it turns
  a trusted inbound path into an unauthenticated one.
