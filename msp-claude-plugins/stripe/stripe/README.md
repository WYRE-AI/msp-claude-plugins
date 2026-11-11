# Stripe Plugin

Claude Code plugin for Stripe — payments, subscriptions, invoices, and customer management via Stripe's first-party hosted MCP server.

> **Not currently brokered by Conduit.** Conduit has no `stripe` vendor, so there is no slug to connect and a connect attempt through `https://conduit.wyre.ai` fails. The connection model below describes how a gateway operator would wire Stripe's hosted MCP server; it is not available in Conduit today. This plugin ships no `.mcp.json`, so nothing is silently misrouted.

## Overview

This plugin connects to Stripe's hosted MCP server at `mcp.stripe.com`, exposing Stripe API operations to Claude:

- **Payments** — charges, payment intents, refunds, disputes
- **Subscriptions** — products, prices, subscriptions, subscription items
- **Customers** — customer profiles, addresses, payment methods, tax IDs
- **Invoices** — invoice lifecycle, line items, payment collection
- **Reporting** — balance transactions, payouts, financial reporting queries

## Prerequisites

### Connection model

Stripe's hosted MCP uses **OAuth 2.1 + PKCE with a public client** (`token_endpoint_auth_methods=['none']` — no client_secret). One-time provisioning required: the WYRE Gateway operator POSTs to `https://access.stripe.com/mcp/oauth2/register` to obtain a `client_id`, then sets `STRIPE_CLIENT_ID` in the gateway environment.

### Per-tenant authorization

Each tenant authorizes their own Stripe account through the gateway's OAuth flow — no shared credentials.

## Status

**Scaffold-only.** This plugin currently provides the marketplace registration + connection wiring; WYRE-authored skill/agent/command content is deliberately empty and will be filled in via follow-up PRs (likely with security/policy review for sensitive payment operations).

The hosted Stripe MCP server serves its own tools through the connection; this plugin's local skill content is an enhancement layer, not a prerequisite for tool access.

## See also

- Conduit vendor config: none yet (`stripe` is not in Conduit's `VENDORS`)
- Stripe MCP docs: https://docs.stripe.com/mcp
- Hosted endpoint: https://mcp.stripe.com
