# ConnectWise PSA Time Entry API Reference

## Create Time Entry (Start/End)

```http
POST /time/entries
Content-Type: application/json

{
  "chargeToId": 54321,
  "chargeToType": "ServiceTicket",
  "member": {"id": 123},
  "timeStart": "2024-02-15T09:00:00Z",
  "timeEnd": "2024-02-15T10:30:00Z",
  "workType": {"id": 1},
  "workRole": {"id": 2},
  "billableOption": "Billable",
  "notes": "Diagnosed email delivery issue. Identified blocked sender.",
  "addToDetailDescriptionFlag": true
}
```

## Create Time Entry (Actual Hours)

```http
POST /time/entries
Content-Type: application/json

{
  "chargeToId": 54321,
  "chargeToType": "ServiceTicket",
  "member": {"id": 123},
  "timeStart": "2024-02-15T09:00:00Z",
  "actualHours": 1.5,
  "workType": {"id": 1},
  "workRole": {"id": 2},
  "billableOption": "Billable",
  "notes": "Configured DNS records and tested mail flow."
}
```

## Create Time Entry Against Charge Code

```http
POST /time/entries
Content-Type: application/json

{
  "chargeToId": 10,
  "chargeToType": "ChargeCode",
  "company": {"id": 12345},
  "member": {"id": 123},
  "timeStart": "2024-02-15T08:00:00Z",
  "actualHours": 0.5,
  "workType": {"id": 3},
  "billableOption": "DoNotBill",
  "notes": "Weekly team meeting"
}
```

## Get Time Entry

```http
GET /time/entries/{id}
```

## Update Time Entry

```http
PATCH /time/entries/{id}
Content-Type: application/json

{
  "notes": "Updated notes with additional details.",
  "actualHours": 2.0
}
```

## Delete Time Entry

```http
DELETE /time/entries/{id}
```

**Note:** Cannot delete billed time entries.

## Search Time Entries

```http
GET /time/entries?conditions=member/id=123 and timeStart>=[2024-02-01]
```

## Time Sheets

### Time Sheet Status Values

| Status | Description |
|--------|-------------|
| Open | Time sheet open for editing |
| Submitted | Submitted for approval |
| Approved | Approved by manager |
| Rejected | Returned for correction |

### Get Time Sheets

```http
GET /time/sheets?conditions=member/id=123 and year=2024 and period=7
```

### Submit Time Sheet

```http
PATCH /time/sheets/{id}
Content-Type: application/json

{
  "status": "Submitted"
}
```

## Approval

### Time Entry Approval Status Values

| Status | Description |
|--------|-------------|
| Open | Pending approval |
| Approved | Approved for billing |
| Rejected | Rejected, needs correction |
| Billed | Already invoiced |

### Approve Time Entry

```http
PATCH /time/entries/{id}
Content-Type: application/json

{
  "status": "Approved"
}
```

### Reject Time Entry

```http
PATCH /time/entries/{id}
Content-Type: application/json

{
  "status": "Rejected",
  "internalNotes": "Please add more detail about work performed."
}
```

### Bulk Approval

```http
POST /time/entries/bulk
Content-Type: application/json

{
  "ids": [1001, 1002, 1003],
  "operation": {
    "status": "Approved"
  }
}
```
