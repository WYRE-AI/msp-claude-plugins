---
description: Add an internal or external note to a ConnectWise PSA ticket
argument-hint: "<ticket_id> <text> [detail_description] [internal_analysis] [resolution] [flag]"
arguments: [ticket_id, text, detail_description, internal_analysis, resolution, flag]
---

# Add Note to ConnectWise PSA Ticket

Add an internal or external note to a ConnectWise ticket.

## Prerequisites

- Valid ConnectWise PSA API credentials configured
- User must have ticket note creation permissions
- Ticket must exist and be accessible

## Steps

1. **Validate ticket exists**
   ```http
   GET /service/tickets/{id}
   ```
   - Confirm ticket is accessible
   - Check if ticket is closed (warn if adding note to closed ticket)

2. **Determine note type and destination**
   - If `detail_description`, `internal_analysis`, or `resolution` is true, update ticket fields
   - Otherwise, create a service note

3. **For standard notes - Create the note**
   ```http
   POST /service/tickets/{id}/notes
   Content-Type: application/json

   {
     "text": "<note_text>",
     "detailDescriptionFlag": false,
     "internalAnalysisFlag": <true if flag=internal or both>,
     "resolutionFlag": false,
     "customerUpdatedFlag": <true if flag=external or both>,
     "processNotifications": true
   }
   ```

4. **For ticket field updates - Patch the ticket**
   ```http
   PATCH /service/tickets/{id}
   Content-Type: application/json

   [
     {"op": "replace", "path": "/detailDescription", "value": "<text>"},
     {"op": "replace", "path": "/internalAnalysis", "value": "<text>"},
     {"op": "replace", "path": "/resolution", "value": "<text>"}
   ]
   ```

5. **Confirm note was added**
   - Return note ID and timestamp
   - Show note visibility

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| ticket_id | integer | Yes | - | ConnectWise ticket ID |
| text | string | Yes | - | Note content (multi-line supported) |
| detail_description | boolean | No | false | Add to detail description field |
| internal_analysis | boolean | No | false | Add to internal analysis field |
| resolution | boolean | No | false | Add to resolution field |
| flag | string | No | internal | Visibility: internal, external, both |

## Note Types Explained

### Standard Notes (Default)
Created as service ticket notes, appear in the notes/activity stream.

### Detail Description
Appends to the ticket's main description field. Use for expanding initial problem description.

### Internal Analysis
Appends to the internal analysis field. Use for documenting troubleshooting steps and findings not shared with customer.

### Resolution
Appends to the resolution field. Use for documenting how the issue was resolved.

## Visibility Flags

| Flag | Internal Users | Customer Portal | Email Notifications |
|------|----------------|-----------------|---------------------|
| internal | Yes | No | No |
| external | Yes | Yes | Yes (if configured) |
| both | Yes | Yes | Yes (if configured) |

## Examples

### Basic Internal Note

```
/add-note 12345 "Contacted customer, issue reproduced on their end"
```

### External Note (Customer-Visible)

```
/add-note 12345 "Applied KB12345 patch, monitoring for recurrence" --flag external
```

### Note Visible to Both

```
/add-note 12345 "Issue resolved. Please let us know if you experience any further problems." --flag both
```

### Add to Internal Analysis

```
/add-note 12345 "Root cause identified as DNS misconfiguration on primary DC" --internal_analysis true
```

### Add to Resolution Field

```
/add-note 12345 "Corrected DNS settings on DC01 and flushed DNS cache on affected workstations" --resolution true
```

### Add to Detail Description

```
/add-note 12345 "Additional info: Issue also affects mobile devices connecting via ActiveSync" --detail_description true
```

### Multi-Line Note

```
/add-note 12345 "Troubleshooting steps performed:
1. Verified DNS resolution - FAILED
2. Checked mail flow rules - OK
3. Tested SMTP connectivity - OK
4. Reviewed DNS records on DC01 - Found stale A record

Root cause: Stale DNS record pointing to decommissioned server."
```

