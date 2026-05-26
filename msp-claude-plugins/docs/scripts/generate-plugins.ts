/**
 * Auto-generates docs/src/data/plugins.ts from the canonical marketplace.json
 * and actual plugin directory contents.
 *
 * Usage: npx tsx scripts/generate-plugins.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// ── Paths ──────────────────────────────────────────────────────────────
const DOCS_DIR = path.resolve(import.meta.dirname, '..');
const REPO_ROOT = path.resolve(DOCS_DIR, '..', '..');
const MARKETPLACE_PATH = path.join(REPO_ROOT, '.claude-plugin', 'marketplace.json');
const OUTPUT_PATH = path.join(DOCS_DIR, 'src', 'data', 'plugins.ts');
const OUTPUT_PATH_SHARED = path.join(DOCS_DIR, 'src', 'data', 'sharedSkills.ts');

// ── Category mapping ───────────────────────────────────────────────────
const VALID_CATEGORIES = new Set([
  'psa', 'rmm', 'documentation', 'security', 'sales', 'accounting',
  'productivity', 'email-security', 'incident-management', 'monitoring',
  'network', 'crm', 'marketplace',
]);

function normalizeCategory(raw: string): string {
  if (raw === 'psa-rmm') return 'psa';
  if (raw === 'knowledge') return 'psa'; // fallback, but shared-skills is excluded anyway
  if (VALID_CATEGORIES.has(raw)) return raw;
  return raw; // pass through — the type union will expand if needed
}

// ── Vendor derivation ──────────────────────────────────────────────────
/** Derive a display-friendly vendor name from the source path. */
function deriveVendor(sourcePath: string): string {
  // sourcePath looks like "./msp-claude-plugins/kaseya/autotask"
  const parts = sourcePath.replace('./msp-claude-plugins/', '').split('/');
  const topLevel = parts[0];

  const vendorMap: Record<string, string> = {
    kaseya: 'Kaseya',
    'kaseya-quote-manager': 'Kaseya',
    connectwise: 'ConnectWise',
    ninjaone: 'NinjaOne',
    syncro: 'Syncro',
    atera: 'Atera',
    superops: 'SuperOps',
    halopsa: 'Halo',
    liongard: 'Liongard',
    salesbuildr: 'SalesBuildr',
    hudu: 'Hudu',
    pax8: 'Pax8',
    xero: 'Xero',
    quickbooks: 'Intuit',
    hubspot: 'HubSpot',
    pandadoc: 'PandaDoc',
    sentinelone: 'SentinelOne',
    pagerduty: 'PagerDuty',
    betterstack: 'BetterStack',
    m365: 'Microsoft',
    rootly: 'Rootly',
    datto: 'Datto',
    huntress: 'Huntress',
    abnormal: 'Abnormal',
    blumira: 'Blumira',
    cipp: 'CIPP',
    avanan: 'Avanan',
    proofpoint: 'Proofpoint',
    knowbe4: 'KnowBe4',
    ironscales: 'Ironscales',
    mimecast: 'Mimecast',
    spamtitan: 'SpamTitan',
    sherweb: 'Sherweb',
    'email-security': 'Email Security',
  };

  return vendorMap[topLevel] ?? capitalize(topLevel);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Convert a slug like "api-patterns" to "Api Patterns" */
function humanize(slug: string): string {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ── Display name derivation ────────────────────────────────────────────
/** Derive a short display name from plugin.json name or marketplace name. */
function deriveDisplayName(pluginJsonName: string | undefined, marketplaceName: string, sourcePath: string): string {
  // If plugin.json has a scoped name like "kaseya-autotask", make it readable
  if (pluginJsonName) {
    // Strip common prefixes like "kaseya-" for the display
    const parts = pluginJsonName.split('-');
    // Return the full name as-is, capitalized — the hand-maintained file used
    // custom names so we should fall through to the marketplace description
  }

  // Build a reasonable display name from the marketplace name
  const nameMap: Record<string, string> = {
    'autotask': 'Autotask PSA',
    'datto-rmm': 'Datto RMM',
    'it-glue': 'IT Glue',
    'syncro': 'Syncro MSP',
    'atera': 'Atera',
    'superops': 'SuperOps.ai',
    'halopsa': 'HaloPSA',
    'connectwise-psa': 'ConnectWise PSA',
    'connectwise-automate': 'ConnectWise Automate',
    'ninjaone-rmm': 'NinjaOne (NinjaRMM)',
    'liongard': 'Liongard',
    'salesbuildr': 'SalesBuildr',
    'hudu': 'Hudu',
    'rocketcyber': 'RocketCyber',
    'pax8': 'Pax8',
    'xero': 'Xero',
    'quickbooks-online': 'QuickBooks Online',
    'hubspot': 'HubSpot CRM',
    'pandadoc': 'PandaDoc',
    'sentinelone': 'SentinelOne',
    'pagerduty': 'PagerDuty',
    'betterstack': 'BetterStack',
    'm365': 'Microsoft 365',
    'rootly': 'Rootly',
    'cipp': 'CIPP',
  };

  return nameMap[marketplaceName] ?? humanize(marketplaceName);
}

// ── YAML frontmatter parser (minimal, no deps) ─────────────────────────
function extractFrontmatterField(content: string, field: string): string {
  // Extract only the frontmatter (between --- markers)
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  const frontmatter = fmMatch ? fmMatch[1] : content;

  // Multi-line block scalar (field: > or field: |) — check first
  const blockRegex = new RegExp(`^${field}:\\s*[>|]\\s*\\n((?:[ \\t]+.+\\n?)+)`, 'm');
  const blockMatch = frontmatter.match(blockRegex);
  if (blockMatch) {
    return blockMatch[1]
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .join(' ');
  }

  // Single-line: "field: value" (but not "field: >" or "field: |")
  const singleLineRegex = new RegExp(`^${field}:\\s*(?![>|]\\s*$)(.+)$`, 'm');
  const singleMatch = frontmatter.match(singleLineRegex);
  if (singleMatch) {
    return singleMatch[1].trim().replace(/^['"]|['"]$/g, '');
  }

  return '';
}

// ── Skill scanner ──────────────────────────────────────────────────────
interface SkillEntry {
  name: string;
  description: string;
}

function scanSkills(pluginDir: string): SkillEntry[] {
  const skillsDir = path.join(pluginDir, 'skills');
  if (!fs.existsSync(skillsDir)) return [];

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  const skills: SkillEntry[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillMd = path.join(skillsDir, entry.name, 'SKILL.md');
    if (!fs.existsSync(skillMd)) continue;

    const content = fs.readFileSync(skillMd, 'utf-8');
    let description = extractFrontmatterField(content, 'description');

    // Truncate to first sentence for brevity. Require the sentence-ending punctuation
    // to be followed by whitespace + a capital letter (or end of string) so we don't
    // cut inside abbreviations like "OAuth 2.0", "vs.", "i.e.", etc.
    if (description.length > 120) {
      const firstSentence = description.match(/^.+?[.!?](?=\s+[A-Z]|\s*$)/);
      if (firstSentence) {
        description = firstSentence[0];
      } else {
        description = description.slice(0, 150).replace(/\s+\S*$/, '') + '...';
      }
    }

    skills.push({ name: entry.name, description: description || `${humanize(entry.name)} operations` });
  }

  // Sort alphabetically but put api-patterns last
  skills.sort((a, b) => {
    if (a.name === 'api-patterns') return 1;
    if (b.name === 'api-patterns') return -1;
    return a.name.localeCompare(b.name);
  });

  return skills;
}

// ── Agent scanner ──────────────────────────────────────────────────────
interface AgentEntry {
  name: string;
  description: string;
}

function scanAgents(pluginDir: string): AgentEntry[] {
  const agentsDir = path.join(pluginDir, 'agents');
  if (!fs.existsSync(agentsDir)) return [];

  const files = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
  const agents: AgentEntry[] = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(agentsDir, file), 'utf-8');
    const name = extractFrontmatterField(content, 'name') || file.replace(/\.md$/, '');
    let description = extractFrontmatterField(content, 'description');

    // Truncate to first sentence for brevity. Require the sentence-ending punctuation
    // to be followed by whitespace + a capital letter (or end of string) so we don't
    // cut inside abbreviations like "OAuth 2.0", "vs.", "i.e.", etc.
    if (description.length > 120) {
      const firstSentence = description.match(/^.+?[.!?](?=\s+[A-Z]|\s*$)/);
      if (firstSentence) {
        description = firstSentence[0];
      } else {
        description = description.slice(0, 150).replace(/\s+\S*$/, '') + '...';
      }
    }

    agents.push({ name, description: description || `${humanize(file.replace(/\.md$/, ''))} agent` });
  }

  agents.sort((a, b) => a.name.localeCompare(b.name));
  return agents;
}

// ── Command scanner ────────────────────────────────────────────────────
interface CommandEntry {
  name: string;
  description: string;
}

function scanCommands(pluginDir: string): CommandEntry[] {
  const commandsDir = path.join(pluginDir, 'commands');
  if (!fs.existsSync(commandsDir)) return [];

  const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'));
  const commands: CommandEntry[] = [];

  for (const file of files) {
    const name = '/' + file.replace(/\.md$/, '');
    const content = fs.readFileSync(path.join(commandsDir, file), 'utf-8');
    const description = extractFrontmatterField(content, 'description') || `${humanize(file.replace(/\.md$/, ''))}`;
    commands.push({ name, description });
  }

  commands.sort((a, b) => a.name.localeCompare(b.name));
  return commands;
}

// ── ApiInfo from api-patterns skill ────────────────────────────────────
interface ApiInfo {
  baseUrl: string;
  auth: string;
  rateLimit: string;
  docsUrl: string;
}

function scanApiInfo(_pluginDir: string): ApiInfo {
  // API info cannot be reliably extracted from free-form SKILL.md markdown.
  // Return empty defaults — these can be enriched later via a structured
  // api-info.json file per plugin if needed.
  return { baseUrl: '', auth: '', rateLimit: '', docsUrl: '' };
}

// ── Derive path from source ────────────────────────────────────────────
function derivePath(source: string): string {
  // "./msp-claude-plugins/kaseya/autotask" → "kaseya/autotask"
  return source.replace('./msp-claude-plugins/', '');
}

// ── Features from skills ───────────────────────────────────────────────
function deriveFeatures(skills: SkillEntry[]): string[] {
  return skills
    .filter(s => s.name !== 'api-patterns' && s.name !== 'overview' && s.name !== 'tool-discovery')
    .map(s => humanize(s.name))
    .map(name => {
      // Common renames for better display
      const renameMap: Record<string, string> = {
        'Crm': 'CRM Operations',
        'Tickets': 'Ticket Management',
        'Devices': 'Device Management',
        'Alerts': 'Alert Handling',
        'Sites': 'Site Management',
        'Jobs': 'Job Execution',
        'Audit': 'Audit Data',
        'Variables': 'Variable Management',
        'Organizations': 'Organization Management',
        'Configurations': 'Configuration Items',
        'Contacts': 'Contact Management',
        'Passwords': 'Password Management',
        'Documents': 'Documentation',
        'Flexible Assets': 'Flexible Assets',
        'Customers': 'Customer Operations',
        'Assets': 'Asset Management',
        'Invoices': 'Invoice Management',
        'Clients': 'Client Operations',
        'Contracts': 'Contract Management',
        'Projects': 'Project Management',
        'Time Entries': 'Time Entry Tracking',
        'Companies': 'Company Management',
        'Products': 'Product Catalog',
        'Quotes': 'Quote Generation',
        'Opportunities': 'Opportunity Tracking',
        'Environments': 'Environment Management',
        'Inspections': 'Inspection Monitoring',
        'Systems': 'System Configuration',
        'Detections': 'Detection & Alerting',
        'Computers': 'Computer Management',
        'Scripts': 'Script Execution',
        'Monitors': 'Monitor Configuration',
        'Accounts': 'Account Hierarchy',
        'Incidents': 'Incident Management',
        'Agents': 'Agent Monitoring',
        'Apps': 'Application Inventory',
        'Subscriptions': 'Subscription Lifecycle',
        'Orders': 'Order Management',
        'Payments': 'Payment Tracking',
        'Reports': 'Financial Reporting',
        'Expenses': 'Expense Management',
        'Users': 'User Management',
        'Mailboxes': 'Mailbox & Email',
        'Calendar': 'Calendar Management',
        'Teams': 'Teams Administration',
        'Files': 'File Management',
        'Licensing': 'License Auditing',
        'Security': 'Security Posture',
        'Oncall': 'On-Call Scheduling',
        'Purple Ai': 'Purple AI Threat Hunting',
        'Vulnerabilities': 'Vulnerability Management',
        'Misconfigurations': 'Cloud Security Posture',
        'Inventory': 'Asset Inventory',
        'Threat Hunting': 'PowerQuery Analytics',
        'Uptime': 'Uptime Monitoring',
        'Runbooks': 'Runbook Execution',
        'Proposals': 'Proposal Tracking',
        'Recipients': 'Recipient Management',
        'Templates': 'Template Management',
        'Deals': 'Deal & Pipeline Tracking',
        'Activities': 'Activity Logging',
        'Articles': 'Knowledge Base Articles',
        'Websites': 'Website Monitoring',
      };
      return renameMap[name] ?? name;
    });
}

// ── Maturity derivation ────────────────────────────────────────────────
function deriveMaturity(skills: SkillEntry[], commands: CommandEntry[]): 'production' | 'beta' | 'alpha' {
  const totalItems = skills.length + commands.length;
  if (totalItems > 8) return 'production';
  if (totalItems > 3) return 'beta';
  return 'alpha';
}

// ── Main ───────────────────────────────────────────────────────────────
interface MarketplacePlugin {
  name: string;
  source: string;
  description: string;
  version: string;
  category: string;
  tags: string[];
}

interface Marketplace {
  plugins: MarketplacePlugin[];
}

function main(): void {
  // Read marketplace.json
  const marketplace: Marketplace = JSON.parse(
    fs.readFileSync(MARKETPLACE_PATH, 'utf-8')
  );

  const pluginEntries: string[] = [];
  const allCategories = new Set<string>();

  let sharedSkillsEmitted = 0;

  for (const entry of marketplace.plugins) {
    // shared-skills is rendered as cross-cutting content, not a vendor plugin.
    // Emit it to a separate sharedSkills.ts so /skills can surface it without
    // forcing a `Plugin`-shaped entry into plugins.ts.
    if (entry.name === 'shared-skills') {
      const sharedDir = path.join(REPO_ROOT, 'msp-claude-plugins', derivePath(entry.source));
      const sharedSkills = scanSkills(sharedDir);
      const sharedJsonPath = path.join(sharedDir, '.claude-plugin', 'plugin.json');
      const sharedJson: { description?: string; version?: string } | null = fs.existsSync(sharedJsonPath)
        ? JSON.parse(fs.readFileSync(sharedJsonPath, 'utf-8'))
        : null;
      writeSharedSkills(sharedSkills, {
        description: sharedJson?.description || entry.description,
        version: sharedJson?.version,
        installSlug: entry.name,
      });
      sharedSkillsEmitted = sharedSkills.length;
      continue;
    }

    const pluginRelPath = derivePath(entry.source);
    const pluginDir = path.join(REPO_ROOT, 'msp-claude-plugins', pluginRelPath);

    // Read plugin.json if it exists
    const pluginJsonPath = path.join(pluginDir, '.claude-plugin', 'plugin.json');
    let pluginJson: { name?: string; version?: string; description?: string } | null = null;
    if (fs.existsSync(pluginJsonPath)) {
      pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf-8'));
    }

    // Scan skills, agents, and commands
    const skills = scanSkills(pluginDir);
    const agents = scanAgents(pluginDir);
    const commands = scanCommands(pluginDir);
    const apiInfo = scanApiInfo(pluginDir);

    const category = normalizeCategory(entry.category);
    allCategories.add(category);

    const id = entry.name;
    const name = deriveDisplayName(pluginJson?.name, entry.name, entry.source);
    const vendor = deriveVendor(entry.source);
    const description = entry.description;
    const maturity = deriveMaturity(skills, commands);
    const features = deriveFeatures(skills);
    const pluginPath = pluginRelPath;

    const compatibility = '{ claudeCode: true, claudeDesktop: true, validated: false }';

    // Format skills array
    const skillsStr = skills.length > 0
      ? `[\n${skills.map(s => `      { name: '${s.name}', description: ${quote(s.description)} }`).join(',\n')}\n    ]`
      : '[]';

    // Format agents array
    const agentsStr = agents.length > 0
      ? `[\n${agents.map(a => `      { name: '${a.name}', description: ${quote(a.description)} }`).join(',\n')}\n    ]`
      : '[]';

    // Format commands array
    const commandsStr = commands.length > 0
      ? `[\n${commands.map(c => `      { name: '${c.name}', description: ${quote(c.description)} }`).join(',\n')}\n    ]`
      : '[]';

    // Format features array
    const featuresStr = features.length > 0
      ? `[\n${features.map(f => `      '${escapeQuotes(f)}'`).join(',\n')}\n    ]`
      : '[]';

    // Format apiInfo
    const apiInfoStr = `{
      baseUrl: ${quote(apiInfo.baseUrl)},
      auth: ${quote(apiInfo.auth)},
      rateLimit: ${quote(apiInfo.rateLimit)},
      docsUrl: ${quote(apiInfo.docsUrl)}
    }`;

    const pluginStr = `  {
    id: '${escapeQuotes(id)}',
    name: '${escapeQuotes(name)}',
    vendor: '${escapeQuotes(vendor)}',
    description: ${quote(description)},
    category: '${category}',
    maturity: '${maturity}',
    features: ${featuresStr},
    skills: ${skillsStr},
    agents: ${agentsStr},
    commands: ${commandsStr},
    apiInfo: ${apiInfoStr},
    path: '${escapeQuotes(pluginPath)}',
    compatibility: ${compatibility}
  }`;

    pluginEntries.push(pluginStr);
  }

  // Build the category union type from discovered categories
  const categoryUnion = Array.from(allCategories).sort().map(c => `'${c}'`).join(' | ');

  const output = `// Auto-generated — do not edit manually. Run \`npm run generate\` to update.

export interface Plugin {
  id: string;
  name: string;
  vendor: string;
  description: string;
  category: ${categoryUnion};
  maturity: 'production' | 'beta' | 'alpha';
  features: string[];
  skills: Skill[];
  agents: Agent[];
  commands: Command[];
  apiInfo: ApiInfo;
  path: string;
  mcpRepo?: string;
  compatibility: {
    claudeCode: boolean;
    claudeDesktop: boolean | 'coming-soon';
    validated: boolean;
  };
}

export interface Skill {
  name: string;
  description: string;
}

export interface Agent {
  name: string;
  description: string;
}

export interface Command {
  name: string;
  description: string;
}

export interface ApiInfo {
  baseUrl: string;
  auth: string;
  rateLimit: string;
  docsUrl: string;
}

export const plugins: Plugin[] = [
${pluginEntries.join(',\n')}
];

export function getPluginById(id: string): Plugin | undefined {
  return plugins.find(p => p.id === id);
}

export function getPluginsByCategory(category: Plugin['category']): Plugin[] {
  return plugins.filter(p => p.category === category);
}

export function getPluginsByVendor(vendor: string): Plugin[] {
  return plugins.filter(p => p.vendor.toLowerCase() === vendor.toLowerCase());
}
`;

  fs.writeFileSync(OUTPUT_PATH, output, 'utf-8');
  console.log(`Generated ${OUTPUT_PATH} with ${pluginEntries.length} plugins`);
  console.log(`Categories: ${Array.from(allCategories).sort().join(', ')}`);
  if (sharedSkillsEmitted > 0) {
    console.log(`Generated ${OUTPUT_PATH_SHARED} with ${sharedSkillsEmitted} shared skills`);
  }
}

interface SharedSkillsMeta {
  description: string;
  version?: string;
  installSlug: string;
}

function writeSharedSkills(skills: SkillEntry[], meta: SharedSkillsMeta): void {
  const skillsArr = skills
    .map(s => `  { name: '${escapeQuotes(s.name)}', description: ${quote(s.description)} }`)
    .join(',\n');

  const output = `// Auto-generated — do not edit manually. Run \`npm run generate\` to update.

export interface SharedSkill {
  name: string;
  description: string;
}

/**
 * Cross-cutting skills that are not tied to a single vendor. Distributed
 * via the \`${meta.installSlug}\` marketplace entry; install with:
 *
 *   /plugin marketplace add wyre-technology/msp-claude-plugins
 *   /plugin install ${meta.installSlug}
 */
export const sharedSkills: SharedSkill[] = [
${skillsArr}
];

export const sharedSkillsMeta = {
  installSlug: '${escapeQuotes(meta.installSlug)}',
  description: ${quote(meta.description)},
  version: ${meta.version ? `'${escapeQuotes(meta.version)}'` : 'undefined'},
};
`;

  fs.writeFileSync(OUTPUT_PATH_SHARED, output, 'utf-8');
}

function escapeQuotes(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function quote(s: string): string {
  if (!s) return "''";
  // Use single quotes, escape any internal single quotes
  return `'${escapeQuotes(s)}'`;
}

main();
