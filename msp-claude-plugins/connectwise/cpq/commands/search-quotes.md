---
description: Search ConnectWise CPQ quotes by account, status, or date range
argument-hint: "[account] [since] [status] [include_archived]"
arguments: [account, since, status, include_archived]
---

# Search ConnectWise CPQ Quotes

## Arguments

- `account` (optional) — Customer account name, matched with `contains`
- `since` (optional) — Only quotes created on or after this date, `YYYY-MM-DD`
- `status` (optional) — `quoteStatus` value (tenant-configurable; confirm against live data)
- `include_archived` (optional) — Include archived quotes; defaults to excluding them

## Prerequisites
- ConnectWise CPQ credentials configured (access key + API key pair, API user, CPQ 2022.2+)

## Steps

1. **Build the `conditions` string** from the arguments, minding CPQ's literal formats —
   strings double-quoted, booleans `True`/`False`, dates bracketed and date-only:
   - `account` → `accountName contains "$account"`
   - `since` → `createDate >= [$since]`
   - `status` → `quoteStatus = "$status"`
   - unless `include_archived` → `isArchive = False`

   Join with ` AND `. With no arguments at all, `cpq_search_quotes` asks for a
   created-since date and otherwise defaults to the last 90 days.

2. **Search** with `cpq_search_quotes`, passing `conditions` and a tight field list:
   `includeFields=id,name,quoteNumber,quoteVersion,quoteStatus,accountName,quoteTotal,createDate,expirationDate`
   and `pageSize=100`.

3. **Page** by incrementing `page` until a page returns fewer than `pageSize` rows —
   the response carries no total count.

4. **Display** quote number/version, name, account, status, total, and created date.
   Sort by created date descending.

## Examples

### Recent quotes for one account
```
/search-quotes account="Acme Corp" since=2026-01-01
```

### Everything open this quarter
```
/search-quotes since=2026-07-01 status="Open"
```

## Notes

- Results cover the latest version of each quote. Pass `showAllVersions=true` to
  `cpq_search_quotes` directly when you need superseded versions.
- Take the GUID `id` from the results before calling anything that patches or deletes —
  a quote number alone will not do.

## Error Handling

| Error | Resolution |
|-------|------------|
| Empty results | Check `conditions` formatting — unquoted string, lowercase `true`, or a date carrying a time component all match nothing |
| 401 | Verify the access key, the key pair, and that the key owner is flagged as an API user |
| 500 | Often a missing credential rather than a CPQ fault — confirm all three parts reached the server |

## Related Commands

- `/get-quote` — Full detail for one quote
- `/create-quote` — Create a quote by copying a template
