# Compliance Pack

Cross-vendor compliance evidence collection and control drift detection for MSPs. This pack maps live tenant configuration and documentation to the controls MSP clients actually get asked about — CIS, SOC 2, HIPAA, and cyber-insurance renewal questionnaires — instead of relying on institutional memory or unverified policy documents.

It is grounded in **CIPP** (Microsoft 365 / Entra ID configuration), **Liongard** (infrastructure inspection and change history), and **IT Glue** (documented policies, procedures, and configuration records) — the three systems that between them can answer most of a standard compliance control set. **Hudu** works as a drop-in alternative to IT Glue for documentation evidence. None of these are hard requirements: every skill, agent, and command in this pack degrades explicitly when a connector is missing — you get an "unable to verify" finding naming the gap, never a silent guess or an inflated answer.

## What it does

- **Evidence packages** — map a named framework (CIS, SOC 2, HIPAA) or a general control set to concrete, source-cited evidence, and clearly separate evidence that *proves a control is met* from evidence that only *proves a policy is written down*.
- **Control drift reports** — detect when a client's live configuration has moved away from a previously accepted baseline, distinguish intentional/authorized change from unauthorized drift, and prioritize findings by how much they actually matter.
- **Cyber-insurance questionnaire drafting** — answer the standard recurring underwriter question set (MFA, EDR, backups, incident response, security training) with live evidence, and flag any question this pack's connected tools can't actually answer.

## What it needs connected

| Connector | Role | Required? |
|---|---|---|
| CIPP | M365/Entra ID configuration evidence (MFA, conditional access, standards checks, domain health, audit logs) | Recommended — strongest single connector for the widest range of controls |
| Liongard | Infrastructure inspection state and change-detection timeline | Optional — adds infrastructure-layer evidence and drift detection |
| IT Glue or Hudu | Documented policies, procedures, and configuration records | Optional — adds documentation evidence and baseline comparison |
| Huntress / SentinelOne / RocketCyber | Endpoint/EDR deployment evidence | Optional — used opportunistically for EDR-related questions and controls |
| HaloPSA / Autotask | Change-ticket correlation for drift authorization and incident-response evidence | Optional — strengthens drift classification and IR-plan evidence |

This pack connects through the [Conduit](https://conduit.wyre.ai) gateway — one authenticated connection surfaces every vendor tool your organization has connected. It works with partial coverage: every agent starts by discovering what's actually connected (`conduit__search_tools`) and flags gaps instead of fabricating evidence for a system that isn't there.

## Install

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install compliance-pack@msp-claude-plugins
```

## Commands

- `/compliance-pack:evidence-pack <client> [framework]` — build a source-cited evidence package
- `/compliance-pack:drift-report [client]` — report control drift for one client or the whole portfolio
- `/compliance-pack:questionnaire <client>` — draft cyber-insurance questionnaire answers

## Agents

- `evidence-packager` — assembles framework-mapped evidence packages
- `control-drift-reporter` — detects and prioritizes drift against the last known-good baseline
- `questionnaire-autofiller` — drafts evidence-backed cyber-insurance questionnaire answers

## Skills

- `evidence-mapping` — how to trace a control to concrete evidence, and the configured-vs-documented distinction
- `standards-drift` — what counts as drift, intentional vs. unauthorized change, and prioritization
- `insurance-questionnaires` — how to answer the standard cyber-insurance question set from live evidence
