---
name: "azure-mcp-connection"
description: >
  Onboarding the azure-mcp connector in the WYRE MCP Gateway: Azure service-principal
  registration, the tenantId/clientId/clientSecret triple, least-privilege Reader-tier
  RBAC assignments, the gateway's read-only namespace allowlist, and connection
  verification and failure modes (expired secret, missing role assignment).
when_to_use: >-
  When setting up or troubleshooting the azure-mcp connector — creating an Azure service
  principal, choosing RBAC roles, or explaining the read-only constraint to an MSP onboarding a
  tenant. Use when: connect azure mcp, azure mcp setup, azure service principal, azure mcp
  credentials, azure rbac for mcp, azure connector, azure mcp permissions, register azure app, or
  least privilege azure.
---

# Azure MCP Connection

The `azure-mcp` vendor runs Microsoft's official Azure MCP Server (`mcr.microsoft.com/azure-sdk/azure-mcp`) as a WYRE-built sidecar inside the MCP gateway. Each connecting MSP supplies its own Azure **service principal**; the gateway isolates credentials per tenant and scopes every request to the principal you registered.

## Read-only deployment — read this first

The gateway runs the Azure MCP Server with the `--read-only` flag and a deliberately constrained namespace allowlist. Day-one the connector exposes exactly eight read-leaning namespaces:

```
monitor   pricing   quota   advisor   resourcehealth   applens   subscription   group
```

Write- and delete-capable namespaces (`storage`, `keyvault`, `compute`, `role`, `aks`, and others) are **not enabled**. This is intentional defense-in-depth: even if a service principal were over-privileged, the gateway cannot route a mutating call. As shipped, `azure-mcp` is an Azure observability, cost, and resource-health tool — nothing it does changes infrastructure.

Because the deployment is read-only, the service principal you connect should also be read-only. Grant Reader-tier roles and nothing more.

## Step 1 — Register an Azure service principal

In the Azure tenant you want to manage, create an Azure AD **app registration** with a client secret. Either the portal (**Microsoft Entra ID → App registrations → New registration**) or the CLI works:

```
az ad sp create-for-rbac \
  --name "wyre-azure-mcp" \
  --role "Reader" \
  --scopes "/subscriptions/<subscription-id>"
```

This emits three values you will need for the gateway:

- `tenant`   → **Tenant ID**
- `appId`    → **Service Principal Client ID**
- `password` → **Service Principal Client Secret** (shown once — capture it now)

If you reuse an existing app registration, generate a fresh client secret under **Certificates & secrets** and note its expiry — the connector stops working when the secret lapses.

## Step 2 — Grant least-privilege RBAC

Assign **Reader-tier roles only**, at **subscription scope** (or management-group scope to cover several subscriptions). These two built-in roles cover all eight enabled namespaces:

| Role | Why it is needed | Covers |
|------|------------------|--------|
| `Reader` | Read-only visibility into resources, metrics, health, and inventory | `monitor`, `resourcehealth`, `applens`, `advisor`, `subscription`, `group` |
| `Cost Management Reader` | Read access to cost, pricing, and usage data | `pricing`, `quota`, cost-focused `advisor` recommendations |

```
az role assignment create \
  --assignee "<service-principal-client-id>" \
  --role "Reader" \
  --scope "/subscriptions/<subscription-id>"

az role assignment create \
  --assignee "<service-principal-client-id>" \
  --role "Cost Management Reader" \
  --scope "/subscriptions/<subscription-id>"
```

For Log Analytics KQL queries via the `monitor` namespace, `Reader` on the subscription is sufficient because it inherits to the workspace. If a workspace lives outside the granted scope, add `Log Analytics Reader` on that specific workspace — still a Reader-tier role.

### Do not grant write roles

`Contributor`, `Owner`, `User Access Administrator`, `Key Vault Secrets User`, and similar write/secret roles are **unnecessary and must not be granted**. The connector cannot use them — the gateway runs `--read-only` and the write namespaces are not in the allowlist. Granting them only widens the blast radius of a leaked secret with zero functional benefit. Least privilege here is both a security control and a no-cost decision.

## Step 3 — Connect in the WYRE gateway

In the gateway connection UI, choose the **`azure-mcp`** vendor and supply:

1. **Tenant ID** — the directory the service principal lives in
2. **Service Principal Client ID** — the app registration's `appId`
3. **Service Principal Client Secret** — the secret from Step 1

The gateway authenticates the Azure MCP sidecar with these credentials and routes the eight enabled namespaces' tools into your session. No Azure credentials are stored client-side.

## Verifying the connection

After connecting, confirm the connector is live with a harmless read:

1. List subscriptions (`subscription` namespace) — confirms the service principal authenticated and has at least Reader visibility.
2. List resource groups (`group` namespace) for one subscription — confirms scope is correct.
3. If either returns an empty result or an authorization error, the service principal lacks a role assignment at the expected scope, or the client secret has expired — re-check Step 2 and the secret's validity.

## Troubleshooting

- **`AuthorizationFailed` / empty subscription list** — no `Reader` assignment at the subscription/management-group scope, or the assignment hasn't propagated yet (allow a few minutes).
- **Cost or pricing tools return nothing** — `Cost Management Reader` is missing.
- **Connector worked, then stopped** — the client secret expired. Generate a new one and update the gateway connection.
- **A user asks for a write/provision/delete operation** — that is out of scope for this connector by design. Explain that `azure-mcp` is a read-only deployment and the relevant namespace is not enabled; do not attempt a workaround.
