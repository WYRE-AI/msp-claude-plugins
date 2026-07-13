---
name: "Hudu Articles"
description: >
  Use this skill when working with Hudu articles (knowledge base) -
  creating, searching, updating, and managing documentation articles.
  Covers article folders, drafts, sharing, content format (HTML),
  versioning, and search patterns for comprehensive knowledge management.
when_to_use: >-
  When creating, searching, updating, and managing documentation articles. Use when: hudu article,
  hudu knowledge base, hudu kb, hudu documentation, hudu runbook, hudu procedure, knowledge base
  article, article management, or hudu docs.
---

# Hudu Articles Management

## Overview

Articles in Hudu serve as the knowledge base, providing a place for runbooks, procedures, network diagrams, SOPs, and general documentation. Articles support rich HTML content, can be organized into folders, and can be scoped to specific companies or kept as global (shared across all companies). MSP technicians rely on articles to quickly find procedures and reference documentation during troubleshooting.

## Key Concepts

### Article Scope

Articles can be scoped in two ways:

| Scope | Description | Use Case |
|-------|-------------|---------|
| Company-specific | Tied to a single company | Network diagram for Acme Corp |
| Global | Available across all companies | Standard new user setup procedure |

### Article Folders

Folders organize articles within a company or globally:

```
Company: Acme Corporation
+-- Articles
    +-- Procedures
    |   +-- Backup Procedure
    |   +-- Disaster Recovery Plan
    +-- Network
    |   +-- Network Overview
    |   +-- IP Addressing Scheme
    +-- Onboarding
        +-- New User Setup
        +-- Hardware Deployment
```

### Article Content

Article content is stored as HTML. Hudu's editor supports:

- Headings, paragraphs, lists
- Tables
- Images (inline and uploaded)
- Code blocks
- Embedded passwords (referenced by ID)
- Links to other Hudu resources

### Draft vs Published

Articles can be saved as drafts before publishing:

| State | Description |
|-------|-------------|
| Draft | Work in progress, not visible to all users |
| Published | Visible to users with appropriate permissions |

## Field Reference

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | System | Auto-generated unique identifier |
| `company_id` | integer | No | Parent company (null for global articles) |
| `name` | string | Yes | Article title |
| `content` | string | No | Rich HTML content |
| `folder_id` | integer | No | Folder location |
| `draft` | boolean | No | Whether article is a draft |
| `slug` | string | System | URL-friendly identifier |

### Relationship Fields

| Field | Type | Description |
|-------|------|-------------|
| `company_name` | string | Parent company name (read-only) |
| `folder_name` | string | Folder name (read-only) |

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |
| `url` | string | Full URL to article in Hudu |
| `object_type` | string | Always "Article" |

## API Patterns

### List Articles

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

### Get Single Article

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

### Create Article

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

### Update Article

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

### Delete Article

```http
DELETE /api/v1/articles/456
x-api-key: YOUR_API_KEY
```

### Archive Article

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

## Common Workflows

### Create Comprehensive Runbook

```javascript
async function createRunbook(companyId, runbookData) {
  // Ensure folder exists
  const folder = await ensureFolder(companyId, runbookData.folderPath);

  // Build content
  let content = `<h1>${runbookData.title}</h1>`;
  content += `<h2>Overview</h2><p>${runbookData.overview}</p>`;

  if (runbookData.prerequisites?.length) {
    content += `<h2>Prerequisites</h2><ul>`;
    content += runbookData.prerequisites.map(p => `<li>${p}</li>`).join('');
    content += `</ul>`;
  }

  if (runbookData.steps?.length) {
    content += `<h2>Procedure</h2><ol>`;
    content += runbookData.steps.map(s => `<li>${s}</li>`).join('');
    content += `</ol>`;
  }

  // Create the article
  return await createArticle({
    name: runbookData.title,
    company_id: companyId,
    folder_id: folder?.id,
    content: content
  });
}
```

### Article Search

```javascript
async function searchArticles(companyId, query) {
  const articles = await fetchArticles({ company_id: companyId });

  const queryLower = query.toLowerCase();
  return articles.filter(article =>
    article.name.toLowerCase().includes(queryLower) ||
    article.content?.toLowerCase().includes(queryLower)
  );
}
```

### Documentation Health Check

```javascript
async function documentationHealthCheck(companyId) {
  const articles = await fetchArticles({ company_id: companyId });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  return {
    totalArticles: articles.length,
    drafts: articles.filter(a => a.draft).length,
    recentlyUpdated: articles.filter(a =>
      new Date(a.updated_at) > thirtyDaysAgo
    ).length,
    stale: articles.filter(a =>
      new Date(a.updated_at) < yearAgo
    ).map(a => ({
      name: a.name,
      lastUpdated: a.updated_at
    })),
    empty: articles.filter(a =>
      !a.content || a.content.trim().length < 50
    ).map(a => a.name)
  };
}
```

