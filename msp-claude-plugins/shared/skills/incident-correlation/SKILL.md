---
name: "Incident Correlation"
description: >
  Vendor-agnostic cross-tool incident correlation: combining PSA tickets,
  RMM device state, documentation-platform assets, and configuration-
  monitoring changes into a unified incident summary across Kaseya,
  ConnectWise, HaloPSA, Syncro, Atera, and similar MSP stacks.
when_to_use: >-
  When an investigation needs data pulled together from more than one vendor
  platform. Use when: incident correlation, cross-vendor investigation,
  correlate ticket, unified incident summary, incident context, device
  investigation, cross-platform lookup, ticket device correlation, incident
  timeline, or multi-vendor incident.
---

# Cross-Vendor Incident Correlation

## Overview

MSP technicians routinely context-switch between PSA (tickets), RMM (device state), documentation (asset records), and configuration monitoring (change detection) when investigating incidents. This skill teaches Claude how to automatically correlate data across these vendor roles, starting from a ticket and producing a unified incident summary.

## Four Vendor Roles

Each vendor tool fills one or more roles in incident investigation:

| Role | Purpose | Examples |
|------|---------|----------|
| **PSA** (ticket source) | Ticket details, company, contact, contract | Autotask, ConnectWise Manage, HaloPSA, Syncro, Atera, SuperOps |
| **RMM** (device state) | Device status, alerts, last seen, last reboot | Datto RMM, ConnectWise Automate, NinjaOne, Atera, Syncro |
| **Documentation** (asset docs) | Asset records, related docs, passwords | IT Glue, Hudu, ConnectWise Manage configs |
| **Config Monitoring** (change detection) | Recent changes, compliance, anomalies | Liongard |

A single vendor may fill multiple roles (e.g., Syncro is both PSA and RMM, Atera is both PSA and RMM).

## Normalized Incident Model

The correlation workflow produces this canonical data structure:

```
Incident Summary
├── TICKET
│   ├── ID, title, description
│   ├── priority (normalized), status (normalized)
│   ├── created date, last updated
│   └── queue, assigned resource
├── COMPANY
│   ├── name (cross-vendor correlation key)
│   ├── company ID (per vendor)
│   └── contract status (if available)
├── CONTACT
│   ├── name, email, phone
│   └── role / VIP flag
├── DEVICE (if identified)
│   ├── hostname, IP, serial, type
│   ├── RMM status (online/offline), last seen, last reboot
│   ├── open alerts (count + top 3)
│   └── documentation link
├── DOCUMENTATION (if available)
│   ├── asset record summary
│   ├── related documents (titles)
│   └── related passwords (names only, never values)
├── CONFIG CHANGES (if available)
│   ├── recent detections (last 7 days)
│   ├── compliance status
│   └── notable changes near ticket creation time
└── CORRELATION INSIGHTS
    ├── temporal correlations
    ├── alert-ticket alignment
    └── suggested next steps
```

## The 6-Step Correlation Workflow

### Step 1: Get Ticket from PSA

Fetch the ticket using the ticket ID or number provided by the user.

**Extract these fields:**
- `ticketID` / ticket number
- `title` and `description`
- `companyID` (this becomes the cross-vendor key)
- `contactID`
- `priority` (normalize using [VENDOR-MAPPINGS.md](./VENDOR-MAPPINGS.md))
- `status` (normalize using VENDOR-MAPPINGS.md)
- `createdDate` (needed for temporal correlation in Step 6)
- `queue` and `assignedResource`

**If ticket not found:** Stop and inform the user. Suggest checking the ticket number format.

### Step 2: Identify Company and Contact

The company name is the **cross-vendor correlation key**. Different tools use different company identifiers, but the name is the universal link.

1. From the ticket's `companyID`, fetch the company name from the PSA
2. From the ticket's `contactID`, fetch contact details (name, email, phone)
3. Store the company name — you'll use it to search the other platforms

**Company Name Matching Strategy:**

When searching other platforms by company name:
1. **Exact match** — Try the full company name first
2. **Contains match** — If no exact match, search with partial name (e.g., "Acme" instead of "Acme Corporation")
3. **Ask user** — If multiple matches or no match, present options and ask the user to confirm

### Step 3: Find the Device

Identifying the affected device is critical but not always straightforward. Try these methods in order:

1. **Configuration item on ticket** — If the PSA ticket has a linked CI/config item, use that hostname/serial to search
2. **Parse ticket title/description** — Look for hostnames, computer names, IP addresses, or serial numbers mentioned in the text
3. **User-provided device** — The user may specify a hostname or device name directly
4. **Ask the user** — If no device can be identified, ask: "Which device is this ticket about?"

**If no device is relevant** (e.g., account/password requests, policy questions): Skip Steps 4-5 device sections and note "No device associated" in the summary.

### Step 4: Query RMM for Device State

Using the hostname or device identifier from Step 3, query the RMM platform:

**Fetch:**
- Device status: `online` / `offline`
- Last seen timestamp
- Last reboot timestamp
- Open alerts (count and top 3 by severity)
- Device type, OS, IP addresses

**Key insight:** If the device is `offline` and the ticket is about connectivity, this is immediately valuable context. If the device has open alerts that match the ticket description, flag this correlation.

**If RMM not available:** Mark the DEVICE section as "RMM data unavailable" and continue.

### Step 5: Query Documentation Platform

