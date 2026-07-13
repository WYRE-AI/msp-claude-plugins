---
description: Resource health and diagnostics triage for an Azure resource or subscription — Resource Health status, AppLens deep diagnostics, and Azure Monitor alert state
argument-hint: "<target> [window]"
arguments: [target, window]
---

# Azure Diagnostics Triage

Runs a focused, read-only diagnostics pass over an Azure resource, resource group, or subscription. Use it for "is something wrong with [resource]?" investigations, incident triage, and post-incident review.

This command is **read-only** — it diagnoses and reports; it never restarts, reconfigures, or remediates a resource.

## Arguments

- `target` (required) — Azure resource ID, resource group, or subscription ID to triage
- `window` (optional) — Lookback window for alerts and metrics (e.g. 1h, 24h, 7d) — defaults to 24h

## What it checks

1. **Resource Health** — `resourcehealth` for the current availability state (`Available` / `Degraded` / `Unavailable` / `Unknown`) and the reason classification (platform-initiated, customer-initiated, unplanned). Surfaces any active subscription-level health events.
2. **AppLens diagnostics** — when Resource Health is degraded or the picture is unclear, run `applens` detectors against the resource to identify the tripped detector, the failing dependency, and Microsoft's recommended mitigation.
3. **Monitor alerts** — `monitor` to list alert rules covering the target and their fired/resolved state within the lookback window.
4. **Supporting metrics** — pull relevant `monitor` metric series (and, where useful, a bounded Log Analytics KQL query) around the incident window to confirm and quantify impact.

## Output

A triage report covering:

- **Verdict** — healthy, degraded, or unavailable, with the most likely cause
- **Azure-side vs. customer-side** — whether a platform-initiated event explains the symptom (nothing to fix customer-side) or a customer-side cause needs action
- **Evidence** — the AppLens detector results, fired alerts, and metric/log excerpts that support the verdict
- **Recommended next steps** — what to do, explicitly noting that any fix happens through a separate write-capable path, not this connector

## Caveats

- **Read-only.** This command cannot acknowledge alerts, restart resources, or apply fixes. It identifies the problem and the recommended action; execution is out of scope for the `azure-mcp` connector.
- Scope the `window` to the incident — a wide window dilutes the signal and slows queries.

## When to use the agent instead

For correlating diagnostics across multiple resources, producing a narrative incident summary, or combining health with cost/Advisor posture, delegate to the `azure-ops-analyst` agent.
