---
name: Client Onboarding
description: >
  Vendor-agnostic runbook for onboarding a new MSP client through Conduit:
  intake, then PSA, documentation, RMM, security, Microsoft 365, password
  manager, backup and billing setup, followed by verification and a handoff
  report. Plan first, confirm every write, dedupe, and record cross-system IDs.
when_to_use: >-
  When an MSP is signing or starting a new customer and wants the accounts,
  records and tooling stood up across its stack. Use when: onboard a new
  client, new customer onboarding, client onboarding checklist, set up a new
  company in the PSA, new tenant onboarding, new client setup, onboarding
  project, go-live checklist, or customer provisioning.
---

# Client Onboarding

## Overview

Onboarding a managed-services client touches a dozen systems: the PSA, the documentation platform, the RMM, the security stack, Microsoft 365, the password manager, backup, and billing. Each has its own record of the same client, and the failure mode is drift: a company exists in the PSA but not in the RMM, an agent is deployed to the wrong site, or the client is never billed. This skill owns the *order of work and the safety rules*. It does not know any vendor's API; the vendor skills do.

The run produces an onboarding plan, executes it only after the operator confirms, and ends with a handoff report listing what was created, where, and what a human still has to do.

## Anti-triggers

- **Operating one vendor's records** (create a company, add a site, build an RMM policy) — load that vendor's skill, such as `hudu/companies`, `halopsa/clients`, `huntress/organizations`, `ninjaone/organizations`, or `datto-rmm/sites`.
- **Ongoing ticket handling for the new client** — use `shared-skills-ticket-triage`.
- **Comparing marketplace subscriptions with invoices after go-live** — use `shared-skills-billing-reconciliation`.
- **Unknown acronym or contract concept** — use `shared-skills-msp-terminology`.
- **Vendor tools missing or failing on the gateway** — use `shared-skills-wyre-gateway-troubleshooting`.
- **Offboarding or a user joiner/leaver** — those are separate lifecycles; use the vendor user skills (`m365/users`, `jamf/user-onboarding`, `dubber/user-lifecycle`).

## Ground rules

1. **Discover before planning.** Call `conduit__my_access` and `conduit__search_tools` to learn which vendors are connected and at what tier. Plan only for connected vendors. A category with no connected vendor becomes a manual checklist item, never a guess.
2. **Read the vendor skill first.** Before touching a vendor, load its skill with `conduit__get_skill` (use `conduit__list_skills` to find the slug). It carries the real tool names, required fields, enums and gotchas. This skill deliberately names no vendor tools.
3. **Reads are free, writes are gated.** Check each tool's tier. Present the full plan of creates (system, object, key fields) and wait for an explicit operator "yes" before the first write. Re-confirm before any admin-tier call, and before anything that bills the client, emails the client, or changes tenant security.
4. **Never invent data.** A missing legal name, contact, domain or contract term is a question for the operator, not a placeholder. Leave optional fields empty.
5. **Search before create.** Look up each object by name, domain, email or external ID before creating it. A hit means link or update (after confirmation), not duplicate.
6. **Be idempotent.** The run must be safe to repeat after a failure. Keep the ledger (below) and skip steps whose object already exists.
7. **Stop on ambiguity.** Two plausible matches for one client, a naming collision, or a tier that blocks a step: report it and ask. Do not pick one.

## Phase 0: Intake

Ask the operator for everything below in one message, accept partial answers, and restate the gaps. Nothing here is guessable.

| Group | Ask |
|-------|-----|
| Identity | Legal name, trading name, short code or abbreviation used in your tooling, tax and billing entity |
| Sites | Each location: address, timezone, on-site contact, whether it has its own network or firewall |
| Contacts | Primary, billing, after-hours/escalation, and authorized-approver contacts with email and phone; who may request changes |
| Agreement | Agreement type (managed, block hours, project, break-fix), start date, term, billing cadence, per-user or per-device pricing, SLA tier, included services |
| Scale | User count, workstation and server counts, mobile devices, network gear |
| Identity | Primary and secondary domains, existing Microsoft 365 or Google tenant, directory type, MFA state |
| Existing vendors | Current MSP or IT contact, security tools, backup, line-of-business apps, ISP and circuit details |
| Go-live | Target date, cutover constraints, blackout windows |

