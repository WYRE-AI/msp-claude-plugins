# SuperOps.ai Client Field Reference

These tables list the fields on the `Client`, `ClientSite` and `ClientUser`
types in `schema/superops.graphql`
([superops-mcp](https://github.com/WYRE-AI/superops-mcp)).

## Client

| Field | Type | Description |
|-------|------|-------------|
| `accountId` | ID | Client ID |
| `name` | String | Client name. Required on create |
| `stage` | String | Lifecycle stage, tenant-configured |
| `status` | String | Sub-state of `stage`, tenant-configured |
| `emailDomains` | [String] | Email domains that identify the client |
| `accountManager` | JSON | Assigned technician |
| `primaryContact` / `secondaryContact` | JSON | Contacts (client users) |
| `hqSite` | JSON | Headquarters site |
| `technicianGroups` | JSON | Assigned technician groups |
| `customFields(fields: [String])` | JSON | Custom field values |
| `createdTime` / `updatedTime` | String | Record timestamps |

A client has no `website`, `phone`, `industry`, `employeeCount`,
`annualRevenue` or address fields. Addresses live on sites.

### Stock stage and status values

| Stage | Statuses |
|-------|----------|
| Active | Paid, Unpaid |
| Prospect | New, Negotiation, Won, Lost |
| Inactive | (none) |

To read the tenant's own values, query `getAllFields(input: "CLIENT")`.

## Site (`ClientSite`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | ID | Site ID |
| `name` | String | Site name |
| `hq` | Boolean | Whether this is the HQ site |
| `timezoneCode` | String | IANA time zone, such as `America/New_York` |
| `working24x7` | Boolean | Open all hours |
| `businessHour` | [BusinessHour] | Hours when not 24x7 |
| `line1`, `line2`, `line3`, `city`, `stateCode`, `postalCode`, `countryCode` | String | Address |
| `contactNumber` | String | Phone |
| `client` | JSON | Owning client |

## Contact (`ClientUser`)

| Field | Type | Description |
|-------|------|-------------|
| `userId` | ID | Contact ID. Used as `requester: { userId }` on tickets |
| `firstName` / `lastName` / `name` | String | Name |
| `email` | String | Login email. Unique across technicians and client users |
| `contactNumber` | String | Phone |
| `role` | JSON | Requester role |
| `reportingManager` | JSON | Manager |
| `customFields(fields: [String])` | JSON | Custom field values |
| `createdTime` / `updatedTime` | String | Record timestamps |
