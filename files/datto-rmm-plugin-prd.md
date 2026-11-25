# Datto RMM Claude Code Plugin

## Product Requirements Document

**Version:** 1.0
**Author:** Aaron / WYRE AI
**Date:** February 4, 2026
**Status:** Draft
**Repository:** `kaseya/datto-rmm` (within msp-claude-plugins)
**Parent Project:** MSP Claude Plugin Marketplace

---

## Executive Summary

The Datto RMM Claude Code Plugin provides comprehensive skills and commands for interacting with Datto RMM, the remote monitoring and management platform. It enables Claude to assist with managing devices, alerts, sites, jobs, and audit information across the RMM infrastructure.

The plugin leverages the `node-datto-rmm` library for API connectivity and follows the established plugin architecture pattern from the Autotask plugin.

---

## Problem Statement

Datto RMM is a critical tool for MSPs managing endpoints across client environments. Technicians frequently need to:

- Check device status and audit information
- Respond to and resolve alerts
- Run quick jobs and scripts on devices
- Look up device details by hostname, IP, or MAC address
- View site information and device inventories

Without Claude skills for Datto RMM, technicians must navigate the RMM console separately, reducing efficiency during troubleshooting and incident response.

---

## Goals

1. **Comprehensive Skills** — Cover all major Datto RMM domains (devices, alerts, sites, jobs, audit)
2. **Practical Commands** — Provide slash commands for common operations (device-lookup, resolve-alert, run-job)
3. **API Integration** — Integrate with node-datto-rmm library via MCP server
4. **Alert Context Types** — Document all 25+ alert context types for intelligent alert handling
5. **Cross-Platform** — Support all 6 Datto RMM platforms (Pinotage, Merlot, Concord, Vidal, Zinfandel, Syrah)

---

## Technical Specifications

### Directory Structure

```
kaseya/datto-rmm/
├── .claude-plugin/
│   └── plugin.json
├── .mcp.json
├── README.md
├── skills/
│   ├── devices/
│   │   └── SKILL.md
│   ├── alerts/
│   │   └── SKILL.md
│   ├── sites/
│   │   └── SKILL.md
│   ├── jobs/
│   │   └── SKILL.md
│   ├── audit/
│   │   └── SKILL.md
│   ├── variables/
│   │   └── SKILL.md
│   └── api-patterns/
│       └── SKILL.md
└── commands/
    ├── device-lookup.md
    ├── resolve-alert.md
    ├── run-job.md
    └── site-devices.md
```

### Plugin Manifest (plugin.json)

```json
{
  "name": "kaseya-datto-rmm",
  "version": "1.0.0",
  "description": "Claude plugins for Datto RMM - devices, alerts, sites, jobs, remote monitoring",
  "author": "MSP Claude Plugins Community",
  "vendor": "kaseya",
  "product": "datto-rmm",
  "api_version": "v2",
  "requires_api_key": true,
  "documentation_url": "https://rmm.datto.com/help/en/Content/2SETUP/APIv2.htm",
  "skills": [
    "devices",
    "alerts",
    "sites",
    "jobs",
    "audit",
    "variables",
    "api-patterns"
  ],
  "commands": [
    "device-lookup",
    "resolve-alert",
    "run-job",
    "site-devices"
  ]
}
```

### MCP Configuration (.mcp.json)

```json
{
  "mcpServers": {
    "datto-rmm": {
      "command": "npx",
      "args": ["-y", "datto-rmm-mcp"],
      "env": {
        "DATTO_API_KEY": "${DATTO_API_KEY}",
        "DATTO_API_SECRET": "${DATTO_API_SECRET}",
        "DATTO_PLATFORM": "${DATTO_PLATFORM:-merlot}"
      }
    }
  }
}
```

---

## Skills Specification

### 1. Devices Skill

**Purpose:** Managing devices in Datto RMM

**Key Content:**
- Device identifiers (deviceUid, deviceId, hostname, MAC address)
- Device types (Workstation, Server, ESXi Host, Network Device)
- Device statuses (Online, Offline, Rebooting)
- Operating system information
- Last seen / last reboot timestamps
- User-defined fields (UDF1-UDF30)
- Warranty information
- Site assignment
- API patterns for device operations

