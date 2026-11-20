import { expect, test } from 'claude-code/testing'

import { classify, mismatches, redact, redactText, toolInput } from './guard'

const UPDATE = 'mcp__plugin_wyre-gateway_msp-mcp-gateway__autotask__autotask_update_ticket'
const SEARCH = 'mcp__plugin_wyre-gateway_msp-mcp-gateway__autotask__autotask_search_tickets'

async function start($: any, on: any, answer: string | Error, result?: () => unknown) {
  const asked: string[] = []
  on('command.register', () => ({ value: { command: 'client' } }))
  on('session.start', (_: any, e: any) => ({ cwd: e.cwd }))
  on('ui.status', () => ({ value: undefined }))
  on('tool.call', (_: any, e: any) => {
    if (e.tool === 'AskUserQuestion') {
      asked.push(JSON.stringify(e))
      if (answer instanceof Error) throw answer
      return { result: { questions: e.questions, answers: { [e.questions[0].question]: answer } } }
    }

    return {
      result: result?.() ?? { content: [{ type: 'text', text: '{"password":"hunter2","id":7}' }], isError: false },
    }
  })
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  return asked
}

test('classify reads gateway tool names of both shapes', async () => {
  expect(classify(UPDATE)).toMatchObject({ vendor: 'autotask', action: 'update_ticket', domain: 'PSA', kind: 'write' })
  expect(classify(SEARCH)?.kind).toBe('read')
  expect(classify('mcp__conduit__datto-rmm__datto_run_quickjob')).toMatchObject({ domain: 'RMM', kind: 'destructive' })
  expect(classify('mcp__conduit__autotask__autotask_router')?.kind).toBe('write')
  expect(classify('mcp__conduit__halopsa__halopsa_tickets_list')?.kind).toBe('read')
  expect(classify('mcp__conduit__superops__superops_tickets_log_time')?.kind).toBe('write')
  expect(classify('mcp__conduit__cipp__cipp_reset_password')?.kind).toBe('destructive')
  expect(classify('mcp__conduit__conduit__audit_log')?.kind).toBe('read')
  expect(classify('mcp__conduit__x__set_status')?.kind).toBe('write')
  expect(classify('mcp__claude_ai_Conduit__autotask__autotask_update_ticket')).toMatchObject({ vendor: 'autotask', kind: 'write' })
  expect(classify('mcp__wyre__cipp__cipp_reset_password')?.kind).toBe('destructive')
  expect(classify('mcp__msp-gateway__autotask__autotask_update_ticket')?.kind).toBe('write')
  expect(classify('mcp__conduit-prod__autotask__autotask_update_ticket')?.kind).toBe('write')
  expect(classify('mcp__wyre-conduit-staging__autotask__autotask_update_ticket')?.kind).toBe('write')
  expect(classify('mcp__claude_ai_Conduit_Gateway__autotask__autotask_update_ticket')?.kind).toBe('write')
  // Other MCP servers whose name merely contains conduit or wyre: no vendor segment.
  expect(classify('mcp__conduit-blog__list_posts')).toBeNull()
  expect(classify('mcp__claude_ai_Wyre_Docs__search_docs')).toBeNull()
  expect(classify('mcp__conduit__conduit__run_code')).toMatchObject({ vendor: 'conduit', kind: 'destructive' })
  expect(classify('mcp__other__thing__update')).toBeNull()
  expect(classify('Bash')).toBeNull()
})

test('mismatches flags a client name that is not the active one', async () => {
  expect(mismatches('Acme', { companyName: 'Globex Corp', title: 'x' })).toEqual(['Globex Corp'])
  expect(mismatches('Acme', { companyName: 'Acme Inc' })).toEqual([])
})

test('mismatches flags a CIPP tenant that is not the active client, and allTenants', async () => {
  expect(mismatches('Acme', { tenantFilter: 'globex.onmicrosoft.com', userId: 'u1' })).toEqual(['globex.onmicrosoft.com'])
  expect(mismatches('Acme Corp', { tenantFilter: 'acmecorp.onmicrosoft.com' })).toEqual([])
  expect(mismatches('Acme', { tenantFilter: 'allTenants' })).toEqual(['allTenants'])
  expect(mismatches('Acme', { tenant_id: 'Globex', defaultDomainName: 'globex.com' })).toEqual(['Globex', 'globex.com'])
})

