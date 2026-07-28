# Datto RMM Variable API Reference

## List Account Variables

```http
GET /api/v2/account/variables
Authorization: Bearer {token}
```

**Response:**
```json
{
  "variables": [
    {
      "id": 1,
      "name": "BACKUP_PATH",
      "value": "D:\\Backups",
      "description": "Default backup destination",
      "scope": "account",
      "createdAt": 1680000000000,
      "modifiedAt": 1707991200000
    },
    {
      "id": 2,
      "name": "ADMIN_EMAIL",
      "value": "alerts@msp.com",
      "scope": "account"
    }
  ]
}
```

## List Site Variables

```http
GET /api/v2/site/{siteUid}/variables
Authorization: Bearer {token}
```

**Response:**
```json
{
  "variables": [
    {
      "id": 101,
      "name": "BACKUP_PATH",
      "value": "E:\\ClientBackups",
      "description": "Client-specific backup path",
      "scope": "site",
      "siteUid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    },
    {
      "id": 102,
      "name": "CLIENT_CODE",
      "value": "ACME",
      "scope": "site",
      "siteUid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    }
  ]
}
```

## Create Account Variable

```http
POST /api/v2/account/variables
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "NEW_VARIABLE",
  "value": "variable_value",
  "description": "Description of the variable"
}
```

## Create Site Variable

```http
POST /api/v2/site/{siteUid}/variables
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "SITE_SPECIFIC_VAR",
  "value": "site_value",
  "description": "Site-specific configuration"
}
```

## Update Variable

```http
PUT /api/v2/account/variable/{variableId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "value": "updated_value",
  "description": "Updated description"
}
```

For site variables:
```http
PUT /api/v2/site/{siteUid}/variable/{variableId}
```

## Delete Variable

```http
DELETE /api/v2/account/variable/{variableId}
Authorization: Bearer {token}
```

For site variables:
```http
DELETE /api/v2/site/{siteUid}/variable/{variableId}
```