**Triggers:**
- datto device
- rmm device
- device status
- device lookup
- managed device

### 2. Alerts Skill

**Purpose:** Managing and responding to RMM alerts

**Key Content:**
- Alert structure (alertUid, priority, timestamp, context)
- Alert context types (25+ types including):
  - `antivirus_ctx` — Antivirus status
  - `comp_script_ctx` — Component script results
  - `eventlog_ctx` — Windows event log
  - `online_offline_status_ctx` — Device online/offline
  - `perf_disk_usage_ctx` — Disk usage
  - `perf_resource_usage_ctx` — CPU/Memory
  - `patch_ctx` — Patch status
  - `process_status_ctx` — Process monitoring
  - `srvc_status_ctx` — Service monitoring
  - `ransomware_ctx` — Ransomware detection
- Alert priorities and severity mapping
- Open vs resolved alerts
- Alert resolution workflow
- Muting alerts (deprecated)
- API patterns for alert management

**Triggers:**
- datto alert
- rmm alert
- device alert
- alert resolution
- monitoring alert

### 3. Sites Skill

**Purpose:** Managing sites (client locations) in Datto RMM

**Key Content:**
- Site structure (siteUid, name, description)
- Site settings and configurations
- Proxy settings
- Site-level variables
- Site filters
- Device assignment to sites
- Site-level alerts
- API patterns for site management

**Triggers:**
- datto site
- rmm site
- client site
- site management
- location management

### 4. Jobs Skill

**Purpose:** Managing and running jobs in Datto RMM

**Key Content:**
- Job types (Quick Jobs, Scheduled Jobs)
- Job structure (jobUid, status, components)
- Job statuses (Active, Completed, Failed)
- Component scripts and variables
- Job results (stdout, stderr)
- Running quick jobs on devices
- Job monitoring and tracking
- API patterns for job operations

**Triggers:**
- datto job
- rmm job
- quick job
- run script
- component job

### 5. Audit Skill

**Purpose:** Accessing device audit information

**Key Content:**
- Device audit data (hardware, software, network)
- Software inventory
- Hardware specifications
- Network interfaces and IP addresses
- ESXi host audit information
- Printer audit information
- Audit data freshness and timing
- API patterns for audit retrieval

**Triggers:**
- datto audit
- device audit
- software inventory
- hardware inventory
- system audit

### 6. Variables Skill

**Purpose:** Managing account and site-level variables

**Key Content:**
- Account-level variables
- Site-level variables
- Variable CRUD operations
- Using variables in jobs/scripts
- Variable naming conventions
- API patterns for variable management

**Triggers:**
- datto variable
- rmm variable
- account variable
- site variable
- script variable

### 7. API Patterns Skill

**Purpose:** Foundation skill for Datto RMM API interactions

**Key Content:**
- OAuth 2.0 authentication flow
- Platform-specific base URLs (6 platforms)
- Token lifecycle (100-hour expiry, refresh)
- Rate limiting (600 req/60s, IP blocking)
- Pagination (250 max per page, nextPageUrl)
- Timestamp handling (Unix milliseconds)
- Error handling (401, 403, 404, 429)
- Common query parameters

**Triggers:**
- datto api
- rmm api
- datto authentication
- rmm query

---

## Commands Specification

### 1. device-lookup Command

**Purpose:** Find a device by hostname, IP, or MAC address

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| identifier | Yes | Hostname, IP address, or MAC address |
| site | No | Filter by site name |

**Example:**
```
/device-lookup "ACME-DC01"
/device-lookup "192.168.1.100"
/device-lookup "00:1A:2B:3C:4D:5E"
```

**Output:** Device details including status, OS, last seen, site, alerts

### 2. resolve-alert Command

**Purpose:** Resolve an open alert

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| alert-id | Yes | Alert UID or partial match from device name |
| note | No | Resolution note |

**Example:**
```
/resolve-alert "alert-uid-12345"
/resolve-alert "ACME-DC01" --note "Disk space cleared"
```

**Output:** Confirmation of alert resolution