test('toolInput drops engine keys including requestMeta', async () => {
  expect(toolInput({ tool: 't', tool_use_id: 'i', agentId: 'a', consent: 1, requestMeta: {}, id: 7 })).toEqual({ id: 7 })
})

test('redaction keeps JSON valid for non-secret keys and non-string values', async () => {
  const user = '{"passwordNeverExpires":false,"tokenCount":5,"lastPasswordChangeDateTime":"2026-01-01"}'
  expect(redactText(user)).toBe(user)
  const out = redactText('{"token":5,"password":false,"api_key":"k","accessToken":"t"}')
  expect(JSON.parse(out)).toEqual({ token: '[redacted]', password: '[redacted]', api_key: '[redacted]', accessToken: '[redacted]' })
})

test('redaction keeps JSON valid when a secret key holds an object or array', async () => {
  const hudu = JSON.stringify({ asset_passwords: [{ id: 1, password: 'x' }] }, null, 2)
  expect(JSON.parse(redactText(hudu))).toEqual({ asset_passwords: [{ id: 1, password: '[redacted]' }] })
  for (const json of ['{"token":{"expires":1}}', '{"secrets":["a","b"]}', '{"authorization":{"type":"bearer"}}']) {
    expect(() => JSON.parse(redactText(json))).not.toThrow()
  }
})

test('redact anchors the secret key', async () => {
  const kept = { rootPath: 'C:\\data', footprint: 'small', bypassReason: 'x', passedChecks: 'y', tokenExpiry: 'z' }
  expect(redact(kept)).toEqual(kept)
  expect(redact({ clientSecret: 'a', refresh_token: 'b', apiKey: 'c', Password: 'd', otp: 'e' })).toEqual({
    clientSecret: '[redacted]',
    refresh_token: '[redacted]',
    apiKey: '[redacted]',
    Password: '[redacted]',
    otp: '[redacted]',
  })
})

test('redaction leaves 13-digit timestamps and 19-digit IDs alone, scrubs grouped cards', async () => {
  // 1700000000008 and 1000000000000000009 both pass Luhn; they are not cards.
  const ids = '{"ts":1700000000008,"id":"1000000000000000009","alert":4111111111111111}'
  expect(redactText(ids)).toBe(ids)
  expect(redactText('card 4111 1111 1111 1111 and 4111-1111-1111-1111 and 3782 822463 10005')).toBe(
    'card [redacted] and [redacted] and [redacted]',
  )
  expect(redactText('order 4111 1111 1111 1112')).toBe('order 4111 1111 1111 1112')
})

test('a password stated in prose is scrubbed (cipp_reset_password)', async () => {
  expect(redact({ Results: 'The new password is Xy7!abc' })).toEqual({ Results: 'The new password is [redacted]' })
  expect(redactText('Temporary password: Xy7!abc')).not.toMatch(/Xy7/)
  // The real path: the result reaches redact() as JSON text in a content block.
  const cipp = JSON.stringify({ Results: 'Reset the password for jdoe. The new password is Xy7!abc', id: 1 }, null, 2)
  const out = redactText(cipp)
  expect(out).not.toMatch(/Xy7/)
  expect(JSON.parse(out).id).toBe(1)
})

test('a credential written inside a JSON string value is scrubbed and the JSON stays valid', async () => {
  for (const [note, leaked] of [
    ['Password: Hunter2!', 'Hunter2'],
    ['password=abc123', 'abc123'],
    ['api_key=sk_live_xyz more', 'sk_live_xyz'],
    ['password=ab"cd\nnext line', 'cd'],
  ] as const) {
    const out = redactText(JSON.stringify({ note, id: 1 }))
    expect(out).not.toContain(leaked)
    expect(JSON.parse(out).id).toBe(1)
  }
  expect(redactText('"Password: x"')).toBe('"Password: [redacted]"')
  expect(JSON.parse(redactText('{"note":"see ticket 12: done"}')).note).toBe('see ticket 12: done')
})

