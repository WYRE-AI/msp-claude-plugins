---
name: "Microsoft 365 Teams"
description: >
  Microsoft Teams through Microsoft Graph: the Team/Channel/Member/Meeting/Tab
  object model, team and channel enumeration, membership and ownership changes,
  online meetings, usage reporting, and the causes behind Teams access failures.
when_to_use: >-
  When enumerating or administering Teams, channels, and membership, or troubleshooting a
  Teams access problem. Use when: microsoft teams, m365 teams, teams
  channel, teams membership, teams meeting, teams access, teams troubleshoot, list teams m365,
  teams usage, or teams admin.
---

# Microsoft Teams Management

## Overview

Microsoft Teams is the collaboration hub for most M365 customers. MSP support tasks include troubleshooting access issues, managing team membership, reviewing channel structure, and investigating meeting problems. All Teams data is accessible through Microsoft Graph.

## Anti-triggers

"Team" means something different in four of the plugins an MSP has
installed. Here it is a Microsoft 365 collaboration workspace backed by
an Entra group:

- **A scheduling pool of technicians** — TimeZest teams are round-robin
  availability groups with no Microsoft Teams involvement at all; use
  the `timezest` plugin (`timezest-agents-and-teams`).
- **A PSA dispatch queue or technician group** — use the PSA plugins
  (`halopsa`, `connectwise`, `kaseya/autotask`).
- **Booking or rescheduling a meeting** — creating the calendar event
  is `m365-calendar`; this skill covers the Teams objects the meeting
  hangs off.
- **Reading Teams chat for an investigation** — message retrieval for
  compromise or eDiscovery work is a security and retention question,
  not a membership one; start at `m365-security`.

## Core Teams Objects

| Object | Description | API Resource |
|--------|-------------|-------------|
| **Team** | Top-level workspace | `/teams/{id}` |
| **Channel** | Conversation thread within a team | `/teams/{id}/channels/{id}` |
| **Member** | User in a team (owner or member) | `/teams/{id}/members` |
| **Meeting** | Online meeting or channel event | `/me/onlineMeetings` |
| **Tab** | App integration in a channel | `/teams/{id}/channels/{id}/tabs` |

## Graph API Patterns

### List All Teams a User Belongs To

```http
GET /v1.0/users/{userId}/joinedTeams?$select=id,displayName,description,visibility
```

**Response:**
```json
{
  "value": [
    {
      "id": "team-guid",
      "displayName": "Engineering",
      "description": "Engineering team workspace",
      "visibility": "private"
    }
  ]
}
```

### List All Teams in the Tenant (Admin View)

```http
GET /v1.0/groups?$filter=resourceProvisioningOptions/Any(x:x eq 'Team')&$select=id,displayName,description,createdDateTime,visibility
```

### Get Team Details

```http
GET /v1.0/teams/{teamId}?$select=id,displayName,description,isArchived,memberSettings,guestSettings,messagingSettings
```

### List Channels in a Team

```http
GET /v1.0/teams/{teamId}/channels?$select=id,displayName,description,membershipType,createdDateTime
```

**Channel types:**
- `standard` — Open to all team members
- `private` — Invite-only subset of team members
- `shared` — Shared with external users or other teams

### Get Team Members

```http
GET /v1.0/teams/{teamId}/members?$select=id,displayName,email,roles
```

**Roles:** `owner` or `member` (empty array = member)

### Add a Member to a Team

```http
POST /v1.0/teams/{teamId}/members
Content-Type: application/json

{
  "@odata.type": "#microsoft.graph.aadUserConversationMember",
  "roles": [],
  "user@odata.bind": "https://graph.microsoft.com/v1.0/users/{userId}"
}
```

**To add as owner:** set `"roles": ["owner"]`

### Remove a Member from a Team

```http
DELETE /v1.0/teams/{teamId}/members/{memberId}
```

### Create a New Team

