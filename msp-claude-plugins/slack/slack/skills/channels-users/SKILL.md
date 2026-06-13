---
name: "Slack Channels & Users"
description: "Use this skill to resolve and inspect Slack channels and users: listing channels, resolving a #channel name to its id, reading channel membership/topic/purpose, and looking up users by id or email to get their name, handle, and profile. The directory/lookup layer that every other Slack operation depends on (you post and react by id, not by name)."
when_to_use: "When resolving a channel name to an id, listing channels, looking up a user by email/id, or reading channel membership/metadata"
triggers:
  - slack channel
  - list channels
  - resolve channel
  - slack user
  - user lookup
  - find slack user
  - who is
  - channel members
  - slack workspace directory
---

# Slack Channels & Users

The directory layer. Slack APIs operate on **ids** (`C…` channels, `U…` users), but humans speak in `#names` and emails — this skill bridges that. Gateway-prefixed tools (`slack__*`); confirm against the live `tools/list`.

## Channels

```
slack__conversations_list(types='public_channel,private_channel', limit=200)
# Each: { id: 'C…', name, is_private, is_archived, num_members, topic, purpose }
slack__conversations_info(channel='C0123')   # full metadata for one channel
```

Use `conversations_list` to **resolve a `#name` → `C…` id** (filter the list by `name`) before posting/reading — never guess an id from a name. Note `is_archived` (read-only) and `is_private` (your token must be a member to see it).

## Users

```
slack__users_list(limit=200)                 # workspace directory
slack__users_info(user='U0123')              # one user: name, real_name, profile.email, tz, is_admin, deleted
slack__users_lookupByEmail(email='a@co.com') # email → user (great for cross-referencing your CRM/PSA)
```

`users_lookupByEmail` is the high-value one for MSP ops: you often have an email (from a ticket/CRM) and need the Slack identity to mention them or find their messages. `deleted: true` = deactivated account.

## Membership

```
slack__conversations_members(channel='C0123')   # the U… ids in a channel
```

Cross-reference with `users_info` to turn member ids into names — e.g. "who's in #client-acme" for an access review.

## Workflow: "mention the right person in the right channel from an email"

1. `slack__users_lookupByEmail(email='alice@client.com')` → `U…` + display name.
2. `slack__conversations_list(...)` → resolve the target `#channel` → `C…`.
3. Hand both to the messaging skill: `chat_postMessage(channel='C…', text='<@U…> …')`.

## Safety
- Resolve names→ids here first; downstream writes (post/react) use the id.
- Reading a private channel or full user profiles requires the corresponding token scopes — a scope error means the operator's Slack app didn't enable it.
