# HaloPSA Claude Code Plugin

## Product Requirements Document

**Version:** 1.0
**Author:** Aaron / WYRE AI
**Date:** February 4, 2026
**Status:** Draft
**Repository:** `halopsa/halopsa` (within msp-claude-plugins)
**Parent Project:** MSP Claude Plugin Marketplace

---

## Executive Summary

The HaloPSA Claude Code Plugin provides comprehensive skills and commands for interacting with HaloPSA, the comprehensive PSA platform for MSPs and IT service providers. It enables Claude to assist with managing tickets, clients, sites, assets, and contracts across the HaloPSA ecosystem.

The plugin leverages the `node-halopsa` library for API connectivity and follows the established plugin architecture pattern from the Autotask plugin. **Note:** HaloPSA uses OAuth 2.0 authentication, requiring token-based access patterns.

---

## Problem Statement

HaloPSA is a feature-rich PSA platform that provides comprehensive service desk, CRM, billing, and project management capabilities. Technicians frequently need to:

- Create and manage support tickets
- Look up client and site information
- Search for and update assets
- Access contract and billing details
- Track project tasks and milestones
- Manage SLAs and service levels

Without Claude skills for HaloPSA, technicians must navigate the HaloPSA interface separately, reducing efficiency during service delivery and operations.

---

## Goals

1. **Comprehensive Skills** — Cover all major HaloPSA domains (tickets, clients, sites, assets, contracts, API patterns)
2. **Practical Commands** — Provide slash commands for common operations (lookup-client, create-ticket, search-assets, get-contract)
3. **OAuth Integration** — Properly handle OAuth 2.0 authentication flow
4. **Multi-Tenancy** — Support HaloPSA's multi-tenant architecture
5. **Contract Awareness** — Enable contract and billing context in service workflows

---

## Technical Specifications

### Directory Structure

```
halopsa/halopsa/
├── .claude-plugin/
│   └── plugin.json
├── .mcp.json
├── README.md
├── skills/
│   ├── tickets/
│   │   └── SKILL.md
│   ├── clients/
│   │   └── SKILL.md
│   ├── sites/
│   │   └── SKILL.md
│   ├── assets/
│   │   └── SKILL.md
│   ├── contracts/
│   │   └── SKILL.md
│   └── api-patterns/
│       └── SKILL.md
└── commands/
    ├── lookup-client.md
    ├── create-ticket.md
    ├── search-assets.md
    └── get-contract.md
```

### Plugin Manifest (plugin.json)

```json
{
  "name": "halopsa",
  "version": "1.0.0",
  "description": "Claude plugins for HaloPSA - tickets, clients, sites, assets, contracts, OAuth 2.0 API",
  "author": "MSP Claude Plugins Community",
  "vendor": "halopsa",
  "product": "halopsa",
  "api_version": "v1",
  "requires_api_key": true,
  "authentication": "oauth2",
  "documentation_url": "https://halopsa.com/apidoc/",
  "skills": [
    "tickets",
    "clients",
    "sites",
    "assets",
    "contracts",
    "api-patterns"
  ],
  "commands": [
    "lookup-client",
    "create-ticket",
    "search-assets",
    "get-contract"
  ]
}
```

### MCP Configuration (.mcp.json)

```json
{
  "mcpServers": {
    "halopsa": {
      "command": "npx",
      "args": ["-y", "halopsa-mcp"],
      "env": {
        "HALOPSA_CLIENT_ID": "${HALOPSA_CLIENT_ID}",
        "HALOPSA_CLIENT_SECRET": "${HALOPSA_CLIENT_SECRET}",
        "HALOPSA_TENANT": "${HALOPSA_TENANT}",
        "HALOPSA_RESOURCE_SERVER": "${HALOPSA_RESOURCE_SERVER:-https://api.halopsa.com}"
      }
    }
  }
}
```

---

## Skills Specification

### 1. Tickets Skill

**Purpose:** Managing tickets in HaloPSA

**Key Content:**
- Ticket structure (id, summary, details, status)
- Ticket statuses (configurable workflow states)
- Ticket types (Incident, Service Request, Problem, Change)
- Ticket priorities and impact/urgency matrix
- Ticket categories and sub-categories
- SLA tracking and targets
- Ticket actions and workflows
- Time tracking (billable vs non-billable)
- Ticket agents and assignments
- Ticket queues and teams
- Related items (assets, users, contracts)
- Email integration
- Custom fields
- API patterns for ticket CRUD

