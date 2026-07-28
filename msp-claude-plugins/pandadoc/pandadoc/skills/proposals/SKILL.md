---
name: "PandaDoc Proposals"
description: >
  MSP proposal workflows in PandaDoc: proposal types and typical values (MSA,
  SOW, hardware quote, project proposal, security assessment, cloud migration),
  the standard MSP content-token set, managed-services and hardware pricing-table
  structures, mapping document statuses to sales-pipeline stages, and pipeline
  and stale-proposal tracking.
when_to_use: >-
  When drafting, sending, or tracking an MSP proposal or agreement, or reporting on the
  proposal pipeline. Use when: pandadoc proposal, msp
  proposal, managed services agreement, msa, statement of work, sow, hardware quote, project
  proposal, proposal pipeline, sales pipeline, proposal tracking, or client proposal.
---

# PandaDoc MSP Proposal Workflows

## Overview

MSPs use PandaDoc to create, send, and track proposals for managed services engagements. The proposal workflow covers the full lifecycle from initial client interest through signed contract -- creating professional proposals from templates, populating with client-specific content and pricing, sending for e-signature, and tracking the pipeline. PandaDoc's template system, content tokens, and pricing tables make it ideal for standardizing the MSP sales process while personalizing each proposal.

## MCP Tools

### Available Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `pandadoc-list-templates` | Find proposal templates | `q`, `tag`, `count`, `page` |
| `pandadoc-get-template` | Review template tokens and fields | `id` (required) |
| `pandadoc-create-document` | Create a proposal from template | `template_uuid`, `name`, `recipients`, `tokens`, `pricing_tables` |
| `pandadoc-send-document` | Send proposal for signature | `id`, `message`, `subject` |
| `pandadoc-list-documents` | Track proposals by status | `status`, `q`, `tag`, `count`, `order_by` |
| `pandadoc-get-document` | Get proposal details and recipient status | `id` (required) |
| `pandadoc-get-document-status` | Quick status check | `id` (required) |
| `pandadoc-download-document` | Download signed proposal | `id` (required) |

## Key Concepts

### MSP Proposal Types

| Proposal Type | Description | Typical Value | Template |
|---------------|-------------|---------------|----------|
| Managed Services Agreement (MSA) | Ongoing IT management contract | $3,000-$50,000/month | MSA template with pricing table |
| Statement of Work (SOW) | Project-based engagement | $5,000-$100,000 one-time | SOW template with milestones |
| Hardware Quote | Equipment and licensing proposal | $1,000-$500,000 | Quote template with line items |
| Project Proposal | IT project scope and pricing | $10,000-$250,000 | Proposal template with phases |
| Security Assessment | Cybersecurity evaluation proposal | $2,500-$25,000 | Security template |
| Cloud Migration | Cloud migration project scope | $15,000-$200,000 | Migration template with phases |

### Content Tokens for MSP Proposals

Standard tokens to define in MSP proposal templates:

| Token | Description | Example Value |
|-------|-------------|---------------|
| `Client.Company` | Client company name | Acme Corporation |
| `Client.Name` | Client contact name | John Smith |
| `Client.Title` | Client contact title | CEO |
| `Client.Email` | Client email | john@acme.com |
| `Client.Address` | Client address | 123 Main St, Springfield, IL 62704 |
| `Client.Phone` | Client phone | (555) 123-4567 |
| `Client.UserCount` | Number of users/endpoints | 50 |
| `MSP.Company` | Your MSP company name | TechForce IT Solutions |
| `MSP.Contact` | MSP contact name | Sarah Johnson |
| `MSP.Email` | MSP contact email | sarah@techforce.com |
| `MSP.Phone` | MSP phone | (555) 987-6543 |
| `Contract.StartDate` | Agreement start date | March 1, 2026 |
| `Contract.Term` | Agreement duration | 36 months |
| `Contract.RenewalTerms` | Auto-renewal language | 12-month auto-renewal periods |
| `SLA.ResponseTime` | SLA response time | 15 minutes for critical, 1 hour for high |
| `SLA.Uptime` | Uptime guarantee | 99.9% |
| `Proposal.ValidUntil` | Proposal expiration | March 15, 2026 |
| `Proposal.Number` | Proposal reference number | PROP-2026-0047 |

