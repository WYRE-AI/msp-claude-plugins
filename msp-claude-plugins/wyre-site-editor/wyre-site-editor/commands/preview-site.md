---
description: Get the live preview link for a pending wyre.ai change
argument-hint: "[change request #]"
arguments: [pr]
---

# Preview a wyre.ai Change

Fetch the live preview URL for a pending site change.

## Arguments

- `pr` (optional) — the change request number. If omitted, use the change from this conversation, or list open `angela-content` change requests and ask which one.

## Steps

1. Follow the **WYRE Site Preview** skill: find the build for the change's branch, wait for it, extract the `*.pages.dev` preview URL, and deliver it as a clickable link.
