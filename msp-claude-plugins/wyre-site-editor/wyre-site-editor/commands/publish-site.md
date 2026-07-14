---
description: Publish a previewed wyre.ai change to the live site (asks for explicit confirmation)
argument-hint: "[change request #]"
arguments: [pr]
---

# Publish a wyre.ai Change

Put a previewed change live on wyre.ai — with all publishing gates enforced.

## Arguments

- `pr` (optional) — the change request number. If omitted, use the change from this conversation.

## Steps

1. Follow the **WYRE Site Publish** skill exactly: green checks, preview seen, explicit post-preview confirmation, squash-merge, then confirm the live deploy. Never skip a gate, even if the user pre-confirms in the command invocation itself — the confirmation must come after they have seen the preview.
