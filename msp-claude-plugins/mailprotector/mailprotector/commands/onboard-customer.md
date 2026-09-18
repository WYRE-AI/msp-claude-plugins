---
description: Onboard a new customer onto Mailprotector - customer, domain, user group, services, users
argument-hint: "[name] [email] [domain] [services] [users]"
arguments: [name, email, domain, services, users]
---

# Onboard Customer

Create a new Mailprotector customer end to end under the bound reseller. For anything beyond the happy path (multiple domains, directory sync, migrations), hand off to the `mailprotector-onboarder` agent.

## Steps

1. **Create the customer** — `mailprotector_customers_create` with `name` and contact `email`; capture the new customer ID
2. **Create the domain** — `mailprotector_domains_create` under the customer
   - The domain arrives in **Pending** status with a `verification_token`
   - Surface the token immediately: mail is not filtered until the domain is verified
3. **Create the user group** — via `mailprotector_execute_tool` (the `user_groups` category's `create`, under the domain), then set services (the `user_groups` category's `services_update`) from `services`
   - The services update deactivates anything omitted — on a brand-new group send exactly the desired set
4. **Create users** (optional) — parse `users` (comma-separated usernames or `First Last <user@domain>` entries) and call `users_create_many` under the group
5. **Verify and report** — re-fetch the customer, domain, group, and user count; report the domain status and remaining manual steps (domain verification, MX cutover, email destinations)

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | Yes | - | Customer display name |
| email | string | Yes | - | Customer contact email |
| domain | string | Yes | - | Primary mail domain |
| services | string | No | cloudfilter | Comma-separated services for the user group (e.g. `cloudfilter,bracket`) |
| users | string | No | - | Comma-separated usernames to create in the group |

## Examples

```
/onboard-customer --name "Acme Corp" --email "it@acme.com" --domain "acme.com"
/onboard-customer --name "Acme Corp" --email "it@acme.com" --domain "acme.com" --services "cloudfilter,bracket" --users "jsmith,mjones,ap"
```

## Output

```
Onboarding: Acme Corp

Customer:    17015  Acme Corp                      created
Domain:      28482  acme.com                       PENDING — verification required
  token:     jdO5rWCKpUjlRDk13s/PVVtcGVHdPn5syBUrRLKlDkE=
User group:  29193  Default                        created
Services:    CloudFilter Email Security, Bracket
Users:       3 created (jsmith@acme.com, mjones@acme.com, ap@acme.com)

Remaining manual steps:
  1. Verify domain ownership with the token above (console)
  2. Add email destinations for delivery, then repoint MX records
  3. Re-run: mailprotector_domains_get 28482 — confirm status Active
```

## Error Handling

- **422 on create** — a field failed validation (duplicate domain, malformed name); fix and retry that step only
- **Failure mid-sequence** — stop and report what was created with IDs; do not retry from the top (duplicate customers) and do not delete to clean up (cascades)
- **Domain still Pending at the end** — expected; that is the operator's verification step, not a failure

## Related Commands

- `/check-quarantine` - First health check once mail flows
