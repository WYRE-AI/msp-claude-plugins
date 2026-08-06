# ScalePad tool inventory

Every tool the ScalePad MCP server registers — **381**, complete, no
abbreviation. The skills in this plugin cover the high-value subset in
workflow terms; this file is the exhaustive list, which is what you need to
build a per-tool allowlist or to check whether a capability exists at all.

## Provenance

Enumerated from `scalepad-mcp` v1.0.2 (`2d58d5f`) by loading each domain
handler and reading `getTools()`, then resolving every tool to the HTTP verb
and path its `invoke` reaches through `@wyre-technology/node-scalepad`. The
server registers all 381 upfront — `scalepad_navigate` is a help aid, not a
gate.

## How to read the columns

- **Access** — `read` or `write`, taken from the server's own annotations.
  scalepad-mcp attaches `{readOnlyHint: false, destructiveHint: true}` to
  exactly its **202** mutating tools and nothing to its **179** read-only
  ones, so `!!annotations` is the container's own invariant rather than a
  guess about names. Cross-checked against the resolved verb of all 379 tools
  that make an HTTP call: **no mutating tool uses GET** (reads = 156 GET +
  21 POST, where POST is a search or a render; mutations = 94 POST, 51 DELETE,
  36 PUT, 21 PATCH).
- **Tier** — the permission tier Conduit enforces
  (`VENDOR_TOOL_CONFIG`, `src/proxy/result-cache.ts`). It tracks Access
  except for three tools pinned `admin` by hand; see `GOVERNANCE.md`.
- **Endpoint** — verb and path template. `{…}` segments are filled from tool
  arguments; the base URL comes from configuration, never from arguments.

## Discovery — 2 tools (2 read, 0 write)

Local to the server — no HTTP call, no ScalePad data.

| Tool | Access | Tier | Endpoint |
|------|--------|------|----------|
| `scalepad_navigate` | read | `read` | _(local)_ |
| `scalepad_status` | read | `read` | _(local)_ |

## Core — 24 tools (24 read, 0 write)

Read-only in its entirety. US-only; `X-ScalePad-Region` has no effect.

| Tool | Access | Tier | Endpoint |
|------|--------|------|----------|
| `scalepad_core_clients_get` | read | `read` | `GET /core/v1/clients/{id}` |
| `scalepad_core_clients_list` | read | `read` | `GET /core/v1/clients` |
| `scalepad_core_contacts_get` | read | `read` | `GET /core/v1/contacts/{id}` |
| `scalepad_core_contacts_list` | read | `read` | `POST /core/v1/contacts` |
| `scalepad_core_contracts_get` | read | `read` | `GET /core/v1/service/contracts/{id}` |
| `scalepad_core_contracts_list` | read | `read` | `GET /core/v1/service/contracts` |
| `scalepad_core_hardware_assets_get` | read | `read` | `GET /core/v1/assets/hardware/{id}` |
| `scalepad_core_hardware_assets_list` | read | `read` | `GET /core/v1/assets/hardware` |
| `scalepad_core_integration_configurations_list` | read | `read` | `GET /core/v1/integrations/configurations` |
| `scalepad_core_integration_vendors_list` | read | `read` | `GET /core/v1/integrations/vendors` |
| `scalepad_core_members_get` | read | `read` | `GET /core/v1/members/{id}` |
| `scalepad_core_members_list` | read | `read` | `POST /core/v1/members` |
| `scalepad_core_opportunities_get` | read | `read` | `GET /core/v1/opportunities/{id}` |
| `scalepad_core_opportunities_list` | read | `read` | `GET /core/v1/opportunities` |
| `scalepad_core_product_catalog_get` | read | `read` | `GET /core/v1/product-catalog/{id}` |
| `scalepad_core_product_catalog_list` | read | `read` | `GET /core/v1/product-catalog` |
| `scalepad_core_saas_assets_get` | read | `read` | `GET /core/v1/assets/saas/{id}` |
| `scalepad_core_saas_assets_list` | read | `read` | `GET /core/v1/assets/saas` |
| `scalepad_core_saas_users_get` | read | `read` | `GET /core/v1/assets/saas-users/{id}` |
| `scalepad_core_saas_users_list` | read | `read` | `GET /core/v1/assets/saas-users` |
| `scalepad_core_sites_get` | read | `read` | `GET /core/v1/sites/{id}` |
| `scalepad_core_sites_list` | read | `read` | `GET /core/v1/sites` |
| `scalepad_core_tickets_get` | read | `read` | `GET /core/v1/service/tickets/{id}` |
| `scalepad_core_tickets_list` | read | `read` | `GET /core/v1/service/tickets` |

## Lifecycle Manager — 193 tools (83 read, 110 write)

Full CRUD. US-only.

