---
description: Build a source-cited compliance evidence package for a client against a named framework
argument-hint: "<client> [framework]"
arguments: [client, framework]
---

# Evidence Pack

Build a structured, source-cited compliance evidence package for a client, mapping live tenant configuration and documentation to the controls of a named framework.

## Prerequisites

- Conduit MCP Gateway connected (`conduit`)
- At least one compliance-relevant connector available for the client (CIPP for M365/Entra evidence is the strongest single connector; Liongard and IT Glue/Hudu add infrastructure and documentation evidence)
- Client identifiable by name in the connected PSA/tenant list

## Steps

1. **Discover available tools.** Call `conduit__search_tools` to find every compliance-relevant tool connected for this org — do not assume CIPP, Liongard, and IT Glue are all present. Record which vendor families are available and which are not.
2. **Resolve the client.** Confirm the target client against connected systems (e.g. `cipp__list_tenants` for the M365 tenant, `itglue__search_organizations` for the documentation org record) before pulling anything client-scoped.
3. **Resolve the framework to a control list.** Use the framework named in `framework` (`cis`, `soc2`, `hipaa`) to select the relevant control families; if `framework` is omitted, use the general representative control set from the `evidence-mapping` skill.
4. **Invoke the `evidence-packager` agent** with the resolved client and framework. The agent maps each control to its evidence source per the `evidence-mapping` skill, queries every connected vendor family, and classifies each finding as Configured, Documented, Contradicted, or Unable to Verify.
5. **Present the package**, leading with Contradicted and Unable to Verify findings, followed by the full control-by-control evidence table.

## Arguments

| Argument | Required | Default | Description |
|---|---|---|---|
| `client` | Yes | — | The client/organization name to build the evidence package for |
| `framework` | No | `general` | Target framework: `cis`, `soc2`, `hipaa`, or `general` for a representative cross-framework control set |

## Examples

### General evidence sweep

```
/compliance-pack:evidence-pack "Acme Corp"
```

### SOC 2 evidence package

```
/compliance-pack:evidence-pack "Meridian Health" soc2
```

### HIPAA evidence ahead of an audit

```
/compliance-pack:evidence-pack "Riverside Medical" hipaa
```

## Output

```
================================================================================
Compliance Evidence Package — Meridian Health
================================================================================
Framework:            SOC 2
Connectors used:      CIPP, Liongard, IT Glue
Connectors unavailable: Huntress (not connected)

--------------------------------------------------------------------------------
Priority Findings
--------------------------------------------------------------------------------
[CONTRADICTED] Access control policy (IT Glue) states MFA required for all users;
  cipp__list_mfa_users shows 6 of 41 users without MFA registered.
[UNABLE TO VERIFY] Endpoint detection coverage — no EDR connector present for this client.

--------------------------------------------------------------------------------
Evidence Table (24 controls assessed — 17 Configured, 3 Documented, 1 Contradicted, 3 Unable to Verify)
--------------------------------------------------------------------------------
Control                          Status         Evidence Summary                Source
MFA enforced for all users       Contradicted   35/41 users MFA-registered;      cipp__list_mfa_users,
                                                 policy doc claims 100%           itglue__get_document
Conditional access enforced      Configured     CA policy scoped to All Users    cipp__list_conditional_access_policies
Server baseline documented       Configured     12/12 servers inspected,         liongard__systems_list
                                                 current within 24h
...
================================================================================
```

## Error Handling

### No compliance connectors available

```
No compliance-relevant connectors found for this client via conduit__search_tools.

Connect at least CIPP (M365/Entra) to build any evidence package. Liongard and
IT Glue/Hudu are optional but strengthen infrastructure and documentation coverage.
```

### Client not found

```
Client "Acme Corp" not found in connected tenant or documentation records.

Verify the client name matches the connected PSA/tenant naming, or check
conduit__search_tools output for the correct org identifier.
```

### Framework not recognized

```
Framework "pci" not recognized by this pack's control mapping.

Supported: cis, soc2, hipaa, general. Falling back to general evidence sweep —
re-run with a supported framework name for framework-specific control mapping.
```

## Related Commands

- `/compliance-pack:drift-report` — check whether evidence gathered here still matches the last known-good baseline
- `/compliance-pack:questionnaire` — draft cyber-insurance answers using the same evidence discipline
