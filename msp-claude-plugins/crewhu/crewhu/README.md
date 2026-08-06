# Crewhu Plugin

Claude Code plugin for [Crewhu](https://crewhu.com) - CSAT/NPS surveys, recognition, and gamification for MSP teams.

## What It Does

- **Survey analysis** - Recent CSAT/NPS responses, trend lines, detractor/promoter breakouts
- **Recognition** - Badge history, per-user recognition, contest management
- **Prizes** - Prize catalog, redemption history, pending redemption queue
- **Users** - List, search, and inspect Crewhu users (techs)

## Installation

```
/plugin marketplace add wyre-technology/msp-claude-plugins
/plugin install crewhu
```

The plugin connects through [Conduit](https://conduit.wyre.ai) at `https://conduit.wyre.ai/v1/crewhu/mcp`.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `X_CREWHU_APITOKEN` | Yes | Crewhu API token (sent as `X-Crewhu-Api-Token` header) |

## Skills

- `api-patterns` - Auth, pagination, error handling
- `surveys` - Primary CSAT/NPS analysis skill (detractors, promoters, trends)

## Commands

- `/search-surveys` - Search recent surveys with detractor/promoter breakout

## Tools

Provided by the Crewhu MCP server through the WYRE MCP Gateway. All 18 tools are listed directly — no navigation gating.

### Surveys
- `crewhu_surveys_list`, `crewhu_surveys_get`, `crewhu_surveys_search`
- `crewhu_surveys_detractors`, `crewhu_surveys_promoters`

### Users
- `crewhu_users_list`, `crewhu_users_get`, `crewhu_users_search`

### Badges
- `crewhu_badges_list`, `crewhu_badges_get`, `crewhu_badges_history_list`
- `crewhu_badges_user_recognition`, `crewhu_badges_update_contest` (write)

### Prizes
- `crewhu_prizes_list`, `crewhu_prizes_get`, `crewhu_prizes_history_list`
- `crewhu_prizes_user_redemptions`, `crewhu_prizes_pending_redemptions`

## License

Apache-2.0
