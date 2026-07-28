---
name: "Microsoft 365 Files"
description: >
  OneDrive personal storage and SharePoint document libraries, both reached through
  the shared Microsoft Graph `/drives` endpoint: drive and item addressing, sharing
  permissions, storage quotas, file search, and the offboarding file-transfer
  workflow.
when_to_use: >-
  When investigating M365 file access, sharing, storage-quota, or file-search issues across
  OneDrive and SharePoint. Use
  when: onedrive, m365 files, sharepoint files, onedrive quota, file sharing m365, onedrive
  permissions, m365 storage, find file m365, onedrive access, or sharepoint document library.
---

# Microsoft 365 Files (OneDrive & SharePoint)

## Overview

Microsoft 365 provides two file storage surfaces: OneDrive (personal, per-user) and SharePoint (team/department libraries). Both are accessible through the same Microsoft Graph `/drives` endpoint. MSP support tasks include investigating access issues, checking storage quotas, managing sharing permissions, and transferring file access during offboarding.

## Core Concepts

| Surface | Use | Graph Resource |
|---------|-----|---------------|
| **OneDrive Personal** | Individual user's documents | `/users/{id}/drive` |
| **SharePoint Site Drive** | Team/department files | `/sites/{id}/drives` |
| **SharePoint Library** | Document library within a site | `/drives/{driveId}` |

## Graph API Patterns

### Get a User's OneDrive Info (Quota)

```http
GET /v1.0/users/{userId}/drive?$select=id,name,quota
```

**Response:**
```json
{
  "id": "drive-guid",
  "name": "OneDrive",
  "quota": {
    "used": 5368709120,
    "remaining": 1127428915200,
    "total": 1132797624320,
    "state": "normal"
  }
}
```

`state` values: `normal`, `nearing`, `critical`, `exceeded`

### List Files in Root

```http
GET /v1.0/users/{userId}/drive/root/children?$select=id,name,size,lastModifiedDateTime,webUrl,folder,file
```

### List Files in a Specific Folder

```http
GET /v1.0/users/{userId}/drive/items/{folderId}/children?$select=id,name,size,lastModifiedDateTime,webUrl
```

### Search for Files Across OneDrive

```http
GET /v1.0/users/{userId}/drive/root/search(q='budget 2024')?$select=id,name,parentReference,lastModifiedDateTime,webUrl
```

### Get File Sharing Permissions

```http
GET /v1.0/drives/{driveId}/items/{itemId}/permissions
```

**Response includes:**
```json
{
  "value": [
    {
      "id": "perm-id",
      "roles": ["write"],
      "grantedToV2": {
        "user": { "displayName": "Bob Manager", "email": "bmanager@contoso.com" }
      },
      "link": null
    },
    {
      "id": "link-id",
      "roles": ["read"],
      "link": {
        "type": "view",
        "scope": "anonymous",
        "webUrl": "https://contoso-my.sharepoint.com/..."
      }
    }
  ]
}
```

### Share a File (Create Sharing Link)

```http
POST /v1.0/drives/{driveId}/items/{itemId}/createLink
Content-Type: application/json

{
  "type": "view",
  "scope": "organization"
}
```

`type`: `view`, `edit`, `embed`
`scope`: `anonymous`, `organization`, `users`

### Grant Direct Access to a File/Folder

```http
POST /v1.0/drives/{driveId}/items/{itemId}/invite
Content-Type: application/json

{
  "requireSignIn": true,
  "sendInvitation": false,
  "roles": ["read"],
  "recipients": [
    { "email": "manager@contoso.com" }
  ],
  "message": "Shared as part of employee transition"
}
```

### Remove a Permission

```http
DELETE /v1.0/drives/{driveId}/items/{itemId}/permissions/{permissionId}
```

### Transfer OneDrive Access (Offboarding)

Grant another user access to the departing employee's entire OneDrive:

```http
POST /v1.0/users/{departingUserId}/drive/root/invite
Content-Type: application/json

{
  "requireSignIn": true,
  "sendInvitation": false,
  "roles": ["write"],
  "recipients": [{ "email": "manager@contoso.com" }]
}
```

> Full ownership transfer (changing site admin) requires SharePoint admin PowerShell:
> `Set-SPOSite -Identity <url> -Owner <email>`

## SharePoint Document Libraries

### List SharePoint Sites

```http
GET /v1.0/sites?search=*&$select=id,displayName,webUrl,createdDateTime
```

### List Drives (Document Libraries) in a Site

```http
GET /v1.0/sites/{siteId}/drives?$select=id,name,driveType,quota
```

### Get Files from a SharePoint Library

```http
GET /v1.0/drives/{driveId}/root/children?$select=id,name,size,lastModifiedDateTime,webUrl
```

## Common MSP Workflows

### User Can't Access a File

1. Get the file's current permissions: `GET /items/{id}/permissions`
2. Check if user has direct access or if it's link-based
3. Check if user is in a group that has access: `GET /users/{id}/memberOf`
4. If sharing link expired: create new sharing link
5. If direct access missing: add via `/invite`

### Pre-Offboarding Data Review

Before offboarding, identify files the user owns that are widely shared:

```http
GET /v1.0/users/{userId}/drive/root/search(q='*')?$select=id,name,permissions,parentReference
```

Look for items with `scope: anonymous` sharing links — these should be cleaned up or ownership transferred.

### OneDrive Quota Alert

Check users approaching quota limits:

```http
GET /v1.0/users/{userId}/drive?$select=quota
```

If `quota.state` is `nearing` (>80%) or `critical` (>90%), alert for cleanup or quota increase.

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `itemNotFound` | File or folder doesn't exist | Check path or item ID |
| `accessDenied` | No Files.Read permission | Grant permission and admin consent |
| `quotaLimitReached` | OneDrive full | Clean up or expand quota |
| `sharingDisabled` | Tenant sharing policy blocks external | Review SharePoint admin settings |

## Permissions Required

| Task | Microsoft Graph Permission |
|------|---------------------------|
| Read user's files | `Files.Read.All` |
| Read/write files | `Files.ReadWrite.All` |
| Read SharePoint sites | `Sites.Read.All` |
| Manage sharing | `Files.ReadWrite.All` |
| SharePoint admin | `Sites.ReadWrite.All` |

## Related Skills

- [M365 Users](../users/SKILL.md) - User offboarding, OneDrive transfer
- [M365 Security](../security/SKILL.md) - Audit external sharing
- [M365 API Patterns](../api-patterns/SKILL.md) - Search syntax, pagination
