# Autotask plugin — governance and safety model

Unofficial. Community-built plugin for the Kaseya Autotask PSA API. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Autotask through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenant the
operator is authorised for.

- No Autotask integration code, API username, or secret is stored on the
  technician's machine, in this repo, or in the model's context.
- The org's Autotask credential is stored once at the gateway, so
  replacing it is one edit rather than a change on every technician's
  machine. There is no rotate action, though — you re-submit the connect
  form, which overwrites the stored credential in place, and nothing
  tracks its age or prompts you.

- Every call carries operator identity, so the gateway audit log answers
  "who raised this charge" — Autotask's own audit trail records only the
  API user.
- Removing a technician's Conduit org membership stops their Autotask
  access on their next call, because membership is re-read per request.
  It does **not** revoke an already-issued token, and it does not touch
  credentials they connected personally. Full offboarding is more than
  one step — see `wyre-gateway/GOVERNANCE.md`, *Revocation*.

## Tool permission groups

Autotask is classified in Conduit's `VENDOR_TOOL_CONFIG`
(`src/proxy/result-cache.ts`), so the tiers below are the ones actually
enforced. All 98 tools are classified; none fall through to the
unclassified-means-`admin` rule.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change Autotask state. Safe for autonomous agents. | `read` | All `autotask_search_*` (29), `autotask_get_*` (19), and `autotask_list_*` (6) tools, plus `autotask_test_connection`. Enumerated below. |
| **Write** | Creates or modifies records. Reversible, but visible to the customer — and includes the billing and contract tools. | `write` | `autotask_create_company`, `autotask_create_company_note`, `autotask_create_contact`, `autotask_create_contract`, `autotask_create_contract_service`, `autotask_create_expense_item`, `autotask_create_expense_report`, `autotask_create_opportunity`, `autotask_create_phase`, `autotask_create_project`, `autotask_create_project_note`, `autotask_create_quote`, `autotask_create_quote_item`, `autotask_create_service_call`, `autotask_create_service_call_ticket`, `autotask_create_service_call_ticket_resource`, `autotask_create_task`, `autotask_create_ticket`, `autotask_create_ticket_attachment`, `autotask_create_ticket_charge`, `autotask_create_ticket_checklist_item`, `autotask_create_ticket_note`, `autotask_create_time_entry`, `autotask_update_company`, `autotask_update_contact`, `autotask_update_contract`, `autotask_update_contract_service`, `autotask_update_project`, `autotask_update_quote_item`, `autotask_update_service_call`, `autotask_update_ticket`, `autotask_update_ticket_charge`, `autotask_update_ticket_checklist_item` |
| **Delete** | Removes a record. No recycle bin, no undo tool. | `write` — **not** a tier of its own | `autotask_delete_quote_item`, `autotask_delete_service_call`, `autotask_delete_service_call_ticket`, `autotask_delete_service_call_ticket_resource`, `autotask_delete_ticket_charge`, `autotask_delete_ticket_checklist_item` |
| **Admin** | Unbounded passthrough, arbitrary tool dispatch, or a freeform request body. | `admin` | `autotask_raw_request`, `autotask_execute_tool`, `autotask_router`, `autotask_update_company_site_configuration` |

**The Delete row is the one to read twice.** Conduit's enforcement tiers
are only `read`, `write`, and `admin` (plus `none`, meaning deny) —
`src/access/permission-tier.ts:27`. "Delete" is a presentation group in
the access editor, and a delete-group tool compiles to and enforces at
tier `write` (`src/access/tier-group-mapping.ts`, `GROUP_ENFORCEMENT_TIER`).
So **granting a technician `write` on Autotask also grants all six
`autotask_delete_*` tools.** There is no setting that separates them; the
only way to admit some write tools but not the deletes is a granular
per-tool grant, which compiles to an explicit `customTools` allowlist.

Conduit compares tiers. It has no approval step, no per-call
confirmation, and no interactive prompt — its source contains no
elicitation handling at all. Per-call approval for anything below is a
policy you impose on your agents, and it is only as good as the agent
configuration that carries it.

### Where the enforced tier is weaker than the risk

The tools below enforce at `write`, which is the same tier as creating a
ticket note. The mechanical tier is a function of `isWrite`/`isAdmin`;
it is not a judgement about blast radius in a customer's tenant. These
three groups deserve the care the tier does not give them:

- **Ticket charges** (`autotask_create_ticket_charge`,
  `autotask_update_ticket_charge`, `autotask_delete_ticket_charge`) post
  money directly onto a customer's invoice. The API calls it a create;
  the customer calls it a bill. Unlike time entries, charges do not pass
  through a submit/approve workflow before they reach billing.
- **Contract tools** (`autotask_create_contract`,
  `autotask_update_contract`, and the two contract-service tools) change
  the managed services agreement. A single edit changes the recurring
  amount the client pays every month until someone notices. The blast
  radius is the commercial relationship, not a record.
- **The six `autotask_delete_*` tools** remove the record outright. They
  are in the Delete presentation group, which still enforces at `write`.

If you need any of these held back from a technician who otherwise needs
`write`, that has to be a per-tool `customTools` allowlist. A tier
cannot express it.

`autotask_create_time_entry` is a genuine `write` in both senses.
Entries land in DRAFT and must be submitted and approved before they
reach an invoice, so a mistaken entry is caught by an existing human
control.

### Where the enforced tier is stronger than the old table said

