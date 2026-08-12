---
name: "PostHog API Patterns"
description: >
  PostHog API fundamentals for this plugin: personal API key auth brokered
  through Conduit (no local key), the resource:action scope model, generic
  REST error handling, and why this plugin's read-only posture rests on the
  key's own scopes alone — Conduit has no gateway-side fallback for this
  vendor.
when_to_use: >-
  When authenticating to PostHog, reasoning about key scopes, or debugging
  errors or rate limiting from the PostHog MCP server. Use when: posthog
  api, posthog auth, posthog authentication, posthog personal api key,
  posthog scope, posthog rate limit, or posthog error.
---

# PostHog API Patterns

## Overview

PostHog's API is REST/JSON, reached here through PostHog's own MCP server
via the WYRE Conduit gateway. This skill covers the mechanics that aren't
guessable from the resource names: how auth is brokered, how PostHog's key
scoping actually enforces (or fails to enforce) this plugin's read-only
posture, and generic error handling.

## Anti-triggers

- **What a specific resource's fields or tool names are** — use
  `insights-and-dashboards`, `feature-flags-and-experiments`, or
  `cohorts-and-events`.
- **Why this plugin excludes write tools** — that's a governance question,
  not an API-mechanics one; see
  [GOVERNANCE.md](../../GOVERNANCE.md).

## Connection & Authentication

This plugin does not accept a local PostHog credential. The operator
connects a PostHog **personal API key** once, in Conduit's connect UI
(**Connections → PostHog**); Conduit stores it and injects it into every
upstream request server-side. This plugin's `.mcp.json` declares no headers
and no environment variables — there is nothing to configure on the client.

```json
{
  "mcpServers": {
    "posthog": {
      "type": "http",
      "url": "https://conduit.wyre.ai/v1/posthog/mcp"
    }
  }
}
```

## The resource:action Scope Model

PostHog personal API keys carry their own permission model, independent of
whatever Conduit grants. Each key is scoped to specific `resource:action`
pairs at creation — for example `insight:read`, `feature_flag:read`,
`dashboard:read`. A key minted with only read-side scopes cannot be used
for a write call; PostHog's own API rejects it before the request reaches
this plugin's logic at all.

**This is the primary reason this plugin can claim to be read-only**, and
it is also the primary gap: PostHog does not narrow a key's scopes by
default, so a key minted without deliberately restricting scopes is
read-write. Setup for this plugin depends on whoever connects PostHog to
Conduit having scoped the key correctly — see
[GOVERNANCE.md](../../GOVERNANCE.md), *The scope decision happens outside
Conduit, at key creation*.

**There is no second, independent layer for this vendor.** PostHog's MCP
server exposes a single tool, `exec`, that dispatches every operation
through a free-text `command` string — Conduit's gateway-side allowlist
gates on the MCP tool NAME, and with only one name to gate on, it can only
admit or deny `exec` wholesale, never exclude specific write commands
within it. The key's own scope is the entire enforcement story for this
vendor; treat a connection as read-write unless you can confirm the
connecting operator actually scoped the key to read-only resources. See
[GOVERNANCE.md](../../GOVERNANCE.md), *Tool permission tiers* and *Open
enforcement gap*.

## Error Handling

Standard REST conventions apply; PostHog does not layer a nonstandard error
shape on top of them for the tool families this plugin uses:

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad request | Check the tool's arguments against the target resource |
| 401 | Unauthorized | The connected personal API key is invalid or was revoked — reconnect in Conduit |
| 403 | Forbidden | The key's scopes don't cover the tool being called, or it belongs to the wrong PostHog organization |
| 404 | Not found | The referenced insight, dashboard, flag, cohort, or event doesn't exist in this project |
| 429 | Rate limited | Back off and retry; see *Rate Limiting* below |
| 5xx | Server error | Retry with backoff |

## Rate Limiting

This plugin does not hardcode PostHog's rate-limit thresholds — they are
not part of the confirmed facts behind this plugin and are subject to
change on PostHog's side. Consult
[PostHog's API documentation](https://posthog.com/docs/api) for current
limits. Treat a `429` the same as any REST API: honor a `Retry-After`
header if present, back off, and prefer bounded, targeted queries (a named
insight or dashboard, a date-bounded event query) over broad unbounded
pulls, which are the fastest way to hit a limit during a sweep across
multiple clients.

## Gotchas

- **Read-only here rests on exactly one control: the key's own scopes.**
  There is no gateway-side allowlist granularity for this vendor — `exec`
  is reachable or it isn't, and naming it in an allowlist is the same as
  granting `admin`. See [GOVERNANCE.md](../../GOVERNANCE.md).
- **`posthog` is not yet classified in Conduit's `VENDOR_TOOL_CONFIG`,
  and classifying it would not add tool-family granularity either** — it
  would only let Conduit require a coarse tier floor before `exec` is
  reachable at all. See [GOVERNANCE.md](../../GOVERNANCE.md), *Tool
  permission tiers*, and `wyre-gateway/GOVERNANCE.md` for the mechanism
  this depends on.
- **A key from the wrong PostHog organization doesn't error — it just
  returns that org's data.** If results look implausibly empty or
  unfamiliar, check which organization the connected key actually belongs
  to before assuming the resource doesn't exist.

## Related Skills

- [Insights & Dashboards](../insights-and-dashboards/SKILL.md) — Insight and dashboard retrieval
- [Feature Flags & Experiments](../feature-flags-and-experiments/SKILL.md) — Flag and experiment status
- [Cohorts & Events](../cohorts-and-events/SKILL.md) — Segment and event lookups
