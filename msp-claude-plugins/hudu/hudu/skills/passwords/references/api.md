# Hudu Asset Passwords API Reference

## List Passwords

```http
GET /api/v1/asset_passwords
x-api-key: YOUR_API_KEY
Content-Type: application/json
```

**By Company:**
```http
GET /api/v1/asset_passwords?company_id=123
```

**By Name:**
```http
GET /api/v1/asset_passwords?name=Domain Admin
```

**With Pagination:**
```http
GET /api/v1/asset_passwords?company_id=123&page=1
```

**Combined:**
```http
GET /api/v1/asset_passwords?company_id=123&name=admin
GET /api/v1/asset_passwords?company_id=123&name=firewall
```

## Get Single Password

```http
GET /api/v1/asset_passwords/789
x-api-key: YOUR_API_KEY
```

**Response:**
```json
{
  "asset_password": {
    "id": 789,
    "company_id": 123,
    "company_name": "Acme Corporation",
    "name": "Domain Admin - ACME",
    "username": "administrator@acme.local",
    "password": "SecureP@ssw0rd123!",
    "url": "https://dc01.acme.local",
    "description": "Primary domain administrator account.\nUse for:\n- Domain controller management\n- Group Policy changes\n- AD user management",
    "password_type": "Administrative",
    "password_folder_id": 45,
    "password_folder_name": "Infrastructure",
    "otp_secret": null,
    "slug": "domain-admin-acme",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2025-11-15T14:22:00.000Z",
    "url": "https://your-company.huducloud.com/passwords/789"
  }
}
```

The password value is returned in plaintext in this response. See the output-safety rules in SKILL.md.

## Create Password

```http
POST /api/v1/asset_passwords
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

```json
{
  "asset_password": {
    "company_id": 123,
    "name": "Domain Admin - ACME",
    "username": "administrator@acme.local",
    "password": "SecureP@ssw0rd123!",
    "url": "https://dc01.acme.local",
    "description": "Primary domain administrator account",
    "password_type": "Administrative",
    "password_folder_id": 45
  }
}
```

## Update Password

```http
PUT /api/v1/asset_passwords/789
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

```json
{
  "asset_password": {
    "password": "NewSecureP@ssw0rd456!",
    "description": "Password rotated on 2026-02-15. Previous rotation: 2025-11-15."
  }
}
```

## Delete Password

```http
DELETE /api/v1/asset_passwords/789
x-api-key: YOUR_API_KEY
```

Deletion requires DELETE permission on the API key. Prefer keeping passwords for audit purposes.

## Audit Logging

```http
GET /api/v1/activity_logs?resource_type=AssetPassword&resource_id=789
```
