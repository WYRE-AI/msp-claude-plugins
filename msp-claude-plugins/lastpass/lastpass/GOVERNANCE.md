# LastPass plugin — governance and safety model

Unofficial. Community-built plugin for the LastPass API. Not affiliated
with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches LastPass through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which
stores the organisation's LastPass API key once and scopes every call to
the LastPass account the operator is authorised for.

- No LastPass API key is stored on the technician's machine, in this
  repo, or in the model's context.
- Replacing the key is one edit: re-submit the connect form, which
  overwrites the stored key. Nothing tracks the key's age or prompts
  you to rotate it.
- Every call carries operator identity, so the gateway audit log answers
  "who pulled this client's user list". LastPass's own log records only
  the API key.

Confirm the live permission grant in the gateway access editor before
you rely on a tier in this document. This note does not describe gateway
enforcement internals.

## Tool permission groups

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change LastPass state. | `read` | All 23 `lastpass_*` tools |
| **Write** | *Empty.* | — | None. |
| **Delete** | *Empty.* | — | None. |
| **Admin** | *Empty.* No tool is admin-gated. | — | None. |

**The connector is read-only; the key is not.** LastPass API keys have
no read-only scope. Conduit and the connector only send GET requests,
but the same key used elsewhere could create or delete users and grant
admin rights, and an MSP key reaches every managed company. Create a key
used only by Conduit, and revoke it in the Admin Console (Advanced >
LastPass API) if it is ever exposed.

## Recommended agent policy

Reads are safe to run unattended at tier `read`. There are no writes to
withhold. Everything this plugin recommends (disable a user, remove an
admin level, revoke an invite, suspend a company) is carried out by a
person in the LastPass Admin Console.

## What it cannot reach

- Vault items, passwords, and shared folders.
- Company policies and event or security reports (LastPass exposes
  these only through its legacy Enterprise API, which this connector
  does not use).
- Users in Awaiting approval status, and some Staged and Pending
  invitation users, which LastPass omits from its lists.
- No filesystem, no shell, no other vendor's data. No live feed; every
  call is point-in-time.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- User records carry names, email addresses, MFA status, last login,
  and Security Challenge and master-password scores. Treat them as
  sensitive security data, keep each client's results to that client,
  and do not post named weak-score lists to shared channels.

## Known sharp edges

- **Default page size is 10.** A "not found" or a percentage from one
  page is wrong. Page with `page_token` until `nextPageToken` is gone.
- **Business vs MSP key.** Managed-company and report tools return 403
  with a Business key.
- **Early access.** Accounts not enrolled in the LastPass API program
  get 401 or 403.
- **EU-hosted accounts** may not be served by the API host the connector
  calls; a 401 there may be the region, not the key.