- **`autotask_router` enforces at `admin`**, not `read`. It was
  previously documented as a read tool. Conduit groups it with
  `autotask_raw_request` and `autotask_execute_tool` under
  *"Passthrough surfaces (arbitrary method/path/body, arbitrary tool
  dispatch, NL routing) -> ADMIN"*. Plan around the tier as stated — a
  technician with `read` or `write` on Autotask cannot call it — but be
  aware this looks like an over-classification: the handler resolves an
  intent string and returns `{ suggestedTool, ... }`, executing nothing
  (`autotask-mcp`, `src/handlers/tool.handler.ts:1432`).
  `wyre-gateway/GOVERNANCE.md` reached the same conclusion about the
  router independently. The other two passthrough tools do dispatch, and
  their `admin` tier is earned.
- **`autotask_update_company_site_configuration` enforces at `admin`**,
  not `write`. Its request body is freeform
  (`additionalProperties: true`), so Conduit cannot bound what it
  changes.
- **`autotask_execute_tool` and `autotask_raw_request` enforce at
  `admin`**, which matches the risk. Granting `admin` on Autotask is
  equivalent to granting every tool in the table, because these two can
  reach any of them.

### Read group in full

`autotask_search_billing_item_approval_levels`,
`autotask_search_billing_items`, `autotask_search_companies`,
`autotask_search_company_notes`, `autotask_search_configuration_items`,
`autotask_search_contacts`, `autotask_search_contracts`,
`autotask_search_expense_reports`, `autotask_search_invoices`,
`autotask_search_opportunities`, `autotask_search_products`,
`autotask_search_project_notes`, `autotask_search_projects`,
`autotask_search_quote_items`, `autotask_search_quotes`,
`autotask_search_resources`, `autotask_search_service_bundles`,
`autotask_search_service_call_ticket_resources`,
`autotask_search_service_call_tickets`, `autotask_search_service_calls`,
`autotask_search_services`, `autotask_search_tasks`,
`autotask_search_ticket_attachments`, `autotask_search_ticket_charges`,
`autotask_search_ticket_checklist_items`,
`autotask_search_ticket_history`, `autotask_search_ticket_notes`,
`autotask_search_tickets`, `autotask_search_time_entries`,
`autotask_get_billing_item`, `autotask_get_company_note`,
`autotask_get_company_site_configuration`,
`autotask_get_expense_report`, `autotask_get_field_info`,
`autotask_get_invoice_details`, `autotask_get_opportunity`,
`autotask_get_product`, `autotask_get_project_note`,
`autotask_get_quote`, `autotask_get_quote_item`,
`autotask_get_service`, `autotask_get_service_bundle`,
`autotask_get_service_call`, `autotask_get_ticket_attachment`,
`autotask_get_ticket_charge`, `autotask_get_ticket_details`,
`autotask_get_ticket_history`, `autotask_get_ticket_note`,
`autotask_list_categories`, `autotask_list_category_tools`,
`autotask_list_phases`, `autotask_list_queues`,
`autotask_list_ticket_priorities`, `autotask_list_ticket_statuses`,
`autotask_test_connection`.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve deletes.**

- Read tools: allow. Reporting, triage sweeps, and utilisation analysis
  are the intended autonomous use.
- Write tools: agent drafts the exact call, human approves, then it runs.
  Treat the charge and contract tools as a stricter class than the rest
  of the group even though Conduit does not.
- Delete tools: require a named human approver per invocation. Do not
  grant these to scheduled or unattended agents. Remember that Conduit
  cannot enforce this separation for you — a `write` grant on Autotask
  already admits all six — so it has to live in the agent's own
  configuration, or in a per-tool `customTools` allowlist.
- Admin tools: treat the grant as equivalent to full Autotask
  administrator, because for `autotask_raw_request`, `autotask_router`,
  and `autotask_execute_tool` that is exactly what it is. Do not grant
  `admin` on Autotask to any agent you would not also trust with every
  tool in the table.

## What it cannot reach

- Only the Autotask instance mapped to the operator's gateway identity,
  in that instance's assigned zone. Autotask has no cross-tenant API.
- Whatever the API user's security level forbids. Autotask enforces
  entity-level permissions server-side, so a tool can be exposed here
  and still return 403.
- No filesystem, no shell, no other vendor's data. Sibling Kaseya
  products (BMS, VSA, Datto RMM, IT Glue) are separate plugins with
  separate credentials; nothing here reads or writes them.
- No live event stream. Every tool is point-in-time.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `autotask_search_contacts` and `autotask_search_companies` return
  customer PII (names, email addresses, phone numbers, site addresses).
- `autotask_search_invoices`, `autotask_get_invoice_details`,
  `autotask_search_billing_items`, and the contract and quote tools
  return commercial data — rates, margins, and what each client pays.
  Restrict these if your agents run unattended or if technicians should
  not see margin.
- `autotask_search_resources` returns internal staff records.

## Known sharp edges

- **Picklist IDs are per-tenant.** Status, priority, and queue IDs
  documented in the skills are Autotask defaults. Instances customise
  them freely, so a filter built from a hardcoded ID silently returns
  nothing rather than erroring. Fetch real values first.
- **External notes are customer-visible on write.** A ticket note
  created with an external publish setting reaches the client through
  Autotask's notification rules the moment it is written. There is no
  draft state.
- **Ordering constraints read as permission errors.** Quote items
  require an existing quote; service call tickets require an existing
  service call; expense items require an expense report. Calling the
  child first returns an error that looks like an access failure.
- **Deletes are hard.** The `autotask_delete_*` tools remove the record;
  there is no recycle bin and no undo tool in this plugin.
- **Contract edits are silent and recurring.** Nothing notifies the
  customer, and the changed amount simply appears on the next invoice
  run.
