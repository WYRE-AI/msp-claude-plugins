# Anthropic Admin Plugin

Claude plugin for the [Anthropic Admin API](https://docs.claude.com/en/api/administration-api) through [Conduit](https://conduit.wyre.ai). It gives an MSP a **read-only** view of a client's Anthropic organization (the account behind Claude Console and the Claude API): who has a seat and at what role, pending invites, workspaces, API key metadata, token usage and spend, Claude Code adoption, the compliance activity feed, and rate limits.

## What it does

- **Seat inventory** - members by role, admin-role holders, pending and expired invites, per-workspace membership, leaver checks
- **Key and audit review** - API key inventory (never the secret) and the compliance activity feed; both admin-gated in Conduit
- **Spend review** - daily cost by workspace, token usage by model and key, per-person cost analytics, chargeback for workspace-per-client MSPs, rate-limit headroom
- **Claude Code adoption** - sessions, lines, commits, PRs, and tool acceptance per developer per day; unused seat detection

## Read-only

All 19 tools are GET requests. This plugin cannot invite or remove users, create or archive API keys, or change workspaces or rate limits. Findings are recommendations for a client admin to action in Claude Console.

## Admin-gated tools in Conduit

16 tools need the `read` tier. Three are sensitive reads that Conduit gates at the **`admin`** tier:

| Tool | What it returns |
|------|-----------------|
| `anthropic_admin_api_keys_list` | API key inventory: name, status, workspace, creator, expiry, partial hint (never the secret) |
| `anthropic_admin_api_key_get` | The same for one key |
| `anthropic_admin_compliance_activities_list` | Audit events: sign-ins, membership and role changes, key lifecycle |

Org owners see every tool. Members with an ordinary `read` grant will not see these three until an owner grants the `admin` tier or allowlists them.

## Connect

1. Ask an **organization admin** of the client's Anthropic org to create a dedicated Admin key in **Claude Console > Settings > Admin keys**. It starts with `sk-ant-admin`. A normal API key (`sk-ant-api...`) will not work.
2. In Conduit, open **Anthropic Admin** in the connector catalog and paste the key into **Admin API Key**. Conduit checks it against the client's org before saving it.
3. Install the plugin:

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install anthropic-admin
```

**Why a dedicated key.** Anthropic has no read-only Admin key. Admin keys have full admin rights on the Anthropic org: they can invite and remove users, archive API keys, and change workspaces. Conduit only reads, but a dedicated key lets the client rotate or revoke Conduit's access without touching anything else.

**One key, one org.** An Admin key sees exactly one Anthropic organization. If each client has its own org, each needs its own Admin key.

If Anthropic Admin is not in your Conduit catalog yet, the connector has not been enabled for your org. It is being rolled out in stages.

### Direct connection

The plugin's `.mcp.json` points at `https://conduit.wyre.ai/v1/anthropic-admin/mcp` and sends the key as the `X-Anthropic-Admin-Key` header:

| Variable | Header | Required |
|----------|--------|----------|
| `ANTHROPIC_ADMIN_KEY` | `X-Anthropic-Admin-Key` | Yes |

## Skills

| Skill | Covers |
|-------|--------|
| `api-patterns` | Auth header, one-key-one-org, tool tiers, pagination, truncation, cents-not-dollars, errors and 429s |
| `seat-inventory` | Seat counts, admin-role review, pending invites, leaver access checks |
| `key-and-audit-review` | Key hygiene, leaver key sweeps, leaked-key triage, activity timelines (admin-gated) |
| `spend-review` | Monthly spend, chargeback by workspace, spike investigation, rate-limit headroom |
| `claude-code-adoption` | Claude Code usage roll-ups, unused seats, team views |

## Agents

- **`anthropic-org-reviewer`** - periodic review of one client's Anthropic org (seats, spend, Claude Code adoption, and with the admin tier, keys and audit) into a ranked findings report for a QBR or monthly review.

## Tools

### Organization and seats
- `anthropic_admin_organization_get`
- `anthropic_admin_users_list`, `anthropic_admin_user_get`
- `anthropic_admin_invites_list`, `anthropic_admin_invite_get`

### Workspaces
- `anthropic_admin_workspaces_list`, `anthropic_admin_workspace_get`
- `anthropic_admin_workspace_members_list`, `anthropic_admin_workspace_member_get`

### API keys (admin tier)
- `anthropic_admin_api_keys_list`, `anthropic_admin_api_key_get`

### Usage and cost
- `anthropic_admin_usage_report_messages`, `anthropic_admin_cost_report`
- `anthropic_admin_analytics_usage`, `anthropic_admin_analytics_cost` (beta)
- `anthropic_admin_usage_report_claude_code`

### Compliance (admin tier)
- `anthropic_admin_compliance_activities_list`

### Rate limits
- `anthropic_admin_rate_limits_list`, `anthropic_admin_workspace_rate_limits_list`

## Notes

- Cost amounts from the cost report, cost analytics, and Claude Code estimates are in **cents**. The skills convert them.
- The server does not page automatically. Skills page every list to the end before counting.

## Resources

- Anthropic Admin API: https://docs.claude.com/en/api/administration-api
- Admin key setup: https://platform.claude.com/docs/en/manage-claude/admin-api#admin-api-key
- Conduit: https://conduit.wyre.ai

## License

Apache-2.0