Record the answers as the **intake record**. Every later step reads from it.

## Phase 1: Plan

1. Run discovery (rule 1) and map each stack category to the connected vendor.
2. Run the read-only dedupe lookups for the client name and primary domain in every connected system.
3. Produce the plan: one row per create, with system, object, key fields, tier, and whether it is a write, admin or manual step. Show conflicts and duplicate candidates beside it.
4. Get the operator's explicit approval, or an edited plan. Execute only approved rows.

## Phase 2: Build, in dependency order

Order matters because later systems need the IDs from earlier ones. Within a phase, items are independent.

### 2.1 PSA: the system of record

Create first. Its company ID anchors everything else.

| Object | What to set |
|--------|-------------|
| Company / account | Legal name, type client, status active, main phone, owner or account manager. Use the short code consistently |
| Sites / locations | One per physical location with address and timezone |
| Contacts | Primary, billing, after-hours, approver; flag the primary and the billing contact |
| Agreement / contract | Type, start date, billing cadence, and the service or product lines with quantities and prices from intake |
| SLA | Attach the SLA or priority policy that matches the agreement tier |
| Onboarding project or ticket | One parent with child tasks mirroring Phases 2-4, each assigned and dated against the go-live date |

Terminology differs by platform; use the vendor skill for the real objects:

| Platform | Company | Site | Agreement | Project |
|----------|---------|------|-----------|---------|
| Autotask | Company | Location | Contract (and contract services) | Project |
| ConnectWise PSA | Company | Site | Agreement | Project |
| HaloPSA | Client | Site | Contract | Project or ticket |
| Syncro | Customer | Location on customer | Contract / recurring invoice | Ticket |
| SuperOps | Client | Site | Contract | Project |
| Kaseya BMS | Account | Location | Contract | Project |
| Alga PSA | Client | Location | Billing plan | Project |

If the PSA has a native sync to the RMM, documentation platform or accounting package, create the company first and let the sync run. Do not create the matching record by hand in the target system, or the sync will duplicate it.

### 2.2 Documentation platform

Create the organization in IT Glue or Hudu after the PSA company exists. Match it to the PSA company by the same name and, where the platform supports it, the PSA sync mapping or external ID, so the sync adopts it instead of creating a second one. Then seed: locations, contacts (or let the sync import them), the network and domain overview, and a placeholder for the runbook and credential folder. Record the organization ID.

### 2.3 RMM

Create the organization, site or client in the RMM: NinjaOne, Datto RMM, N-central, ConnectWise Automate, Kaseya VSA, Atera, or ImmyBot. Use one RMM site per physical location if endpoints are managed per site, and name it to match the PSA. Apply the standard monitoring and patch policies for the agreement tier. Retrieve the agent installer or registration link for the site.

**Manual:** deploying agents to endpoints is done by a person or the client's deployment tool. The agent lists what to run and where; it does not install anything.

### 2.4 Security stack

Provision each tool the agreement includes, and only those. For each, record the organization or site identifier the endpoint installer needs.

| Category | Examples | Typical output |
|----------|----------|----------------|
| EDR / MDR | Huntress, SentinelOne, Blackpoint | Organization key or site token for the installer |
| Application control | ThreatLocker | Organization, computer groups, learning-mode policy |
| DNS filtering | Any connected DNS filter | Client or network, roaming-client key |
| Email security | Mimecast, Proofpoint, Avanan | Customer and domain onboarding, MX or API connection (**manual** DNS change) |
| Security awareness | KnowBe4 | Group, users, baseline phishing test, training campaign (schedule, do not launch, until the operator confirms) |

