# QuickBooks Online Authentication Reference

## Environment Variables

```bash
export QBO_CLIENT_ID="your-client-id"
export QBO_CLIENT_SECRET="your-client-secret"
export QBO_REALM_ID="your-company-id"
export QBO_ACCESS_TOKEN="your-access-token"
export QBO_REFRESH_TOKEN="your-refresh-token"
export QBO_ENVIRONMENT="production"  # or "sandbox"
```

## Token Refresh Flow

```javascript
const OAuthClient = require('intuit-oauth');

const oauthClient = new OAuthClient({
  clientId: process.env.QBO_CLIENT_ID,
  clientSecret: process.env.QBO_CLIENT_SECRET,
  environment: process.env.QBO_ENVIRONMENT || 'production',
  redirectUri: 'http://localhost:3000/callback'
});

async function refreshAccessToken() {
  oauthClient.setToken({
    access_token: process.env.QBO_ACCESS_TOKEN,
    refresh_token: process.env.QBO_REFRESH_TOKEN,
    token_type: 'bearer'
  });

  const authResponse = await oauthClient.refresh();
  const newTokens = authResponse.getJson();

  // Store new tokens securely
  process.env.QBO_ACCESS_TOKEN = newTokens.access_token;
  process.env.QBO_REFRESH_TOKEN = newTokens.refresh_token;

  return newTokens;
}
```

## Using node-quickbooks SDK

The `node-quickbooks` SDK (61k weekly downloads) simplifies authentication and API calls:

```javascript
const QuickBooks = require('node-quickbooks');

const qbo = new QuickBooks(
  process.env.QBO_CLIENT_ID,
  process.env.QBO_CLIENT_SECRET,
  process.env.QBO_ACCESS_TOKEN,
  false, // no token secret (OAuth2)
  process.env.QBO_REALM_ID,
  process.env.QBO_ENVIRONMENT === 'sandbox',
  true,  // enable debug
  null,  // minor version (null = latest)
  '2.0', // OAuth version
  process.env.QBO_REFRESH_TOKEN
);
```
