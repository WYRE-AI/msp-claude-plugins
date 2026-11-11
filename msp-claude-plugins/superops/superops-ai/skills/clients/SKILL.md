---
name: "SuperOps Clients"
description: >
  SuperOps.ai client (account) management: stage and status enums, core/business/
  address fields, client CRUD mutations, site and contact (requester) management,
  custom fields, soft vs. hard delete, and onboarding workflows.
when_to_use: >-
  When creating, updating, searching, and managing client accounts. Use when: superops client,
  client management, create client superops, update client, client site, client contact, account
  management, client custom fields, delete client, or client lifecycle.
---

# SuperOps.ai Client Management

## Overview

Clients (also called Accounts) are the foundation of SuperOps.ai's PSA. Every ticket, asset, and service is associated with a client. This skill covers client CRUD operations, site management, contact handling, and custom field configuration.

## Anti-triggers

- **The same client in a different PSA** — `connectwise-psa-companies`,
  `autotask-crm`, `syncro-customers`, `halopsa-clients`, and
  `atera-customers` are separate systems of record. Create the account
  in the one the MSP actually bills from.
- **A Microsoft 365 tenant** — a SuperOps client is a PSA account, not
  an M365 tenant; use `cipp-tenants`.
- **What a client owns** — endpoints are `superops-assets`, open work is
  `superops-tickets`.

## MCP Tools

| Tool | Tier | Purpose |
|------|------|---------|
| `superops_clients_list` | read | List clients |
| `superops_clients_search` | read | Find a client by name |
| `superops_clients_get` | read | One client |

Anything without a typed tool goes through `superops_custom_query` (admin tier; send query documents only, since the tool does not stop a mutation) or `superops_custom_mutation` (arbitrary GraphQL mutation); both are `admin` tier and need human approval. The GraphQL examples in this skill show what those passthrough calls send.

## Key Concepts

**Stage** tracks the lifecycle, and **status** is a sub-state of stage. Each status
belongs to one stage, and pairing a status with the wrong stage matches nothing.
Both are tenant-configured strings. A stock tenant has these values:

| Stage | Statuses |
|-------|----------|
| **Active** | Paid, Unpaid |
| **Prospect** | New, Negotiation, Won, Lost |
| **Inactive** | (none) |

To read the tenant's own lists, query `getAllFields(input: "CLIENT")` through
`superops_custom_query`.

Most-used fields: `accountId` (system-generated), `name` (required), `stage`,
`status`, `emailDomains`, `accountManager`, `primaryContact`, `hqSite` and
`customFields`. The last four are `JSON`, so select them by name only. A client
owns **sites** (physical locations) and **client users** (contacts). Ticket
inputs refer to a client user as the `requester`.

See [references/fields.md](references/fields.md) for the complete field reference.

## Common Workflows

### Client Onboarding

1. **Create the client and its HQ site** with `createClientV2`. Its `hqSite`
   input is required.
2. **Add other locations** with `createClientSite`.
3. **Create contacts** with `createClientUser`. Each contact needs a requester
   `role` and an association with the client and a site.
4. **Set the primary contact and account manager** with `updateClient`.

Ordering matters: a site must exist before a contact can be associated with it.
Every step is a `superops_custom_mutation` call (admin tier, human approval).

### Client Search

Use `superops_clients_search`. It matches the term against the client name or any
of its email domains:

```json
{ "tool": "superops_clients_search", "arguments": { "query": "acme" } }
```

The GraphQL it sends is a `condition` branch. `joinOperator` must be uppercase,
because SuperOps treats any other spelling as `OR` without reporting an error.
The valid string operators are `is`, `isNot`, `contains`, `notContains`,
`startsWith` and `endsWith`. `includes` and `notIncludes` take an array.

```json
{
  "input": {
    "page": 1,
    "pageSize": 10,
    "condition": {
      "joinOperator": "OR",
      "operands": [
        { "attribute": "name", "operator": "contains", "value": "acme" },
        { "attribute": "emailDomains", "operator": "contains", "value": "acme" }
      ]
    }
  }
}
```

### Client Health Dashboard

Aliases batch the client record and its asset and ticket counts into one
`superops_custom_query` call. `client` is a flat attribute holding the account ID
on both lists. It is not a nested `client.accountId` path.