### Pricing Tables for MSP Services

#### Managed Services Pricing Table

```json
{
  "pricing_tables": [
    {
      "name": "Managed Services",
      "sections": [
        {
          "title": "Monthly Recurring Services",
          "rows": [
            {
              "data": {
                "name": "Managed IT Services - Per User",
                "description": "24/7 monitoring, helpdesk, patching, endpoint management",
                "price": 125.00,
                "qty": 50
              }
            },
            {
              "data": {
                "name": "Managed Security - Per User",
                "description": "EDR, email security, DNS filtering, SIEM",
                "price": 45.00,
                "qty": 50
              }
            },
            {
              "data": {
                "name": "Backup & Disaster Recovery",
                "description": "Cloud backup, 1-hour RPO, 4-hour RTO",
                "price": 500.00,
                "qty": 1
              }
            },
            {
              "data": {
                "name": "Microsoft 365 Management",
                "description": "License management, configuration, support",
                "price": 15.00,
                "qty": 50
              }
            }
          ]
        },
        {
          "title": "One-Time Setup",
          "rows": [
            {
              "data": {
                "name": "Onboarding & Migration",
                "description": "Documentation, agent deployment, policy configuration",
                "price": 5000.00,
                "qty": 1
              }
            }
          ]
        }
      ]
    }
  ]
}
```

#### Hardware Quote Pricing Table

```json
{
  "pricing_tables": [
    {
      "name": "Hardware & Licensing",
      "sections": [
        {
          "title": "Hardware",
          "rows": [
            {
              "data": {
                "name": "Dell OptiPlex 7020 Desktop",
                "description": "Intel i7, 16GB RAM, 512GB SSD, Win 11 Pro",
                "price": 1249.00,
                "qty": 10
              }
            },
            {
              "data": {
                "name": "Dell P2423D 24\" Monitor",
                "description": "QHD 2560x1440, USB-C, adjustable stand",
                "price": 329.00,
                "qty": 10
              }
            }
          ]
        },
        {
          "title": "Licensing",
          "rows": [
            {
              "data": {
                "name": "Microsoft 365 Business Premium",
                "description": "Annual commitment, per user/month",
                "price": 22.00,
                "qty": 50
              }
            }
          ]
        }
      ]
    }
  ]
}
```

### Proposal Pipeline Stages

Map PandaDoc document statuses to MSP sales pipeline stages:

| Pipeline Stage | PandaDoc Status | Action |
|---------------|-----------------|--------|
| Drafting | `document.draft` | Creating and reviewing the proposal |
| Internal Review | `document.waiting_approval` | MSP management approval |
| Sent to Client | `document.sent` | Awaiting client response |
| Client Reviewing | `document.viewed` | Client has opened the proposal |
| Won | `document.completed` | Client has signed |
| Lost - Declined | `document.declined` | Client declined to sign |
| Lost - Expired | `document.expired` | Proposal expired without action |
| Cancelled | `document.voided` | MSP voided the proposal |

## Common Workflows

### Create and Send an MSA

1. **Find the MSA template:**
   - Call `pandadoc-list-templates` with `q=Managed Services Agreement`
   - Select the appropriate template and note the `id`

2. **Review template requirements:**
   - Call `pandadoc-get-template` with the template `id`
   - Note required tokens, roles, and pricing table structure

3. **Create the document:**
   - Call `pandadoc-create-document` with:
     - `template_uuid` set to the template ID
     - `name` set to "Client Name - Managed Services Agreement"
     - `recipients` with client signer (order 1) and MSP signer (order 2)
     - `tokens` populated with client and contract details
     - `pricing_tables` with service line items

4. **Review the document:**
   - Call `pandadoc-get-document` with the returned `id`
   - Verify all tokens, recipients, and pricing are correct

5. **Send for signature:**
   - Call `pandadoc-send-document` with `id` and a personalized `message`

6. **Track progress:**
   - Call `pandadoc-get-document-status` to monitor signing progress

7. **Download signed copy:**
   - After completion, call `pandadoc-download-document` to archive the signed MSA

### Send a Project Proposal

1. Find the proposal template with `pandadoc-list-templates`
2. Create the document with project-specific tokens (timeline, budget, scope)
3. Include a pricing table with project phases and deliverables
4. Set expiration date to create urgency (e.g., 14 days)
5. Send with a cover message explaining the proposed solution
6. Follow up if not viewed within 3 business days

