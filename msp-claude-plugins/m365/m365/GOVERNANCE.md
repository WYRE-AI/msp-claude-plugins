# Microsoft 365 plugin — governance and safety model

Unofficial. Community-built plugin for Microsoft 365 administration via
Microsoft Graph. Not affiliated with, endorsed by, or sponsored by the
vendor.

This is the most dangerous plugin an MSP can point at a customer. It
reaches mailboxes, identities, licences, and files in a live production
tenant, and several of its routine operations are irreversible in ways
that are not obvious from the HTTP verb. Read the tiers before granting
anything.

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

## Tool permission tiers

This plugin's skills teach Graph calls directly rather than wrapping
them in named MCP tools, so the tiers below are keyed to the **Graph
operation**, which is what actually determines blast radius. Grant
against the operation, not the endpoint path — several tenant-destroying
calls are `POST` and several harmless ones are not.

| Tier | What it can do | Operations |
|---|---|---|
| **Read** | Cannot change tenant state. Safe for autonomous agents — but see the confidentiality warning below. | `GET /users`, `GET /users/{id}`, `GET /users/{id}/memberOf`, `GET /users/{id}/authentication/methods`, `GET /subscribedSkus`, `GET /reports/authenticationMethods/userRegistrationDetails`, `GET /reports/getMailboxUsageDetail`, `GET /auditLogs/signIns`, `GET /auditLogs/directoryAudits`, `GET /identityProtection/riskyUsers`, `GET /identity/conditionalAccess/policies`, `GET /security/secureScores`, `GET /teams`, `GET /teams/{id}/channels`, `GET /teams/{id}/members`, `GET /users/{id}/joinedTeams`, `GET /users/{id}/drive`, `GET /drives/{id}/items/{id}/permissions`, `GET /users/{id}/calendar/events`, `GET /users/{id}/calendarView`, `POST /users/{id}/calendar/getSchedule`, `GET /sites`, `GET /places/microsoft.graph.room` |
| **Read (confidential)** | Changes nothing, but returns the contents of a customer's private communications. | `GET /users/{id}/messages`, `GET /users/{id}/messages/{id}` (message body and attachments), `GET /users/{id}/mailboxSettings`, `GET /users/{id}/mailFolders/inbox/messageRules`, `GET /teams/{id}/channels/{id}/messages`, `GET /users/{id}/drive/root/search`, `GET /drives/{id}/root/children` |
| **Write** | Creates or modifies records. Reversible, but visible to the customer. | `PATCH /users/{id}` (profile properties, `usageLocation`), `POST /users` (create user), `PATCH /users/{id}/mailboxSettings` (out-of-office), `POST /users/{id}/events`, `PATCH /users/{id}/events/{id}`, `POST /users/{id}/onlineMeetings`, `POST /teams`, `POST /teams/{id}/members`, `POST /drives/{id}/items/{id}/createLink`, `POST /drives/{id}/items/{id}/invite`, `POST /identityProtection/riskyUsers/dismiss` |
| **Destructive** | Blocks a person's access, destroys data on a timer, or speaks to the outside world as someone else. Requires explicit human approval per call. | `PATCH /users/{id}` with `accountEnabled: false`, `POST /users/{id}/revokeSignInSessions`, `POST /users/{id}/assignLicense` with `removeLicenses`, `POST /users/{id}/sendMail`, `POST /users/{id}/events/{id}/cancel`, `DELETE /teams/{id}/members/{id}`, `POST /teams/{id}/archive`, `DELETE /drives/{id}/items/{id}/permissions/{id}`, `PATCH /users/{id}/mailboxSettings` when setting external forwarding |

### Why these four sit in the destructive tier

They are the calls most likely to be mis-tiered by an agent reasoning
from the HTTP verb, and each one is routine MSP work.

- **`POST /users/{id}/assignLicense` with `removeLicenses`** looks like
  cost hygiene and is the single most common way an MSP destroys
  customer data by accident. Removing an Exchange licence starts a
  30-day clock, after which the mailbox is **permanently deleted**.
  Nothing in the API response says so. An agent reclaiming "unused"
  seats from accounts flagged inactive is one bad inactivity threshold
  away from deleting a director's mail while they are on sabbatical.
  Convert the mailbox to shared, or confirm the retention path, before
  the licence comes off.
