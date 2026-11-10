# Plugin PRD: [Vendor]/[Product]/[Component]

## Summary

One paragraph describing what this plugin/skill/command does.

## Problem

What specific MSP workflow problem does this solve?

## User Stories

- As a [role], I want to [action] so that [benefit]
- As a [role], I want to [action] so that [benefit]
- As a [role], I want to [action] so that [benefit]

## Scope

### In Scope

- Feature 1
- Feature 2

### Out of Scope

- What this explicitly won't do

## Technical Approach

### API Endpoints Used

- GET /v1.0/endpoint — [link to vendor API docs]
- POST /v1.0/endpoint — [link to vendor API docs]

### Authentication Requirements

- API key type
- Required permissions

### Data Flow

Brief description of how data moves through the system.

## Security Considerations

- **Credential handling**: where do this vendor's credentials/tokens live — the gateway's existing per-tenant credential store, or something new? Does this plugin introduce any new credential-storage surface?
- **Scope narrowing**: does the vendor's auth flow grant broader access (e.g. combined read+write) than this plugin's skills actually use? Can the connection request a narrower scope, and if not, is that documented rather than implied to be blocked?
- **Per-tenant isolation**: if this plugin serves multiple MSP clients, how is one client's credentials/data kept from leaking into another client's session?
- **Data sensitivity**: what kind of data does this plugin touch (PII, financial, support-ticket content, etc.), and where does it flow — does any of it leave the vendor's own infrastructure, or pass through a WYRE-operated intermediary?
- **Audit logging**: does this vendor need anything beyond what the gateway already logs for credential access, or is the existing audit logging sufficient?

## Testing Plan

- **Live connection smoke test**: before any skill ships, connect to a real vendor sandbox/trial account and confirm the integration is actually reachable with the expected tool/endpoint surface — don't rely on vendor docs alone.
- **Scope/permission enforcement test**: if this plugin is meant to be read-only (or otherwise scope-limited), verify that a call outside that scope actually fails, not just that it's undocumented.
- **Multi-tenant isolation test**: if applicable, confirm a session authenticated for one tenant/client cannot reach another tenant's data.
- **Tool-anchoring / drift check**: run this repo's `check-doc-references.mjs` and `check-tool-anchoring.mjs` against the shipped skill docs to confirm every documented tool name matches a real, live-verified tool.
- **Rate-limit behavior test**: if the plugin does bulk/paginated lookups, confirm it backs off or paginates correctly rather than hammering the vendor's endpoint.
- **Standard plugin validation**: `claude plugin validate` passes clean.

## Success Criteria

- [ ] Criteria 1
- [ ] Criteria 2

## Open Questions

- Unresolved decisions needing input
