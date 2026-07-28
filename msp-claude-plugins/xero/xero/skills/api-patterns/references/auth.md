# Xero OAuth2 Authentication Reference

## OAuth2 Custom Connections

Xero uses OAuth2 with Custom Connections for machine-to-machine (M2M) integrations. This is the recommended approach for server-side automations and CLI tools.

**Token Request:**

```http
POST https://identity.xero.com/connect/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic base64(CLIENT_ID:CLIENT_SECRET)

grant_type=client_credentials&scope=accounting.transactions accounting.contacts accounting.reports.read accounting.settings
```

**curl Example:**

```bash
curl -s -X POST https://identity.xero.com/connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u "${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}" \
  -d "grant_type=client_credentials&scope=accounting.transactions accounting.contacts accounting.reports.read accounting.settings"
```

**Token Response:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI...",
  "expires_in": 1800,
  "token_type": "Bearer",
  "scope": "accounting.transactions accounting.contacts accounting.reports.read accounting.settings"
}
```

**Token Details:**

| Field | Value | Description |
|-------|-------|-------------|
| `access_token` | JWT string | Bearer token for API requests |
| `expires_in` | 1800 | Token lifetime in seconds (30 minutes) |
| `token_type` | Bearer | Token type for Authorization header |
| `scope` | Space-delimited | Granted OAuth scopes |

## Environment Variables

```bash
export XERO_CLIENT_ID="your-client-id"
export XERO_CLIENT_SECRET="your-client-secret"
export XERO_TENANT_ID="your-tenant-id"
```

## OAuth Scopes

| Scope | Description |
|-------|-------------|
| `accounting.transactions` | Read/write invoices, payments, credit notes, bank transactions |
| `accounting.transactions.read` | Read-only access to transactions |
| `accounting.contacts` | Read/write contacts |
| `accounting.contacts.read` | Read-only access to contacts |
| `accounting.reports.read` | Read financial reports |
| `accounting.settings` | Read/write chart of accounts, tax rates |
| `accounting.settings.read` | Read-only access to settings |

## Token Management Pattern

```javascript
class XeroAuth {
  constructor(clientId, clientSecret) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accessToken = null;
    this.expiresAt = 0;
  }

  async getToken() {
    if (this.accessToken && Date.now() < this.expiresAt - 60000) {
      return this.accessToken;
    }

    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`
    ).toString('base64');

    const response = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: 'grant_type=client_credentials&scope=accounting.transactions accounting.contacts accounting.reports.read accounting.settings'
    });

    const data = await response.json();
    this.accessToken = data.access_token;
    this.expiresAt = Date.now() + (data.expires_in * 1000);
    return this.accessToken;
  }
}
```
