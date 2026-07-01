---
name: "Inforcer Assessments"
when_to_use: "When listing Inforcer assessments for a tenant, or triggering an assessment run — the single write action in the Inforcer surface, which requires explicit confirmation before it executes"
description: >
  Use this skill when listing Inforcer assessments or triggering an
  assessment run. Listing is read-only; running an assessment is the
  ONE mutating action in the entire Inforcer surface and must be
  confirmed before it executes. Covers what an assessment run does
  (refreshes the data behind alignment / secure score / drift), its
  tenant-scoping, and the confirmation discipline it requires.
triggers:
  - inforcer assessment
  - list assessments
  - run assessment
  - trigger assessment
  - assessment run
  - refresh alignment data
  - inforcer assessment status
  - re-run assessment inforcer
---

# Inforcer Assessments

An Inforcer **assessment** is the evaluation that produces a tenant's
alignment, secure score, and drift data. This skill covers two things:
**listing** assessments (read-only) and **running** one — which is the
**single mutating action in the entire Inforcer plugin**. Everything else
Inforcer exposes is read-only; `inforcer_assessments_run` is the one
exception, so it carries a confirmation discipline that the read tools do
not.

Read [api-patterns](../api-patterns/SKILL.md) first for the gateway
headers, the region requirement, the envelope, and pagination, and
[tenant-management](../tenant-management/SKILL.md) for resolving a tenant to
its **integer Client Tenant ID**. Assessment calls are tenant-scoped by
that integer id.

## Tools

### `inforcer_assessments_list` (read-only)

List the assessments for a tenant — past runs and their status/results
metadata.

```
inforcer_assessments_list(clientTenantId=1423)
```

Use this to see when a tenant was last assessed and whether prior runs
completed. **Check this before running a new assessment** — if a recent run
already covers what you need, you don't need to trigger another. Page
`continuationToken` to completion.

### `inforcer_assessments_run` (WRITE — requires confirmation)

Trigger a **new assessment run** for a tenant. This is the one action in the
Inforcer surface that **changes state**: it kicks off an evaluation that
refreshes the data feeding alignment scores, secure score, and drift detail.

```
inforcer_assessments_run(clientTenantId=1423)   # only after explicit confirmation
```

> **HIGH-IMPACT ACTION — confirm first.** Unlike every other Inforcer
> tool, this one *does something*. Before invoking it you MUST:
>
> 1. **Confirm the exact tenant** — state the resolved display name **and**
>    the integer Client Tenant ID you are about to run against. A run
>    against the wrong tenant is a real, unintended side effect.
> 2. **Get explicit user confirmation** — do not trigger a run as a
>    convenience step, in a loop, or to "refresh data" without the user
>    asking. Wait for an explicit yes.
> 3. **Check `inforcer_assessments_list` first** — avoid kicking off a
>    redundant run when a recent assessment already exists.
>
> Treat it like any change action: announce intent, name the target, pause
> for confirmation, then execute. Never batch-run assessments across the
> portfolio without per-tenant (or explicitly-scoped) confirmation.

## When a run is warranted

| Situation | Run? |
|-----------|------|
| Alignment/secure-score data looks stale before a report | Yes — after confirming the tenant and checking the last run |
| Just deployed/changed policy in the Inforcer UI and want fresh drift | Yes — to re-measure against the baseline |
| A recent completed run already covers the window | No — read the existing results instead |
| "Refresh everything" across many tenants, unprompted | No — that's a batch of side effects; confirm scope explicitly first |

## Workflow patterns

### Safe single-tenant refresh

```
ctid = resolve("Acme")                          # integer Client Tenant ID
prior = inforcer_assessments_list(clientTenantId=ctid)   # is a recent run enough?
# If a fresh run is genuinely needed AND the user confirmed for THIS tenant:
inforcer_assessments_run(clientTenantId=ctid)
```

State the tenant name + integer id, confirm, then run. After the run, read
results via `inforcer_assessments_list` and the
[compliance-reporting](../compliance-reporting/SKILL.md) /
[baseline-alignment](../baseline-alignment/SKILL.md) tools — the run
*produces* the data; those skills *interpret* it.

## Caveats

- `inforcer_assessments_run` is the **only** write in the Inforcer surface.
  Running an assessment **refreshes evaluation data** — it does **not**
  deploy policy, remediate drift, back up, or restore configuration. Do not
  imply that triggering an assessment changes the tenant's actual M365
  configuration; it only re-measures it.
- The API is **community-sourced** (no official public docs); the assessment
  object shape, status values, and the run parameters are illustrative and
  credited to
  [`royklo/InforcerCommunity`](https://github.com/royklo/InforcerCommunity).
  Verify on first use.
- Assessment calls are tenant-scoped by the **integer Client Tenant ID** —
  resolve the tenant first, and double-check the id specifically before a
  run, since this is the one place a wrong id has a side effect rather than
  just an empty read.

## Related Skills

- [tenant-management](../tenant-management/SKILL.md) - resolve and confirm the integer Client Tenant ID before a run
- [baseline-alignment](../baseline-alignment/SKILL.md) - the alignment/drift data a fresh assessment refreshes
- [compliance-reporting](../compliance-reporting/SKILL.md) - read posture from assessment results
- [api-patterns](../api-patterns/SKILL.md) - envelope, pagination, region, and the read-only-except-this caveat
