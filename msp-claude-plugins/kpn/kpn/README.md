# KPN Plugin

Claude plugin for **KPN**, the Dutch incumbent telco, through the Conduit gateway.
Backed by [`WYRE-AI/kpn-mcp`](https://github.com/WYRE-AI/kpn-mcp): 23 tools over four
KPN developer-portal products.

| Product | What an MSP uses it for | Tools |
|---|---|---|
| Disturbance Check | "Is KPN down at this customer's office?" | `kpn_disturbances_check` |
| Internet Speed Check | Which access technology and speeds a Dutch address can get | `kpn_availability_check` |
| SIM Swap | Fraud check before resetting SMS-based MFA | `kpn_sim_swap_get_date` |
| Mobile Services Management | KPN business mobile: subscribers, contracts, orders, invoices, SIM block/unblock/replace | `kpn_mobile_*` (19 tools) |

## Skills

- **api-patterns**: credentials, the two token realms, entitlement errors, quotas, write confirmation.
- **network-checks**: outage, availability and SIM-swap lookups by Dutch address or number.
- **mobile-fleet**: KPN business-mobile reads and the confirmed write operations.

## Commands

- `/kpn:check-outage <postcode> <house number>`: outage and availability report for an address.
- `/kpn:lost-phone <mobile number>`: find the contract and block the SIM of a lost or stolen phone.

## Setup

Connect **KPN** in Conduit with the client ID and secret of a
[developer.kpn.com](https://developer.kpn.com) project that has the products you need
added to it. Mobile Services Management may need a separate, customer-bound app; enter
that pair in the optional MSM fields. See the
[kpn-mcp credentials guide](https://github.com/WYRE-AI/kpn-mcp#credentials).

## Limitations

- Built from KPN's published specs and tested against mocks. Not yet verified against
  live KPN credentials.
- Disturbance Check, Speed Check and SIM Swap only cover the Netherlands; SIM Swap only
  covers KPN mobile numbers.
- MSM write operations create orders; they may still need approval before they take effect.
