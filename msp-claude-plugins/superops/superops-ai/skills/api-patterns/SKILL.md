---
name: "SuperOps API Patterns"
description: >
  Use this skill when working with the SuperOps.ai GraphQL API - authentication,
  query building, mutations, pagination, rate limiting, and error handling.
  Covers Bearer token auth, cursor pagination, variable usage, and best practices
  for GraphQL integration with SuperOps.ai.
when_to_use: >-
  When working with authentication, query building, mutations, pagination, rate limiting, and
  error handling in the SuperOps.ai GraphQL API. Use when: superops api, superops graphql,
  superops authentication, graphql query, graphql mutation, superops pagination, api rate limit
  superops, superops bearer token, or api error superops.
---

# SuperOps.ai API Patterns

## Overview

SuperOps.ai uses a GraphQL API for all integrations. Unlike REST APIs, GraphQL allows you to request exactly the data you need in a single request. This skill covers authentication, query patterns, mutations, pagination, rate limiting, and error handling.

## Authentication

### Bearer Token Authentication

SuperOps.ai uses Bearer token authentication. You need:

1. **API Token** - Generated from your profile settings
2. **Customer Subdomain** - Your SuperOps.ai subdomain

### Required Headers

```http
POST /msp
Content-Type: application/json
Authorization: Bearer YOUR_API_TOKEN
CustomerSubDomain: yourcompany
```

### Generating an API Token

1. Log in to SuperOps.ai
2. Click settings icon > "My Profile"
3. Navigate to "API token" tab
4. Click "Generate token"
5. Copy and securely store the token

**Note:** You can only have one active API token. Regenerating creates a new token and invalidates the old one.

### Environment Variables

```bash
export SUPEROPS_API_KEY="your-api-token"
export SUPEROPS_SUBDOMAIN="yourcompany"
export SUPEROPS_REGION="us"  # or "eu"
```

## API Endpoints

SuperOps.ai provides region-specific endpoints:

| Platform | Region | Endpoint |
|----------|--------|----------|
| MSP | US | `https://api.superops.ai/msp` |
| MSP | EU | `https://euapi.superops.ai/msp` |
| IT | US | `https://api.superops.ai/it` |
| IT | EU | `https://euapi.superops.ai/it` |

## GraphQL Request Format

### Basic Structure

```json
{
  "query": "query or mutation string",
  "variables": {
    "variableName": "value"
  }
}
```

### Query Example

```graphql
query getClientList($input: ListInfoInput!) {
  getClientList(input: $input) {
    clients {
      accountId
      name
      status
    }
    listInfo {
      totalCount
      hasNextPage
      endCursor
    }
  }
}
```

Variables:
```json
{
  "input": {
    "first": 50,
    "filter": {
      "status": "Active"
    }
  }
}
```

### Mutation Example

```graphql
mutation createTicket($input: CreateTicketInput!) {
  createTicket(input: $input) {
    ticketId
    ticketNumber
    subject
    status
  }
}
```

Variables:
```json
{
  "input": {
    "subject": "Issue with email",
    "client": {
      "accountId": "client-uuid"
    },
    "priority": "HIGH"
  }
}
```

## Cursor-Based Pagination

SuperOps.ai uses cursor-based pagination for large result sets.

### Pagination Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `first` | Int | Number of items to return (max 500) |
| `after` | String | Cursor for next page |
| `before` | String | Cursor for previous page |
| `last` | Int | Number of items from end |

### Pagination Response

```json
{
  "data": {
    "getAssetList": {
      "assets": [...],
      "listInfo": {
        "totalCount": 1250,
        "hasNextPage": true,
        "hasPreviousPage": false,
        "startCursor": "YXJyYXljb25uZWN0aW9uOjA=",
        "endCursor": "YXJyYXljb25uZWN0aW9uOjQ5"
      }
    }
  }
}
```

### Pagination Pattern

```graphql
query getAssetListPaginated($input: ListInfoInput!) {
  getAssetList(input: $input) {
    assets {
      assetId
      name
    }
    listInfo {
      totalCount
      hasNextPage
      endCursor
    }
  }
}
```

First page:
```json
{
  "input": {
    "first": 100
  }
}
```

