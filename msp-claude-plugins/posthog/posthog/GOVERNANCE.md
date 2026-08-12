# PostHog plugin — governance and safety model

Unofficial. Community-built plugin for the PostHog product-analytics API.
Not affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches PostHog through the WYRE
Conduit gateway (`https://conduit.wyre.ai/v1/posthog/mcp`), which brokers
authentication centrally and scopes every call to the PostHog project the
operator is authorised for.

- No PostHog personal API key is stored on the technician's machine, in this
  repo, or in the model's context. The key is entered once in Conduit's
  connect page and injected server-side per request; this plugin's `.mcp.json`
  declares no headers and no environment variables for the client to set.
- The org's PostHog credential is stored once at the gateway, so replacing it
  is one edit rather than a change on every technician's machine. PostHog
  personal API keys don't expire on a schedule and Conduit has no rotate
  action for any vendor — rotation means minting a new key in PostHog and
  re-submitting Conduit's connect form, which overwrites the stored
  credential in place. Nothing tracks its age or prompts you.
- Every call carries operator identity, so the gateway audit log answers "who
  pulled this dashboard." PostHog's own activity log attributes API calls to
  the personal API key's owner, which is fine for a single technician's key
  but says nothing about which agent or session made the call once a key is
  shared.
- Removing someone from the organisation clears their per-vendor grants and
  revokes their gateway refresh tokens at once; a user deactivated in your
  identity provider is refused on their very next request. A user only
  removed from the org keeps an already-issued access token for up to an
  hour, but it reaches only a personal PostHog connection made with their own
  key — never the org's. See `wyre-gateway/GOVERNANCE.md`.

### The scope decision happens outside Conduit, at key creation

PostHog personal API keys carry their own permission model, independent of
Conduit: each key can be scoped to specific `resource:action` pairs —
`insight:read`, `feature_flag:read`, `dashboard:read`, and so on — at the
moment it is minted in the PostHog UI. **This is the primary control for
this plugin's read-only posture.** A key scoped only to `:read` actions
cannot be used to write, no matter what a caller asks it to do — PostHog's
own API rejects the write call before it reaches any Conduit or plugin
logic.

That control lives entirely on the customer's side of the connection.
Conduit stores whatever key it is given; it does not inspect, mint, or
verify the key's scopes. **If whoever connects PostHog to Conduit pastes in
a key that was minted with full read/write access — the PostHog default
when scopes aren't explicitly narrowed — this plugin's read-only posture is
not enforced at all.** There is no gateway-side fallback for this vendor —
see *Tool permission tiers* below for why. Setup instructions for this
plugin must tell the connecting operator, explicitly, to scope the key to
read-only resources before pasting it into Conduit. Verifying that
instruction was followed is a manual step today; PostHog does not expose a
way to introspect a key's granted scopes after the fact from outside its
own settings UI.

## Tool permission tiers

> **`posthog` has no entry in `VENDOR_TOOL_CONFIG` — this is a new vendor
> connector.** Conduit derives a tool's tier from `VENDOR_TOOL_CONFIG`
> (`src/proxy/result-cache.ts`) and fails closed:
> `const requiredTier: PermissionTier = classified ?? 'admin';`
> (`src/access/access-enforcement.ts:63`). Until `posthog` is classified
> there, the grouping below carries no tier-enforcement meaning at all — a
> `read` or `write` grant on this vendor admits nothing, and an `admin`
> grant admits every tool the upstream MCP server exposes, including the
> write tools this plugin deliberately does not document or recommend. For
> the live list of unclassified vendors see `wyre-gateway/GOVERNANCE.md`,
> *Fail-closed, and the vendors Conduit has not classified*. Classifying a
> vendor is always a privilege *reduction*, never an expansion.
>
> Because tiering does nothing for this vendor yet, and because PostHog's
> MCP server exposes exactly **one** tool (`exec`, taking a free-text
> `command` string — confirmed live via `tools/list`, not inferred), a
> gateway-side `customTools` allowlist CANNOT express the read-tool-family
> split below. There is no per-family tool name to allow or deny: `exec`
> either reaches the connection (the entire upstream command surface,
> reads and writes alike) or it doesn't. Naming `exec` in the allowlist is
> operationally identical to granting `admin` with no allowlist at all —
> both admit every command PostHog's `exec` accepts, including every
> write tool this document excludes. The family table below documents
> PostHog's own command vocabulary for this plugin's skills to use
> responsibly; it is not a Conduit-enforceable boundary.

PostHog's own MCP server exposes a very large tool surface — north of 200
tools spanning nearly every product area, with substantial create/update/
delete coverage on most of them: feature flags, insights, dashboards,
cohorts, canvas, business knowledge, data warehouse, early-access features,
support conversations, and AI-observability/LLM-cost tooling. That is not a
gap in this plugin's documentation; it is the actual shape of PostHog's API.

