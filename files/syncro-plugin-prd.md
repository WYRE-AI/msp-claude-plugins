# Syncro Claude Code Plugin

## Product Requirements Document

**Version:** 1.0
**Author:** Aaron / WYRE AI
**Date:** February 4, 2026
**Status:** Draft
**Repository:** `syncro/syncro` (within msp-claude-plugins)
**Parent Project:** MSP Claude Plugin Marketplace

---

## Executive Summary

The Syncro Claude Code Plugin provides comprehensive skills and commands for interacting with Syncro, the all-in-one PSA, RMM, and invoicing platform for MSPs. It enables Claude to assist with managing customers, tickets, assets, invoicing, and remote monitoring across the unified Syncro platform.

The plugin leverages the `node-syncro` library for API connectivity and follows the established plugin architecture pattern from the Autotask plugin.

---

## Problem Statement

Syncro is an integrated PSA/RMM platform designed specifically for MSPs, combining ticketing, customer management, asset tracking, invoicing, and remote monitoring in a single system. Technicians frequently need to:

- Look up customer details and contact information
- Create and manage support tickets
- Search and view asset/device information
- Access and create invoices
- Run scripts and manage RMM agents
- View alerts and monitoring data

Without Claude skills for Syncro, technicians must navigate the Syncro interface separately, reducing efficiency during service delivery and troubleshooting.

---

## Goals

1. **Comprehensive Skills** — Cover all major Syncro domains (customers, tickets, assets, invoicing, RMM, API patterns)
2. **Practical Commands** — Provide slash commands for common operations (lookup-customer, create-ticket, search-assets, get-invoice)
3. **API Integration** — Integrate with node-syncro library via MCP server
4. **Unified Platform** — Leverage Syncro's integrated PSA+RMM architecture for cross-domain workflows
5. **Invoice Automation** — Support invoice creation and management workflows

---

## Technical Specifications

### Directory Structure

```
syncro/syncro/
├── .claude-plugin/
│   └── plugin.json
├── .mcp.json
├── README.md
├── skills/
│   ├── ticketing/
│   │   └── SKILL.md
│   ├── customers/
│   │   └── SKILL.md
│   ├── assets/
│   │   └── SKILL.md
│   ├── invoicing/
│   │   └── SKILL.md
│   ├── rmm/
│   │   └── SKILL.md
│   └── api-patterns/
│       └── SKILL.md
└── commands/
    ├── lookup-customer.md
    ├── create-ticket.md
    ├── search-assets.md
    └── get-invoice.md
```

### Plugin Manifest (plugin.json)

```json
{
  "name": "syncro",
  "version": "1.0.0",
  "description": "Claude plugins for Syncro PSA/RMM - ticketing, customers, assets, invoicing, remote monitoring",
  "author": "MSP Claude Plugins Community",
  "vendor": "syncro",
  "product": "syncro",
  "api_version": "v1",
  "requires_api_key": true,
  "documentation_url": "https://api-docs.syncromsp.com/",
  "skills": [
    "ticketing",
    "customers",
    "assets",
    "invoicing",
    "rmm",
    "api-patterns"
  ],
  "commands": [
    "lookup-customer",
    "create-ticket",
    "search-assets",
    "get-invoice"
  ]
}
```

### MCP Configuration (.mcp.json)

```json
{
  "mcpServers": {
    "syncro": {
      "command": "npx",
      "args": ["-y", "syncro-mcp"],
      "env": {
        "SYNCRO_API_KEY": "${SYNCRO_API_KEY}",
        "SYNCRO_SUBDOMAIN": "${SYNCRO_SUBDOMAIN}"
      }
    }
  }
}
```

---

## Skills Specification

### 1. Ticketing Skill

**Purpose:** Managing support tickets in Syncro

**Key Content:**
- Ticket structure (id, number, subject, status, priority)
- Ticket statuses (New, In Progress, Waiting, Resolved, Closed)
- Ticket priorities (Low, Medium, High, Urgent)
- Ticket types and categories
- Problem types (built-in and custom)
- Time entries and billing
- Ticket comments and internal notes
- Ticket assignments (users and teams)
- Related assets and contacts
- SLA tracking and due dates
- Ticket automation rules
- API patterns for ticket CRUD operations

**Triggers:**
- syncro ticket
- syncro support
- create ticket
- ticket status
- ticket lookup

### 2. Customers Skill

**Purpose:** Managing customers (clients) and contacts in Syncro

**Key Content:**
- Customer structure (id, name, business_name, email)
- Customer types and classifications
- Contact management (primary, billing, technical)
- Contact fields (name, email, phone, title)
- Customer addresses (billing, service)
- Custom fields for customers
- Customer notes and activity
- Associated assets and tickets
- Recurring invoices by customer
- API patterns for customer management

**Triggers:**
- syncro customer
- syncro client
- customer lookup
- contact management
- client search

### 3. Assets Skill

**Purpose:** Managing assets and devices in Syncro

**Key Content:**
- Asset structure (id, name, asset_type, serial)
- Asset types (Computer, Mobile, Network, Printer, Other)
- Asset fields (serial_number, model, manufacturer)
- RMM agent association
- Asset custom fields
- Warranty tracking
- Asset notes and activity
- Customer assignment
- Software inventory (via RMM)
- Hardware specifications (via RMM)
- Asset lifecycle management
- API patterns for asset operations

**Triggers:**
- syncro asset
- syncro device
- asset lookup
- device search
- inventory management

### 4. Invoicing Skill

**Purpose:** Managing invoices and billing in Syncro