Embed the EDR key into the deployment package for 2.3 so one installer does both. Verify the scale (seat or device count) against intake so licenses are not under- or over-counted.

### 2.5 Microsoft 365 and CIPP

If the client has an existing tenant, onboard it; do not create a tenant for them.

1. Check whether the tenant already appears in CIPP or the tenant-management tool.
2. Send the **GDAP relationship invitation** with the roles the agreement needs. **Manual:** a Global Administrator at the client must accept it. Report it as pending until the tenant shows as managed.
3. Once accepted, apply the baseline: standards template, alerts, secure-score review, license inventory, MFA and conditional-access state. Present baseline changes as a plan; many are tenant-wide and can lock users out.
4. Record the tenant ID and default domain.

### 2.6 Password manager

Create the client vault, folder or collection in 1Password, Keeper or Bitwarden, grant the right MSP groups, and note who is the owner. Do **not** read, print or move credential values; storing initial credentials is a human step.

### 2.7 Backup

Create the customer in the backup platform (Datto, Axcient, Cove, Spanning, Unitrends), choose the retention to match the agreement, and connect the protected assets: servers, endpoints, or the SaaS tenant. Agent installs and the initial seeding are **manual**. Report each protected asset as pending until a first successful backup appears.

### 2.8 Billing

1. **Distributor:** if the client buys through Pax8 or Sherweb, create the company and place orders for the subscriptions in the agreement. Ordering spends money, so confirm quantity, term and price explicitly, even if the plan was already approved.
2. **Accounting:** create or link the customer in QuickBooks Online or Xero with the billing contact and the terms from intake.
3. **Payments:** set up the customer in Alternative Payments or the payment platform only if the operator asked, and never collect or store payment details.
4. **PSA billing:** confirm the agreement's recurring lines match what the distributor and accounting will invoice. A mismatch here is the leak that `shared-skills-billing-reconciliation` finds later.

## Phase 3: Cross-link and ledger

Keep a ledger as you go and show it to the operator at the end:

| System | Object | ID or key | Status | Linked to |
|--------|--------|-----------|--------|-----------|

Write the IDs back where the platforms allow it: PSA company ID into the documentation organization and RMM site, RMM site and EDR keys into the deployment note, tenant ID into the documentation record. A re-run starts by loading this ledger (or re-deriving it by search) and resumes at the first missing row.

## Phase 4: Verify

Read back every created object rather than trusting the create response.

- PSA: company active, primary and billing contacts flagged, agreement and SLA attached, onboarding project dated.
- Documentation: organization exists once, linked to the PSA company.
- RMM: site exists, policies applied, expected device count versus reporting devices (zero at first is normal until agents are installed).
- Security: each tool shows the client; installer keys recorded.
- M365: GDAP status, tenant managed, baseline applied.
- Backup: assets protected, first job result.
- Billing: subscriptions ordered, accounting customer present, recurring lines consistent.
- No duplicates: re-run the dedupe lookups from Phase 1 and expect one hit each.

## Phase 5: Handoff report

Give the operator a short report, not a log:

1. **Created**, with the ledger (system, object, ID).
2. **Linked or adopted** existing records, and anything left unlinked.
3. **Manual steps still open**, each with owner and instructions: agent installs, GDAP acceptance, DNS and MX changes, credential entry, client sign-offs.
4. **Skipped** categories with no connected vendor, and tier-blocked steps.
5. **Assumptions and unanswered intake items.**
6. **Go-live checklist** with dates from intake.

## Gotchas

- A PSA-to-X sync runs on its own schedule. Wait for it, then search, before deciding a record is missing.
- Names are the weakest match key. Prefer domain, external ID or tax ID, and tell the operator which key matched.
- A tool that returns success for a create is not proof; verify in Phase 4.
- A tier that blocks writes is a reason to hand the step to the human with exact values, not to try another route.
- Never put client names, contacts or credentials into this skill, a ticket template or any public repository.
