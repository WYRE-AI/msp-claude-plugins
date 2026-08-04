---
name: "PandaDoc Recipients"
description: >
  PandaDoc recipients and e-signature mechanics: recipient roles (signer,
  approver, viewer, CC), signing-order behavior, multi-party MSP signing
  scenarios, completion tracking via `has_completed`, recipient fields, and
  the document statuses that restrict adding or changing recipients.
when_to_use: >-
  When adding recipients to a document, setting signing order, checking who has signed, or
  planning a multi-party agreement. Use when: pandadoc recipient,
  pandadoc signer, pandadoc signing, pandadoc signature, signing order, who signed, signature
  status, recipient role, multi-signer, e-sign, or esignature.
---

# PandaDoc Recipient & Signature Management

## Overview

Recipients in PandaDoc are the people who receive, view, and sign documents. In MSP engagements, documents typically involve multiple parties -- the client decision-maker who signs the agreement, sometimes a technical contact who reviews, and the MSP representative who countersigns. PandaDoc supports complex signing workflows with ordered signing, role-based assignments, and real-time completion tracking. Understanding recipient management is essential for smooth contract execution.

## Anti-triggers

- **Creating, sending, or downloading the document itself** — use
  `pandadoc-documents`.
- **A contact record in the CRM** — a PandaDoc recipient is an email address
  attached to one document, not a stored contact; use `hubspot-contacts` or
  `salesbuildr-companies-contacts`.

## MCP Tools

### Available Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `pandadoc-create-document` | Create document with recipients | `recipients` array in document creation |
| `pandadoc-add-recipient` | Add a recipient to an existing document | `document_id`, `email`, `first_name`, `last_name`, `role`, `signing_order` |
| `pandadoc-get-document` | Get document with recipient details | `id` (required) |
| `pandadoc-get-document-status` | Check recipient completion status | `id` (required) |

### Add Recipients During Document Creation

When calling `pandadoc-create-document`, include the `recipients` array:

```json
{
  "recipients": [
    {
      "email": "john@acme.com",
      "first_name": "John",
      "last_name": "Smith",
      "role": "Client",
      "signing_order": 1
    },
    {
      "email": "sarah@techforce.com",
      "first_name": "Sarah",
      "last_name": "Johnson",
      "role": "MSP",
      "signing_order": 2
    }
  ]
}
```

### Add a Recipient to an Existing Document

Call `pandadoc-add-recipient` with:

- **Document:** Set `document_id` to the document ID (required)
- **Email:** Set `email` to the recipient's email address
- **Name:** Set `first_name` and `last_name`
- **Role:** Set `role` to match a role defined in the template
- **Order:** Set `signing_order` to control when they sign

**Example: Add a co-signer:**
- `pandadoc-add-recipient` with `document_id=msFYActMfJHqNTKH9tcPFa`, `email="cfo@acme.com"`, `first_name="Lisa"`, `last_name="Chen"`, `role="Approver"`, `signing_order=2`

### Check Recipient Completion

Call `pandadoc-get-document` with the document `id` to see recipient status:

- Review the `recipients` array
- Check `has_completed` for each recipient
- `true` means the recipient has completed their signing action
- `false` means they have not yet signed

## Key Concepts

### Recipient Roles

Roles define what actions a recipient takes on the document:

| Role | Description | Common Use |
|------|-------------|-----------|
| Signer | Must sign the document | Client decision-maker, MSP authorized representative |
| Approver | Must approve before sending | Internal review (e.g., MSP manager approval) |
| Viewer | Can view but not sign | CC'd stakeholders, technical contacts |
| CC | Receives a copy after completion | Accounting, project managers |

### Signing Order

Signing order controls the sequence in which recipients receive and sign the document:

