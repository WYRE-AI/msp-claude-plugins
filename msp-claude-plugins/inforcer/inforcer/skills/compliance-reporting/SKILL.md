---
name: "Inforcer Compliance Reporting"
when_to_use: "When producing Inforcer security posture and compliance reports — pulling secure scores, combining them with alignment, and classifying tenants as aligned / semi-aligned / drifted using the alignedThreshold and semiAlignedThreshold settings"
description: >
  Use this skill when building Inforcer compliance and posture reports —
  reading per-tenant Microsoft 365 secure scores, combining them with
  alignment scores, and applying the alignedThreshold /
  semiAlignedThreshold settings that classify each tenant or policy as
  aligned, semi-aligned, or drifted. Covers portfolio posture roll-ups
  across the MSP's managed tenants.
triggers:
  - inforcer secure score
  - compliance report
  - posture report
  - aligned threshold
  - semi-aligned
  - drifted classification
  - portfolio posture
  - secure score per tenant
---

# Inforcer Compliance Reporting

This skill turns Inforcer's raw signals — secure scores and alignment —
into a posture report. The headline output is a per-tenant
classification (aligned / semi-aligned / drifted) rolled up across the
portfolio, suitable for monthly internal reviews and QBRs.

Read [api-patterns](../api-patterns/SKILL.md) for headers, region, the
envelope, and pagination, and [tenant-management](../tenant-management/SKILL.md)
for resolving tenants to integer Client Tenant IDs. Alignment mechanics
live in [baseline-alignment](../baseline-alignment/SKILL.md).

## Tools

### `inforcer_secure_scores`

Read the Microsoft 365 **secure score** for a tenant — Microsoft's own
security posture measure for the M365 environment.

```
inforcer_secure_scores(clientTenantId=1423)
```

Secure score is complementary to alignment: alignment says "does this
tenant match *our* baseline?", secure score says "what does Microsoft
think of this tenant's posture overall?". A strong report uses both.

### `inforcer_alignment_scores`

Read the tenant's alignment score against its assigned baseline (the
other half of the posture picture). See
[baseline-alignment](../baseline-alignment/SKILL.md) for details.

```
inforcer_alignment_scores(clientTenantId=1423)
```

## Classification: aligned / semi-aligned / drifted

Alignment classification is **threshold-driven**. Two configurable
settings define the bands:

- `alignedThreshold`
- `semiAlignedThreshold`

A tenant (or an individual policy) is classified by comparing its
alignment value against those thresholds:

| Classification | Condition |
|----------------|-----------|
| **aligned** | value `>= alignedThreshold` |
| **semi-aligned** | value `>= semiAlignedThreshold` **and** `< alignedThreshold` |
| **drifted** | value `< semiAlignedThreshold` |

So the bands are: at or above `alignedThreshold` is **aligned**; in the
window `[semiAlignedThreshold, alignedThreshold)` is **semi-aligned**;
below `semiAlignedThreshold` is **drifted**. Always state the threshold
values you used in the report — a tenant's band is meaningless without
the thresholds that produced it, and changing the thresholds reclassifies
tenants without anything actually changing on the tenant.

```
def classify(value, aligned_threshold, semi_aligned_threshold):
    if value >= aligned_threshold:
        return "aligned"
    if value >= semi_aligned_threshold:
        return "semi-aligned"
    return "drifted"
```

## Portfolio posture roll-up

For a fleet report:

1. `inforcer_tenants_list` — enumerate managed tenants (page to completion).
2. For each tenant's integer Client Tenant ID, pull
   `inforcer_alignment_scores` and `inforcer_secure_scores`.
3. Apply the `alignedThreshold` / `semiAlignedThreshold` classification
   to the alignment value.
4. Sort tenants drifted-first, then semi-aligned, then aligned, so the
   MSP triages the worst posture first.
5. Summarize: counts per band, lowest secure scores, and the tenants
   that are both drifted **and** low secure score (the priority list).

| Column | Source |
|--------|--------|
| Alignment score + band | `inforcer_alignment_scores` + thresholds |
| Secure score | `inforcer_secure_scores` |
| Classification | computed (aligned / semi-aligned / drifted) |

## Caveats

- This surface is **read-only**. You can report posture but cannot
  remediate it, deploy policies, or restore configuration via the API —
  those are UI-only. Report findings as recommendations.
- The API is **community-sourced** (no official public docs); the exact
  field names for secure score, alignment value, and the threshold
  settings are illustrative and credited to
  [`royklo/InforcerCommunity`](https://github.com/royklo/InforcerCommunity).
- Don't present a band without its thresholds. If thresholds are
  configured differently between runs, a tenant can "change band" with no
  real posture change — note the thresholds for reproducibility.
- Secure score and alignment measure different things; don't conflate
  them. A high secure score with low alignment means Microsoft is happy
  but the tenant diverges from the MSP baseline (and vice versa).

## Related Skills

- [baseline-alignment](../baseline-alignment/SKILL.md) - alignment scores and the per-policy drift detail behind the bands
- [tenant-management](../tenant-management/SKILL.md) - enumerate and resolve tenants for the roll-up
- [assessments](../assessments/SKILL.md) - run an assessment to refresh posture inputs
- [api-patterns](../api-patterns/SKILL.md) - envelope, pagination, region, and the integer-id gotcha
