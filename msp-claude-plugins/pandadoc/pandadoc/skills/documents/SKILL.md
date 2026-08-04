---
name: "PandaDoc Documents"
description: >
  PandaDoc document lifecycle end to end: creating documents from templates,
  sending for e-signature, status checks and PDF downloads, the full document
  status enum, MSP document types, content tokens, pricing-table structure,
  document and recipient fields, and status-transition errors.
when_to_use: >-
  When creating, sending, tracking, or downloading a PandaDoc document — proposals, quotes,
  contracts, SOWs, or MSAs. Use when: pandadoc document,
  pandadoc proposal, pandadoc contract, pandadoc quote, pandadoc sign, pandadoc signature,
  pandadoc send, pandadoc status, pandadoc download, pandadoc create document, document lifecycle,
  or e-signature.
---

# PandaDoc Document Management

## Overview

Documents in PandaDoc represent proposals, quotes, contracts, statements of work (SOWs), managed service agreements (MSAs), and any other business documents that need to be created, sent, signed, and tracked. MSPs use PandaDoc documents to formalize client engagements -- from initial proposals through signed contracts. Documents are typically created from templates, populated with client-specific content, sent for e-signature, and archived after completion.

## Anti-triggers

- **Choosing or inspecting the blueprint before a document exists** — use
  `pandadoc-templates`.
- **Who signs, in what order, and whether they have signed** — use
  `pandadoc-recipients`.
- **The MSP sales motion layered over these same tools** — proposal types,
  token conventions, and pipeline reporting are `pandadoc-proposals`.
- **Building or pricing the offer** — PandaDoc renders and sends an
  already-priced proposal; catalog and margin work happens in
  `salesbuildr-quotes`, `connectwise-cpq-quotes`, or
  `kaseya-quote-manager-quotes`.
- **Searching PandaDoc's developer documentation** — `pandadoc-search-docs`
  searches the docs site, not your account; use `pandadoc-api-patterns`.

## MCP Tools

### Available Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `pandadoc-list-documents` | List and filter documents | `status`, `q`, `tag`, `count`, `page`, `order_by`, `template_id`, `folder_uuid` |
| `pandadoc-get-document` | Get full document details | `id` (required) |
| `pandadoc-get-document-status` | Get document status | `id` (required) |
| `pandadoc-create-document` | Create a document from template | `template_uuid`, `name`, `recipients`, `tokens`, `fields`, `pricing_tables`, `folder_uuid` |
| `pandadoc-send-document` | Send a document for signature | `id` (required), `message`, `subject`, `silent` |
| `pandadoc-download-document` | Download a completed document | `id` (required) |

### Create a Document

Call `pandadoc-create-document` with:

- **Template:** Set `template_uuid` to the template ID
- **Name:** Set `name` to the document title (e.g., "Acme Corp - Managed Services Agreement")
- **Recipients:** Provide `recipients` array with `email`, `first_name`, `last_name`, `role`, and optionally `signing_order`
- **Content tokens:** Set `tokens` array with `name` and `value` pairs to populate template variables
- **Pricing tables:** Set `pricing_tables` to populate line items with services and pricing
- **Folder:** Optionally set `folder_uuid` to organize the document

**Example: Create an MSA from template:**
- `pandadoc-create-document` with `template_uuid=abc123`, `name="Acme Corp - MSA"`, `recipients=[{"email":"john@acme.com","first_name":"John","last_name":"Smith","role":"Client"}]`, `tokens=[{"name":"Client.Company","value":"Acme Corporation"}]`

### List Documents

Call `pandadoc-list-documents` with optional parameters:

- **Search by name:** Set `q` to a document name or keyword
- **Filter by status:** Set `status` to a document status value (see status reference below)
- **Filter by tag:** Set `tag` to a document tag
- **Sort:** Set `order_by` to `date_created`, `date_modified`, `name`, or `date_status_changed`
- **Paginate:** Set `page` (1-based) and `count` (up to 100)

**Example: List all sent documents:**
- `pandadoc-list-documents` with `status=document.sent`, `count=100`

**Example: Search for a client's documents:**
- `pandadoc-list-documents` with `q=Acme Corp`, `count=100`

### Get Document Details

Call `pandadoc-get-document` with the `id` parameter to get full document details including recipients, tokens, pricing, and metadata.

### Check Document Status

