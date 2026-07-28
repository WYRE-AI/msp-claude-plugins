---
name: "Proofpoint Forensics"
description: >
  Proofpoint Forensics and Threat Response (TRAP) fundamentals: auto-pull and
  search-and-destroy remediation actions, evidence collection, message trace, and
  post-delivery incident response workflows for email-borne threats.
when_to_use: >-
  When investigating or remediating email-borne threats after delivery using Proofpoint forensics
  or TRAP. Use when: proofpoint forensics, proofpoint search and destroy, proofpoint auto-pull,
  email forensics, message investigation, proofpoint remediation, threat response, email incident
  response, message trace, proofpoint trap, proofpoint evidence, or post-delivery remediation.
---

# Proofpoint Forensics & Threat Response

## Overview

Proofpoint Forensics provides deep investigation capabilities for email-borne threats. When a threat is detected after delivery, Proofpoint Threat Response Auto-Pull (TRAP) can automatically or manually remediate messages that have already reached user mailboxes. This skill covers evidence collection, message investigation, search and destroy operations, and incident response workflows.

TRAP integrates with Microsoft 365 and Google Workspace to move or delete messages from user mailboxes after delivery, closing the gap between detection and remediation.

## Key Concepts

### Remediation Actions

| Action | Description | Reversible |
|--------|-------------|------------|
| `auto-pull` | Automatic removal of delivered threats | Yes (within retention) |
| `search-and-destroy` | Manual search and removal across mailboxes | Yes (within retention) |
| `move-to-junk` | Move message to user's junk folder | Yes |
| `soft-delete` | Delete message (recoverable from deleted items) | Yes |
| `hard-delete` | Permanently delete message | No |
| `quarantine` | Move to admin quarantine | Yes |

### Evidence Types

| Type | Description | Contents |
|------|-------------|----------|
| `screenshot` | Screenshot of threat page/attachment | PNG image of rendered content |
| `pcap` | Network capture from sandbox | Full packet capture during detonation |
| `sample` | Malware sample | Original malicious file |
| `headers` | Email headers | Full RFC 822 headers |
| `urls` | Extracted URLs | All URLs found in the message |
| `attachments` | Attachment metadata | File names, hashes, sizes |
| `sandbox_report` | Sandbox detonation report | Behavioral analysis results |

### Investigation Status

| Status | Description |
|--------|-------------|
| `pending` | Investigation initiated, awaiting results |
| `in_progress` | Analysis is actively running |
| `completed` | Investigation finished with results |
| `failed` | Investigation could not be completed |
| `remediated` | Threat has been remediated |

### Auto-Pull Modes

| Mode | Description |
|------|-------------|
| `automatic` | Messages pulled immediately upon threat reclassification |
| `confirmation` | Admin must confirm before pull (notification sent) |
| `disabled` | Auto-pull is off; manual search-and-destroy only |

## Field Reference

### Forensic Report Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique forensic report identifier |
| `GUID` | string | Message GUID (links to TAP events) |
| `scope` | string | `online` (cloud analysis) or `sandbox` (detonation) |
| `type` | string | Type of forensic evidence |
| `name` | string | Display name for the evidence |
| `threatTime` | datetime | When the threat was classified |
| `engineResults` | object[] | Results from analysis engines |
| `platforms` | object[] | Platforms where evidence was collected |

### Engine Result Fields

| Field | Type | Description |
|-------|------|-------------|
| `engine` | string | Analysis engine name |
| `verdict` | string | `malicious`, `suspicious`, `benign` |
| `score` | int | Confidence score (0-100) |
| `details` | string | Detailed analysis findings |
| `iocs` | object[] | IOCs extracted by this engine |

### Search-and-Destroy Fields

| Field | Type | Description |
|-------|------|-------------|
| `operationId` | string | Unique operation identifier |
| `status` | string | `pending`, `in_progress`, `completed`, `failed` |
| `criteria` | object | Search criteria used |
| `matchCount` | int | Number of messages matched |
| `remediatedCount` | int | Number of messages remediated |
| `failedCount` | int | Number of messages that failed remediation |
| `startTime` | datetime | When the operation started |
| `endTime` | datetime | When the operation completed |
| `initiatedBy` | string | Who started the operation |

### Message Trace Fields

| Field | Type | Description |
|-------|------|-------------|
| `GUID` | string | Message GUID |
| `messageId` | string | RFC 822 Message-ID header |
| `sender` | string | Envelope sender |
| `recipients` | string[] | All recipients |
| `subject` | string | Message subject |
| `receivedTime` | datetime | When Proofpoint received the message |
| `deliveryTime` | datetime | When delivered to mailbox |
| `disposition` | string | Final message disposition |
| `policyActions` | string[] | Policy actions applied |
| `routingPath` | string[] | Mail routing hops |

