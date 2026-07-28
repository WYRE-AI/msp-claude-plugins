# ConnectWise PSA Webhook Configuration

## Webhook Callback

ConnectWise can POST to your endpoint on entity changes:

```json
{
  "Action": "updated",
  "ID": 54321,
  "Type": "ticket",
  "MemberID": 123,
  "Callback": {
    "ID": 54321,
    "Type": "ticket"
  }
}
```

## Registering Callbacks

```http
POST /system/callbacks
Content-Type: application/json

{
  "url": "https://your-server.com/webhook",
  "objectId": 0,
  "type": "ticket",
  "level": "owner",
  "description": "Ticket updates webhook"
}
```
