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
- The org's Rootly credential is stored once at the gateway, so
  replacing it is one edit rather than a change on every
  technician's machine. There is no rotate action, though — you
  re-submit the connect form, which overwrites the stored credential
  in place, and nothing tracks its age or prompts you.

- Every call carries operator identity, so the gateway audit log answers
  "who declared that incident". Rootly's own log attributes actions to
  the token, so a shared Global token makes every declaration anonymous.
- Removing someone from the organisation clears their per-vendor grants
  and revokes their gateway refresh tokens at once; a user deactivated
  in your identity provider is refused on their very next request. A
  user only removed from the org keeps an already-issued access token
  for up to an hour, but it reaches only a personal Rootly connection
  made with their own key — never the org's. See
  `wyre-gateway/GOVERNANCE.md`.

## Tool permission groups

**Read this section before anything else in this document.** Rootly is the
only plugin in this batch where the tool names, the served upstream, and
Conduit's classification table do not agree with each other, and the
disagreement is not cosmetic.

### Three tool-name schemes, none of which line up

**Update, 2026-08-30 (issue #178 corrective pass):** this plugin's skills,
agents, and commands have been rewritten to use the third scheme below —
Conduit's real, unprefixed, OpenAPI-generated names (`list_incidents`,
`create_incident`, `list_alerts`, `list_retrospective_processes`, and so
on). The table and the "not one tool name" claim that follow describe the
*prior* state, kept for the historical record and because the sidecar
scheme (row 1) is still real and still not what Conduit serves. The vendor's
`hidden: true` / SSE-transport status below this section was **not**
verified as part of that corrective pass — it was out of scope (a
gateway-repo question, not a plugin-doc one) and may itself be stale, since
it is dated over a month before this note. Re-verify against
`mcp-gateway`'s current `vendor-config.ts` before relying on it.

| Where | Naming scheme | Example |
|---|---|---|
| This plugin's `GOVERNANCE.md` (before this revision) | domain-then-verb, `rootly_` prefixed | `rootly_incidents_list` |
| This plugin's skills, agents, and commands (before the 2026-08-30 corrective pass) | mixed: unprefixed domain-then-verb in some files (`incidents_get`), `rootly_`-prefixed verb-then-domain in others (`rootly_list_alerts`) | `rootly_list_alerts`, `incidents_get` |
| Conduit's `VENDOR_TOOL_CONFIG`, and this plugin's skills/agents/commands as of 2026-08-30 | unprefixed, generated from Rootly's OpenAPI spec | `list_alerts` |

The first scheme is the WYRE-built `rootly-mcp` sidecar's surface. **Conduit
does not route to it.** `src/credentials/vendor-config.ts` sets
`containerUrl: "https://mcp.rootly.com"` with `mcpPath: "/sse"` — Rootly's
own first-party hosted server — and `VENDOR_TOOL_CONFIG` is keyed to that
server's 251-253 generated tool names (counts have drifted slightly across
audits; treat either as approximate). The second scheme, as it existed
before the 2026-08-30 pass, matched nothing at all — it appeared only in
this plugin's own prose.

The consequence, as of the prior revision: **not one tool name this plugin
documented or referenced appeared in `VENDOR_TOOL_CONFIG`.** Conduit is
fail-closed per tool, not per vendor — the enforcement gate coerces an
unclassified tool to the highest tier, `const requiredTier: PermissionTier =
classified ?? 'admin';` (`src/access/access-enforcement.ts:63`). Every
`rootly_*` name would have required tier `admin`, read tools included, if it
were reachable at all. After the 2026-08-30 pass, the plugin's documented
names now match `VENDOR_TOOL_CONFIG`'s scheme directly — but confirm the
vendor is actually un-hidden before assuming that closes the gap in
practice, not just on paper.

### It is not currently reachable at all

