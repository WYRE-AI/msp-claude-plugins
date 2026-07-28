# Passwords API Reference

## List Passwords

```http
GET /passwords
x-api-key: YOUR_API_KEY
Content-Type: application/vnd.api+json
```

**By Organization:**
```http
GET /organizations/123/relationships/passwords
```

**With Filters:**
```http
GET /passwords?filter[organization-id]=123&filter[password-category-id]=456
```

## Get Single Password

```http
GET /passwords/789
x-api-key: YOUR_API_KEY
```

**With Includes:**
```http
GET /passwords/789?include=organization,password-category,password-folder
```

**Note:** The password field is returned only when explicitly retrieving a single password.

## Show Password Value

To retrieve the actual password value, you must request with the `show_password` parameter:

```http
GET /passwords/789?show_password=true
x-api-key: YOUR_API_KEY
```

**Security Note:** This action is logged in the IT Glue audit trail.

## Create Password

```http
POST /passwords
Content-Type: application/vnd.api+json
x-api-key: YOUR_API_KEY
```

```json
{
  "data": {
    "type": "passwords",
    "attributes": {
      "organization-id": 123456,
      "name": "Domain Admin - ACME",
      "username": "administrator@acme.local",
      "password": "SecureP@ssw0rd!",
      "url": "https://dc01.acme.local",
      "password-category-id": 12,
      "notes": "<p>Primary domain administrator account</p>"
    }
  }
}
```

## Update Password

```http
PATCH /passwords/789
Content-Type: application/vnd.api+json
x-api-key: YOUR_API_KEY
```

```json
{
  "data": {
    "type": "passwords",
    "attributes": {
      "password": "NewSecureP@ssw0rd!",
      "notes": "<p>Password updated on 2024-02-15</p>"
    }
  }
}
```

## Delete Password

```http
DELETE /passwords/789
x-api-key: YOUR_API_KEY
```

**Warning:** Consider archiving instead of deleting for audit purposes.

## Search Passwords

**By Name:**
```http
GET /passwords?filter[name]=Domain Admin
```

**By Category:**
```http
GET /passwords?filter[password-category-id]=12
```

**By Folder:**
```http
GET /passwords?filter[password-folder-id]=34
```

## Password Folders

### List Folders

```http
GET /password-folders
x-api-key: YOUR_API_KEY
```

**By Organization:**
```http
GET /organizations/123/relationships/password-folders
```

### Create Folder

```http
POST /password-folders
Content-Type: application/vnd.api+json
```

```json
{
  "data": {
    "type": "password-folders",
    "attributes": {
      "organization-id": 123456,
      "name": "Infrastructure",
      "parent-id": null
    }
  }
}
```

### Nested Folders

```json
{
  "data": {
    "type": "password-folders",
    "attributes": {
      "organization-id": 123456,
      "name": "Domain Controllers",
      "parent-id": 789
    }
  }
}
```

## Embedded Passwords

### In Documents

Passwords can be embedded in documents using IT Glue's embedded password syntax:

```html
<p>Login credentials:</p>
<div data-embedded-password-id="12345"></div>
```

### In Flexible Assets

Flexible asset types can include password fields that reference or store passwords directly.