| Tool | Access | Tier | Endpoint |
|------|--------|------|----------|
| `scalepad_lm_action_items_completion_status_update` | write | `write` | `PUT /lifecycle-manager/v1/action-items/{id}/completion-status` |
| `scalepad_lm_action_items_create` | write | `write` | `POST /lifecycle-manager/v1/action-items` |
| `scalepad_lm_action_items_delete` | write | `write` | `DELETE /lifecycle-manager/v1/action-items/{id}` |
| `scalepad_lm_action_items_get` | read | `read` | `GET /lifecycle-manager/v1/action-items/{id}` |
| `scalepad_lm_action_items_list` | read | `read` | `GET /lifecycle-manager/v1/action-items` |
| `scalepad_lm_action_items_pin_update` | write | `write` | `PUT /lifecycle-manager/v1/action-items/{id}/pin` |
| `scalepad_lm_action_items_reposition` | write | `write` | `POST /lifecycle-manager/v1/action-items/{id}/reposition` |
| `scalepad_lm_action_items_update` | write | `write` | `PUT /lifecycle-manager/v1/action-items/{id}` |
| `scalepad_lm_active_users_list` | read | `read` | `GET /lifecycle-manager/v1/active-users` |
| `scalepad_lm_assessment_templates_create` | write | `write` | `POST /lifecycle-manager/v1/assessment-templates` |
| `scalepad_lm_assessment_templates_delete` | write | `write` | `DELETE /lifecycle-manager/v1/assessment-templates/{assessment_template_id}` |
| `scalepad_lm_assessment_templates_get` | read | `read` | `GET /lifecycle-manager/v1/assessment-templates/{assessment_template_id}` |
| `scalepad_lm_assessment_templates_list` | read | `read` | `GET /lifecycle-manager/v1/assessment-templates` |
| `scalepad_lm_assessment_templates_update` | write | `write` | `PUT /lifecycle-manager/v1/assessment-templates/{assessment_template_id}` |
| `scalepad_lm_assessments_completion_status_update` | write | `write` | `PUT /lifecycle-manager/v1/assessments/{id}/completion-status` |
| `scalepad_lm_assessments_create` | write | `write` | `POST /lifecycle-manager/v1/assessments` |
| `scalepad_lm_assessments_delete` | write | `write` | `DELETE /lifecycle-manager/v1/assessments/{id}` |
| `scalepad_lm_assessments_evaluate` | write | `write` | `PUT /lifecycle-manager/v1/assessments/{id}/evaluate` |
| `scalepad_lm_assessments_get` | read | `read` | `GET /lifecycle-manager/v1/assessments/{id}` |
| `scalepad_lm_assessments_internal_comment_update` | write | `write` | `PUT /lifecycle-manager/v1/assessments/{id}/internal-comment` |
| `scalepad_lm_assessments_list` | read | `read` | `GET /lifecycle-manager/v1/assessments` |
| `scalepad_lm_assessments_question_internal_comment_update` | write | `write` | `PUT /lifecycle-manager/v1/assessments/{assessment_id}/questions/{question_id}/comment/internal` |
| `scalepad_lm_assessments_question_public_comment_update` | write | `write` | `PUT /lifecycle-manager/v1/assessments/{assessment_id}/questions/{question_id}/comment/public` |
| `scalepad_lm_assessments_update` | write | `write` | `PUT /lifecycle-manager/v1/assessments/{id}` |
| `scalepad_lm_budget_availabilities_get` | read | `read` | `GET /lifecycle-manager/v1/budget/{client_id}/availabilities` |
| `scalepad_lm_budget_contracts_list` | read | `read` | `GET /lifecycle-manager/v1/budget/{client_id}/contracts` |
| `scalepad_lm_budget_forecast_csv_get` | read | `read` | `GET /lifecycle-manager/v1/budget/{client_id}/forecast/csv` |
| `scalepad_lm_budget_forecast_detail_pdf_get` | read | `read` | `GET /lifecycle-manager/v1/budget/{client_id}/forecast/detail/pdf` |
| `scalepad_lm_budget_forecast_pdf_get` | read | `read` | `GET /lifecycle-manager/v1/budget/{client_id}/forecast/pdf` |
| `scalepad_lm_budget_initiatives_list` | read | `read` | `GET /lifecycle-manager/v1/budget/{client_id}/initiatives` |
| `scalepad_lm_budget_it_debt_list` | read | `read` | `GET /lifecycle-manager/v1/budget/{client_id}/it-debt` |
| `scalepad_lm_budget_summary_get` | read | `read` | `GET /lifecycle-manager/v1/budget/{client_id}/summary` |
| `scalepad_lm_client_contacts_lookup` | read | `read` | `GET /lifecycle-manager/v1/clients/{client_id}/contacts/lookup` |
| `scalepad_lm_client_deliverables_list` | read | `read` | `GET /lifecycle-manager/v1/clients/{client_id}/deliverables` |
| `scalepad_lm_client_groups_assign` | write | `write` | `POST /lifecycle-manager/v1/client-groups/{client_group_id}/assignments` |
| `scalepad_lm_client_groups_get` | read | `read` | `GET /lifecycle-manager/v1/client-groups/{client_group_id}` |
| `scalepad_lm_client_groups_list` | read | `read` | `GET /lifecycle-manager/v1/client-groups` |
| `scalepad_lm_client_groups_lookup` | read | `read` | `POST /lifecycle-manager/v1/clients/client-groups/lookup` |
| `scalepad_lm_client_groups_unassign` | write | `write` | `POST /lifecycle-manager/v1/client-groups/{client_group_id}/assignments/unassign` |
| `scalepad_lm_client_members_lookup` | read | `read` | `GET /lifecycle-manager/v1/clients/{client_id}/members/lookup` |
| `scalepad_lm_clients_list` | read | `read` | `GET /lifecycle-manager/v1/clients` |
| `scalepad_lm_clients_lookup` | read | `read` | `GET /lifecycle-manager/v1/clients/lookup` |
| `scalepad_lm_contacts_get` | read | `read` | `GET /lifecycle-manager/v1/contacts/{contact_id}` |
| `scalepad_lm_contacts_hidden_status_update` | write | `write` | `PUT /lifecycle-manager/v1/contacts/{contact_id}/hidden-status` |
| `scalepad_lm_contacts_list` | read | `read` | `GET /lifecycle-manager/v1/contacts` |
| `scalepad_lm_contracts_assets_attach` | write | `write` | `PUT /lifecycle-manager/v1/contracts/{contract_id}/assets` |
| `scalepad_lm_contracts_assets_detach` | write | `write` | `POST /lifecycle-manager/v1/contracts/{contract_id}/assets/delete` |
| `scalepad_lm_contracts_create` | write | `write` | `POST /lifecycle-manager/v1/contracts` |
| `scalepad_lm_contracts_delete` | write | `write` | `DELETE /lifecycle-manager/v1/contracts/{id}` |
| `scalepad_lm_contracts_get` | read | `read` | `GET /lifecycle-manager/v1/contracts/{id}` |
| `scalepad_lm_contracts_list` | read | `read` | `GET /lifecycle-manager/v1/contracts` |
| `scalepad_lm_contracts_update` | write | `write` | `PUT /lifecycle-manager/v1/contracts/{id}` |
| `scalepad_lm_deliverable_templates_catalog_components_list` | read | `read` | `GET /lifecycle-manager/v1/deliverables/templates/catalog/components` |
| `scalepad_lm_deliverable_templates_components_delete` | write | `write` | `DELETE /lifecycle-manager/v1/deliverables/templates/{template_id}/sections/{section_id}/components/{component_id}` |
| `scalepad_lm_deliverable_templates_create` | write | `write` | `POST /lifecycle-manager/v1/deliverables/templates` |
| `scalepad_lm_deliverable_templates_create_from_deliverable` | write | `write` | `POST /lifecycle-manager/v1/deliverables/templates/create-from/deliverable/{deliverable_id}` |
| `scalepad_lm_deliverable_templates_delete` | write | `write` | `DELETE /lifecycle-manager/v1/deliverables/templates/{template_id}` |
| `scalepad_lm_deliverable_templates_duplicate` | write | `write` | `POST /lifecycle-manager/v1/deliverables/templates/create-from/template/{template_id}` |
| `scalepad_lm_deliverable_templates_get` | read | `read` | `GET /lifecycle-manager/v1/deliverables/templates/{template_id}` |
| `scalepad_lm_deliverable_templates_list` | read | `read` | `GET /lifecycle-manager/v1/deliverables/templates` |
| `scalepad_lm_deliverable_templates_sections_delete` | write | `write` | `DELETE /lifecycle-manager/v1/deliverables/templates/{template_id}/sections/{section_id}` |
| `scalepad_lm_deliverable_templates_update` | write | `write` | `PATCH /lifecycle-manager/v1/deliverables/templates/{template_id}` |
| `scalepad_lm_deliverables_catalog_components_list` | read | `read` | `GET /lifecycle-manager/v1/clients/{client_id}/deliverables/catalog/components` |
| `scalepad_lm_deliverables_catalog_integrations_list` | read | `read` | `GET /lifecycle-manager/v1/deliverables/catalog/integrations` |
| `scalepad_lm_deliverables_components_delete` | write | `write` | `DELETE /lifecycle-manager/v1/deliverables/{deliverable_id}/sections/{section_id}/components/{component_id}` |
| `scalepad_lm_deliverables_components_refresh` | write | `write` | `POST /lifecycle-manager/v1/deliverables/{deliverable_id}/sections/{section_id}/components/{component_id}/refresh` |
| `scalepad_lm_deliverables_create` | write | `write` | `POST /lifecycle-manager/v1/clients/{client_id}/deliverables` |
| `scalepad_lm_deliverables_create_from_template` | write | `write` | `POST /lifecycle-manager/v1/clients/{client_id}/deliverables/create-from/template/{template_id}` |
| `scalepad_lm_deliverables_delete` | write | `write` | `DELETE /lifecycle-manager/v1/deliverables/{deliverable_id}` |
| `scalepad_lm_deliverables_get` | read | `read` | `GET /lifecycle-manager/v1/deliverables/{deliverable_id}` |
| `scalepad_lm_deliverables_integrated_integrations_list` | read | `read` | `GET /lifecycle-manager/v1/clients/{client_id}/deliverables/integrations/integrated` |
| `scalepad_lm_deliverables_list` | read | `read` | `GET /lifecycle-manager/v1/deliverables` |
| `scalepad_lm_deliverables_pdf_get` | read | `read` | `GET /lifecycle-manager/v1/deliverables/{deliverable_id}/pdf` |
| `scalepad_lm_deliverables_presentation_get` | read | `read` | `GET /lifecycle-manager/v1/deliverables/{deliverable_id}/presentation` |
| `scalepad_lm_deliverables_sections_delete` | write | `write` | `DELETE /lifecycle-manager/v1/deliverables/{deliverable_id}/sections/{section_id}` |
| `scalepad_lm_deliverables_sections_refresh` | write | `write` | `POST /lifecycle-manager/v1/deliverables/{deliverable_id}/sections/{section_id}/refresh` |
| `scalepad_lm_deliverables_share_link_create` | write | `write` | `POST /lifecycle-manager/v1/deliverables/{deliverable_id}/shares/general-link` |
| `scalepad_lm_deliverables_share_link_get` | read | `read` | `GET /lifecycle-manager/v1/deliverables/{deliverable_id}/shares/general-link` |
| `scalepad_lm_deliverables_share_link_regenerate` | write | `write` | `POST /lifecycle-manager/v1/deliverables/{deliverable_id}/shares/general-link/regenerate` |
| `scalepad_lm_deliverables_share_link_revoke` | write | `write` | `POST /lifecycle-manager/v1/deliverables/{deliverable_id}/shares/general-link/revoke` |
| `scalepad_lm_deliverables_update` | write | `write` | `PATCH /lifecycle-manager/v1/deliverables/{deliverable_id}` |
| `scalepad_lm_enrollment_tokens_create` | write | `admin` | `POST /lifecycle-manager/v1/saas-management/clients/{client_id}/enrollment-tokens` |
| `scalepad_lm_goal_templates_create` | write | `write` | `POST /lifecycle-manager/v1/goal-templates` |
| `scalepad_lm_goal_templates_delete` | write | `write` | `DELETE /lifecycle-manager/v1/goal-templates/{goal_template_id}` |
| `scalepad_lm_goal_templates_get` | read | `read` | `GET /lifecycle-manager/v1/goal-templates/{goal_template_id}` |
| `scalepad_lm_goal_templates_list` | read | `read` | `GET /lifecycle-manager/v1/goal-templates` |
| `scalepad_lm_goal_templates_update` | write | `write` | `PUT /lifecycle-manager/v1/goal-templates/{goal_template_id}` |
| `scalepad_lm_goals_action_items_attach` | write | `write` | `POST /lifecycle-manager/v1/goals/{goal_id}/action-items/{action_item_id}` |
| `scalepad_lm_goals_action_items_detach` | write | `write` | `DELETE /lifecycle-manager/v1/goals/{goal_id}/action-items/{action_item_id}` |
| `scalepad_lm_goals_action_items_list` | read | `read` | `GET /lifecycle-manager/v1/goals/{goal_id}/action-items` |
| `scalepad_lm_goals_create` | write | `write` | `POST /lifecycle-manager/v1/goals` |
| `scalepad_lm_goals_create_from_template` | write | `write` | `POST /lifecycle-manager/v1/goals/create-from/template/{goal_template_id}` |
| `scalepad_lm_goals_delete` | write | `write` | `DELETE /lifecycle-manager/v1/goals/{id}` |
| `scalepad_lm_goals_get` | read | `read` | `GET /lifecycle-manager/v1/goals/{id}` |
| `scalepad_lm_goals_initiatives_attach` | write | `write` | `POST /lifecycle-manager/v1/goals/{goal_id}/initiatives/{initiative_id}` |
| `scalepad_lm_goals_initiatives_detach` | write | `write` | `DELETE /lifecycle-manager/v1/goals/{goal_id}/initiatives/{initiative_id}` |
| `scalepad_lm_goals_initiatives_list` | read | `read` | `GET /lifecycle-manager/v1/goals/{goal_id}/initiatives` |
| `scalepad_lm_goals_list` | read | `read` | `GET /lifecycle-manager/v1/goals` |
| `scalepad_lm_goals_meetings_attach` | write | `write` | `POST /lifecycle-manager/v1/goals/{goal_id}/meetings/{meeting_id}` |
| `scalepad_lm_goals_meetings_detach` | write | `write` | `DELETE /lifecycle-manager/v1/goals/{goal_id}/meetings/{meeting_id}` |
| `scalepad_lm_goals_meetings_list` | read | `read` | `GET /lifecycle-manager/v1/goals/{goal_id}/meetings` |
| `scalepad_lm_goals_schedule_update` | write | `write` | `PUT /lifecycle-manager/v1/goals/{id}/schedule` |
| `scalepad_lm_goals_status_update` | write | `write` | `PUT /lifecycle-manager/v1/goals/{id}/status` |
| `scalepad_lm_goals_update` | write | `write` | `PUT /lifecycle-manager/v1/goals/{id}` |
| `scalepad_lm_hardware_attached_agreements_lookup` | read | `read` | `POST /lifecycle-manager/v1/assets/hardware/attached-agreements/lookup` |
| `scalepad_lm_hardware_attached_initiatives_lookup` | read | `read` | `POST /lifecycle-manager/v1/assets/hardware/attached-initiatives/lookup` |
| `scalepad_lm_hardware_dashboard_get` | read | `read` | `GET /lifecycle-manager/v1/assets/hardware/dashboard` |
| `scalepad_lm_hardware_lifecycles_list` | read | `read` | `GET /lifecycle-manager/v1/assets/hardware/lifecycles` |
| `scalepad_lm_hardware_list` | read | `read` | `GET /lifecycle-manager/v1/assets/hardware` |
| `scalepad_lm_hardware_overview_get` | read | `read` | `POST /lifecycle-manager/v1/assets/hardware/overview` |
| `scalepad_lm_hardware_replacement_settings_get` | read | `read` | `GET /lifecycle-manager/v1/assets/hardware-replacement/settings` |
| `scalepad_lm_initiative_templates_create` | write | `write` | `POST /lifecycle-manager/v1/initiative-templates` |
| `scalepad_lm_initiative_templates_delete` | write | `write` | `DELETE /lifecycle-manager/v1/initiative-templates/{initiative_template_id}` |
| `scalepad_lm_initiative_templates_duplicate` | write | `write` | `POST /lifecycle-manager/v1/initiative-templates/{initiative_template_id}/duplicate` |
| `scalepad_lm_initiative_templates_get` | read | `read` | `GET /lifecycle-manager/v1/initiative-templates/{initiative_template_id}` |
| `scalepad_lm_initiative_templates_list` | read | `read` | `GET /lifecycle-manager/v1/initiative-templates` |
| `scalepad_lm_initiative_templates_update` | write | `write` | `PUT /lifecycle-manager/v1/initiative-templates/{initiative_template_id}` |
| `scalepad_lm_initiatives_action_items_attach` | write | `write` | `POST /lifecycle-manager/v1/initiatives/{initiative_id}/action-items/{action_item_id}` |
| `scalepad_lm_initiatives_action_items_detach` | write | `write` | `DELETE /lifecycle-manager/v1/initiatives/{initiative_id}/action-items/{action_item_id}` |
| `scalepad_lm_initiatives_action_items_list` | read | `read` | `GET /lifecycle-manager/v1/initiatives/{initiative_id}/action-items` |
| `scalepad_lm_initiatives_assets_attach` | write | `write` | `PUT /lifecycle-manager/v1/initiatives/{initiative_id}/assets` |
| `scalepad_lm_initiatives_assets_detach` | write | `write` | `POST /lifecycle-manager/v1/initiatives/{initiative_id}/assets/detach` |
| `scalepad_lm_initiatives_assigned_user_update` | write | `write` | `PUT /lifecycle-manager/v1/initiatives/{initiative_id}/assigned-user` |
| `scalepad_lm_initiatives_budget_update` | write | `write` | `PUT /lifecycle-manager/v1/initiatives/{id}/budget` |
| `scalepad_lm_initiatives_create` | write | `write` | `POST /lifecycle-manager/v1/initiatives` |
| `scalepad_lm_initiatives_delete` | write | `write` | `DELETE /lifecycle-manager/v1/initiatives/{id}` |
| `scalepad_lm_initiatives_get` | read | `read` | `GET /lifecycle-manager/v1/initiatives/{id}` |
| `scalepad_lm_initiatives_goals_attach` | write | `write` | `POST /lifecycle-manager/v1/initiatives/{initiative_id}/goals/{goal_id}` |
| `scalepad_lm_initiatives_goals_detach` | write | `write` | `DELETE /lifecycle-manager/v1/initiatives/{initiative_id}/goals/{goal_id}` |
| `scalepad_lm_initiatives_goals_list` | read | `read` | `GET /lifecycle-manager/v1/initiatives/{initiative_id}/goals` |
| `scalepad_lm_initiatives_list` | read | `read` | `GET /lifecycle-manager/v1/initiatives` |
| `scalepad_lm_initiatives_list_v2` | read | `read` | `GET /lifecycle-manager/v2/initiatives` |
| `scalepad_lm_initiatives_meetings_attach` | write | `write` | `PUT /lifecycle-manager/v1/initiatives/{initiative_id}/meetings/{meeting_id}` |
| `scalepad_lm_initiatives_meetings_detach` | write | `write` | `DELETE /lifecycle-manager/v1/initiatives/{initiative_id}/meetings/{meeting_id}` |
| `scalepad_lm_initiatives_meetings_list` | read | `read` | `GET /lifecycle-manager/v1/initiatives/{initiative_id}/meetings` |
| `scalepad_lm_initiatives_opportunity_attach` | write | `write` | `POST /lifecycle-manager/v1/initiatives/{initiative_id}/opportunities/{opportunity_id}` |
| `scalepad_lm_initiatives_opportunity_create` | write | `write` | `POST /lifecycle-manager/v1/initiatives/{initiative_id}/opportunity` |
| `scalepad_lm_initiatives_opportunity_delete` | write | `write` | `DELETE /lifecycle-manager/v1/initiatives/{initiative_id}/opportunity` |
| `scalepad_lm_initiatives_opportunity_get` | read | `read` | `GET /lifecycle-manager/v1/initiatives/{initiative_id}/opportunity` |
| `scalepad_lm_initiatives_pdf_get` | read | `read` | `GET /lifecycle-manager/v1/initiatives/{initiative_id}/pdf` |
| `scalepad_lm_initiatives_priority_update` | write | `write` | `PUT /lifecycle-manager/v1/initiatives/{id}/priority` |
| `scalepad_lm_initiatives_quotes_list` | read | `read` | `GET /lifecycle-manager/v1/initiatives/{initiative_id}/quotes` |
| `scalepad_lm_initiatives_recurring_update` | write | `write` | `PUT /lifecycle-manager/v1/initiatives/{id}/recurring` |
| `scalepad_lm_initiatives_schedule_update` | write | `write` | `PUT /lifecycle-manager/v1/initiatives/{id}/schedule` |
| `scalepad_lm_initiatives_status_update` | write | `write` | `PUT /lifecycle-manager/v1/initiatives/{id}/status` |
| `scalepad_lm_initiatives_template_apply` | write | `write` | `POST /lifecycle-manager/v1/initiatives/{initiative_id}/template/{initiative_template_id}/apply` |
| `scalepad_lm_initiatives_ticket_create` | write | `write` | `POST /lifecycle-manager/v1/initiatives/{initiative_id}/ticket` |
| `scalepad_lm_initiatives_ticket_detach` | write | `write` | `DELETE /lifecycle-manager/v1/initiatives/{initiative_id}/ticket` |
| `scalepad_lm_initiatives_ticket_get` | read | `read` | `GET /lifecycle-manager/v1/initiatives/{initiative_id}/ticket` |
| `scalepad_lm_initiatives_update` | write | `write` | `PUT /lifecycle-manager/v1/initiatives/{id}` |
| `scalepad_lm_insights_list` | read | `read` | `GET /lifecycle-manager/v1/insights` |
| `scalepad_lm_meeting_types_create` | write | `write` | `POST /lifecycle-manager/v1/meeting-types` |
| `scalepad_lm_meeting_types_delete` | write | `write` | `DELETE /lifecycle-manager/v1/meeting-types/{meeting_type_id}` |
| `scalepad_lm_meeting_types_list` | read | `read` | `GET /lifecycle-manager/v1/meeting-types` |
| `scalepad_lm_meeting_types_update` | write | `write` | `PUT /lifecycle-manager/v1/meeting-types/{meeting_type_id}` |
| `scalepad_lm_meetings_action_items_attach` | write | `write` | `POST /lifecycle-manager/v1/meetings/{meeting_id}/action-items/{action_item_id}` |
| `scalepad_lm_meetings_action_items_detach` | write | `write` | `DELETE /lifecycle-manager/v1/meetings/{meeting_id}/action-items/{action_item_id}` |
| `scalepad_lm_meetings_action_items_list` | read | `read` | `GET /lifecycle-manager/v1/meetings/{meeting_id}/action-items` |
| `scalepad_lm_meetings_completion_status_update` | write | `write` | `PUT /lifecycle-manager/v1/meetings/{id}/completion-status` |
| `scalepad_lm_meetings_contact_attendees_add` | write | `write` | `POST /lifecycle-manager/v1/meetings/{id}/attendees/contacts` |
| `scalepad_lm_meetings_contact_attendees_remove` | write | `write` | `POST /lifecycle-manager/v1/meetings/{id}/attendees/contacts/delete` |
| `scalepad_lm_meetings_create` | write | `write` | `POST /lifecycle-manager/v1/meetings` |
| `scalepad_lm_meetings_create_v2` | write | `write` | `POST /lifecycle-manager/v2/meetings` |
| `scalepad_lm_meetings_delete` | write | `write` | `DELETE /lifecycle-manager/v1/meetings/{id}` |
| `scalepad_lm_meetings_get` | read | `read` | `GET /lifecycle-manager/v1/meetings/{id}` |
| `scalepad_lm_meetings_goals_attach` | write | `write` | `POST /lifecycle-manager/v1/meetings/{meeting_id}/goals/{goal_id}` |
| `scalepad_lm_meetings_goals_detach` | write | `write` | `DELETE /lifecycle-manager/v1/meetings/{meeting_id}/goals/{goal_id}` |
| `scalepad_lm_meetings_goals_list` | read | `read` | `GET /lifecycle-manager/v1/meetings/{meeting_id}/goals` |
| `scalepad_lm_meetings_initiatives_attach` | write | `write` | `POST /lifecycle-manager/v1/meetings/{meeting_id}/initiatives/{initiative_id}` |
| `scalepad_lm_meetings_initiatives_detach` | write | `write` | `DELETE /lifecycle-manager/v1/meetings/{meeting_id}/initiatives/{initiative_id}` |
| `scalepad_lm_meetings_initiatives_list` | read | `read` | `GET /lifecycle-manager/v1/meetings/{meeting_id}/initiatives` |
| `scalepad_lm_meetings_list` | read | `read` | `GET /lifecycle-manager/v1/meetings` |
| `scalepad_lm_meetings_update` | write | `write` | `PUT /lifecycle-manager/v1/meetings/{id}` |
| `scalepad_lm_meetings_update_v2` | write | `write` | `PUT /lifecycle-manager/v2/meetings/{id}` |
| `scalepad_lm_meetings_user_attendees_add` | write | `write` | `POST /lifecycle-manager/v1/meetings/{id}/attendees/users` |
| `scalepad_lm_meetings_user_attendees_remove` | write | `write` | `POST /lifecycle-manager/v1/meetings/{id}/attendees/users/delete` |
| `scalepad_lm_notes_archive_status_update` | write | `write` | `PUT /lifecycle-manager/v1/notes/{id}/archive-status` |
| `scalepad_lm_notes_create` | write | `write` | `POST /lifecycle-manager/v1/notes` |
| `scalepad_lm_notes_delete` | write | `write` | `DELETE /lifecycle-manager/v1/notes/{id}` |
| `scalepad_lm_notes_get` | read | `read` | `GET /lifecycle-manager/v1/notes/{id}` |
| `scalepad_lm_notes_list` | read | `read` | `GET /lifecycle-manager/v1/notes` |
| `scalepad_lm_notes_update` | write | `write` | `PUT /lifecycle-manager/v1/notes/{id}` |
| `scalepad_lm_opportunities_list` | read | `read` | `GET /lifecycle-manager/v1/opportunities` |
| `scalepad_lm_opportunity_create_fields_get` | read | `read` | `GET /lifecycle-manager/v1/opportunities/create-fields` |
| `scalepad_lm_roadmap_csv_generate` | read | `read` | `POST /lifecycle-manager/v1/roadmap/csv` |
| `scalepad_lm_roadmap_pdf_generate` | read | `read` | `POST /lifecycle-manager/v1/roadmap/pdf` |
| `scalepad_lm_roadmap_spreadsheet_generate` | read | `read` | `POST /lifecycle-manager/v1/roadmap/spreadsheet` |
| `scalepad_lm_saas_utilization_summary_get` | read | `read` | `GET /lifecycle-manager/v1/saas-management/clients/{client_id}/saas-utilization/summary` |
| `scalepad_lm_ticket_create_fields_get` | read | `read` | `GET /lifecycle-manager/v1/tickets/create-fields` |
| `scalepad_lm_user_identity_get` | read | `read` | `GET /lifecycle-manager/v1/user/identity` |
| `scalepad_lm_user_ui_state_get` | read | `read` | `GET /lifecycle-manager/v1/user-ui-states/{state_key}` |
| `scalepad_lm_user_ui_state_put` | write | `write` | `PUT /lifecycle-manager/v1/user-ui-states/{state_key}` |
| `scalepad_lm_warranty_pricing_list` | read | `read` | `GET /lifecycle-manager/v1/warranty/pricing` |

