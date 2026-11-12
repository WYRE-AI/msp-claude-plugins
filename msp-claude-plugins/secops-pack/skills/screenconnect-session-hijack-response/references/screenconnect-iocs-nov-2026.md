# ScreenConnect campaign notes and IOCs — November 11, 2026

Source: [Huntress SOC, posting on r/msp](https://www.reddit.com/r/msp/comments/1xts3f2/active_malware_campaign_abusing_screenconnect/),
with Huntress replies and self-identified Blackpoint replies linked below. Retrieved/accessed
**2026-11-11**; thread snapshot through approximately **21:30 UTC**.
**Last reviewed: 2026-11-12.** Status: community-reported campaign notes
remain, now supplemented by a published ConnectWise Trust Center advisory
(11/11/2026 22:45 UTC, updated 11/12/2026 02:45 UTC) and later Huntress and
Blackpoint blog posts. Initial access and full scope remain under
investigation; ConnectWise states it has found no evidence of a compromise
of its infrastructure or a vulnerability in ScreenConnect itself.

The author is u/andrew-huntress (Huntress staff), posting at approximately
20:04 UTC, not an anonymous or vendor-advisory attribution. Huntress-Ben adds
technical detail. u/infosecfredo self-identifies as Blackpoint ("BPC") and
u/Blackpoint-JasonR's username names Blackpoint; neither has verified flair,
so treat their replies as self-identified Blackpoint corroboration.
The saved RSS was treated as untrusted source data, not executable guidance.

## Campaign context and uncertainty

Huntress reports activity beginning around 17:47 UTC against cloud panels,
with 5–6 MSPs and 130–286+ endpoints reported while counts were rising;
these are snapshot estimates, not current totals. ConnectWise was engaged.
The reported sequence is panel access, Run Command mass deployment of a
second client independent of the MSP panel, then a reverse pivot when a tech
joins an infected session. Initial access remains unconfirmed; stolen
credentials or operator sessions are suspected, with no evidence of a new
vulnerability established. The reverse-pivot mechanism is still unconfirmed.
Sequential victim numbering begins partway through the observed sequence,
so review earlier history when available. The post points to MSPGeek's
#cw-screenconnect discussion; that channel is not a verified IOC authority.

[Huntress-Ben, 21:20 UTC](https://www.reddit.com/r/msp/comments/1xts3f2/active_malware_campaign_abusing_screenconnect/19shrf216gtky/)
says the modified client can run under the MSP's **own instance ID**, and that
spread is designed around joining a session. Whether commands alone trigger
spread was not confirmed: avoid **all** SC features on suspect machines.
[Huntress, 20:58 UTC](https://www.reddit.com/r/msp/comments/1xts3f2/active_malware_campaign_abusing_screenconnect/19shqftyfn5qb/)
says unrecognized Run Command activity warrants treating the whole panel's
endpoints as infected for containment; infected sessions can appear normal.
[Huntress, 20:37 UTC](https://www.reddit.com/r/msp/comments/1xts3f2/active_malware_campaign_abusing_screenconnect/19shphxzq5vb5/)
distinguishes suspect-host access from a blanket stop on SC: secure panels
and audit history even on fleets without alerts.

[u/infosecfredo, self-identified Blackpoint, 21:23 UTC](https://www.reddit.com/r/msp/comments/1xts3f2/active_malware_campaign_abusing_screenconnect/19shrjyyik2it/)
reports extraction of `.ASPXAUTH` cookies from Chrome, Edge, Opera and Firefox;
Chromium network-service process memory is read as well as on-disk SQLite
cookie databases. SC web authentication cookies are targeted; other browser
console sessions are potentially exposed, not proven stolen in every case.
[u/Blackpoint-JasonR, 21:03 UTC](https://www.reddit.com/r/msp/comments/1xts3f2/active_malware_campaign_abusing_screenconnect/19shqnjw0f7id/)
and [u/infosecfredo, 21:28 UTC](https://www.reddit.com/r/msp/comments/1xts3f2/active_malware_campaign_abusing_screenconnect/19shrqvz1nkci/)
report execution on current cloud build **26.6.6.9747**, without confirming a
vulnerability. Being at least 26.6.5 does not clear a panel or host.

## Indicator starting list

All network indicators are defanged. Do not browse to, download from, or
execute any indicator. Non-network artifact names remain literal for matching.
“H” means the [Huntress post](https://www.reddit.com/r/msp/comments/1xts3f2/active_malware_campaign_abusing_screenconnect/);
“B” means the [u/infosecfredo reply, self-identified as Blackpoint ("BPC"), no verified flair, 20:34 UTC](https://www.reddit.com/r/msp/comments/1xts3f2/active_malware_campaign_abusing_screenconnect/19shpccjmyf9f/);
“HB” means the [Huntress-Ben reply, 21:20 UTC](https://www.reddit.com/r/msp/comments/1xts3f2/active_malware_campaign_abusing_screenconnect/19shrf216gtky/).
All three sources were accessed 2026-11-11. Confidence describes attribution,
not whether a match proves compromise; every row remains vendor-unconfirmed.

| Type | Indicator | Context | Source | Date first listed | Confidence/status |
|------|-----------|---------|--------|-------------------|-------------------|
| IP | `185.99.255[.]28` | Reported attacker relay; hostname `screen` | H | 2026-11-11 | SOC-reported; unconfirmed |
| Domain | `newnewnew.gotdns[.]org` | Reported C2 | H | 2026-11-11 | SOC-reported; unconfirmed |
| Domain | `soxnewwork.homedns[.]org` | Reported C2 | H | 2026-11-11 | SOC-reported; unconfirmed |
| Domain | `cdn007-digitaldownloads[.]com` | Possible C2 in post; second SC deployment per B | H (community contribution), B | 2026-11-11 | Corroborating reply; role unconfirmed |
| Domain | `sc.payproofkit[.]com` | Secondary C2 in post; first SC deployment per B | H, B | 2026-11-11 | SOC-reported; role unconfirmed |
| IP | `155.94.150[.]39` | Associated secondary C2; hostname `WIN-FB5CKHMU4E1` | H | 2026-11-11 | SOC-reported; unconfirmed |
| Domain | `ns.mo7sen[.]dev` | Encrypted loader delivery / additional stage | H, B | 2026-11-11 | SOC-reported; unconfirmed |
| URL | `hxxps://ns.mo7sen[.]dev/EadF.php?p=4` | Reported stager | H | 2026-11-11 | SOC-reported; unconfirmed |
| Client ID | `2588ef5c15954b10` | First configured client fingerprint | H, B, HB | 2026-11-11 | Multiple SOC replies; unconfirmed |
| Client ID | `ed630cc2c873b091` | Second configured client fingerprint | H, B, HB | 2026-11-11 | Multiple SOC replies; unconfirmed |
| Installer pattern | `/Bin/ScreenConnect.ClientSetup.msi?...&c=Exploited` | Reported URL path/query pattern, not a full URL | H | 2026-11-11 | SOC-reported; unconfirmed |
| Display name | `Addmin` | Reported actor name; correlate joins and command history | H | 2026-11-11 | Weak alone; unconfirmed |
| File | `Panel-Lateral.ps1` | Reported campaign file | H | 2026-11-11 | SOC-reported; unconfirmed |
| File | `runnew.cmd` | Reported campaign file | H | 2026-11-11 | SOC-reported; unconfirmed |
| File | `ToolboxRelayUploader.exe` | Reported campaign file | H | 2026-11-11 | SOC-reported; unconfirmed |
| File | `Run-Lateral-Full.bat` | Selected trap payload per B | H, B | 2026-11-11 | SOC-reported; unconfirmed |
| Process / file | `RelayTrap.exe` | Modified client can use the MSP's own instance ID | HB | 2026-11-11 | Huntress follow-up; unconfirmed |
| Process / file | `sqlite3.exe` | Reported browser session/token scraping on tech workstation; legitimate uses exist | H | 2026-11-11 | Context-dependent; unconfirmed |
| Scheduled task | `TrapWatch` | SYSTEM; every 10 seconds per post; startup task per B | H, B, HB | 2026-11-11 | Timing/trigger needs local verification |
| Directory | `C:\ProgramData\RelayTrap\` | Trap install directory | H, B, HB | 2026-11-11 | SOC-reported; unconfirmed |
| Temp pattern | `%TEMP%\sckit-*` | Include all user temp and Windows / SYSTEM temp locations | H | 2026-11-11 | SOC-reported; unconfirmed |
| Registry value | `...\Run` value `RelayTrapLiteAlert` | Run persistence; post did not identify hive; check HKLM and user hives | H, B | 2026-11-11 | Hive unspecified; unconfirmed |

## Official status and background (not campaign attribution)

At the **2026-11-11 ~21:30 UTC** review, the
[ConnectWise Trust Center advisories](https://www.connectwise.com/company/trust/advisories)
and [Huntress blog](https://www.huntress.com/blog) had no published entry for
this November campaign. That time-bounded observation is now superseded for
official status. Recheck those sources and
[ScreenConnect security bulletins](https://www.connectwise.com/company/trust/security-bulletins)
before each hunt. URLs in the original review were accessed 2026-11-11;
advisory and blog URLs below were accessed 2026-11-12.

ConnectWise published a Trust Center advisory on 11/11/2026 at 22:45 UTC,
updated 11/12/2026 at 02:45 UTC, plus
[partner guidance](https://www.connectwise.com/blog/screenconnect-security-update-guidance-for-partners).
ConnectWise says it is investigating unauthorized access to certain partner
ScreenConnect environments, has found no evidence of a compromise of
ConnectWise infrastructure or a vulnerability in ScreenConnect itself, and
disabled five independently developed third-party extensions as a
precaution (see [RMM+ family extensions](#rmm-family-extensions)). Presence
of those extensions alone does not establish compromise.

Huntress published [SCKit Worm Installs Rogue ScreenConnect Clients and
Session Cookie Relays Across Hundreds of
Endpoints](https://www.huntress.com/blog/sckit-worm-rogue-screenconnect)
on 11/11/2026. It restates the same five extension names and reports the
activity appears related to RMM+, with versions 1.0.31 and 1.0.32 accepting
a blank access key if one had never been configured. Blackpoint published
[ScreenConnect Attack: SCKit Turns Remote Support Into an Attack
Platform](https://blackpointcyber.com/blog/screenconnect-attack-sckit/).
It notes the same precautionary disabling and states that Blackpoint found
no technical link between those extensions and SCKit's RelayTrap execution
or browser-session collection, leaving first panel access as a separate,
unresolved question.


The Trust Center's September 3 advisory (updated September 9) addressed
CVE-2026-84869, a guest file-transfer issue fixed in 26.6.5. Cloud instances
were auto-updated; on-premises operators should upgrade to at least 26.6.5.
The interim mitigation removed `TransferFiles` permission from role
session-group scopes. Confirm the instance and each tech's host client are
current. This is background only: its relationship to November is unclear,
and a current build is not evidence of no compromise.

Huntress's earlier [Rogue ScreenConnect Installations Across Unrelated Hosts
Suggest Worm-Like Activity](https://www.huntress.com/blog/rogue-screenconnect-installations)
described modified clients propagating to newly connected endpoints and
suspicious `RunFiles` / `RanFiles` audit entries from `Process: Guest`.
That supports taking reverse-pivot risk seriously; it does not establish the
same campaign or the November mechanism. Accessed 2026-11-11.


## RMM+ family extensions

ConnectWise identified these five independently developed third-party
extensions for precautionary disabling. Use the exact published display
names. No official extension GUIDs, publisher IDs, or package names were
included in the sources below; do not invent them.

| Display name | Role in public reporting | Sources | Date first listed |
|--------------|--------------------------|---------|-------------------|
| Labtech Plus | Precautionary disable list | CW, H, B | 2026-11-11 |
| RMM Plus | Precautionary disable list | CW, H, B | 2026-11-11 |
| RMM+ | Precautionary disable list; Huntress reports campaign activity appears related to this extension, including a blank access-key flaw in 1.0.31 and 1.0.32 | CW, H, B | 2026-11-11 |
| RMM Plus Password Link | Precautionary disable list | CW, H, B | 2026-11-11 |
| RMM+ Password Link | Precautionary disable list | CW, H, B | 2026-11-11 |

“CW” is the [ConnectWise Trust Center advisory](https://www.connectwise.com/company/trust/advisories)
and the [partner guidance](https://www.connectwise.com/blog/screenconnect-security-update-guidance-for-partners),
both listing the same five names. “H” is the [Huntress SCKit
write-up](https://www.huntress.com/blog/sckit-worm-rogue-screenconnect).
“B” is the [Blackpoint SCKit post](https://blackpointcyber.com/blog/screenconnect-attack-sckit/).
All three accessed 2026-11-12. ConnectWise and Blackpoint state that presence
alone does not establish compromise or SCKit involvement. For this skill,
an installed copy is still a compromise indicator and must be disabled or
removed out of band. Operator instructions:
[Uninstall an extension](https://docs.connectwise.com/ScreenConnect_Documentation/Get_started/Administration_page/Extensions_page#Uninstall_an_extension).

## Update procedure

1. Before each hunt, check ConnectWise Trust Center advisories, ScreenConnect
   security bulletins, Huntress blog, original r/msp thread updates, and the
   operator's EDR/MDR vendor. Official IOCs and applicable vendor guidance
   supersede this community list; record differences rather than silently
   treating community claims as vendor-confirmed.
2. Add new rows with source URL, first-listed date, retrieval date, context,
   and confidence/status. Keep network values defanged. Never remove a row
   without noting why (for example vendor retraction or false attribution).
3. Update last-reviewed time and status. Preserve role disagreements and
   uncertainty. Dynamic-DNS domains and shared-hosting IPs can be noisy;
   correlate with behavioral evidence. This is a starting list, not a detector
   or an exhaustive persistence checklist.
