---
name: "Hudu Websites"
description: >
  Hudu website records: CRUD via /api/v1/websites, monitoring and pause/disable
  fields, SSL/TLS certificate tracking, email security status (DMARC, DKIM, SPF),
  DNS record fields, company linkage, and website validation errors.
when_to_use: >-
  When creating, querying, or auditing Hudu website records, or checking SSL and email
  authentication status for client domains. Use when: hudu website,
  website monitoring, ssl certificate, email security, dmarc check, dkim check, spf record,
  website management, hudu dns, or website tracking.
---

# Hudu Websites Management

## Overview

Websites in Hudu represent website records associated with client companies. Beyond basic URL tracking, Hudu provides monitoring for SSL/TLS certificates and email security standards (DMARC, DKIM, SPF). MSPs use website records to track client web properties, monitor certificate expiration, and verify email authentication configuration.

## Anti-triggers

- **A live DNS or certificate check** — these fields are Hudu's last
  recorded observation, not a lookup performed now. A DMARC record changed
  this morning will still read as it did at the last scan. If the question
  is "what is the record right now", this is the wrong source.
- **Email security posture and threat data** — DMARC/DKIM/SPF *status* is
  documented here; enforcement, quarantine, and phishing telemetry belong
  to the email-security plugins (Proofpoint, Checkpoint Avanan, Mimecast).
- **Uptime and availability** — Hudu records that a site exists; it does
  not page anyone when it goes down. Use `betterstack` for monitoring.
- **Credentials for the site's admin panel** — use `hudu-passwords`.

## Key Concepts

### Website Monitoring

Hudu can automatically monitor websites for:

| Monitoring Area | Description |
|----------------|-------------|
| SSL/TLS | Certificate validity, expiration date, issuer |
| DMARC | Domain-based Message Authentication, Reporting & Conformance |
| DKIM | DomainKeys Identified Mail |
| SPF | Sender Policy Framework |
| HTTP Status | Whether the site is reachable |

### Email Security Trifecta

The three email security standards that Hudu tracks:

| Standard | Purpose | DNS Record Type |
|----------|---------|----------------|
| **SPF** | Specifies authorized mail servers | TXT record on domain |
| **DKIM** | Cryptographic email authentication | TXT record on selector._domainkey |
| **DMARC** | Policy for handling failed SPF/DKIM | TXT record on _dmarc subdomain |

### Website Scope

Each website record is linked to a company. A company can have multiple website records (e.g., primary domain, marketing site, client portal).

## Field Reference

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | System | Auto-generated unique identifier |
| `company_id` | integer | Yes | Parent company |
| `name` | string | Yes | Website display name / URL |
| `slug` | string | System | URL-friendly identifier |
| `notes` | string | No | Additional notes |
| `paused` | boolean | No | Whether monitoring is paused |
| `disable_dns` | boolean | No | Disable DNS checks |
| `disable_ssl` | boolean | No | Disable SSL checks |
| `disable_whois` | boolean | No | Disable WHOIS checks |

### Monitoring Fields

| Field | Type | Description |
|-------|------|-------------|
| `url` | string | The monitored URL |
| `monitoring_status` | string | Current monitoring status |

### SSL/TLS Fields

| Field | Type | Description |
|-------|------|-------------|
| `ssl_status` | string | SSL certificate status |
| `ssl_expiration` | datetime | SSL certificate expiration date |
| `ssl_issuer` | string | SSL certificate issuer |

### Email Security Fields

| Field | Type | Description |
|-------|------|-------------|
| `dmarc_status` | string | DMARC record status |
| `dmarc_policy` | string | DMARC policy (none, quarantine, reject) |
| `dkim_status` | string | DKIM record status |
| `spf_status` | string | SPF record status |
| `spf_record` | string | SPF record value |

### DNS Fields

| Field | Type | Description |
|-------|------|-------------|
| `dns_a_records` | array | A record values |
| `dns_mx_records` | array | MX record values |
| `dns_ns_records` | array | NS record values |

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |
| `object_type` | string | Always "Website" |
| `company_name` | string | Parent company name (read-only) |

## API Patterns

### List Websites

```http
GET /api/v1/websites
x-api-key: YOUR_API_KEY
Content-Type: application/json
```

**By Company:**
```http
GET /api/v1/websites?company_id=123
```

**By Name:**
```http
GET /api/v1/websites?name=acme.com
```

**With Pagination:**
```http
GET /api/v1/websites?page=1
```

### Get Single Website

```http
GET /api/v1/websites/456
x-api-key: YOUR_API_KEY
```

**Response:**
```json
{
  "website": {
    "id": 456,
    "company_id": 123,
    "company_name": "Acme Corporation",
    "name": "acme.com",
    "url": "https://www.acme.com",
    "notes": "Primary company website",
    "paused": false,
    "disable_dns": false,
    "disable_ssl": false,
    "disable_whois": false,
    "monitoring_status": "up",
    "ssl_status": "valid",
    "ssl_expiration": "2026-08-15T00:00:00.000Z",
    "ssl_issuer": "Let's Encrypt Authority X3",
    "dmarc_status": "pass",
    "dmarc_policy": "reject",
    "dkim_status": "pass",
    "spf_status": "pass",
    "spf_record": "v=spf1 include:_spf.google.com include:spf.protection.outlook.com ~all",
    "dns_a_records": ["203.0.113.10"],
    "dns_mx_records": ["aspmx.l.google.com"],
    "dns_ns_records": ["ns1.example.com", "ns2.example.com"],
    "created_at": "2024-03-15T10:30:00.000Z",
    "updated_at": "2026-02-20T08:00:00.000Z"
  }
}
```

### Create Website

