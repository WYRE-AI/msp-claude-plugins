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
- The org's Datto SaaS Protection credential is stored once at the
  gateway, so replacing it is one edit rather than a change on every
  technician's machine. There is no rotate action, though — you
  re-submit the connect form, which overwrites the stored credential
  in place, and nothing tracks its age or prompts you.

- Every call carries operator identity, so the gateway audit log answers
  "who restored data into this customer's mailbox".
- Complete offboarding in the gateway console, and confirm the person no longer has access before you treat it as done.

Confirm the live permission grant in the gateway access editor before you rely on a tier in this document. This note does not describe gateway enforcement internals.

## Tool permission groups

The other six — including the restore — are not in the table.

Gateway configuration source is omitted from this repository.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change backup or tenant state. Safe for autonomous agents. | `read` | `datto_saas_list_clients`, `datto_saas_list_domains`, `datto_saas_get_license_usage` |
| **Write** | — | — |confirm the live grant|
| **Delete** | — | — | **None.** |
| **Admin** | Everything Conduit has not classified — read tools and the restore alike. |confirm the live grant| `datto_saas_list_seats`, `datto_saas_get_seat`, `datto_saas_list_backups`, `datto_saas_get_restore_status`, `datto_saas_list_activity`, `datto_saas_queue_restore` |

Per-call approval for anything below is a policy you impose on your agents, and it is only as good as the agent configuration that carries it.

### What the classification gap means in practice

1. **A read-only agent cannot do the plugin's main job.** Seat listing,
   backup listing, and restore-status polling are all in the coerced
   `admin` bucket. Backup-failure sweeps and seat coverage checks — the
   intended autonomous uses — need `admin` on this vendor today.
2. **`admin` is the only grant that reaches the restore.** Because the same grant is the only one that reaches the seat and backup readers, **you cannot currently grant the read work without also granting `datto_saas_queue_restore`.** There is no tier between them.
3. **This is drift, not design.** The three classified tools are
   presumably the ones that existed when the entry was written. Report
   the gap rather than working around it; classifying the remaining six
   is a privilege *reduction*, because it would move the read tools down
   from `admin` to `read`.

Verify the table above against the deployed gateway before relying on it
for an access-control decision.

### `datto_saas_queue_restore` mutates production, not the backup

A restore injects messages, files, or an entire seat back into the
customer's live cloud tenant. Consequences an approver needs to
understand:

- Restored mail lands in the user's actual mailbox. Users see it,
  respond to it, and cannot tell it from new mail.
- Passing an empty `items` array restores the **entire seat**. The
  difference between a two-file recovery and a full mailbox flood is one
  empty array.
- There is no undo tool. Nothing in this plugin removes what a restore
  put back.

The server's own fallback then applies: the helper returns `null` and the tool refuses with *"Restore cancelled: client does not support confirmation prompts."*

Two things follow, and they point in opposite directions. The prompt is
not a control you can rely on — but neither is the restore reliably
callable through Conduit. Test it before you build a recovery runbook on
it.

## Recommended agent policy

The safe default is **read autonomously, never self-approve the
restore** — which today requires a per-tool grant, because the tier
model cannot express it.

- Read tools: allow the three classified ones. The other five reads sit
  behind `admin`; grant them per-tool rather than granting `admin` on
  the vendor.
- Restore: require a named human approver per invocation, and require
  the approver to be shown the seat, the item count, and explicitly
  whether the item list is empty. Conduit will not ask any of this — it
  compares tiers and passes the call through. Do not grant
  `datto_saas_queue_restore` to scheduled or unattended agents.
- Do not hand an agent blanket `admin` on this vendor as a shortcut to
  the seat and backup readers. That grant includes the restore.

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

The skill for this plugin is marked in-development reference documentation. The nine tools above are the current callable surface of `datto-saas-protection-mcp`. Verify against the deployed gateway before relying on this table for an access-control decision.

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
