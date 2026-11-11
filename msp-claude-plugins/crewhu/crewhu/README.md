# Crewhu Plugin

Claude Code plugin for [Crewhu](https://crewhu.com) - CSAT/NPS surveys, recognition, and gamification for MSP teams.

## What It Does

- **Survey analysis** - Recent CSAT/NPS responses, trend lines, detractor/promoter breakouts
- **Recognition** - Badge history, per-user recognition, contest management
- **Prizes** - Prize catalog, redemption history, pending redemption queue
- **Users** - List, search, and inspect Crewhu users (techs)

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install crewhu
```

The plugin connects through [Conduit](https://conduit.wyre.ai) at `https://conduit.wyre.ai/v1/crewhu/mcp`. Your MCP client authenticates to Conduit with OAuth (it prompts you to sign in on first use); there are no environment variables or headers to configure on the client.

## Configuration

Connect Crewhu once in the Conduit web UI (**Connections → Crewhu**). Conduit stores the token and injects it on every request:

| Field | Required | Description |
|-------|----------|-------------|
| API Token | Yes | Crewhu API token |

> The Crewhu connector is currently hidden in the Conduit catalog. Until it is unhidden, only orgs it has been enabled for can connect it.

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
