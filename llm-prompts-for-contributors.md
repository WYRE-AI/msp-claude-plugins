# LLM Prompts for MSP Plugin Development

These prompts are designed to help contributors use Claude (or other LLMs) effectively when building plugins for the MSP Claude Plugin Marketplace. The workflow is always: **PRD → Approval → Development**.

---

## 1. PRD Generation Prompt

Use this prompt first. Nothing gets built without an approved PRD.

```markdown
You are helping create a Product Requirements Document (PRD) for an MSP Claude plugin.

## Context
- **Vendor**: [e.g., Kaseya, ConnectWise, HaloPSA]
- **Product**: [e.g., Autotask, Manage, IT Glue]
- **Component/Feature**: [e.g., ticket management, company CRM, documentation sync]
- **API Documentation**: [paste link or note if unavailable]

## Your Task
Generate a complete PRD following this exact structure:

---

# Plugin PRD: [Vendor]/[Product]/[Component]

## Summary
[One paragraph: What does this plugin enable? What MSP workflow does it improve?]

## Problem Statement
[What specific pain point does this solve for MSP technicians/engineers/managers?]

## User Stories
[3-5 user stories in format:]
- As a [service desk technician/engineer/PM], I want to [specific action] so that [measurable benefit]

## Functional Requirements

### Core Capabilities
[Numbered list of what the plugin MUST do]
1. 
2. 
3. 

### Nice-to-Have
[Capabilities that would be valuable but aren't required for v1]

## Technical Specification

### API Endpoints Required
[List specific endpoints with HTTP methods]
- `GET /v1.0/endpoint` - Description
- `POST /v1.0/endpoint` - Description

### Authentication
- **Type**: [API Key / OAuth 2.0 / etc.]
- **Required Credentials**: [list environment variables needed]
- **Permissions Needed**: [API scopes or access levels required]

### Data Structures
[Key entities and their important fields]

```json
{
  "example_entity": {
    "id": "integer",
    "name": "string",
    "important_field": "type"
  }
}
```

## Scope

### In Scope
- [Explicit list of what this plugin covers]

### Out of Scope
- [Explicit list of what this plugin does NOT cover]
- [Features deferred to future versions]

## Skills to Create
[List each SKILL.md file needed]
1. `skills/[name]/SKILL.md` - [brief description]
2. 

## Commands to Create
[List each slash command needed]
1. `/[vendor]:[command]` - [what it does]
2. 

## Success Criteria
[Testable criteria that define "done"]
- [ ] Criterion 1
- [ ] Criterion 2

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [risk] | Low/Med/High | Low/Med/High | [mitigation strategy] |

## Open Questions
[Decisions that need community/reviewer input]
1. 
2. 

---

## Requirements for Your Output
1. Be specific to MSP workflows - use real scenarios
2. Reference actual API endpoints if documentation is available
3. Keep scope tight for v1 - we can expand later
4. Include realistic error scenarios MSPs encounter
5. Use MSP terminology correctly (PSA, RMM, NOC, etc.)
```

---

## 2. Skill Generation Prompt

Use this ONLY after your PRD is approved.

```markdown
You are creating a Claude skill (SKILL.md) for an MSP tool integration.

## Approved PRD
[Paste your approved PRD here]

## API Documentation
[Paste relevant API documentation sections, or describe what's available]

## Existing Skills for Reference
[If other skills exist in this product, note their patterns]

## Your Task
Generate a complete SKILL.md file following this structure:

---

```markdown
---
name: "[Vendor] [Topic]"
when_to_use: >-
  When [specific action or scenario]. Use when: [keyword phrase 1],
  [keyword phrase 2], or [keyword phrase 3 - fold in 5-10 realistic
  trigger phrases MSP techs would use].
description: >
  [2-3 sentences describing when Claude should use this skill. Be specific 
  about the product, feature, and types of tasks this enables. Do NOT add
  a separate triggers: list or vendor/product/api_version keys - only
  name, description, and when_to_use are recognized.]
---

# [Skill Title]

## Overview

[2-3 paragraphs explaining what this skill covers, why it matters for MSPs, 
and how it fits into typical MSP workflows.]

## Key Concepts

### [Concept 1]
[Explanation with MSP context]

### [Concept 2]
[Explanation with MSP context]

## Data Model

### [Primary Entity]

| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| id | integer | Unique identifier | Read-only |
| name | string | Display name | Required |
| ... | ... | ... | ... |

## API Patterns

### [Operation 1: e.g., "Creating a Record"]

**Endpoint**: `POST /v1.0/[resource]`

**Request**:
```json
{
  "field1": "value",
  "field2": 123
}
```

**Response**:
```json
{
  "itemId": 12345,
  "...": "..."
}
```

**Common Errors**:
- `400 Bad Request` - [when this happens and how to fix]
- `403 Forbidden` - [permission issue resolution]

### [Operation 2: e.g., "Searching Records"]

[Same pattern as above]

## Common Workflows

### [Workflow 1: e.g., "Ticket Triage"]

