// wyre-guard: the pure rules behind hooks/register.tsx. No engine calls here,
// so the classification and redaction logic is easy to read and to test.

export const REDACTED = '[redacted]'

// mcp__<server>__<vendor>__<action>, where <server> is the Conduit connector.
// Matches the plugin-served connector (mcp__plugin_wyre-gateway_msp-mcp-gateway__...),
// the claude.ai-synced one (mcp__claude_ai_Conduit_Gateway__...) and hand-added
// servers whose name contains conduit, wyre or msp-gateway anywhere
// (conduit-prod, wyre-conduit-staging). Any other server name is not guarded.
const CONDUIT_SERVER = /conduit|wyre|msp-(?:mcp-)?gateway/i

// Vendor slug (first segment) to the label shown in the confirm dialog.
const DOMAIN: Record<string, string> = {
  autotask: 'PSA',
  'connectwise-psa': 'PSA',
  connectwise_psa: 'PSA',
  halopsa: 'PSA',
  superops: 'PSA',
  syncro: 'PSA',
  freshdesk: 'PSA',
  atera: 'PSA / RMM',
  'datto-rmm': 'RMM',
  datto_rmm: 'RMM',
  ninjaone: 'RMM',
  ncentral: 'RMM',
  itglue: 'Documentation',
  hudu: 'Documentation',
  cipp: 'Microsoft 365',
}

// Conduit names tools verb-first (get_ticket) or resource-first (tickets_get),
// so every word of the action is checked. Precedence: destructive, then write,
// then read. An action with none of these words (router, raw_request) is a
// write: unknown fails closed.
const DESTRUCTIVE_VERBS = new Set([
  'delete', 'archive', 'disable', 'reset', 'revoke', 'offboard', 'quarantine',
  'dismiss', 'remove', 'purge', 'wipe', 'terminate', 'isolate', 'run', 'resolve',
])

const WRITE_VERBS = new Set([
  'create', 'update', 'set', 'add', 'assign', 'edit', 'patch', 'send', 'close',
  'execute', 'raw', 'router', 'custom', 'mutation', 'start', 'cancel',
  'import', 'restore', 'publish', 'upload', 'invite', 'enable', 'sync', 'merge',
  'move', 'rename', 'approve', 'unarchive',
])

const READ_VERBS = new Set([
  'get', 'list', 'search', 'find', 'read', 'query', 'count', 'status', 'test',
  'check', 'ping', 'describe', 'show', 'my', 'audit', 'suggest', 'evaluate',
  'statistics', 'billing', 'threat', 'cve', 'powerquery',
])

export type ConduitCall = {
  vendor: string
  action: string
  domain: string
  kind: 'read' | 'write' | 'destructive'
}

// Returns null for a tool that does not come from the Conduit gateway.
export function classify(tool: string): ConduitCall | null {
  const [prefix, server = '', ...tail] = tool.split('__')
  if (prefix !== 'mcp' || !CONDUIT_SERVER.test(server) || tail.length === 0) return null

  const rest = tail.join('__')
  const parts = rest.split('__')
  const vendor = parts.length > 1 ? parts[0] : rest.split('_')[0]
  const raw = parts.length > 1 ? parts.slice(1).join('__') : rest
  // Conduit also names tools <vendor>_<action>: drop the repeated vendor.
  const action = raw.startsWith(`${vendor}_`) ? raw.slice(vendor.length + 1) : raw
  const words = action.split('_')
  const kind = words.some(w => DESTRUCTIVE_VERBS.has(w))
    ? 'destructive'
    : words.some(w => WRITE_VERBS.has(w))
      ? 'write'
      : words.some(w => READ_VERBS.has(w))
        ? 'read'
        : 'write'

  return { vendor, action, domain: DOMAIN[vendor] ?? 'MSP', kind }
}

// Input fields that name a client. A write whose input names a different
// client than the active one is the Acme-data-to-Globex mistake this guards.
// tenantFilter is how every CIPP tool scopes the Microsoft 365 tenant.
const CLIENT_FIELD =
  /^(?:(?:company|client|customer|organi[sz]ation|org|tenant|site)(?:_?name)?|tenant_?filter|tenant_?id|default_?domain_?name)$/i

// CIPP fans out to every tenant on this value: always worth a warning.
const ALL_TENANTS = /^all_?tenants$/i

// "Acme Corp" must match the tenant "acmecorp.onmicrosoft.com": compare letters and digits only.
const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

