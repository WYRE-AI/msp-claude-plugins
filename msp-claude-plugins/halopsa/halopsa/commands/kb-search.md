---
description: Search the HaloPSA knowledge base for articles and solutions
argument-hint: "<query> [category] [visibility] [limit]"
arguments: [query, category, visibility, limit]
---

# Search HaloPSA Knowledge Base

Search the HaloPSA knowledge base for articles and solutions to quickly find relevant information.

## Prerequisites

- Valid HaloPSA OAuth credentials configured
- User must have knowledge base read permissions
- Knowledge base module enabled in HaloPSA

## Steps

1. **Authenticate with OAuth 2.0**
   - Obtain access token using client credentials flow
   - Token endpoint: `{base_url}/auth/token?tenant={tenant}`
   ```bash
   # Get OAuth token
   TOKEN=$(curl -s -X POST "{base_url}/auth/token?tenant={tenant}" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials" \
     -d "client_id={client_id}" \
     -d "client_secret={client_secret}" \
     -d "scope=all" | jq -r '.access_token')
   ```

2. **Get available categories (for validation)**
   ```bash
   curl -s -X GET "{base_url}/api/KBCategory" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json"
   ```

3. **Execute knowledge base search**
   ```bash
   curl -s -X GET "{base_url}/api/KBArticle?search={query}&page_size={limit}" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json"
   ```

4. **Apply filters**
   - Filter by category if specified
   - Filter by visibility (internal/public)

5. **Format and display results**
   - Article list with summaries
   - Link to full articles
   - Related articles suggestions

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Search terms |
| category | string | No | - | KB category filter |
| visibility | string | No | all | internal/public/all |
| limit | integer | No | 10 | Maximum results (max 50) |

## Examples

### Basic Search

```
/kb-search "password reset"
```

### Category Filtered

```
/kb-search "VPN setup" --category "Network"
```

### Internal Articles Only

```
/kb-search "troubleshooting" --visibility internal
```

### Public Articles (Customer Facing)

```
/kb-search "how to" --visibility public
```

### More Results

```
/kb-search "printer" --limit 20
```

### Combined Filters

```
/kb-search "email configuration" --category "Email" --visibility internal --limit 15
```

## Output

### Search Results

```
Found 5 knowledge base articles matching "password reset"

================================================================================
KB SEARCH RESULTS
================================================================================

1. How to Reset Active Directory Passwords
   ────────────────────────────────────────────────────────────────────────────
   Category:    Active Directory
   Visibility:  Internal
   Views:       342
   Rating:      ★★★★★ (4.8/5)
   Updated:     2024-02-01

   Summary:
   Step-by-step guide for resetting user passwords in Active Directory,
   including self-service password reset (SSPR) and admin-initiated resets.

   Symptoms: User locked out, password expired, forgotten password

   View Article: /kb-article 1234

2. Self-Service Password Reset Portal Guide
   ────────────────────────────────────────────────────────────────────────────
   Category:    End User Guides
   Visibility:  Public
   Views:       1,245
   Rating:      ★★★★☆ (4.2/5)
   Updated:     2024-01-15

   Summary:
   End-user guide for using the self-service password reset portal.
   Includes registration and reset procedures.

   View Article: /kb-article 1235

3. Microsoft 365 Password Reset Procedures
   ────────────────────────────────────────────────────────────────────────────
   Category:    Microsoft 365
   Visibility:  Internal
   Views:       189
   Rating:      ★★★★★ (5.0/5)
   Updated:     2024-02-10

   Summary:
   Procedures for resetting passwords for Microsoft 365/Azure AD users,
   including MFA considerations and conditional access impacts.

   View Article: /kb-article 1236

4. Password Policy and Requirements
   ────────────────────────────────────────────────────────────────────────────
   Category:    Security
   Visibility:  Public
   Views:       567
   Rating:      ★★★★☆ (4.0/5)
   Updated:     2023-12-01

   Summary:
   Documentation of password complexity requirements, expiration policies,
   and password history settings.

   View Article: /kb-article 1237

5. Troubleshooting Password Sync Issues
   ────────────────────────────────────────────────────────────────────────────
   Category:    Active Directory
   Visibility:  Internal
   Views:       78
   Rating:      ★★★☆☆ (3.5/5)
   Updated:     2023-11-15

   Summary:
   Troubleshooting guide for Azure AD Connect password hash synchronization
   and pass-through authentication issues.

   View Article: /kb-article 1238

================================================================================

Quick Actions:
- View article:     /kb-article <id>
- Search more:      /kb-search "different terms"
- Browse category:  /kb-search --category "Active Directory"
```

### Detailed Article View