Using the company name and hostname, query the documentation platform:

**Fetch:**
- Asset/configuration record matching the hostname
- Related documents (titles and links, not full content)
- Related passwords (names only — **never retrieve password values** during correlation)
- Warranty status (if available)
- Notes or custom fields

**If documentation platform not available:** Mark the DOCUMENTATION section as "Documentation data unavailable" and continue.

### Step 6: Query Configuration Monitoring

Using the company name (mapped to environment), query for recent changes:

**Fetch:**
- Recent detections in the last 7 days for this environment
- Filter for Critical and High severity first
- Any detections near the ticket creation time (within 24 hours before)
- Compliance metric status (if applicable)

**If config monitoring not available:** Mark the CONFIG CHANGES section as "Config monitoring data unavailable" and continue.

## Correlation Insights Logic

After gathering data from all sources, generate insights:

### Temporal Correlation

Compare the ticket `createdDate` with:
- **Config detections**: Any changes detected within 24 hours before ticket creation? Flag these as "Change detected shortly before this ticket was created."
- **RMM alerts**: Any alerts that fired within 24 hours before the ticket? Flag as "Alert preceded this ticket."
- **Device reboot**: Did the device reboot recently? Could indicate a crash or forced restart.

### Alert-Ticket Alignment

Compare the ticket `title`/`description` keywords with:
- **RMM alert messages**: Do any open alerts mention similar issues?
- **Detection summaries**: Do any recent detections relate to the reported problem?

If keywords overlap (e.g., ticket says "email not working" and a detection says "Exchange mailbox policy changed"), highlight this connection.

### Recurring Issues

If you have access to ticket history:
- Has this company had similar tickets in the last 30 days?
- Is this the same device with repeated issues?
- Flag patterns: "This is the 3rd ticket about email issues for this company in 2 weeks."

## Unified Summary Output Format

Present the correlated data in this structured format:

```
═══════════════════════════════════════════════════
INCIDENT CORRELATION SUMMARY
═══════════════════════════════════════════════════

TICKET
  ID:          T20240215.0042
  Title:       Email not working for multiple users
  Priority:    High (normalized)
  Status:      In Progress
  Created:     2024-02-15 09:23 UTC
  Queue:       Service Desk
  Assigned:    Jane Technician

COMPANY
  Name:        Acme Corporation
  Autotask ID: 12345
  Contract:    Managed Services (Active)

CONTACT
  Name:        John Smith
  Email:       john.smith@acme.com
  Phone:       555-0100

DEVICE
  Hostname:    ACME-EXCH01
  Type:        Server
  RMM Status:  Online (last seen 2 min ago)
  Last Reboot: 2024-02-14 22:00 UTC (11 hours ago)
  IP:          192.168.1.50
  Open Alerts: 2
    - HIGH: Exchange transport service stopped (09:15 UTC)
    - MEDIUM: Disk usage 87% on C: drive (08:00 UTC)

DOCUMENTATION
  Asset Record: ACME-EXCH01 (Server - Exchange 2019)
  Related Docs: "Acme Email Configuration", "Exchange Maintenance Runbook"
  Passwords:   "Acme Exchange Admin", "Acme Domain Admin"
  Warranty:    Expires 2025-06-15

CONFIG CHANGES (last 7 days)
  2 detections found:
    - HIGH: Exchange transport rules modified (2024-02-14 23:30 UTC)
    - MEDIUM: Windows Update KB5034763 installed (2024-02-13 02:00 UTC)

CORRELATION INSIGHTS
  ! Transport rule change detected 10 hours before ticket creation
    — Likely root cause: modified transport rules may be blocking email flow
  ! Exchange transport service alert matches ticket description
    — RMM confirms the service is stopped
  - Device rebooted last night; verify if reboot triggered the service issue

SUGGESTED NEXT STEPS
  1. Check Exchange transport rules for recent modifications
  2. Restart the Exchange transport service
  3. Verify mail flow after service restart
  4. Review the transport rule change in Liongard for details
═══════════════════════════════════════════════════
```

## Graceful Degradation

Each vendor role is **optional**. The workflow should always produce a summary, even if some data sources are unavailable:

| Missing Source | Impact | Handling |
|---------------|--------|----------|
| RMM unavailable | No device status or alerts | Note "RMM data unavailable" in DEVICE section |
| Documentation unavailable | No asset record or docs | Note "Documentation data unavailable" |
| Config monitoring unavailable | No change detection | Note "Config monitoring data unavailable" |
| Device not identified | No device-specific data | Skip device sections, note "No device associated" |
| Contact not found | No contact details | Note "Contact not found" in CONTACT section |

The TICKET and COMPANY sections should **always** be populated since the workflow starts from a ticket.

## Depth Modes

### Quick Mode

Query only PSA + RMM (Steps 1-4). Produces a faster summary focused on ticket context and device state. Useful for initial triage.

### Full Mode (default)

Query all four vendor roles (Steps 1-6). Produces the complete correlated summary with documentation and config monitoring insights.

## Related Skills

- [Ticket Triage](../ticket-triage/SKILL.md) — Best practices for initial ticket assessment
- [MSP Terminology](../msp-terminology/SKILL.md) — Vendor-agnostic MSP vocabulary
- [Vendor Mappings](./VENDOR-MAPPINGS.md) — Field mappings and normalization tables per vendor
