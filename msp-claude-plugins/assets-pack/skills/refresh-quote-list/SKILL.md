---
name: "Refresh Quote List"
description: >
  Turns a Refresh Cycle Planning calendar into a per-client list of
  devices to quote, matched against a connected ScalePad Quoter, Kaseya
  Quote Manager, or ConnectWise PSA product catalog, then hands off to a
  quoting skill. Drafts the list only, using read-only catalog and quote
  tools, and never creates, updates, or publishes a quote.
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
to quote, matched against a connected product catalog when one exists.

This skill does not replace Refresh Cycle Planning, and it does not
create quotes. The operator hands the list to `scalepad-quoter` or
`connectwise-cpq-quotes` if they want a quote built.

Do not invent catalog items or prices. If a catalog tool returns an
amount, you may carry that amount through as returned and label the
source. If it does not, list the device and the catalog match (name or
SKU) without an amount.

## Anti-triggers

- **Building the refresh calendar itself** (tiers, dates, and
  insufficient-data bucketing): use
  [Refresh Cycle Planning](../refresh-cycle-planning/SKILL.md).
- **Building or publishing a quote:** build it with `scalepad-quoter`
  (which can also publish) or `connectwise-cpq-quotes`. CPQ's API has no
  publish verb, so a CPQ quote is published from the CPQ web app. Kaseya
  Quote Manager's tools are read-only, so a Kaseya quote is built in the
  Quote Manager web app. This skill stops at the list.
- **ScalePad Lifecycle Manager roadmaps:** use
  `scalepad-lifecycle-manager`.

## Connected Systems

| System | Role | Required? |
|--------|------|-----------|
| Refresh Cycle Planning output, or the RMM inventory that skill uses | The devices, tiers, and timing to quote | Yes |
| ScalePad Quoter, Kaseya Quote Manager, or ConnectWise PSA | Read-only product catalog for matching items | Optional |
| ScalePad Quoter, Kaseya Quote Manager, or ConnectWise CPQ | Read-only existing-quote context | Optional |

ConnectWise CPQ has no searchable product catalog. Its quote items are
lines on existing quotes, not catalog products, so ConnectWise catalog
matching comes from ConnectWise PSA when it is connected.

If no catalog connector is connected, still produce the per-client
device list from the calendar, and say a catalog-backed quote list could
not be drafted.

## Workflow

### Step 1: Discover what is actually connected

Call `conduit__search_tools` first. Use the exact names discovery returns.
Gateway names often look like `<vendor-slug>__<tool_name>`.

If a refresh calendar is not already in hand, follow
[Refresh Cycle Planning](../refresh-cycle-planning/SKILL.md) to build
one, then continue here. That skill's read-only RMM and documentation
inventory reads are in scope for building the calendar. Do not restate
its tool list here.

For quoting and catalog systems, only call the read-only tools in the
allow-list below. Never create, update, publish, delete, or
authenticate-for-write in any connected system.

**ScalePad Quoter (read-only):** `scalepad_quoter_items_list`,
`scalepad_quoter_items_get`, `scalepad_quoter_quotes_list`,
`scalepad_quoter_quotes_get`. Never call `scalepad_quoter_items_update`,
`scalepad_quoter_quotes_create`, `scalepad_quoter_quotes_publish`,
`scalepad_quoter_auth_authorize`, or `scalepad_quoter_auth_refresh`.

**Kaseya Quote Manager (read-only):** `kqm_product_list`,
`kqm_product_get`, `kqm_category_list`, `kqm_category_get`,
`kqm_quote_list`, `kqm_quote_get`, `kqm_quote_line_list`,
`kqm_quote_line_get`, `kqm_quote_section_list`, `kqm_quote_section_get`,
`kqm_customer_list`, `kqm_customer_get`.

**ConnectWise PSA catalog (read-only):** `cw_search_catalog_items`,
`cw_get_catalog_item`, `cw_list_catalog_categories`,
`cw_list_catalog_subcategories`. Never call `cw_create_catalog_item` or
`cw_update_catalog_item`.

**ConnectWise CPQ (read-only, existing quotes only):**
`cpq_search_quotes`, `cpq_get_quote`, `cpq_get_quote_versions`,
`cpq_search_quote_items`, `cpq_get_quote_item`, `cpq_search_quote_tabs`,
`cpq_list_quote_customers`, `cpq_list_templates`, `cpq_test_connection`.
`cpq_search_quote_items` searches lines on existing quotes; never treat
its results as catalog matches. Never call
`cpq_create_quote_from_template`, `cpq_create_quote_item`,
`cpq_create_quote_term`, or any update or delete CPQ tool.

