---
name: "myITprocess Roadmap"
description: >
  The myITprocess strategic roadmap: findings from alignment reviews, the
  recommendations they become (type, responsible party, status, priority,
  budget, budget month, hours), the initiatives that group recommendations, and
  the IT Glue configurations attached to a recommendation. Covers budget
  forecasting, open-gap reviews, and tracing a finding to its recommendation and
  the devices behind it. Read-only.
when_to_use: >-
  When building or reviewing a client's IT roadmap or budget forecast, listing
  open recommendations by priority or status, finding review gaps that never
  became recommendations, or checking which devices a recommendation covers.
  Use when: myitprocess roadmap, recommendations, initiatives, findings, IT
  budget forecast, technology roadmap, or recommendation configurations.
---

# myITprocess Roadmap

## Overview

Review answers become **findings**; the vCIO turns findings into
**recommendations** (a project, a maintenance item, a business goal, with a
budget and hours); related recommendations are grouped into **initiatives**.
This is the roadmap a vCIO presents to the client. See
[api-patterns](../api-patterns/SKILL.md) for filters, paging and the rate limit.

Every tool here is a Conduit **read** tool. None is admin-gated and none writes:
accepting, rejecting or re-prioritising a recommendation happens in the
myITprocess UI.

## Anti-triggers

- **Which reviews are late or what the next review should cover** — use
  [alignment-reviews](../alignment-reviews/SKILL.md).
- **One client's QBR brief** — use [qbr-prep](../qbr-prep/SKILL.md), which
  pulls from this skill's data.

## Key Concepts

### Recommendations (`myitprocess_recommendations_list`)

| Field | Values |
|-------|--------|
| `type` | `Project`, `TimeMaterial`, `Maintenance`, `Strategic`, `BusinessGoal` |
| `responsibleParty` | `Us` (the MSP), `You` (the client), `ThirdParty` |
| `status` | `NotDiscussed`, `Accepted`, `Rejected`, `OnHold`, `InProgress`, `Completed` |
| `priority` | `NoPriority`, `Low`, `Medium`, `High` |

Also `budget`, `budgetMonth`, `hours`, `client.id` / `client.name`,
`initiative.id`, `parentId`, `isArchived`, `name`, `description`. Each item
also carries feedback history and linked finding IDs; those are arrays, so they
come back in results but cannot be filtered or sorted.

### Findings (`myitprocess_findings_list`)

`question.label`, `question.text`, `review.id`, `review.name`,
`vcioAnswerType`, `findingType`, `recommendationId`, `isArchived`.

| `findingType` | Meaning |
|---------------|---------|
| `AssignedToRecommendation` | The gap has a recommendation (`recommendationId`) |
| `UnassignedReviewFinding` | A gap from a review that no recommendation addresses yet |
| `Legacy` | A finding in myITprocess's older finding model; report it with the rest |

Findings have **no client field**. Scope them through `review.id` (reviews are
per client) or through `recommendationId`.

### Initiatives (`myitprocess_initiatives_list`)

`title`, `description`, `client.id` / `client.name`, `isArchived`, and the IDs
of the recommendations grouped under the initiative (array).

### Configurations (`myitprocess_recommendations_configurations_list`)

The IT Glue configurations (devices and assets) attached to **one**
recommendation: `name`, `status`, `type`, `location`, `expirationDate`.
Requires `recommendation_id`. One call per recommendation, so use it only on the
recommendations that matter.

## Common Workflows

### Budget forecast for a client

1. `myitprocess_recommendations_list` filtered by `client.id` and `isArchived`
   `equal` `false`; page to `totalCount`.
2. Drop `Rejected` and `Completed`. Keep `Accepted`, `InProgress`, `OnHold` and
   `NotDiscussed`, but keep `NotDiscussed` in its own column: it is proposed
   spend, not committed spend.
3. Group `budget` and `hours` by `budgetMonth` (or by quarter), then by `type`.
   Show `responsibleParty`: a `You` or `ThirdParty` item is client or vendor
   spend, not MSP project revenue.
4. Attach initiative titles from `myitprocess_initiatives_list` filtered by the
   same `client.id`, matching on `initiative.id`.
5. Flag any `High` priority item with no budget or no `budgetMonth`.

### Open gaps nobody has picked up

1. Get the client's reviews: `myitprocess_reviews_list` filtered by `client.id`.
2. For each review (usually one or two), `myitprocess_findings_list` filtered
   `review.id` `equal` that ID, `findingType` `equal`
   `UnassignedReviewFinding`, and `isArchived` `equal` `false`. Keep every
   filter joined by the default `and`; mixing `and` and `or` in one call has no
   documented precedence.
3. List each finding's `question.label` / `question.text` and the review it came
   from. These are the gaps with no recommendation; treat any that read as
   security controls as the first conversation for the vCIO.

### Recommendations waiting on a decision (portfolio)

`myitprocess_recommendations_list` filtered `status` `equal` `NotDiscussed`
and `priority` `equal` `High`, sorted by `client.name`. Group by client: this is
the "bring to the next meeting" list.

### Which devices does a recommendation cover?

`myitprocess_recommendations_configurations_list` with the recommendation's
`id` as `recommendation_id`. Sort by `expirationDate` to show warranty or
lifecycle pressure behind a hardware refresh recommendation.

## Gotchas

- **`budget` currency and `budgetMonth` format come back as stored.** Report
  them as returned; do not convert or assume a fiscal calendar.
- **Archived items are returned unless filtered.** Add `isArchived` `equal`
  `false` for anything client-facing.
- **Sub-recommendations.** A non-empty `parentId` means the item sits under
  another recommendation; do not double-count its budget if the parent already
  carries the total. Check with the user when parent and child both have
  budgets.
- **Findings can be sensitive.** They describe security gaps at the client.
  Keep them out of anything sent outside the MSP unless the user asks.
