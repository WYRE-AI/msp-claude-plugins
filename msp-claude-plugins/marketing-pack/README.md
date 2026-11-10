# MSP Marketing (`marketing-pack`)

Marketing workflows for MSPs: anonymized case-study drafting from closed
PSA work, wired to whatever PSA and documentation tools you have
connected through Conduit.

This is a **workflow pack**, not a vendor plugin. It does not teach any
single tool's API in depth. It bundles the judgment layer (what may be
published, and when a client can be named) on top of whatever Autotask,
ConnectWise, HaloPSA, Syncro, SuperOps, IT Glue, and/or Hudu data your
connected tools return.

This pack drafts only. It does not publish articles, send email, or
create or update tickets.

## What it needs connected

| Category | Required? | Vendors |
|---|---|---|
| PSA | Required (a closed project or resolved ticket) | Autotask, ConnectWise, HaloPSA, Syncro, or SuperOps |
| Documentation | Optional background for a case study | IT Glue or Hudu |

Every skill in this pack discovers what's actually connected via
`conduit__search_tools` before running. It never assumes a fixed vendor
stack, and it reports "unavailable" rather than guessing when a
connector or a needed tool is missing.

## What's included

**Skills**
- `case-study-drafter` : turns a closed PSA project or a resolved
  incident, plus optional documentation records, into an anonymized case
  study (challenge, approach, and result with real metrics only), with
  an approval step before any client is named

## Install

```text
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install marketing-pack@msp-claude-plugins
```

On first use, Claude Code will prompt to connect the Conduit MCP
server. Connect at least one PSA before drafting a case study.

## Related

- [sales-pack](../sales-pack) : pipeline, quoting, and lead routing
  before a sale closes
- [finance-pack](../finance-pack) : billing and margin after a sale
  closes
- Individual PSA and documentation plugins, for deep, single-vendor
  record work this pack does not duplicate

## License

Apache-2.0
