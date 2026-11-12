# AGENTS.md — Guidance for AI Agents

This file provides guidance for AI coding agents (Claude Code, Codex, Gemini CLI, etc.) working in this repository.

## What This Repo Is

A collection of Claude Code plugins for MSP vendors — skills, commands, and MCP integrations for tools like Autotask, ConnectWise, NinjaOne, HaloPSA, SentinelOne, Huntress, and others. The intended users are MSP technicians running Claude Code day-to-day.

## Directory Structure

```
msp-claude-plugins/
├── <vendor>/
│   └── <product>/
│       ├── .claude-plugin/
│       │   └── plugin.json      # Plugin manifest
│       ├── skills/
│       │   └── <skill-name>/
│       │       ├── SKILL.md     # The skill itself (loaded by Claude Code)
│       │       └── REFERENCE.md # Optional: full param/field reference
│       ├── agents/
│       │   └── <agent-name>.md  # Persona-driven workflow agents
│       └── commands/
│           └── <command>.md     # Slash command definitions
├── _standards/                  # Quality standards — read before writing skills
├── _templates/                  # Templates for skills, agents, commands, plugins
├── shared/                      # Vendor-agnostic skills
└── CONTRIBUTING.md              # Contribution guidelines
```

## Writing Skills

Skills are Markdown files with YAML frontmatter. They are injected into Claude's context when triggered.

**SKILL.md structure:**

```markdown
---
name: kebab-case-skill-name
description: "Use when [specific trigger]. Covers [scope]."
metadata:
  version: "1.0.0"
  openclaw:
    requires:
      bins:
        - npx
---

# Skill Title

## Workflow
1. **Step** — what to do, what to check, what to do on failure

## Tools
### `tool_name`
Brief description. Required params. Common optional params.
**Example:** concrete JSON example

## Field Reference / Error Reference
Point to REFERENCE.md if the tables are long.
```

**Key rules:**
- `name` must be kebab-case
- `description` must start with "Use when..."
- Keep SKILL.md under ~150 lines; move verbose tables to REFERENCE.md
- Include concrete JSON examples, not just param lists
- Include error recovery steps in the workflow

## Writing Agents

Agents are persona-driven workflows that span multiple skills — incident triage, security posture review, user offboarding. Where a skill teaches Claude how a tool works, an agent teaches Claude how an MSP role uses a set of tools to get something done.

**Agent file structure:**

```markdown
---
name: agent-name
description: Use this agent when [MSP role] needs to [outcome]. Trigger for [scenarios]. Examples - "[prompt 1]", "[prompt 2]"
tools: ["Bash", "Read", "Write", "Glob", "Grep"]
model: inherit
---

You are an expert [role] for MSP environments using [vendor]. [Persona prose, 2-4 paragraphs.]

## Capabilities
- [Outcomes the agent produces]

## Approach
[5-10 lines of operational prose: defaults, thresholds, escalation triggers, edge cases.]
```

**The Approach section ships with a baseline.** Every agent in this repo includes substantive Approach prose authored from common MSP norms. It's defensible out of the box but **it is not the consuming MSP's practice**. When adopting a plugin into a working environment, treat the Approach as a starting point and edit it to match how the team actually operates: forwarding windows, mailbox conversion defaults, authorization tiers, two-person rules, escalation triggers, traversal order on portfolio sweeps. The [CIPP plugin agents](msp-claude-plugins/cipp/cipp/agents/) are the reference example.

**Key rules:**
- One persona per agent file
- Reference real MCP tool names in the body so Claude knows what to call
- Include 3–4 concrete example prompts in the description
- Document at least one explicit "stop and ask the human" scenario in Approach
- See [CONTRIBUTING.md](CONTRIBUTING.md#agent-development-guide) for the full guide and quality checklist

## Connectors

Every plugin maps to the Conduit connector(s) it documents in `connectors.json`, and CI (`scripts/check-connector-tools.mjs`) checks every documented tool name against `scripts/connector-tools.snapshot.json`. When you add a plugin, add its mapping and run `node scripts/check-connector-tools.mjs --write-readme`. Never document a tool that is not in the snapshot; refresh the snapshot instead if the connector really has it (see CONTRIBUTING.md, "Connector mapping").

## What Not to Do

- Do not add GitHub Actions or CI workflows unless explicitly asked
- Do not add third-party Actions from external organizations
- Do not modify `plugin.json` manifests without understanding the full plugin structure
- Do not add skills for vendors that already have a skill for the same domain — improve the existing one instead
- Do not commit API keys, even test ones

## Contribution Policy

Agents should not open PRs that:
- Install third-party tooling via GitHub Actions
- Were mass-generated across unrelated repos
- Primarily benefit the agent's vendor/organization rather than the users

See CONTRIBUTING.md for the full policy.
