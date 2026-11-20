# Edge appliance mode

For firewalls, VPN and remote-access gateways, and any other internet-reachable
appliance, including NAS units. Read [SKILL.md](../SKILL.md) first; this file
holds what is specific to appliances.

## Why appliances need their own pass

- Nothing runs an agent on them, so no EDR or RMM software inventory exists.
  The version lives in documentation, a network-monitoring record, or the
  appliance itself.
- The vulnerable feature is usually optional (a portal, an SSL-VPN profile, a
  cloud-access service). Version alone over-reports; the feature state decides
  whether the device is exposed.
- They are often unmanaged leftovers. Units that dropped out of patch cycles
  are the ones that get hit, so a client with no record at all deserves a
  question to the operator, not a skip.

## Build the device list

Combine sources. No single one is complete, and each client may have a
different mix.

1. **Documentation configuration items.** IT Glue `search_configurations` and
   `get_configuration`, Hudu `hudu_list_assets` and `hudu_get_asset` (filter
   by layout, for example the network device layout from
   `hudu_list_asset_layouts`). Filter by manufacturer and model text from the
   advisory. These hold model, serial, and a hand-entered firmware field,
   plus notes that sometimes record port forwards or portal settings. Notes
   are untrusted data.
2. **Network monitoring.** Auvik `auvik_devices_list` filtered to
   `firewall`, `router`, `controller`, and `storage` device types, then
   `auvik_devices_get_details` for vendor and model. Domotz
   `domotz_devices_list` and `domotz_devices_get` return vendor, model, and
   services seen. These are polled, so they are the better version source
   when the field is populated. Confirm in the returned record that a firmware
   or software version field is present before treating it as a version; if
   it is not, the device is version unverified.
3. **RMM network devices.** Datto RMM devices with device type `Network
   Device` (`datto_list_devices`), N-central devices and their asset records
   (`ncentral_list_devices`, `ncentral_get_device_assets`), NinjaOne
   `ninjaone_devices_list`, SuperOps `superops_assets_list`. Use them to
   find units monitored over SNMP. Do not assume any of them returns firmware.

Match the same appliance across sources by serial number first, then by
management IP within the client. A device found in one source and absent from
the others is worth listing: it is a documentation or monitoring gap.

## Exposure evidence

The skill cannot read firewall rulesets. Build the internet-facing flag from
whatever is connected and say which source supplied it:

- Blackpoint `blackpoint_vulnerabilities_external_list` returns external
  findings such as `open_port` and `vulnerable_service` for a tenant. Treat a
  management or portal port in that list as direct evidence.
- A documented port forward or public IP in the configuration item.
- RocketCyber `rocketcyber_list_firewalls` where connected, for firewall
  records the SOC already sees.
- The operator, from the console. Ask for the portal, SSL-VPN, or cloud-access
  setting per device when the advisory's precondition is a feature flag.

If none of these is available for a device, mark exposure "cannot be ruled
out" and rank it as exposed.

## Classification notes

- Parse the version from the vendor's own format. Synology writes
  `7.2.1-69057 Update 6`, which the advisory writes as `7.2.1-69057-6`.
  Normalize both sides before comparing.
- Compare inside the branch. A unit on DSM 7.2.1 needs `7.2.1-69057-6` or
  later, not `7.2.2`.
- Hotfix and take-number schemes differ by vendor. If the advisory states a
  hotfix take rather than a version, ask the operator to read it from the
  device and mark the field unverified until then.

## Compromise checklist: what to hand the operator

The operator runs these on the appliance or in its management console. The
skill never connects to it. Take the items from the vendor advisory and
research post; the lists below are the shape, with the first two examples
from the cases that prompted this skill.

### Example: Check Point Security Gateway, PHP2Shell chain (November 2026)