**Triggers:**
- halopsa ticket
- halo ticket
- create ticket
- ticket status
- service desk ticket

### 2. Clients Skill

**Purpose:** Managing clients (customers) in HaloPSA

**Key Content:**
- Client structure (id, name, type)
- Client types and classifications
- Client fields (name, website, phone, email)
- Client addresses
- Primary contact and main site
- Client users and contacts
- Client custom fields
- Client notes and activity
- Associated sites
- Associated assets
- Associated tickets
- Client portal access
- Billing and invoice settings
- API patterns for client management

**Triggers:**
- halopsa client
- halo client
- client lookup
- customer search
- client management

### 3. Sites Skill

**Purpose:** Managing sites (locations) within clients

**Key Content:**
- Site structure (id, name, client_id)
- Site fields (address, phone, notes)
- Site types (Main, Branch, Remote)
- Site contacts
- Site operating hours
- Site-level custom fields
- Associated assets
- Associated tickets
- Site-level SLAs
- Geographic information
- Time zone settings
- API patterns for site management

**Triggers:**
- halopsa site
- halo site
- client site
- location lookup
- site management

### 4. Assets Skill

**Purpose:** Managing assets in HaloPSA

**Key Content:**
- Asset structure (id, name, type, status)
- Asset types (configurable)
- Asset statuses (Active, Inactive, Retired, etc.)
- Asset fields (serial_number, model, manufacturer)
- Asset-client relationships
- Asset-site relationships
- Asset warranty tracking
- Software assets
- Asset custom fields
- Asset notes and activity
- Related tickets
- Asset auditing and history
- Contract coverage
- API patterns for asset management

**Triggers:**
- halopsa asset
- halo asset
- asset lookup
- device search
- asset inventory

### 5. Contracts Skill

**Purpose:** Managing contracts and billing in HaloPSA

**Key Content:**
- Contract structure (id, name, type, status)
- Contract types (Recurring, Prepaid, Block Hours, etc.)
- Contract statuses (Active, Expired, Cancelled)
- Contract billing (monthly, quarterly, annual)
- Contract coverage (clients, sites, assets)
- Contract items and line items
- Prepaid hours tracking
- Contract renewal
- SLA associations
- Invoice generation
- Payment terms
- Contract custom fields
- API patterns for contract management

**Triggers:**
- halopsa contract
- halo contract
- contract lookup
- billing contract
- service agreement

### 6. API Patterns Skill

**Purpose:** Foundation skill for HaloPSA OAuth 2.0 API interactions

**Key Content:**
- **OAuth 2.0 Authentication**:
  ```
  POST /auth/token
  Content-Type: application/x-www-form-urlencoded

  grant_type=client_credentials
  &client_id={client_id}
  &client_secret={client_secret}
  &scope=all
  ```
- **Token Usage**: Bearer token in Authorization header
- **Token Refresh**: Automatic refresh before expiry
- **Base URL**: https://{tenant}.halopsa.com/api
- **RESTful Conventions**: Standard HTTP methods
- **Pagination**: pageinate, page_no, page_size
- **Filtering**: Various field-specific filters
- **Sorting**: order, orderdesc parameters
- **Include Related**: include_details parameter
- **Response Structure**: JSON with nested objects
- **Error Handling**: Standard HTTP status codes
- **Rate Limiting**: Best practices
- **Common Endpoints Reference**

**Triggers:**
- halopsa api
- halo api
- halopsa authentication
- oauth token
- api integration

---

## Commands Specification

### 1. lookup-client Command

**Purpose:** Find a client by name or other attributes

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| query | Yes | Client name or partial match |
| include-sites | No | Include site information |
| include-contacts | No | Include contact information |

**Example:**
```
/lookup-client "Acme Corp"
/lookup-client "Acme" --include-sites --include-contacts
```

**Output:** Client details including name, primary contact, main site, open tickets count, active contracts

### 2. create-ticket Command

