# Bitwarden plugin — governance and safety model

Unofficial. Community-built plugin for the Bitwarden Public API. Not
affiliated with, endorsed by, or sponsored by Bitwarden.

## What it connects as

This plugin does not hold credentials. It reaches Bitwarden through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally.

- No Bitwarden key is stored on the technician's machine, in this repo, or
  in the model's context. The client secret is redacted from tool output.
- The credential is a Bitwarden **organization API key**. Its only scope,
  `api.organization`, is full organization admin: the same key can invite,
  revoke and remove members, change groups, collections and policies, and
  change seats. Bitwarden offers no read-only key. This plugin exposes only
  read routes, but the stored key is as powerful as an owner.
- Replacing the key is one edit at the gateway. There is no rotate action
  in the plugin: an owner rotates the key in the Bitwarden Admin Console
  (Settings > Organization info), then re-submits the Conduit connect form.
- Every call carries operator identity, so the gateway audit log answers
  "who asked for this". Bitwarden's own event log records only API activity
  by the organization key.
- Complete offboarding in the gateway console, and confirm the person no
  longer has access before you treat it as done.

## Tool permission groups

Confirm the live permission grant in the gateway access editor before you
rely on a tier in this document.

| Group | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Bitwarden state. | `bitwarden_members_list`, `bitwarden_members_get`, `bitwarden_members_list_group_ids`, `bitwarden_groups_list`, `bitwarden_groups_get`, `bitwarden_groups_list_member_ids`, `bitwarden_collections_list`, `bitwarden_collections_get`, `bitwarden_policies_list`, `bitwarden_policies_get`, `bitwarden_subscription_get` (11) |
| **Admin** | Read-only, but returns the audit event log with emails, IP addresses and device details. | `bitwarden_events_list` (1) |
| **Write** | *Empty.* | None. |
| **Delete** | *Empty.* | None. |

**This plugin is read-only.** None of the 12 tools changes anything, and
none returns vault items, passwords or other secrets. The event log sits in
the admin tier because of the personal data it carries, not because it can
change anything.

## Recommended agent policy

- Read tools: allow, including for scheduled agents.
- `bitwarden_events_list`: grant to the people and agents that run security
  reviews and offboardings. Keep its output in the ticket or report that
  needs it.
- Remediation (revoking members, enabling policies, rotating credentials):
  agents recommend, people act in the Admin Console. Nothing here can do it.

## What it cannot reach

- Only the one Bitwarden organization the connected key belongs to. Each
  client organization has its own key.
- Vault items, passwords, notes and attachments: the Public API does not
  return them. Collection and item names are encrypted, so collections and
  items appear by ID.
- Self-hosted Bitwarden.
- No filesystem, no shell, no other vendor's data.

## Data handling

- Responses pass through the gateway into model context for the session and
  are not persisted by this plugin.
- `bitwarden_members_*` returns names and email addresses.
- `bitwarden_events_list` returns IP addresses, device types and the
  activity of named people. Treat it as security and HR-sensitive.

## Known sharp edges

- **Large organizations can truncate.** The member, group and collection
  lists are not paged by Bitwarden, and the tool output is capped. A
  truncated list is marked `truncated: true`; counts built on it are
  partial.
- **A leaked key is an admin compromise.** Because the key cannot be scoped
  down, any suspicion of exposure means rotating it at Bitwarden first.
