# Compliance Drift Reporter — CIPP expansion

**Date:** 2026-05-19
**Status:** Approved design (revised after gateway probe) — ready for implementation plan
**Affects:** `WYRE-AI/msp-claude-plugins` (Advanced Workflows docs + live routine)

## Summary

The batch-1 **Compliance Drift Reporter** routine (`trig_01KdNPXeYMep1SFEDEzCrPQV`)
currently reports only Liongard configuration-change detections. As WYRE rolls out
compliance baselines in CIPP, the routine should also report **baseline drift from
CIPP** — tenants failing their assigned CIPP Standards — plus a **tenant access
health** signal derived from CIPP's per-tenant Graph error count.

This is an **expansion of the existing routine**, not a new one: one routine, one
weekly cadence, one combined Slack report covering both signals.

## Gateway probe — what is actually available (2026-05-19)

Before designing against CIPP, the three candidate tools were probed against the
live WYRE gateway. Findings, which shaped this design:

- **`cipp_list_tenants`** — works. Returns a **flat JSON array** (no envelope) of
  ~34 tenant objects. Useful fields per tenant: `customerId`, `displayName`,
  `defaultDomainName`, `Excluded`, `GraphErrorCount`, `LastGraphError`,
  `delegatedPrivilegeStatus`. At probe time, **10 of 34 tenants had
  `GraphErrorCount > 0`** (broken delegated access — AADSTS errors).
- **`cipp_list_standards`** — works but returns `[]` for both `allTenants` and a
  specific tenant. No compliance baselines are assigned in CIPP yet; this is
  expected — the baseline rollout is in progress. The design treats an empty
  result as a truthful first-class state, never something to paper over.
- **`cipp_list_bpa`** — **deprecated and disabled.** Returns HTTP 503: *"The Best
  Practice Analyser has been deprecated and will be removed in a future release."*
  BPA is therefore **excluded from this design entirely.**

## Motivation

Liongard and CIPP report drift in fundamentally different shapes:

- **Liongard** — a stream of *change events* ("this config changed"). The current
  routine treats the week's detections as the drift signal.
