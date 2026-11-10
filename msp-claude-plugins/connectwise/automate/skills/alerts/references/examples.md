# Automate Alert Examples

## Critical alerts for one client

```text
1. cwautomate_clients_list                       -> find ClientID 42 ("Contoso")
2. cwautomate_alerts_list { client_id: 42, severity: 4, limit: 50, skip: 0 }
   -> repeat with skip: 50, 100, ... until a page returns fewer than 50 rows
3. cwautomate_alerts_get  { alert_id: 98123 }     -> full detail for the oldest one
4. cwautomate_computers_get { computer_id: <each distinct affected computer> }
   -> online state, last contact
```

Report: number of critical alerts, affected computers, oldest first-seen time, and whether the computers are online. Count and age only after every page is read; otherwise label the figures as a sample.

## Alert raised by a script

```text
1. cwautomate_alerts_get { alert_id: 98200 }             -> Source = Script, ComputerID 1234
2. cwautomate_scripts_history { computer_id: 1234 }       -> last runs, pass/fail, diagnostic message
3. Propose a re-run or a PSA ticket; do not re-run the script without operator approval
   (cwautomate_computers_run_script is admin-tier).
```

## Error response

```json
{
  "error": {
    "code": "NotFound",
    "message": "Alert not found"
  }
}
```

A 404 on `cwautomate_alerts_get` usually means the alert cleared between listing and reading. Re-list rather than retrying the same ID.
