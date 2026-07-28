---
name: "IT Glue Flexible Assets"
description: >
  IT Glue flexible assets: custom, instance-specific asset types with defined
  field schemas (text, tag, password, upload, etc.), traits-based instances,
  and tag fields that cross-link to configurations, contacts, and other IT
  Glue resources for structured, filterable documentation.
when_to_use: >-
  When working with custom asset types for structured documentation in IT Glue flexible assets.
  Use when: it glue flexible asset, custom asset, flexible asset type, it glue custom
  documentation, flexible asset field, custom documentation, structured asset, or it glue
  template.
---

# IT Glue Flexible Assets Management

## Overview

Flexible Assets in IT Glue provide customizable, structured documentation templates. Unlike free-form documents, flexible assets have defined fields and types, enabling consistent documentation across organizations and powerful filtering/searching capabilities.

## Key Concepts

### Flexible Asset Types

Flexible Asset Types define the schema for a category of documentation:

```
Flexible Asset Type: Network Overview
├── Fields:
│   ├── Primary ISP (Text)
│   ├── Backup ISP (Text)
│   ├── Public IP Addresses (Textarea)
│   ├── Firewall (Tag - Configuration)
│   ├── Network Diagram (Upload)
│   └── DNS Provider (Select)
```

### Field Types

| Type | Description | Use Case |
|------|-------------|----------|
| Text | Single line text | Names, identifiers |
| Textarea | Multi-line text | Descriptions, notes |
| Number | Numeric value | Quantities, counts |
| Date | Date picker | Expiration dates |
| Checkbox | Boolean true/false | Flags, toggles |
| Select | Dropdown selection | Predefined options |
| Tag | Link to IT Glue resource | Configurations, contacts |
| Password | Password field | Embedded credentials |
| Upload | File attachment | Diagrams, documents |
| Percent | Percentage value | Utilization, progress |
| Header | Section header | Visual organization |

### Tag Fields

Tag fields create relationships to other IT Glue resources:

| Tag Type | Links To |
|----------|----------|
| Configuration | Configuration items |
| Contact | Contacts |
| Password | Passwords |
| Document | Documents |
| Flexible Asset | Other flexible assets |
| Location | Locations |

Field values live in a `traits` object on the asset instance, keyed by each field's `name-key`. Tag fields hold arrays of related-resource IDs.

See [references/fields.md](references/fields.md) for the full field/traits reference and the common built-in flexible asset type layouts (Network Overview, Application Documentation, Backup Overview, Microsoft 365 Tenant).

## Critical: Discover Type IDs First

**Flexible asset type IDs are instance-specific** — every IT Glue account has different IDs. Never guess or hardcode type IDs. Always call `list_flexible_asset_types` first to discover what types exist, then use the returned IDs with `search_flexible_assets`.

```
Step 1: list_flexible_asset_types → get type IDs
Step 2: search_flexible_assets(flexible_asset_type_id=<id from step 1>)
```

## API Patterns

- Fetch the type definition with `?include=flexible-asset-fields` to get field names, `name-key`s, and which are required before creating or validating an instance.
- Tag fields are set as plain arrays of resource IDs in `traits` (e.g. `"firewall": [12345]`), not nested objects, when creating/updating.
- Assets can be filtered by organization and type simultaneously: `GET /flexible-assets?filter[organization-id]=456&filter[flexible-asset-type-id]=123`.

See [references/api.md](references/api.md) for the complete endpoint catalog (types, instances, tag-field examples) with full request/response bodies.

## Common Workflows

### Create Flexible Asset from Template

Fetch the type definition with its field list, validate that all required fields are present in the supplied values, then create the asset with those `traits`. See [references/examples.md](references/examples.md) for the full `createFlexibleAssetFromType` implementation plus lookup-by-type-name, tag-update, export, health-check, and cross-org cloning workflows.

### Clone to Another Org

Tag fields reference resources in the source org — when cloning a flexible asset to a different organization, tag values must be remapped or stripped since the IDs won't resolve to valid resources in the target org.

## Gotchas

- **Hardcoded type IDs break across accounts** — always resolve type IDs via `list_flexible_asset_types` rather than reusing IDs from another tenant or a previous session.
- **Required-field validation isn't enforced client-side** — fetch `?include=flexible-asset-fields` and check `required` yourself before submitting, or handle the resulting 422.
- **Tag fields don't survive an org clone** — IDs are org-scoped, so a cloned asset's tag traits will reference the wrong (or nonexistent) resources unless remapped.

See [references/errors.md](references/errors.md) for the complete error-code and validation-error tables plus a retry pattern for missing-field and invalid-tag errors.

## Best Practices

1. **Plan type structure** - Design flexible asset types before creating
2. **Use consistent naming** - Follow conventions for field names
3. **Leverage tags** - Link to configurations, contacts for relationships
4. **Required fields** - Mark essential fields as required
5. **Use appropriate types** - Match field type to data (date for dates, etc.)
6. **Document types** - Add descriptions to types and fields
7. **Standardize across orgs** - Use same types for all clients
8. **Regular reviews** - Update flexible asset content periodically
9. **Avoid duplicates** - One flexible asset per topic per org
10. **Export capability** - Build export for reporting needs

## Related Skills

- [IT Glue Organizations](../organizations/SKILL.md) - Flexible asset scope
- [IT Glue Configurations](../configurations/SKILL.md) - Tag field targets
- [IT Glue Contacts](../contacts/SKILL.md) - Tag field targets
- [IT Glue Passwords](../passwords/SKILL.md) - Password fields
- [IT Glue Documents](../documents/SKILL.md) - Alternative documentation
- [IT Glue API Patterns](../api-patterns/SKILL.md) - API reference
