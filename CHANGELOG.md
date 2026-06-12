# Changelog

All notable changes to the MSP Claude Plugin Marketplace will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Docs: **Advanced Workflows batch 3** — three more scheduled-routine guides, all grounded against live gateway connectors: **IT Glue Documentation Auditor** (monthly documentation completeness/freshness debt report), **M365 Identity Auditor** (monthly per-tenant MFA/conditional-access/admin-exposure posture via CIPP — distinct from the Compliance Drift Reporter's standards-drift view), and **Gateway Usage & Anomaly Auditor** (weekly meta-routine that audits the WYRE MCP Gateway's own usage, connection health, and credit consumption). Agent → Routine Catalog rows annotated
- Docs: **Advanced Workflows batch 2** — seven new scheduled-routine guides picked from the Agent → Routine Catalog backlog, spanning connectors not covered by batch 1: **Contract Renewal Tracker** (Autotask — weekly expiring-contract/MRR-at-risk pipeline), **Service Desk SLA Triage** (HaloPSA — hourly SLA-breach triage, idempotent via a per-ticket triage note), **Cash Flow Analyzer** (QuickBooks Online — weekly cash-position + aged-receivables digest, with Xero documented as a connector swap), **Client Profitability Reporter** (QuickBooks Online — monthly revenue-ranked client report with company net-margin context; true cost-allocated margin lives in the `service-profitability-auditor` portfolio agent), **Pax8 Renewal & License Optimizer** (weekly Pax8 renewal calendar + over-provisioning reclaim digest), **Sales Pipeline Pulse** (weekly HubSpot pipeline value + stalled-deal flagging), and **Pending-Proposal Tracker** (weekly PandaDoc aging + expiry digest). The Agent → Routine Catalog rows for all of these are annotated accordingly
- `wyre-gateway` portfolio plugin: **12 new multi-vendor portfolio agents** (v1.1.1 → 1.2.0), each a single-prompt workflow spanning five to ten connected systems: `offboarding-orchestrator`, `user-lifecycle-orchestrator`, `asset-reconciliation-auditor`, `license-true-up-reconciler`, `service-profitability-auditor`, `portfolio-threat-sweep`, `vulnerability-remediation-prioritizer`, `change-drift-sentinel`, `dr-readiness-auditor`, `book-of-business-pulse`, `ticket-deflection-analyzer`, and `client-discovery-agent` (an on-demand cross-system onboarding discovery sweep — deliberately a subagent, not a scheduled routine, since discovery is event-triggered per new client and human-in-the-loop). Marketplace version bumped to 1.8.0
- Kaseya Quote Manager plugin (sales): read-only access to Kaseya Quote Manager (Datto Commerce). 3 skills (api-patterns, quotes, purchasing) + 3 commands (list-quotes, get-quote, get-sales-order). Tools follow `kqm_<entity>_list` / `kqm_<entity>_get` across sales, procurement, catalog, CRM, and org domains. Marketplace version bumped to 1.7.0
- Docs: new **Advanced Workflows** section in the gateway docs, with its first guide — the Autotask Ticket Triage Agent (a Claude-managed scheduled agent that classifies new Autotask tickets by priority, advances them to In Progress, and notifies Slack)
- Docs: **Advanced Workflows batch 1** — six new workflow guides, each a Claude-managed scheduled routine built and verified against WYRE's MCP Gateway: Patch Drift Reporter (Datto RMM), Device Health Auditor (Datto RMM), M365 License Auditor (CIPP), Compliance Drift Reporter (Liongard), Billing Reconciler (QuickBooks Online), and QBR Prep (Autotask + Datto RMM + CIPP + Liongard + IT Glue). Plus a **Delivery Adapters** reference (how a routine delivers its report — Slack, IT Glue — and the adapter contract for new targets) and an **Agent → Routine Catalog** classifying every marketplace subagent by routine-fitness archetype
- Subagent coverage for four previously thin plugins, bringing them to parity with the strongest sibling plugins. All content grounded in the real MCP server tool surface:
  - `timezest`: +3 subagents (scheduling-dispatcher, psa-integration-specialist, booking-pipeline-auditor), +4 skills, +4 commands → 6 skills / 3 agents / 5 commands (v1.1.0)
  - `immybot`: +3 subagents (software-deployment-orchestrator, endpoint-remediation-specialist, compliance-auditor), +4 skills, +5 commands → 6 skills / 3 agents / 6 commands (v1.1.0)
  - `blackpoint`: +3 subagents (detection-investigator, alert-response-coordinator, exposure-analyst), +3 skills, +4 commands → 5 skills / 3 agents / 5 commands (v1.1.0)
  - `sherweb`: +3 subagents (subscription-provisioner, billing-reconciler, customer-account-auditor) → 4 skills / 3 agents / 4 commands (v0.3.0)

