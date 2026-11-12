# Field reader verification

Verified 2026-11-11 against the default branches of the `WYRE-AI` vendor MCP
repositories (`datto-rmm-mcp`, `node-datto-rmm`, `ninjaone-mcp`, `ncentral-mcp`,
`superops-mcp`, `syncro-mcp`, `node-syncro`, `atera-mcp`, `node-atera`,
`connectwise-automate-mcp`, `node-connectwise-automate`, `kaseya-vsa-mcp`,
`node-kaseya-vsa`) and Conduit `main` at
`ee114da9ebf253a17a09555cd981a579d373f2c7`.
No live endpoint or RMM credentials were used. Discover schemas at runtime;
these canonical names are not assumed gateway spellings.

| RMM | Verified source path and result | Conduit classification |
|-----|--------------------------------|------------------------|
| Datto | `datto-rmm-mcp/src/mcp-server.ts`: `datto_get_device` calls the device getter and serializes the complete object. `datto_list_devices` collects account/site Device objects without field projection. `node-datto-rmm/src/types/devices.ts`: `Device.udf` is a string map, documented UDF1–30; account/site response types contain Device arrays. Thus lists may contain UDFs; use the getter when absent. | `src/proxy/result-cache.ts`: getter/list are `isWrite:false`, no `isAdmin`. |
| NinjaOne | `ninjaone-mcp/src/domains/devices.ts`: `ninjaone_devices_get_custom_fields` takes `device_id`, calls `devices.getCustomFields`, and serializes returned fields without projection. | Explicit `isWrite:false`, no `isAdmin`. |
| N-central | `ncentral-mcp/src/domains/custom-properties.ts`: `ncentral_list_device_custom_properties` takes `deviceId` and pagination; `ncentral_get_device_custom_property` takes `deviceId`/`propertyId`; both return custom property data. | Both explicit `isWrite:false`, no `isAdmin`. Update is write and excluded. |
| SuperOps | `superops-mcp/src/domains/assets.ts`: `superops_assets_get` takes `assetId`; its getAsset GraphQL selection includes bare `customFields`. `src/types.ts` models JSON scalar values. | Explicit `isWrite:false`, no `isAdmin`. Custom passthrough query/mutation excluded. |
| Syncro | `syncro-mcp/src/domains/assets.ts`: `syncro_assets_get` takes `asset_id`, serializes `client.assets.get()` unchanged. `node-syncro/src/resources/assets.ts` unwraps the returned asset; `src/types/assets.ts` includes `properties`. The public asset-detail example contains custom properties. | Explicit `isWrite:false`, no `isAdmin`. |
| Atera | `atera-mcp/src/domains/` exposes agents/alerts/customers/tickets/contacts, no custom-values domain/tool. `node-atera/src/resources/custom-values.ts` has client support that MCP does not expose. `atera_agents_get` is not a custom-field reader. | Reader gap; do not invent one. |
| Automate | `connectwise-automate-mcp/src/domains/computers.ts`: `cwautomate_computers_get` returns Computer data. `node-connectwise-automate/src/types/computers.ts` has no EDF value property; no exposed EDF reader. | Reader gap. |
| Kaseya VSA | `kaseya-vsa-mcp/src/index.ts`: `kaseya_vsa_get_agent` calls `agents.get`; `node-kaseya-vsa/src/resources/agents.ts` uses the agent asset-management resource. No custom-field tool is registered. An open-ended agent index signature is not evidence that custom fields are returned. | Reader gap. |

Syncro public evidence: [official API documentation](https://api-docs.syncromsp.com/)
and [public OpenAPI document](https://api-docs.syncromsp.com/swagger.json):
asset detail response example, `asset.properties`. These are documentation
GETs only; no customer API was called.

Follow-up candidate only: `kaseya_vsa_get_software_inventory` calls
`audit.listSoftware` and returns installed-software audit rows. However its
exact name is absent from this Conduit snapshot's explicit tool configuration
and tier-review inventory; the lookup fails closed for unclassified tools.
It was **not verified as read-tier** and is not added to this skill's evidence
allowlist. Verify classification and runtime discovery before a separate
scope expansion.
