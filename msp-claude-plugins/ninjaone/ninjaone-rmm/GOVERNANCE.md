# NinjaOne plugin — governance and safety model

Unofficial. Community-built plugin for the NinjaOne (NinjaRMM) API. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches NinjaOne through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenant the operator
is authorised for.

- No NinjaOne client ID or client secret is stored on the technician's
  machine, in this repo, or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who rebooted that server" — NinjaOne's own activity log records only
  the API application.
- Revoking gateway access revokes NinjaOne access with it, immediately.

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change NinjaOne or endpoint state. Safe for autonomous agents. | `ninjaone_status`, `ninjaone_navigate`, `ninjaone_devices_list`, `ninjaone_devices_get`, `ninjaone_devices_alerts`, `ninjaone_devices_activities`, `ninjaone_devices_services`, `ninjaone_organizations_list`, `ninjaone_organizations_get`, `ninjaone_organizations_devices`, `ninjaone_organizations_locations`, `ninjaone_alerts_list`, `ninjaone_alerts_get`, `ninjaone_alerts_summary`, `ninjaone_tickets_list`, `ninjaone_tickets_get`, `ninjaone_tickets_comments`, `ninjaone_tickets_boards_list` |
| **Write** | Changes NinjaOne-side records. Reversible, customer-visible. | `ninjaone_organizations_create`, `ninjaone_tickets_create`, `ninjaone_tickets_update`, `ninjaone_tickets_add_comment`, `ninjaone_alerts_reset` |
| **Destructive** | Acts on a customer production machine, or clears monitoring state in bulk. Requires explicit per-call human approval. | `ninjaone_devices_reboot`, `ninjaone_alerts_reset_all` |

`ninjaone_devices_reboot` is the sharpest tool in this plugin. Its blast
radius is not a NinjaOne record — it is the customer's running machine.
An unsaved document, an in-flight database write, or a server mid-backup
all lose. There is no "undo reboot", and the endpoint is unreachable for
the minutes that follow, which is exactly when a technician will assume
the agent broke something else.

`ninjaone_alerts_reset_all` is destructive for the same reason
bulk-approve is in other plugins: it accepts `organization_id` and clears
every matching alert for an entire client at once, with no undo. The alert
queue is the monitoring evidence — an agent that clears it to "tidy up"
has erased the signal that a real outage is in progress, and NinjaOne will
not regenerate an alert until the underlying condition next re-triggers.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Device-health sweeps, patch-compliance reporting, and
  cross-organization alert triage are the intended autonomous use, and are
  what the bundled `device-health-auditor` and `patch-compliance-reporter`
  subagents do.
- Write tools: agent drafts the exact call, human approves, then it runs.
  Ticket writes are visible to the customer if the board emails on update.
- Destructive tools: require a named human approver per invocation. Do not
  grant `ninjaone_devices_reboot` or `ninjaone_alerts_reset_all` to
  scheduled or unattended agents under any circumstances.

## What it cannot reach

- Only the NinjaOne organizations mapped to the operator's gateway
  identity, and only within the NinjaOne region (US/EU/CA/OC) that
  credential was issued for. NinjaOne instances are region-partitioned;
  one credential does not see another region's devices.
- No filesystem, no shell, no other vendor's data.
- **No script or command execution.** NinjaOne's platform supports running
  scripts and automations against endpoints; no tool in this plugin
  exposes that. `ninjaone_devices_services` lists Windows services — it
  cannot start, stop, or restart them.
- No policy editing, no patch approval, no agent deployment or uninstall.
- No live event stream. Every tool is point-in-time; NinjaOne webhooks
  carry the push feed.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `ninjaone_devices_get` and `ninjaone_devices_list` return endpoint
  inventory — hostnames, logged-in user names, OS build, IP and MAC
  addresses. That is client infrastructure detail and, via the last
  logged-in user, employee PII.
- `ninjaone_tickets_get` and `ninjaone_tickets_comments` return whatever
  the requester typed, which routinely includes end-user contact details
  and occasionally credentials pasted into a ticket body.
- `ninjaone_devices_activities` is the per-device audit trail; treat it as
  evidence, and do not let an agent summarise it destructively.

## Known sharp edges

- **Offline devices fail late, not early.** Control calls against an
  offline endpoint return 409 rather than a clear "device is offline"
  message. Always confirm `offline: false` before a reboot; an agent that
  retries a 409 will simply queue the same failure.
- **`FORCED` reboot skips the user warning.** Where the API exposes a
  reboot mode, `NORMAL` notifies the logged-in user and `FORCED` does not.
  Default to `NORMAL`; `FORCED` is a data-loss decision, not a speed
  optimisation.
- **Dismissing an alert does not resolve the condition.** Conditions
  persist independently. An agent that clears alerts to make a dashboard
  look green has changed nothing about the customer's disk still being
  full.
- **Organization creation is not reversible here.** There is no delete
  tool for organizations, so a mistyped `ninjaone_organizations_create`
  leaves a permanent empty client record that has to be cleaned up in the
  NinjaOne console.
- **Rate limits degrade mid-task.** Large cross-organization sweeps will
  hit 429 partway through and return partial data. Treat a truncated sweep
  as incomplete rather than as "no further devices found".
