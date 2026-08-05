# Kaseya VSA plugin — governance and safety model

Unofficial. Community-built plugin for the Kaseya VSA API. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Kaseya VSA through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenant the
operator is authorised for.

- No VSA password, API key, or Kaseya One JWT is stored on the
  technician's machine, in this repo, or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who ran this procedure on the customer's server" — VSA's own log
  records only the API user.
- Revoking gateway access revokes VSA access with it, immediately.

## Tool permission tiers

> **Not classified in Conduit — every tool in the table below requires
> tier `admin` today.** Conduit derives each tool's tier from
> `VENDOR_TOOL_CONFIG` (`src/proxy/result-cache.ts`) and fails closed for
> anything absent from it:
> `const requiredTier: PermissionTier = classified ?? 'admin';`
> (`src/access/access-enforcement.ts:63`). `kaseya-vsa` has no entry, so
> the grouping below carries no enforcement weight right now — read tools
> require `admin` exactly as the rest do, and there is no narrower grant
> that admits them. The grouping is still the right *risk* reading, and it
> becomes the enforcement reading on the day this vendor is classified.
> The list of unclassified vendors moves whenever one of them is
> classified, so it is stated in one place only:
> `wyre-gateway/GOVERNANCE.md`, *Fail-closed, and the vendors Conduit has
> not classified*.
>
> *This blockquote is the whole of the not-classified caveat. When
> `kaseya-vsa` appears in `VENDOR_TOOL_CONFIG`, delete this blockquote and
> change nothing else.*

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change VSA or endpoint state. Safe for autonomous agents. | `kaseya_vsa_list_agents`, `kaseya_vsa_get_agent`, `kaseya_vsa_get_software_inventory`, `kaseya_vsa_get_hardware_inventory`, `kaseya_vsa_get_patch_status`, `kaseya_vsa_list_procedures`, `kaseya_vsa_list_alarms`, `kaseya_vsa_list_tickets`, `kaseya_vsa_list_organizations`, `kaseya_vsa_list_machine_groups` |
| **Write** | — | None. This plugin has no reversible-write tier. |
| **Destructive** | Executes code or forces reboots on a customer endpoint. | `kaseya_vsa_deploy_patches_now`, `kaseya_vsa_run_procedure` |

Both destructive tools are marked DESTRUCTIVE by the MCP server itself
and prompt for confirmation before running. Do not treat that prompt as
the control — an agent granted the tool can answer it.

- `kaseya_vsa_run_procedure` executes an agent procedure on a named
  endpoint. Procedures are arbitrary code running with agent privileges;
  the tool cannot know whether the procedure installs a font or formats
  a volume.
- `kaseya_vsa_deploy_patches_now` forces pending patches to install
  immediately, bypassing the maintenance window the customer agreed to.
  Patch installs reboot production servers. "Deploy patches" sounds like
  hygiene; at 2pm on a Tuesday it is an outage.

There is no write tier because VSA exposes no reversible mutation here.
Every tool either reads, or acts on a customer machine. That gap is
worth stating plainly: with this plugin an agent is either observing or
intervening, with nothing in between.

Conduit does not enforce any of that as an approval requirement. It
compares tiers — it has no approval step, no per-call confirmation, and
no interactive prompt. Per-call approval is a workflow you impose on your
agents, and it is only as good as the agent configuration that carries
it.

## Recommended agent policy

The safe default is **read autonomously, never self-approve destructive
calls.**

- Read tools: allow. Patch-compliance reporting, agent inventory, and
  alarm summaries are the intended autonomous use.
- Destructive tools: require a named human approver per invocation, and
  require the approver to be shown the target agent and the specific
  procedure or patch set. Do not grant these to scheduled or unattended
  agents under any configuration.

## What it cannot reach

- Only the VSA tenant mapped to the operator's gateway identity. VSA is
  single-tenant per host; there is no cross-tenant API.
- Whatever the VSA user's scope and machine-group permissions forbid.
  VSA enforces scoping server-side, so a tool can be exposed here and
  still return an authorisation error.
- No filesystem or shell on the operator's machine —
  `kaseya_vsa_run_procedure` executes on the *managed endpoint*.
- No Kaseya BMS data. BMS shares Kaseya One SSO with VSA but is a
  separate product, separate API, and separate plugin.
- No live event stream. Every tool is point-in-time.

## Implementation status

The skill for this plugin is marked in-development reference
documentation. The twelve tools above are the current callable surface
of `kaseya-vsa-mcp`. Verify against the deployed gateway before relying
on this table for an access-control decision.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `kaseya_vsa_get_software_inventory` and
  `kaseya_vsa_get_hardware_inventory` return a full profile of a
  customer endpoint, including installed application versions — which is
  also a vulnerability inventory.
- `kaseya_vsa_list_agents` returns hostnames, IP addresses, and
  logged-in users across the estate.

## Known sharp edges

- **Session tokens expire mid-task.** VSA tokens default to a 15-minute
  TTL. Long agent runs will hit an auth failure partway through a sweep
  and may report it as a permissions problem.
- **Patch deployment ignores maintenance windows.** That is the entire
  purpose of `kaseya_vsa_deploy_patches_now`. There is no dry-run.
- **Procedures are opaque at the call site.**
  `kaseya_vsa_list_procedures` returns names and IDs, not the code. An
  approver reading "Cleanup Temp Files" is trusting whoever wrote the
  procedure, not reviewing it.
- **VSA calls endpoints "agents".** In this plugin an agent is a
  customer machine, never an AI subagent — a distinction worth enforcing
  in any policy text your team writes on top of this document.
