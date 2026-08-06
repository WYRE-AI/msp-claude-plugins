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

## Anti-triggers

- **What hit your own tenant** — this is Proofpoint's cross-customer
  intelligence: campaigns, families, and actors observed network-wide.
  A campaign returned here may never have targeted your organization.
  Your tenant's own events are `proofpoint-tap`.
- **Evidence artifacts for one message** — sandbox reports, pcaps,
  screenshots, and samples are `proofpoint-forensics`.
- **Another vendor's intelligence feed** — Mimecast's near-identically
  named skill is `mimecast-threat-intelligence`.

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
| `proofpoint_threat_get_campaign` | Campaign detail by ID — actors, malware families, techniques, associated messages | `campaign_id` (required) |
| `proofpoint_threat_get_by_id` | Threat detail by ID — type, classification, associated indicators | `threat_id` (required) |
| `proofpoint_threat_get_iocs` | Indicators of compromise for a campaign or time range — URLs, IPs, domains, hashes | `campaign_id`, `sinceTime`, `interval`, `threat_type` |
| `proofpoint_threat_list_families` | Malware families Proofpoint tracks, with descriptions and associated campaigns | `sinceTime`, `interval` |
| `proofpoint_reports_threat_summary` | Threat breakdown by type with counts and trends | `window`, `threatType` |

### Not available through this plugin

Everything here is a **forward lookup**: you arrive with an ID or a time
window and get intelligence back. There is no way to arrive with a name or
an indicator and search.

- **Searching campaigns by criteria** (actor, family, date). Campaign
  access is by ID only, and the IDs come from TAP events.
- **Reverse IOC lookup** — "which campaigns contain this hash".
  `proofpoint_threat_get_iocs` runs the other direction: campaign or time
  window in, indicators out. To answer an inbound IOC question, pull the
  IOC set for the window and match locally.
- **Per-family or per-actor detail pages.** `proofpoint_threat_list_families`
  lists families; there is no get-by-name. Actor names appear inside
  campaign output and have no tool of their own.

## Common Workflows

### Investigate a Campaign from TAP Event

1. From a TAP event, extract the `campaign_id`
2. Call `proofpoint_threat_get_campaign` with the campaign ID
3. Review the campaign description, actor attribution, and techniques
4. Call `proofpoint_threat_get_iocs` with the same `campaign_id` to get all
   IOCs for the campaign
5. Export IOCs to your SIEM or firewall blocklists
6. Check if other users in the organization were targeted by the same campaign

### Track a Threat Family

1. Call `proofpoint_threat_list_families` for the window you care about and
   find the family (e.g. `Emotet`) in the returned list — there is no
   get-by-name
2. Review the campaigns the listing associates with it
3. Call `proofpoint_threat_get_campaign` for each of those campaign IDs
4. Assess whether the family is actively targeting your organization
5. Review MITRE ATT&CK techniques to inform detection rules

### IOC Lookup

An inbound IOC — someone hands you a hash or a URL and asks "have we seen
this?" — **cannot be looked up directly.** There is no indicator-keyed
search. The workable approximation:

1. Call `proofpoint_threat_get_iocs` for the time window in question,
   optionally narrowed by `threat_type`
2. Match the indicator against the returned set yourself
3. If it matches, call `proofpoint_threat_get_campaign` on the associated
   campaign for context
4. **A non-match means "not in the window you pulled", not "never seen"** —
   say so, rather than reporting a clean result

### Threat Landscape Review

1. Call `proofpoint_reports_threat_summary` with a 30-day `window`
2. Review the breakdown by threat type with counts and trends
3. Add `proofpoint_threat_list_families` for the same window to see which
   families are active
4. Cross-reference with your organization's TAP data
5. Update security awareness training based on active campaigns

### Correlate Across Multiple Events

1. Gather `threat_id` values from multiple TAP events
2. For each, call `proofpoint_threat_get_by_id` for classification and its
   associated indicators
3. Look for shared infrastructure (common domains, IPs, C2 servers)
4. If shared infrastructure is found, these events may be part of the same campaign
5. Confirm by calling `proofpoint_threat_get_campaign` on the campaign IDs
   the threats carry — you cannot search campaigns to find the link, only
   confirm one you already have

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
