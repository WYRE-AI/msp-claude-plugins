# ThreatLocker Plugin

Claude Code plugin for the ThreatLocker zero-trust endpoint protection platform.

## Overview

This plugin provides Claude with deep knowledge of ThreatLocker, enabling MSP analysts to triage approval requests, investigate audit logs, and report on managed computer fleets without leaving the chat.

## What It Does

- **Approval Request Triage** - Surface pending application approval requests, group by app/computer, and recommend approve/deny with reasoning based on signer, file hash, and request justification
- **Audit Log Investigation** - Search the ThreatLocker audit trail for blocked actions, policy bypasses, and repeated denials around a security event, and assemble timelines
- **Computer Inventory** - Generate fleet reports across organizations - by OS, by group, by check-in recency
- **Computer Groups** - Browse and pivot through ThreatLocker computer groups to scope policies and reports
- **Multi-Tenant Pivot** - Enumerate child organizations and surface their pending approvals and audit volume in a single view for MSP analysts

## Installation

Install via the [MSP Claude Plugins marketplace](https://github.com/wyre-technology/msp-claude-plugins):

```
/plugin marketplace add wyre-technology/msp-claude-plugins
/plugin install threatlocker
```

The plugin connects through [Conduit](https://conduit.wyre.ai) at `https://conduit.wyre.ai/v1/threatlocker/mcp`.

## Configuration

Set the following environment variables (or paste your credentials into the gateway UI):

| Variable | Required | Description |
|----------|----------|-------------|
| `THREATLOCKER_API_KEY` | Yes | API key generated from your ThreatLocker portal under user profile / API keys |
| `THREATLOCKER_ORGANIZATION_ID` | No | Organization UUID to scope requests. Leave blank to use your primary organization. MSPs can pivot to child orgs via `threatlocker_organizations_list_children` |

See [ThreatLocker documentation](https://docs.threatlocker.com/) for instructions on issuing an API key and locating your organization UUID.

## Available Commands

| Command | Description |
|---------|-------------|
| `/approval-triage` | Prioritize pending approval requests with approve/deny recommendations |
| `/audit-investigation` | Build a timeline of audit events around a security incident |
| `/computer-inventory` | Generate a managed computer report grouped by OS, group, and check-in age |
| `/offline-agents` | Find agents that have not checked in within tiered windows (24h / 7d / 30d) |
| `/tenant-overview` | Multi-tenant pivot - approval counts and audit volume across child orgs |

## Available Tools

Provided by the ThreatLocker MCP server through the WYRE MCP Gateway:

### Computers
- `threatlocker_computers_list` - List managed computers
- `threatlocker_computers_get` - Get details for a single computer
- `threatlocker_computers_get_checkins` - Inspect agent check-in history

### Computer Groups
- `threatlocker_computer_groups_list` - List computer groups
- `threatlocker_computer_groups_get` - Get group details and members

### Approval Requests
- `threatlocker_approvals_list` - List approval requests (filterable by status)
- `threatlocker_approvals_get` - Get a single approval request
- `threatlocker_approvals_pending_count` - Quick count of pending approvals

### Audit Log
- `threatlocker_audit_search` - Search audit events by computer, user, file, or time window
- `threatlocker_audit_file_history` - Trace the history of a file path across the audit log

### Organizations
- `threatlocker_organizations_list_children` - Enumerate child organizations (MSP)
- `threatlocker_organizations_get` - Get organization details

## License

Apache-2.0
