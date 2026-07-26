---
name: "ScalePad Lifecycle Manager"
description: >
  Use this skill when working with ScalePad Lifecycle Manager — the
  engagement and roadmap workflow product: initiatives, goals,
  meetings, action items, assessments, deliverables, budget
  forecasting, contracts, notes, hardware lifecycle records, and
  warranty pricing.
when_to_use: >-
  When managing Lifecycle Manager initiatives, goals, meetings, action items, assessments, 
  deliverables, budgets, contracts, hardware lifecycles, or warranty pricing. Use when: lifecycle 
  manager, scalepad initiative, scalepad roadmap, scalepad warranty, scalepad goals, scalepad 
  meetings, scalepad qbr.
---

# ScalePad Lifecycle Manager

## Overview

Lifecycle Manager (LM) is ScalePad's client engagement product: asset
lifecycle tracking, warranty services, vCIO roadmaps (initiatives and
goals), QBR meetings, assessments, deliverables, and budget
forecasting. It is full CRUD — most write tools exist alongside the
reads. Discover this domain's tools with `scalepad_navigate` (domain `lifecycle-manager`).
US-only.

## API Tools (~190; the high-value subset)

### Clients & Contacts

| Tool | Purpose |
|------|---------|
| `scalepad_lm_clients_list` / `scalepad_lm_clients_lookup` | List/search LM clients |
| `scalepad_lm_contacts_list` / `scalepad_lm_contacts_get` | Client contacts |
| `scalepad_lm_client_groups_list` / `scalepad_lm_client_groups_assign` / `scalepad_lm_client_groups_unassign` | Client group management |
| `scalepad_lm_active_users_list` | Active LM users |

### Assets & Warranty

| Tool | Purpose |
|------|---------|
| `scalepad_lm_hardware_list` | Hardware assets (filters: age, assigned end user, backup, warranty, initiatives, software, memory, processor) |
| `scalepad_lm_hardware_overview_get` | Hardware detail by `hardware_key` |
| `scalepad_lm_hardware_dashboard_get` | Per-client hardware dashboard summary |
| `scalepad_lm_hardware_lifecycles_list` | Active hardware lifecycle records (filter by client_id, serial_number) |
| `scalepad_lm_warranty_pricing_list` | ScalePad warranty pricing per client/warranty type |
| `scalepad_lm_hardware_replacement_settings_get` | Replacement cost settings |
| `scalepad_lm_hardware_attached_initiatives_lookup` / `scalepad_lm_hardware_attached_agreements_lookup` | What an asset is attached to |

### Initiatives & Roadmaps

| Tool | Purpose |
|------|---------|
| `scalepad_lm_initiatives_list` / `scalepad_lm_initiatives_list_v2` / `scalepad_lm_initiatives_get` | List/get initiatives (filter by client, status, priority, schedule) |
| `scalepad_lm_initiatives_create` / `scalepad_lm_initiatives_update` / `scalepad_lm_initiatives_delete` | Initiative CRUD (delete is irreversible) |
| `scalepad_lm_initiatives_status_update` / `scalepad_lm_initiatives_priority_update` / `scalepad_lm_initiatives_schedule_update` | Targeted field updates |
| `scalepad_lm_initiatives_budget_update` / `scalepad_lm_initiatives_recurring_update` | One-time and recurring investment line items |
| `scalepad_lm_initiatives_assets_attach` / `scalepad_lm_initiatives_assets_detach` | Attach/detach hardware by `hardware_keys` |
| `scalepad_lm_initiatives_ticket_create` / `scalepad_lm_initiatives_ticket_get` / `scalepad_lm_initiatives_ticket_detach` | PSA ticket linking |
| `scalepad_lm_initiatives_opportunity_create` / `scalepad_lm_initiatives_opportunity_attach` | PSA opportunity linking |
| `scalepad_lm_roadmap_pdf_generate` / `scalepad_lm_roadmap_csv_generate` / `scalepad_lm_roadmap_spreadsheet_generate` | Roadmap exports |
| `scalepad_lm_initiative_templates_list` / `scalepad_lm_initiatives_template_apply` | Initiative templates |

