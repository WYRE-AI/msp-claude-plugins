---
name: "<Workflow Name>"
description: >
  <One or two sentences: what this workflow does and what it produces.>
when_to_use: >-
  Use when [specific trigger]. Use when: keyword one, keyword two, keyword three.
---

## What this does

<1 paragraph, generalized to role language — never name one vendor as if it's the only option.>

## Source

<Which msp-claude-plugins subagent(s) + plugin(s) this generalizes, per `agent-routine-catalog.astro` — e.g. "Generalizes the `ticket-dispatcher` agent (autotask, Archetype B) plus the equivalent triage-shaped agents the catalog lists for other connected PSAs." If this workflow has no catalog entry (i.e. it's one of the 3 conduit-only workflows with no msp-claude-plugins precedent), say so explicitly instead of inventing a provenance.>

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| **A connected <role> connector** | One of: <curated vendor list for this role>. See the `<role>-tool-map` skill for the exact tool names once connected. |
| **A connected chat-delivery connector** | Slack (shipped) or Microsoft Teams (blocked — see `chat-delivery-adapters`). |

## Detecting the customer's stack

1. Check which <role> vendor is connected (via the org's active Conduit vendor connections). If more than one match, ask the human which to use. If none, tell the human what's needed — never guess, never fail silently.
2. Fetch `skill://advanced-workflows/<role>-tool-map/SKILL.md` for that vendor's concrete tool names and gotchas.
3. Fetch `skill://advanced-workflows/chat-delivery-adapters/SKILL.md` for the connected delivery target's adapter contract.

## Run it now

<The routine prompt's logic, generalized: numbered steps using the abstract operation names from the tool-map skill (e.g. "list new tickets," not a hardcoded tool name), executed immediately as a one-off in the current conversation.>

## Set up as a recurring routine

<The existing "build prompt" content, reworded to first person / imperative — this skill's own instructions for creating a Claude-managed scheduled routine, not "paste this to Claude" copy-paste framing.>

## Known gotchas

<Platform-level gotchas only (e.g. one-hour minimum routine cadence, permitted_tools must be populated per connector). Vendor-specific gotchas live in the tool-map skill instead.>

## How it works

<Idempotency / failure-escalation rationale, kept from the source doc.>

## Extending it

<What's deliberately out of scope and how to extend, kept from the source doc.>
