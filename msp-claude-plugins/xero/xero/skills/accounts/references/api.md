# Xero Accounts API Reference

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/Accounts` | GET | List all accounts (not paginated) |
| `/Accounts` | POST | Create an account |
| `/Accounts/{AccountID}` | GET | Get single account |
| `/Accounts/{AccountID}` | POST | Update an account |
| `/Accounts/{AccountID}` | DELETE | Delete an account |
| `/Accounts/{AccountID}/Attachments` | GET | List account attachments |

## List All Accounts

```bash
curl -s -X GET "https://api.xero.com/api.xro/2.0/Accounts" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

**With Filters:**

```bash
# Revenue accounts only
curl -s -X GET "https://api.xero.com/api.xro/2.0/Accounts?where=Class==%22REVENUE%22" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Bank accounts only
curl -s -X GET "https://api.xero.com/api.xro/2.0/Accounts?where=Type==%22BANK%22" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Active accounts only
curl -s -X GET "https://api.xero.com/api.xro/2.0/Accounts?where=Status==%22ACTIVE%22" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Expense accounts
curl -s -X GET "https://api.xero.com/api.xro/2.0/Accounts?where=Class==%22EXPENSE%22" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

## Get Single Account

```bash
curl -s -X GET "https://api.xero.com/api.xro/2.0/Accounts/${ACCOUNT_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

## Create Account

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Accounts" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "Code": "245",
    "Name": "Cloud Services Revenue",
    "Type": "REVENUE",
    "Description": "Revenue from cloud hosting and Azure/AWS resale",
    "TaxType": "OUTPUT"
  }'
```

## Update Account

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Accounts/${ACCOUNT_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "AccountID": "'${ACCOUNT_ID}'",
    "Name": "Cloud & Hosting Revenue",
    "Description": "Revenue from cloud hosting, Azure, AWS, and SaaS resale"
  }'
```

## Archive Account

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Accounts/${ACCOUNT_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "AccountID": "'${ACCOUNT_ID}'",
    "Status": "ARCHIVED"
  }'
```

## Delete Account

```bash
curl -s -X DELETE "https://api.xero.com/api.xro/2.0/Accounts/${ACCOUNT_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}"
```

**Note:** Accounts with transactions cannot be deleted. Archive them instead.