```http
POST /v1.0/teams
Content-Type: application/json

{
  "template@odata.bind": "https://graph.microsoft.com/v1.0/teamsTemplates('standard')",
  "displayName": "IT Support",
  "description": "Internal IT support team",
  "visibility": "private",
  "members": [
    {
      "@odata.type": "#microsoft.graph.aadUserConversationMember",
      "roles": ["owner"],
      "user@odata.bind": "https://graph.microsoft.com/v1.0/users/{ownerUserId}"
    }
  ]
}
```

### Archive a Team (Inactive Projects)

```http
POST /v1.0/teams/{teamId}/archive
Content-Type: application/json

{
  "shouldSetSpoSiteReadOnlyForMembers": true
}
```

### Get Channel Messages (Last 20)

```http
GET /v1.0/teams/{teamId}/channels/{channelId}/messages?$top=20&$orderby=createdDateTime desc
```

## Teams Meetings

### Get a User's Upcoming Meetings

```http
GET /v1.0/users/{userId}/calendar/events?$filter=start/dateTime ge '2024-01-15T00:00:00' and isOnlineMeeting eq true&$select=subject,start,end,organizer,onlineMeeting&$orderby=start/dateTime
```

### Get Online Meeting Details (Join URL)

```http
GET /v1.0/users/{userId}/onlineMeetings/{meetingId}?$select=subject,startDateTime,endDateTime,joinUrl,participants
```

### Create an Online Meeting

```http
POST /v1.0/users/{userId}/onlineMeetings
Content-Type: application/json

{
  "startDateTime": "2024-01-20T14:00:00Z",
  "endDateTime": "2024-01-20T15:00:00Z",
  "subject": "IT Onboarding Session"
}
```

## Common MSP Workflows

### New Employee Teams Onboarding

1. Get list of teams the employee's manager belongs to
2. Add new user to relevant teams as member
3. Add to department-specific private channels
4. Add as member (not owner) unless explicitly needed

### Employee Offboarding from Teams

1. List all teams user belongs to (`/joinedTeams`)
2. For each team: check if user is the sole owner
3. If sole owner: assign another owner before removal
4. Remove user from all teams
5. Archive any teams that were personal/project-specific

### Find Teams Without Owners

```http
GET /v1.0/groups?$filter=resourceProvisioningOptions/Any(x:x eq 'Team')&$select=id,displayName
```

Then for each team:
```http
GET /v1.0/teams/{teamId}/members?$filter=roles/any(r:r eq 'owner')
```

Empty result = orphaned team, security risk.

### Teams Guest Access Audit

List teams with external members:
```http
GET /v1.0/teams/{teamId}/members?$filter=startsWith(email,'#EXT#')
```

External accounts have `#EXT#` in their UPN pattern.

## Troubleshooting Teams Access

| Symptom | Check | Resolution |
|---------|-------|------------|
| Can't join a team | Check `visibility` (private requires invite) | Add via API or admin invite |
| Missing from channel | Private channel membership | Add to private channel specifically |
| Can't see messages | Guest/external user restrictions | Review guest settings in team |
| Meeting join fails | License (Teams not in SKU) | Assign Teams service plan |
| Missing in directory | Not synced from AD | Check Azure AD Connect sync |

## Permissions Required

| Task | Microsoft Graph Permission |
|------|---------------------------|
| List joined teams | `Team.ReadBasic.All` |
| List all tenant teams | `Directory.Read.All` |
| Read team members | `TeamMember.Read.All` |
| Add/remove members | `TeamMember.ReadWrite.All` |
| Create teams | `Team.Create` |
| Archive teams | `TeamSettings.ReadWrite.All` |
| Read messages | `ChannelMessage.Read.All` |

## Related Skills

- [M365 Users](../users/SKILL.md) - User accounts, license verification
- [M365 Calendar](../calendar/SKILL.md) - Meeting scheduling and calendar integration
- [M365 API Patterns](../api-patterns/SKILL.md) - Auth, pagination, delta queries