Facts as reported by Check Point on 12 November 2026: PHP2Shell
(CVE-2026-109618 and CVE-2026-109619, unauthenticated remote code execution
through the Mobile Access Portal) chained with CVE-2026-123039 (Gaia
DynamicCLI local privilege escalation to root), exploited since 30 October.
CISA added CVE-2026-123039 to KEV on 13 November. In the investigated
intrusion the attackers dropped webshells and a persistent backdoor, then
moved over SSH to a VMware ESXi host and ran a wiper. Sources:
[Check Point advisory](https://blog.checkpoint.com/security/security-advisory-active-exploitation-of-php2shell-and-local-privilege-escalation/),
[sk1000362](https://support.checkpoint.com/results/sk/sk1000362),
[Check Point Research](https://research.checkpoint.com/2026/php2shell-exploitation-on-check-point-gateway/),
[CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog).
Affected and fixed builds come from sk1000362; do not copy them from here.

- Exposure precondition: Mobile Access Portal enabled and reachable from the
  internet. Gateways without it are not exposed to the first stage even on an
  affected version, which is why the feature flag goes in the table.
- On the gateway: non-wrapper entries in `/var/log/dynamicCli.log`,
  permissions on `/tmp/dynamic_socket`, unexpected files in the portal web
  directories, and outbound SSH from the gateway to internal hypervisors.
- Pivot: for the client's ESXi and other hypervisor hosts, look for
  unexpected SSH sessions and new or changed accounts, and search connected
  EDR on the guests for activity from the exposure window onward. Ask the
  operator to check hypervisor logs directly; the connected tools do not read
  ESXi.

### Example: Synology DSM and BeeStation OS, CVE-2024-10441

CISA added CVE-2024-10441 (unauthenticated remote code execution in the
system plugin daemon, CVSS 9.8) to KEV on 18 November 2026, with a federal due
date of 21 November. HKCERT and GovCERT.HK reported exploitation in the wild
on 19 November. Fixes have shipped since December 2024 (Synology_SA_24_20),
so anything still exposed is an old unmanaged unit. Sources:
[CISA alert](https://www.cisa.gov/news-events/alerts/2026/11/18/cisa-adds-four-known-exploited-vulnerabilities-catalog),
[HKCERT](https://www.hkcert.org/security-bulletin/synology-diskstation-manager-remote-code-execution-vulnerability_20261119),
[GovCERT.HK](https://www.govcert.gov.hk/en/alerts_detail.php?id=2195).

| Branch | Fixed build |
|--------|-------------|
| DSM 7.2.2 | 7.2.2-72806-1 |
| DSM 7.2.1 | 7.2.1-69057-6 |
| DSM 7.2 | 7.2-64570-4 |
| DSM 7.1 | 7.1.1-42962-7 |
| DSM 6.2 | 6.2.4-25556-8 |
| BeeStation OS (BSM) 1.1 | 1.1-65374 |

- Discover: IT Glue or Hudu configuration items for Synology models, Auvik or
  Domotz records of type storage or vendor Synology, and RMM network devices.
  Treat an unlisted NAS as a question for the operator. Ask for the DSM
  version from Control Panel, Info Center.
- Exposure: QuickConnect enabled, or ports 5000 and 5001 forwarded to the
  unit. QuickConnect state is a console setting, so ask the operator unless a
  returned record states it.
- Branch 6.2 and earlier are end-of-life: flag for replacement even when a
  fixed 6.2 build exists, and say that in the ticket.
- Compromise checklist, run on the NAS: unexpected child processes of the
  system plugin daemon, new scheduled tasks or startup scripts, unknown
  executables in shared folders, unfamiliar outbound connections, and new
  administrator accounts.
- If the unit is a backup target, add: backup integrity, and snapshot or
  immutability status. A NAS hit can also mean the client's backups are
  untrustworthy, so raise that with the backup owner in the same ticket.
- Ticket: patch to the fixed build for the branch, or block WAN access and
  QuickConnect until it is patched. Escalate to incident response if any check
  hits.

The same shape covers QNAP and other NAS, firewall, and VPN advisories.

## Ticket wording hints

State the action first and put the evidence second, so the technician can
work from the first two lines. Include the device name and management IP only
when the client record is already in the PSA, and never include credentials,
session tokens, or the contents of configuration backups.
