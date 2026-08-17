# Nutanix plugin — governance and safety model

Unofficial. Community-built plugin documentation for the Nutanix v4
API MCP server. Not affiliated with, endorsed by, or sponsored by
Nutanix beyond consuming their published open-source server.

## What it connects as

This plugin does not hold credentials. It reaches Nutanix through the
WYRE Conduit gateway, which fronts Nutanix's official
[ntnx-api-mcp-server](https://github.com/nutanix/ntnx-api-mcp-server)
(pinned at v0.8) and brokers authentication centrally.

- Prism Central credentials (host, username/password or API key) are
  entered once in the Conduit connection UI. Nothing is stored on the
  technician's machine, in this repo, or in the model's context.
- Credential rotation happens at Conduit: rotate the account or API
  key in Prism Central, then re-submit the connection form. Nothing
  tracks credential age for you.
- The credential's Nutanix RBAC role is the data boundary. Conduit
  controls who in your organisation may use the connection and which
  tools they may call; Prism Central's RBAC decides what data comes
  back. A Viewer credential cannot be widened from the client side.

## The enforcement model: read-only at the server

The deployed server runs with `READ_ONLY_MODE=true` (the upstream
default): **every non-GET operation is blocked inside the MCP server
before any Nutanix API call is made.** That is the load-bearing safety
property of this integration, and it is server-side — no client, agent,
or prompt can opt out of it.

Consequences worth reading twice:

- Discovery tools (`listOperations`, `getOperationSchema`,
  `getCodeSample`, `getOperationPermissions`) still index and describe
  write operations — describing is not executing. An agent quoting a
  delete operation's schema has not deleted anything.
- A blocked write returns a structured read-only error. Do not
  misreport it as an RBAC failure, and do not "fix" it by escalating
  the credential.
- Defense in depth still applies: pair read-only mode with a
  least-privilege Prism Central account, because read access to IAM,
  audit, and configuration data is itself sensitive.

## Tool granularity is coarse — plan grants accordingly

The tool surface is 4 discovery tools plus one `<namespace>_execute`
executor per v4 namespace (up to 20). A grant on an executor tool is a
grant on **every operation in that namespace** the server will execute
— there is no per-operation tool boundary. Under the current read-only
deployment every executable operation is a GET, so the practical blast
radius is data exposure, not mutation. The namespaces to think about
before granting broadly:

- `iam_execute` — users, roles, service accounts, access policies
- `monitoring_execute` — audit logs (who did what on Prism Central)
- `security_execute` — encryption and certificate configuration
- `licensing_execute` — commercial entitlement data

If a future deployment relaxes read-only mode, this coarseness becomes
the first thing to re-review: one executor grant would then span reads
and writes across its whole namespace.

## What it cannot reach

- Only the Prism Central instance the connection points at, and only
  the data its credential's RBAC role permits.
- No writes of any kind while read-only mode is enforced.
- No filesystem, no shell, no other vendor's data.
- No live event stream — every tool is a point-in-time query.

## Data handling

- Responses pass through Conduit into model context for the session
  and are not persisted by this plugin.
- `iam_execute` returns account and identity data; `monitoring_execute`
  audit queries return named operator actions. Treat outputs of both as
  sensitive in unattended or shared-context agents.

## Known sharp edges

- **Namespace availability is elastic.** Executors register only for
  namespaces the connected Prism Central exposes. An absent tool is an
  availability fact, not an outage — agents should verify with
  `listOperations` and report, not retry.
- **Blocked ≠ forbidden.** The read-only error and a 403 look similar
  in casual reading. The first means "non-GET, by design"; the second
  means the credential lacks a role. Different fixes, different owners.
- **Discovery output can name destructive operations.** Upstream
  namespaces include failover, delete, and upgrade operations. Quoting
  them in a change plan is the intended workflow; presenting them as
  executable through this connection is a documentation bug — report it
  here if you see it.
