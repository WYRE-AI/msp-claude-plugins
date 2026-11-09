# SmileBack Plugin

Claude Code plugin for [SmileBack](https://www.smileback.com), the CSAT and NPS platform for MSPs, connected through [Conduit](https://conduit.wyre.ai).

## What It Does

- **QBR satisfaction summaries** - per-client CSAT, response rate and NPS with quarter-over-quarter change, board breakdown and representative comments
- **Detractor follow-up** - recent negative reviews and NPS detractors with ticket, board and technician context, repeat-contact and at-risk-client patterns
- **Technician and board CSAT** - per-tech and per-board satisfaction for coaching and recognition, with minimum sample sizes

The connector is **read-only**. SmileBack's Data Replication API v3 only offers read scopes, so all 12 tools are GET requests and nothing can create, change or delete data in SmileBack. Follow-up actions (call-backs, tickets, notes) are recorded in your PSA.

## Status

SmileBack is in Conduit's catalog as a hidden connector until its release is complete. If SmileBack is not in your Conduit connector list yet, it is not generally available.

## Connect SmileBack in Conduit

Conduit asks for five values:

| Field | Required | Where to find it |
|---|---|---|
| Client ID | Yes | SmileBack Account menu > **API Credentials** |
| Client Secret | Yes | Same page as the Client ID |
| Username (email) | Yes | Email of the SmileBack user Conduit signs in as |
| Password | Yes | That user's native SmileBack password |
| Region | No | `us` (default, `app.smileback.io`) or `eu` (`app.smileback.eu`) |

Use native SmileBack credentials; they work even when ConnectWise SSO is on. Pick EU only if your account is on `app.smileback.eu`. Because the username and password also sign in to the SmileBack web app, create a dedicated SmileBack user for API access.

Conduit checks the credentials against SmileBack's token endpoint when you save them and tells you if SmileBack rejects them.

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install smileback
```

This plugin ships no `.mcp.json`. Install the `wyre-gateway` plugin (or any workflow pack), which connects Claude Code to Conduit at `https://conduit.wyre.ai/v1/mcp`, then connect SmileBack in the Conduit web UI (`/connect/smileback`) as above. Conduit stores the five values and injects them as the `X-SmileBack-*` headers on every request, so there are no environment variables or headers to set on the client. Conduit drops any `X-SmileBack-*` header a client sends.

## Access Tiers and Data

- All 12 tools are classified **read** in Conduit. None is admin-gated and none writes.
- One credential reads the MSP's whole SmileBack dataset across all clients; SmileBack has no per-client scoping.
- Reviews, NPS responses, contacts and project responses contain end customers' personal data (names, emails, titles, locations, comments, marketing-permission flags). Share output only with people allowed to see it.
- Conduit does not cache SmileBack results; every call reaches SmileBack.

## Tools

| Tool | Purpose |
|---|---|
| `smileback_reviews_list` | CSAT reviews, filter by `modified_since`, optional unrated, paged |
| `smileback_reviews_list_recent` | Recent CSAT reviews, paged |
| `smileback_reviews_get` | One CSAT review |
| `smileback_nps_responses_list` | NPS responses, filter by date, campaign and score, paged |
| `smileback_nps_responses_get` | One NPS response |
| `smileback_nps_campaigns_list` | Active NPS campaigns |
| `smileback_csat_companies_list` | The MSP's end clients |
| `smileback_csat_contacts_list` | End-client people who receive surveys |
| `smileback_csat_agents_list` | Active technicians |
| `smileback_csat_boards_list` | PSA service boards |
| `smileback_project_surveys_list` | Active project surveys |
| `smileback_project_responses_list` | Project survey responses, filter by `created_since` |

SmileBack has no per-company or aggregate endpoint, so per-client CSAT and NPS are computed from individual reviews and responses. The skills explain how.

## Skills

| Skill | Description |
|---|---|
| `api-patterns` | Credentials, region, access tiers, pagination, truncation, client-side filtering, errors, rate limits |
| `csat-qbr-summary` | Per-client CSAT and NPS section for a QBR |
| `detractor-follow-up` | Triage negative reviews and NPS detractors for call-backs |
| `technician-csat` | CSAT by technician and PSA board for coaching and recognition |

## Agents

| Agent | Description |
|---|---|
| `smileback-qbr-analyst` | Builds QBR satisfaction sections for one client or a whole portfolio from a single data pull |

## Troubleshooting

- **`invalid_client`**: the Client ID or Secret is wrong, or the region is. Copy both again from Account > API Credentials.
- **`invalid_grant`**: the username or password is wrong, or the region is. Use the user's email and native SmileBack password.
- **A client has no reviews**: check the PSA sync in SmileBack before reporting "no feedback".
- **Truncated results**: lower `limit` and continue from `offset` plus `returned_items`. See the `api-patterns` skill.

## API Documentation

- [SmileBack Data Replication API v3](https://app.smileback.io/api/docs/)

## License

Apache-2.0
