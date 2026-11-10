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

This plugin documents the 20 tools of the companion
[`proofpoint-essentials-mcp`](https://github.com/WYRE-AI/proofpoint-essentials-mcp)
server, which Conduit brokers as the `proofpoint-essentials` vendor. Every
org-scoped tool takes the org's primary domain (`domain` or `orgDomain`).

| Group | Tools |
|---|---|
| Discovery | `proofpoint_essentials_endpoint_discover` |
| Organizations | `proofpoint_essentials_org_get`, `proofpoint_essentials_org_set_active`, `proofpoint_essentials_org_delete` |
| Domains | `proofpoint_essentials_domains_list`, `proofpoint_essentials_domains_create`, `proofpoint_essentials_domains_update`, `proofpoint_essentials_domains_delete` |
| Users | `proofpoint_essentials_users_list`, `proofpoint_essentials_users_get`, `proofpoint_essentials_users_create`, `proofpoint_essentials_users_update`, `proofpoint_essentials_users_delete` |
| Features | `proofpoint_essentials_features_get`, `proofpoint_essentials_features_update` |
| Licensing | `proofpoint_essentials_licensing_get`, `proofpoint_essentials_licensing_update` |
| Package | `proofpoint_essentials_package_update` |
| Reporting | `proofpoint_essentials_reporting_get` |
| SSO | `proofpoint_essentials_token_create` |

## Configuration

Proofpoint Essentials authenticates with **org-admin credentials** — the
same email/password used to sign into the Essentials console — not an API
key. A reseller-level admin can act on any customer org the reseller
manages; a customer-org admin is scoped to that one org only. There is no
separate key to generate or rotate — see the `api-patterns` skill for the
full authentication and regional-routing model.

Connect Proofpoint Essentials in [Conduit](https://conduit.wyre.ai) and
enter the connection fields there:

| Field | Required | Notes |
|---|---|---|
| Username | Yes | The admin login email |
| Password | Yes | The admin login password |
| Region | No | Regional pod, e.g. `us1` or `eu1`. Defaults to `us1` |

Every tool call goes to the connection's region. Use
`proofpoint_essentials_endpoint_discover` to find which pod hosts an org.

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
| `/search-org` | Resolve a customer org by its primary domain and show its details |
| `/org-health-check` | Full read-only health sweep: lifecycle, domains, users, features/licensing, recent mail flow |

## API Documentation

- [Proofpoint Essentials](https://www.proofpoint.com/us/products/email-security-and-protection/essentials)

## Contributing

See the main [CONTRIBUTING.md](../../../CONTRIBUTING.md) for guidelines.
