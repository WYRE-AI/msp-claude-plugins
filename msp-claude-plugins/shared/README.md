# Shared Skills

Vendor-agnostic MSP knowledge that other plugins in this marketplace build on. It ships no MCP connection of its own; the skills reason over whatever PSA, RMM, documentation and accounting tools are connected through [Conduit](https://conduit.wyre.ai).

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install shared-skills
```

## Skills

| Skill | Covers |
|-------|--------|
| `shared-skills-msp-terminology` | MSP acronyms, roles, contract and billing concepts, and the vocabulary used across PSA, RMM, documentation and security platforms |
| `shared-skills-ticket-triage` | Vendor-agnostic ticket priority, categorisation, routing and first response |
| `shared-skills-incident-correlation` | Combining PSA tickets, RMM device state, documentation assets and configuration changes into one incident summary |
| `shared-skills-billing-reconciliation` | Matching cloud-marketplace subscriptions (Pax8) against accounting invoices (Xero, QuickBooks Online) |
| `shared-skills-wyre-gateway-troubleshooting` | Diagnosing missing vendor tools, OAuth failures and expired credentials on the WYRE gateway |

## Commands

| Command | Purpose |
|---------|---------|
| `/correlate-incident` | Build a cross-tool incident summary |
| `/reconcile-billing` | Reconcile marketplace subscriptions against invoices. It calls the Pax8 and Xero (or QuickBooks) APIs directly, so it needs local `PAX8_TOKEN` / `XERO_TOKEN` (or `QBO_TOKEN`) values and does not work through Conduit connections alone |

Vendor-specific plugins point here (for example `shared-skills-ticket-triage`) instead of repeating the practice in every PSA plugin.

## License

Apache-2.0
