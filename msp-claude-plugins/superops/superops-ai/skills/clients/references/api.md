# SuperOps.ai Client, Site and Contact Operations

Every GraphQL document on this page validates against `schema/superops.graphql`
in [superops-mcp](https://github.com/WYRE-AI/superops-mcp). Every operation except
`createClientV2` is also listed in the published API reference at
<https://developer.superops.com/msp>. The docs still list only the older
`createClient`, which the live schema marks deprecated in favour of
`createClientV2`.

Reads go through the typed tools where one exists. Everything else needs
`superops_custom_query` or `superops_custom_mutation`. Both are admin tier and need
a human approver who has seen the exact document and variables.

## Typed tools

| Tool | GraphQL it sends | Arguments |
|------|------------------|-----------|
| `superops_clients_list` | `getClientList(input: ListInfoInput!)` | `stage`, `status`, `page`, `pageSize` |
| `superops_clients_search` | `getClientList`, with `name` or `emailDomains` `contains` the term | `query`, `page`, `pageSize` |
| `superops_clients_get` | `getClient(input: { accountId })` | `accountId` |

```json
{ "tool": "superops_clients_search", "arguments": { "query": "acme" } }
```

## Fields

`Client` has these fields: `accountId`, `name`, `stage`, `status`,
`emailDomains`, `createdTime` and `updatedTime`. These fields are `JSON`:
`accountManager`, `primaryContact`, `secondaryContact`, `hqSite`,
`technicianGroups` and `customFields`. Select a JSON field by name with no
sub-selection. A client has no `website`, `phone`, `industry`, `address` or
`sites` field. Addresses belong to sites, which are listed below.

`stage` and `status` are tenant-configured strings. `status` depends on `stage`.
A stock tenant has these values:

| Stage | Statuses |
|-------|----------|
| Active | Paid, Unpaid |
| Prospect | New, Negotiation, Won, Lost |
| Inactive | (none) |

To read the tenant's own lists, send this query through `superops_custom_query`:

```graphql
query clientFields {
  getAllFields(input: "CLIENT") {
    columnName
    options { value }
    parentField { columnName }
  }
}
```

## Clients

### Create (custom mutation)

`createClientV2` requires `hqSite`, so the client and its headquarters site are
created together.

```graphql
mutation createClientV2($input: CreateClientInputV2!) {
  createClientV2(input: $input) {
    accountId
    name
    stage
    status
    emailDomains
    hqSite
  }
}
```

```json
{
  "input": {
    "name": "Acme Corporation",
    "stage": "Active",
    "status": "Paid",
    "emailDomains": ["acme.com"],
    "accountManager": { "userId": "<technician user id>" },
    "hqSite": {
      "name": "Head Office",
      "working24x7": true,
      "timezoneCode": "America/Los_Angeles",
      "line1": "123 Main Street",
      "city": "San Francisco",
      "postalCode": "94102",
      "countryCode": "US"
    }
  }
}
```

`working24x7` and `timezoneCode` are required. If the site has business hours,
set `working24x7: false` and pass `businessHour`. This is a list of
`{ day, start, end }`, where `day` is a `DayOfWeek` value such as `MONDAY`.

### Update (custom mutation)

```graphql
mutation updateClient($input: UpdateClientInput!) {
  updateClient(input: $input) {
    accountId
    name
    stage
    status
    accountManager
    primaryContact
    updatedTime
  }
}
```

```json
{
  "input": {
    "accountId": "<account id>",
    "stage": "Active",
    "status": "Paid",
    "accountManager": { "userId": "<technician user id>" },
    "primaryContact": { "userId": "<client user id>" }
  }
}
```

### Delete and restore (custom mutation)

All three take a list of `{ accountId }`, even for one client. A soft delete can
be reversed with `restoreClients`. A hard delete is permanent.

```graphql
mutation softDeleteClients($input: [ClientIdentifierInput!]!) {
  softDeleteClients(input: $input)
}
```

```graphql
mutation restoreClients($input: [ClientIdentifierInput!]!) {
  restoreClients(input: $input)
}
```

```graphql
mutation hardDeleteClients($input: [ClientIdentifierInput!]!) {
  hardDeleteClients(input: $input)
}
```

```json
{ "input": [{ "accountId": "<account id>" }] }
```

## Sites

### List a client's sites (custom query)

```graphql
query getClientSiteList($input: GetClientSiteListInput!) {
  getClientSiteList(input: $input) {
    sites {
      id
      name
      hq
      timezoneCode
      working24x7
      line1
      city
      stateCode
      postalCode
      countryCode
      contactNumber
    }
    listInfo {
      page
      pageSize
      totalCount
      hasMore
    }
  }
}
```

```json
{ "input": { "clientId": "<account id>", "listInfo": { "page": 1, "pageSize": 50 } } }
```

### Create a site (custom mutation)

```graphql
mutation createClientSite($input: CreateClientSiteInput!) {
  createClientSite(input: $input) {
    id
    name
    timezoneCode
    client
  }
}
```

```json
{
  "input": {
    "client": { "accountId": "<account id>" },
    "name": "San Francisco Office",
    "working24x7": true,
    "timezoneCode": "America/Los_Angeles",
    "line1": "456 Market Street",
    "city": "San Francisco",
    "postalCode": "94103",
    "countryCode": "US",
    "contactNumber": "+15552345678"
  }
}
```

### Update or delete a site (custom mutation)

```graphql
mutation updateClientSite($input: UpdateClientSiteInput!) {
  updateClientSite(input: $input) {
    id
    name
    hq
  }
}
```

```json
{ "input": { "id": "<site id>", "name": "SF Office (Market St)" } }
```

```graphql
mutation deleteClientSites($input: [ClientSiteIdentifierInput!]!) {
  deleteClientSites(input: $input)
}
```

## Contacts (client users)

SuperOps calls a client's contacts *client users*. Ticket inputs refer to them as
`requester: { userId }`.

### List a client's contacts (custom query)

```graphql
query getClientUserList($input: GetClientUserListInput!) {
  getClientUserList(input: $input) {
    userList {
      userId
      name
      email
      contactNumber
      role
    }
    listInfo {
      page
      pageSize
      totalCount
      hasMore
    }
  }
}
```

```json
{ "input": { "clientId": "<account id>", "listInfo": { "page": 1, "pageSize": 50 } } }
```

### Create a contact (custom mutation)

`role` is required. Read the requester role IDs first:

```graphql
query requesterRoles {
  getRequesterRoleList {
    roleId
    name
  }
}
```

```graphql
mutation createClientUser($input: CreateClientUserInput!) {
  createClientUser(input: $input) {
    userId
    name
    email
  }
}
```

```json
{
  "input": {
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@acme.com",
    "contactNumber": "+15553456789",
    "role": { "roleId": "<requester role id>" },
    "addAssociations": [
      { "client": { "accountId": "<account id>" }, "site": { "id": "<site id>" } }
    ]
  }
}
```

To make the contact the client's primary contact, follow up with `updateClient`
and set `primaryContact: { "userId": "<new user id>" }`.

### Update a contact (custom mutation)

```graphql
mutation updateClientUser($input: UpdateClientUserInput!) {
  updateClientUser(input: $input) {
    userId
    name
    email
    contactNumber
    updatedTime
  }
}
```

```json
{ "input": { "userId": "<client user id>", "contactNumber": "+15550001111" } }
```

## Workflow: onboarding

1. `createClientV2` creates the client and its HQ site in one call.
2. Use `createClientSite` for each additional location.
3. Use `createClientUser` for each contact, associated with the client and a site.
4. Call `updateClient` to set `primaryContact`, and `accountManager` if it was not
   set on create.

Each step is a separate `superops_custom_mutation` call, and each needs its own
approval.
