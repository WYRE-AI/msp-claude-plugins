---
description: Create a new contact in Salesbuildr
argument-hint: "<first-name> <last-name> [email] <company> [phone]"
arguments: [first-name, last-name, email, company, phone]
---

# Create Salesbuildr Contact

## Arguments

- `first-name` (required) — Contact first name
- `last-name` (required) — Contact last name
- `email` (optional) — Contact email address
- `company` (required) — Company name or ID
- `phone` (optional) — Contact phone number

## Prerequisites
- Salesbuildr API key configured
- Company must exist in Salesbuildr

## Steps
1. Resolve company name to ID if needed
2. Validate required fields
3. Call Salesbuildr API: `POST /contacts`
4. Display created contact confirmation

## Examples

### Create with company name
```
/create-contact first-name="Jane" last-name="Smith" email="jane@acme.com" company="Acme Corp"
```

## Error Handling
| Error | Resolution |
|-------|------------|
| Company not found | Verify company exists first |
| Missing required fields | Provide first-name, last-name, and company |
