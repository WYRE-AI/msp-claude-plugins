# Security Operations Pack (`secops-pack`)

Cross-vendor security alert triage and incident response for MSPs. This
pack normalizes severity across whatever EDR/MDR/SIEM stack you have
connected, runs standard first-response containment playbooks, and
assembles chronological incident timelines for client-facing reports — all
without hardcoding to any single vendor.

It is one of the industry workflow packs described in the repo
[ROADMAP.md](../ROADMAP.md): job-shaped rather than tool-shaped, composing
the vendor plugins already in this marketplace instead of duplicating their
API knowledge.

## What it needs connected

`secops-pack` connects through [Conduit](https://conduit.wyre.ai), the WYRE
MCP gateway, and works with **partial coverage** — it discovers what's
actually connected at run time (via `conduit__search_tools`) rather than
assuming a fixed stack. It gets more useful the more of the following you
have connected, but none of them are individually required:

- **EDR** — Huntress, SentinelOne
- **MDR / SOC-managed** — Blackpoint Cyber, RocketCyber
- **SIEM** — Blumira
- **Microsoft 365 / identity** — CIPP
- **SaaS security** — SaaS Alerts
- **Email security** — Mimecast, Proofpoint, Abnormal, Ironscales, Avanan, SpamTitan
- **PSA** (for ticket cross-referencing and response timelines) and an
  **RMM** (for device inventory used in EDR coverage-gap checks)

A client with only one of these connected still gets a useful result — the
pack reports what it can verify and calls out, explicitly, what it can't.

## What's included

- **Skills** — `alert-severity-normalization` (a common Critical/High/Medium/Low
  model and how to map each vendor's native severity into it),
  `containment-playbooks` (first-response sequences for compromised account,
  malware/ransomware, BEC, and exposed credential), `bec-response`
  (detection and response sequence for Business Email Compromise)
- **Agents** — `overnight-alert-summarizer`, `incident-timeline-builder`,
  `tenant-exposure-ranker`
- **Commands** — `/secops-pack:portfolio-sweep`, `/secops-pack:incident-report`,
  `/secops-pack:tenant-exposure`

## Install

```
/plugin marketplace add wyre-technology/msp-claude-plugins
/plugin install secops-pack@msp-claude-plugins
```

## License

Apache-2.0
