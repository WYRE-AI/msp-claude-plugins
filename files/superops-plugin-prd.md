# SuperOps Claude Code Plugin

## Product Requirements Document

**Version:** 1.0
**Author:** Aaron / WYRE AI
**Date:** February 4, 2026
**Status:** Draft
**Repository:** `superops/superops` (within msp-claude-plugins)
**Parent Project:** MSP Claude Plugin Marketplace

---

## Executive Summary

The SuperOps Claude Code Plugin provides comprehensive skills and commands for interacting with SuperOps, the modern PSA-RMM platform built with AI capabilities. It enables Claude to assist with managing assets, tickets, clients, alerts, and knowledge base articles across the SuperOps platform.

The plugin leverages the `node-superops` library for API connectivity and follows the established plugin architecture pattern from the Autotask plugin. **Note:** SuperOps uses a GraphQL-based API, requiring different query patterns than REST-based platforms.

---

## Problem Statement

SuperOps is a next-generation unified PSA-RMM platform designed for modern MSPs, featuring AI-driven automation and a unified interface. Technicians frequently need to:

- Look up asset information and health status
- Create and manage support tickets
- Search for clients and their associated data
- Run automation runbooks
- Access knowledge base articles
- Respond to alerts and monitoring data

Without Claude skills for SuperOps, technicians must navigate the SuperOps interface separately, reducing the efficiency gains the platform is designed to provide.

---

## Goals

1. **Comprehensive Skills** — Cover all major SuperOps domains (assets, tickets, clients, alerts, knowledge-base, API patterns)
2. **Practical Commands** — Provide slash commands for common operations (lookup-asset, create-ticket, search-clients, run-runbook)
3. **GraphQL Integration** — Properly document and leverage SuperOps GraphQL API patterns
4. **AI Alignment** — Complement SuperOps' built-in AI with Claude's capabilities
5. **Runbook Automation** — Enable automation workflows through runbook execution

---

## Technical Specifications

### Directory Structure

```
superops/superops/
├── .claude-plugin/
│   └── plugin.json
├── .mcp.json
├── README.md
├── skills/
│   ├── assets/
│   │   └── SKILL.md
│   ├── tickets/
│   │   └── SKILL.md
│   ├── clients/
│   │   └── SKILL.md
│   ├── alerts/
│   │   └── SKILL.md
│   ├── knowledge-base/
│   │   └── SKILL.md
│   └── api-patterns/
│       └── SKILL.md
└── commands/
    ├── lookup-asset.md
    ├── create-ticket.md
    ├── search-clients.md
    └── run-runbook.md
```

### Plugin Manifest (plugin.json)

```json
{
  "name": "superops",
  "version": "1.0.0",
  "description": "Claude plugins for SuperOps PSA-RMM - assets, tickets, clients, alerts, knowledge base, GraphQL API",
  "author": "MSP Claude Plugins Community",
  "vendor": "superops",
  "product": "superops",
  "api_version": "graphql",
  "requires_api_key": true,
  "documentation_url": "https://developer.superops.ai/",
  "skills": [
    "assets",
    "tickets",
    "clients",
    "alerts",
    "knowledge-base",
    "api-patterns"
  ],
  "commands": [
    "lookup-asset",
    "create-ticket",
    "search-clients",
    "run-runbook"
  ]
}
```

### MCP Configuration (.mcp.json)

```json
{
  "mcpServers": {
    "superops": {
      "command": "npx",
      "args": ["-y", "superops-mcp"],
      "env": {
        "SUPEROPS_API_KEY": "${SUPEROPS_API_KEY}",
        "SUPEROPS_TENANT_ID": "${SUPEROPS_TENANT_ID}"
      }
    }
  }
}
```

---

## Skills Specification

### 1. Assets Skill

**Purpose:** Managing assets (devices) in SuperOps

**Key Content:**
- Asset structure (id, name, type, status)
- Asset types (Workstation, Server, Network Device, Mobile)
- Asset statuses (Active, Inactive, Maintenance)
- Asset fields (serialNumber, manufacturer, model, os)
- RMM agent integration
- Asset health scores and indicators
- Hardware inventory (CPU, RAM, storage)
- Software inventory
- Asset tags and grouping
- Client assignment
- Warranty tracking
- Custom fields
- GraphQL queries for asset operations

