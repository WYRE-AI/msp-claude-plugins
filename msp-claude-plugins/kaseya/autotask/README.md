# Kaseya Autotask Plugin

Claude Code plugin for Kaseya Autotask PSA integration.

## Overview

This plugin provides Claude with deep knowledge of Autotask PSA, enabling:

- **Ticket Management** - Create, search, update, and manage service tickets
- **Service Calls** - Schedule and manage service calls, link tickets, assign technicians
- **CRM Operations** - Company and contact management
- **Project Management** - Project creation, task tracking, resource assignment
- **Contract Management** - Service agreements, billing, renewals
- **Time Entry** - Log time against tickets and projects

## Configuration

### Connect through Conduit

This plugin ships no `.mcp.json` and reads no environment variables. Connect Autotask once in Conduit (**Connections → Autotask PSA**, slug `autotask`); Conduit stores the credentials and injects them on every request. Then add the unified connector `https://conduit.wyre.ai/v1/mcp` to your MCP client (or install the `wyre-gateway` plugin); your client signs in to Conduit with OAuth.

| Conduit connection field |
|---|
| Username |
| Secret |
| Integration Code |

## Self-Hosted Gateway

There is no per-plugin URL setting, and setting an environment variable does not register an MCP server. To use your own gateway instead of Conduit, register it as an MCP server in your client, for example `claude mcp add --transport http autotask https://your-gateway-domain/v1/autotask/mcp`. The gateway then holds the Autotask credentials, not the client.

### Obtaining API Credentials

1. **Create an API User**
   - Log into Autotask as an administrator
   - Navigate to **Admin > Resources (Users) > Resources/Users**
   - Create a new resource with **API User** security level
   - Note the username (email) and generate a secret key

2. **Get Your Integration Code**
   - Navigate to **Admin > Account Settings & Users > Other > API Integration Code**
   - Copy your integration code (or create one if none exists)

3. **Find Your API Zone**
   - Your zone is determined by your Autotask data center location
   - Common zones: `webservices1`, `webservices2`, `webservices5`, `webservices6`
   - Use the [Zone Information API](https://webservices5.autotask.net/atservicesrest/v1.0/zoneInformation?user=youremail@company.com) to find your zone:

   ```bash
   curl "https://webservices5.autotask.net/atservicesrest/v1.0/zoneInformation?user=your-email@company.com"
   ```

### Testing Your Connection

To check the credentials directly against Autotask before you save them in Conduit, export them in your shell and run:

```bash
# Through Conduit, call autotask_test_connection instead.
# Direct check with curl (export AUTOTASK_USERNAME first):
curl "https://webservices5.autotask.net/atservicesrest/v1.0/zoneInformation?user=${AUTOTASK_USERNAME}"
```

### API Documentation

- [Autotask REST API Documentation](https://ww5.autotask.net/help/DeveloperHelp/Content/APIs/REST/REST_API_Home.htm)
- [Zone Information](https://www.autotask.net/help/DeveloperHelp/Content/APIs/REST/API_Calls/REST_API_Zone_Information.htm)

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install autotask@msp-claude-plugins
```

Then connect Autotask in Conduit (see **Connect through Conduit**). The plugin adds skills and commands; the tools come from the Conduit connector.

## Available Skills

| Skill | Description |
|-------|-------------|
| `tickets` | Service ticket management - create, update, search, notes, SLAs |
| `service-calls` | Service call scheduling, ticket linking, and technician assignment |
| `crm` | Company and contact management |
| `projects` | Project and task management |
| `contracts` | Service agreement and billing |
| `time-entries` | Time tracking, approval workflows, billing |
| `expenses` | Expense reports, line items, approval workflows |
| `quotes` | Quote builder - create quotes with line items, discounts, pricing |
| `product-catalog` | Products, services, and service bundles |
| `configuration-items` | Asset/device management and inventory |
| `tool-discovery` | Progressive tool discovery and intent-based routing |
| `api-patterns` | Common Autotask API patterns and authentication |

## Available Commands

| Command | Description |
|---------|-------------|
| `/create-ticket` | Create a new service ticket |
| `/search-tickets` | Search for tickets by criteria |
| `/update-account` | Update company information |
| `/create-project` | Create a new project |
| `/time-entry` | Log time against a ticket or project |

## API Documentation

- [Autotask REST API Documentation](https://ww5.autotask.net/help/DeveloperHelp/Content/APIs/REST/REST_API_Home.htm)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.