```
================================================================================
KB Article: How to Reset Active Directory Passwords
================================================================================

Article ID:       1234
Category:         Active Directory
Visibility:       Internal (Staff Only)
Created:          2023-06-15
Last Updated:     2024-02-01
Author:           Jane Tech
Views:            342
Rating:           ★★★★★ (4.8/5 from 24 ratings)

SYMPTOMS
--------------------------------------------------------------------------------
- User reports "password expired" message
- User locked out of account
- User forgot password
- Password not syncing to cloud services

RESOLUTION
--------------------------------------------------------------------------------

## Option 1: Admin Password Reset (ADUC)

1. Open Active Directory Users and Computers
2. Locate the user account
3. Right-click > Reset Password
4. Enter new temporary password
5. Check "User must change password at next logon"
6. Click OK

## Option 2: PowerShell Reset

```powershell
Set-ADAccountPassword -Identity "username" -Reset `
  -NewPassword (ConvertTo-SecureString -AsPlainText "TempP@ss123!" -Force)
Set-ADUser -Identity "username" -ChangePasswordAtLogon $true
```

## Option 3: Self-Service Portal

Direct user to: https://passwordreset.microsoftonline.com

Requirements:
- User must have registered authentication methods
- Self-service password reset must be enabled

VERIFICATION
--------------------------------------------------------------------------------
1. Ask user to log in with new password
2. Verify password sync to Microsoft 365 (wait 2-5 minutes)
3. Check Azure AD sign-in logs for successful auth

RELATED ARTICLES
--------------------------------------------------------------------------------
- Self-Service Password Reset Portal Guide (ID: 1235)
- Microsoft 365 Password Reset Procedures (ID: 1236)
- Account Lockout Troubleshooting (ID: 1240)

ATTACHMENTS
--------------------------------------------------------------------------------
- password_reset_flowchart.pdf (125 KB)
- sspr_registration_guide.docx (45 KB)

================================================================================

Actions:
- Was this helpful?  Rate this article
- Article URL:       https://yourcompany.halopsa.com/kb?id=1234
- Attach to ticket:  /add-action <ticket_id> "See KB article #1234"
```

### Category Listing

```
================================================================================
Knowledge Base Categories
================================================================================

Available Categories:
┌─────────┬────────────────────────┬────────────┬───────────────────────┐
│ ID      │ Category               │ Articles   │ Last Updated          │
├─────────┼────────────────────────┼────────────┼───────────────────────┤
│ 1       │ Active Directory       │ 45         │ 2024-02-10            │
│ 2       │ Microsoft 365          │ 78         │ 2024-02-14            │
│ 3       │ Network                │ 34         │ 2024-02-01            │
│ 4       │ Email                  │ 56         │ 2024-02-12            │
│ 5       │ Security               │ 23         │ 2024-01-28            │
│ 6       │ Hardware               │ 67         │ 2024-02-08            │
│ 7       │ End User Guides        │ 89         │ 2024-02-15            │
│ 8       │ Onboarding             │ 12         │ 2024-01-15            │
│ 9       │ Backup & Recovery      │ 28         │ 2024-02-05            │
│ 10      │ Printers               │ 19         │ 2024-01-20            │
└─────────┴────────────────────────┴────────────┴───────────────────────┘

Browse category: /kb-search --category "Category Name"
```

## Error Handling

### No Results

```
No knowledge base articles found matching "obscure topic"

Suggestions:
- Try different search terms
- Use broader keywords
- Check spelling
- Browse by category: /kb-search --category "Network"

Popular searches:
- password reset
- VPN connection
- printer setup
- email configuration
- new user
```

### Invalid Category

```
Category not found: "Unknown Category"

Available categories:
- Active Directory
- Microsoft 365
- Network
- Email
- Security
- Hardware
- End User Guides

Use: /kb-search "query" --category "Network"
```

### Knowledge Base Not Enabled

```
Knowledge Base module not available

The HaloPSA Knowledge Base module may not be enabled for your instance.
Contact your HaloPSA administrator.
```

### Authentication Error

```
Authentication failed

Please verify your HaloPSA credentials:
- HALOPSA_CLIENT_ID
- HALOPSA_CLIENT_SECRET
- HALOPSA_BASE_URL
- HALOPSA_TENANT (for cloud-hosted)

Ensure the API application has 'read:knowledgebase' permission.
```

### Rate Limiting

```
Rate limited by HaloPSA API (429)

HaloPSA allows 500 requests per 3 minutes.
Retrying in 5 seconds...
```

## API Reference

### GET /api/KBArticle

Query parameters:
- `search={query}` - Full-text search
- `category_id={id}` - Filter by category
- `page_size={limit}` - Results per page
- `access_type={public|internal}` - Visibility filter

**Response:**
```json
{
  "kbarticles": [
    {
      "id": 1234,
      "name": "How to Reset Active Directory Passwords",
      "category_id": 1,
      "category_name": "Active Directory",
      "summary": "Step-by-step guide...",
      "details": "<html>Full article content...</html>",
      "access_type": "internal",
      "view_count": 342,
      "rating": 4.8,
      "date_updated": "2024-02-01T10:30:00Z"
    }
  ],
  "record_count": 1
}
```

### GET /api/KBCategory

Retrieves available KB categories.

## Related Commands

- `/show-ticket` - View ticket details
- `/add-action` - Reference KB in ticket note
- `/search-tickets` - Find related tickets
- `/create-ticket` - Create ticket with KB reference
