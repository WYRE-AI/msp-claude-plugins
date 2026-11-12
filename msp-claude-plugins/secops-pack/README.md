# Security Operations Pack (`secops-pack`)

Cross-vendor security alert triage and incident response for MSPs. This
pack normalizes severity across whatever EDR/MDR/SIEM stack you have
connected, runs standard first-response containment playbooks, investigates
a suspected compromise of an RMM or other management-plane tool by
correlating independent sources, and assembles chronological incident
timelines for client-facing reports — all without hardcoding to any
single vendor.

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
- **Shadow AI comparison**: Microsoft Graph or CIPP app inventory and a supported RMM
  observed-install source (software inventory or a readable script custom field),
  both required per client for a usable comparison
- **SaaS security** — SaaS Alerts
- **Email security** — Mimecast, Proofpoint, Abnormal, Ironscales, Avanan, SpamTitan
- **PSA** (for ticket cross-referencing and response timelines) and an
  **RMM** (for device inventory and, when investigating a management-plane
  incident, supporting reads from the implicated platform)
- **Network (optional)** — Auvik, Domotz, or ThreatLocker, used to
  corroborate tunnels, peers, and activity that the implicated platform
  cannot attest on its own

A client with only one of these connected still gets a useful result — the
pack reports what it can verify and calls out, explicitly, what it can't.

## What's included

- **Skills** — `alert-severity-normalization` (a common Critical/High/Medium/Low
  model and how to map each vendor's native severity into it),
  `containment-playbooks` (first-response sequences for compromised account,
  malware/ransomware, BEC, and exposed credential), `bec-response`
  (detection and response sequence for Business Email Compromise),
  `shadow-ai` (per-client AI software comparison against Entra enterprise apps,
  with unsanctioned-tool findings, standalone Windows/macOS/Linux detection
  scripts, and [operator-owned RMM field setup](skills/shadow-ai/references/rmm-setup.md)),
  `msp-tool-compromise-response` (cross-tool investigation when an RMM
  or other management-plane platform is implicated in a vendor advisory
  or suspected compromise), and `screenconnect-session-hijack-response`
  (panel abuse, rogue clients including modified clients under legitimate IDs,
  technician reverse-pivot exposure, and operator-run out-of-band cleanup)
- **Agents** — `overnight-alert-summarizer`, `incident-timeline-builder`,
  `tenant-exposure-ranker`
- **Commands** — `/secops-pack:portfolio-sweep`, `/secops-pack:incident-report`,
  `/secops-pack:tenant-exposure`

The Shadow AI skill never uploads, schedules, or runs endpoint scripts. MSPs
load the [standalone scripts](skills/shadow-ai/scripts/) themselves; only the
selected RMM field adapter writes a compact result. The skill reads that
field through verified read-only tools for Datto, NinjaOne, N-central,
SuperOps, and Syncro. Atera, Automate, and VSA have explicit read-back gaps.
See the [output contract](skills/shadow-ai/references/output-contract.md) and
[coverage/maintenance guide](skills/shadow-ai/references/script-maintenance.md).

The PowerShell and macOS scanners have not been run on real Windows or macOS
endpoints, and no live RMM field write has been exercised. Validation covers
only Linux fixtures, a real non-root Linux run, and a pwsh fixture run.
Pilot on one device per OS before deployment.

## Install

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install secops-pack@msp-claude-plugins
```

## License

Apache-2.0
