# Mailprotector Plugin

Claude Code plugin for Mailprotector email security (CloudFilter, Bracket, SafeSend, XtraMail).

## Overview

This plugin provides Claude with deep knowledge of Mailprotector, enabling:

- **Quarantine Triage** - Review held mail at any scope (reseller, customer, domain, user group, user), identify false positives, and release safely
- **Allow/Block Rules** - Scoped sender rules with downward inheritance, from one mailbox to the whole client base
- **Customer Onboarding** - Customer → domain (Pending → verified) → user group + services → users, manually or via directory sync
- **User Management** - User CRUD, bulk creation, aliases, password resets, AD/LDAP syncs with schedules and filters
- **Mail-Flow Auditing** - Log analysis, configuration review across the hierarchy, and rule-posture audits

## Tool Surface

The MCP server uses a router pattern. A compact first-class surface covers the common operations:

| Group | Tools |
|-------|-------|
| Router/meta | `mailprotector_status`, `mailprotector_list_categories`, `mailprotector_list_category_tools`, `mailprotector_execute_tool` |
| Customers | `mailprotector_customers_list` / `_get` / `_create` |
| Domains | `mailprotector_domains_list` / `_get` / `_create` |
| Users | `mailprotector_users_list` / `_get` / `_find_by_address` |
| User groups | `mailprotector_user_groups_list` |
| Messages | `mailprotector_messages_list` / `_release` / `_release_many` |
| Rules | `mailprotector_allow_block_rules_list` / `_create` / `_delete` |
| Logs & config | `mailprotector_logs_list`, `mailprotector_configuration_get` |

Everything else (updates, deletes, managers, statements, email routing, user syncs, aliases, domain move, password resets, user-group services) is reachable through `mailprotector_execute_tool(category, tool, args)` — discover it with `mailprotector_list_categories`.

Scoped tools (messages, rules, logs, configuration) take `scope` (`reseller|customer|domain|user_group|user`) plus `scope_id`, defaulting to your bound reseller.

## Prerequisites

### API Credentials

Mailprotector authenticates with a per-manager-role API key:

1. Log into the Mailprotector console
2. Open your **profile** (top right) and select the **role** you manage the reseller with
3. Choose **View API Key**

You also need your **reseller ID** — the ID of your MSP's reseller account (visible in the console; it is also the ID that `GET /api/v1/resellers/{id}` answers 200 for with your key).

### Environment Variables

```bash
export MAILPROTECTOR_API_KEY="your-api-key"
export MAILPROTECTOR_RESELLER_ID="12345"
# optional, defaults to https://emailservice.io
# export MAILPROTECTOR_BASE_URL="https://emailservice.io"
```

## Installation

### Via MCP Gateway (Recommended)

Use the [MCP Gateway](https://conduit.wyre.ai) to connect — paste your API key and reseller ID and you're done. The gateway passes them to the MCP server as the `X-Mailprotector-Api-Key` and `X-Mailprotector-Reseller-Id` headers; the server translates to the upstream Bearer token.

### Self-Hosted (Docker)

Run the Mailprotector MCP server (`ghcr.io/wyre-technology/mailprotector-mcp`) with the environment variables above. See the [MCP Gateway documentation](https://mcp.wyre.ai) for setup instructions.

## Available Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | Gateway header auth, entity hierarchy, router tool surface, scope consolidation, filtering, pagination, errors |
| `customers-and-domains` | Customer lifecycle, domain Pending → Active verification, aliases, domain move, email destinations/sources |
| `users-and-groups` | User groups as service containers, user CRUD and bulk create, aliases, password resets, AD/LDAP syncs |
| `quarantine-and-messages` | Scoped quarantine listing, scoring evidence, single and bulk release, triage workflow |
| `allow-block-rules` | Scoped rules, downward inheritance, value formats, risky-rule patterns |

## Available Agents

| Agent | Description |
|-------|-------------|
| `mailprotector-onboarder` | Onboards a customer end to end: customer → domain → verification → group + services → users or sync |
| `mailprotector-quarantine-triager` | Reviews quarantine at any scope, identifies false positives, releases safely, proposes allow rules |
| `mailprotector-mailflow-auditor` | Audits logs, configuration, and allow/block posture across customers and reports anomalies |

## Available Commands

| Command | Description |
|---------|-------------|
| `/check-quarantine` | Review held messages at any scope with a triage summary |
| `/release-message` | Release one or more held messages, with verification of what was delivered |
| `/onboard-customer` | Happy-path customer onboarding (customer, domain, group, services, users) |
| `/block-sender` | Create a scoped block rule with blast-radius confirmation |

## Quick Start

```
/check-quarantine --address "john@acme.com"
/release-message --id 1985056110
/onboard-customer --name "Acme Corp" --email "it@acme.com" --domain "acme.com"
/block-sender --value "phisher@badcorp.com" --scope user --scope-id 883326
```

## Security Considerations

- Never commit API keys; the key is a full-privilege credential for your reseller
- Every `delete_*` operation is irreversible, and customer/user-group deletes cascade to the users beneath them
- Message release is a delivery that cannot be recalled; `all_selected: true` on bulk release empties an entire scope's quarantine
- The user-group services update deactivates any service omitted from the request — always read-merge-write
- Reseller-scope quarantine and log listings contain every customer's mail metadata; scope down before pulling

## Troubleshooting

- **401 Unauthorized** — the API key is missing or invalid; re-copy it from the console profile page
- **Valid key but 404/403 on an entity** — the entity is not under your reseller; most keys can only see their own reseller (`GET /resellers/{id}` confirms the binding)
- **Bulk release "succeeds" with an empty `delivered_messages`** — wrong `scope_id`; the endpoint silently skips out-of-scope IDs
- **Mail not filtered for a new domain** — the domain is still `Pending`; verify ownership with its `verification_token`

## API Documentation

- [Mailprotector API Documentation](https://api.mailprotector.com/)
- [Mailprotector Support](https://support.mailprotector.com/)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.

## Changelog

### 1.0.0 (2026-08-18)

- Initial release
- 5 skills: api-patterns, customers-and-domains, users-and-groups, quarantine-and-messages, allow-block-rules
- 3 agents: mailprotector-onboarder, mailprotector-quarantine-triager, mailprotector-mailflow-auditor
- 4 commands: check-quarantine, release-message, onboard-customer, block-sender
