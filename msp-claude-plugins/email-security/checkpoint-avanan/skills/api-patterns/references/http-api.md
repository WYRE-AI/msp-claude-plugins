# Harmony Email Smart API — raw HTTP reference

Only needed when calling the Smart API directly. Through the `hec_*` tools
all of this is handled for you; it is documented because the failure modes
surface in tool errors.

## Authentication

```http
POST https://cloudinfra-gw.portal.checkpoint.com/auth/external
Content-Type: application/json

{ "clientId": "<client id>", "accessKey": "<client secret>" }
```

The field is `accessKey`, not `clientSecret` or `client_secret`.

```json
{ "success": true, "data": { "token": "eyJhbGciOi…", "expiresIn": 1800 } }
```

A response with `success: false` is an auth failure even when the HTTP status
is 200 — check the flag, not just the status. `expiresIn` is seconds and
defaults to 1800 when absent.

The auth call **always** goes to the EU host above, whatever region the tenant
lives in. Region selection applies only to data calls.

## Regional hosts

The JWT's `region` claim selects the host for every data request:

| Claim | Data host |
|---|---|
| `eu` | `https://cloudinfra-gw.portal.checkpoint.com` |
| `us` | `https://cloudinfra-gw-us.portal.checkpoint.com` |
| `au` | `https://cloudinfra-gw.ap.portal.checkpoint.com` |
| `in` | `https://cloudinfra-gw.in.portal.checkpoint.com` |

The EU host is also the default when the claim is missing or unrecognised.
Note the inconsistent naming — `-us` is a hostname suffix but `ap` and `in`
are subdomains; constructing these by pattern rather than lookup produces a
host that does not resolve.

## Required headers

```http
Authorization: Bearer <token>
x-av-req-id: <fresh UUID per request>
Accept: application/json
Content-Type: application/json
```

`x-av-req-id` is mandatory on every data request and must be unique per
request. Reusing one across calls is a request-tracing problem at the vendor
end, not a client-side nicety.

## Scopes

```http
GET <data host>/app/hec-api/v1.0/scopes
```

Returns `farm:customer` strings, e.g. `mt-prod-cp-eu-1:examplecorp` (EU) or
`mt-prod-cp-1:examplecorp` (US).

- One scope: omit `scopes` from requests; the API infers it.
- Several scopes: include a `scopes` array inside `requestData` so the API
  can route the call.
- A response of `[""]` means the key has no HEC farm association. Every data
  call will return empty. This needs Checkpoint support, not a client change.

If the detected region returns no scopes, probing the other regional hosts
with the same token is the diagnostic — a token whose `region` claim
disagrees with where the tenant actually lives is a known provisioning state.

## Endpoint map

All data paths are prefixed `/app/hec-api`.

| Operation | Method + path |
|---|---|
| Query events | `POST /v1.0/event/query` |
| Get event | `GET /v1.0/event/{eventId}` |
| Search entities | `POST /v1.0/search/query` |
| Get entity | `GET /v1.0/search/entity/{entityId}` |
| Event action | `POST /v1.0/action/event` |
| Entity action | `POST /v1.0/action/entity` |
| Task status | `GET /v1.0/task/{taskId}` |
| List exceptions | `GET /v1.0/exceptions/{whitelist\|blacklist}` |
| Add exception | `POST /v1.0/exceptions/{whitelist\|blacklist}` |
| Update exception | `PUT /v1.0/exceptions/{whitelist\|blacklist}/{excId}` |
| Delete exception | `POST /v1.0/exceptions/{whitelist\|blacklist}/delete/{excId}` |

Deleting an exception is a **POST to a `/delete/` path**, not an HTTP DELETE.

Both action endpoints take the operation as a field in the body —
`eventActionName` or `entityActionName`, valued `quarantine` or `restore` —
rather than encoding it in the path.

## Request body envelope

Every POST and PUT wraps its payload in `requestData`:

```json
{ "requestData": { "eventIds": ["…"], "eventActionName": "quarantine" } }
```

## Responses and errors

```json
{
  "responseEnvelope": {
    "requestId": "…",
    "responseCode": 0,
    "responseText": "…",
    "recordsNumber": 237,
    "scrollId": "…"
  },
  "responseData": [ … ]
}
```

Errors are reported as `responseEnvelope.responseText` alongside a non-2xx
status. There is no `error.code` object and no documented machine-readable
code catalogue.

A 401 invalidates the cached token; re-authenticate before retrying, and
consider region and scope before assuming the credential itself is wrong.

Timeouts in use: 30s for auth and data calls, 10s for the scopes lookup.