```graphql
query clientHealth($clientId: ID!, $clientFilter: JSON, $openStatuses: JSON) {
  client: getClient(input: { accountId: $clientId }) {
    name
    stage
    status
  }
  assets: getAssetList(input: {
    pageSize: 1
    condition: { attribute: "client", operator: "includes", value: $clientFilter }
  }) {
    listInfo { totalCount }
  }
  openTickets: getTicketList(input: {
    pageSize: 1
    condition: {
      joinOperator: "AND"
      operands: [
        { attribute: "client", operator: "includes", value: $clientFilter }
        { attribute: "status", operator: "includes", value: $openStatuses }
      ]
    }
  }) {
    listInfo { totalCount }
  }
}
```

```json
{ "clientId": "<account id>", "clientFilter": ["<account id>"], "openStatuses": ["Open", "On Hold"] }
```

An `Alert` has no client field, so alert counts come from `getAlertsForAsset`
on each of the client's assets. See the alerts skill.

## API Patterns

| Operation | GraphQL |
|-----------|---------|
| Create client | `createClientV2(input: CreateClientInputV2!)` |
| List clients | `getClientList(input: ListInfoInput!)` |
| Get client | `getClient(input: ClientIdentifierInput!)` |
| Update client | `updateClient(input: UpdateClientInput!)` |
| Soft delete | `softDeleteClients(input: [ClientIdentifierInput!]!)` |
| Hard delete | `hardDeleteClients(input: [ClientIdentifierInput!]!)` |
| Restore | `restoreClients(input: [ClientIdentifierInput!]!)` |

Note the `V2` suffix on client creation — `createClientV2` is the current mutation, while
update/delete have no version suffix. Delete and restore take an array of
`{ accountId }` objects, even for one client: `input: [{ accountId: "<id>" }]`.
Soft-deleted clients can be recovered with `restoreClients`; hard deletes cannot.

| List sites | `getClientSiteList(input: GetClientSiteListInput!)` (`clientId`, `listInfo`) |
| Create / update site | `createClientSite(input: CreateClientSiteInput!)` / `updateClientSite(input: UpdateClientSiteInput!)` |
| Delete sites | `deleteClientSites(input: [ClientSiteIdentifierInput!]!)` |
| List contacts | `getClientUserList(input: GetClientUserListInput!)` (`clientId`, `listInfo`) |
| Create / update contact | `createClientUser(input: CreateClientUserInput!)` / `updateClientUser(input: UpdateClientUserInput!)` |

The schema has no `createSite`, `getClientSites`, `updateSite`, `createRequester`,
`getClientRequesters` or `updateRequester`. The site and client-user operations
above replace them.

See [references/api.md](references/api.md) for the documents and variables.
Every example there validates against the schema.

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| Client not found | Invalid account ID | Verify client exists |
| Duplicate name | Client name exists | Use unique name |
| Invalid email domain | Malformed domain | Check domain format |
| Permission denied | Insufficient access | Check user permissions |
| Rate limit exceeded | Over 800 req/min | Implement backoff |

### Validation Patterns

```javascript
// Validate client input
function validateClientInput(input) {
  const errors = [];

  if (!input.name || input.name.trim().length < 2) {
    errors.push('Client name must be at least 2 characters');
  }

  if (input.emailDomains) {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/;
    input.emailDomains.forEach(domain => {
      if (!domainRegex.test(domain)) {
        errors.push(`Invalid email domain: ${domain}`);
      }
    });
  }

  return errors;
}
```

## Best Practices

1. **Use email domains** - Associate domains for automatic ticket routing
2. **Set primary contacts** - Ensure each client has a main contact
3. **Organize with sites** - Multi-location clients need site structure
4. **Track custom fields** - Use for contract info, billing codes
5. **Use soft delete first** - Allows recovery if needed
6. **Assign account managers** - Clear ownership for client relationships

## Related Skills

- [SuperOps.ai Tickets](../tickets/SKILL.md) - Client tickets
- [SuperOps.ai Assets](../assets/SKILL.md) - Client assets
- [SuperOps.ai Alerts](../alerts/SKILL.md) - Client alerts
- [SuperOps.ai API Patterns](../api-patterns/SKILL.md) - GraphQL patterns
