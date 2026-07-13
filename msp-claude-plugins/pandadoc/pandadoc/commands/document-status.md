---
description: Check the status of a PandaDoc document and its recipients
argument-hint: "[document_id] [document_name]"
arguments: [document_id, document_name]
---

# Check PandaDoc Document Status

Check the status of a document including its current lifecycle stage, which recipients have signed, and key dates. Useful for tracking proposals, MSAs, and quotes through the signing process.

## Prerequisites

- PandaDoc MCP server connected with a valid API key
- MCP tools `pandadoc-list-documents`, `pandadoc-get-document`, and `pandadoc-get-document-status` available

## Steps

1. **Resolve document** - Find the document by name or use the provided ID

   - If an ID was provided, call `pandadoc-get-document` with `id`
   - If a name was provided, call `pandadoc-list-documents` with `q` set to the document name

2. **Get document status**

   Call `pandadoc-get-document-status` with `id` to get the current status and dates

3. **Get full document details**

   Call `pandadoc-get-document` with `id` to get:
   - Recipient list and completion status
   - Grand total (proposal value)
   - Expiration date
   - Tags and metadata

4. **Format and present** the status report

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| document_id | string | No* | - | PandaDoc document ID |
| document_name | string | No* | - | Document name to search for |

*Either `document_id` or `document_name` must be provided.

## Examples

### Check by Document ID

```
/document-status --document_id "msFYActMfJHqNTKH9tcPFa"
```

### Check by Document Name

```
/document-status --document_name "Acme Corp - MSA"
```

### Check a Specific Proposal

```
/document-status --document_name "Global Services - Network Upgrade SOW"
```

## Output

### Document Sent - Awaiting Signature

```
Document Status
================================================================

Document:       Acme Corp - Managed Services Agreement
Document ID:    msFYActMfJHqNTKH9tcPFa
Status:         SENT
Value:          $5,000.00/month

Created:        2026-02-20 10:30
Sent:           2026-02-20 14:30
Last Modified:  2026-02-21 09:15
Expires:        2026-03-06 (10 days remaining)

Recipients:
  1. John Smith <john@acme.com>
     Role: Client | Order: 1 | Status: NOT SIGNED
  2. Sarah Johnson <sarah@techforce.com>
     Role: MSP | Order: 2 | Status: WAITING (for #1)

Progress: 0 of 2 recipients completed

Next Steps:
  - Follow up with John Smith if no action within 3 business days
  - View in PandaDoc: https://app.pandadoc.com/a/#/documents/msFYActMfJHqNTKH9tcPFa
================================================================
```

### Document Viewed - Partially Signed

```
Document Status
================================================================

Document:       Acme Corp - Managed Services Agreement
Document ID:    msFYActMfJHqNTKH9tcPFa
Status:         VIEWED
Value:          $5,000.00/month

Created:        2026-02-20 10:30
Sent:           2026-02-20 14:30
Last Modified:  2026-02-22 11:45
Expires:        2026-03-06 (8 days remaining)

Recipients:
  1. John Smith <john@acme.com>
     Role: Client | Order: 1 | Status: SIGNED (2026-02-22 11:45)
  2. Sarah Johnson <sarah@techforce.com>
     Role: MSP | Order: 2 | Status: NOT SIGNED (notified)

Progress: 1 of 2 recipients completed

Next Steps:
  - Sarah Johnson has been notified to countersign
  - Document will be completed after MSP signature
================================================================
```

### Document Completed

```
Document Status
================================================================

Document:       Acme Corp - Managed Services Agreement
Document ID:    msFYActMfJHqNTKH9tcPFa
Status:         COMPLETED
Value:          $5,000.00/month

Created:        2026-02-20 10:30
Sent:           2026-02-20 14:30
Completed:      2026-02-22 15:30
Time to Sign:   2 days, 1 hour

Recipients:
  1. John Smith <john@acme.com>
     Role: Client | Order: 1 | Status: SIGNED (2026-02-22 11:45)
  2. Sarah Johnson <sarah@techforce.com>
     Role: MSP | Order: 2 | Status: SIGNED (2026-02-22 15:30)

Progress: 2 of 2 recipients completed - ALL SIGNED

Next Steps:
  - Download signed copy: pandadoc-download-document
  - Archive in your PSA or file system
  - Begin onboarding process
================================================================
```

### Document Declined

```
Document Status
================================================================

Document:       Metro Industries - Hardware Quote
Document ID:    htQ7xPmRnK2bVwYz9dLcEf
Status:         DECLINED
Value:          $15,780.00

Created:        2026-02-15 09:00
Sent:           2026-02-15 09:30
Declined:       2026-02-18 14:00

Recipients:
  1. David Park <david@metroindustries.com>
     Role: Client | Order: 1 | Status: DECLINED

Next Steps:
  - Contact David Park to understand the reason for declining
  - Revise the proposal with updated terms or pricing
  - Create a new document: /create-document --template "Hardware Quote"
================================================================
```

### Document Not Found

```
Document not found: "Unknown Document"

Suggestions:
  - Check spelling of the document name
  - Search recent documents in PandaDoc
  - Use the document ID directly if available
  - Check if the document was deleted or archived
```

## Status Reference

| Status | Display | Description |
|--------|---------|-------------|
| `document.draft` | DRAFT | Not yet sent |
| `document.sent` | SENT | Sent, awaiting action |
| `document.viewed` | VIEWED | Opened by at least one recipient |
| `document.completed` | COMPLETED | All signatures collected |
| `document.waiting_approval` | WAITING APPROVAL | Internal approval pending |
| `document.approved` | APPROVED | Internally approved |
| `document.rejected` | REJECTED | Internally rejected |
| `document.waiting_pay` | WAITING PAYMENT | Payment pending |
| `document.paid` | PAID | Payment collected |
| `document.voided` | VOIDED | Cancelled |
| `document.declined` | DECLINED | Recipient declined |
| `document.expired` | EXPIRED | Past expiration date |

## Error Handling

### MCP Connection Error

```
Error: Unable to connect to PandaDoc MCP server

Check your MCP configuration and regenerate the API key at app.pandadoc.com > Settings > API
```

### Rate Limit

```
Error: Rate limit exceeded (429)

Please wait a moment and try again.
PandaDoc allows 300 requests per minute (Business) or 600 (Enterprise).
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `pandadoc-list-documents` | Find document by name |
| `pandadoc-get-document` | Get full document details and recipients |
| `pandadoc-get-document-status` | Get current document status |

## Related Commands

- `/create-document` - Create a new document
- `/send-document` - Send a draft document for signature
- `/list-templates` - Browse templates for new documents
- `/proposal-pipeline` - View all proposals by status
