# MSP Claude Plugin Marketplace

## Product Requirements Document

**Version:** 1.0  
**Author:** Aaron / WYRE AI  
**Date:** February 4, 2026  
**Status:** Draft

---

## Executive Summary

The MSP Claude Plugin Marketplace is a community-driven, open-source repository of Claude Code plugins and skills specifically designed for Managed Service Providers (MSPs). The marketplace provides vendor-organized plugins that enable MSP technicians, engineers, and administrators to leverage Claude's capabilities with deep integration into the tools they use daily.

Inspired by Anthropic's [knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins), this marketplace follows the same architectural patterns while organizing content by MSP vendor ecosystem rather than job function.

---

## Problem Statement

MSPs operate across a fragmented landscape of PSA, RMM, documentation, and IT service management tools. Each vendor (Kaseya, ConnectWise, HaloPSA, NinjaOne, Superops, etc.) has multiple products with distinct APIs, workflows, and terminology. This creates several challenges:

1. **Context switching overhead** — Technicians jump between tools constantly, losing efficiency
2. **Tribal knowledge silos** — Each tool requires specialized knowledge that's hard to transfer
3. **AI adoption barriers** — Generic AI assistants don't understand MSP-specific workflows, terminology, or tool ecosystems
4. **No standardized AI enablement** — Each MSP builds custom solutions from scratch

---

## Solution

A centralized, community-driven marketplace of Claude plugins organized by vendor and product, providing:

- **Vendor-specific skills** that encode domain expertise, API patterns, and best practices
- **Slash commands** for common operations (create tickets, update documentation, manage projects)
- **MCP integrations** connecting Claude to MSP tool APIs
- **Standardized contribution workflow** ensuring quality through mandatory PRDs and defined development standards

---

## Target Users

| Persona | Use Case |
|---------|----------|
| **MSP Technicians** | Faster ticket resolution, documentation lookup, knowledge transfer |
| **Service Desk Teams** | Ticket triage, escalation workflows, customer communication |
| **Project Managers** | Project tracking, resource allocation, status reporting |
| **MSP Engineers** | Automation scripting, infrastructure documentation, troubleshooting |
| **MSP Owners/Leaders** | Reporting, business intelligence, workflow optimization |
| **Community Contributors** | Building and sharing plugins for tools they use daily |

---

## Repository Structure

### Hierarchical Organization

```
msp-claude-plugins/
├── .claude-plugin/
│   └── marketplace.json           # Marketplace manifest
├── CONTRIBUTING.md                # Contribution guidelines
├── CODE_OF_CONDUCT.md
├── LICENSE                        # Apache 2.0
├── README.md
│
├── _templates/                    # Templates for contributors
│   ├── plugin-prd-template.md
│   ├── skill-template/
│   │   └── SKILL.md
│   ├── command-template.md
│   └── llm-prompts/               # Prompts for LLM-assisted development
│       ├── prd-generation.md
│       ├── skill-generation.md
│       └── command-generation.md
│
├── _standards/                    # Quality standards documentation
│   ├── prd-requirements.md
│   ├── skill-quality-checklist.md
│   └── api-documentation-guide.md
│
├── connectwise/
│   ├── manage/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   ├── .mcp.json
│   │   ├── README.md
│   │   ├── commands/
│   │   │   ├── create-ticket.md
│   │   │   ├── search-tickets.md
│   │   │   └── update-company.md
│   │   └── skills/
│   │       ├── ticket-management/
│   │       │   └── SKILL.md
│   │       ├── service-board-routing/
│   │       │   └── SKILL.md
│   │       └── agreement-management/
│   │           └── SKILL.md
│   ├── automate/
│   ├── control/
│   └── itboost/
│
├── kaseya/
│   ├── autotask/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   ├── .mcp.json
│   │   ├── README.md
│   │   ├── commands/
│   │   │   ├── create-ticket.md
│   │   │   ├── search-tickets.md
│   │   │   ├── update-account.md
│   │   │   ├── create-project.md
│   │   │   └── time-entry.md
│   │   └── skills/
│   │       ├── tickets/
│   │       │   └── SKILL.md
│   │       ├── crm/
│   │       │   └── SKILL.md
│   │       ├── projects/
│   │       │   └── SKILL.md
│   │       ├── contracts/
│   │       │   └── SKILL.md
│   │       └── api-patterns/
│   │           └── SKILL.md
│   ├── datto-rmm/
│   │   └── ...
│   ├── it-glue/
│   │   └── ...
│   ├── vorex/
│   │   └── ...
│   └── vsa/
│       └── ...
│
├── halopsa/
│   └── ...
│
├── ninjaone/
│   └── ...
│
├── superops/
│   └── ...
│
├── datto/
│   ├── rmm/
│   ├── autotask/              # Alias/pointer to kaseya/autotask
│   ├── networking/
│   └── bcdr/
│
└── shared/
    └── skills/
        ├── msp-terminology/
        │   └── SKILL.md       # Common MSP vocabulary, acronyms
        ├── ticket-triage/
        │   └── SKILL.md       # Vendor-agnostic triage patterns
        └── documentation-standards/
            └── SKILL.md       # IT documentation best practices
```

