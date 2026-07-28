# Autotask Ticket Calculations and Example Implementations

## SLA Calculation Example

```javascript
// Calculate SLA due dates
function calculateSLADueDate(ticket, contractSLA) {
  const now = new Date();
  const priority = ticket.priority || 2; // Default to MEDIUM

  // Use contract SLA if available, otherwise defaults
  const responseHours = contractSLA?.responseTimeHours || SLA_DEFAULTS[priority].response;
  const resolutionHours = contractSLA?.resolutionTimeHours || SLA_DEFAULTS[priority].resolution;

  return {
    responseBy: addHours(now, responseHours),
    resolveBy: addHours(now, resolutionHours),
    businessHoursOnly: true
  };
}
```


## Automatic Escalation Triggers

```javascript
function checkEscalationRules(ticket) {
  const reasons = [];
  const now = new Date();

  // SLA Violation
  if (ticket.dueDateTime && new Date(ticket.dueDateTime) < now) {
    const hoursOverdue = Math.floor(
      (now - new Date(ticket.dueDateTime)) / (1000 * 60 * 60)
    );
    reasons.push(`SLA violated by ${hoursOverdue} hours`);
    escalationLevel = Math.min(3, Math.floor(hoursOverdue / 4) + 1);
  }

  // Stale Waiting Status
  if (ticket.status === 6 && ticket.lastActivityDate) {
    const daysSinceActivity = Math.floor(
      (now - new Date(ticket.lastActivityDate)) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceActivity > 7) {
      reasons.push(`No customer response for ${daysSinceActivity} days`);
    }
  }

  // Critical Without Assignment
  if (ticket.priority === 4 && !ticket.assignedResourceID) {
    reasons.push('Critical ticket without assigned resource');
  }

  return { requiresEscalation: reasons.length > 0, reasons };
}
```


## Key Performance Indicators

```javascript
function calculateTicketMetrics(tickets) {
  const completedTickets = tickets.filter(t => t.status === 5);

  // Average Resolution Time (hours)
  const avgResolutionTime = completedTickets.reduce((sum, t) => {
    if (t.createDate && t.completedDate) {
      return sum + (new Date(t.completedDate) - new Date(t.createDate));
    }
    return sum;
  }, 0) / completedTickets.length / (1000 * 60 * 60);

  // SLA Compliance Rate
  const ticketsWithSLA = tickets.filter(t => t.dueDateTime);
  const slaCompliant = ticketsWithSLA.filter(t => {
    if (t.status === 5) {
      return new Date(t.completedDate) <= new Date(t.dueDateTime);
    }
    return new Date() <= new Date(t.dueDateTime);
  }).length;
  const slaCompliance = (slaCompliant / ticketsWithSLA.length) * 100;

  return {
    totalTickets: tickets.length,
    averageResolutionTime: avgResolutionTime.toFixed(2),
    slaCompliance: slaCompliance.toFixed(1) + '%',
    escalatedCount: tickets.filter(t => t.status === 14).length
  };
}
```

## Status Distribution Report

```json
{
  "statusDistribution": {
    "NEW": 12,
    "IN_PROGRESS": 45,
    "WAITING_CUSTOMER": 8,
    "WAITING_MATERIALS": 3,
    "ESCALATED": 2,
    "COMPLETE": 156
  },
  "priorityDistribution": {
    "CRITICAL": 1,
    "HIGH": 15,
    "MEDIUM": 38,
    "LOW": 22
  }
}
```


## Status Transition Validation

```javascript
function validateStatusTransition(currentStatus, newStatus, ticket) {
  const requiredFields = [];
  const warnings = [];

  switch (newStatus) {
    case 5: // COMPLETE
      if (!ticket.resolution) requiredFields.push('resolution');
      if (currentStatus === 1) warnings.push('Completing without In Progress step');
      break;

    case 2: // IN_PROGRESS
      if (!ticket.assignedResourceID) warnings.push('No resource assigned');
      break;

    case 14: // ESCALATED
      if (!ticket.escalationReason) requiredFields.push('escalationReason');
      break;
  }

  return {
    canTransition: requiredFields.length === 0,
    requiredFields,
    warnings
  };
}
```