// Names in the tool input that do not match the active client.
export function mismatches(active: string, input: Record<string, unknown>): string[] {
  const want = squash(active)
  return Object.entries(input).flatMap(([key, value]) =>
    CLIENT_FIELD.test(key) &&
    typeof value === 'string' &&
    value.trim() !== '' &&
    (ALL_TENANTS.test(value.trim()) || !squash(value).includes(want))
      ? [value.trim()]
      : [],
  )
}

// The tool arguments: everything on the event but the engine's own keys.
export function toolInput(e: object): Record<string, unknown> {
  const { tool: _t, tool_use_id: _i, agentId: _a, consent: _c, requestMeta: _m, ...input } = e as Record<string, unknown>
  return input
}

// One line on what the call changes: the first few argument names, never values.
export function impact(call: ConduitCall, input: Record<string, unknown>): string {
  const fields = Object.keys(input).slice(0, 4).join(', ')
  const what = call.kind === 'destructive' ? 'Destructive' : 'Write'
  return `${what} in ${call.domain}${fields ? `, fields: ${fields}` : ''}`
}

// The secret word must end the key, at a word or camelCase boundary:
// client_secret, accessToken and apiKey match; tokenExpiry, rootPath, footprint
// and passwordNeverExpires do not.
const SECRET_WORD = /(?:^|_)(?:pass(?:word|wd)?|secret|token|api_?key|private_?key|authorization|otp|totp|mfa_?seed)s?$/

function isSecretKey(key: string): boolean {
  const words = key
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/[^A-Za-z\d]+/g, '_')
    .toLowerCase()
  return SECRET_WORD.test(words)
}

function luhn(digits: string): boolean {
  const d = digits.replace(/\D/g, '')
  if (d.length < 13 || d.length > 19) return false
  let sum = 0
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i])
    if (i % 2 === 1) n = n * 2 > 9 ? n * 2 - 9 : n * 2
    sum += n
  }
  return sum % 10 === 0
}

const TEXT_RULES: [RegExp, (...m: string[]) => string][] = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, () => REDACTED],
  [/\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/g, () => `Bearer ${REDACTED}`],
  [/\beyJ[\w-]{8,}\.[\w-]{8,}\.[\w-]{8,}/g, () => REDACTED],
  [/\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, () => REDACTED],
  // "password": "x", password=x, api_key: x. Only a key that ends in a secret
  // word counts. A JSON value is replaced by the string "[redacted]", so the
  // output still parses whether the original was a string, number or boolean.
  // An object or array value is left alone (its { or [ never starts a match):
  // replacing only the opener would leave the rest dangling. Secret keys nested
  // inside it are scrubbed by this same rule.
  [
    /("?)([\w-]+)("?\s*[:=]\s*)("(?:[^"\\]|\\.)*"|[^\s,;{}[\]"][^\s,;}\]"]*)/g,
    (all, open, key, sep, value) =>
      !isSecretKey(key)
        ? all
        : `${open}${key}${sep}${value.startsWith('"') || open === '"' ? `"${REDACTED}"` : REDACTED}`,
  ],
  // Prose: "The new password is Xy7!abc" (cipp_reset_password answers like this).
  // The value stops at a quote or backslash so a JSON string keeps its closing quote.
  [/\b(pass(?:word|code|wd)\s+(?:is|was)\s*:?\s+)[^\s,;"\\]+/gi, (_all, lead) => `${lead}${REDACTED}`],
  [/\b\d{3}-\d{2}-\d{4}\b/g, () => REDACTED],
  // Cards: only a grouped number (4-4-4-4 or Amex 4-6-5, spaces or dashes) that
  // passes Luhn. Bare digit runs are never touched: about 1 in 10 timestamps and
  // numeric IDs pass Luhn by chance, and those must reach the model intact.
  [
    /\b\d{4}([ -])\d{4}\1\d{4}\1\d{1,7}\b|\b\d{4}([ -])\d{6}\2\d{5}\b/g,
    m => (luhn(m) ? REDACTED : m),
  ],
]

export function redactText(text: string): string {
  return TEXT_RULES.reduce((out, [pattern, replace]) => out.replace(pattern, replace), text)
}

// Walks any tool result (MCP content blocks, structuredContent, plain strings):
// strings are scrubbed, and a string under a secret-looking key is dropped whole.
export function redact(value: unknown, key = ''): unknown {
  if (typeof value === 'string') return isSecretKey(key) ? REDACTED : redactText(value)
  if (Array.isArray(value)) return value.map(item => redact(item, key))
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redact(v, k)]))
  }
  return value
}
