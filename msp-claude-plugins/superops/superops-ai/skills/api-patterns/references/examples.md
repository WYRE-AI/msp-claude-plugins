# SuperOps.ai GraphQL Client Implementation Examples

## Pagination Response Body

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

## Complete Pagination Implementation

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

## Retry Strategy

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

## Error Handling Pattern

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

## Relative Date Calculation

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

## Field Selection: Request Only Needed Fields

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

## Use Variables

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

## Batch Related Queries

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

## Cache Reference Data

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
