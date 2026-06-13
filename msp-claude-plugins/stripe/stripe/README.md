# Stripe Plugin

Claude Code plugin for Stripe — payments, subscriptions, invoices, and customer management via Stripe's first-party hosted MCP server.

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

## What this plugin provides

WYRE-authored skill / agent / command content (strong first pass, 2026-06-13):

**Skills**
- `payments` — payment intents, charges, refunds, balance & payouts; reading *why* a payment failed.
- `subscriptions` — products/prices, subscription audit + changes, the invoice lifecycle + dunning.
- `disputes` — chargeback triage by deadline, evidence assembly + submission (draft → review → submit), outcomes.

**Agent**
- `stripe-billing-support` — billing/revenue-ops persona with confirm-before-write money discipline.

**Commands**
- `/dispute-triage` — open disputes as a deadline-ordered work queue.
- `/subscription-audit <customer>` — a customer's plan / status / renewal / dunning health snapshot.

The hosted Stripe MCP server serves the actual tools through the connection; this content is a guidance/enhancement layer (workflows, safety, domain framing), not a prerequisite for tool access. Tool names referenced are the gateway-prefixed `stripe__*` form — confirm exact names against a live `tools/list` once connected.

**Deferred (follow-up):** a dedicated payout-reconciliation skill, more commands (e.g. `/refund-lookup`, `/payout-reconcile`), and exact tool-name verification against the live hosted server (this pass was authored without live credentials, per the overnight scope).

## Conduit relevance

**YES (data layer).** This new plugin content regenerates `docs/src/data/plugins.ts`, and conduit's white-label docs `public/` is built from this Astro source at CI time (per `conduit/docs/white-label.md`). So these plugin pages propagate to conduit's white-label docs — flagged for the conduit digest. (Determined read-only, 2026-06-13.)

## See also

- WYRE MCP Gateway vendor config: `src/credentials/vendor-config.ts` (`stripe:` entry)
- Stripe MCP docs: https://docs.stripe.com/mcp
- Hosted endpoint: https://mcp.stripe.com
