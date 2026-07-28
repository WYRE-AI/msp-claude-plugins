# SuperOps.ai Ticket Field Reference

## Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ticketId` | ID | System | Auto-generated unique identifier |
| `ticketNumber` | String | System | Human-readable ticket number |
| `subject` | String | Yes | Brief issue summary |
| `description` | String | No | Detailed description |
| `ticketType` | Enum | No | Incident, Service Request, Problem, Change |
| `requestType` | Enum | No | Classification type |
| `source` | Enum | No | How ticket was created (email, portal, phone) |

## Assignment Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `client` | ClientIdentifier | Yes | Client/account reference |
| `site` | SiteIdentifier | No | Site within client |
| `requester` | RequesterIdentifier | No | Person who reported |
| `assignee` | TechnicianIdentifier | No | Assigned technician |
| `techGroup` | TechGroupIdentifier | No | Technician group |

## Classification Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `priority` | Enum | No | Critical, High, Medium, Low |
| `impact` | Enum | No | Impact level |
| `urgency` | Enum | No | Urgency level |
| `category` | CategoryIdentifier | No | Service category |
