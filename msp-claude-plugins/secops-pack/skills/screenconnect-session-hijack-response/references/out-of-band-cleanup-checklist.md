# Out-of-band cleanup checklist

Recommendations only. The operator approves every change and executes it
through EDR live response, WinRM / PowerShell remoting from a clean admin
host, another independent CLI, or a person at the keyboard. Never use any
ScreenConnect feature, including Run Command, Toolbox, Backstage, or file
transfer, on suspect machines. The skill executes none of these actions.

Use the current [IOC reference](screenconnect-iocs-nov-2026.md) for artifact
names. Its persistence list is community-reported and may be incomplete.

- [ ] Contain suspect tech workstations out-of-band first. Lock down compromised
  panels, kill SC web sessions, and rotate SC + IdP credentials from a clean
  device before endpoint eradication. Record approvals and owners.
- [ ] Preserve evidence before removal: service names, IDs, executable paths
  and hashes; process lineage; task XML; Run-key values; file hashes;
  timestamps and relevant logs. Keep sensitive evidence in the incident store,
  not in a chat report. Do not export browser cookies or secrets here.
- [ ] Identify and stop/remove unapproved ScreenConnect client services by
  instance ID **and** binary/path evidence. Preserve a known-good MSP client.
  Also remove the modified client listed in the reference even if it uses the
  MSP's legitimate ID. If it replaced the legitimate client, the operator
  decides whether to reinstall a verified clean client after eradication.
  If legitimacy is ambiguous, stop and ask the operator before removal.
- [ ] Remove the listed scheduled task, trap directory, and temporary artifacts.
  Search all user profiles plus Windows / SYSTEM temp, not only the responding
  operator's `%TEMP%`. Inspect the other listed payload filenames too.
- [ ] Remove the listed registry Run persistence value wherever found: inspect
  HKLM and every loaded user hive; arrange an out-of-band review of unloaded
  profiles before declaring coverage complete. The original post did not
  specify a hive. Record what was actually checked.
- [ ] Block the reference domains/IPs at DNS/firewall after impact review;
  dynamic DNS and shared IPs may cause collateral effects. Do not fetch payloads.
- [ ] Only lift isolation after persistence removal has been verified through
  independent out-of-band evidence. Re-check after **15 minutes** and at the
  **next RMM inventory** for reinfection. If artifacts return, contain again,
  preserve new evidence, and escalate to the EDR/MDR provider.
- [ ] Treat tech hosts with the browser-database utility drop or a session to
  an infected host as compromised. Reimage is the safer path, at the operator's
  decision. Missing utility files do not clear a host: memory-based cookie
  extraction was also reported. Restore access only from a trusted host.
- [ ] If any of the five RMM+ family extensions in the
  [IOC notes](screenconnect-iocs-nov-2026.md#rmm-family-extensions) is
  installed, enabled or already disabled, disable and remove it out of band
  from a clean device using ConnectWise's
  [extension uninstall instructions](https://docs.connectwise.com/ScreenConnect_Documentation/Get_started/Administration_page/Extensions_page#Uninstall_an_extension).
  Do not re-enable or reinstall pending further official guidance. Disabling
  the extension does not clear endpoints. The skill never performs this change.
- [ ] After eradication, rotate downstream console and client-side credentials
  in the approved blast-radius order. Confirm instance and technician host
  clients are current; patching alone does not remove this persistence.

An operator-built RMM monitor for unapproved client services plus the listed
persistence artifacts is a reasonable follow-up control. Do not copy or run
community detection scripts: provenance/license and behavior are unverified.