If a vendor is connected but the needed tool is not in this list, was
not returned by discovery, or fails with an access error, skip that
catalog and say why.

### Step 2: Build the per-client device list

From the refresh calendar, group devices by client. Stay with
replace-now and plan-this-year tiers by default. Keep the
insufficient-data bucket as a separate list: those devices are not
quote-ready until the calendar gaps are filled.

If the operator explicitly asks to include monitor-tier devices, include
them. Refresh Cycle Planning may report monitor as a count only, so pull
the device details from the same RMM inventory (or ask for a detailed
calendar) rather than quoting a bare count.

For each device, carry forward make, model, quantity, tier, and target
window as the calendar provided them. Do not invent a replacement model
if the calendar did not specify one.

### Step 3: Match a catalog when one is connected

If a catalog search tool (`scalepad_quoter_items_list`,
`kqm_product_list`, or `cw_search_catalog_items`) was discovered and is
accessible, search it for a reasonable match to each replacement. If
none is accessible, produce the device list without catalog matches.
Record:

- The catalog name or SKU as returned
- The tool that returned it
- An amount only if the tool actually returned one, copied as-is and
  labeled with the field it came from (for example `cost` or `price`),
  with no currency conversion and no "typical street price" fill-in.
  Never present a cost as a sell price. Cost is internal: keep it out of
  anything client-facing.
- "No catalog match" when nothing suitable was returned

Existing quotes (`scalepad_quoter_quotes_list`, `kqm_quote_list`, or
`cpq_search_quotes`) may be cited as prior context ("an earlier quote
already includes this SKU") but must not be modified.

### Step 4: Draft the list and hand off

Produce a per-client list:

1. Client
2. Tier and target window
3. Devices and quantities
4. Catalog match or "no catalog match"
5. Amounts only when returned by a catalog tool, labeled with their
   field, otherwise omitted
6. A handoff line naming the quoting skill to use next
   (`scalepad-quoter` or `connectwise-cpq-quotes`, or the Kaseya Quote
   Manager web app), and stating that this skill did not create a quote

Example (fictional data):

```text
Client: Example Dental Group
Catalog: ScalePad Quoter (scalepad_quoter_items_list)

| Tier            | Window  | Device (calendar)    | Qty | Catalog match          | Amount (field)       |
|-----------------|---------|----------------------|-----|------------------------|----------------------|
| Replace now     | Now     | Dell OptiPlex 7060   | 6   | Dell OptiPlex 7020 SFF | cost: 899.00         |
| Plan this year  | 2027 Q2 | HP ProBook 450 G7    | 3   | No catalog match       |                      |

Insufficient data (not quote-ready): 2 devices with no warranty, EOL/EOS, or age data.
Handoff: use scalepad-quoter to build the quote. This skill did not create a quote.
```

If no catalog connector was connected, omit the catalog columns and say
the operator will need a connected quoter, and `scalepad-quoter` or
`connectwise-cpq-quotes`, to build a quote, or can build it in the Kaseya
Quote Manager web app.

## Error Handling

### No refresh calendar and no inventory

Stop and ask to run Refresh Cycle Planning first, or to name the client
and window.

### Catalog search returns prices you did not request

You may include a returned amount as data, labeled with its source. Do
not format a quote, do not total a made-up margin, and do not invent
list prices for unmatched rows.

### Several catalogs are connected

Ask which catalog to match against, or run each separately and label the
source, rather than silently merging them.

## Best Practices

- One client section at a time if the calendar is large.
- Keep insufficient-data devices visible, but out of the quote-ready
  list. Keep monitor-tier devices out too, unless the operator asked to
  include them.
- Oxford commas, and no em dashes.

## Related Skills

- [Refresh Cycle Planning](../refresh-cycle-planning/SKILL.md) produces
  the calendar this skill consumes.
- [Warranty Tracking](../warranty-tracking/SKILL.md) and
  [EOL/EOS Flagging](../eol-eos-flagging/SKILL.md) feed that calendar.
- `scalepad-quoter` and `connectwise-cpq-quotes` are the handoff targets
  for actually building a quote. `connectwise-psa-product-catalog` and
  `kaseya-quote-manager-quotes` cover the catalog and quote data this
  skill reads.
