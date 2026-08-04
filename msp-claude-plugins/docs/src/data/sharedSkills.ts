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
  { name: 'billing-reconciliation', description: 'Reconciling cloud marketplace subscriptions (Pax8) against accounting invoices (Xero, QuickBooks Online): the matching strategy, billing gaps, unbilled subscriptions, and margin discrepancy analysis.' },
  { name: 'incident-correlation', description: 'Vendor-agnostic cross-tool incident correlation: combining PSA tickets, RMM device state, documentation-platform assets, and configuration- monitoring changes into a unified incident summary across Kaseya, ConnectWise, HaloPSA, Syncro, Atera, and similar MSP stacks.' },
  { name: 'msp-terminology', description: 'MSP industry terminology: acronyms, roles, contract and billing concepts, and the vocabulary used across PSA, RMM, documentation, and security platforms.' },
  { name: 'ticket-triage', description: 'Vendor-agnostic PSA ticket triage: priority determination, categorization, routing, and initial response practices applicable to Autotask, ConnectWise, HaloPSA, and other platforms.' },
  { name: 'wyre-gateway-troubleshooting', description: 'WYRE MCP Gateway diagnostics: missing vendor tools, OAuth failures, "Failed to update tool access" errors, expired credentials, and the request flow through mcp-remote to gateway to vendor container to external API.' }
];

export const sharedSkillsMeta = {
  installSlug: 'shared-skills',
  description: 'Vendor-agnostic MSP skills — terminology, ticket triage, incident correlation, and billing reconciliation',
  version: '1.1.3',
};
