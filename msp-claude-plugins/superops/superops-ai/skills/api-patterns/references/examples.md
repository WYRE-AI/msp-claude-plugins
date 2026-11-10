# SuperOps.ai GraphQL Client Implementation Examples

These examples are for code that calls the SuperOps API directly. Through
Conduit, use the typed `superops_*` tools, or `superops_custom_query` /
`superops_custom_mutation` for anything else. Every GraphQL document here
validates against `schema/superops.graphql` in
[superops-mcp](https://github.com/WYRE-AI/superops-mcp).

## Pagination Response Body

```json
{
  "data": {
    "getAssetList": {
      "assets": [...],
      "listInfo": {
        "page": 1,
        "pageSize": 100,
        "totalCount": 1250,
        "hasMore": true
      }
    }
  }
}
```

On the last page `hasMore` is `null`, not `false`.

## Complete Pagination Implementation

```javascript
const GET_ASSETS_QUERY = `
  query getAssetList($input: ListInfoInput!) {
    getAssetList(input: $input) {
      assets { assetId name status platform client }
      listInfo { page pageSize totalCount hasMore }
    }
  }
`;

async function fetchAllAssets(condition) {
  const allAssets = [];
  const pageSize = 100;

  for (let page = 1; ; page++) {
    const input = { page, pageSize, ...(condition && { condition }) };
    const response = await graphqlRequest(GET_ASSETS_QUERY, { input });
    const { assets, listInfo } = response.data.getAssetList;

    allAssets.push(...assets);
    // hasMore is true or null — never false.
    if (!listInfo.hasMore || allAssets.length >= listInfo.totalCount) break;
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

## Relative Date Windows

No date-range operator is documented. To get the tickets from the last seven
days, sort newest first, stop paging once rows fall before the window starts,
and filter the rows yourself:

```javascript
const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
const recent = [];

for (let page = 1; ; page++) {
  const { data } = await graphqlRequest(GET_TICKETS, {
    input: { page, pageSize: 100, sort: [{ attribute: 'createdTime', order: 'DESC' }] }
  });
  const { tickets, listInfo } = data.getTicketList;
  const inWindow = tickets.filter(t => Date.parse(t.createdTime) >= since);
  recent.push(...inWindow);
  if (inWindow.length < tickets.length || !listInfo.hasMore) break;
}
```

## Field Selection: Request Only Needed Fields

Select only the fields you use. Select `JSON` fields such as `accountManager` and
`hqSite` by name only.

```graphql
query clientNames {
  getClientList(input: { page: 1, pageSize: 50 }) {
    clients {
      accountId
      name
      status
    }
  }
}
```

## Use Variables

Pass values as variables, not as literals spliced into the query string:

```graphql
query getClient($input: ClientIdentifierInput!) {
  getClient(input: $input) {
    name
    status
  }
}
```

```json
{ "input": { "accountId": "<account id>" } }
```

## Batch Related Queries

One request with aliases beats several round-trips against the rate limit.
`client` is a flat filter attribute holding the account ID.

```graphql
query dashboard($clientId: ID!, $clientFilter: JSON) {
  client: getClient(input: { accountId: $clientId }) {
    name
  }
  openTickets: getTicketList(input: {
    pageSize: 1
    condition: {
      joinOperator: "AND"
      operands: [
        { attribute: "client", operator: "includes", value: $clientFilter }
        { attribute: "status", operator: "includes", value: ["Open"] }
      ]
    }
  }) {
    listInfo { totalCount }
  }
  onlineAssets: getAssetList(input: {
    pageSize: 1
    condition: {
      joinOperator: "AND"
      operands: [
        { attribute: "client", operator: "includes", value: $clientFilter }
        { attribute: "status", operator: "includes", value: ["ONLINE"] }
      ]
    }
  }) {
    listInfo { totalCount }
  }
}
```

```json
{ "clientId": "<account id>", "clientFilter": ["<account id>"] }
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

// Usage. ticketId must be selected: without it getTicketList returns an
// empty tickets array alongside a correct totalCount.
const GET_TICKETS = `
  query getTicketList($input: ListInfoInput!) {
    getTicketList(input: $input) {
      tickets {
        ticketId
        displayId
        subject
        status
        priority
        createdTime
      }
      listInfo {
        page
        pageSize
        totalCount
        hasMore
      }
    }
  }
`;

const result = await graphqlRequest(GET_TICKETS, {
  input: {
    page: 1,
    pageSize: 50,
    condition: { attribute: 'status', operator: 'includes', value: ['Open', 'On Hold'] }
  }
});
```
