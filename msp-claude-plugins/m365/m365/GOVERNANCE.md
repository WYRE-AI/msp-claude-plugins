# Microsoft 365 plugin — governance and safety model

Unofficial. Community-built plugin for Microsoft 365 administration via
Microsoft Graph. Not affiliated with, endorsed by, or sponsored by the
vendor.

This is the most dangerous plugin an MSP can point at a customer. It
reaches mailboxes, calendars, and files in a live production tenant —
and, through a single arbitrary-Graph passthrough tool, identities and
licences as well. Several of its routine operations are irreversible in
ways that are not obvious from the tool name. Read the permission
groups before granting anything, and read the note about what this
plugin documents versus what Conduit actually gates.

## What it connects as

This plugin should hold no credentials. It reaches Microsoft Graph
through the WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`),
which brokers authentication centrally and scopes every call to the
tenant the operator is authorised for.

- No client secret is stored on the technician's machine, in this repo,
  or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who disabled that account" — the Microsoft 365 unified audit log
  records only the app registration, and cannot tell you which
  technician was behind it.
- Revoking gateway access revokes Graph access with it, immediately.

**One exception you must know about.** This plugin's `README.md` and
`.env.example` still document a direct-to-Microsoft path: an Entra app
registration whose `MICROSOFT_CLIENT_SECRET` sits in a local `.env`
file. That path puts a tenant-wide, admin-consented credential on a
technician's laptop and produces no per-operator attribution — every
action in the customer's audit log appears as the app. Do not use it
against production tenants. It is documentation drift, not a supported
deployment model.

## Tool permission groups

### Two surfaces, and they do not join

This plugin and Conduit do not describe the same thing, and the
mismatch has to be stated before any table can be read honestly.

**Conduit's `m365` slug classifies one specific MCP server** — the
`@softeria/ms-365-mcp-server` sidecar, pinned at v0.111.0, **172 tools**,
named in kebab-case: `list-mail-messages`, `send-mail`,
`delete-onedrive-file`, `graph-batch`. Those names are what a Conduit
grant admits or denies (`src/proxy/result-cache.ts:1057`), because the
tier gate matches on tool name and nothing else
(`src/proxy/tool-call-enforcement.ts:69-79`).

**This plugin's skills teach raw Graph HTTP operations** —
`GET /users/{id}/messages`, `POST /users/{id}/assignLicense`. Not one of
the 172 sidecar tool names appears anywhere in this plugin's files. The
previous revision of this document tiered those operations, and added a
fourth "Read (confidential)" tier of its own. Neither had any
enforcement meaning: Conduit has no `confidential` tier, no
`destructive` tier, and no way to see an HTTP verb or a URL path.

So the table below tiers **the tools Conduit actually gates**. The
operations the skills teach are dealt with after it, including the ones
that have no tool at all. No mapping between the two is invented here,
because there is no join key: several operations map to no tool, several
tools map to no documented operation, and guessing which is which is
exactly the error this document exists to prevent.

### The four groups Conduit's access editor presents

| Group | What it can do | Enforcement tier | Tools (172 total) |
|---|---|---|---|
| **Read** | Cannot change tenant state. Returns mail bodies, file names, and calendar contents — see *Read is not the same as safe*. | `read` | 66 tools. `list-mail-messages`, `list-mail-folder-messages`, `get-mail-message`, `get-mail-message-mime`, `list-mail-attachments`, `list-mail-rules`, `get-mailbox-settings`, `list-calendar-events`, `get-calendar-view`, `list-calendars`, `list-drives`, `list-folder-files`, `get-drive-item`, `search-onedrive-files`, `list-drive-item-permissions`, `get-onenote-page-content`, `get-excel-range`, `list-outlook-contacts`, `list-todo-tasks`, `list-plan-tasks`, `get-current-user`, `get-mail-tips`, … |
| **Write** | Creates or modifies records. Reversible in the data; often not reversible in the customer's inbox. | `write` | 77 tools. `send-mail`, `send-draft-message`, `create-draft-email`, `reply-mail-message`, `reply-all-mail-message`, `forward-mail-message`, `move-mail-message`, `create-mail-rule`, `update-mail-rule`, `update-mailbox-settings`, `create-calendar-event`, `update-calendar-event`, `forward-calendar-event`, `upload-file-content`, `share-drive-item`, `create-drive-item-share-link`, `move-rename-onedrive-item`, `update-excel-range`, `create-onenote-page`, `upload-my-profile-photo`, … |
| **Delete** | Removes mail, files, calendars, rules, and sharing permissions. | `write` — **not** a tier of its own | 21 tools. `delete-mail-message`, `delete-mail-folder`, `delete-mail-attachment`, `delete-mail-rule`, `delete-onedrive-file`, `delete-drive-item-permission`, `delete-calendar`, `delete-calendar-event`, `delete-specific-calendar-event`, `cancel-calendar-event`, `delete-outlook-contact`, `delete-contact-folder`, `delete-onenote-page`, `delete-excel-range`, `delete-excel-table-row`, `delete-focused-inbox-override`, `delete-my-calendar-permission`, `delete-planner-bucket`, `delete-todo-task`, `delete-todo-task-list`, `delete-todo-linked-resource` |
| **Admin** | Arbitrary-Graph passthrough, and the change-notification webhooks that establish a standing data-egress channel. | `admin` | 8 tools. `graph-batch`, `download-bytes`, `create-subscription`, `update-subscription`, `delete-subscription`, `reauthorize-subscription`, `get-subscription`, `list-subscriptions` |

**The Delete row is the one to read twice.** Conduit's enforcement tiers
are only `read`, `write`, and `admin` (plus `none`, meaning deny) —
`src/access/permission-tier.ts:27`. "Delete" is a presentation group in
the access editor, and a delete-group tool compiles to and enforces at
tier `write` (`src/access/tier-group-mapping.ts`,
`GROUP_ENFORCEMENT_TIER`). So **granting a technician `write` on this
vendor also grants all 21 delete tools above** — including
`delete-mail-message` and `delete-onedrive-file` against a live
production mailbox. There is no setting that separates them; the only
way to admit some write tools but not the delete ones is a granular
per-tool grant, which compiles to an explicit `customTools` allowlist.

**`graph-batch` is the tool that re-opens everything else.** It is an
arbitrary-Graph-request passthrough: any method, any endpoint, wrapped
in a batch envelope. Every operation this plugin's skills teach and the
sidecar does not expose — user creation, account disable, session
revocation, licence assignment — is reachable through it, and no gate
reads the arguments to notice. It is correctly pinned `admin`, and the
grant should be treated as equivalent to full tenant administrator,
because for a passthrough tool that is exactly what it is. Never give it
to a scheduled or unattended agent.

Three of the admin tools are **read-only and still pinned to `admin`**:
`download-bytes` (arbitrary-Graph-path binary GET), `get-subscription`,
and `list-subscriptions` are all `isWrite: false, isAdmin: true`, and
`isAdmin` outranks (`src/access/tool-classification.ts:33-38`). This is
the same rule that pins the `microsoft-graph` plugin's
`microsoft_graph_get` to `admin`: when blast radius is chosen by
arguments rather than by tool name, a name-matching gate has to price
the worst argument.

### Operations these skills teach that have no tool here

The sidecar is a **personal-productivity** Graph surface — mail,
calendar, contacts, files, Excel, OneNote, Planner, To-Do. It runs
non-org-mode, so it registers no directory, identity, licence, security,
or Teams administration tools at all. Every one of the following, which
this plugin's skills and commands describe, has **no corresponding tool**
under Conduit's `m365` slug:

`GET /users` and `GET /users/{id}` (user lookup), `POST /users` (create
user), `PATCH /users/{id}` with `accountEnabled: false`,
`POST /users/{id}/revokeSignInSessions`, `POST /users/{id}/assignLicense`,
`GET /subscribedSkus`, `GET /users/{id}/memberOf`,
`GET /users/{id}/authentication/methods`,
`GET /reports/authenticationMethods/userRegistrationDetails`,
`GET /auditLogs/signIns`, `GET /auditLogs/directoryAudits`,
`GET /identityProtection/riskyUsers`,
`GET /identity/conditionalAccess/policies`, `GET /security/secureScores`,
and the whole Teams and SharePoint-sites surface.

Three honest consequences:

1. **A Conduit `m365` grant does not deliver the MFA audit, licence
   reclamation, or offboarding workflows this plugin advertises.** Those
   need `microsoft-graph` (read-only, and itself `admin`-tiered), `cipp`
   for the fleet, or Exchange/Entra PowerShell.
2. **Except through `graph-batch`**, which reaches all of them and is
   `admin`. If an operator has been told "just grant m365 admin so the
   offboarding script works", that is what they are granting.
3. **The direct-to-Microsoft path in `README.md` and `.env.example`
   bypasses Conduit entirely**, and with it every tier in this document.
   See the exception noted above; do not use it against production.

### Read is not the same as safe

The four groups grade one thing — can this call change tenant state —
and grade it by tool name. They have no opinion about what a call
*discloses*. The previous revision of this document invented a "Read
(confidential)" tier to express that, and the instinct was right even
though the tier does not exist. The gap is real and worth keeping:

- **`get-mail-message` and `get-mail-message-mime` return message
  bodies.** They are tier `read`, identical to `list-supported-time-zones`.
  A `read` grant places a customer's private correspondence — including
  what third parties sent them in confidence — into model context, and
  Conduit will not distinguish that call from a timezone lookup.
- **`search-onedrive-files` and `list-folder-files` leak by title.**
  "Redundancy plan Q3", "Acquisition — Project Falcon". The file is
  never opened; the fact is disclosed anyway. Also tier `read`.
- **`list-mail-rules` and `get-mailbox-settings`** expose the forwarding
  and rule configuration that a compromise investigation looks for —
  useful, and equally useful to anyone reconstructing how a mailbox is
  monitored.

Conduit cannot express "read, but not that read". If the distinction
matters — and in a mailbox it usually does — it has to be a granular
`customTools` allowlist or a rule in the agent's own configuration.

### Two write tools worse than their tier suggests

- **`send-mail` and `send-draft-message` change no directory object at
  all** — and are the most dangerous writes on the surface. They send
  mail **as the user**, to recipients who may be outside the
  organisation, with no indication it was automated. Mail cannot be
  recalled, it lands in the customer's Sent Items as if they wrote it,
  and it is indistinguishable from business email compromise to anyone
  reviewing the mailbox afterwards. Conduit tiers them `write`,
  identical to `update-todo-task`.
- **`update-mailbox-settings` sets out-of-office and external
  forwarding through the same call.** Forwarding silently routes a copy
  of the customer's mail to an outside address. It is, verbatim, the
  persistence mechanism this plugin's own `m365-security` skill teaches
  you to hunt for: any agent that can set an auto-reply can install the
  exact artefact you audit for. One tool, one tier, two very different
  outcomes chosen by an argument no gate reads.

The licence-removal hazard documented under *Known sharp edges* remains
the most consequential thing an operator can do to a customer through
Graph — but there is **no licence tool in this surface**, so it can only
be reached via `graph-batch` at tier `admin`. That is the right place
for it, and it is worth knowing that the 30-day mailbox-deletion clock
sits behind an `admin` grant rather than a `write` one.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve deletes, and treat admin as tenant administrator.**

- Read tools: allow — with the mailbox and file-search exceptions
  above. Calendar availability, task and plan roll-ups, and file
  inventory are the intended autonomous use.
- Mail-body and file-search reads: restrict deliberately. Reading a
  customer's mail changes nothing, so a tier-based policy waves it
  through; decide separately whether an agent should ever see message
  bodies, and log it when it does.
- Write tools: agent drafts the exact call, human approves, then it
  runs. `send-mail` and `update-mailbox-settings` deserve a named
  approver every time.
- Delete tools: require a named human approver per invocation. Do not
  grant these to scheduled or unattended agents. Conduit cannot enforce
  this separation for you — a `write` grant already admits all 21 — so
  it has to live in the agent's own configuration.
- Admin tools: treat the grant as equivalent to full tenant
  administrator, because `graph-batch` makes it exactly that.
- Prefer the read-only route for questions. If the task is "how many",
  "who has no MFA", or "which licences are unused", the `microsoft-graph`
  plugin answers it with a structurally read-only tool surface and no
  write path to mis-fire — at the cost of an `admin` grant of its own.
  Use this plugin when you intend to change something.

None of the approval steps above are things Conduit does. Conduit
compares tiers. It has no approval step, no per-call confirmation, and
no interactive prompt. Per-call approval is a workflow you impose on
your agents, and it is only as good as the agent configuration that
carries it.

## What it cannot reach

- Only the Microsoft 365 tenants mapped to the operator's gateway
  identity, and within them only what the granted Graph scopes and the
  caller's Entra roles permit.
- No filesystem, no shell, no other vendor's data.
- **One tenant at a time.** There is no fleet view here; "across all our
  customers" is a `cipp` question.
- **No directory, identity, licence, security, or Teams administration
  tools.** The server Conduit gates under `m365` is a personal-
  productivity surface. User management, MFA reporting, licence
  assignment, sign-in logs, conditional access, Secure Score, and Teams
  administration have no tool here at all — only `graph-batch` (tier
  `admin`) reaches them. See *Operations these skills teach that have no
  tool here*.
- **Not everything is in Graph.** Shared-mailbox full-access
  permissions, mailbox-to-shared conversion, SharePoint site ownership
  transfer, and message trace need Exchange or SharePoint PowerShell, or
  the admin centre. An offboarding run through this plugin alone leaves
  those steps undone — say so rather than reporting the offboarding
  complete.
- No push feed. Every call is point-in-time; sign-in logs lag.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- **This plugin returns message content.** `get-mail-message`,
  `get-mail-message-mime`, and `list-mail-messages` place the customer's
  private correspondence — including anything a third party sent them in
  confidence — into the model context. This is the single most sensitive
  capability in the fleet, and it sits at tier `read`. Restrict it, and
  treat any transcript containing it accordingly.
- **File and mailbox search results leak by title.**
  `search-onedrive-files` and `list-folder-files` return file names —
  "Redundancy plan Q3", "Acquisition — Project Falcon" — which disclose
  sensitive facts even when the content is never opened. Also tier
  `read`.
- **`download-bytes` returns file *contents*** as raw bytes from an
  arbitrary Graph path. It is `isWrite: false` and pinned `admin`, which
  is the right price for it.
- **Sign-in telemetry is personal data.** `auditLogs/signIns` returns IP
  addresses and geolocation per named user; in several jurisdictions
  this attracts employee-monitoring obligations independent of the
  customer's consent to IT support. There is **no sign-in-log tool** in
  this surface — reaching it means `graph-batch` (tier `admin`), the
  `microsoft-graph` plugin, or `cipp`. The obligation follows the data,
  not the route.
- **Directory and licence reads carry PII throughout**: names, UPNs,
  email addresses, job titles, managers, group membership, device
  names, guest/external account details. Same routing caveat — no
  directory tool exists here; `get-current-user` returns the caller only.
- **Credentials in flight.** User creation returns a `passwordProfile`
  with a plaintext temporary password, which will appear in the model
  context and in any transcript of the session. No user-creation tool
  exists in this surface, so this applies to the `graph-batch` and
  direct-`.env` routes. Do not paste such a password into a ticket note
  or a chat channel.

## Known sharp edges

- **Licence removal is a delayed delete.** Repeated because it is the
  one that ends in data loss: 30 days after the Exchange licence comes
  off, the mailbox goes. Nothing surfaces this at call time. It is not
  reachable from this surface directly — no licence tool exists — so it
  arrives via `graph-batch` at tier `admin`, or outside Conduit
  entirely. That makes an `admin` grant here a data-retention decision,
  not just a permissions one.
- **`signInActivity` requires Entra ID P1/P2 and returns null
  otherwise** — indistinguishable from "never signed in". An inactivity
  sweep on an unlicensed tenant will class the entire directory as
  dormant and recommend reclaiming every seat. Confirm the licence tier
  before trusting an inactivity report, wherever the report came from.
- **Advanced queries fail silently without the right header.** Filters
  such as `assignedLicenses/$count eq 0` need `ConsistencyLevel:
  eventual` and `$count=true`. Missing them yields an error or a wrong
  result set — and a wrong result set here is the input to a licence
  reclamation.
- **Throttling degrades mid-task.** Graph returns 429 with `Retry-After`
  at roughly 10,000 requests per 10 minutes per app per tenant. A
  tenant-wide per-user loop — MFA methods, mailbox rules — will hit it
  partway through and produce a partial audit that looks complete.
  Paginate to exhaustion and check for truncation before reporting
  totals.
- **`Authorization_RequestDenied` is usually consent, not a bug.** The
  scope was never admin-consented in that tenant. Fix consent; do not
  retry.
- **Removing the sole team owner orphans the team.** Check ownership
  before any offboarding removal, and assign a replacement first. No
  Teams membership tool is registered in this surface, so this bites on
  the `graph-batch`, `cipp`, or admin-centre routes.
- **Soft-delete is a 30-day window, not a safety net.** A deleted user is
  recoverable for 30 days and then is not. Do not describe deletion as
  reversible without saying when it stops being so.
