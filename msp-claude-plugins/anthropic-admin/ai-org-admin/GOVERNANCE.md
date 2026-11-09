# Anthropic Admin plugin — governance and safety model

Unofficial. Community-built plugin for the Anthropic Admin API. Not
affiliated with, endorsed by, or sponsored by Anthropic.

## What it connects as

This plugin does not hold credentials. It reaches the Anthropic Admin API
through the WYRE Conduit gateway, which stores the client's Admin key once
and sends it to the sidecar on each call.

- No Admin key is stored on the technician's machine, in this repo, or in
  the model's context.
- Every call carries the operator's identity, so the Conduit audit log
  shows who looked at a client's keys or spend. Anthropic's own feed
  records only the Admin key.
- Replacing the key means re-submitting the connect form; nothing tracks
  the key's age or prompts for rotation.

## The credential is broader than the connector

Anthropic has no read-only Admin key. The `sk-ant-admin` key behind this
connector can invite and remove users, archive API keys, and change
workspaces. The sidecar only issues GET requests and has no mutating
route, so nothing in this plugin can do those things, but the key itself
can. Ask each client for a dedicated Admin key for Conduit so it can be
revoked on its own, and never copy it anywhere else.

## Tool permission tiers

> **Confirm the live grant in the access editor.** The table below matches
> Conduit's classification of this connector. Confirm the live grant
> before you rely on a tier.

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Reads org, seat, workspace, usage, cost, Claude Code, and rate-limit data. Changes nothing. | `anthropic_admin_organization_get`, `anthropic_admin_users_list`, `anthropic_admin_user_get`, `anthropic_admin_invites_list`, `anthropic_admin_invite_get`, `anthropic_admin_workspaces_list`, `anthropic_admin_workspace_get`, `anthropic_admin_workspace_members_list`, `anthropic_admin_workspace_member_get`, `anthropic_admin_usage_report_messages`, `anthropic_admin_cost_report`, `anthropic_admin_usage_report_claude_code`, `anthropic_admin_analytics_usage`, `anthropic_admin_analytics_cost`, `anthropic_admin_rate_limits_list`, `anthropic_admin_workspace_rate_limits_list` |
| **Admin** | Sensitive reads: the credential inventory and the audit log. Still changes nothing. | `anthropic_admin_api_keys_list`, `anthropic_admin_api_key_get`, `anthropic_admin_compliance_activities_list` |

There is no write tier. The admin tier here is about what the data
reveals, not what the tool can do.

## Recommended agent policy

- Read tools: allow for scheduled reviews and QBR prep.
- Admin tools: grant to the people who run security reviews for the
  client, not to every technician. Scheduled agents that only produce
  spend or adoption reports do not need them.

## Data handling

- Responses pass through Conduit into model context for the session and
  are not persisted by this plugin.
- Users, invites, and Claude Code reports carry names and email
  addresses. Claude Code reports carry per-person productivity figures;
  keep per-person tables with the client's engineering lead.
- Key metadata includes a partial key hint, never the secret. Treat it as
  sensitive anyway: it ties a key ID to a leaked fragment.

## Known sharp edges

- Cost amounts are in cents, including the cost report labelled USD.
- One Admin key sees one org. Confirm the org with
  `anthropic_admin_organization_get` before every report.
- The server does not page automatically; a count from one page is wrong
  whenever `has_more` is true.
