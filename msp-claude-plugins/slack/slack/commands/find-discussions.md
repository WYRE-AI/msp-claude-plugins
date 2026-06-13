---
name: find-discussions
description: Find Slack discussions about a topic using search operators, with context and permalinks
arguments:
  - name: query
    description: What to find (plain words; refined into Slack search operators)
    required: true
  - name: channel
    description: Optional channel to scope to (#ops or C0123)
    required: false
  - name: from
    description: Optional author to scope to (@user or U0123)
    required: false
---

# Slack Find Discussions

Locate where a topic was discussed across the workspace and return it with enough context to act on — for "where did we talk about X?" / "what did <person> say about Y?".

## Steps

1. Compose a Slack search query from the inputs: the `{{query}}` words plus `in:{{channel}}` and `from:{{from}}` operators when provided (and infer `after:`/`before:` if the query implies a timeframe).
2. `slack__search_messages(query='<composed>', count=20)`.
3. For the top hits, pull surrounding context: `slack__conversations_replies` if the hit is a thread parent/reply, else a small `slack__conversations_history` window around its `ts`.
4. Resolve author `U…` → names.

## Output

A ranked list of matches:

| when | channel | who | snippet | permalink |
|---|---|---|---|---|

For the most relevant 1-3, add a short context summary (what the thread concluded, any decision/owner). End with a one-line answer to the original question if the search supports one ("The fc5c500 promote was discussed in #ops on 06-13; outcome: shipped to staging, held for Aaron's GO — permalink"). Read-only; surfaces + summarizes, never posts.
