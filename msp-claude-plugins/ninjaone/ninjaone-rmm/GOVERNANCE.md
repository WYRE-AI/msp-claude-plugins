# NinjaOne plugin — governance and safety model

Unofficial. Community-built plugin for the NinjaOne (NinjaRMM) API. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches NinjaOne through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenant the operator
is authorised for.

Consequences worth stating plainly:

- No NinjaOne client ID or client secret is stored on the technician's
  machine, in this repo, or in the model's context.
- The org's NinjaOne credential is stored once at the gateway, so
  replacing it is one edit rather than a change on every technician's
  machine. There is no rotate action, though — you re-submit the
  connect form, which overwrites the stored credential in place, and
  nothing tracks its age or prompts you.

- Every call carries operator identity, so Conduit's audit log answers
  "who rebooted that server" — NinjaOne's own activity log records only
  the API application. The log records *who called what*, never with what
  arguments, so it will name `ninjaone_devices_reboot` but not the device.
- Complete offboarding in the gateway console, and confirm the person no longer has access before you treat it as done.

## Tool permission groups

Grouped into the four buckets Conduit's access editor presents, with the
tier each bucket actually enforces at.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change NinjaOne or endpoint state. Safe for autonomous agents. | `read` | `ninjaone_status`, `ninjaone_devices_list`, `ninjaone_devices_get`, `ninjaone_devices_alerts`, `ninjaone_devices_activities`, `ninjaone_devices_services`, `ninjaone_organizations_list`, `ninjaone_organizations_get`, `ninjaone_organizations_devices`, `ninjaone_organizations_locations`, `ninjaone_alerts_list`, `ninjaone_alerts_summary`, `ninjaone_tickets_list`, `ninjaone_tickets_get`, `ninjaone_tickets_comments`, `ninjaone_tickets_boards_list` |
| **Write** | Creates or modifies records — **and reboots customer machines.** | `write` | `ninjaone_organizations_create`, `ninjaone_tickets_create`, `ninjaone_tickets_update`, `ninjaone_tickets_add_comment`, `ninjaone_alerts_reset`, `ninjaone_alerts_reset_all`, `ninjaone_devices_reboot` |
| **Delete** | — | `write` — **not** a tier of its own | **Empty.** No NinjaOne tool name carries a delete-verb token. |
| **Admin** | — | `admin` |see below.|

### Read this row twice: `write` includes reboot

The same grant carries `ninjaone_alerts_reset_all`.

That is the mechanical answer. The risk answer is different, and worth
keeping in view when you configure the grant:

- **`ninjaone_devices_reboot` is the sharpest tool in this plugin.** Its
  blast radius is not a NinjaOne record — it is the customer's running
  machine. An unsaved document, an in-flight database write, or a server
  mid-backup all lose. There is no "undo reboot", and the endpoint is
  unreachable for the minutes that follow, which is exactly when a
  technician will assume the agent broke something else. Judged by blast
  radius it belongs with `datto_run_quickjob` and
  `cwautomate_scripts_execute`, both of which Conduit pins to `admin`.
  It is not pinned, and the reviewer of this document should treat that
  as the open question rather than as settled.
- **`ninjaone_alerts_reset_all` accepts `organization_id`** and clears
  every matching alert for an entire client at once, with no undo. The
  alert queue is the monitoring evidence — an agent that clears it to
  "tidy up" has erased the signal that a real outage is in progress, and
  NinjaOne will not regenerate an alert until the underlying condition
  next re-triggers. It, too, enforces at `write`.

Because the Admin group is empty, there is no tier above `write` that separates ticket comments from machine reboots. That allowlist is the only mechanism Conduit offers here.

Confirm the live permission grant in the gateway access editor before you rely on a tier in this document. This note does not describe gateway enforcement internals.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve deletes.**

- Read tools: allow. Device-health sweeps, patch-compliance reporting, and
  cross-organization alert triage are the intended autonomous use, and are
  what the bundled `device-health-auditor` and `patch-compliance-reporter`
  subagents do.
- Write tools: agent drafts the exact call, human approves, then it runs.
  Ticket writes are visible to the customer if the board emails on update.
- **Do not grant plain `write` to a scheduled or unattended agent.** For NinjaOne that grant includes `ninjaone_devices_reboot` and `ninjaone_alerts_reset_all`, and no part of Conduit will ask before either runs. Use a service client rather than a human's token — it can never inherit owner bypass.
- For a human-driven reboot: name an approver per invocation and confirm
  `offline: false` first. Conduit will not prompt.

## What it cannot reach

- Only the NinjaOne organizations the connected credential can reach, and
  only within the NinjaOne region (US/EU/CA/OC) that credential was
  issued for. NinjaOne instances are region-partitioned; one credential
  does not see another region's devices. Conduit controls *who in your
  organisation may use that credential and which tools they may call*,
  not which slice of NinjaOne's data comes back — scope the credential at
  NinjaOne if you need a narrower boundary.
- No filesystem, no shell, no other vendor's data.
- **No script or command execution.** NinjaOne's platform supports running
  scripts and automations against endpoints; no tool in this plugin
  exposes that. `ninjaone_devices_services` lists Windows services — it
  cannot start, stop, or restart them.
- No policy editing, no patch approval, no agent deployment or uninstall.
- No arbitrary-request passthrough. There is no `ninjaone_raw_request`,
  `ninjaone_execute_tool`, or `ninjaone_router`, so nothing in this
  surface has a blast radius chosen by its arguments.
- No live event stream. Every tool is point-in-time; NinjaOne webhooks
  carry the push feed.

## Data handling

- Responses pass through Conduit into model context for the session
  and are not persisted by this plugin.
- `ninjaone_devices_get` and `ninjaone_devices_list` return endpoint
  inventory — hostnames, logged-in user names, OS build, IP and MAC
  addresses. That is client infrastructure detail and, via the last
  logged-in user, employee PII. Both are classified `read`.
- `ninjaone_tickets_get` and `ninjaone_tickets_comments` return whatever
  the requester typed, which routinely includes end-user contact details
  and occasionally credentials pasted into a ticket body.
- `ninjaone_devices_activities` is the per-device audit trail; treat it as
  evidence, and do not let an agent summarise it destructively. Note that
  Conduit classifies it `read`, unlike the equivalent audit-log read in
  some other vendors, which are pinned to `admin`.

## Known sharp edges

- **Offline devices fail late, not early.** Control calls against an
  offline endpoint return 409 rather than a clear "device is offline"
  message. Always confirm `offline: false` before a reboot; an agent that
  retries a 409 will simply queue the same failure.
- **`FORCED` reboot skips the user warning.** Where the API exposes a
  reboot mode, `NORMAL` notifies the logged-in user and `FORCED` does not.
  Default to `NORMAL`; `FORCED` is a data-loss decision, not a speed
  optimisation. Conduit cannot see the argument, so nothing outside your
  agent's own configuration enforces that default.
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
