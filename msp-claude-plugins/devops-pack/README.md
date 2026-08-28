# DevOps & Reliability (devops-pack)

On-call handoffs, incident postmortems, deploy health, and error-budget
tracking — cross-vendor, wired to whatever incident-management and
observability tools you have connected through the WYRE MCP Gateway /
[Conduit](https://conduit.wyre.ai).

This is a **workflow pack**, not a vendor plugin: it doesn't teach any single
incident-management or observability tool's API. It bundles the judgment
layer — handoff structure, blameless postmortem discipline, error-budget
math and its graceful fallback — on top of whatever data your connected
tools return.

This pack targets MSPs that also build or ship software (their own SaaS, or
a dev-shop client's), not just break/fix IT: engineering reliability work —
who's on call, what broke and why, whether a service is trending toward
burning its error budget — rather than end-user IT support.

## What it needs connected

- **Required:** any incident-management tool (Rootly, PagerDuty, or
  BetterStack), **or** any observability tool (Sentry, Datadog, Grafana, or
  BetterStack). Every skill, agent, and command discovers what's actually
  connected via `conduit__search_tools` before pulling data — nothing here
  hardcodes a vendor's tool names.
- **Works with partial coverage.** An incident-management tool alone is
  enough for on-call handoffs and postmortems (with a thinner evidence base,
  explicitly noted). An observability tool alone is enough for error-budget
  and trend reporting. Having both connected sharpens every skill in the
  pack — most notably the postmortem, which correlates incident-tool events
  with observability anomalies.
- **Optional:** a platform/deploy connector (GitHub, Cloudflare, Vercel,
  Netlify, Supabase, Neon) for deploy-history correlation in postmortems.
  Sections that depend on an optional connector are skipped with an explicit
  note when it isn't present — never silently, never fabricated.

If nothing relevant is connected, every skill, agent, and command in this
pack says so explicitly rather than guessing.

## How this differs from secops-pack

`devops-pack` and [`secops-pack`](../secops-pack) are both incident-adjacent,
but they answer different questions and should not be conflated:

- **secops-pack** is about **client-facing security threats** — malware,
  ransomware, business email compromise, unauthorized access, a compromised
  account. Its evidence sources are EDR/MDR/SIEM, email security, and
  identity tools (Huntress, SentinelOne, Blackpoint, RocketCyber, Blumira,
  CIPP, email security vendors). Its containment playbooks are security
  response sequences. It exists to answer "is a client under attack, and
  what do we do about it."
- **devops-pack** is about **engineering/platform reliability** — a service
  down, a deploy that broke something, an error rate trending upward, who's
  on call for the MSP's own systems or a client's SaaS application. Its
  evidence sources are incident-management, observability, and
  platform/deploy tools (Rootly, PagerDuty, BetterStack, Sentry, Datadog,
  Grafana, GitHub, Cloudflare, Vercel, Netlify, Supabase, Neon). Its
  postmortems are blameless engineering retrospectives, not security
  incident reports. It exists to answer "is the system reliable, and why did
  it break when it did."

The test to apply when something is ambiguous: **is this about a security
threat, or an operational/availability problem?** A compromised admin
account is secops-pack. A database connection pool exhausting under load is
devops-pack. An incident that started as a security event but caused an
outage may touch both — use secops-pack's containment playbooks for the
threat response and devops-pack's postmortem for the reliability
retrospective once it's contained.

## What's in it

**Skills**
- `oncall-handoff` — how to construct a proper on-call handoff: what's
  currently paging or unresolved, last-shift incident history, known-flaky
  alerts to watch, anything escalated but not yet actioned
- `incident-postmortem` — how to assemble a blameless postmortem: timeline
  reconstruction from the incident tool's event log plus correlated
  observability and deploy data, root-cause hypothesis structure, and the
  difference between contributing factors and root cause
- `error-budget-tracking` — SLO/error-budget concepts applied practically:
  computing burn rate from available observability data, what counts as a
  budget-threatening trend versus noise, and how to degrade gracefully to
  raw trend reporting when no formal SLO is defined

**Agents**
- `oncall-handoff-builder` — produces a structured handoff brief for the next
  on-call engineer
- `postmortem-drafter` — given an incident (by ID or time window), drafts a
  full blameless postmortem document
- `reliability-scorecard` — ranks connected services by error-budget/trend
  health, worst first

**Commands**
- `/devops-pack:oncall-brief` — generates the current on-call handoff brief
  (no arguments)
- `/devops-pack:postmortem [incident] [window]` — drafts a postmortem for a
  given incident, or the most recent significant one within a window
  (default `24h`)
- `/devops-pack:error-budget [service]` — runs the reliability scorecard for
  one service, or every connected service if omitted

## Install

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install devops-pack@msp-claude-plugins
```

On first use, Claude Code will prompt to connect the `conduit` MCP server
(`https://conduit.wyre.ai/v1/mcp`). Connect at least one incident-management
or observability tool through Conduit before running any command in this
pack.

## Related

- [wyre-gateway](../wyre-gateway) — the underlying multi-vendor gateway
  plugin these packs are built on top of
- [secops-pack](../secops-pack) — client-facing security threat response;
  see "How this differs from secops-pack" above for the boundary
- Individual vendor plugins (`rootly`, `pagerduty`, `betterstack`, …) — for
  deep, single-vendor API work this pack deliberately does not duplicate
