# Webroot (OpenText) plugin — governance and safety model

Unofficial. Community-built plugin for the Webroot Unity API. Not affiliated
with, endorsed by, or sponsored by OpenText or Webroot.

## What it connects as

This plugin does not hold credentials. It reaches Webroot through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which
brokers authentication centrally.

- No Webroot client secret or console password is stored on the
  technician's machine, in this repo, or in the model's context.
- **The credential is a real GSM console login.** Webroot's Unity API signs
  in as a console user (client ID and secret plus that user's email and
  password). Whatever that user's role can see, the plugin can read. Create
  a dedicated API-only console user with the lowest role that works, and
  limit its site permissions if the assistant does not need every customer.
- The credential is stored once at the gateway. There is no rotate action:
  changing the console password or the API client means re-submitting the
  connect form in Conduit.
- Every call carries operator identity, so the gateway audit log answers
  "who asked for this". Webroot's own records show only the API console
  user.

## Tool permission groups

Confirm the live permission grant in the gateway access editor before you
rely on a group in this document.

| Group | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Webroot state. | `webroot_health_ping`, `webroot_console_get`, `webroot_statistics_console_get`, `webroot_sites_list`, `webroot_sites_get`, `webroot_sites_lookup`, `webroot_statistics_site_get`, `webroot_endpoints_list`, `webroot_endpoints_get`, `webroot_groups_list`, `webroot_groups_list_endpoints`, `webroot_policies_list`, `webroot_policies_list_site`, `webroot_threats_list_site`, `webroot_threats_list_endpoint`, `webroot_blockedurls_list`, `webroot_dnsp_traffic_summary`, `webroot_dnsp_blocked_list`, `webroot_agent_status_gsm`, `webroot_agent_status_site`, `webroot_usage_sites_report` (21) |
| **Write** | *Empty.* | None. |
| **Delete** | *Empty.* | None. |
| **Admin** | Read-only, but sensitive: console admin PII and the agent command audit trail. | `webroot_admins_list`, `webroot_admins_list_site`, `webroot_commands_list_site`, `webroot_commands_list_endpoint` (4) |

**This plugin is read-only.** No tool issues agent commands, changes a
policy, deactivates a device, or changes an administrator. The four Admin
tools are in that group because of what they reveal, not because they
change anything.

## Recommended agent policy

- Read tools: allow, including for scheduled agents (daily health, monthly
  reviews).
- Admin tools: grant to the people who run access reviews and incident
  investigations. Unattended agents rarely need them.
- Remediation: the agent recommends; a technician acts in the GSM console.

## What it cannot reach

- Only the one GSM console whose key is on the connection, and within it
  only the sites the console user can see.
- No agent commands, no policy or admin changes, no shop or ecom, and no
  auto-login console link (`webconsoleurl` is deliberately not exposed).
- No filesystem, no shell, no other vendor's data.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `webroot_admins_list` and `webroot_admins_list_site` return
  administrators' names, email addresses, phone numbers and roles.
- Endpoint records include hostnames, IP and MAC addresses, AD domain and
  the current user; DNS Protection records include host, user and source
  IP. Treat them as customer personal data.

## Known sharp edges

- Threat, URL and DNS tools default to the last 24 hours. An agent that
  forgets to pass dates will report a quiet day as a quiet month.
- Webroot does not document rate limits. Broad per-endpoint sweeps across
  every site can be throttled.