Call `pandadoc-get-document-status` with the `id` parameter to get the current status and recipient completion information.

### Send a Document

Call `pandadoc-send-document` with:

- **Document ID:** Set `id` to the document ID (required)
- **Message:** Optionally set `message` for the email body
- **Subject:** Optionally set `subject` for the email subject line
- **Silent:** Set `silent=true` to create a signing link without sending an email

**Example: Send with a cover message:**
- `pandadoc-send-document` with `id=msFYActMfJHqNTKH9tcPFa`, `message="Please review and sign the attached managed services agreement."`, `subject="MSA for your review - Acme Corp"`

### Download a Document

Call `pandadoc-download-document` with the `id` parameter to download the completed, signed document as a PDF.

## Key Concepts

### Document Lifecycle

```
Template --> Create (Draft) --> Send --> Viewed --> Completed (Signed)
                  |                        |              |
            waiting_approval         declined        download
                  |                  rejected
               approved              expired
                  |
                voided
```

### Document Statuses

| Status | API Value | Description |
|--------|-----------|-------------|
| Draft | `document.draft` | Created but not yet sent to recipients |
| Sent | `document.sent` | Sent to recipients, awaiting action |
| Completed | `document.completed` | All recipients have signed |
| Viewed | `document.viewed` | At least one recipient has opened the document |
| Waiting Approval | `document.waiting_approval` | Internal approval required before sending |
| Approved | `document.approved` | Internal approval granted |
| Rejected | `document.rejected` | Internal approval rejected |
| Waiting Payment | `document.waiting_pay` | Payment collection pending |
| Paid | `document.paid` | Payment collected |
| Voided | `document.voided` | Document cancelled/voided after sending |
| Declined | `document.declined` | Recipient declined to sign |
| Expired | `document.expired` | Document passed its expiration date |

### Document Types for MSPs

| Type | Description | Typical Template |
|------|-------------|-----------------|
| MSA | Managed Service Agreement | Long-term IT management contract |
| SOW | Statement of Work | Project-specific deliverables and scope |
| Proposal | Service proposal | Proposed services with pricing |
| Quote | Hardware/software quote | Line-item pricing for products |
| NDA | Non-disclosure agreement | Confidentiality before engagement |
| Change Order | Scope change request | Modifications to existing agreements |

### Content Tokens

Tokens are template variables that get replaced with client-specific values when creating a document:

| Token Pattern | Example Value | Use Case |
|---------------|---------------|----------|
| `Client.Company` | Acme Corporation | Client company name |
| `Client.Name` | John Smith | Client contact name |
| `Client.Email` | john@acme.com | Client email |
| `Client.Address` | 123 Main St, Springfield, IL | Client address |
| `MSP.Company` | TechForce IT Solutions | Your MSP name |
| `Contract.StartDate` | March 1, 2026 | Agreement start date |
| `Contract.Term` | 12 months | Agreement duration |
| `Contract.Value` | $5,000/month | Monthly recurring revenue |

### Pricing Tables

Pricing tables contain line items for services and products:

