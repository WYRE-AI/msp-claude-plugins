# KPN Plugin

Claude plugin for **KPN**, the Dutch incumbent telco, through the Conduit gateway.
Backed by [`WYRE-AI/kpn-mcp`](https://github.com/WYRE-AI/kpn-mcp), which talks to KPN's
**Grexx** (IRMA) wholesale interface. Every tool is named `kpn_grexx_*`.

> **Preview in Conduit.** The `kpn` connector carries Conduit's early-access "Preview"
> badge, so its tool surface can still change.

| Area | What an MSP uses it for | Tools |
|---|---|---|
| Connection test | Verify the Grexx credentials mint a token | `kpn_grexx_test_connection` |
| Address checks | Technology, speeds, product availability and planned work at a Dutch address | `kpn_grexx_zipcode_check`, `kpn_grexx_prequalification`, `kpn_grexx_carrier_info` |
| Customers and orders | Find a customer card and its orders | `kpn_grexx_customer_data`, `kpn_grexx_order_summary`, `kpn_grexx_order_data` |
| Line diagnostics | Is the line up, is it flapping, start a KPN line test | `kpn_grexx_ras_check`, `kpn_grexx_radius_check`, `kpn_grexx_start_line_diagnose` (write) |
| Business mobile | Lines, SIM/eSIM, blocks and limits, usage, portings | `kpn_grexx_mobile_orders`, `kpn_grexx_get_sim`, `kpn_grexx_mobile_settings`, `kpn_grexx_mobile_usage`, `kpn_grexx_available_portings` |

Everything is read-only except `kpn_grexx_start_line_diagnose`. SIM blocks and
replacements, order approvals and invoices are handled in the Grexx portal.

## Skills

- **api-patterns**: credentials, the Grexx test vs production environment, the IRMA customer/order model, errors.
- **network-checks**: address checks and line diagnostics for Dutch sites.
- **mobile-fleet**: read-only business-mobile lookups.

## Commands

- `/kpn:check-outage <postcode> <house number>`: line state and planned work for a site.
- `/kpn:lost-phone <mobile number>`: identify the line and SIM of a lost or stolen phone for blocking in the portal.

## Setup

Connect **KPN** in Conduit with the client ID and secret from the Grexx portal
(**API Gegevens**). Leave both Grexx URL fields blank to use KPN's Grexx test
environment (acceptatie); set both for production. This plugin does not ship a
`.mcp.json`; install the `wyre-gateway` plugin to connect Claude Code to
`https://conduit.wyre.ai/v1/mcp`.

## Limitations

- Netherlands only.
- Per-line tools need the IRMA order ID; find it with `kpn_grexx_order_summary`.
