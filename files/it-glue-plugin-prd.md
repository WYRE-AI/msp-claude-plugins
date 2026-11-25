# IT Glue Claude Code Plugin

## Product Requirements Document

**Version:** 1.0
**Author:** Aaron / WYRE AI
**Date:** February 4, 2026
**Status:** Draft
**Repository:** `kaseya/it-glue` (within msp-claude-plugins)
**Parent Project:** MSP Claude Plugin Marketplace

---

## Executive Summary

The IT Glue Claude Code Plugin provides comprehensive skills and commands for interacting with IT Glue, the documentation platform for MSPs. It enables Claude to assist with managing organizations, configurations (assets), contacts, passwords, documents, and flexible assets.

The plugin leverages the `node-it-glue` library for API connectivity and follows the established plugin architecture pattern from the Autotask plugin.

---

## Problem Statement

IT Glue is the de facto documentation platform for MSPs, storing critical information about client organizations, assets, passwords, and documentation. Technicians frequently need to:

- Look up organization details and contacts
- Find and update configuration items (servers, workstations, network devices)
- Access and manage passwords securely
- Search through documentation
- Create and update flexible assets for custom documentation

Without Claude skills for IT Glue, technicians must context-switch between Claude and the IT Glue interface, reducing efficiency.

---

## Goals

1. **Comprehensive Skills** — Cover all major IT Glue domains (organizations, configurations, contacts, passwords, documents, flexible assets)
2. **Practical Commands** — Provide slash commands for common operations (lookup-asset, search-docs, get-password)
3. **API Integration** — Integrate with node-it-glue library via MCP server
4. **Security-Conscious** — Handle password access with appropriate security considerations
5. **Cross-Linked** — Reference related Autotask/ConnectWise entities where applicable

---

## Technical Specifications

### Directory Structure

```
kaseya/it-glue/
├── .claude-plugin/
│   └── plugin.json
├── .mcp.json
├── README.md
├── skills/
│   ├── organizations/
│   │   └── SKILL.md
│   ├── configurations/
│   │   └── SKILL.md
│   ├── contacts/
│   │   └── SKILL.md
│   ├── passwords/
│   │   └── SKILL.md
│   ├── documents/
│   │   └── SKILL.md
│   ├── flexible-assets/
│   │   └── SKILL.md
│   └── api-patterns/
│       └── SKILL.md
└── commands/
    ├── lookup-asset.md
    ├── search-docs.md
    ├── get-password.md
    └── find-organization.md
```

### Plugin Manifest (plugin.json)

```json
{
  "name": "kaseya-it-glue",
  "version": "1.0.0",
  "description": "Claude plugins for IT Glue documentation platform - organizations, assets, passwords, documents",
  "author": "MSP Claude Plugins Community",
  "vendor": "kaseya",
  "product": "it-glue",
  "api_version": "v1",
  "requires_api_key": true,
  "documentation_url": "https://api.itglue.com/developer/",
  "skills": [
    "organizations",
    "configurations",
    "contacts",
    "passwords",
    "documents",
    "flexible-assets",
    "api-patterns"
  ],
  "commands": [
    "lookup-asset",
    "search-docs",
    "get-password",
    "find-organization"
  ]
}
```

### MCP Configuration (.mcp.json)

```json
{
  "mcpServers": {
    "it-glue": {
      "command": "npx",
      "args": ["-y", "it-glue-mcp"],
      "env": {
        "IT_GLUE_API_KEY": "${IT_GLUE_API_KEY}",
        "IT_GLUE_REGION": "${IT_GLUE_REGION:-us}"
      }
    }
  }
}
```

---

## Skills Specification

### 1. Organizations Skill

**Purpose:** Managing IT Glue organizations (companies/clients)

**Key Content:**
- Organization types (Customer, Vendor, Partner, Internal)
- Organization statuses (Active, Inactive, Archived)
- Field reference (name, description, quick_notes, organization_type_id, organization_status_id)
- Parent/child organization relationships
- PSA sync configuration
- API patterns for CRUD operations

**Triggers:**
- it glue organization
- it glue company
- client documentation
- organization lookup

### 2. Configurations Skill

**Purpose:** Managing configuration items (assets) in IT Glue

**Key Content:**
- Configuration types (Server, Workstation, Network Device, Printer, etc.)
- Configuration statuses (Active, Inactive, Decomissioned)
- Standard fields (name, hostname, primary_ip, mac_address, serial_number)
- Configuration interfaces (network interfaces, IPs, MACs)
- Asset tagging and categorization
- Warranty tracking
- API patterns for asset management

**Triggers:**
- it glue configuration
- it glue asset
- server documentation
- workstation lookup
- network device

### 3. Contacts Skill

**Purpose:** Managing contacts associated with organizations

