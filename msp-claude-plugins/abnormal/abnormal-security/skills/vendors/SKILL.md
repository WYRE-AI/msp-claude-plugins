---
name: "Abnormal Security Vendors"
description: >
  Use this skill when working with Abnormal Security VendorBase vendor
  risk assessment - vendor risk scores, compromised vendor detection,
  vendor domain analysis, and supply chain email threat monitoring.
  Covers vendor risk levels, risk factors, compromised vendor workflows,
  and vendor-related threat investigation. Essential for MSP security
  analysts monitoring third-party vendor risk via Abnormal Security.
when_to_use: >-
  When working with vendor risk scores, compromised vendor detection, vendor domain analysis. Use
  when: abnormal vendor, vendor risk, vendorbase, compromised vendor, vendor domain, supply chain
  risk, vendor assessment, third party risk, vendor email security, vendor compromise, or vendor
  risk score.
---

# Abnormal Security VendorBase Vendor Risk Assessment

## Overview

Abnormal Security's VendorBase provides AI-driven vendor risk assessment by analyzing email communication patterns between your organization and its vendors. It detects compromised vendor accounts, assesses vendor risk levels, and alerts on suspicious vendor behavior. This is critical for protecting against supply chain email attacks where a trusted vendor's account is taken over and used to send malicious emails.

## Vendor Risk Levels

| Level | Score Range | Description | Action |
|-------|------------|-------------|--------|
| **Critical** | 90-100 | Active compromise detected or high-confidence indicators | Immediate investigation, block vendor emails |
| **High** | 70-89 | Strong indicators of compromise or suspicious behavior | Priority investigation within 24 hours |
| **Medium** | 40-69 | Some risk factors present, warrants monitoring | Monitor, review within 1 week |
| **Low** | 0-39 | Normal vendor behavior, minimal risk | Routine monitoring |

## Risk Factors

| Factor | Description | Weight |
|--------|-------------|--------|
| **Authentication Failures** | SPF/DKIM/DMARC failures from vendor domain | High |
| **Sending Pattern Change** | Vendor sending from new IPs or mail servers | High |
| **Domain Age** | Vendor domain recently registered or changed | Medium |
| **Content Anomalies** | Unusual email content compared to historical patterns | High |
| **Financial Requests** | Vendor requesting payment changes or wire transfers | Critical |
| **Multiple Recipients** | Vendor sending to unusual number of your users | Medium |
| **New Contacts** | Previously unseen sender addresses from vendor domain | Medium |
| **Behavioral Anomaly** | Communication patterns deviate from baseline | High |

## Vendor Field Reference

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `vendorDomain` | string | Primary domain of the vendor |
| `vendorName` | string | Display name / company name |
| `riskScore` | int | Risk score 0-100 |
| `riskLevel` | string | Critical, High, Medium, Low |
| `lastAssessed` | datetime | When the risk was last calculated |
| `totalMessages` | int | Total emails received from this vendor |
| `firstSeen` | datetime | When the vendor first emailed your org |

### Compromise Indicators

| Field | Type | Description |
|-------|------|-------------|
| `isCompromised` | boolean | Whether Abnormal has flagged the vendor as compromised |
| `compromiseDetectedAt` | datetime | When compromise was detected |
| `compromiseIndicators` | string[] | List of specific indicators |
| `affectedUsers` | string[] | Your users targeted by compromised vendor |

### Communication Profile

| Field | Type | Description |
|-------|------|-------------|
| `typicalSenders` | string[] | Known sender addresses from this vendor |
| `typicalSubjects` | string[] | Common subject line patterns |
| `communicationFrequency` | string | How often vendor emails your org |
| `lastEmailReceived` | datetime | Most recent email from vendor |
| `primaryContacts` | string[] | Your users who communicate most with vendor |

## MCP Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `abnormal_vendors_list` | List vendors with risk scores | `pageSize`, `pageNumber`, `filter` |
| `abnormal_vendors_get` | Get vendor risk details | `vendorDomain` |
| `abnormal_vendors_activity` | Get recent vendor email activity | `vendorDomain`, `fromDate`, `toDate` |
| `abnormal_vendors_threats` | Get threats from a specific vendor | `vendorDomain` |

### Tool Usage Examples

**List high-risk vendors:**
```json
{
  "tool": "abnormal_vendors_list",
  "parameters": {
    "filter": "riskLevel eq 'High' or riskLevel eq 'Critical'",
    "pageSize": 25
  }
}
```

**Get vendor risk details:**
```json
{
  "tool": "abnormal_vendors_get",
  "parameters": {
    "vendorDomain": "example-vendor.com"
  }
}
```

**Get threats from a vendor:**
```json
{
  "tool": "abnormal_vendors_threats",
  "parameters": {
    "vendorDomain": "example-vendor.com"
  }
}
```

## Vendor Investigation Workflows

### Compromised Vendor Investigation

1. **Review compromise indicators:**
   - What triggered the detection?
   - When was the compromise detected?
   - Which of your users are affected?
2. **Analyze recent emails from vendor:**
   - Check for unusual content or requests
   - Look for financial redirect requests
   - Review authentication results (SPF/DKIM/DMARC)
3. **Assess blast radius:**
   - How many users received emails from the compromised vendor?
   - Were any emails acted upon (links clicked, attachments opened)?
4. **Remediate:**
   - Quarantine suspicious emails from the vendor
   - Block vendor domain temporarily if active compromise
   - Notify affected users not to respond or act on recent vendor emails
5. **Vendor notification:**
   - Contact the vendor through a verified channel (not email)
   - Inform them of the suspected compromise
   - Request confirmation when they have secured their accounts
6. **Unblock:**
   - Once vendor confirms remediation, unblock and monitor

### Vendor Risk Review Workflow

1. **List all vendors by risk score** - Start with highest risk
2. **Review risk factors** - Understand why each vendor is rated as it is
3. **Check for new vendors** - First-time vendors warrant extra scrutiny
4. **Compare historical risk** - Has risk score increased recently?
5. **Generate report** - Summarize vendor risk posture for stakeholders

### Payment Redirect Detection

1. **Filter vendor emails with financial keywords** - "bank details changed", "new account", "updated payment"
2. **Cross-reference with vendor risk** - Is the vendor flagged as compromised?
3. **Verify through side channel** - Call the vendor to confirm payment changes
4. **Block if fraudulent** - Quarantine and block sender if confirmed BEC

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid vendor domain | Verify domain format |
| 401 | Unauthorized | Check API token |
| 404 | Vendor not found | Domain may not be in VendorBase yet |
| 429 | Rate limited | Wait and retry |

## Best Practices

1. **Review critical vendors weekly** - High-risk vendors need regular attention
2. **Act immediately on compromises** - Compromised vendor emails are highly convincing
3. **Verify payment changes via phone** - Never trust payment redirect requests via email
4. **Monitor new vendors closely** - First-time vendors lack behavioral baseline
5. **Track risk score trends** - Rising scores indicate emerging risk
6. **Correlate with threat data** - Vendor risk and threat detections complement each other
7. **Document vendor communications** - Maintain a log of verified vendor contacts

## Related Skills

- [Abnormal Threats](../threats/SKILL.md) - Threat detection and analysis
- [Abnormal Account Takeover](../account-takeover/SKILL.md) - Account takeover detection
- [Abnormal API Patterns](../api-patterns/SKILL.md) - API authentication and usage
