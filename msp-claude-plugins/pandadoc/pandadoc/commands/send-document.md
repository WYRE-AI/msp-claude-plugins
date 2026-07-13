---
description: Send a PandaDoc document for e-signature
argument-hint: "[document_id] [document_name] [message] [subject] [silent]"
arguments: [document_id, document_name, message, subject, silent]
---

# Send PandaDoc Document

Send a PandaDoc document to its recipients for e-signature. The document must be in draft status. Recipients will receive an email with a link to review and sign the document.

## Prerequisites

- PandaDoc MCP server connected with a valid API key
- MCP tools `pandadoc-list-documents`, `pandadoc-get-document`, `pandadoc-get-document-status`, and `pandadoc-send-document` available
- Document must exist and be in `document.draft` status
- Document must have at least one recipient

## Steps

1. **Resolve document** - Find the document by name or use the provided ID

   - If an ID was provided, call `pandadoc-get-document` with `id`
   - If a name was provided, call `pandadoc-list-documents` with `q` set to the document name

2. **Verify document is ready to send**

   Call `pandadoc-get-document-status` with `id` to confirm:
   - Status is `document.draft` (only drafts can be sent)
   - Document has at least one recipient

3. **Verify recipients**

   Call `pandadoc-get-document` with `id` to review:
   - All recipients have valid email addresses
   - Signing order is configured correctly
   - All required roles are assigned

4. **Send the document**

   Call `pandadoc-send-document` with:
   - `id` set to the document ID
   - `message` set to the cover message (optional)
   - `subject` set to the email subject (optional)
   - `silent` set to `true` if creating a signing link without email (optional)

5. **Confirm sending** by checking the updated status

   Call `pandadoc-get-document-status` with `id` to verify status changed to `document.sent`

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| document_id | string | No* | - | PandaDoc document ID |
| document_name | string | No* | - | Document name to search for |
| message | string | No | - | Cover message in the signature email |
| subject | string | No | - | Email subject line |
| silent | boolean | No | false | Create signing link without sending email |

*Either `document_id` or `document_name` must be provided.

## Examples

### Send by Document ID

```
/send-document --document_id "msFYActMfJHqNTKH9tcPFa"
```

### Send by Document Name

```
/send-document --document_name "Acme Corp - MSA"
```

### Send with Cover Message

```
/send-document --document_name "Acme Corp - MSA" --message "Hi John, please review and sign the attached managed services agreement. Let me know if you have any questions."
```

### Send with Custom Subject

```
/send-document --document_name "Acme Corp - MSA" --subject "Your Managed Services Agreement - Ready for Signature" --message "Please review the attached agreement at your convenience."
```

### Silent Send (Signing Link Only)

```
/send-document --document_id "msFYActMfJHqNTKH9tcPFa" --silent true
```

## Output

### Document Sent

```
Document Sent Successfully
================================================================

Document ID:    msFYActMfJHqNTKH9tcPFa
Name:           Acme Corp - Managed Services Agreement
Status:         Sent
Sent:           2026-02-24T14:30:00.000Z

Recipients:
  1. John Smith <john@acme.com> - Client (Order: 1) - Awaiting signature
  2. Sarah Johnson <sarah@techforce.com> - MSP (Order: 2) - Waiting for #1

Cover Message:  "Hi John, please review and sign the attached managed
                 services agreement. Let me know if you have any questions."

Next Steps:
  - Check status: /document-status --document_id "msFYActMfJHqNTKH9tcPFa"
  - View in PandaDoc: https://app.pandadoc.com/a/#/documents/msFYActMfJHqNTKH9tcPFa
================================================================
```

### Document Not in Draft Status

```
Cannot Send: Document is not in draft status

Document:  Acme Corp - Managed Services Agreement
Status:    document.sent (already sent)

The document has already been sent to recipients.

Options:
  - Check current status: /document-status --document_id "msFYActMfJHqNTKH9tcPFa"
  - To send a revised version, void this document and create a new one
```

### No Recipients

```
Cannot Send: Document has no recipients

Document:  Acme Corp - Managed Services Agreement
Status:    document.draft

Add recipients before sending. Use pandadoc-add-recipient or recreate
the document with recipients:

/create-document --template "MSA" --recipient_email "john@acme.com" --recipient_name "John Smith"
```

### Document Not Found

```
Document not found: "Unknown Document"

Suggestions:
  - Check spelling of the document name
  - Search by partial name
  - Use the document ID directly
  - Check recently created documents: /document-status
```

### Multiple Documents Found

```
Multiple documents found matching "Acme Corp"

+--------------------------------------------+-------------------+---------------------+
| Name                                       | Status            | Created             |
+--------------------------------------------+-------------------+---------------------+
| Acme Corp - Managed Services Agreement     | document.draft    | 2026-02-24 10:30    |
| Acme Corp - Hardware Quote Q1              | document.draft    | 2026-02-23 16:45    |
| Acme Corp - SOW Network Upgrade            | document.sent     | 2026-02-20 09:15    |
+--------------------------------------------+-------------------+---------------------+

Please specify the document ID:
  /send-document --document_id "msFYActMfJHqNTKH9tcPFa"
```

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

### Permission Error

```
Error: Insufficient permissions to send this document

Your API key may not have send permissions. Check the API key scope in
PandaDoc Settings > API or contact your PandaDoc workspace admin.
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `pandadoc-list-documents` | Find document by name |
| `pandadoc-get-document` | Get document details and verify recipients |
| `pandadoc-get-document-status` | Verify document is in draft status |
| `pandadoc-send-document` | Send the document for signature |

## Related Commands

- `/create-document` - Create a document before sending
- `/document-status` - Check document status after sending
- `/list-templates` - Find templates for new documents
- `/proposal-pipeline` - View all proposals in the pipeline
