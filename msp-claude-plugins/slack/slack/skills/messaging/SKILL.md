---
name: "Slack Messaging & Search"
description: "Use this skill to read and write Slack messages: posting a message to a channel or thread, reading recent channel history, and searching across the workspace for messages by keyword, user, channel, or date. The read-and-find half of Slack ops — what was said, where, by whom — plus posting updates back."
when_to_use: "When posting a Slack message or thread reply, reading a channel's recent history, or searching the workspace for past messages/discussions"
triggers:
  - slack message
  - post to slack
  - slack post message
  - search slack
  - find in slack
  - slack history
  - channel history
  - slack search
  - what was said in
---

# Slack Messaging & Search

Read, search, and post Slack messages through the WYRE MCP Gateway. Gateway-prefixed tool names (`slack__*`); the hosted Slack MCP server (`mcp.slack.com/mcp`) serves the authoritative list — confirm exact names against a live `tools/list`. The connection authorizes a set of user-token scopes (search, chat:write, *:history); a tool failing with a scope error means that scope wasn't enabled on the operator's Slack app.

## Read channel history

```
slack__conversations_history(channel='C0123', limit=50, oldest='<ts>')
# Returns messages: { user, text, ts, thread_ts?, reply_count?, reactions? }
```

`ts` is Slack's message id/timestamp (e.g. `1718280000.001200`) — you need it to reply in-thread, react, or permalink. `thread_ts` present means the message is a thread reply.

## Search the workspace

```
slack__search_messages(query='deploy failed in:#ops from:@alice after:2026-06-01', count=20)
```

Slack search operators are the power here — compose them into `query`:
- `in:#channel` / `in:@dm` — scope to a place
- `from:@user` — by author
- `before:` / `after:` / `on:` `YYYY-MM-DD` — by date
- `"exact phrase"`, `has:link`, `has:reaction`

Use search for "find where we discussed X" / "what did <user> say about Y last week" — it spans channels the token can see (search scopes). Each hit returns the message + a `permalink`.

## Post a message

```
slack__chat_postMessage(channel='C0123', text='Deploy fc5c500 is live on staging ✅')
# Reply in a thread by passing the parent's ts:
slack__chat_postMessage(channel='C0123', thread_ts='1718280000.001200', text='...')
```

**Posting is an outward-facing write — it notifies real people.** Confirm the target channel + the message text with the operator before posting, especially to broad channels. Prefer posting to a thread (`thread_ts`) when continuing an existing discussion to avoid channel noise. Use Slack mrkdwn in `text` (`*bold*`, `_italic_`, `` `code` ``, `<url|label>`, `<@U…>` to mention).

## Workflow: "find the incident thread and post the resolution"

1. `slack__search_messages(query='<incident keyword> in:#incidents')` → the originating message + its `permalink`/`ts`.
2. `slack__conversations_history` (or `conversations_replies`, threads skill) around that `ts` for context.
3. Draft the resolution note; confirm channel + text with the operator.
4. `slack__chat_postMessage(channel=..., thread_ts=<incident ts>, text=...)` — reply in-thread so it threads under the incident.

## Safety
- `chat_postMessage` notifies people — operator-confirm channel + text; thread replies over new channel posts when continuing a discussion.
- Resolve channel **names** to ids first (channels skill) — post by id, not by a guessed `#name`.