**Key Content:**
- Contact types (Primary, Technical, Billing, Executive)
- Contact fields (name, title, email, phone, location)
- Organization relationships
- Contact notes and quick notes
- API patterns for contact management

**Triggers:**
- it glue contact
- client contact
- technical contact
- contact lookup

### 4. Passwords Skill

**Purpose:** Managing passwords in IT Glue (security-focused)

**Key Content:**
- Password categories
- Password folders (organization-level hierarchy)
- Embedded passwords in documents
- Password field reference (name, username, password, url, notes)
- Security best practices
- Audit logging for password access
- API patterns with security considerations

**Triggers:**
- it glue password
- credential lookup
- password management
- secure credentials

### 5. Documents Skill

**Purpose:** Managing documentation in IT Glue

**Key Content:**
- Document structure (name, content, folder)
- Document folders and organization
- Embedded passwords in documents
- Document sections and formatting
- Version history
- Related items linking
- API patterns for document CRUD

**Triggers:**
- it glue document
- documentation
- runbook
- procedure documentation

### 6. Flexible Assets Skill

**Purpose:** Managing flexible assets (custom asset types)

**Key Content:**
- Flexible asset types and their definitions
- Flexible asset fields (text, number, date, tag, select, password, etc.)
- Field types and configuration
- Cross-linking with configurations and organizations
- Common flexible asset examples (Network Overview, Application Documentation)
- API patterns for flexible assets

**Triggers:**
- it glue flexible asset
- custom asset
- flexible asset type
- it glue custom documentation

### 7. API Patterns Skill

**Purpose:** Foundation skill for IT Glue API interactions

**Key Content:**
- Authentication (x-api-key header)
- Regional endpoints (US, EU, AU)
- JSON:API structure (data, attributes, relationships, included)
- Filtering with filter[field]=value syntax
- Sorting with sort=field,-field
- Pagination (page[size], page[number])
- Rate limiting (3000 req / 5 min)
- Sideloading related resources with include parameter
- Error handling patterns

**Triggers:**
- it glue api
- it glue query
- json api
- it glue filter

---

## Commands Specification

### 1. lookup-asset Command

**Purpose:** Find a configuration item by name, hostname, or serial number

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| query | Yes | Asset name, hostname, serial number, or IP address |
| organization | No | Filter by organization name |
| type | No | Filter by configuration type |

**Example:**
```
/lookup-asset "DC-01" --organization "Acme Corp"
```

**Output:** Asset details including hostname, IP, type, organization, location

### 2. search-docs Command

**Purpose:** Search IT Glue documentation

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| query | Yes | Search query |
| organization | No | Filter by organization |
| type | No | Filter by document type |

**Example:**
```
/search-docs "backup procedure" --organization "Acme Corp"
```

**Output:** List of matching documents with snippets

### 3. get-password Command

**Purpose:** Retrieve a password (with security logging)

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| name | Yes | Password name or partial match |
| organization | Yes | Organization name (required for security) |
| category | No | Password category filter |

**Example:**
```
/get-password "Domain Admin" --organization "Acme Corp"
```

**Output:** Password details (username, URL, notes) with masked password that can be revealed

### 4. find-organization Command

**Purpose:** Find an organization by name

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| name | Yes | Organization name (partial match supported) |
| type | No | Filter by organization type |

**Example:**
```
/find-organization "Acme"
```

**Output:** Organization details, contact count, asset count, status

---

## Implementation Phases

### Phase 1 — Plugin Structure & Foundation
- Create directory structure
- Create plugin.json manifest
- Create .mcp.json configuration
- Create api-patterns skill
- Create README.md

### Phase 2 — Core Skills
- Create organizations skill
- Create configurations skill
- Create contacts skill

### Phase 3 — Security-Sensitive Skills
- Create passwords skill (with security best practices)
- Create documents skill

### Phase 4 — Advanced Skills & Commands
- Create flexible-assets skill
- Create lookup-asset command
- Create search-docs command
- Create get-password command
- Create find-organization command

### Phase 5 — Testing & Documentation
- Validate all skills have required sections
- Validate all commands have required arguments
- Test MCP integration
- Update marketplace.json with new plugin
- Create comprehensive README

---

## Acceptance Criteria

1. All 7 skills exist with proper frontmatter (description, triggers)
2. All 4 commands exist with proper frontmatter (name, description, arguments)
3. Each skill contains: Overview, Key Concepts, Field Reference, API Patterns, Workflows, Error Handling, Best Practices, Related Skills
4. Each command contains: Prerequisites, Steps, Parameters, Examples, Output, Error Handling
5. plugin.json correctly references all skills and commands
6. .mcp.json is configured for it-glue-mcp server
7. No hardcoded credentials in any file
8. API examples validated against IT Glue documentation
9. Marketplace.json updated with it-glue plugin entry
