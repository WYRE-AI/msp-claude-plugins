# Better Stack plugin — governance and safety model

Unofficial. Community-built plugin for the Better Stack API. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Better Stack through
the WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which
brokers authentication centrally and scopes every call to the tenant
the operator is authorised for.

- No Better Stack API token is stored on the technician's machine, in
  this repo, or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log
  answers "who paused that monitor" — Better Stack's own log records
  only the token.
- Revoking gateway access revokes Better Stack access with it,
  immediately.

## Tool permission tiers

> **Not classified in Conduit — every tool in the table below requires
> tier `admin` today.** Conduit derives each tool's tier from
> `VENDOR_TOOL_CONFIG` (`src/proxy/result-cache.ts`) and fails closed for
> anything absent from it:
> `const requiredTier: PermissionTier = classified ?? 'admin';`
> (`src/access/access-enforcement.ts:63`). `betterstack` has no entry, so
> the grouping below carries no enforcement weight right now — read tools
> require `admin` exactly as the rest do, and there is no narrower grant
> that admits them. The grouping is still the right *risk* reading, and it
> becomes the enforcement reading on the day this vendor is classified.
> The list of unclassified vendors moves whenever one of them is
> classified, so it is stated in one place only:
> `wyre-gateway/GOVERNANCE.md`, *Fail-closed, and the vendors Conduit has
> not classified*.
>
> *This blockquote is the whole of the not-classified caveat. When
> `betterstack` appears in `VENDOR_TOOL_CONFIG`, delete this blockquote
> and change nothing else.*

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Better Stack state or notify anyone. Safe for autonomous agents. | `list_monitors`, `get_monitor`, `list_heartbeats`, `get_heartbeat`, `list_incidents`, `get_incident`, `list_on_call_schedules`, `get_on_call_schedule`, `list_schedule_policies`, `list_status_pages`, `get_status_page`, `list_status_page_sections`, `execute_query`, `list_saved_queries`, `get_saved_query`, `list_dashboards`, `get_dashboard`, `list_dashboard_panels`, `list_applications`, `get_application`, `list_releases` |
| **Write** | Creates or modifies records. Reversible, but may page a human on the way. | `create_monitor`, `update_monitor`, `resume_monitor`, `create_heartbeat`, `update_heartbeat`, `create_incident`, `acknowledge_incident`, `resolve_incident`, `create_on_call_schedule`, `update_on_call_schedule`, `create_status_page`, `update_status_page`, `create_dashboard`, `create_release` |
| **Destructive** | Removes monitoring coverage, breaks paging, or publishes to the public. | `delete_monitor`, `delete_heartbeat`, `delete_on_call_schedule`, `pause_monitor`, `create_status_page_incident` |

### Why two non-delete tools sit in the destructive tier

- **`pause_monitor` silently removes detection.** It is a trivially
  reversible one-field change, which is exactly what makes it
  dangerous: a paused monitor raises no incident, pages nobody, and
  produces no gap in a dashboard that anyone will notice. An agent
  that pauses monitors for a maintenance window and does not resume
  them leaves the customer unmonitored indefinitely, and the SLA
  report for that period is quietly wrong. Loss of detection is the
  characteristic failure mode of a monitoring product, and it deserves
  destructive-tier handling even though the verb is harmless.
- **`create_status_page_incident` publishes outside the MSP.** Status
  pages are public, frequently on the customer's own branded domain,
  and subscribers are notified. A wrongly posted outage cannot be
  recalled — deleting the post does not unsend the email or un-tell
  the customer's customers. That is a commercial and reputational
  event, not a record edit.

`delete_on_call_schedule` earns its tier for a second-order reason: a
notification policy that referenced the deleted schedule is left with
a step that resolves to nobody, so pages route into the void. The
failure shows up at the worst possible moment.

Conduit does not enforce any of that as an approval requirement. It
compares tiers — it has no approval step, no per-call confirmation, and
no interactive prompt. Per-call approval is a workflow you impose on your
agents, and it is only as good as the agent configuration that carries
it.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Monitor health sweeps, incident and MTTR
  reporting, on-call lookups, and log investigation are the intended
  autonomous use.
- Write tools: agent drafts the exact call, human approves, then it
  runs. Note that several of these can wake somebody up — see the
  sharp edges.
- Destructive tools: require a named human approver per invocation.
  If you automate a maintenance window, pair every `pause_monitor`
  with a scheduled, verified `resume_monitor` and alert on the pause
  outliving its window.

## What it cannot reach

- Only the Better Stack teams the token is scoped to. An Uptime-scoped
  token cannot see Telemetry or Error Tracking; a Global token sees
  all three.
- **Only what is reachable from the public internet.** Better Stack's
  checks run from its own regions, so it cannot monitor an
  RFC1918 address, an internal-only service, or anything behind a
  customer firewall. That boundary is a capability limit, not a
  permissions one — no token changes it.
- No filesystem, no shell, no other vendor's data.
- No access to the monitored systems themselves. It observes their
  responses; it cannot log into them, restart them, or fix them.

## Data handling

- Responses pass through the gateway into model context for the
  session and are not persisted by this plugin.
- **`execute_query` runs arbitrary ClickHouse SQL over ingested
  logs.** Those logs contain whatever the customer's applications
  chose to log — and applications routinely log more than intended:
  session tokens, API keys in request headers, email addresses, and
  full request bodies. This is the highest-exposure tool in the
  plugin. Bound queries by time and source, and restrict the tool
  entirely if agents run unattended.
- `list_on_call_schedules` and `get_on_call_schedule` return staff
  names and shift times — personal data about the MSP's own people.
- Status page tools read and write **public** content. Anything an
  agent writes there is world-readable.

## Known sharp edges

- **Writes can wake people up.** Incident creation and monitor state
  changes feed the notification policy, which escalates to phone
  calls and SMS. A page cannot be recalled and it does not care what
  time it is. Treat any incident or monitor write during out-of-hours
  as higher-risk than its tier alone suggests.
- **Acknowledging stops the escalation chain.** `acknowledge_incident`
  tells Better Stack a human has it. An agent that acknowledges an
  incident to tidy the queue has told the paging system to stop
  escalating a live outage that nobody is actually working.
- **Auto-resolve makes incident history unreliable for SLA maths.**
  Monitors close incidents on recovery, so `resolved_at` reflects
  service recovery, not human intervention. Deriving MTTR from it
  measures the outage, not the response.
- **Deleting a monitor deletes its history.** Uptime history is the
  evidence behind an SLA report. Removing a monitor to tidy an
  account destroys the record you would need at renewal.
- **Tool names are inconsistent across this plugin's own skills.** The
  API-patterns skill and the on-call skill use the unprefixed names in
  the table above, which match the hosted server at
  `mcp.betterstack.com`; several other skills show a `betterstack_`
  prefix. Prefer the names in the table.
