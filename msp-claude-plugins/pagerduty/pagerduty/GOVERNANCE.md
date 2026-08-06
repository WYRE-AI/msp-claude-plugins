# PagerDuty plugin — governance and safety model

Unofficial. Community-built plugin for the PagerDuty API. Not affiliated
with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches PagerDuty through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the account the
operator is authorised for. Upstream, the gateway fronts PagerDuty's own
hosted MCP server (`mcp.pagerduty.com`, or `mcp.eu.pagerduty.com` for EU
accounts) and its 66 generated tools.

- No PagerDuty API token is stored on the technician's machine, in this
  repo, or in the model's context. The gateway holds it and forwards
  `Authorization: Token token=<key>` on every call.
- The org's PagerDuty connection is stored once at the gateway, so
  replacing it is one edit rather than a change on every technician's
  machine. PagerDuty is OAuth: Conduit refreshes the token itself as it
  nears expiry, and asks you to reconnect only when that refresh fails.

- Every call carries operator identity, so the gateway audit log answers
  "who paged the on-call at 3am". PagerDuty's own log attributes actions
  to the token's user, so a shared General Access Token makes every
  action anonymous.
- Removing someone from the organisation clears their per-vendor grants
  and revokes their gateway refresh tokens at once; a user deactivated
  in your identity provider is refused on their very next request. A
  user only removed from the org keeps an already-issued access token
  for up to an hour, but it reaches only a personal PagerDuty connection
  made with their own key — never the org's. See
  `wyre-gateway/GOVERNANCE.md`.

## Tool permission tiers

> **Not classified in Conduit — every tool in the table below requires tier
> `admin` today.** Conduit derives a tool's tier from `VENDOR_TOOL_CONFIG`
> (`src/proxy/result-cache.ts`) and fails closed:
> `const requiredTier: PermissionTier = classified ?? 'admin';`
> (`src/access/access-enforcement.ts:63`). `pagerduty` has no entry there, so
> the grouping below carries no enforcement meaning at present — read tools
> included. A `read` or `write` grant on this vendor admits nothing; an
> `admin` grant admits everything, including `create_incident`. The grouping
> becomes what Conduit actually enforces once the vendor is classified, and
> classifying it is a privilege *reduction*, not an expansion. For the live
> list of unclassified vendors see `wyre-gateway/GOVERNANCE.md`,
> *Fail-closed, and the vendors Conduit has not classified* — it is stated
> once there because it moves.
>
> *Editor's note: when `pagerduty` gains a `VENDOR_TOOL_CONFIG` entry, delete
> this blockquote and nothing else. No other part of this document depends on
> it.*

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change PagerDuty state or notify anyone. Safe for autonomous agents. | `list_incidents`, `get_incident`, `list_incident_alerts`, `list_incident_notes`, `list_incident_log_entries`, `list_past_incidents`, `get_incident_field_values`, `list_oncalls`, `list_schedules`, `get_schedule`, `list_schedule_overrides`, `list_escalation_policies`, `get_escalation_policy`, `list_services`, `get_service`, `list_event_orchestrations`, `get_event_orchestration`, `get_global_orchestration_rules`, `get_service_orchestration_rules`, `get_event_orchestration_active_status`, `list_status_pages`, `get_status_page`, `list_status_page_posts`, `list_status_page_post_updates`, `list_teams`, `get_team`, `list_team_members`, `list_users`, `get_user`, `get_alert_grouping_settings`, `list_intelligent_alert_grouping_settings`, `list_incident_workflows`, `get_incident_workflow`, `list_incident_workflow_instances`, `list_change_events`, `get_change_event`, `list_log_entries`, `get_log_entry` |
| **Write** | Changes PagerDuty-side records. Reversible, visible to responders. | `update_incident`, `create_incident_note`, `snooze_incident`, `set_incident_field_values`, `create_service`, `update_service`, `update_change_event`, `create_schedule`, `update_schedule`, `create_team`, `update_team`, `add_team_member`, `update_alert_grouping_settings`, `create_intelligent_alert_grouping_settings`, `update_intelligent_alert_grouping_settings` |
| **Destructive** | Wakes a human, publishes to customers, or silently removes paging coverage. | `create_incident`, `merge_incidents`, `manage_incidents`, `delete_schedule`, `delete_team`, `update_global_orchestration_rules`, `update_service_orchestration_rules`, `create_status_page_post`, `update_status_page_post`, `create_status_page_post_update`, `delete_status_page_post` |

Most of that destructive tier is classified by blast radius, not by HTTP
verb. The four groups worth justifying:

- **`create_incident` rings a phone.** The API calls it a create; what it
  actually does is start an escalation policy. On a high-urgency service
  that means a phone call and SMS to whoever is on-call, at whatever hour
  it is for them, escalating up the tiers until somebody acknowledges.
  There is no undo for a person who has been woken up. This is the single
  most consequential tool in the plugin and the one most likely to be
  mistaken for routine.
- **`merge_incidents` and `manage_incidents` cannot be walked back.**
  PagerDuty has no unmerge: merging moves alerts and log entries into the
  target permanently and auto-resolves the sources. `manage_incidents`
  applies a status change across many incidents at once, so a bulk
  resolve ends the escalation clock on incidents nobody actually looked
  at — the failure is silent and looks like a tidy queue.
- **Orchestration rules decide what gets paged at all.**
  `update_global_orchestration_rules` and
  `update_service_orchestration_rules` sit upstream of every incident. A
  bad suppression rule stops production alerts from ever becoming
  incidents. Nobody is paged, nothing errors, and the gap is discovered
  during the next outage. `delete_schedule` and `delete_team` produce the
  same silent gap from the other end: an escalation policy tier pointing
  at a deleted schedule pages nobody.
- **Status page posts are customer communications.** The status page is
  public and its subscribers are notified by email and SMS on publish.
  You cannot unsend that, and customers screenshot status pages. Deleting
  the post afterwards removes the page, not the notification.

**Conduit does not enforce per-call approval.** It compares tiers — there
is no approval step, no per-call confirmation, and no interactive prompt
anywhere in its enforcement path. Nothing sits between an agent and
`create_incident` once the tier is granted. Where this document asks for a
named human approver, that is a policy you impose on your agents, and it
is only as good as the agent configuration that carries it.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Triage sweeps, on-call rota checks, escalation
  coverage audits, and MTTA/MTTR reporting are the intended autonomous
  use.
- Write tools: agent drafts the exact call, human approves, then it runs.
- Destructive tools: require a named human approver per invocation. Do
  not grant these to scheduled or unattended agents. An unattended agent
  holding `create_incident` is an unattended agent that can page your
  staff overnight; one holding the status page tools can publish an
  outage notice to your customers.

## What it cannot reach

- Only the PagerDuty account mapped to the operator's gateway identity.
  PagerDuty has no reseller or cross-account view, so one credential
  means one account. MSPs running per-customer PagerDuty accounts need
  one gateway credential per account.
- The token's own permissions bound everything. A User API Token carries
  that user's role; several tools require Account Owner and will return
  403 otherwise.
- **No event-send path.** The Events API v2
  (`events.pagerduty.com/v2/enqueue`) is not exposed as a tool. An agent
  cannot inject a synthetic trigger, acknowledge, or resolve event into a
  monitoring integration; that stays with your monitoring tools.
- **No schedule override tool.** Overrides can be listed but not created
  through this surface; adding coverage for a gap is a UI or direct-API
  action.
- No filesystem, no shell, no other vendor's data.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `list_users` / `get_user` return responder contact methods — personal
  mobile numbers, personal email addresses, and push device
  registrations. This is your staff's home contact detail. Restrict these
  if your agents run unattended.
- `get_incident` and `list_incident_alerts` return whatever the
  monitoring integration put in `body.details` and `custom_details`:
  hostnames, internal IPs, database identifiers, and stack traces that
  sometimes carry secrets. Treat incident bodies as infrastructure
  disclosure.
- `list_incident_log_entries` and `list_log_entries` reconstruct who was
  notified, when, and on which channel — an activity record of your
  staff.

## Known sharp edges

- **Urgency, not priority, decides whether someone is woken.** `high`
  urgency means phone and SMS; `low` means email only. Priority (P1–P5)
  is a business label with no notification behaviour. An agent
  "escalating" a P-value changes reporting; an agent changing urgency
  changes whose phone rings.
- **Acknowledging pauses the escalation clock.** An agent that
  acknowledges an incident it cannot actually resolve has stopped the
  incident from reaching the human who could. Acknowledgement is a
  commitment to work it, not a read receipt.
- **Snooze hides an active incident.** `snooze_incident` removes it from
  the triage view for the duration with no further notification. On a
  real outage that is indistinguishable from ignoring it.
- **Resolving an incident resolves all its alerts.** The reverse is not
  true. An agent resolving alerts one at a time will not close the
  incident and may conclude the API is broken.
- **Rate limits degrade long sweeps.** 900 requests per minute across the
  account; a wide unbounded incident query on a large account will hit it
  and return 429 mid-task. Scope with `since`/`until` and
  `service_ids[]`.
