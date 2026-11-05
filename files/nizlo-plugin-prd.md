# Plugin PRD: Nizlo/RMM/Read-only fleet operations

## Summary

Add a vendor-contributed Nizlo plugin that gives MSP technicians a deliberately read-only way to inspect fleet posture, customers, sites, endpoints, and alerts, including a seven-day stale-endpoint report, through a local stdio MCP server backed by Nizlo's tenant-scoped management API.

## Problem

Nizlo operators can answer fleet-health questions in the console, but an MSP technician working in Claude Code cannot currently retrieve that context through this marketplace. Common questions such as which endpoints have not checked in for seven days require paging through endpoint data, applying a consistent UTC cutoff, and preserving customer boundaries. The first release should solve that bounded read workflow without introducing remote control, script execution, patch installation, alert mutation, or another credential-storage service.

## User Stories

- As an MSP service-desk technician, I want to find an endpoint by hostname and see its customer, site, operating system, status, and last-seen time so that I can establish context before troubleshooting.
- As an MSP operations lead, I want a list of endpoints not seen for seven days, grouped by customer with exact last-seen timestamps, so that I can review monitoring coverage without manually combining pages.
- As an MSP technician, I want to review active alerts and a bounded fleet summary so that I can prioritize investigation without switching to another console for the initial read.
- As an MSP security administrator, I want the integration restricted to explicit read routes and narrow token permissions so that adopting it does not silently authorize remote access or endpoint changes.

## Scope

### In Scope

- A local stdio MCP server with six read-only tools:
  - `nizlo_dashboard_summary`
  - `nizlo_list_customers`
  - `nizlo_list_sites`
  - `nizlo_list_devices`
  - `nizlo_list_alerts`
  - `nizlo_stale_endpoints`
- Skills for API/authentication patterns, fleet and endpoint lookup, customer/site context, alerts, and stale-endpoint review.
- Stable pagination using `page` and `pageSize`, with a default page size of 50 and an API maximum of 200 for the proposed routes.
- A locally generated stale-endpoint report with a seven-day default, UTC cutoff, customer-ID grouping, exact source timestamps, and detection of duplicate or changing inventory during a paginated scan.
- Controlled handling for invalid credentials, missing permissions, invalid JSON/UTF-8 responses, API errors, timeouts, and HTTP 429 responses.
- Documentation-based implementation followed by live verification against a vendor-owned sandbox before implementation is proposed for merge.

### Out of Scope

- Any non-GET request or endpoint mutation.
- Script execution, patch installation, jobs, alert acknowledgement/resolution, terminal access, file access, remote-control launch, enrollment, or token administration.
- Webhook creation or delivery management in the first release.
- Service-account claims. Nizlo currently uses personal access tokens accountable to an active technician.
- Cross-tenant aggregation or a caller-supplied tenant selector.
- A WYRE-operated proxy, hosted credential vault, or hosted data store.
- Claims of independent MSP verification before a community operator performs it.

## Technical Approach

### API Endpoints Used

