# 1Password Plugin

Claude plugin for **1Password Business and Enterprise**, through Conduit. It gives an MSP
the security view of a client's 1Password account: what admins changed, which
shared-vault items were used, who failed to sign in, and who holds a seat.

Backed by [WYRE-AI/1password-mcp](https://github.com/WYRE-AI/1password-mcp): six tools
over two official 1Password APIs on fixed regional hosts.

- **Events API**: activity metadata only. It never returns passwords or other secret values.
- **Users API** (optional): user inventory, through an OAuth client limited to View users.

**Read-only.** Nothing in this plugin can create, change, suspend, reactivate or delete
anything in 1Password. Suspending a departed user, removing vault access or rotating a
credential happens in the 1Password admin console. Vault contents (1Password Connect)
are out of scope: Conduit never reads them.

## Tools

| Tool | What it returns | Needs | Conduit tier |
|---|---|---|---|
| `1password_events_introspect` | The Events token's features, issue date and account UUID | Events token | read |
| `1password_audit_events_list` | Admin and member actions: user, group, vault and account changes | Events token with the `auditevents` feature | **admin** |
| `1password_item_usages_list` | When items in shared vaults were accessed, used or changed, and by whom | Events token with the `itemusages` feature | **admin** |
| `1password_signin_attempts_list` | Sign-in attempts with outcome, failure category, country and client | Events token with the `signinattempts` feature | **admin** |
| `1password_users_list` | Users with email, name, state (`ACTIVE` or `SUSPENDED`) and create time | Users API client + account ID | read |
| `1password_users_get` | One user by ID | Users API client + account ID | read |

**Admin-gated in Conduit.** The three Events feeds are the account's audit trail, so
Conduit classifies them as admin tools. A Conduit member with only the read tier sees
`1password_events_introspect`, `1password_users_list` and `1password_users_get`; the
audit, item-usage and sign-in feeds need the admin tier. None of the six tools writes:
the feeds send their query in a request body, which is the only reason they are not
plain reads at the HTTP level.

## Skills

| Skill | Covers |
|---|---|
| `api-patterns` | Credentials and headers, which tool needs which credential, cursor and page-token paging, time windows, rate limits, errors |
| `offboarding-review` | What a departing or departed user did in the account, and whether they still hold a seat |
| `signin-triage` | Failed, MFA-failed and unusual-location sign-ins, grouped by user and cause |
| `account-hygiene` | Seat inventory against the client's headcount, suspended seats, and admin changes over a review period |

## Agents

- **`access-reviewer`**: runs a full access review for one client account (seat inventory,
  admin changes, shared-vault usage by flagged users, sign-in failures) and returns a
  findings report with the manual follow-ups for the 1Password console.

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install 1password
```

This plugin ships no `.mcp.json`. Install the `wyre-gateway` plugin (or any workflow
pack), which connects Claude Code to [Conduit](https://conduit.wyre.ai) at
`https://conduit.wyre.ai/v1/mcp`, then connect 1Password in the Conduit web UI
(`/connect/1password`). Conduit stores the credentials and injects them on every request,
so there are no environment variables or headers to set on the client.

## Connecting a client account

From Conduit's connect form:

> Needs a 1Password Business or Enterprise account. Add an Events Reporting token (an
> owner or admin creates it at 1Password.com > Integrations > Events Reporting; give it
> only the feeds you need and an expiry), a Users API application with only the View
> users permission, or both. The account ID is the 26-character ID of the 1Password
> account. Conduit never reads vault contents.

1. Pick the **Region** the account lives in: `us` (1password.com), `ent` (ent.1password.com),
   `ca` (1password.ca) or `eu` (1password.eu).
2. For the audit, item-usage and sign-in tools, add an **Events Reporting token**. Turn on
   only the feeds you need, and set a 90- or 180-day expiry (1Password's default is never).
3. For the user inventory tools, add a **Users API** application created with only the
   **View users** permission. Enter all three of its client ID, client secret and the
   account ID. Permissions cannot be changed after the application is created, and Conduit
   refuses one that can also suspend or reactivate users.

You can add the Events token, the Users API client, or both. Conduit checks each half when
you save: the token against the Events API, the client by minting a token and confirming
its scope is exactly View users.

## Conduit connection fields

| Field | Required | Notes |
|---|---|---|
| Region | Yes | `us`, `ent`, `ca` or `eu` |
| Events Reporting token | One half | For the Events tools |
| Users API client ID | Other half | For the Users tools |
| Users API client secret | Other half | For the Users tools |
| Account ID | Other half | 26-character account ID |

Conduit passes these to the 1Password MCP server as the `X-OnePassword-*` headers in its
`headerMapping`. Nothing is configured on the client: Conduit drops any `X-OnePassword-*`
header a client sends.

## Limitations

- Events data is kept for 120 days. Anything older is gone from the API.
- No tool reads vault names, item titles or secrets. Item usage events carry vault and item
  UUIDs; map them to names in the 1Password console.
- No tool reads account policies (MFA enforcement, password policy, firewall rules). Policy
  changes show up only as audit events.
- Nothing pages automatically. Every skill pages explicitly and says so when it stops early.

## Resources

- 1Password Events API: https://www.1password.dev/events-api/
- 1Password Users API: https://www.1password.dev/users-api/
- Sidecar: https://github.com/WYRE-AI/1password-mcp
- Conduit: https://conduit.wyre.ai