- **`POST /users/{id}/sendMail`** changes no directory object at all —
  and is destructive anyway. It sends mail **as the user**, to
  recipients who may be outside the organisation, with no indication it
  was automated. It cannot be recalled, it lands in the customer's Sent
  Items as if they wrote it, and it is indistinguishable from business
  email compromise to anyone reviewing the mailbox afterwards. Never
  grant it to an unattended agent.
- **`PATCH /users/{id}` with `accountEnabled: false` and
  `POST /users/{id}/revokeSignInSessions`** block a real person from
  working, across every device, immediately. Technically reversible;
  operationally an incident if the target was wrong.
- **`PATCH /users/{id}/mailboxSettings` setting external forwarding**
  is the same API shape as setting an out-of-office reply, but silently
  routes a copy of the customer's mail to an outside address. It is
  also, verbatim, the persistence mechanism this plugin's own
  `m365-security` skill teaches you to hunt for. Any agent that can
  write it can install the exact artefact you audit for.

`POST /teams/{id}/archive` and `DELETE /teams/{id}/members/{id}` are
tiered up for a narrower reason: archiving sets the backing SharePoint
site read-only for members, and removing the sole owner of a team
orphans it — a security finding the same skills tell you to report.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow — with the exception of the confidential-read row.
  Licence audits, MFA-coverage reports, sign-in reviews, and Secure
  Score reporting are the intended autonomous use.
- Confidential reads: restrict deliberately. Reading a customer's mail
  changes nothing, so a verb-based policy will wave it through; decide
  separately whether an agent should ever see message bodies, and log it
  when it does.
- Write tools: agent drafts the exact call, human approves, then it
  runs.
- Destructive tools: require a named human approver per invocation. Do
  not grant these to scheduled or unattended agents under any
  circumstances.
- Prefer the read-only route for questions. If the task is "how many",
  "who has no MFA", or "which licences are unused", the `microsoft-graph`
  plugin answers it with a structurally read-only tool surface and no
  write path to mis-fire. Use this plugin when you intend to change
  something.

## What it cannot reach

- Only the Microsoft 365 tenants mapped to the operator's gateway
  identity, and within them only what the granted Graph scopes and the
  caller's Entra roles permit.
- No filesystem, no shell, no other vendor's data.
- **One tenant at a time.** There is no fleet view here; "across all our
  customers" is a `cipp` question.
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
- **This plugin returns message content.** `GET /users/{id}/messages`
  with `$select=body` places the customer's private correspondence —
  including anything a third party sent them in confidence — into the
  model context. This is the single most sensitive capability in the
  fleet. Restrict it, and treat any transcript containing it
  accordingly.
- **Sign-in telemetry is personal data.** `GET /auditLogs/signIns`
  returns IP addresses and geolocation per named user. In several
  jurisdictions this attracts employee-monitoring obligations
  independent of the customer's consent to IT support.
- **Directory and licence reads carry PII throughout**: names, UPNs,
  email addresses, job titles, managers, group membership, device
  names, guest/external account details.
- **File and mailbox search results leak by title.** A search across
  OneDrive or SharePoint returns file names — "Redundancy plan Q3",
  "Acquisition — Project Falcon" — which disclose sensitive facts even
  when the content is never opened.
- **Credentials in flight.** `POST /users` includes a `passwordProfile`
  with a plaintext temporary password. It will appear in the model
  context and in any transcript of the session. Do not paste it into a
  ticket note or a chat channel.

## Known sharp edges

- **Licence removal is a delayed delete.** Repeated because it is the
  one that ends in data loss: 30 days after the Exchange licence comes
  off, the mailbox goes. Nothing surfaces this at call time.
- **`signInActivity` requires Entra ID P1/P2 and returns null
  otherwise** — indistinguishable from "never signed in". An inactivity
  sweep on an unlicensed tenant will class the entire directory as
  dormant and recommend reclaiming every seat. Confirm the licence tier
  before trusting an inactivity report.
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
  before any offboarding removal, and assign a replacement first.
- **Soft-delete is a 30-day window, not a safety net.** A deleted user is
  recoverable for 30 days and then is not. Do not describe deletion as
  reversible without saying when it stops being so.
