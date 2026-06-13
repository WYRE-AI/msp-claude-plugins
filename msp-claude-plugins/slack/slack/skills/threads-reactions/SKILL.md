---
name: "Slack Threads & Reactions"
description: "Use this skill for Slack thread and reaction operations: reading a full thread by its parent message, replying in-thread, and adding/reading emoji reactions (acknowledgements, status signals, lightweight workflow state). The conversation-continuity + lightweight-signal layer that keeps replies threaded and status legible."
when_to_use: "When reading or replying within a Slack thread, or adding/reading emoji reactions as acknowledgements or status signals"
triggers:
  - slack thread
  - thread replies
  - reply in thread
  - slack reaction
  - add reaction
  - emoji reaction
  - acknowledge in slack
  - react to message
---

# Slack Threads & Reactions

Keep conversations threaded and status legible. Gateway-prefixed tools (`slack__*`); confirm against the live `tools/list`.

## Threads

```
slack__conversations_replies(channel='C0123', ts='1718280000.001200')
# Returns the parent + all replies in order. ts is the PARENT message's ts (thread_ts).
```

A thread is identified by its parent `ts`. To read a full discussion, get the parent `ts` (from history or search, messaging skill) and pull `conversations_replies`. To reply into it, post with `thread_ts=<parent ts>` (messaging skill's `chat_postMessage`). Threading replies under the originating message is the default for any follow-up — it keeps channels scannable and the discussion in one place.

## Reactions

```
slack__reactions_add(channel='C0123', timestamp='1718280000.001200', name='white_check_mark')
slack__reactions_get(channel='C0123', timestamp='1718280000.001200')   # who reacted with what
```

`name` is the emoji shortname without colons (`white_check_mark`, `eyes`, `heavy_check_mark`, `x`). Reactions are the lightest-weight signal in Slack and MSP teams lean on them as workflow state:
- ✅ `white_check_mark` — done / acknowledged / approved
- 👀 `eyes` — seen / picking this up
- ❌ `x` — rejected / won't do

`reactions_get` reads that state back — e.g. "has anyone ack'd the maintenance notice?" = check for ✅ reactors on the announcement.

## Workflow: "acknowledge a request and pick it up"

1. Find the request message `ts` (messaging skill: history/search).
2. `slack__reactions_add(channel, timestamp=<ts>, name='eyes')` — signal you're on it.
3. Do the work; reply with the outcome in-thread (`chat_postMessage(thread_ts=<ts>, ...)`).
4. `slack__reactions_add(channel, timestamp=<ts>, name='white_check_mark')` — mark done.

## Safety
- Reactions and thread replies are visible to the channel — they're low-stakes but real signals; don't react/post on behalf of the operator's identity without their intent being clear.
- React/reply by the message `ts` (resolve it first); a wrong `ts` reacts on the wrong message.
