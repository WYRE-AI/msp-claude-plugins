# Rootly plugin — governance and safety model

Unofficial. Community-built plugin for the Rootly API. Not affiliated
with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Rootly through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the organisation the
operator is authorised for.

- No Rootly API token is stored on the technician's machine, in this
  repo, or in the model's context. The gateway holds it and forwards
  `Authorization: Bearer <token>` on every call.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who declared that incident". Rootly's own log attributes actions to
  the token, so a shared Global token makes every declaration anonymous.
- Revoking gateway access revokes Rootly access with it, immediately.

## Tool permission tiers

The tool names below are the ones the gateway actually serves. Note that
several of this plugin's skills document the wider Rootly REST API,
including postmortem, action-item, workflow, and service-catalog
endpoints that are **not** exposed as tools — see "What it cannot reach".

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Rootly state or notify anyone. Safe for autonomous agents. | `rootly_status`, `rootly_navigate`, `rootly_back`, `rootly_incidents_list`, `rootly_incidents_get`, `rootly_alerts_list`, `rootly_schedules_list`, `rootly_schedules_get`, `rootly_org_teams_list`, `rootly_org_teams_get`, `rootly_org_severities_list`, `rootly_org_current_user` |
| **Write** | Changes Rootly-side records. Reversible, visible to responders. | `rootly_incidents_update`, `rootly_alerts_update`, `rootly_alerts_acknowledge`, `rootly_org_teams_create`, `rootly_org_teams_update`, `rootly_org_teams_patch` |
| **Destructive** | Wakes a human, fires customer-visible automation, or ends an escalation. Requires explicit per-call human approval. | `rootly_incidents_create`, `rootly_alerts_create`, `rootly_incidents_resolve`, `rootly_alerts_resolve`, `rootly_org_teams_delete` |

None of those destructive entries deletes data except the last. They are
classified by blast radius:

- **`rootly_incidents_create` is not a record write, it is a trigger.**
  Declaring an incident fires every workflow whose conditions match, and
  Rootly workflow actions include paging the on-call via
  PagerDuty/Opsgenie, creating a Slack channel and inviting responders,
  opening a Jira ticket, posting to a public status page, and sending
  email. One create can wake a person at 3am *and* tell your customers
  you have an outage. `rootly_alerts_create` reaches the same paging
  machinery through routing rules.
- **`rootly_incidents_resolve` stamps the number everyone reports on.**
  `resolved_at` is what MTTR and reliability reporting read, and
  resolution fires the `status_changed` workflows — commonly the
  postmortem and the customer "all clear". Reopening restores the
  incident but not the original measurement or the messages already sent.
- **`rootly_alerts_resolve` silently ends an escalation.** Resolving an
  alert nobody actually handled stops it climbing to the responder who
  could have handled it. The failure mode is that nothing happens, which
  is exactly what it looks like when things are fine.
- **`rootly_org_teams_delete`** orphans the routing and escalation
  targets that reference the team, producing the same silent paging gap.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Incident triage, shift handoff summaries, and
  reliability reporting are the intended autonomous use.
- Write tools: agent drafts the exact call, human approves, then it runs.
- Destructive tools: require a named human approver per invocation. Do
  not grant these to scheduled or unattended agents. Because workflows
  sit downstream of `rootly_incidents_create`, an unattended agent
  holding it has whatever reach your workflow actions have — including
  your status page and your customers' inboxes.

## What it cannot reach

- Only the Rootly organisation mapped to the operator's gateway identity.
  There is no cross-organisation or reseller view.
- Token scope bounds everything. A Team-scoped token returns 403 on
  organisation-wide queries; the gateway credential should be a Global
  token.
- **No postmortem, action-item, workflow, or service-catalog write
  path.** This plugin's `postmortems`, `workflows`, and `services` skills
  describe Rootly REST API endpoints, but the served tool surface does
  not expose them. An agent cannot create or publish a postmortem, open
  or close an action item, enable or disable a workflow, or edit the
  service catalog. Those remain UI or direct-API actions.
- **No schedule authoring.** Schedules can be listed and read but not
  created, edited, or overridden.
- No filesystem, no shell, no other vendor's data.
- No live event stream. Every tool is point-in-time; Rootly's Slack
  integration and webhooks carry the push feed.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `rootly_org_teams_*` and `rootly_org_current_user` return staff
  identity — names, email addresses, and team membership.
  `rootly_schedules_*` returns who is on-call and when, which is a
  roster of your responders' working patterns.
- `rootly_incidents_get` returns incident titles, summaries, and
  timelines. In practice these carry infrastructure detail — service
  names, hostnames, error output — and, on customer-impacting incidents,
  a description of which customers were affected.
- `rootly_alerts_list` returns the raw monitoring payloads behind an
  incident, with the same disclosure profile.
- Restrict these if your agents run unattended.

## Known sharp edges

- **Two upstreams exist and they expose different tools.** This plugin
  defaults to the WYRE gateway
  (`https://mcp.wyre.ai/v1/rootly/mcp`), whose tools are the
  `rootly_*` names listed above. Rootly also hosts its own MCP server at
  `mcp.rootly.com`, which generates a different, larger set from their
  OpenAPI spec (`incidents_get`, `find_related_incidents`, and similar).
  Tool names are not interchangeable between the two; a runbook written
  against one will fail against the other with "unknown tool".
- **Acknowledging pauses the escalation clock.** An agent that
  acknowledges an alert it cannot resolve has stopped it reaching the
  human who could.
- **Severity IDs are UUIDs and are per-organisation.** Nothing can be
  hardcoded; `rootly_org_severities_list` is a required lookup before any
  create. An agent guessing a severity ID gets a 422 whose message does
  not explain why.
- **Rootly's model is internal-first.** It is built for one engineering
  organisation's own infrastructure, not per-client MSP ticketing. If you
  route multiple customers through team-based scoping, be explicit that
  incident titles and summaries are visible to anyone with organisation
  scope — there is no per-client wall.
