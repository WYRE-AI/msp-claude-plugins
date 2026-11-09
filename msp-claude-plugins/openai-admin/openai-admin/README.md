# OpenAI Admin Plugin

Claude Code plugin for the [OpenAI Admin API](https://platform.openai.com/docs/api-reference/administration):
a read-only review of a client's OpenAI organization through the WYRE
Conduit gateway.

## What It Does

- **Seat inventory** - organization members and roles, pending and expired invites, project members, service accounts
- **Key inventory** - project API keys and Admin keys with owner and last-used dates, including keys left behind by removed users
- **Spend review** - daily cost and token usage by project, user, model, or key, for chargeback, QBRs, and spike investigation
- **Security review** - audit log of logins, membership and role changes, and key and project lifecycle; mTLS certificate expiry
- **Capacity** - per-project, per-model rate limits for explaining 429s

## Read-Only

All 30 tools are GETs against `https://api.openai.com/v1`. Nothing in
this plugin can invite or remove a user, create or revoke a key, change
a project, or raise a limit. Those changes are made by an organization
owner in the OpenAI dashboard; the skills say what to change and where.

**Five tools are admin-gated in Conduit.** They only read, but they
expose credential inventory and the audit trail, so Conduit requires the
`admin` tier on OpenAI Admin to call them:

- `openai_admin_project_api_keys_list`, `openai_admin_project_api_key_get`
- `openai_admin_admin_api_keys_list`, `openai_admin_admin_api_key_get`
- `openai_admin_audit_logs_list`

With a `read` grant you get seats, projects, usage, cost, rate limits,
and certificates (25 tools), and the key and audit parts of a review are
reported as not collected. See [GOVERNANCE.md](GOVERNANCE.md).

## Connect

OpenAI Admin connects through [Conduit](https://conduit.wyre.ai). The
connector may not appear in every Conduit catalog yet while it rolls out.

1. An organization **owner** in the client's OpenAI organization creates
   an Admin key at
   [platform.openai.com/settings/organization/admin-keys](https://platform.openai.com/settings/organization/admin-keys).
   A project key (`sk-proj-...`) will not work.
2. In Conduit, add the **OpenAI Admin** connector and paste the key into
   the **Admin Key** field (`sk-admin-...`).
3. Conduit checks the key against OpenAI before saving it.

| Field | Header | Required |
|-------|--------|----------|
| Admin Key | `X-OpenAI-Admin-Key` | Yes |

**Admin keys are full org-admin credentials.** OpenAI has no read-only
Admin key, so the key you paste could change the organization even
though Conduit only reads. Create a **dedicated** Admin key for Conduit
so you can revoke it on its own.

One connection reaches one OpenAI organization (the one the key belongs
to). Clients that are projects inside one organization are reviewed
from that organization's connection; a client with its own organization
needs its own Admin key.

### Using `.mcp.json` directly

The plugin's `.mcp.json` points at
`https://conduit.wyre.ai/v1/openai-admin/mcp` and fills the header from
an environment variable:

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_ADMIN_KEY` | Yes | OpenAI Admin key, sent as `X-OpenAI-Admin-Key` |

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install openai-admin
```

## Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | Auth via Conduit, the admin-gated tools, list cursors vs usage page tokens, truncated pages, errors and 429s |
| `seat-key-inventory` | Members, invites, projects, service accounts, and keys; reconciling against the client's staff list |
| `spend-review` | Cost and usage by project, user, model, or key; month-over-month; spike attribution; rate-limit headroom |
| `security-review` | Offboarding, periodic access review, "who created this key", leaked-key response, certificate expiry |

## Agents

| Agent | Description |
|-------|-------------|
| `openai-org-reviewer` | Monthly or QBR review of one client's OpenAI organization: spend, seats, keys, and audit findings in one client-ready report |

## Tools

All 30 tools come from the openai-admin-mcp server through Conduit.

- **Seats**: `openai_admin_users_list`, `openai_admin_user_get`, `openai_admin_invites_list`, `openai_admin_invite_get`
- **Projects**: `openai_admin_projects_list`, `openai_admin_project_get`, `openai_admin_project_users_list`, `openai_admin_project_user_get`, `openai_admin_project_service_accounts_list`, `openai_admin_project_service_account_get`, `openai_admin_project_rate_limits_list`
- **Keys** (admin-gated): `openai_admin_project_api_keys_list`, `openai_admin_project_api_key_get`, `openai_admin_admin_api_keys_list`, `openai_admin_admin_api_key_get`
- **Audit** (admin-gated): `openai_admin_audit_logs_list`
- **Certificates**: `openai_admin_certificates_list`, `openai_admin_certificate_get`, `openai_admin_project_certificates_list`
- **Usage**: `openai_admin_usage_completions`, `openai_admin_usage_embeddings`, `openai_admin_usage_moderations`, `openai_admin_usage_images`, `openai_admin_usage_audio_speeches`, `openai_admin_usage_audio_transcriptions`, `openai_admin_usage_vector_stores`, `openai_admin_usage_code_interpreter_sessions`, `openai_admin_usage_file_search_calls`, `openai_admin_usage_web_search_calls`
- **Cost**: `openai_admin_costs`

## Troubleshooting

- **"This is not an OpenAI Admin key"**: the key is a project key or not an OpenAI key. Create an Admin key as an organization owner.
- **401 / 403 from OpenAI**: the Admin key was revoked or lacks permission. Create a new one and reconnect in Conduit.
- **A key or audit tool is denied by Conduit**: your grant on OpenAI Admin is `read`; those five tools need `admin`.
- **`truncated: true` in a result**: repeat the call with a smaller `limit`. Do not page on from that response's cursors.
- **429**: wait the retry time in the error message and retry once.

## License

Apache-2.0
