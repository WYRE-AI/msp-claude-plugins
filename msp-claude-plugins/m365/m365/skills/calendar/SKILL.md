---
name: "Microsoft 365 Calendar"
description: >
  Use this skill when working with Microsoft 365 calendars - viewing events,
  finding free/busy times, creating meetings, managing room bookings, or
  checking a user's schedule. Covers Exchange calendar via Microsoft Graph
  for MSP support of customer scheduling needs.
when_to_use: >-
  When viewing events, finding free/busy times, creating meetings, managing room bookings, or
  checking a user's schedule. Use when: m365 calendar, outlook calendar, calendar events m365,
  meeting schedule m365, find availability m365, room booking m365, m365 free busy, teams meeting
  create, or calendar permissions.
---

# Microsoft 365 Calendar Management

## Overview

Microsoft 365 calendar is powered by Exchange Online and surfaced through Microsoft Graph. For MSPs, calendar tasks include troubleshooting scheduling issues, creating meetings on behalf of users, managing room resources, and checking user availability during support incidents.

## Graph API Patterns

### Get a User's Calendar Events

```http
GET /v1.0/users/{userId}/calendar/events?$select=id,subject,start,end,organizer,attendees,isOnlineMeeting,location&$orderby=start/dateTime&$top=10
```

### Get Events in a Date Range

```http
GET /v1.0/users/{userId}/calendarView?startDateTime=2024-01-15T00:00:00Z&endDateTime=2024-01-22T00:00:00Z&$select=subject,start,end,organizer,attendees,isOnlineMeeting
```

> Use `calendarView` (not `/events`) for date-range queries — it correctly expands recurring events.

### Check Free/Busy Time

Get availability for a set of users:

```http
POST /v1.0/users/{userId}/calendar/getSchedule
Content-Type: application/json

{
  "schedules": ["user1@contoso.com", "user2@contoso.com"],
  "startTime": { "dateTime": "2024-01-20T08:00:00", "timeZone": "Eastern Standard Time" },
  "endTime":   { "dateTime": "2024-01-20T17:00:00", "timeZone": "Eastern Standard Time" },
  "availabilityViewInterval": 30
}
```

**Response:**
```json
{
  "value": [
    {
      "scheduleId": "user1@contoso.com",
      "availabilityView": "000022220000",
      "scheduleItems": [
        {
          "status": "busy",
          "start": { "dateTime": "2024-01-20T10:00:00" },
          "end":   { "dateTime": "2024-01-20T11:00:00" }
        }
      ]
    }
  ]
}
```

`availabilityView` is a string where each character represents a 30-min slot: `0`=free, `1`=tentative, `2`=busy, `3`=out-of-office, `4`=working elsewhere.

### Create a Meeting (with Teams Link)

```http
POST /v1.0/users/{organizerId}/events
Content-Type: application/json

{
  "subject": "IT Onboarding — Jane Smith",
  "start": { "dateTime": "2024-01-20T10:00:00", "timeZone": "Eastern Standard Time" },
  "end":   { "dateTime": "2024-01-20T11:00:00", "timeZone": "Eastern Standard Time" },
  "attendees": [
    { "emailAddress": { "address": "jsmith@contoso.com" }, "type": "required" },
    { "emailAddress": { "address": "itadmin@contoso.com" }, "type": "required" }
  ],
  "isOnlineMeeting": true,
  "onlineMeetingProvider": "teamsForBusiness",
  "body": { "contentType": "HTML", "content": "<p>IT onboarding session agenda...</p>" }
}
```

### Get Room Resources

```http
GET /v1.0/places/microsoft.graph.room?$select=id,displayName,emailAddress,capacity,building,floorNumber
```

### Check Room Availability

Use `getSchedule` with the room's email address as a schedule ID (same as users above).

### Cancel an Event

```http
POST /v1.0/users/{userId}/events/{eventId}/cancel
Content-Type: application/json

{
  "comment": "Meeting has been rescheduled. New invite to follow."
}
```

### Update an Event

```http
PATCH /v1.0/users/{userId}/events/{eventId}
Content-Type: application/json

{
  "subject": "Updated: IT Onboarding — Jane Smith",
  "start": { "dateTime": "2024-01-21T14:00:00", "timeZone": "Eastern Standard Time" },
  "end":   { "dateTime": "2024-01-21T15:00:00", "timeZone": "Eastern Standard Time" }
}
```

## Common MSP Workflows

### Find Available Meeting Time

1. Get list of required attendees
2. Call `getSchedule` for all attendees + desired room
3. Parse `availabilityView` strings to find overlapping free slots
4. Return top 3 options within the user's working hours

### Out-of-Office and Calendar Coordination

When setting OOO (via mailbox settings), also check if the user has events during their absence:

1. Get events in the OOO date range
2. List events with other attendees — these may need cancellation or reassignment
3. Cancel/update events as needed
4. Set OOO via mailbox settings

### Recurring Event Management

Recurring events are expanded in `calendarView` results. Each instance has:
- `seriesMasterId` — the master recurring event ID
- `type: "occurrence"` — individual instance
- `type: "seriesMaster"` — the template

To update all future instances: `PATCH` the series master.
To update only one instance: `PATCH` the specific occurrence.

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `ErrorCalendarNotFound` | User has no calendar (no Exchange license) | Assign Exchange license |
| `ErrorItemNotFound` | Event ID doesn't exist | May have been deleted |
| `ErrorAccessDenied` | No Calendars.Read permission | Check app permissions |
| `Organizer_Invalid` | Trying to create event as non-organizer | Use organizer's userId |

## Permissions Required

| Task | Microsoft Graph Permission |
|------|---------------------------|
| Read events | `Calendars.Read` |
| Read other users' calendars | `Calendars.Read` (admin consent) |
| Create/update/delete events | `Calendars.ReadWrite` |
| Check free/busy | `Calendars.Read` |
| Room directory | `Place.Read.All` |

## Related Skills

- [M365 Teams](../teams/SKILL.md) - Teams meetings integration
- [M365 Mailboxes](../mailboxes/SKILL.md) - Out-of-office coordination
- [M365 Users](../users/SKILL.md) - Timezone and locale settings