Next page:
```json
{
  "input": {
    "first": 100,
    "after": "YXJyYXljb25uZWN0aW9uOjk5"
  }
}
```

### Complete Pagination Implementation

```javascript
async function fetchAllAssets(filter = {}) {
  const allAssets = [];
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    const variables = {
      input: {
        first: 100,
        filter,
        ...(cursor && { after: cursor })
      }
    };

    const response = await graphqlRequest(GET_ASSETS_QUERY, variables);
    const { assets, listInfo } = response.data.getAssetList;

    allAssets.push(...assets);
    hasNextPage = listInfo.hasNextPage;
    cursor = listInfo.endCursor;
  }

  return allAssets;
}
```

## Rate Limiting

### Rate Limit Details

- **Limit:** 800 requests per minute
- **Scope:** Per API token
- **Reset:** Rolling 60-second window

### Rate Limit Headers

```http
X-RateLimit-Limit: 800
X-RateLimit-Remaining: 742
X-RateLimit-Reset: 1708012345
```

### Rate Limit Response (HTTP 429)

```json
{
  "errors": [
    {
      "message": "Rate limit exceeded. Please retry after 30 seconds.",
      "extensions": {
        "code": "RATE_LIMITED",
        "retryAfter": 30
      }
    }
  ]
}
```

### Retry Strategy

```javascript
async function requestWithRetry(query, variables, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await graphqlRequest(query, variables);

      if (response.errors?.some(e => e.extensions?.code === 'RATE_LIMITED')) {
        const retryAfter = response.errors[0].extensions.retryAfter || 30;
        const jitter = Math.random() * 1000;
        await sleep(retryAfter * 1000 + jitter);
        continue;
      }

      return response;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      // Exponential backoff with jitter
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await sleep(delay);
    }
  }
}
```

## Query Filtering

### Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equals | `{ "status": "Active" }` |
| `ne` | Not equals | `{ "status": { "ne": "Closed" } }` |
| `in` | In array | `{ "status": ["Open", "In Progress"] }` |
| `contains` | Contains substring | `{ "name": { "contains": "Acme" } }` |
| `startsWith` | Starts with | `{ "name": { "startsWith": "A" } }` |
| `gt` | Greater than | `{ "createdTime": { "gt": "2024-01-01" } }` |
| `gte` | Greater than or equal | `{ "priority": { "gte": "HIGH" } }` |
| `lt` | Less than | `{ "createdTime": { "lt": "2024-02-01" } }` |
| `lte` | Less than or equal | `{ "count": { "lte": 10 } }` |

### Complex Filter Example

```json
{
  "input": {
    "filter": {
      "and": [
        { "status": ["Open", "In Progress"] },
        { "priority": { "in": ["Critical", "High"] } },
        {
          "or": [
            { "client": { "accountId": "client-1" } },
            { "client": { "accountId": "client-2" } }
          ]
        }
      ]
    }
  }
}
```

### Ordering Results

```json
{
  "input": {
    "orderBy": {
      "field": "createdTime",
      "direction": "DESC"
    }
  }
}
```

## Date/Time Handling

### Format Requirements

All dates and times must be in **UTC** with **ISO 8601** format:

```
2024-02-15T10:30:00Z
```

### Date Range Queries

```json
{
  "filter": {
    "createdTime": {
      "gte": "2024-02-01T00:00:00Z",
      "lte": "2024-02-29T23:59:59Z"
    }
  }
}
```

### Relative Date Calculation

```javascript
// Get tickets from last 7 days
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

const variables = {
  input: {
    filter: {
      createdTime: {
        gte: sevenDaysAgo.toISOString()
      }
    }
  }
};
```

## Error Handling

### GraphQL Error Response

```json
{
  "data": null,
  "errors": [
    {
      "message": "Client not found",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["getClient"],
      "extensions": {
        "code": "NOT_FOUND",
        "field": "accountId"
      }
    }
  ]
}
```

### Common Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `UNAUTHENTICATED` | Invalid/missing token | Check API token |
| `FORBIDDEN` | Insufficient permissions | Check user role |
| `NOT_FOUND` | Entity doesn't exist | Verify ID |
| `BAD_REQUEST` | Invalid input | Check query/variables |
| `RATE_LIMITED` | Too many requests | Implement backoff |
| `INTERNAL_ERROR` | Server error | Retry with backoff |