## ControlMap — 98 tools (40 read, 58 write)

Full CRUD. Regional: `us` / `eu` / `ca` / `au`.

| Tool | Access | Tier | Endpoint |
|------|--------|------|----------|
| `scalepad_cm_action_items_create` | write | `write` | `POST /controlmap/v1/clients/{client_id}/action-items` |
| `scalepad_cm_action_items_delete` | write | `write` | `DELETE /controlmap/v1/clients/{client_id}/action-items/{action_item_id}` |
| `scalepad_cm_action_items_generate_signed_urls` | write | `write` | `POST /controlmap/v1/clients/{client_id}/action-items/{action_item_id}/documents/signed-url` |
| `scalepad_cm_action_items_get` | read | `read` | `GET /controlmap/v1/clients/{client_id}/action-items/{action_item_id}` |
| `scalepad_cm_action_items_list_summaries` | read | `read` | `GET /controlmap/v1/clients/action-items-summary` |
| `scalepad_cm_action_items_map` | write | `write` | `POST /controlmap/v1/clients/{client_id}/action-items/{action_item_id}/mappings` |
| `scalepad_cm_action_items_search` | read | `read` | `POST /controlmap/v1/clients/{client_id}/action-items/search` |
| `scalepad_cm_action_items_unmap` | write | `write` | `POST /controlmap/v1/clients/{client_id}/action-items/{action_item_id}/mappings/bulk-delete` |
| `scalepad_cm_action_items_update` | write | `write` | `PATCH /controlmap/v1/clients/{client_id}/action-items/{action_item_id}` |
| `scalepad_cm_action_items_upload_document` | write | `write` | `POST /controlmap/v1/clients/{client_id}/action-items/{action_item_id}/documents` |
| `scalepad_cm_assessments_clear_answer` | write | `write` | `DELETE /controlmap/v1/clients/{client_id}/assessments/common/questions/{question_code}/answer` |
| `scalepad_cm_assessments_create_response` | write | `write` | `POST /controlmap/v1/clients/{client_id}/assessments/common/questions/{question_code}/responses` |
| `scalepad_cm_assessments_delete_response` | write | `write` | `DELETE /controlmap/v1/clients/{client_id}/assessments/common/questions/{question_code}/responses/{response_id}` |
| `scalepad_cm_assessments_get_question` | read | `read` | `GET /controlmap/v1/clients/{client_id}/assessments/common/questions/{question_code}` |
| `scalepad_cm_assessments_get_summary` | read | `read` | `GET /controlmap/v1/clients/{client_id}/assessments/common/summary` |
| `scalepad_cm_assessments_list_summaries` | read | `read` | `GET /controlmap/v1/clients/assessments/common/summary` |
| `scalepad_cm_assessments_map_question` | write | `write` | `POST /controlmap/v1/clients/{client_id}/assessments/common/questions/{question_code}/mappings` |
| `scalepad_cm_assessments_save_answer` | write | `write` | `PUT /controlmap/v1/clients/{client_id}/assessments/common/questions/{question_code}/answer` |
| `scalepad_cm_assessments_search_questions` | read | `read` | `POST /controlmap/v1/clients/{client_id}/assessments/common/questions` |
| `scalepad_cm_assessments_unmap_question` | write | `write` | `DELETE /controlmap/v1/clients/{client_id}/assessments/common/questions/{question_code}/mappings` |
| `scalepad_cm_assessments_update_response` | write | `write` | `PATCH /controlmap/v1/clients/{client_id}/assessments/common/questions/{question_code}/responses` |
| `scalepad_cm_controls_create` | write | `write` | `POST /controlmap/v1/clients/{client_id}/controls` |
| `scalepad_cm_controls_delete` | write | `write` | `DELETE /controlmap/v1/clients/{client_id}/controls/{control_id}` |
| `scalepad_cm_controls_get` | read | `read` | `GET /controlmap/v1/clients/{client_id}/controls/{control_id}` |
| `scalepad_cm_controls_get_summary` | read | `read` | `GET /controlmap/v1/clients/{client_id}/controls-summary` |
| `scalepad_cm_controls_list_families` | read | `read` | `GET /controlmap/v1/clients/{client_id}/control-families` |
| `scalepad_cm_controls_list_sets` | read | `read` | `GET /controlmap/v1/clients/{client_id}/control-sets` |
| `scalepad_cm_controls_list_summaries` | read | `read` | `GET /controlmap/v1/clients/controls-summary` |
| `scalepad_cm_controls_map` | write | `write` | `POST /controlmap/v1/clients/{client_id}/controls/{control_id}/mappings` |
| `scalepad_cm_controls_search` | read | `read` | `POST /controlmap/v1/clients/{client_id}/controls/search` |
| `scalepad_cm_controls_unmap` | write | `write` | `POST /controlmap/v1/clients/{client_id}/controls/{control_id}/mappings/bulk-delete` |
| `scalepad_cm_controls_update` | write | `write` | `PATCH /controlmap/v1/clients/{client_id}/controls/{control_id}` |
| `scalepad_cm_documents_delete` | write | `write` | `DELETE /controlmap/v1/clients/{client_id}/documents/{document_id}` |
| `scalepad_cm_documents_get_signed_url` | read | `read` | `GET /controlmap/v1/clients/{client_id}/documents/{document_id}` |
| `scalepad_cm_evidence_create` | write | `write` | `POST /controlmap/v1/clients/{client_id}/evidences` |
| `scalepad_cm_evidence_delete` | write | `write` | `DELETE /controlmap/v1/clients/{client_id}/evidences/{evidence_id}` |
| `scalepad_cm_evidence_delete_schedule` | write | `write` | `DELETE /controlmap/v1/clients/{client_id}/evidences/{evidence_id}/schedule` |
| `scalepad_cm_evidence_get` | read | `read` | `GET /controlmap/v1/clients/{client_id}/evidences/{evidence_id}` |
| `scalepad_cm_evidence_list_summaries` | read | `read` | `GET /controlmap/v1/clients/evidences-summary` |
| `scalepad_cm_evidence_map` | write | `write` | `POST /controlmap/v1/clients/{client_id}/evidences/{evidence_id}/mappings` |
| `scalepad_cm_evidence_refresh_mappings` | write | `write` | `POST /controlmap/v1/clients/{client_id}/evidence-mappings/refresh` |
| `scalepad_cm_evidence_requests_archive` | write | `write` | `POST /controlmap/v1/clients/{client_id}/evidence-requests/{evidence_request_id}/archive` |
| `scalepad_cm_evidence_requests_create` | write | `write` | `POST /controlmap/v1/clients/{client_id}/evidences/{evidence_id}/requests` |
| `scalepad_cm_evidence_requests_create_link` | write | `write` | `POST /controlmap/v1/clients/{client_id}/evidence-requests/links` |
| `scalepad_cm_evidence_requests_create_with_upload` | write | `write` | `POST /controlmap/v1/clients/{client_id}/evidences/{evidence_id}/documents` |
| `scalepad_cm_evidence_requests_create_with_urls` | write | `write` | `POST /controlmap/v1/clients/{client_id}/evidences/{evidence_id}/documents/signed-url` |
| `scalepad_cm_evidence_requests_delete` | write | `write` | `DELETE /controlmap/v1/clients/{client_id}/evidence-requests/{evidence_request_id}` |
| `scalepad_cm_evidence_requests_list` | read | `read` | `GET /controlmap/v1/clients/{client_id}/evidences/{evidence_id}/requests` |
| `scalepad_cm_evidence_requests_signed_urls` | write | `write` | `POST /controlmap/v1/clients/{client_id}/evidence-requests/{evidence_request_id}/documents/signed-url` |
| `scalepad_cm_evidence_requests_update` | write | `write` | `PATCH /controlmap/v1/clients/{client_id}/evidence-requests/{evidence_request_id}` |
| `scalepad_cm_evidence_requests_upload_document` | write | `write` | `POST /controlmap/v1/clients/{client_id}/evidence-requests/{evidence_request_id}/documents` |
| `scalepad_cm_evidence_search` | read | `read` | `POST /controlmap/v1/clients/{client_id}/evidences/search` |
| `scalepad_cm_evidence_unmap` | write | `write` | `POST /controlmap/v1/clients/{client_id}/evidences/{evidence_id}/mappings/bulk-delete` |
| `scalepad_cm_evidence_update` | write | `write` | `PATCH /controlmap/v1/clients/{client_id}/evidences/{evidence_id}` |
| `scalepad_cm_governance_create` | write | `write` | `POST /controlmap/v1/clients/{client_id}/governance` |
| `scalepad_cm_governance_delete` | write | `write` | `DELETE /controlmap/v1/clients/{client_id}/governance/{governance_id}` |
| `scalepad_cm_governance_get` | read | `read` | `GET /controlmap/v1/clients/{client_id}/governance/{governance_id}` |
| `scalepad_cm_governance_list_summaries` | read | `read` | `GET /controlmap/v1/clients/governance-summary` |
| `scalepad_cm_governance_map` | write | `write` | `POST /controlmap/v1/clients/{client_id}/governance/{governance_id}/mappings` |
| `scalepad_cm_governance_search` | read | `read` | `POST /controlmap/v1/clients/{client_id}/governance/search` |
| `scalepad_cm_governance_unmap` | write | `write` | `POST /controlmap/v1/clients/{client_id}/governance/{governance_id}/mappings/bulk-delete` |
| `scalepad_cm_governance_update` | write | `write` | `PATCH /controlmap/v1/clients/{client_id}/governance/{governance_id}` |
| `scalepad_cm_health_get` | read | `read` | `GET /controlmap/v1/clients/{client_id}/health` |
| `scalepad_cm_health_list` | read | `read` | `GET /controlmap/v1/clients/health` |
| `scalepad_cm_objectives_get` | read | `read` | `GET /controlmap/v1/clients/{client_id}/frameworks/{framework_id}/objectives/{objective_id}` |
| `scalepad_cm_objectives_get_summary` | read | `read` | `GET /controlmap/v1/clients/{client_id}/frameworks/objectives/summary` |
| `scalepad_cm_objectives_list_summaries` | read | `read` | `GET /controlmap/v1/clients/frameworks/objectives/summary` |
| `scalepad_cm_objectives_search` | read | `read` | `POST /controlmap/v1/clients/{client_id}/frameworks/{framework_id}/objectives/search` |
| `scalepad_cm_policies_create` | write | `write` | `POST /controlmap/v1/clients/{client_id}/policies` |
| `scalepad_cm_policies_delete` | write | `write` | `DELETE /controlmap/v1/clients/{client_id}/policies/{policy_id}` |
| `scalepad_cm_policies_delete_section` | write | `write` | `DELETE /controlmap/v1/clients/{client_id}/policies/{policy_id}/sections/{section_id}` |
| `scalepad_cm_policies_get` | read | `read` | `GET /controlmap/v1/clients/{client_id}/policies/{policy_id}` |
| `scalepad_cm_policies_list_summaries` | read | `read` | `GET /controlmap/v1/clients/policies-summary` |
| `scalepad_cm_policies_map` | write | `write` | `POST /controlmap/v1/clients/{client_id}/policies/{policy_id}/mappings` |
| `scalepad_cm_policies_search` | read | `read` | `POST /controlmap/v1/clients/{client_id}/policies/search` |
| `scalepad_cm_policies_unmap` | write | `write` | `POST /controlmap/v1/clients/{client_id}/policies/{policy_id}/mappings/bulk-delete` |
| `scalepad_cm_policies_update` | write | `write` | `PATCH /controlmap/v1/clients/{client_id}/policies/{policy_id}` |
| `scalepad_cm_policies_upsert_section` | write | `write` | `PUT /controlmap/v1/clients/{client_id}/policies/{policy_id}/sections` |
| `scalepad_cm_procedures_create` | write | `write` | `POST /controlmap/v1/clients/{client_id}/procedures` |
| `scalepad_cm_procedures_delete` | write | `write` | `DELETE /controlmap/v1/clients/{client_id}/procedures/{procedure_id}` |
| `scalepad_cm_procedures_get` | read | `read` | `GET /controlmap/v1/clients/{client_id}/procedures/{procedure_id}` |
| `scalepad_cm_procedures_list_summaries` | read | `read` | `GET /controlmap/v1/clients/procedures-summary` |
| `scalepad_cm_procedures_map` | write | `write` | `POST /controlmap/v1/clients/{client_id}/procedures/{procedure_id}/mappings` |
| `scalepad_cm_procedures_search` | read | `read` | `POST /controlmap/v1/clients/{client_id}/procedures/search` |
| `scalepad_cm_procedures_unmap` | write | `write` | `POST /controlmap/v1/clients/{client_id}/procedures/{procedure_id}/mappings/bulk-delete` |
| `scalepad_cm_procedures_update` | write | `write` | `PATCH /controlmap/v1/clients/{client_id}/procedures/{procedure_id}` |
| `scalepad_cm_reports_get_signed_url` | read | `read` | `GET /controlmap/v1/clients/{client_id}/reports/{report_id}/signed-url` |
| `scalepad_cm_reports_list` | read | `read` | `POST /controlmap/v1/clients/{client_id}/reports` |
| `scalepad_cm_risks_create` | write | `write` | `POST /controlmap/v1/clients/{client_id}/risks` |
| `scalepad_cm_risks_delete` | write | `write` | `DELETE /controlmap/v1/clients/{client_id}/risks/{risk_id}` |
| `scalepad_cm_risks_get` | read | `read` | `GET /controlmap/v1/clients/{client_id}/risks/{risk_id}` |
| `scalepad_cm_risks_get_category` | read | `read` | `GET /controlmap/v1/clients/{client_id}/risk-categories/{risk_category_id}` |
| `scalepad_cm_risks_list_departments` | read | `read` | `GET /controlmap/v1/clients/{client_id}/risks/departments` |
| `scalepad_cm_risks_list_summaries` | read | `read` | `GET /controlmap/v1/clients/risks-summary` |
| `scalepad_cm_risks_map` | write | `write` | `POST /controlmap/v1/clients/{client_id}/risks/{risk_id}/mappings` |
| `scalepad_cm_risks_search` | read | `read` | `POST /controlmap/v1/clients/{client_id}/risks/search` |
| `scalepad_cm_risks_unmap` | write | `write` | `POST /controlmap/v1/clients/{client_id}/risks/{risk_id}/mappings/bulk-delete` |
| `scalepad_cm_risks_update` | write | `write` | `PATCH /controlmap/v1/clients/{client_id}/risks/{risk_id}` |

