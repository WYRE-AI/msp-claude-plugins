# Salesbuildr plugin — governance and safety model

Unofficial. Community-built plugin for the Salesbuildr API. Not affiliated
with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Salesbuildr through the WYRE
Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the portal the operator is
authorised for.

- No Salesbuildr API key is stored on the technician's machine, in this repo,
  or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers "who
  built this quote". Salesbuildr sees one API key and cannot tell your
  technicians apart.
- Revoking gateway access revokes Salesbuildr access with it, immediately.

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Salesbuildr state. Safe for autonomous agents. | `salesbuildr_companies_list`, `salesbuildr_companies_get`, `salesbuildr_contacts_list`, `salesbuildr_contacts_get`, `salesbuildr_opportunities_list`, `salesbuildr_opportunities_get`, `salesbuildr_products_list`, `salesbuildr_products_get`, `salesbuildr_quotes_list`, `salesbuildr_quotes_get`, `salesbuildr_status`, `salesbuildr_navigate` |
| **Write** | Creates or modifies records. Reversible in principle, but see below. | `salesbuildr_companies_create`, `salesbuildr_companies_update`, `salesbuildr_contacts_create`, `salesbuildr_contacts_update`, `salesbuildr_opportunities_create`, `salesbuildr_opportunities_update`, `salesbuildr_quotes_create` |
| **Destructive** | Removes records and everything hanging off them. Requires explicit per-call human approval. | `salesbuildr_companies_delete`, `salesbuildr_contacts_delete` |

`salesbuildr_quotes_create` is deliberately **not** in the destructive tier.
The API creates a priced quote record; it does not publish or email it — that
is a separate action in the Salesbuildr portal. But it is the riskiest write
here, and the sharp edges below explain why it needs a human read before the
salesperson clicks publish.

`salesbuildr_companies_delete` is destructive in the cascading sense: a company
is the parent of its contacts, opportunities, and quotes. Deleting one removes
the commercial history behind live deals, and there is no undelete tool.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never self-approve
destructive calls.**

- Read tools: allow. Catalog lookup, pipeline review, and margin analysis are
  the intended autonomous use.
- Write tools: agent drafts the exact call, human approves, then it runs.
  Quote creation additionally needs the approver to check the line-item prices,
  not just the shape of the call.
- Destructive tools: require a named human approver per invocation. Do not
  grant these to scheduled or unattended agents.

## What it cannot reach

- Only the Salesbuildr portal the operator's gateway identity maps to. The API
  key is portal-scoped; there is no reseller or multi-portal tier.
- No filesystem, no shell, no other vendor's data.
- No publish, send, or e-signature surface. Quotes built here become
  customer-visible only through a human action in the Salesbuildr portal.
- No quote deletion. A quote created in error must be cleaned up in the portal.
- No PSA, accounting, or payment system. Winning a quote here bills nobody.

## Data handling

- Responses pass through the gateway into model context for the session and are
  not persisted by this plugin.
- `salesbuildr_contacts_list` / `salesbuildr_contacts_get` return customer PII —
  names, email addresses, phone numbers.
- `salesbuildr_quotes_list` / `salesbuildr_quotes_get` return commercial data:
  line-item pricing, recurring values, and quote totals across the pipeline.
- `salesbuildr_products_list` returns the sell-price catalog. Combined with
  distributor cost from `kaseya-quote-manager-purchasing`, this reconstructs
  your margin — treat the pair as commercially sensitive even though neither is
  alone.
- Restrict contact and quote reads if your agents run unattended.

## Known sharp edges

- **A quote is one click from the customer.** The API stops at creating the
  record, but the record it creates is the artefact a salesperson publishes as
  a customer-facing web proposal. An agent-generated price error becomes a
  binding-looking offer the moment a human clicks publish, without a second
  review of the numbers.
- **There is no quote delete tool.** A wrong quote cannot be withdrawn through
  this plugin. Cleanup is manual, in the portal.
- **`salesbuildr_quotes_create` elicits a company when one is not supplied.**
  It prompts for a company name and searches. An unattended agent has nobody to
  answer, so the call either stalls or proceeds against whatever the search
  returned first.
- **Line items detach from the catalog.** `unitPrice` on a line item is copied
  at creation. A later catalog price change does not propagate, so quotes and
  the catalog legitimately disagree — do not let an agent "correct" one from
  the other.
- **Deletes cascade quietly.** Removing a company takes its contacts,
  opportunities, and quotes with it. The API reports success either way.
- **Rate limit is 500 requests per 10 minutes.** A pipeline sweep that pages
  through quotes and then fetches each one will exhaust the budget and degrade
  mid-task, leaving partial results that look complete.