**This plugin ships read-only at v1 by explicit decision (Aaron/founder
sign-off, 2026-08-12) — not because PostHog lacks write tools, but because
the tool surface is unusually large and write-heavy for a "productivity"
catalog addition, and several of those write tools have real external side
effects:**

- `conversations-tickets-reply-create` posts an **actual reply on a
  customer support ticket** — the same hazard class as Freshdesk's
  `freshdesk_tickets_reply` (see `freshdesk/GOVERNANCE.md`): there is no
  unsend, and it goes out under the operator's identity.
- Feature-flag mutation tools — `early-access-feature-create`,
  `early-access-feature-destroy`, `early-access-feature-partial-update`,
  and flag create/update/delete generally — change what code path a **live
  client's production application** executes for some or all of its users,
  immediately and with no built-in dry run.
- `alert-simulate` and the `llma-*` (AI-observability) job- and
  eval-creation tools can **incur real spend** — simulating an alert or
  kicking off an LLM evaluation/observability job is a billable action
  against the connected PostHog project, not a read.

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change PostHog state. The only tier this plugin grants, documents, or recommends. | See the family table below. |
| **Write / Delete / Admin** | **Not shipped in v1.** Every create, update, delete, and destroy tool across every family — including `conversations-tickets-reply-create` and other ticket-write tools, feature-flag/early-access-feature CRUD, `alert-simulate`, the `llma-*` job/eval-creation tools, and `canvas-publish-*`. | Deliberately excluded. Not granted, not documented per-call, not part of any bundled command or skill. |

### The read-only tool families this plugin grants

