# Spanning plugin — governance and safety model

Unofficial. Community-built plugin for the Spanning Cloud Backup API.
Not affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Spanning through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenant the
operator is authorised for.

- No Spanning admin email, API token, or platform setting is stored on
  the technician's machine, in this repo, or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who restored data into this customer's tenant".
- Revoking gateway access revokes Spanning access with it, immediately.

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change backup or tenant state. Safe for autonomous agents. | `spanning_list_users`, `spanning_get_user`, `spanning_list_services`, `spanning_list_backups`, `spanning_get_restore_status`, `spanning_list_audit_log`, `spanning_get_license_usage`, `spanning_status` |
| **Write** | — | None. |
| **Destructive** | Writes data back into a live customer Microsoft 365, Google Workspace, or Salesforce tenant. Requires explicit per-call human approval. | `spanning_queue_restore` |

`spanning_queue_restore` is the only mutating tool, and what it mutates
is **production**, not the backup. A restore injects mail, files, or
Salesforce records back into the customer's live tenant, where users and
downstream automation immediately see them. On Salesforce in particular
a restore writes records that can re-trigger workflow rules, assignment
rules, and outbound integrations.

There is no undo tool. Nothing in this plugin removes what a restore put
back.

The MCP server marks this tool DESTRUCTIVE and prompts for confirmation.
Do not treat that prompt as the control — an agent granted the tool can
answer it.

## Recommended agent policy

The safe default is **read autonomously, never self-approve the
restore.**

- Read tools: allow. Backup-failure sweeps, licence reconciliation, and
  audit-log review are the intended autonomous use.
- Destructive tool: require a named human approver per invocation, and
  require the approver to be shown the target user, the service, and the
  scope of what is being restored. Do not grant `spanning_queue_restore`
  to scheduled or unattended agents.

## What it cannot reach

- Only the Spanning organisation mapped to the operator's gateway
  identity, on the platform that connection is configured for (`m365`,
  `gws`, or `salesforce`). Platform is a credential field, not a
  parameter an agent can steer — one connection sees one platform.
- The restore's success still depends on permissions in the
  *destination* tenant. The destination user needs appropriate Microsoft
  Graph, Google API, or Salesforce rights for restored data to land; a
  queued restore can fail there for reasons this plugin cannot see.
- No Datto SaaS Protection data. Kaseya sells both products against the
  same M365 and Google Workspace workloads; they hold separate backups
  under separate credentials.
- No appliance backup data. SIRIS/Alto and Unitrends are separate
  products with their own plugins.
- No filesystem, no shell, no other vendor's data.

## Implementation status

The skill for this plugin is marked in-development reference
documentation. The nine tools above are the current callable surface of
`spanning-mcp`. Verify against the deployed gateway before relying on
this table for an access-control decision.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `spanning_list_users` and `spanning_get_user` return end-user
  identities — names, email addresses, and licence state — for every
  protected user.
- `spanning_list_backups` returns backup metadata; item-level detail can
  expose message subjects and file names.
- `spanning_list_audit_log` is the evidence trail for administrative
  actions including restores. Preserve it; do not treat it as routine
  telemetry.

## Known sharp edges

- **One connection, one platform.** A Spanning connection is bound to
  M365, Google Workspace, or Salesforce. An agent that finds no backups
  for a user may be querying the wrong platform's connection entirely,
  and the result looks identical to genuinely missing coverage.
- **Restore is asynchronous.** `spanning_queue_restore` returns once the job is
  accepted. Poll `spanning_get_restore_status`; acceptance is not completion.
- **Salesforce restores fire automation.** Unlike a mailbox restore,
  re-inserting Salesforce records can trigger workflow, assignment, and
  integration rules. The blast radius extends past Salesforce into
  whatever it talks to.
- **Two Kaseya products back up the same mailboxes.** Spanning and Datto
  SaaS Protection overlap almost completely. Confirm which product
  actually protects a tenant before reporting a gap — or before
  restoring from the one that does not.
