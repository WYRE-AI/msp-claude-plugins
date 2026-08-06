---
name: "Proofpoint People"
description: >
  Proofpoint People-Centric Security fundamentals: Very Attacked People (VAP)
  reports, attack index scoring, click susceptibility, top clickers, and user risk
  categorization for targeting security controls and training.
when_to_use: >-
  When identifying high-risk or heavily targeted users, analyzing click behavior, or working with
  VAP/attack-index data in Proofpoint. Use when: proofpoint people, very attacked people, vap
  report, proofpoint vap, top clickers, user risk, attack index, proofpoint user risk, high risk
  users, most attacked users, user threat profile, people-centric security, or proofpoint risk
  score.
---

# Proofpoint People-Centric Security

## Overview

Proofpoint People-Centric Security provides user-level threat analytics that identify which individuals in your organization are most targeted by attacks and most susceptible to clicking on threats. This data enables MSPs to implement targeted security controls, prioritize security awareness training, and apply adaptive authentication policies for the highest-risk users.

The core concept is that people - not infrastructure - are the primary target of modern email attacks. By understanding who is targeted and who clicks, you can focus security resources where they have the most impact.

## Anti-triggers

- **Simulated-phishing risk scores** — KnowBe4 also reports a per-user
  "risk score" and a click rate, but those measure tests the MSP sent
  deliberately. Attack Index and VAP count real attacks. For simulation
  performance use `knowbe4-users`.
- **Enrolling a high-risk user in awareness training** — this skill
  identifies who needs it; the enrollment itself is
  `knowbe4-training`.
- **The individual threat events behind a user's Attack Index** — use
  `proofpoint-tap`, and `proofpoint-threat-intel` for the campaigns
  named in `topCampaigns`.

## Key Concepts

### Very Attacked People (VAP)

VAPs are users who receive a disproportionately high volume of sophisticated attacks. VAP status is determined by:
- **Attack volume** - Total number of threats targeting the user
- **Attack sophistication** - Complexity and novelty of attacks
- **Attack diversity** - Variety of threat actors and campaigns targeting the user

VAPs are typically executives, finance personnel, IT administrators, and people with external-facing email addresses.

### Attack Index

The Attack Index is a composite score (0-1000+) that quantifies the severity of threats targeting a user. It factors in:

| Component | Weight | Description |
|-----------|--------|-------------|
| Volume | Medium | Number of threats received |
| Sophistication | High | How advanced the attacks are |
| Actor reputation | High | Whether known threat actors are involved |
| Threat type mix | Medium | Diversity of attack types (phish, malware, BEC) |

Higher Attack Index = more severe threats targeting the user.

### Click Susceptibility

| Metric | Description | Range |
|--------|-------------|-------|
| `clickRate` | Percentage of threats the user clicked on | 0-100% |
| `clickCount` | Total number of malicious clicks | Integer |
| `uniqueThreatsClicked` | Distinct threats clicked | Integer |
| `lastClickTime` | Most recent click on a threat | Datetime |

### User Risk Categories

| Category | Attack Index | Click Rate | Action |
|----------|-------------|------------|--------|
| **Very High Risk** | > 500 | > 10% | Isolate browsing, MFA everywhere, priority training |
| **High Risk** | 200-500 | 5-10% | Enhanced email filtering, additional MFA |
| **Medium Risk** | 50-200 | 2-5% | Standard controls, regular training |
| **Low Risk** | < 50 | < 2% | Baseline controls |

## Field Reference

### VAP Report Fields

| Field | Type | Description |
|-------|------|-------------|
| `identity` | object | User identity details |
| `identity.emails` | string[] | User email addresses |
| `identity.name` | string | User display name |
| `identity.department` | string | User department |
| `identity.title` | string | User job title |
| `identity.vip` | boolean | Whether the user is flagged as VIP |
| `attackIndex` | int | Composite attack severity score |
| `threatStatistics` | object | Breakdown of threats by type |
| `threatStatistics.totalThreats` | int | Total threats received |
| `threatStatistics.malwareCount` | int | Malware threats received |
| `threatStatistics.phishCount` | int | Phishing threats received |
| `threatStatistics.impostorCount` | int | BEC/impostor threats received |
| `families` | string[] | Threat families targeting this user |
| `topCampaigns` | object[] | Most significant campaigns targeting this user |

### Top Clickers Fields

| Field | Type | Description |
|-------|------|-------------|
| `identity` | object | User identity details |
| `clickStatistics` | object | Click activity breakdown |
| `clickStatistics.clickCount` | int | Total malicious clicks |
| `clickStatistics.permitCount` | int | Clicks that were permitted |
| `clickStatistics.blockCount` | int | Clicks that were blocked |
| `clickStatistics.clickRate` | float | Click-through rate on threats |
| `clickStatistics.uniqueThreats` | int | Distinct threats clicked |
| `clickStatistics.lastClick` | datetime | Most recent click time |
| `clickStatistics.classifications` | object | Breakdown by malware, phish |

