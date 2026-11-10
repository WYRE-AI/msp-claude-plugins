# Proofpoint Essentials Plugin

Claude Code plugin for Proofpoint Essentials integration.

## Overview

Proofpoint Essentials is Proofpoint's SMB/MSP-tier email security product —
a distinct product, API, and credential model from Proofpoint TAP (covered
by the sibling [`proofpoint`](../proofpoint) plugin: threat intel,
quarantine, forensics, URL Defense). Essentials manages customer
organizations under an MSP's reseller account.

This plugin provides Claude with deep knowledge of the Proofpoint Essentials
API, enabling:

- **Organization Lifecycle** - Get an org and its domains, activate,
  deactivate, and delete
- **Domain Management** - List, add, update, and remove domains within a
  customer org
- **User Management** - List, get, create (including batch), update, and
  delete mailbox-protected users
- **Endpoint Discovery** - Resolve which regional pod (us1, eu1, etc.) hosts
  a given customer org
- **Features** - View and modify enabled product features for an org
- **Licensing** - View and modify an org's license allocation
- **Package** - Change an org's subscription tier
- **Reporting** - Inbound/outbound email flow metrics (time-series) for an
  org
- **SSO Token** - Mint an Odin-based token for console handoff to a
  technician

## Tool Surface

This plugin documents the tool surface of the companion
[`proofpoint-essentials-mcp`](https://github.com/WYRE-AI/proofpoint-essentials-mcp)
server, which is under active development and not yet published. Tool names
below follow the `proofpoint_essentials_{resource}_{operation}` convention
the server is being built to.

| Group | Tools |
|---|---|
| Discovery | `proofpoint_essentials_endpoint_resolve` |
| Organizations | `proofpoint_essentials_org_get`, `proofpoint_essentials_org_activate`, `proofpoint_essentials_org_deactivate`, `proofpoint_essentials_org_delete` |
| Domains | `proofpoint_essentials_domains_list`, `proofpoint_essentials_domains_create`, `proofpoint_essentials_domains_update`, `proofpoint_essentials_domains_delete` |
| Users | `proofpoint_essentials_users_list`, `proofpoint_essentials_users_get`, `proofpoint_essentials_users_create`, `proofpoint_essentials_users_update`, `proofpoint_essentials_users_delete` |
| Features | `proofpoint_essentials_features_get`, `proofpoint_essentials_features_update` |
| Licensing | `proofpoint_essentials_licensing_get`, `proofpoint_essentials_licensing_update` |
| Package | `proofpoint_essentials_package_update` |
| Reporting | `proofpoint_essentials_reporting_get` |
| SSO | `proofpoint_essentials_token_create` |

Until the MCP server ships, this plugin's skills and commands are still
useful on their own: they document the Proofpoint Essentials REST API
directly (auth model, base URL/region resolution, resource shapes, batch
semantics, error handling) for anyone calling the API by hand or building
against it.

## Configuration

### Connect through Conduit

This plugin ships no `.mcp.json` and reads no environment variables. Connect Proofpoint Essentials once in Conduit at `https://conduit.wyre.ai/connect/proofpoint-essentials` (**Connections → Proofpoint Essentials**, slug `proofpoint-essentials`); Conduit stores the credentials and injects them on every request. Then install the `wyre-gateway` plugin (or add the unified connector `https://conduit.wyre.ai/v1/mcp` to your MCP client); your client signs in to Conduit with OAuth.

| Conduit connection field | Notes |
|---|---|
| Username | Essentials console login (email) |
| Password | Password for that login |
| Region | Optional; defaults to `us1` |

Proofpoint Essentials authenticates with **org-admin credentials**, the
same email and password used to sign into the Essentials console, not an
API key. A reseller-level admin can act on any customer org the reseller
manages; a customer-org admin is scoped to that one org only. There is no
separate key to generate or rotate. `us1` also serves as the
endpoint-discovery anchor for orgs hosted on other regional pods. See the
`api-patterns` skill for the full authentication and regional-routing
model.

Conduit only checks that Username and Password are filled in when you save
the connection: Essentials has no org-independent endpoint to test them
against. A wrong password shows up as a 401 on the first tool call.

## Self-Hosted Gateway

There is no per-plugin URL setting, and setting an environment variable does not register an MCP server. To use your own gateway instead of Conduit, register it as an MCP server in your client, for example `claude mcp add --transport http proofpoint-essentials https://your-gateway-domain/v1/proofpoint-essentials/mcp`. The gateway then holds the Proofpoint Essentials credentials, not the client.

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install wyre-gateway@msp-claude-plugins
/plugin install proofpoint-essentials@msp-claude-plugins
```

Then connect Proofpoint Essentials in Conduit (see **Connect through Conduit**). The plugin adds skills and commands; the tools come from the Conduit connector.

## Troubleshooting

### Authentication Errors

If a tool call returns "401 Unauthorized":
1. Open the Proofpoint Essentials connection in Conduit (`https://conduit.wyre.ai/connect/proofpoint-essentials`) and re-enter the Username and Password
2. Sign in to the Essentials console with the same credentials to confirm they still work
3. Check that the login is an org admin (or reseller admin, for customer orgs you manage)

## Available Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | Auth model, regional pod resolution via endpoint discovery, batch-create 207 multi-status handling, error codes |
| `org-management` | Org lifecycle (get/activate/deactivate/delete), domains, features, licensing, package tier, SSO token |
| `user-management` | Mailbox user list/get/create (including batch)/update/delete |
| `reporting` | Inbound/outbound email flow time-series metrics |

## Available Commands

| Command | Description |
|---------|-------------|
| `/search-org` | Resolve a customer org by name or domain and show its details |
| `/org-health-check` | Full read-only health sweep: lifecycle, domains, users, features/licensing, recent mail flow |

## API Documentation

- [Proofpoint Essentials](https://www.proofpoint.com/us/products/email-security-and-protection/essentials)

## Contributing

See the main [CONTRIBUTING.md](../../../CONTRIBUTING.md) for guidelines.
