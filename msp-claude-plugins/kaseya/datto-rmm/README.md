# Kaseya Datto RMM Plugin

Claude Code plugin for Kaseya Datto RMM integration.

## Overview

This plugin provides Claude with deep knowledge of Datto RMM, enabling:

- **Device Management** - Search, view, and manage devices across all sites
- **Alert Handling** - View, triage, and resolve monitoring alerts
- **Site Management** - Manage client sites and device inventories
- **Job Execution** - Run quick jobs and component scripts on devices
- **Audit Data** - Access hardware and software inventory
- **Variables** - Manage account and site-level configuration

## Prerequisites

### API Credentials

You need a Datto RMM API key with appropriate permissions:

1. Log into the Datto RMM web console
2. Navigate to Setup > Global Settings > API
3. Create a new API key or use existing credentials
4. Note your platform (pinotage, merlot, concord, vidal, zinfandel, syrah)

### Connect through Conduit

This plugin ships no `.mcp.json` and reads no environment variables. Connect Datto RMM once in Conduit (**Connections → Datto RMM**, slug `datto-rmm`); Conduit stores the credentials and injects them on every request. Then add the unified connector `https://conduit.wyre.ai/v1/mcp` to your MCP client (or install the `wyre-gateway` plugin); your client signs in to Conduit with OAuth.

| Conduit connection field |
|---|
| API Key |
| API Secret |
| Platform |

## Self-Hosted Gateway

There is no per-plugin URL setting, and setting an environment variable does not register an MCP server. To use your own gateway instead of Conduit, register it as an MCP server in your client, for example `claude mcp add --transport http datto-rmm https://your-gateway-domain/v1/datto-rmm/mcp`. The gateway then holds the Datto RMM credentials, not the client.

### Supported Platforms

Datto RMM operates across 6 regional platforms:

| Platform | Region | API Base URL |
|----------|--------|--------------|
| pinotage | US/Canada | `https://pinotage-api.centrastage.net` |
| merlot | US/Canada | `https://merlot-api.centrastage.net` |
| concord | EU | `https://concord-api.centrastage.net` |
| vidal | EU | `https://vidal-api.centrastage.net` |
| zinfandel | APAC | `https://zinfandel-api.centrastage.net` |
| syrah | UK | `https://syrah-api.centrastage.net` |

## Installation

1. Clone this plugin to your Claude plugins directory
2. Configure environment variables
3. The MCP server will be automatically started when needed

## Available Skills

| Skill | Description |
|-------|-------------|
| `devices` | Device management, status monitoring, user-defined fields |
| `alerts` | Alert handling with 25+ context types |
| `sites` | Site management and configuration |
| `jobs` | Quick job execution and component scripts |
| `audit` | Hardware and software inventory |
| `variables` | Account and site-level variables |
| `api-patterns` | Authentication, pagination, error handling |

## Available Commands

| Command | Description |
|---------|-------------|
| `/device-lookup` | Find a device by hostname, IP, or MAC address |
| `/resolve-alert` | Resolve open alerts |
| `/run-job` | Run a quick job on a device |
| `/site-devices` | List devices at a site |

## Alert Context Types

The alerts skill documents all 25+ alert context types for intelligent alert handling:

| Context Type | Description |
|--------------|-------------|
| `antivirus_ctx` | Antivirus status and detections |
| `comp_script_ctx` | Component script results |
| `eventlog_ctx` | Windows Event Log monitoring |
| `online_offline_status_ctx` | Device connectivity |
| `patch_ctx` | Windows patch status |
| `perf_disk_usage_ctx` | Disk space monitoring |
| `perf_resource_usage_ctx` | CPU/Memory usage |
| `process_status_ctx` | Process monitoring |
| `ransomware_ctx` | Ransomware detection |
| `srvc_status_ctx` | Service monitoring |
| ...and 15+ more |

## Quick Start

### Find a Device

```
/device-lookup "ACME-DC01"
/device-lookup "192.168.1.100"
```

### View and Resolve Alerts

```
/resolve-alert "ACME-DC01"
/resolve-alert "alert-uid" --note "Cleared disk space"
```

### Run a Job

```
/run-job "ACME-DC01" "Clear Temp Files" --wait
/run-job "ACME-DC01" "Disk Cleanup" --variables "days=30"
```

### List Site Devices

```
/site-devices "Acme Corporation"
/site-devices "Acme Corporation" --status online --type server
```

## API Rate Limits

Datto RMM enforces rate limits:
- **600 requests per minute**
- Exceeding limits may result in temporary IP blocking

The plugin implements automatic retry with exponential backoff.

## API Documentation

- [Datto RMM API v2 Documentation](https://rmm.datto.com/help/en/Content/2SETUP/APIv2.htm)
- [API Authentication Guide](https://rmm.datto.com/help/en/Content/2SETUP/APIv2.htm#Authentication)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.

## License

See [LICENSE](../../LICENSE) for details.
