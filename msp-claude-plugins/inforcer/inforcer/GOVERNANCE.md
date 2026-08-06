# Inforcer plugin — governance and safety model

Unofficial. Community-built plugin for the Inforcer Microsoft 365
baseline governance platform. Not affiliated with, endorsed by, or
sponsored by the vendor. Inforcer publishes no official public API
documentation; the surface modelled here is community-sourced from
[`royklo/InforcerCommunity`](https://github.com/royklo/InforcerCommunity)
and may change without notice.

## What it connects as

This plugin does not hold credentials. It reaches Inforcer through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the managed tenants
the operator is authorised for.

- No Inforcer API key is stored on the technician's machine, in this
  repo, or in the model's context. The gateway supplies
  `X-Inforcer-Api-Key` and `X-Inforcer-Region` and forwards the key
  upstream as `Inf-Api-Key`.
- The org's Inforcer credential is stored once at the gateway, so
  replacing it is one edit rather than a change on every
  technician's machine. There is no rotate action, though — you
  re-submit the connect form, which overwrites the stored credential
  in place, and nothing tracks its age or prompts you.

- Every call carries operator identity, so the gateway audit log answers
  "who triggered an assessment against this tenant" — Inforcer's own log
  records only the API account.
- Removing someone from the organisation clears their per-vendor grants
  and revokes their gateway refresh tokens at once; a user deactivated
  in your identity provider is refused on their very next request. A
  user only removed from the org keeps an already-issued access token
  for up to an hour, but it reaches only a personal Inforcer connection
  made with their own key — never the org's. See
  `wyre-gateway/GOVERNANCE.md`.

## Tool permission tiers

> **Not classified in Conduit — every tool in the table below requires
> tier `admin` today.** Conduit derives each tool's tier from
> `VENDOR_TOOL_CONFIG` (`src/proxy/result-cache.ts`) and fails closed for
> anything absent from it:
> `const requiredTier: PermissionTier = classified ?? 'admin';`
> (`src/access/access-enforcement.ts:63`). `inforcer` has no entry, so the
> grouping below carries no enforcement weight right now — read tools
> require `admin` exactly as the rest do, and there is no narrower grant
> that admits them. The grouping is still the right *risk* reading, and it
> becomes the enforcement reading on the day this vendor is classified.
> The list of unclassified vendors moves whenever one of them is
> classified, so it is stated in one place only:
> `wyre-gateway/GOVERNANCE.md`, *Fail-closed, and the vendors Conduit has
> not classified*.
>
> *This blockquote is the whole of the not-classified caveat. When
> `inforcer` appears in `VENDOR_TOOL_CONFIG`, delete this blockquote and
> change nothing else.*

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Inforcer or tenant state. Safe for autonomous agents. | `inforcer_status`, `inforcer_navigate`, `inforcer_tenants_list`, `inforcer_tenants_get`, `inforcer_tenants_resolve`, `inforcer_baselines_list`, `inforcer_alignment_scores`, `inforcer_alignment_details`, `inforcer_policies_list`, `inforcer_secure_scores_get`, `inforcer_users_list`, `inforcer_users_get`, `inforcer_groups_list`, `inforcer_groups_get`, `inforcer_roles_list`, `inforcer_audit_event_types`, `inforcer_audit_search`, `inforcer_assessments_list` |
| **Write** | Starts a tenant evaluation. Consumes vendor-side work; changes no customer configuration. | `inforcer_assessments_run` |
| **Destructive** | — | *Empty.* |

**One write, no destructive tier.** `inforcer_assessments_run` is the
only tool in the entire Inforcer surface that changes anything, and what
it changes is Inforcer's own evaluation data. The API cannot deploy a
policy, remediate drift, back up, or restore configuration — those exist
only in the Inforcer product UI.

`inforcer_assessments_run` is deliberately **not** destructive, and a
reviewer may push back on that. The skill documentation flags it as a
"HIGH-IMPACT ACTION" and requires per-tenant confirmation, which reads
like a destructive-tier control. The tiering here follows blast radius
rather than ceremony: a run re-measures a tenant and writes no
configuration to Microsoft 365. Its real cost is vendor-side compute and
a misleading audit entry against the wrong customer. The confirmation
discipline is right; the tier is Write.

> **Build allow/deny rules against the table above, not against prose.**
> The names in that table are the ones the server registers
> (`inforcer-mcp/src/domains/`). A rule written against a name the server
> does not register silently permits nothing and blocks nothing — it does
> not fail loudly, so a mistyped rule looks like a working one. An earlier
> revision of this plugin carried three such names across its README,
> agent, commands and skills; they were corrected in 1.0.6.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Portfolio drift sweeps, posture roll-ups, and
  privileged-access reviews are the intended autonomous use.
- Write tool: the agent states the resolved tenant display name **and**
  the integer Client Tenant ID, a human approves, then it runs. Never
  grant `inforcer_assessments_run` to a scheduled or unattended agent,
  and never let one batch-run the portfolio "to refresh data."
- Destructive tools: none exist.

## What it cannot reach

- Only the Inforcer-managed tenants mapped to the operator's gateway
  identity, and only in the configured region — Inforcer's base URL is
  region-derived, so a US operator cannot reach an EU instance.
- No filesystem, no shell, no other vendor's data.
- **No remediation path.** Inforcer shows drift in full per-policy
  detail and can change nothing about it. Every fix this plugin
  surfaces is a recommendation for a human to action in the Inforcer UI,
  CIPP, or the Microsoft 365 admin centre. An agent that reports drift
  as "resolved" has misread its own capability.
- No identity administration. Users, groups, and roles are readable
  only; nothing here creates, disables, or de-privileges an account.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `inforcer_users_list` / `inforcer_users_get` return tenant user PII —
  display names, UPNs and email addresses, enabled state, and licensing
  hints for the *customer's* staff, not the MSP's.
- `inforcer_roles_list` returns the privileged-role map for a tenant:
  who holds Global Admin and equivalents. Useful for review, and a
  target list if it leaks. Restrict it from unattended agents.
- `inforcer_audit_search` returns change history attributable to named
  identities.
- `inforcer_tenants_list` returns the MSP's full managed-tenant roster.

## Known sharp edges

- **Integer Client Tenant ID, not a GUID or a domain.** Every
  tenant-scoped call takes an integer. A GUID or domain that reaches the
  path unresolved returns an *empty result*, not an error — so a report
  can read "no drift" when it means "wrong identifier." On
  `inforcer_assessments_run` the same mistake has a side effect instead
  of a silent blank: it runs against a real, different customer.
- **Pagination understates everything.** `continuationToken` must be
  paged to exhaustion. A partial page silently drops tenants from a
  portfolio sweep or events from an audit window, and the truncated
  answer looks complete.
- **Inforcer and CIPP both say "baseline", "drift", and "secure
  score".** They measure different templates and are not comparable. A
  report that blends the two produces a number that describes nothing.
- **Community-sourced field shapes.** Response field names are
  best-effort, not a vendor contract. Verify shapes on first use rather
  than trusting a field that a workflow depends on.
