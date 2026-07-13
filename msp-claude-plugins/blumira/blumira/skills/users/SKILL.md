---
name: "Blumira Users"
description: >
  Use this skill when listing or looking up Blumira users, finding user IDs
  for finding assignment, or auditing user access.
when_to_use: >-
  When listing or looking up Blumira users, finding user IDs for finding assignment, or auditing
  user access. Use when: blumira user, user list, assign user, or user management.
---

# Blumira Users

## Overview

Blumira users are organization members who can access the portal, investigate findings, and manage the environment. This skill covers user listing and lookup, primarily for finding assignment workflows.

## Key Concepts

### User Roles

Users have roles that determine their permissions within the Blumira organization. The API exposes user identity and metadata for assignment and audit purposes.

### User IDs

User IDs (UUIDs) are required when assigning findings to specific analysts. Use `blumira_users_list` to look up IDs.

## API Patterns

### List Users

```
blumira_users_list
  page_size=50
```

Response includes user ID, name, email, and role information.

### Filter Users

```
blumira_users_list
  email.contains=@company.com
```

## Common Workflows

### Find User for Assignment

1. `blumira_users_list` to get all users
2. Identify the appropriate analyst by name or role
3. Use their `user_id` with `blumira_findings_assign`

### User Access Audit

1. `blumira_users_list` with full pagination
2. Review all users with access to the organization
3. Cross-reference with HR/directory for offboarded users
4. Report any discrepancies

## Error Handling

### Empty User List

**Cause:** Token may not have permission to list users
**Solution:** Verify JWT token has appropriate scope for user management.

## Best Practices

- Cache user lists during triage sessions to avoid repeated API calls
- Use email filtering to quickly find specific users
- For MSP environments, use `blumira_msp_users_list` with account context
- Document user-to-role mappings for escalation workflows

## Related Skills

- [Findings](../findings/SKILL.md) — Assigning findings to users
- [API Patterns](../api-patterns/SKILL.md) — Filtering and pagination
- [MSP](../msp/SKILL.md) — Per-account user management
