# QuoteView Field Reference

`QuoteView` carries ~204 properties. Below are the ones worth naming in `includeFields`
or filtering on with `conditions`; the rest are layout, legacy and integration plumbing
plus 60+ empty `zCustomQuote{Bool,Date,Decimal,String}N` custom-field slots.

All properties are optional and sparsely populated. Dates are emitted as ISO `date-time`
but must be written date-only and bracketed inside `conditions`
(`createDate >= [2026-07-01]`).

## Identity

| Field | Type | Notes |
|---|---|---|
| `id` | string (GUID) | Addresses one version of one quote. Required by get/patch/delete/copy. |
| `name` | string | Quote title |
| `quoteNumber` | int | Human-facing number, shared across versions |
| `quoteVersion` | int | Version under that number |
| `accountName` | string | Customer account on the quote |

## Status and workflow

| Field | Type | Notes |
|---|---|---|
| `quoteStatus` | string | Tenant-configurable status text — enumerate from live data |
| `isSent` | bool | Delivered to the customer |
| `isAccepted` | bool | Customer accepted |
| `isLost` | bool | Marked lost |
| `isArchive` | bool | Archived; the usual alternative to deleting |
| `requiresApproval` | bool | Internal approval required |
| `approvalStatus` | string | Approval state |
| `approvedByUser` | string | Approver |

## Money

| Field | Type | Notes |
|---|---|---|
| `quoteTotal` | decimal | Grand total |
| `subtotal` | decimal | Before tax |
| `tax` | decimal | Tax amount |
| `grossMargin` | decimal | Margin across the quote |

## Dates

| Field | Type | Notes |
|---|---|---|
| `createDate` | date-time | Creation |
| `modifyDate` | date-time | Last change — the field to poll on, since CPQ has no webhooks |
| `expirationDate` | date-time | Proposal validity |
| `expectedCloseDate` | date-time | Forecast close |

## Integration linkage

| Field | Type | Notes |
|---|---|---|
| `crmOpportunityId` | string | Opportunity in the attached PSA/CRM. CPQ has no opportunity endpoints — resolve it there. |
| `crmOpGroup` | string | Opportunity grouping |
| `customer` | ReferenceLink `{ id, name, _info }` | Nested reference, same idiom as ConnectWise Manage |

## Order Porter (publishing state)

Readable, partly patchable, but there is no publish verb in the API — delivery happens in
the CPQ web app. Patching these changes what the customer sees.

| Field | Notes |
|---|---|
| `orderPorterTemplate` | Template used for the published proposal |
| `orderPorterPasscode` | Access passcode |
| `orderPorterSignedDate` | When the customer signed |
| `orderPorterIsUploaded` | Whether the proposal has been published |
| `isOrderPorterApproved` | Approval state on the published proposal |

## Custom fields

`zCustomQuoteBool1..N`, `zCustomQuoteDate1..N`, `zCustomQuoteDecimal1..N`,
`zCustomQuoteString1..N` — 60+ slots whose meaning is defined per tenant in the CPQ
admin UI. They are filterable in `conditions` like any other field, but their labels are
not exposed over the API; ask the tenant what each slot holds.
