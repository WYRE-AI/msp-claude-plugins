# Security Awareness & Training (`awareness-pack`)

Cross-vendor security awareness operations for MSPs — training completion
tracking, phishing simulation results, and per-user/per-org human risk
scoring across whatever security-awareness and training tools you have
connected.

It is one of the industry workflow packs described in the repo
[ROADMAP.md](../ROADMAP.md): job-shaped rather than tool-shaped, composing
the vendor plugins already in this marketplace instead of duplicating their
API knowledge.

This pack is about the **human/culture layer of security**: preventing
incidents by keeping people trained and measuring how they actually behave
against simulated attacks. It does not touch technical threat detection or
incident response — see "How this differs from `secops-pack`" below for the
explicit line.

## What it needs connected

`awareness-pack` connects through [Conduit](https://conduit.wyre.ai), the
WYRE MCP gateway, and works with **partial coverage** — it discovers what's
actually connected at run time (via `conduit__search_tools`) rather than
assuming a fixed stack. It gets more useful the more of the following you
have connected, but none of them are individually required:

- **Security-awareness / training / phishing-simulation platform** —
  KnowBe4 (primary; the dedicated training and simulation platform in this
  marketplace)
- **Email security with secondary awareness features** — Proofpoint (VAP /
  Very Attacked Person signal) and Checkpoint Avanan (threat/click signal),
  used as optional secondary sources of real-world phishing-click data
  where connected — never as a substitute for a dedicated training platform

A client with only KnowBe4 connected still gets a useful training-completion
and click-rate report. A client with only Proofpoint or Avanan connected
still gets partial, clearly-labeled real-world click signal, even with no
dedicated simulation platform present. The pack reports what it can verify
and calls out, explicitly, what it can't — an org with nothing connected is
reported as unmeasured, never as a clean 0%-risk result.

## What's included

- **Skills** — `training-completion-tracking` (overdue-training detection,
  per-org completion rates, cadence-compliance flagging),
  `phishing-simulation-analysis` (click-rate trends, repeat-clicker
  identification, optional real-incident correlation), `risk-scoring` (a
  simple, explainable per-user/per-org human risk score with graceful
  degradation when simulation data isn't available)
- **Agents** — `training-compliance-auditor`, `phishing-simulation-analyst`,
  `human-risk-scorer`
- **Commands** — `/awareness-pack:training-status [client]`,
  `/awareness-pack:phishing-results [window]`, `/awareness-pack:risk-report [client]`

## How this differs from `secops-pack`

`secops-pack` and `awareness-pack` sit on either side of the same coin — one
before an incident, one after — and it's easy to blur the line, so here is
the explicit split.

**`secops-pack` is technical threat response**: it normalizes alert severity
across your EDR/MDR/SIEM stack, runs first-response containment playbooks,
detects and responds to Business Email Compromise (session revocation,
forwarding-rule audit, password reset, MFA re-enrollment), and builds
incident timelines. It answers "something bad is happening or happened —
what do we do about it right now, technically." Its `bec-response` skill in
particular starts from the moment a compromise is suspected or confirmed and
ends with containment and a client-facing incident report.

**`awareness-pack` is human-layer prevention**: it tracks whether people
completed the training that was supposed to stop them from getting
compromised in the first place, measures how they actually perform against
simulated attacks, and scores where the org's human risk concentration sits
— before anything has gone wrong. It answers "how likely is our next
incident to start with a person, and who specifically is that risk
concentrated in."

**The worked example that draws the line cleanly**: a user clicks a real
phishing email, enters their credentials, and their mailbox is compromised.
The moment that compromised account starts forwarding invoices and needs
session revocation, password reset, and MFA re-enrollment — that's
`secops-pack`'s `bec-response` skill and the `incident-timeline-builder`
agent. The fact that this same user had failed three prior simulated
phishing campaigns and never completed the remedial training assigned after
the second one — the training gap that made the real click more likely in
the first place — that's `awareness-pack`'s `phishing-simulation-analysis`
skill and `human-risk-scorer` agent. Neither pack does the other's job:
`awareness-pack` does not revoke sessions, reset passwords, or build
incident timelines, and `secops-pack` does not track training completion or
score simulated-click behavior. Where useful, `phishing-simulation-analysis`
optionally checks whether a repeat clicker also has a real incident on
record (compounding risk) — but that check is enrichment, not incident
response, and it explicitly hands off any active incident to `secops-pack`
rather than attempting containment itself.

**vs. individual vendor plugins** (`knowbe4`, `proofpoint`,
`checkpoint-avanan`) — for deep, single-vendor work (a specific KnowBe4
campaign summary, a specific Proofpoint VAP report), use the vendor plugin
directly. `awareness-pack` deliberately does not duplicate any single
vendor's report — its value is cross-vendor correlation and portfolio-wide
scoring: a training-completion view that works across whatever platform is
connected, a click-rate trend read alongside remedial-training completion,
and a human risk score that blends both rather than reporting either in
isolation.

## Install

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install awareness-pack@msp-claude-plugins
```

On first use, Claude Code will prompt to connect the `conduit` MCP server
(`https://conduit.wyre.ai/v1/mcp`). Connect at least one security-awareness
or training tool through Conduit before running any command in this pack.

## Related

- [wyre-gateway](../wyre-gateway) — the underlying multi-vendor gateway
  plugin these packs are built on top of
- [secops-pack](../secops-pack) — technical threat detection and incident
  response; see the boundary section above for the full comparison
- Individual vendor plugins (`email-security/knowbe4`,
  `email-security/proofpoint`, `email-security/checkpoint-avanan`) — for
  deep, single-vendor API work this pack deliberately does not duplicate

## License

Apache-2.0
