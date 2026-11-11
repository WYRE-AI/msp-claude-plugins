# N-central November 2026 advisory notes

Operator-facing facts for the first worked example. Re-check the official
status page before relying on patch or exposure-window details; a
follow-up hotfix was already signaled. Do not invent IOCs or a complete
affected-version range.

## Official remediation

N-able published [N-central 2026.4 HF2 release notes](https://status.n-able.com/2026/11/10/n-central-2026-4-hf2-release-notes/)
on 10 November 2026.

- Build: `2026.4.1.26`.
- This hotfix supersedes N-central 2026.4 (build `2026.4.0.27`) and
  2026.4 Hotfix 1 (build `2026.4.0.32`).
- Documented upgrade paths start at 2025.4, 2026.1, 2026.2, 2026.3
  (including 2026.3.1 hotfixes), and 2026.4 / 2026.4 HF1. Earlier
  versions must move to a supported release first.
- Hosted (NCOD) servers are upgraded by N-able. On-premises customers
  upgrade their own servers and should keep them offline until the
  upgrade completes, per N-able's incident guidance.
- All customers, hosted and on-premises, must upgrade Agents and
  Probes. To keep Agent-to-Probe communication, upgrade Agents first,
  then Probes. Compatibility depends on Agent, Probe, and Patch
  Management Engine versions; PME is pushed separately.
- Known issue in HF2: built-in remote control is temporarily disabled.
  Take Control continues to work.
- Official CVEs listed with the hotfix:
  - CVE-2026-125883 — Multiple XXE vulnerabilities
  - CVE-2026-125878 — Multiple OGNL injection vulnerabilities
  - CVE-2026-125879 — Local privilege escalation to root via
    nable-writable syslog-ng config
  - CVE-2026-125880 — Stored XSS via MMS3 patch metadata (admin context)
  - CVE-2026-125881 — Schema-hint SSRF via service import schema
    validation
  - CVE-2026-125882 — RCE via file repository upload path traversal
    (credit Nate Fair, Sprocket Security)
  - CVE-2026-91000 — Insecure IPC channels leading to local privilege
    escalation

N-able's status updates also stated that a follow-up hotfix would be
released for further security updates.

## Disclosure context

On 9 November 2026, N-able took hosted N-central environments offline
after public disclosure of research published as Able2Shell. Reporting
from [Huntress](https://www.huntress.com/blog/n-able-disables-cloud-services-following-disclosure-of-able2shell-exploit-chains),
[BleepingComputer](https://www.bleepingcomputer.com/news/security/n-able-takes-cloud-platform-offline-after-30-plus-zero-days-published/),
and [CSO](https://www.csoonline.com/article/4247028/n-able-n-central-gets-emergency-fix-two-days-after-33-exploits-published.html)
describes 33 researcher-published issues and multiple exploit chains,
including unauthenticated paths to code execution on the server.

The researcher reported testing against N-central Appliance
`2026.4.0.31` and expected earlier versions to be affected. N-able's
HF2 notes do not publish a single complete CVE affected-version
statement beyond the supported upgrade paths above. Do not treat
`2026.4.0.31` as the only affected build.

N-able reported scanning activity associated with published
proof-of-concept code and stated it had not seen evidence of successful
customer exploitation as of its 9 November 2026 15:15 UTC note / later
status updates. Huntress similarly reported no observed exploitation in
partner environments as of its 10 November update. No official IOC list
specific to this November disclosure was found when this skill was
written.

Third-party summaries of the research, including
[eSentire](https://www.esentire.com/security-advisories/n-able-n-central-vulnerabilities-publicly-disclosed),
also describe an unauthenticated remote-control audit-record overwrite
and anonymous MDM command impersonation that can steal or forge command
results. Those items appear in researcher write-ups, not as separately
numbered CVEs in the HF2 notes. They are one reason this workflow
corroborates N-central audit and task history with independent sources.

Huntress advised reviewing authentication activity from 8 November 2026
onward, looking for unexpected administrator accounts, scripts, and
remote-access sessions.

## Earlier 2026 N-central incidents

This disclosure follows earlier 2026 emergency fixes, including August
authentication-bypass issues and the September pre-auth RCE
CVE-2026-86218 (patched in 2026.3 HF4, build `2026.3.1.14`). Those
events have their own patches and, in some cases, published IOCs (for
example the September guidance around `23.234.64.0/18` and unexpected
`.invalid` accounts). Do not treat those IOCs as evidence for the
November disclosure unless official guidance later ties them together.
