// Auto-generated — do not edit manually. Run `npm run generate` to update.

export interface Plugin {
  id: string;
  name: string;
  vendor: string;
  description: string;
  category: 'accounting' | 'bcdr' | 'crm' | 'documentation' | 'email-security' | 'incident-management' | 'legal' | 'marketplace' | 'monitoring' | 'network' | 'productivity' | 'psa' | 'rmm' | 'sales' | 'security' | 'workflow-pack';
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
    maturity: 'beta',
    features: [
      'Cases',
      'Messages',
      'Threats'
    ],
    skills: [
      { name: 'cases', description: 'Abnormal Security abuse mailbox cases: user-reported email submissions, case statuses and judgments, the case lifecycle, bulk and remediation actions, and phishing simulation handling.' },
      { name: 'messages', description: 'Abnormal Security message analysis: message retrieval, email header inspection, attachments, sender reputation, delivery context, and SPF/DKIM/DMARC authentication results.' },
      { name: 'threats', description: 'Abnormal Security threat detection: threat types (BEC, phishing, malware, socially-engineered attacks, spam, graymail, credential theft), attack vectors, severity assessment, remediation actions, and investigation workflows.' },
      { name: 'api-patterns', description: 'Abnormal Security REST API fundamentals: Bearer token authentication, base URLs, rate limiting, pagination, OData filtering, request/response formats, and error handling.' }
    ],
    agents: [
      { name: 'email-threat-analyst', description: 'Use this agent when investigating email threats detected by Abnormal Security, analyzing attack chains, assessing user exposure, or managing per-message remediation across client tenants.' },
      { name: 'threat-report-generator', description: 'Use this agent when generating periodic threat landscape reports from Abnormal Security data across the MSP client portfolio — not for live threat investigation, but for summarizing attack trends, most targeted organizations, most common attack types, BEC attempt volumes, and remediation effectiveness over time.' }
    ],
    commands: [
      { name: '/case-review', description: 'Review and triage abuse mailbox cases in Abnormal Security' },
      { name: '/search-threats', description: 'Search for specific threat patterns in Abnormal Security by sender, recipient, attack type, or keywords' },
      { name: '/threat-triage', description: 'Triage recent email threats detected by Abnormal Security by severity and attack type' }
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
      { name: 'agents', description: 'Atera RMM agents: agent records and fields, online/offline status, endpoint search and monitoring, PowerShell and script execution, and agent lifecycle.' },
      { name: 'alerts', description: 'Atera alerts: alert types, severity levels, alert sources, the acknowledge/resolve lifecycle, and alert-to-ticket conversion.' },
      { name: 'customers', description: 'Atera customers and contacts: customer records and fields, contact management, custom fields, and customer lifecycle operations.' },
      { name: 'devices', description: 'Atera device monitors: HTTP, SNMP, and TCP monitor types for network devices, services, and applications, plus monitor configuration, thresholds, and polling behavior.' },
      { name: 'tickets', description: 'Atera service desk tickets: ticket fields, statuses, priorities, comments, work hours, and billing duration.' },
      { name: 'api-patterns', description: 'Atera REST API fundamentals: X-API-KEY header authentication, OData-style pagination, the 700 requests/minute rate limit, endpoint conventions, and error handling.' }
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
      { name: 'alerts', description: 'Auvik alerts: severity tiers, status lifecycle, dismissal semantics, and the common alertName patterns that show up in MSP NOC queues.' },
      { name: 'devices', description: 'Auvik device records: device types, manageStatus and onlineStatus, lifecycle and warranty fields, and choosing between the v1 list endpoint and the detailed device endpoints.' },
      { name: 'networks', description: 'Auvik network and interface entities: the network entity model, IP-range scoping, interface-to-device relationships, and adminStatus vs operStatus.' },
      { name: 'api-patterns', description: 'Auvik MCP fundamentals: the JSON:API envelope shape, basic-auth credential model, region routing, cursor-based pagination, rate-limit handling, and the v1 vs v2 device API distinction.' }
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
      { name: 'billing', description: 'Autotask billing item retrieval, approval-level workflows, and invoice search — covering billing item types, approval status filtering, and reconciliation of billable work against invoices for MSP finance teams.' },
      { name: 'configuration-items', description: 'Autotask Configuration Item (CI) asset management: CI types and categories, lifecycle status codes, the CI field schema, related-item relationships, DNS records, notes, and contract/billing associations for MSP infrastructure tracking.' },
      { name: 'contracts', description: 'Autotask contract and service agreement management - contract types (recurring services, block hours, time & materials, fixed price, retainer), service/service bundle associations, SLAs, and how contracts drive billing for MSP account managers.' },
      { name: 'crm', description: 'Autotask CRM entities - companies (accounts), contacts, and sites/locations - including field references, company type classifications, and how these records underpin tickets, contracts, and projects for MSP account management.' },
      { name: 'expenses', description: 'Autotask expense report and expense item structure - the report/item parent-child relationship, approval status workflow, expense categories, payment types, and the billable vs reimbursable distinction for MSP operational expenses.' },
      { name: 'picklists', description: 'Autotask picklist and reference-data lookups — queues, ticket statuses, ticket priorities, and project phases — the instance-specific configured values required before creating or filtering tickets and other entities.' },
      { name: 'product-catalog', description: 'Autotask product catalog structure - Products, Services, and Service Bundles - and how Price Lists override default unit pricing.' },
      { name: 'projects', description: 'Autotask project structure - projects, phases, tasks, and milestones - including project and task fields, status values, resource assignment, and how project work links to contract billing for MSP project managers.' },
      { name: 'quotes', description: 'Autotask quote structure and line items - quote item types (product, service, service bundle, labor, expense, shipping), the mutually-exclusive catalog reference rules, and the three discount mechanisms (unit, line, percentage) used to build customer proposals.' },
      { name: 'service-calls', description: 'Autotask Service Call data model - the ServiceCall / ServiceCallTicket / ServiceCallTicketResource three-layer structure - covering fields, status codes, and how tickets and technicians (resources) are linked to scheduled work.' },
      { name: 'ticket-notes-attachments', description: 'Autotask ticket notes, attachments, and charges — the secondary entities attached to tickets: retrieving/searching notes and attachments, and creating, updating, or searching ticket charges for labor and expenses billed directly to a ticket.' },
      { name: 'tickets', description: 'Autotask ticket lifecycle: status/priority codes and transition rules, the ticket field schema, SLA calculation and clock behavior, escalation rules, ticket metrics, and the MCP tool surface (create, update, search, history, notes) for MSP service desk operations.' },
      { name: 'time-entries', description: 'Autotask time entry structure: approval status codes and workflow, the time entry field schema, the billing rate hierarchy, budget and contract-limit validation, utilization analytics, and the MSP business rules for rounding and minimum billing increments.' },
      { name: 'tool-discovery', description: 'The Autotask MCP lazy-loading pattern - four meta-tools (list_categories, list_category_tools, execute_tool, router) that expose the full 39+ tool catalog progressively instead of loading every tool schema upfront, plus the natural-language router for intent-based tool lookup.' },
      { name: 'api-patterns', description: 'Autotask REST API fundamentals: header-based authentication, zone detection, the query/filter DSL (14 operators, logical grouping, includes), pagination, rate limits, and CRUD conventions across the 215+ entity PSA.' }
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
      { name: 'purchasing', description: 'Kaseya Quote Manager procurement data: purchase orders with their lines and costs, the suppliers they are placed with, and product-supplier records mapping catalog products to supplier SKUs and pricing.' },
      { name: 'quotes', description: 'Kaseya Quote Manager quoting data: the quote → section → line item hierarchy, and the sales orders, order lines, and payments a quote becomes once accepted.' },
      { name: 'api-patterns', description: 'Kaseya Quote Manager (Datto Commerce) API fundamentals: API-key auth and the gateway\'s header translation, the read-only `kqm_<entity>_list`/`_get` tool surface across the sales, procurement, catalog, CRM, and org domains, page/pageSize/modifiedAfter pagination, rate limits, and error codes.' }
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
      { name: 'incidents', description: 'Better Stack incidents: incident records raised by uptime monitors or reported manually, and the triage, acknowledgment, and resolution lifecycle.' },
      { name: 'logging', description: 'Better Stack log management (Logtail): log sources, structured log search and query syntax, log-based alerting, and log analysis workflows.' },
      { name: 'monitors', description: 'Better Stack uptime monitors: check types, monitor fields, heartbeat monitors, monitor groups, and create/update/pause/delete operations.' },
      { name: 'oncall', description: 'Better Stack on-call: on-call calendars and rotations, escalation and notification policies, alert routing, and determining who is currently on call.' },
      { name: 'status-pages', description: 'Better Stack status pages: status page configuration, resources and components, maintenance windows, and public service-status communication.' },
      { name: 'api-patterns', description: 'Better Stack MCP and API surface across Uptime, Telemetry (Logtail), and Error Tracking: available tools, Bearer token authentication, API structure, cursor-based pagination, rate limiting, and error handling.' }
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
      { name: 'agents', description: 'Blumira agents (sensors) and the devices they run on: device inventory and filtering, agent health via last-seen timestamps, and agent deployment keys.' },
      { name: 'findings', description: 'The Blumira finding lifecycle: status and severity codes, resolution types, list filtering, enriched detail retrieval, assignment, and comment threads.' },
      { name: 'msp', description: 'Blumira\'s MSP path group (`/msp/*`): managed-account enumeration, cross-account and per-account finding queries, per-account device, agent-key and user management, and how MSP paths differ from org paths.' },
      { name: 'resolutions', description: 'Blumira resolution types (Valid, Not Applicable, False Positive): how to choose between them, their effect on security metrics and detection tuning, and the org- and MSP-level resolve calls.' },
      { name: 'users', description: 'Blumira organization users: listing and filtering users, user roles, and looking up the user IDs required for finding assignment and access audits.' },
      { name: 'api-patterns', description: 'Blumira REST API fundamentals: JWT authentication, the dual `/org/*` vs `/msp/*` path structure, suffix-based filter operators, pagination parameters and response metadata, the stateful MCP navigation tools, and HTTP error causes.' }
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
      'Exceptions',
      'Quarantine',
      'Threats'
    ],
    skills: [
      { name: 'exceptions', description: 'The Checkpoint Harmony Email (Avanan) whitelist and blacklist surface: the match fields and matching modes an exception accepts, the defaults that widen an entry beyond what was typed, the id mismatch between listing and editing, and the standing security consequence of a detection bypass.' },
      { name: 'quarantine', description: 'Finding and acting on mail in Checkpoint Harmony Email (Avanan): the `hec_search_emails` attribute-filter syntax, what an entity payload carries, the asynchronous quarantine and restore actions and their task polling, and the judgement a restore requires because delivery cannot be undone.' },
      { name: 'threats', description: 'The Checkpoint Harmony Email (Avanan) security-event surface: the event type, state, severity and SaaS enums accepted by `hec_query_events`, what a detection record does and does not carry, how `availableEventActions` governs what you can do next, and phishing, BEC and malware triage built on those fields.' },
      { name: 'api-patterns', description: 'Shape of the Checkpoint Harmony Email (Avanan) `hec_*` tool surface: the thirteen tools and what each reaches, the event/entity split that governs which tool accepts which id, the `responseEnvelope`/`responseData` result shape, `scrollId` pagination, and the auth, regional-routing and farm-scope behaviour behind every call.' }
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
      { name: 'alerts', description: 'CIPP\'s read-only alerting and audit surface: the cross-tenant alert queue, tenant-scoped M365 unified audit log queries, the audit operations worth filtering on during a compromise investigation, and audit lag/retention behavior.' },
      { name: 'groups', description: 'Tenant-scoped Entra/M365 group enumeration and creation in CIPP, the four group types (Security, Microsoft 365, Distribution, Mail-Enabled Security) and when to pick each, and the boundary where CIPP\'s group surface ends and Graph/M365 takes over.' },
      { name: 'licenses', description: 'Read-only M365 license visibility through CIPP: per-tenant SKU purchase vs. consumption, portfolio-wide CSP license commitments, common SKU part numbers and their friendly names, and the license-mix red flags that drive rightsizing and billing reconciliation.' },
      { name: 'mailboxes', description: 'The four Exchange Online mailbox operations CIPP exposes — mailbox inventory, delegate/full-access permission audit, out-of-office, and email forwarding — plus the BEC-remediation, offboarding, and leave-coverage sequences built from them.' },
      { name: 'ops', description: 'CIPP\'s own operational layer rather than the tenants it manages: GDAP role definitions and pending invites, the CIPP scheduler, and the ping/version/log endpoints used to diagnose why other CIPP tools fail silently.' },
      { name: 'security', description: 'Read-only access to a tenant\'s Conditional Access policy graph and named locations through CIPP: policy state semantics, the findings that matter in a CA review, portfolio drift detection, and why CA writes are absent from the MCP surface.' },
      { name: 'standards', description: 'CIPP\'s tenant-baseline enforcement model: the Report/Alert/Remediate standards modes and how to roll them out, on-demand standards evaluation, Best Practice Analyser reports, and SPF/DKIM/DMARC domain health results with their remediation actions.' },
      { name: 'tenants', description: 'The top-level CIPP scope: enumerating managed M365 tenants, retrieving tenant detail, and the accepted `tenantFilter` identifier formats (default domain, custom domain, GUID, `allTenants`).' },
      { name: 'users', description: 'The full multi-tenant M365 user lifecycle in CIPP: create/edit/disable, password and MFA resets, session revocation, the bundled offboarding call, BEC investigation reports, MFA gap reporting, and device/group lookups — plus the ordering constraints that make each sequence correct.' }
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
    id: 'freshdesk',
    name: 'Freshdesk',
    vendor: 'Freshdesk',
    description: 'Freshdesk - cloud helpdesk/PSA ticketing for MSPs: tickets, conversations, contacts, companies, knowledge base, SLA policies, and business hours',
    category: 'psa',
    maturity: 'beta',
    features: [
      'Contacts Companies',
      'Knowledge Base',
      'Sla Business Hours',
      'Ticketing'
    ],
    skills: [
      { name: 'contacts-companies', description: 'Freshdesk contacts and companies: contact fields and the required contact-channel rule, contact CRUD plus merge and make_agent, company fields and domain-based auto-association, search and autocomplete lookups, and the MSP workflow of resolving a ticket requester to a contact and then to its parent company through the Freshdesk REST API v2.' },
      { name: 'knowledge-base', description: 'Freshdesk Solutions knowledge base: the three-level categories -> folders -> articles hierarchy, article fields and draft/published status, finding an article by walking that tree (there is no KB search tool), and the MSP workflow of suggesting relevant KB articles to deflect or resolve a ticket, through the Freshdesk REST API v2.' },
      { name: 'sla-business-hours', description: 'Freshdesk SLA policies and business-hours calendars: policy and calendar fields, per-priority respond_within / resolve_within targets, how the business-hours vs 24x7 clock computes a ticket\'s fr_due_by and due_by, and breach / at-risk detection through the Freshdesk REST API v2.' },
      { name: 'ticketing', description: 'Freshdesk ticket operations: list, get, search, create, update, reply, notes, and conversation threads.' },
      { name: 'api-patterns', description: 'Freshdesk MCP tool surface and REST API v2 fundamentals: header-based authentication via `X-Freshdesk-Domain` and `X-Freshdesk-Api-Key` (which the MCP server translates into upstream HTTP Basic `apikey:X` auth), the `/api/v2` base URL, `page`/`per_page` pagination and the `link` header, per-minute rate limits, the search query language and its 300-result cap, and the status/priority/source integer encodings.' }
    ],
    agents: [
      { name: 'freshdesk-triage', description: 'Use this agent when an MSP dispatcher, service coordinator, or help-desk lead needs to sweep the Freshdesk open ticket queue, summarize what is waiting, and recommend routing and priority.' }
    ],
    commands: [
      { name: '/search-tickets', description: 'Search Freshdesk tickets with the Freshdesk query language — filter by status, priority, agent, group, type, tag, and date — and return a ranked, readable result list' },
      { name: '/ticket-summary', description: 'Summarize a single Freshdesk ticket and its full conversation thread — the request, what has happened, current SLA state, and the recommended next action' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'freshdesk/freshdesk',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'inforcer',
    name: 'Inforcer',
    vendor: 'Inforcer',
    description: 'Inforcer - Microsoft 365 security baseline governance for MSPs: managed tenants, baseline templates, alignment/drift, secure scores, identity inventory, audit events, and assessment runs (read-only, plus one assessment-run action)',
    category: 'security',
    maturity: 'production',
    features: [
      'Assessments',
      'Audit Events',
      'Baseline Alignment',
      'Compliance Reporting',
      'Identity Governance',
      'Tenant Management'
    ],
    skills: [
      { name: 'assessments', description: 'Inforcer assessments: listing a tenant\'s assessments (read-only) and triggering an assessment run — the one mutating action in the entire Inforcer surface.' },
      { name: 'audit-events', description: 'Inforcer\'s read-only record of changes and activity: searching and filtering auditEvents by type and date window (the search is account-wide — there is no tenant filter), enumerating the event-type catalog to build valid filters, and the continuationToken paging audit searches require.' },
      { name: 'baseline-alignment', description: 'Inforcer\'s core drift-detection surface: baseline templates, tenant alignment scores, alignment details (the per-policy breakdown of a tenant against its assigned baseline), and reading deployed tenant policy state.' },
      { name: 'compliance-reporting', description: 'Inforcer compliance and posture reporting: per-tenant Microsoft 365 secure scores, combining them with alignment scores, and the alignedThreshold / semiAlignedThreshold settings that classify each tenant or policy as aligned, semi-aligned, or drifted.' },
      { name: 'identity-governance', description: 'Inforcer\'s read-only identity inventory for a managed Microsoft 365 tenant: users, groups, and role assignments.' },
      { name: 'tenant-management', description: 'Inforcer\'s managed Microsoft 365 tenant list and the resolution step that turns a friendly name, DNS domain, or Azure AD GUID into the integer Client Tenant ID.' },
      { name: 'api-patterns', description: 'Inforcer MCP fundamentals: the gateway X-Inforcer-Region / X-Inforcer-Api-Key headers, the region-based base URL and upstream Inf-Api-Key header, the /beta/ route prefix, the {success,message,errors,data} response envelope, continuationToken pagination, and the integer Client Tenant ID vs Azure AD GUID gotcha.' }
    ],
    agents: [
      { name: 'inforcer-drift-reporter', description: 'Use this agent when an MSP security lead, vCISO, or service manager needs to sweep the managed Microsoft 365 portfolio for baseline drift and posture using Inforcer — pulling alignment scores, per-policy drift detail, and secure scores across tenants and summarizing them into a prioritized picture.' }
    ],
    commands: [
      { name: '/drift-report', description: 'Portfolio-wide Inforcer baseline drift report — every managed tenant\'s alignment vs its assigned baseline, classified aligned / semi-aligned / drifted and sorted drifted-first, with secure score' },
      { name: '/tenant-posture', description: 'Single-tenant Microsoft 365 posture snapshot from Inforcer — secure score plus alignment score, band, and the per-policy drift detail against the tenant\'s assigned baseline' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'inforcer/inforcer',
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
      { name: 'alerts', description: 'ConnectWise Automate alert management: alert sources (monitors, scripts, events), severity levels, lifecycle states, acknowledgment, resolution, history tracking, and PSA ticket creation from alerts.' },
      { name: 'clients', description: 'ConnectWise Automate client management: client CRUD, client identifiers, locations, client hierarchy, groups, extra data fields (EDFs), and client-level settings.' },
      { name: 'computers', description: 'ConnectWise Automate computer/endpoint management: computer identifiers (ComputerID, Name, ComputerGUID, MAC), status values, OS types, hardware/software inventory, disk, patch, and antivirus status, plus remote management operations.' },
      { name: 'monitors', description: 'ConnectWise Automate monitor management: monitor types (internal, remote, agent, SNMP, script), categories, threshold configuration, templates, assignment methods (computer/group/client), and status evaluation.' },
      { name: 'scripts', description: 'ConnectWise Automate script management: script types (PowerShell, batch, VBScript, Shell), script folders, script execution on computers, parameter handling and validation, execution status polling, and result/history retrieval.' },
      { name: 'api-patterns', description: 'ConnectWise Automate REST API fundamentals: integrator and user+2FA authentication, token lifecycle, pagination, OData-style filtering, rate limiting, and error handling patterns for API integration.' }
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
    id: 'connectwise-cpq',
    name: 'ConnectWise CPQ',
    vendor: 'ConnectWise',
    description: 'ConnectWise CPQ (Sell/Quosal) - quotes, line items, templates, quote customers, payment terms',
    category: 'sales',
    maturity: 'beta',
    features: [
      'Quote Items',
      'Quote Generation'
    ],
    skills: [
      { name: 'quote-items', description: 'ConnectWise CPQ line items and the tabs that hold them: searching items by quote or tab, the tab requirement on every create, the pricing and margin fields, bundle and optional-line flags, recurring-revenue and PSA mapping fields, JSON Patch updates, and why there is no product catalog to search.' },
      { name: 'quotes', description: 'The ConnectWise CPQ quote lifecycle over the real tool surface: searching quotes, the GUID-vs-quoteNumber dual addressing, versions, creating quotes by copying a template (the API\'s only create path), patching quote fields, the per-quote customer records and payment/financing terms, tabs as the section structure, and the deletes that cascade.' },
      { name: 'api-patterns', description: 'ConnectWise CPQ (Sell/Quosal) API fundamentals: three-part Basic auth built from an access key plus an API key pair, the versioned content type, the flat 25-tool `cpq_*` surface, Manage-style `conditions` filtering, `includeFields` trimming of the 200+ property views, page/pageSize paging over bare arrays, RFC 6902 JSON Patch updates, and the endpoints CPQ deliberately does not expose.' }
    ],
    agents: [],
    commands: [
      { name: '/create-quote', description: 'Create a ConnectWise CPQ quote by copying a template or an existing quote' },
      { name: '/get-quote', description: 'Get a ConnectWise CPQ quote with its tabs, line items, customers, and terms' },
      { name: '/list-templates', description: 'List ConnectWise CPQ quote templates available to copy' },
      { name: '/search-quotes', description: 'Search ConnectWise CPQ quotes by account, status, or date range' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'connectwise/cpq',
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
      { name: 'companies', description: 'ConnectWise PSA company/account management: company types, statuses, sites/locations, custom fields, and company relationships.' },
      { name: 'contacts', description: 'ConnectWise PSA contact management: contact records, contact types, communication items (email, phone), portal access, and relationships to companies.' },
      { name: 'product-catalog', description: 'ConnectWise PSA product catalog: catalog items (SKUs), categories, subcategories, manufacturers, and their use on quotes, opportunities, agreements, and tickets.' },
      { name: 'projects', description: 'ConnectWise PSA project management: project lifecycle and status/type values, phases, templates, resource/team allocation, budgeting, billing methods, and project tickets.' },
      { name: 'tickets', description: 'ConnectWise PSA ticket management: ticket fields, service boards, statuses, priorities, SLAs, ticket notes, and workflow automation.' },
      { name: 'time-entries', description: 'ConnectWise PSA time entry management: charge-to types (tickets, projects, charge codes), billable vs non-billable time, work types and work roles, time sheets, and the time entry approval workflow.' },
      { name: 'api-patterns', description: 'ConnectWise PSA REST API fundamentals: public/private key + clientId authentication, page/pageSize pagination, the conditions query syntax, rate limiting (60/min), and error-response handling.' }
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
      { name: 'alerts', description: 'Datto RMM alert structure, priorities, and the 25+ alert context types (antivirus_ctx, eventlog_ctx, perf_disk_usage_ctx, ransomware_ctx, and more), each with its own type-specific fields.' },
      { name: 'audit', description: 'Datto RMM audit data structure covering hardware inventory (CPU, RAM, disks, motherboard, BIOS), software inventory, network interfaces, and ESXi/printer audits, along with audit collection cadence and data freshness semantics.' },
      { name: 'devices', description: 'Datto RMM device management: identifiers (UID, hostname, MAC), device types and statuses, user-defined fields (UDF1-30), warranty data, and device lookup/update/delete operations.' },
      { name: 'jobs', description: 'Datto RMM job execution: quick jobs vs. scheduled vs. policy jobs, the job status lifecycle, component scripts and their variables, and stdout/stderr/exit-code result handling.' },
      { name: 'sites', description: 'Datto RMM site management: site hierarchy and identifiers, proxy and patch-window settings, site-scoped device/alert queries, and create/update/delete operations for client locations.' },
      { name: 'variables', description: 'Datto RMM account-level and site-level variables: scoping and inheritance (site overrides account), naming conventions and reserved prefixes, CRUD operations, and referencing variables from component scripts.' },
      { name: 'api-patterns', description: 'Datto RMM REST API v2 fundamentals: OAuth 2.0 client-credentials-style authentication, the 6 regional platforms (Pinotage, Merlot, Concord, Vidal, Zinfandel, Syrah), token lifecycle, cursor-based pagination, rate limiting, Unix-millisecond timestamps, and error handling.' }
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
      'Network',
      'Power'
    ],
    skills: [
      { name: 'agents', description: 'Domotz agents (collectors/probes) as the per-site entry point for all device and network operations: agent types, lifecycle, ONLINE/OFFLINE status, the list/get tools and their license and last-seen fields, and fleet health, site inventory, and capacity-planning workflows.' },
      { name: 'alerts', description: 'Domotz alerting configuration: what an alert profile defines, the two tools that read profiles and their per-device bindings, monitoring coverage audits, and the important limit — this server exposes alert configuration only, never fired alerts.' },
      { name: 'devices', description: 'Domotz device inventory: how agents discover and classify devices, the identification attributes (IP, MAC, hostname, display name, vendor), the ONLINE/OFFLINE/UNKNOWN status model, the five device tools — list, get, uptime, history, inventory metadata — and why device lookup is a client-side match rather than a server-side search.' },
      { name: 'network', description: 'Domotz network observation: the collector\'s topology graph, its own interfaces, detected IP conflicts, and the two SNMP surfaces — polled variables and custom sensors — with their history endpoints and the tools and error modes for each.' },
      { name: 'power', description: 'Domotz PDU and smart-outlet control: listing outlets and their power state, and the one non-GET tool the Domotz server exposes — switching an outlet on, off, or cycling it.' },
      { name: 'api-patterns', description: 'Domotz API and MCP fundamentals: X-Api-Key header authentication, the region-selected base URL (us-east-1 / eu-central-1), the full 21-tool MCP catalog by domain, the agent-scoped call shape, why there are no pagination arguments, rate limiting, and HTTP error codes.' }
    ],
    agents: [],
    commands: [
      { name: '/device-inventory', description: 'List all devices at a Domotz-monitored site' },
      { name: '/device-lookup', description: 'Find a Domotz device by name, IP address, or MAC address' },
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
      { name: 'agents', description: 'HaloPSA agents (technicians) and teams as a read-only MCP surface: listing technicians, retrieving agent detail, listing team structures, and the inactive-agent filter.' },
      { name: 'assets', description: 'HaloPSA asset/CMDB data model: asset (configuration item) fields, device types and statuses, links to clients, sites, users, tickets, and contracts, plus parent-child asset relationships.' },
      { name: 'clients', description: 'HaloPSA CRM data model: client records and their billing/contact fields, sites (locations), contacts (Users), client classification, and parent-child client hierarchy.' },
      { name: 'contracts', description: 'HaloPSA contract management: contract types (recurring, prepaid hours, ad-hoc, project, warranty), statuses, billing and coverage fields, recurring invoice items, prepaid hour balances and deduction, SLA association, renewal and billing-reconciliation workflows.' },
      { name: 'invoices', description: 'HaloPSA invoices as a read-only MCP surface: listing by client or date range, filtering by payment and send status, retrieving line-item detail on a single invoice, and the reporting and reconciliation workflows built on them.' },
      { name: 'tickets', description: 'HaloPSA service desk tickets: ticket fields, statuses, priorities and ticket types, actions (notes and time entries), attachments, SLA behaviour, and the creation and status-transition workflows with their validation rules.' },
      { name: 'api-patterns', description: 'HaloPSA REST API fundamentals: OAuth 2.0 client-credentials authentication, authorization vs. resource server URLs, the tenant query parameter, filtering and pagination conventions, array-wrapped POST bodies, rate-limit behavior, scopes, and error codes.' }
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
      { name: 'articles', description: 'Hudu knowledge base articles: HTML content format, company-scoped vs global articles, article folders (including nesting), drafts vs published, the /api/v1/articles endpoint surface, and search, templating, and documentation-health patterns.' },
      { name: 'assets', description: 'Hudu assets and asset layouts: the layout-as-template model, custom field types, the `custom_fields` key/value array shape, archiving vs deletion, company scoping, and filter patterns across /api/v1/assets and /api/v1/asset_layouts.' },
      { name: 'companies', description: 'Hudu companies (clients/organizations): company field reference, parent/child hierarchy, PSA integration matching via id_in_integration, the /api/v1/companies CRUD plus archive/unarchive endpoints, onboarding and offboarding workflows, and how companies scope assets, passwords, articles, and websites.' },
      { name: 'passwords', description: 'Hudu secure credential storage: the /api/v1/asset_passwords endpoint (the UI calls these "Passwords"), company scoping and password folders, TOTP secrets, per-API-key password permissions, activity-log auditing, rotation workflows, and output-safety rules for handling plaintext credential values.' },
      { name: 'websites', description: 'Hudu website records: CRUD via /api/v1/websites, monitoring and pause/disable fields, SSL/TLS certificate tracking, email security status (DMARC, DKIM, SPF), DNS record fields, company linkage, and website validation errors.' },
      { name: 'api-patterns', description: 'Hudu REST API fundamentals: x-api-key authentication, base URL and /api/v1/ structure, granular API key permission levels, UI-vs-API resource naming differences, query-parameter filtering, page-based pagination, the 300 req/min rate limit, and HTTP status/error semantics.' }
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
      { name: 'agents', description: 'Huntress endpoint agents: the agent lifecycle, organization and platform filters, health signals such as `last_seen_at` and version, fleet-audit workflows, and the errors returned for missing or empty agent results.' },
      { name: 'billing', description: 'Huntress billing and summary reports: what each report type contains, the list/get tools for both, and the monthly reconciliation, QBR security summary, and cost-analysis workflows an MSP builds from them.' },
      { name: 'escalations', description: 'Huntress SOC escalations: how an escalation differs from an incident, escalation priority levels, the list/get/resolve tools, escalation-to-incident correlation, and the already-resolved and not-found error cases.' },
      { name: 'incidents', description: 'Huntress incidents and the remediation lifecycle: querying incidents by organization and status, SOC-recommended remediation details, individual and bulk approve/reject, remediation execution status, and the ordering constraint that incidents resolve only after all remediations are processed.' },
      { name: 'organizations', description: 'Huntress organizations as the multi-tenant boundary: org structure, the organization key used for agent deployment, full CRUD operations, client onboarding and offboarding workflows, and the duplicate-key and active-agent deletion errors.' },
      { name: 'signals', description: 'Huntress security signals: how signals differ from incidents, the signal types, listing and filtering by organization, and the threat-hunting and pattern-analysis workflows built on signal data.' },
      { name: 'api-patterns', description: 'Huntress MCP fundamentals: HTTP Basic Auth via API key/secret headers, the full MCP tool catalog, token-based pagination, the 60 req/min rate limit, and the common HTTP error codes with their causes.' }
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
      { name: 'configurations', description: 'IT Glue configurations (assets) — servers, workstations, network devices, and other infrastructure: configuration types and statuses, network interfaces, related items, warranty/lifecycle fields, and PSA/RMM integration fields.' },
      { name: 'contacts', description: 'IT Glue contacts — the people (clients, vendors, partners) associated with an organization.' },
      { name: 'documents', description: 'IT Glue documents: rich-HTML documentation records scoped to an organization, including document folders, multi-section content via the Document Sections API, embedded passwords/configurations/images, and related-item links to other IT Glue resources.' },
      { name: 'flexible-assets', description: 'IT Glue flexible assets: custom, instance-specific asset types with defined field schemas (text, tag, password, upload, etc.), traits-based instances, and tag fields that cross-link to configurations, contacts, and other IT Glue resources for structured, filterable documentation.' },
      { name: 'organizations', description: 'IT Glue organizations (companies/clients): the foundational entity all documentation, configurations, contacts, passwords, and flexible assets attach to.' },
      { name: 'passwords', description: 'IT Glue passwords: secure, organization-scoped credential storage with categories, folders, restricted-access flags, OTP secrets, and embedding into documents and flexible assets.' },
      { name: 'api-patterns', description: 'IT Glue REST API fundamentals: JSON:API request/response structure, x-api-key authentication across regional endpoints (US/EU/AU), filter and sort syntax, pagination, sideloading with includes, rate limits, CRUD operations, and error handling.' }
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
      { name: 'phishing', description: 'KnowBe4 phishing simulations: campaign creation and lifecycle, security test management, recipient interaction tracking (sent, opened, clicked, reported), phish-prone percentage calculation, template selection, landing pages, and click tracking.' },
      { name: 'reporting', description: 'KnowBe4 security awareness reporting: phishing summary statistics, training completion rates, risk score overviews, trend analysis, organizational benchmarks, and executive dashboards, including how to interpret metrics and communicate posture to stakeholders.' },
      { name: 'training', description: 'KnowBe4 training campaign management: campaign lifecycle, enrollment workflows, completion tracking, training module and content library browsing, store purchases, and compliance deadline monitoring.' },
      { name: 'users', description: 'KnowBe4 user and group management: user lifecycle and status, group creation and membership, risk scores and risk score history, user event tracking, provisioning, and group-based targeting for campaigns.' },
      { name: 'api-patterns', description: 'KnowBe4 REST API fundamentals: Bearer token authentication, multi-region base URLs (US, EU, CA, UK, DE), pagination, rate limiting, error handling, and response formats.' }
    ],
    agents: [
      { name: 'security-awareness-analyst', description: 'Use this agent when analyzing phishing simulation results, identifying high-risk users, tracking training completion, or recommending targeted security awareness programs for MSP clients.' },
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
      { name: 'detections', description: 'Liongard\'s change and anomaly detection layer: detections generated by inspection-to-inspection comparison, detection types/severities/status lifecycle, configurable alert rules and notification channels, custom metrics with JMESPath expressions and threshold evaluation, and the platform timeline audit trail.' },
      { name: 'environments', description: 'Liongard environments — the per-customer containers that own all agents, launchpoints, systems, detections, and metrics.' },
      { name: 'inspections', description: 'Liongard\'s inspection pipeline: inspector templates and their credential and agent requirements, launchpoint configuration that binds inspector + environment + agent + credentials + cron schedule, on-demand inspection runs and their status lifecycle, and the failure modes behind failed runs.' },
      { name: 'overview', description: 'Liongard platform fundamentals: the entity model (environments, agents, inspectors, launchpoints, systems, detections, metrics, timeline, dataprints, asset inventory), X-ROAR-API-KEY authentication against instance-scoped URLs, the split between the v1 and v2 APIs, and the shared pagination, filtering, and rate-limit conventions.' },
      { name: 'systems', description: 'Liongard systems — the assets discovered by inspections — plus their detail data (raw configuration JSON with historical snapshots), dataprint extraction via JMESPath expressions, and the v2 Asset Inventory identity and device profiles that correlate one entity across multiple inspectors.' }
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
      { name: 'calendar', description: 'Exchange Online calendars through Microsoft Graph: event retrieval and date-range queries, free/busy and availability lookup, meeting and Teams-meeting creation, room and equipment resource bookings, calendar permissions, and the Graph scopes and error causes involved.' },
      { name: 'files', description: 'OneDrive personal storage and SharePoint document libraries, both reached through the shared Microsoft Graph `/drives` endpoint: drive and item addressing, sharing permissions, storage quotas, file search, and the offboarding file-transfer workflow.' },
      { name: 'licensing', description: 'The M365 subscription → SKU → service-plan model, seat availability versus consumption, assigning and removing licenses through Graph, the audit workflow for finding unused or misallocated seats, common SKU GUIDs, and licensing error causes.' },
      { name: 'mailboxes', description: 'Exchange Online mailboxes through Microsoft Graph: the four mailbox types and how they differ, message listing and search, inbox rules, out-of-office and forwarding, mailbox size and quota, shared-mailbox access management, and mail flow diagnostics.' },
      { name: 'security', description: 'The M365 tenant security checks that distinguish a secure tenant from a vulnerable one: per-user authentication-method inspection for real MFA enrollment, sign-in risk and risky users, suspicious inbox rules, legacy authentication exposure, conditional access coverage, Secure Score, and the indicator set for a compromised account.' },
      { name: 'teams', description: 'Microsoft Teams through Microsoft Graph: the Team/Channel/Member/Meeting/Tab object model, team and channel enumeration, membership and ownership changes, online meetings, usage reporting, and the causes behind Teams access failures.' },
      { name: 'users', description: 'The Entra ID user object as M365\'s central identity: key properties and their MSP relevance, account status values, the license assignment model, Graph patterns for listing/searching/creating/disabling users, MFA status checking, and the onboarding and offboarding sequences.' },
      { name: 'api-patterns', description: 'Microsoft Graph fundamentals shared by every M365 skill: Entra token scopes and the per-request Bearer model, OData query operators and filter syntax, @odata.nextLink pagination, delta queries for incremental sync, 429 throttling and retry behavior, JSON batching, and the common Graph error codes.' }
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
      { name: 'alerts', description: 'NinjaOne alerts and the conditions behind them: retrieving device alerts, dismissing individual alerts and bulk resets, alert summaries, severity and priority levels, common hardware/service/security/connectivity alert types and thresholds, alert webhooks, and triage workflows.' },
      { name: 'devices', description: 'NinjaOne device management: device details and updates, Windows service control, inventory, maintenance windows, reboot modes, and health-check workflows for Windows, Mac, and Linux endpoints running the NinjaRMM agent.' },
      { name: 'organizations', description: 'NinjaOne organizations — the top-level container for devices, representing MSP clients: creation and listing, locations, node approval modes, policy mappings and node role IDs, custom fields, tags, cursor pagination, and error codes.' },
      { name: 'tickets', description: 'NinjaOne\'s built-in ticketing system, which integrates with device monitoring: ticket creation and updates, core/status/metadata fields, status and priority values with SLA targets, log entry types, device linkage, tagging patterns, and error codes.' },
      { name: 'api-patterns', description: 'NinjaOne Public API fundamentals shared by every other NinjaOne skill: regional base URLs, OAuth 2.0 client-credentials auth and scopes, request shapes, cursor-based pagination, rate-limit headers and 429 handling, HTTP status codes and error response format, and webhook configuration.' }
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
      { name: 'alerts', description: 'PagerDuty alerts: the alert-vs-incident model, alert statuses, grouping modes, event rules for routing and suppression, dedup_key deduplication, and the Events API v2 trigger/acknowledge/resolve payloads.' },
      { name: 'analytics', description: 'PagerDuty Analytics: MTTA/MTTR/MTTE/MTTS definitions, incident and interruption counts, aggregation levels (account, service, team, escalation policy), time-range constraints, and benchmark tables for interpreting the numbers.' },
      { name: 'incidents', description: 'PagerDuty incident lifecycle (triggered/acknowledged/resolved), urgency vs. priority, alerts-to-incident grouping, the 14 incident MCP tools, incident fields, notes, log entries, past-incident similarity search, merge and snooze semantics, and cross-vendor PSA ticket correlation for MSPs.' },
      { name: 'oncall', description: 'PagerDuty on-call model: schedules with rotation layers, restrictions, the computed final schedule, and overrides; escalation policy tiers and timeouts; on-call entry fields; and the schedule, escalation policy, and team MCP tools.' },
      { name: 'services', description: 'PagerDuty service catalog: service statuses, integrations and integration keys as event sources, alert grouping modes, upstream/downstream service dependencies, and maintenance windows.' },
      { name: 'api-patterns', description: 'PagerDuty API and hosted MCP fundamentals: US/EU MCP endpoints, the `Token token=` auth header and token types, the complete 66-tool reference across 13 categories (incidents, on-call, schedules, escalation policies, services, event orchestrations, status pages, teams, users, and more), offset pagination, common filter parameters, rate limits, and error codes.' }
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
      { name: 'documents', description: 'PandaDoc document lifecycle end to end: creating documents from templates, sending for e-signature, status checks and PDF downloads, the full document status enum, MSP document types, content tokens, pricing-table structure, document and recipient fields, and status-transition errors.' },
      { name: 'proposals', description: 'MSP proposal workflows in PandaDoc: proposal types and typical values (MSA, SOW, hardware quote, project proposal, security assessment, cloud migration), the standard MSP content-token set, managed-services and hardware pricing-table structures, mapping document statuses to sales-pipeline stages, and pipeline and stale-proposal tracking.' },
      { name: 'recipients', description: 'PandaDoc recipients and e-signature mechanics: recipient roles (signer, approver, viewer, CC), signing-order behavior, multi-party MSP signing scenarios, completion tracking via `has_completed`, recipient fields, and the document statuses that restrict adding or changing recipients.' },
      { name: 'templates', description: 'PandaDoc template library and structure: layout, content blocks, tokens, interactive fields, signature fields, pricing tables, and recipient roles, plus the MSP template set (MSAs, SOWs, proposals, quotes, NDAs, change orders, QBRs), template versioning, tags, and the template field reference.' },
      { name: 'api-patterns', description: 'PandaDoc hosted MCP server and API fundamentals: API-key authentication and which operations work without a key, the complete MCP tool catalog (documents, templates, recipients, docs search, code samples), page-based pagination, document and template filters, rate limits per plan, and error codes.' }
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
      { name: 'visitor-intelligence', description: 'Acting on Warmly\'s identified website visitors and account-level engagement: choosing between list_warm_visitors, list_warm_accounts, and get_credits_remaining; ICP filtering, engagement-depth scoring, CRM-intersection routing, credit-burn checks, MSP-specific outreach plays, and the limits of visitor identification as an intent signal.' },
      { name: 'api-patterns', description: 'Warmly\'s remote MCP server: WorkOS AuthKit OAuth 2.0 + PKCE authentication, RFC 9728 protected-resource metadata, multi-organization scoping, the stateful Streamable HTTP session model, the three read-only visitor-intelligence tools and their fields, credit semantics, error codes, and rate-limit guidance.' }
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
      { name: 'companies', description: 'Pax8 companies (MSP clients): company records and fields, contact management, billing and order-approval settings, and cross-referencing companies with subscriptions and orders.' },
      { name: 'invoices', description: 'Pax8 invoices and billing: invoice retrieval, invoice line items, usage-based billing summaries, the MSP billing cycle, and reconciling Pax8 costs against client charges.' },
      { name: 'orders', description: 'Pax8 orders: order retrieval, order line items, provisioning status and timelines, billing terms, and the order-to-subscription workflow.' },
      { name: 'products', description: 'The Pax8 product catalog: cloud software SKUs, vendors, pricing tiers and margins, and provisioning details across Microsoft 365, Azure, security tools, and backup products.' },
      { name: 'subscriptions', description: 'Pax8 subscriptions: license and seat counts, the full subscription lifecycle and its states, change history, filtering by company or product, and quantity management for license optimization.' },
      { name: 'api-patterns', description: 'Pax8 MCP fundamentals: the official hosted MCP server connection, all 15 Pax8 MCP tools and their parameters, pagination, sorting, filtering, response shapes, rate limiting, and error handling.' }
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
      { name: 'forensics', description: 'Proofpoint Forensics and Threat Response (TRAP) fundamentals: auto-pull and search-and-destroy remediation actions, evidence collection, message trace, and post-delivery incident response workflows for email-borne threats.' },
      { name: 'people', description: 'Proofpoint People-Centric Security fundamentals: Very Attacked People (VAP) reports, attack index scoring, click susceptibility, top clickers, and user risk categorization for targeting security controls and training.' },
      { name: 'quarantine', description: 'Proofpoint quarantine management fundamentals: quarantine reasons and folders, message states, search/filter parameters, and release/delete workflows for admin and end-user quarantine.' },
      { name: 'tap', description: 'Proofpoint Targeted Attack Protection (TAP) fundamentals: threat events across URL, attachment, and message-level vectors, click tracking, message disposition, SIEM integration feeds, and campaign correlation.' },
      { name: 'threat-intel', description: 'Proofpoint Threat Intelligence fundamentals: campaign tracking, threat families and actors, indicators of compromise (IOCs), and how campaign/IOC data enriches individual TAP threat events.' },
      { name: 'url-defense', description: 'Proofpoint URL Defense fundamentals: URL rewriting (v2/v3 formats), click-time analysis and verdicts, and manual/API decoding of rewritten URLs back to their originals.' },
      { name: 'api-patterns', description: 'Proofpoint API fundamentals: HTTP Basic Auth with service principal and secret, base URLs and versioning across TAP SIEM, People, Quarantine, Forensics, and URL Defense APIs, rate limits, pagination patterns, and error handling.' }
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
      { name: 'customers', description: 'QuickBooks Online Customer entity: the parent/sub-customer (job) hierarchy, contact, address, billing and hierarchy fields, payment terms, balance and BalanceWithJobs tracking, sparse updates, deactivation, query syntax, error codes, and PSA cross-referencing patterns for MSP client records.' },
      { name: 'expenses', description: 'QuickBooks Online expense entities: Purchase (check, cash, credit card), Bill for accounts payable, BillPayment, and Vendor.' },
      { name: 'invoices', description: 'QuickBooks Online Invoice entity: invoice lifecycle and statuses, line item detail types, service items, payment terms, email delivery and PDF retrieval, invoice numbering, void vs delete semantics, query syntax, error codes, and MSP billing patterns such as monthly managed services, project, and time-and-materials invoicing.' },
      { name: 'payments', description: 'QuickBooks Online payment handling: recording customer payments and applying them to invoices, partial and multi-invoice application, unapplied amounts and overpayments, credit memos and refund receipts, payment methods, deposit accounts, voiding, and reconciliation.' },
      { name: 'reports', description: 'QuickBooks Online financial reporting: the report catalog (Profit & Loss, Balance Sheet, A/R and A/P Aging, General Ledger, Customer Sales, Cash Flow, Tax Summary), report parameters, date macros, column customization, the nested row response structure, and MSP analysis patterns like client profitability and aged receivables for collections.' },
      { name: 'api-patterns', description: 'QuickBooks Online API fundamentals: OAuth2 authentication and token lifecycle, REST structure and base URLs, the Intuit query language, pagination, minor version headers, SyncToken optimistic locking, rate limits, webhooks, and the Fault error object format.' }
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
      { name: 'accounts', description: 'RocketCyber\'s provider/customer account hierarchy: sub-account navigation, account CRUD operations, account settings, security policy configuration, and multi-tenant MSP patterns.' },
      { name: 'agents', description: 'RocketCyber agent (RocketAgent) deployment, communication status, health monitoring, and troubleshooting: agent installation, online/offline status, agent-to-account mapping, and platform support.' },
      { name: 'apps', description: 'RocketCyber application inventory: detecting, categorizing, and monitoring applications across managed endpoints, including approved-vs-unapproved software, app-level threat detection, and software compliance reporting.' },
      { name: 'incidents', description: 'RocketCyber security incident lifecycle: severity levels, verdicts (Malicious/Suspicious/Benign), status transitions, SOC analyst triage patterns, and cross-vendor PSA ticket correlation.' },
      { name: 'api-patterns', description: 'RocketCyber REST API v3 fundamentals: Bearer token authentication, regional base URL selection, pagination, rate limiting, error handling, and account hierarchy navigation.' }
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
      { name: 'alerts', description: 'Rootly\'s alerting layer between monitoring tools and incident management: alert sources and integrations (Datadog, PagerDuty, New Relic, Grafana), routing rules, escalation policies and their acknowledgement windows, suppression, and the conditions under which an alert auto-creates an incident.' },
      { name: 'incidents', description: 'Incidents, Rootly\'s primary resource: the incident lifecycle and status transitions, severity levels, the incident field reference, AI-assisted analysis via find_related_incidents and suggest_solutions, action items, alert attachment, and cross-vendor PSA ticket correlation.' },
      { name: 'oncall', description: 'Rootly on-call visibility built on the get_oncall_handoff_summary, get_oncall_shift_metrics, get_shift_incidents, and check_oncall_health_risk tools: schedule and rotation coverage, structured shift handoffs, per-shift incident scoping, shift metric fields, and the burnout risk signals.' },
      { name: 'postmortems', description: 'Rootly postmortems as structured post-incident retrospectives: the postmortem lifecycle, templates and automatic timeline import, action item creation and tracking through to project-management tools, and the blameless review practices Rootly\'s model assumes.' },
      { name: 'services', description: 'The Rootly service catalog: tier classification by business criticality, the ownership attributes attached to each service (team, Slack channel, escalation policy, runbooks), upstream/downstream dependency modeling for blast-radius analysis, service CRUD, and how services link back to incidents and alerts.' },
      { name: 'workflows', description: 'Rootly\'s incident-response automation model: the trigger / condition / action structure, the full catalog of trigger, action, and condition types, workflow CRUD and enable/disable, and the failure modes behind stale, over-firing, or circularly chained workflows.' },
      { name: 'api-patterns', description: 'The Rootly hosted MCP server and the JSON:API REST surface behind it: Global vs.' }
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
      { name: 'assets', description: 'The runZero asset inventory: searching and browsing assets, asset attributes, OS fingerprinting, hardware details, and network interfaces.' },
      { name: 'services', description: 'runZero discovered services: listing services, filtering by port or protocol, identifying vulnerabilities, and auditing exposed services across sites.' },
      { name: 'sites', description: 'runZero sites: creating and managing organization sites, defining scan scope and exclusions, deploying explorers, and organizing assets by location or client.' },
      { name: 'tasks', description: 'runZero scan tasks: creating scans, scheduling recurring scans, managing explorers, configuring scan parameters, and reviewing scan results.' },
      { name: 'wireless', description: 'runZero wireless network discovery: discovered wireless networks, rogue access point identification, wireless security configuration analysis, and SSID auditing.' },
      { name: 'api-patterns', description: 'runZero API fundamentals: the available MCP tools, Bearer-token authentication, the Export API for bulk retrieval, pagination, rate-limit headers, error codes, and the runZero query language.' }
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
      { name: 'companies-contacts', description: 'Salesbuildr companies and contacts: company search, contact filtering by company, and contact creation with its required fields.' },
      { name: 'opportunities', description: 'Salesbuildr opportunities: pipeline search, opportunity creation, stage updates, and deal values, plus how opportunities link companies and contacts to potential revenue.' },
      { name: 'products', description: 'Salesbuildr product catalog: product search, pricing lookup, category browsing, and how products become quote line items.' },
      { name: 'quotes', description: 'Salesbuildr quotes: quote creation with product line items, quote search, and retrieving quote details, plus how quotes link to companies, contacts, and opportunities.' },
      { name: 'api-patterns', description: 'Salesbuildr API fundamentals: api-key header authentication, offset-based from/size pagination, error handling, and the 500 requests per 10 minutes rate limit.' }
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
      { name: 'alerts', description: 'SentinelOne\'s read-only unified alert surface: the list/search/get alert tools plus notes and history, severity levels, status values, view types, GraphQL filter syntax, and cursor-based pagination.' },
      { name: 'inventory', description: 'SentinelOne\'s unified asset inventory across four surface types — agent-managed endpoints, AWS/Azure/GCP cloud resources, AD/Entra identities, and Ranger-discovered network devices.' },
      { name: 'misconfigurations', description: 'Cloud security posture findings from SentinelOne\'s XSPM module across AWS, Azure, GCP, Kubernetes, identity providers, and infrastructure-as-code.' },
      { name: 'purple-ai', description: 'The `purple_ai` tool — SentinelOne\'s natural language investigation assistant over the full Singularity telemetry model.' },
      { name: 'threat-hunting', description: 'PowerQuery against the Singularity Data Lake: the Scalyr-based pipeline syntax (distinct from SPL, SQL, KQL, and Elasticsearch DSL), the powerquery, get_timestamp_range, and iso_to_unix_timestamp tools, time-range and row-limit handling, common hunting scenarios, and the Purple AI generation path.' },
      { name: 'vulnerabilities', description: 'CVE tracking through SentinelOne\'s XSPM module: the read-only vulnerability tools, EPSS scores and exploit-maturity values and why they outrank raw CVSS severity for prioritization, status values and their transitions, the vulnerability field reference, and patch-prioritization and reporting workflows.' },
      { name: 'api-patterns', description: 'The SentinelOne Purple MCP server and the APIs behind it: uvx installation and transport modes, Service User token levels, the 23 read-only tools organized by domain, and the dual GraphQL (cursor pagination) / REST (offset pagination) architecture with its differing filter syntaxes, rate limits, and error causes.' }
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
      { name: 'billing', description: 'Sherweb distributor billing: explicit billing date ranges, Setup/Recurring/Usage charge types, billing cycles (OneTime, Monthly, Yearly), the pricing breakdown (listPrice, netPrice, prorated, subTotal), promotional and performance deductions, fees, taxes, and MSP margin calculation.' },
      { name: 'customers', description: 'Sherweb customer records: the distributor > service provider > customer hierarchy and its API scoping consequences, customer lifecycle stages, core address and contact fields, accounts-receivable data with aging buckets, and cross-referencing customers with PSA, subscription, and billing data.' },
      { name: 'subscriptions', description: 'Sherweb subscription management: the subscription lifecycle and its states, seat/license quantity rules (absolute values, minimums, proration, commitment restrictions), the quantity-change workflow, subscription and change-response fields, and state-transition errors.' },
      { name: 'api-patterns', description: 'Sherweb Partner API fundamentals: OAuth 2.0 client-credentials auth, token caching, subscription-key header, scopes and base URLs, endpoint and MCP tool catalog, page-based pagination, Accept-Language localization, rate limits, and error codes.' }
    ],
    agents: [
      { name: 'billing-reconciler', description: 'Use this agent when an MSP needs to reconcile Sherweb distributor billing — reviewing payable charges for a date range, drilling into individual charge details, separating Setup/Recurring/Usage charge types, verifying that billed quantities match active subscriptions, and calculating MSP margin between Sherweb cost and customer price.' },
      { name: 'customer-account-auditor', description: 'Use this agent when an MSP needs a portfolio-wide health audit of its Sherweb customer accounts — enumerating all customers, checking accounts-receivable standing, correlating each customer\'s subscription footprint, and flagging accounts that are at financial or provisioning risk.' },
      { name: 'subscription-provisioner', description: 'Use this agent when an MSP needs to provision, right-size, or audit Sherweb customer subscriptions — listing a customer\'s active subscriptions, looking up catalog products before ordering, planning seat-quantity changes, and walking quantity adjustments through Sherweb\'s confirmation flow.' }
    ],
    commands: [
      { name: '/billing-summary', description: 'View payable charges for a Sherweb billing date range with pricing breakdown' },
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
      { name: 'alerts', description: 'SuperOps.ai RMM alerting: alert types, severity levels, status lifecycle and valid transitions, asset/client/monitor associations, and the GraphQL operations for listing, acknowledging, resolving, and converting alerts into tickets.' },
      { name: 'assets', description: 'SuperOps.ai RMM asset inventory: asset status and platform enums, hardware, network, OS and association fields, software inventory, disk usage, patch status, activity history, and the GraphQL queries and script-execution mutations behind them.' },
      { name: 'clients', description: 'SuperOps.ai client (account) management: stage and status enums, core/business/ address fields, client CRUD mutations, site and contact (requester) management, custom fields, soft vs. hard delete, and onboarding workflows.' },
      { name: 'runbooks', description: 'SuperOps.ai RMM script automation: script types and OS targeting, run-as contexts, execution priority, parameterized arguments, single-asset and batch execution, recurring schedules, execution status polling, and exit-code interpretation.' },
      { name: 'tickets', description: 'SuperOps.ai service desk ticketing: ticket fields, status and priority enums, client/site/requester/assignee associations, notes, time entries, and the GraphQL mutations and queries behind them.' },
      { name: 'api-patterns', description: 'SuperOps.ai GraphQL API fundamentals: Bearer token plus CustomerSubDomain header auth, region-specific endpoints, request/variable structure, cursor pagination, the 800 req/min rate limit, filter operators, UTC date handling, error codes, and null-reset semantics.' }
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
      { name: 'assets', description: 'Syncro MSP assets: asset records and fields for hardware, software, and devices, RMM integration, patch management data, and asset search and update operations.' },
      { name: 'customers', description: 'Syncro MSP customers: customer fields, contacts, sites and locations, and customer create, update, and search operations.' },
      { name: 'invoices', description: 'Syncro MSP invoices: invoice fields, line items, payment processing, and billing workflows.' },
      { name: 'tickets', description: 'Syncro MSP tickets: ticket fields, statuses, priorities, problem types, timer operations, workflow automations, and the validation, time-tracking, and reporting logic around them.' },
      { name: 'api-patterns', description: 'Syncro MSP REST API fundamentals: API key setup and authentication, request and response patterns, pagination, rate limiting, and error handling.' }
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
      { name: 'asset-inventory', description: 'Blackpoint Cyber (CompassOne) asset data: the six asset classes, listing and paginating assets per class, cross-class search, asset detail, and walking parent/child/sibling relationships to build a blast-radius or topology view.' },
      { name: 'incident-response', description: 'Blackpoint Cyber (CompassOne) detection investigation: the read-only tool surface across tenants, assets, detections, and vulnerabilities, the tenant → asset → detection → vulnerability drill-down, asset relationship maps, dark-web and external-exposure cross-references, and which tool domains are stubs.' },
      { name: 'multi-tenant-operations', description: 'Partner-level Blackpoint Cyber (CompassOne) operations: the partner-tenant hierarchy, enumerating customer tenants, sweeping detections and vulnerabilities across all of them, spotting volume anomalies, and building per-tenant scorecards.' },
      { name: 'vulnerability-management', description: 'Blackpoint Cyber (CompassOne) exposure data across four lenses: host vulnerability findings and the filters that matter (CVE, severity, patch and exploit availability), scan history, dark-web credential and data leaks, and internet-facing external exposures — plus how to combine them into a prioritized remediation view.' },
      { name: 'api-patterns', description: 'Blackpoint Cyber (CompassOne) MCP fundamentals: API-token header auth and its internal Bearer forwarding, the partner-tenant-asset hierarchy, navigation tools, which tool domains are functional versus stubbed, pagination, and HTTP error causes.' }
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
    id: 'saas-alerts',
    name: 'Saas Alerts',
    vendor: 'SaaS Alerts',
    description: 'SaaS Alerts - SaaS security monitoring and alerting for M365 / Google Workspace: alerts, events, anomaly detection, multi-tenant response',
    category: 'security',
    maturity: 'alpha',
    features: [
      'Triage'
    ],
    skills: [
      { name: 'triage', description: 'Triaging the SaaS Alerts queue across managed M365 / Google Workspace tenants: the triage tool surface, the critical-first sweep, per-customer summary and cross-tenant pattern workflows, the low/medium/critical severity model and its default dispositions, and the edge cases — legitimately empty results, time-window sensitivity, whitelist suppression, and per-partner rate limits.' },
      { name: 'api-patterns', description: 'SaaS Alerts MCP fundamentals: API-key authentication via the gateway header, the MSP → customer → account → user hierarchy, navigation and functional tool naming, event filter parameters, cursor pagination, and HTTP error codes.' }
    ],
    agents: [
      { name: 'saas-alerts-analyst', description: 'Use this agent when investigating and triaging SaaS Alerts security alerts across managed M365 / Google Workspace tenants — reconstructing what fired, attributing it to a user/tenant, judging severity, and recommending response.' }
    ],
    commands: [],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'saas-alerts/saas-alerts',
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
      { name: 'surveys', description: 'Crewhu CSAT/NPS survey data: the list/search/get tools and the detractor/promoter sentiment slices, the trend, detractor-follow-up, promoter-recognition and per-tech roll-up workflows, and the edge cases that skew scores — sparse response counts, comment-only feedback, and tenant-local timestamps.' },
      { name: 'api-patterns', description: 'Crewhu MCP fundamentals: token authentication via the `X-Crewhu-Api-Token` header and its gateway env-var mapping, the flat 18-tool surface across the surveys, users, badges, and prizes domains (only `crewhu_badges_update_contest` writes), pagination, and error codes.' }
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
      { name: 'endpoint-management', description: 'ImmyBot computers/endpoints and their tenant grouping: the computer tool surface, workflows for surveying a tenant fleet, locating a device, auditing inventory against desired state, onboarding a new computer record, and forcing an agent check-in, plus the filtering caveats around online status and serials.' },
      { name: 'maintenance-sessions', description: 'ImmyBot maintenance sessions — the reconciliation engine that brings endpoints into their desired state: the session tool surface, start parameters (computer vs tenant scope, type, priority, reboot flag), pause/resume/cancel semantics, polling to a terminal state, failure investigation, and reboot-spanning and queued-vs-running edge cases.' },
      { name: 'script-execution', description: 'ImmyBot\'s PowerShell script library and its SYSTEM-context execution model: the script tool surface, the find → validate → confirm target → approve → execute → review workflow, parameter/timeout/execution-context options, and the safety rules governing this destructive, highly privileged operation.' },
      { name: 'software-deployment', description: 'ImmyBot\'s desired-state software deployment model end-to-end: the software catalog, deployment, maintenance-session and computer tool surfaces; the canonical select → scope → assert → reconcile → verify workflow; and the pinned-vs-latest, conflicting-deployment, and reboot edge cases.' },
      { name: 'tenant-compliance', description: 'ImmyBot tenants (client organizations) and fleet-wide reporting: the tenant and background-task tool surfaces, the per-tenant compliance scorecard and fleet task-queue audit procedures, and how to assemble a client QBR report from stats, compliance, software inventory, and failed-task history.' },
      { name: 'api-patterns', description: 'ImmyBot MCP fundamentals: Entra ID OAuth 2.0 client-credentials auth (four fields), the `immybot_<domain>_<action>` tool naming and domain list, the two-step desired-state deployment model, the four destructive operations that need explicit confirmation, task/session polling cadence, and HTTP error codes.' }
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
      { name: 'agents-and-teams', description: 'TimeZest agents (individual technicians) and teams (round-robin / shared availability pools): listing each, fetching detail for a named resource, and the criteria for booking an agent versus a team.' },
      { name: 'appointment-types', description: 'TimeZest appointment types: the types configured for a tenant, each type\'s duration, and how to match a type to the work described on a ConnectWise / Autotask / Halo ticket.' },
      { name: 'psa-integration', description: 'Wiring a TimeZest scheduling request into a PSA: the associatedEntities payload shapes for ConnectWise, Autotask, and Halo tickets, the difference between the pod and generate_url trigger modes, and the causes of bookings that complete but never update the PSA ticket.' },
      { name: 'resources', description: 'TimeZest\'s combined resource pool — the unified list of agents and teams available for scheduling — including filtering by resource type and surveying what is bookable before drilling into a specific agent or team.' },
      { name: 'scheduling', description: 'The TimeZest scheduling-request lifecycle: resolving the right agent and appointment type, creating a request against a ConnectWise / Autotask / Halo ticket, polling its status through to booking, and canceling.' },
      { name: 'api-patterns', description: 'TimeZest MCP fundamentals: Bearer token authentication, the navigation pattern, scheduling-request payloads that carry PSA associated_entities (ConnectWise / Autotask / Halo ticket IDs), and the polling-only update model (no webhooks).' }
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
      { name: 'approval-requests', description: 'ThreatLocker application approval request triage: pulling the pending queue, grouping requests by application and hash, signed-publisher and path heuristics, and approve/deny recommendations with audit-friendly reasoning.' },
      { name: 'audit-log', description: 'The ThreatLocker Action Log (the API name is "audit"): incident timelines, tracing a file\'s history across endpoints, repeated-denial detection, and correlating policy bypasses or audit-only matches with user and computer context.' },
      { name: 'computer-groups', description: 'ThreatLocker computer groups — the policy-scoping boundary that determines which allow/deny rules apply to which endpoints.' },
      { name: 'computers', description: 'ThreatLocker-protected endpoints: fleet inventory, identifying offline agents, a single computer\'s check-in history, and correlating computers across organizations and groups.' },
      { name: 'organizations', description: 'The ThreatLocker MSP multi-tenant model: enumerating child organizations, retrieving per-org auth keys, and identifying valid move targets when relocating computers between tenants.' },
      { name: 'api-patterns', description: 'ThreatLocker Portal API fundamentals: raw-key authentication (no Bearer prefix), multi-tenant routing via the organizationId header, POST-based "GetByParameters" list endpoints, pagination shape, and child-organization fan-out patterns.' }
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
      { name: 'api-patterns', description: 'Kaseya VSA REST API fundamentals: two-step token-based authentication, the /api/v1.0 surface, pagination ($skip/$top) and filtering ($filter), the request/response envelope, error codes, and Kaseya One SSO bearer-token auth for unified-login tenants.' }
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
      { name: 'api-patterns', description: 'Datto BCDR (Backup Portal) REST API fundamentals: public/private key HMAC-SHA256 request signing, the /v1 endpoint surface, pagination, appliance/agent hierarchy, and screenshot verification retrieval.' }
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
      { name: 'api-patterns', description: 'Kaseya BMS PSA REST API v2 fundamentals: tenant subdomain routing, API-token bearer auth, Kaseya One SSO bridging, ticket and account workflows, and OData-style pagination.' }
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
      { name: 'api-patterns', description: 'Datto SaaS Protection (formerly Backupify) REST API fundamentals: regional base URLs, bearer-token auth, the seat/tenant object model, backup status queries, and restore operations.' }
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
      { name: 'api-patterns', description: 'Unitrends Backup REST API fundamentals: session-token login exchange, the appliance-vs-asset hierarchy, backup job status queries, recovery point listing, and replication state.' }
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
      { name: 'api-patterns', description: 'Spanning Cloud Backup REST API fundamentals: admin-email + API-token auth, the per-platform endpoint surface (M365, Google Workspace, Salesforce), the user/license model, backup status queries, and restore operations.' }
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
      { name: 'activities', description: 'HubSpot tasks, notes, and associations: task priority and status values, notes-vs-tasks semantics, the association type matrix linking contacts, companies, deals, and tickets, and engagement-history workflows.' },
      { name: 'companies', description: 'HubSpot company records: core fields, industry classification values, lifecycle stages, domain-based deduplication and automatic contact-company matching, and cross-referencing associated contacts, deals, and tickets.' },
      { name: 'contacts', description: 'HubSpot contact records: core and MSP-relevant custom fields, lifecycle stages, lead status values, contact ownership, CRM search filter patterns, and associations to companies and deals.' },
      { name: 'deals', description: 'HubSpot deal records and sales pipelines: deal fields, default and custom pipeline stages, deal amount conventions (MRR vs.' },
      { name: 'tickets', description: 'HubSpot support tickets: core fields, default pipeline stages, priority levels, MSP ticket categories, SLA timestamp properties, and associating tickets with contacts, companies, and deals.' },
      { name: 'api-patterns', description: 'HubSpot\'s official remote MCP server and the CRM Search API behind it: the complete MCP tool catalog, OAuth 2.0 + PKCE connection over Streamable HTTP, automatic scope derivation, sensitive-data (PHI) exclusion, filter/sort/ pagination syntax, plan-tier rate limits, and error handling.' }
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
      { name: 'lists', description: 'SpamTitan sender allowlists and blocklists: the add/remove/list action parameter, entry types, allowlisting trusted senders to prevent false positives, blocking unwanted senders and domains, and the scoping limit — neither manage tool takes a domain parameter.' },
      { name: 'quarantine', description: 'SpamTitan quarantine queue: quarantine types, release vs. delete semantics, message aging, email flow statistics, and the tenant-isolation limit — the queue listing accepts no domain filter, so on a multi-tenant appliance it spans every customer.' },
      { name: 'api-patterns', description: 'SpamTitan MCP fundamentals: the available tool catalog and its exact parameters, API-key header authentication, API structure, pagination, rate limiting, and error handling.' }
    ],
    agents: [
      { name: 'quarantine-release-reviewer', description: 'Use this agent when an MSP technician or client needs to systematically review the SpamTitan quarantine queue for false positives, release legitimate messages, identify patterns of legitimate mail being blocked, or generate a quarantine digest for client review.' },
      { name: 'spam-filter-analyst', description: 'Use this agent when analyzing spam and phishing patterns in SpamTitan, managing the quarantine queue, tuning allowlist and blocklist rules, investigating held email, or generating email filtering statistics for MSP clients.' }
    ],
    commands: [
      { name: '/manage-lists', description: 'Add, remove, or list entries in SpamTitan sender allowlists and blocklists' },
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
      { name: 'accounts', description: 'Xero chart of accounts: account classes and types, account codes, tax settings, system accounts, and how MSP revenue, cost-of-sales, and expense categories map to the general ledger.' },
      { name: 'contacts', description: 'Xero contacts (customers and suppliers): contact fields, addresses and phones, contact groups, status values and read-only balances, plus MSP client onboarding, offboarding, and PSA cross-referencing patterns.' },
      { name: 'invoices', description: 'Xero sales invoices (ACCREC) and supplier bills (ACCPAY): status lifecycle, invoice numbering, line items and tracking categories, tax handling, credit notes, batch creation, validation-error shapes, and recurring managed-services billing for MSPs.' },
      { name: 'payments', description: 'Xero payments: recording AR and AP payments, partial payments, payment allocation, overpayments and prepayments, batch payment creation, and outstanding-balance and aging tracking for MSP billing and reconciliation.' },
      { name: 'reports', description: 'Xero Reports API: Profit and Loss, Balance Sheet, Aged Receivables and Payables, Trial Balance, Bank Summary and other management reports.' },
      { name: 'api-patterns', description: 'Xero Accounting API fundamentals: OAuth2 Custom Connection (client credentials) auth and scopes, the xero-tenant-id header, where-clause filter syntax, page-based pagination, rate limits, the two date formats, validation-error shape, and batch operations.' }
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
      { name: 'customers', description: 'Alternative Payments customers and their users: customer fields and status, the customer/user relationship, MSP client onboarding, and the destructive archive operation that requires confirmation.' },
      { name: 'invoicing', description: 'Alternative Payments invoices and hosted payment requests: invoice status and line-item fields, hosted payment links and signed PDF links, archiving, and payment-request creation and retrieval.' },
      { name: 'payments', description: 'Alternative Payments transactions and payouts: transaction types, statuses, and the customer/invoice/payment-method filters; payout objects and the transactions that compose them for reconciliation.' },
      { name: 'api-patterns', description: 'Alternative Payments API fundamentals: OAuth2 client-credentials token minting and bearer auth, scopes, REST endpoint structure, cursor pagination, the 5 req/sec rate limit, idempotency, error handling, and the read + safe-write capability posture that deliberately excludes direct payment creation.' }
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
      { name: 'incidents', description: 'Ironscales phishing incidents end to end: incident statuses and severities, the five remediation actions and which of them are irreversible, the stateless AI email-classification tool and the message content it exports, allowlist entries for email/domain/IP, daily-triage and campaign workflows, and the failure modes — already-closed incidents, partial remediation, and allowlist scope.' },
      { name: 'api-patterns', description: 'Ironscales MCP fundamentals: API-key plus company-ID header authentication and the per-tenant scoping that follows from it, the nine tools this server registers and what each one actually changes, offset/limit pagination without a total count, rate-limit behavior, and how API failures surface to the model.' }
    ],
    agents: [
      { name: 'crowdsourced-intel-harvester', description: 'Use this agent when harvesting and analyzing crowdsourced threat intelligence from IRONSCALES\' global network — identifying trending attack types, surfacing indicators seeing increased reports, comparing client threat profiles to industry peers, and generating intelligence briefings from the collective signal.' },
      { name: 'phishing-responder', description: 'Use this agent when responding to user-reported phishing emails in IRONSCALES, triaging the incident queue, investigating incidents, coordinating quarantine and remediation, or reviewing security statistics for MSP clients.' }
    ],
    commands: [
      { name: '/classify-email', description: 'Get an Ironscales AI verdict on a raw email, then act on it with a remediation action' },
      { name: '/triage-incidents', description: 'Triage open Ironscales phishing incidents — list by status and severity, investigate, and remediate' }
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
      { name: 'message-tracking', description: 'Mimecast message tracing: searching by sender, recipient, or subject; message states and message IDs; retrieving message metadata and headers; and holding or releasing messages.' },
      { name: 'queue-management', description: 'Mimecast email delivery queues: inbound and outbound queue types, queue message states, retry behavior, and the signals that identify stuck messages, delivery delays, and backlog conditions.' },
      { name: 'threat-intelligence', description: 'Mimecast threat data: Targeted Threat Protection logs for URL clicks, attachment analysis, and impersonation attempts; threat remediation incidents; and audit events.' },
      { name: 'api-patterns', description: 'Mimecast MCP fundamentals: the available tool catalog, OAuth 2.0 client-credentials authentication, regional API endpoints, pagination, rate limiting, and error handling.' }
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
      { name: 'connection', description: 'Connecting the Microsoft Graph MCP Server for Enterprise (public preview) through the Wyre gateway: BYOC multi-tenant Entra app registration, the tenantId/clientId/clientSecret triple, the delegated MCP.* permissions and the per-tenant admin consent that must be granted out of band, plus the read-only design, the 100 calls/min/user limit, licensing implications, and a symptom-to-cause troubleshooting table.' },
      { name: 'querying', description: 'The RAG query loop for the Microsoft Graph MCP Server for Enterprise — microsoft_graph_suggest_queries to retrieve vetted candidate Graph calls, microsoft_graph_get to execute them, microsoft_graph_list_properties for entity schema — with worked identity and directory examples, result-presentation guidance, and the read-only, RBAC-scoped, rate-limited constraints on what comes back.' }
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
      { name: 'connection', description: 'Onboarding the azure-mcp connector in the WYRE MCP Gateway: Azure service-principal registration, the tenantId/clientId/clientSecret triple, least-privilege Reader-tier RBAC assignments, the gateway\'s read-only namespace allowlist, and connection verification and failure modes (expired secret, missing role assignment).' },
      { name: 'cost-and-capacity', description: 'The read-only cost and capacity half of the azure-mcp connector — the pricing, quota, subscription, and group namespaces: retail meter-rate lookups, quota and usage headroom, subscription and resource-group inventory, and the retail-versus- actual-billing distinction that shapes every estimate.' },
      { name: 'observability', description: 'The read-only observability half of the azure-mcp connector — the monitor, resourcehealth, applens, and advisor namespaces: Azure Monitor metrics, Log Analytics KQL, alert-rule state, platform health states, AppLens detectors, and Advisor recommendation categories, plus the degraded-resource investigation order.' }
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
  },
  {
    id: 'stripe',
    name: 'Stripe',
    vendor: 'Stripe',
    description: 'Stripe - payments, subscriptions, invoices, customer management via Stripe\'s first-party hosted MCP (mcp.stripe.com)',
    category: 'accounting',
    maturity: 'alpha',
    features: [],
    skills: [],
    agents: [],
    commands: [],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'stripe/stripe',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'slack',
    name: 'Slack',
    vendor: 'Slack',
    description: 'Slack - messages, channels, canvases, files, reactions via Slack\'s first-party hosted MCP (mcp.slack.com)',
    category: 'productivity',
    maturity: 'alpha',
    features: [],
    skills: [],
    agents: [],
    commands: [],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'slack/slack',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'meraki',
    name: 'Meraki',
    vendor: 'Meraki',
    description: 'Meraki - Dashboard API network management, device monitoring, firewall & VPN, wireless',
    category: 'network',
    maturity: 'beta',
    features: [
      'Device Management',
      'Security Appliance',
      'Troubleshooting'
    ],
    skills: [
      { name: 'devices', description: 'Cisco Meraki device inventory and lifecycle: serial-based identity, the MX/MS/MR/MV/MG/MT product lines, org inventory vs network assignment, reboot and removal, and device/uplink status via meraki_raw_request.' },
      { name: 'security-appliance', description: 'Cisco Meraki MX security appliance: the L3 outbound firewall rule model and the full-ruleset replacement semantics of meraki_appliance_firewall_l3_update, plus Auto VPN site-to-site peer status via meraki_appliance_vpn_status_get.' },
      { name: 'troubleshooting', description: 'Hands-on Cisco Meraki diagnostics: the async live-tools pattern (ping, cable test, throughput, wake-on-LAN, ARP/MAC tables) that rides the meraki_raw_request passthrough because live tools are not curated tools, plus device reboots and uplink/connectivity checks.' },
      { name: 'api-patterns', description: 'Cisco Meraki MCP fundamentals: the full tool catalog, gateway header authentication, Dashboard API v1 structure, Link-header cursor pagination, per-org rate limiting, the read-only / confirm_destructive_action safety model, the meraki_raw_request escape hatch, and error handling.' }
    ],
    agents: [
      { name: 'meraki-network-auditor', description: 'Use this agent when an MSP needs a read-only health and security audit of a Cisco Meraki organization — sweeping networks, devices, and appliances to surface offline or alerting hardware, appliances with site-to-site VPN peers down, overly-permissive firewall rules, and SSIDs configured with weak or open authentication.' }
    ],
    commands: [
      { name: '/meraki-find-device', description: 'Locate a Meraki device by serial, name, or MAC across an organization\'s networks' },
      { name: '/meraki-firewall-review', description: 'Pull and summarize a Meraki network\'s L3 firewall rules and flag overly-permissive (any/any allow) rules' },
      { name: '/meraki-network-health', description: 'Sweep an organization\'s networks, devices, and appliance VPN status for a site-health overview' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'meraki/meraki',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'ncentral',
    name: 'Ncentral',
    vendor: 'Ncentral',
    description: 'N-able N-central RMM - devices, org units, active issues, scheduled tasks, custom properties for on-prem and hosted servers',
    category: 'rmm',
    maturity: 'beta',
    features: [
      'Device Management',
      'Monitoring Tasks',
      'Organization Management'
    ],
    skills: [
      { name: 'devices', description: 'N-central device records: listing with saved device filters (filterId), asset and warranty lookups, lifecycle reads and updates, and service-monitor status triage on a single device.' },
      { name: 'monitoring-tasks', description: 'N-central monitoring and automation: active-issue triage per customer or site, job statuses, the scheduled task -> status -> per-device details drill-down, and the safety rules for direct-support task execution.' },
      { name: 'organizations', description: 'N-central org units: the service organization -> customer -> site hierarchy, the org-unit vs customer distinction, agent registration tokens (credential-sensitive), and custom properties at both org and device level.' },
      { name: 'api-patterns', description: 'N-central MCP fundamentals: User-API Token (JWT) authentication through Conduit, 1-based pagination with the totalItems/totalPages envelope, rate-limit behavior, preview-endpoint caveats, and on-prem server specifics.' }
    ],
    agents: [
      { name: 'device-auditor', description: 'Use this agent when the user wants a device audit across N-central customers - inventory sweeps, missing asset data, expired or expiring warranties, untracked lifecycle records, or failed service monitors.' },
      { name: 'issue-triager', description: 'Use this agent when the user wants active issues triaged across N-central customers - morning sweeps, severity ranking, root-cause grouping, or deciding what to remediate first.' }
    ],
    commands: [
      { name: '/device-inventory', description: 'Inventory devices for an N-central customer or site with class, warranty, and monitor-health breakdown' },
      { name: '/issue-sweep', description: 'Sweep active issues across N-central customers, grouped by severity and probable root cause' },
      { name: '/task-status', description: 'Drill into an N-central scheduled task\'s outcome - aggregate status down to per-device results and output' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'ncentral/ncentral',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'ops-pack',
    name: 'Ops Pack',
    vendor: 'Ops-pack',
    description: 'MSP Operations — cross-vendor service-desk board health, dispatch prioritization, SLA monitoring, and shift handoffs across whatever PSA/RMM you have connected.',
    category: 'workflow-pack',
    maturity: 'beta',
    features: [
      'Board Hygiene',
      'Dispatch Prioritization',
      'Sla Escalation Playbooks'
    ],
    skills: [
      { name: 'board-hygiene', description: 'Board-wide ticket maintenance, distinct from working any single ticket: stale-ticket detection with per-status staleness thresholds, the Waiting-on-Client rot case and its three valid resolutions, duplicate/related-ticket detection signals and safe linking, and technician queue-balance assessment weighted by more than raw ticket count.' },
      { name: 'dispatch-prioritization', description: 'Priority scoring and assignment for an unassigned PSA ticket queue: the scoring factors (SLA proximity, client tier, ticket age, technician load, skill/category match), how to combine them into an explainable ranked order rather than a black-box formula, and the tool-discovery pattern for finding which PSA and RMM connectors are actually live before calling any vendor\'s tools.' },
      { name: 'sla-escalation-playbooks', description: 'A cross-PSA escalation framework for SLA pressure: how each PSA family (Autotask, HaloPSA, ConnectWise Manage, Syncro, Kaseya BMS) models SLA/priority state and where breach risk lives in each, a normalized breach-risk state model (healthy, at risk, breached-response, breached-resolution) with the default escalation action per state, how notification audience shifts by contract tier, and the evidence to gather before paging anyone.' }
    ],
    agents: [
      { name: 'board-health-auditor', description: 'Use this agent when a service manager, dispatcher, or team lead needs a full cross-board health read on the connected PSA — unassigned aging, SLA-at-risk count, technician load balance, stale/stuck tickets, and duplicate clusters, rolled into a single scored report.' },
      { name: 'dispatch-coordinator', description: 'Use this agent when the unassigned ticket queue needs to be triaged and assigned to technicians, factoring in SLA pressure, client tier, ticket age, and current technician load.' },
      { name: 'stale-ticket-chaser', description: 'Use this agent when tickets have gone quiet and someone needs to figure out why and what to do about each one — not just that they\'re stale.' }
    ],
    commands: [
      { name: '/eod-handoff', description: 'Generate an end-of-day handoff summary - open high-priority tickets, items awaiting next-shift action, and overnight on-call context if available' },
      { name: '/morning-huddle', description: 'Daily kickoff report - SLA-at-risk count, unassigned queue size, yesterday\'s closed vs. opened, and any overnight escalations' },
      { name: '/sla-breaches', description: 'List tickets currently breaching or about to breach SLA within a time window, sorted by urgency' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'ops-pack',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'secops-pack',
    name: 'Secops Pack',
    vendor: 'Secops-pack',
    description: 'Security Operations — cross-vendor alert triage, containment playbooks, and incident timelines across your EDR/MDR/SIEM stack.',
    category: 'workflow-pack',
    maturity: 'beta',
    features: [
      'Alert Severity Normalization',
      'Bec Response',
      'Containment Playbooks'
    ],
    skills: [
      { name: 'alert-severity-normalization', description: 'A common Critical/High/Medium/Low normalized severity model for security alerts, incidents, and findings, with the judgment axes (confidence, mitigation state, blast radius) that place a record in a tier and the mapping from each vendor\'s native terminology — Huntress incident status, SentinelOne threat confidence, Blumira finding priority, CIPP alert queue severity, Blackpoint Cyber SOC severity, SaaS Alerts risk level — plus how to discover which security vendors are actually connected.' },
      { name: 'bec-response', description: 'Business Email Compromise detection and first response: the signals that reveal it in CIPP/M365 audit logs, mailbox and forwarding rules, and connected email security vendor alerts; the order-dependent response sequence (session revocation, forwarding-rule audit, mailbox rule and delegate cleanup, password reset, MFA re-enrollment, lateral-spread check, recipient notification); and what a defensible incident timeline must capture for insurance or bank-fraud claims.' },
      { name: 'containment-playbooks', description: 'Ordered first-response containment sequences for the most common MSP incident classes — compromised account, malware/ransomware detection, business email compromise, and exposed credential — including why the order matters, which connected tool family (RMM, EDR, CIPP/Entra, PSA, documentation) handles each step, and the evidence-preservation principles that apply across all of them.' }
    ],
    agents: [
      { name: 'incident-timeline-builder', description: 'Use this agent when a security incident needs to be reconstructed into a single chronological timeline suitable for a client-facing incident report, pulling every relevant event across every connected security, PSA, and documentation tool for the client and time window in question.' },
      { name: 'overnight-alert-summarizer', description: 'Use this agent when a technician needs a morning read on everything that fired overnight across the connected EDR/MDR/SIEM stack, normalized into one ranked digest instead of five separate vendor consoles.' },
      { name: 'tenant-exposure-ranker', description: 'Use this agent when the MSP needs a portfolio-wide read on which clients carry the most current security risk — open critical findings, unpatched or uncontained threats, MFA coverage gaps, and stale EDR/agent coverage — ranked so leadership or the security team can prioritize attention.' }
    ],
    commands: [
      { name: '/incident-report', description: 'Build a client-facing incident summary for a given client and time window, assembling a chronological timeline across every connected security, PSA, and documentation tool' },
      { name: '/portfolio-sweep', description: 'Sweep every connected security tool across all clients/tenants, normalize findings, and report the top most urgent items portfolio-wide' },
      { name: '/tenant-exposure', description: 'Run the exposure ranking for one client or the whole portfolio — open critical findings, unmitigated threats, MFA gaps, and stale EDR coverage' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'secops-pack',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'finance-pack',
    name: 'Finance Pack',
    vendor: 'Finance-pack',
    description: 'Finance & Billing — agreement reconciliation, license true-up, and margin analysis across PSA, accounting, and distribution tools.',
    category: 'workflow-pack',
    maturity: 'beta',
    features: [
      'Agreement Reconciliation',
      'License True Up',
      'Margin Analysis'
    ],
    skills: [
      { name: 'agreement-reconciliation', description: 'Reconciling PSA contract/agreement entitlements (seats, hours, recurring services) against invoiced reality in an accounting platform, across any combination of PSA (Autotask, HaloPSA, ConnectWise, Syncro) and accounting platform (QuickBooks Online, Xero).' },
      { name: 'license-true-up', description: 'Three-way seat reconciliation per client per SKU: seats provisioned in a cloud marketplace (Pax8, Sherweb) vs. seats billed in accounting or PSA billing vs. seats actually deployed in the tenant (microsoft-graph or CIPP).' },
      { name: 'margin-analysis', description: 'Per-client and per-service-line margin computation for an MSP: revenue from PSA billing or accounting invoices, cost of goods from Pax8/Sherweb wholesale pricing, and estimated labor from PSA time entries × a loaded technician rate.' }
    ],
    agents: [
      { name: 'billing-drift-detector', description: 'Use this agent when an MSP billing team, controller, or account manager needs to run a portfolio-wide sweep for contract-vs-invoice mismatches — surfacing every client where the PSA agreement and the accounting invoice disagree, ranked by dollar impact.' },
      { name: 'profitability-ranker', description: 'Use this agent when an MSP owner, operations leader, or finance lead needs to rank clients from most to least profitable using actual revenue and cost data, flagging any operating at a loss.' },
      { name: 'renewal-calendar-builder', description: 'Use this agent when an MSP account manager, sales leader, or operations manager needs a forward-looking view of every upcoming contract and subscription renewal across the connected PSA and cloud-marketplace distributors, with recommended lead time per renewal.' }
    ],
    commands: [
      { name: '/month-end-recon', description: 'Run the full billing-drift sweep for a billing period, formatted as a month-end reconciliation report' },
      { name: '/renewals', description: 'List upcoming contract and subscription renewals within a window, sorted by date' },
      { name: '/true-up', description: 'Run the license true-up reconciliation for one client or the whole portfolio' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'finance-pack',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'compliance-pack',
    name: 'Compliance Pack',
    vendor: 'Compliance-pack',
    description: 'Compliance — evidence collection and control drift against CIS/SOC 2/HIPAA and cyber-insurance questionnaires.',
    category: 'workflow-pack',
    maturity: 'beta',
    features: [
      'Evidence Mapping',
      'Insurance Questionnaires',
      'Standards Drift'
    ],
    skills: [
      { name: 'evidence-mapping', description: 'Tracing a compliance control (CIS, SOC 2, HIPAA, or a cyber-insurance questionnaire line item) to concrete, retrievable tool evidence: which vendor family can observe what — CIPP for live M365/Entra configuration, Liongard for point-in-time infrastructure state, IT Glue/Hudu for documentation — a representative control-to-tool-call map, and the evidentiary weights that separate Configured from Documented, Contradicted, and Unable to Verify.' },
      { name: 'insurance-questionnaires', description: 'Drafting tool-verified answers to cyber-insurance renewal, new-business, and underwriter security questionnaires: the standard recurring question set (MFA everywhere including privileged accounts, EDR coverage ratio, tested and immutable backups, documented and tested IR plan, security awareness training), which connected tools actually answer each one, and the evidence-backed / documented-only / unable-to-verify labeling discipline that keeps an answer defensible during a claim investigation.' },
      { name: 'standards-drift', description: 'Detecting configuration drift against an established baseline: CIPP standards checks and Best Practice Analyser results, Liongard change detections and inspection timelines, the three conditions that make a diff real drift rather than noise, the signals that separate intentional or authorized change from unauthorized weakening (ticket correlation, reversion pattern, direction of change), and the priority order for ranking several drift findings at once.' }
    ],
    agents: [
      { name: 'control-drift-reporter', description: 'Use this agent when an MSP needs to know what has changed in a client\'s compliance posture since the last known-good baseline, prioritized by how much each change actually matters.' },
      { name: 'evidence-packager', description: 'Use this agent when an MSP needs to gather and assemble compliance evidence for a client against a named framework or control set, producing a source-cited package an auditor or client can review.' },
      { name: 'questionnaire-autofiller', description: 'Use this agent when a client needs its cyber-insurance renewal or new-business questionnaire drafted using live tool evidence rather than best-guess answers.' }
    ],
    commands: [
      { name: '/drift-report', description: 'Report control and configuration drift since the last known-good baseline for a client or the whole portfolio' },
      { name: '/evidence-pack', description: 'Build a source-cited compliance evidence package for a client against a named framework' },
      { name: '/questionnaire', description: 'Draft evidence-backed answers to the standard cyber-insurance questionnaire for a client' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'compliance-pack',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'sales-pack',
    name: 'Sales Pack',
    vendor: 'Sales-pack',
    description: 'Sales & Deal Desk — cross-vendor pipeline health, quote-to-close tracking, proposal follow-up, and warm-lead routing across whatever CRM, proposal, distribution, and scheduling tools you have connected.',
    category: 'workflow-pack',
    maturity: 'beta',
    features: [
      'Pipeline Health',
      'Quote To Close Tracking',
      'Warm Lead Routing'
    ],
    skills: [
      { name: 'pipeline-health', description: 'CRM pipeline health assessment against whatever CRM is discovered through the gateway: stage-velocity norms derived from closed-won deals, activity-based stalled-deal detection, raw and quality-adjusted pipeline coverage against a revenue target, and the CRM-less degradation rule (report nothing rather than fabricate figures).' },
      { name: 'quote-to-close-tracking', description: 'The quote-to-close handoff chain — a Pax8/Sherweb/Kaseya Quote Manager quote or SalesBuildr proposal, through a PandaDoc document\'s sent/viewed/signed status, to a closed-won CRM deal — and the four distinct stall points along it (quote built with no proposal document, proposal sent but not opened, viewed but not signed, signed but the CRM deal never marked closed-won), including cross-system record matching and what to report when only part of the chain is connected.' },
      { name: 'warm-lead-routing', description: 'Lead-warmth scoring from intent and engagement signals — Warmly website-visitor identification, CRM form fills and email engagement, and Calendly booking activity — using an explainable Hot/Warm/Warm-Cool/Cool tiering, plus routing recommendations based on owner continuity, CRM routing rules, or rep capacity, and the degradation path to CRM-only signals when intent tools aren\'t connected.' }
    ],
    agents: [
      { name: 'pipeline-auditor', description: 'Use this agent when a sales manager, deal desk owner, or MSP leadership needs a full cross-vendor sweep of the open sales pipeline — stalled and at-risk deals ranked by value and staleness, with each stall diagnosed against the full quote-to-close chain rather than CRM activity alone.' },
      { name: 'proposal-follow-up-tracker', description: 'Use this agent when a sales rep, deal desk owner, or sales manager needs to know which proposals and quotes need attention right now, with a drafted follow-up action for each.' },
      { name: 'warm-lead-router', description: 'Use this agent when a sales manager or rep needs to know which leads are showing real buying intent right now, and who should follow up on each one.' }
    ],
    commands: [
      { name: '/pipeline-pulse', description: 'Pipeline snapshot - total pipeline value, stalled-deal count, deals closing this period, and biggest movers since last check' },
      { name: '/stalled-deals', description: 'List deals/proposals with no forward movement within a window across the full quote-to-close chain, sorted by value' },
      { name: '/warm-leads', description: 'List currently-warm leads with routing recommendations' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'sales-pack',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'devops-pack',
    name: 'Devops Pack',
    vendor: 'Devops-pack',
    description: 'DevOps & Reliability — cross-vendor on-call handoffs, incident postmortems, deploy health, and error-budget tracking across whatever incident-management and observability tools you have connected.',
    category: 'workflow-pack',
    maturity: 'beta',
    features: [
      'Error Budget Tracking',
      'Incident Postmortem',
      'Oncall Handoff'
    ],
    skills: [
      { name: 'error-budget-tracking', description: 'Error-budget and burn-rate assessment from whatever observability tools (Sentry, Datadog, Grafana, BetterStack) are connected: SLI, SLO, error budget, and burn rate applied practically, how to compute burn rate from available SLI data and the thresholds that make it actionable, what separates a budget-threatening trend from noise, and the fallback to raw trend reporting against a trailing baseline when no formal SLO is defined.' },
      { name: 'incident-postmortem', description: 'Assembling a blameless postmortem grounded in systems of record: timeline reconstruction merging the incident tool\'s event log with correlated observability anomalies (Sentry error spikes, Datadog/Grafana metric anomalies, including precursor signal that predates formal detection) and deploy history from connected platform connectors, all normalized to one stated timezone; the root-cause versus contributing-factor distinction and the test for telling them apart; and how to label a root cause that is still only a hypothesis.' },
      { name: 'oncall-handoff', description: 'Assembling an on-call shift handoff from whatever incident-management tool (Rootly, PagerDuty, BetterStack) is connected, plus corroborating observability signal where available: the four handoff categories in priority order (currently paging, escalated without an owner, last-shift history, known-flaky watch list), why an empty open-incidents list is not an empty handoff, and the bar for calling an alert known-flaky rather than simply resolved.' }
    ],
    agents: [
      { name: 'oncall-handoff-builder', description: 'Use this agent when an on-call engineer needs a structured shift handoff brief — what\'s currently paging or unresolved, what happened during the last shift, known-flaky alerts to watch, and anything escalated but not yet actioned — assembled from whatever incident-management tool is connected.' },
      { name: 'postmortem-drafter', description: 'Use this agent when an engineer, SRE, or incident manager needs a full blameless postmortem drafted from a resolved incident — identified by ID or by a rough time window — reconstructed from the incident tool\'s event log plus correlated observability and deploy data.' },
      { name: 'reliability-scorecard', description: 'Use this agent when a team lead, SRE, or engineering manager needs a ranked reliability status across connected services — error-budget burn rate where a formal SLO exists, degrading to raw error-rate/uptime trend reporting where it doesn\'t — worst service first.' }
    ],
    commands: [
      { name: '/error-budget', description: 'Run the reliability scorecard for one service, or every connected service if omitted - error-budget burn rate where an SLO is defined, trend reporting otherwise' },
      { name: '/oncall-brief', description: 'Generate the current on-call handoff brief - what\'s paging, what\'s escalated without an owner, last-shift history, and known-flaky alerts to watch' },
      { name: '/postmortem', description: 'Draft a blameless postmortem for a given incident (by ID or name), or the most recent significant incident within a time window' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'devops-pack',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'cloudops-pack',
    name: 'Cloudops Pack',
    vendor: 'Cloudops-pack',
    description: 'Cloud & Network Infrastructure — cross-vendor network and cloud infrastructure operations: device/network health, capacity planning, and cost management across whatever network monitoring and cloud platforms you have connected.',
    category: 'workflow-pack',
    maturity: 'beta',
    features: [
      'Cloud Capacity Planning',
      'Cloud Cost Management',
      'Network Health Sweep'
    ],
    skills: [
      { name: 'cloud-capacity-planning', description: 'Right-sizing and capacity forecasting for cloud resources on whatever platforms (Azure, DigitalOcean) are connected: the per-platform over-provisioned and under-provisioned signals, growth-trend-based forecasting toward a projected exhaustion window, and the discipline that separates a genuine capacity risk from normal variance — require a trend not a spike, distinguish burst-tolerant from sustained-critical resources, and always state the observation window behind a forecast.' },
      { name: 'cloud-cost-management', description: 'Cloud spend anomaly detection and reclaimable-spend hunting on whatever platforms (Azure, DigitalOcean) are connected: the signals that make a spend increase an anomaly rather than expected cost, the per-platform orphaned/idle resource catalog (unattached storage, idle load balancers, stopped-but-not-deallocated compute, idle managed databases, orphaned network resources), and how to build a monthly cost trend view — or a clearly labeled inventory-and-list-pricing estimate when a platform exposes no billing data.' },
      { name: 'network-health-sweep', description: 'A normalized device and network health sweep across whatever network-monitoring tools (Auvik, Meraki, Domotz) are connected: each vendor family\'s data model and native status fields mapped into one Down/Degraded/Unknown/Healthy taxonomy, default interface error and utilization thresholds, topology-change detection, and why an offline Domotz collector renders its devices "unknown" rather than "down".' }
    ],
    agents: [
      { name: 'capacity-forecaster', description: 'Use this agent when an MSP needs to know whether current cloud resource capacity will hold up under growth, or which resources are already over- or under-provisioned.' },
      { name: 'cost-anomaly-detector', description: 'Use this agent when an MSP needs to investigate unexpected cloud spend or hunt for orphaned/idle cloud resources that are still costing money.' },
      { name: 'network-health-auditor', description: 'Use this agent when an MSP needs a portfolio-wide or single-client sweep of network device and link health across whatever network-monitoring tools are connected.' }
    ],
    commands: [
      { name: '/capacity-check', description: 'Capacity forecast for cloud resources, scoped to a resource type or covering everything connected' },
      { name: '/cost-report', description: 'Cloud cost anomaly and reclaimable-spend report for a given window' },
      { name: '/network-sweep', description: 'Full network health sweep across all connected network-monitoring tools — devices down, degraded links, and topology changes' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'cloudops-pack',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'awareness-pack',
    name: 'Awareness Pack',
    vendor: 'Awareness-pack',
    description: 'Security Awareness & Training — cross-vendor training completion tracking, phishing simulation results, and per-user risk scoring across whatever security-awareness training tools you have connected.',
    category: 'workflow-pack',
    maturity: 'beta',
    features: [
      'Phishing Simulation Analysis',
      'Risk Scoring',
      'Training Completion Tracking'
    ],
    skills: [
      { name: 'phishing-simulation-analysis', description: 'Phishing-simulation campaign analysis: click-rate trend direction across campaigns, repeat-clicker identification with remedial-training cross-reference, and optional enrichment that correlates simulated failures with real-world phishing incidents from a connected email-security tool as a compounding risk signal.' },
      { name: 'risk-scoring', description: 'Explainable per-user and per-org human risk scoring from training-completion status, phishing-simulation failure history, and optional real-world click/attack-targeting signal: the weighted factor table, three-tier bucketing, per-org rollup as a distribution rather than a blended number, and graceful degradation when only some inputs are connected.' },
      { name: 'training-completion-tracking', description: 'Security-awareness training completion across whatever training/awareness platform is connected: assignment-overdue versus cadence-overdue detection, per-campaign and per-org completion-rate calculation, ranking clients that have fallen behind a contracted cadence, and the unmeasured-versus-0% distinction.' }
    ],
    agents: [
      { name: 'human-risk-scorer', description: 'Use this agent when the MSP needs a per-user or per-org "human risk score" built from training completion and phishing-simulation performance, to rank the riskiest users or clients on the human/culture layer of security.' },
      { name: 'phishing-simulation-analyst', description: 'Use this agent when the MSP needs to analyze phishing-simulation campaign results — click-rate trends over time and repeat-clicker identification — for a single client or across the portfolio.' },
      { name: 'training-compliance-auditor', description: 'Use this agent when the MSP needs to verify security-awareness training completion for a single client or across the whole portfolio, and flag overdue users or clients falling behind their expected training cadence.' }
    ],
    commands: [
      { name: '/phishing-results', description: 'Phishing-simulation results and click-rate trend for a given window' },
      { name: '/risk-report', description: 'Human risk score report for one client or the whole portfolio, built from training completion and phishing-simulation performance' },
      { name: '/training-status', description: 'Training completion snapshot for one client or the whole portfolio — completion rates, overdue users, and cadence status' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'awareness-pack',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'backup-pack',
    name: 'Backup Pack',
    vendor: 'Backup-pack',
    description: 'Backup & DR Assurance — cross-vendor backup job health monitoring, restore-test verification, retention/RPO compliance, and DR readiness across whatever backup and BCDR tools you have connected.',
    category: 'workflow-pack',
    maturity: 'beta',
    features: [
      'Backup Job Health',
      'Restore Test Verification',
      'Retention Rpo Compliance'
    ],
    skills: [
      { name: 'backup-job-health', description: 'Portfolio-wide backup job health across whatever BCDR and SaaS-backup tools are connected: the two structurally different job models (image-based appliance backup vs.' },
      { name: 'restore-test-verification', description: 'Whether a backup is actually recoverable rather than merely present: the ranked hierarchy of restore evidence (actual restore performed, full boot/virtualization verification, screenshot verification, spot-check restore drill, no evidence at all), adequate test cadence per data-criticality tier, and why a never-tested backup is the highest-priority finding — outranking even an actively failing job.' },
      { name: 'retention-rpo-compliance', description: 'Comparing configured backup retention and cadence against contracted retention windows and RPO (recovery point objective) targets: the two distinct retention gap types (configured-shorter-than-contracted vs. storage-forced truncation), why achievable RPO must be derived from actual job success history rather than the nominal schedule, where the contracted side of the comparison actually lives, and why "no documented requirement" is its own finding rather than an automatic pass.' }
    ],
    agents: [
      { name: 'backup-health-auditor', description: 'Use this agent when an MSP needs a portfolio-wide read on whether backup jobs are actually succeeding across whatever backup/BCDR tools are connected — missed backups, active failure streaks, and storage risk, ranked by severity.' },
      { name: 'restore-readiness-checker', description: 'Use this agent when an MSP needs to know whether backups have actually been restore-tested, not just whether they\'re running — flagging clients or systems whose backups have never had a restore, boot-verification, or spot-check drill performed, with a recommended test schedule.' },
      { name: 'retention-compliance-auditor', description: 'Use this agent when an MSP needs to verify that actual backup retention configuration and cadence meet contracted or required retention/RPO policy, rather than assuming appliance defaults are adequate.' }
    ],
    commands: [
      { name: '/backup-status', description: 'Portfolio-wide backup job health snapshot - failure count, at-risk clients, and storage trends' },
      { name: '/restore-check', description: 'Restore-readiness check - has this actually been restore-tested, for one client or the whole portfolio' },
      { name: '/retention-audit', description: 'Retention and RPO compliance audit against contracted requirements, for one client or the whole portfolio' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'backup-pack',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'assets-pack',
    name: 'Assets Pack',
    vendor: 'Assets-pack',
    description: 'IT Asset Lifecycle — cross-vendor warranty tracking, end-of-life/end-of-support flagging, and hardware refresh-cycle planning across whatever RMM platforms and documentation tools you have connected.',
    category: 'workflow-pack',
    maturity: 'beta',
    features: [
      'Eol Eos Flagging',
      'Refresh Cycle Planning',
      'Warranty Tracking'
    ],
    skills: [
      { name: 'eol-eos-flagging', description: 'End-of-life versus end-of-support risk for devices, OS versions, and firmware: combining RMM inventory (make, model, OS version, firmware) with general lifecycle knowledge, the mandatory verify-against-vendor-lifecycle caveat, what qualifies as a finding versus merely "old", and criticality-first prioritization of the resulting risk list.' },
      { name: 'refresh-cycle-planning', description: 'Forward-looking hardware refresh planning: combining warranty expiration, EOL/EOS timing, and device age from whatever RMM and documentation platforms are connected into replace-now / plan-this-year / monitor tiers, laying those tiers onto a dated calendar, surfacing replacement clusters, and keeping an explicit insufficient-data bucket.' },
      { name: 'warranty-tracking', description: 'Endpoint hardware warranty status across whatever RMM platforms (Datto RMM, NinjaOne, N-central, Kaseya VSA, ConnectWise Automate, Atera, SuperOps, Syncro, Action1, ImmyBot) and documentation tools (IT Glue, Hudu) are connected: the reliability spread between OEM-resolved and hand-entered warranty fields, serial/asset-tag cross-referencing when RMM data is missing or stale, and the expired / expiring-soon / covered / unknown bucketing.' }
    ],
    agents: [
      { name: 'eol-risk-assessor', description: 'Use this agent when someone needs to know which devices, OS versions, or firmware are approaching or past end-of-life/end-of-support, prioritized by how much it actually matters if left unaddressed.' },
      { name: 'refresh-planner', description: 'Use this agent when someone needs a forward-looking hardware refresh calendar that combines warranty, EOL/EOS, and device age into a replace-now/plan-this-year/monitor plan.' },
      { name: 'warranty-status-auditor', description: 'Use this agent when someone needs a portfolio-wide or client-specific view of hardware warranty coverage, pulled and normalized across every connected RMM and documentation tool.' }
    ],
    commands: [
      { name: '/eol-report', description: 'EOL/EOS risk report — devices, OS versions, and firmware approaching or past end-of-life/end-of-support, prioritized by criticality' },
      { name: '/refresh-calendar', description: 'Forward-looking hardware refresh calendar for the given window — replace-now / plan-this-year / monitor tiers' },
      { name: '/warranty-status', description: 'Warranty status snapshot — expired, expiring-soon, and unknown-coverage devices for one client or the whole portfolio' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'assets-pack',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'clio',
    name: 'Clio',
    vendor: 'Clio',
    description: 'Clio Manage — legal practice management: matters, contacts, time/expense activities, tasks, documents (metadata), calendar, and billing',
    category: 'legal',
    maturity: 'beta',
    features: [
      'Contact Management',
      'Matters',
      'Time Billing'
    ],
    skills: [
      { name: 'contacts', description: 'Clio contacts -- the people and companies connected to matters: person vs. company contact types, and how a contact relates to the matters they are party to (client, opposing party, witness, and other roles).' },
      { name: 'matters', description: 'Clio matters -- the case/client-file object that almost everything else in Clio hangs off of: the matter status lifecycle, linking a matter to a client contact, practice areas, custom fields, and matter numbering.' },
      { name: 'time-billing', description: 'Clio time and expense activities logged against a matter: the activities domain\'s create-only lifecycle, the billing-read / time-entry-write split, and why billing mutations are out of scope for v1.' },
      { name: 'api-patterns', description: 'Clio Manage MCP fundamentals: OAuth 2.0 Authorization Code connection via Conduit, region selection, the matters-as-hub data model, decision-tree tool navigation, pagination, and the deliberate v1 scope limits (no delete anywhere, documents metadata-only, communications/calendar/bills read-only).' }
    ],
    agents: [],
    commands: [
      { name: '/log-time', description: 'Log a time entry (billable activity) against a Clio matter' },
      { name: '/matter-summary', description: 'Consolidated view of one Clio matter — contacts, open tasks, recent activities, recent communications, and bills' },
      { name: '/search-contacts', description: 'Search Clio contacts by name, company, or email' },
      { name: '/search-matters', description: 'Search or list Clio matters by name/client and status' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'clio/clio',
    compatibility: { claudeCode: true, claudeDesktop: true, validated: false }
  },
  {
    id: 'scalepad',
    name: 'Scalepad',
    vendor: 'Scalepad',
    description: 'ScalePad - asset lifecycle management, warranty services, client engagement roadmaps (Lifecycle Manager), compliance (ControlMap), backup monitoring (Backup Radar), and quoting (Quoter)',
    category: 'productivity',
    maturity: 'production',
    features: [
      'Backup Radar',
      'Controlmap',
      'Core',
      'Lifecycle Manager',
      'Quoter'
    ],
    skills: [
      { name: 'backup-radar', description: 'ScalePad Backup Radar, the read-only backup monitoring surface: per-client backup health records and backup device inventory, in regions us and eu.' },
      { name: 'controlmap', description: 'ScalePad ControlMap per-client compliance management: risk registers, control libraries, evidence collection, policies and procedures, framework objectives, assessments, and remediation action items across regions us, eu, ca, and au.' },
      { name: 'core', description: 'The ScalePad Core API — the read-only, US-only unified data layer over clients, contacts, members, sites, opportunities, hardware and SaaS assets, the product catalog, service contracts, tickets, and integration configurations.' },
      { name: 'lifecycle-manager', description: 'ScalePad Lifecycle Manager, the engagement and roadmap workflow product: initiatives, goals, meetings, action items, assessments, deliverables, budget forecasting, contracts, notes, hardware lifecycle records, and warranty pricing.' },
      { name: 'quoter', description: 'Quoter through ScalePad: building and publishing quotes, managing the catalog (items, item groups, tiers, options, manufacturers), quote contacts, suppliers and datafeeds, and the OAuth helpers for the standalone api.quoter.com path.' },
      { name: 'api-patterns', description: 'ScalePad MCP fundamentals: API-key authentication via the `X-ScalePad-Api-Key` header, tool discovery across the five product domains, cursor pagination, the 50-requests-per-5-seconds rate limit, and 402 subscription errors.' }
    ],
    agents: [
      { name: 'compliance-auditor', description: 'Use this agent when auditing compliance posture in ControlMap — reviewing risks, control coverage, evidence freshness, assessments, or driving remediation action items across client tenants.' },
      { name: 'lifecycle-analyst', description: 'Use this agent when analyzing hardware asset lifecycles, warranty coverage, refresh planning, vCIO roadmaps, or QBR preparation in ScalePad Lifecycle Manager and Core.' },
      { name: 'quote-builder', description: 'Use this agent when building, revising, or publishing quotes in Quoter, or maintaining the Quoter catalog of items, groups, tiers, and suppliers.' }
    ],
    commands: [
      { name: '/asset-lifecycle-report', description: 'Build an asset lifecycle/aging report for a client from ScalePad Lifecycle Manager' },
      { name: '/backup-health', description: 'Check Backup Radar health across a client\'s backups and surface failures' },
      { name: '/compliance-status', description: 'Summarize a client\'s ControlMap compliance posture — risks, controls, evidence, action items' },
      { name: '/create-quote', description: 'Build and publish a Quoter quote step by step' },
      { name: '/warranty-lookup', description: 'Look up warranty and lifecycle status for a client\'s hardware in ScalePad' }
    ],
    apiInfo: {
      baseUrl: '',
      auth: '',
      rateLimit: '',
      docsUrl: ''
    },
    path: 'scalepad/scalepad',
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
