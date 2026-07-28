# HaloPSA Authentication Reference

## Token Acquisition

**Token Endpoint:**
```
POST https://{base_url}/auth/token?tenant={tenant_name}
```

**Request:**
```bash
curl -X POST "https://yourcompany.halopsa.com/auth/token?tenant=yourcompany" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "scope=all"
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "all"
}
```

## Token Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `grant_type` | Yes | Must be `client_credentials` |
| `client_id` | Yes | Application Client ID |
| `client_secret` | Yes | Application Client Secret |
| `scope` | Yes | Permissions scope (use `all` or specific scopes) |
| `tenant` | Conditional | Required for cloud-hosted instances (query parameter) |

## Environment Configuration

```bash
# Required environment variables
export HALOPSA_CLIENT_ID="your-client-id"
export HALOPSA_CLIENT_SECRET="your-client-secret"
export HALOPSA_BASE_URL="https://yourcompany.halopsa.com"
export HALOPSA_TENANT="yourcompany"  # Leave empty for self-hosted
```

## Token Management

```javascript
class HaloPSAAuth {
  constructor(clientId, clientSecret, baseUrl, tenant) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseUrl = baseUrl;
    this.tenant = tenant;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    // Return cached token if still valid (with 5 min buffer)
    if (this.accessToken && this.tokenExpiry > Date.now() + 300000) {
      return this.accessToken;
    }

    const tokenUrl = this.tenant
      ? `${this.baseUrl}/auth/token?tenant=${this.tenant}`
      : `${this.baseUrl}/auth/token`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'all'
      })
    });

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);

    return this.accessToken;
  }
}
```

## Scopes and Permissions

When creating an API application, configure these permissions:

| Scope | Description |
|-------|-------------|
| `all` | Full access to all entities |
| `read:tickets` | Read ticket data |
| `edit:tickets` | Create/update tickets |
| `read:customers` | Read client data |
| `edit:customers` | Create/update clients |
| `read:assets` | Read asset data |
| `edit:assets` | Create/update assets |

### Minimum Recommended Permissions

For typical MSP operations:
- View Customers
- View Support Tickets
- Add Time Entries
- Create Support Tickets
- View Assets
