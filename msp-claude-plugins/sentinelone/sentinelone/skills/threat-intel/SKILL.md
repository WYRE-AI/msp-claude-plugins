---
name: "SentinelOne Threat Intel and CVE Lookup"
description: >
  The SentinelOne sidecar's enrichment tools: VirusTotal / Google Threat
  Intelligence lookups by hash, IP, domain and URL (threat_intel_*), sandbox
  behaviour and file relationships, advanced VirusTotal search, and the CVE
  database (cve_search_by_id, cve_search_by_vendor, cve_database_status).
when_to_use: >-
  When enriching an indicator from a SentinelOne alert or hunt, or looking up a CVE. Use when:
  is this hash malicious, virustotal lookup, check this ip, domain reputation, url reputation,
  file sandbox behaviour, cve lookup, cves for a vendor, or ioc enrichment.
---

# SentinelOne Threat Intel and CVE Lookup

## Overview

Alongside the Singularity data tools, the SentinelOne connector (Purple MCP sidecar) serves enrichment tools backed by VirusTotal / Google Threat Intelligence and a CVE database. They answer "what is this indicator?" and "what is this CVE?" without leaving the investigation. None of them touches a customer endpoint or the SentinelOne console.

## Anti-triggers

- **Alert triage itself** — use `sentinelone-alerts`.
- **Vulnerabilities found on the customer's endpoints** — that is SentinelOne's own vulnerability data; use `sentinelone-vulnerabilities`. The CVE tools here describe a CVE in general, not which hosts have it.
- **Hunting in the customer's telemetry** — use `sentinelone-threat-hunting` (`powerquery`, `purple_ai`).

## MCP Tools

| Tool | Arguments | Returns |
|------|-----------|---------|
| `threat_intel_by_hash` | `hash_value` (MD5, SHA-1 or SHA-256) | Detection ratio, names, first/last seen, classification |
| `threat_intel_by_ip` | `ip_address` | Reputation, ASN/owner, related detections |
| `threat_intel_by_domain` | domain | Reputation, registration, related detections |
| `threat_intel_by_url` | URL | Reputation and scan verdicts |
| `threat_intel_get_file_behavior` | `hash_value`, optional `sandbox` | Sandbox execution report: processes, file and registry activity, network traffic |
| `threat_intel_get_file_relationships` | `hash_value`, `relationship_type` | Network IOCs and related files from the file's analysis |
| `threat_intel_search` | `query` (VirusTotal Intelligence syntax) | Files matching an advanced query |
| `cve_search_by_id` | CVE identifier, e.g. CVE-2024-3400 | Description, CVSS score, references for one CVE |
| `cve_search_by_vendor` | `vendor`, optional `product` | CVEs affecting a vendor/product |
| `cve_database_status` | — | When the CVE database was last updated and how many CVEs it holds |

**Tier:** none of these tools is classified in Conduit yet, so all of them enforce at `admin`. See `GOVERNANCE.md`.

## Workflows

### Enrich an alert's indicators

1. `get_alert` (and `get_alert_investigation_report` for Purple AI's auto-investigation, if one ran) to collect the file hash, IPs, domains and URLs.
2. `threat_intel_by_hash` for the file; if detections are low but the alert is suspicious, `threat_intel_get_file_behavior` for what it does when run.
3. `threat_intel_by_ip` / `threat_intel_by_domain` / `threat_intel_by_url` for each network indicator.
4. `threat_intel_get_file_relationships` to pivot from the file to its contacted infrastructure, then check whether those indicators appear elsewhere in the fleet with `powerquery`.
5. Summarise as known-bad, known-good, or unknown, with the evidence for each indicator.

### CVE question from a customer

1. `cve_database_status` so the answer can state how current the data is.
2. `cve_search_by_id` for a named CVE, or `cve_search_by_vendor` (with `product`) for "what affects our Fortinet firewalls?".
3. To find which customer endpoints are actually exposed, switch to `sentinelone-vulnerabilities`.

## Gotchas

- **Third-party lookups leave the tenant.** Hashes, IPs, domains and URLs are sent to VirusTotal / Google Threat Intelligence. Do not submit indicators the customer considers confidential (internal hostnames, URLs with tokens).
- **A clean result is not proof of safety.** A hash VirusTotal has never seen returns little or nothing; treat that as "unknown", not "benign".
- **Rate limits.** Threat-intel lookups are quota-bound upstream. Enrich the indicators that matter rather than every row of a hunt result.

## Related Skills

- [Alerts](../alerts/SKILL.md)
- [Threat Hunting](../threat-hunting/SKILL.md)
- [Vulnerabilities](../vulnerabilities/SKILL.md)
