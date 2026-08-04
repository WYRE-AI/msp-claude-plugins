# Crewhu plugin — governance and safety model

Unofficial. Community-built plugin for the Crewhu API. Not affiliated
with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Crewhu through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the Crewhu account the
operator is authorised for.

- No Crewhu API token is stored on the technician's machine, in this
  repo, or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who pulled this manager's scorecard" — Crewhu's own log records only
  the API account.
- Revoking gateway access revokes Crewhu access with it, immediately.

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Crewhu state. Safe for autonomous agents. | `crewhu_surveys_list`, `crewhu_surveys_get`, `crewhu_surveys_search`, `crewhu_surveys_detractors`, `crewhu_surveys_promoters`, `crewhu_users_list`, `crewhu_users_get`, `crewhu_users_search`, `crewhu_badges_list`, `crewhu_badges_get`, `crewhu_badges_history_list`, `crewhu_badges_user_recognition`, `crewhu_prizes_list`, `crewhu_prizes_get`, `crewhu_prizes_history_list`, `crewhu_prizes_user_redemptions`, `crewhu_prizes_pending_redemptions` |
| **Write** | Creates or modifies records. Reversible, but visible to staff. | `crewhu_badges_update_contest` |
| **Destructive** | — | None. |

**This plugin is read-only except for one tool.** Seventeen of the
eighteen tools cannot change anything; `crewhu_badges_update_contest` is
the sole write, and nothing here deletes data, revokes access, or moves
money.

That single write still deserves a human. A recognition contest is
staff-facing gamification: changing its parameters mid-run alters who is
seen to be winning, and the change is visible to the whole team the next
time they open Crewhu. It is trivially reversible in the data and not at
all reversible in the room.

## Recommended agent policy

The safe default is **read autonomously, propose the one write, never
grant it unattended.**

- Read tools: allow. Trend reporting, detractor queues, and per-tech
  roll-ups are the intended autonomous use.
- `crewhu_badges_update_contest`: agent drafts the exact call, a human
  approves, then it runs.
- Destructive tools: none exist, so there is nothing to withhold.

## What it cannot reach

- Only the Crewhu account mapped to the operator's gateway identity.
- No filesystem, no shell, no other vendor's data.
- No PSA. Crewhu records the feedback; it cannot raise the follow-up
  ticket, log the call-back, or credit the account.
- No live feed. Every tool is point-in-time.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- **This plugin returns employee performance data.** `crewhu_users_*`
  returns named MSP staff (names, email addresses). `crewhu_surveys_*`
  ties a score and a free-text customer comment to the technician who
  handled the ticket — and detractor comments frequently name and
  criticise that person directly. `crewhu_badges_user_recognition` and
  `crewhu_prizes_user_redemptions` add a per-employee recognition and
  reward history.
- Survey comments are customer verbatims and routinely contain the
  customer contact's name, their company, and details of their issue.
- Treat the combination as HR-adjacent. In several jurisdictions,
  automated processing of employee performance data carries consultation
  or notification obligations. Restrict these tools if your agents run
  unattended, and do not pipe detractor comments into a channel the
  named technician has not been told about.

## Known sharp edges

- **Small denominators mislead.** Technicians with a handful of
  responses swing wildly. An agent that ranks staff without showing
  response counts will manufacture a performance problem that does not
  exist; treat anything under ~10 responses as low-confidence, not as a
  score.
- **Comment-only responses have no score.** Coercing them into an
  average silently biases the result. Report them separately.
- **Timestamps are tenant-local.** Comparing periods across tenants
  without normalising produces wrong week boundaries and wrong trends.
- **The contest write is the only rollback you own.** There is no
  vendor-side undo tool — restoring a contest means calling
  `crewhu_badges_update_contest` again with the previous values, so
  capture them before changing anything.