## Output

### Standard Note Added

```
Note Added to Ticket #12345

Note ID:     98765
Added:       2026-02-04 14:30:00
Added By:    Jane Technician
Visibility:  Internal Only

Content:
"Contacted customer, issue reproduced on their end"

Ticket: Email not working for multiple users
Company: Acme Corporation
Status: In Progress
```

### External Note Added

```
Note Added to Ticket #12345

Note ID:     98766
Added:       2026-02-04 14:35:00
Added By:    Jane Technician
Visibility:  Customer Visible

Content:
"Applied KB12345 patch, monitoring for recurrence"

Note: Customer notification email will be sent based on your notification settings.

Ticket: Email not working for multiple users
Company: Acme Corporation
```

### Field Update

```
Ticket #12345 Updated

Field Updated: Internal Analysis

Content Added:
"Root cause identified as DNS misconfiguration on primary DC"

Previous Content:
"Initial triage indicates mail server issue"

New Content:
"Initial triage indicates mail server issue

Root cause identified as DNS misconfiguration on primary DC"
```

## API Authentication

```bash
# Base64 encode credentials: company+publicKey:privateKey
AUTH=$(echo -n "${CW_COMPANY}+${CW_PUBLIC_KEY}:${CW_PRIVATE_KEY}" | base64)

# Create internal note
curl -s -X POST \
  "https://${CW_HOST}/v4_6_release/apis/3.0/service/tickets/${TICKET_ID}/notes" \
  -H "Authorization: Basic ${AUTH}" \
  -H "clientId: ${CW_CLIENT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Note content here",
    "internalAnalysisFlag": true,
    "processNotifications": true
  }'

# Create external note
curl -s -X POST \
  "https://${CW_HOST}/v4_6_release/apis/3.0/service/tickets/${TICKET_ID}/notes" \
  -H "Authorization: Basic ${AUTH}" \
  -H "clientId: ${CW_CLIENT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Note content here",
    "customerUpdatedFlag": true,
    "processNotifications": true
  }'

# Update ticket field
curl -s -X PATCH \
  "https://${CW_HOST}/v4_6_release/apis/3.0/service/tickets/${TICKET_ID}" \
  -H "Authorization: Basic ${AUTH}" \
  -H "clientId: ${CW_CLIENT_ID}" \
  -H "Content-Type: application/json" \
  -d '[
    {"op": "replace", "path": "/internalAnalysis", "value": "Analysis content here"}
  ]'
```

## Error Handling

### Ticket Not Found

```
Error: Ticket #99999 not found

The ticket may have been deleted or you may not have permission to access it.
```

### Empty Note Text

```
Error: Note text cannot be empty

Please provide note content:
/add-note 12345 "Your note text here"
```

### Permission Denied

```
Error: Permission denied

You do not have permission to add notes to tickets on the "Escalations" board.
Contact your ConnectWise administrator.
```

### Closed Ticket Warning

```
Warning: Ticket #12345 is closed

Adding notes to closed tickets may affect reporting.
Add note anyway? [Y/n]
```

### Note Too Long

```
Error: Note text exceeds maximum length (32,000 characters)

Your note is 35,421 characters. Please shorten it or split into multiple notes.
```

### Invalid Flag Value

```
Error: Invalid flag value "private"

Valid flag values:
- internal  - Only visible to internal users
- external  - Visible to customer on portal
- both      - Visible to both internal users and customer

Example: /add-note 12345 "Note text" --flag external
```

### External Note Confirmation

```
You are about to add a customer-visible note.

This note will:
- Appear on the customer portal
- Trigger email notification (if configured)
- Be visible to: John Smith (john.smith@acme.com)

Content:
"We've identified the issue and are working on a fix."

Proceed? [Y/n]
```

## Related Commands

- `/get-ticket` - View ticket details and existing notes
- `/update-ticket` - Update ticket fields
- `/close-ticket` - Close ticket with resolution note
- `/log-time` - Log time against ticket
