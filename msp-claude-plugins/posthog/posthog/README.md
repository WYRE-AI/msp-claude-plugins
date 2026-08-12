# PostHog Plugin

Claude Code plugin for PostHog product analytics — read-only at v1.

*Internal fast-track build, 2026-08-12 — not run through the standard
community PRD process.*

## Overview

This plugin gives Claude working knowledge of PostHog so MSP technicians and
analysts can review a client's product analytics without leaving the chat:

- **Insights & Dashboards** — Read saved insights (trends, funnels,
  retention, and similar analytics queries) and the dashboards that group
  them
- **Feature Flags & Experiments** — Look up early-access feature status and
  experiment configuration (read-only — no flag or experiment mutation)
- **Cohorts & Events** — Look up saved user/group segments, raw analytics
  events, and timeline annotations
- **API Patterns** — Auth model, `resource:action` key scoping, and error
  handling for the PostHog MCP surface

**This plugin is read-only by design.** PostHog's own MCP server exposes a
very large tool catalog with extensive write coverage; this plugin grants
and documents only the read-side tool families. See
[GOVERNANCE.md](GOVERNANCE.md) for the full reasoning and the exact list of
what is excluded.

## Prerequisites

### PostHog Personal API Key

You need a PostHog **personal API key scoped to read-only resources**:

1. Log into PostHog and open **Settings → Personal API keys**
2. Click **Create personal API key**
3. Under **Scopes**, select only read-side `resource:action` pairs relevant
   to this plugin — for example `insight:read`, `feature_flag:read`,
   `dashboard:read`, `cohort:read`, `event:read`, `annotation:read`,
   `experiment:read`. **Do not grant write scopes.** PostHog does not narrow
   this for you by default — an unscoped key is read-write.
4. Copy the key

### Connecting through Conduit

This plugin does not accept a local API key. Connect the key from the step
above once in the WYRE Conduit web UI (**Connections → PostHog**). Conduit
stores it and injects it into every call server-side.

There are **no environment variables and no headers to configure on the
client** — `.mcp.json` declares only the gateway URL:

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

## Installation

```
/plugin marketplace add wyre-technology/msp-claude-plugins
/plugin install posthog
```

## Available Skills

| Skill | Description |
|-------|-------------|
| `insights-and-dashboards` | Querying insights, running saved insight queries, dashboard retrieval |
| `feature-flags-and-experiments` | Read-only feature-flag and experiment lookups |
| `cohorts-and-events` | Cohort lookups, event and annotation queries |
| `api-patterns` | Auth model, key scoping, rate limits, and error handling |

## Available Commands

| Command | Description |
|---------|-------------|
| `/check-insight` | Look up a saved insight by ID or name and report its current result |
| `/list-feature-flags` | List early-access feature flags and their current status |
| `/list-dashboards` | List a project's dashboards, or retrieve one by ID |

## Quick Start

### Check an Insight

```
/check-insight "Weekly Active Users"
```

### List Feature Flags

```
/list-feature-flags
```

### List Dashboards

```
/list-dashboards
```

### Retrieve a Specific Dashboard

```
/list-dashboards --dashboard_id 12345
```

## Security Considerations

- **Read-only rests on exactly one real control: the PostHog personal API
  key being scoped to read-only resources at creation.** There is no
  gateway-side second layer for this vendor — PostHog's MCP server exposes
  a single `exec` tool, so Conduit's tool allowlist can only admit or deny
  it wholesale, not exclude write tool names from within it. See
  [GOVERNANCE.md](GOVERNANCE.md), *Tool permission tiers* and *Open
  enforcement gap*, for the full detail. If you cannot verify the connecting
  operator scoped the key read-only, assume this connection can write.
- Never paste a PostHog personal API key into a technician's local
  environment, a `.env` file, or this repo. It is entered once, in Conduit's
  connect UI, and stored server-side.
- Review who has access to the connected PostHog project regularly — the
  key inherits whatever the connecting user's PostHog account can see.

## Troubleshooting

### Authentication Errors

If a call fails with an authentication or permission error:
1. Confirm the PostHog personal API key is still valid in PostHog's
   **Settings → Personal API keys** — a revoked or deleted key fails silently
   from this plugin's point of view until the next call.
2. Confirm the key's `resource:action` scopes actually cover the tool being
   called — a key scoped only to `insight:read` will be refused by
   `feature_flag:read` calls even though both are reads.
3. Re-connect PostHog in Conduit (**Connections → PostHog**) if the stored
   key was rotated or revoked outside Conduit.

### Empty or Unexpected Results

1. Confirm the connected key belongs to the correct PostHog organization and
   project — PostHog keys are scoped per-organization, and a key from the
   wrong org returns that org's (empty, from your perspective) data rather
   than an error naming the mismatch.
2. Confirm the insight, dashboard, flag, or cohort actually exists in that
   project — this plugin cannot create any of them, so a missing record has
   to be created in the PostHog UI first.

### Rate Limiting

If you see a `429` response:
1. Wait before retrying — PostHog returns standard rate-limit responses;
   consult [PostHog's API documentation](https://posthog.com/docs/api) for
   current thresholds, which this plugin does not hardcode.
2. Reduce request frequency, and prefer bounded date ranges over unbounded
   pulls for event and insight queries.

## API Documentation

- [PostHog API Documentation](https://posthog.com/docs/api)
- [PostHog Model Context Protocol tools](https://posthog.com/docs/model-context-protocol/tools)
- [PostHog Personal API Keys](https://posthog.com/docs/api#authentication)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

This plugin shipped as an Aaron-approved internal fast-track build and did
not go through the standard community PRD process. Contributions that
extend it (including any future write-tool tier) should follow the normal
process and must update [GOVERNANCE.md](GOVERNANCE.md) accordingly.

## Changelog

### 0.1.0 (2026-08-12)

- Initial release — read-only at v1
- 4 skills: insights-and-dashboards, feature-flags-and-experiments,
  cohorts-and-events, api-patterns
- 3 commands: check-insight, list-feature-flags, list-dashboards
