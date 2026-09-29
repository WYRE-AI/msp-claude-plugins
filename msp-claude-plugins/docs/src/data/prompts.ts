export type PromptRole = 'account' | 'finance' | 'sales' | 'support' | 'noc' | 'incident' | 'security' | 'documentation' | 'bizops';

export interface Prompt {
  id: string;
  title: string;
  description: string;
  role: PromptRole;
  plugins: string[];     // plugin IDs (from plugins.ts); empty = any PSA/RMM
  mcpServers: string[];  // MCP server IDs (from mcp-servers.ts); empty = any
  prompt: string;
}

export const roleLabels: Record<PromptRole, string> = {
  account:       'Account Management',
  finance:       'Finance & Billing',
  sales:         'Sales & Growth',
  support:       'Support & Helpdesk',
  noc:           'NOC & Engineering',
  incident:      'Incident Response',
  security:      'Security Operations',
  documentation: 'Documentation',
  bizops:        'Business Operations',
};

export const roleDescriptions: Record<PromptRole, string> = {
  account:       'QBRs, client health reports, executive summaries, and relationship management.',
  finance:       'Billing reconciliation, unbilled work, contract compliance, and aged receivables.',
  sales:         'Growth opportunities, device refresh cycles, at-risk clients, and upsell intelligence.',
  support:       'Ticket triage, SLA tracking, escalation reviews, and shift handoffs.',
  noc:           'Infrastructure health, patch status, alert correlation, and maintenance coordination.',
  incident:      'P1 war rooms, post-incident reviews, client communications, and timeline reconstruction.',
  security:      'Account compromise triage, endpoint investigation, phishing intel, and threat hunting.',
  documentation: 'Doc audits, runbook generation, asset discovery, and password rotation tracking.',
  bizops:        'QBR evidence appendices, contract renewals, license waste analysis, and executive reporting.',
};

export const roleOrder: PromptRole[] = ['account', 'finance', 'sales', 'support', 'noc', 'incident', 'security', 'documentation', 'bizops'];

