import { expect, test } from 'claude-code/testing'

import { classify, mismatches, redact, redactText } from './guard'

const UPDATE = 'mcp__plugin_wyre-gateway_msp-mcp-gateway__autotask__autotask_update_ticket'
const SEARCH = 'mcp__plugin_wyre-gateway_msp-mcp-gateway__autotask__autotask_search_tickets'

async function start($: any, on: any, answer: string | Error) {
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
      result: { content: [{ type: 'text', text: '{"password":"hunter2","id":7}' }], isError: false },
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
  expect(classify('mcp__other__thing__update')).toBeNull()
  expect(classify('Bash')).toBeNull()
})

test('mismatches flags a client name that is not the active one', async () => {
  expect(mismatches('Acme', { companyName: 'Globex Corp', title: 'x' })).toEqual(['Globex Corp'])
  expect(mismatches('Acme', { companyName: 'Acme Inc' })).toEqual([])
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
