# Meraki plugin — governance and safety model

Unofficial. Community-built plugin: the skills, commands and agent are
built by WYRE and the MSP community, and are not affiliated with,
endorsed by, or sponsored by Cisco. The MCP server they use is Cisco's
official first-party hosted Meraki MCP server
(`https://mcp.meraki.com/mcp`).

## What it connects as

This plugin does not hold credentials. It reaches Meraki through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally, scopes every call to the tenant the operator
is authorised for, and forwards the org's Dashboard API key to Cisco's
server as `Authorization: Bearer`.

- No Meraki Dashboard API key is stored on the technician's machine, in
  this repo, or in the model's context.
- The org's Meraki credential is stored once at the gateway, so
  replacing it is one edit rather than a change on every technician's
  machine. There is no rotate action, though — you re-submit the
  connect form, which overwrites the stored credential in place, and
  nothing tracks its age or prompts you.

- Every call carries operator identity, so Conduit's audit log answers
  "who pulled that firewall ruleset". Meraki attributes every API call
  to the Dashboard account that owns the API key, which for an MSP is
  usually a shared service account. Conduit records *who called which
  tool*, never with what arguments — for `execute_api`, the
  `capability_id` and `parameters` are exactly what the log will not
  show you.
- Complete offboarding in the gateway console, and confirm the person no longer has access before you treat it as done.

Confirm the live permission grant in the gateway access editor before you rely on a tier in this document. This note does not describe gateway enforcement internals.

## Tool permission groups

Conduit's access editor presents four groups — Read, Write, Delete, Admin — so these are the buckets an owner actually clicks. Cisco's server exposes exactly two tools.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Searches Cisco's capability catalog. Returns capability metadata, never customer data. | `read` | `semantic_search` |
| **Write** | **Empty.** Cisco's server has no write capabilities. | `write` | *(none)* |
| **Delete** | **Empty**, for the same reason. | `write` — **not** a tier of its own | *(none)* |
| **Admin** | Runs any read capability in Cisco's catalog against every organization, network, device and client the key can see. | `admin` | `execute_api` |

Every task that returns Meraki data goes through `execute_api`, so
using this plugin for real work means an admin-tier Meraki grant. A
member with only `read` sees `semantic_search` and can find
capabilities but not run them.

On this vendor, admin tier means "read everything the key can read",
not "change anything". That is the whole of the safety model:

- **Cisco's server is read-only and rejects state-changing operations.**
  Write operations are not in its catalog; asking `execute_api` for
  one returns "Capability not found".
- **Conduit classifies `execute_api` admin tier because it dispatches
  to arbitrary capabilities.** The caller names the `capability_id`, so
  one tool name reaches the whole read API.

### Why the dispatcher is admin-pinned

`execute_api` takes a `capability_id` and a parameter dict, and Conduit
grants access by tool name. Two consequences worth acting on. Conduit
cannot grant "device status but not client data": an `execute_api`
grant is all of Cisco's read catalog or none of it. And the audit trail
shows `execute_api`, never which capability it dispatched.

### Read-only is Cisco's control, and it is beta

The read-only guarantee lives upstream, in what Cisco's catalog
contains. Two things follow.

1. **Annotations and server instructions are advice, not gates.** Both
   tools carry `readOnlyHint: true`, and the server's instructions tell
   the model to refuse create, update, delete and reboot requests. The
   enforcement is that no write capability exists to call. A control
   that depends on the client reading and acting on annotations is not
   a control when the client is a gateway.
2. **Cisco labels the hosted server beta.** Tool schemas and supported
   capabilities may change. If Cisco adds write capabilities, they
   arrive under the same `execute_api` name and the same admin grant,
   with nothing in Conduit's tier model to separate them. Revisit
   Meraki grants when Cisco's release notes change the hosted server's
   scope.

## Recommended agent policy

The safe default is **read autonomously, recommend changes, let a human
make them in the Meraki Dashboard.**

- **`semantic_search`: allow.** It returns catalog metadata only.
- **`execute_api`: grant deliberately, per person or agent.**
  Offline-device sweeps, firmware and lifecycle audits, firewall rule
  *reviews*, and VPN health checks are the intended autonomous use.
  Because the grant reaches client personal data and administrator
  records as well, do not make it an org-wide default.
- **Changes: nothing executes them.** The plugin reads current state
  and writes out the exact change for a human to make. For firewall,
  switch port, SSID or reboot recommendations, the proposal must show
  the current state and the complete result, not a delta.

## What it cannot reach

- Only the Meraki organizations the API key can see, and only the tenants
  mapped to the operator's Conduit identity. Conduit controls *who in your
  organisation may use that credential and which tools they may call*, not
  which slice of Meraki's data comes back. Scope the credential at the
  vendor if you need a narrower boundary.
- **Only Meraki-branded hardware.** Anything else on the customer's
  network is invisible here regardless of permissions.
- Only Meraki.com dashboards. The China cloud, Federal, GovCloud and
  localized dashboards are not served by Cisco's hosted server.
- No filesystem, no shell, no other vendor's data.
- No device CLI or SSH, and no writes of any kind: no reboot, no
  configuration change, no delete, no live tools such as ping or cable
  test.
- The key inherits the permissions of the Dashboard account that
  generated it. A full-org admin key gives this plugin full-org read
  reach — create the key from a read-only organization admin.
- Cisco states the hosted server does not currently enforce the
  organization's Dashboard API IP restrictions. Its egress IPs are
  158.115.141.245, 158.115.141.238, 158.115.141.209, 158.115.133.170,
  158.115.133.139 and 158.115.133.156. Organizations whose policy
  requires IP allowlisting should not use this connection; Conduit
  offers no self-hosted Meraki route.

## Data handling

- Responses pass through Conduit and Cisco's hosted server into model
  context for the session and are not persisted by this plugin.
- **`getNetworkClients`, `getNetworkClient` and
  `getOrganizationClientsSearch` return end-user device data** —
  hostnames, MAC addresses, IPs, and usage. Hostnames routinely
  identify individuals ("sarahs-iphone"), which makes this personal
  data in most jurisdictions, not just network telemetry.
- `getNetworkApplianceFirewallL3FirewallRules` and the other firewall
  capabilities expose the customer's security posture in full. A leaked
  ruleset tells an attacker exactly what is and is not filtered.
- `getOrganizationApplianceVpnStatuses` maps inter-site topology and
  exported subnets.
- `getOrganizationAdmins` lists dashboard administrators by name and
  email address.
- All of these sit behind the one `execute_api` grant.

## Known sharp edges

- **A page is not the dataset.** `execute_api` returns one page per
  call. An audit that reads one page of a large organization and
  reports "no offline devices" is wrong. Agents must narrow with
  filters and say when results may be partial.
- **Recommended changes still need care.** A firewall ruleset
  replacement, a switch port VLAN change, an SSID auth change or an MX
  reboot can take a site offline, and the person applying it in the
  Dashboard is often working over the link the change can break. Build
  every proposal from a fresh read of current state, never from
  assumptions.
- **You cannot fix a lockout through this plugin.** Every capability
  depends on the device reaching the Meraki cloud. Treat MX and
  core-switch changes as requiring someone reachable on site.
- **The rate limit is shared with the customer.** Meraki allows 10
  requests/second per organization across *all* API callers — this
  plugin, the customer's own integrations, and any other MSP tooling.
  The hosted server backs off automatically, but a fan-out sweep across
  devices can still starve the customer's own integrations. Prefer the
  org-wide capabilities over per-device loops.