The public first-party API overview is [Nizlo RMM API and Webhooks](https://nizlo.com/rmm-api). Interactive OpenAPI documentation may be access-restricted in production. All routes use the production base `https://app.nizlo.com/api/v1`.

- `GET /dashboard/summary` - bounded fleet counts, recent activity/alerts, and technician attention queues; requires `devices.view`.
- `GET /customers?page=&pageSize=&search=` - tenant-scoped customer pages; requires `devices.view`.
- `GET /sites?page=&pageSize=&search=` - tenant-scoped site pages; requires `devices.view`.
- `GET /devices?page=&pageSize=&search=&status=&customerId=&siteId=` - tenant-scoped endpoint pages; requires `devices.view`.
- `GET /alerts?page=&pageSize=&search=&status=&severity=` - tenant-scoped alert pages; requires `alerts.view`.

The MCP server will maintain an exact allowlist of these five GET paths. It will reject non-HTTPS base URLs, non-GET methods, path traversal, query parameters outside each tool's schema, and redirects to a different origin.

### Authentication Requirements

- `Authorization: Bearer nizlo_pat_...` personal access token.
- `NIZLO_API_TOKEN` supplies the token to the local MCP process; it must never be accepted as a command argument or written to logs.
- `NIZLO_BASE_URL` defaults to `https://app.nizlo.com/api/v1/` and accepts only an absolute HTTPS URL for explicit sandbox testing.
- The technician creates and revokes tokens through the authenticated Nizlo console. Bearer credentials cannot administer their own token lifecycle.
- Tokens select 1-32 permissions and a 30, 90, 180, or 365-day lifetime. Effective access remains the intersection of token scope and the technician's current role.
- The proposed least-privilege scope is `devices.view` plus `alerts.view`. A deployment that omits alert tools can use only `devices.view`.

### Data Flow

Claude Code calls the local stdio MCP server. The server validates tool arguments, builds one allowlisted HTTPS GET request, and sends it directly to the Nizlo API with the bearer token from the local process environment. Nizlo derives the tenant from the authenticated technician and token; the caller never supplies a tenant ID. The server returns bounded JSON to the invoking local session and does not persist API responses. No customer data or credential passes through a WYRE-operated intermediary.

For `nizlo_stale_endpoints`, the server serially retrieves active endpoint pages, deduplicates endpoint IDs, applies a UTC cutoff, and groups by immutable customer ID while retaining the display name. It returns endpoint ID, display name or hostname, operating system, and exact `lastSeenAt` value, including an explicit never-seen state. Page totals, ordering, and deduplicated IDs can detect some inventory drift but cannot prove a consistent inventory snapshot. Until the endpoint API supplies a snapshot token or inventory version that spans every page, the report must identify completeness as unverified rather than claiming that every endpoint present during the scan was observed.

### Rate Limiting and Pagination

- Use serial pagination; do not fan out page requests.
- Stop when the authoritative page metadata indicates that the final page has been read; do not treat the total, page ordering, or deduplicated IDs as proof of snapshot consistency.
- Reject page values below 1 and page sizes outside 1-200 before sending a request.
- On HTTP 429, honor `Retry-After` only when the requested delay is at most 30 seconds and the retry would remain inside a 120-second overall scan deadline. Otherwise return the incomplete-scan error. When `Retry-After` is absent, use bounded exponential backoff with jitter, the same deadline, and a fixed retry ceiling.
- Surface an incomplete-scan error instead of returning a partial stale-endpoint report after retry exhaustion or detected inventory drift. When no drift is detected but the endpoint API offers no snapshot/version contract, return the report with completeness explicitly marked unverified.

## Security Considerations

- **Credential handling**: `NIZLO_API_TOKEN` remains in the local MCP process environment. The plugin must redact the token, authorization header, and token prefix from exceptions, traces, and tool output. It introduces no new credential store.
- **Scope narrowing**: the implementation exposes only five GET paths. Documentation directs operators to grant only `devices.view` and, when alert tools are enabled, `alerts.view`. The server refuses every mutation even when the token holder has broader role authority.
- **Per-tenant isolation**: Nizlo derives the tenant from the active technician/token relationship and repeats tenant boundaries server-side. Tool schemas contain no tenant selector. Same-named customers remain distinct by immutable customer ID.
- **Data sensitivity**: responses can contain endpoint names, operating-system details, IP/network context, customer/site names, alert descriptions, and technician-visible activity. Data flows directly from Nizlo to the operator's local process and must not be written to plugin logs or a hosted cache. When Claude Code uses a remotely hosted model, MCP tool results can leave the local process as model context; local stdio transport and disabled plugin logging do not prevent that transfer. Before use, operators must review and approve the configured model provider's customer-data processing, retention, and training policies.
- **Audit logging**: Nizlo retains coarsened personal-token usage receipts and applies its existing API authorization/audit controls. The plugin adds no remote audit sink. Local Claude Code and shell history policies remain the operator's responsibility.
- **Transport**: the default and every override must use HTTPS. Redirects that change scheme or origin are rejected before resending the authorization header.

## Testing Plan

- **Live connection smoke test**: create a short-lived sandbox token with `devices.view` and `alerts.view`; verify each tool against a vendor-owned sandbox containing at least two customers, two sites, active/offline endpoints, and active/resolved alerts.
- **Scope/permission enforcement test**: verify a `devices.view`-only token can use device/customer/site/summary tools but receives a controlled permission failure for alerts. Verify the MCP server rejects all non-GET methods and non-allowlisted paths locally. Confirm a direct API mutation attempted with the narrow test token is denied by Nizlo.
- **Multi-tenant isolation test**: use two sandbox workspaces with distinct tokens and sentinel records. Confirm each token returns only its own workspace and that no tool accepts a tenant selector or foreign identifier to cross the boundary.
- **Tool-anchoring/drift check**: run `check-doc-references.mjs` and `check-tool-anchoring.mjs` against the plugin and confirm all six documented tool names match the live MCP server.
- **Pagination consistency test**: seed more than one page of endpoints, include same-named customers with different IDs and null/old/recent timestamps, and verify the stale report groups correctly. Mutate ordering during a test scan and confirm the tool fails closed instead of returning a partial report. Without a snapshot token or inventory version, confirm a successful scan labels completeness unverified even when totals and deduplicated IDs appear stable.
- **Rate-limit behavior test**: simulate HTTP 429 with and without `Retry-After`; verify the 30-second per-delay maximum, 120-second overall deadline, bounded retries, and jitter; and confirm retry exhaustion or either exceeded timing bound returns a controlled incomplete-scan error without exposing the token.
- **Response-hardening test**: simulate invalid UTF-8, non-JSON success bodies, oversized error bodies, timeouts, redirects, and 4xx/5xx errors. Confirm bounded redacted errors and no traceback containing credentials.
- **Standard plugin validation**: run `claude plugin validate` plus the repository's formatting, link, structure, and marketplace checks.

## Success Criteria

- [ ] All six documented tools are available from the local stdio MCP server and map only to the five allowlisted GET routes.
- [ ] A seven-day stale-endpoint scan over multiple pages returns customer-ID-grouped results with endpoint name, OS, and exact last-seen time; without an API snapshot/version contract it labels completeness unverified, and it fails closed on detected drift or retry exhaustion.
- [ ] A `devices.view`-only token cannot use alert tools, and no plugin tool can issue a mutation even when broader credentials are supplied.
- [ ] Two-workspace isolation tests show no cross-tenant data and no caller-controlled tenant selector.
- [ ] Tokens and authorization headers are absent from stdout, stderr, tool responses, test snapshots, and persisted files.
- [ ] HTTP 429, invalid response, timeout, redirect, and inventory-drift cases produce bounded controlled errors.
- [ ] Repository tool-anchoring checks and `claude plugin validate` pass.
- [ ] The README discloses that the initial implementation is maintained by Nizlo and does not claim WYRE endorsement or independent MSP verification.

## Open Questions

- Should the first implementation live as a repository-local `mcp-servers/nizlo-mcp` package, or should it be published separately only after maintainers approve the tool surface?
- Should `nizlo_list_alerts` be optional so deployments that need only fleet inventory can omit `alerts.view` entirely?
- Does the marketplace want the initial release limited to the six read-only tools, with webhooks and every mutation reserved for separate reviewed proposals?

## Contributor Disclosure

The proposed contributor is Nizlo's founder. This PRD is intentionally limited to operator workflows, least-privilege behavior, testable boundaries, and first-party API facts. It requests design review before implementation, does not request special placement, and does not claim WYRE endorsement, certification, or independent live verification.
