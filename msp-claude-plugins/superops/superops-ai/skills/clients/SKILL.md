---
name: "SuperOps Clients"
description: >
  Use this skill when working with SuperOps.ai clients - creating, updating,
  searching, and managing client accounts. Covers client fields, sites,
  contacts, custom fields, and client lifecycle management.
  Essential for MSP account management through SuperOps.ai PSA.
when_to_use: >-
  When creating, updating, searching, and managing client accounts. Use when: superops client,
  client management, create client superops, update client, client site, client contact, account
  management, client custom fields, delete client, or client lifecycle.
---

# SuperOps.ai Client Management

## Overview

Clients (also called Accounts) are the foundation of SuperOps.ai's PSA. Every ticket, asset, and service is associated with a client. This skill covers client CRUD operations, site management, contact handling, and custom field configuration.

## Client Stage Values

| Stage | Description |
|-------|-------------|
| **Lead** | Prospective client |
| **Prospect** | Qualified lead |
| **Customer** | Active paying client |
| **Churned** | Former client |

## Client Status Values

| Status | Description |
|--------|-------------|
| **Active** | Current client |
| **Inactive** | Temporarily suspended |
| **Archived** | No longer serviced |

## Key Client Fields

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `accountId` | ID | System | Unique identifier |
| `name` | String | Yes | Client/company name |
| `stage` | Enum | No | Lead, Prospect, Customer, Churned |
| `status` | Enum | No | Active, Inactive, Archived |
| `emailDomains` | [String] | No | Associated email domains |
| `website` | String | No | Company website |
| `phone` | String | No | Primary phone number |

### Business Fields

| Field | Type | Description |
|-------|------|-------------|
| `industry` | String | Industry type |
| `employeeCount` | Int | Number of employees |
| `annualRevenue` | Decimal | Annual revenue |
| `accountManager` | Technician | Assigned account manager |
| `primaryContact` | Contact | Main point of contact |

### Address Fields

| Field | Type | Description |
|-------|------|-------------|
| `address` | String | Street address |
| `city` | String | City |
| `state` | String | State/province |
| `country` | String | Country |
| `postalCode` | String | ZIP/postal code |

## GraphQL Operations

### Create a Client

```graphql
mutation createClientV2($input: CreateClientInputV2!) {
  createClientV2(input: $input) {
    accountId
    name
    stage
    status
    emailDomains
    createdTime
  }
}
```

**Variables:**
```json
{
  "input": {
    "name": "Acme Corporation",
    "stage": "Customer",
    "status": "Active",
    "emailDomains": ["acme.com", "acmecorp.com"],
    "website": "https://www.acme.com",
    "phone": "+1-555-123-4567",
    "industry": "Technology",
    "employeeCount": 150,
    "address": {
      "street": "123 Main Street",
      "city": "San Francisco",
      "state": "CA",
      "country": "USA",
      "postalCode": "94102"
    },
    "accountManager": {
      "email": "sarah.tech@msp.com"
    }
  }
}
```

### List Clients

```graphql
query getClientList($input: ListInfoInput!) {
  getClientList(input: $input) {
    clients {
      accountId
      name
      stage
      status
      emailDomains
      phone
      website
      industry
      employeeCount
      accountManager {
        id
        name
        email
      }
      primaryContact {
        id
        name
        email
      }
      createdTime
      lastUpdatedTime
    }
    listInfo {
      totalCount
      hasNextPage
      endCursor
    }
  }
}
```

**Variables - Active Customers:**
```json
{
  "input": {
    "first": 50,
    "filter": {
      "stage": "Customer",
      "status": "Active"
    },
    "orderBy": {
      "field": "name",
      "direction": "ASC"
    }
  }
}
```

**Variables - Search by Name:**
```json
{
  "input": {
    "first": 20,
    "filter": {
      "name": {
        "contains": "Acme"
      }
    }
  }
}
```

### Get Single Client

```graphql
query getClient($input: ClientIdentifierInput!) {
  getClient(input: $input) {
    accountId
    name
    stage
    status
    emailDomains
    website
    phone
    industry
    employeeCount
    annualRevenue
    address {
      street
      city
      state
      country
      postalCode
    }
    accountManager {
      id
      name
      email
      phone
    }
    primaryContact {
      id
      name
      email
      phone
    }
    sites {
      id
      name
      address
      isDefault
    }
    customFields {
      name
      value
    }
    createdTime
    lastUpdatedTime
  }
}
```

**Variables:**
```json
{
  "input": {
    "accountId": "client-uuid-here"
  }
}
```

