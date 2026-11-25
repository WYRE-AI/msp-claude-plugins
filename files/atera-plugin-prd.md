# Atera Claude Code Plugin

## Product Requirements Document

**Version:** 1.0
**Author:** Aaron / WYRE AI
**Date:** February 4, 2026
**Status:** Draft
**Repository:** `atera/atera` (within msp-claude-plugins)
**Parent Project:** MSP Claude Plugin Marketplace

---

## Executive Summary

The Atera Claude Code Plugin provides comprehensive skills and commands for interacting with Atera, the all-in-one RMM, PSA, and remote access platform for MSPs. It enables Claude to assist with managing agents, tickets, devices, customers, and alerts across the Atera ecosystem.

The plugin leverages the `node-atera` library for API connectivity and follows the established plugin architecture pattern from the Autotask plugin.

---

## Problem Statement

Atera is a cloud-based RMM and PSA platform that combines remote monitoring, ticketing, and remote access in a unified interface. Technicians frequently need to:

- Check agent status and device health
- Create and manage support tickets
- Search for devices across customers
- Respond to and resolve alerts
- Access customer information quickly
- View device audit and inventory data

Without Claude skills for Atera, technicians must navigate the Atera console separately, reducing efficiency during troubleshooting and service delivery.

---

## Goals

1. **Comprehensive Skills** — Cover all major Atera domains (agents, tickets, devices, customers, alerts, API patterns)
2. **Practical Commands** — Provide slash commands for common operations (lookup-agent, create-ticket, search-devices, resolve-alert)
3. **API Integration** — Integrate with node-atera library via MCP server
4. **Alert Management** — Enable efficient alert triage and resolution workflows
5. **Customer Context** — Provide quick access to customer and device relationships

---

## Technical Specifications

### Directory Structure

```
atera/atera/
├── .claude-plugin/
│   └── plugin.json
├── .mcp.json
├── README.md
├── skills/
│   ├── agents/
│   │   └── SKILL.md
│   ├── tickets/
│   │   └── SKILL.md
│   ├── devices/
│   │   └── SKILL.md
│   ├── customers/
│   │   └── SKILL.md
│   ├── alerts/
│   │   └── SKILL.md
│   └── api-patterns/
│       └── SKILL.md
└── commands/
    ├── lookup-agent.md
    ├── create-ticket.md
    ├── search-devices.md
    └── resolve-alert.md
```

### Plugin Manifest (plugin.json)

```json
{
  "name": "atera",
  "version": "1.0.0",
  "description": "Claude plugins for Atera RMM/PSA - agents, tickets, devices, customers, alerts",
  "author": "MSP Claude Plugins Community",
  "vendor": "atera",
  "product": "atera",
  "api_version": "v3",
  "requires_api_key": true,
  "documentation_url": "https://app.atera.com/apidocs",
  "skills": [
    "agents",
    "tickets",
    "devices",
    "customers",
    "alerts",
    "api-patterns"
  ],
  "commands": [
    "lookup-agent",
    "create-ticket",
    "search-devices",
    "resolve-alert"
  ]
}
```

### MCP Configuration (.mcp.json)

```json
{
  "mcpServers": {
    "atera": {
      "command": "npx",
      "args": ["-y", "atera-mcp"],
      "env": {
        "ATERA_API_KEY": "${ATERA_API_KEY}"
      }
    }
  }
}
```

---

## Skills Specification

### 1. Agents Skill

**Purpose:** Managing Atera agents deployed on endpoints

**Key Content:**
- Agent structure (AgentID, MachineName, CustomerName)
- Agent statuses (Online, Offline, Archived)
- Agent types (Windows, Mac, Linux)
- Agent fields (OS, Version, LastSeen, IPAddress)
- Agent installation and deployment
- Agent grouping and organization
- Splashtop remote access integration
- Agent commands (restart, reinstall)
- Agent thresholds and monitoring settings
- API patterns for agent management

**Triggers:**
- atera agent
- atera endpoint
- agent status
- agent lookup
- managed agent

### 2. Tickets Skill

**Purpose:** Managing support tickets in Atera

**Key Content:**
- Ticket structure (TicketID, TicketNumber, Title, Status)
- Ticket statuses (Open, Pending, Resolved, Closed)
- Ticket priorities (Low, Medium, High, Critical)
- Ticket types and categories
- SLA management
- Ticket comments and notes
- Time entries and billing
- Ticket assignments (technicians)
- Related devices and contacts
- Ticket automation and rules
- Customer portal tickets
- API patterns for ticket operations

**Triggers:**
- atera ticket
- atera support
- create ticket
- ticket status
- helpdesk ticket

### 3. Devices Skill

**Purpose:** Managing devices and hardware inventory in Atera

**Key Content:**
- Device information from agents
- Hardware specifications (CPU, RAM, Storage)
- Software inventory
- Network information (IP, MAC, adapters)
- Disk health and SMART data
- Warranty information
- Device notes and custom fields
- SNMP devices (network equipment)
- Generic devices (non-agent)
- Device-customer relationships
- API patterns for device queries

**Triggers:**
- atera device
- atera hardware
- device inventory
- device search
- hardware audit

### 4. Customers Skill

**Purpose:** Managing customers and contacts in Atera

**Key Content:**
- Customer structure (CustomerID, CustomerName)
- Customer fields (address, phone, website)
- Contact management
- Contact fields (Name, Email, Phone, JobTitle)
- Customer folders and organization
- Associated agents and devices
- Associated tickets
- Customer portal access
- Billing and contract information
- Custom fields
- API patterns for customer management

**Triggers:**
- atera customer
- atera client
- customer lookup
- customer search
- contact management

