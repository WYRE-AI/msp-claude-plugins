# Warmly plugin — governance and safety model

Unofficial. Community-built plugin for the Warmly API. Not affiliated with,
endorsed by, or sponsored by the vendor.

## What it connects as

> **Conduit does not broker this vendor. Read this before anything else in
> this document.** `warmly` has no entry in Conduit's
> `src/credentials/vendor-config.ts` — not a hidden one, not a disabled one,
> none at all. The connector is wired only in the older
> `wyre-technology/mcp-gateway` registry (`warmly:` in that repo's own
> `src/credentials/vendor-config.ts`), a separate system this marketplace has
> otherwise moved off. There is no `warmly` slug to reach at
> `https://conduit.wyre.ai/v1/mcp`, so a connect attempt there 404s.
>
> Nothing is silently misrouted: this plugin ships no `.mcp.json`, so it wires
> no client anywhere. But **everything below about gateway-brokered identity,
> audit, and revocation describes the posture this plugin will have once a
> `warmly` entry is ported to Conduit — not what happens today.** The skills
> and the tool reference are accurate about Warmly's own API now, and are why
> the plugin is still listed.
>
> *Editor's note: when `warmly` gains a Conduit `vendor-config.ts` entry,
> delete this blockquote and the matching note in `README.md`. The rest of
> this document is written to be true from that point on.*

This plugin does not hold credentials. It reaches Warmly through the WYRE
Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the Warmly organization the
operator is authorised for.

- No Warmly OAuth client secret or access token is stored on the technician's
  machine, in this repo, or in the model's context. Warmly delegates
  authentication to a WorkOS AuthKit tenant; the gateway completes that flow.
- The org's Warmly credential is stored once at the gateway, so replacing it
  is one edit rather than a change on every technician's machine. There is no
  rotate action, though — you re-submit the connect form, which overwrites
  the stored credential in place, and nothing tracks its age or prompts you.

- Every call carries operator identity, so the gateway audit log answers "who
  pulled this visitor list" — which matters, because that list is third-party
  personal data (see Data handling).
- Removing someone from the organisation clears their per-vendor grants and
  revokes their gateway refresh tokens at once; a user deactivated in your
  identity provider is refused on their very next request. A user only
  removed from the org keeps an already-issued access token for up to an
  hour, but it reaches only a personal Warmly connection made with their own
  key — never the org's. See `wyre-gateway/GOVERNANCE.md`.

## Tool permission tiers

**This plugin is read-only.** Warmly exposes three tools and none of them
changes vendor state.

> **Not classified in Conduit — every tool in the table below requires tier
> `admin` today.** Conduit derives a tool's tier from `VENDOR_TOOL_CONFIG`
> (`src/proxy/result-cache.ts`) and fails closed:
> `const requiredTier: PermissionTier = classified ?? 'admin';`
> (`src/access/access-enforcement.ts:63`). `warmly` has no entry there, so
> the grouping below carries no enforcement meaning at present — and no
> grant of any tier reaches this vendor today, because Conduit has no
> `warmly` slug at all (see *What it connects as*). Once it is brokered, the
> missing classification bites harder on a read-only plugin than on most: a
> `read` grant would admit nothing, so the only way to use this plugin would
> be an `admin` grant, and the recommendation below to hand these tools to
> unattended agents could not be followed at a lower tier. The grouping
> becomes what Conduit actually
> enforces once the vendor is classified, and classifying it is a privilege
> *reduction*, not an expansion. For the live list of unclassified vendors
> see `wyre-gateway/GOVERNANCE.md`, *Fail-closed, and the vendors Conduit has
> not classified* — it is stated once there because it moves.
>
> *Editor's note: when `warmly` gains a `VENDOR_TOOL_CONFIG` entry, delete
> this blockquote and nothing else. No other part of this document depends on
> it.*

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Warmly state. Safe for autonomous agents. | `list_warm_visitors`, `list_warm_accounts`, `get_credits_remaining` |
| **Write** | — | None. |
| **Destructive** | — | None. |

Retrieval is free: Warmly bills on identification, not on reading identified
visitors back, so these calls do not consume the credit balance. That removes
the usual reason to rate-limit an agent, and it means the only control worth
applying here is on the data coming back rather than on the calls going out.

## Recommended agent policy

Read tools may be granted to autonomous and scheduled agents. Morning triage
lists, ICP filtering, and CRM-intersection sweeps are the intended unattended
uses, and there is nothing to approve per call because nothing changes state or
reaches a customer.

The two things worth building into an agent anyway:

- **Check the balance before depending on volume.** Call
  `get_credits_remaining` before a workflow that assumes identifications will
  keep arriving. Exhaustion is silent (see sharp edges).
- **Decide the retention question before the first run.** The governance
  problem with this plugin is what happens to visitor data after the model sees
  it, not what the model does to Warmly.

## What it cannot reach

- Only the Warmly organization the operator's gateway identity maps to. Warmly
  is explicitly multi-organization; the OAuth token selects one.
- No filesystem, no shell, no other vendor's data.
- No write surface at all — no tagging, no suppression, no list management, no
  CRM sync.
- **No outreach.** Warmly identifies; it does not contact. Nothing in this
  plugin can email, call, or message an identified visitor. Any sequence that
  follows is initiated in your CRM or sequencer, under that tool's own
  governance.
- No live stream. Queries are point-in-time over a recent window.

## Data handling

Responses pass through the gateway into model context for the session and are
not persisted by this plugin. The privacy posture here deserves specific
attention:

- `list_warm_visitors` returns **contact-level PII about people who did not
  give it to you** — name, job title, employer, and where available a work
  email address, derived from IP reverse lookup and third-party data overlays.
  The visitor did not fill in a form. They browsed a website.
- `list_warm_accounts` returns company-level identification and engagement
  depth — less identifying, but still a record that a named organization was
  researching you.
- `get_credits_remaining` returns commercial account data (this month's
  remaining identification balance) and nothing about any person.

This is third-party-sourced personal data about identified individuals, which
puts it squarely inside GDPR, CCPA, and equivalent regimes. Before piping
visitor output into any system that retains it — a CRM, a spreadsheet, a
prospecting list, an artifact — confirm your organization has a lawful basis to
process it and a route to honour a deletion request. "The vendor gave it to us"
is not one. Restrict `list_warm_visitors` specifically if that question is
unsettled; `list_warm_accounts` carries far less exposure for the same triage
value.

## Known sharp edges

- **Credit exhaustion is silent, and looks like quiet traffic.** When the
  monthly identification budget runs out, new visitors simply stop being
  identified. Previously identified ones stay visible, so `list_warm_visitors`
  keeps returning results and an agent reasonably concludes the site went quiet.
  It did not — you stopped paying to see who was on it. Only
  `get_credits_remaining` distinguishes the two.
- **Identification is probabilistic.** IP-to-company matching attributes
  co-working spaces, VPN exits, and residential ISPs to the wrong organization
  routinely. An agent that treats a visitor row as fact will brief a
  salesperson to call a company that never visited.
- **Intent is not interest.** A visit may be a competitor, a job applicant, a
  vendor, or your own staff off-network. Warmly reports traffic; it does not
  report buying intent, and the skill's own "What Warmly does NOT tell you"
  section is worth reading before acting on a list.
- **The session is stateful.** The server issues an `Mcp-Session-Id` on
  `initialize` that must accompany subsequent requests. A dropped session
  returns errors that read like an auth failure but are not — reconnecting, not
  re-credentialing, is the fix.