| Order | Description | Example |
|-------|-------------|---------|
| 1 | Signs first | Client CEO signs the MSA |
| 2 | Signs second (after #1 completes) | MSP owner countersigns |
| 3 | Signs third | Witness or notary (if required) |

When signing order is set:
- Recipient #1 receives the document first
- Recipient #2 is notified only after #1 has completed
- This ensures proper document flow and prevents premature signing

When signing order is not set (or all set to the same value):
- All recipients receive the document simultaneously
- Any recipient can sign in any order

### Multi-Party MSP Agreements

Common multi-party signing scenarios for MSPs:

| Scenario | Signers | Signing Order |
|----------|---------|---------------|
| Simple MSA | Client + MSP | Client signs first (1), MSP countersigns (2) |
| Board-approved MSA | Client + Board + MSP | Client signs (1), Board approves (2), MSP signs (3) |
| Multi-site SOW | Client HQ + Branch Manager + MSP | HQ signs (1), Branch signs (1), MSP countersigns (2) |
| Vendor agreement | Client + MSP + Vendor | Client signs (1), Vendor signs (2), MSP signs (3) |
| Internal review | MSP Tech + MSP Manager | Tech reviews (1), Manager approves (2), then send to client |

### Completion Tracking

Track the progress of document signing across all recipients:

| Status | Meaning |
|--------|---------|
| `has_completed: false` | Recipient has not yet signed |
| `has_completed: true` | Recipient has completed their action |
| All recipients completed | Document status changes to `document.completed` |

## Field Reference

### Recipient Fields

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | Recipient email address (required) |
| `first_name` | string | Recipient first name |
| `last_name` | string | Recipient last name |
| `role` | string | Recipient role (must match template role) |
| `signing_order` | integer | Signing sequence (1, 2, 3...) |
| `has_completed` | boolean | Whether the recipient has completed their action |
| `recipient_type` | string | Type of recipient (signer, approver, viewer, cc) |

## Common Workflows

### Set Up a Standard MSP Contract Signing

1. Create document with `pandadoc-create-document` including two recipients:
   - Client signer with `signing_order=1`
   - MSP signer with `signing_order=2`
2. Send the document with `pandadoc-send-document`
3. Client receives the document and signs
4. MSP representative is automatically notified to countersign
5. Document status changes to `document.completed`

### Add a Recipient After Document Creation

1. Get the document with `pandadoc-get-document` to review current recipients
2. Call `pandadoc-add-recipient` with the new recipient's details
3. Verify the recipient was added by calling `pandadoc-get-document` again

### Check Who Has Signed

1. Call `pandadoc-get-document` with the document `id`
2. Review the `recipients` array
3. For each recipient, check `has_completed`:
   - `true` = signed
   - `false` = waiting for signature
4. Report the signing progress

### Follow Up on Unsigned Documents

1. Call `pandadoc-list-documents` with `status=document.sent` to find sent documents
2. For each document, call `pandadoc-get-document` to check recipient completion
3. Identify recipients where `has_completed=false`
4. Flag documents that have been waiting more than 3-5 business days

### Handle a Declined Document

1. When a document status is `document.declined`:
   - Contact the recipient to understand their concerns
   - Address the issues (modify terms, pricing, scope)
   - Create a new document from the same template with updated content
   - Send the new document to the same recipients

## Response Examples

**Document with Recipients:**

```json
{
  "id": "msFYActMfJHqNTKH9tcPFa",
  "name": "Acme Corp - Managed Services Agreement",
  "status": "document.sent",
  "recipients": [
    {
      "email": "john@acme.com",
      "first_name": "John",
      "last_name": "Smith",
      "role": "Client",
      "signing_order": 1,
      "has_completed": true
    },
    {
      "email": "sarah@techforce.com",
      "first_name": "Sarah",
      "last_name": "Johnson",
      "role": "MSP",
      "signing_order": 2,
      "has_completed": false
    }
  ]
}
```

**Recipient Added:**

```json
{
  "email": "cfo@acme.com",
  "first_name": "Lisa",
  "last_name": "Chen",
  "role": "Approver",
  "signing_order": 2,
  "has_completed": false
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Invalid email | Email format is incorrect | Verify the email address format |
| Role not found | Role does not exist in template | Check template roles with `pandadoc-get-template` |
| Duplicate recipient | Email already added to document | Check existing recipients before adding |
| Cannot add recipient | Document already sent or completed | Recipients must be added before sending |
| Invalid signing order | Signing order conflicts | Ensure signing orders are sequential positive integers |

### Recipient Addition Restrictions

| Document Status | Can Add Recipients? | Notes |
|----------------|--------------------|----|
| `document.draft` | Yes | Recipients can be freely added and modified |
| `document.sent` | Limited | Some changes may require voiding and recreating |
| `document.completed` | No | Document is finalized |
| `document.voided` | No | Document is cancelled |

## Best Practices

1. **Add all recipients during creation** - Include recipients in `pandadoc-create-document` rather than adding after
2. **Use signing order** - Always set signing order for multi-party agreements
3. **Match template roles** - Ensure recipient roles match the roles defined in the template
4. **Track completion actively** - Check recipient completion status regularly for sent documents
5. **Use viewer role for CC** - Add stakeholders as viewers rather than signers when they don't need to sign
6. **Plan signing flow** - For complex agreements, map out the signing order before creating the document
7. **Document recipient changes** - Note any changes to recipients in your PSA or CRM

## Related Skills

- [PandaDoc API Patterns](../api-patterns/SKILL.md) - MCP tools reference and connection info
- [PandaDoc Documents](../documents/SKILL.md) - Document creation and management
- [PandaDoc Templates](../templates/SKILL.md) - Template roles and fields
- [PandaDoc Proposals](../proposals/SKILL.md) - MSP proposal workflows with recipients