### Changed

- Docs: the **Compliance Drift Reporter** Advanced Workflow now also reports CIPP baseline drift (assigned Standards) and tenant delegated-access health, alongside the existing Liongard configuration-change detections

### Fixed

- `cipp` plugin docs pointed `CIPP_BASE_URL` at the Static Web App / custom-domain UI URL (`https://cipp.yourdomain.com`). The SWA redirects bearer-token requests to its interactive login page, so API calls fail. The README setup steps and `.env.example` now use the CIPP-API Azure Function App URL (`https://<function-app-name>.azurewebsites.net`) and explain the distinction
- Gateway URL drift: flipped `blackpoint`, `crewhu`, `immybot`, `timezest`, `threatlocker` plugin READMEs and `.mcp.json` files from `mcp.wyretechnology.com` to canonical `mcp.wyre.ai` (closes #73)

### Added

- Checkpoint Avanan plugin (email-security): 5 skills + 5 commands for quarantine, threats, policies, incidents, API patterns
- Proofpoint plugin (email-security): 7 skills + 6 commands for TAP, quarantine, threat intel, forensics, people/VAP, URL defense, API patterns
- KnowBe4 plugin (email-security): 5 skills + 5 commands for phishing simulation, training, users, reporting, API patterns
- Sherweb plugin (marketplace): 4 skills + 4 commands for billing, customers, subscriptions, API patterns
- New `email-security` plugin category in marketplace.json

#### Kaseya Portfolio Expansion — 6 New Plugin Scaffolds (`kaseya/`)
- **kaseya-vsa** (`kaseya/kaseya-vsa/`) — RMM. API patterns skill covers two-step token auth, Kaseya One SSO bridging, OData pagination, response envelope semantics
- **datto-bcdr** (`kaseya/datto-bcdr/`) — Backup/DR. API patterns skill covers HMAC-SHA256 request signing, screenshot verification retrieval, recovery point queries
- **kaseya-bms** (`kaseya/kaseya-bms/`) — PSA. API patterns skill covers tenant subdomain routing, API token vs Kaseya One JWT, ticket workflow gotchas
- **datto-saas-protection** (`kaseya/datto-saas-protection/`) — SaaS backup (M365 / Google Workspace). API patterns skill covers region selection (US/EU), seat hierarchy, async restore polling
- **unitrends** (`kaseya/unitrends/`) — Backup. API patterns skill covers session-token login, appliance/asset hierarchy, MSP Console drift, self-signed cert handling
- **spanning** (`kaseya/spanning/`) — SaaS backup (M365 / GWS / Salesforce). API patterns skill covers per-platform URL bases, admin-email + token auth, Salesforce object ID quirks
- All plugins are version `0.1.0` and tagged `scaffolding` — content is reference documentation; matching MCP servers (`*-mcp`) and SDKs (`node-*`) are in development
- Registered in `.claude-plugin/marketplace.json` under categories `rmm`, `psa`, and `bcdr` (new category for backup/disaster-recovery products)

#### Kaseya Autotask Plugin (`kaseya/autotask/`) - v0.2.0
- **Expenses Skill** - Expense report and expense item management, approval workflow (New/Submitted/Approved/Paid/Rejected/InReview), billable vs reimbursable tracking, picklist discovery for categories and payment types
- **Quotes Skill** - Quote creation and line item management, product/service/service bundle linking, discount structures (unit, line, percentage), optional items, opportunity integration
- **Tool Discovery Skill** - Progressive discovery pattern for lazy-loaded MCP connections, meta-tool usage (list_categories, list_category_tools, execute_tool), intelligent router for natural language tool lookup
- **expenses command** - Create expense reports, add expense items, search by status/submitter, get report details
- **create-quote command** - Build quotes with catalog items, company/contact resolution, pricing and discount application

### Changed

#### Pax8 Plugin (`pax8/pax8/`)
- **Switched to Pax8's official hosted MCP server** at `https://mcp.pax8.com/v1/mcp` — replaces our custom pax8-mcp server
- **Simplified authentication** from OAuth2 client_id/client_secret to single MCP token (generated at `app.pax8.com/integrations/mcp`)
- Updated `.mcp.json`, API patterns skill, README, and gateway vendor config

### Added

#### Shared: Billing Reconciliation Skill (`shared/skills/billing-reconciliation/`)
- **Cross-vendor billing reconciliation** - Compares PSA time/ticket data against accounting invoices to find revenue leakage, unbilled work, and billing discrepancies
- **reconcile-billing command** - Guided workflow for pulling PSA contracts, matching to accounting invoices, identifying gaps, and generating reconciliation reports
- Supports Autotask, ConnectWise, HaloPSA (PSA side) and Xero, QuickBooks Online (accounting side)

#### Xero Plugin (`xero/xero/`)
- **Contacts Skill** - Contact CRUD, customer/supplier types, address and phone types, financial summary fields, PSA cross-referencing via ContactNumber/AccountNumber, contact groups
- **Invoices Skill** - Sales invoices (ACCREC) and supplier bills (ACCPAY), full status lifecycle (DRAFT to PAID/VOIDED), line items with tracking categories, batch invoicing workflows
- **Payments Skill** - Payment recording (AR/AP), partial payments, batch payment creation, collections summary, bank reconciliation workflow, overpayment handling
- **Accounts Skill** - Chart of accounts structure, MSP-specific COA layout (revenue 200-299, COGS 400-499, expenses 500-699), account CRUD, revenue breakdown
- **Reports Skill** - P&L, Balance Sheet, Aged Receivables/Payables, Trial Balance, Bank Summary reports with MSP financial review workflows
- **API Patterns Skill** - OAuth2 Custom Connection auth, xero-tenant-id header, where clause filtering, page-based pagination (100/page), 60 req/min + 5000/day rate limits

#### Xero Commands
- **create-invoice** - Create sales invoices with contact lookup, MSP account codes, and date calculation
- **search-contacts** - Search contacts by name/email/account number with type and status filtering
- **payment-status** - Outstanding balance and payment history with aging breakdown and severity indicators
- **reconciliation-summary** - Billing completeness check — identifies unbilled clients, aged receivables, month-over-month comparison

#### QuickBooks Online Plugin (`quickbooks/quickbooks-online/`)
- **Customers Skill** - Customer entity with parent/sub-customer hierarchy, payment terms, balance tracking, MSP client onboarding/offboarding workflows
- **Invoices Skill** - Invoice lifecycle (draft through paid/voided), line item types, MSP invoice types (recurring, project, T&M, hardware), batch send workflow
- **Expenses Skill** - Purchase and Bill entities, per-client cost allocation via CustomerRef, billable status tracking, profitability analysis
- **Payments Skill** - Full/partial/multi-invoice/unapplied payments, Credit Memos for SLA credits, collections workflow
- **Reports Skill** - P&L, Balance Sheet, A/R Aging, A/P Aging, General Ledger, Customer Sales, Cash Flow with MSP financial dashboard workflows
- **API Patterns Skill** - OAuth2 with token refresh, Intuit query language (SQL-like), minorversion header, SyncToken optimistic locking, 500 req/min rate limits

#### QuickBooks Online Commands
- **create-invoice** - Invoice creation with customer resolution, item lookup, optional email send
- **search-customers** - Customer search with LIKE matching, status/balance filtering
- **get-balance** - Outstanding balances across all MSP clients with A/R aging breakdown
- **expense-summary** - Per-client expense breakdown with billable/non-billable split and profitability context

#### Pax8 Plugin (`pax8/pax8/`)
- **Companies Skill** - Company CRUD, contact management, billing configuration (billOnBehalfOf, selfService, orderApproval), PSA integration via externalId
- **Products Skill** - Product catalog search, vendor filtering, pricing endpoint, provisioning types, billing terms, margin calculation
- **Subscriptions Skill** - Full lifecycle with all 9 subscription states, quantity management, license optimization, renewal management, usage summaries
- **Orders Skill** - Order creation with line items, multi-product orders, provisioning tracking, pre-order validation
- **Invoices Skill** - Invoice retrieval, line item breakdown by company, billing reconciliation, margin analysis, trend analysis
- **API Patterns Skill** - OAuth2 client credentials flow, 0-based pagination (max 200/page), sorting, 1000 req/min rate limits

#### Pax8 Commands
- **search-products** - Search product catalog by name/vendor with optional pricing display
- **subscription-status** - Company subscription report with status and product filtering
- **create-order** - Place orders with validation, pricing confirmation, and commitment warnings
- **license-summary** - Aggregated cross-client license report with optimization recommendations and annual savings estimates

- Cross-vendor incident correlation skill and `/correlate-incident` command — correlates PSA tickets, RMM device state, documentation assets, and config monitoring changes into a unified incident summary (issue #20)
- Vendor field mappings and normalization tables for priority, status, company, and device fields across Autotask, Datto RMM, IT Glue, Liongard, and other vendors

#### Hudu Plugin (`hudu/hudu/`)
- **Companies Skill** - Company CRUD, archive/unarchive, PSA integration matching via `id_in_integration`, parent/child relationships, onboarding/offboarding workflows
- **Assets Skill** - Asset management with asset layouts (custom field templates), custom field types (Text, RichText, Number, Date, CheckBox, Dropdown, AssetTag), layout management, warranty tracking
- **Articles Skill** - Knowledge base article CRUD, folder management, draft vs published state, company-specific vs global articles, HTML content format
- **Passwords Skill** - Secure credential storage via `/api/v1/asset_passwords`, password folders, OTP secrets, security audit logging, API key permission requirements
- **Websites Skill** - Website records with SSL/TLS monitoring, email security tracking (DMARC/DKIM/SPF status and policy), DNS records
- **API Patterns Skill** - `x-api-key` header authentication, page-based pagination (25/page), 300 req/min rate limiting, API naming differences (UI "Password" → API `asset_passwords`, UI "Process" → API `procedures`)

#### Hudu Commands
- **lookup-asset** - Find assets by name, hostname, serial number, or IP with company and layout filters
- **search-articles** - Search knowledge base articles by keyword with company filter and result limit
- **find-company** - Find companies by name with status filter (active/archived/all)
- **get-password** - Retrieve credentials with mandatory company parameter, mask-by-default with `--show` flag

#### RocketCyber Plugin (`kaseya/rocketcyber/`)
- **Incidents Skill** - Security incident lifecycle (New → In Progress → Resolved/False Positive), severity levels, verdicts (Malicious/Suspicious/Benign), SOC analyst triage workflow, PSA ticket cross-correlation
- **Agents Skill** - RocketAgent deployment and monitoring, communication status (Online/Offline), platform support (Windows/macOS/Linux), health audits, offline agent troubleshooting
- **Accounts Skill** - Provider/customer account hierarchy, account types and statuses, new customer setup, account-level security posture assessment
- **Apps Skill** - Application discovery and categorization (Security, Remote Access, Productivity), unauthorized software auditing, security coverage checks
- **API Patterns Skill** - Bearer token authentication, regional base URL (`https://api-{region}.rocketcyber.com/v3`), provider-scoped API keys, conservative rate limiting

#### RocketCyber Commands
- **search-incidents** - Search security incidents by account, status, severity, and verdict
- **account-summary** - Security posture summary with agent status, active incidents, application inventory, and health assessment (HEALTHY/MODERATE/DEGRADED)

- Documentation site using Astro with Starlight theme (in progress)
- GitHub issues for additional PSA/RMM provider plugins (planned)

## [1.1.0] - 2026-02-04

### Added

#### Datto RMM Plugin (`kaseya/datto-rmm/`)
- **Devices Skill** - Device management with identifiers (UID, hostname, MAC, IP), device types (Desktop, Laptop, Server, ESXi Host, Network Device, Printer), status monitoring, user-defined fields (UDF1-30), and device health workflows
- **Alerts Skill** - Comprehensive alert handling with all 25+ alert context types including antivirus_ctx, comp_script_ctx, eventlog_ctx, online_offline_status_ctx, patch_ctx, perf_disk_usage_ctx, perf_resource_usage_ctx, ping_ctx, process_status_ctx, ransomware_ctx, srvc_status_ctx, and more
- **Sites Skill** - Site management with device assignment, site settings, proxy configuration, and site-level operations
- **Jobs Skill** - Quick job execution, component scripts, job variables, status monitoring, and results retrieval
- **Audit Skill** - Hardware inventory (CPU, RAM, disks), software inventory, network interfaces, ESXi host audits, and audit freshness tracking
- **Variables Skill** - Account-level and site-level variables, CRUD operations, variable templates, and inheritance patterns
- **API Patterns Skill** - OAuth 2.0 authentication, 6 regional platforms (Pinotage, Merlot, Concord, Vidal, Zinfandel, Syrah), token lifecycle (100-hour TTL), pagination (nextPageUrl), rate limiting (600 req/min), and Unix millisecond timestamp handling

#### Datto RMM Commands
- **device-lookup** - Find devices by hostname, IP address, or MAC address with site filtering
- **resolve-alert** - Resolve open alerts with context-aware recommendations
- **run-job** - Run quick jobs on devices with variable support and completion waiting
- **site-devices** - List devices at a site with status, type, and alert filtering

#### IT Glue Plugin (`kaseya/it-glue/`)
- **Organizations Skill** - Organization CRUD, relationships, and hierarchies
- **Configuration Types Skill** - Asset types and custom field definitions
- **Passwords Skill** - Secure password management and retrieval
- **Flexible Assets Skill** - Custom documentation templates and fields
- **API Patterns Skill** - X-API-KEY authentication, filtering, embedding related resources

#### Syncro Plugin (`syncro/syncro-msp/`)
- **Tickets Skill** - Ticket CRUD with status (New, In Progress, Resolved), priority levels, timers, comments
- **Customers Skill** - Customer and contact management, onboarding workflows
- **Assets Skill** - Asset tracking with RMM properties, patch management, remote access
- **Invoices Skill** - Invoice creation, line items, payments, email sending
- **API Patterns Skill** - Bearer token auth, page-based pagination (180 req/min)

#### Syncro Commands
- **create-ticket** - Create tickets with customer validation and duplicate detection
- **search-tickets** - Search with filters for customer, status, priority, date range

#### Atera Plugin (`atera/atera/`)
- **Tickets Skill** - Ticket management with SLA tracking, work hours, comments
- **Agents Skill** - RMM agent monitoring, PowerShell execution, lifecycle management
- **Customers Skill** - Customer CRUD with custom values
- **Alerts Skill** - Alert triage with severity levels (Critical, Warning, Information)
- **Devices Skill** - HTTP/SNMP/TCP monitor configuration with common OIDs
- **API Patterns Skill** - X-API-KEY header auth, OData pagination (700 req/min)

#### Atera Commands
- **create-ticket** - Create tickets with customer/contact resolution
- **search-agents** - Search RMM agents by customer or machine name

#### SuperOps.ai Plugin (`superops/superops-ai/`)
- **Tickets Skill** - Ticket CRUD, notes, time entries, status workflows (GraphQL)
- **Assets Skill** - Asset inventory, software, disk details, script execution
- **Clients Skill** - Client CRUD, sites, contacts, custom fields
- **Alerts Skill** - Alert acknowledgment, resolution, ticket creation
- **Runbooks Skill** - Script discovery, execution (single/bulk/scheduled), status monitoring
- **API Patterns Skill** - Bearer token + CustomerSubDomain, cursor pagination (800 req/min)

#### SuperOps.ai Commands
- **create-ticket** - Create tickets via GraphQL mutation
- **list-assets** - Query assets with filtering

#### HaloPSA Plugin (`halopsa/halopsa/`)
- **Tickets Skill** - Ticket management with actions (notes), attachments, SLA calculations
- **Clients Skill** - Client hierarchy, sites, contacts
- **Assets Skill** - Asset tracking, device management, RMM integration
- **Contracts Skill** - Recurring billing, prepaid hours, renewal workflows
- **API Patterns Skill** - OAuth 2.0 client credentials, offset pagination (500 req/3min)

#### HaloPSA Commands
- **create-ticket** - Create tickets with contract validation
- **search-tickets** - Multi-filter search with status/priority/date options

## [1.0.0] - 2026-02-04

### Added

#### Autotask Plugin (`kaseya/autotask/`)
- **Tickets Skill** - Comprehensive ticket management with status codes (NEW, IN_PROGRESS, COMPLETE, WAITING_CUSTOMER, WAITING_MATERIALS, ESCALATED), SLA calculations, escalation rules, and ticket metrics/KPIs
- **CRM Skill** - Company and contact management for client relationship tracking
- **Projects Skill** - Project management with phases, tasks, and resource allocation
- **Contracts Skill** - Service agreements, billing configurations, and contract lifecycle management
- **Time Entries Skill** - Time tracking with approval workflows (DRAFT, SUBMITTED, APPROVED, REJECTED), billing calculations, utilization analytics, and budget validation
- **API Patterns Skill** - Comprehensive REST API documentation covering all 14 query operators (eq, ne, gt, gte, lt, lte, contains, startsWith, endsWith, in, notIn, isNull, isNotNull, between), header-based authentication, automatic zone detection, pagination, rate limiting, and error handling
- **Configuration Items Skill** - Asset management with CI types, categories, DNS records, SSL tracking, related items, warranty tracking, and lifecycle management

#### Autotask Commands
- **create-ticket** - Create new service tickets with company lookup, duplicate detection, contract validation, and queue routing
- **search-tickets** - Search and filter tickets using comprehensive query patterns
- **time-entry** - Log time against tickets or projects with billing calculations and approval submission

#### Shared Skills (`shared/`)
- **MSP Terminology** - Vendor-agnostic MSP vocabulary and acronyms
- **Ticket Triage** - Best practices for ticket prioritization and routing

#### ConnectWise Manage Plugin (`connectwise/manage/`)
- Plugin placeholder structure with manifest and MCP configuration
- README documenting planned features

#### Marketplace Infrastructure
- Vendor-organized directory structure (`vendor/product/` pattern)
- Plugin manifest format (`.claude-plugin/plugin.json`)
- MCP server configuration (`.mcp.json`)
- Skill template with frontmatter schema
- Command template with argument definitions

#### Contribution Framework
- **CONTRIBUTING.md** - Contribution guidelines with PRD requirements
- **CODE_OF_CONDUCT.md** - Contributor Covenant code of conduct
- **LICENSE** - Apache 2.0 license
- **README.md** - Project documentation and quick start guide

#### Quality Standards (`_standards/`)
- PRD requirements checklist
- Skill quality checklist
- API documentation guide

#### Templates (`_templates/`)
- Plugin PRD template
- Skill template with example structure
- Command template
- LLM prompts for skill, command, and PRD generation

### Security
- All Autotask API patterns document secure authentication via header-based credentials (not Basic Auth)
- Rate limiting guidance to prevent API abuse
- Input validation patterns for API operations

---

## Release Notes Format

Each release entry should include:
- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** in case of vulnerabilities

---

[Unreleased]: https://github.com/asachs01/msp-claude-plugins/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/asachs01/msp-claude-plugins/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/asachs01/msp-claude-plugins/releases/tag/v1.0.0
