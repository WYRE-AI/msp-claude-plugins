# MSP Process — November 2026

Re-check [official status](https://status.mspprocess.com/) and current
vendor instructions before choosing the window or remediation. Obtain app
IDs from the operator or tenant inventory; no fixed MSP Process IDs or IOC
lists belong here. Ask for current vendor/IR/Huntress indicators.

## Vendor infrastructure account

MSP Process says an internal server/infrastructure holding Partner Center
feature data was accessed on November 7, 09:56–approximately 14:40 UTC.
Data included app credentials/access tokens for Authenticator, Password
Reset and Contacts sync partners. It reports attacker removal and platform
credential rotation; the stolen access key ceased working at 19:05 UTC,
with no activity on its systems after approximately 14:40. These statements
do not establish the state of partner/client tenants.

Authenticator End-user Verification and Identity Management (Password Reset,
MFA Reset, User Unlock) were temporarily disabled for all partners pending
security confidence. Affected partners received remediation on November 7;
others received a precautionary stored-API-key rotation recommendation on
November 8. Source: [MSP Process status](https://status.mspprocess.com/).

## Reported tenant evidence and hunt context

[The Stack, November 9, updated November 10](https://www.thestack.technology/msp-software-firm-hacked-with-customer-entra-environments-now-getting-pwned/)
reports stolen client IDs/secrets, admin refresh tokens and GDAP lists.
Typical access included user-write/authentication-method permissions;
client-secret authentication required no user sign-in/MFA. Its Huntress
account describes self-grants, secrets across dozens of apps, new accounts,
exfiltration and re-enablement. A Huntress staffer reported 47 tenants with
successful malicious token grants, one with substantial follow-on activity.

Published Huntress timeline (UTC; distinct from vendor infrastructure window):

| Date | Observation |
|---|---|
| Nov 6 ~03:50 | Residential-proxy password spray; no observed token successes |
| Nov 6 13:00–22:05 | Failed client-secret attempts |
| Nov 7 09:38–09:51 | Failed secrets, then app-ID replay against one tenant |
| Nov 7 10:01 | First actual token |
| Nov 7 10:27–10:31; 11:30–11:31 | Cross-partner tests; two tokens/app |
| Nov 7 10:30–10:38 | Admin refresh-token attempts; all failed in Huntress view |
| Nov 7 10:22–14:48 | Hands-on tenant activity; last observed sign-in 14:47:56 |

Reported IOC classes: shared Azure space, DigitalOcean hosting, VPN exits,
residential proxies and user-agent families. Shared addresses alone cannot
identify the actor. CEO Patrick Leonard described containment and Sophos
engagement; platform containment cannot establish downstream tenant safety.

## Apply the workflow

Use the operation names in SKILL.md as hunt guidance, not proof. Review
actual initiator/target IDs and outcomes, SP and non-interactive sign-ins,
mail/file activity, grants and safe credential metadata per tenant.
Recommend connected partner-app secret deletion and inspection of every
app the vendor could modify. Recommend original-consenting-admin session
revocation even when observed refresh-token attempts failed or stored tokens
expired; secret deletion also blocks that authentication path. Have the
operator verify current vendor/IR instructions and inspect missing console
sources. Keep reconnection pending vendor security confirmation.
