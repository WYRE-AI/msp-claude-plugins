---
name: "Checkpoint Avanan Policies"
description: >
  Use this skill when working with Checkpoint Harmony Email security policies -
  DLP policies, anti-phishing rules, anti-malware settings, quarantine policies,
  allow/block lists, and policy configuration. Covers policy types, enable/disable
  workflows, policy effects, and policy tuning best practices.
  Essential for MSP administrators managing email security policies across
  customer tenants in Checkpoint Harmony Email & Collaboration (Avanan).
when_to_use: >-
  When working with DLP policies, anti-phishing rules, anti-malware settings, quarantine policies,
  allow/block lists. Use when: checkpoint policy, avanan policy, email security policy, dlp
  policy, anti-phishing policy, anti-malware policy, quarantine policy, allow list, block list,
  email policy management, policy configuration, policy enable, policy disable, or email rules.
---

# Checkpoint Harmony Email Policy Management

## Overview

Checkpoint Harmony Email & Collaboration (Avanan) uses a layered policy engine to detect and respond to email threats. Policies define what gets scanned, how threats are classified, and what actions are taken when threats are detected. This skill covers policy types, configuration, enable/disable workflows, and best practices for policy tuning across managed customer tenants.

## Policy Types

| Type | Code | Description | Default Action |
|------|------|-------------|----------------|
| **Anti-Phishing** | `ANTI_PHISHING` | URL scanning, brand impersonation, credential harvesting detection | Quarantine |
| **Anti-Malware** | `ANTI_MALWARE` | Attachment scanning, sandbox analysis, known malware signatures | Quarantine |
| **Anti-BEC** | `ANTI_BEC` | Business email compromise and impersonation detection | Quarantine |
| **Anti-Spam** | `ANTI_SPAM` | Spam and bulk mail filtering | Quarantine or Junk |
| **DLP** | `DLP` | Data loss prevention for outbound and internal emails | Block or Notify |
| **URL Rewriting** | `URL_REWRITE` | Click-time URL protection with safe browsing | Rewrite and Scan |
| **Account Takeover** | `ATO_PROTECTION` | Detect compromised internal accounts | Alert and Block |
| **Custom Rule** | `CUSTOM` | User-defined policy rules | Configurable |

### Policy Actions

| Action | Code | Description |
|--------|------|-------------|
| **Quarantine** | `QUARANTINE` | Move email to quarantine for admin review |
| **Block** | `BLOCK` | Reject the email entirely (NDR to sender) |
| **Deliver with Warning** | `DELIVER_WARN` | Deliver to inbox with security banner |
| **Move to Junk** | `JUNK` | Deliver to junk/spam folder |
| **Notify** | `NOTIFY` | Deliver normally but notify admin |
| **Log Only** | `LOG` | Record the detection but take no action |
| **Rewrite URLs** | `REWRITE` | Replace URLs with safe browsing links |

### Policy Scope

Policies can be scoped to different levels:

| Scope | Description | Use Case |
|-------|-------------|----------|
| **Global** | Applies to all users in the tenant | Baseline security policies |
| **Group** | Applies to a specific user group | Stricter rules for executives |
| **User** | Applies to a single user | Exception or override |
| **Domain** | Applies to a specific sender/recipient domain | Partner domain exceptions |

## Complete Policy Field Reference

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `policyId` | string | Unique policy identifier |
| `name` | string | Human-readable policy name |
| `description` | string | Policy purpose and behavior |
| `type` | string | Policy type code (see table above) |
| `enabled` | boolean | Whether the policy is active |
| `priority` | int | Evaluation order (lower = higher priority) |
| `createdDate` | datetime | When the policy was created |
| `modifiedDate` | datetime | Last modification timestamp |
| `modifiedBy` | string | Who last modified the policy |

### Configuration Fields

| Field | Type | Description |
|-------|------|-------------|
| `action` | string | Action to take on match (see actions above) |
| `scope` | string | GLOBAL, GROUP, USER, DOMAIN |
| `scopeTargets` | string[] | Target groups, users, or domains for the scope |
| `direction` | string | INBOUND, OUTBOUND, INTERNAL, ALL |
| `severity` | string | Minimum severity to trigger: CRITICAL, HIGH, MEDIUM, LOW |
| `exceptions` | object[] | Allow-list exceptions to the policy |
| `schedule` | object | Optional time-based activation schedule |

### Anti-Phishing Specific Fields

| Field | Type | Description |
|-------|------|-------------|
| `urlScanningEnabled` | boolean | Scan URLs in email body |
| `brandImpersonationEnabled` | boolean | Detect brand spoofing |
| `loginPageSimilarityThreshold` | int | Similarity score to trigger (0-100) |
| `urlRewriteEnabled` | boolean | Enable click-time URL rewriting |
| `qrCodeScanningEnabled` | boolean | Scan QR codes in attachments/body |

### Anti-Malware Specific Fields

| Field | Type | Description |
|-------|------|-------------|
| `signatureScanEnabled` | boolean | Known malware signature matching |
| `sandboxEnabled` | boolean | Dynamic analysis in sandbox |
| `sandboxTimeout` | int | Max sandbox analysis time in seconds |
| `fileTypeBlockList` | string[] | Blocked file extensions (e.g., .exe, .scr) |
| `passwordProtectedArchives` | string | Action for password-protected files: BLOCK, SCAN, ALLOW |

### DLP Specific Fields

| Field | Type | Description |
|-------|------|-------------|
| `dlpRules` | object[] | List of DLP pattern rules |
| `dlpRules[].pattern` | string | Regex or keyword pattern |
| `dlpRules[].dataType` | string | SSN, credit card, custom, etc. |
| `dlpRules[].threshold` | int | Minimum matches to trigger |
| `dlpRules[].action` | string | BLOCK, NOTIFY, LOG |
| `dlpRules[].notifyRecipients` | string[] | Who to notify on trigger |

