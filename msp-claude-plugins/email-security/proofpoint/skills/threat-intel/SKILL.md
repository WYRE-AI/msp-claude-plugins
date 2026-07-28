---
name: "Proofpoint Threat Intelligence"
description: >
  Proofpoint Threat Intelligence fundamentals: campaign tracking, threat families
  and actors, indicators of compromise (IOCs), and how campaign/IOC data enriches
  individual TAP threat events.
when_to_use: >-
  When investigating threat campaigns, threat families, actors, or IOCs, or correlating TAP events
  with broader context. Use when: proofpoint threat intelligence, proofpoint campaign, threat
  campaign, proofpoint ioc, indicators of compromise, threat family, proofpoint threat, threat
  actor, proofpoint intel, campaign tracking, threat indicator, or proofpoint malware family.
---

# Proofpoint Threat Intelligence

## Overview

Proofpoint Threat Intelligence provides contextual information about threat campaigns, threat families, and indicators of compromise (IOCs) observed across the Proofpoint network. This data enriches individual threat events from TAP with broader campaign context, attribution, and forensic evidence. It enables security analysts to understand not just what was blocked, but who is behind the attack and how it fits into a larger campaign.

Proofpoint processes billions of messages daily and correlates threats across its entire customer base, providing unique visibility into large-scale email threat campaigns.

## Key Concepts

### Campaigns

A campaign is a coordinated set of threat activities sharing common infrastructure, payloads, or techniques. Proofpoint groups related threats into campaigns based on:
- Shared sending infrastructure
- Common payload signatures
- Similar lure themes and social engineering tactics
- Linked command-and-control infrastructure

### Threat Families

| Family Type | Description | Examples |
|-------------|-------------|---------|
| `malware` | Named malware families | Emotet, QBot, IcedID, AsyncRAT |
| `phishkit` | Phishing kit families | Office365 kit, DocuSign kit |
| `loader` | Malware delivery mechanisms | Bumblebee, CactusTorch |
| `rat` | Remote access trojans | AsyncRAT, njRAT, DarkComet |
| `ransomware` | Ransomware families | LockBit, BlackCat, Cl0p |
| `stealer` | Credential/info stealers | FormBook, AgentTesla, RedLine |

### Threat Actors

Proofpoint tracks named threat actors (e.g., TA505, TA542, TA577) that conduct persistent email-based campaigns. Actor profiles include:
- Known TTPs (tactics, techniques, procedures)
- Associated malware families
- Targeted industries and geographies
- Campaign frequency and sophistication level

### Indicators of Compromise (IOCs)

| IOC Type | Description | Example |
|----------|-------------|---------|
| `url` | Malicious URL | `https://evil-domain.com/payload` |
| `domain` | Malicious domain | `evil-domain.com` |
| `ip` | Malicious IP address | `192.168.1.100` |
| `hash_md5` | MD5 file hash | `d41d8cd98f00b204e9800998ecf8427e` |
| `hash_sha256` | SHA256 file hash | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4...` |
| `sender` | Malicious sender address | `attacker@spoofed-domain.com` |
| `subject` | Lure subject line pattern | `Invoice #[0-9]{6}` |

## Field Reference

### Campaign Fields

| Field | Type | Description |
|-------|------|-------------|
| `campaignId` | string | Unique campaign identifier |
| `name` | string | Proofpoint-assigned campaign name |
| `description` | string | Campaign summary and context |
| `startDate` | datetime | First observed activity |
| `lastActivity` | datetime | Most recent activity |
| `actors` | object[] | Associated threat actors |
| `families` | object[] | Associated malware/threat families |
| `techniques` | string[] | MITRE ATT&CK techniques observed |
| `malwareCount` | int | Number of unique malware samples |
| `messageCount` | int | Total messages in the campaign |
| `recipientCount` | int | Number of targeted recipients |
| `industries` | string[] | Targeted industry verticals |

### Threat Indicator Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique indicator identifier |
| `type` | string | IOC type (url, domain, ip, hash) |
| `value` | string | The indicator value |
| `firstSeen` | datetime | First observation time |
| `lastSeen` | datetime | Most recent observation |
| `threatStatus` | string | `active`, `cleared`, `falsePositive` |
| `campaigns` | string[] | Associated campaign IDs |
| `families` | string[] | Associated threat families |
| `confidence` | int | 0-100 confidence score |
| `severity` | string | `critical`, `high`, `medium`, `low`, `info` |

