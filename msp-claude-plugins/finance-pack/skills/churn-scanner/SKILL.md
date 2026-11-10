---
name: "Churn Scanner"
description: >
  Cross-vendor client retention risk ranking from ticket volume, customer
  sentiment, SLA misses, overdue invoices, upcoming agreement renewals, and
  RMM availability proxies. Covers evidence-based scoring, source coverage,
  and incomplete-data reporting through Conduit.
when_to_use: >-
  When scanning an MSP client portfolio for churn risk or deciding which
  accounts need retention attention. Use when: churn scanner, at-risk clients,
  retention review, who might leave, customer health ranking, or churn signals.
---

# Churn Scanner

Rank clients for human retention review using observed evidence. This is an
explainable prioritization, not a calibrated probability of cancellation.
A client roster is required; every signal family is optional.

## Anti-triggers

- **Working a single contract, invoice, or ticket record:** use the connected
  vendor skill, such as `autotask-contracts`, `autotask-tickets`, `qbo-invoices`,
  `xero-invoices`, or `halopsa-tickets`.
- **Contract entitlements versus invoices:** use `finance-pack-agreement-reconciliation`.
- **Per-client profitability or margin:** use `finance-pack-margin-analysis`.
- **Executing escalation for tickets already breaching SLA:** use
  `ops-pack-sla-escalation-playbooks`.

## Workflow

1. **Discover first.** Start every scan with `conduit__search_tools`. Search for
   company/client rosters, tickets, surveys, invoices, agreements, and devices.
   Read returned schemas and use the exact discovered names, often shaped like
   `<vendor-slug>__<tool_name>`. The table below lists canonical MCP names, not
   guaranteed gateway spellings. Never assume a vendor is connected or invent
   a tool. A connected vendor without an allowed tool for the needed data is
   an unavailable signal, with the missing capability described in prose.
2. **Establish the roster.** Use a discovered roster tool from the table. If
   none is available, stop: "No client roster tool is available through Conduit,
   so a client churn ranking cannot be produced." Do not substitute ticket or
   invoice customers for a complete roster. Page through the roster, retaining
   stable client IDs and active/inactive status. If access fails, report the
   error and stop unless another allowed roster source succeeds.
3. **Set scope and join identities.** Default to active clients, the most recent
   complete 30 days versus the preceding 30 days, and renewals within 90 days.
   State dates, timezone, as-of time, and operator overrides. Match sources by
   explicit cross-system IDs first, then verified unique company identities.
   Ask about ambiguous matches; exclude unresolved joins from scoring, and
   list them as coverage gaps. Merge duplicate clients across PSAs only after
   confirming identity. Deduplicate invoices and tickets across sources.
4. **Read available evidence.** Use only the discovery result matching an
   allowed table entry. Paginate and apply the same client, date, and status
   scope across both comparison windows. Retain source, record identifiers,
   timestamps, counts, and denominators. Use detail tools only where needed.
   On permission errors or missing fields, mark the affected signal unavailable;
   on rate limits, follow the returned retry guidance with bounded retries.
   Unfinished pagination is incomplete coverage, never a zero result.
5. **Score and report.** Apply the rules below per client. Preserve every roster
   client, including those with no usable signals. Recommend human review only;
   this scan does not contact clients or change operational records.

Only read-only list, get, search, or report tools are permitted. Never create,
update, delete, send, void, resolve, run, install, reboot, or use raw-request,
execute-tool, custom-mutation, or other passthrough tools, even if discovered.

## Allowed evidence sources

| Family | Canonical MCP tools and interpretation |
|---|---|
| Required roster | `autotask_search_companies`; `halopsa_clients_list`, `halopsa_clients_get`, `halopsa_clients_search`; `cw_search_companies`, `cw_get_company`; `syncro_customers_list`; `superops_clients_list`, `superops_clients_get`, `superops_clients_search` |
| Ticket volume and text | `autotask_search_tickets`, `autotask_get_ticket_details`, `autotask_search_ticket_history`, `autotask_list_ticket_priorities`, `autotask_list_ticket_statuses`; `halopsa_tickets_list`, `halopsa_tickets_get`; `cw_search_tickets`, `cw_get_ticket`; `syncro_tickets_list`; `superops_tickets_list`, `superops_tickets_get`; `ninjaone_tickets_list`, `ninjaone_tickets_get`; `atera_tickets_list`, `atera_tickets_get` |
| Sentiment | Prefer CrewHu: `crewhu_surveys_list`, `crewhu_surveys_search`, `crewhu_surveys_detractors`, `crewhu_surveys_promoters`, `crewhu_surveys_get`. Preserve the returned survey scale and detractor classification. Fallback: `autotask_search_ticket_notes`, `autotask_get_ticket_note`, `cw_get_ticket_notes`, or subject/description fields from allowed ticket tools. Label fallback sentiment as inferred from ticket text, never as a CSAT score. There is no SmileBack MCP tool in this catalog. |
| SLA misses | Use the allowed ticket list/get tools and their SLA/due-date fields; there is no dedicated breach-list tool. Autotask details expose resolution-plan/due-date information; HaloPSA details can expose `deadlinedate`, target timestamps, and hold state. Inspect actual fields and tenant semantics before use. |
| Overdue invoices | `qbo_invoices_list` (Paid/Unpaid/Overdue status filter), `qbo_invoices_get`; `xero_invoices_list`, `xero_invoices_get`, `xero_reports_aged_receivables`; `autotask_search_invoices`, `autotask_get_invoice_details`; `halopsa_invoices_list`, `halopsa_invoices_get`; `cw_search_invoices`, `cw_get_invoice`; `syncro_invoices_list` |
| Renewals | `autotask_search_contracts`, `autotask_get_contract`, `autotask_list_expiring_contracts`; `cw_search_agreements`, `cw_get_agreement`, `cw_get_agreement_additions`. HaloPSA and Syncro have no contract/agreement list tool in this catalog; if those are the only PSAs, renewal evidence is unavailable. |
| Usage proxy | `datto_list_devices`, `datto_get_device`, `datto_find_device`, `datto_list_sites`, `datto_get_site`; `ninjaone_devices_list`, `ninjaone_devices_get`, `ninjaone_organizations_list`, `ninjaone_organizations_get`, `ninjaone_organizations_devices`; `cwautomate_computers_list`, `cwautomate_computers_get`, `cwautomate_computers_search`, `cwautomate_clients_list`, `cwautomate_clients_get`; `atera_agents_list`, `atera_agents_get`, `atera_customers_list`, `atera_customers_get`; `ncentral_list_devices`, `ncentral_list_devices_by_org_unit`, `ncentral_get_device`, `ncentral_get_device_service_status`; `superops_assets_list`, `superops_assets_get`; `syncro_assets_list`; `immybot_computers_list`, `immybot_computers_get` |

