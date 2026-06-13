---
name: channel-digest
description: Summarize a Slack channel's recent activity into decisions, action items, and open questions
arguments:
  - name: channel
    description: Channel name (#ops) or id (C0123) to digest
    required: true
  - name: since
    description: How far back (e.g. "today", "24h", "2026-06-13") — defaults to today
    required: false
    default: "today"
---

# Slack Channel Digest

Turn a channel's recent noise into a scannable digest — for catching up on a busy channel without reading every message.

## Steps

1. Resolve `{{channel}}` to a `C…` id if a name was given (`slack__conversations_list`, match by `name`).
2. Read history from `{{since}}`: `slack__conversations_history(channel='C…', oldest='<ts for since>')`. For threads with replies, pull `slack__conversations_replies` to capture the resolution, not just the opener.
3. Resolve author `U…` ids → names (`slack__users_info`) so the digest names people, not ids.

## Output

A tight digest (not a transcript):
- **Decisions** — what was decided, by whom.
- **Action items** — task → owner (`@name`) → status (open / done if ✅-reacted).
- **Open questions** — unresolved threads needing an answer.
- **Notable** — incidents, escalations, or anything time-sensitive, with a `permalink`.

End with a one-line "headline" of the channel's day. Read-only — this command summarizes; it does not post the digest back unless the operator asks (and that post would be operator-confirmed).
