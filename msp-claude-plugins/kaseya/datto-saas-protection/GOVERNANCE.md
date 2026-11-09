# Datto SaaS Protection plugin — governance and safety model

Unofficial. Community-built plugin for the Datto SaaS Protection
(formerly Backupify) API. Not affiliated with, endorsed by, or sponsored
by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Datto SaaS Protection
through the WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`),
which brokers authentication centrally and scopes every call to the
tenant the operator is authorised for.

- No Datto SaaS Protection API key pair is stored on
  the technician's machine, in this repo, or in the model's context.
- The org's Datto SaaS Protection credential is stored once at the
  gateway, so replacing it is one edit rather than a change on every
  technician's machine. There is no rotate action, though — you
  re-submit the connect form, which overwrites the stored credential
  in place, and nothing tracks its age or prompts you.

- Every call carries operator identity, so the gateway audit log answers
  "who unlicensed these seats".
- Complete offboarding in the gateway console, and confirm the person no longer has access before you treat it as done.

Confirm the live permission grant in the gateway access editor before you rely on a tier in this document. This note does not describe gateway enforcement internals.

## Tool permission groups

Tiers below are Conduit's classification (`VENDOR_TOOL_CONFIG['datto-saas-protection']`
in Conduit's `src/proxy/result-cache.ts`) for the six tools the pinned
`datto-saas-protection-mcp` v3 image serves. All six are classified, so
none is coerced to `admin`.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change backup or tenant state. Safe for autonomous agents. | `read` | `datto_saas_list_domains`, `datto_saas_list_seats`, `datto_saas_get_seat`, `datto_saas_list_applications`, `datto_saas_get_backup_stats` |
| **Write** | Changes which seats are protected and billed. | `write` | `datto_saas_bulk_seat_change` |
| **Delete** | — | — | **None.** |
| **Admin** | — | — | **None.** |

There is **no restore tool and no activity-log tool**. Earlier versions
of this document described `datto_saas_queue_restore`,
`datto_saas_get_restore_status`, `datto_saas_list_backups`,
`datto_saas_list_activity`, `datto_saas_list_clients` and
`datto_saas_get_license_usage`; none of them is served by the sidecar or
classified in Conduit. Restores are started in the SaaS Protection portal.

Per-call approval for anything below is a policy you impose on your agents, and it is only as good as the agent configuration that carries it.

### `datto_saas_bulk_seat_change` changes protection and billing

The one write tool licenses, pauses or unlicenses up to 100 seats of one
type for a customer subscription:

- **License** starts protection and billing for the seat.
- **Pause** keeps existing backups but stops new ones.
- **Unlicense** stops protection. Nothing is backed up for that seat from
  then on.

The server asks the user to confirm the exact change. On clients that
cannot show a confirmation prompt it refuses unless the caller passes
`confirm: true`, which an agent can set on its own. The prompt is
therefore not a control you can rely on through every client; the tier
grant is.

## Recommended agent policy

- Read tools: grant `read` for coverage sweeps and backup-health checks.
  Everything the plugin's skills do except remediation is reachable at
  `read`.
- `datto_saas_bulk_seat_change`: grant `write` only to agents that
  propose seat changes for a human to approve. Do not grant it to
  scheduled or unattended agents: an `Unlicense` or `Pause` silently ends
  backups for those users.

## What it cannot reach

- Only the Datto SaaS Protection seats visible to the API key pair stored
  on the operator's Conduit connection.
- No restore, export or download of backed-up data.
- No Spanning data. Kaseya sells both products against the same
  workloads; they hold separate backups under separate credentials.
- No Datto BCDR data. Appliance backup is a different product.
- No filesystem, no shell, no other vendor's data.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `datto_saas_list_seats` and `datto_saas_get_seat` return end-user
  identities (names, email addresses, site URLs) and licence state for
  every protected user at every customer.
- `datto_saas_list_applications` and `datto_saas_get_backup_stats` return
  backup metadata and storage figures, not message or file content.

## Known sharp edges

- **`confirm: true` bypasses the prompt.** On a client without
  confirmation prompts, an agent that sets the flag itself gets the
  change applied. Treat the `write` grant as the real gate.
- **One seat type per bulk call.** A mixed list has to be split, and a
  partially applied remediation is easy to misreport.
- **Unprotected includes leavers.** Licensing every `Unprotected` seat can
  start billing for disabled accounts.
- **Two Kaseya products back up the same mailboxes.** SaaS Protection
  and Spanning overlap almost completely. Confirm which product actually
  protects a given tenant before reporting a coverage gap.
