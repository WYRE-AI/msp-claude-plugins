---
description: Get detailed information about a NinjaOne device
argument-hint: "<device_id>"
arguments: [device_id]
---

Get detailed information for NinjaOne device ID "$ARGUMENTS.device_id".

## Arguments

- `device_id` (required) — The NinjaOne device ID

## Instructions

1. Fetch device details from the API
2. Get additional context:
   - Hardware inventory (disks, volumes, processors)
   - Installed software (if available)
   - Active alerts/conditions
   - Recent activities
3. Present a comprehensive device summary

## API Endpoints

- Device details: `GET /api/v2/device/{id}`
- Disks: `GET /api/v2/device/{id}/disks`
- Volumes: `GET /api/v2/device/{id}/volumes`
- Processors: `GET /api/v2/device/{id}/processors`
- Software: `GET /api/v2/device/{id}/software`
- Alerts: `GET /api/v2/device/{id}/alerts`
- Activities: `GET /api/v2/device/{id}/activities`

## Output Format

### Device: {hostname}

**Organization:** {org_name}
**Type:** {device_role}
**Status:** {online/offline}
**Last Contact:** {timestamp}

#### System Information
- **OS:** Windows Server 2022 / Windows 11 / macOS
- **IP Address:** 192.168.x.x
- **Agent Version:** x.x.x

#### Hardware
- **CPU:** {processor_info}
- **RAM:** {memory}
- **Disks:** {disk_summary with free space}

#### Active Alerts
| Alert | Severity | Since |
|-------|----------|-------|
| {alert_message} | {severity} | {time} |

#### Recent Activity
- {timestamp}: {activity_description}
