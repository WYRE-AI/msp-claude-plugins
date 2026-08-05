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

## Tool permission groups

**Read this table's third column before its first.** Conduit classifies
only **4 of this plugin's 18 tools**. The other 14 are absent from
`VENDOR_TOOL_CONFIG` (`src/proxy/result-cache.ts:1029`) and therefore
fail closed to `admin` —
`const requiredTier: PermissionTier = classified ?? 'admin';`
(`src/access/access-enforcement.ts:63`). That is not a judgement about
those tools; it is what Conduit does with a tool name it does not
recognise.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change Crewhu state. | `read` | `crewhu_surveys_list`, `crewhu_surveys_detractors`, `crewhu_users_list`, `crewhu_badges_list` (4) |
| **Read (unclassified)** | Also cannot change Crewhu state — but Conduit does not know that, so it demands the top tier. | `admin`, by fail-closed default | `crewhu_surveys_get`, `crewhu_surveys_search`, `crewhu_surveys_promoters`, `crewhu_users_get`, `crewhu_users_search`, `crewhu_badges_get`, `crewhu_badges_history_list`, `crewhu_badges_user_recognition`, `crewhu_prizes_list`, `crewhu_prizes_get`, `crewhu_prizes_history_list`, `crewhu_prizes_user_redemptions`, `crewhu_prizes_pending_redemptions` (13) |
| **Write** | Creates or modifies records. Reversible, but visible to staff. | `admin`, by fail-closed default | `crewhu_badges_update_contest` (1) |
| **Delete** | *Empty.* | — | None. |
| **Admin** | *Empty by classification* — no Crewhu tool is marked `isAdmin`. Fourteen tools nonetheless require `admin`, for the reason above. | — | None. |

The "Read (unclassified)" row is not one of the four groups Conduit's
access editor presents. It is drawn out separately because the honest
answer for those 13 tools is neither "read" nor "admin" — they *are*
reads, and they *enforce* at admin — and collapsing that into either
column would mislead an owner deciding what to grant.

**This plugin is read-only except for one tool.** Seventeen of the
eighteen tools cannot change anything; `crewhu_badges_update_contest` is
the sole write, and nothing here deletes data, revokes access, or moves
money. That is a statement about Crewhu's API. It is not a statement
about what Conduit will let an agent do.

**What that combination actually costs you.** An agent granted tier
`read` on Crewhu can call four tools: the survey list, the detractor
queue, the user list, and the badge list. Trend reporting works;
per-technician roll-ups mostly work. Every prize tool, every search,
every `_get`, and the whole recognition-history surface returns a denial.

The workaround an operator will reach for is granting `admin` — and
`admin` is the only tier that admits those 13 reads. **It also admits
`crewhu_badges_update_contest`, the one tool that changes anything.**
There is no tier between the two. The only mechanism that admits the
unclassified reads while excluding the write is a granular per-tool
grant, which compiles to an explicit `customTools` allowlist
(`src/access/tier-group-mapping.ts`, `selectionToGrant`); note that such
a grant still stores tier `admin`, because the compiled tier is the
highest any listed tool requires, and enforcement is the intersection of
that tier with the allowlist.

This is worth flagging to whoever maintains `VENDOR_TOOL_CONFIG`.
Classifying the remaining 14 tools is a **privilege reduction**: it moves
13 reads down from `admin` to `read` and the contest write down to
`write`, and it removes the only reason an operator has to hand out
`admin` on this vendor at all. Note also that `wyre-gateway/GOVERNANCE.md`
lists `crewhu` in its *classified* column — true at the slug level, and
misleading at the tool level, which is the granularity that gets
enforced.

That single write still deserves a human. A recognition contest is
staff-facing gamification: changing its parameters mid-run alters who is
seen to be winning, and the change is visible to the whole team the next
time they open Crewhu. It is trivially reversible in the data and not at
all reversible in the room.

## Recommended agent policy

The safe default is **read autonomously where Conduit lets you, propose
the one write, never grant it unattended.**

- The four classified read tools: allow at tier `read`. Trend reporting,
  detractor queues, and per-tech roll-ups are the intended autonomous
  use and they are reachable without elevation.
- The 13 unclassified read tools: reaching them means granting `admin`,
  which also grants the contest write. Decide whether the reporting is
  worth that, or use a granular `customTools` grant that lists the reads
  and omits `crewhu_badges_update_contest`.
- `crewhu_badges_update_contest`: agent drafts the exact call, a human
  approves, then it runs.
- Delete tools: none exist, so there is nothing to withhold.

Conduit does not enforce that approval. It compares tiers — it has no
approval step, no per-call confirmation, and no interactive prompt. "A
human approves, then it runs" is a workflow you impose on your agents,
and it is only as good as the agent configuration that carries it.

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