### Goals, Meetings & Action Items

| Tool | Purpose |
|------|---------|
| `scalepad_lm_goals_list` / `scalepad_lm_goals_create` / `scalepad_lm_goals_update` / `scalepad_lm_goals_delete` | Goal CRUD |
| `scalepad_lm_goals_status_update` / `scalepad_lm_goals_schedule_update` | Goal status/target period |
| `scalepad_lm_meetings_list` / `scalepad_lm_meetings_get` / `scalepad_lm_meetings_create_v2` / `scalepad_lm_meetings_update_v2` / `scalepad_lm_meetings_delete` | Meeting CRUD (prefer the v2 create/update) |
| `scalepad_lm_meetings_user_attendees_add` / `scalepad_lm_meetings_contact_attendees_add` | Attendee management |
| `scalepad_lm_action_items_list` / `scalepad_lm_action_items_create` / `scalepad_lm_action_items_update` / `scalepad_lm_action_items_delete` | Action item CRUD |
| `scalepad_lm_action_items_completion_status_update` / `scalepad_lm_action_items_pin_update` | Complete/pin action items |
| Attach/detach pairs | `scalepad_lm_initiatives_goals_attach`, `scalepad_lm_meetings_initiatives_attach`, `scalepad_lm_goals_action_items_attach`, etc. |

### Assessments, Deliverables, Budget & Contracts

| Tool | Purpose |
|------|---------|
| `scalepad_lm_assessments_list` / `scalepad_lm_assessments_create` / `scalepad_lm_assessments_evaluate` | Client assessments |
| `scalepad_lm_deliverables_list` / `scalepad_lm_deliverables_create` / `scalepad_lm_deliverables_pdf_get` | QBR deliverables and exports |
| `scalepad_lm_deliverables_share_link_create` / `scalepad_lm_deliverables_share_link_revoke` | Shareable deliverable links |
| `scalepad_lm_budget_summary_get` / `scalepad_lm_budget_it_debt_list` / `scalepad_lm_budget_forecast_pdf_get` / `scalepad_lm_budget_forecast_csv_get` | Budget forecasting |
| `scalepad_lm_contracts_list` / `scalepad_lm_contracts_create` / `scalepad_lm_contracts_update` / `scalepad_lm_contracts_delete` | LM contract CRUD |
| `scalepad_lm_notes_list` / `scalepad_lm_notes_create` / `scalepad_lm_notes_update` | Client notes |
| `scalepad_lm_insights_list` | LM insights |

## Common Workflows

1. **Warranty review** — `scalepad_lm_hardware_list` filtered by
   client and `filter[hasscalepadwarranty]`, then
   `scalepad_lm_warranty_pricing_list` for coverage pricing.
2. **Aging hardware to initiative** — find old assets with
   `scalepad_lm_hardware_list` (`filter[age]`), create an initiative
   with `scalepad_lm_initiatives_create`, attach assets with
   `scalepad_lm_initiatives_assets_attach`, set budget with
   `scalepad_lm_initiatives_budget_update`.
3. **QBR prep** — `scalepad_lm_meetings_create_v2`, attach
   initiatives/goals, generate the roadmap PDF with
   `scalepad_lm_roadmap_pdf_generate`.

## Error Handling

402 means no active Lifecycle Manager subscription. Deletes
(`*_delete`) are irreversible — confirm IDs first. Export tools
return binary CSV/PDF/XLSX payloads.

## Best Practices

- Prefer the v2 initiative/meeting endpoints where both exist.
- Use `client_key`/`hardware_key` values exactly as returned by
  lookup tools — they are opaque keys, not display names.
- Attach/detach operations are reversible; deletes are not.

## Related Skills

- [core](../core/SKILL.md) - resolve clients and assets first
- [quoter](../quoter/SKILL.md) - quote the hardware refresh you roadmapped
- [api-patterns](../api-patterns/SKILL.md) - auth, pagination, errors
