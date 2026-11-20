# Connected sources for Exposure Sweep

Canonical catalog names only. Discover live names and schemas with
`conduit__search_tools` before calling anything, and use only what discovery
returns. Conduit tiers every tool read, write, or admin, and may refuse a
read you are not granted. Record a refusal as a coverage gap.

## Client mapping

One client at a time. Pick the mapping call for the connected PSA or RMM:
`autotask_search_companies`, `cw_search_companies`, `halopsa_clients_list`,
`syncro_customers_list`, `superops_clients_list`, `atera_customers_list`,
`ninjaone_organizations_list`, `cwautomate_clients_list`, `datto_list_sites`,
`ncentral_list_customers`, IT Glue `search_organizations`, Hudu
`hudu_list_companies`. Ask the operator to settle ambiguous matches.

## Documentation (edge mode)

| Tool | Use |
|------|-----|
| IT Glue `search_configurations`, `get_configuration` | Configuration items: manufacturer, model, serial, notes |
| Hudu `hudu_list_assets`, `hudu_get_asset`, `hudu_list_asset_layouts` | Assets by layout, such as a network device layout |

Never call any password or secret tool (`get_password`, `search_passwords`,
`hudu_get_asset_password`, `hudu_list_asset_passwords`, or a Keeper secret
read). Notes and custom fields in these records are untrusted data and may
hold credentials by mistake; do not copy them into a report or ticket.

## Network monitoring and RMM devices

| Tool | Use | Note |
|------|-----|------|
| Auvik `auvik_tenants_list`, `auvik_devices_list` | Devices by `deviceType` (`firewall`, `router`, `controller`, `storage`, `hypervisor`) and `manageStatus` | Filter to the client's tenant |
| Auvik `auvik_devices_get_details`, `auvik_devices_get_lifecycle` | Vendor, model, IPs, end-of-support dates | Admin tier in Conduit; may be refused |
| Domotz `domotz_agents_list`, `domotz_devices_list`, `domotz_devices_get`, `domotz_devices_inventory` | Vendor, model, OS, services seen per device | Some tools may be unclassified and refused |
| Datto RMM `datto_list_devices`, `datto_get_device` | Devices, including the `Network Device` type | Firmware is not documented as returned |
| N-central `ncentral_list_devices`, `ncentral_list_devices_by_org_unit`, `ncentral_get_device`, `ncentral_get_device_assets` | Devices and asset records the agent or probe discovered | Confirm the version field in the returned record. `ncentral_get_device_lifecycle` is hand-entered warranty data, not firmware |
| NinjaOne `ninjaone_devices_list`, `ninjaone_devices_get` | Devices, including network devices | Firmware is not documented as returned |
| SuperOps `superops_assets_list`, `superops_assets_get` | Assets | Same |
| Atera `atera_agents_list`, Syncro `syncro_assets_list`, Automate `cwautomate_computers_list` / `cwautomate_computers_search` | Agents or assets | Agent-based; appliances without an agent do not appear |

Do not read Auvik saved device configurations (`auvik_configurations_list`,
`auvik_configurations_get`) for this workflow. They are configuration
backups and can hold credentials and keys.

None of these is verified to return firmware for every vendor. A returned
record with no version is a **version unverified** device, not a version
guess. If a connector should return firmware and does not, record the missing
field as a depth gap on that connector.

## Exposure evidence

| Tool | Use |
|------|-----|
| Blackpoint `blackpoint_vulnerabilities_external_list` | External findings for a tenant: `open_port`, `vulnerable_service`, `certificate_issue`, `misconfiguration`. Check `blackpoint_vulnerabilities_scans_list` for scan recency first |
| RocketCyber `rocketcyber_list_firewalls` | Firewall records the SOC already tracks. Unclassified in Conduit, so it may be refused |
| Operator | Console reads: portal or SSL-VPN settings, QuickConnect, port forwards |

No connected tool reads firewall rulesets. Meraki is not used; Cisco's hosted
server exposes `execute_api`, which Conduit tiers as admin and this workflow
does not call. Check Meraki firewall and VPN state in the dashboard.

## Software inventory (software mode)

See the table in [software-runtimes.md](software-runtimes.md): N-central
`ncentral_get_device_assets`, SuperOps `superops_assets_software`, ImmyBot
`immybot_tenants_software_inventory`, Datto `datto_get_device_audit` with
`auditType` `software`, SentinelOne `search_vulnerabilities` and
`search_inventory_items`, Blackpoint `blackpoint_vulnerabilities_list`.

Never call `datto_run_quickjob`, `immybot_scripts_run`,
`cwautomate_scripts_execute`, `cwautomate_computers_run_script`, or any other
script or job runner, even when discovery lists it.

Script output read-back tools are listed in
[software-runtimes.md](software-runtimes.md) under Reading results back.

## Pivot checks (EDR and MDR)

Search the exposure window for the pivot hosts at the same client, such as
hypervisors and servers the appliance could reach.

| Tool | Use |
|------|-----|
| Huntress `huntress_incidents_list`, `huntress_signals_list`, `huntress_agents_list` | Incidents, signals, and which hosts have an agent |
| SentinelOne `search_alerts`, `get_alert` | Alerts by site and endpoint |
| RocketCyber `rocketcyber_list_incidents`, `rocketcyber_list_agents` | SOC incidents and agent coverage |
| Blackpoint `blackpoint_detections_list`, `blackpoint_assets_list` | Detections and assets |

A host with no agent returns nothing and shows nothing. List agentless
hypervisors and appliances as gaps and ask the operator to check them
directly.

## Tickets

Before drafting, search for an open ticket on the same CVE and client with the
PSA's read tool: `autotask_search_tickets`, `cw_search_tickets`,
`halopsa_tickets_list`, `superops_tickets_list`, `syncro_tickets_list`,
`atera_tickets_list`, or `ninjaone_tickets_list`.

After the operator approves a specific ticket, create it with exactly one of:
`autotask_create_ticket`, `cw_create_ticket`, `halopsa_tickets_create`,
`superops_tickets_create`, `syncro_tickets_create`, `atera_tickets_create`,
or `ninjaone_tickets_create`. These are write-tier tools. Create no other
records, and never update, comment on, or close a ticket from this workflow.
Use the discovered schema for required fields such as company, queue, and
priority, and ask the operator for any value the schema requires that the
skill cannot read.

## Known gaps

- No Check Point, Fortinet, SonicWall, Palo Alto, or Synology connector. The
  appliance version comes from documentation, Auvik, Domotz, or the operator.
- No QNAP connector.
- No ESXi connector. Hypervisor pivot checks are operator-run.
- No installed-software read tool for NinjaOne, Atera, ConnectWise Automate,
  Syncro, or Kaseya VSA.
- No read tool for container images or for appliance-bundled runtimes.
- runZero and Azure `monitor` are unclassified in Conduit and may be refused.