export const prompts: Prompt[] = [

  // ── Account Management ────────────────────────────────────────────

  {
    id: 'account-qbr-prep',
    role: 'account',
    title: 'QBR Conversation Brief',
    description: 'Meeting prep for levels 3–5 of the MSP Value Pyramid: ease of doing business, emotional value, and transformational value.',
    plugins: [],
    mcpServers: ['autotask', 'halopsa', 'connectwise-manage', 'ninjaone', 'atera'],
    prompt: `Prepare me to run the [CLIENT NAME] QBR for [QUARTER] with the business owner. Open by saying this hour is level 3–5 coaching plus an evidence pack. Tickets are not the story.

Read prior commitments and their goals before any ticket volume. Then write, in this order:

1. Executive narrative covering Ease of Doing Business, Emotional Value, and Transformational Value. No SLA, no volume, no "we closed N."
2. Level 3 — what I say, what I ask ("Where did we create friction? Where did we remove it? What would make next quarter easier for your ops?"), and support metrics that answer "so what for ease?" Aging, reopens, time-to-first-response, and escalations qualify only as friction. Volume does not.
3. Level 4 — what I say, what I ask ("What kept you up at night? Did we reduce or add worry? Which moment built or burned trust?"), and support metrics as reassurance or confidence, not scare theater.
4. Level 5 — their goal, the questions before any proposal, and one business move tied to that goal. Not a SKU push.
5. Looking ahead / asks — what I need them to decide before we leave.
6. Appendix — level 1 and 2 operating numbers (tickets opened and closed, SLA %, devices, patch %). Label it if-challenged only.

Refuse a ticket-volume lead, an SLA% headline, a device inventory dump, and "we closed N tickets" as proof of value. A metric that only says how busy we were goes in the appendix or gets dropped.`,
  },

  {
    id: 'account-health-scorecard',
    role: 'account',
    title: 'Client Health Scorecard',
    description: 'Snapshot of a client\'s current IT health across tickets, devices, and monitoring.',
    plugins: [],
    mcpServers: ['autotask', 'halopsa', 'connectwise-manage', 'ninjaone', 'atera', 'datto-rmm'],
    prompt: `Create a health scorecard for [CLIENT NAME].

Cover:
- Open ticket count by priority (critical, high, medium, low)
- Devices with active alerts or offline status
- Any monitors currently down or in warning state
- Overdue or breached SLA tickets
- Last 7 days of incident activity

Rate the overall health as Green / Amber / Red and explain your reasoning.`,
  },

  {
    id: 'account-exec-summary',
    role: 'account',
    title: 'Monthly Executive Summary',
    description: 'One-page executive summary suitable for sharing with a client\'s leadership team.',
    plugins: [],
    mcpServers: ['autotask', 'halopsa', 'connectwise-manage'],
    prompt: `Write a one-page executive summary of IT activity for [CLIENT NAME] for [MONTH].

Audience: their CTO/IT director — not technical detail, focus on business impact.

Cover:
- Overall service summary (issues resolved, uptime achieved)
- Any significant incidents and how they were resolved
- Improvements or projects completed this month
- Risks or items requiring client attention
- Recommended next steps or upcoming work

Keep it concise and free of jargon.`,
  },

  {
    id: 'account-risk-report',
    role: 'account',
    title: 'Client Risk Report',
    description: 'Identify top risk areas based on open issues, device age, and recurring problems.',
    plugins: [],
    mcpServers: ['autotask', 'halopsa', 'connectwise-manage', 'ninjaone', 'atera', 'datto-rmm', 'itglue', 'hudu'],
    prompt: `Identify the top risk areas for [CLIENT NAME] based on current data.

Look for:
- Recurring ticket categories that suggest a systemic problem
- Devices that are offline, degraded, or overdue for replacement
- Security alerts or incidents in the past 30 days
- SLA breaches or near-breach tickets
- Any expired or expiring warranties, certificates, or licenses if visible

Rank the top 3-5 risks by potential business impact and suggest a mitigation action for each.`,
  },

  // ── Finance & Billing ─────────────────────────────────────────────

  {
    id: 'finance-unbilled-work',
    role: 'finance',
    title: 'Unbilled Work Review',
    description: 'Surface all time entries and tickets that are ready to bill but haven\'t been invoiced yet.',
    plugins: ['autotask', 'halopsa', 'connectwise-psa'],
    mcpServers: ['autotask', 'halopsa', 'connectwise-manage'],
    prompt: `Show me all unbilled work for [CLIENT NAME] (or all clients if not specified) that is in a billing-ready status.

Include:
- Ticket number, title, and date closed
- Technician who worked the ticket
- Total hours logged and billable hours
- Contract or billing type (time-and-materials, block hours, managed services)

Group by client if running for all accounts. Flag anything over 30 days old that still hasn't been invoiced.`,
  },

  {
    id: 'finance-time-entries',
    role: 'finance',
    title: 'Time Entry Audit',
    description: 'Review time entries for a client or period to verify accuracy before billing.',
    plugins: ['autotask', 'halopsa', 'connectwise-psa'],
    mcpServers: ['autotask', 'halopsa', 'connectwise-manage'],
    prompt: `Pull all time entries for [CLIENT NAME] for [DATE RANGE, e.g. March 2025].

For each entry show:
- Date, technician, and ticket number
- Work description
- Hours logged (regular vs overtime if applicable)
- Billing status

Flag any entries that look unusual: very short entries (under 5 minutes), entries logged long after the work date, or entries without a description.`,
  },

  {
    id: 'finance-contract-compliance',
    role: 'finance',
    title: 'Managed Services Contract Compliance',
    description: 'Compare actual hours and devices against what\'s in the contract.',
    plugins: ['autotask', 'halopsa', 'connectwise-psa'],
    mcpServers: ['autotask', 'halopsa', 'connectwise-manage', 'ninjaone', 'atera', 'datto-rmm'],
    prompt: `Check contract compliance for [CLIENT NAME] for this month.

I need to know:
- How many devices are under their managed services contract vs what's actively monitored
- Total hours consumed this month vs their included hours (if on a block hours or capped plan)
- Any out-of-scope work billed separately
- Whether they're approaching overage thresholds

Highlight any discrepancies between what's contracted and what we're delivering.`,
  },

  {
    id: 'finance-aged-receivables',
    role: 'finance',
    title: 'Aged Receivables Summary',
    description: 'List all outstanding invoices by age and client for follow-up.',
    plugins: ['autotask', 'halopsa', 'connectwise-psa', 'xero', 'quickbooks'],
    mcpServers: ['autotask', 'halopsa', 'connectwise-manage'],
    prompt: `Give me a summary of all outstanding invoices across all clients, grouped by age.

Show:
- Current (0-30 days)
- Overdue 31-60 days
- Overdue 61-90 days
- Overdue 90+ days

For each bucket, list the client name, invoice number(s), amount outstanding, and invoice date. Flag any clients with invoices over 60 days as a priority for follow-up.`,
  },

  // ── Sales & Growth ────────────────────────────────────────────────

  {
    id: 'sales-device-refresh',
    role: 'sales',
    title: 'Device Refresh Opportunity Report',
    description: 'Find devices 4+ years old across clients — a natural hardware refresh conversation.',
    plugins: ['ninjaone', 'atera', 'datto', 'kaseya'],
    mcpServers: ['ninjaone', 'atera', 'datto-rmm', 'connectwise-automate'],
    prompt: `Scan all managed devices and identify machines that are 4 or more years old and likely due for hardware refresh.

Group results by client. For each device include:
- Device name and type (desktop, laptop, server)
- Operating system and version
- Approximate age if visible (from warranty or first-seen date)
- Any recent hardware-related alerts or failures

Summarize by client: total aging devices and estimated replacement opportunity. This will be used to prioritize refresh conversations.`,
  },

  {
    id: 'sales-at-risk-clients',
    role: 'sales',
    title: 'At-Risk Client Identification',
    description: 'Identify clients with high ticket volume, recurring issues, or SLA breaches — retention risk.',
    plugins: [],
    mcpServers: ['autotask', 'halopsa', 'connectwise-manage'],
    prompt: `Identify clients who may be at risk of churn based on their recent service experience.

Look for clients with:
- High ticket volume compared to their account size in the last 60 days
- 2 or more SLA breaches in the past 30 days
- Recurring issues of the same type (possible systemic problem we're not resolving)
- Tickets with negative or escalation indicators in the description

Rank the top 5-10 at-risk clients with a brief reason for each. This list will be used for proactive account check-ins.`,
  },

  {
    id: 'sales-upsell-opportunities',
    role: 'sales',
    title: 'Upsell & Expansion Opportunities',
    description: 'Find clients using fewer services than they could benefit from based on their profile.',
    plugins: [],
    mcpServers: ['autotask', 'halopsa', 'connectwise-manage', 'ninjaone', 'atera'],
    prompt: `Look across our client base and identify expansion or upsell opportunities.

Flag clients who:
- Have grown their device count significantly in the past 6 months (potential seat expansion)
- Have frequent security-related tickets but no security add-on services (EDR, backup, etc.)
- Are consistently exceeding their included hours but haven't upgraded their contract
- Have aging infrastructure that we haven't had a hardware refresh conversation with

For each opportunity, briefly explain the gap and suggest the relevant service or conversation.`,
  },

  {
    id: 'sales-new-client-intel',
    role: 'sales',
    title: 'New Client Onboarding Intelligence',
    description: 'Pull a complete picture of a newly onboarded client\'s environment.',
    plugins: [],
    mcpServers: ['ninjaone', 'atera', 'datto-rmm', 'connectwise-automate', 'itglue', 'hudu'],
    prompt: `We've just onboarded [CLIENT NAME]. Give me a full picture of their environment based on what we've discovered so far.

Cover:
- Total device count and types (workstations, servers, network gear)
- Operating systems in use and any that are end-of-life
- Any immediate risks or issues flagged during onboarding
- Current monitoring coverage (what's being monitored vs what we found)
- Gaps compared to our standard managed services baseline

This will be used to prioritize the first 30 days of work and identify quick wins.`,
  },

  // ── Support & Helpdesk ────────────────────────────────────────────

  {
    id: 'support-morning-standup',
    role: 'support',
    title: 'Morning Ticket Standup',
    description: 'Daily open ticket review to start the team\'s day.',
    plugins: [],
    mcpServers: ['autotask', 'halopsa', 'connectwise-manage', 'superops', 'syncro'],
    prompt: `Give me a morning standup summary of all open tickets for today.

Group by:
1. Critical and High priority — list each with ticket number, client, summary, and assigned tech
2. Tickets breaching SLA within the next 4 hours
3. Tickets unassigned or with no update in the last 24 hours
4. Total open count by priority tier

Keep it brief — this is for a 10-minute team standup.`,
  },

  {
    id: 'support-sla-risk',
    role: 'support',
    title: 'SLA Breach Risk Report',
    description: 'Identify tickets approaching or past SLA so the team can intervene.',
    plugins: [],
    mcpServers: ['autotask', 'halopsa', 'connectwise-manage'],
    prompt: `Show me all tickets that are at risk of breaching or have already breached their SLA.

Separate into:
- Already breached: ticket number, client, priority, how overdue
- Breaching in the next 2 hours
- Breaching in the next 4 hours

Include the assigned technician for each. Sort by most urgent first. I need this to prioritize the team's next hour.`,
  },

  {
    id: 'support-escalation-review',
    role: 'support',
    title: 'Escalation & Stale Ticket Review',
    description: 'Find tickets stuck in queues too long or waiting on responses.',
    plugins: [],
    mcpServers: ['autotask', 'halopsa', 'connectwise-manage', 'superops', 'syncro'],
    prompt: `Find all tickets that are stalled and may need escalation or a nudge.

Look for:
- Open tickets with no technician update in the last 48 hours
- Tickets waiting on client response for more than 5 business days
- Any ticket open for more than 14 days regardless of status
- Escalated tickets that haven't had a senior tech review documented

For each, show ticket number, client, summary, last activity date, and current assignee.`,
  },

  {
    id: 'support-shift-handoff',
    role: 'support',
    title: 'Shift Handoff Brief',
    description: 'End-of-shift summary of open work for the incoming team or on-call engineer.',
    plugins: ['pagerduty', 'betterstack'],
    mcpServers: ['autotask', 'halopsa', 'connectwise-manage'],
    prompt: `Prepare a shift handoff brief for the incoming team covering everything they need to know right now.

Include:
- All active or acknowledged incidents and their current status
- High and critical priority tickets opened in the last 8 hours
- Any tickets I've been actively working — include where I left off and next steps
- Anything scheduled or expected to fire in the next 4 hours (maintenance windows, monitoring alerts)
- Any client communications that need a follow-up response

Format as a structured handoff document, not a data dump.`,
  },

  {
    id: 'support-client-ticket-history',
    role: 'support',
    title: 'Pre-Call Client Brief',
    description: 'Quick prep brief before calling or meeting with a client.',
    plugins: [],
    mcpServers: ['autotask', 'halopsa', 'connectwise-manage'],
    prompt: `I have a call with [CLIENT NAME] in 10 minutes. Give me a quick brief.

Cover:
- Their currently open tickets: count and any critical or high priority ones
- Most recent 3-5 closed tickets and what they were about
- Any patterns or recurring issues I should be aware of
- Any open items they've been waiting on us for
- Anyone at their company I should know about from recent ticket interactions

Keep it to 200 words max — I need this fast.`,
  },

  // ── NOC & Engineering ─────────────────────────────────────────────

  {
    id: 'noc-infrastructure-health',
    role: 'noc',
    title: 'Infrastructure Health Report',
    description: 'Full status sweep of all monitored devices and services.',
    plugins: ['ninjaone', 'atera', 'datto', 'betterstack'],
    mcpServers: ['ninjaone', 'atera', 'datto-rmm', 'connectwise-automate'],
    prompt: `Give me a full infrastructure health report across all monitored clients.

Group by status:
- Down / offline: list device name, client, type, and how long it's been down
- Degraded / warning: devices with active alerts but still responding
- Unknown / no check-in: devices that haven't reported in over 24 hours
- Healthy: summary count only

For any client with 3 or more devices in warning or down state, flag them as needing immediate attention. Total counts at the top.`,
  },

  {
    id: 'noc-patch-status',
    role: 'noc',
    title: 'Patch Compliance Report',
    description: 'Identify devices missing critical security patches across all clients.',
    plugins: ['ninjaone', 'atera', 'datto', 'kaseya'],
    mcpServers: ['ninjaone', 'atera', 'datto-rmm', 'connectwise-automate'],
    prompt: `Generate a patch compliance report across all managed devices.

Show:
- Devices missing critical or security patches (OS and third-party)
- Count of missing patches per device
- Clients with the worst patch compliance (most missing patches)
- Any devices that haven't had a successful patch scan in the last 7 days

Flag any device missing patches that is also exposed to the internet (server or firewall) as high priority. I need this to prioritize this week's patching run.`,
  },

  {
    id: 'noc-alert-correlation',
    role: 'noc',
    title: 'Alert Correlation & Root Cause',
    description: 'When multiple alerts fire at once, group them by likely cause.',
    plugins: ['ninjaone', 'atera', 'datto', 'pagerduty', 'betterstack'],
    mcpServers: ['ninjaone', 'atera', 'datto-rmm', 'connectwise-automate'],
    prompt: `We have multiple alerts firing right now. Help me make sense of them.

List all active alerts and incidents, then:
1. Group alerts that are likely related (same client, same time window, same infrastructure layer)
2. Identify the most likely root cause for each group
3. Suggest which alert to investigate first to have the most impact
4. Flag any alerts that look like noise vs genuine service impact

I'm trying to find the actual problem, not chase symptoms.`,
  },

  {
    id: 'noc-maintenance-prep',
    role: 'noc',
    title: 'Maintenance Window Preparation',
    description: 'Checklist of monitors to pause and on-call to notify before planned work.',
    plugins: ['betterstack', 'pagerduty'],
    mcpServers: [],
    prompt: `I'm planning a maintenance window for [DESCRIPTION, e.g. firewall firmware upgrade] at [CLIENT NAME] on [DATE/TIME].

Help me prepare by:
1. Listing all monitors currently associated with systems that will be affected
2. Identifying the on-call engineer on duty during the window
3. Drafting a status page announcement to notify stakeholders (if applicable)
4. Noting any tickets or incidents that are currently open for this client that might be affected

After the window, remind me to: resume all paused monitors, verify everything returns to 'up', and resolve any stale incidents.`,
  },

  {
    id: 'noc-incident-postmortem',
    role: 'noc',
    title: 'Incident Post-Mortem Summary',
    description: 'Structure a post-mortem for a resolved incident with timeline and action items.',
    plugins: ['pagerduty', 'betterstack', 'rootly'],
    mcpServers: ['autotask', 'halopsa', 'connectwise-manage'],
    prompt: `Help me write a post-mortem for the incident affecting [SERVICE/CLIENT] that occurred on [DATE].

Structure it as:
1. **Summary**: What happened and what was the business impact (1 paragraph)
2. **Timeline**: Key events from first alert to resolution with timestamps
3. **Root Cause**: What actually caused the incident
4. **Contributing Factors**: What made it worse or delayed detection/resolution
5. **What Went Well**: Things that worked during the response
6. **Action Items**: Specific, assigned tasks to prevent recurrence (include owner and due date)

Keep the tone blameless — we're fixing systems, not blaming people.`,
  },

  // ── Email Security ────────────────────────────────────────────────

  {
    id: 'noc-email-threat-briefing',
    role: 'noc',
    title: 'Daily Email Threat Briefing',
    description: 'Morning summary of email threats, blocked attacks, and phishing incidents across all clients.',
    plugins: ['proofpoint', 'avanan', 'abnormal', 'mimecast'],
    mcpServers: ['proofpoint', 'avanan', 'abnormal', 'mimecast'],
    prompt: `Give me a morning email threat briefing covering the last 24 hours across all clients.

Include:
- Total blocked threats by type (phishing, malware, BEC, spam) with counts
- Any threats that were delivered to users (not blocked) — these are highest priority
- New or active campaigns targeting our clients
- Any users who clicked a malicious URL or opened a dangerous attachment
- Clients with unusually high threat volume compared to their baseline

Flag anything that requires immediate action (delivered threats, active BEC attempts, credential phishing). Keep the rest as a summary table.`,
  },

  {
    id: 'noc-phishing-investigation',
    role: 'noc',
    title: 'Phishing Incident Investigation',
    description: 'Investigate a reported phishing email — trace delivery, identify recipients, and assess impact.',
    plugins: ['proofpoint', 'avanan', 'abnormal', 'ironscales', 'knowbe4'],
    mcpServers: ['proofpoint', 'avanan', 'abnormal', 'ironscales', 'knowbe4'],
    prompt: `I need to investigate a phishing email reported by [USER] at [CLIENT NAME].

Known details: [paste subject line, sender, or any other details you have]

Help me:
1. Find the original email and its full headers / metadata
2. Identify all other recipients at this client or across clients who received the same or similar email
3. Check whether any recipients clicked links or opened attachments
4. Determine if any credentials or data may have been compromised
5. Identify the campaign or threat actor if known
6. List every mailbox that still has a copy of the email (for remediation)

End with a recommended remediation: quarantine scope, user notifications needed, and any account lockouts to consider.`,
  },

  {
    id: 'noc-email-quarantine-review',
    role: 'noc',
    title: 'Quarantine Review',
    description: 'Review held and quarantined emails across clients — identify false positives and genuine threats.',
    plugins: ['spamtitan', 'mimecast', 'avanan'],
    mcpServers: ['spamtitan', 'mimecast', 'avanan'],
    prompt: `Review the current email quarantine queue across all clients.

I need to:
1. See all messages held in quarantine in the last 24 hours, grouped by client
2. Identify any that look like false positives (legitimate business email, newsletters the user opted into, known vendors)
3. Confirm which messages are genuine threats that should remain quarantined or be deleted
4. Flag any quarantine entries that have been waiting more than 48 hours without review (user may be waiting on an important email)

For likely false positives, tell me what action to take (release and allowlist sender/domain). For confirmed threats, confirm deletion. Highlight any patterns that suggest an allowlist or blocklist rule update is needed.`,
  },

  {
    id: 'noc-security-awareness-status',
    role: 'noc',
    title: 'Security Awareness Training Status',
    description: 'Review phishing simulation results and training completion rates across clients.',
    plugins: ['knowbe4'],
    mcpServers: ['knowbe4'],
    prompt: `Give me a security awareness training status report across all clients.

Cover:
- Active phishing simulation campaigns: click rates and failure rates per client
- Training completion rates — who is overdue or has outstanding assignments
- Highest-risk users by risk score (frequent clickers, incomplete training)
- Clients with click rates above 10% — these need attention
- Improvement trends: are clients getting better or worse over time?

Flag the top 5 highest-risk users overall so we can have a conversation with their client's IT contact. Include a recommendation for clients with persistently high failure rates (more frequent simulations, mandatory retraining, etc.).`,
  },

  {
    id: 'support-phishing-report-response',
    role: 'support',
    title: 'End User Phishing Report Handler',
    description: 'Triage a user-reported phishing email — assess risk, scope the blast radius, and advise the user.',
    plugins: ['ironscales', 'knowbe4', 'abnormal', 'proofpoint'],
    mcpServers: ['ironscales', 'knowbe4', 'abnormal', 'proofpoint'],
    prompt: `A user at [CLIENT NAME] has reported a suspicious email. I need to triage it quickly.

User report: [paste the user's description or forwarded email headers]

Steps I need help with:
1. Look up the reported message in our email security platform — is it already classified?
2. Check if other users at this client (or other clients) received the same email
3. Classify it: genuine phishing / spam / safe (false positive)
4. If it's a genuine threat: has anyone clicked or interacted with it?
5. Draft a brief response to the reporting user explaining what we found and what they should do

If the email is confirmed phishing and others received it, automatically suggest escalating to the phishing investigation workflow.`,
  },

  {
    id: 'support-quarantine-release-request',
    role: 'support',
    title: 'Quarantine Release Request',
    description: 'Process a user request to release a quarantined email — verify it\'s safe before releasing.',
    plugins: ['spamtitan', 'mimecast', 'avanan'],
    mcpServers: ['spamtitan', 'mimecast', 'avanan'],
    prompt: `A user at [CLIENT NAME] has requested release of a quarantined email.

User details: [sender address, subject, approximate date received]

Before releasing, help me:
1. Find the quarantined message
2. Review the sender, subject, headers, and any link/attachment analysis
3. Assess whether it's genuinely safe to release (expected sender, legitimate content, no suspicious links)
4. Check if the sender domain has a history of spam or phishing in our system

If safe: release the message and recommend whether to add the sender to the allowlist.
If not safe: explain why to the user and suggest they contact the sender through a different channel to re-send.

Always err on the side of caution — if there's any doubt, don't release.`,
  },

  {
    id: 'account-email-security-posture',
    role: 'account',
    title: 'Email Security Posture for QBR',
    description: 'One level-4 proof point for a QBR: a threat story the owner did not have to live through. Not the meeting agenda.',
    plugins: ['proofpoint', 'avanan', 'abnormal', 'mimecast', 'knowbe4'],
    mcpServers: ['proofpoint', 'avanan', 'abnormal', 'mimecast', 'knowbe4'],
    prompt: `Prepare one email-security proof point for the [CLIENT NAME] QBR. The meeting itself is a level 3–5 conversation (ease of doing business, how the owner feels, and what the business can do next). This note is optional evidence for level 4 — emotional value — not a section of the agenda. Do not open the meeting with a blocked-threat count.

The audience is the SMB owner. Keep it business-focused.

Return:
- One moment from the past quarter that did not become the owner's problem (what was stopped, what they did not have to do, what they did not have to explain to staff or customers). A single number is allowed only inside that story.
- Anything that did reach a user, told as what the owner felt and what is already different.
- One question to ask: "What about email still wakes you up?"
- Training or phishing-simulation movement only if it changes that story. Otherwise leave the percentages out.

If the quarter has no story an owner would recognize, say so. Do not fill the gap with category totals.`,
  },

  // ── Incident Response ─────────────────────────────────────────────

  {
    id: 'incident-p1-war-room',
    role: 'incident',
    title: 'P1 War Room Kickoff',
    description: 'Immediately pull all context for a live P1 incident: alerts, ticket, on-call, and a 2-hour timeline.',
    plugins: ['pagerduty', 'betterstack', 'rootly'],
    mcpServers: ['autotask', 'halopsa', 'connectwise-manage', 'ninjaone', 'datto-rmm'],
    prompt: `I have a [SEVERITY, e.g. P1 / Critical] incident at [CLIENT NAME]. [SYSTEM OR SERVICE] is down affecting approximately [NUMBER] users.

Use the available tools to do the following right now:

1. Pull all active alerts and monitoring events for [CLIENT NAME] from the last 2 hours — list them chronologically
2. Check for any existing open tickets related to this issue and link them; if none exist, open a P1 ticket with the title "[CLIENT NAME] – [SYSTEM] Outage" and set priority to Critical
3. Identify the on-call engineer currently assigned and their contact details
4. Build a timeline of events starting 2 hours ago: alert fires, ticket opens, tech activity, any config changes or deployments if visible
5. Give me your best current hypothesis for root cause based on what you can see

Format the output as a war room brief — I'm sharing this in a Slack channel right now.

Variation — if you know the affected service:
Replace "[SYSTEM OR SERVICE] is down" with the specific service, e.g. "The VPN concentrator at their main office is unreachable" or "Microsoft 365 Exchange Online is returning 503s for all users."`,
  },

  {
    id: 'incident-pir-from-ticket',
    role: 'incident',
    title: 'Post-Incident Review from Ticket History',
    description: 'Generate a structured PIR document from a resolved incident ticket and its notes.',
    plugins: ['pagerduty', 'betterstack', 'rootly'],
    mcpServers: ['autotask', 'halopsa', 'connectwise-manage'],
    prompt: `Generate a post-incident review (PIR) for the incident documented in ticket [TICKET NUMBER] (or the most recent resolved P1/Critical ticket for [CLIENT NAME] if no ticket number is known).

Pull the full ticket history — all notes, time entries, and status changes — and structure the PIR as follows:

**1. Incident Summary**
What happened, what was the business impact, and how long did it last (detection to resolution)?

**2. Timeline**
A bullet-point chronology from first alert/report through to confirmed resolution. Include timestamps.

**3. Root Cause**
What was the actual underlying cause? Be specific — not "server was down" but why it was down.

**4. Contributing Factors**
What made the incident worse or delayed our response? (monitoring gaps, escalation delays, missing runbooks, etc.)

**5. What Went Well**
At least 2-3 things the team did right during the response.

**6. Action Items**
Specific tasks to prevent recurrence or improve response time. For each: description, owner (assign to [YOUR NAME] if unspecified), and a due date 2 weeks from today.

Keep the tone blameless. This document will be shared with the client.

Variation — multi-system incident:
Add a "Scope" section listing all affected systems, services, and user counts before the Timeline.`,
  },

  {
    id: 'incident-client-communication',
    role: 'incident',
    title: 'Incident Client Communication Draft',
    description: 'Draft an executive-facing incident update for a client — clear, calm, and action-oriented.',
    plugins: [],
    mcpServers: ['autotask', 'halopsa', 'connectwise-manage'],
    prompt: `Draft a client-facing incident communication for [CLIENT NAME] regarding the [SYSTEM/SERVICE] issue that [started at TIME / is currently ongoing / was resolved at TIME].

The audience is their [CTO / IT Director / Executive team] — assume they are not technical. Do not use internal jargon.

The message should:
- Acknowledge the issue and its impact on their business clearly (no minimising)
- State the current status: [investigating / identified and implementing fix / resolved]
- Explain what we know so far in plain language (1-2 sentences max on technical detail)
- Describe what we are doing right now
- Give a realistic next update time: [TIME or "within X hours"]
- End with a direct contact name and number for urgent escalation

Tone: professional, calm, and accountable. We own this — no blaming the vendor unless explicitly directed.

Pull any relevant details from the open ticket for [CLIENT NAME] to populate specifics.

Variation — resolved incident update:
Change the status to resolved and include: actual resolution time, root cause in one sentence, and what we are doing to prevent recurrence.`,
  },

  // ── Security Operations ───────────────────────────────────────────

  {
    id: 'security-account-compromise-triage',
    role: 'security',
    title: 'Suspicious User Activity Triage',
    description: 'Investigate a risk alert for a user — sign-in history, MFA changes, forwarding rules, and compromise verdict.',
    plugins: ['sentinelone'],
    mcpServers: ['sentinelone'],
    prompt: `User [USER EMAIL ADDRESS] at [CLIENT NAME] just triggered a risk alert. I need to determine if this is account compromise.

Use available tools to pull the following:

1. **Sign-in history** — last 7 days of authentication events: location, IP, device, and whether MFA was satisfied. Flag any sign-ins from new countries, anonymous IPs, or unusual times.
2. **MFA changes** — any MFA method additions, removals, or phone number changes in the last 7 days
3. **Email forwarding rules** — check for any inbox forwarding rules created recently, especially to external addresses
4. **Email delegation** — any recently added mailbox delegates
5. **Recent email activity** — any bulk send/delete activity in the last 48 hours
6. **Device compliance** — is their primary device compliant and managed? Any new device registrations?

After pulling the data, give me a verdict:
- **Likely compromised**: list the specific indicators and recommend immediate actions (password reset, MFA re-enrol, session revoke, ticket open)
- **Suspicious but inconclusive**: list what's unusual and what additional steps to take
- **False positive**: explain why

If you assess compromise as likely, draft the first response ticket note I should post.

Variation — no email security tool connected:
Focus on sign-in logs and MFA changes only, and note that email forwarding check requires manual review in M365 admin.`,
  },

  {
    id: 'security-endpoint-compromise-triage',
    role: 'security',
    title: 'Endpoint Compromise Triage',
    description: 'Pull all security signals for a specific device — EDR alerts, patch status, network activity, and risk verdict.',
    plugins: ['sentinelone'],
    mcpServers: ['sentinelone', 'ninjaone', 'datto-rmm', 'connectwise-automate'],
    prompt: `I need to triage a potentially compromised endpoint. Device: [DEVICE NAME or HOSTNAME] at [CLIENT NAME].

Pull every available signal for this device:

1. **EDR alerts** — any active or recent threats, detections, or quarantined files from SentinelOne or equivalent. Include severity and current status.
2. **RMM status** — is the device online? Last check-in time? Any active alerts in the RMM?
3. **Patch status** — is the device current on OS and third-party patches? How many critical patches are missing?
4. **Running processes / script execution** — any recent script runs or remote commands executed on this device (from RMM history)?
5. **Network isolation status** — is the device currently network-isolated? If not, should it be?
6. **Open tickets** — any existing tickets for this device in the last 30 days

After gathering the data:
- Rate the risk: **Critical / High / Medium / Low**
- List the top indicators driving your assessment
- Recommend the immediate next steps (isolate, remediate, monitor, close)
- Draft the internal ticket note to document the triage findings

If the device should be isolated, remind me to get client approval before doing so — unless a critical threat is actively executing.

Variation — server triage:
Add "Check for any scheduled tasks or services added in the last 72 hours" and treat network isolation as a last resort given potential service impact.`,
  },

  {
    id: 'security-phishing-investigation',
    role: 'security',
    title: 'Phishing Email Full Investigation',
    description: 'Given a reported phish, gather all available intel — delivery scope, click activity, credential exposure, and remediation.',
    plugins: ['proofpoint', 'avanan', 'abnormal', 'ironscales', 'knowbe4'],
    mcpServers: ['proofpoint', 'avanan', 'abnormal', 'ironscales', 'knowbe4'],
    prompt: `I need to fully investigate a reported phishing email at [CLIENT NAME].

Known details:
- Reported by: [USER EMAIL]
- Subject line: [SUBJECT LINE if known]
- Sender address: [SENDER ADDRESS if known]
- Approximate time received: [DATE / TIME if known]

Work through the following investigation steps:

1. **Locate the email** — find it in the email security platform by sender, subject, or time window
2. **Blast radius** — identify every mailbox at [CLIENT NAME] (and across all clients if the platform supports cross-tenant search) that received this email or a variant of it
3. **Interaction check** — for each recipient, determine: did they open it? Click any links? Download an attachment?
4. **Link / attachment analysis** — what do the URLs or files resolve to? Any known malicious indicators?
5. **Credential exposure** — if any user clicked a link to a credential-harvest page, flag them for immediate password reset
6. **Threat intel** — is this part of a known campaign? Any IOCs (sender IP, domain, hash) in threat intel feeds?
7. **Remaining copies** — list every mailbox that still has a copy of the email (for quarantine/deletion)

End with a prioritised remediation checklist:
- [ ] Accounts to lock/reset (list them)
- [ ] Mailboxes to remediate (list them)
- [ ] Allowlist/blocklist rules to create
- [ ] User notifications to send
- [ ] Ticket to open (draft the title and description)

Variation — internal phishing simulation:
If the email turns out to be a KnowBe4 or similar security awareness simulation, note the click rate and flag users who clicked for training follow-up instead of remediation.`,
  },

  // ── Documentation ─────────────────────────────────────────────────

  {
    id: 'docs-completeness-audit',
    role: 'documentation',
    title: 'Documentation Completeness Audit',
    description: 'Find active devices with no runbook, stale passwords, and undocumented services in IT Glue or Hudu.',
    plugins: ['it-glue', 'hudu'],
    mcpServers: ['itglue', 'hudu', 'ninjaone', 'datto-rmm', 'connectwise-automate'],
    prompt: `Run a documentation audit for [CLIENT NAME] (or all clients if not specified).

Cross-reference the RMM's device inventory against the documentation platform and flag gaps:

1. **Missing runbooks / configurations** — devices or services that are active and monitored in the RMM but have no corresponding configuration record or runbook in IT Glue / Hudu. List: device name, device type, and how long it's been active.

2. **Stale passwords** — any passwords stored in the documentation platform that haven't been rotated in 90 or more days. Include: password title, last rotated date, and associated asset or service.

3. **Undocumented network devices** — switches, firewalls, or APs visible in the RMM that have no documentation entry

4. **Missing contacts** — client contacts in the PSA with no corresponding entry in the documentation platform (gaps in the contact list)

5. **Expired SSL certificates or licenses** — any documented items with an expiry date that has passed or is within 30 days

Produce a prioritised gap list. Rate each gap: **Critical** (passwords, active servers), **High** (network devices, key services), or **Medium** (workstations, nice-to-have docs). Suggest which gaps to close first.

Variation — new client onboarding:
Run this immediately after onboarding discovery is complete to generate the documentation work backlog for the first 30 days.`,
  },

  {
    id: 'docs-runbook-generator',
    role: 'documentation',
    title: 'Runbook Generator',
    description: 'Generate a structured runbook for a device or service using data already in the RMM and documentation platform.',
    plugins: ['it-glue', 'hudu'],
    mcpServers: ['itglue', 'hudu', 'ninjaone', 'datto-rmm', 'connectwise-automate'],
    prompt: `Generate a runbook for [DEVICE NAME / SERVICE NAME] at [CLIENT NAME].

Pull all available data from the RMM and documentation platform to populate the runbook, then structure it as follows:

**Overview**
- Device / service name, type, and purpose
- Client and physical or logical location
- Criticality: [Mission Critical / Important / Standard] — infer from device type and ticket history if not specified

**Access & Credentials**
- Primary access method (RDP, SSH, web console, etc.)
- Credential references (link to IT Glue / Hudu password entries — do not include actual passwords in the runbook)
- MFA or jump host requirements

**Key Details**
- IP address(es), hostnames, relevant ports
- OS, firmware, or application version
- Licensing or warranty expiry if known

**Monitoring**
- What monitors are configured for this device/service in the RMM?
- What alerts should a tech expect to see, and what do they mean?

**Common Issues & Fixes**
- List up to 5 common issues found in the ticket history for this device (pull from PSA if connected)
- For each: symptom, likely cause, resolution steps

**Maintenance Schedule**
- Patching cadence, restart windows, backup schedule if known

**Escalation Path**
- Who to contact if this device/service fails after hours
- Vendor support details if applicable

After generating, tell me which sections you had to leave blank due to missing data — those are documentation gaps to fill in.`,
  },

  {
    id: 'docs-asset-discovery-summary',
    role: 'documentation',
    title: 'Asset Discovery Summary',
    description: 'Summarise undocumented assets discovered by the RMM that need to be reviewed and added to the documentation platform.',
    plugins: ['it-glue', 'hudu'],
    mcpServers: ['itglue', 'hudu', 'ninjaone', 'datto-rmm', 'connectwise-automate', 'liongard'],
    prompt: `Perform an asset discovery summary for [CLIENT NAME].

I need to understand what's in their environment and what is or isn't documented.

1. **Full device inventory** — pull every device currently reporting into the RMM. For each: name, type (workstation / server / network / other), OS, last seen, and online/offline status.

2. **Documentation coverage** — for each device, check whether a matching record exists in IT Glue / Hudu. Flag devices with no documentation record.

3. **Shadow IT / unexpected devices** — flag any devices that don't match the expected naming convention, have an unknown device type, or appear to have been added recently without a corresponding ticket.

4. **End-of-life OS** — list any devices running an OS that is past Microsoft or Apple's end-of-support date (Windows 10 21H2 and earlier, Windows Server 2012 and earlier, macOS Ventura and earlier).

5. **Unmanaged devices** — if Liongard is connected, check for systems detected during inspector runs that are not in the RMM agent inventory (e.g., network devices with no agent).

Produce:
- A summary table of the full inventory with documentation coverage percentage
- A "needs action" list sorted by risk: EOL devices first, then undocumented servers, then undocumented workstations
- Recommended next steps to close coverage gaps

Variation — post-M&A or site acquisition:
Use this prompt immediately after taking on a new site to generate the baseline discovery report before the first QBR.`,
  },

  // ── Business Operations ───────────────────────────────────────────

  {
    id: 'bizops-qbr-data-pull',
    role: 'bizops',
    title: 'QBR Evidence Appendix',
    description: 'Optional supporting numbers for a level 3–5 QBR. Not the meeting agenda.',
    plugins: [],
    mcpServers: ['autotask', 'halopsa', 'connectwise-manage', 'ninjaone', 'datto-rmm', 'atera'],
    prompt: `Pull a short evidence appendix for the [CLIENT NAME] QBR covering [START DATE] to [END DATE, e.g. "January 1 – March 31 2025"]. This is not the QBR deck. The meeting is a level 3–5 conversation: ease of doing business, emotional value, and transformational value. Return numbers only so the account manager can support or reject a higher-level point.

Keep in the brief, and only these:
- One PSA pattern where the owner had to chase, ask twice, or manage a change themselves. If you cannot name what the owner had to do, say "no level 3 proof."
- Any P1 the owner would have felt — title, date, and what they experienced. That belongs in level 4 as transparency ("we missed, here is what you felt"), not as the opening headline and not buried under an SLA percent.
- One RMM or security fact that shows something never became the owner's problem, or a constraint blocking a business move you can already name. If you cannot name that, omit it.

Under the heading "Appendix — do not present as the agenda", list tickets opened and closed, SLA compliance, top categories, device count, patch compliance, and any device offline more than 4 hours. Do not turn that list into talking points, an executive summary, or a slide outline.

Variation — portfolio scan before QBR season:
Run for clients with a QBR in the next two weeks. Sort by "owner would have felt this" first, not by SLA percent. The output is still an appendix per client, not a ticket review.`,
  },

  {
    id: 'bizops-contract-renewal-review',
    role: 'bizops',
    title: 'Contract Renewal Review',
    description: 'Surface upcoming contract renewals, flag underpriced agreements, and recommend pricing updates.',
    plugins: ['autotask', 'halopsa', 'connectwise-psa'],
    mcpServers: ['autotask', 'halopsa', 'connectwise-manage'],
    prompt: `Review all managed services contracts that are due for renewal in the next [TIMEFRAME, e.g. 90 days].

For each contract:
1. **Renewal date and contract value** — current MRR or ARR, renewal date, and auto-renewal status
2. **Device count drift** — compare contracted device count to actual devices currently managed in the RMM. Flag any contracts where we are managing significantly more (or fewer) devices than contracted.
3. **Hours consumption** — for block-hour or capped plans, what was the average monthly consumption vs included hours over the contract term? Are we consistently over or under?
4. **Profitability signals** — which contracts had high ticket volume relative to their revenue? Flag contracts where ticket volume was more than 20% above the portfolio average per device.
5. **Pricing age** — how long since this contract was last repriced? Flag any contracts that haven't had a rate increase in 24+ months.

For each contract that has a flag, suggest a renewal recommendation:
- **Increase MRR**: by how much, and the justification
- **Renegotiate scope**: what to add or remove
- **Renew as-is**: if the contract is well-balanced

Sort by renewal date ascending. I'm using this for my renewal pipeline planning.

Variation — single client:
Run for [CLIENT NAME] only and include full contract history for context.`,
  },

  {
    id: 'bizops-license-waste-finder',
    role: 'bizops',
    title: 'License Waste Finder',
    description: 'Identify unused M365 seats and other SaaS licenses across a client tenant to find cost savings.',
    plugins: [],
    mcpServers: ['autotask', 'halopsa', 'connectwise-manage'],
    prompt: `Identify unused or wasted software licenses for [CLIENT NAME] so we can surface a cost savings opportunity.

Check the following (use connected tools for what's available; note which checks require manual review):

**Microsoft 365**
- Total licensed seats vs active users (users who have signed in within the last 30 days)
- Licenses assigned to terminated or disabled accounts
- Licenses assigned to shared mailboxes or room resources that could be downgraded
- Users on E3/E5 plans who are only using Exchange and Teams (potential downgrade to M365 Business Basic/Standard)
- Any Microsoft add-on licenses (Intune, Defender, PowerBI) with zero recent usage

**Other SaaS / recurring software** (from PSA contract or documentation platform if available):
- Any software licenses that appear in contracts but have no matching active user or device in the RMM
- Renewals coming up for tools that may no longer be in use (flag for client conversation)

**Output format:**
- For each waste category: list the license type, count of wasted seats, estimated monthly savings at current rate
- Total estimated monthly savings if all waste is reclaimed
- Recommended action for each item (remove, downgrade, reassign, or verify with client)

Note: actual savings depend on contract terms — flag any that require vendor negotiation vs immediate self-serve changes.

Variation — run across all clients:
Generate a portfolio-wide license waste report sorted by estimated savings descending. Use this to prioritise client conversations.`,
  },

];

export function getPromptsByRole(role: PromptRole): Prompt[] {
  return prompts.filter(p => p.role === role);
}

export function getPromptById(id: string): Prompt | undefined {
  return prompts.find(p => p.id === id);
}
