# Connected sources: Vendor App Compromise Response

Start with `conduit__search_tools`; these are canonical catalog names,
not live gateway spellings. Discover exact names/schemas and use only
these reads. Bind every CIPP/Graph call to the one mapped tenant; if the
schema/connection cannot enforce that scope, the source is unavailable.
Never use `allTenants`. Mapping must precede correlation.

## Mapping

PSA/RMM mapping examples: `autotask_search_companies`,
`halopsa_clients_list`, `cw_search_companies`, `syncro_customers_list`,
`superops_clients_list`, `ninjaone_organizations_list`,
`cwautomate_clients_list`, `datto_list_sites`.
Identity: `cipp_list_tenants`, `cipp_get_tenant_details`, only within the
scope rule above. An unbound tenant-list call is unavailable; obtain the
mapping from the operator instead.

## Identity reads and limits

| Canonical tool | Allowed use / coverage limit |
|---|---|
| `cipp_list_enterprise_apps` | `tenantFilter=<one tenant>`, `includeBuiltIn` per discovered schema. appId, displayName, publisher, owner organization only; no grants or credential metadata. Error rows mean unavailable. |
| `cipp_list_audit_logs` | `tenantFilter`, optional `startDate`, `endDate`, `userId`, `operation`. Customer M365 UAL, not `cipp_list_logs`. Minutes-to-hours lag; license-dependent retention. |
| `cipp_list_user_signin_logs` | `tenantFilter`, `userId`, optional `top`. One user's recent interactive sign-ins only; neither service-principal nor non-interactive sign-ins. |
| `cipp_list_users`, `cipp_list_mfa_users` | One tenant; unexpected/new/re-enabled users only where returned fields support the finding. |
| `cipp_bec_check` | Only after a specific user is implicated; hand off to BEC Response. |
| `cipp_list_gdap_roles`, `cipp_list_gdap_invites` | Partner role templates / pending invites only, not complete Partner Center relationships or client change history. Only if mapped partner-tenant binding is possible. |
| `cipp_get_tenant_details` | One tenant's details, including GDAP relationship status. |
| `microsoft_graph_suggest_queries` | First Graph step for each tenant/resource investigation; obtain tenant-bound GET candidates, never invent endpoints. |
| `microsoft_graph_list_properties` | Confirm selectable properties only on allowed resources. |
| `microsoft_graph_get` | Returned tenant-bound GET candidates for the allowlist below only. |
| `saas_alerts_events_query` | One mapped customer only; no advanced cross-tenant query. |

Graph allowlist: applications / servicePrincipals; oauth2PermissionGrants /
appRoleAssignments; directory / unified audit logs; service-principal
sign-in logs; non-interactive user sign-in logs. No candidate means a gap,
not permission to construct an endpoint. Do not call `request_access`
unless requested by the operator.

Safe credential metadata requires security review. Only keyId,
displayName, startDateTime, endDateTime exposed safely by a discovered
suggest_queries candidate / list_properties schema on a GET may be read.
Never select the whole passwordCredentials/keyCredentials object, secretText,
or key material, and never retain secret values. Without a safe metadata
candidate: gap and operator Certificates & secrets inspection in Entra.

Example parameter shapes, only after discovery confirms these schemas:

```json
{"tenantFilter":"<one-mapped-tenant>","includeBuiltIn":false}
```

```json
{"tenantFilter":"<one-mapped-tenant>","startDate":"<UTC-start>","endDate":"<UTC-end>","operation":"MailItemsAccessed"}
```

```json
{"tenantFilter":"<one-mapped-tenant>","userId":"<implicated-user-id>","top":50}
```

CIPP enterprise-app, audit, sign-in, MFA, BEC, GDAP roles/invites, tenant
details and `microsoft_graph_get` are admin-tier reads. Refusal or missing
discovery is a coverage gap; do not seek alternate access around it.

## Optional corroboration

Only for the mapped customer and window, using discovered scoping:
- Huntress: `huntress_incidents_list`, `huntress_incidents_get`,
  `huntress_signals_list`, `huntress_signals_get`,
  `huntress_agents_list`, `huntress_agents_get`.
- SentinelOne: `list_alerts`, `search_alerts`, `get_alert`,
  `search_inventory_items`.
- Blackpoint: `blackpoint_detections_list`, `blackpoint_assets_list`,
  `blackpoint_assets_search`.
- RocketCyber: `rocketcyber_list_incidents`, `rocketcyber_list_events`,
  `rocketcyber_list_agents`.

These corroborate endpoint activity, not Entra coverage. Huntress MCP has
no dedicated ITDR/Entra sign-in tool in this catalog.

## Documentation inventory, never secret retrieval

Allowed titles/folders only: `hudu_list_assets`, IT Glue
`search_flexible_assets` / `search_configurations`, Keeper `list_secrets` /
`list_folders`. Minimize returned fields; do not fetch content/values.
Never call `hudu_list_asset_passwords`, `hudu_get_asset_password`,
`search_passwords`, `get_password`, `search_secrets`, `get_secret`,
`get_field`, or `get_totp_code`.

## Never-call writes and catalog gaps

Never call create/update/delete/isolate/disable/reset/revoke/add/write,
addPassword/removePassword, raw/execute/passthrough/custom-mutation or
$batch tools. Specifically prohibited: `cipp_revoke_sessions`,
`cipp_disable_user`, `cipp_reset_password`, `cipp_reset_mfa`,
`cipp_edit_user`, `cipp_create_user`, and
`saas_alerts_events_query_advanced`. No verified Graph write is authorized;
no POST/PATCH/DELETE/$batch. Recommend actions for explicit operator approval.

Meraki `execute_api` is an unbounded admin passthrough for this workflow;
do not call it. No Partner Center connector exists in the marketplace.
No verified tool lists complete Partner Center GDAP relationships or vendor
egress IPs. Operator checks Partner Center / Entra admin center and supplies
normal egress/current IOCs. Inventory alone cannot establish actual grants,
credential history, non-interactive sign-ins, or downstream activity.