RMM sources are last-seen/online/offline proxies, not product-usage analytics.
There is no dedicated product-usage or M365 usage-report tool for this skill.
With a snapshot only, report the current mix and explicitly say a trend could
not be computed. Never invent a baseline or equate offline devices with churn.

## Explainable ranking

These defaults are rules of thumb for review, not industry benchmarks. Accept
operator overrides and print every threshold actually used. Each family fires
at most once, regardless of the number of sources or records supporting it.

| Independent family | Default adverse threshold | Intensity, 1 normally, 2 when severe |
|---|---|---|
| Ticket volume | Recent count is at least 30% above this client's earlier count, with at least 5 earlier tickets | Severe at 60% growth. If earlier count is below 5, show counts only, without a growth flag. |
| Sentiment | At least 1 returned CrewHu detractor in the recent window | Severe at 3 detractors. Show survey count and detractor share in both windows when available. Without surveys, flag at least 2 distinct tickets with explicit dissatisfaction; severe at 4. Cite text evidence briefly, label it qualitative inference, and count the family only once. |
| SLA misses | Recent miss rate exceeds this client's earlier rate by at least 10 percentage points, with at least 5 assessable tickets per window | Severe at 20 percentage points. Use tickets missing at least one assessable target divided by assessable tickets, without double-counting response and resolution misses. |
| Overdue invoices | At least 1 unpaid invoice is at least 30 days past due as of the scan | Severe at 60 days. Report invoice aging and overdue amount as returned by the invoice tool; preserve currencies separately. |
| Renewal proximity | At least 1 active agreement expires within 90 days | Severe within 30 days. Proximity is a review prompt, not proof of dissatisfaction; show days remaining and any known notice deadline. |
| Dropping usage proxy | Historical comparable snapshots show online share falling by at least 20 percentage points against this client's earlier window | Severe at 40 percentage points. Report fleet denominators and scope changes. Snapshot-only evidence is descriptive and does not fire a decline flag. |

For SLA assessment, use explicit breach outcomes or actual response/resolution
completion timestamps against their applicable targets. For open targets, use
the as-of time. Honor business-hours and hold semantics. A current due date
alone cannot prove a historical breach or establish an earlier miss rate;
mark the comparison unavailable when outcomes or semantics cannot be verified.
Label generic due-date comparisons as proxies rather than contractual SLA facts.

Rank by descending adverse-family count first, then summed intensity of fired
families, then client identifier for stable ties. Show the count as [N] adverse
of [N] assessable families, plus the intensity sum. Missing families contribute
neither evidence of health nor an adverse flag. Do not normalize sparse clients
into apparently healthy accounts. Mark single-family rankings as partial;
mark zero-family clients unranked (insufficient evidence), after ranked clients.
Flag unequal coverage so the operator can compare like-for-like cohorts.

## Report format

Use placeholders only in templates; populate results solely from returned data.

```text
Portfolio summary
As of: [timestamp and timezone]
Recent window: [window]; earlier window: [window]
Clients: [N] in scope; [N] ranked; [N] partial; [N] unranked
Sources used: [discovered names]; thresholds and overrides: [rules used]
Coverage limitations: [missing families, incomplete pages, or unresolved joins]

Clients, highest risk first
[Rank]. [Client] ([source client identifier])
  Evidence: [N] adverse / [N] assessable families; intensity sum [N]
  Coverage: [families assessed]; [partial or incomplete limitations]
  Driving signals: [family, current metric, earlier metric if available,
    threshold crossed, intensity, source tool, record identifier, timestamp]
  Other observed signals: [non-adverse evidence or snapshot-only proxy]
  Suggested review: [evidence-based human follow-up]

Unavailable signals per source
[Source or unconnected family]: [signal unavailable and why]
[Client or scope]: [missing fields, failed reads, uncertain identity, or history gap]
```

If no optional signals are available, return the roster coverage summary and
unavailable-signal section, with all clients unranked. Never fabricate data,
convert missing data to zero, or describe a lack of observations as low risk.

## Related Skills

- [Agreement Reconciliation](../agreement-reconciliation/SKILL.md): `finance-pack-agreement-reconciliation`, entitlement and invoice matching.
- [Margin Analysis](../margin-analysis/SKILL.md): `finance-pack-margin-analysis`, client profitability.
- [SLA Escalation Playbooks](../../../ops-pack/skills/sla-escalation-playbooks/SKILL.md): `ops-pack-sla-escalation-playbooks`, operational escalation.
