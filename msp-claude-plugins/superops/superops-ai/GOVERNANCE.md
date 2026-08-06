# SuperOps plugin — governance and safety model

Unofficial. Community-built plugin for the SuperOps.ai API. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

The supported deployment reaches SuperOps through the WYRE Conduit
gateway (`https://conduit.wyre.ai/v1/superops/mcp`), which brokers
authentication centrally and scopes every call to the tenant the
operator is authorised for.

- No SuperOps API token or `CustomerSubDomain` value is stored on the
  technician's machine, in this repo, or in the model's context.
- The org's SuperOps credential is stored once at the gateway, so
  replacing it is one edit rather than a change on every technician's
  machine. There is no rotate action, though — you re-submit the
  connect form, which overwrites the stored credential in place, and
  nothing tracks its age or prompts you.

- Every call carries operator identity, so the gateway audit log answers
  "who ran this mutation". SuperOps records only the token's owner.
- Revoking a technician's gateway access revokes SuperOps access with
  it, immediately.

**If you run without the gateway**, the plugin README documents a direct
mode where the API token sits in the technician's Claude settings. That
mode gives up all four properties above, and it matters more here than
for most vendors because of `superops_custom_mutation` (below).

## Tool permission tiers

Grouped by blast radius, not HTTP verb.

> **Not classified in Conduit — every tool in the table below requires tier
> `admin` today.** Conduit derives a tool's tier from `VENDOR_TOOL_CONFIG`
> (`src/proxy/result-cache.ts`) and fails closed:
> `const requiredTier: PermissionTier = classified ?? 'admin';`
> (`src/access/access-enforcement.ts:63`). `superops` has no entry there, so
> the grouping below carries no enforcement meaning at present — read tools
> included. A `read` or `write` grant on this vendor admits nothing; an
> `admin` grant admits everything, including `superops_custom_mutation`. The
> grouping becomes what Conduit actually enforces once the vendor is
> classified, and classifying it is a privilege *reduction*, not an
> expansion. For the live list of unclassified vendors see
> `wyre-gateway/GOVERNANCE.md`, *Fail-closed, and the vendors Conduit has not
> classified* — it is stated once there because it moves.
>
> *Editor's note: when `superops` gains a `VENDOR_TOOL_CONFIG` entry, delete
> this blockquote and nothing else. No other part of this document depends on
> it.*

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change SuperOps or endpoint state. Safe for autonomous agents. | `superops_navigate`, `superops_status`, `superops_test_connection`, `superops_assets_list`, `superops_assets_get`, `superops_assets_patches`, `superops_assets_software`, `superops_clients_list`, `superops_clients_get`, `superops_clients_search`, `superops_technicians_list`, `superops_technicians_get`, `superops_technicians_groups`, `superops_tickets_list`, `superops_tickets_get`, `superops_custom_query` |
| **Write** | Creates or modifies PSA records. Reversible, customer-visible. | `superops_tickets_create`, `superops_tickets_update`, `superops_tickets_add_note`, `superops_tickets_log_time` |
| **Destructive** | Unbounded write access to the tenant. | `superops_custom_mutation` |

`superops_custom_mutation` is the single most dangerous tool in this
plugin and the reason its destructive tier is not empty. It executes an
arbitrary GraphQL mutation string against the tenant. Whatever the
SuperOps schema permits — deleting a client, reassigning every ticket,
changing contract terms, or triggering a script execution across an
asset group — this tool can do, and neither the tool name nor its
schema constrains it. The typed tools above are a curated safe subset;
`superops_custom_mutation` bypasses that curation entirely. Treat it as
handing an agent the tenant's admin console.

The typed script-execution surface described in the `superops-runbooks`
skill is **not** exposed as its own tool. That means script execution
against customer endpoints is only reachable through
`superops_custom_mutation` — a second, independent reason it belongs in
the destructive tier. Script execution is destructive regardless of what
the API calls it.

`superops_custom_query` stays in Read because it cannot mutate, but it
can read anything the token can see, including entities no typed tool
surfaces. It is the exfiltration path, not the damage path.

**Conduit does not enforce per-call approval.** It compares tiers — there
is no approval step, no per-call confirmation, and no interactive prompt
anywhere in its enforcement path. Nothing sits between an agent and an
arbitrary GraphQL mutation once the tier is granted. Where this document
asks for a named human approver, that is a policy you impose on your
agents, and it is only as good as the agent configuration that carries it.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Cross-client asset audits, patch-compliance
  reporting, and ticket triage are the intended autonomous use.
- Write tools: agent drafts the exact call, human approves, then it
  runs.
- Destructive tools: `superops_custom_mutation` needs a named human
  approver per invocation, and the approver must read the full mutation
  string — not a summary of it. Do not grant this tool to scheduled or
  unattended agents under any circumstances. If your operators do not
  read GraphQL, disable it at the gateway.

## What it cannot reach

- Only the SuperOps tenant (`CustomerSubDomain`) mapped to the
  operator's gateway identity. SuperOps tokens are single-tenant;
  there is no cross-MSP scope.
- No filesystem, no shell, no other vendor's data.
- No endpoint, via the typed tools. There is no remote-execution,
  patch-push, reboot, or wipe tool in the curated surface — but see
  `superops_custom_mutation`, which is not bounded by that statement.
- No live event stream. Every tool is point-in-time.

## Data handling

- SuperOps responses pass through the gateway into model context for the
  session and are not persisted by this plugin.
- `superops_technicians_*` returns MSP staff PII. `superops_clients_*`
  returns client contacts and email domains.
  `superops_assets_*` returns hostnames, IP and MAC addresses, serial
  numbers, installed software, and per-asset missing-patch lists — a
  ready-made target list. Restrict these if agents run unattended.
- `superops_custom_query` can return any object in the schema,
  including ones with no typed tool and therefore no review above. Its
  output should be treated as unclassified until a human looks at it.

## Known sharp edges

- **Null resets values.** SuperOps mutations treat an explicit `null`
  as "clear this field" rather than "leave it alone". An agent that
  serialises an unset optional as `null` will silently wipe data on
  update.
- **The subdomain header is load-bearing.** Omitting
  `CustomerSubDomain` returns an authentication failure even with a
  valid token, which reads like a credential problem and is not.
- **Region-specific endpoints.** Tokens are scoped to a region; a
  correct token against the wrong regional endpoint fails in a way that
  looks like a permissions error.
- **800 requests/minute, shared per tenant.** A full-fleet asset sweep
  by an unattended agent throttles the technicians working alongside it.
