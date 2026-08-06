# Unitrends plugin — governance and safety model

Unofficial. Community-built plugin for the Unitrends Backup API. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Unitrends through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the appliance or MSP
console the operator is authorised for.

- No Unitrends username, password, or session token is stored on the
  technician's machine, in this repo, or in the model's context. The
  login exchange happens at the gateway.
- The org's Unitrends credential is stored once at the gateway, so
  replacing it is one edit rather than a change on every
  technician's machine. There is no rotate action, though — you
  re-submit the connect form, which overwrites the stored credential
  in place, and nothing tracks its age or prompts you.

- Every call carries operator identity, so the gateway audit log answers
  "who restored onto this customer's server".
- Removing someone from the organisation clears their per-vendor grants
  and revokes their gateway refresh tokens at once; a user deactivated
  in your identity provider is refused on their very next request. A
  user only removed from the org keeps an already-issued access token
  for up to an hour, but it reaches only a personal Unitrends connection
  made with their own key — never the org's. See
  `wyre-gateway/GOVERNANCE.md`.

## Tool permission tiers

> **Not classified in Conduit — every tool in the table below requires tier
> `admin` today.** Conduit derives a tool's tier from `VENDOR_TOOL_CONFIG`
> (`src/proxy/result-cache.ts`) and fails closed:
> `const requiredTier: PermissionTier = classified ?? 'admin';`
> (`src/access/access-enforcement.ts:63`). `unitrends` has no entry there, so
> the grouping below carries no enforcement meaning at present — read tools
> included. A `read` grant on this vendor admits nothing; an `admin` grant
> admits everything, including `unitrends_queue_restore`. The grouping
> becomes what Conduit actually enforces once the vendor is classified, and
> classifying it is a privilege *reduction*, not an expansion. For the live
> list of unclassified vendors see `wyre-gateway/GOVERNANCE.md`,
> *Fail-closed, and the vendors Conduit has not classified* — it is stated
> once there because it moves.
>
> *Editor's note: when `unitrends` gains a `VENDOR_TOOL_CONFIG` entry, delete
> this blockquote and nothing else. No other part of this document depends on
> it.*

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change appliance, asset, or backup state. Safe for autonomous agents. | `unitrends_list_appliances`, `unitrends_get_appliance`, `unitrends_list_assets`, `unitrends_get_asset`, `unitrends_list_running_jobs`, `unitrends_list_job_history`, `unitrends_list_recovery_points`, `unitrends_get_restore_status`, `unitrends_list_alerts`, `unitrends_get_success_rate` |
| **Write** | — | None. |
| **Destructive** | Writes data back onto a live customer asset. | `unitrends_queue_restore` |

`unitrends_queue_restore` is the only mutating tool, and it acts on the
customer's production server, not on the backup. Specific hazards an
approver needs to understand:

- **`targetAssetId` defaults to the source asset.** Omitting it restores
  over the machine the backup came from. The safe-looking minimal call
  — recovery point only — is the overwrite-in-place call.
- **`targetPath` redirects the write.** A wrong path writes customer
  data into an unintended location on a production filesystem.
- Restoring an older recovery point over a live asset discards
  everything written since that point. There is no undo tool.

The MCP server marks this tool DESTRUCTIVE and prompts for confirmation.
Do not treat that prompt as the control — an agent granted the tool can
answer it.

**Conduit does not enforce per-call approval either.** It compares tiers —
there is no approval step, no per-call confirmation, and no interactive
prompt anywhere in its enforcement path. Where this document asks for a
named human approver, that is a policy you impose on your agents, and it
is only as good as the agent configuration that carries it.

## Recommended agent policy

The safe default is **read autonomously, never self-approve the
restore.**

- Read tools: allow. Backup success-rate reporting, failed-job sweeps,
  and recovery-point retention checks are the intended autonomous use.
- Destructive tool: require a named human approver per invocation, and
  require the approver to be shown the recovery point, the resolved
  target asset (not the omitted parameter), and the target path. Do not
  grant `unitrends_queue_restore` to scheduled or unattended agents.

## What it cannot reach

- Only the appliance, or the MSP console aggregating appliances, mapped
  to the operator's gateway identity. Unitrends exposes its API
  per-appliance; a single-appliance connection sees one appliance's
  assets and nothing else.
- No Datto BCDR data. SIRIS/Alto is Kaseya's other appliance backup
  line, with different credentials and a different API.
- No SaaS backup data. Spanning and Datto SaaS Protection protect cloud
  tenants; Unitrends protects assets behind an appliance.
- No filesystem or shell on the operator's machine — a restore writes to
  the *target asset*.
- No live event stream. Every tool is point-in-time.

## Implementation status

The skill for this plugin is marked in-development reference
documentation. The eleven tools above are the current callable surface
of `unitrends-mcp`. Verify against the deployed gateway before relying
on this table for an access-control decision.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `unitrends_list_assets` and `unitrends_get_asset` return protected
  machine names, roles, and paths — a map of what matters most in each
  customer environment.
- `unitrends_list_job_history` can expose file paths and share names
  from backup job detail.

## Known sharp edges

- **The minimal restore call is the destructive one.** Omitting
  `targetAssetId` restores in place. Any approval workflow must resolve
  and display the effective target, not echo the parameters supplied.
- **Restore is asynchronous.** `unitrends_queue_restore` returns once
  the job is accepted. Poll `unitrends_get_restore_status`; acceptance
  is not completion.
- **Success rate hides recency.** `unitrends_get_success_rate` over a
  wide window can look healthy while the last three nights failed. Pair
  it with `unitrends_list_job_history` before reporting backup health.
- **Per-appliance API surface.** For multi-appliance MSPs, a query
  answered against one appliance says nothing about the others. An agent
  reporting "no failed jobs" may have checked one box out of twenty.