### 3. run-job Command

**Purpose:** Run a quick job on a device

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| device | Yes | Device hostname or UID |
| component | Yes | Component script UID or name |
| variables | No | Job variables as key=value pairs |

**Example:**
```
/run-job "ACME-DC01" "Clear Temp Files" --variables "days=30,path=C:\\Temp"
```

**Output:** Job status and results (stdout/stderr when complete)

### 4. site-devices Command

**Purpose:** List devices at a site

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| site | Yes | Site name or UID |
| status | No | Filter by status (online, offline, all) |
| type | No | Filter by device type |

**Example:**
```
/site-devices "Acme Corp" --status online
/site-devices "Acme Corp" --type server
```

**Output:** Device list with status, OS, last seen

---

## Implementation Phases

### Phase 1 — Plugin Structure & Foundation
- Create directory structure
- Create plugin.json manifest
- Create .mcp.json configuration
- Create api-patterns skill
- Create README.md

### Phase 2 — Core Skills
- Create devices skill
- Create alerts skill (with all 25+ context types)
- Create sites skill

### Phase 3 — Operational Skills
- Create jobs skill
- Create audit skill
- Create variables skill

### Phase 4 — Commands
- Create device-lookup command
- Create resolve-alert command
- Create run-job command
- Create site-devices command

### Phase 5 — Testing & Documentation
- Validate all skills have required sections
- Validate all commands have required arguments
- Test MCP integration
- Update marketplace.json with new plugin
- Create comprehensive README

---

## Alert Context Types Reference

The alerts skill must document all context types:

| @class | Alert Type | Key Fields |
|--------|------------|------------|
| `antivirus_ctx` | Antivirus Status | status, product, lastScan |
| `comp_script_ctx` | Component Script | exitCode, stdout, stderr |
| `custom_snmp_ctx` | SNMP | oid, value, threshold |
| `disk_health_ctx` | ESXi Disk Health | diskName, status, capacity |
| `eventlog_ctx` | Event Log | source, eventId, type, message |
| `fan_ctx` | ESXi Fan | fanName, status, rpm |
| `fs_object_ctx` | File/Folder Size | path, size, threshold |
| `online_offline_status_ctx` | Online Status | status, lastSeen, offlineDuration |
| `patch_ctx` | Patch | patchCount, criticalCount, lastScan |
| `perf_disk_usage_ctx` | Disk Usage | drive, usagePercent, freeSpace |
| `perf_mon_ctx` | Windows Performance | counter, value, threshold |
| `perf_resource_usage_ctx` | CPU/Memory | resource, usagePercent, threshold |
| `ping_ctx` | Ping | host, latency, packetLoss |
| `process_resource_usage_ctx` | Process CPU/Memory | processName, cpu, memory |
| `process_status_ctx` | Process Status | processName, status, pid |
| `psu_ctx` | ESXi PSU | psuName, status |
| `ransomware_ctx` | Ransomware | detectionType, path, action |
| `sec_management_ctx` | Webroot Security | status, threatCount |
| `srvc_resource_usage_ctx` | Service CPU/Memory | serviceName, cpu, memory |
| `srvc_status_ctx` | Service Status | serviceName, status, startType |
| `sw_action_ctx` | Software | action, softwareName, version |
| `temperature_ctx` | ESXi Temperature | sensorName, temperature, threshold |
| `wmi_ctx` | WMI | query, property, value |

---

## Acceptance Criteria

1. All 7 skills exist with proper frontmatter (description, triggers)
2. All 4 commands exist with proper frontmatter (name, description, arguments)
3. Each skill contains: Overview, Key Concepts, Field Reference, API Patterns, Workflows, Error Handling, Best Practices, Related Skills
4. Each command contains: Prerequisites, Steps, Parameters, Examples, Output, Error Handling
5. Alerts skill documents all 25+ alert context types with TypeScript-style definitions
6. plugin.json correctly references all skills and commands
7. .mcp.json is configured for datto-rmm-mcp server with platform support
8. No hardcoded credentials in any file
9. API examples validated against Datto RMM documentation
10. Marketplace.json updated with datto-rmm plugin entry