Conduit marks this vendor `hidden: true` as of 2026-07-31
(`src/credentials/vendor-config.ts`, conduit#1202). Rootly is the only
vendor in the fleet on the legacy HTTP+SSE transport; Conduit's proxy
implements only Streamable HTTP, and POSTing to an SSE-only `GET` endpoint
returns 405 — confirmed live in production, not just staging. The vendor is
pulled from the catalog until the proxy grows SSE support or Rootly is
confirmed to also serve Streamable HTTP.

**So there is no correct tier table to write for the tool names this plugin
uses.** What follows is Conduit's classification of the upstream it *does*
point at, presented so that the shape of the eventual grant is visible. No
tier below is inferred, invented, or carried over from the previous
revision.

### What Conduit classifies for the `rootly` slug

251 tools, from Rootly's hosted OpenAPI-generated surface:

| Group | What it can do | Enforcement tier | Count and shape |
|---|---|---|---|
| **Read** | Cannot change Rootly state or notify anyone. | `read` | 136 tools — every `list_*` and `get_*`, plus `search_incidents`, `find_related_incidents`, `collect_incidents`, `check_responder_availability`, `suggest_solutions`, `get_oncall_handoff_summary` |
| **Write** | Creates or modifies records — including declaring an incident. | `write` | 110 tools — every `create_*` and `update_*`, plus `attach_alert` and `patch_alert_route` |
| **Delete** | *Empty.* Rootly's hosted surface exposes no delete tool at all. | — | 0 |
| **Admin** | Org-level state and personal-contact writes. | `admin` | 5 tools — `check_oncall_health_risk`, `create_user_email_address`, `create_user_phone_number`, `create_user_notification_rule`, `create_workflow_run` |

Two things in that table are worth an owner's attention:

- **`create_incident` enforces at `write`, the same as `update_cause`.** The
  Write group holds 110 tools and no mechanism distinguishes them.
- **The Admin group is small but well chosen.** `create_workflow_run`
  executes a workflow, `check_oncall_health_risk` is a sensitive read, and
  the three `create_user_*_address`/`_phone_number`/`_notification_rule`
  tools rewrite *where a responder gets paged* — a paging-diversion surface,
  correctly held above `write`.

### The Delete row, stated anyway

The Delete group is empty here, but the general rule is the one readers most
often get wrong, so it belongs on the page. Conduit's enforcement tiers are
only `read`, `write` and `admin` (plus `none`, meaning deny) —
`src/access/permission-tier.ts:27`. "Delete" is a presentation group in the
access editor and compiles to and enforces at tier `write`
(`src/access/tier-group-mapping.ts`, `GROUP_ENFORCEMENT_TIER`). On any vendor
that does have delete tools, **granting `write` grants every one of them**,
and only a granular per-tool `customTools` allowlist separates them.

Conduit compares tiers. It has **no approval step, no per-call confirmation,
and no elicitation.** Nothing at the gateway will pause an agent before it
declares an incident and pages a human. Per-call approval is a policy you
impose on your agents, and it is only as good as the agent configuration that
carries it.

`rootly_navigate` and `rootly_back` appeared in the previous revision's Read
tier and are gone from this one. Conduit refuses every `*_navigate` and
`*_back` tool before any tier check, for every caller including org owners
and personal connections (`src/proxy/tool-call-enforcement.ts:123-129`,
`src/proxy/discovery-tools.ts:41-50`); `conduit__my_access` replaces them.
`*_status` is deliberately kept.

### Where the mechanical tier disagrees with the judgement

These are risk judgements about blast radius, not tiers. They were written
against the `rootly_*` names and hold equally for their hosted-surface
equivalents (`create_incident`, `create_alert`, `update_incident`,
`update_alert`), because the behaviour is Rootly's, not the tool wrapper's:

- **Declaring an incident is not a record write, it is a trigger.** It
  fires every workflow whose conditions match, and Rootly workflow actions
  include paging the on-call via PagerDuty/Opsgenie, creating a Slack
  channel and inviting responders, opening a Jira ticket, posting to a
  public status page, and sending email. One create can wake a person at 3am
  *and* tell your customers you have an outage. Creating an alert reaches
  the same paging machinery through routing rules. Both enforce at `write`.
- **Resolving an incident stamps the number everyone reports on.**
  `resolved_at` is what MTTR and reliability reporting read, and resolution
  fires the `status_changed` workflows — commonly the postmortem and the
  customer "all clear". Reopening restores the incident but not the original
  measurement or the messages already sent. On the hosted surface this is an
  `update_incident` call: a status field on a `write` tool, indistinguishable
  from any other edit.
- **Resolving an alert silently ends an escalation.** Stopping an alert
  nobody actually handled prevents it climbing to the responder who could
  have handled it. The failure mode is that nothing happens, which is
  exactly what it looks like when things are fine.
- **Deleting or orphaning a team** breaks the routing and escalation targets
  that reference it, producing the same silent paging gap. The hosted
  surface exposes no team-delete tool, so this is currently unreachable
  rather than merely ungated.

None of these distinctions is expressible as a Conduit grant. Conduit's
policy matches on tool name only and never inspects arguments —
`ToolCallGateInput` has no `arguments` field
(`src/proxy/tool-call-enforcement.ts:69-79`) — so "may update an incident's
title, may not resolve it" cannot be configured. It has to live in the
agent's own configuration.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never self-approve
anything that pages a human** — but note that the connector is not currently
serving, so this is guidance for the day it is un-hidden, not a live
configuration.

- Read tools: allow. Incident triage, shift handoff summaries, and
  reliability reporting are the intended autonomous use.
- Write tools: agent drafts the exact call, human approves, then it runs.
- Incident and alert creation and resolution: require a named human approver
  per invocation. Do not grant them to scheduled or unattended agents.
  Because workflows sit downstream of a create, an unattended agent holding
  it has whatever reach your workflow actions have — including your status
  page and your customers' inboxes. Conduit cannot separate these from the
  other 105 write tools, so an unattended agent needs a granular
  `customTools` allowlist, not a `write` tier.
- Admin tools: treat the grant as equivalent to full Rootly administrator.
  `create_workflow_run` executes automation whose blast radius is chosen at
  call time, and the `create_user_*` contact tools can redirect paging.
- **Before configuring anything, verify the tool names your agents use
  against the served surface.** Three schemes are in circulation and a
  runbook written against the wrong one fails with "unknown tool", not with
  a permissions error.

## What it cannot reach

- Only the Rootly organisation mapped to the operator's gateway identity.
  There is no cross-organisation or reseller view.
- Token scope bounds everything. A Team-scoped token returns 403 on
  organisation-wide queries; the gateway credential should be a Global
  token.
- **Nothing at all, right now.** Conduit marks this vendor `hidden` and
  cannot speak its transport (see *Tool permission groups*), so the
  connector is not currently serving any tool.
- The two bullets that follow describe the WYRE-built `rootly-mcp`
  sidecar's surface, which Conduit does not route to. Before the
  2026-08-30 corrective pass, this plugin's `postmortems`, `services`,
  `alerts`, and `workflows` skills were written against an invented
  tool surface that matched neither the sidecar nor the hosted server —
  they are retained here as a description of the sidecar's real,
  narrower capability, not of what this plugin currently documents. The
  hosted surface Conduit classifies has real write paths for all of
  these: `create_incident_action_item`, `update_incident_retrospective_step`,
  `create_workflow`, and `create_service`, among others — see this
  plugin's `postmortems`, `workflows`, and `services` skills as of
  2026-08-30 for the corrected tool names.
- **No postmortem, action-item, workflow, or service-catalog write
  path** *in the sidecar surface*. The sidecar does not expose these as
  tools at all; this is a sidecar limitation, not a hosted-surface one.
- **No schedule authoring** *in the sidecar surface*. Schedules can be
  listed and read but not created, edited, or overridden.
- No filesystem, no shell, no other vendor's data.
- No live event stream. Every tool is point-in-time; Rootly's Slack
  integration and webhooks carry the push feed.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `list_teams` and `get_current_user` return staff identity — names,
  email addresses, and team membership. `list_schedules` and related
  on-call tools return who is on-call and when, which is a roster of
  your responders' working patterns.
- `list_incidents` / `get_incident` return incident titles, summaries,
  and timelines. In practice these carry infrastructure detail — service
  names, hostnames, error output — and, on customer-impacting incidents,
  a description of which customers were affected.
- `list_alerts` returns the raw monitoring payloads behind an
  incident, with the same disclosure profile.
- Restrict these if your agents run unattended.

## Known sharp edges

- **Two upstreams exist and they expose different tools.** The
  WYRE-built `rootly-mcp` sidecar serves `rootly_*`-prefixed names.
  Conduit's `containerUrl` for this vendor is `https://mcp.rootly.com`
  — Rootly's own hosted server, which generates a different, larger set
  from their OpenAPI spec (`list_incidents`, `find_related_incidents`, and
  similar). As of the 2026-08-30 corrective pass this plugin's skills,
  agents, and commands are written against the hosted surface Conduit
  actually routes to, not the sidecar — but tool names across the two
  upstreams are still not interchangeable, so if you ever point this
  plugin at the sidecar directly, a runbook written against one fails
  against the other with "unknown tool", not a permissions error. This
  plugin ships no `.mcp.json`, so nothing in it pins an endpoint — check
  the connection before trusting any tool name on this page.
- **Acknowledging pauses the escalation clock.** An agent that
  acknowledges an alert it cannot resolve has stopped it reaching the
  human who could.
- **Severity IDs are UUIDs and are per-organisation.** Nothing can be
  hardcoded; `list_severities` is a required lookup before any create. An
  agent guessing a severity ID gets a 422 whose message does not explain
  why.
- **Rootly's model is internal-first.** It is built for one engineering
  organisation's own infrastructure, not per-client MSP ticketing. If you
  route multiple customers through team-based scoping, be explicit that
  incident titles and summaries are visible to anyone with organisation
  scope — there is no per-client wall.
