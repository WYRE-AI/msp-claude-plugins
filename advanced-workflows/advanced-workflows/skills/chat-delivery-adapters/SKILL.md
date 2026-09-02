---
name: chat-delivery-adapters
description: >
  The delivery-adapter contract every advanced-workflow skill uses to post
  its finished report somewhere a human will see it — Slack, an IT Glue
  document, or (blocked) Microsoft Teams.
when_to_use: >-
  Fetched by another advanced-workflow skill once it has a finished report
  to deliver, never used standalone. Use when: delivery adapter, Slack
  delivery, Teams delivery, IT Glue document delivery, report delivery.
---

## The contract

Every workflow's body produces a **report payload**; a delivery adapter
takes that payload and writes it somewhere a human will see it. Detect
which delivery target is connected the same way you detect a data-role
vendor: if more than one is connected, ask the human which to use; if
none is connected, tell the human what's needed — don't guess, don't fail
silently.

## Shipped adapters

### Slack summary
- **Connector**: Slack (first-party claude.ai connector, not Conduit-routed).
- **permitted_tools**: `slack_send_message`.
- **Write snippet**: post a one-paragraph summary to the destination channel.
- **Limits**: plain text, no rich layout — best for a short result.

### Slack canvas
- **Connector**: Slack.
- **permitted_tools**: `slack_create_canvas`, `slack_send_message`.
- **Write snippet**: create a canvas titled `<report name> — <date>` with
  the full report; post a summary message linking it.
- **Limits**: one canvas per run — each run leaves its own dated artefact
  rather than updating a single document in place.

### IT Glue document
- **Connector**: Conduit (`itglue` vendor connection).
- **permitted_tools**: `itglue__search_documents`, `itglue__create_document`,
  `itglue__update_document_section`, `itglue__publish_document`.
- **Write snippet**: search for an existing document named `<report name>`
  in the target IT Glue org; if found, update its section, else create it;
  then call `itglue__publish_document` — section edits are invisible to a
  human until the document is published.
- **Limits**: needs a target org ID baked in. Updates in place, so reruns
  converge on a single document rather than accumulating artefacts.
  Conduit prefixes every served tool name with `{vendor}__` at the gateway
  (`itglue__` here) regardless of what the vendor's own internal
  classification table calls it — the `itglue` plugin's `GOVERNANCE.md`
  documents bare names like `create_document` for its internal
  permission-tier lookup, but the servable/callable name always carries
  the `itglue__` prefix, same as every other vendor.

## Blocked

### Microsoft Teams
**Blocked — do not use.** Conduit's `m365` vendor Chat/Team Graph scopes
are a documented phase-2 addition and are not live yet (the vendor is
currently `hidden` pending `--org-mode` on its sidecar). If a workflow's
prerequisites mention Teams as a delivery target, mark it explicitly as
"coming soon, not yet available" rather than instructing an agent to
attempt it — there is no working send-to-Teams tool today.

## Documented but not shipped

- **Notion** — the first-party Notion connector (`notion-create-pages`,
  `notion-update-page`) or the Conduit `notion` vendor connection would
  both work; deferred only because Slack and IT Glue cover current need.
- **Hudu** — an IT-Glue-like documentation target; whether the Conduit
  `hudu` connection exposes a write tool is unverified. Confirm before
  treating it as an adapter.
- **SharePoint** — blocked. The available Microsoft 365 connector is
  search/read only.
- **Email** — deferred, no adapter built yet.

## Adding a new adapter

Pick a connector that can write to the target, confirm it exposes a write
tool (don't assume), and document: Connector, permitted_tools, write
snippet, limits. The workflow body producing the report never changes.
