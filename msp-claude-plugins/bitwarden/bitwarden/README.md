# Bitwarden Plugin

Claude Code plugin for [Bitwarden](https://bitwarden.com): a read-only admin
view of a client's Bitwarden organization through the
[Bitwarden Public API](https://bitwarden.com/help/public-api/).

## What It Does

- **Security posture** - which policies are on (two-step login, master
  password, single organization, SSO, vault timeout, export controls), 2FA
  coverage across members, and owner and admin sprawl
- **Offboarding access review** - what a departing user could reach, directly
  and through groups, what they opened or copied, and which shared
  credentials to rotate
- **License reconciliation** - purchased seats and autoscale limits against
  members by status
- **Event log review** - failed logins, 2FA changes, vault exports, member
  and policy changes

**Read-only.** All 12 tools are `GET` requests. Nothing in this plugin can
invite, revoke, remove or change anything, and nothing can read vault items
or passwords (the Public API does not expose them). Every fix is made by a
person in the Bitwarden Admin Console.

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install bitwarden
```

This plugin ships no `.mcp.json`. Install the `wyre-gateway` plugin (or any
workflow pack), which connects Claude Code to [Conduit](https://conduit.wyre.ai)
at `https://conduit.wyre.ai/v1/mcp`, then connect Bitwarden in the Conduit web
UI (`/connect/bitwarden`). Conduit stores the credentials and injects them on
every request, so there are no environment variables or headers to set on the
client.

## Connecting

You need a Bitwarden **organization API key** on a **Teams or Enterprise**
plan.

1. An organization owner opens the Admin Console, goes to **Settings >
   Organization info**, and selects **View API key**.
2. Copy the `client_id` (it starts with `organization.`) and the
   `client_secret`. A personal `user.` key does not work.
3. In Conduit, connect Bitwarden with:
   - **Organization client_id**
   - **Organization client_secret**
   - **Region**: US cloud (bitwarden.com) or EU cloud (bitwarden.eu). US is
     the default.

Bitwarden has no read-only key, so this key can also change the
organization even though Conduit only reads. Rotate it from the same Admin
Console page if it is ever exposed, then re-submit the Conduit connect form.
Self-hosted Bitwarden is not supported yet.

One key covers one Bitwarden organization. Each client organization needs
its own key.

Conduit passes the three fields to the MCP server as the
`X-Bitwarden-Client-Id`, `X-Bitwarden-Client-Secret` and `X-Bitwarden-Region`
headers. Nothing is configured on the client: Conduit drops any
`X-Bitwarden-*` header a client sends.

## Tools

| Tool | Returns | Conduit tier |
|---|---|---|
| `bitwarden_members_list` | All members: role, status, 2FA, email, collection access | read |
| `bitwarden_members_get` | One member | read |
| `bitwarden_members_list_group_ids` | A member's groups | read |
| `bitwarden_groups_list` | All groups and their collection access | read |
| `bitwarden_groups_get` | One group | read |
| `bitwarden_groups_list_member_ids` | A group's members | read |
| `bitwarden_collections_list` | All collections (metadata only) | read |
| `bitwarden_collections_get` | One collection | read |
| `bitwarden_policies_list` | All configured policies | read |
| `bitwarden_policies_get` | One policy by type | read |
| `bitwarden_events_list` | The organization event log, paged | **admin-gated** |
| `bitwarden_subscription_get` | Seats, autoscale limits, storage | read |

`bitwarden_events_list` needs the admin tier in the Conduit access editor
because events carry emails, IP addresses and device details. With only the
read tier, every workflow still runs, but without the activity checks.

## Skills

- `api-patterns` - authentication, the tool list, enums, paging, truncation,
  errors and rate limits
- `security-posture` - policies, 2FA coverage, owners and admins
- `offboarding-access-review` - a leaver's access map and rotation checklist
- `license-reconciliation` - seats against members
- `event-log-review` - reading the admin-gated event log

## Agents

- `bitwarden-org-auditor` - a full posture, hygiene, seat and event review of
  one client organization, ranked into a QBR-ready report

## License

Apache-2.0
