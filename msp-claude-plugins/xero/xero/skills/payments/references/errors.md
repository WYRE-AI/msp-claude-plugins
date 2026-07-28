# Xero Payments Error Reference

| Code | Message | Cause | Resolution |
|------|---------|-------|------------|
| 400 | Payment amount exceeds the amount outstanding | Overpayment attempted | Reduce the payment to the invoice `AmountDue` or less |
| 400 | Account is not valid for payments | Non-bank account used | Use an account of type `BANK` |
| 400 | Invoice is not awaiting payment | Wrong invoice status | Authorize the invoice first (must be `AUTHORISED`) |
| 400 | Payment date is before invoice date | Payment pre-dates the invoice | Set the payment date on or after the invoice date |
| 401 | Unauthorized | Access token expired or invalid | Refresh the access token |
| 404 | Invoice not found | Bad identifier | Verify the `InvoiceID` |
