# myITprocess Plugin

Claude Code plugin for [Kaseya myITprocess](https://www.myitprocess.com), the
vCIO platform MSPs use for alignment reviews, findings, strategic roadmaps and
client business reviews.

## What It Does

- **Alignment-review prep** - what the next review for a client should cover
  (overdue standards categories), which open reviews are late with the engineer
  or the vCIO, and which clients are overdue for a review
- **Roadmap and budget** - open recommendations by status and priority, budget
  and hours by month or quarter, initiatives, and review gaps that never became
  recommendations
- **QBR prep** - a one-client brief built from the upcoming meeting, its agenda
  recommendations, alignment score, roadmap and open gaps
- **Portfolio views** - alignment scores, review staleness, upcoming meetings
  and reviewer workload across all clients

**Read-only.** The myITprocess public API has no write endpoints, so this plugin
cannot create or change reviews, recommendations, initiatives or meetings.
Those edits are made in myITprocess.

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install myitprocess
```

The plugin connects through [Conduit](https://conduit.wyre.ai) at
`https://conduit.wyre.ai/v1/myitprocess/mcp`.

## Connecting myITprocess in Conduit

Conduit asks for one field:

| Field | Required | Sent as |
|-------|----------|---------|
| API Key | Yes | `X-MyITprocess-Api-Key` header |

1. In myITprocess, go to **My Account > Account Settings > API Keys > Add API key**.
2. Copy the key right away; myITprocess masks it after you save it.
3. Paste it into the myITprocess connector in Conduit. Conduit checks it against
   the myITprocess API before saving.

Things to know about the key:

- It covers your **whole MSP account**, every client, and can be revoked from
  the same API Keys screen.
- myITprocess allows **50 API requests per minute per account**, shared with
  every other integration using that key.

If myITprocess does not appear in your Conduit catalog yet, the connector is
still rolling out.

### Claude Code `.mcp.json`

| Variable | Required | Description |
|----------|----------|-------------|
| `MYITPROCESS_API_KEY` | Yes | myITprocess API key (sent as the `X-MyITprocess-Api-Key` header) |

```bash
export MYITPROCESS_API_KEY="your-myitprocess-api-key"
```

## Tools

Nine list tools, one per endpoint in the myITprocess public API. All are
classified **read** in Conduit; **none is admin-gated and none writes**. Any
member with access to the connector can call all nine, including the findings
list, which can describe security gaps at your clients.

| Tool | What it lists |
|------|---------------|
| `myitprocess_clients_list` | Clients with alignment score, last review date, last member activity |
| `myitprocess_reviews_list` | Alignment reviews with status, engineer/vCIO and due dates |
| `myitprocess_reviews_overdue_categories_list` | Standards categories up for review or overdue, per client |
| `myitprocess_users_list` | Your own myITprocess staff, role and last login |
| `myitprocess_initiatives_list` | Roadmap initiatives |
| `myitprocess_findings_list` | Findings from reviews |
| `myitprocess_meetings_list` | Client meetings (QBRs, strategy meetings) |
| `myitprocess_recommendations_list` | Roadmap recommendations with budget, hours, status, priority |
| `myitprocess_recommendations_configurations_list` | IT Glue configurations attached to one recommendation |

Every tool takes `page`, `page_size` (max 100), `filters` and `sort`, and
returns one page at a time.

## Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | Auth via Conduit, shared filter/sort/paging parameters, rate limit, errors |
| `alignment-reviews` | Review pipeline, late reviews, overdue categories, clients due for review |
| `roadmap` | Findings, recommendations, initiatives, configurations, budget forecast |
| `qbr-prep` | One-client QBR brief and a meetings calendar across clients |

## Agents

| Agent | Description |
|-------|-------------|
| `vcio-review-prep` | Joins clients, reviews, findings, recommendations, initiatives and meetings into a review or QBR brief, or a portfolio sweep |

## Troubleshooting

- **HTTP 401 / 403** - the key is revoked or mistyped. Create a new key and
  update the connector in Conduit.
- **HTTP 429** - the account-wide 50 requests per minute is used up, possibly by
  another integration. Wait and retry with fewer, filtered calls.
- **HTTP 400 on a filter** - check the field and predicate; the error lists
  rejected fields.

## API Documentation

- [myITprocess public API spec (OpenAPI)](https://reporting.live.myitprocess.com/docs/v1.yaml)
- [Creating an API key](https://help.myitprocess.kaseya.com/help/index_CSH.htm#1385)

## License

Apache-2.0
