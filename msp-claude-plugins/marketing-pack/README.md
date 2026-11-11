# MSP Marketing (`marketing-pack`)

Marketing workflows for MSPs: anonymized case-study drafting from closed
PSA work, and review or referral request drafts from survey and ticket
data, wired to whatever PSA, documentation, and survey tools you have
connected through Conduit.

This is a **workflow pack**, not a vendor plugin. It does not teach any
single tool's API in depth. It bundles the judgment layer (what may be
published, when a client can be named, and when a review or referral ask
is appropriate) on top of whatever Autotask, ConnectWise, HaloPSA,
Syncro, SuperOps, NinjaOne, Atera, IT Glue, Hudu, and/or CrewHu or SmileBack data your
connected tools return.

This pack drafts only. It does not publish articles, send email, post
reviews, or create or update tickets.

## What it needs connected

| Category | Required? | Vendors |
|---|---|---|
| PSA | Required for a case study (a closed project or resolved ticket). Optional, but recommended, for a review or referral ask | Autotask, ConnectWise, HaloPSA, Syncro, or SuperOps. A review or referral ask can also read NinjaOne tickets. |
| Documentation | Optional background for a case study | IT Glue or Hudu |
| Survey tool | Required for a review or referral ask | CrewHu (preferred), SmileBack, or another discovered survey connector. |

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
- `review-and-referral-ask` : picks happy clients from CrewHu or SmileBack (or
  another discovered survey tool) plus ticket SLA and resolution data, then drafts
  a review or referral request for the MSP to send. Drafts only; never
  sends.

## Install

```text
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install marketing-pack@msp-claude-plugins
```

On first use, Claude Code will prompt to connect the Conduit MCP
server. Connect at least one PSA before drafting a case study, and
CrewHu, SmileBack, or another survey connector before drafting a review or referral
ask.

## Related

- [sales-pack](../sales-pack) : pipeline, quoting, and lead routing
  before a sale closes
- [finance-pack](../finance-pack) : billing and margin after a sale
  closes
- Individual PSA, documentation, and survey plugins, for deep,
  single-vendor record work this pack does not duplicate

## License

Apache-2.0
