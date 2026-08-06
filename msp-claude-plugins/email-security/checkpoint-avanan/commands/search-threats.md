---
description: Sweep security events in Checkpoint Harmony Email by type, state, severity and date range
argument-hint: "[type] [state] [severity] [saas] [start-date] [end-date] [event-id]"
arguments: [type, state, severity, saas, start-date, end-date, event-id]
---

# Search Threats

Sweep security detections in Checkpoint Harmony Email & Collaboration (Avanan) with `hec_query_events`.

A detection here is an **event** — the engine's verdict, carrying type, state, severity and confidence. It is not the message. To reach the message, take the event's `entityId` and use `/check-threat` or `/search-quarantine`.

## Prerequisites

- A working Harmony Email connection (see [README](../README.md) for configuration)
- The connection must resolve to at least one `farm:customer` scope — a key with no farm association authenticates fine and returns zero records on every call
- Read access to `hec_query_events`; see [GOVERNANCE.md](../GOVERNANCE.md) for the permission tiers

## Steps

1. **Build the filter**
   - Every filter is an array except the dates. There is no required argument and **no `limit`**.
   - Decide `eventStates` deliberately — omitting it does not return everything (see below).

2. **Call `hec_query_events`**
   ```json
   {
     "eventTypes": ["phishing"],
     "eventStates": ["new", "detected"],
     "severities": ["Critical", "High"],
     "startDate": "2026-07-28T00:00:00Z",
     "saas": ["office365_emails"]
   }
   ```

3. **Page to exhaustion**
   - Re-call with the returned `scrollId` until no cursor comes back.
   - Do not report a count before the scroll is exhausted.

4. **Rank and format**
   - Sort by `severity`, then `confidenceIndicator`.
   - Report the window and the states queried alongside the results.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| type | string[] | No | all | `eventTypes` — see the type table |
| state | string[] | No | **new, detected** | `eventStates` — see the state table |
| severity | string[] | No | all | `severities` — free-form strings, not enum-validated |
| saas | string[] | No | all | `saas` platform filter — see the platform table |
| start-date | string | No | - | ISO 8601 |
| end-date | string | No | now | ISO 8601 |
| event-id | string[] | No | - | `eventIds` — fetch specific events directly |

There is no free-text `query`, no `sender`/`recipient` filter and no `limit` on this tool. Sender and recipient matching lives on the entity surface — use `/search-quarantine`. Result size is controlled by paging, not by a cap.

## Examples

### Open Phishing Detections This Week

```
/search-threats --type phishing --start-date "2026-07-28T00:00:00Z"
```

### Critical and High, Including Already-Handled Events

```
/search-threats --severity Critical,High --state new,detected,remediated,dismissed --start-date "2026-07-01T00:00:00Z"
```

### Confirmed Malware Only

```
/search-threats --type malware --start-date "2026-07-01T00:00:00Z"
```

### Data-Loss Detections on SharePoint

```
/search-threats --type dlp --saas office365_sharepoint --start-date "2026-07-01T00:00:00Z"
```

### Fetch Known Events by ID

```
/search-threats --event-id evt-abc123,evt-def456
```

## Output

```
14 events — window 2026-07-28T00:00:00Z to now, states: new, detected
(scroll exhausted, 2 pages)

+------------+---------------------+-----------+-----------+------------------+------------+
| Event ID   | Type                | State     | Severity  | SaaS             | Confidence |
+------------+---------------------+-----------+-----------+------------------+------------+
| evt-a1b2c3 | phishing            | new       | Critical  | office365_emails | High       |
| evt-d4e5f6 | malware             | detected  | High      | office365_emails | High       |
| evt-g7h8i9 | suspicious malware  | new       | High      | google_mail      | Medium     |
| evt-j1k2l3 | dlp                 | new       | Medium    | office365_onedri | Low        |
| evt-m4n5o6 | malicious_url_click | detected  | High      | office365_emails | High       |
+------------+---------------------+-----------+-----------+------------------+------------+

Summary:
- Critical: 1 | High: 3 | Medium: 1
- Types: phishing (1), malware (1), suspicious malware (1), dlp (1), malicious_url_click (1)

Note: severity is potential impact; confidenceIndicator is the engine's certainty.
A high-severity, low-confidence event is the shape of a false positive.

Quick actions:
- Full detail and the message behind it: /check-threat <event-id>
- Scope the campaign: /search-quarantine --sender <sender> --start-date <date>
```

## Filter Reference

### Event Types

| Value | What fired |
|-------|------------|
| `phishing` | Credential harvesting, impersonation, deceptive links |
| `malware` | Confirmed malicious attachment or link |
| `suspicious malware` | Probable malware, below the confirmed threshold |
| `dlp` | Content matched a data-loss rule |
| `anomaly` | Behavioural outlier — unusual sender, volume or pattern |
| `shadow_it` | Unsanctioned SaaS application activity |
| `malicious_url` | A malicious link was present |
| `malicious_url_click` | A user actually clicked one |
| `alert` | Generic platform alert |

`suspicious malware` contains a space and no underscore, unlike every other multi-word value. Sending `suspicious_malware` filters to nothing.

**There is no `bec`, `ato`, `ransomware`, `spear_phishing`, `spam` or `zero-day` type.** Business email compromise and targeted phishing arrive as `phishing`; ransomware arrives as `malware`. Make those distinctions from the event's `description` and `confidenceIndicator`, not from the type filter.

### Event States

| Value | Meaning |
|-------|---------|
| `new` | Open, untouched |
| `detected` | Open, engine has classified it |
| `pending` | An action is in flight |
| `remediated` | An action completed |
| `dismissed` | A human closed it |
| `exception` | An exception rule closed it |

**Omitting `eventStates` does not return everything** — it defaults to `new`/`detected`. This is the most common cause of an event "disappearing" between two queries: it moved to `remediated`. A sweep that means to include handled events must name the states explicitly.

There is no `false-positive` state. No tool transitions an event into `dismissed` or `exception` either — those are console actions, or the downstream effect of an exception rule.

### SaaS Platforms

`email`, `office365_emails`, `office365_onedrive`, `office365_sharepoint`, `google_mail`, `google_drive`, `slack`, `ms_teams`, `box2`, `dropbox2`.

Box and Dropbox carry a `2` suffix. `email` and `office365_emails` are **not** synonyms — a tenant may report under either depending on how it was onboarded, so a mail-only sweep naming just one can miss the other.

### Severities

Free-form strings such as `Critical`, `High`, `Medium`, `Low`. **This field is not enum-validated:** any string is accepted, and an unrecognised or mis-cased one silently matches nothing rather than erroring. Confirm casing against a value the API has actually returned before trusting an empty result.

## Error Handling

### No Results

```
No events found matching criteria.

An empty result is not an all-clear. Check, in order:
- eventStates — did you mean to include remediated/dismissed/exception?
- severity casing — the field is not validated; a wrong case matches nothing
- saas — "email" and "office365_emails" are not synonyms
- the window — the date range maxes at 90 days and retention bounds it further
- region and farm scope — a key with no farm association returns zero records, not an error
```

### Truncated Result Set

```
Warning: a single query returns at most 10,000 results.

"Every threat this year" returns a confident partial answer with no error.
Split the window and page each segment to exhaustion.
```

## Related Commands

- `/check-threat` - Full detail for one event, and the message behind it
- `/search-quarantine` - Find messages by sender, subject or quarantine state
- `/release-quarantine` - Deliver a held message back to its recipients
