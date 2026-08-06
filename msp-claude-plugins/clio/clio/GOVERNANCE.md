# Clio plugin — governance and safety model

Unofficial. Community-built plugin for the Clio Manage API. Not affiliated
with, endorsed by, or sponsored by the vendor.

Clio is the first legal-vertical connector in this marketplace. The data
behind it is privileged attorney-client material, which changes the
governance question from "what can the agent break" to "what should the
agent ever see". Read this before granting any tool.

## What it connects as

This plugin does not hold credentials. It reaches Clio through the WYRE
Conduit gateway (`https://conduit.wyre.ai/v1/clio/mcp`), which brokers
OAuth 2.0 Authorization Code centrally and scopes every call to the Clio
account the operator connected.

- No Clio API key, client secret, or token is stored on the technician's
  machine, in this repo, or in the model's context. You never paste a key
  anywhere — you sign in at `https://conduit.wyre.ai/connect/clio` and
  Conduit holds and refreshes the grant.
- There are two distinct OAuth relationships: your MCP client to Conduit,
  and Conduit to Clio. An auth failure on a tool call is almost always the
  second one, fixed at the connect page rather than in client config.
- Every call carries operator identity, so the gateway audit log answers
  "who read that matter" — Clio's own log records the connected
  application.
- Removing someone from the organisation clears their per-vendor grants
  and revokes their gateway refresh tokens at once; a user deactivated in
  your identity provider is refused on their very next request. A user
  only removed from the org keeps an already-issued access token for up to
  an hour, but it reaches only a personal Clio connection made with their
  own key — never the org's. See `wyre-gateway/GOVERNANCE.md`.

## Tool permission groups

Tools sit behind decision-tree navigation: `clio_navigate` moves into a
domain, `clio_status` reports where you are, `clio_back` returns. Domain
tools are not callable until you have navigated into their domain. That
is a **server-side workflow, not an access control** — Conduit knows
nothing about it, enforces nothing about it, and would admit any of
these tools in any order. Do not treat navigation as a safety boundary.

These are the four groups Conduit's access editor presents. All 26 tools
are classified in `VENDOR_TOOL_CONFIG` (`src/proxy/result-cache.ts:1515`),
so every tier below is the tier Conduit actually enforces — this is one
of the few plugins in the fleet where the document and the gate agree
tool-for-tool.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change Clio state. Returns privileged material — see Data handling. | `read` | `clio_navigate`, `clio_status`, `clio_back`, `clio_matters_list`, `clio_matters_get`, `clio_contacts_list`, `clio_contacts_get`, `clio_activities_list`, `clio_activities_get`, `clio_tasks_list`, `clio_tasks_get`, `clio_communications_list`, `clio_communications_get`, `clio_documents_list`, `clio_documents_get`, `clio_calendar_entries_list`, `clio_calendar_entries_get`, `clio_bills_list`, `clio_bills_get` (19) |
| **Write** | Creates or edits case records. Visible to the whole firm, and in the case of time entries, to the client. | `write` | `clio_matters_create`, `clio_matters_update`, `clio_contacts_create`, `clio_contacts_update`, `clio_tasks_create`, `clio_tasks_update`, `clio_activities_create` (7) |
| **Delete** | *Empty.* | — | None. |
| **Admin** | *Empty.* | — | None. |

**There is no delete tool on any entity, in any domain.** That is a
deliberate v1 decision, not an oversight: legal records are routinely
subject to retention obligations, malpractice-insurance requirements, or
discovery. Deletion, when genuinely needed, happens in Clio directly, by a
human, inside Clio's own audit trail.

The empty Delete group is worth a sentence because of what it means
elsewhere. Conduit's enforcement tiers are only `read`, `write`, and
`admin` (plus `none`, meaning deny) — `src/access/permission-tier.ts:27`.
"Delete" is a presentation group in the access editor, and a
delete-group tool compiles to and enforces at tier `write`
(`src/access/tier-group-mapping.ts`, `GROUP_ENFORCEMENT_TIER`), so on
most vendors a `write` grant silently admits every delete tool as well.
Here it does not, because there are none: granting a technician `write`
on Clio admits exactly the seven create/update tools above and nothing
else. That is an unusually clean grant, and it is a property of this
vendor rather than of the tier model.

**Where the mechanical tier and the real risk disagree.** Conduit's
model grades one thing: can this call change vendor state. It has no
opinion about what a call *discloses*. So
`clio_communications_get` — logged emails, calls, and notes on a matter,
the clearest case of privileged attorney-client communication in the
whole marketplace — sits at tier `read`, identical to `clio_status`,
which returns where you are in a menu. A tier-based grant cannot
separate them. If you need that separation it has to be a granular
per-tool grant, which compiles to an explicit `customTools` allowlist,
or a rule in the agent's own configuration.

