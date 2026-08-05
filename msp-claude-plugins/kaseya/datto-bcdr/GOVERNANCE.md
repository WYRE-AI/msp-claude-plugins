# Datto BCDR plugin — governance and safety model

Unofficial. Community-built plugin for the Datto BCDR (SIRIS / Alto)
Backup Portal API. Not affiliated with, endorsed by, or sponsored by the
vendor.

## What it connects as

This plugin does not hold credentials. It reaches the Datto Backup
Portal through the WYRE Conduit gateway
(`https://conduit.wyre.ai/v1/mcp`), which brokers authentication
centrally and scopes every call to the tenant the operator is authorised
for.

- No Datto BCDR public/private key pair is stored on the technician's
  machine, in this repo, or in the model's context. The HMAC-SHA256
  request signing happens at the gateway.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who pulled this customer's backup posture".
- Revoking gateway access revokes Datto BCDR access with it,
  immediately.

## Tool permission tiers

> **Not classified in Conduit — every tool in the table below requires
> tier `admin` today.** Conduit derives each tool's tier from
> `VENDOR_TOOL_CONFIG` (`src/proxy/result-cache.ts`) and fails closed for
> anything absent from it:
> `const requiredTier: PermissionTier = classified ?? 'admin';`
> (`src/access/access-enforcement.ts:63`). `datto-bcdr` has no entry, so
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
> `datto-bcdr` appears in `VENDOR_TOOL_CONFIG`, delete this blockquote and
> change nothing else.*

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change appliance, agent, or backup state. | `datto_bcdr_list_devices`, `datto_bcdr_get_device`, `datto_bcdr_list_assets`, `datto_bcdr_get_asset`, `datto_bcdr_list_backups`, `datto_bcdr_list_screenshots`, `datto_bcdr_get_screenshot`, `datto_bcdr_get_offsite_status`, `datto_bcdr_list_alerts`, `datto_bcdr_list_activity` |
| **Write** | — | None. |
| **Destructive** | — | None. |

**This plugin is read-only.** It reports backup posture; it does not run
backups, delete recovery points, virtualise, or restore. An agent
granted the full surface cannot alter a customer's protected data or its
retention.

This matters more than usual for a backup product. The blast radius of a
mistaken write against a BCDR appliance is a destroyed recovery point —
so the absence of any write tool here is a deliberate safety property,
not an oversight to be filled in later.

## Recommended agent policy

- Read tools: allow. Daily backup-failure sweeps, screenshot-verification
  reporting, and offsite-replication monitoring are the intended
  autonomous use, and are the strongest case in this family for letting
  an agent run unattended.
- Write and destructive policies are not applicable — there are no such
  tools.

## What it cannot reach

- Only the Datto partner account mapped to the operator's gateway
  identity.
- No recovery or virtualisation. Restores, boot verification, and
  file-level recovery happen in the Datto portal, not here.
- No Datto RMM data. BCDR is a separate API with separate keys and a
  different signing scheme.
- No Datto SaaS Protection data. Cloud-to-cloud M365 and Google
  Workspace backup is a different product with its own plugin.
- No filesystem, no shell, no other vendor's data.

## Implementation status

The skill for this plugin is marked in-development reference
documentation. The ten tools above are the current callable surface of
`datto-bcdr-mcp`. Verify against the deployed gateway before relying on
this table for an access-control decision.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `datto_bcdr_get_screenshot` returns boot-verification screenshots of
  customer servers. These are images of a live desktop or console and
  can contain hostnames, usernames, domain names, and whatever happened
  to be on screen. Treat screenshot output as customer data, not as
  telemetry.
- `datto_bcdr_list_assets` and `datto_bcdr_get_asset` return protected
  machine names and roles — a map of what matters most in each customer
  environment.

## Known sharp edges

- **A successful backup is not a verified backup.** Backup status and
  screenshot verification are separate signals. An agent reporting
  "backups green" from `datto_bcdr_list_backups` alone has not checked
  whether anything would actually boot.
- **Offsite replication lags local backup.** `datto_bcdr_get_offsite_status` and
  the local backup list disagree by design. A recovery point can exist
  locally and not yet offsite; reporting either alone overstates
  protection.
- **Alerts here are appliance alerts.** They are not Datto RMM alerts and
  not RocketCyber incidents. Do not let an agent merge the three streams
  into one count.