**Triggers:**
- superops asset
- superops device
- asset lookup
- device search
- asset inventory

### 2. Tickets Skill

**Purpose:** Managing support tickets in SuperOps

**Key Content:**
- Ticket structure (id, number, subject, status)
- Ticket statuses (New, Open, Pending, Resolved, Closed)
- Ticket priorities (Low, Medium, High, Critical)
- Ticket types and categories
- Smart ticket routing (AI-powered)
- Time tracking and billing
- Ticket comments and notes
- Technician assignments
- Related assets and clients
- SLA management
- Ticket automation workflows
- AI-suggested responses
- GraphQL mutations for ticket operations

**Triggers:**
- superops ticket
- superops support
- create ticket
- ticket status
- helpdesk ticket

### 3. Clients Skill

**Purpose:** Managing clients and contacts in SuperOps

**Key Content:**
- Client structure (id, name, type)
- Client types and tiers
- Contact management
- Contact fields (name, email, phone, role)
- Client addresses and locations
- Associated assets
- Associated tickets
- Client portal access
- Contract management
- Billing information
- Custom fields
- Client health scores
- GraphQL queries for client management

**Triggers:**
- superops client
- superops customer
- client lookup
- client search
- contact management

### 4. Alerts Skill

**Purpose:** Managing alerts and monitoring in SuperOps

**Key Content:**
- Alert structure (id, type, severity, message)
- Alert severities (Low, Medium, High, Critical)
- Alert types:
  - Performance alerts (CPU, memory, disk)
  - Availability alerts (offline, service down)
  - Security alerts (threats, vulnerabilities)
  - Patch alerts (missing updates)
  - Hardware alerts (disk health, temperature)
- Alert thresholds and policies
- Alert acknowledgment
- Alert resolution
- Alert-to-ticket escalation
- Alert snoozing
- AI-powered alert correlation
- GraphQL queries for alert management

**Triggers:**
- superops alert
- superops monitoring
- alert status
- resolve alert
- monitoring alert

### 5. Knowledge Base Skill

**Purpose:** Managing knowledge base articles and runbooks

**Key Content:**
- Article structure (id, title, content, category)
- Article categories and organization
- Article search and discovery
- Article permissions and visibility
- Runbook structure and execution
- Runbook parameters and variables
- Runbook scheduling
- Runbook execution history
- AI-assisted article creation
- Article linking to tickets
- Templates and snippets
- GraphQL queries for KB operations

**Triggers:**
- superops knowledge base
- superops kb
- superops runbook
- documentation search
- automation runbook

### 6. API Patterns Skill

**Purpose:** Foundation skill for SuperOps GraphQL API interactions

**Key Content:**
- **GraphQL Authentication**: API key in Authorization header
- **GraphQL Endpoint**: https://api.superops.ai/graphql
- **Query Structure**:
  ```graphql
  query GetAsset($id: ID!) {
    asset(id: $id) {
      id
      name
      type
      status
      client { id name }
    }
  }
  ```
- **Mutation Structure**:
  ```graphql
  mutation CreateTicket($input: CreateTicketInput!) {
    createTicket(input: $input) {
      id
      number
      subject
    }
  }
  ```
- **Pagination**: Cursor-based (first, after, last, before)
- **Filtering**: GraphQL arguments and variables
- **Error Handling**: GraphQL error responses
- **Rate Limiting**: Query complexity limits
- **Introspection**: Schema discovery
- **Common Queries Reference**

**Triggers:**
- superops api
- superops graphql
- superops query
- graphql mutation

---

## Commands Specification

### 1. lookup-asset Command

**Purpose:** Find an asset by name, serial number, or client

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| query | Yes | Asset name, serial number, or hostname |
| client | No | Filter by client name |
| type | No | Filter by asset type |

**Example:**
```
/lookup-asset "ACME-DC01"
/lookup-asset "SN12345678" --client "Acme Corp"
/lookup-asset --client "Acme Corp" --type server
```

**Output:** Asset details including name, type, client, status, health score, key specs

### 2. create-ticket Command

**Purpose:** Create a new support ticket

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| subject | Yes | Ticket subject |
| client | Yes | Client name or ID |
| description | No | Ticket description |
| priority | No | Priority (low, medium, high, critical) |
| asset | No | Related asset name or ID |