### Plugin Component Structure

Each product plugin follows Anthropic's standard plugin architecture:

```
vendor/product/
├── .claude-plugin/
│   └── plugin.json           # Plugin manifest (required)
├── .mcp.json                 # MCP server configuration (optional)
├── README.md                 # Product-specific documentation
├── prd/                      # PRD history for this plugin
│   └── initial-prd.md
├── commands/                 # Slash commands (optional)
│   └── *.md
├── skills/                   # Domain knowledge (optional)
│   └── skill-name/
│       └── SKILL.md
└── agents/                   # Subagent definitions (optional)
    └── *.md
```

---

## Plugin Architecture Details

### plugin.json Manifest

```json
{
  "name": "kaseya-autotask",
  "version": "1.0.0",
  "description": "Claude plugins for Kaseya Autotask PSA - tickets, CRM, projects, contracts",
  "author": "MSP Claude Plugins Community",
  "vendor": "kaseya",
  "product": "autotask",
  "api_version": "1.6",
  "requires_api_key": true,
  "documentation_url": "https://ww5.autotask.net/help/DeveloperHelp/Content/APIs/REST/REST_API_Home.htm"
}
```

### MCP Configuration (.mcp.json)

```json
{
  "mcpServers": {
    "autotask": {
      "command": "npx",
      "args": ["-y", "@msp-plugins/autotask-mcp-server"],
      "env": {
        "AUTOTASK_USERNAME": "${AUTOTASK_USERNAME}",
        "AUTOTASK_SECRET": "${AUTOTASK_SECRET}",
        "AUTOTASK_INTEGRATION_CODE": "${AUTOTASK_INTEGRATION_CODE}",
        "AUTOTASK_ZONE": "${AUTOTASK_ZONE}"
      }
    }
  }
}
```

### Skill Structure (SKILL.md)

```markdown
---
description: >
  Use this skill when working with Autotask tickets - creating, updating,
  searching, or managing service desk operations. Covers ticket fields,
  queues, statuses, priorities, and workflow automations.
triggers:
  - autotask ticket
  - service ticket
  - create ticket autotask
  - ticket queue
  - ticket status
---

# Autotask Ticket Management

## Overview

Autotask tickets are the core unit of service delivery...

## Key Concepts

### Ticket Structure
- **Ticket Number**: Auto-generated, format varies by company
- **Queue**: Determines routing and SLA
- **Status**: Draft → New → In Progress → Complete
...

## API Patterns

### Creating a Ticket
```json
POST /v1.0/Tickets
{
  "companyID": 12345,
  "title": "Issue summary",
  "description": "Detailed description",
  "queueID": 8,
  "priority": 2,
  "status": 1
}
```

## Common Workflows

### Ticket Triage
1. Check for duplicate tickets on same company
2. Verify contract coverage
3. Assign appropriate queue based on issue type
...
```

### Command Structure

```markdown
---
name: create-ticket
description: Create a new ticket in Autotask PSA
arguments:
  - name: company
    description: Company name or ID
    required: true
  - name: title
    description: Ticket title/summary
    required: true
  - name: description
    description: Detailed description
    required: false
  - name: queue
    description: Queue name or ID
    required: false
  - name: priority
    description: Priority level (1-4)
    required: false
---

# Create Autotask Ticket

## Prerequisites
- Valid Autotask API credentials configured
- Company must exist in Autotask

## Steps
1. Validate company exists (search by name if not ID provided)
2. Check for active contract on company
3. Create ticket with provided details
4. Apply default values for optional fields from company settings
5. Return ticket number and URL

## Error Handling
- Company not found: Suggest similar company names
- No active contract: Warn but allow ticket creation (T&M)
- API rate limit: Queue request for retry
```

