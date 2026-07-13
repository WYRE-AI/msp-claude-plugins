---
description: Search the ImmyBot software catalog (per-tenant + global)
argument-hint: "<query>"
arguments: [query]
---

# ImmyBot Software Search

Search the ImmyBot software catalog before configuring a deployment, to confirm a publisher / version exists and is the canonical entry to target.

## Arguments

- `query` (required) — Software name or keyword

## Prerequisites

- ImmyBot MCP server connected with valid `IMMYBOT_INSTANCE_SUBDOMAIN`, `IMMYBOT_TENANT_ID`, `IMMYBOT_CLIENT_ID`, `IMMYBOT_CLIENT_SECRET`
- Tools available: `immybot_software_search`, `immybot_software_get`, `immybot_software_versions`, `immybot_software_latest_version`

## Steps

1. **Search the catalog**

   Call `immybot_software_search` with `query`.

2. **Drill into the candidate**

   For each result, optionally call `immybot_software_get` for full detail.

3. **List versions**

   For the chosen software, call `immybot_software_versions` and `immybot_software_latest_version` so the operator can pick a pinned version or track latest.

4. **Output**

   - Top matches (name, publisher, software ID)
   - For each: latest version, total versions available
   - Suggested next step: pass the software ID to a deployment workflow

## Examples

### Find Adobe Reader entries
```
/search-software "Adobe Reader"
```

## Related Commands

- (none yet)