### 5. Alerts Skill

**Purpose:** Managing and responding to Atera alerts

**Key Content:**
- Alert structure (AlertID, Title, Severity, Created)
- Alert severities (Information, Warning, Critical)
- Alert categories:
  - Hardware alerts (disk, memory, CPU)
  - Software alerts (services, processes)
  - Availability alerts (offline, ping)
  - Threshold alerts (performance counters)
  - Security alerts (antivirus, firewall)
  - Patch alerts (missing updates)
- Alert thresholds and configuration
- Alert-to-ticket automation
- Alert snoozing and dismissal
- Alert resolution workflows
- Alert history and trends
- API patterns for alert management

**Triggers:**
- atera alert
- atera monitoring
- alert status
- resolve alert
- monitoring alert

### 6. API Patterns Skill

**Purpose:** Foundation skill for Atera API interactions

**Key Content:**
- Authentication (X-API-KEY header)
- Base URL (https://app.atera.com/api/v3)
- RESTful API conventions
- Pagination (Page, ItemsInPage, nextLink)
- Filtering with query parameters
- OData-style filtering support
- Response structure (items, totalCount)
- Rate limiting (best practices)
- Error handling (400, 401, 403, 404)
- Common endpoints reference
- Webhook integrations

**Triggers:**
- atera api
- atera query
- atera authentication
- api integration

---

## Commands Specification

### 1. lookup-agent Command

**Purpose:** Find an agent by hostname, IP, or customer

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| identifier | Yes | Hostname, IP address, or MAC address |
| customer | No | Filter by customer name |
| status | No | Filter by status (online, offline) |

**Example:**
```
/lookup-agent "ACME-WS01"
/lookup-agent "192.168.1.100" --customer "Acme Corp"
/lookup-agent --customer "Acme Corp" --status online
```

**Output:** Agent details including hostname, IP, OS, status, customer, last seen

### 2. create-ticket Command

**Purpose:** Create a new support ticket

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| title | Yes | Ticket title/subject |
| customer | Yes | Customer name or ID |
| description | No | Ticket description |
| priority | No | Priority (low, medium, high, critical) |
| type | No | Ticket type |

**Example:**
```
/create-ticket "Server offline" --customer "Acme Corp" --priority critical
/create-ticket "Software installation request" --customer "123" --description "Install Adobe Creative Suite"
```

**Output:** Created ticket number, ID, and direct link

### 3. search-devices Command

**Purpose:** Search for devices across customers

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| query | Yes | Device name, serial, or partial match |
| customer | No | Filter by customer name |
| type | No | Filter by device type (workstation, server) |

**Example:**
```
/search-devices "DC01"
/search-devices --customer "Acme Corp" --type server
/search-devices "Dell" --customer "Acme Corp"
```

**Output:** Device list with hostname, type, customer, status, key specs

### 4. resolve-alert Command

**Purpose:** Resolve or dismiss an active alert

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| alert-id | Yes | Alert ID or device name with alert |
| action | No | Action to take (resolve, dismiss, snooze) |
| note | No | Resolution note |

**Example:**
```
/resolve-alert "12345" --action resolve --note "Disk space cleared"
/resolve-alert "ACME-WS01" --action dismiss
```

**Output:** Confirmation of alert resolution with updated status

---

## Implementation Phases

### Phase 1 — Plugin Structure & Foundation
- Create directory structure
- Create plugin.json manifest
- Create .mcp.json configuration
- Create api-patterns skill
- Create README.md

### Phase 2 — Core Skills
- Create agents skill
- Create customers skill
- Create devices skill

### Phase 3 — Operational Skills
- Create tickets skill
- Create alerts skill

### Phase 4 — Commands
- Create lookup-agent command
- Create create-ticket command
- Create search-devices command
- Create resolve-alert command

### Phase 5 — Testing & Documentation
- Validate all skills have required sections
- Validate all commands have required arguments
- Test MCP integration
- Update marketplace.json with new plugin
- Create comprehensive README

---

## Atera-Specific Considerations

### Cloud-Native Platform
Atera is a fully cloud-based platform with:
- No on-premise server requirements
- Per-technician pricing model
- Built-in remote access (Splashtop)
- Integrated backup capabilities

### API Characteristics
- API v3 is the current version
- Simple API key authentication
- OData-style query support
- Well-documented at app.atera.com/apidocs
- Pagination uses nextLink pattern

### Alert Categories
The alerts skill must document all alert types:
- **Hardware**: Disk space, disk health, memory, CPU temperature
- **Software**: Service status, process monitoring, event log
- **Availability**: Device offline, ping failure
- **Security**: Antivirus status, firewall status
- **Patch**: Missing critical updates, missing all updates

### Common Workflows
1. **Alert Triage**: Review alerts, create tickets, resolve
2. **Device Lookup**: Find device, view specs, check alerts
3. **Customer Overview**: View customer devices, agents, open tickets
4. **Ticket Resolution**: Find related device, diagnose, resolve ticket

---

## Acceptance Criteria

1. All 6 skills exist with proper frontmatter (description, triggers)
2. All 4 commands exist with proper frontmatter (name, description, arguments)
3. Each skill contains: Overview, Key Concepts, Field Reference, API Patterns, Workflows, Error Handling, Best Practices, Related Skills
4. Each command contains: Prerequisites, Steps, Parameters, Examples, Output, Error Handling
5. Alerts skill documents all alert categories and severities
6. plugin.json correctly references all skills and commands
7. .mcp.json is configured for atera-mcp server
8. No hardcoded credentials in any file
9. API examples validated against Atera documentation
10. Marketplace.json updated with atera plugin entry