## Backup Radar — 3 tools (3 read, 0 write)

Read-only in its entirety. Regional: `us` / `eu`.

| Tool | Access | Tier | Endpoint |
|------|--------|------|----------|
| `scalepad_br_backups_get_health` | read | `read` | `GET /backup-radar/v3/clients/{id}/health` |
| `scalepad_br_backups_list_devices` | read | `read` | `GET /backup-radar/v3/clients/devices` |
| `scalepad_br_backups_list_health` | read | `read` | `GET /backup-radar/v3/clients/health` |

## Quoter — 61 tools (27 read, 34 write)

Full CRUD. Hosted at `api.scalepad.com/quoter` by default; the two `_auth_` tools target the standalone `api.quoter.com` host instead.

| Tool | Access | Tier | Endpoint |
|------|--------|------|----------|
| `scalepad_quoter_auth_authorize` | read | `admin` | `POST /v1/auth/oauth/authorize` |
| `scalepad_quoter_auth_refresh` | read | `admin` | `POST /v1/auth/refresh` |
| `scalepad_quoter_categories_create` | write | `write` | `POST /v1/categories` |
| `scalepad_quoter_categories_delete` | write | `write` | `DELETE /v1/categories/{id}` |
| `scalepad_quoter_categories_get` | read | `read` | `GET /v1/categories/{id}` |
| `scalepad_quoter_categories_list` | read | `read` | `GET /v1/categories` |
| `scalepad_quoter_categories_update` | write | `write` | `PATCH /v1/categories/{id}` |
| `scalepad_quoter_contacts_create` | write | `write` | `POST /v1/contacts` |
| `scalepad_quoter_contacts_get` | read | `read` | `GET /v1/contacts/{id}` |
| `scalepad_quoter_contacts_list` | read | `read` | `GET /v1/contacts` |
| `scalepad_quoter_contacts_update` | write | `write` | `PATCH /v1/contacts/{id}` |
| `scalepad_quoter_datafeeds_list_supplier_items` | read | `read` | `GET /v1/datafeeds/supplier-items` |
| `scalepad_quoter_datafeeds_list_suppliers` | read | `read` | `GET /v1/datafeeds/suppliers` |
| `scalepad_quoter_item_group_assignments_create` | write | `write` | `POST /v1/item-group-item-assignments` |
| `scalepad_quoter_item_group_assignments_delete` | write | `write` | `DELETE /v1/item-group-item-assignments/{id}` |
| `scalepad_quoter_item_group_assignments_get` | read | `read` | `GET /v1/item-group-item-assignments/{id}` |
| `scalepad_quoter_item_group_assignments_list` | read | `read` | `GET /v1/item-group-item-assignments` |
| `scalepad_quoter_item_groups_create` | write | `write` | `POST /v1/item-groups` |
| `scalepad_quoter_item_groups_delete` | write | `write` | `DELETE /v1/item-groups/{id}` |
| `scalepad_quoter_item_groups_get` | read | `read` | `GET /v1/item-groups/{id}` |
| `scalepad_quoter_item_groups_list` | read | `read` | `GET /v1/item-groups` |
| `scalepad_quoter_item_groups_update` | write | `write` | `PATCH /v1/item-groups/{id}` |
| `scalepad_quoter_item_option_values_create` | write | `write` | `POST /v1/item-option-values` |
| `scalepad_quoter_item_option_values_delete` | write | `write` | `DELETE /v1/item-option-values/{id}` |
| `scalepad_quoter_item_option_values_get` | read | `read` | `GET /v1/item-option-values/{id}` |
| `scalepad_quoter_item_option_values_list` | read | `read` | `GET /v1/item-option-values` |
| `scalepad_quoter_item_option_values_update` | write | `write` | `PATCH /v1/item-option-values/{id}` |
| `scalepad_quoter_item_options_create` | write | `write` | `POST /v1/item-options` |
| `scalepad_quoter_item_options_delete` | write | `write` | `DELETE /v1/item-options/{id}` |
| `scalepad_quoter_item_options_get` | read | `read` | `GET /v1/item-options/{id}` |
| `scalepad_quoter_item_options_list` | read | `read` | `GET /v1/item-options` |
| `scalepad_quoter_item_options_update` | write | `write` | `PATCH /v1/item-options/{id}` |
| `scalepad_quoter_item_tiers_create` | write | `write` | `POST /v1/item-tiers` |
| `scalepad_quoter_item_tiers_delete` | write | `write` | `DELETE /v1/item-tiers/{id}` |
| `scalepad_quoter_item_tiers_get` | read | `read` | `GET /v1/item-tiers/{id}` |
| `scalepad_quoter_item_tiers_list` | read | `read` | `GET /v1/item-tiers` |
| `scalepad_quoter_item_tiers_update` | write | `write` | `PATCH /v1/item-tiers/{id}` |
| `scalepad_quoter_items_create` | write | `write` | `POST /v1/items` |
| `scalepad_quoter_items_delete` | write | `write` | `DELETE /v1/items/{id}` |
| `scalepad_quoter_items_get` | read | `read` | `GET /v1/items/{id}` |
| `scalepad_quoter_items_list` | read | `read` | `GET /v1/items` |
| `scalepad_quoter_items_update` | write | `write` | `PATCH /v1/items/{id}` |
| `scalepad_quoter_line_items_create` | write | `write` | `POST /v1/line-items` |
| `scalepad_quoter_manufacturers_create` | write | `write` | `POST /v1/manufacturers` |
| `scalepad_quoter_manufacturers_delete` | write | `write` | `DELETE /v1/manufacturers/{id}` |
| `scalepad_quoter_manufacturers_get` | read | `read` | `GET /v1/manufacturers/{id}` |
| `scalepad_quoter_manufacturers_list` | read | `read` | `GET /v1/manufacturers` |
| `scalepad_quoter_manufacturers_update` | write | `write` | `PATCH /v1/manufacturers/{id}` |
| `scalepad_quoter_quote_templates_list` | read | `read` | `GET /v1/quote-templates` |
| `scalepad_quoter_quotes_create` | write | `write` | `POST /v1/quotes` |
| `scalepad_quoter_quotes_create_section` | write | `write` | `POST /v1/quotes/{quote_id}/sections` |
| `scalepad_quoter_quotes_create_section_line_item` | write | `write` | `POST /v1/quotes/{quote_id}/sections/{section_id}/line-items` |
| `scalepad_quoter_quotes_get` | read | `read` | `GET /v1/quotes/{quote_id}` |
| `scalepad_quoter_quotes_list` | read | `read` | `GET /v1/quotes` |
| `scalepad_quoter_quotes_publish` | write | `write` | `POST /v1/quotes/{quote_id}/publish` |
| `scalepad_quoter_quotes_update_line_item` | write | `write` | `PATCH /v1/quotes/{quote_id}/sections/{section_id}/line-items/{line_item_id}` |
| `scalepad_quoter_suppliers_create` | write | `write` | `POST /v1/suppliers` |
| `scalepad_quoter_suppliers_delete` | write | `write` | `DELETE /v1/suppliers/{id}` |
| `scalepad_quoter_suppliers_get` | read | `read` | `GET /v1/suppliers/{id}` |
| `scalepad_quoter_suppliers_list` | read | `read` | `GET /v1/suppliers` |
| `scalepad_quoter_suppliers_update` | write | `write` | `PATCH /v1/suppliers/{id}` |

## Keeping this current

Regenerate the comparison with the repo's drift audit, which scans the
server's registration code:

```
node scripts/tool-drift-audit.mjs --servers ~/mcp
```

`scalepad/scalepad` must report `DRIFT 0`. `UNDOC` counts tools no plugin
doc names; with this file present it is 0.