## MCP Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `avanan_policies_list` | List all security policies | `type`, `enabled`, `scope` |
| `avanan_policies_get` | Get detailed policy configuration | `policyId` |
| `avanan_policies_enable` | Enable a disabled policy | `policyId` |
| `avanan_policies_disable` | Disable an active policy | `policyId`, `reason` |
| `avanan_policies_update` | Update policy configuration | `policyId`, `updates` |
| `avanan_allow_list_get` | Get current allow list entries | `type` (sender, domain, ip) |
| `avanan_allow_list_add` | Add entry to allow list | `type`, `value`, `reason` |
| `avanan_allow_list_remove` | Remove entry from allow list | `type`, `value` |
| `avanan_block_list_get` | Get current block list entries | `type` (sender, domain, ip) |
| `avanan_block_list_add` | Add entry to block list | `type`, `value`, `reason` |
| `avanan_block_list_remove` | Remove entry from block list | `type`, `value` |

### Tool Usage Examples

**List all enabled anti-phishing policies:**
```json
{
  "tool": "avanan_policies_list",
  "parameters": {
    "type": "ANTI_PHISHING",
    "enabled": true
  }
}
```

**Disable a policy with reason:**
```json
{
  "tool": "avanan_policies_disable",
  "parameters": {
    "policyId": "pol-abc123",
    "reason": "Generating excessive false positives on partner domain emails"
  }
}
```

**Add sender to allow list:**
```json
{
  "tool": "avanan_allow_list_add",
  "parameters": {
    "type": "sender",
    "value": "noreply@trusted-partner.com",
    "reason": "Legitimate automated notifications from billing system"
  }
}
```

## Common Workflows

### Policy Audit Workflow

1. **List all policies** - Get complete policy inventory
2. **Review enabled policies** - Ensure baseline policies are active
3. **Check policy priority order** - Higher priority policies evaluate first
4. **Review exceptions** - Ensure allow/block lists are current
5. **Check policy coverage:**
   - Anti-phishing enabled for all inbound
   - Anti-malware enabled for all directions
   - DLP enabled for outbound
   - ATO protection enabled for internal
6. **Document gaps** - Identify missing or misconfigured policies

### Policy Tuning Workflow (Reducing False Positives)

1. **Identify high-FP policies** - Check quarantine stats by policy
2. **Review triggered items** - Sample recent quarantine entries for the policy
3. **Analyze patterns:**
   - Are specific senders repeatedly triggering?
   - Is a specific rule too broad?
   - Are legitimate email patterns being caught?
4. **Adjust policy:**
   - Add specific sender/domain exceptions (prefer narrow exceptions)
   - Adjust sensitivity thresholds
   - Modify action from QUARANTINE to DELIVER_WARN if appropriate
5. **Monitor results** - Track FP rate after changes

### Enable/Disable Policy Workflow

**Enabling a policy:**
1. Review policy configuration before enabling
2. Consider starting with LOG action to assess impact
3. Enable the policy
4. Monitor quarantine volume for 24-48 hours
5. Adjust to desired action (QUARANTINE, BLOCK) once validated

**Disabling a policy:**
1. Document the reason for disabling
2. Assess risk impact of disabling
3. Disable the policy
4. Set a reminder to review and re-enable
5. Consider alternative mitigations while disabled

### Allow/Block List Management

**Adding to allow list:**
- Always document the reason
- Prefer specific addresses over entire domains
- Set expiry dates for temporary exceptions
- Review allow list quarterly

**Adding to block list:**
- Verify the threat is confirmed (not a false positive)
- Block at the most specific level possible
- Document the associated threat/incident
- Review block list for stale entries quarterly

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid policy type | Use valid type codes from reference above |
| 400 | Invalid action | Use valid action codes from reference above |
| 401 | Unauthorized | Check API credentials and token expiry |
| 403 | Insufficient permissions | API key needs policy management scope |
| 404 | Policy not found | Verify policy ID exists |
| 409 | Policy name conflict | Policy names must be unique per tenant |
| 422 | Invalid policy configuration | Check field types and required fields |
| 429 | Rate limited | Implement exponential backoff |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Priority conflict | Two policies with same priority | Adjust priority values to be unique |
| Invalid scope target | User/group not found | Verify scope targets exist in directory |
| DLP pattern invalid | Regex syntax error | Validate regex pattern before saving |
| File type not recognized | Unknown extension in block list | Use standard file extensions |

## Best Practices

1. **Layer policies by severity** - Use BLOCK for critical threats, QUARANTINE for high, DELIVER_WARN for medium
2. **Start permissive, tighten gradually** - Begin with LOG, move to DELIVER_WARN, then QUARANTINE
3. **Document every policy change** - Who, what, when, why
4. **Use narrow exceptions** - Prefer specific sender addresses over wildcard domains
5. **Review policies quarterly** - Threat landscape evolves; policies should too
6. **Test before deploying** - Use LOG mode to validate new policies
7. **Separate executive policies** - C-level and finance users warrant stricter BEC rules
8. **Monitor policy effectiveness** - Track detection rates, false positive rates, and miss rates
9. **Coordinate across tenants** - For MSPs, maintain consistent baseline policies across customers
10. **Version control policy changes** - Track changes for audit and rollback purposes

## Related Skills

- [Checkpoint Quarantine](../quarantine/SKILL.md) - Quarantine management
- [Checkpoint Threats](../threats/SKILL.md) - Threat detection and analysis
- [Checkpoint Incidents](../incidents/SKILL.md) - Incident investigation
- [Checkpoint API Patterns](../api-patterns/SKILL.md) - Authentication and API usage