---

## Contribution Requirements

### The PRD Mandate

**All development begins with a PRD. This is non-negotiable.**

Before any code is written, any skill is created, or any command is defined, a PRD must be:

1. **Created** using the provided template
2. **Reviewed** by at least one community member
3. **Approved** via PR review process
4. **Stored** in the plugin's `prd/` directory

### PRD Template (Simplified for Plugins)

```markdown
# Plugin PRD: [Vendor]/[Product]/[Component]

## Summary
One paragraph describing what this plugin/skill/command does.

## Problem
What specific MSP workflow problem does this solve?

## User Stories
- As a [role], I want to [action] so that [benefit]

## Scope
### In Scope
- Feature 1
- Feature 2

### Out of Scope
- What this explicitly won't do

## Technical Approach
### API Endpoints Used
- GET /v1.0/endpoint
- POST /v1.0/endpoint

### Authentication Requirements
- API key type
- Required permissions

### Data Flow
Brief description of how data moves

## Success Criteria
- [ ] Criteria 1
- [ ] Criteria 2

## Open Questions
- Unresolved decisions needing input
```

### LLM-Assisted Development Standards

When contributors use LLMs (Claude, etc.) to generate content, they must follow these standards:

#### Required Workflow

1. **Start with the PRD prompt** (see `_templates/llm-prompts/prd-generation.md`)
2. **Generate PRD** and submit for review
3. **After PRD approval**, use skill/command generation prompts
4. **Review all LLM output** before committing
5. **Test against actual API** when possible

#### PRD Generation Prompt

```markdown
# PRD Generation Prompt

You are helping create a PRD for an MSP Claude plugin. 

## Context
- Vendor: [vendor name]
- Product: [product name]
- Component: [what we're building]
- API Documentation: [link if available]

## Requirements
1. Follow the PRD template exactly
2. Be specific about API endpoints and data structures
3. Include realistic user stories from MSP workflows
4. Identify authentication and permission requirements
5. List explicit success criteria that can be tested

## Your Task
Generate a complete PRD for [description of what we're building].
Focus on practical MSP use cases and real-world workflows.

[Paste PRD template here]
```

#### Skill Generation Prompt

```markdown
# Skill Generation Prompt

You are creating a Claude skill for MSP tool integration.

## Approved PRD
[Paste the approved PRD]

## API Documentation
[Paste relevant API docs]

## Requirements
1. Follow SKILL.md format with proper frontmatter
2. Include practical examples from MSP workflows
3. Document API patterns with real endpoint examples
4. Cover error handling and edge cases
5. Use MSP-appropriate terminology

## Your Task
Generate a complete SKILL.md file that:
- Teaches Claude about this product/feature
- Includes working API examples
- Covers common MSP scenarios
- Handles errors gracefully
```

### Quality Checklist

Before submitting a PR, contributors must verify:

- [ ] PRD exists and is approved
- [ ] SKILL.md follows template structure
- [ ] Frontmatter includes accurate triggers
- [ ] API examples are validated against documentation
- [ ] No hardcoded credentials or sensitive data
- [ ] README.md updated with new capabilities
- [ ] Commands tested with actual API (if possible)

---

## Vendor Priority Roadmap

### Phase 1: Foundation (Kaseya Ecosystem)

**Why Kaseya First:**
- Most experience with Autotask API (py-autotask library exists)
- Well-documented REST API
- Large MSP market share

**Products:**
1. **Autotask PSA** — Tickets, CRM, Projects, Contracts, Time Entry
2. **IT Glue** — Documentation, passwords, configurations
3. **Datto RMM** — Device management, scripting, alerts

### Phase 2: ConnectWise Ecosystem