### Update a Client

```graphql
mutation updateClient($input: UpdateClientInput!) {
  updateClient(input: $input) {
    accountId
    name
    stage
    status
    lastUpdatedTime
  }
}
```

**Variables:**
```json
{
  "input": {
    "accountId": "client-uuid",
    "stage": "Customer",
    "status": "Active",
    "accountManager": {
      "id": "tech-uuid"
    },
    "customFields": [
      {
        "name": "Contract Type",
        "value": "Managed Services"
      },
      {
        "name": "Monthly Retainer",
        "value": "5000"
      }
    ]
  }
}
```

### Delete Clients

**Soft Delete (Recoverable):**
```graphql
mutation softDeleteClients($input: DeleteClientsInput!) {
  softDeleteClients(input: $input)
}
```

**Hard Delete (Permanent):**
```graphql
mutation hardDeleteClients($input: DeleteClientsInput!) {
  hardDeleteClients(input: $input)
}
```

**Restore Deleted Clients:**
```graphql
mutation restoreClients($input: RestoreClientsInput!) {
  restoreClients(input: $input)
}
```

**Variables:**
```json
{
  "input": {
    "accountIds": ["client-uuid-1", "client-uuid-2"]
  }
}
```

## Site Management

### Create a Site

```graphql
mutation createSite($input: CreateSiteInput!) {
  createSite(input: $input) {
    id
    name
    address {
      street
      city
      state
      country
      postalCode
    }
    isDefault
    client {
      accountId
      name
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "clientId": "client-uuid",
    "name": "San Francisco Office",
    "address": {
      "street": "456 Market Street",
      "city": "San Francisco",
      "state": "CA",
      "country": "USA",
      "postalCode": "94103"
    },
    "isDefault": false,
    "phone": "+1-555-234-5678",
    "timezone": "America/Los_Angeles"
  }
}
```

### List Client Sites

```graphql
query getClientSites($input: ClientSitesInput!) {
  getClientSites(input: $input) {
    sites {
      id
      name
      address {
        street
        city
        state
        country
        postalCode
      }
      phone
      timezone
      isDefault
      assetCount
      contactCount
    }
    listInfo {
      totalCount
    }
  }
}
```

### Update a Site

```graphql
mutation updateSite($input: UpdateSiteInput!) {
  updateSite(input: $input) {
    id
    name
    isDefault
    lastUpdatedTime
  }
}
```

## Contact Management

### Create a Contact (Requester)

```graphql
mutation createRequester($input: CreateRequesterInput!) {
  createRequester(input: $input) {
    id
    firstName
    lastName
    email
    phone
    title
    client {
      accountId
      name
    }
    site {
      id
      name
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "clientId": "client-uuid",
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@acme.com",
    "phone": "+1-555-345-6789",
    "title": "IT Manager",
    "siteId": "site-uuid",
    "isPrimaryContact": true
  }
}
```

### List Client Contacts

```graphql
query getClientRequesters($input: ClientRequestersInput!) {
  getClientRequesters(input: $input) {
    requesters {
      id
      firstName
      lastName
      email
      phone
      title
      site {
        id
        name
      }
      isPrimaryContact
      isVIP
    }
    listInfo {
      totalCount
      hasNextPage
    }
  }
}
```

### Update a Contact

```graphql
mutation updateRequester($input: UpdateRequesterInput!) {
  updateRequester(input: $input) {
    id
    firstName
    lastName
    email
    phone
    lastUpdatedTime
  }
}
```

## Common Workflows

### Client Onboarding

1. **Create client:**
```graphql
mutation onboardClient($client: CreateClientInputV2!, $site: CreateSiteInput!, $contact: CreateRequesterInput!) {
  createClientV2(input: $client) {
    accountId
    name
  }
}
```

Then create site and primary contact.

2. **Set up default site** with address
3. **Create primary contact** as main point of contact
4. **Configure custom fields** for billing, contracts
5. **Assign account manager**

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

## Error Handling

### Common Errors

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
5. **Maintain accurate data** - Keep contact info current
6. **Use soft delete first** - Allows recovery if needed
7. **Assign account managers** - Clear ownership for client relationships

## Related Skills

- [SuperOps.ai Tickets](../tickets/SKILL.md) - Client tickets
- [SuperOps.ai Assets](../assets/SKILL.md) - Client assets
- [SuperOps.ai Alerts](../alerts/SKILL.md) - Client alerts
- [SuperOps.ai API Patterns](../api-patterns/SKILL.md) - GraphQL patterns
