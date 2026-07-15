# Backup & DR Assurance (`backup-pack`)

Backup job health, restore-test verification, retention/RPO compliance, and DR
readiness — cross-vendor, wired to whatever backup and BCDR tools you have connected
through the WYRE MCP Gateway / [Conduit](https://conduit.wyre.ai).

This is a **workflow pack**, not a vendor plugin: it doesn't teach any single backup
tool's API in depth. It bundles the judgment layer — failure/missed distinctions,
restore-evidence ranking, retention-vs-contract math — on top of whatever Datto BCDR,
Datto SaaS Protection, Spanning, and/or Unitrends data your connected tools return.

## What it needs connected

| Category | Required? | Vendors |
|---|---|---|
| Image-based appliance backup (BCDR) | At least one backup/BCDR tool required | Datto BCDR, Unitrends |
| SaaS-data snapshot backup | At least one backup/BCDR tool required | Datto SaaS Protection, Spanning |
| Documentation | Optional — sharpens retention/RPO and criticality-tiering checks | IT Glue, Hudu |
| PSA | Optional — ticket cross-reference and contract-record source for retention/RPO requirements | Autotask, HaloPSA, ConnectWise Manage |

Every skill, agent, and command in this pack discovers what's actually connected via
`conduit__search_tools` before running — it never assumes a fixed vendor stack, and
it never assumes which of the two structurally different backup job models (image-
based appliance vs. SaaS-data snapshot) is in play. This pack works with partial
coverage: any single connected backup/BCDR tool is enough to run job-health and
restore-verification checks; adding a documentation platform or PSA sharpens the
retention/RPO and criticality-tiering results. Where a data point genuinely isn't
available, every skill, agent, and command reports "unable to verify" and names the
missing connector — never a silent guess or a fabricated figure.

## What's included

**Skills**
- `backup-job-health` — portfolio-wide job success/failure rate, missed-backup
  detection, storage-consumption trending, and how to normalize image-based appliance
  backup and SaaS-data snapshot backup into one comparable health view
- `restore-test-verification` — the difference between "a backup exists" and "a
  backup is recoverable," a ranked hierarchy of restore evidence (actual restore,
  boot verification, screenshot verification, spot-check restore), and
  data-criticality-tiered testing cadence
- `retention-rpo-compliance` — checking actual retention configuration and cadence
  against contracted retention/RPO requirements, distinguishing configuration gaps
  from storage-forced retention truncation

**Agents**
- `backup-health-auditor` — portfolio-wide backup job health sweep, ranked by
  severity: active failure streaks, missed backups, storage risk
- `restore-readiness-checker` — flags systems whose backups have never been (or are
  overdue to be) restore-tested, with a recommended test schedule
- `retention-compliance-auditor` — surfaces retention/RPO gaps between contracted
  requirements and actual configuration

**Commands**
- `/backup-pack:backup-status` — portfolio-wide backup job health snapshot (no
  arguments)
- `/backup-pack:restore-check [client]` — restore-readiness check for one client or
  the whole portfolio
- `/backup-pack:retention-audit [client]` — retention/RPO compliance audit for one
  client or the whole portfolio

## How this pack relates to `wyre-gateway`'s `dr-readiness-auditor`

This marketplace already ships `wyre-gateway/agents/dr-readiness-auditor.md`, a
single-prompt, cross-vendor DR-readiness checker. `backup-pack` is written to
complement it, not duplicate it — the two operate at different depths and on
different cadences:

- **`dr-readiness-auditor`** is a **one-shot, composite assessment**. In a single run
  it produces a 0–100 DR-readiness score across five weighted categories (Backup
  Coverage, Backup Success Rate, Restore/Test Recency, Runbook Readiness, RTO/RPO
  Alignment), meant to be run periodically per client as a full DR-maturity review —
  the kind of thing you'd run quarterly, or ahead of a QBR, or after a client's
  criticality profile changes. It also covers ground `backup-pack` deliberately does
  not: DR runbook existence and staleness, and whether a formal critical-systems
  inventory exists at all.

- **`backup-pack`** is **structured and ongoing**, not one-shot. It splits the same
  general problem space into three independently runnable skills/agents/commands,
  each meant to be exercised on its own recurring cadence — daily/weekly job-health
  checks, a restore-test tracking cadence tied to data-criticality tiers, and a
  retention/RPO compliance sweep run whenever contracts change or on a fixed audit
  schedule. It goes materially deeper than `dr-readiness-auditor`'s corresponding
  categories:
  - `backup-health-auditor` distinguishes **missed** backups from **failed** backups
    and from **storage risk**, and leads with the current failure streak rather than
    a trailing success-rate average — `dr-readiness-auditor`'s "Backup Success Rate"
    category is one-fifth of a broader score and doesn't carry this level of detail.
  - `restore-readiness-checker` applies a full ranked restore-evidence hierarchy and
    data-criticality-tiered cadence table, and produces a concrete recommended test
    schedule per system — `dr-readiness-auditor`'s "Restore and Test Recency"
    category checks whether evidence exists, but doesn't track cadence tiers or
    produce a schedule.
  - `retention-compliance-auditor` checks **retention** at all, which
    `dr-readiness-auditor` does not do — retention isn't part of its scoring model.
    It also separates configuration-gap retention shortfalls from storage-forced
    truncation, and computes achievable RPO from actual recent job-success history
    rather than nominal schedule alone.

In practice: run `dr-readiness-auditor` for the periodic, full-picture DR-maturity
review (including runbook and coverage-inventory questions `backup-pack` doesn't
touch). Run `backup-pack`'s agents and commands for the continuous, in-between-audits
monitoring that catches a failing job, an untested backup, or a retention gap long
before the next scheduled `dr-readiness-auditor` run would surface it.

## How this pack relates to the single-vendor backup plugins

This marketplace also ships thin, single-vendor reference plugins for each backup/
BCDR vendor — `kaseya/datto-bcdr`, `kaseya/datto-saas-protection`, `kaseya/spanning`,
and `kaseya/unitrends`. Each of those ships an `api-patterns` skill documenting that
vendor's own API surface (auth scheme, endpoint layout, pagination, gotchas) for deep
single-vendor integration work. `backup-pack` doesn't reteach any of that — it
composes on top of whichever of those tools are connected, discovering their actual
tool names via `conduit__search_tools` and applying cross-vendor judgment (job-health
normalization, restore-evidence ranking, retention math) that no single-vendor
plugin provides on its own. For deep, vendor-specific API work, use the relevant
single-vendor plugin directly.

## Install

```
/plugin marketplace add wyre-technology/msp-claude-plugins
/plugin install backup-pack@msp-claude-plugins
```

On first use, Claude Code will prompt to connect the `conduit` MCP server
(`https://conduit.wyre.ai/v1/mcp`). Connect at least one backup/BCDR tool (Datto
BCDR, Datto SaaS Protection, Spanning, or Unitrends) through Conduit before running
any command in this pack.

## Related

- [wyre-gateway](../wyre-gateway) — the underlying multi-vendor gateway plugin these
  packs are built on top of, and home to `dr-readiness-auditor` (see comparison
  above)
- [compliance-pack](../compliance-pack) — evidence mapping and control drift for
  broader compliance frameworks; treats "is backup configured" as one evidence
  checkbox among many, whereas `backup-pack` is the dedicated, deeper backup/DR
  domain pack
- Individual vendor plugins (`kaseya/datto-bcdr`, `kaseya/datto-saas-protection`,
  `kaseya/spanning`, `kaseya/unitrends`) — for deep, single-vendor API work this pack
  deliberately does not duplicate
