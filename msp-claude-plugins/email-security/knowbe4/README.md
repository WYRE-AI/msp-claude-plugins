# KnowBe4 Security Awareness Plugin

Claude Code plugin for KnowBe4 security awareness training and phishing simulation integration.

## Overview

This plugin provides Claude with deep knowledge of KnowBe4, enabling:

- **Phishing Simulations** - Campaign management, security test tracking, click rate analysis
- **Training Campaigns** - Enrollment workflows, completion tracking, content management
- **User Management** - User lifecycle, group membership, risk score tracking
- **Reporting** - Security awareness metrics, trend analysis, executive dashboards

## Configuration

### Claude Code Settings (Recommended)

Add your credentials to `~/.claude/settings.json` (user scope, encrypted on macOS):

```json
{
  "env": {
    "KNOWBE4_API_KEY": "your-api-token",
    "KNOWBE4_REGION": "US"
  }
}
```

For project-specific configuration, use `.claude/settings.local.json` (gitignored):

```json
{
  "env": {
    "KNOWBE4_API_KEY": "your-api-token",
    "KNOWBE4_REGION": "US"
  }
}
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `KNOWBE4_API_KEY` | Yes | | API token from KnowBe4 console |
| `KNOWBE4_REGION` | Yes | `US` | Account region: `US`, `EU`, `CA`, `UK`, `DE` |
| `KNOWBE4_MCP_URL` | No | `https://knowbe4-mcp.wyre.workers.dev/mcp` | MCP server URL -- override to use a self-hosted gateway |

## Self-Hosted Gateway

If you run the [mcp-gateway](https://github.com/WYRE-AI/mcp-gateway), set `KNOWBE4_MCP_URL` to your gateway's endpoint:

```
KNOWBE4_MCP_URL=https://your-gateway-domain/v1/knowbe4/mcp
```

**Setting env vars in Claude.ai:** Go to your org > Settings > Integrations > KnowBe4 > Configure and add the variable.

**Setting env vars in Claude Code:** Add to `~/.claude/settings.json`:
```json
{
  "env": {
    "KNOWBE4_MCP_URL": "https://your-gateway-domain/v1/knowbe4/mcp"
  }
}
```

### Obtaining API Credentials

1. **Get Your API Token**
   - Log into the KnowBe4 console as an admin
   - Navigate to **Account Settings > API > API Token**
   - Click **Generate Token** (or copy your existing token)
   - The token provides read access to your account data

2. **Determine Your Region**
   - Check the URL when logged into KnowBe4:
     - `training.knowbe4.com` = **US**
     - `eu.knowbe4.com` = **EU**
     - `ca.knowbe4.com` = **CA**
     - `uk.knowbe4.com` = **UK**
     - `de.knowbe4.com` = **DE**

### Testing Your Connection

Once configured in Claude Code settings, test the connection:

```bash
# Test with curl (env vars must be set)
curl -H "Authorization: Bearer ${KNOWBE4_API_KEY}" \
     "https://${KNOWBE4_REGION,,}.api.knowbe4.com/v1/account"
```

### API Documentation

- [KnowBe4 Reporting API Documentation](https://developer.knowbe4.com/)
- [API Authentication Guide](https://developer.knowbe4.com/rest/reporting#tag/Authentication)

## Installation

1. Clone this plugin to your Claude plugins directory
2. Configure environment variables
3. The MCP server will be automatically started when needed

## MCP Tool Surface

The connector registers **34 tools**, and **every one of them is a GET**.
There is no tool that launches a campaign, enrolls a user, or edits a
record — see [GOVERNANCE.md](GOVERNANCE.md) for why that read-only
property is worth relying on, and for the fact that Conduit does not yet
classify this vendor (so all of these currently enforce at tier `admin`).

| Domain | Tools |
|---|---|
| Account | `knowbe4_account_get`, `knowbe4_account_risk_score_history` |
| Users | `knowbe4_users_list`, `knowbe4_users_get`, `knowbe4_users_risk_score_history` |
| Groups | `knowbe4_groups_list`, `knowbe4_groups_get`, `knowbe4_groups_members`, `knowbe4_groups_risk_score_history` |
| Phishing | `knowbe4_phishing_campaigns_list`, `knowbe4_phishing_campaigns_get`, `knowbe4_phishing_campaign_tests`, `knowbe4_phishing_security_tests_list`, `knowbe4_phishing_security_test_get`, `knowbe4_phishing_security_test_recipients`, `knowbe4_phishing_security_test_recipient` |
| Training | `knowbe4_training_campaigns_list`, `knowbe4_training_campaigns_get`, `knowbe4_training_enrollments_list`, `knowbe4_training_enrollments_get`, `knowbe4_store_purchases_list`, `knowbe4_store_purchases_get`, `knowbe4_policies_list`, `knowbe4_policies_get` |
| Reporting | `knowbe4_reporting_phishing_summary`, `knowbe4_reporting_training_summary`, `knowbe4_reporting_risk_overview` |
| Discovery | `knowbe4_status`, `knowbe4_navigate`, `knowbe4_back` |
| Lazy-loading only | `knowbe4_list_categories`, `knowbe4_list_category_tools`, `knowbe4_execute_tool`, `knowbe4_router` |

The last four exist only when the server runs with `LAZY_LOADING=true`; in
the default flattened mode the full list is advertised directly and they
are absent. `knowbe4_navigate` and `knowbe4_back` are refused by the
gateway before any permission check — use `conduit__my_access` instead.

### Capabilities this plugin does not have

Requests along these lines come up constantly, and each one needs a
different answer rather than a nearby tool:

| Asked for | Reality |
|---|---|
| PhishER triage, purge, sender blocking | PhishER is a separate KnowBe4 product and none of it is exposed here |
| Browse phishing templates | No template tool. Campaign and test records name the template used, so after-the-fact comparison works; browsing does not |
| Browse the training module catalog | No module tool. `knowbe4_store_purchases_list` shows purchased ModStore content, which is a different question |
| A user's event history | No per-user event feed. Behavioural detail lives in per-PST recipient records |
| PPP trend over time | No trend tool. Build it from each test's `phish_prone_percentage` and date — account risk score is a different measure and is not a substitute |
| Metrics broken down by department | No department reporting. Aggregate the `department` field from `knowbe4_users_list`; KnowBe4 groups are not departments |
| Filter a list by status or date | Only `knowbe4_users_list` filters (by `status` and `group_id`). Everything else is paginate-and-filter client-side |

## Available Skills

| Skill | Description |
|-------|-------------|
| `phishing` | Phishing simulation campaign management and tracking |
| `training` | Training campaign enrollment and completion workflows |
| `users` | User lifecycle, group management, and risk scores |
| `reporting` | Security awareness metrics and trend analysis |
| `api-patterns` | KnowBe4 API authentication, regions, and rate limits |

## Available Commands

| Command | Description |
|---------|-------------|
| `/phishing-results` | View phishing campaign results and click rates |
| `/training-status` | Check training completion status for users/groups |
| `/user-risk` | Get risk score and history for a user |
| `/campaign-summary` | Get summary of recent phishing and training campaigns |
| `/group-report` | Get security awareness metrics for a group |

## API Documentation

- [KnowBe4 Reporting API](https://developer.knowbe4.com/)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.