**Purpose:** Create a new ticket

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| summary | Yes | Ticket summary/subject |
| client | Yes | Client name or ID |
| details | No | Ticket description/details |
| type | No | Ticket type (incident, request, etc.) |
| priority | No | Priority level |
| site | No | Site name or ID |

**Example:**
```
/create-ticket "Email server down" --client "Acme Corp" --type incident --priority critical
/create-ticket "New user setup" --client "Acme Corp" --site "Main Office" --details "Setup account for John Smith"
```

**Output:** Created ticket number, ID, and direct link

### 3. search-assets Command

**Purpose:** Search for assets by name, serial, or client

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| query | Yes | Asset name, serial number, or hostname |
| client | No | Filter by client name |
| type | No | Filter by asset type |
| status | No | Filter by status (active, inactive) |

**Example:**
```
/search-assets "DC01"
/search-assets --client "Acme Corp" --type server
/search-assets "SN12345" --status active
```

**Output:** Asset list with name, type, client, site, status, warranty info

### 4. get-contract Command

**Purpose:** Retrieve contract details

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| contract | Yes | Contract name or ID |
| client | No | Client name to filter contracts |
| status | No | Filter by status (active, expired) |

**Example:**
```
/get-contract "Managed Services - Acme"
/get-contract --client "Acme Corp" --status active
```

**Output:** Contract details including type, billing, coverage, remaining hours (if prepaid), renewal date

---

## Implementation Phases

### Phase 1 — Plugin Structure & Foundation
- Create directory structure
- Create plugin.json manifest
- Create .mcp.json configuration (with OAuth env vars)
- Create api-patterns skill (with OAuth 2.0 focus)
- Create README.md

### Phase 2 — Core Skills
- Create clients skill
- Create sites skill
- Create tickets skill

### Phase 3 — Business Skills
- Create assets skill
- Create contracts skill

### Phase 4 — Commands
- Create lookup-client command
- Create create-ticket command
- Create search-assets command
- Create get-contract command

### Phase 5 — Testing & Documentation
- Validate all skills have required sections
- Validate all commands have required arguments
- Test MCP integration with OAuth flow
- Update marketplace.json with new plugin
- Create comprehensive README

---

## OAuth 2.0 Authentication

### Token Request
```http
POST /auth/token HTTP/1.1
Host: {tenant}.halopsa.com
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id={client_id}&client_secret={client_secret}&scope=all
```

### Token Response
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "all"
}
```

### Using the Token
```http
GET /api/Tickets HTTP/1.1
Host: {tenant}.halopsa.com
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Token Refresh
The MCP server should:
1. Track token expiration
2. Refresh token before expiry (recommended 5 min buffer)
3. Handle 401 responses by refreshing and retrying

---

## HaloPSA-Specific Considerations

### Configurable Workflows
HaloPSA has highly configurable ticket workflows:
- Custom statuses per ticket type
- Custom fields per ticket type
- Workflow automation rules
- SLA rules and escalations

### Multi-Entity Structure
HaloPSA uses a hierarchical entity structure:
- Client > Sites > Assets
- Client > Users (Contacts)
- Client > Contracts > Contract Items

### API Characteristics
- OAuth 2.0 client credentials flow
- Well-documented API at halopsa.com/apidoc
- Supports filtering, pagination, and includes
- Tenant-based URLs

### Common Workflows
1. **Ticket Creation**: Client lookup > Create ticket > Assign > Time tracking
2. **Asset Service**: Asset lookup > View contract coverage > Create ticket
3. **Contract Review**: Client lookup > View contracts > Check coverage > Check hours
4. **Site Visit**: Client > Sites > Assets at site > Create ticket

---

## Acceptance Criteria

1. All 6 skills exist with proper frontmatter (description, triggers)
2. All 4 commands exist with proper frontmatter (name, description, arguments)
3. Each skill contains: Overview, Key Concepts, Field Reference, API Patterns, Workflows, Error Handling, Best Practices, Related Skills
4. Each command contains: Prerequisites, Steps, Parameters, Examples, Output, Error Handling
5. API patterns skill thoroughly documents OAuth 2.0 authentication flow
6. plugin.json correctly references all skills and commands
7. .mcp.json is configured for halopsa-mcp server with OAuth credentials
8. No hardcoded credentials in any file
9. API examples validated against HaloPSA documentation
10. Marketplace.json updated with halopsa plugin entry
