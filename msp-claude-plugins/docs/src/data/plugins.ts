// Auto-generated — do not edit manually. Run `npm run generate` to update.

export interface Plugin {
  id: string;
  name: string;
  vendor: string;
  description: string;
  category: 'accounting' | 'bcdr' | 'crm' | 'documentation' | 'email-security' | 'incident-management' | 'marketplace' | 'monitoring' | 'network' | 'productivity' | 'psa' | 'rmm' | 'sales' | 'security';
  maturity: 'production' | 'beta' | 'alpha';
  features: string[];
  skills: Skill[];
  agents: Agent[];
  commands: Command[];
  apiInfo: ApiInfo;
  path: string;
  mcpRepo?: string;
  compatibility: {
    claudeCode: boolean;
    claudeDesktop: boolean | 'coming-soon';
    validated: boolean;
  };
}

export interface Skill {
  name: string;
  description: string;
}

export interface Agent {
  name: string;
  description: string;
}

export interface Command {
  name: string;
  description: string;
}

export interface ApiInfo {
  baseUrl: string;
  auth: string;
  rateLimit: string;
  docsUrl: string;
}

export const plugins: Plugin[] = [
  {
    id: 'abnormal-security',
    name: 'Abnormal Security',
    vendor: 'Abnormal',
    description: 'Abnormal Security - AI-powered email security, phishing detection, account takeover prevention',
    category: 'email-security',
    maturity: 'production',
    features: [
      'Account Takeover',
      'Cases',
      'Messages',
      'Threats',
      'Vendors'
    ],
    skills: [
      { name: 'account-takeover', description: 'Use this skill when working with Abnormal Security account takeover (ATO) detection - suspicious sign-ins, impossible travel, compromised accounts, mailbox rule changes, and lateral movement indicators.' },
      { name: 'cases', description: 'Use this skill when working with Abnormal Security abuse mailbox cases - user-reported emails, case triage, remediation actions, case lifecycle, and phishing simulation management.' },
      { name: 'messages', description: 'Use this skill when working with Abnormal Security message analysis - email headers, attachments, sender reputation, delivery context, authentication results (SPF/DKIM/DMARC), and message metadata.' },
      { name: 'threats', description: 'Use this skill when working with Abnormal Security threat detection and analysis - BEC, phishing, malware, socially-engineered attacks, spam, graymail, and credential theft.' },
      { name: 'vendors', description: 'Use this skill when working with Abnormal Security VendorBase vendor risk assessment - vendor risk scores, compromised vendor detection, vendor domain analysis, and supply chain email threat monitoring.' },
      { name: 'api-patterns', description: 'Use this skill when working with the Abnormal Security REST API - Bearer token authentication, base URLs, rate limiting, pagination, OData filtering, error handling, and common API patterns.' }
    ],
    agents: [
      { name: 'email-threat-analyst', description: 'Use this agent when investigating email threats detected by Abnormal Security, analyzing attack chains, assessing user exposure, or managing remediation across client tenants.' },
      { name: 'threat-report-generator', description: 'Use this agent when generating periodic threat landscape reports from Abnormal Security data across the MSP client portfolio — not for live threat investigation, but for summarizing attack trends, most targeted organizations, most common attack types, BEC attempt volumes, and remediation effectiveness over time.' }
    ],
    commands: [
      { name: '/account-audit', description: 'Audit for account takeover indicators and suspicious sign-ins in Abnormal Security' },
      { name: '/case-review', description: 'Review and triage abuse mailbox cases in Abnormal Security' },
      { name: '/search-threats', description: 'Search for specific threat patterns in Abnormal Security by sender, recipient, attack type, or keywords' },
      { name: '/threat-triage', description: 'Triage recent email threats detected by Abnormal Security by severity and attack type' },
      { name: '/vendor-risk', description: 'Check vendor risk scores and compromised vendor activity in Abnormal Security VendorBase' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'abnormal/abnormal-security',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'atera',
    name: 'Atera',
    vendor: 'Atera',
    description: 'Atera - tickets, agents, customers, alerts, SNMP/HTTP monitors',
    category: 'psa',
    maturity: 'production',
    features: [
      'Agent Monitoring',
      'Alert Handling',
      'Customer Operations',
      'Device Management',
      'Ticket Management'
    ],
    skills: [
      { name: 'agents', description: 'Use this skill when working with Atera RMM agents - listing, searching, monitoring, or executing commands on managed devices.' },
      { name: 'alerts', description: 'Use this skill when working with Atera alerts - viewing, acknowledging, resolving, or managing alerts from monitored devices.' },
      { name: 'customers', description: 'Use this skill when working with Atera customers and contacts - creating, updating, searching, or managing customer records.' },
      { name: 'devices', description: 'Use this skill when working with Atera device monitors - HTTP, SNMP, and TCP monitors for network devices, services, and applications.' },
      { name: 'tickets', description: 'Use this skill when working with Atera tickets - creating, updating, searching, or managing service desk operations.' },
      { name: 'api-patterns', description: 'Use this skill when working with the Atera REST API - authentication, pagination, rate limiting, and error handling.' }
    ],
    agents: [
      { name: 'customer-health-scorer', description: 'Use this agent when an MSP account manager, service manager, or owner needs to score and rank client health across the Atera portfolio — not live operations management, but a structured assessment of each client based on device health trends, ticket velocity, recurring issues, patch compliance, and alert frequency.' },
      { name: 'msp-ops-assistant', description: 'Use this agent when an MSP needs combined RMM and PSA operations assistance through Atera — triaging alerts, managing the ticket queue, checking device health, and identifying patterns across the client base.' }
    ],
    commands: [
      { name: '/create-monitor', description: 'Create a threshold-based monitor for an Atera agent' },
      { name: '/create-ticket', description: 'Create a new service ticket in Atera' },
      { name: '/get-kb-articles', description: 'Search the Atera knowledge base for articles' },
      { name: '/list-alerts', description: 'List active RMM alerts from Atera' },
      { name: '/log-time', description: 'Log work hours on an Atera ticket' },
      { name: '/resolve-alert', description: 'Resolve an RMM alert in Atera' },
      { name: '/run-powershell', description: 'Execute a PowerShell script on an Atera agent' },
      { name: '/search-agents', description: 'Search for RMM agents in Atera by customer or machine name' },
      { name: '/search-customers', description: 'Search for Atera customers by name or criteria' },
      { name: '/update-ticket', description: 'Update fields on an existing Atera ticket' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'atera/atera',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'auvik',
    name: 'Auvik',
    vendor: 'Auvik',
    description: 'Auvik - network monitoring, device inventory, alerts, configurations, capacity planning across tenants',
    category: 'network',
    maturity: 'production',
    features: [
      'Alert Handling',
      'Device Management',
      'Networks'
    ],
    skills: [
      { name: 'alerts', description: 'Use this skill when working with Auvik alerts - severity tiers, status lifecycle, dismissal semantics, and the common alertName patterns that show up in MSP NOC queues.' },
      { name: 'devices', description: 'Use this skill when working with Auvik device records - identifying device types, interpreting manageStatus, reading lifecycle and warranty fields, and choosing between the v1 list endpoint and the detailed device endpoints.' },
      { name: 'networks', description: 'Use this skill when working with Auvik network and interface entities - the network entity model, IP-range scoping, interface-to-device relationships, and admin vs oper status.' },
      { name: 'api-patterns', description: 'Use this skill when working with the Auvik MCP tools - JSON:API envelope shape, basic-auth credential model, region routing, cursor-based pagination, rate-limit handling, and the v1 vs v2 device API distinction.' }
    ],
    agents: [
      { name: 'alert-responder', description: 'Use this agent for Auvik alert-related questions - what\'s open, what matters, what to dismiss, what to escalate.' },
      { name: 'capacity-planner', description: 'Use this agent for Auvik utilization, saturation, and headroom questions - "is this link maxed out?", "what links need an upgrade?", "where is the bottleneck?".' },
      { name: 'network-analyst', description: 'Use this agent when the user is asking what\'s wrong with a tenant\'s network, investigating broad performance complaints, mapping topology, or doing multi-signal triage across devices, interfaces, alerts, and statistics in Auvik.' }
    ],
    commands: [
      { name: '/alert-triage', description: 'Triage open Auvik alerts, rank by severity, and recommend dismissals for known noise' },
      { name: '/capacity-check', description: 'Scan Auvik interface statistics for saturated links and recurring congestion' },
      { name: '/device-inventory', description: 'Inventory devices for an Auvik tenant with type, manage status, and lifecycle breakdown' },
      { name: '/network-audit', description: 'Audit a tenant\'s networks, interfaces, and saved configurations; flag drift and missing backups' },
      { name: '/tenant-overview', description: 'Single-tenant Auvik snapshot - devices, alerts, networks, billing usage' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'auvik/auvik',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'autotask',
    name: 'Autotask PSA',
    vendor: 'Kaseya',
    description: 'Kaseya Autotask PSA - tickets, CRM, projects, contracts, billing',
    category: 'psa',
    maturity: 'production',
    features: [
      'Billing',
      'Configuration Items',
      'Contract Management',
      'CRM Operations',
      'Expense Management',
      'Picklists',
      'Product Catalog',
      'Project Management',
      'Quote Generation',
      'Service Calls',
      'Ticket Notes Attachments',
      'Ticket Management',
      'Time Entry Tracking'
    ],
    skills: [
      { name: 'billing', description: 'Use this skill when working with Autotask billing — retrieving billing items, checking approval levels, and searching invoices.' },
      { name: 'configuration-items', description: 'Use this skill when working with Autotask Configuration Items (CIs) - asset management, inventory tracking, warranty monitoring, lifecycle management, and relationship mapping.' },
      { name: 'contracts', description: 'Use this skill when working with Autotask contracts and service agreements - recurring services, block hours, time & materials, and contract billing.' },
      { name: 'crm', description: 'Use this skill when working with Autotask CRM - companies, contacts, sites/locations, and opportunities.' },
      { name: 'expenses', description: 'Use this skill when working with Autotask expense reports and expense items - creating expense reports, adding line items, searching reports by status or submitter, tracking reimbursable vs billable expenses, and managing expense approval workflows.' },
      { name: 'picklists', description: 'Use this skill when working with Autotask picklist and reference data — listing queues, ticket statuses, ticket priorities, and phases.' },
      { name: 'product-catalog', description: 'Use this skill when working with Autotask product catalog operations - searching products, checking pricing, managing inventory, and understanding the relationship between products, services, bundles, and price lists.' },
      { name: 'projects', description: 'Use this skill when working with Autotask projects - creating projects, managing tasks, phases, milestones, and resource assignments.' },
      { name: 'quotes', description: 'Use this skill when working with Autotask quotes and quote line items - creating quotes for customers, adding products/services/bundles as line items, managing pricing and discounts, linking quotes to opportunities, and building proposals.' },
      { name: 'service-calls', description: 'Use this skill when working with Autotask Service Calls - creating, scheduling, updating, or completing service calls linked to tickets.' },
      { name: 'ticket-notes-attachments', description: 'Use this skill when working with Autotask ticket notes, ticket attachments, and ticket charges — retrieving individual notes, downloading attachments, managing labor charges on tickets.' },
      { name: 'tickets', description: 'Use this skill when working with Autotask tickets - creating, updating, searching, or managing service desk operations.' },
      { name: 'time-entries', description: 'Use this skill when working with Autotask time entries - logging work hours, billing calculations, approval workflows, utilization tracking, and budget validation.' },
      { name: 'tool-discovery', description: 'Use this skill when Autotask MCP tools aren\'t loading, when you can\'t find the right Autotask tool to call, or when working with a lazy-loaded MCP connection where only meta-tools are available.' },
      { name: 'api-patterns', description: 'Use this skill when working with the Autotask REST API - authentication, query building, pagination, includes, rate limiting, and error handling.' }
    ],
    agents: [
      { name: 'contract-renewal-tracker', description: 'Use this agent when an MSP account manager, service manager, or operations lead needs to track and manage contract renewals in Autotask PSA — surfacing expiring contracts, identifying auto-renewal gaps, tracking MRR/ARR trends, and flagging clients who are still receiving service on expired contracts.' },
      { name: 'ticket-dispatcher', description: 'Use this agent when an MSP dispatcher or service manager needs to intelligently manage the Autotask PSA ticket queue — reviewing priorities, suggesting technician assignments, monitoring SLA compliance, and driving dispatch decisions.' }
    ],
    commands: [
      { name: '/add-note', description: 'Add a note or comment to an existing Autotask ticket' },
      { name: '/check-contract', description: 'View contract status, entitlements, and remaining hours for a company or specific contract' },
      { name: '/check-pricing', description: 'Check pricing details for an Autotask product or service from price lists' },
      { name: '/create-quote', description: 'Create a new Autotask quote with line items for products, services, and service bundles' },
      { name: '/create-ticket', description: 'Create a new service ticket in Autotask PSA' },
      { name: '/expenses', description: 'Use this skill when working with Autotask expense reports - creating reports, adding expense items, searching by status or submitter, and tracking reimbursable and billable expenses' },
      { name: '/lookup-asset', description: 'Search for Autotask configuration items/assets by name, serial number, or company' },
      { name: '/lookup-company', description: 'Search for Autotask companies by name, ID, or other attributes' },
      { name: '/lookup-contact', description: 'Search for Autotask contacts by name, email, phone, or company' },
      { name: '/my-tickets', description: 'List tickets currently assigned to you with optional filtering' },
      { name: '/reassign-ticket', description: 'Reassign a ticket to a different resource or queue' },
      { name: '/search-products', description: 'Search the Autotask product catalog for products, services, or inventory items' },
      { name: '/search-tickets', description: 'Search for tickets in Autotask PSA by various criteria' },
      { name: '/time-entry', description: 'Log time against tickets or projects in Autotask PSA' },
      { name: '/update-ticket', description: 'Update fields on an existing Autotask ticket (status, priority, queue, due date)' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'kaseya/autotask',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'kaseya-quote-manager',
    name: 'Kaseya Quote Manager',
    vendor: 'Kaseya',
    description: 'Kaseya Quote Manager (Datto Commerce) - read-only quotes, sales orders, purchasing, catalog, CRM, org',
    category: 'sales',
    maturity: 'beta',
    features: [
      'Purchasing',
      'Quote Generation'
    ],
    skills: [
      { name: 'purchasing', description: 'Use this skill when navigating Kaseya Quote Manager procurement data — purchase orders, their lines and costs, suppliers, and product-supplier relationships.' },
      { name: 'quotes', description: 'Use this skill when navigating Kaseya Quote Manager quotes — drilling from a quote into its sections and line items, and following quotes through to sales orders, order lines, and payments.' },
      { name: 'api-patterns', description: 'Use this skill when working with the Kaseya Quote Manager (Datto Commerce) MCP tools — API-key authentication, the read-only tool surface, page/pageSize pagination with modifiedAfter, rate limits, and error handling.' }
    ],
    agents: [],
    commands: [
      { name: '/get-quote', description: 'Get a Kaseya Quote Manager quote with its sections and line items' },
      { name: '/get-sales-order', description: 'Get a Kaseya Quote Manager sales order with its lines and payments' },
      { name: '/list-quotes', description: 'List Kaseya Quote Manager quotes, optionally scoped to a recent window' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'kaseya-quote-manager/kaseya-quote-manager',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'betterstack',
    name: 'BetterStack',
    vendor: 'BetterStack',
    description: 'Better Stack - uptime monitoring, logging, incident management',
    category: 'monitoring',
    maturity: 'production',
    features: [
      'Incident Management',
      'Logging',
      'Monitor Configuration',
      'On-Call Scheduling',
      'Status Pages'
    ],
    skills: [
      { name: 'incidents', description: 'Use this skill when working with Better Stack incidents -- listing, triaging, acknowledging, and resolving incidents triggered by uptime monitors or manual reports.' },
      { name: 'logging', description: 'Use this skill when working with Better Stack log management (Logtail) -- querying logs, managing log sources, structured log search, log-based alerting, and log analysis workflows.' },
      { name: 'monitors', description: 'Use this skill when working with Better Stack uptime monitors -- listing, creating, updating, pausing, and deleting monitors, heartbeat monitors, monitor groups, and check types.' },
      { name: 'oncall', description: 'Use this skill when working with Better Stack on-call schedules -- on-call calendars, escalation/notification policies, rotation management, understanding who is currently on-call, and responding to active incidents via the on-call flow.' },
      { name: 'status-pages', description: 'Use this skill when working with Better Stack status pages -- managing status pages, adding resources/components, posting maintenance windows, and communicating service status to end users.' },
      { name: 'api-patterns', description: 'Use this skill when working with the Better Stack MCP tools -- available tools, authentication via Bearer token, API structure, cursor-based pagination, rate limiting, error handling, and best practices.' }
    ],
    agents: [
      { name: 'sla-uptime-reporter', description: 'Use this agent when an MSP needs to generate SLA-focused uptime reports for clients, calculate SLA achievement percentages, identify chronic underperforming monitors, or produce client-facing availability summaries.' },
      { name: 'uptime-incident-responder', description: 'Use this agent when an MSP needs to respond to a BetterStack uptime incident, investigate monitor failures, coordinate on-call response, or produce an incident report.' }
    ],
    commands: [
      { name: '/create-monitor', description: 'Create a new Better Stack uptime monitor' },
      { name: '/incident-triage', description: 'Triage current Better Stack incidents' },
      { name: '/monitor-status', description: 'Check all Better Stack monitor statuses and identify downtime' },
      { name: '/search-logs', description: 'Search logs via Better Stack Logtail' },
      { name: '/status-page-update', description: 'Update a Better Stack status page with current status or maintenance' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'betterstack/betterstack',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'blumira',
    name: 'Blumira',
    vendor: 'Blumira',
    description: 'Blumira - SIEM findings management, device inventory, MSP multi-tenant operations, and security posture analysis',
    category: 'security',
    maturity: 'production',
    features: [
      'Agent Monitoring',
      'Findings',
      'Msp',
      'Resolutions',
      'User Management'
    ],
    skills: [
      { name: 'agents', description: 'Use this skill when working with Blumira agents, devices, and agent keys, including listing devices, checking agent health, and managing agent deployment keys.' },
      { name: 'findings', description: 'Use this skill when working with Blumira findings (security alerts/detections), including listing, filtering, investigating, resolving, assigning, and commenting on findings.' },
      { name: 'msp', description: 'Use this skill when working with Blumira MSP (Managed Service Provider) multi-tenant operations, including managing multiple client accounts, cross-account finding queries, and per-account device/user management.' },
      { name: 'resolutions', description: 'Use this skill when resolving Blumira findings, choosing the correct resolution type, or understanding resolution workflows and their impact on security metrics.' },
      { name: 'users', description: 'Use this skill when listing or looking up Blumira users, finding user IDs for finding assignment, or auditing user access.' },
      { name: 'api-patterns', description: 'Use this skill when working with Blumira API authentication, understanding the dual path structure (org vs MSP), constructing filtered queries, handling pagination, or troubleshooting API errors.' }
    ],
    agents: [
      { name: 'compliance-reporter', description: 'Use this agent when generating compliance-oriented security reports from Blumira SIEM data — not for live incident investigation, but for producing evidence packages, coverage gap assessments, and log source health summaries for frameworks like SOC 2, HIPAA, and CIS.' },
      { name: 'siem-investigator', description: 'Use this agent when investigating Blumira SIEM alerts and findings, tracing attack chains across data sources, resolving detections, auditing security posture across MSP client accounts, or producing threat investigation reports.' }
    ],
    commands: [
      { name: '/agent-inventory', description: 'List all devices and agents across the organization with status and health information' },
      { name: '/finding-triage', description: 'Triage open Blumira findings by severity, presenting a prioritized list for review' },
      { name: '/investigate-finding', description: 'Deep investigation of a specific Blumira finding with details, context, and comment history' },
      { name: '/msp-overview', description: 'MSP dashboard showing all managed accounts with open finding counts and severity breakdown' },
      { name: '/resolve-finding', description: 'Resolve a Blumira finding with the appropriate resolution type and notes' },
      { name: '/security-posture', description: 'Overall security posture review including open findings by severity, agent coverage, and trends' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'blumira/blumira',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'checkpoint-avanan',
    name: 'Checkpoint Avanan',
    vendor: 'Email Security',
    description: 'Checkpoint Harmony Email & Collaboration (Avanan) - quarantine, threats, policies, incidents, Smart Banners',
    category: 'email-security',
    maturity: 'production',
    features: [
      'Incident Management',
      'Policies',
      'Quarantine',
      'Threats'
    ],
    skills: [
      { name: 'incidents', description: 'Use this skill when working with Checkpoint Harmony Email security incidents - incident lifecycle, status transitions, investigation workflows, notes and evidence collection, remediation tracking.' },
      { name: 'policies', description: 'Use this skill when working with Checkpoint Harmony Email security policies - DLP policies, anti-phishing rules, anti-malware settings, quarantine policies, allow/block lists, and policy configuration.' },
      { name: 'quarantine', description: 'Use this skill when working with Checkpoint Harmony Email quarantine - listing, searching, releasing, deleting quarantined emails.' },
      { name: 'threats', description: 'Use this skill when working with Checkpoint Harmony Email threat detection and analysis - phishing, malware, BEC, account takeover, IOC extraction, threat timelines, and severity assessment.' },
      { name: 'api-patterns', description: 'Use this skill when working with the Checkpoint Harmony Email API - OAuth2 client credentials authentication, base URLs, rate limiting, pagination, error handling, and common API patterns.' }
    ],
    agents: [
      { name: 'cloud-email-defender', description: 'Use this agent when investigating quarantined threats, managing email security events, auditing Avanan tenant configuration, or performing cross-tenant threat sweeps in Check Point Avanan (Harmony Email & Collaboration).' },
      { name: 'tenant-policy-auditor', description: 'Use this agent when an MSP needs to audit email security policy completeness and correctness across Avanan (Check Point Harmony Email & Collaboration) managed tenants — verifying anti-phishing coverage, attachment sandboxing, impersonation protection, DLP rules, and exception hygiene.' }
    ],
    commands: [
      { name: '/check-threat', description: 'Get detailed threat analysis including IOCs and timeline from Checkpoint Harmony Email' },
      { name: '/manage-policy', description: 'View or toggle email security policies in Checkpoint Harmony Email' },
      { name: '/release-quarantine', description: 'Release quarantined email(s) back to recipients in Checkpoint Harmony Email' },
      { name: '/search-quarantine', description: 'Search quarantined emails in Checkpoint Harmony Email by various criteria' },
      { name: '/search-threats', description: 'Search detected threats in Checkpoint Harmony Email by type, severity, and date range' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'email-security/checkpoint-avanan',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'cipp',
    name: 'CIPP',
    vendor: 'CIPP',
    description: 'CIPP (CyberDrain Improved Partner Portal) - Microsoft 365 multi-tenant management for MSPs: tenants, users, mailboxes, conditional access, standards, BPA, licensing, GDAP, and alerts',
    category: 'security',
    maturity: 'production',
    features: [
      'Alert Handling',
      'Groups',
      'Licenses',
      'Mailbox & Email',
      'Ops',
      'Security Posture',
      'Standards',
      'Tenants',
      'User Management'
    ],
    skills: [
      { name: 'alerts', description: 'Use this skill when working with CIPP alerts and audit logs — reviewing the queued alert backlog across tenants, investigating sign-in or admin activity in audit logs, correlating alerts with tenants.' },
      { name: 'groups', description: 'Use this skill when listing or creating M365 groups in CIPP — security groups, distribution lists, M365 groups, mail-enabled security groups.' },
      { name: 'licenses', description: 'Use this skill when working with M365 license assignments and CSP license inventory through CIPP — listing license usage per tenant, identifying unused licenses, surfacing license SKUs available for assignment, and reviewing CSP-level license commitments.' },
      { name: 'mailboxes', description: 'Use this skill when working with Exchange Online mailboxes through CIPP — listing mailboxes, auditing mailbox permissions, configuring out-of-office auto-replies, and setting email forwarding.' },
      { name: 'ops', description: 'Use this skill when working with CIPP operational tooling — GDAP role and invite management, scheduled tasks, server health checks, version reporting, and CIPP application logs.' },
      { name: 'security', description: 'Use this skill when reviewing M365 conditional access policies and named locations through CIPP — auditing CA coverage, finding policies that exclude critical apps, listing trusted IP ranges, identifying tenants without baseline conditional access.' },
      { name: 'standards', description: 'Use this skill when working with CIPP Standards, Best Practice Analyser (BPA), and domain health checks — listing configured standards per tenant, triggering on-demand compliance checks, retrieving BPA results, checking SPF/DKIM/DMARC.' },
      { name: 'tenants', description: 'Use this skill when working with CIPP tenants — listing managed M365 tenants, checking tenant details, identifying tenant ID/domain, and scoping operations to a specific tenant.' },
      { name: 'users', description: 'Use this skill when working with CIPP-managed M365 users — creating accounts, editing properties, disabling, resetting passwords, resetting MFA, revoking sessions, full offboarding, BEC investigation, MFA status reporting, and listing user devices/groups.' }
    ],
    agents: [
      { name: 'security-posture-reviewer', description: 'Use this agent when an MSP security lead, vCISO, or service manager needs to sweep the M365 portfolio for security posture issues — Secure Score regressions, MFA enrollment gaps, conditional access drift, BPA failures, and broken domain authentication.' },
      { name: 'user-offboarding-runner', description: 'Use this agent when an MSP technician, dispatcher, or HR-facing operator needs to run a complete M365 user offboarding through CIPP.' }
    ],
    commands: [
      { name: '/offboard-user', description: 'Run the complete CIPP M365 offboarding workflow for a departing user — capture audit state, revoke access, handle mailbox, reclaim licenses' },
      { name: '/secure-score-report', description: 'Generate a portfolio-wide M365 security posture report — Secure Score equivalents, MFA enrollment, conditional access coverage, and domain authentication across all managed tenants' },
      { name: '/standards-drift', description: 'Find tenants that have drifted from the MSP\'s configured CIPP standards baseline — missing standards, standards in Report-only mode, recent compliance failures' },
      { name: '/tenant-health', description: 'Quick health snapshot for a single tenant — BPA failures, conditional access enforcement, MFA gaps, domain authentication, standards compliance' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'cipp/cipp',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'connectwise-automate',
    name: 'ConnectWise Automate',
    vendor: 'ConnectWise',
    description: 'ConnectWise Automate - computers, clients, scripts, monitors, alerts',
    category: 'rmm',
    maturity: 'beta',
    features: [
      'Alert Handling',
      'Client Operations',
      'Computer Management',
      'Monitor Configuration',
      'Script Execution'
    ],
    skills: [
      { name: 'alerts', description: 'Use this skill when working with ConnectWise Automate alerts - listing active alerts, acknowledging alerts, viewing alert history, and creating tickets from alerts.' },
      { name: 'clients', description: 'Use this skill when working with ConnectWise Automate clients - creating, reading, updating, and deleting client organizations.' },
      { name: 'computers', description: 'Use this skill when working with ConnectWise Automate computers/endpoints - listing, searching, managing, and monitoring devices.' },
      { name: 'monitors', description: 'Use this skill when working with ConnectWise Automate monitors - configuring thresholds, creating templates, and assigning to computers.' },
      { name: 'scripts', description: 'Use this skill when working with ConnectWise Automate scripts - listing, executing, passing parameters, and retrieving results.' },
      { name: 'api-patterns', description: 'Use this skill when working with the ConnectWise Automate REST API - authentication methods, token management, pagination, filtering with OData syntax, rate limiting, and error handling.' }
    ],
    agents: [
      { name: 'automation-health-checker', description: 'Use this agent when an MSP technician or engineer needs to audit the health of their ConnectWise Automate RMM environment.' }
    ],
    commands: [
      { name: '/list-computers', description: 'List computers in ConnectWise Automate with optional filters' },
      { name: '/run-script', description: 'Execute a script on an endpoint in ConnectWise Automate' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'connectwise/automate',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'connectwise-psa',
    name: 'ConnectWise PSA',
    vendor: 'ConnectWise',
    description: 'ConnectWise PSA - tickets, companies, contacts, projects, time',
    category: 'psa',
    maturity: 'production',
    features: [
      'Company Management',
      'Contact Management',
      'Product Catalog',
      'Project Management',
      'Ticket Management',
      'Time Entry Tracking'
    ],
    skills: [
      { name: 'companies', description: 'Use this skill when working with ConnectWise PSA companies - creating, updating, searching, or managing company/account records.' },
      { name: 'contacts', description: 'Use this skill when working with ConnectWise PSA contacts - creating, updating, searching, or managing contact records.' },
      { name: 'product-catalog', description: 'Use this skill when working with the ConnectWise PSA product catalog — searching, creating, or updating catalog items (SKUs), managing categories, subcategories, manufacturers, or using catalog items on quotes, opportunities, agreements, and tickets.' },
      { name: 'projects', description: 'Use this skill when working with ConnectWise PSA projects - creating, updating, managing project phases, templates, and resource allocation.' },
      { name: 'tickets', description: 'Use this skill when working with ConnectWise PSA tickets - creating, updating, searching, or managing service desk operations.' },
      { name: 'time-entries', description: 'Use this skill when working with ConnectWise PSA time entries - creating, updating, searching, or managing time tracking.' },
      { name: 'api-patterns', description: 'Use this skill when working with the ConnectWise PSA REST API - authentication using public/private keys and clientId, pagination with page/pageSize, conditions query syntax, rate limiting (60/min), and error handling.' }
    ],
    agents: [
      { name: 'procurement-specialist', description: 'Use this agent when an MSP procurement lead, sales engineer, service manager, or owner needs to work against the ConnectWise Manage product catalog and the procurement/quoting workflows it feeds.' },
      { name: 'project-tracker', description: 'Use this agent when an MSP project manager, service manager, or operations lead needs a review of all open projects in ConnectWise Manage — checking milestone deadlines, budget vs. actuals, overdue phases, and projects at risk of scope creep or delivery failure.' },
      { name: 'service-desk-ops', description: 'Use this agent when an MSP dispatcher, service manager, or team lead needs to review the current state of the ConnectWise Manage service desk.' }
    ],
    commands: [
      { name: '/add-note', description: 'Add an internal or external note to a ConnectWise PSA ticket' },
      { name: '/check-agreement', description: 'View agreement status and entitlements for a company in ConnectWise PSA' },
      { name: '/close-ticket', description: 'Close a ConnectWise PSA ticket with resolution notes' },
      { name: '/create-ticket', description: 'Create a new service ticket in ConnectWise PSA' },
      { name: '/get-ticket', description: 'Retrieve detailed ticket information from ConnectWise PSA' },
      { name: '/log-time', description: 'Log a time entry against a ConnectWise PSA ticket' },
      { name: '/lookup-config', description: 'Search for configuration items (assets) in ConnectWise PSA' },
      { name: '/schedule-entry', description: 'Create a schedule entry/appointment in ConnectWise PSA' },
      { name: '/search-tickets', description: 'Search for tickets in ConnectWise PSA by various criteria' },
      { name: '/update-ticket', description: 'Update fields on an existing ConnectWise PSA ticket' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'connectwise/manage',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'datto-rmm',
    name: 'Datto RMM',
    vendor: 'Kaseya',
    description: 'Datto RMM - devices, alerts, jobs, patches, monitoring',
    category: 'rmm',
    maturity: 'production',
    features: [
      'Alert Handling',
      'Audit Data',
      'Device Management',
      'Job Execution',
      'Site Management',
      'Variable Management'
    ],
    skills: [
      { name: 'alerts', description: 'Use this skill when working with Datto RMM alerts - viewing, resolving, and managing monitoring alerts.' },
      { name: 'audit', description: 'Use this skill when working with Datto RMM audit data - hardware inventory, software inventory, network interfaces, and system information.' },
      { name: 'devices', description: 'Use this skill when working with Datto RMM devices - listing, searching, managing, and monitoring endpoints.' },
      { name: 'jobs', description: 'Use this skill when working with Datto RMM jobs - running quick jobs, scheduling jobs, monitoring job status, and viewing results.' },
      { name: 'sites', description: 'Use this skill when working with Datto RMM sites - listing, managing, and configuring client locations.' },
      { name: 'variables', description: 'Use this skill when working with Datto RMM variables - account-level and site-level variables for storing configuration data.' },
      { name: 'api-patterns', description: 'Use this skill when working with the Datto RMM API - authentication, OAuth 2.0 flow, platform selection, pagination, rate limiting, and error handling.' }
    ],
    agents: [
      { name: 'backup-health-monitor', description: 'Use this agent when an MSP needs to audit backup and BC/DR health across their Datto RMM managed client portfolio — not a general fleet health check, but a focused review of backup job success rates, last successful backups per device, retention policy compliance, offsite replication status, and restore test records.' },
      { name: 'rmm-health-auditor', description: 'Use this agent when an MSP needs a comprehensive health audit of their Datto RMM managed device fleet.' }
    ],
    commands: [
      { name: '/device-lookup', description: 'Find a device in Datto RMM by hostname, IP address, or MAC address' },
      { name: '/resolve-alert', description: 'Resolve an open alert in Datto RMM' },
      { name: '/run-job', description: 'Run a quick job on a device in Datto RMM' },
      { name: '/site-devices', description: 'List all devices at a site in Datto RMM' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'kaseya/datto-rmm',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'domotz',
    name: 'Domotz',
    vendor: 'Domotz',
    description: 'Domotz - network monitoring, SNMP discovery, device management',
    category: 'network',
    maturity: 'production',
    features: [
      'Agent Monitoring',
      'Alert Handling',
      'Device Management',
      'Eyes',
      'Network'
    ],
    skills: [
      { name: 'agents', description: 'Use this skill when managing Domotz agents (collectors), sites, and network probes -- listing agents, checking agent health, viewing site details, and monitoring collector connectivity.' },
      { name: 'alerts', description: 'Use this skill when working with Domotz alerts -- viewing active alerts, configuring alert profiles, managing alert triggers, and handling notifications for device and network events.' },
      { name: 'devices', description: 'Use this skill when working with Domotz device inventory -- listing devices, searching by name/IP/MAC, checking device status, viewing device details, and understanding network topology.' },
      { name: 'eyes', description: 'Use this skill when working with Domotz Eyes -- TCP and HTTP sensors, custom monitoring checks, synthetic tests, latency tracking, and service availability monitoring.' },
      { name: 'network', description: 'Use this skill when working with Domotz network operations -- network scanning, SNMP polling, port monitoring, speed tests, and network topology discovery.' },
      { name: 'api-patterns', description: 'Use this skill when working with the Domotz MCP tools -- available tools, authentication via API key, API structure, pagination, rate limiting, region selection, error handling, and best practices.' }
    ],
    agents: [],
    commands: [
      { name: '/alert-status', description: 'Check current Domotz alerts across all agents' },
      { name: '/device-inventory', description: 'List all devices at a Domotz-monitored site' },
      { name: '/device-lookup', description: 'Find a Domotz device by name, IP address, or MAC address' },
      { name: '/network-scan', description: 'Scan a network for devices via a Domotz agent' },
      { name: '/site-overview', description: 'Overview of a Domotz site\'s network health' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'domotz/domotz',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'halopsa',
    name: 'HaloPSA',
    vendor: 'Halo',
    description: 'HaloPSA - tickets, clients, assets, contracts (OAuth 2.0)',
    category: 'psa',
    maturity: 'production',
    features: [
      'Agent Monitoring',
      'Asset Management',
      'Client Operations',
      'Contract Management',
      'Invoice Management',
      'Ticket Management'
    ],
    skills: [
      { name: 'agents', description: 'Use this skill when working with HaloPSA agents (technicians) and teams — listing technicians, retrieving agent details, and listing team structures.' },
      { name: 'assets', description: 'Use this skill when working with HaloPSA assets - tracking devices, managing configuration items, hardware lifecycle, and asset relationships.' },
      { name: 'clients', description: 'Use this skill when working with HaloPSA clients - creating, updating, searching, or managing customer relationships.' },
      { name: 'contracts', description: 'Use this skill when working with HaloPSA contracts - managing service agreements, recurring billing, prepaid hours, and contract renewals.' },
      { name: 'invoices', description: 'Use this skill when working with HaloPSA invoices — listing invoices by client or date range, filtering by payment and send status, and retrieving individual invoice details.' },
      { name: 'tickets', description: 'Use this skill when working with HaloPSA tickets - creating, updating, searching, or managing service desk operations.' },
      { name: 'api-patterns', description: 'Use this skill when working with the HaloPSA REST API - OAuth 2.0 Client Credentials authentication, tenant-aware URLs, query building, pagination, rate limiting, and error handling.' }
    ],
    agents: [
      { name: 'service-desk-ops', description: 'Use this agent when an MSP dispatcher, team lead, or service manager needs to triage and manage the HaloPSA ticket queue.' },
      { name: 'sla-performance-reporter', description: 'Use this agent when an MSP service manager, operations lead, or account manager needs SLA compliance reporting and trend analysis in HaloPSA — not live ticket triage, but retrospective reporting on how well the team has met SLA commitments by client, by technician, and by ticket category.' }
    ],
    commands: [
      { name: '/add-action', description: 'Add an action (note, update, or response) to an existing HaloPSA ticket' },
      { name: '/contract-status', description: 'Check contract status, service entitlements, and billing information for a client' },
      { name: '/create-ticket', description: 'Create a new service ticket in HaloPSA' },
      { name: '/kb-search', description: 'Search the HaloPSA knowledge base for articles and solutions' },
      { name: '/search-assets', description: 'Search for configuration items/assets by name, serial number, type, or client' },
      { name: '/search-clients', description: 'Search for HaloPSA clients by name, domain, or other attributes' },
      { name: '/search-tickets', description: 'Search for tickets in HaloPSA by various criteria' },
      { name: '/show-ticket', description: 'Display comprehensive ticket information including history, actions, and related entities' },
      { name: '/sla-dashboard', description: 'View SLA status across tickets, including approaching breaches and at-risk tickets' },
      { name: '/update-ticket', description: 'Update fields on an existing HaloPSA ticket including status, priority, and assignment' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'halopsa/halopsa',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'hudu',
    name: 'Hudu',
    vendor: 'Hudu',
    description: 'Hudu IT documentation - companies, assets, articles, passwords, websites',
    category: 'documentation',
    maturity: 'production',
    features: [
      'Knowledge Base Articles',
      'Asset Management',
      'Company Management',
      'Password Management',
      'Website Monitoring'
    ],
    skills: [
      { name: 'articles', description: 'Use this skill when working with Hudu articles (knowledge base) - creating, searching, updating, and managing documentation articles.' },
      { name: 'assets', description: 'Use this skill when working with Hudu assets and asset layouts - servers, workstations, network devices, and other documented items.' },
      { name: 'companies', description: 'Use this skill when working with Hudu companies (clients/organizations) - creating, searching, updating, archiving, and managing client documentation.' },
      { name: 'passwords', description: 'Use this skill when working with Hudu passwords (asset passwords) - secure credential storage, retrieval, folders, and access patterns.' },
      { name: 'websites', description: 'Use this skill when working with Hudu website records - website monitoring, SSL/TLS tracking, email security (DMARC, DKIM, SPF), DNS records, and linking websites to companies.' },
      { name: 'api-patterns', description: 'Use this skill when working with the Hudu API - authentication, REST structure, filtering, pagination, rate limiting, error handling, and best practices.' }
    ],
    agents: [
      { name: 'documentation-auditor', description: 'Use this agent when an MSP technician or vCIO needs to find and fix documentation debt in Hudu.' },
      { name: 'runbook-freshness-auditor', description: 'Use this agent when an MSP needs to audit the currency and coverage of runbooks and SOPs in Hudu.' }
    ],
    commands: [
      { name: '/find-company', description: 'Find a company in Hudu by name' },
      { name: '/get-password', description: 'Retrieve a password from Hudu (with security logging)' },
      { name: '/lookup-asset', description: 'Find an asset in Hudu by name, hostname, serial number, or IP address' },
      { name: '/search-articles', description: 'Search Hudu knowledge base articles by keyword or phrase' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'hudu/hudu',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'huntress',
    name: 'Huntress',
    vendor: 'Huntress',
    description: 'Huntress - managed threat detection, incident response, endpoint agent management, escalations, and billing reports',
    category: 'security',
    maturity: 'production',
    features: [
      'Agent Monitoring',
      'Billing',
      'Escalations',
      'Incident Management',
      'Organization Management',
      'Signals'
    ],
    skills: [
      { name: 'agents', description: 'Use this skill when managing Huntress endpoint agents — listing agents, filtering by organization or platform, checking agent health and status, and investigating specific agent details.' },
      { name: 'billing', description: 'Use this skill when generating Huntress billing and summary reports — listing available reports, retrieving billing details, and creating client-facing summaries for MSP invoicing.' },
      { name: 'escalations', description: 'Use this skill when working with Huntress escalations — listing, reviewing, and resolving escalations from the Huntress SOC team.' },
      { name: 'incidents', description: 'Use this skill when working with Huntress incidents - querying incidents by organization and status, reviewing SOC-recommended remediation details, approving or rejecting remediations individually or in bulk, checking remediation execution status, and resolving incidents after all remediations are processed.' },
      { name: 'organizations', description: 'Use this skill when managing Huntress organizations — creating, listing, updating, deleting organizations, and managing client org structure for MSP multi-tenancy.' },
      { name: 'signals', description: 'Use this skill when working with Huntress security signals — monitoring, listing, filtering, and investigating signals across managed endpoints.' },
      { name: 'api-patterns', description: 'Use this skill when working with the Huntress MCP tools — available tools, authentication via HTTP Basic Auth, API structure, pagination with page tokens, rate limiting (60 req/min), error handling, and best practices.' }
    ],
    agents: [
      { name: 'client-onboarding-validator', description: 'Use this agent when validating a newly onboarded client in Huntress — checking that agents are deployed and reporting, confirming SOC coverage is active, identifying any endpoints missing agents, and surfacing initial detections that fired during or after deployment.' },
      { name: 'incident-responder', description: 'Use this agent when triaging Huntress incidents, reviewing SOC escalations, approving or rejecting endpoint remediations, investigating security signals, or managing the Huntress agent fleet across MSP client organizations.' }
    ],
    commands: [
      { name: '/agent-inventory', description: 'List and filter Huntress agents across organizations' },
      { name: '/billing-report', description: 'Generate a Huntress billing summary for a period' },
      { name: '/incident-triage', description: 'Triage open Huntress incidents by severity' },
      { name: '/investigate-incident', description: 'Deep dive investigation into a specific Huntress incident with remediations' },
      { name: '/org-health', description: 'Organization health check covering agents, incidents, and escalations' },
      { name: '/resolve-escalation', description: 'Review and resolve a Huntress escalation' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'huntress/huntress',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'it-glue',
    name: 'IT Glue',
    vendor: 'Kaseya',
    description: 'IT Glue - organizations, assets, passwords, flexible assets',
    category: 'documentation',
    maturity: 'production',
    features: [
      'Configuration Items',
      'Contact Management',
      'Documentation',
      'Flexible Assets',
      'Organization Management',
      'Password Management'
    ],
    skills: [
      { name: 'configurations', description: 'Use this skill when working with IT Glue configurations (assets) - servers, workstations, network devices, and other infrastructure.' },
      { name: 'contacts', description: 'Use this skill when working with IT Glue contacts - managing client contacts, contact types, locations, and communication details.' },
      { name: 'documents', description: 'Use this skill when working with IT Glue documents - creating, organizing, and managing documentation.' },
      { name: 'flexible-assets', description: 'Use this skill when working with IT Glue flexible assets - custom asset types for structured documentation.' },
      { name: 'organizations', description: 'Use this skill when working with IT Glue organizations (companies/clients) - creating, searching, updating, and managing client documentation.' },
      { name: 'passwords', description: 'Use this skill when working with IT Glue passwords - secure credential storage, password categories, folders, embedded passwords, and access patterns.' },
      { name: 'api-patterns', description: 'Use this skill when working with the IT Glue API - authentication, JSON:API structure, filtering, sorting, pagination, rate limiting, sideloading with includes, and error handling.' }
    ],
    agents: [
      { name: 'asset-documentation-linker', description: 'Use this agent when an MSP needs to find and fix broken or missing linkages between IT Glue objects — configurations without passwords, devices without runbooks, organizations without network diagrams, contacts unlinked from assets.' },
      { name: 'documentation-auditor', description: 'Use this agent when an MSP needs to audit documentation completeness and freshness across their IT Glue client portfolio.' }
    ],
    commands: [
      { name: '/edit-doc-sections', description: 'Read, edit, and restructure sections of an IT Glue document' },
      { name: '/find-organization', description: 'Find an organization in IT Glue by name' },
      { name: '/get-password', description: 'Retrieve a password from IT Glue (with security logging)' },
      { name: '/lookup-asset', description: 'Find a configuration item (asset) in IT Glue by name, hostname, serial number, or IP address' },
      { name: '/search-docs', description: 'Search IT Glue documentation by keyword or phrase' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'kaseya/it-glue',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'knowbe4',
    name: 'Knowbe4',
    vendor: 'Email Security',
    description: 'KnowBe4 - phishing simulation, security awareness training, user risk management',
    category: 'email-security',
    maturity: 'production',
    features: [
      'Phishing',
      'Reporting',
      'Training',
      'User Management'
    ],
    skills: [
      { name: 'phishing', description: 'Use this skill when working with KnowBe4 phishing simulations - creating campaigns, managing security tests, tracking recipient interactions (sent, opened, clicked, reported), calculating phish-prone percentages, and analyzing phishing simulation results.' },
      { name: 'reporting', description: 'Use this skill when generating KnowBe4 security awareness reports - phishing summary statistics, training completion rates, risk score overviews, trend analysis, organizational benchmarks, and executive dashboards.' },
      { name: 'training', description: 'Use this skill when working with KnowBe4 training campaigns - creating and managing training assignments, tracking enrollment and completion, browsing training modules and content library, managing store purchases, and monitoring compliance deadlines.' },
      { name: 'users', description: 'Use this skill when working with KnowBe4 users and groups - user lifecycle management, group creation and membership, risk scores, risk score history, user event tracking, and user status management.' },
      { name: 'api-patterns', description: 'Use this skill when working with the KnowBe4 REST API - Bearer token authentication, multi-region base URLs, pagination, rate limiting, error handling, and common request patterns.' }
    ],
    agents: [
      { name: 'security-awareness-analyst', description: 'Use this agent when analyzing phishing simulation results, identifying high-risk users, tracking training completion, recommending targeted security awareness programs, or responding to user-reported phishing through KnowBe4 PhishER for MSP clients.' },
      { name: 'training-enforcer', description: 'Use this agent when tracking and enforcing security awareness training completion in KnowBe4 — identifying users who have missed deadlines, finding repeat phishing simulation clickers who represent high-risk users, drafting re-training campaigns, or generating compliance completion reports for clients.' }
    ],
    commands: [
      { name: '/campaign-summary', description: 'Get summary of recent phishing and training campaigns from KnowBe4' },
      { name: '/group-report', description: 'Get security awareness metrics for a KnowBe4 group' },
      { name: '/phishing-results', description: 'View phishing campaign results and click rates from KnowBe4' },
      { name: '/training-status', description: 'Check training completion status for users or groups in KnowBe4' },
      { name: '/user-risk', description: 'Get risk score and risk history for a KnowBe4 user' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'email-security/knowbe4',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'liongard',
    name: 'Liongard',
    vendor: 'Liongard',
    description: 'Liongard - environments, inspections, systems, detections, alerts, configuration monitoring',
    category: 'rmm',
    maturity: 'beta',
    features: [
      'Detection & Alerting',
      'Environment Management',
      'Inspection Monitoring',
      'System Configuration'
    ],
    skills: [
      { name: 'detections', description: 'Use this skill when working with Liongard detections, change monitoring, alerts, metrics, or timeline events.' },
      { name: 'environments', description: 'Use this skill when working with Liongard environments (customer organizations), environment groups, or related entities.' },
      { name: 'inspections', description: 'Use this skill when working with Liongard inspectors, launchpoints, inspection scheduling, or triggering inspections on demand.' },
      { name: 'overview', description: 'Use this skill when Claude needs context about the Liongard platform, terminology, capabilities, authentication patterns, or API structure.' },
      { name: 'systems', description: 'Use this skill when working with Liongard systems, system details, dataprints for JMESPath evaluation, or asset inventory.' }
    ],
    agents: [
      { name: 'change-detective', description: 'Use this agent when an MSP needs to detect unauthorized or unexpected configuration changes, audit compliance drift, or surface undocumented systems across their client environments.' },
      { name: 'compliance-drift-reporter', description: 'Use this agent when an MSP needs to generate compliance baseline drift reports, produce evidence for compliance frameworks, or identify coverage gaps where inspectors have not checked in.' }
    ],
    commands: [
      { name: '/liongard-environment-summary', description: 'Generate a detailed summary of a Liongard environment' },
      { name: '/liongard-health-check', description: 'Check Liongard connectivity and return system health summary' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'liongard/liongard',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'm365',
    name: 'Microsoft 365',
    vendor: 'Microsoft',
    description: 'Microsoft 365 - users, mailboxes, Teams, OneDrive, licensing, and security posture',
    category: 'productivity',
    maturity: 'production',
    features: [
      'Calendar Management',
      'File Management',
      'License Auditing',
      'Mailbox & Email',
      'Security Posture',
      'Teams Administration',
      'User Management'
    ],
    skills: [
      { name: 'calendar', description: 'Use this skill when working with Microsoft 365 calendars - viewing events, finding free/busy times, creating meetings, managing room bookings, or checking a user\'s schedule.' },
      { name: 'files', description: 'Use this skill when working with Microsoft 365 files - OneDrive personal storage, SharePoint document libraries, file sharing permissions, storage quotas, or searching across a user\'s files.' },
      { name: 'licensing', description: 'Use this skill when managing Microsoft 365 licenses - checking available seats, assigning or removing licenses, auditing license usage, finding unused licenses, or planning license optimization for a customer tenant.' },
      { name: 'mailboxes', description: 'Use this skill when working with Microsoft 365 mailboxes - reading email, searching messages, managing shared mailboxes, setting out-of-office replies, checking mailbox size, or diagnosing mail flow issues.' },
      { name: 'security', description: 'Use this skill for Microsoft 365 security posture checks - MFA enrollment status, conditional access policies, risky sign-ins, suspicious inbox rules, compromised account indicators, and security audit tasks.' },
      { name: 'teams', description: 'Use this skill when working with Microsoft Teams - listing teams and channels, managing team membership, finding meetings, checking Teams usage, or troubleshooting Teams access issues.' },
      { name: 'users', description: 'Use this skill when working with Microsoft 365 users - listing, searching, creating, disabling, or checking user properties.' },
      { name: 'api-patterns', description: 'Use this skill for Microsoft Graph API fundamentals - authentication patterns, OData query operators, pagination, throttling/retry, batch requests, and delta queries.' }
    ],
    agents: [
      { name: 'identity-auditor', description: 'Use this agent when an MSP needs to perform a comprehensive Microsoft 365 tenant security audit.' },
      { name: 'license-auditor', description: 'Use this agent when an MSP needs to audit Microsoft 365 license costs and find savings opportunities across a client tenant.' }
    ],
    commands: [
      { name: '/check-mfa-status', description: 'Audit MFA enrollment across all M365 users, highlighting accounts with no MFA' },
      { name: '/get-user', description: 'Look up a Microsoft 365 user by name or email, showing account status, licenses, MFA, and last sign-in' },
      { name: '/list-licenses', description: 'Show Microsoft 365 license inventory - available SKUs, consumed seats, and optimization opportunities' },
      { name: '/offboard-user', description: 'Run the complete M365 offboarding workflow for a departing user - revoke access, handle mailbox, transfer data' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'm365/m365',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'ninjaone-rmm',
    name: 'NinjaOne (NinjaRMM)',
    vendor: 'NinjaOne',
    description: 'NinjaOne (NinjaRMM) - devices, organizations, alerts, tickets',
    category: 'rmm',
    maturity: 'production',
    features: [
      'Alert Handling',
      'Device Management',
      'Organization Management',
      'Ticket Management'
    ],
    skills: [
      { name: 'alerts', description: 'Use this skill when working with NinjaOne alerts - viewing active conditions, dismissing alerts, and understanding alert severity levels.' },
      { name: 'devices', description: 'Use this skill when working with NinjaOne devices - listing, searching, managing services, viewing inventory, scheduling maintenance, and monitoring device health.' },
      { name: 'organizations', description: 'Use this skill when working with NinjaOne organizations - creating, listing, managing locations, and configuring policies.' },
      { name: 'tickets', description: 'Use this skill when working with NinjaOne tickets - creating, updating, searching, and managing ticketing operations.' },
      { name: 'api-patterns', description: 'Use this skill for NinjaOne API authentication, pagination, rate limiting, and error handling patterns.' }
    ],
    agents: [
      { name: 'device-health-auditor', description: 'Use this agent when an MSP needs a comprehensive device health audit across their NinjaOne-managed organization portfolio.' },
      { name: 'patch-compliance-reporter', description: 'Use this agent when an MSP needs dedicated patch compliance reporting across their NinjaOne-managed portfolio — not a general health check, but a focused analysis of OS patch levels, third-party application versions, missing critical patches, devices pending reboot, and patch policy exceptions.' }
    ],
    commands: [
      { name: '/create-ticket', description: 'Create a new ticket in NinjaOne' },
      { name: '/device-info', description: 'Get detailed information about a NinjaOne device' },
      { name: '/list-alerts', description: 'List active alerts across NinjaOne devices' },
      { name: '/search-devices', description: 'Search for devices across NinjaOne organizations' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'ninjaone/ninjaone-rmm',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'pagerduty',
    name: 'PagerDuty',
    vendor: 'PagerDuty',
    description: 'PagerDuty - incident management, on-call scheduling, alerting',
    category: 'incident-management',
    maturity: 'production',
    features: [
      'Alert Handling',
      'Analytics',
      'Incident Management',
      'On-Call Scheduling',
      'Services'
    ],
    skills: [
      { name: 'alerts', description: 'Use this skill when working with PagerDuty alerts -- alert management, alert grouping, suppression, event routing, and the Events API v2 for sending trigger, acknowledge, and resolve events.' },
      { name: 'analytics', description: 'Use this skill when working with PagerDuty analytics -- incident analytics, MTTA and MTTR metrics, service-level performance, team workload reporting, and operational maturity assessment.' },
      { name: 'incidents', description: 'Use this skill when working with PagerDuty incidents - listing, triaging, creating, updating, resolving, and investigating incidents.' },
      { name: 'oncall', description: 'Use this skill when working with PagerDuty on-call management - viewing who is currently on-call, managing schedules and rotation layers, configuring escalation policies, creating temporary overrides, and adding or removing team members.' },
      { name: 'services', description: 'Use this skill when working with PagerDuty services -- service catalog, service configuration, integrations, dependencies, maintenance windows, and service health monitoring.' },
      { name: 'api-patterns', description: 'Use this skill when working with PagerDuty MCP tools - authentication setup, complete 66-tool reference, REST API pagination, token format (Token token=), rate limits, error handling, and hosted MCP connection details.' }
    ],
    agents: [
      { name: 'incident-commander', description: 'Use this agent when an MSP engineer, SRE, or incident manager needs to command an active incident or review the state of open PagerDuty incidents.' },
      { name: 'on-call-scheduler', description: 'Use this agent when an MSP operations lead, SRE manager, or engineering manager needs to review and manage PagerDuty on-call schedules — not incident response, but the health of the schedule system itself: coverage gaps, upcoming holidays without coverage, overloaded individuals, escalation policy misconfigurations, and rotation balance.' }
    ],
    commands: [
      { name: '/create-incident', description: 'Create a new PagerDuty incident on a service' },
      { name: '/escalate-incident', description: 'Escalate a PagerDuty incident to the next level in the escalation policy' },
      { name: '/incident-triage', description: 'Triage current open PagerDuty incidents by urgency and priority' },
      { name: '/oncall-schedule', description: 'Show who is currently on call across schedules and escalation policies' },
      { name: '/service-health', description: 'Check PagerDuty service health status and recent incident activity' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'pagerduty/pagerduty',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'pandadoc',
    name: 'PandaDoc',
    vendor: 'PandaDoc',
    description: 'PandaDoc - documents, templates, e-signatures, and proposal management',
    category: 'sales',
    maturity: 'production',
    features: [
      'Documentation',
      'Proposal Tracking',
      'Recipient Management',
      'Template Management'
    ],
    skills: [
      { name: 'documents', description: 'Use this skill when working with PandaDoc documents - creating proposals, quotes, contracts, SOWs, and MSAs from templates, sending documents for signature, checking document status, downloading signed copies, and managing the full document lifecycle.' },
      { name: 'proposals', description: 'Use this skill when working with MSP proposal workflows in PandaDoc - creating managed service agreements (MSAs), statements of work (SOWs), hardware quotes, project proposals, and tracking the MSP sales pipeline.' },
      { name: 'recipients', description: 'Use this skill when working with PandaDoc recipients and signatures - adding recipients to documents, setting signing order, tracking who has signed, managing multi-party agreements, and understanding recipient roles.' },
      { name: 'templates', description: 'Use this skill when working with PandaDoc templates - browsing the template library, finding the right template for a document type, understanding template fields and tokens, and using templates to create new documents.' },
      { name: 'api-patterns', description: 'Use this skill when working with PandaDoc MCP tools - available tools, API key authentication, the hosted MCP server connection, documentation search, code generation assistance, rate limiting, error handling, and best practices for the PandaDoc API.' }
    ],
    agents: [
      { name: 'contract-tracker', description: 'Use this agent when an MSP sales coordinator or account manager needs to track the status of pending proposals and contracts in PandaDoc.' },
      { name: 'template-standardizer', description: 'Use this agent when an MSP needs to audit and standardize their PandaDoc proposal and contract templates — checking for outdated pricing, missing legal clauses, inconsistent formatting, and stale service descriptions.' }
    ],
    commands: [
      { name: '/create-document', description: 'Create a new PandaDoc document from a template with recipients and content' },
      { name: '/document-status', description: 'Check the status of a PandaDoc document and its recipients' },
      { name: '/list-templates', description: 'List all available PandaDoc templates with details' },
      { name: '/proposal-pipeline', description: 'Summarize the PandaDoc proposal pipeline by status, value, and age' },
      { name: '/send-document', description: 'Send a PandaDoc document for e-signature' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'pandadoc/pandadoc',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'warmly',
    name: 'Warmly',
    vendor: 'Warmly',
    description: 'Warmly visitor intelligence - identified website visitors, account-level engagement, and credit balance',
    category: 'sales',
    maturity: 'alpha',
    features: [
      'Visitor Intelligence'
    ],
    skills: [
      { name: 'visitor-intelligence', description: 'Use this skill when triaging or acting on identified website visitors and account-level engagement from Warmly - prioritizing warm accounts for outreach, filtering visitors by ICP fit, scoring engagement depth, matching visitors to CRM records, or watching identification credit burn.' },
      { name: 'api-patterns', description: 'Use this skill when working with the Warmly MCP tools - available tools, WorkOS AuthKit OAuth 2.0 + PKCE authentication, organization scoping, Streamable HTTP transport, credit usage, error handling, and best practices.' }
    ],
    agents: [],
    commands: [],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'warmly/warmly',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'pax8',
    name: 'Pax8',
    vendor: 'Pax8',
    description: 'Pax8 cloud marketplace - companies, products, subscriptions, orders, invoices',
    category: 'marketplace',
    maturity: 'production',
    features: [
      'Company Management',
      'Invoice Management',
      'Order Management',
      'Product Catalog',
      'Subscription Lifecycle'
    ],
    skills: [
      { name: 'companies', description: 'Use this skill when working with Pax8 companies (MSP clients) - searching, retrieving, and managing client records in the Pax8 marketplace.' },
      { name: 'invoices', description: 'Use this skill when working with Pax8 invoices and billing - retrieving invoices, analyzing billing data, reconciling costs with client charges, reviewing usage summaries, and understanding the MSP billing cycle.' },
      { name: 'orders', description: 'Use this skill when working with Pax8 orders - viewing orders, tracking provisioning status, understanding order line items, and managing the order-to-subscription workflow.' },
      { name: 'products', description: 'Use this skill when working with the Pax8 product catalog - searching for cloud software, browsing vendors, checking pricing, reviewing provisioning details, and finding the right SKU for a client need.' },
      { name: 'subscriptions', description: 'Use this skill when working with Pax8 subscriptions - checking license status, reviewing seat counts, filtering by company or product, tracking subscription states, reviewing change history, and optimizing license usage across MSP clients.' },
      { name: 'api-patterns', description: 'Use this skill when working with the Pax8 MCP tools - available tools, parameters, pagination, sorting, filtering, rate limiting, error handling, and best practices.' }
    ],
    agents: [
      { name: 'license-optimizer', description: 'Use this agent when an MSP needs to analyze license utilization across their Pax8 marketplace subscriptions, identify unused or over-provisioned seats, optimize costs, or plan renewals.' },
      { name: 'renewal-calendar', description: 'Use this agent when an MSP needs a proactive view of upcoming Pax8 subscription renewals across all clients, wants to flag month-to-month subscriptions that should move to annual, or needs to identify annual renewals that require a seat count review before they lock in.' }
    ],
    commands: [
      { name: '/create-order', description: 'Place an order for a product subscription in Pax8' },
      { name: '/license-summary', description: 'Aggregate license counts and costs across all Pax8 client companies' },
      { name: '/search-products', description: 'Search the Pax8 product catalog by name or vendor' },
      { name: '/subscription-status', description: 'Check subscription status for a company in Pax8' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'pax8/pax8',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'proofpoint',
    name: 'Proofpoint',
    vendor: 'Email Security',
    description: 'Proofpoint Email Protection - TAP, quarantine, threat intel, forensics, URL defense, VAP reports',
    category: 'email-security',
    maturity: 'production',
    features: [
      'Forensics',
      'People',
      'Quarantine',
      'Tap',
      'Threat Intel',
      'Url Defense'
    ],
    skills: [
      { name: 'forensics', description: 'Use this skill when working with Proofpoint forensics and threat response - auto-pull, search and destroy, message trace, evidence collection, and remediation workflows.' },
      { name: 'people', description: 'Use this skill when working with Proofpoint people-centric security - Very Attacked People (VAP) reports, top clickers, user risk scoring, attack index, and user-level threat analytics.' },
      { name: 'quarantine', description: 'Use this skill when working with Proofpoint email quarantine - listing, searching, releasing, and deleting quarantined messages.' },
      { name: 'tap', description: 'Use this skill when working with Proofpoint Targeted Attack Protection (TAP) - retrieving threat events, click tracking, message delivery and blocking data, SIEM integration feeds, and threat type analysis.' },
      { name: 'threat-intel', description: 'Use this skill when working with Proofpoint threat intelligence - campaign tracking, threat families, indicators of compromise (IOCs), forensic evidence, and threat landscape analysis.' },
      { name: 'url-defense', description: 'Use this skill when working with Proofpoint URL Defense - URL rewriting, URL decoding, real-time URL analysis, click-time protection, and URL investigation.' },
      { name: 'api-patterns', description: 'Use this skill when working with the Proofpoint API - authentication using HTTP Basic Auth with service principal and secret, base URLs, rate limits, pagination, error codes, and common integration patterns.' }
    ],
    agents: [
      { name: 'email-security-auditor', description: 'Use this agent when auditing email security posture across Proofpoint-protected organizations, investigating threats via TAP intelligence, tracing specific emails, analyzing Very Attacked Persons (VAPs), or generating per-org security reports for MSP clients.' },
      { name: 'vap-reporter', description: 'Use this agent when analyzing Very Attacked Persons (VAPs) in Proofpoint — tracking executives and high-value targets who receive the most sophisticated or highest-volume attacks, surfacing patterns over time, and recommending enhanced protections for the highest-risk users across the MSP client portfolio.' }
    ],
    commands: [
      { name: '/check-threats', description: 'View recent TAP threat events including blocked messages, delivered threats, and click activity' },
      { name: '/decode-url', description: 'Decode a Proofpoint URL Defense rewritten URL back to the original URL' },
      { name: '/investigate-threat', description: 'Deep-dive threat investigation with forensics, campaign context, and remediation options' },
      { name: '/release-quarantine', description: 'Release one or more quarantined messages to their intended recipients' },
      { name: '/search-quarantine', description: 'Search quarantined messages in Proofpoint by sender, recipient, subject, or reason' },
      { name: '/vap-report', description: 'Get the Very Attacked People (VAP) report showing the most targeted users' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'email-security/proofpoint',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'quickbooks-online',
    name: 'QuickBooks Online',
    vendor: 'Intuit',
    description: 'QuickBooks Online - customers, invoices, expenses, payments, reports',
    category: 'accounting',
    maturity: 'production',
    features: [
      'Customer Operations',
      'Expense Management',
      'Invoice Management',
      'Payment Tracking',
      'Financial Reporting'
    ],
    skills: [
      { name: 'customers', description: 'Use this skill when working with QuickBooks Online customers (clients) - creating, searching, updating, and managing MSP client records.' },
      { name: 'expenses', description: 'Use this skill when working with QuickBooks Online expenses and purchases - creating, searching, and managing expense records, bills, and vendor payments.' },
      { name: 'invoices', description: 'Use this skill when working with QuickBooks Online invoices - creating, sending, voiding, and managing invoices for MSP clients.' },
      { name: 'payments', description: 'Use this skill when working with QuickBooks Online payments - recording customer payments, applying payments to invoices, handling overpayments, refunds, credit memos, and payment reconciliation.' },
      { name: 'reports', description: 'Use this skill when working with QuickBooks Online reports - generating Profit & Loss, Balance Sheet, Accounts Receivable Aging, Accounts Payable Aging, General Ledger, and other financial reports.' },
      { name: 'api-patterns', description: 'Use this skill when working with the QuickBooks Online API - OAuth2 authentication, REST structure, Intuit query language, pagination, rate limiting, error handling, minor version headers, and best practices.' }
    ],
    agents: [
      { name: 'billing-reconciler', description: 'Use this agent when an MSP needs to reconcile billing in QuickBooks Online — matching invoices to contracts, identifying unbilled work, flagging overdue accounts, or auditing revenue recognition.' },
      { name: 'profitability-reporter', description: 'Use this agent when an MSP needs to analyze per-client or per-service-line profitability in QuickBooks Online — calculating gross margin by client, identifying the most and least profitable accounts, tracking profitability trends over time, or surfacing service lines where costs are eroding margin.' }
    ],
    commands: [
      { name: '/create-invoice', description: 'Create an invoice for a client\'s managed services in QuickBooks Online' },
      { name: '/expense-summary', description: 'Summarize expenses by client, vendor, or date range in QuickBooks Online' },
      { name: '/get-balance', description: 'View outstanding balances across all MSP clients in QuickBooks Online' },
      { name: '/search-customers', description: 'Find a customer in QuickBooks Online by name or other criteria' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'quickbooks/quickbooks-online',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'rocketcyber',
    name: 'RocketCyber',
    vendor: 'Kaseya',
    description: 'RocketCyber managed SOC - incidents, agents, events, threat detection',
    category: 'security',
    maturity: 'beta',
    features: [
      'Account Hierarchy',
      'Agent Monitoring',
      'Application Inventory',
      'Incident Management'
    ],
    skills: [
      { name: 'accounts', description: 'Use this skill when working with RocketCyber accounts - provider/customer hierarchy, account management, sub-account navigation, account settings, and security policy configuration.' },
      { name: 'agents', description: 'Use this skill when working with RocketCyber agents (RocketAgent) - deployment, communication status, health monitoring, and troubleshooting.' },
      { name: 'apps', description: 'Use this skill when working with RocketCyber application inventory - detecting, categorizing, and monitoring applications across managed endpoints.' },
      { name: 'incidents', description: 'Use this skill when working with RocketCyber security incidents - searching, triaging, investigating, and resolving incidents.' },
      { name: 'api-patterns', description: 'Use this skill when working with the RocketCyber API - authentication, Bearer token flow, base URL selection, pagination, rate limiting, error handling, and account hierarchy.' }
    ],
    agents: [
      { name: 'soc-alert-investigator', description: 'Use this agent when an MSP needs to investigate and triage RocketCyber SOC alerts and security incidents across their client portfolio.' },
      { name: 'threat-correlation-analyst', description: 'Use this agent when an MSP needs to correlate RocketCyber SOC detections with broader security context from across the Kaseya ecosystem — cross-referencing incidents with Datto RMM device data, IT Glue documentation, and Autotask ticket history to build richer threat narratives and identify whether incidents are isolated or part of a broader pattern.' }
    ],
    commands: [
      { name: '/account-summary', description: 'Get a security posture summary for a RocketCyber customer account' },
      { name: '/search-incidents', description: 'Search RocketCyber security incidents by account, status, severity, verdict, and date range' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'kaseya/rocketcyber',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'rootly',
    name: 'Rootly',
    vendor: 'Rootly',
    description: 'Rootly - incident management, postmortems, SRE automation',
    category: 'incident-management',
    maturity: 'production',
    features: [
      'Alert Handling',
      'Incident Management',
      'On-Call Scheduling',
      'Postmortems',
      'Services',
      'Workflows'
    ],
    skills: [
      { name: 'alerts', description: 'Use this skill when working with Rootly alerts -- alert routing, escalation policies, integration with monitoring tools (Datadog, PagerDuty, etc.), alert-to-incident creation, and managing alert rules.' },
      { name: 'incidents', description: 'Use this skill when working with Rootly incidents - creating, searching, triaging, updating, and resolving incidents.' },
      { name: 'oncall', description: 'Use this skill when working with Rootly on-call management - viewing shift metrics, generating handoff summaries, reviewing shift incidents, detecting on-call health risk, and understanding schedule coverage.' },
      { name: 'postmortems', description: 'Use this skill when working with Rootly postmortems -- creating retrospectives, managing action items, applying templates, and conducting blameless reviews after incidents are resolved.' },
      { name: 'services', description: 'Use this skill when working with the Rootly service catalog -- listing services, managing dependencies, ownership, service health, and understanding how services relate to incidents and alerts.' },
      { name: 'workflows', description: 'Use this skill when working with Rootly workflows -- creating automated incident response workflows, configuring triggers, actions, conditions, and managing workflow lifecycle.' },
      { name: 'api-patterns', description: 'Use this skill when working with Rootly MCP tools - authentication setup, complete tool reference, JSON:API pagination, request patterns, rate limits, and error handling.' }
    ],
    agents: [
      { name: 'incident-commander', description: 'Use this agent when an MSP engineer, SRE, or incident manager needs to command an active Rootly incident or review open incidents.' },
      { name: 'post-mortem-writer', description: 'Use this agent when an MSP engineer, SRE, or incident manager needs to generate a structured post-incident review (PIR) for a resolved Rootly incident — not live incident command, but a thorough retrospective document covering what happened, why it happened, the full impact timeline, contributing factors, and the concrete action items the team is committing to fix.' }
    ],
    commands: [
      { name: '/action-items', description: 'List outstanding action items from Rootly postmortems and incidents' },
      { name: '/create-incident', description: 'Create a new incident in Rootly with title, severity, and affected services' },
      { name: '/incident-triage', description: 'Triage active Rootly incidents by severity and status' },
      { name: '/postmortem-summary', description: 'Generate a postmortem summary for a resolved Rootly incident' },
      { name: '/service-status', description: 'Check service health and dependency status across the Rootly service catalog' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'rootly/rootly',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'runzero',
    name: 'Runzero',
    vendor: 'Runzero',
    description: 'runZero - asset discovery, network scanning, inventory management',
    category: 'security',
    maturity: 'production',
    features: [
      'Asset Management',
      'Services',
      'Site Management',
      'Tasks',
      'Wireless'
    ],
    skills: [
      { name: 'assets', description: 'Use this skill when working with RunZero assets — searching and browsing the asset inventory, inspecting asset attributes, OS fingerprinting, hardware details, and network interfaces.' },
      { name: 'services', description: 'Use this skill when working with RunZero services — listing discovered services, filtering by port or protocol, identifying vulnerabilities, and auditing exposed services across sites.' },
      { name: 'sites', description: 'Use this skill when working with RunZero sites — creating and managing organization sites, defining scan scope, deploying explorers, and organizing assets by location or client.' },
      { name: 'tasks', description: 'Use this skill when working with RunZero scan tasks — creating scans, scheduling recurring scans, managing explorers, configuring scan parameters, and reviewing scan results.' },
      { name: 'wireless', description: 'Use this skill when working with RunZero wireless network discovery — listing discovered wireless networks, identifying rogue access points, analyzing wireless security configurations, and auditing SSIDs.' },
      { name: 'api-patterns', description: 'Use this skill when working with the RunZero MCP tools — available tools, authentication via Bearer token, Export API, pagination, rate limiting, error handling, and best practices.' }
    ],
    agents: [],
    commands: [
      { name: '/asset-search', description: 'Search for assets in RunZero by criteria' },
      { name: '/scan-network', description: 'Initiate a network discovery scan in RunZero' },
      { name: '/service-inventory', description: 'List discovered services across RunZero assets' },
      { name: '/site-overview', description: 'Overview of a RunZero site\'s assets, services, and health' },
      { name: '/vuln-report', description: 'Generate a vulnerability summary report from RunZero data' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'runzero/runzero',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'salesbuildr',
    name: 'SalesBuildr',
    vendor: 'SalesBuildr',
    description: 'SalesBuildr CRM - contacts, companies, opportunities, quotes',
    category: 'crm',
    maturity: 'production',
    features: [
      'Companies Contacts',
      'Opportunity Tracking',
      'Product Catalog',
      'Quote Generation'
    ],
    skills: [
      { name: 'companies-contacts', description: 'Use this skill when searching for companies or contacts in Salesbuildr, looking up customer information, or creating new contacts.' },
      { name: 'opportunities', description: 'Use this skill when managing sales opportunities in Salesbuildr - searching the pipeline, creating new opportunities, updating stages, and tracking deal values.' },
      { name: 'products', description: 'Use this skill when searching for products in the Salesbuildr catalog, looking up pricing, or browsing by category.' },
      { name: 'quotes', description: 'Use this skill when creating, searching, or viewing quotes in Salesbuildr.' },
      { name: 'api-patterns', description: 'Use this skill when making API calls to Salesbuildr.' }
    ],
    agents: [
      { name: 'margin-analyzer', description: 'Use this agent when an MSP sales manager or finance lead needs to analyze quote margin health across recent quotes in Salesbuildr.' },
      { name: 'quote-builder', description: 'Use this agent when an MSP sales team member needs to build, review, or standardize quotes in Salesbuildr.' }
    ],
    commands: [
      { name: '/create-contact', description: 'Create a new contact in Salesbuildr' },
      { name: '/create-opportunity', description: 'Create a new opportunity in Salesbuildr' },
      { name: '/create-quote', description: 'Create a new quote with line items in Salesbuildr' },
      { name: '/get-quote', description: 'Get detailed information for a specific Salesbuildr quote' },
      { name: '/search-companies', description: 'Search for companies in Salesbuildr' },
      { name: '/search-contacts', description: 'Search for contacts in Salesbuildr, optionally filtered by company' },
      { name: '/search-opportunities', description: 'Search for opportunities in the Salesbuildr sales pipeline' },
      { name: '/search-products', description: 'Search the Salesbuildr product catalog' },
      { name: '/search-quotes', description: 'Search for quotes in Salesbuildr' },
      { name: '/update-opportunity', description: 'Update an opportunity\'s status, value, or other details' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'salesbuildr/salesbuildr',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'sentinelone',
    name: 'SentinelOne',
    vendor: 'SentinelOne',
    description: 'SentinelOne XDR - threat detection, incident response, and endpoint agent management via the Purple AI MCP server',
    category: 'security',
    maturity: 'production',
    features: [
      'Alert Handling',
      'Asset Inventory',
      'Cloud Security Posture',
      'Purple AI Threat Hunting',
      'PowerQuery Analytics',
      'Vulnerability Management'
    ],
    skills: [
      { name: 'alerts', description: 'Use this skill when working with SentinelOne alerts - triaging new alerts, investigating specific alerts, searching by severity or status, reviewing alert timelines, and managing alert workflows across MSP client environments.' },
      { name: 'inventory', description: 'Use this skill when working with SentinelOne unified asset inventory - endpoints, cloud resources, identities, and network-discovered devices.' },
      { name: 'misconfigurations', description: 'Use this skill when working with SentinelOne XSPM misconfigurations - cloud security posture management across AWS, Azure, GCP, Kubernetes, identity, and infrastructure-as-code.' },
      { name: 'purple-ai', description: 'Use this skill when working with SentinelOne Purple AI - natural language cybersecurity investigation, threat hunting, behavioral anomaly analysis, MITRE ATT&CK TTP mapping, and PowerQuery generation.' },
      { name: 'threat-hunting', description: 'Use this skill when working with SentinelOne PowerQuery and the Singularity Data Lake - executing threat hunting queries, understanding PowerQuery pipeline syntax, managing time ranges, and analyzing query results.' },
      { name: 'vulnerabilities', description: 'Use this skill when working with SentinelOne XSPM vulnerabilities - tracking CVEs, reviewing EPSS scores, assessing exploit maturity, managing vulnerability status, prioritizing patches, and generating vulnerability reports across MSP client environments.' },
      { name: 'api-patterns', description: 'Use this skill when working with the SentinelOne Purple MCP tools - available tools, connection setup, uvx-based installation, Service User token authentication, transport modes, dual API architecture (GraphQL and REST), rate limits, error handling, and best practices.' }
    ],
    agents: [
      { name: 'endpoint-hardening-auditor', description: 'Use this agent when an MSP needs to audit and harden SentinelOne endpoint configuration across client sites — not to investigate active threats, but to proactively identify gaps before attackers can exploit them.' },
      { name: 'threat-hunter', description: 'Use this agent when an MSP needs to autonomously hunt for threats across client endpoints using SentinelOne.' }
    ],
    commands: [
      { name: '/alert-triage', description: 'Triage new and unresolved SentinelOne alerts by severity' },
      { name: '/asset-inventory', description: 'Asset inventory summary by surface type across managed environments' },
      { name: '/hunt-threat', description: 'Threat hunting via Purple AI and PowerQuery execution' },
      { name: '/investigate-alert', description: 'Deep investigation of a specific SentinelOne alert with timeline and context' },
      { name: '/posture-review', description: 'Cloud security posture review with compliance gap analysis' },
      { name: '/vuln-report', description: 'Generate a vulnerability summary report with severity breakdown and top CVEs' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'sentinelone/sentinelone',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'sherweb',
    name: 'Sherweb',
    vendor: 'Sherweb',
    description: 'Sherweb Partner API - distributor billing, service provider management, customer subscriptions',
    category: 'marketplace',
    maturity: 'beta',
    features: [
      'Billing',
      'Customer Operations',
      'Subscription Lifecycle'
    ],
    skills: [
      { name: 'billing', description: 'Use this skill when working with Sherweb distributor billing - payable charges, billing periods, charge types, pricing breakdown, deductions, fees, taxes, invoices, and MSP margin calculations.' },
      { name: 'customers', description: 'Use this skill when working with Sherweb customers - listing customers, retrieving customer details, accounts receivable, and understanding the distributor > service provider > customer hierarchy.' },
      { name: 'subscriptions', description: 'Use this skill when working with Sherweb subscriptions - viewing subscriptions, changing quantities, license management, subscription lifecycle, and quantity change workflows.' },
      { name: 'api-patterns', description: 'Use this skill when working with the Sherweb API and MCP tools - OAuth 2.0 client credentials authentication, token management, API endpoints, subscription key header, rate limits, error codes, scopes, Accept-Language support, and best practices.' }
    ],
    agents: [
      { name: 'billing-reconciler', description: 'Use this agent when an MSP needs to reconcile Sherweb distributor billing — reviewing payable charges for a billing period, drilling into individual charge details, separating Setup/Recurring/Usage charge types, verifying that billed quantities match active subscriptions, and calculating MSP margin between Sherweb cost and customer price.' },
      { name: 'customer-account-auditor', description: 'Use this agent when an MSP needs a portfolio-wide health audit of its Sherweb customer accounts — enumerating all customers, checking accounts-receivable standing, correlating each customer\'s subscription footprint, and flagging accounts that are at financial or provisioning risk.' },
      { name: 'subscription-provisioner', description: 'Use this agent when an MSP needs to provision, right-size, or audit Sherweb customer subscriptions — listing a customer\'s active subscriptions, looking up catalog products before ordering, planning seat-quantity changes, and walking quantity adjustments through Sherweb\'s confirmation flow.' }
    ],
    commands: [
      { name: '/billing-summary', description: 'View payable charges for a Sherweb billing period with pricing breakdown' },
      { name: '/change-quantity', description: 'Change subscription seat/license quantity for a Sherweb customer' },
      { name: '/list-customers', description: 'List all customers under the Sherweb service provider account' },
      { name: '/subscription-status', description: 'Check subscription details and quantities for a Sherweb customer' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'sherweb/sherweb',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'superops',
    name: 'SuperOps.ai',
    vendor: 'SuperOps',
    description: 'SuperOps.ai - tickets, assets, clients, runbooks (GraphQL)',
    category: 'psa',
    maturity: 'production',
    features: [
      'Alert Handling',
      'Asset Management',
      'Client Operations',
      'Runbook Execution',
      'Ticket Management'
    ],
    skills: [
      { name: 'alerts', description: 'Use this skill when working with SuperOps.ai alerts - listing, filtering, acknowledging, and resolving alerts from monitored assets.' },
      { name: 'assets', description: 'Use this skill when working with SuperOps.ai assets - querying inventory, viewing asset details, running scripts, monitoring patches, and managing client/site associations.' },
      { name: 'clients', description: 'Use this skill when working with SuperOps.ai clients - creating, updating, searching, and managing client accounts.' },
      { name: 'runbooks', description: 'Use this skill when working with SuperOps.ai runbooks and scripts - listing, executing, monitoring, and managing automated scripts on assets.' },
      { name: 'tickets', description: 'Use this skill when working with SuperOps.ai tickets - creating, updating, searching, or managing service desk operations.' },
      { name: 'api-patterns', description: 'Use this skill when working with the SuperOps.ai GraphQL API - authentication, query building, mutations, pagination, rate limiting, and error handling.' }
    ],
    agents: [
      { name: 'automation-opportunity-finder', description: 'Use this agent when an MSP operations lead, service manager, or technician wants to identify repetitive ticket patterns in SuperOps.ai that should be automated — not live operations management, but a retrospective analysis of ticket history to find recurring issues with the same client, same category, and same resolution, calculate the manual time cost, and recommend runbooks or automation scripts to eliminate the pattern.' },
      { name: 'msp-service-ops', description: 'Use this agent when an MSP technician, dispatcher, or manager needs a combined PSA and RMM operations review in SuperOps.ai.' }
    ],
    commands: [
      { name: '/acknowledge-alert', description: 'Acknowledge an RMM alert to indicate investigation is underway' },
      { name: '/add-ticket-note', description: 'Add a note (internal or public) to an existing SuperOps.ai ticket' },
      { name: '/create-ticket', description: 'Create a new service ticket in SuperOps.ai' },
      { name: '/get-asset', description: 'Get detailed asset information including hardware, software, and alerts' },
      { name: '/list-alerts', description: 'List active RMM alerts across all clients or filtered by criteria' },
      { name: '/list-assets', description: 'List and filter assets in SuperOps.ai' },
      { name: '/log-time', description: 'Log a time entry against a SuperOps.ai ticket' },
      { name: '/resolve-alert', description: 'Resolve an RMM alert and optionally create a ticket' },
      { name: '/run-script', description: 'Execute a script on a remote asset via SuperOps RMM' },
      { name: '/update-ticket', description: 'Update fields on an existing SuperOps.ai ticket' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'superops/superops-ai',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'syncro',
    name: 'Syncro MSP',
    vendor: 'Syncro',
    description: 'Syncro MSP - tickets, customers, assets, invoicing',
    category: 'psa',
    maturity: 'production',
    features: [
      'Asset Management',
      'Customer Operations',
      'Invoice Management',
      'Ticket Management'
    ],
    skills: [
      { name: 'assets', description: 'Use this skill when working with Syncro MSP assets - tracking hardware, software, and devices for customers.' },
      { name: 'customers', description: 'Use this skill when working with Syncro MSP customers - creating, updating, searching, or managing customer records.' },
      { name: 'invoices', description: 'Use this skill when working with Syncro MSP invoices - creating, managing, and tracking invoices and payments.' },
      { name: 'tickets', description: 'Use this skill when working with Syncro MSP tickets - creating, updating, searching, or managing service desk operations.' },
      { name: 'api-patterns', description: 'Use this skill when working with the Syncro MSP API - authentication, pagination, rate limiting, and error handling.' }
    ],
    agents: [
      { name: 'billing-auditor', description: 'Use this agent when an MSP owner, billing coordinator, or service manager needs a billing completeness and accuracy audit in Syncro — finding tickets that haven\'t been billed, identifying recurring billing discrepancies, checking invoice accuracy against contracts, and flagging draft invoices overdue for finalization.' },
      { name: 'msp-service-ops', description: 'Use this agent when an MSP technician, dispatcher, or owner needs an integrated review of tickets, devices, and billing in Syncro.' }
    ],
    commands: [
      { name: '/add-ticket-comment', description: 'Add a comment to an existing Syncro ticket' },
      { name: '/create-appointment', description: 'Create a calendar appointment in Syncro' },
      { name: '/create-ticket', description: 'Create a new service ticket in Syncro MSP' },
      { name: '/get-customer', description: 'Get detailed customer information from Syncro' },
      { name: '/list-alerts', description: 'List active RMM alerts from Syncro' },
      { name: '/log-time', description: 'Log a time entry against a Syncro ticket' },
      { name: '/resolve-alert', description: 'Resolve an RMM alert in Syncro' },
      { name: '/search-assets', description: 'Search for customer assets in Syncro' },
      { name: '/search-tickets', description: 'Search for tickets in Syncro MSP by various criteria' },
      { name: '/update-ticket', description: 'Update fields on an existing Syncro ticket' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'syncro/syncro-msp',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'blackpoint',
    name: 'Blackpoint',
    vendor: 'Blackpoint',
    description: 'Blackpoint Cyber / CompassOne MDR - tenants, assets, detections, vulnerabilities (dark web, external, scans)',
    category: 'security',
    maturity: 'production',
    features: [
      'Asset Inventory',
      'Incident Response',
      'Multi Tenant Operations',
      'Vulnerability Management'
    ],
    skills: [
      { name: 'asset-inventory', description: 'Use this skill when working with Blackpoint Cyber (CompassOne) asset data — listing assets by class for a tenant, searching across classes, pulling asset detail, and walking parent/child/sibling relationships to build a blast-radius or topology view.' },
      { name: 'incident-response', description: 'Use this skill when investigating a Blackpoint Cyber detection — drilling from a tenant to its assets, walking the detection list, pulling vulnerability and dark-web context, and assembling an incident timeline.' },
      { name: 'multi-tenant-operations', description: 'Use this skill when operating Blackpoint Cyber (CompassOne) at the MSP partner level — enumerating customer tenants, sweeping detections and vulnerabilities across all of them, spotting volume anomalies, and building per-tenant scorecards.' },
      { name: 'vulnerability-management', description: 'Use this skill when analyzing Blackpoint Cyber (CompassOne) exposure data — host vulnerability findings filtered by CVE and exploitability, vulnerability scan history, dark-web credential and data leaks, and external internet-facing exposures.' },
      { name: 'api-patterns', description: 'Use this skill when working with the Blackpoint Cyber (CompassOne) MCP tools — Bearer token authentication, the partner-tenant-asset hierarchy, navigation tools, and the read-only tool surface across tenants, assets, detections, and vulnerabilities.' }
    ],
    agents: [
      { name: 'alert-response-coordinator', description: 'Use this agent when triaging the Blackpoint Cyber / CompassOne detection queue across one or many tenants — ranking open detections by severity and tenant impact, deciding what needs immediate escalation to the Blackpoint SOC versus routine follow-up, and producing a prioritized response plan.' },
      { name: 'detection-investigator', description: 'Use this agent when investigating a Blackpoint Cyber / CompassOne MDR detection — reconstructing what fired, drilling from tenant to affected asset, mapping the asset\'s relationships to estimate blast radius, and cross-referencing vulnerabilities and dark-web exposure for context.' },
      { name: 'exposure-analyst', description: 'Use this agent when assessing a tenant\'s attack-surface and exposure posture in Blackpoint Cyber / CompassOne — rolling up vulnerability findings, internet-facing external exposures, dark-web credential leaks, and scan coverage into a prioritized remediation view for QBRs, security reviews, or risk reporting.' }
    ],
    commands: [
      { name: '/investigate-detection', description: 'Investigate a single Blackpoint Cyber / CompassOne detection end-to-end' },
      { name: '/partner-overview', description: 'Portfolio-level Blackpoint Cyber / CompassOne rollup of detections and exposure across all tenants' },
      { name: '/search-detections', description: 'List recent Blackpoint Cyber detections for a tenant' },
      { name: '/tenant-exposure', description: 'Build a prioritized exposure report for a Blackpoint Cyber / CompassOne tenant' },
      { name: '/triage-detections', description: 'Sweep and prioritize the open Blackpoint Cyber / CompassOne detection queue across tenants' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'blackpoint/blackpoint',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'crewhu',
    name: 'Crewhu',
    vendor: 'Crewhu',
    description: 'Crewhu - CSAT/NPS surveys, employee recognition, badges, prize redemptions for MSPs',
    category: 'productivity',
    maturity: 'alpha',
    features: [
      'Surveys'
    ],
    skills: [
      { name: 'surveys', description: 'Use this skill when working with Crewhu CSAT/NPS surveys — listing recent responses, drilling into a specific survey, isolating detractors and promoters for follow-up, and rolling responses up by user.' },
      { name: 'api-patterns', description: 'Use this skill when working with the Crewhu MCP tools — token-based authentication via the `X-Crewhu-Api-Token` header, read-heavy tool surface, pagination, and error handling.' }
    ],
    agents: [],
    commands: [
      { name: '/search-surveys', description: 'Search recent Crewhu surveys, surfacing detractors and promoters' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'crewhu/crewhu',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'immybot',
    name: 'Immybot',
    vendor: 'Immybot',
    description: 'ImmyBot - desired-state Windows software deployment, maintenance sessions, scripts (Entra ID OAuth)',
    category: 'rmm',
    maturity: 'production',
    features: [
      'Endpoint Management',
      'Maintenance Sessions',
      'Script Execution',
      'Software Deployment',
      'Tenant Compliance'
    ],
    skills: [
      { name: 'endpoint-management', description: 'Use this skill when working with ImmyBot computers/endpoints — listing and filtering the managed fleet, searching by name or serial, inspecting installed-software inventory, reviewing which deployments target a device, creating new computer records, and forcing an agent check-in.' },
      { name: 'maintenance-sessions', description: 'Use this skill when working with ImmyBot maintenance sessions — the reconciliation engine that brings endpoints into their desired state.' },
      { name: 'script-execution', description: 'Use this skill when working with ImmyBot\'s PowerShell script library — searching scripts by name or category, validating script syntax, executing a script in SYSTEM context on a target computer, and reviewing execution history and results.' },
      { name: 'software-deployment', description: 'Use this skill when configuring desired-state software deployments in ImmyBot — picking the software, scoping the deployment to a tenant or computer, kicking off a maintenance session to reconcile, and checking compliance afterwards.' },
      { name: 'tenant-compliance', description: 'Use this skill when working with ImmyBot tenants and fleet-wide reporting — listing and searching client organizations, pulling per-tenant compliance dashboards and software-inventory rollups, and auditing background task queues (running, queued, failed) to produce client-facing or operational status reports.' },
      { name: 'api-patterns', description: 'Use this skill when working with the ImmyBot MCP tools — Entra ID OAuth 2.0 client-credentials authentication (4 fields), the two-step desired-state deployment model, destructive operations that need explicit confirmation, and the task/session polling cadence.' }
    ],
    agents: [
      { name: 'compliance-auditor', description: 'Use this agent when an MSP needs a software-compliance audit across their ImmyBot-managed tenant portfolio — per-tenant compliance scorecards, failing-deployment analysis, software-inventory rollups, and task-queue health for QBR or operational reporting.' },
      { name: 'endpoint-remediation-specialist', description: 'Use this agent when an MSP needs to diagnose and remediate a problem on ImmyBot-managed endpoints — investigating failed maintenance sessions and tasks, running remediation scripts, and re-reconciling affected computers.' },
      { name: 'software-deployment-orchestrator', description: 'Use this agent when an MSP needs to plan and execute a software rollout through ImmyBot — staging desired-state deployments, piloting, triggering maintenance sessions, and confirming compliance.' }
    ],
    commands: [
      { name: '/compliance-report', description: 'Generate an ImmyBot software-compliance scorecard for a tenant or the whole fleet' },
      { name: '/deploy-software', description: 'Stage and reconcile an ImmyBot desired-state software deployment to a tenant or computer' },
      { name: '/list-computers', description: 'List and filter ImmyBot-managed computers, optionally scoped to a tenant' },
      { name: '/maintenance-status', description: 'Show ImmyBot maintenance session status — active sessions, or detail and logs for a specific session' },
      { name: '/run-script', description: 'Find and execute an ImmyBot PowerShell script on a target computer (destructive, SYSTEM context)' },
      { name: '/search-software', description: 'Search the ImmyBot software catalog (per-tenant + global)' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'immybot/immybot',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'timezest',
    name: 'Timezest',
    vendor: 'Timezest',
    description: 'TimeZest - tech scheduling against ConnectWise / Autotask / Halo PSA tickets',
    category: 'productivity',
    maturity: 'production',
    features: [
      'Agents And Teams',
      'Appointment Types',
      'Psa Integration',
      'Resources',
      'Scheduling'
    ],
    skills: [
      { name: 'agents-and-teams', description: 'Use this skill to resolve the right bookable resource in TimeZest before creating a scheduling request — listing agents (individual technicians) and teams (round-robin / shared availability pools), fetching detail for a named resource, and deciding when to book an agent versus a team.' },
      { name: 'appointment-types', description: 'Use this skill to pick the correct TimeZest appointment type for a scheduling request — listing the appointment types configured for the tenant, reading each type\'s duration, and matching the type to the work described on a ConnectWise / Autotask / Halo ticket.' },
      { name: 'psa-integration', description: 'Use this skill to wire a TimeZest scheduling request into a PSA — building correct associatedEntities entries for ConnectWise, Autotask, or Halo tickets, choosing between the pod and generate_url trigger modes, and diagnosing bookings that completed but never updated the PSA ticket.' },
      { name: 'resources', description: 'Use this skill to query TimeZest\'s combined resource pool — the unified list of agents and teams available for scheduling — when you want a survey of everything bookable before drilling into a specific agent or team, or when the dispatcher has not named a resource.' },
      { name: 'scheduling', description: 'Use this skill to book a technician against a ConnectWise / Autotask / Halo PSA ticket via TimeZest — resolving the right agent and appointment type, creating a scheduling request, polling its status, and canceling when needed.' },
      { name: 'api-patterns', description: 'Use this skill when working with the TimeZest MCP tools — Bearer token authentication, the navigation pattern, scheduling-request payloads that carry PSA associated_entities (ConnectWise / Autotask / Halo ticket IDs), and the polling-only update model (no webhooks).' }
    ],
    agents: [
      { name: 'booking-pipeline-auditor', description: 'Use this agent when reporting on the TimeZest scheduling pipeline — grouping requests by lifecycle state, finding stale requests waiting on customers, measuring booking conversion, and producing a dispatch-queue view across agents and teams.' },
      { name: 'psa-integration-specialist', description: 'Use this agent when working with the link between TimeZest and a PSA — building correct associatedEntities payloads for ConnectWise / Autotask / Halo, auditing scheduling requests for missing or wrong PSA associations, reconciling TimeZest bookings against PSA tickets, and choosing pod vs generate_url trigger modes.' },
      { name: 'scheduling-dispatcher', description: 'Use this agent when booking a technician against a PSA ticket through TimeZest — resolving the right agent or team, picking the correct appointment type, creating the scheduling request with the PSA association, and confirming the customer booking link was issued.' }
    ],
    commands: [
      { name: '/book-tech', description: 'Book a TimeZest scheduling request for a technician against a PSA ticket' },
      { name: '/resource-roster', description: 'List TimeZest bookable resources — agents, teams, and appointment types' },
      { name: '/scheduling-pipeline', description: 'Produce a TimeZest scheduling pipeline report grouped by lifecycle state and resource' },
      { name: '/search-scheduling', description: 'List recent TimeZest scheduling requests, grouped by state' },
      { name: '/stale-requests', description: 'Find stale TimeZest scheduling requests still waiting on a customer to book' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'timezest/timezest',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'threatlocker',
    name: 'Threatlocker',
    vendor: 'Threatlocker',
    description: 'ThreatLocker - zero-trust application allowlisting, approval triage, audit log investigation, computer inventory',
    category: 'security',
    maturity: 'production',
    features: [
      'Approval Requests',
      'Audit Log',
      'Computer Groups',
      'Computer Management',
      'Organization Management'
    ],
    skills: [
      { name: 'approval-requests', description: 'Use this skill when triaging ThreatLocker application approval requests — the heart of day-to-day ThreatLocker operations.' },
      { name: 'audit-log', description: 'Use this skill when investigating events in the ThreatLocker Action Log (the API name is "audit") — building incident timelines, tracing a file\'s history across endpoints, identifying repeated denials, and correlating policy bypasses or audit-only matches with user/computer context.' },
      { name: 'computer-groups', description: 'Use this skill when working with ThreatLocker computer groups — the policy-scoping boundary that determines which allow/deny rules apply to which endpoints.' },
      { name: 'computers', description: 'Use this skill when working with ThreatLocker-protected endpoints — fleet inventory, identifying offline agents, drilling into a single computer\'s check-in history, and correlating computers across organizations and groups.' },
      { name: 'organizations', description: 'Use this skill when working with the ThreatLocker MSP multi-tenant model — enumerating child organizations, retrieving per-org auth keys, and identifying valid move targets when relocating computers between tenants.' },
      { name: 'api-patterns', description: 'Use this skill when working with the ThreatLocker MCP tools — raw-key authentication (NO Bearer prefix), multi-tenant routing via organizationId header, POST-heavy "GetByParameters" endpoints, pagination shape, and child-organization fan-out patterns.' }
    ],
    agents: [
      { name: 'approval-triage-analyst', description: 'Use this agent when reviewing the ThreatLocker pending approval queue, classifying application requests as high-confidence vs needs-review, recommending approve/deny decisions with documented reasoning, and escalating suspicious patterns.' },
      { name: 'fleet-health-auditor', description: 'Use this agent when producing ThreatLocker fleet inventory and hygiene reports — computer inventory by OS or group, offline-agent identification with check-in age tiering, computer-group hygiene analysis (orphans, oversized groups, OS-mismatched assignments), and multi-tenant pivots across child organizations.' },
      { name: 'threat-investigator', description: 'Use this agent when investigating a ThreatLocker security event — reconstructing a timeline around a host/user/file, tracing a file\'s history across the fleet, identifying repeated denials, and surfacing policy bypasses or audit-only matches that warrant new policy rules.' }
    ],
    commands: [
      { name: '/approval-triage', description: 'Triage pending ThreatLocker approval requests with approve/deny recommendations' },
      { name: '/audit-investigation', description: 'Build a timeline of ThreatLocker audit events around a security incident' },
      { name: '/computer-inventory', description: 'Generate a ThreatLocker computer inventory report' },
      { name: '/offline-agents', description: 'Find ThreatLocker agents that have not checked in recently' },
      { name: '/tenant-overview', description: 'Multi-tenant ThreatLocker overview across child organizations' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'threatlocker/threatlocker',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'kaseya-vsa',
    name: 'Kaseya Vsa',
    vendor: 'Kaseya',
    description: 'Kaseya VSA - endpoint monitoring, patch management, agent procedures, remote control (scaffolding)',
    category: 'rmm',
    maturity: 'alpha',
    features: [],
    skills: [
      { name: 'api-patterns', description: 'Use this skill when working with the Kaseya VSA REST API.' }
    ],
    agents: [],
    commands: [],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'kaseya/kaseya-vsa',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'datto-bcdr',
    name: 'Datto Bcdr',
    vendor: 'Kaseya',
    description: 'Datto BCDR (SIRIS / Alto) - backup status, screenshot verification, recovery points (scaffolding)',
    category: 'bcdr',
    maturity: 'alpha',
    features: [],
    skills: [
      { name: 'api-patterns', description: 'Use this skill when integrating with the Datto BCDR (Backup Portal) REST API.' }
    ],
    agents: [],
    commands: [],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'kaseya/datto-bcdr',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'kaseya-bms',
    name: 'Kaseya Bms',
    vendor: 'Kaseya',
    description: 'Kaseya BMS PSA - tickets, accounts, contracts, time entries, billing (scaffolding)',
    category: 'psa',
    maturity: 'alpha',
    features: [],
    skills: [
      { name: 'api-patterns', description: 'Use this skill when integrating with the Kaseya BMS PSA REST API v2.' }
    ],
    agents: [],
    commands: [],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'kaseya/kaseya-bms',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'datto-saas-protection',
    name: 'Datto Saas Protection',
    vendor: 'Kaseya',
    description: 'Datto SaaS Protection (Backupify) - M365 / Google Workspace cloud-to-cloud backup (scaffolding)',
    category: 'bcdr',
    maturity: 'alpha',
    features: [],
    skills: [
      { name: 'api-patterns', description: 'Use this skill when integrating with Datto SaaS Protection (formerly Backupify).' }
    ],
    agents: [],
    commands: [],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'kaseya/datto-saas-protection',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'unitrends',
    name: 'Unitrends',
    vendor: 'Kaseya',
    description: 'Unitrends - appliances, backup jobs, recovery points, replication, alerts (scaffolding)',
    category: 'bcdr',
    maturity: 'alpha',
    features: [],
    skills: [
      { name: 'api-patterns', description: 'Use this skill when integrating with the Unitrends Backup REST API.' }
    ],
    agents: [],
    commands: [],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'kaseya/unitrends',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'spanning',
    name: 'Spanning',
    vendor: 'Kaseya',
    description: 'Spanning Cloud Backup - SaaS backup for M365 / Google Workspace / Salesforce (scaffolding)',
    category: 'bcdr',
    maturity: 'alpha',
    features: [],
    skills: [
      { name: 'api-patterns', description: 'Use this skill when integrating with Spanning Cloud Backup.' }
    ],
    agents: [],
    commands: [],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'kaseya/spanning',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'hubspot',
    name: 'HubSpot CRM',
    vendor: 'HubSpot',
    description: 'HubSpot CRM - contacts, companies, deals, tickets, activities, and pipeline reporting (uses HubSpot\'s first-party MCP server)',
    category: 'crm',
    maturity: 'production',
    features: [
      'Activity Logging',
      'Company Management',
      'Contact Management',
      'Deal & Pipeline Tracking',
      'Ticket Management'
    ],
    skills: [
      { name: 'activities', description: 'Use this skill when working with HubSpot activities - creating tasks, logging notes, managing associations between CRM objects, and tracking engagement history.' },
      { name: 'companies', description: 'Use this skill when working with HubSpot companies - searching, creating, updating, and auditing company records in HubSpot CRM.' },
      { name: 'contacts', description: 'Use this skill when working with HubSpot contacts - searching, creating, updating, and managing contact records in HubSpot CRM.' },
      { name: 'deals', description: 'Use this skill when working with HubSpot deals - searching, creating, updating, and managing deal records and pipelines in HubSpot CRM.' },
      { name: 'tickets', description: 'Use this skill when working with HubSpot tickets - creating, searching, updating, and managing support tickets in HubSpot CRM.' },
      { name: 'api-patterns', description: 'Use this skill when working with the HubSpot MCP tools - available tools, OAuth 2.0 + PKCE authentication, scopes, Streamable HTTP transport, rate limiting, error handling, and best practices.' }
    ],
    agents: [
      { name: 'client-relationship-manager', description: 'Use this agent when an MSP account manager or vCIO needs to review account health across the client portfolio in HubSpot.' },
      { name: 'pipeline-health-reporter', description: 'Use this agent when an MSP sales manager or leadership needs to analyze pipeline health, deal velocity, stage conversion rates, or forecast accuracy in HubSpot.' }
    ],
    commands: [
      { name: '/create-deal', description: 'Create a new deal in HubSpot with company association' },
      { name: '/log-activity', description: 'Log a note or create a task on a HubSpot contact, company, or deal' },
      { name: '/lookup-company', description: 'Find a HubSpot company by name or domain and show associated contacts and deals' },
      { name: '/pipeline-summary', description: 'Summarize the HubSpot deal pipeline - deals per stage, total value, and expected close dates' },
      { name: '/search-contacts', description: 'Search HubSpot contacts by name, email, or company' },
      { name: '/search-deals', description: 'Search HubSpot deals by name, stage, or company' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'hubspot/hubspot',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'spamtitan',
    name: 'Spamtitan',
    vendor: 'SpamTitan',
    description: 'SpamTitan by TitanHQ - quarantine queue management, email flow stats, sender allowlist/blocklist for MSPs',
    category: 'email-security',
    maturity: 'beta',
    features: [
      'Lists',
      'Quarantine'
    ],
    skills: [
      { name: 'lists', description: 'Use this skill when managing SpamTitan sender allowlists and blocklists — adding trusted senders to prevent false positives, blocking unwanted senders and domains, and reviewing existing list entries.' },
      { name: 'quarantine', description: 'Use this skill when managing the SpamTitan quarantine queue — listing held messages, releasing legitimate emails, deleting spam, reviewing email flow statistics, and performing bulk quarantine operations.' },
      { name: 'api-patterns', description: 'Use this skill when working with the SpamTitan MCP tools — available tools, authentication via API key header, API structure, pagination, rate limiting, error handling, and best practices.' }
    ],
    agents: [
      { name: 'quarantine-release-reviewer', description: 'Use this agent when an MSP technician or client needs to systematically review the SpamTitan quarantine queue for false positives, release legitimate messages, identify patterns of legitimate mail being blocked, or generate a quarantine digest for client review.' },
      { name: 'spam-filter-analyst', description: 'Use this agent when analyzing spam and phishing patterns in SpamTitan, managing the quarantine queue, tuning allowlist and blocklist rules, investigating held email, or generating email filtering statistics for MSP clients.' }
    ],
    commands: [
      { name: '/manage-lists', description: 'Add or remove entries from SpamTitan sender allowlists and blocklists' },
      { name: '/review-quarantine', description: 'Review the SpamTitan quarantine queue, show email statistics summary, and list recent held messages with release and delete actions' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'spamtitan/spamtitan',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'xero',
    name: 'Xero',
    vendor: 'Xero',
    description: 'Xero accounting - contacts, invoices, payments, accounts, and financial reports',
    category: 'accounting',
    maturity: 'production',
    features: [
      'Account Hierarchy',
      'Contact Management',
      'Invoice Management',
      'Payment Tracking',
      'Financial Reporting'
    ],
    skills: [
      { name: 'accounts', description: 'Use this skill when working with Xero chart of accounts - navigating account codes, creating accounts, understanding account types and classes, tax settings, and mapping MSP revenue and expense categories to the general ledger.' },
      { name: 'contacts', description: 'Use this skill when working with Xero contacts (customers/suppliers) - creating, searching, updating, and managing client organizations.' },
      { name: 'invoices', description: 'Use this skill when working with Xero invoices - creating, searching, updating, voiding, and managing sales invoices (ACCREC) and supplier bills (ACCPAY).' },
      { name: 'payments', description: 'Use this skill when working with Xero payments - recording payments, tracking outstanding balances, payment allocation, overpayments, prepayments, and batch payment operations.' },
      { name: 'reports', description: 'Use this skill when working with Xero financial reports - Profit and Loss, Balance Sheet, Aged Receivables, Aged Payables, Trial Balance, and other management reports.' },
      { name: 'api-patterns', description: 'Use this skill when working with the Xero API - OAuth2 authentication, REST structure, filtering, pagination, rate limiting, error handling, and best practices.' }
    ],
    agents: [
      { name: 'billing-reconciler', description: 'Use this agent when an MSP needs to reconcile billing in Xero — matching invoices to contracts, tracking outstanding receivables, identifying billing discrepancies, or reviewing cash flow.' },
      { name: 'cash-flow-analyzer', description: 'Use this agent when an MSP needs to analyze cash flow position in Xero — tracking accounts receivable aging trends, forecasting upcoming payables vs. expected inflows, identifying months where collections may fall short of committed expenses, or producing a 90-day cash flow projection.' }
    ],
    commands: [
      { name: '/create-invoice', description: 'Create a sales invoice for a managed services client in Xero' },
      { name: '/payment-status', description: 'Check payment status and outstanding balances for a client in Xero' },
      { name: '/reconciliation-summary', description: 'Verify all MSP clients have been billed for the current period and summarize reconciliation status' },
      { name: '/search-contacts', description: 'Find a contact in Xero by name, email, or account number' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'xero/xero',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'alternative-payments',
    name: 'Alternative Payments',
    vendor: 'Alternative-payments',
    description: 'Alternative Payments - customers, invoices, hosted payment requests, transactions, payouts, and webhooks (read + safe writes)',
    category: 'accounting',
    maturity: 'beta',
    features: [
      'Customer Operations',
      'Invoicing',
      'Payment Tracking'
    ],
    skills: [
      { name: 'customers', description: 'Use this skill when working with Alternative Payments customers and their users - listing, retrieving, and creating customers, adding users to a customer, and archiving customers.' },
      { name: 'invoicing', description: 'Use this skill when working with Alternative Payments invoices and hosted payment requests - listing, retrieving, and creating invoices with line items, fetching a hosted payment link or PDF link, archiving an invoice, and creating or retrieving hosted payment requests.' },
      { name: 'payments', description: 'Use this skill when reading Alternative Payments transactions and payouts - listing and filtering transactions by type, status, customer, invoice, and payment method; retrieving a single transaction; and listing or retrieving payouts and the transactions that compose them for reconciliation.' },
      { name: 'api-patterns', description: 'Use this skill when working with the Alternative Payments API - OAuth2 client-credentials authentication, REST structure, cursor pagination, rate limiting (5 req/sec), error handling, and the read + safe-write capability posture.' }
    ],
    agents: [
      { name: 'payment-reconciler', description: 'Use this agent when an MSP needs to reconcile Alternative Payments activity — matching transactions to invoices, surfacing unpaid and overdue invoices, summarizing payouts and the transactions that compose them, flagging failed or declined transactions, and tracking outstanding receivables via hosted payment requests.' }
    ],
    commands: [
      { name: '/list-overdue-invoices', description: 'List open and overdue Alternative Payments invoices and optionally generate hosted payment links for them' },
      { name: '/reconcile-payout', description: 'Reconcile an Alternative Payments payout by listing its transactions and matching them against invoices and customers' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'alternative-payments/alternative-payments',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'ironscales',
    name: 'Ironscales',
    vendor: 'Ironscales',
    description: 'Claude plugins for IRONSCALES - AI-powered anti-phishing, incident triage, email classification, and crowdsourced threat intelligence',
    category: 'email-security',
    maturity: 'beta',
    features: [
      'Incident Management'
    ],
    skills: [
      { name: 'incidents', description: 'Use this skill when working with Ironscales phishing incidents — listing and triaging incidents, classifying emails as phishing/spam/legitimate, taking remediation actions, managing sender allowlists, and viewing company statistics.' },
      { name: 'api-patterns', description: 'Use this skill when working with Ironscales MCP tools — available tools, API key and company ID authentication, pagination, rate limiting, and error handling.' }
    ],
    agents: [
      { name: 'crowdsourced-intel-harvester', description: 'Use this agent when harvesting and analyzing crowdsourced threat intelligence from IRONSCALES\' global network — identifying trending attack types, surfacing indicators seeing increased reports, comparing client threat profiles to industry peers, and generating intelligence briefings from the collective signal.' },
      { name: 'phishing-responder', description: 'Use this agent when responding to user-reported phishing emails in IRONSCALES, triaging the incident queue, classifying emails, coordinating quarantine and remediation, or reviewing security statistics for MSP clients.' }
    ],
    commands: [
      { name: '/classify-email', description: 'Classify a specific Ironscales incident email as phishing, spam, or legitimate' },
      { name: '/triage-incidents', description: 'Triage open Ironscales phishing incidents — list by status, classify, and remediate' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'ironscales/ironscales',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'mimecast',
    name: 'Mimecast',
    vendor: 'Mimecast',
    description: 'Claude plugins for Mimecast Email Security - message tracking, threat intelligence, queue management, and email security operations',
    category: 'email-security',
    maturity: 'beta',
    features: [
      'Message Tracking',
      'Queue Management',
      'Threat Intelligence'
    ],
    skills: [
      { name: 'message-tracking', description: 'Use this skill when tracking or tracing Mimecast email messages — searching by sender/recipient/subject, retrieving message metadata, placing messages on hold, or releasing held messages.' },
      { name: 'queue-management', description: 'Use this skill when checking Mimecast email delivery queue status — identifying stuck messages, delivery delays, and backlog conditions.' },
      { name: 'threat-intelligence', description: 'Use this skill when investigating Mimecast threat activity — TTP logs for URL clicks, malicious attachment analysis, impersonation attempts, threat remediation incidents, and audit events.' },
      { name: 'api-patterns', description: 'Use this skill when working with Mimecast MCP tools — available tools, OAuth 2.0 client credentials authentication, regional API endpoints, pagination, rate limiting, and error handling.' }
    ],
    agents: [
      { name: 'email-continuity-checker', description: 'Use this agent when verifying Mimecast email continuity and archiving health — not for threat investigation, but for checking continuity mode status, verifying archiving is capturing expected mail volumes, auditing connector health, and confirming restore capability.' },
      { name: 'email-threat-investigator', description: 'Use this agent when investigating email-borne threats, tracing suspicious messages, analyzing TTP click and attachment logs, auditing Mimecast security posture, or managing held email queues for MSP clients on the Mimecast platform.' }
    ],
    commands: [
      { name: '/check-queue', description: 'Check Mimecast email delivery queue status and identify stuck or deferred messages' },
      { name: '/review-threats', description: 'Review Mimecast TTP threat logs for URL clicks, malicious attachments, and impersonation attempts' },
      { name: '/trace-message', description: 'Trace an email through Mimecast by sender, recipient, subject, or date range' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'mimecast/mimecast',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'wyre-gateway',
    name: 'Wyre Gateway',
    vendor: 'Wyre-gateway',
    description: 'WYRE MSP Gateway client - cross-vendor orchestration agents (client-360, QBR prep, renewal-risk analysis, security-posture scoring, technician-performance coaching, incident war-room coordination, compliance evidence packaging, onboarding QA, gateway ops). Connects to mcp.wyre.ai.',
    category: 'productivity',
    maturity: 'alpha',
    features: [],
    skills: [],
    agents: [
      { name: 'asset-reconciliation-auditor', description: 'Use this agent when an MSP needs to reconcile its asset estate across managed, secured, billed, and documented systems to surface security coverage gaps, revenue leakage, ghost assets, and shadow IT.' },
      { name: 'book-of-business-pulse', description: 'Use this agent when an MSP owner, service-delivery manager, or ops lead needs a single operational, commercial, and security heartbeat across the entire client portfolio.' },
      { name: 'change-drift-sentinel', description: 'Use this agent when an MSP needs to detect unauthorized, undocumented, or security-weakening configuration changes across the client estate and correlate each change against change-control tickets and documentation currency.' },
      { name: 'client-360-briefer', description: 'Use this agent when an MSP technician, account manager, or vCIO needs a complete, synthesized briefing on a client before a call, meeting, or QBR.' },
      { name: 'client-discovery-agent', description: 'Use this agent when an MSP is beginning to onboard a new client, conducting a prospect assessment, or performing a takeover from another provider and needs a comprehensive cross-system discovery sweep to establish a baseline of what exists before setup work begins.' },
      { name: 'compliance-evidence-packager', description: 'Use this agent when a client needs compliance evidence gathered for a formal audit or assessment against a recognized framework.' },
      { name: 'dr-readiness-auditor', description: 'Use this agent when an MSP needs to assess the true disaster-recovery readiness of a client — going beyond backup dashboard green lights to evaluate coverage, test-restore history, runbook maturity, and RTO/RPO achievability.' },
      { name: 'gateway-ops', description: 'Use this agent when an MSP administrator needs to review gateway activity, audit tool usage across the team, investigate suspicious access patterns, check permission configurations, or monitor for anomalies in how MSP tools are being accessed through the WYRE MCP Gateway.' },
      { name: 'incident-war-room-coordinator', description: 'Use this agent when a major incident (P1 or Critical severity) has been declared or is suspected, and the team needs immediate situational awareness across all affected systems and stakeholders.' },
      { name: 'license-true-up-reconciler', description: 'Use this agent when an MSP operations manager, account manager, or billing team needs to reconcile subscription license seats across the full provisioning-to-billing chain and quantify waste, leakage, and over-collection.' },
      { name: 'offboarding-orchestrator', description: 'Use this agent when an MSP is ending a client relationship — whether through churn, client acquisition, mutual termination, or non-renewal — and needs to orchestrate a complete, auditable teardown across every connected tool, reclaim all licensed spend, and fulfill contractual data-handover obligations.' },
      { name: 'onboarding-completeness-checker', description: 'Use this agent when an MSP needs to validate that a newly onboarded client has been fully set up across all MSP tools and systems before transitioning to steady-state support.' },
      { name: 'portfolio-threat-sweep', description: 'Use this agent when an indicator set — file hashes, domains, IPs, sender addresses, URLs, a CVE, or a MITRE ATT&CK technique — needs to be hunted across every client tenant simultaneously to map blast radius and identify exposure before a campaign spreads.' },
      { name: 'qbr-prep-agent', description: 'Use this agent when an MSP account manager or vCIO needs to prepare a complete Quarterly Business Review data package for a client.' },
      { name: 'renewal-risk-analyzer', description: 'Use this agent when an MSP account manager, sales leader, or operations manager wants to identify clients at risk of not renewing before the renewal conversation happens.' },
      { name: 'security-posture-scorer', description: 'Use this agent when an MSP needs a comprehensive, scored security health assessment for a specific client — acting as a vCISO-style health check by aggregating data across all connected security tools.' },
      { name: 'service-profitability-auditor', description: 'Use this agent when an MSP owner, operations leader, or finance lead needs to identify which clients and contracts are losing money or eroding margin across the portfolio.' },
      { name: 'technician-performance-coach', description: 'Use this agent when a service delivery manager or operations lead wants to understand technician performance trends and get actionable coaching recommendations grounded in data.' },
      { name: 'ticket-deflection-analyzer', description: 'Use this agent when an MSP operations lead or service delivery manager wants to identify recurring ticket patterns that can be eliminated or deflected through automation, self-service, or root-cause remediation — and quantify the labor being silently consumed.' },
      { name: 'user-lifecycle-orchestrator', description: 'Use this agent when an MSP needs to provision, modify, or deprovision an individual employee\'s access, identity, licensing, and security posture across all connected systems for a client.' },
      { name: 'vulnerability-remediation-prioritizer', description: 'Use this agent when an MSP needs a risk-ranked, actionable remediation workplan from raw vulnerability and missing-patch data — going beyond compliance status to tell technicians exactly what to fix first and why.' }
    ],
    commands: [],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'wyre-gateway',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'microsoft-graph',
    name: 'Microsoft Graph',
    vendor: 'Microsoft-graph',
    description: 'Microsoft Graph Enterprise MCP - read-only natural-language queries over Microsoft Entra identity and directory data: users, groups, applications, devices, and admin reporting (public preview)',
    category: 'productivity',
    maturity: 'beta',
    features: [
      'Connection',
      'Querying'
    ],
    skills: [
      { name: 'connection', description: 'Use this skill when connecting the Microsoft Graph MCP Server for Enterprise to the Wyre MCP Gateway — registering the BYOC multi-tenant Entra app, supplying tenantId/clientId/clientSecret, and (the part everyone misses) granting per-tenant admin consent for the MCP.* delegated permissions out of band.' },
      { name: 'querying', description: 'Use this skill when answering identity or directory questions against a client\'s Microsoft Entra tenant via the Microsoft Graph MCP Server for Enterprise.' }
    ],
    agents: [
      { name: 'entra-reporting-analyst', description: 'Use this agent when an MSP technician, service-desk analyst, account manager, or vCISO needs to answer questions about a client\'s Microsoft Entra (Azure AD) identity and directory data — user and license counts, MFA registration gaps, guest inventory, inactive accounts, app inventory, directory roles, sign-in activity.' }
    ],
    commands: [
      { name: '/entra-audit', description: 'Run a read-only Microsoft Entra identity hygiene audit via the Graph Enterprise MCP — inactive user accounts, admins without MFA registered, unassigned/wasted licenses, and a guest user inventory' },
      { name: '/entra-report', description: 'Conversational Microsoft Entra directory reporting via the Graph Enterprise MCP — license usage, user and group counts, application inventory, and directory composition, formatted for client check-ins and QBRs' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'microsoft-graph/microsoft-graph',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'azure-mcp',
    name: 'Azure Mcp',
    vendor: 'Azure-mcp',
    description: 'Azure MCP Server - read-only Azure observability, cost, and resource-health analysis in natural language: monitoring, pricing, quota, advisor, resource health, diagnostics',
    category: 'monitoring',
    maturity: 'beta',
    features: [
      'Connection',
      'Cost And Capacity',
      'Observability'
    ],
    skills: [
      { name: 'connection', description: 'Use this skill when connecting the azure-mcp vendor through the WYRE MCP Gateway — registering an Azure service principal, supplying tenantId/clientId/clientSecret, and granting least-privilege Reader-tier RBAC.' },
      { name: 'cost-and-capacity', description: 'Use this skill for Azure cost, pricing, capacity, and inventory work through the azure-mcp connector — retail pricing lookups, subscription quota and usage-limit checks, and listing/inspecting subscriptions and resource groups.' },
      { name: 'observability', description: 'Use this skill for Azure observability, diagnostics, and resource-health work through the azure-mcp connector — pulling Azure Monitor metrics, running Log Analytics KQL queries, checking alert state, reading Resource Health status, triaging AppLens diagnostics, and reviewing Azure Advisor recommendations.' }
    ],
    agents: [
      { name: 'azure-ops-analyst', description: 'Use this agent when an MSP engineer, service manager, or cloud lead needs a read-only Azure operations investigation — resource health triage, cost and Azure Advisor analysis, quota/capacity headroom checks, and observability-posture reporting across subscriptions.' }
    ],
    commands: [
      { name: '/azure-cost', description: 'Azure cost and pricing analysis for a subscription — Advisor cost recommendations, retail pricing lookups, and quota-driven right-sizing signals, scoped to one subscription' },
      { name: '/azure-diagnostics', description: 'Resource health and diagnostics triage for an Azure resource or subscription — Resource Health status, AppLens deep diagnostics, and Azure Monitor alert state' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'azure-mcp/azure-mcp',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  }
];

export function getPluginById(id: string): Plugin | undefined {
  return plugins.find(p => p.id === id);
}

export function getPluginsByCategory(category: Plugin['category']): Plugin[] {
  return plugins.filter(p => p.category === category);
}

export function getPluginsByVendor(vendor: string): Plugin[] {
  return plugins.filter(p => p.vendor.toLowerCase() === vendor.toLowerCase());
}
