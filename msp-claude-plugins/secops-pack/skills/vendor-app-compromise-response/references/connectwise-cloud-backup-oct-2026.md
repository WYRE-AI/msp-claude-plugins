# ConnectWise Cloud Backup — October 2026

Sources: [ConnectWise technical investigation and remediation guide](https://www.connectwise.com/contentassets/10777cd3364d440c86ed5270a94a5f24/connectwise-cloud-backup-technical-investigation-and-remediation-guide-1.pdf),
[Huntress investigation](https://www.huntress.com/blog/vendor-credential-enables-unauthorized-access),
and [Channel Insider reporting](https://www.channelinsider.com/channel-business/channel-analysis/connectwise-cloud-backup-breach-msp-security/).
Re-check current vendor/IR guidance before acting; request the current IOC
list rather than using a fixed detector from this reference.

## Authentication and observed impact

Huntress describes a stolen vendor-held application credential/client
assertion used for Microsoft Graph tokens in customer tenants. Authentication
was as the application, without a user's password or MFA; the credential
lived in the vendor tenant. On October 15 it observed unauthorized access
between 06:13 and 08:34 UTC; by 19:00 UTC October 16 it had confirmed 162
tenants. That is a dated count, not a final total.

In one partner tenant, Cloud Management - MS Teams gave itself Global
Administrator and added credentials to two other apps, including a
partner-specific single-tenant Huntress app. Legitimate traffic was described
as Azure private-space traffic; shared cloud addresses cannot identify an
actor alone. Ask the operator to confirm published IOC addresses against
the current vendor/IR list. No IOC IPs or user-agents are embedded here.
Source: [Huntress](https://www.huntress.com/blog/vendor-credential-enables-unauthorized-access).

## Official application identity inventory

Match Application ID, including installations retaining SkyKick display names.
These are application identifiers, not IOC IPs or customer object IDs.
Source: [ConnectWise guide/public guidance](https://www.connectwise.com/contentassets/10777cd3364d440c86ed5270a94a5f24/connectwise-cloud-backup-technical-investigation-and-remediation-guide-1.pdf).

| Application | Application ID |
|---|---|
| ConnectWise Cloud Backup | 506e08f9-6e9a-4da4-942b-a099a03644ae |
| ConnectWise Cloud Management | 2399d300-6fca-4e6a-a686-399fefe75b83 |
| Cloud Management - MS Teams | 24205314-2b89-4e07-a2a4-579e898a5640 |
| Cloud Management - Exchange Online | b78f6a77-d4e5-46fb-87e5-d1648bd02519 |
| Cloud Management - MS Graph | 0de14c77-b9b0-4137-9360-34878a929827 |
| Cloud Management - Partner Center | 412dcf96-176d-4b3a-a1b0-4981ad66971e |
| Cloud Management - SharePoint Online | b2b55f5b-7758-4719-8d8f-88ae172e6bdb |

## Operator plan and limits

ConnectWise reports disabling seven identities and revoking credentials at
07:00 UTC October 17. Vendor actions do not alter enterprise-app settings
inside each partner/customer tenant; previously issued tokens can persist
until expiry or invalidation. ConnectWise said stored backup archives
remained isolated, encrypted and uncompromised, while downstream tenant
changes were outside its visibility. Do not report a backup-archive breach
from application sign-ins. Source: [ConnectWise guide](https://www.connectwise.com/contentassets/10777cd3364d440c86ed5270a94a5f24/connectwise-cloud-backup-technical-investigation-and-remediation-guide-1.pdf).

Recommend disabling rather than deleting the apps as first response and
keeping them disabled until ConnectWise confirms credential reset and
restoration instructions. Disabling does not remove planted credentials:
review credentials on all M365 applications, subject to the safe metadata
rules, or assign operator console inspection. Source:
[Huntress](https://www.huntress.com/blog/vendor-credential-enables-unauthorized-access).

Run the partner review and then each mapped client separately, including
dormant integrations. Preserve grants, app-initiated role/credential changes,
sign-in outcomes and mail/file evidence. Report gaps rather than implying
that vendor revocation established clean downstream tenants.
