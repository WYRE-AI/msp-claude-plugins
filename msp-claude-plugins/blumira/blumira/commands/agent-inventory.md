---
description: List all devices and agents across the organization with status and health information
argument-hint: "[os] [status]"
arguments: [os, status]
---

# Agent Inventory

## Prerequisites

- Valid Blumira JWT token configured
- Agent deployment in the organization

## Steps

1. Call `blumira_agents_devices_list` with `page_size=100` and `order_by=-last_seen`
2. If OS filter provided, add `os.contains=<value>`
3. Page through all results to build complete inventory
4. Present a summary:
   - Total device count
   - Breakdown by OS
   - Breakdown by status (active, inactive, etc.)
   - Devices with stale `last_seen` timestamps (>24h)
5. Call `blumira_agents_keys_list` to show available deployment keys
6. Highlight any coverage gaps or health concerns

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| os | string | No | Filter by OS (Windows, Linux, macOS) |
| status | string | No | Filter by agent status |

## Examples

### Basic Usage

```
/agent-inventory
```

### Windows Devices Only

```
/agent-inventory --os Windows
```

## Error Handling

- **No devices found:** Verify agents are deployed and token has access
- **Pagination timeout:** Use OS filter to narrow results

## Related Commands

- `/security-posture` - Overall security posture including agent coverage
- `/msp-overview` - MSP-wide device inventory
