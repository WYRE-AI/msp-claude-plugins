---
name: "microsoft-graph-querying"
description: "Use this skill when answering identity or directory questions against a client's Microsoft Entra tenant via the Microsoft Graph MCP Server for Enterprise. Teaches the RAG query loop — microsoft_graph_suggest_queries to find candidate Graph API calls, pick the best one, then microsoft_graph_get to execute it, with microsoft_graph_list_properties for entity schema. Everything is read-only and honors the caller's RBAC."
when_to_use: >-
  When asked any question about a tenant's users, groups, applications, devices, licenses, sign-in
  activity, or directory roles that should be answered through the Microsoft Graph MCP server —
  count users, find guests, find inactive accounts, audit MFA registration, list app inventory,
  check license usage. Use when: microsoft graph query, query entra, how many users, guest users,
  inactive accounts, users without mfa, license usage, app inventory, directory roles, suggest
  queries, graph get, or list properties.
---

# Querying Microsoft Entra with the Graph Enterprise MCP

The Microsoft Graph MCP Server for Enterprise is **not** a raw Graph API passthrough. It is built around a Retrieval-Augmented-Generation (RAG) workflow: you describe what you want, the server hands you vetted candidate API calls from a curated catalog, and you execute the one that fits. Following this loop is the difference between correct answers and made-up endpoints.

## The core rule

**Always start with `microsoft_graph_suggest_queries`. Do not invent raw Graph endpoints.**

Microsoft Graph is enormous and its URL/`$filter`/`$select` syntax is full of sharp edges (advanced query parameters, `ConsistencyLevel` headers, OData casts). The `suggest_queries` tool exists precisely so the model doesn't have to guess. Hand-writing a Graph URL and passing it to `microsoft_graph_get` is an error pattern — even when you "know" the endpoint, route through `suggest_queries` so you get the catalog's correct, tested form.

## The three tools

| Tool | Role in the loop |
|------|------------------|
| `microsoft_graph_suggest_queries` | RAG search over a curated catalog of Graph API examples. Input: a natural-language intent. Output: candidate Graph API calls (endpoint, parameters, description) ranked by relevance. |
| `microsoft_graph_get` | Executes a read-only Graph `GET`. Input: a Graph API call (ideally one returned by `suggest_queries`). Honors the caller's roles, granted scopes, and Graph throttling. |
| `microsoft_graph_list_properties` | Returns the schema for a Graph entity — its properties and relationships. Use it when you need to know what's selectable before constructing or refining a call. |

## The query loop

```
1. suggest_queries(intent)   → candidate Graph calls
2. (model)  select the candidate that best matches the question
3. get(selected candidate)   → data
4. (optional) list_properties(entity)  → schema, to refine $select or pick the right entity
5. (model)  translate the JSON result into a plain-language answer
```

Steps 2 and 5 are *your* job — `suggest_queries` proposes, the model disposes. When several candidates look plausible, prefer the one whose description most precisely matches the user's intent and whose parameters you can fill confidently. If a candidate needs a property you're unsure exists, call `list_properties` first.

## Worked examples

### "How many users are in the tenant?"

1. `microsoft_graph_suggest_queries("count of all users in the tenant")` → returns candidates such as a call against the `users` collection with a count.
2. Pick the candidate that returns a count rather than a full user list (cheaper, directly answers the question).
3. `microsoft_graph_get(<that candidate>)`.
4. Answer: "Contoso has **412** licensed and unlicensed user accounts in Entra ID."

### "Which users don't have MFA registered?"

1. `microsoft_graph_suggest_queries("users who have not registered for multi-factor authentication")` → expect candidates around authentication-methods registration reporting (admin reporting surface).
2. The right candidate is typically a user-registration-details report filtered to users where MFA is not registered — not a per-user method enumeration.
3. `microsoft_graph_get(<that candidate>)`.
4. If you need to also show each user's department or job title, call `microsoft_graph_list_properties("user")` to confirm those properties, then re-suggest/refine.
5. Answer with a named list and a count: "9 of 412 accounts have no MFA method registered — including 2 with admin roles, which is the priority to fix."

### "List the guest (external) users."

1. `microsoft_graph_suggest_queries("external guest users in the directory")` → candidates filtering the `users` collection on guest user type.
2. `microsoft_graph_get(<that candidate>)`.
3. Answer with the guest accounts, their invitation/external state, and a count. Flag guests with no recent sign-in as cleanup candidates.

### "Find inactive accounts that still hold Copilot licenses."

This needs two reads joined by the model:

1. `microsoft_graph_suggest_queries("user accounts with no recent sign-in activity")` → an inactive-users / sign-in-activity reporting candidate. Run it with `microsoft_graph_get`.
2. `microsoft_graph_suggest_queries("users assigned a Microsoft 365 Copilot license")` → a licensed-users candidate. Run it with `microsoft_graph_get`.
3. The model intersects the two result sets: accounts that appear in both are inactive *and* Copilot-licensed — wasted spend.
4. Answer with the overlap list and the reclaimable license count.

> The example endpoints above are illustrative of what `suggest_queries` typically returns — don't hard-code them. Always run `suggest_queries` for the live, tenant-appropriate candidate.

## Using `list_properties`

Call `microsoft_graph_list_properties` when you need the schema of an entity — for example to know whether `user` exposes `signInActivity`, `assignedLicenses`, or `createdDateTime`, or what relationships `group` has. Use it to:

- choose the right `$select` properties so a `get` returns exactly what the question needs;
- confirm an entity actually has the field you're about to filter on;
- decide which entity to query when a question could map to several (`user` vs `servicePrincipal` vs `device`).

## Constraints to respect

- **Read-only.** Everything here reports. There is no way to create, edit, or delete directory objects through this server. If the user asks for a change, say so and point them to a write-capable tool (e.g. the `cipp` plugin).
- **RBAC-honoring.** Results are scoped to the signed-in caller's Entra roles and the app's granted scopes. If a query returns less than expected, it may be a permissions boundary, not missing data — and per-tenant admin consent must already be in place (see the `microsoft-graph-connection` skill).
- **Rate limit.** 100 calls/min/user plus Graph's own throttling. Don't fan out speculative `get` calls — `suggest_queries` exists so one good call beats ten guesses.
- **Preview.** The example catalog and behavior may change; verify anything material in the Entra admin center.

## Presenting results

Raw Graph JSON is not an answer. Always translate: lead with the direct answer (a count, a yes/no, a named list), then supporting detail, then — if it's an audit-style question — a recommendation. Non-technical readers should never see GUIDs or JSON unless they ask.
