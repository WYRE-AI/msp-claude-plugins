---
name: "microsoft-graph-connection"
description: >
  Connecting the Microsoft Graph MCP Server for Enterprise (public preview) through
  the Wyre gateway: BYOC multi-tenant Entra app registration, the
  tenantId/clientId/clientSecret triple, the delegated MCP.* permissions and the
  per-tenant admin consent that must be granted out of band, plus the read-only
  design, the 100 calls/min/user limit, licensing implications, and a
  symptom-to-cause troubleshooting table.
when_to_use: >-
  When setting up, troubleshooting, or explaining the microsoft-graph connection — Entra app
  registration, redirect URI, client secret, admin consent failures, or 'why is the tenant
  returning no data'. Use when: connect microsoft graph, microsoft graph mcp, graph enterprise
  mcp, entra app registration, admin consent, byoc entra, microsoft graph setup, graph mcp no
  data, tenant consent, or microsoft graph rate limit.
---

# Connecting the Microsoft Graph MCP Server for Enterprise

The Microsoft Graph MCP Server for Enterprise is a Microsoft-hosted MCP server (public **preview**) at `https://mcp.svc.cloud.microsoft/enterprise`. It is reached through the Wyre MCP Gateway as the `microsoft-graph` vendor. Getting it working is a three-part job: register an Entra app, connect it through the gateway, and — the step that breaks most onboardings — grant per-tenant admin consent **out of band**.

Read this whole skill before connecting. The admin-consent requirement is non-obvious and the failure mode (a connection that authenticates fine but returns nothing) looks like a different bug.

## Anti-triggers

- **Actual directory or identity questions** once the connection works —
  use `microsoft-graph-querying`.
- **The `m365` plugin's Entra app registration** — it is a *different*
  app with different (Graph `User.Read.All`-style) permissions and its
  own consent. Consenting one does not consent the other, and the
  troubleshooting below does not apply to it; use the `m365` plugin.
- **GDAP relationships and tenant onboarding across the fleet** — a
  different consent model entirely, managed per customer relationship
  rather than per app; use the `cipp` plugin (`cipp-tenants`).

## How the connection works

- The gateway exposes a `microsoft-graph` vendor that proxies to `https://mcp.svc.cloud.microsoft/enterprise`.
- Auth is **BYOC** (bring-your-own-credentials): each MSP registers **its own** multi-tenant Entra app — a confidential client — and supplies `tenantId`, `clientId`, and `clientSecret` in the gateway connection UI.
- The Entra authority used is `organizations` (the multi-tenant work/school endpoint).
- The token minted is a **delegated** token scoped to `api://e8c77dc2-69b3-43f4-bc51-3213c9d915b4/.default` — the resource identifier of the Graph Enterprise MCP service.
- Because the token is delegated, every call runs **as the signed-in user**. The data the server returns is the intersection of what the user is allowed to see (their Entra roles) and what scopes the app was granted.

## Step 1 — Register the BYOC Entra application

In the customer-facing/partner tenant you control, register a multi-tenant app:

1. **Entra admin center → Identity → Applications → App registrations → New registration.**
2. **Supported account types:** *Accounts in any organizational directory (multitenant)*. This is required — the authority is `organizations`, and you need the app to be consentable in each customer tenant.
3. **Platform:** add a **Web** platform with a **redirect URI**. Use the redirect URI the Wyre gateway shows in the `microsoft-graph` connection UI (the gateway's OAuth callback). A Web platform is required because this is a confidential client doing an authorization-code flow.
4. **Certificates & secrets → New client secret.** Record the secret **value** (not the secret ID) immediately — it is shown only once. Set a calendar reminder before it expires; an expired secret produces `invalid_client` on reconnect.
5. Note the **Application (client) ID** and your **Directory (tenant) ID** from the app's Overview page.
6. **API permissions:** add the **delegated** `MCP.*` permissions the Graph Enterprise MCP server requires (the permission set is shown when you add the Graph Enterprise MCP / `api://e8c77dc2-...` API as a permission target). These are delegated permissions, not application permissions.

## Step 2 — Connect through the Wyre gateway

1. In the gateway connection UI, choose the **`microsoft-graph`** vendor.
2. Supply the three BYOC values from Step 1: **`tenantId`**, **`clientId`**, **`clientSecret`**.
3. Complete the OAuth sign-in. The gateway runs the authorization-code flow against the `organizations` authority and stores the resulting delegated token.

At this point the *connection* exists — but it will still return no data until Step 3 is done for each customer tenant.

## Step 3 — Grant per-tenant admin consent (the step everyone misses)

**This is the single most common reason a Graph MCP connection "works" but returns nothing.**

The `MCP.*` delegated permissions are admin-restricted. The OAuth connect flow in Step 2 authenticates the user and mints a token, but it does **not** by itself grant the tenant-wide consent those permissions need. A **Global Administrator in each customer tenant** must grant admin consent **out of band** — once per customer tenant, before the connection can read that tenant's directory.

Have the customer's Global Admin open the admin-consent URL and approve:

```
https://login.microsoftonline.com/{customer-tenant-id}/adminconsent?client_id={your-client-id}
```

- `{customer-tenant-id}` — the customer's Entra tenant ID (or their primary domain).
- `{your-client-id}` — the Application (client) ID of the BYOC app from Step 1.

After the admin approves, the app gets a service principal in the customer tenant with the `MCP.*` delegated permissions consented tenant-wide. Calls for that tenant will now return data.

If you skip this: `microsoft_graph_get` and `microsoft_graph_suggest_queries` calls will fail or return empty for that tenant even though the gateway connection shows healthy and the token mints fine. Symptom is consent/permission errors (`AADSTS65001` or similar) or a successful auth that yields no directory data.

Repeat Step 3 for every customer tenant you want to query. Steps 1 and 2 are one-time per MSP; Step 3 is per customer tenant.

## Operational limits

- **Preview.** This is a Microsoft public-preview service. The tool surface, the RAG example catalog, and the available scopes may change before GA. Don't build hard automation dependencies on exact behavior yet.
- **Read-only.** The server only issues `GET` requests to Microsoft Graph. There is no write path — by design.
- **Rate limit:** 100 calls/min/user, enforced by the MCP server, on top of standard Microsoft Graph service throttling. The RAG `suggest_queries → get` workflow is deliberately call-efficient; lean on it rather than fanning out many speculative `get` calls.
- **Licensing:** the MCP server itself adds no license cost, but the caller still needs the right Entra licenses for the data they touch. Example: querying Privileged Identity Management (PIM) data requires **Microsoft Entra ID P2** on the tenant and the caller.

## Quick troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| Connection authenticates but every query returns empty/permission error | Per-tenant admin consent (Step 3) not granted for that customer tenant |
| `invalid_client` on connect or reconnect | Client secret expired or the secret **ID** was pasted instead of the secret **value** |
| Redirect URI mismatch error during sign-in | The Web platform redirect URI in the app registration doesn't match the gateway's callback URL |
| Works for one tenant, not another | Admin consent granted for the first tenant only — run Step 3 again per tenant |
| PIM / privileged-role data missing | Tenant or caller lacks Microsoft Entra ID P2 |