Grouped by product area, matching PostHog's own tool naming. This is not the
exhaustive list — PostHog documents the full 200+-tool catalog at
[posthog.com/docs/model-context-protocol/tools](https://posthog.com/docs/model-context-protocol/tools);
this table names the read-side families this plugin's skills and commands
are built against.

| Family | Read tools |
|---|---|
| Actions | get, list |
| Insights | `dashboard-get`, `dashboards-get-all`, insight run/read |
| Feature Flags | `early-access-feature-list`, `early-access-feature-retrieve` (read only — create/destroy/partial-update excluded, see above) |
| Experiments | list, get |
| Cohorts | list, retrieve |
| Events / Annotations | list, retrieve |
| Dashboards | `dashboard-get`, `dashboards-get-all` |
| Data Warehouse | view-get/list, schema reads |
| Search | `docs-search`, entity search |
| Alerts | get, list (**not** `alert-simulate`) |
| Business Knowledge | search, retrieve |

**Conduit does not enforce per-call approval.** It compares tiers and,
where configured, checks the tool allowlist against the MCP tool NAME —
there is no approval step, no per-call confirmation, no command-content
inspection, and no interactive prompt anywhere in its enforcement path.
For this vendor the allowlist has exactly one name to check against
(`exec`), so it collapses to a binary reachable/not-reachable decision.
**The read-only posture above rests entirely on (1) the key's own
`resource:action` scopes.** There is no (2) — the gateway allowlist adds
no granularity beyond "can this grantee reach PostHog through Conduit at
all," and nothing in Conduit stops a full-scope key from reaching every
write tool once that coarse gate is open.

## Recommended agent policy

Because this plugin ships no write surface, **read tools are safe to grant
to autonomous and scheduled agents** — insight review, dashboard pulls for
QBRs, feature-flag status checks, and cohort/event lookups are the intended
unattended use. Grant them through the gateway allowlist naming the read
families above; do not grant `admin` on this vendor, because `admin` reaches
the full upstream surface including everything this document excludes.

There is no write tier to propose-then-approve here, unlike Xero or
Freshdesk. If a future version of this plugin adds write tools, that
version needs its own agent-policy section — do not assume the read-only
recommendation above still holds once this document is updated to grant a
write or destructive tier.

## What it cannot reach

- Only the PostHog project(s) the connected personal API key can see.
  PostHog keys are scoped per-organization at creation; a key minted under
  the wrong PostHog organization returns another team's analytics, not an
  error.
- Only the `resource:action` scopes the key was minted with — **if the key
  was over-scoped at creation, this plugin's read-only posture is not
  enforced at all; there is no gateway-side fallback for this vendor.** See
  *The scope decision happens outside Conduit* above and *Tool permission
  tiers* below.
- No write path of any kind, in the tools this plugin grants or documents —
  see *Tool permission tiers*.
- No filesystem, no shell, no other vendor's data.
- No session-replay video or raw session-recording playback; this plugin's
  skills cover insights, dashboards, feature flags, experiments, cohorts,
  events, annotations, and business knowledge only.

## Data handling

Responses pass through the gateway into model context for the session and
are not persisted by this plugin.

- **Product usage and business metrics.** Insights and dashboards can
  surface conversion rates, retention curves, revenue-adjacent metrics, and
  error-rate trends — commercially sensitive about the client's business,
  not just about their software.
- **Potential end-user PII in events and cohorts.** Whether an event or
  cohort record contains personally identifying data (email addresses, user
  IDs, free-text properties) depends entirely on what the client's own
  application sends to PostHog. This plugin has no way to know in advance
  whether a given project's event stream is PII-clean; treat event and
  cohort output as potentially sensitive by default.
- **Feature-flag and experiment state** can reveal unreleased features,
  internal rollout percentages, and which customers are in a beta —
  information a client may not want surfaced outside their own team.
- **Business Knowledge search** returns whatever the connected team has
  written into PostHog's business-knowledge store, which may include
  internal notes not meant for a support or MSP audience.

Restrict the insight, dashboard, and business-knowledge tools specifically
if agents run unattended or render output where anyone outside the client's
own team could see it.

## Open enforcement gap (tracked, not resolved by this plugin)

**"Read-only" for this vendor rests on exactly ONE real control, and
Conduit does not enforce it:**

1. The PostHog personal API key must be scoped to read-only
   `resource:action` pairs at creation (see *The scope decision happens
   outside Conduit* above) — Conduit does not inspect or verify this.
   PostHog's own API rejects a write call against a properly-scoped key
   before it reaches Conduit or this plugin, so a correctly-scoped key IS
   a hard boundary — but nothing checks that the connecting operator
   actually scoped it that way.

**There is no second, gateway-side layer for this vendor — not
"unenforced if misconfigured," but structurally absent.** PostHog's MCP
server exposes a single tool, `exec` (confirmed live via `tools/list`:
one entry, schema `{command, context}`), that dispatches every operation
— read and write alike — through a free-text `command` string. Conduit's
`customTools` allowlist gates on the MCP tool NAME; with only one name to
gate on, it can only ever choose between "this grantee can reach PostHog
through Conduit" (the full upstream command surface) or "cannot" (nothing,
not even reads). No allowlist configuration, correct or otherwise, can
admit `dashboard-get` while excluding `conversations-tickets-reply-create`
— Conduit cannot see inside the `command` string to tell them apart. An
operator who pastes in a full-access key gets the complete, unrestricted
upstream PostHog tool surface the moment ANY grant reaches `exec` at all —
`admin` and a "read-family" allowlist are operationally identical for this
vendor today. This is a real gap between what this document calls
"read-only" and what Conduit actually enforces for a first adopt-vendor
plugin of this shape — flagged to Aaron (2026-08-12), who has since
directed Conduit-side engineering (command-argument sub-tool inspection
for exec-dispatch vendors as a class; warden security review pending) to
close it. Not resolved by this PR; tracking here so it isn't lost. Until
that ships, treat PostHog as key-scope-only enforcement: if you cannot
verify the connecting operator scoped the key read-only, assume this
connection can write.

## Known sharp edges

- **The tool surface is bigger than this document, on purpose.** This
  plugin covers a deliberate subset. Any grant that reaches `exec` at all
  gets the entire upstream catalog — including tools no skill or command
  here was written against — since `admin` and an allowlist naming `exec`
  are the same reach for this vendor (see *Tool permission tiers*).
- **A key minted without explicit read-only scopes is read-write by
  default.** PostHog does not force an operator to narrow scopes at key
  creation; the read-only posture this document describes depends on the
  connecting operator having done that deliberately. See *Open enforcement
  gap* above — this is not a hypothetical, it's the actual current state.
- **Feature-flag and early-access-feature reads are two different families
  with overlapping vocabulary.** `early-access-feature-list` /
  `early-access-feature-retrieve` is the confirmed read surface for
  early-access features specifically; PostHog's broader feature-flag API
  has its own read and write tools documented at the link above. Don't
  assume every "feature flag" question routes through the early-access
  tools — check `skills/feature-flags-and-experiments/SKILL.md`.
- **Not yet classified means not yet safely grantable at any coarse tier
  OR allowlist.** Until `posthog` gets sub-tool-aware enforcement (a plain
  `VENDOR_TOOL_CONFIG` entry alone can't express a mid-command split for a
  single-tool vendor — see *Open enforcement gap*), there is no `read`
  grant, and no `customTools` allowlist, that admits only the families
  above. `exec` either reaches the connection or it doesn't — that is the
  entire granularity Conduit has today. Classifying the vendor with real
  command-level sub-tool inspection, when it ships, is what turns the
  family table above into an actual enforced `read` tier.