## MCP Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `proofpoint_forensics_get_report` | Get forensic report for a threat | `threatId`, `GUID` |
| `proofpoint_forensics_get_evidence` | Download evidence artifacts | `reportId`, `evidenceType` |
| `proofpoint_forensics_search_destroy` | Initiate search and destroy | `sender`, `subject`, `messageId`, `action` |
| `proofpoint_forensics_get_operation` | Check status of a search-and-destroy | `operationId` |
| `proofpoint_forensics_list_operations` | List recent operations | `status`, `startDate`, `endDate` |
| `proofpoint_forensics_message_trace` | Trace a message through the system | `GUID`, `messageId`, `sender`, `recipient` |
| `proofpoint_forensics_auto_pull_status` | Check auto-pull configuration | - |
| `proofpoint_forensics_get_sandbox_report` | Get sandbox detonation report | `threatId` |

## Common Workflows

### Investigate a Delivered Threat

1. From a TAP delivered-message event, get the `GUID` and `threatID`
2. Call `proofpoint_forensics_get_report` to get the full forensic analysis
3. Review sandbox results and extracted IOCs
4. Call `proofpoint_forensics_get_evidence` for screenshots and pcaps
5. Determine impact: how many users received the message?
6. If remediation is needed, proceed with search-and-destroy

### Search and Destroy Operation

1. Identify the message to remediate (by sender, subject, or messageId)
2. Call `proofpoint_forensics_search_destroy` with criteria and `action=soft-delete`
3. Note the `operationId` from the response
4. Call `proofpoint_forensics_get_operation` to monitor progress
5. Verify `remediatedCount` matches expected scope
6. Document the operation for incident records

### Post-Incident Evidence Collection

1. Call `proofpoint_forensics_get_report` for the threat
2. Download all evidence types: screenshots, pcaps, samples
3. Call `proofpoint_forensics_get_sandbox_report` for behavioral analysis
4. Extract IOCs from the forensic report
5. Cross-reference IOCs with threat intelligence
6. Package evidence for incident report

### Message Trace Investigation

1. User reports a suspicious message they received
2. Call `proofpoint_forensics_message_trace` with sender and recipient
3. Review the routing path and policy actions applied
4. Check if TAP flagged the message and what disposition was applied
5. If the message was delivered and is malicious, initiate search-and-destroy
6. If the message was blocked, confirm with the user

### Auto-Pull Verification

1. Call `proofpoint_forensics_auto_pull_status` to check configuration
2. Verify auto-pull is enabled for the organization
3. Review the auto-pull mode (automatic vs. confirmation)
4. Check recent auto-pull operations for success rate
5. Adjust configuration if messages are not being pulled as expected

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid search criteria | At least one search criterion is required |
| 400 | Invalid action | Use `soft-delete`, `hard-delete`, `move-to-junk`, or `quarantine` |
| 401 | Authentication failed | Verify service principal and secret |
| 403 | TRAP access not enabled | Ensure your license includes Threat Response |
| 403 | Insufficient permissions for hard-delete | Hard-delete requires elevated admin permissions |
| 404 | Forensic report not found | Report may not be available for all threats |
| 404 | Operation not found | Verify the operation ID |
| 409 | Operation already in progress | Wait for the current operation to complete |
| 429 | Rate limit exceeded | Implement backoff for search-and-destroy operations |

### Search-and-Destroy Failures

| Failure Reason | Resolution |
|----------------|------------|
| Mailbox not accessible | Check Microsoft 365/Google Workspace integration credentials |
| Message already deleted | User may have deleted the message manually |
| Permission denied | Service account needs impersonation rights |
| Mailbox on hold | Legal hold prevents deletion; use move-to-junk instead |
| Timeout | Large-scope operations may timeout; use narrower criteria |

## Best Practices

1. **Prefer soft-delete over hard-delete** - Soft-delete allows recovery if a mistake is made
2. **Narrow your scope** - Use specific criteria (messageId + sender) to avoid accidental remediation
3. **Monitor operation progress** - Always check operation status after initiating search-and-destroy
4. **Document everything** - Record operation IDs, criteria, and results for incident documentation
5. **Collect evidence first** - Download forensic evidence before remediation in case it is needed later
6. **Test auto-pull in confirmation mode** - Before enabling automatic mode, run in confirmation to verify accuracy
7. **Coordinate with users** - Notify affected users that messages were removed and explain why
8. **Use message trace for debugging** - When users report missing legitimate email, trace the message path
9. **Limit hard-delete scope** - Only use hard-delete for confirmed high-severity threats
10. **Review auto-pull logs regularly** - Ensure auto-pull is not catching false positives

## Related Skills

- [Proofpoint TAP](../tap/SKILL.md) - Threat events that trigger forensic investigation
- [Proofpoint Quarantine](../quarantine/SKILL.md) - Pre-delivery message management
- [Proofpoint Threat Intelligence](../threat-intel/SKILL.md) - Campaign and IOC context
- [Proofpoint API Patterns](../api-patterns/SKILL.md) - Authentication and rate limits