## MCP Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `proofpoint_threat_get_campaign` | Get details of a specific campaign | `campaignId` |
| `proofpoint_threat_search_campaigns` | Search campaigns by criteria | `startDate`, `endDate`, `actor`, `family` |
| `proofpoint_threat_get_indicators` | Get IOCs for a campaign or threat | `campaignId`, `threatId` |
| `proofpoint_threat_search_indicators` | Search IOCs across all campaigns | `type`, `value`, `startDate`, `endDate` |
| `proofpoint_threat_get_family` | Get details of a threat family | `familyName` |
| `proofpoint_threat_get_actor` | Get details of a threat actor | `actorName` |
| `proofpoint_threat_get_landscape` | Get threat landscape summary | `window` (7, 30, 90 days) |

## Common Workflows

### Investigate a Campaign from TAP Event

1. From a TAP event, extract the `campaignId`
2. Call `proofpoint_threat_get_campaign` with the campaign ID
3. Review the campaign description, actor attribution, and techniques
4. Call `proofpoint_threat_get_indicators` to get all IOCs for the campaign
5. Export IOCs to your SIEM or firewall blocklists
6. Check if other users in the organization were targeted by the same campaign

### Track a Threat Family

1. Call `proofpoint_threat_get_family` with the family name (e.g., `Emotet`)
2. Review associated campaigns and activity timeline
3. Call `proofpoint_threat_search_campaigns` filtered by that family
4. Assess whether the family is actively targeting your organization
5. Review MITRE ATT&CK techniques to inform detection rules

### IOC Lookup

1. Receive an IOC from an external source (URL, hash, IP)
2. Call `proofpoint_threat_search_indicators` with the IOC value
3. If found, review associated campaigns and threat families
4. Determine if the IOC has been seen targeting your organization
5. Check the threat status - `active` IOCs require immediate action

### Threat Landscape Review

1. Call `proofpoint_threat_get_landscape` with a 30-day window
2. Review top threat families, actors, and techniques
3. Identify trends - are attacks increasing for specific families?
4. Cross-reference with your organization's TAP data
5. Update security awareness training based on active campaigns

### Correlate Across Multiple Events

1. Gather `threatID` values from multiple TAP events
2. For each, call `proofpoint_threat_get_indicators`
3. Look for shared infrastructure (common domains, IPs, C2 servers)
4. If shared infrastructure is found, these events may be part of the same campaign
5. Use `proofpoint_threat_search_campaigns` to confirm

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid campaign ID | Verify the campaign ID format from the TAP event |
| 400 | Invalid date range | Ensure dates are within the allowed range |
| 401 | Authentication failed | Verify service principal and secret |
| 403 | Threat intelligence access not enabled | Ensure your license includes threat intelligence API |
| 404 | Campaign not found | The campaign may be too old or not yet correlated |
| 404 | Threat family not found | Verify the family name spelling |
| 429 | Rate limit exceeded | Implement backoff; intel API is rate-limited |

### No Results

- Campaign data may take time to correlate - retry after a few hours
- Some threats may not be attributed to a named campaign
- IOC searches may return no results if the indicator is new or unique to your organization
- Older campaigns may be archived and unavailable via the API

## Best Practices

1. **Start with TAP events** - Use campaign IDs from TAP events as entry points into threat intelligence
2. **Export IOCs to blocklists** - Feed campaign IOCs into your firewall, proxy, and EDR blocklists
3. **Track actor patterns** - Named actors have consistent TTPs; use this to predict future attacks
4. **Correlate with external intel** - Cross-reference Proofpoint intelligence with other threat feeds
5. **Update detection rules** - Use MITRE ATT&CK techniques from campaigns to tune detection
6. **Brief your team** - Share campaign summaries with your security team for situational awareness
7. **Monitor active families** - Track threat families that target your industry vertical
8. **Use confidence scores** - Prioritize high-confidence IOCs for automated blocking

## Related Skills

- [Proofpoint TAP](../tap/SKILL.md) - Threat events and click tracking
- [Proofpoint Forensics](../forensics/SKILL.md) - Deep threat investigation
- [Proofpoint People](../people/SKILL.md) - Identify targeted users
- [Proofpoint API Patterns](../api-patterns/SKILL.md) - Authentication and rate limits