### Clone Article to Another Company

```javascript
async function cloneArticle(articleId, targetCompanyId, newName) {
  const template = await getArticle(articleId);

  return await createArticle({
    name: newName || template.name,
    company_id: targetCompanyId,
    content: template.content
  });
}
```

## Article Templates

### Network Overview

```html
<h1>Network Overview</h1>

<h2>Network Topology</h2>
<p>[Network diagram image here]</p>

<h2>IP Addressing</h2>
<table>
  <tr><th>Subnet</th><th>VLAN</th><th>Purpose</th></tr>
  <tr><td>192.168.1.0/24</td><td>1</td><td>Servers</td></tr>
  <tr><td>192.168.10.0/24</td><td>10</td><td>Workstations</td></tr>
  <tr><td>192.168.20.0/24</td><td>20</td><td>Guest WiFi</td></tr>
</table>

<h2>Core Infrastructure</h2>
<p>[Asset references here]</p>

<h2>Firewall Rules Summary</h2>
<p>[Rule overview]</p>

<h2>Related Credentials</h2>
<p>[Embedded passwords]</p>
```

### Disaster Recovery Plan

```html
<h1>Disaster Recovery Plan</h1>

<h2>Emergency Contacts</h2>
<table>
  <tr><th>Role</th><th>Name</th><th>Phone</th></tr>
  <tr><td>Primary Contact</td><td>John Smith</td><td>555-123-4567</td></tr>
  <tr><td>IT Manager</td><td>Jane Doe</td><td>555-987-6543</td></tr>
</table>

<h2>Critical Systems (Recovery Priority)</h2>
<ol>
  <li>Domain Controller - RTO: 1 hour</li>
  <li>Email Server - RTO: 2 hours</li>
  <li>File Server - RTO: 4 hours</li>
  <li>Line of Business App - RTO: 8 hours</li>
</ol>

<h2>Recovery Procedures</h2>
<h3>Complete Site Failure</h3>
<ol>
  <li>Activate backup site / cloud DR</li>
  <li>Restore domain controller from latest backup</li>
  <li>Verify DNS failover</li>
  <li>Restore email services</li>
  <li>Restore file server from backup</li>
</ol>

<h2>Required Credentials</h2>
<p>[Embedded password references]</p>

<h2>Vendor Support Contacts</h2>
<table>
  <tr><th>Vendor</th><th>Support Number</th><th>Account Number</th></tr>
  <tr><td>ISP</td><td>800-555-1234</td><td>ACCT-12345</td></tr>
  <tr><td>Backup Vendor</td><td>800-555-5678</td><td>ACCT-67890</td></tr>
</table>
```

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Name can't be blank | Provide article name |
| 401 | Invalid API key | Check HUDU_API_KEY |
| 404 | Article not found | Verify article ID |
| 422 | Validation failed | Check required fields |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Name required | Missing name | Add name to request |
| Invalid folder | Bad folder_id | Query /folders first |
| Invalid company | Bad company_id | Query /companies first |

### Error Recovery Pattern

```javascript
async function safeCreateArticle(data) {
  try {
    return await createArticle(data);
  } catch (error) {
    if (error.status === 422) {
      // Handle invalid folder
      if (error.message?.includes('folder')) {
        console.log('Invalid folder. Creating at root level.');
        delete data.folder_id;
        return await createArticle(data);
      }
    }

    throw error;
  }
}
```

## Best Practices

1. **Use consistent structure** - Follow templates for standard articles
2. **Organize with folders** - Create a logical folder hierarchy per company
3. **Keep content current** - Review and update articles regularly
4. **Use global articles** - Share standard procedures across all companies
5. **Include visual aids** - Add diagrams, screenshots, and tables
6. **Use meaningful names** - Clear, descriptive article titles
7. **Include metadata** - Add last reviewed date and author at the top
8. **Standardize formatting** - Consistent headings and structure
9. **Link related resources** - Reference assets and passwords
10. **Regular audits** - Review documentation quarterly for accuracy

## Related Skills

- [Hudu Companies](../companies/SKILL.md) - Article company scope
- [Hudu Assets](../assets/SKILL.md) - Related asset references
- [Hudu Passwords](../passwords/SKILL.md) - Embedded credentials
- [Hudu Websites](../websites/SKILL.md) - Website documentation
- [Hudu API Patterns](../api-patterns/SKILL.md) - API reference
