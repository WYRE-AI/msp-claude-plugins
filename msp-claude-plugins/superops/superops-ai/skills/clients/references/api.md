# SuperOps.ai Client GraphQL Operations

Complete operation catalog for clients, sites, and contacts (requesters).

## Client Operations

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

## Client Onboarding Mutation Shape

```graphql
mutation onboardClient($client: CreateClientInputV2!, $site: CreateSiteInput!, $contact: CreateRequesterInput!) {
  createClientV2(input: $client) {
    accountId
    name
  }
}
```

Then create site and primary contact.