### User Risk Profile Fields

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | User email address |
| `riskScore` | int | Overall risk score (0-1000) |
| `attackIndex` | int | Attack severity targeting this user |
| `clickRate` | float | Historical click-through rate |
| `riskCategory` | string | `very_high`, `high`, `medium`, `low` |
| `vulnerabilityFactors` | string[] | Contributing risk factors |
| `recommendedActions` | string[] | Suggested remediation steps |
| `trainingStatus` | object | Security awareness training completion |

## MCP Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `proofpoint_people_get_vap` | Very Attacked People report — users ranked by attack index | `window`, `page`, `size` |
| `proofpoint_people_get_top_clickers` | Users who clicked the most threat URLs | `window`, `page`, `size` |
| `proofpoint_people_get_user_risk` | Risk score and attack details for one user | `email` (required), `window` |

Three tools, all read-only. **The People domain changes nothing** — there
is no write tool on this server at all.

### Not available through this plugin

- **A separate attack-index ranking.** The attack index *is* the ranking
  `proofpoint_people_get_vap` returns; there is no second tool for it, and
  no `department` filter anywhere. Departmental comparison means pulling
  the VAP list and grouping it yourself against your own roster.
- **Anything to do with VIP flags.** No tool lists VIPs and none sets one.
  **VAP and VIP are different concepts** and the similarity of the acronyms
  is the trap: VAP is computed by Proofpoint from attack volume, VIP is an
  administrator-assigned protection flag. This plugin can read the first
  and cannot see or touch the second. Set VIP flags in the Proofpoint
  console.

## Common Workflows

### Generate VAP Report

1. Call `proofpoint_people_get_vap` with `window=30` and `size=20`
2. Review the top 20 most attacked users
3. Cross-reference with organizational role - are they executives, finance, IT?
4. For each VAP, check their click rate using `proofpoint_people_get_user_risk`
5. Prioritize users who are both heavily targeted and have high click rates
6. Recommend additional controls for the highest-risk users

### Identify Training Candidates

1. Call `proofpoint_people_get_top_clickers` with `window=90` and `size=50`
2. Identify users with the highest click rates
3. Check if they have completed recent security awareness training
4. Enroll high-clickers in targeted phishing simulation campaigns
5. Follow up after training to measure improvement

### Executive Risk Assessment

1. Bring your own list of executives — the VIP flag is not readable here,
   so the roster comes from the customer's HR or directory data, not from
   Proofpoint
2. For each, call `proofpoint_people_get_user_risk` with their email
3. Assess attack index and click susceptibility
4. Recommend enhanced controls: browser isolation, advanced MFA, dedicated monitoring
5. Present risk summary to leadership

### Department Risk Comparison

1. Call `proofpoint_people_get_vap` with a large `size` to get the ranked
   attack-index list — there is no `department` filter
2. Join the returned users against your own department roster
3. Compare average attack index across departments
4. Identify which departments are most targeted
5. Allocate security resources proportionally

### New User Baseline

1. After a new user is onboarded, wait 30 days
2. Call `proofpoint_people_get_user_risk` with the user's email
3. Establish baseline risk score and attack index
4. If the user is immediately targeted (high attack index), investigate why
5. Ensure appropriate training has been completed

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid window | Use 14, 30, or 90 for the window parameter |
| 400 | Invalid size | Size must be between 1 and 1000 |
| 401 | Authentication failed | Verify service principal and secret |
| 403 | People API not enabled | Ensure your license includes People-Centric Security |
| 404 | User not found | The email address may not exist in Proofpoint |
| 429 | Rate limit exceeded | Implement backoff |

### No VAP Data

- New organizations may not have enough data for VAP reports (requires 14+ days)
- Very small organizations may not have enough volume for meaningful rankings
- Check that email flow is routing through Proofpoint correctly

## Best Practices

1. **Review VAP reports monthly** - Attack patterns shift; update your high-risk user list regularly
2. **Combine attack index with click rate** - A user who is heavily attacked AND clicks frequently is highest priority
3. **Flag executives as VIP** - Ensure C-suite and board members have the VIP flag for enhanced protection
4. **Use department data for budgeting** - Show leadership which departments need the most security investment
5. **Track click rates over time** - Measure the effectiveness of security awareness training
6. **Implement adaptive controls** - Apply stricter policies (browser isolation, MFA step-up) for high-risk users
7. **Don't blame users** - Use click data to improve training, not to punish users
8. **Correlate with HR data** - Cross-reference VAP data with job function to understand targeting patterns
9. **Automate VIP management** - Sync VIP flags with your HR system for executives and key personnel
10. **Report to leadership quarterly** - Present people risk metrics alongside infrastructure security metrics

## Related Skills

- [Proofpoint TAP](../tap/SKILL.md) - Threat events and click tracking
- [Proofpoint Threat Intelligence](../threat-intel/SKILL.md) - Campaigns targeting your users
- [Proofpoint URL Defense](../url-defense/SKILL.md) - URL rewriting protects clickers
- [Proofpoint API Patterns](../api-patterns/SKILL.md) - Authentication and rate limits
