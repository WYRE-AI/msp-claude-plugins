---
name: "<Role> Tool Map"
description: >
  Maps abstract <role> operations to concrete Conduit tool names per curated
  vendor, for use by advanced-workflow skills that need <role> access.
when_to_use: >-
  Fetched by another skill in this plugin, never used standalone. Use when:
  <role> tool names, <role> vendor gotchas.
---

## Curated vendors

This role is curated for every vendor `agent-routine-catalog.astro` lists with
an Archetype-A or -B agent for this job (not a fixed top-N — read the catalog,
list what it actually shows): <vendor 1>, <vendor 2>[, <vendor 3>, ...]. Each
row's tool names are verified against that vendor's real subagent file
(`<plugin>/<plugin>/agents/<agent-name>.md`), never invented. A connected
vendor the catalog doesn't cover at all needs guided discovery: inspect the
org's available tools for this connector, reason from naming and shape, and
tell the human this vendor isn't fully vetted yet — don't present it as
equally reliable.

## Operation map

| Abstract operation | <Vendor 1> tool | <Vendor 2> tool | <Vendor 3> tool |
|---|---|---|---|
| <op 1> | `<tool>` | `<tool>` | `<tool>` |

## Vendor-specific gotchas

### <Vendor 1>
- <gotcha>

### <Vendor 2>
- <gotcha>
