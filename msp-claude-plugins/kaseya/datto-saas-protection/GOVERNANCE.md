# Datto SaaS Protection plugin — governance and safety model

Unofficial. Community-built plugin for the Datto SaaS Protection
(formerly Backupify) API. Not affiliated with, endorsed by, or sponsored
by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Datto SaaS Protection
through the WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`),
which brokers authentication centrally and scopes every call to the
tenant the operator is authorised for.

- No Datto SaaS Protection bearer token or region setting is stored on
  the technician's machine, in this repo, or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who restored data into this customer's mailbox".
- Revoking gateway access revokes SaaS Protection access with it,
  immediately.

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change backup or tenant state. Safe for autonomous agents. | `datto_saas_list_clients`, `datto_saas_list_domains`, `datto_saas_list_seats`, `datto_saas_get_seat`, `datto_saas_list_backups`, `datto_saas_get_restore_status`, `datto_saas_list_activity`, `datto_saas_get_license_usage` |
| **Write** | — | None. |
| **Destructive** | Writes data back into a live customer Microsoft 365 or Google Workspace tenant. Requires explicit per-call human approval. | `datto_saas_queue_restore` |

`datto_saas_queue_restore` is the only mutating tool, and it does not
mutate the backup — it mutates **production**. A restore injects
messages, files, or an entire seat back into the customer's live cloud
tenant. Consequences an approver needs to understand:

- Restored mail lands in the user's actual mailbox. Users see it,
  respond to it, and cannot tell it from new mail.
- Passing an empty `items` array restores the **entire seat**. The
  difference between a two-file recovery and a full mailbox flood is one
  empty array.
- There is no undo tool. Nothing in this plugin removes what a restore
  put back.

The MCP server marks this tool DESTRUCTIVE and prompts for confirmation.
Do not treat that prompt as the control — an agent granted the tool can
answer it.

## Recommended agent policy

The safe default is **read autonomously, never self-approve the
restore.**

- Read tools: allow. Backup-failure sweeps, seat coverage checks, and
  licence reconciliation are the intended autonomous use.
- Destructive tool: require a named human approver per invocation, and
  require the approver to be shown the seat, the item count, and
  explicitly whether the item list is empty. Do not grant
  `datto_saas_queue_restore` to scheduled or unattended agents.

## What it cannot reach

- Only the Datto SaaS Protection account mapped to the operator's
  gateway identity, in that account's region (US or EU). Region is a
  credential field, not a parameter an agent can steer.
- The restore's success still depends on permissions in the *destination*
  tenant. SaaS Protection needs valid Microsoft Graph or Google API
  grants to land data; a queued restore can fail there for reasons this
  plugin cannot see.
- No Spanning data. Kaseya sells both products against the same
  workloads; they hold separate backups under separate credentials.
- No Datto BCDR data. Appliance backup is a different product.
- No filesystem, no shell, no other vendor's data.

## Implementation status

The skill for this plugin is marked in-development reference
documentation. The nine tools above are the current callable surface of
`datto-saas-protection-mcp`. Verify against the deployed gateway before
relying on this table for an access-control decision.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `datto_saas_list_seats` and `datto_saas_get_seat` return end-user
  identities — names, email addresses, and licence state — for every
  protected user at every customer.
- `datto_saas_list_backups` returns backup metadata. Item-level listings
  can expose message subjects and file names, which is content-adjacent
  even though the tool does not return message bodies.
- `datto_saas_list_activity` is the audit surface; treat it as the
  evidence trail for restores rather than as routine telemetry.

## Known sharp edges

- **Empty item list means "everything".** This is the single most
  dangerous default in the plugin. An agent that builds an empty array
  because a filter matched nothing will restore the whole seat.
- **Restore is asynchronous.** `datto_saas_queue_restore` returns once
  the job is accepted. Success there is not success in the tenant; poll
  `datto_saas_get_restore_status`.
- **Archived seats are hidden by default.** `datto_saas_list_seats`
  omits them unless asked. An agent concluding a user "was never backed
  up" may be looking at a filtered list.
- **Two Kaseya products back up the same mailboxes.** SaaS Protection
  and Spanning overlap almost completely. Confirm which product actually
  protects a given tenant before reporting a coverage gap — or before
  restoring from the one that does not.