**Example:**
```
/create-ticket "Server not responding" --client "Acme Corp" --priority critical
/create-ticket "Software request" --client "Acme Corp" --asset "ACME-WS01" --description "Install Office 365"
```

**Output:** Created ticket number, ID, and direct link

### 3. search-clients Command

**Purpose:** Search for clients by name or attributes

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| query | Yes | Client name or partial match |
| type | No | Filter by client type |
| include-stats | No | Include asset and ticket counts |

**Example:**
```
/search-clients "Acme"
/search-clients "Corp" --type enterprise --include-stats
```

**Output:** Client list with name, type, contact info, asset count, open tickets

### 4. run-runbook Command

**Purpose:** Execute an automation runbook

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| runbook | Yes | Runbook name or ID |
| target | Yes | Target asset(s) or client |
| parameters | No | Runbook parameters as key=value |

**Example:**
```
/run-runbook "Clear Temp Files" --target "ACME-WS01"
/run-runbook "Windows Update Check" --target "Acme Corp" --parameters "reboot=false"
```

**Output:** Runbook execution status, job ID, and results when complete

---

## Implementation Phases

### Phase 1 — Plugin Structure & Foundation
- Create directory structure
- Create plugin.json manifest
- Create .mcp.json configuration
- Create api-patterns skill (with GraphQL focus)
- Create README.md

### Phase 2 — Core Skills
- Create assets skill
- Create clients skill
- Create tickets skill

### Phase 3 — Automation Skills
- Create alerts skill
- Create knowledge-base skill (including runbooks)

### Phase 4 — Commands
- Create lookup-asset command
- Create create-ticket command
- Create search-clients command
- Create run-runbook command

### Phase 5 — Testing & Documentation
- Validate all skills have required sections
- Validate all commands have required arguments
- Test MCP integration with GraphQL
- Update marketplace.json with new plugin
- Create comprehensive README

---

## GraphQL API Patterns

### Query Examples

**Get Asset with Client**
```graphql
query GetAsset($id: ID!) {
  asset(id: $id) {
    id
    name
    serialNumber
    type
    status
    healthScore
    client {
      id
      name
    }
    lastSeen
  }
}
```

**List Client Tickets**
```graphql
query ClientTickets($clientId: ID!, $first: Int, $after: String) {
  client(id: $clientId) {
    tickets(first: $first, after: $after) {
      edges {
        node {
          id
          number
          subject
          status
          priority
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
```

### Mutation Examples

**Create Ticket**
```graphql
mutation CreateTicket($input: CreateTicketInput!) {
  createTicket(input: $input) {
    id
    number
    subject
    status
  }
}
```

**Execute Runbook**
```graphql
mutation ExecuteRunbook($input: ExecuteRunbookInput!) {
  executeRunbook(input: $input) {
    jobId
    status
    startedAt
  }
}
```

---

## SuperOps-Specific Considerations

### Modern Architecture
SuperOps is built as a modern, AI-first platform:
- GraphQL API (not REST)
- AI-powered features throughout
- Real-time updates via subscriptions
- Modern UI/UX design

### AI Integration
SuperOps has built-in AI that:
- Suggests ticket responses
- Auto-categorizes tickets
- Correlates alerts
- Provides asset health insights
Claude skills should complement, not duplicate, these features.

### Runbook Automation
Runbooks in SuperOps are powerful automation tools:
- Can execute scripts on assets
- Support parameters and variables
- Have scheduling capabilities
- Track execution history

---

## Acceptance Criteria

1. All 6 skills exist with proper frontmatter (description, triggers)
2. All 4 commands exist with proper frontmatter (name, description, arguments)
3. Each skill contains: Overview, Key Concepts, Field Reference, **GraphQL Patterns**, Workflows, Error Handling, Best Practices, Related Skills
4. Each command contains: Prerequisites, Steps, Parameters, Examples, Output, Error Handling
5. API patterns skill thoroughly documents GraphQL query/mutation patterns
6. plugin.json correctly references all skills and commands
7. .mcp.json is configured for superops-mcp server with tenant support
8. No hardcoded credentials in any file
9. GraphQL examples validated against SuperOps documentation
10. Marketplace.json updated with superops plugin entry
