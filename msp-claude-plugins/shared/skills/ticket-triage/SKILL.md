---
name: "Ticket Triage"
description: >
  Use this skill when triaging tickets in any PSA - determining priority,
  categorization, routing, and initial response. Vendor-agnostic best
  practices for efficient ticket handling applicable to Autotask,
  ConnectWise, HaloPSA, and other platforms.
when_to_use: >-
  When triaging tickets in any PSA - determining priority, categorization, routing, and initial
  response. Use when: ticket triage, prioritize ticket, categorize ticket, ticket routing, ticket
  assessment, initial ticket response, ticket classification, or service desk triage.
---

# Ticket Triage Best Practices

## Overview

Ticket triage is the critical first step in service delivery. Proper triage ensures tickets are correctly prioritized, categorized, and routed to the right team for efficient resolution. These practices apply across all PSA platforms.

## The Triage Process

### Step 1: Initial Assessment

Within **2-5 minutes** of ticket receipt:

1. **Read the full ticket** - Title, description, any attachments
2. **Identify the reporter** - Is this an authorized contact?
3. **Determine scope** - Single user, multiple users, entire site?
4. **Check for urgency indicators** - VIP, production down, security issue?

### Step 2: Duplicate Detection

Before proceeding:

1. **Search open tickets** for same company
2. **Look for similar issues** in last 24-48 hours
3. **Check for related alerts** from monitoring

**If duplicate found:**
- Link to existing ticket
- Notify user their issue is being tracked
- Close or merge as appropriate

### Step 3: Priority Assignment

Use impact and urgency to determine priority:

| | Low Urgency | Medium Urgency | High Urgency |
|---|---|---|---|
| **High Impact** | Medium | High | Critical |
| **Medium Impact** | Low | Medium | High |
| **Low Impact** | Low | Low | Medium |

#### Impact Assessment

| Level | Description | Examples |
|-------|-------------|----------|
| **High** | Business operations severely affected | Server down, email outage, ransomware |
| **Medium** | Productivity impacted but workarounds exist | App slow, printer offline, VPN issues |
| **Low** | Minor inconvenience | Single user issue, how-to question |

#### Urgency Assessment

| Level | Description | Examples |
|-------|-------------|----------|
| **High** | Immediate action required | Security breach, executive request |
| **Medium** | Same-day attention needed | User blocked, deadline approaching |
| **Low** | Can wait for normal queue | Scheduled changes, non-critical requests |

### Step 4: Categorization

Assign issue type and sub-type:

#### Common Categories

| Category | Sub-Categories |
|----------|----------------|
| **Hardware** | Workstation, Server, Printer, Network Device, Mobile |
| **Software** | Application, Operating System, Driver, Update/Patch |
| **Network** | Connectivity, VPN, Firewall, DNS, DHCP |
| **Email** | Outlook, Exchange, M365, Spam/Phishing |
| **Security** | Malware, Access Request, Breach, Policy Violation |
| **Cloud** | Azure, AWS, SaaS Applications |
| **Account** | Password Reset, Access Rights, New User, Termination |

### Step 5: Routing

Route to appropriate queue/team:

| Issue Type | Typical Route |
|------------|---------------|
| Simple requests | Service Desk |
| Complex technical | Escalations / Tier 2 |
| Network/Infrastructure | Network Team |
| Security incidents | Security Team |
| On-site required | Dispatch Queue |
| Projects | Project Queue |
| Monitoring alerts | NOC |

### Step 6: Initial Response

Send acknowledgment within SLA window:

**Good initial response includes:**
- Confirmation ticket received
- Expected response time
- Any immediate steps user can take
- Ticket number for reference

**Example:**
> Thank you for contacting support. We've received your ticket (#12345) regarding email connectivity issues.
>
> A technician will be in touch within 2 hours per your service agreement.
>
> In the meantime, please try restarting Outlook and let us know if that resolves the issue.

## Priority Guidelines

### Critical Priority (P1)

**Criteria:**
- Complete business outage
- Security breach in progress
- Production systems down
- Data loss occurring

**Response:** Immediate acknowledgment, active work begins immediately

**Examples:**
- Server down affecting all users
- Ransomware detected
- Email system outage
- Phone system down

### High Priority (P2)

**Criteria:**
- Major productivity impact
- Multiple users affected
- Executive or VIP request
- Time-sensitive business need

**Response:** Within 1 hour

**Examples:**
- Department-wide application failure
- CFO laptop issue during quarter close
- VPN down for remote team
- Backup failure

### Medium Priority (P3)

**Criteria:**
- Single user or small group affected
- Workarounds available
- Non-critical systems

**Response:** Within 4-8 hours

**Examples:**
- Application running slowly
- Non-critical printer offline
- Single user email issue
- Software installation request

### Low Priority (P4)

**Criteria:**
- Minimal impact
- Enhancement requests
- Scheduled work
- How-to questions

**Response:** Within 24-48 hours

**Examples:**
- Password reset
- Training request
- Feature question
- Scheduled software install

## Red Flag Indicators

### Escalate Immediately

- "Security" or "breach" mentioned
- "Everyone" or "all users" affected
- "Down" or "outage" mentioned
- Executive or VIP reporter
- Financial systems involved
- Compliance/audit mentioned

### Check Contract Status

- First ticket from company
- Company marked inactive
- No contract visible
- Billing disputes mentioned

### Potential Phishing

- Urgent wire transfer requests
- Password reset requests via email
- Suspicious sender addresses
- Links to unknown sites

## Documentation During Triage

Record in ticket notes:

1. **Impact summary** - Who/what is affected
2. **Triage decision** - Why this priority/category
3. **Initial steps taken** - What you verified/checked
4. **Next actions** - What needs to happen

**Example triage note:**
> **Triage Note:**
> - Impact: Single user, Outlook not loading
> - Scope: User's workstation only, other apps working
> - Priority: Medium - user can use webmail as workaround
> - Category: Software > Application > Microsoft Outlook
> - Route: Service Desk
> - Initial check: Confirmed user credentials working, O365 service healthy
> - Next: Remote session to troubleshoot Outlook profile

## Common Triage Mistakes

### Avoid These Pitfalls

1. **Over-prioritizing** - Not everything is Critical
2. **Under-categorizing** - Be specific, not generic
3. **Skipping duplicate check** - Creates confusion and double work
4. **No initial response** - User thinks they're ignored
5. **Insufficient information** - Don't escalate without details
6. **Wrong routing** - Creates unnecessary handoffs

### Quality Triage Checklist

- [ ] Read full ticket details
- [ ] Checked for duplicates
- [ ] Verified reporter authorization
- [ ] Assessed impact and urgency correctly
- [ ] Assigned appropriate priority
- [ ] Categorized specifically
- [ ] Routed to correct queue
- [ ] Sent initial response
- [ ] Documented triage decision

## Metrics to Track

| Metric | Target | Purpose |
|--------|--------|---------|
| Triage Time | < 5 min | Responsiveness |
| Misrouted % | < 5% | Quality |
| Re-prioritized % | < 10% | Accuracy |
| First Response SLA | > 95% | Customer satisfaction |
| Duplicate Rate | < 5% | Process efficiency |

## Related Skills

- Vendor-specific ticket management skills
- [MSP Terminology](../msp-terminology/SKILL.md)