**Key Content:**
- Invoice structure (id, number, status, total)
- Invoice statuses (Draft, Sent, Viewed, Paid, Void)
- Invoice line items (products, services, time entries)
- Products and pricing
- Recurring invoices
- Payment methods and integrations
- Tax settings and calculations
- Invoice templates
- Payment reminders
- Invoice reports
- Stripe/payment processor integration
- API patterns for invoice management

**Triggers:**
- syncro invoice
- syncro billing
- create invoice
- invoice status
- payment tracking

### 5. RMM Skill

**Purpose:** Managing remote monitoring and management features in Syncro

**Key Content:**
- RMM agent structure and deployment
- Agent statuses (Online, Offline, Needs Attention)
- Remote access (Splashtop, ScreenConnect integration)
- Script execution and management
- Policy management
- Patch management
- Monitoring and alerts
- Alert types and thresholds
- Background tools
- Command execution
- System information retrieval
- API patterns for RMM operations

**Triggers:**
- syncro rmm
- syncro agent
- remote monitoring
- script execution
- rmm alerts

### 6. API Patterns Skill

**Purpose:** Foundation skill for Syncro API interactions

**Key Content:**
- Authentication (API key in header)
- Base URL structure (https://{subdomain}.syncromsp.com/api/v1)
- RESTful API conventions
- Pagination (page, per_page, total_pages)
- Filtering with query parameters
- Sorting and ordering
- Rate limiting considerations
- Response structure (JSON)
- Error handling (400, 401, 403, 404, 422)
- Webhook integrations
- Common endpoints reference

**Triggers:**
- syncro api
- syncro query
- syncro authentication
- api integration

---

## Commands Specification

### 1. lookup-customer Command

**Purpose:** Find a customer by name, email, or phone

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| query | Yes | Customer name, email, or phone number |
| include-contacts | No | Include contact details in results |

**Example:**
```
/lookup-customer "Acme Corp"
/lookup-customer "john@acme.com" --include-contacts
```

**Output:** Customer details including business name, contacts, asset count, open tickets

### 2. create-ticket Command

**Purpose:** Create a new support ticket

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| subject | Yes | Ticket subject line |
| customer | Yes | Customer name or ID |
| description | No | Ticket description/body |
| priority | No | Priority (low, medium, high, urgent) |
| problem-type | No | Problem type category |

**Example:**
```
/create-ticket "Email not syncing" --customer "Acme Corp" --priority high
/create-ticket "New user setup" --customer "123" --description "Setup new employee John Smith"
```

**Output:** Created ticket number, ID, and direct link

### 3. search-assets Command

**Purpose:** Search for assets by name, serial, or customer

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| query | Yes | Asset name, serial number, or hostname |
| customer | No | Filter by customer name |
| type | No | Filter by asset type |
| status | No | Filter by RMM status (online, offline) |

**Example:**
```
/search-assets "ACME-WS01"
/search-assets --customer "Acme Corp" --type computer --status online
```

**Output:** Asset list with name, type, customer, RMM status, last seen

### 4. get-invoice Command

**Purpose:** Retrieve invoice details

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| invoice | Yes | Invoice number or ID |
| customer | No | Customer name to filter invoices |
| status | No | Filter by status (draft, sent, paid) |

**Example:**
```
/get-invoice "INV-1234"
/get-invoice --customer "Acme Corp" --status sent
```

**Output:** Invoice details including line items, total, status, payment information

---

## Implementation Phases

### Phase 1 — Plugin Structure & Foundation
- Create directory structure
- Create plugin.json manifest
- Create .mcp.json configuration
- Create api-patterns skill
- Create README.md

### Phase 2 — Core Skills
- Create customers skill
- Create ticketing skill
- Create assets skill

### Phase 3 — Billing & RMM Skills
- Create invoicing skill
- Create rmm skill

### Phase 4 — Commands
- Create lookup-customer command
- Create create-ticket command
- Create search-assets command
- Create get-invoice command

### Phase 5 — Testing & Documentation
- Validate all skills have required sections
- Validate all commands have required arguments
- Test MCP integration
- Update marketplace.json with new plugin
- Create comprehensive README

---

## Syncro-Specific Considerations

### Unified Platform
Syncro combines PSA and RMM in a single platform, which means:
- Assets and RMM agents are tightly integrated
- Tickets can be automatically linked to assets and alerts
- Invoicing is directly tied to time entries on tickets
- Customer records span both PSA and RMM contexts

### API Characteristics
- Simple REST API with API key authentication
- Subdomain-based multi-tenancy
- Good documentation at api-docs.syncromsp.com
- Webhooks available for event-driven integrations

### Common Workflows
1. **Alert to Ticket**: RMM alert triggers ticket creation
2. **Time to Invoice**: Ticket time entries flow to invoices
3. **Asset to Ticket**: Quick ticket creation from asset context
4. **Customer 360**: View all customer data (tickets, assets, invoices)

---

## Acceptance Criteria

1. All 6 skills exist with proper frontmatter (description, triggers)
2. All 4 commands exist with proper frontmatter (name, description, arguments)
3. Each skill contains: Overview, Key Concepts, Field Reference, API Patterns, Workflows, Error Handling, Best Practices, Related Skills
4. Each command contains: Prerequisites, Steps, Parameters, Examples, Output, Error Handling
5. plugin.json correctly references all skills and commands
6. .mcp.json is configured for syncro-mcp server with subdomain support
7. No hardcoded credentials in any file
8. API examples validated against Syncro documentation
9. Marketplace.json updated with syncro plugin entry
