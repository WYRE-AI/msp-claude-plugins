# Contributing to MSP Claude Plugins

Thank you for your interest in contributing to MSP Claude Plugins! This guide covers everything from quick fixes to building new platform plugins.

## Table of Contents

- [Contribution Tiers](#contribution-tiers)
- [Getting Started](#getting-started)
- [Development Environment Setup](#development-environment-setup)
- [Skill Development Guide](#skill-development-guide)
- [Command Development Guide](#command-development-guide)
- [Agent Development Guide](#agent-development-guide)
- [MCP Server Integration Guide](#mcp-server-integration-guide)
- [Testing Requirements](#testing-requirements)
- [Style Guide](#style-guide)
- [Pull Request Process](#pull-request-process)
- [Getting Help](#getting-help)

---

## Contribution Tiers

Not every change needs a PRD. We use a tiered system so the process matches the scope of the work.

### Tier 1 — Quick Fixes (no PRD needed)

Just fork, branch, and open a PR.

**Examples:**
- Typo fixes in skills or documentation
- Field mapping corrections (wrong status codes, incorrect enum values)
- Bug fixes in existing commands
- Error message improvements
- README updates

### Tier 2 — Feature Enhancements (lightweight proposal)

Open a [Feature Enhancement issue](https://github.com/wyre-technology/msp-claude-plugins/issues/new?template=feature-enhancement.yml) describing what you want to add. Get a maintainer thumbs-up, then submit a PR.

**Examples:**
- New commands for existing plugins
- New skill files for existing plugins
- Expanded MCP server coverage (new tools/endpoints)
- Significant changes to existing behavior

### Tier 3 — New Platforms (full PRD)

Building a plugin for a vendor we don't support yet? Submit a PRD first.

1. Copy the template from `_templates/plugin-prd-template.md`
2. Fill it out and submit as a PR with `[PRD]` prefix
3. Get community review and maintainer approval
4. Implement once approved

**PRD Requirements Checklist:**

- [ ] Problem statement
- [ ] At least 3 user stories
- [ ] Scope (in/out)
- [ ] API research with links to vendor docs
- [ ] Technical approach
- [ ] Success criteria
- [ ] Security considerations (credential handling)
- [ ] Testing plan

---

## Getting Started

### Prerequisites

| Requirement | Description |
|-------------|-------------|
| GitHub Account | For forking and submitting PRs |
| Git | Version control |
| Text Editor | VS Code recommended with Markdown preview |
| MSP Knowledge | Understanding of PSA/RMM workflows |
| API Documentation | Access to vendor API docs you're targeting |
| (Optional) API Access | For testing against live APIs |

### Fork and Clone

```bash
# 1. Fork the repository via GitHub UI (click Fork button)

# 2. Clone your fork
git clone https://github.com/YOUR-USERNAME/msp-claude-plugins.git
cd msp-claude-plugins

# 3. Add upstream remote for syncing
git remote add upstream https://github.com/wyre-technology/msp-claude-plugins.git

# 4. Verify remotes
git remote -v
```

### Syncing Your Fork

```bash
# Before starting new work, sync with upstream
git checkout main
git fetch upstream
git merge upstream/main
git push origin main
```

---

## Development Environment Setup

### Directory Structure

```
msp-claude-plugins/
├── _standards/              # Quality standards (read first!)
├── _templates/              # Templates for all contributions
├── kaseya/                  # Kaseya vendor plugins
│   └── autotask/           # Reference implementation
├── connectwise/             # ConnectWise vendor plugins
├── shared/                  # Vendor-agnostic skills
└── docs/                    # Documentation site
```

### Recommended Tools

| Tool | Purpose | Installation |
|------|---------|--------------|
| VS Code | Editor with Markdown preview | https://code.visualstudio.com |
| Markdown All in One | VS Code extension | VS Code marketplace |
| YAML | VS Code extension for frontmatter | VS Code marketplace |
| REST Client | API testing | Thunder Client extension |
| Claude Code | Testing plugins locally | https://claude.ai/code |

### Environment Variables

When testing MCP integrations, configure these environment variables:

```bash
# Autotask
export AUTOTASK_USERNAME="your-api-user@domain.com"
export AUTOTASK_INTEGRATION_CODE="YOUR_INTEGRATION_CODE"
export AUTOTASK_SECRET="YOUR_SECRET"

# ConnectWise
export CW_COMPANY_ID="your-company"
export CW_PUBLIC_KEY="your-public-key"
export CW_PRIVATE_KEY="your-private-key"
export CW_CLIENT_ID="your-client-id"

# Never commit these values!
```

---

## Skill Development Guide

Skills provide domain knowledge that Claude can reference when helping users.

### Skill File Location

```
vendor/product/skills/skill-name/SKILL.md
```

### Skill Template Structure

```markdown
---
name: "[Vendor] [Topic]"
description: >
  [What this skill covers — entities, API surface, workflows, gotchas.
  One clear statement of coverage; don't restate when_to_use.]
when_to_use: >-
  When [specific action or scenario]. Use when: trigger phrase 1,
  trigger phrase 2, or trigger phrase 3.
---

# Skill Title

## Overview
[One short paragraph: what this domain is and what an MSP does with it]

## Key Concepts
[Entities, relationships, terminology; compact tables for enums/status codes]

## Common Workflows
[Step-by-step guides with decision points and ordering constraints]

## API Patterns
[The request shapes that aren't guessable — auth quirks, pagination
casing, filter syntax]

## Gotchas
[Non-obvious behavior: rate limits, case-sensitive parameters, errors
whose messages mislead. Cause and resolution for each]
```

**Context-engineering rules** (see `_templates/skill-template/SKILL.md`
and `_standards/skill-quality-checklist.md`):

- `description` and `when_to_use` have distinct jobs — coverage vs.
  trigger conditions. Don't duplicate content between them; never add a
  `triggers:` list.
- Keep SKILL.md under ~350 lines. Move exhaustive reference material
  (full field tables, complete error catalogs, long request/response
  examples) into `references/*.md` in the skill directory and link it
  from the relevant section.
- State each instruction once. Skip sections that would only hold
  generic filler — a skill with three real gotchas beats one with eight
  boilerplate sections.

### Example: Learning from Existing Skills

Study the Autotask tickets skill as a reference:

**File:** `kaseya/autotask/skills/tickets/SKILL.md`

**Key elements to note:**

1. **Frontmatter trigger phrases** - Multiple relevant keywords folded into `when_to_use`/`description`
2. **Status Code Tables** - Clear reference data
3. **Business Logic Code** - Practical validation examples
4. **API Examples** - Real request/response patterns

### Skill Quality Checklist

Before submitting a skill, verify:

- [ ] `when_to_use` carries accurate, comprehensive trigger phrases;
      `description` states coverage — no duplication, no `triggers:` list
- [ ] SKILL.md is under ~350 lines; long reference material split into
      linked `references/*.md` files
- [ ] Overview explains the domain clearly
- [ ] Status codes/enums have complete tables
- [ ] API examples use realistic (but fake) data
- [ ] No hardcoded credentials
- [ ] Errors documented with cause and resolution
- [ ] No generic filler; each instruction stated once
- [ ] Links to related skills and reference files resolve

The full checklist lives in `msp-claude-plugins/_standards/skill-quality-checklist.md`.

---

## Command Development Guide

Commands provide slash-command shortcuts for common operations.

### Command File Location

```
vendor/product/commands/command-name.md
```

### Command Template Structure

```markdown
---
description: Brief description of what this command does
argument-hint: "<required-arg> [optional-arg]"
arguments: [required-arg, optional-arg]
---

# Command Title

Brief description of the command's purpose.

## Arguments

- `required-arg` (required) — Description of this argument
- `optional-arg` (optional; default: `10`) — Description of optional argument

## Prerequisites
- List of requirements before using this command
- API credentials configured
- Permissions needed

## Steps
1. **Step title** - Description
   - Sub-step details
   - API calls made

## Examples

### Basic Usage
```
/command-name "required value"
```

### With Options
```
/command-name "value" --option1 "something" --option2 123
```

## Output

### Success
```
Operation completed
Details...
```

### Error Handling
| Error | Resolution |
|-------|------------|
| Not found | Verify ID exists |
| Unauthorized | Check credentials |

## Related Commands
- `/other-command` - Description
```

### Command Best Practices

1. **Keep names short and memorable** - `/create-ticket` not `/create-new-service-ticket`
2. **Use intuitive arguments** - First argument should be most important
3. **Provide sensible defaults** - Optional args should have good defaults
4. **Show progress** - Include output examples showing success/failure
5. **Handle errors gracefully** - Document common errors and fixes

---

## Agent Development Guide

Agents are persona-driven workflows for higher-level tasks that span multiple skills. Where a skill teaches Claude *how a tool works*, an agent teaches Claude *how an MSP role uses a set of tools to get something done* — incident triage, security posture review, client onboarding validation, user offboarding.

Use a skill when the unit is a tool or category. Use an agent when the unit is a recurring MSP workflow with judgment calls, sequencing rules, and decision trees.

### Agent File Location

```
vendor/product/agents/agent-name.md
```

One agent per file. Two to four agents per plugin is typical — more than that usually means some should be skills or commands instead.

### Agent Template Structure

```markdown
---
name: agent-name
description: Use this agent when [MSP role] needs to [outcome]. Trigger for [scenarios]. Examples - "[example prompt 1]", "[example prompt 2]"
tools: ["Bash", "Read", "Write", "Glob", "Grep"]
model: inherit
---

You are an expert [role] for MSP environments using [vendor/platform]. Your role is [one-sentence purpose]. [2-3 sentences on when this work matters and what makes it different from generic vendor usage.]

[2-4 paragraphs walking through how the agent reasons: what it pulls first, what
signals matter most, how it sequences actions, what it reports out. This is
prose — not a step list. Reference the actual MCP tool names when describing
specific actions.]

## Capabilities

- [What this agent can do, one bullet per capability]

## Approach

[5-10 lines of operational prose: defaults, thresholds, escalation triggers,
authorization tiers, edge cases. This is where MSP practice lives — the
difference between a generic agent and one that reflects how *your* MSP runs
the workflow.]
```

### The Approach Section — and Why It Ships With a Baseline

Every agent ends with an **Approach** section that encodes the operator's lived practice: default forwarding windows, escalation thresholds, two-person rules, finding-vs-noise filters, traversal order on portfolio sweeps. This is what separates an agent that's actually useful from one that gives generic SOC playbook prose.

The plugins in this repo ship with a **baseline Approach** authored from common MSP norms — it's defensible out of the box but **not your practice**. When you adopt a plugin into a working MSP environment, treat the baseline Approach as a starting point and edit it to match how your team actually operates.

**Common places to customize:**

- **Forwarding/retention windows** (30 / 60 / 90 / indefinite — different MSPs land in different places)
- **Mailbox conversion defaults** (always shared? archive after N days? size-based?)
- **Authorization tiers** (when does the ticket alone authorize action vs. require explicit written confirmation?)
- **Two-person rule scope** (admins only? heavy delegates? litigation hold?)
- **Escalation triggers** (which findings warrant same-day client contact vs. monthly review?)
- **Traversal order on sweeps** (newest tenants first? highest-revenue? most-at-risk?)

Use the [CIPP plugin](msp-claude-plugins/cipp/cipp/agents/) as the reference: both `security-posture-reviewer` and `user-offboarding-runner` ship with substantive baseline Approach prose covering each of the above. Read those, then adapt to your MSP. The skills and `Capabilities` lists rarely need editing across MSPs; the **Approach** is where local practice lives.

### Agent Best Practices

1. **One persona per agent** — don't combine "incident responder" and "compliance auditor" into one file
2. **Reference real MCP tool names** in the body so Claude knows what to call (e.g., `cipp_list_users`, `huntress_incidents_list`)
3. **Capabilities lists describe outcomes, not API calls** — write what the agent *does*, not what it *runs*
4. **Approach is prose, not a checklist** — the agent reasons from this; nested numbered procedures belong in commands
5. **Examples in the description matter** — Claude uses them to decide when to invoke the agent; include 3–4 concrete prompts
6. **Frontmatter `tools` should be minimal** — most agents only need `Bash, Read, Write, Glob, Grep`; add others only when justified
7. **Document escalation paths** — when does the agent stop and require human decision? when does it call out a manual step that's outside MCP scope?

### Agent Quality Checklist

Before submitting:

- [ ] Description leads with the MSP role (technician, dispatcher, security lead, etc.)
- [ ] Description includes 3–4 example prompts a user might type
- [ ] Body prose references at least 3 specific MCP tool names from the plugin
- [ ] Capabilities list has 5–10 bullets, outcome-focused
- [ ] Approach section is filled in (not a TODO) and addresses defaults, escalation, edge cases
- [ ] Approach prose covers at least one explicit "when to stop and ask" scenario
- [ ] No hard-coded tenant IDs, client names, or environment-specific paths

---

## MCP Server Integration Guide

MCP (Model Context Protocol) enables direct API connectivity from Claude.

### MCP Configuration File

Create `.mcp.json` in your plugin root:

```json
{
  "mcpServers": {
    "vendor-product": {
      "command": "npx",
      "args": ["-y", "@vendor/mcp-server-product"],
      "env": {
        "API_USERNAME": "${VENDOR_USERNAME}",
        "API_KEY": "${VENDOR_API_KEY}"
      }
    }
  }
}
```

### Environment Variable References

- Use `${VARIABLE_NAME}` syntax for environment variables
- Document all required variables in README.md
- Never hardcode credentials

### Testing MCP Integration

```bash
# 1. Set environment variables
export VENDOR_USERNAME="test-user"
export VENDOR_API_KEY="test-key"

# 2. Start Claude Code with plugin
cd vendor/product
claude --plugin .

# 3. Test MCP tools
# Claude should have access to vendor API tools
```

### MCP Server Development

If creating a new MCP server:

1. Follow [MCP specification](https://modelcontextprotocol.io/)
2. Publish to npm as `@vendor/mcp-server-product`
3. Document all available tools
4. Include authentication guidance
5. Handle rate limiting appropriately

---

## Testing Requirements

### Manual Testing Checklist

| Test | Description | Required |
|------|-------------|----------|
| Skill Activation | Verify the `when_to_use`/`description` phrasing activates the skill | Yes |
| API Examples | Validate against actual API docs | Yes |
| Command Arguments | Test all argument combinations | Yes |
| Error Cases | Verify error messages are helpful | Yes |
| MCP Connection | Test MCP server connectivity | If MCP |

### Testing Against Live API

When you have API access:

```bash
# 1. Configure credentials
export VENDOR_API_KEY="your-key"

# 2. Use REST client to test examples
# Verify all API examples in skills actually work

# 3. Document any discrepancies
# Update skill if API behavior differs from docs
```

### Testing Without API Access

If you don't have API access:

1. Build from official API documentation
2. Mark contribution as "Documentation-based, untested"
3. Add note in PR requesting community testing
4. Look for community members with API access

---

## Style Guide

### Markdown Formatting

| Element | Style |
|---------|-------|
| Headers | Use ATX style (`#`, `##`, `###`) |
| Lists | Use `-` for unordered, `1.` for ordered |
| Code | Use fenced code blocks with language |
| Tables | Use pipes with header separator |
| Links | Use reference-style for repeated links |

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Skill directories | kebab-case | `time-entries/` |
| Command files | kebab-case | `create-ticket.md` |
| Plugin names | kebab-case | `autotask-psa` |
| Environment vars | SCREAMING_SNAKE_CASE | `AUTOTASK_API_KEY` |

### API Example Standards

```json
// Good - uses generic IDs and realistic structure
{
  "companyID": 12345,
  "title": "Email not working",
  "priority": 2,
  "status": 1
}

// Bad - uses real data
{
  "companyID": 987654321,
  "title": "Fix John's email",
  "contactEmail": "john@realcompany.com"
}
```

### Documentation Language

- Use active voice
- Be concise but complete
- Define acronyms on first use
- Include examples for complex concepts
- Write for MSP technicians (not developers)

---

## Pull Request Process

### What We Don't Accept

**Automated or spam PRs will be closed without review.**

We occasionally receive mass-generated PRs from vendors or tooling companies that run automated scripts against repos with certain file patterns. These are easy to spot: they reference a scoring system, include a workflow that installs the vendor's own GitHub Action, and often `@mention` maintainers who aren't repo owners.

If your PR:
- Installs a third-party GitHub Action from your own organization
- Was generated by running a tool across many unrelated repos
- Primarily promotes or integrates your company's product

...it will be closed. Genuine quality improvements to skills or documentation are always welcome — just drop the self-serving extras.

### Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

| Type | Use Case |
|------|----------|
| `feat` | New feature (skill, command, plugin) |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code restructuring |
| `test` | Adding tests |
| `chore` | Maintenance tasks |

### PR Title Format

| Type | Format | Example |
|------|--------|---------|
| PRD | `[PRD] scope` | `[PRD] autotask/time-entries` |
| Feature | `feat(scope): description` | `feat(autotask): Add time entries skill` |
| Fix | `fix(scope): description` | `fix(autotask): Correct status codes` |
| Docs | `docs(scope): description` | `docs(readme): Add examples` |

### Review Process

1. **Automated Checks** - Formatting, links, structure
2. **Peer Review** - At least 1 approval required
3. **Maintainer Review** - For significant changes
4. **Community Testing** - For untested contributions

---

## Getting Help

| Channel | Use Case |
|---------|----------|
| [GitHub Issues](https://github.com/wyre-technology/msp-claude-plugins/issues) | Bug reports, feature requests |
| [GitHub Discussions](https://github.com/wyre-technology/msp-claude-plugins/discussions) | Questions, ideas, community chat |
| PR Comments | Code review, implementation questions |

### Getting API Access

If you need API access for testing:

1. **Vendor Partner Programs** - Many vendors have free partner/developer tiers
2. **Sandbox Environments** - Ask vendor for test environment
3. **Community Help** - Post in discussions asking for testing help
4. **Documentation-Based** - Build from docs, mark as untested

### New to Contributing?

Look for issues labeled:
- `good-first-issue` - Great starting points
- `help-wanted` - Community help needed
- `documentation` - Lower barrier to entry

---

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

We are committed to providing a welcoming and inclusive environment for all contributors regardless of background, identity, or experience level.

---

<p align="center">
  <strong>Questions?</strong> Open an issue or start a discussion.
  <br>
  <a href="https://github.com/wyre-technology/msp-claude-plugins/issues">Issues</a> &bull;
  <a href="https://github.com/wyre-technology/msp-claude-plugins/discussions">Discussions</a>
</p>
