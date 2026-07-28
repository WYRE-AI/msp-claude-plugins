---
name: "azure-mcp-cost-and-capacity"
description: >
  The read-only cost and capacity half of the azure-mcp connector — the pricing,
  quota, subscription, and group namespaces: retail meter-rate lookups, quota and
  usage headroom, subscription and resource-group inventory, and the retail-versus-
  actual-billing distinction that shapes every estimate.
when_to_use: >-
  When estimating Azure cost, checking quota headroom before scaling a deployment, or taking
  inventory of subscriptions and resource groups. Use when: azure pricing, azure cost estimate,
  retail price azure, azure quota, azure usage limits, quota check, azure subscriptions, resource
  groups, azure inventory, or pre-deployment check.
---

# Azure Cost & Capacity

This skill covers the cost, capacity, and inventory side of the `azure-mcp` connector: the `pricing`, `quota`, `subscription`, and `group` namespaces. All four are **read-only** — they answer "what would this cost", "do we have headroom", and "what exists", never "provision this".

Tool names follow the Azure MCP Server's namespace convention (`azmcp` / `azure_mcp` prefixes, grouped under `pricing`, `quota`, `subscription`, `group`). Invoke them by capability.

## Namespace surface

### `subscription` — subscription inventory

Lists the Azure subscriptions the connected service principal can see, with their IDs, display names, and state (`Enabled`, `Disabled`, `Warned`). This is almost always the **first call** in any workflow — nearly every other namespace needs a subscription ID for scope.

### `group` — resource-group inventory

Lists and inspects resource groups within a subscription: name, location, tags, and provisioning state. Use it to map the shape of an environment, find resources by tag, or pick the right scope for a pricing or quota question.

### `pricing` — Azure retail pricing

Looks up Azure **retail** prices from the public Azure Retail Prices API — meter rates by service, SKU, region, and currency. This gives list pricing, not the customer's negotiated or EA/CSP pricing, and not actual billed consumption. Treat its output as an estimate baseline.

### `quota` — quota & usage limits

Reports subscription quotas and current usage for a resource provider and region — e.g. vCPU quota for a VM family, public IP count, network interface count. Each entry shows the limit, current usage, and therefore the remaining headroom.

## Workflow patterns

### Pre-deployment quota check

Before someone scales a deployment or stands up new resources, confirm there is headroom:

1. **`subscription`** — resolve the target subscription ID.
2. **`quota`** — pull quota and current usage for the relevant provider and region (e.g. `Microsoft.Compute` vCPUs in `eastus`).
3. Compare requested capacity against `limit - usage`. If headroom is insufficient, report the exact shortfall and the region — a quota increase is a separate, write/support action outside this connector.

Catching this before deployment avoids a half-failed rollout when Azure rejects the request at `limit`.

### Cost estimation

When asked "what would X cost":

1. **`subscription`** / **`group`** — establish scope and region (region materially changes price).
2. **`pricing`** — look up the retail meter rate for each SKU involved (compute size, storage tier, bandwidth).
3. Multiply by expected quantity and runtime to produce an estimate.
4. **State the assumptions plainly** — this is *retail list pricing* in a stated currency and region. Actual billing depends on the customer's agreement (EA/CSP/MCA discounts), reservations, and real consumption. Never present a retail estimate as the customer's actual or guaranteed cost.

For what a customer *actually spent*, that is consumption/billing data — the `pricing` namespace does not provide it. Cost-saving opportunities on existing spend come from Azure Advisor's Cost recommendations (see the `observability` skill).

### Subscription & resource-group inventory

For an environment audit or onboarding discovery:

1. **`subscription`** — enumerate all visible subscriptions; flag any `Disabled` or `Warned`.
2. **`group`** — for each subscription, list resource groups with their locations and tags.
3. Cross-reference tags against the MSP's tagging standard — untagged or mistagged groups are governance findings worth surfacing.

### Capacity headroom report

Run `quota` across the key providers (`Microsoft.Compute`, `Microsoft.Network`, `Microsoft.Storage`) for the regions a customer uses, and produce a headroom table. Quotas above ~80% usage are worth a proactive quota-increase request before they block growth.

## Constraints & caveats

- **Read-only.** This skill estimates, checks, and inventories. It cannot raise a quota, create a subscription or resource group, or apply pricing changes. Quota increases go through an Azure support/quota request — out of scope for this connector.
- **Retail vs. actual price.** `pricing` returns public retail rates only. It is an estimation baseline, never the customer's billed amount.
- **Scope first.** Resolve subscription (and often resource group) before pricing or quota calls — they are scoped operations.
- **Visibility is RBAC-bounded.** `subscription` only shows subscriptions where the service principal holds a role assignment. A "missing" subscription usually means a missing Reader assignment, not a deleted subscription.