### Track the Proposal Pipeline

1. **Get draft proposals:**
   - Call `pandadoc-list-documents` with `status=document.draft`, `count=100`

2. **Get sent proposals:**
   - Call `pandadoc-list-documents` with `status=document.sent`, `count=100`

3. **Get viewed proposals:**
   - Call `pandadoc-list-documents` with `status=document.viewed`, `count=100`

4. **Get completed proposals:**
   - Call `pandadoc-list-documents` with `status=document.completed`, `count=100`

5. **Compile pipeline summary:**
   - Count documents by status
   - Sum `grand_total` amounts by status for pipeline value
   - Calculate average age of documents in each stage
   - Flag stale proposals (sent > 7 days, viewed > 3 days without completion)

### Handle a Stale Proposal

1. Identify proposals in `document.sent` or `document.viewed` status for more than 7 days
2. Check recipient completion to see who has not acted
3. Options:
   - Follow up with the client
   - Void the current proposal and create a revised version
   - Extend the expiration date
   - Accept the loss and move on

## Response Examples

**MSA Proposal Created:**

```json
{
  "id": "msFYActMfJHqNTKH9tcPFa",
  "name": "Acme Corp - Managed Services Agreement",
  "status": "document.draft",
  "date_created": "2026-02-24T10:30:00.000000Z",
  "recipients": [
    {
      "email": "john@acme.com",
      "first_name": "John",
      "last_name": "Smith",
      "role": "Client",
      "signing_order": 1,
      "has_completed": false
    },
    {
      "email": "sarah@techforce.com",
      "first_name": "Sarah",
      "last_name": "Johnson",
      "role": "MSP",
      "signing_order": 2,
      "has_completed": false
    }
  ],
  "grand_total": {
    "amount": "14250.00",
    "currency": "USD"
  }
}
```

**Pipeline Summary:**

```
Proposal Pipeline Summary
================================================================
Generated: 2026-02-24

Draft:      8 proposals   $127,500 total value
Sent:       12 proposals  $234,000 total value
Viewed:     5 proposals   $89,000 total value
Completed:  23 proposals  $412,000 total value (this quarter)
Declined:   3 proposals   $45,000 total value
Expired:    2 proposals   $18,000 total value

Win Rate: 76.7% (23 won / 30 resolved)
Avg. Time to Sign: 4.2 days
================================================================
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Template not found | MSA/SOW template does not exist | Create the template in PandaDoc first |
| Token mismatch | Token names don't match template | Get template details and use exact token names |
| Pricing table error | Table structure doesn't match template | Check template pricing table layout |
| Recipient role error | Role not defined in template | Verify template roles match recipient assignments |
| Expiration error | Invalid expiration date | Set expiration to a future date |

## Best Practices

1. **Standardize templates** - Create one template per proposal type and iterate on it
2. **Include pricing tables** - Always use structured pricing rather than static text
3. **Set expiration dates** - 14 days for proposals, 30 days for quotes, 60 days for MSAs
4. **Use signing order** - Client signs first, MSP countersigns after
5. **Personalize cover messages** - Reference the client's specific pain points or goals
6. **Tag proposals** - Tag with client name and document type for pipeline tracking
7. **Track pipeline weekly** - Review proposal pipeline at least weekly
8. **Follow up on viewed** - When a proposal is viewed, follow up within 24-48 hours
9. **Archive signed documents** - Download completed proposals to your PSA/file system
10. **Analyze win rates** - Track completed vs. declined/expired to improve proposal quality
11. **Use optional line items** - Mark non-essential services as optional to give clients flexibility
12. **Include SLA details** - Always reference SLA terms (response times, uptime) in service proposals
13. **Version proposals** - When revising, create a new document rather than voiding and recreating

## Related Skills

- [PandaDoc API Patterns](../api-patterns/SKILL.md) - MCP tools reference and connection info
- [PandaDoc Documents](../documents/SKILL.md) - Document creation and lifecycle
- [PandaDoc Templates](../templates/SKILL.md) - Template library for proposals
- [PandaDoc Recipients](../recipients/SKILL.md) - Recipient management for multi-party signing
