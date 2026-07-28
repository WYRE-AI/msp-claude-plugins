# ConnectWise Automate API - Client Examples

## Pagination Loop

```javascript
async function fetchAllComputers(token, baseUrl) {
  const allComputers = [];
  let page = 1;
  const pageSize = 250;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await fetch(
      `${baseUrl}/Computers?page=${page}&pageSize=${pageSize}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    // Get pagination info from headers
    totalPages = parseInt(response.headers.get('X-Total-Pages') || '1');

    const computers = await response.json();
    allComputers.push(...computers);

    page++;

    // Respect rate limits
    if (page <= totalPages) {
      await sleep(100);
    }
  }

  return allComputers;
}
```

## Retry with Backoff

```javascript
async function requestWithRetry(url, options, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 60;
      console.log(`Rate limited. Waiting ${retryAfter}s...`);
      await sleep(retryAfter * 1000);
      continue;
    }

    if (!response.ok && response.status >= 500) {
      // Server error - retry with backoff
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await sleep(delay);
      continue;
    }

    return response;
  }

  throw new Error('Max retries exceeded');
}
```

## Complete API Client

Uses `requestWithRetry` above and `handleApiResponse` from
[references/errors.md](errors.md).

```javascript
class ConnectWiseAutomateClient {
  constructor(server, username, password) {
    this.baseUrl = `https://${server}/cwa/api/v1`;
    this.username = username;
    this.password = password;
    this.token = null;
    this.tokenExpiry = 0;
  }

  async authenticate() {
    const response = await fetch(`${this.baseUrl}/APICredentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Username: this.username,
        Password: this.password
      })
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    const data = await response.json();
    this.token = data.AccessToken;
    this.tokenExpiry = Date.now() + (data.ExpiresIn * 1000);

    return this.token;
  }

  async ensureToken() {
    // Refresh token 5 minutes before expiry
    if (!this.token || Date.now() > this.tokenExpiry - 300000) {
      await this.authenticate();
    }
    return this.token;
  }

  async request(endpoint, options = {}) {
    const token = await this.ensureToken();

    const response = await requestWithRetry(
      `${this.baseUrl}${endpoint}`,
      {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      }
    );

    return handleApiResponse(response);
  }

  // Convenience methods
  async getComputers(condition = null) {
    let url = '/Computers?pageSize=250';
    if (condition) {
      url += `&condition=${encodeURIComponent(condition)}`;
    }
    return this.request(url);
  }

  async getComputer(id) {
    return this.request(`/Computers/${id}`);
  }

  async getClients(condition = null) {
    let url = '/Clients?pageSize=250';
    if (condition) {
      url += `&condition=${encodeURIComponent(condition)}`;
    }
    return this.request(url);
  }

  async getAlerts(condition = null) {
    let url = '/Alerts?pageSize=100';
    if (condition) {
      url += `&condition=${encodeURIComponent(condition)}`;
    }
    return this.request(url);
  }

  async runScript(computerId, scriptId, params = {}) {
    return this.request(
      `/Computers/${computerId}/Scripts/${scriptId}/Execute`,
      {
        method: 'POST',
        body: JSON.stringify({ Parameters: params })
      }
    );
  }
}
```
