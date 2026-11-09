# Dubber Plugin

Claude plugin for [Dubber](https://developer.dubber.net/), the cloud call-recording and
compliance platform, through the Conduit gateway. It is backed by
[`WYRE-AI/dubber-mcp`](https://github.com/WYRE-AI/dubber-mcp), which exposes 37 flat tools
over Dubber's groups, accounts, recordings, users, REST-hook notifications and Dub.Points.

**Preview.** Dubber is in the Conduit catalog as a preview vendor. The connector is
shipped and wired, but no customer has finished a live tool call with a real Dubber
credential set yet. Until one does, treat tool behaviour against production regions as
unconfirmed.

## What an MSP uses it for

| Job | Skill | Main tools |
|---|---|---|
| Prove call capture is working for each line and user | `recording-coverage` | `dubber_dub_points_list`, `dubber_recordings_list`, `dubber_groups_list_unidentified_recordings` |
| Find calls for a complaint, dispute or QA review, then tag them | `call-retrieval` | `dubber_recordings_list`, `dubber_recordings_get`, `dubber_recordings_add_tags` |
| Add, change or remove Dubber users during on/offboarding | `user-lifecycle` | `dubber_users_list`, `dubber_users_create`, `dubber_users_update`, `dubber_users_delete` |
| Auth, paging, errors, rate limits, write confirmation | `api-patterns` | `dubber_test_connection`, `dubber_profile_get` |

The `recording-compliance-auditor` agent runs the coverage audit across several accounts
and writes one report.

## Setup

Connect **Dubber** in Conduit. The connect form asks for:

| Conduit field | Required | Where to get it | Header Conduit sends |
|---|---|---|---|
| Client ID | Yes | Mashery application key, from your app at developer.dubber.net | `X-Dubber-Client-Id` |
| Client Secret | Yes | Mashery application secret | `X-Dubber-Client-Secret` |
| Auth ID | Yes | Dubber portal, **API** tab (not a login username) | `X-Dubber-Auth-Id` |
| Auth Token | Yes | Dubber portal, **API** tab | `X-Dubber-Auth-Token` |
| Region | No | Sandbox, United States, Australia, Europe or United Kingdom | `X-Dubber-Region` |

Region defaults to **Sandbox** when left blank. Production customers must pick the region
their Dubber tenant lives in; the wrong region talks to a different tenant or fails. On
save, Conduit checks the credentials by minting a Dubber token against the selected
region. See the [dubber-mcp credentials guide](https://github.com/WYRE-AI/dubber-mcp#credentials).

### Claude Code

`.mcp.json` points at `https://conduit.wyre.ai/v1/dubber/mcp` and sends the five
`X-Dubber-*` headers from these environment variables:

| Variable | Header |
|---|---|
| `DUBBER_CLIENT_ID` | `X-Dubber-Client-Id` |
| `DUBBER_CLIENT_SECRET` | `X-Dubber-Client-Secret` |
| `DUBBER_AUTH_ID` | `X-Dubber-Auth-Id` |
| `DUBBER_AUTH_TOKEN` | `X-Dubber-Auth-Token` |
| `DUBBER_REGION` | `X-Dubber-Region` (`sandbox`, `us`, `au`, `eu` or `uk`) |

## Tools and Conduit permission tiers

Conduit classifies every tool as read, write or admin. A Conduit member can only call
tools at or below their granted tier.

| Tier | Tools |
|---|---|
| Read | `dubber_test_connection`, `dubber_profile_get`, `dubber_groups_get`, `dubber_groups_list_unidentified_recordings`, `dubber_accounts_get`, `dubber_recordings_list`, `dubber_recordings_get`, `dubber_recordings_get_waveform`, `dubber_recordings_get_upload_target`, `dubber_users_list`, `dubber_users_get`, `dubber_notifications_list`, `dubber_notifications_get`, `dubber_notifications_list_unclaimed`, `dubber_dub_points_list`, `dubber_dub_points_get`, `dubber_dub_points_find` |
| Write | `dubber_groups_create_child`, `dubber_groups_create_unidentified_recording`, `dubber_accounts_create`, `dubber_accounts_update`, `dubber_recordings_create`, `dubber_recordings_update_metadata`, `dubber_recordings_add_tags`, `dubber_recordings_delete_tags`, `dubber_recordings_delete`, `dubber_recordings_initiate_multipart_upload`, `dubber_recordings_complete_upload`, `dubber_users_create`, `dubber_users_update`, `dubber_notifications_create`, `dubber_notifications_update`, `dubber_notifications_activate`, `dubber_notifications_delete`, `dubber_dub_points_create` |
| Admin | `dubber_users_delete`, `dubber_oauth_revoke_token` |

`dubber_recordings_delete` is write tier in Conduit, but it permanently destroys the audio
and its compliance record. Restrict it with a Conduit tool allowlist if technicians with
write access should not be able to delete recordings.

Five tools ask for confirmation before acting: `dubber_recordings_delete`,
`dubber_recordings_delete_tags`, `dubber_users_delete`, `dubber_notifications_delete` and
`dubber_oauth_revoke_token`. Conduit connects without an interactive prompt, so these tools
refuse unless the call passes `confirm_destructive_action: true`. Only pass it after the
user has agreed in the conversation.

## Limitations

- There is no tool to list every account or group. You need an account ID (or a group ID)
  to start; get it from the Dubber portal.
- The plugin cannot play or download audio. `dubber_recordings_get` returns metadata,
  tags and duration; listening happens in the Dubber portal.
- Dubber has no date filter on recordings. `dubber_recordings_list` filters on
  `start_time` itself after fetching pages, and scans at most 2,500 recordings per call.
- `dubber_dub_points_list`, `dubber_users_list` and `dubber_notifications_list` return a
  single Dubber page and take no paging arguments.
- Only account-scoped notification subscriptions are exposed, not group-scoped ones.

## License

Apache-2.0