test('a prose password with a backslash or quote is scrubbed whole (cipp_reset_password)', async () => {
  for (const password of ['Xy7\\abc', 'Xy7"abc']) {
    const out = redactText(JSON.stringify({ Results: `The new password is ${password}` }))
    expect(out).not.toMatch(/abc/)
    expect(JSON.parse(out).Results).toBe('The new password is [redacted]')
  }
})

test('redaction scrubs credentials and PII, keeps JSON valid', async () => {
  const text = '{"user":"a","password":"hunter2","note":"ssn 123-45-6789 card 4111 1111 1111 1111"}'
  const out = redactText(text)
  expect(out).not.toMatch(/hunter2|123-45-6789|4111/)
  expect(JSON.parse(out).password).toBe('[redacted]')
  expect(redactText('Authorization: Bearer abcdefghijklmnop1234')).not.toMatch(/abcdefghijklmnop/)
  expect(redact({ api_key: 'k-123', nested: [{ secret: 's' }], n: 5 })).toEqual({
    api_key: '[redacted]',
    nested: [{ secret: '[redacted]' }],
    n: 5,
  })
})

test('a write with no active client is blocked', async ($, on) => {
  await start($, on, 'Allow for Acme')
  const ran = await $.tool.call({ tool: UPDATE, id: 1 })
  expect(ran.deny).toMatch(/no active client/)
})

test('a write names the client and the tool, and runs once allowed', async ($, on) => {
  const asked = await start($, on, 'Allow for Acme')
  await $.command.run({ command: 'client', args: 'Acme' })
  const ran = await $.tool.call({ tool: UPDATE, id: 1 })

  expect(asked).toHaveLength(1)
  expect(asked[0]).toMatch(/Allow write on Acme\?/)
  expect(asked[0]).toMatch(/autotask\.update_ticket/)
  expect(asked[0]).toMatch(/Allow for Acme/)
  expect(ran.deny).toBeUndefined()
  expect(JSON.stringify(ran.result)).not.toMatch(/hunter2/)
})

test('Cancel blocks the write', async ($, on) => {
  await start($, on, 'Cancel')
  await $.command.run({ command: 'client', args: 'Acme' })
  const ran = await $.tool.call({ tool: UPDATE, id: 1 })
  expect(ran.deny).toMatch(/cancelled/)
})

test('a dismissed dialog fails closed with the client named', async ($, on) => {
  await start($, on, new Error('dismissed'))
  await $.command.run({ command: 'client', args: 'Acme' })
  const ran = await $.tool.call({ tool: UPDATE, id: 1 })
  expect(ran.deny).toBe('wyre-guard: Guard unavailable — write blocked (Acme).')
})

test('a redaction failure after the tool ran says so, and does not read as blocked', async ($, on) => {
  // A cyclic result cannot be walked: redact overflows the stack.
  await start($, on, 'Allow for Acme', () => {
    const cyclic: Record<string, unknown> = {}
    cyclic.self = cyclic
    return cyclic
  })
  await $.command.run({ command: 'client', args: 'Acme' })
  const ran = await $.tool.call({ tool: UPDATE, id: 1 })
  expect(ran.deny).toMatch(/ran; its result was withheld/)
  expect(ran.deny).not.toMatch(/blocked/)
})

test('a read needs no confirmation but its result is redacted', async ($, on) => {
  const asked = await start($, on, 'Cancel')
  const ran = await $.tool.call({ tool: SEARCH, query: 'x' })

  expect(asked).toHaveLength(0)
  expect(JSON.stringify(ran.result)).not.toMatch(/hunter2/)
})

test('the chip names the client, or says none is selected', async ($, on) => {
  await start($, on, 'Cancel')
  const view = { plugin: 'wyre-gateway', component: 'AbovePrompt', requestId: 'a', props: { hasSurvey: false } } as const
  const before = await $.ui.mount({ ...view, surface: 'terminal' })
  expect((await before.find({ type: 'Text', text: /none selected/ }))?.text).toMatch(/blocked/)
  await before.unmount()

  await $.command.run({ command: 'client', args: 'Acme' })
  const after = await $.ui.mount({ ...view, surface: 'terminal' })
  expect((await after.find({ type: 'Text', text: /Acme/ }))?.text).toMatch(/Client: Acme/)
  await after.unmount()
})
