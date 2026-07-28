# Autotask Time Entry Calculations and Example Implementations

## Rate Resolution

```javascript
function getBillingRate(timeEntry, context) {
  // Priority 1: Contract rate
  if (context.contractInfo?.hourlyRate) {
    return context.contractInfo.hourlyRate;
  }

  // Priority 2: Resource-specific rate
  if (context.billingRates?.[timeEntry.resourceID]) {
    return context.billingRates[timeEntry.resourceID];
  }

  // Priority 3: Role-based rate
  if (context.billingRates?.[`role_${timeEntry.roleID}`]) {
    return context.billingRates[`role_${timeEntry.roleID}`];
  }

  // Priority 4: Default rate
  return context.defaultRate || 0;
}
```

## Billing Amount Calculation

```javascript
function calculateBilling(timeEntry, context) {
  const hours = timeEntry.hoursWorked || 0;
  const isBillable = determineBillability(timeEntry, context);

  if (!isBillable) {
    return { isBillable: false, billingAmount: 0 };
  }

  const billingRate = getBillingRate(timeEntry, context);
  const billingAmount = hours * billingRate;

  // Calculate internal cost
  const costRate = getInternalCostRate(timeEntry, context);
  const costAmount = hours * costRate;

  // Calculate profit metrics
  const markup = costRate > 0 ? ((billingRate - costRate) / costRate) * 100 : 0;
  const profitAmount = billingAmount - costAmount;

  return {
    isBillable,
    billingRate,
    billingAmount: Math.round(billingAmount * 100) / 100,
    costRate,
    costAmount: Math.round(costAmount * 100) / 100,
    markup: Math.round(markup * 100) / 100,
    profitAmount: Math.round(profitAmount * 100) / 100
  };
}
```

## Billability Determination

Time entries are evaluated for billability based on:

| Condition | Billable? | Reason |
|-----------|-----------|--------|
| Explicit `isBillable: true` | Yes | Manually marked billable |
| Explicit `isBillable: false` | No | Manually marked non-billable |
| Billing code marked non-billable | No | Billing code override |
| Contract excludes T&M | No | Contract terms |
| Ticket or project work | Yes | Default for client work |
| Internal work (no ticket/project) | No | Default for internal work |

```javascript
function determineBillability(timeEntry, context) {
  // Explicit setting takes precedence
  if (timeEntry.isBillable !== undefined) {
    return timeEntry.isBillable;
  }

  // Check billing code
  if (timeEntry.billingCodeID && context.billingCodes) {
    const billingCode = context.billingCodes[timeEntry.billingCodeID];
    if (billingCode && !billingCode.isBillable) {
      return false;
    }
  }

  // Check contract terms
  if (context.contractInfo?.includesTimeAndMaterials === false) {
    return false;
  }

  // Default: billable for client work
  return !!(timeEntry.ticketID || timeEntry.projectID);
}
```

## Automatic Approval Check

```javascript
function requiresApproval(timeEntry, context) {
  // Billable time always requires approval
  if (timeEntry.isBillable) return true;

  // Overtime requires approval
  if (timeEntry.hoursWorked > 8) return true;

  // Weekend work requires approval
  if (timeEntry.dateWorked) {
    const dayOfWeek = new Date(timeEntry.dateWorked).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return true;
  }

  // Budget threshold exceeded
  if (context.projectBudget) {
    const newTotal = context.projectBudget.usedHours + timeEntry.hoursWorked;
    if (newTotal > context.projectBudget.totalHours * 0.9) return true;
  }

  return false;
}
```

## Project Budget Checks

```javascript
function validateProjectBudget(timeEntry, projectBudget) {
  const warnings = [];
  const violations = [];

  const newTotalHours = projectBudget.usedHours + timeEntry.hoursWorked;
  const percentUsed = (newTotalHours / projectBudget.totalHours) * 100;

  // Warning at 90% threshold
  if (percentUsed > 90 && percentUsed <= 100) {
    warnings.push(`Project at ${Math.round(percentUsed)}% of hour budget`);
  }

  // Violation when exceeding budget
  if (percentUsed > 100) {
    violations.push('Time entry exceeds project hour budget');
  }

  return { warnings, violations, percentUsed };
}
```

## Contract Limit Checks

```javascript
function validateContractLimits(timeEntry, contractLimits) {
  const warnings = [];
  const violations = [];

  // Check monthly limit
  const newMonthlyHours = contractLimits.usedMonthlyHours + timeEntry.hoursWorked;
  if (newMonthlyHours > contractLimits.monthlyHours) {
    violations.push('Exceeds contract monthly hour limit');
  } else if (newMonthlyHours > contractLimits.monthlyHours * 0.9) {
    warnings.push(`Contract at ${Math.round((newMonthlyHours / contractLimits.monthlyHours) * 100)}% of monthly limit`);
  }

  // Check total contract limit
  const newTotalHours = contractLimits.usedTotalHours + timeEntry.hoursWorked;
  if (newTotalHours > contractLimits.totalHours) {
    violations.push('Exceeds contract total hour limit');
  }

  return { warnings, violations };
}
```

## Utilization Rate Calculation

```javascript
function calculateUtilization(timeEntries) {
  let totalHours = 0;
  let billableHours = 0;

  timeEntries.forEach(entry => {
    const hours = entry.hoursWorked || 0;
    totalHours += hours;

    if (entry.isBillable) {
      billableHours += hours;
    }
  });

  const utilizationRate = totalHours > 0
    ? (billableHours / totalHours) * 100
    : 0;

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    billableHours: Math.round(billableHours * 100) / 100,
    nonBillableHours: Math.round((totalHours - billableHours) * 100) / 100,
    utilizationRate: Math.round(utilizationRate * 100) / 100
  };
}
```