- **CIPP Standards** — a point-in-time *pass/fail against a baseline* ("this tenant
  fails its assigned standard"). This is true baseline drift, the missing half the
  current doc's "Extending it" section already anticipates.

Because Standards is empty until the rollout lands, the CIPP section also reports
**tenant access health** — tenants whose CIPP-to-Microsoft delegated access is
broken (`GraphErrorCount > 0`). That signal has real data today, so the CIPP
section is useful from day one, and broken delegated access is itself a posture
problem worth surfacing weekly.

## Decisions (resolved during brainstorming)

| Question | Decision |
|---|---|
| New routine or expand existing? | **Expand the existing routine** — one combined report |
| Which CIPP signal? | **CIPP Standards compliance** (primary baseline-drift signal) **+ tenant access health** from `GraphErrorCount` (day-one signal while Standards is empty). **BPA dropped** — deprecated. |
| Tenant scope? | **All CIPP tenants** — tenants with no baseline assigned surface as an "unmanaged" finding |
| Fresh data or cached? | **Read last computed results** — read-only, no `cipp_run_standards_check` trigger; the routine stays a pure reporter |
| Report structure? | **Approach C** — two-section report (Liongard / CIPP) with a computed posture scorecard header |

## Scope of changes

Four artifacts change in `WYRE-AI/msp-claude-plugins`:

| Artifact | Change |
|---|---|
| Live routine `trig_01KdNPXeYMep1SFEDEzCrPQV` | Add `cipp_list_tenants`, `cipp_list_standards` to the WYRE MCP Gateway connector's `permitted_tools`; replace the routine prompt with the two-phase version |
| `msp-claude-plugins/docs/src/pages/advanced-workflows/compliance-drift-reporter.astro` | Rewrite: cover both signals, new build prompt + routine prompt, new CIPP multi-tenant gotchas |
| `msp-claude-plugins/docs/src/pages/advanced-workflows/agent-routine-catalog.astro` | Update the `compliance-drift-reporter`/liongard row note; note CIPP posture coverage is folded in (touches the `security-posture-reviewer`/cipp row) |
| `CHANGELOG.md` | New `[Unreleased]` entry |

**Unchanged:** weekly cron `0 12 * * 1` (Monday 08:00 America/New_York), Slack
delivery (canvas + one-line summary to channel `C0931CKJ75X`), and the entire
Liongard collection logic.

## Run flow

The routine runs four phases per invocation:

### Phase 1 — Liongard collection (unchanged)

Compute a 7-day window. Call `liongard_detections_list` at `pageSize` 5, paginating
until 25 detections collected or `HasMoreRows` is false. Read only `ID`,
`SystemName`, `Name`, `Date`, `SystemType` per detection — never `ChangeDetection`
(5KB–44KB each). Record `Data.Pagination.TotalRows` as the true weekly total.

### Phase 2 — CIPP collection

1. `cipp_list_tenants` — the full tenant list (flat array). This is the
   denominator. For each tenant read only `customerId`, `displayName`,
   `defaultDomainName`, `GraphErrorCount`, `Excluded`. Skip tenants where
   `Excluded` is `true`.
2. `cipp_list_standards` with `tenantFilter: "allTenants"` — the assigned
   baselines and their compliance state. A tenant present in the tenant list but
   absent from the standards result = **unmanaged** (no baseline assigned). When
   the standards result is `[]`, every tenant is unmanaged — report that
   truthfully.
3. Classify each non-excluded tenant on two independent axes:
   - **Baseline:** `pass` / `fail` / `unmanaged` (from `cipp_list_standards`).
   - **Access:** `healthy` (`GraphErrorCount` == 0) / `broken`
     (`GraphErrorCount` > 0).

Read only the small per-tenant fields named above — never per-tenant config
payloads, and never echo `LastGraphError` blobs verbatim (they are long); report
only that access is broken plus the tenant name.

### Phase 3 — Posture scorecard

Compute from numbers already collected:

- Configuration changes this week (Liongard `TotalRows`)
- Tenants with a baseline assigned (`X of N`)
- Tenants failing their baseline
- Tenants with broken delegated access (`GraphErrorCount` > 0)

### Phase 4 — Deliver

Publish a Slack canvas titled `Compliance Drift — <YYYY-MM-DD>` with the scorecard
header followed by two sections:

- **Configuration changes (Liongard)** — detections grouped by system, as today.
- **Baseline compliance (CIPP)** — two sub-parts:
  - *Baseline coverage* — per-tenant pass/fail for tenants with an assigned
    standard; a list of unmanaged tenants. When no standards are assigned at all,
    a single honest line: "No compliance baselines assigned in CIPP yet — N
    tenants unmanaged."
  - *Tenant access health* — the list of tenants with broken delegated access.

Post one summary line to `C0931CKJ75X` linking the canvas.

## Error handling — per-source degradation

With two independent data sources, "if it fails, stop" is wrong: one vendor's
outage should not blank a report the other half is fine to deliver. Silent partial
data is equally wrong. The rule: **degrade per-source, and make the gap visible in
the report itself.**

| Condition | Behavior |
|---|---|
| Liongard fails, CIPP OK | Deliver CIPP section; canvas notes *"Liongard data unavailable this run."* |
| CIPP fails, Liongard OK | Deliver Liongard section; canvas notes *"CIPP data unavailable this run."* |
| Both fail | Post a "needs a human" line to `C0931CKJ75X`, then stop (batch-1 behavior preserved) |
| Both OK, zero findings | Post a single summary line, skip the canvas (batch-1 behavior preserved) |

"Zero findings" means: no Liongard detections AND no baseline failures AND no
broken-access tenants. An empty `cipp_list_standards` is **not** an error and not
"zero findings" — it is the reportable "N tenants unmanaged" state.

## Build & verification

The doc uses the established **one-shot build-prompt** pattern: a single prompt
pasted to Claude that confirms connectors, updates the routine, and verifies it
end to end.

**Shapes are now verified** (see "Gateway probe" above), so the routine prompt
ships with concrete field names. The build prompt still re-confirms the gateway is
reachable and that `cipp_list_standards` responds, so a future CIPP change is
caught at build time.

**Build prompt steps:**

1. Confirm the gateway is reachable. Call `liongard_detections_list` (7-day
   window, `pageSize` 5) and confirm the `Data.Detections` / `Data.Pagination`
   envelope. Call `cipp_list_tenants` and confirm a flat array with
   `customerId` / `displayName` / `GraphErrorCount`. Call `cipp_list_standards`
   with `tenantFilter: "allTenants"` and note whether it is empty.
2. Confirm the Slack connector and destination channel `C0931CKJ75X`.
3. Update the existing routine `trig_01KdNPXeYMep1SFEDEzCrPQV`: add
   `cipp_list_tenants` and `cipp_list_standards` to the gateway connector's
   `permitted_tools`; install the two-phase routine prompt.
4. Manual run + verify: the canvas has the scorecard header and both sections; the
   Liongard count reconciles with `TotalRows`; the CIPP tenant counts (with a
   baseline + unmanaged) sum to the non-excluded `cipp_list_tenants` total; the
   broken-access count matches the tenants with `GraphErrorCount > 0`.

**Testing.** A scheduled routine has no unit-test harness — verification is the
manual run in Step 4, plus a follow-up run a week later confirming the cron fired
and the partial-degradation messaging renders correctly when a source is down.

## Known gotchas (new, CIPP-specific)

- **CIPP's Best Practice Analyzer is deprecated** — `cipp_list_bpa` returns HTTP
  503. The routine must never call it.
- **`cipp_list_standards` is empty until baselines are assigned in CIPP.** This is
  not an error. The routine reports the empty state truthfully as "N tenants
  unmanaged" and must never fabricate per-tenant compliance findings over an empty
  array.
- **A 34-tenant CIPP sweep is bounded but read carefully.** `cipp_list_tenants`
  returns one flat array; read only the small per-tenant fields and never echo
  `LastGraphError` strings verbatim.
- **`permitted_tools` must list every `cipp_*` tool the routine calls.** A
  connector with an empty or incomplete `permitted_tools` list runs with no tools
  and silently does nothing.
- **The routine is read-only by design.** It must not call
  `cipp_run_standards_check` — that is a write-capable operation. The routine
  reads whatever CIPP last computed on its own schedule.

## Out of scope

- Best Practice Analyzer — deprecated by CIPP.
- Triggering fresh CIPP standards checks.
- Correlating Liongard systems to CIPP tenants into a unified per-entity table
  (no shared key — fragile mapping; rejected as Approach B).
- Any remediation action (opening PSA tickets for repeat offenders, or fixing
  broken delegated access) — noted as possible future extensions, not part of
  this work.
