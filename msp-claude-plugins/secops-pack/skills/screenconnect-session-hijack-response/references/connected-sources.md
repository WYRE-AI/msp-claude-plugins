# Connected sources for ScreenConnect Session Hijack Response

Reviewed 2026-11-11. Inherit the discovery, tenant binding, admin-refusal,
credential inventory, and catalog-gap rules from
[MSP Tool Compromise Response connected sources](../../msp-tool-compromise-response/references/connected-sources.md)
and its [evidence/correlation workflow](../../msp-tool-compromise-response/SKILL.md).
Use only the narrower reads cited in this skill for this workflow; the shared
list is not permission to run every tool it documents. Discover exact live
names and schemas through `conduit__search_tools`; all following names are
canonical, not assumed gateway names.

## Shared evidence reads

The sibling's reviewed SKILL.md anchors these read families:

| Family | Canonical tools used here | Limits |
|--------|---------------------------|--------|
| Huntress | `huntress_incidents_list`, `huntress_signals_list`, `huntress_agents_list` | Client-bound incidents, signals, agents; not arbitrary endpoint interrogation |
| SentinelOne | `list_alerts`, `search_alerts`, `get_alert`, `search_inventory_items` | Scope to mapped client; inventory is not proof of process lineage |
| Blackpoint | `blackpoint_detections_list`, `blackpoint_assets_list` | Read detections and asset inventory only |
| RocketCyber | `rocketcyber_list_incidents`, `rocketcyber_list_events`, `rocketcyber_list_agents`, `rocketcyber_list_apps` | Mapped account/customer; returned events only |
| Identity | `cipp_list_user_signin_logs`, `cipp_list_mfa_users`, `cipp_list_audit_logs`, `microsoft_graph_suggest_queries`, `microsoft_graph_get` | CIPP sign-in/audit/MFA and Graph GET are admin-tier reads; interactive CIPP reads one user at a time. `microsoft_graph_get` is pinned to tenant-bound GETs on `auditLogs/signIns`, `auditLogs/directoryAudits`, `identityProtection/riskyUsers` (optionally `identityProtection/riskDetections`) with the restricted `$select` in SKILL.md; discard other `microsoft_graph_suggest_queries` candidates. Never mail/messages, `passwordCredentials`/`keyCredentials`, POST, PATCH, DELETE or `$batch`. Missing non-interactive sign-ins are a gap. |
| Documentation | `hudu_list_assets`, `search_flexible_assets`, `search_configurations`, `list_secrets`, `list_folders` | Names/titles/folders only, never password or secret values |
| Supporting network inventory | `auvik_devices_list`, `auvik_alerts_list`, `auvik_networks_list` | Inventory/alerts only; not a DNS-query or firewall audit API |

## RMM inventory: verified capabilities and differences

| Source | Canonical allowed reads | Verification / limit |
|--------|--------------------------|----------------------|
| N-central | `ncentral_get_device_assets` | Sibling and N-central devices skill; vendor `ncentral-mcp/src/domains/devices.ts`; Conduit read classification. Software assets only establish what the returned inventory covers. |
| Datto RMM | `datto_get_device_audit` | Sibling, Shadow AI, Datto audit skill; vendor `datto-rmm-mcp/src/mcp-server.ts`; Conduit admin-tier read. **Software audit only**: `{"deviceUid":"<mapped device UID>","auditType":"software"}` after schema discovery. No hardware, OS, network, disk, or full audit. |
| NinjaOne | `ninjaone_devices_services` | Sibling; vendor `ninjaone-mcp/src/domains/devices.ts`; Conduit read classification. Windows services, not dedicated installed-software inventory. |
| SuperOps (additional to sibling) | `superops_assets_list`, `superops_assets_get`, `superops_assets_software` | Shadow AI, SuperOps assets skill and GOVERNANCE.md; vendor `superops-mcp/src/domains/assets.ts`; all three Conduit read-tier. Scope asset list by mapped client, then only its asset IDs. |

Conduit classification verified read-only against `origin/main` in
`/workspace/conduit`, `src/proxy/result-cache.ts` (`VENDOR_TOOL_CONFIG`);
All 46 vendor tool names cited here also match exact classification keys,
including the never-call entries. The shared names reuse the sibling's
reviewed verification; the only additions are the three SuperOps reads.
Gateway discovery is anchored in the sibling and Conduit's
`src/code-mode/types.ts`. Vendor implementation paths above were read from the local read-only
`/workspace/shadow-ai-research/` checkouts. These are verification provenance,
not filesystem dependencies for the installed skill. Re-discover at runtime.

## Never-call list

The shared reviewed list supplies these forbidden credential reads:
`hudu_list_asset_passwords`, `hudu_get_asset_password`, `search_passwords`,
`get_password`, `search_secrets`, `get_secret`, `get_field`, `get_totp_code`,
and `ncentral_get_registration_token`. Never retrieve passwords, matching
secret values, fields, TOTP codes, or registration tokens.

Forbidden execution examples, from the sibling's reviewed list:
`datto_run_quickjob`, `ncentral_create_direct_task`,
`cwautomate_computers_run_command`, `cwautomate_computers_run_script`, and
`cwautomate_scripts_execute`. Never use any job/script/command-run, isolation,
reset/revoke, raw, execute, passthrough, or mutation tool, including any such
capability from NinjaOne, SuperOps, or ImmyBot. Powerful grants do not authorize
changes. Never use ScreenConnect Run Command / Toolbox / Backstage for cleanup.

## Catalog gaps

- No ScreenConnect / ConnectWise Control connector in this marketplace or
  Conduit vendor catalog at review. Manual clean-browser panel exports are
  required; do not invent a connector or treat Automate as ScreenConnect.
- NinjaOne, Atera, Automate and Syncro have no observed installed-software
  read for this workflow, as documented by Shadow AI. Automate history and
  device metadata cannot clear an endpoint. NinjaOne services remain useful.
- ImmyBot has tenant-rollup software documentation but no classified observed
  software read in the reviewed Conduit table; Kaseya VSA inventory likewise
  lacks classification. Use an inventory capability only if actually discovered
  and callable as a scoped read; otherwise record a gap. Rollups cannot name
  affected devices.
- DNSFilter query logs have no tool-name anchor in this repo; do not name a
  speculative tool. A DNS / firewall / SIEM log read is conditional on live
  discovery, verified schema and client scope. Auvik inventory is no substitute.
- Shared gaps (no direct MDE, Datto EDR, CrowdStrike or firewall-vendor pack;
  unclassified Blumira / runZero / Azure Monitor) still apply. Use other EDR/MDR
  sources from the sibling only if verified and discovered; otherwise request
  a manual export. No connector guarantees raw process, task, Run-key, or
  browser-token telemetry. The skill does not run an endpoint script to fill gaps.