1. [Step 1 with context]
2. [Step 2]
3. [Step 3]

**Example scenario**: [Real MSP situation where this workflow applies]

### [Workflow 2]

[Same pattern]

## Best Practices

- [Practice 1 specific to this product/feature]
- [Practice 2]
- [Practice 3]

## Gotchas & Edge Cases

- **[Issue 1]**: [Description and workaround]
- **[Issue 2]**: [Description and workaround]

## Related Skills

- `[vendor]/[product]/[other-skill]` - [how it relates]

## References

- [Official API Documentation](link)
- [Vendor Knowledge Base](link)
```

---

## Requirements for Your Output
1. Follow the SKILL.md format exactly, including frontmatter
2. Include 5-10 realistic trigger phrases MSP technicians would actually say
3. Use real API endpoints and data structures from the documentation
4. Include common error scenarios and how to handle them
5. Write workflows that reflect actual MSP day-to-day operations
6. Don't invent API details - mark unknowns with [NEEDS VERIFICATION]
```

---

## 3. Command Generation Prompt

Use this for creating slash commands after PRD approval.

```markdown
You are creating a Claude slash command for an MSP tool integration.

## Approved PRD
[Paste the relevant section of your approved PRD]

## Related Skill
[Paste or reference the SKILL.md this command uses]

## Your Task
Generate a complete command markdown file:

---

```markdown
---
description: [One-line description of what this command does]
argument-hint: "<arg1> [arg2]"
arguments: [arg1, arg2]
---

# [Command Title]

## Purpose

[1-2 paragraphs explaining what this command does and when an MSP tech 
would use it]

## Prerequisites

- [Required configuration, e.g., "API credentials configured"]
- [Required permissions, e.g., "Ticket create access in Autotask"]
- [Other requirements]

## Arguments

### `[arg1]` (required)
[Detailed description of what this accepts and how to use it]

### `[arg2]` (optional)
[Detailed description, including default behavior if not provided]

## Execution Steps

1. **Validate inputs**
   - [What validation happens]
   
2. **[Main action]**
   - [What the command does]
   
3. **Return results**
   - [What the user sees]

## Examples

### Basic Usage
```
/[vendor]:[command] "Acme Corp" "Server offline"
```
[Expected result]

### With All Options
```
/[vendor]:[command] "Acme Corp" "Server offline" --priority high --queue "Emergency"
```
[Expected result]

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| "Company not found" | No matching company | Suggest similar names |
| "Unauthorized" | Missing API credentials | Check configuration |

## Related Commands

- `/[vendor]:[related-command]` - [how it relates]
```

---

## Requirements for Your Output
1. Keep commands focused on a single action
2. Make argument names intuitive for MSP technicians
3. Include realistic examples with MSP-appropriate data
4. Document all error scenarios the command might encounter
5. Follow the exact markdown frontmatter format
```

---

## 4. Review Checklist Prompt

Use this to validate your work before submitting a PR.

```markdown
Review this [PRD/Skill/Command] against the MSP Claude Plugin Marketplace 
quality standards:

[Paste your content here]

## Check Against These Criteria

### PRD Review
- [ ] Summary clearly states the MSP problem being solved
- [ ] User stories are from real MSP personas (tech, engineer, PM)
- [ ] API endpoints are accurate or marked as needing verification
- [ ] Scope is clear about what's included and excluded
- [ ] Success criteria are testable
- [ ] No scope creep - focused on one thing done well

### Skill Review
- [ ] Frontmatter description triggers appropriately
- [ ] Trigger phrases are realistic MSP language
- [ ] API patterns match official documentation
- [ ] Error handling covers common scenarios
- [ ] Workflows reflect actual MSP operations
- [ ] No hardcoded credentials or customer data
- [ ] Related skills are correctly referenced

### Command Review
- [ ] Command name follows convention: /[vendor]:[action]
- [ ] Arguments are intuitive and well-documented
- [ ] Examples use realistic MSP scenarios
- [ ] Error messages are actionable
- [ ] Prerequisites are clearly stated

## Your Task
Identify any issues and suggest specific fixes.
```

---

## Usage Guidelines

### Do's
- ✅ Start with the PRD prompt for ANY new development
- ✅ Paste actual API documentation when available
- ✅ Review LLM output carefully before committing
- ✅ Test against real APIs when you have access
- ✅ Mark uncertain information with [NEEDS VERIFICATION]

### Don'ts
- ❌ Skip the PRD step
- ❌ Commit LLM output without review
- ❌ Invent API details that aren't in documentation
- ❌ Include real customer data in examples
- ❌ Hardcode credentials or sensitive information

---

## Workflow Summary

```
1. PRD Generation Prompt
        ↓
   Submit PRD for Review
        ↓
   Address Feedback
        ↓
   PRD Approved ✓
        ↓
2. Skill Generation Prompt(s)
        ↓
3. Command Generation Prompt(s)
        ↓
4. Review Checklist Prompt
        ↓
   Submit PR
```
