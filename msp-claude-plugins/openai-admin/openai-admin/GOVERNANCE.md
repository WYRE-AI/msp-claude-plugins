# OpenAI Admin plugin — governance and safety model

Unofficial. Community-built plugin for the OpenAI Admin API. Not
affiliated with, endorsed by, or sponsored by OpenAI.

## What it connects as

This plugin does not hold credentials. It reaches OpenAI through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`),
which stores the client's OpenAI Admin key centrally and sends it to the
openai-admin-mcp server as the `X-OpenAI-Admin-Key` header.

- The Admin key is not stored on the technician's machine, in this repo,
  or in the model's context. Tool output and errors redact it.
- The key is resolved per OpenAI organization: one connection, one
  organization.
- Every call carries operator identity, so the Conduit audit log answers
  "who pulled this client's key inventory". OpenAI's own audit log
  records only the Admin key.
- Replacing the key is one edit in Conduit: re-submit the connect form.

**The stored credential is stronger than the plugin.** OpenAI has no
read-only Admin key. The key Conduit holds can invite and remove users,
create projects, and delete keys through the OpenAI API, even though the
openai-admin-mcp server only issues GETs against a fixed host. Ask the
client's organization owner for a dedicated Admin key for Conduit, named
so it is recognisable in their key list, and revoke it on its own when
the engagement ends.

## Tool permission groups

Confirm the live permission grant in the Conduit access editor before you
rely on a tier in this document. This note does not describe gateway
enforcement internals.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change OpenAI state. | `read` | Members, invites, projects, project members, service accounts, project rate limits, certificates, the ten usage tools, and `openai_admin_costs` (25) |
| **Sensitive read** | Cannot change OpenAI state; exposes credential inventory and the audit trail. | `admin` | `openai_admin_project_api_keys_list`, `openai_admin_project_api_key_get`, `openai_admin_admin_api_keys_list`, `openai_admin_admin_api_key_get`, `openai_admin_audit_logs_list` (5) |
| **Write** | *Empty.* | — | None. |
| **Delete** | *Empty.* | — | None. |

**Every tool is read-only.** The `admin` tier here gates sensitivity,
not mutation: granting it lets an agent see which keys exist, who owns
them, when they were last used, and the organization's audit events. It
does not let anything change in OpenAI.

## Recommended agent policy

- `read` tier: safe for autonomous spend and seat reporting.
- `admin` tier: grant to the people and agents that run access reviews
  and offboarding. Key metadata and audit events are what an attacker
  would use to pick a target; they do not belong in a channel the client
  has not agreed to.
- Remediation (revoke, remove, cancel) is always a human action in the
  OpenAI dashboard. Agents propose it; nothing here can perform it.

## What it cannot reach

- Only the OpenAI organization the connected Admin key belongs to.
- No ChatGPT workspace administration (ChatGPT Team / Enterprise seats
  are a separate product).
- No conversation content, prompts, completions, files, or vector store
  contents. Usage tools return counts, not data.
- No secret key values. Key tools return metadata and a redacted hint.
- No live feed. Every tool is point-in-time.

## Data handling

- Responses pass through Conduit into model context for the session and
  are not persisted by this plugin.
- Member and invite tools return names and email addresses. Usage and
  cost grouped by `user_id` attributes spend to named people; treat a
  per-person spend table as HR-adjacent and share it with the client
  contact, not the whole client.
- The audit log includes failed-login events and actor emails.

## Known sharp edges

- **The Conduit key is in the inventory.** It appears in
  `openai_admin_admin_api_keys_list` with a recent `last_used_at`. Exclude
  it explicitly from "unknown Admin keys" findings.
- **Ungrouped usage cannot be attributed.** Usage and cost rows only
  carry project, user, or key IDs when grouped by them.
- **Truncated pages keep their cursors.** A `truncated: true` page must be
  re-requested with a smaller `limit`; paging on skips items.
- **Audit logging may be off.** An error or an empty audit log is a
  finding, not a clean bill of health.
