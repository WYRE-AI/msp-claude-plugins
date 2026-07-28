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

## Key Concepts

**Stage** tracks the sales lifecycle; **status** tracks the service relationship. They are independent — a `Customer` can be `Inactive`.

| Stage | Description |
|-------|-------------|
| **Lead** | Prospective client |
| **Prospect** | Qualified lead |
| **Customer** | Active paying client |
| **Churned** | Former client |

| Status | Description |
|--------|-------------|
| **Active** | Current client |
| **Inactive** | Temporarily suspended |
| **Archived** | No longer serviced |

Most-used fields: `accountId` (system-generated), `name` (required), `stage`, `status`,
`emailDomains`, `accountManager`, `primaryContact`, `customFields`. A client owns
**sites** (physical locations) and **requesters** (contacts); requesters can be assigned
to a site.

See [references/fields.md](references/fields.md) for the complete field reference.

## Common Workflows

### Client Onboarding

1. **Create client** with `createClientV2` — name, stage, status, email domains
2. **Set up default site** with address
3. **Create primary contact** (`createRequester` with `isPrimaryContact: true`)
4. **Configure custom fields** for billing, contracts
5. **Assign account manager**

Ordering matters: the site must exist before a requester can be assigned to it via `siteId`.

### Client Search

```graphql
query searchClients($input: ListInfoInput!) {
  getClientList(input: $input) {
    clients {
      accountId
      name
      emailDomains
      status
    }
  }
}
```

Variables for fuzzy search:
```json
{
  "input": {
    "filter": {
      "or": [
        { "name": { "contains": "acme" } },
        { "emailDomains": { "contains": "acme.com" } }
      ]
    },
    "first": 10
  }
}
```

### Client Health Dashboard

Batch related counts into a single GraphQL request with aliases:

```graphql
query getClientHealth($clientId: ID!) {
  getClient(input: { accountId: $clientId }) {
    name
    status
  }
  getClientAssets: getAssetList(input: {
    filter: { client: { accountId: $clientId } }
  }) {
    listInfo { totalCount }
  }
  getClientTickets: getTicketList(input: {
    filter: {
      client: { accountId: $clientId },
      status: ["Open", "In Progress"]
    }
  }) {
    listInfo { totalCount }
  }
  getClientAlerts: getAlertList(input: {
    filter: {
      client: { accountId: $clientId },
      status: "Active"
    }
  }) {
    listInfo { totalCount }
  }
}
```

## API Patterns

| Operation | GraphQL |
|-----------|---------|
| Create client | `createClientV2(input: CreateClientInputV2!)` |
| List clients | `getClientList(input: ListInfoInput!)` |
| Get client | `getClient(input: ClientIdentifierInput!)` |
| Update client | `updateClient(input: UpdateClientInput!)` |
| Soft delete | `softDeleteClients(input: DeleteClientsInput!)` |
| Hard delete | `hardDeleteClients(input: DeleteClientsInput!)` |
| Restore | `restoreClients(input: RestoreClientsInput!)` |
| Create site | `createSite(input: CreateSiteInput!)` |
| List sites | `getClientSites(input: ClientSitesInput!)` |
| Update site | `updateSite(input: UpdateSiteInput!)` |
| Create contact | `createRequester(input: CreateRequesterInput!)` |
| List contacts | `getClientRequesters(input: ClientRequestersInput!)` |
| Update contact | `updateRequester(input: UpdateRequesterInput!)` |

Note the `V2` suffix on client creation — `createClientV2` is the current mutation, while
update/delete have no version suffix. Deletes take an array (`accountIds`), even for one
client. Soft-deleted clients can be recovered with `restoreClients`; hard deletes cannot.

See [references/api.md](references/api.md) for the complete operation catalog with
request/response examples.

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

  if (input.website && !input.website.startsWith('http')) {
    errors.push('Website must be a valid URL');
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
