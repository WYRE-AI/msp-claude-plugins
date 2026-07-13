// Auto-generated — do not edit manually. Run `npm run generate` to update.

export interface SharedSkill {
  name: string;
  description: string;
}

/**
 * Cross-cutting skills that are not tied to a single vendor. Distributed
 * via the `shared-skills` marketplace entry; install with:
 *
 *   /plugin marketplace add wyre-technology/msp-claude-plugins
 *   /plugin install shared-skills
 */
export const sharedSkills: SharedSkill[] = [
  { name: 'billing-reconciliation', description: 'Reconcile cloud marketplace subscriptions (Pax8) against accounting invoices (Xero, QuickBooks Online) to identify billing gaps, unbilled...' },
  { name: 'incident-correlation', description: 'Use this skill when correlating data across multiple vendor tools during incident investigation.' },
  { name: 'msp-terminology', description: 'Use this skill when interpreting MSP-specific terminology, acronyms, and concepts.' },
  { name: 'ticket-triage', description: 'Use this skill when triaging tickets in any PSA - determining priority, categorization, routing, and initial response.' },
  { name: 'wyre-gateway-troubleshooting', description: 'Diagnose and resolve common issues with the WYRE MCP Gateway — missing vendor tools, OAuth failures, "Failed to update tool access" errors, expired credentials, and the request flow through mcp-remote → gateway → vendor container → external API.' }
];

export const sharedSkillsMeta = {
  installSlug: 'shared-skills',
  description: 'Vendor-agnostic MSP skills — terminology, ticket triage, incident correlation, and billing reconciliation',
  version: '1.1.2',
};