```json
{
  "pricing_tables": [
    {
      "name": "Services",
      "sections": [
        {
          "rows": [
            {
              "options": {
                "optional": false,
                "optional_selected": true
              },
              "data": {
                "name": "Managed IT Services - Per User",
                "description": "24/7 monitoring, helpdesk, patching, endpoint security",
                "price": 125.00,
                "qty": 50,
                "discount": 0
              }
            },
            {
              "data": {
                "name": "Backup & Disaster Recovery",
                "description": "Cloud backup with 1-hour RPO, 4-hour RTO",
                "price": 250.00,
                "qty": 1,
                "discount": 0
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## Field Reference

### Document Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Document unique identifier |
| `name` | string | Document display name |
| `status` | string | Current document status |
| `date_created` | datetime | When the document was created |
| `date_modified` | datetime | When the document was last modified |
| `date_completed` | datetime | When all signatures were collected |
| `expiration_date` | datetime | When the document expires |
| `version` | string | Document version number |
| `template` | object | Source template reference |
| `recipients` | array | List of document recipients |
| `tokens` | array | Content token values |
| `pricing` | object | Pricing tables and totals |
| `grand_total` | object | Document total amount and currency |
| `tags` | array | Document tags for organization |
| `folder_uuid` | string | Folder the document belongs to |

### Recipient Fields

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | Recipient email address |
| `first_name` | string | Recipient first name |
| `last_name` | string | Recipient last name |
| `role` | string | Recipient role (e.g., "Client", "Signer", "Approver") |
| `signing_order` | integer | Order in which recipient signs (1, 2, 3...) |
| `has_completed` | boolean | Whether recipient has completed their action |

## Common Workflows

### Create and Send a Proposal

1. Find the appropriate template with `pandadoc-list-templates` using `q` to search
2. Call `pandadoc-create-document` with `template_uuid`, `name`, `recipients`, and `tokens`
3. Verify the document was created by calling `pandadoc-get-document` with the returned `id`
4. Call `pandadoc-send-document` with `id` and an optional cover `message`

### Check Document Status

1. Search for the document with `pandadoc-list-documents` using `q` set to the document name
2. Call `pandadoc-get-document-status` with `id` to get current status
3. Review `recipients` to see who has and has not signed

### Download a Signed Document

1. Verify the document status is `document.completed` using `pandadoc-get-document-status`
2. Call `pandadoc-download-document` with `id` to get the signed PDF

### Track All Sent Documents

1. Call `pandadoc-list-documents` with `status=document.sent` and `count=100`
2. For each document, check `date_created` to calculate age
3. Flag documents that have been sent for more than 7 days without action

### Void a Stale Proposal

1. Find the document with `pandadoc-list-documents`
2. Verify it is in a sent or viewed state
3. The document can be voided through the PandaDoc UI or API

## Response Examples

**Document:**

```json
{
  "id": "msFYActMfJHqNTKH9tcPFa",
  "name": "Acme Corp - Managed Services Agreement",
  "status": "document.sent",
  "date_created": "2026-01-15T10:30:00.000000Z",
  "date_modified": "2026-01-16T14:22:00.000000Z",
  "expiration_date": "2026-02-15T00:00:00.000000Z",
  "version": "2",
  "recipients": [
    {
      "email": "john@acme.com",
      "first_name": "John",
      "last_name": "Smith",
      "role": "Client",
      "signing_order": 1,
      "has_completed": false
    }
  ],
  "grand_total": {
    "amount": "5000.00",
    "currency": "USD"
  }
}
```

**Document Status:**

```json
{
  "id": "msFYActMfJHqNTKH9tcPFa",
  "status": "document.viewed",
  "date_created": "2026-01-15T10:30:00.000000Z",
  "date_modified": "2026-01-17T09:15:00.000000Z"
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Document not found | Invalid document ID | Verify the ID with `pandadoc-list-documents` |
| Cannot send document | Document not in draft status | Check status -- only drafts can be sent |
| Cannot download | Document not completed | Wait for all recipients to sign |
| Template not found | Invalid template UUID | Verify with `pandadoc-list-templates` |
| Invalid recipient | Missing or invalid email | Ensure all recipients have valid email addresses |
| Token not found | Token name does not match template | Check template for exact token names |

### Status Transition Errors

| Current Status | Attempted Action | Notes |
|----------------|-----------------|-------|
| `document.sent` | Create | Document already exists -- modify or void instead |
| `document.completed` | Send | Already completed -- download instead |
| `document.voided` | Send | Cannot send a voided document -- create a new one |
| `document.expired` | Send | Cannot send expired -- create a new document |
| `document.declined` | Send | Recipient declined -- create a new document or void and recreate |

## Best Practices

1. **Use templates** - Always create documents from templates for consistency and branding
2. **Name documents clearly** - Use a pattern like "Company Name - Document Type" for easy searching
3. **Set expiration dates** - Add expiration to proposals to create urgency and keep pipeline clean
4. **Tag documents** - Use tags for client name, document type, and project for easy filtering
5. **Include cover messages** - Personalize the email when sending for signature
6. **Archive completed documents** - Download and archive signed documents in your PSA or file system
7. **Use signing order** - For multi-party agreements, set signing order to control the flow
8. **Track grand totals** - Use the `grand_total` field to track proposal values in your pipeline

## Related Skills

- [PandaDoc API Patterns](../api-patterns/SKILL.md) - MCP tools reference and connection info
- [PandaDoc Templates](../templates/SKILL.md) - Template library and management
- [PandaDoc Recipients](../recipients/SKILL.md) - Recipient and signature management
- [PandaDoc Proposals](../proposals/SKILL.md) - MSP proposal workflows
