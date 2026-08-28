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

### Environment Variables

Set the following environment variables:

```bash
export DATTO_API_KEY="your-api-key"
export DATTO_API_SECRET="your-api-secret"
export DATTO_PLATFORM="merlot"  # Your platform
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATTO_API_KEY` | Yes | | Your Datto RMM API key |
| `DATTO_API_SECRET` | Yes | | Your Datto RMM API secret |
| `DATTO_PLATFORM` | Yes | | Your platform (e.g., `merlot`, `pinotage`, `concord`) |
| `DATTO_RMM_MCP_URL` | No | `https://datto-rmm-mcp.wyre.workers.dev/mcp` | MCP server URL — override to use a self-hosted gateway |

## Self-Hosted Gateway

If you run the [mcp-gateway](https://github.com/WYRE-AI/mcp-gateway), set `DATTO_RMM_MCP_URL` to your gateway's endpoint:

```
DATTO_RMM_MCP_URL=https://your-gateway-domain/v1/datto-rmm/mcp
```

**Setting env vars in Claude.ai:** Go to your org → Settings → Integrations → Datto RMM → Configure and add the variable.

**Setting env vars in Claude Code:** Add to `~/.claude/settings.json`:
```json
{
  "env": {
    "DATTO_RMM_MCP_URL": "https://your-gateway-domain/v1/datto-rmm/mcp"
  }
}
```

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
