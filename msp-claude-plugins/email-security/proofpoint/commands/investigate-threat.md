---
description: Deep-dive threat investigation with forensics, campaign context, and remediation options
argument-hint: "[threat-id] [campaign-id] [message-guid] [url] [include-forensics]"
arguments: [threat-id, campaign-id, message-guid, url, include-forensics]
---

# Investigate Threat

Perform a deep-dive investigation of a specific threat, campaign, or suspicious indicator using Proofpoint TAP, threat intelligence, and forensics data.

## Prerequisites

- Valid Proofpoint service principal and secret configured
- TAP API and Forensics API access
- Threat intelligence access for campaign details

## Steps

1. **Resolve the investigation target**
   - If `threat-id`: Look up threat directly
   - If `campaign-id`: Look up campaign and all associated threats
   - If `message-guid`: Look up the message and extract threat IDs
   - If `url`: Analyze the URL and find associated threats

2. **Gather threat context**
   - Call `proofpoint_threat_get_campaign` if a campaign ID is available
   - Call `proofpoint_threat_get_iocs` for IOCs
   - Call `proofpoint_forensics_get_threat` if forensics are requested

3. **Assess impact**
   - Query TAP for all messages containing this threat
   - Identify all affected recipients
   - Check click data for any user interaction

4. **Build investigation report**
   - Compile threat details, campaign context, and IOCs
   - List affected users and click activity
   - Provide remediation recommendations

5. **Suggest remediation**
   - Recommend search-and-destroy for delivered threats
   - Suggest password resets for clicked phishing
   - Provide IOCs for blocklist updates

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| threat-id | string | No* | - | Proofpoint threat ID |
| campaign-id | string | No* | - | Campaign identifier |
| message-guid | string | No* | - | Message GUID |
| url | string | No* | - | Suspicious URL |
| include-forensics | boolean | No | true | Include sandbox data |

*At least one of `threat-id`, `campaign-id`, `message-guid`, or `url` is required.

## Examples

### Investigate by Threat ID

```
/investigate-threat --threat-id "abc123def456"
```

### Investigate a Campaign

```
/investigate-threat --campaign-id "camp-789xyz"
```

### Investigate a Message

```
/investigate-threat --message-guid "msg-guid-abc123"
```

### Investigate a URL

```
/investigate-threat --url "https://suspicious-domain.com/login"
```

### Quick Investigation (No Forensics)

```
/investigate-threat --threat-id "abc123def456" --include-forensics false
```

## Output

### Full Investigation Report

```
THREAT INVESTIGATION REPORT
Generated: 2024-02-15 10:30:00 UTC

THREAT SUMMARY
  Threat ID:      abc123def456
  Classification: Phishing (credential harvesting)
  Threat Type:    URL
  Status:         Active
  First Seen:     2024-02-14 22:15:00 UTC
  Confidence:     95/100

CAMPAIGN CONTEXT
  Campaign:       TA505-Feb2024-Office365
  Actor:          TA505
  Description:    Large-scale Office 365 credential harvesting campaign using
                  fake invoice lures. Targets finance and executive personnel.
  Start Date:     2024-02-14
  Global Scope:   12,500+ messages across 340 organizations

THREAT DETAILS
  Malicious URL:  https://fake-login.evil.com/office365/signin
  Final URL:      https://192.168.100.50/harvest.php
  Redirect Chain: fake-login.evil.com -> redir.evil.net -> 192.168.100.50
  Hosting:        Bulletproof hosting, AS12345
  SSL Cert:       Let's Encrypt, issued 2024-02-13 (1 day before campaign)

FORENSICS (Sandbox Analysis)
  Verdict:        Malicious
  Behavior:       Renders fake Microsoft 365 login page
  Credential Fields: Email, Password, MFA code
  Exfiltration:   POST to https://192.168.100.50/harvest.php
  Screenshot:     [Sandbox screenshot available]
  PCAP:           [Network capture available]

INDICATORS OF COMPROMISE
  URLs:
    - https://fake-login.evil.com/office365/signin
    - https://redir.evil.net/r?id=abc
  Domains:
    - fake-login.evil.com
    - redir.evil.net
  IPs:
    - 192.168.100.50 (C2/exfiltration server)
  Sender Addresses:
    - billing@spoofed-domain.com
    - invoices@spoofed-domain.com

IMPACT ASSESSMENT
  Messages Sent:     3 (to your organization)
  Messages Blocked:  2
  Messages Delivered: 1  [!]
  Users Affected:
    - cfo@acmecorp.com (DELIVERED - message in mailbox)
  Clicks:
    - cfo@acmecorp.com clicked at 2024-02-15 09:35:00  [!!]
    - Click was to credential harvesting page

RECOMMENDED ACTIONS
  1. URGENT: Reset password for cfo@acmecorp.com
  2. URGENT: Revoke active sessions for cfo@acmecorp.com
  3. Initiate search-and-destroy for the delivered message
  4. Add IOC domains/IPs to firewall blocklist
  5. Check MFA logs for cfo@acmecorp.com for unauthorized access
  6. Notify the user and their manager
  7. File incident report

Quick Actions:
  - Search & destroy: /search-and-destroy --message-guid "msg-guid-abc123"
  - Check user risk: /vap-report --user "cfo@acmecorp.com"
```

## Error Handling

### Threat Not Found

```
Error: Threat ID "abc123def456" not found

The threat ID may be invalid or the data may have expired.
Try searching by URL or message GUID instead.
```

### Forensics Not Available

```
Warning: Forensic data not available for this threat

Sandbox analysis may not have been performed for this threat.
This can happen for:
- Low-confidence threats
- Threats identified by reputation only
- Very recent threats still being analyzed

Investigation continues with available data...
```

### Campaign Not Correlated

```
Note: No campaign association found

This threat has not been linked to a named campaign.
It may be an isolated attack or a new campaign not yet correlated.
IOCs are still available for blocking.
```

### Multiple Threats Found

```
Multiple threats found for this URL. Showing the most recent:

1. abc123def456 - Phishing (2024-02-15, Active)
2. xyz789abc012 - Malware (2024-02-10, Cleared)
3. mno345pqr678 - Phishing (2024-02-01, Cleared)

Investigating threat #1 (most recent active threat).
Use --threat-id to investigate a specific threat.
```

## Related Commands

- `/check-threats` - View recent TAP threats
- `/search-quarantine` - Search quarantined messages
- `/vap-report` - View Very Attacked People
- `/decode-url` - Decode Proofpoint-rewritten URLs
