---
name: "Refresh Quote List"
description: >
  Turns a Refresh Cycle Planning calendar into a per-client list of
  devices to quote, then hands off to the existing ScalePad Quoter,
  ConnectWise CPQ, or Kaseya Quote Manager quotes skills. Drafts the
  list only, using read-only catalog and quote tools, and never creates,
  updates, or publishes a quote.
when_to_use: >-
  When a hardware refresh calendar is ready and the MSP needs a
  per-client list of devices to quote, ready to hand to a quoting skill,
  without creating the quote in this step. Use when: refresh quote list,
  hardware refresh quote list, devices to quote for refresh, turn the
  refresh calendar into a quote list, refresh procurement list.
---

# Refresh Quote List

## Overview

Refresh Cycle Planning already produces a tiered calendar. This companion
skill takes that calendar (or the same warranty, EOL/EOS, and age inputs
when a calendar was just built) and drafts a per-client list of devices
to quote, matched against a connected quoting catalog when one exists.

This skill does not replace Refresh Cycle Planning, and it does not
create quotes. The operator hands the list to `scalepad-quoter`,
`connectwise-cpq-quotes`, or `kaseya-quote-manager-quotes` if they want a
quote built.

Do not invent catalog items or prices. If a catalog tool returns an
amount, you may carry that amount through as returned and label the
source. If it does not, list the device and the catalog match (name or
SKU) without an amount.

## Anti-triggers

- **Building the refresh calendar itself** (tiers, dates, and
  insufficient-data bucketing): use
  [Refresh Cycle Planning](../refresh-cycle-planning/SKILL.md).
- **Creating, updating, or publishing a quote:** use `scalepad-quoter`,
  `connectwise-cpq-quotes`, or `kaseya-quote-manager-quotes`. This skill
  stops at the list.
- **ScalePad Lifecycle Manager roadmaps:** use
  `scalepad-lifecycle-manager`.

## Connected Systems

| System | Role | Required? |
|--------|------|-----------|
| Refresh Cycle Planning output, or the RMM inventory that skill uses | The devices, tiers, and timing to quote | Yes |
| ScalePad Quoter, ConnectWise CPQ, or Kaseya Quote Manager | Read-only catalog and existing-quote context for matching items | Optional |

If no quoting connector is connected, still produce the per-client device
list from the calendar, and say a catalog-backed quote list could not be
drafted.

## Workflow

### Step 1: Discover what is actually connected

Call `conduit__search_tools` first. Use the exact names discovery returns.
Gateway names often look like `<vendor-slug>__<tool_name>`.

If a refresh calendar is not already in hand, follow
[Refresh Cycle Planning](../refresh-cycle-planning/SKILL.md) to build
one, then continue here. Do not restate that skill's RMM tool list.

Only call read-only list, get, or search tools from the allow-list
below. Never create, update, publish, delete, or authenticate-for-write.

**ScalePad Quoter (read-only):** `scalepad_quoter_items_list`,
`scalepad_quoter_items_get`, `scalepad_quoter_quotes_get`. There is no
`scalepad_quoter_quotes_list` tool in the current GOVERNANCE surface;
use `scalepad_quoter_quotes_get` only when an existing quote id is
already known. Never call `scalepad_quoter_items_update`,
`scalepad_quoter_quotes_publish`, `scalepad_quoter_auth_authorize`, or
`scalepad_quoter_auth_refresh`.

**ConnectWise CPQ (read-only):** `cpq_search_quotes`, `cpq_get_quote`,
`cpq_get_quote_versions`, `cpq_search_quote_items`, `cpq_get_quote_item`,
`cpq_search_quote_tabs`, `cpq_list_quote_customers`,
`cpq_list_quote_terms`, `cpq_list_templates`, `cpq_list_tax_codes`,
`cpq_list_users`, `cpq_list_recurring_revenues`, `cpq_test_connection`.
Never call `cpq_create_quote_from_template`, `cpq_create_quote_item`,
`cpq_create_quote_term`, or any update or delete CPQ tool.

**Kaseya Quote Manager (read-only):** `kqm_product_list`,
`kqm_product_get`, `kqm_category_list`, `kqm_category_get`,
`kqm_quote_list`, `kqm_quote_get`, `kqm_quote_line_list`,
`kqm_quote_line_get`, `kqm_quote_section_list`, `kqm_quote_section_get`,
`kqm_customer_list`, `kqm_customer_get`. Never create or update quotes,
products, or orders.

If a vendor is connected but the needed tool is not in this list, skip
that catalog and say so.

### Step 2: Build the per-client device list

From the refresh calendar, group devices by client. Stay with
replace-now and plan-this-year tiers unless the operator asks to include
monitor-tier items. Keep the insufficient-data bucket as a separate
list: those devices are not quote-ready until the calendar gaps are
filled.

For each device, carry forward make, model, quantity, tier, and target
window as the calendar provided them. Do not invent a replacement model
if the calendar did not specify one.

### Step 3: Match a catalog when one is connected

If a quoting connector is connected, search its catalog (items,
products, or templates) for a reasonable match to each replacement.
Record:

- The catalog name or SKU as returned
- The tool that returned it
- An amount only if the tool actually returned one, copied as-is, with
  no currency conversion and no "typical street price" fill-in
- "No catalog match" when nothing suitable was returned

Existing quotes (`cpq_search_quotes`, `kqm_quote_list`, or
`scalepad_quoter_quotes_get` for a known id) may be cited as prior
context ("an earlier quote already includes this SKU") but must not be
modified.

### Step 4: Draft the list and hand off

Produce a per-client list:

1. Client
2. Tier and target window
3. Devices and quantities
4. Catalog match or "no catalog match"
5. Amounts only when returned by a catalog tool, otherwise omitted
6. A handoff line naming the quoting skill to use next
   (`scalepad-quoter`, `connectwise-cpq-quotes`, or
   `kaseya-quote-manager-quotes`), and stating that this skill did not
   create a quote

If no quoting connector was connected, omit catalog columns and say the
operator will need one of those skills, plus a connected quoter, to
build a quote.

## Error Handling

### No refresh calendar and no inventory

Stop and ask to run Refresh Cycle Planning first, or to name the client
and window.

### Catalog search returns prices you did not request

You may include a returned amount as data, labeled with its source. Do
not format a quote, do not total a made-up margin, and do not invent
list prices for unmatched rows.

### Several quoting tools are connected

Ask which catalog to match against, or run each separately and label the
source, rather than silently merging them.

## Best Practices

- One client section at a time if the calendar is large.
- Keep monitor-tier and insufficient-data devices visible, but out of
  the quote-ready list.
- Oxford commas, and no em dashes.

## Related Skills

- [Refresh Cycle Planning](../refresh-cycle-planning/SKILL.md) produces
  the calendar this skill consumes.
- [Warranty Tracking](../warranty-tracking/SKILL.md) and
  [EOL/EOS Flagging](../eol-eos-flagging/SKILL.md) feed that calendar.
- `scalepad-quoter`, `connectwise-cpq-quotes`, and
  `kaseya-quote-manager-quotes` are the handoff targets for actually
  building a quote.
