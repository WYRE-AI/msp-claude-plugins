# Hudu Articles API Reference

## List Articles

```http
GET /api/v1/articles
x-api-key: YOUR_API_KEY
Content-Type: application/json
```

**By Company:**
```http
GET /api/v1/articles?company_id=123
```

**By Name:**
```http
GET /api/v1/articles?name=backup
```

**With Pagination:**
```http
GET /api/v1/articles?company_id=123&page=1
```

## Get Single Article

```http
GET /api/v1/articles/456
x-api-key: YOUR_API_KEY
```

**Response:**
```json
{
  "article": {
    "id": 456,
    "name": "Backup Procedure - Daily Operations",
    "content": "<h1>Backup Procedure</h1><h2>Overview</h2><p>The daily backup runs at 10PM...</p>",
    "company_id": 123,
    "company_name": "Acme Corporation",
    "folder_id": 15,
    "folder_name": "Procedures",
    "draft": false,
    "slug": "backup-procedure-daily-operations",
    "created_at": "2024-06-15T10:30:00.000Z",
    "updated_at": "2025-12-01T14:22:00.000Z",
    "url": "https://your-company.huducloud.com/a/backup-procedure-daily-operations-abcdef"
  }
}
```

## Create Article

```http
POST /api/v1/articles
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

**Company-specific article:**
```json
{
  "article": {
    "name": "New User Setup Procedure",
    "company_id": 123,
    "folder_id": 20,
    "content": "<h1>New User Setup Procedure</h1><h2>Overview</h2><p>This procedure covers setting up a new user account for Acme Corporation.</p><h2>Prerequisites</h2><ul><li>Active Directory access</li><li>Microsoft 365 admin access</li></ul><h2>Steps</h2><ol><li>Create AD account with naming convention: first.last</li><li>Assign Microsoft 365 E3 license</li><li>Configure email signature using company template</li><li>Add to appropriate security groups</li></ol>"
  }
}
```

**Global article (no company_id):**
```json
{
  "article": {
    "name": "Standard Password Policy",
    "content": "<h1>Standard Password Policy</h1><p>All managed client accounts must follow these requirements...</p><ul><li>Minimum 14 characters</li><li>Must include uppercase, lowercase, numbers, and symbols</li><li>Rotate every 90 days</li></ul>"
  }
}
```

## Update Article

```http
PUT /api/v1/articles/456
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

```json
{
  "article": {
    "content": "<h1>Backup Procedure - Updated</h1><p>Updated backup schedule...</p>",
    "draft": false
  }
}
```

## Delete Article

```http
DELETE /api/v1/articles/456
x-api-key: YOUR_API_KEY
```

## Archive Article

```http
PUT /api/v1/articles/456/archive
x-api-key: YOUR_API_KEY
```

## Folder Management

### List Folders

```http
GET /api/v1/folders
x-api-key: YOUR_API_KEY
```

**By Company:**
```http
GET /api/v1/folders?company_id=123
```

### Create Folder

```http
POST /api/v1/folders
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

```json
{
  "folder": {
    "name": "Procedures",
    "company_id": 123,
    "parent_folder_id": null,
    "description": "Standard operating procedures for Acme Corporation"
  }
}
```

### Nested Folders

```json
{
  "folder": {
    "name": "Disaster Recovery",
    "company_id": 123,
    "parent_folder_id": 15,
    "description": "DR plans and procedures"
  }
}
```
