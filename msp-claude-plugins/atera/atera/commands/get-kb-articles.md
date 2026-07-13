---
description: Search the Atera knowledge base for articles
argument-hint: "<query> [folder] [visibility] [limit]"
arguments: [query, folder, visibility, limit]
---

# Get Atera Knowledge Base Articles

Search the Atera knowledge base for articles and solutions to common problems.

## Prerequisites

- Valid Atera API key configured
- User must have knowledge base read permissions

## Steps

1. **Get folder list (if folder filter specified)**
   ```bash
   curl -s -X GET "https://app.atera.com/api/v3/knowledgebase/folders" \
     -H "X-API-KEY: $ATERA_API_KEY" \
     -H "Accept: application/json"
   ```
   - Match folder name to folder ID

2. **Search knowledge base articles**
   ```bash
   curl -s -X GET "https://app.atera.com/api/v3/knowledgebase/articles?search={query}" \
     -H "X-API-KEY: $ATERA_API_KEY" \
     -H "Accept: application/json"
   ```

3. **Apply filters**
   - Filter by folder ID if specified
   - Filter by visibility if specified
   - Limit results

4. **Return article list**
   - Article ID and title
   - Folder name
   - Visibility
   - Summary/excerpt
   - Last updated date

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Search terms for knowledge base |
| folder | string | No | - | Filter by KB folder name |
| visibility | string | No | All | Internal, CustomerPortal, All |
| limit | integer | No | 10 | Maximum results |

## Examples

### Basic Search

```
/get-kb-articles "password reset"
```

### Search in Specific Folder

```
/get-kb-articles "printer setup" --folder "How-To Guides"
```

### Internal Articles Only

```
/get-kb-articles "VPN" --visibility Internal
```

### Customer-Facing Articles

```
/get-kb-articles "email setup" --visibility CustomerPortal
```

### Combined Filters with Limit

```
/get-kb-articles "backup" --folder "Troubleshooting" --visibility Internal --limit 20
```

## Output

### Search Results

```
Knowledge Base Articles: 5 results for "password reset"

| ID    | Title                              | Folder           | Visibility      | Updated     |
|-------|-----------------------------------|------------------|-----------------|-------------|
| 101   | How to Reset Your Password        | How-To Guides    | CustomerPortal  | 2026-01-15  |
| 102   | Password Reset Policy Guide       | Policies         | Internal        | 2025-12-01  |
| 103   | Self-Service Password Reset Setup | How-To Guides    | CustomerPortal  | 2025-11-20  |
| 104   | Troubleshooting Password Issues   | Troubleshooting  | Internal        | 2025-10-15  |
| 105   | Admin Password Reset Procedure    | Internal Docs    | Internal        | 2025-09-01  |
```

### Detailed Article View (Single Result)

```
Knowledge Base Article

ID: 101
Title: How to Reset Your Password
Folder: How-To Guides
Visibility: Customer Portal
Created: 2025-06-15
Updated: 2026-01-15

Summary:
--------
This guide walks you through the process of resetting your password
using the self-service portal. If you've forgotten your password or
need to update it for security reasons, follow these steps...

Content Preview:
----------------
Step 1: Navigate to the login page and click "Forgot Password"
Step 2: Enter your email address
Step 3: Check your inbox for the reset link
Step 4: Click the link and create a new password
...

URL: https://app.atera.com/new/knowledgebase/article/101
```

### Search with Folder Filter

```
Knowledge Base Articles: 3 results for "printer" in "How-To Guides"

| ID    | Title                              | Visibility      | Updated     |
|-------|-----------------------------------|-----------------|-------------|
| 201   | Setting Up a Network Printer       | CustomerPortal  | 2026-01-10  |
| 202   | Troubleshooting Print Spooler      | Internal        | 2025-12-15  |
| 203   | Adding Printer to Windows 11       | CustomerPortal  | 2025-11-01  |
```

## Error Handling

### No Articles Found

```
No knowledge base articles found for: "xyz widget troubleshooting"

Suggestions:
- Try different search terms
- Use fewer keywords
- Check spelling
- Browse folders directly

Available folders:
- How-To Guides
- Troubleshooting
- Policies
- Internal Docs
```

### Folder Not Found

```
Folder not found: "Technical Docs"

Available folders:
- How-To Guides (24 articles)
- Troubleshooting (18 articles)
- Policies (12 articles)
- Internal Docs (35 articles)
- FAQs (8 articles)
```

### Invalid Visibility

```
Invalid visibility: "Public"

Valid visibility options:
- Internal: Only visible to technicians
- CustomerPortal: Visible to customers in portal
- All: Show all articles
```

### Empty Query

```
Search query required

Please provide search terms:
/get-kb-articles "topic to search"
```

### Rate Limit Exceeded

```
Rate limit exceeded (700 req/min)

Waiting 30 seconds before retry...
```

## API Patterns

### Search Articles
```http
GET /api/v3/knowledgebase/articles?search={query}
X-API-KEY: {api_key}
```

### List Folders
```http
GET /api/v3/knowledgebase/folders
X-API-KEY: {api_key}
```

### Get Article Details
```http
GET /api/v3/knowledgebase/articles/{articleId}
X-API-KEY: {api_key}
```

### Response Structure
```json
{
  "Page": 1,
  "ItemsInPage": 10,
  "TotalPages": 2,
  "TotalItemsCount": 15,
  "items": [
    {
      "ArticleID": 101,
      "Title": "How to Reset Your Password",
      "FolderID": 1,
      "FolderName": "How-To Guides",
      "Visibility": "CustomerPortal",
      "Summary": "This guide walks you through the process...",
      "Content": "<full HTML content>",
      "CreatedOn": "2025-06-15T10:00:00Z",
      "ModifiedOn": "2026-01-15T14:30:00Z"
    }
  ]
}
```

### Folder Structure
```json
{
  "items": [
    {
      "FolderID": 1,
      "FolderName": "How-To Guides",
      "ArticleCount": 24
    },
    {
      "FolderID": 2,
      "FolderName": "Troubleshooting",
      "ArticleCount": 18
    }
  ]
}
```

## Use Cases

### During Troubleshooting

```
/get-kb-articles "outlook not connecting" --visibility Internal
```
Find internal documentation for common Outlook issues.

### Customer Self-Service

```
/get-kb-articles "vpn setup" --visibility CustomerPortal
```
Find articles suitable to share with customers.

### Policy Lookup

```
/get-kb-articles "password policy" --folder "Policies"
```
Find specific policy documentation.

## Related Commands

- `/create-ticket` - Create a ticket and reference KB article
- `/search-customers` - Find customer for ticket
- `/log-time` - Log time researching issue
