# SuperOps.ai Alert Field Reference

## Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `alertId` | ID | Unique identifier |
| `message` | String | Alert message/description |
| `severity` | Enum | Critical, High, Medium, Low |
| `status` | Enum | Active, Acknowledged, Resolved |
| `type` | String | Alert category |
| `createdTime` | DateTime | When alert was triggered |
| `acknowledgedTime` | DateTime | When acknowledged |
| `resolvedTime` | DateTime | When resolved |

## Association Fields

| Field | Type | Description |
|-------|------|-------------|
| `asset` | Asset | Source asset |
| `client` | Client | Associated client |
| `site` | Site | Associated site |
| `monitor` | Monitor | Triggering monitor |
| `ticket` | Ticket | Linked ticket (if any) |

## Resolution Fields

| Field | Type | Description |
|-------|------|-------------|
| `acknowledgedBy` | Technician | Who acknowledged |
| `resolvedBy` | Technician | Who resolved |
| `resolutionNotes` | String | Resolution details |