### Error Handling Pattern

```javascript
async function safeGraphQLRequest(query, variables) {
  try {
    const response = await graphqlRequest(query, variables);

    if (response.errors) {
      for (const error of response.errors) {
        switch (error.extensions?.code) {
          case 'UNAUTHENTICATED':
            throw new AuthenticationError(error.message);
          case 'FORBIDDEN':
            throw new PermissionError(error.message);
          case 'NOT_FOUND':
            throw new NotFoundError(error.message, error.path);
          case 'RATE_LIMITED':
            throw new RateLimitError(error.message, error.extensions.retryAfter);
          default:
            throw new APIError(error.message, error.extensions?.code);
        }
      }
    }

    return response.data;
  } catch (error) {
    // Handle network errors
    if (error.code === 'ECONNREFUSED') {
      throw new NetworkError('Unable to connect to SuperOps.ai API');
    }
    throw error;
  }
}
```

## Null Value Handling

In SuperOps.ai GraphQL:

- Empty values are represented as `null`
- Passing `null` as input can **reset** a field
- Use `undefined` (don't include field) to leave unchanged

```javascript
// This will CLEAR the assignee
{ "assignee": null }

// This will leave assignee unchanged
{ /* assignee field omitted */ }
```

## Request Best Practices

### 1. Request Only Needed Fields

```graphql
# Good - specific fields
query {
  getClientList(input: { first: 50 }) {
    clients {
      accountId
      name
      status
    }
  }
}

# Avoid - requesting everything
query {
  getClientList(input: { first: 50 }) {
    clients {
      accountId
      name
      status
      emailDomains
      website
      phone
      industry
      # ... many more fields
    }
  }
}
```

### 2. Use Variables

```graphql
# Good - reusable with variables
query getClient($id: ID!) {
  getClient(input: { accountId: $id }) {
    name
    status
  }
}

# Avoid - hardcoded values
query {
  getClient(input: { accountId: "abc123" }) {
    name
    status
  }
}
```

### 3. Batch Related Queries

```graphql
# Good - single request for related data
query getDashboard($clientId: ID!) {
  client: getClient(input: { accountId: $clientId }) {
    name
  }
  tickets: getTicketList(input: {
    filter: { client: { accountId: $clientId }, status: "Open" }
  }) {
    listInfo { totalCount }
  }
  assets: getAssetList(input: {
    filter: { client: { accountId: $clientId }, status: "Online" }
  }) {
    listInfo { totalCount }
  }
}
```

### 4. Cache Reference Data

```javascript
const cache = new Map();

async function getClientList() {
  const cacheKey = 'clients';
  const cached = cache.get(cacheKey);

  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const data = await fetchAllClients();
  cache.set(cacheKey, {
    data,
    expires: Date.now() + 5 * 60 * 1000 // 5 minutes
  });

  return data;
}
```

## Complete Client Example

```javascript
const SUPEROPS_API = process.env.SUPEROPS_REGION === 'eu'
  ? 'https://euapi.superops.ai/msp'
  : 'https://api.superops.ai/msp';

async function graphqlRequest(query, variables = {}) {
  const response = await fetch(SUPEROPS_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPEROPS_API_KEY}`,
      'CustomerSubDomain': process.env.SUPEROPS_SUBDOMAIN
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return response.json();
}

// Usage
const GET_TICKETS = `
  query getTicketList($input: ListInfoInput!) {
    getTicketList(input: $input) {
      tickets {
        ticketId
        ticketNumber
        subject
        status
        priority
      }
      listInfo {
        totalCount
        hasNextPage
      }
    }
  }
`;

const result = await graphqlRequest(GET_TICKETS, {
  input: {
    first: 50,
    filter: { status: ["Open", "In Progress"] }
  }
});
```

## Related Skills

- [SuperOps.ai Tickets](../tickets/SKILL.md) - Ticket operations
- [SuperOps.ai Assets](../assets/SKILL.md) - Asset queries
- [SuperOps.ai Clients](../clients/SKILL.md) - Client management
- [SuperOps.ai Alerts](../alerts/SKILL.md) - Alert operations
- [SuperOps.ai Runbooks](../runbooks/SKILL.md) - Script execution
