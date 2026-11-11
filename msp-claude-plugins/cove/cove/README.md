# Cove Data Protection Plugin

Claude Code plugin for [N-able Cove Data Protection](https://developer.n-able.com/n-able-cove/docs/getting-started). Read-only.

## What It Does

- **Backup health triage**: find devices whose last backup failed, finished with errors, or has not succeeded for too long, per customer or across the whole customer tree
- **Customer and storage inventory**: map the customer (partner) tree, customer states (in trial, expired), assigned products and retention, device counts, storage used and where it is stored
- **Console access review**: list console users and their roles per customer, and read the user-action audit log

**Everything is read-only.** Each of the 29 tools calls one side-effect-free method of the Cove JSON-RPC API (`Enumerate*` or `Get*`). The server sends only methods on a read allow-list, so it cannot add, change or delete devices, customers, users, profiles or retention. It also never returns device passwords, installation tokens or storage credentials: those fields are redacted, and statistics column `I3` (the device password) is refused.

## Connecting through Conduit

This plugin ships no `.mcp.json`. Install the `wyre-gateway` plugin (or any workflow pack), which connects Claude Code to [Conduit](https://conduit.wyre.ai) at `https://conduit.wyre.ai/v1/mcp`, then connect Cove in the Conduit web UI (`/connect/cove`) as described below. Conduit stores the credentials and injects them on every request, so there are no environment variables or headers to set on the client.

Cove has no OAuth. You connect it with a Cove **API user**:

1. In the Cove Management Console, go to **Management > Users > API Users > Add API user**.
2. Pick the customer the API user belongs to. Use your top-level MSP customer to see every end customer below it.
3. Enter a login name. Cove adds a suffix to it; copy the full login name it shows.
4. Pick the **Supporter** role. Never use SuperUser, and leave Security Officer off. Pick **Administrator** only if you need the user-action audit log (`cove_audit_actions_list`); see [Permissions](#permissions).
5. Copy the API token. Cove shows it once.
6. In Conduit, open **Connections > Cove Data Protection (N-able)** and enter:

| Conduit field | Value | Header Conduit sends |
|---------------|-------|----------------------|
| Partner (customer name) | The exact customer name the API user was created under, as the console customer list shows it, often with the account email in parentheses, e.g. `Acme Corp (admin@acme.com)` | `X-Cove-Partner` |
| API user login name | The full login name, including Cove's suffix | `X-Cove-Username` |
| API token | The token from step 5 | `X-Cove-Api-Token` |

Conduit checks the three values with a Cove login before it saves them. A wrong partner name fails the same way as a wrong token (Cove error 2100), so check the partner name first.

Conduit drops any `X-Cove-*` header a client sends, so the token lives only in the Conduit connection. Never commit it or paste it into chat.

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install cove
```

## Permissions

| Tool | Conduit tier | Cove role needed |
|------|--------------|------------------|
| `cove_audit_actions_list` | **admin**: only Conduit members with the admin tier can call it | Administrator (or SuperUser). Any other role gets Cove error 13501. |
| All other 28 tools | read | Supporter is enough |

`cove_users_list` is classified as read in Conduit but returns who has console access, so treat its output as sensitive.

## Skills

| Skill | What it covers |
|-------|----------------|
| `api-patterns` | Auth headers, the 15-minute visa, partner IDs, column codes, paging, truncation, error numbers |
| `backup-health` | Failed and stale backup triage with `cove_device_statistics_list` |
| `customer-inventory` | Customer tree, customer states, products and retention, storage usage and data residency |
| `access-review` | Console users and roles, and the user-action audit log |

## Agents

| Agent | What it does |
|-------|--------------|
| `backup-health-triager` | Sweeps one customer or the whole customer tree, classifies every device by backup state, and writes a ranked triage report |

## Tools

All 29 tools, by area. All are reads.

- **Session**: `cove_auth_context_get`
- **Devices and backup health**: `cove_device_statistics_list`, `cove_devices_list`, `cove_device_get`, `cove_profiles_list`, `cove_profile_get`
- **Customers (partners)**: `cove_partners_list`, `cove_partner_children_list`, `cove_partner_get`, `cove_partner_get_by_name`, `cove_partner_properties_list`, `cove_partner_state_get`, `cove_partner_tree_get`, `cove_partner_history_list`, `cove_partner_ancestors_list`
- **Storage**: `cove_storages_list`, `cove_storage_get`, `cove_storage_statistics_list`, `cove_storage_nodes_list`, `cove_storage_node_get`, `cove_storage_nodes_by_device_list`, `cove_locations_list`, `cove_regions_list`
- **Users and audit**: `cove_users_list`, `cove_user_roles_list`, `cove_audit_actions_list` (admin tier)
- **Reporting metadata**: `cove_columns_list`, `cove_custom_columns_list`, `cove_products_list`

## Limits

- No writes. Restores, retention changes, device removal and profile edits stay in the Cove console.
- `cove_partner_children_list` returns a child count, not the children. Use `cove_partners_list` or `cove_partner_tree_get` to list them.
- The storage-node tools are not yet confirmed against a live Supporter API user.
- Cove documents no rate limits, and its JSON-RPC schema is labelled beta.
- The MSP Billing REST API is not covered.

## Security Considerations

- The API token is a long-lived credential for the API user's whole role. Enter it once in Conduit; do not paste it into chat, tickets or `.env` files in a repo.
- Use the Supporter role unless someone needs the audit log. An Administrator API user can do much more in the Cove console than this plugin ever asks it to.
- Console user lists and audit logs name your staff and your customers' staff. Share them only with the people doing the review.

## API Documentation

- [Cove API getting started](https://developer.n-able.com/n-able-cove/docs/getting-started)
