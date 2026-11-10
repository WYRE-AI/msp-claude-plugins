# MSP Marketing (`marketing-pack`)

Marketing workflows for MSPs: review or referral request drafts from
survey and ticket data, wired to whatever survey and PSA tools you have
connected through Conduit.

This is a **workflow pack**, not a vendor plugin. It does not teach any
single tool's API in depth. It bundles the judgment layer (when a review
or referral ask is appropriate, and when it is not) on top of whatever
CrewHu, Autotask, ConnectWise, HaloPSA, Syncro, SuperOps, NinjaOne, and/or
Atera data your connected tools return.

This pack drafts only. It does not send email, post reviews, or create
outreach tickets.

## What it needs connected

| Category | Required? | Vendors |
|---|---|---|
| Survey tool | Required | CrewHu (preferred), or another discovered survey connector. There is no SmileBack MCP tool in this catalog. |
| PSA | Optional, but recommended for SLA and resolution context | Autotask, ConnectWise, HaloPSA, Syncro, SuperOps, NinjaOne, or Atera |

Every skill in this pack discovers what's actually connected via
`conduit__search_tools` before running. It never assumes a fixed vendor
stack, and it reports "unavailable" rather than guessing when a
connector or a needed tool is missing.

## What's included

**Skills**
- `review-and-referral-ask` : picks happy clients from CrewHu (or another
  discovered survey tool) plus ticket SLA and resolution data, then drafts
  a review or referral request for the MSP to send. Drafts only; never
  sends.

A case-study drafter skill is planned for this pack and is not included
yet.

## Install

```text
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install marketing-pack@msp-claude-plugins
```

On first use, Claude Code will prompt to connect the Conduit MCP
server. Connect CrewHu, or another survey connector, before drafting a
review or referral ask.

## Related

- [sales-pack](../sales-pack) : pipeline, quoting, and lead routing
  before a sale closes
- [finance-pack](../finance-pack) : billing and margin after a sale
  closes
- Individual PSA and survey plugins, for deep, single-vendor record work
  this pack does not duplicate

## License

Apache-2.0