**Products:**
1. **ConnectWise Manage** — PSA equivalent to Autotask
2. **ConnectWise Automate** — RMM
3. **ConnectWise Control** — Remote access
4. **IT Boost** — Documentation (ConnectWise's IT Glue competitor)

### Phase 3: Emerging Vendors

**Products:**
1. **HaloPSA** — Growing PSA alternative
2. **NinjaOne** — Modern RMM with PSA capabilities
3. **Superops** — Unified PSA/RMM platform

### Phase 4: Specialized Tools

**Products:**
1. **Hudu** — Documentation platform
2. **Syncro** — Combined PSA/RMM
3. **Pulseway** — RMM
4. **Atera** — All-in-one MSP platform

---

## Community Building

### Getting Developer Access

For vendors where contributors don't have API access, we'll need to pursue:

1. **Partner/Developer Programs** — Many vendors offer free developer instances
2. **Community Outreach** — Reach out to vendors explaining the value
3. **API Documentation Mining** — Build skills from public documentation even without live access
4. **Sandbox Environments** — Request sandbox instances for testing

#### Template Email to Vendors

```
Subject: Developer API Access for Open-Source MSP AI Integration Project

Hi [Vendor] Team,

I'm part of an open-source community project building Claude AI plugins 
for MSP tools. Our goal is to help MSPs leverage AI to improve efficiency 
across their tool stack.

We're building a public, community-driven repository of plugins (similar 
to Anthropic's knowledge-work-plugins) specifically for MSP software.

We'd love to include [Product Name] in our marketplace, which would:
- Increase adoption and usage of your API
- Provide free community-maintained integrations
- Help your MSP customers improve productivity

Could you provide developer/sandbox API access for our contributors?

The project is open-source under Apache 2.0: [repo link]

Thank you,
[Name]
```

### Contributor Incentives

- **Recognition** — Contributors listed in plugin README and marketplace
- **Community Access** — Discord/Slack channel for contributors
- **Early Access** — Preview new features and provide feedback
- **Reference** — Plugins can link to contributor's company/profile

---

## Technical Considerations

### API Rate Limiting

Skills should include guidance on rate limits:
- Document known limits per vendor
- Include backoff strategies in skills
- Batch operations where supported

### Authentication Patterns

Each vendor uses different auth:

| Vendor | Auth Type | Notes |
|--------|-----------|-------|
| Autotask | API Key + Integration Code | Zone-specific endpoints |
| ConnectWise | Public/Private Key | Company ID required |
| IT Glue | API Key | Organization-based access |
| NinjaOne | OAuth 2.0 | Client credentials flow |
| HaloPSA | OAuth 2.0 | Multiple grant types |

### Data Privacy

- **No customer data in skills** — Examples use placeholder data only
- **No credentials in repo** — All auth via environment variables
- **Audit logging guidance** — Skills should mention logging considerations

---

## Success Metrics

### Adoption
- Number of GitHub stars/forks
- Plugin installation counts (if trackable)
- Community contributors (unique)

### Coverage
- Percentage of major MSP vendors with plugins
- Number of products per vendor
- Number of skills/commands per product

### Quality
- Issue/bug reports per plugin
- Time to resolve reported issues
- User feedback scores (if collected)

---

## Open Questions

1. **Governance** — How do we handle conflicting contributions for the same product?
2. **Versioning** — How do we handle API version changes from vendors?
3. **Testing** — Can we set up CI/CD to validate skill syntax?
4. **Hosting** — Personal GitHub vs. organization account?
5. **Naming** — Final repository name (msp-claude-plugins? claude-msp-marketplace?)

---

## Appendix A: Initial Kaseya/Autotask Skill Breakdown

### Tickets Module
- Ticket CRUD operations
- Queue management
- Status/Priority handling
- SLA tracking
- Ticket notes/attachments
- Time entries on tickets

### CRM Module
- Company management
- Contact management
- Site/location handling
- Contract associations
- Opportunity tracking

### Projects Module
- Project creation
- Task management
- Resource assignment
- Phase/milestone tracking
- Project billing

### Contracts Module
- Contract types (Recurring, T&M, Block Hours)
- Service level assignments
- Billing rules
- Contract renewals

### Service Desk
- Queue routing rules
- Escalation workflows
- Dashboard/reporting
- Dispatch calendar

---

## Appendix B: Related Resources

- [Anthropic knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins)
- [Anthropic claude-plugins-official](https://github.com/anthropics/claude-plugins-official)
- [Claude Skills Documentation](https://docs.anthropic.com/skills)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [py-autotask Library](https://github.com/[link-to-your-library])

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-04 | Aaron | Initial draft |