`clio_activities_create` is the write tool that deserves a second look. It
is **create-only — there is no update or delete for activities.** A time
or expense entry logged in error cannot be corrected or removed through
this integration, and unbilled activities are what a bill is generated
from. An agent that logs 8 hours instead of 0.8 has put a number on a
client's invoice that only a human in Clio can take off. Conduit tiers it
`write`, indistinguishable from `clio_tasks_update`, which is trivially
undoable.

## Recommended agent policy

The safe default is **read attended, propose writes, and treat the
communications and documents domains as off by default.**

- Read tools: allow for matters, contacts, tasks, activities, calendar
  entries, and bills — attended. These are the domains a matter summary
  needs.
- **`clio_communications_list` / `clio_communications_get`: restrict.**
  Logged emails, calls, and notes on a matter are frequently the most
  sensitive record in the file and the clearest case of privileged
  attorney-client communication. Grant only where the operator has a
  specific reason. Conduit will not do this for you — both tools are
  tier `read`, so a plain `read` grant already admits them, and the only
  mechanism that excludes them is a granular `customTools` allowlist.
- Write tools: agent drafts the exact call, human approves, then it runs.
  Treat `clio_activities_create` as requiring a human every time, because
  it is not correctable afterwards.
- Delete and admin tools: none exist. Do not let an agent simulate one —
  a matter that should not exist gets its status changed to closed, never
  worked around through another domain.

Conduit does not enforce any of the approval steps above. It compares
tiers; it has no approval step, no per-call confirmation, and no
interactive prompt. "Human approves, then it runs" is a workflow you
impose on your agents, and it is only as good as the agent
configuration that carries it.

## What it cannot reach

- Only the Clio account the operator connected, in the region selected at
  connect time.
- **Document contents.** `clio_documents_list` and `clio_documents_get`
  return metadata only — name, matter, dates. There is no download and no
  upload tool. Document bodies are frequently privileged or subject to
  matter-specific access restrictions this integration cannot evaluate, so
  it does not try.
- **Billing mutations.** Bills are read-only. You can see status and
  amounts; you cannot generate, edit, or void a bill. Trust accounting and
  IOLTA compliance require rigour that is explicitly out of scope for v1.
- **Communications and calendar writes.** Both domains are read-only.
- No filesystem, no shell, no other vendor's data.
- No live event stream. Every tool is point-in-time.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin. In this connector that sentence
  carries more weight than usual: what enters model context is case
  material.
- `clio_communications_*` returns privileged attorney-client
  communication. Do not summarise it into any artefact that leaves the
  session — a ticket note, a shared document, a chat message.
- `clio_contacts_*` returns PII for clients, opposing parties, and
  witnesses. Opposing-party and witness records are third-party personal
  data the firm holds under a duty of care, not the firm's own customer
  list.
- `clio_matters_*` returns matter descriptions and practice areas — enough
  on its own to disclose that a named person is involved in a specific
  legal action.
- `clio_bills_*` and `clio_activities_*` return billing narratives, which
  in legal practice routinely describe the work in substantive detail.
- `clio_calendar_entries_*` returns court dates and deadlines.

## Known sharp edges

- **"Tool not found" usually means "not navigated".** Domain tools are
  invisible until `clio_navigate` puts you in their domain. An agent that
  concludes a capability does not exist has probably just skipped a step —
  check `clio_status` first.
- **Non-US regions are unverified.** The Clio Region field selects the
  regional API host, but the OAuth Authorization Code flow is not
  confirmed working end-to-end for CA/EU/AU accounts as of v1. If the
  connect flow misbehaves on a non-US instance, that is the known gap.
  Flag it rather than retrying indefinitely.
- **Matters are the hub; resolve them first.** Almost every other object
  references `matter_id`. An agent that searches activities or
  communications globally instead of scoping to a matter will pull
  material from unrelated client files.
- **Pagination is cursor-based.** A short first page is not proof the list
  is complete; check for the next-page cursor before reporting totals,
  particularly for activities where an incomplete pull under-reports
  billable time.
- **Legal vocabulary collides with MSP vocabulary.** "Matter" is not a
  ticket, a Clio "bill" is not a QuickBooks invoice, and a Clio contact is
  not a PSA company. Routing guidance lives in the individual skills'
  `## Anti-triggers` sections.