```http
POST /api/v1/websites
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

```json
{
  "website": {
    "name": "acme.com",
    "company_id": 123,
    "notes": "Primary company website. Hosted on AWS.",
    "paused": false,
    "disable_dns": false,
    "disable_ssl": false,
    "disable_whois": false
  }
}
```

### Update Website

```http
PUT /api/v1/websites/456
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

```json
{
  "website": {
    "notes": "Primary company website. Migrated to Azure on 2026-02-15.",
    "paused": false
  }
}
```

### Delete Website

```http
DELETE /api/v1/websites/456
x-api-key: YOUR_API_KEY
```

## Common Workflows

### SSL Expiration Monitoring

```javascript
async function getExpiringSslCerts(daysAhead = 30) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const websites = await fetchAllWebsites();

  return websites
    .filter(w => {
      if (!w.ssl_expiration || w.paused) return false;
      const expiry = new Date(w.ssl_expiration);
      return expiry >= today && expiry <= futureDate;
    })
    .map(w => ({
      name: w.name,
      company: w.company_name,
      sslExpiration: w.ssl_expiration,
      daysRemaining: Math.ceil(
        (new Date(w.ssl_expiration) - today) / (1000 * 60 * 60 * 24)
      ),
      issuer: w.ssl_issuer
    }))
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}
```

### Email Security Audit

```javascript
async function emailSecurityAudit(companyId) {
  const websites = await fetchWebsites({ company_id: companyId });

  return websites.map(w => ({
    domain: w.name,
    spf: {
      status: w.spf_status || 'Not checked',
      record: w.spf_record || 'Not found'
    },
    dkim: {
      status: w.dkim_status || 'Not checked'
    },
    dmarc: {
      status: w.dmarc_status || 'Not checked',
      policy: w.dmarc_policy || 'Not set'
    },
    overallScore: calculateEmailSecurityScore(w)
  }));
}

function calculateEmailSecurityScore(website) {
  let score = 0;
  if (website.spf_status === 'pass') score += 33;
  if (website.dkim_status === 'pass') score += 33;
  if (website.dmarc_status === 'pass') score += 34;
  if (website.dmarc_policy === 'reject') score += 10; // bonus for strict policy
  return Math.min(score, 100);
}
```

### Website Inventory Report

```javascript
async function generateWebsiteReport(companyId) {
  const websites = await fetchWebsites({ company_id: companyId });

  return {
    total: websites.length,
    monitored: websites.filter(w => !w.paused).length,
    paused: websites.filter(w => w.paused).length,
    sslValid: websites.filter(w => w.ssl_status === 'valid').length,
    sslExpiring: websites.filter(w => {
      if (!w.ssl_expiration) return false;
      const daysLeft = Math.ceil(
        (new Date(w.ssl_expiration) - new Date()) / (1000 * 60 * 60 * 24)
      );
      return daysLeft <= 30;
    }).length,
    emailSecurityComplete: websites.filter(w =>
      w.spf_status === 'pass' &&
      w.dkim_status === 'pass' &&
      w.dmarc_status === 'pass'
    ).length,
    websites: websites.map(w => ({
      name: w.name,
      ssl: w.ssl_status,
      sslExpiry: w.ssl_expiration,
      spf: w.spf_status,
      dkim: w.dkim_status,
      dmarc: w.dmarc_status
    }))
  };
}
```

### Onboard Client Domains

```javascript
async function onboardClientDomains(companyId, domains) {
  const results = [];

  for (const domain of domains) {
    const website = await createWebsite({
      name: domain.name,
      company_id: companyId,
      notes: domain.notes || `Added during onboarding on ${new Date().toLocaleDateString()}`,
      paused: false
    });
    results.push(website);
  }

  return results;
}
```

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Name can't be blank | Provide website name/domain |
| 400 | Company is required | Include company_id |
| 401 | Invalid API key | Check HUDU_API_KEY |
| 404 | Website not found | Verify website ID |
| 422 | Validation failed | Check required fields |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Name required | Missing name | Add domain name to request |
| Company required | No company_id | Include company_id |
| Invalid company | Bad company_id | Query /companies first |
| Duplicate domain | Domain already tracked | Check existing websites first |

### Error Recovery Pattern

```javascript
async function safeCreateWebsite(data) {
  try {
    return await createWebsite(data);
  } catch (error) {
    if (error.status === 422 && error.message?.includes('already')) {
      // Website already exists - find and return it
      const existing = await fetchWebsites({
        company_id: data.company_id,
        name: data.name
      });
      return existing[0];
    }

    throw error;
  }
}
```

## Best Practices

1. **Track all client domains** - Add every domain the client owns
2. **Monitor SSL certificates** - Set up alerts for expiring certificates
3. **Verify email security** - Check SPF, DKIM, DMARC for all domains
4. **Document hosting info** - Use notes to record hosting provider and account details
5. **Don't pause monitoring** - Keep monitoring active unless there is a specific reason to pause
6. **Track secondary domains** - Include marketing sites, client portals, subdomains
7. **DMARC enforcement** - Work toward "reject" policy for all client domains
8. **Link to credentials** - Cross-reference with Hudu passwords for domain registrar and hosting credentials
9. **Record DNS providers** - Note which DNS provider each domain uses

## Related Skills

- [Hudu Companies](../companies/SKILL.md) - Website company scope
- [Hudu Passwords](../passwords/SKILL.md) - Domain registrar and hosting credentials
- [Hudu Articles](../articles/SKILL.md) - DNS and hosting documentation
- [Hudu Assets](../assets/SKILL.md) - Server/hosting infrastructure
- [Hudu API Patterns](../api-patterns/SKILL.md) - API reference
