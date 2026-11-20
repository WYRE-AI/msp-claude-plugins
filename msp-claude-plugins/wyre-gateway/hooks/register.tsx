// wyre-guard: a Claude Code mod for the Wyre MSP Gateway plugin.
//
// 1. Active-client chip above the prompt, set only by `/client <name>`.
// 2. Every write or destructive Conduit tool call asks first, naming the client
//    and the tool. No active client, Cancel, or a guard failure blocks the write.
// 3. Tool results from the gateway are scrubbed of credentials and PII.
//
// Claude Code only. Cowork and chat installs never load hooks/, so they keep
// the skills and the Conduit connector unchanged.
import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import { classify, impact, mismatches, redact, toolInput } from './guard'

const client = atom({ plugin: 'wyre-gateway', key: 'client' } as const, null)

const NO_CLIENT =
  'wyre-guard: no active client, write blocked. Ask the tech to run /client <name> first.'

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'client',
      description: 'Set the active client for Conduit writes (no name clears it)',
    })

    return next(e)
  })

  on('command.run', { command: 'client' }, async ($, e) => {
    // One line, bounded: the name is shown in dialogs and the status line.
    const name = e.args.replace(/\s+/g, ' ').trim().slice(0, 60)
    await update($, client, () => (name === '' ? null : name))
    $.ui.status(name === '' ? undefined : name)

    return {
      text:
        name === ''
          ? 'Active client cleared. Conduit writes are blocked until you pick one: /client <name>'
          : `Active client: ${name}. Conduit writes will ask for confirmation naming ${name}.`,
    }
  })

  on('tool.call', { tool: /^mcp__/ }, async ($, e, next) => {
    const call = classify(e.tool)
    if (call === null) return next(e)

    const active = await read($, client)
    const label = `${call.vendor}.${call.action}`

    if (call.kind !== 'read') {
      if (active === null) return { deny: NO_CLIENT }

      const input = toolInput(e)
      const other = mismatches(active, input)
      const warning =
        other.length > 0 ? `WARNING: input names ${other.join(', ')}, not ${active}. ` : ''
      const verb = call.kind === 'destructive' ? 'DESTRUCTIVE action' : 'write'
      const allow = `Allow for ${active}`
      const answer = await $.ui.ask(
        `${warning}${label}: ${impact(call, input)}. Allow ${verb} on ${active}?`,
        { options: [allow, 'Cancel'], header: active.slice(0, 12) },
      )

      if (answer !== allow) return { deny: `wyre-guard: ${label} on ${active} was cancelled.` }
    }

    $.ui.status(`${active ?? 'no client'} · ${label}`)
    const ran = await next(e)
    if (ran.deny !== undefined) return ran

    // The tool has already run: a redaction failure must not read as "blocked",
    // or the model retries and repeats the write.
    try {
      return {
        result: redact(ran.result),
        ...(ran.context && { context: ran.context.map(line => String(redact(line))) }),
        ...(ran.isError && { isError: true as const }),
      }
    } catch {
      return {
        deny: `wyre-guard: ${label} ran; its result was withheld by wyre-guard. Do not retry the call.`,
      }
    }
  }).catch(async ($, e) => {
    // Fail closed: a guard error or a dismissed dialog never lets the call
    // through, and the client stays named.
    const active = await read($, client).catch(() => null)
    const call = classify(e.tool)
    const what = call?.kind === 'read' ? 'call' : 'write'

    return {
      deny: `wyre-guard: Guard unavailable — ${what} blocked${active ? ` (${active})` : ''}.`,
    }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)

    const active = await read($, client)
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box>
        {active === null ? (
          <Text bold color="warning">
            Client: none selected. Conduit writes are blocked. Run /client {'<name>'}
          </Text>
        ) : (
          <Text bold>
            Client: {active}
            <Text dimColor> · writes ask first</Text>
          </Text>
        )}
      </Box>
    )
  })
}
