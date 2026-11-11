# Connected sources for MSP Tool Compromise Response

Canonical catalog names only. Discover live names and schemas with
`conduit__search_tools` before calling anything. Use read-only tools.
Never invent a name that is not on this list or in a sibling skill
already cited from `SKILL.md`.

## Implicated management-plane reads

### N-central

Allowed: `ncentral_server_info`, `ncentral_validate_token`,
`ncentral_health`, `ncentral_status`,
`ncentral_list_service_orgs`, `ncentral_list_customers`,
`ncentral_get_customer`, `ncentral_list_sites`, `ncentral_get_site`,
`ncentral_list_org_units`, `ncentral_get_org_unit`,
`ncentral_list_org_unit_children`, `ncentral_list_devices`,
`ncentral_list_devices_by_org_unit`, `ncentral_list_device_filters`,
`ncentral_get_device`, `ncentral_get_device_assets`,
`ncentral_get_device_service_status`, `ncentral_list_active_issues`,
`ncentral_list_job_statuses`, `ncentral_list_device_tasks`,
`ncentral_get_task`, `ncentral_get_task_status`,
`ncentral_get_task_status_details`, `ncentral_list_maintenance_windows`,
`ncentral_list_access_groups`, `ncentral_get_access_group`,
`ncentral_list_org_custom_properties`, `ncentral_get_org_custom_property`,
`ncentral_list_device_custom_properties`,
`ncentral_get_device_custom_property`.

Never call `ncentral_create_direct_task`,
`ncentral_update_device_lifecycle`, custom-property updates,
`ncentral_add_maintenance_windows`, `ncentral_delete_maintenance_windows`,
`ncentral_create_device_access_group`,
`ncentral_create_org_unit_access_group`, or
`ncentral_get_registration_token`.

There is no verified tool for a complete script-library comparison,
remote-control session history, or a dedicated agent/probe upgrade
report.

### ConnectWise Automate

Allowed: `cwautomate_clients_list` / `_get`,
`cwautomate_computers_list` / `_get` / `_search`,
`cwautomate_alerts_list` / `_get`, `cwautomate_scripts_list`,
`cwautomate_scripts_get`, `cwautomate_scripts_history`,
`cwautomate_scripts_running`, `cwautomate_commands_list`,
`cwautomate_computers_command_status`.

Never call `cwautomate_computers_run_command`,
`cwautomate_computers_run_script`, `cwautomate_scripts_execute`, or
`cwautomate_computers_reboot`.

### Datto RMM

Allowed: `datto_list_sites`, `datto_list_devices`, `datto_get_device`,
`datto_find_device`, `datto_get_device_audit` (`auditType=software`
only), `datto_get_job`, `datto_get_job_components`,
`datto_get_job_results`, `datto_get_job_stdout`, `datto_get_job_stderr`.

Never call `datto_run_quickjob`. Do not request hardware, os, network,
or disk audits in this workflow.

### Kaseya VSA

Conduit's tier table classifies only `kaseya_vsa_run_procedure` and
`kaseya_vsa_deploy_patches_now` (both admin writes). Its list/get tools
have no tier entry, so the gateway may deny them. Use a read tool only
if `conduit__search_tools` returns one; otherwise record Kaseya VSA as
a gap.

Never call `kaseya_vsa_run_procedure` or `kaseya_vsa_deploy_patches_now`.

### NinjaOne

Allowed: `ninjaone_status`, `ninjaone_organizations_list` / `_get` /
`_devices` / `_locations`, `ninjaone_devices_list` / `_get`,
`ninjaone_devices_alerts`, `ninjaone_devices_activities`,
`ninjaone_devices_services`, `ninjaone_alerts_list` / `_get` /
`_summary`.

NinjaOne has no dedicated installed-software MCP tool in this catalog.
Never call `ninjaone_devices_reboot`, `ninjaone_alerts_reset`, or
`ninjaone_alerts_reset_all`.

## Identity, vault, and other supporting reads

Identity and EDR tools are listed in `SKILL.md`. Credential
inventory uses documentation and titles only:

- Hudu: `hudu_list_assets` and `hudu_list_asset_layouts`. Never any
  `hudu_*_asset_password` tool (admin credential reads).
- IT Glue: `search_flexible_assets`, `search_configurations`. Never
  `search_passwords` or `get_password` (admin credential reads).
- Keeper: `list_secrets`, `list_folders`. Never `search_secrets` (admin;
  it matches on stored values), `get_secret`, `get_field`, or
  `get_totp_code`.

## Known catalog gaps

These absences are current as of marketplace `1.36.0` on `origin/main`.
If discovery later returns a real connector, use its read tools and
still do not invent names.

- No CrowdStrike marketplace plugin.
- No Microsoft Defender for Endpoint plugin. `rocketcyber_get_defender`
  reports Defender status through RocketCyber, not MDE itself.
- No Datto EDR plugin. Datto RMM audit is inventory, not EDR telemetry.
- No ScreenConnect / ConnectWise Control plugin.
- Bitdefender GravityZone and ESET PROTECT are live Conduit connectors
  but have no marketplace pack on `origin/main`. If
  `conduit__search_tools` finds them, use only their list/get read tools.
- No Fortinet, Palo Alto, or SonicWall firewall plugin. Auvik and
  Domotz can identify devices, not read those vendors' rulesets.
- Meraki is not used. Cisco's hosted server offers `semantic_search`
  and `execute_api`; Conduit tiers `execute_api` as admin because the
  caller names the capability (an unbounded passthrough), which this
  read-only workflow does not call. Check Meraki firewall and VPN
  history in the Meraki dashboard.
- runZero and Azure `monitor` / `resourcehealth` have no entry in
  Conduit's tier table, so the gateway denies them. Treat runZero
  discovery and Azure activity as gaps.
- Kaseya VSA read tools, ImmyBot computer inventory, and Blumira are
  likewise unclassified (see above); use them only if discovery returns
  them.
