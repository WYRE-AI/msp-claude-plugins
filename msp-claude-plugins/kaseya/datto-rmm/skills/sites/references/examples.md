# Datto RMM Site Workflow Examples

## Site Health Overview

```javascript
async function getSiteHealth(client, siteUid) {
  const [site, devices, alerts] = await Promise.all([
    client.request(`/api/v2/site/${siteUid}`),
    client.request(`/api/v2/site/${siteUid}/devices?max=250`),
    client.request(`/api/v2/site/${siteUid}/alerts/open`)
  ]);

  const deviceList = devices.devices || [];
  const alertList = alerts.alerts || [];

  // Device status breakdown
  const deviceStatus = {
    online: deviceList.filter(d => d.status === 'online').length,
    offline: deviceList.filter(d => d.status === 'offline').length,
    total: deviceList.length
  };

  // Alert priority breakdown
  const alertsByPriority = {
    Critical: alertList.filter(a => a.priority === 'Critical').length,
    High: alertList.filter(a => a.priority === 'High').length,
    Moderate: alertList.filter(a => a.priority === 'Moderate').length,
    Low: alertList.filter(a => a.priority === 'Low').length
  };

  // Calculate health score
  const healthScore = calculateSiteHealthScore(deviceStatus, alertsByPriority);

  return {
    site: {
      name: site.name,
      uid: site.uid
    },
    devices: deviceStatus,
    alerts: {
      total: alertList.length,
      byPriority: alertsByPriority
    },
    healthScore,
    status: healthScore >= 80 ? 'healthy' : healthScore >= 50 ? 'warning' : 'critical'
  };
}

function calculateSiteHealthScore(devices, alerts) {
  let score = 100;

  // Deduct for offline devices
  const offlinePercent = (devices.offline / devices.total) * 100;
  score -= offlinePercent * 0.5;

  // Deduct for alerts
  score -= alerts.Critical * 15;
  score -= alerts.High * 5;
  score -= alerts.Moderate * 2;
  score -= alerts.Low * 0.5;

  return Math.max(0, Math.round(score));
}
```

## Multi-Site Summary

```javascript
async function getAllSitesSummary(client) {
  const response = await client.request('/api/v2/sites?max=250');
  const sites = response.sites || [];

  return sites.map(site => ({
    name: site.name,
    uid: site.uid,
    devices: site.devicesCount,
    openAlerts: site.openAlertsCount,
    status: site.openAlertsCount === 0 ? 'healthy' :
            site.openAlertsCount <= 5 ? 'warning' : 'critical'
  })).sort((a, b) => b.openAlerts - a.openAlerts);
}
```

## Site Onboarding Checklist

```javascript
async function validateSiteSetup(client, siteUid) {
  const site = await client.request(`/api/v2/site/${siteUid}`);
  const devices = await client.request(`/api/v2/site/${siteUid}/devices?max=250`);
  const variables = await client.request(`/api/v2/site/${siteUid}/variables`);

  const checks = [];

  // Check site has description
  checks.push({
    item: 'Site description',
    status: site.description ? 'pass' : 'fail',
    message: site.description || 'No description set'
  });

  // Check site has devices
  checks.push({
    item: 'Devices enrolled',
    status: devices.devices?.length > 0 ? 'pass' : 'fail',
    message: `${devices.devices?.length || 0} devices`
  });

  // Check critical variables are set
  const requiredVars = ['BACKUP_PATH', 'ADMIN_EMAIL'];
  requiredVars.forEach(varName => {
    const v = variables.variables?.find(v => v.name === varName);
    checks.push({
      item: `Variable: ${varName}`,
      status: v?.value ? 'pass' : 'fail',
      message: v?.value || 'Not set'
    });
  });

  return {
    siteUid,
    siteName: site.name,
    checks,
    passed: checks.filter(c => c.status === 'pass').length,
    total: checks.length
  };
}
```

## Error Handling Pattern

```javascript
async function safeSiteOperation(client, operation, siteUid, data) {
  try {
    switch (operation) {
      case 'get':
        return await client.request(`/api/v2/site/${siteUid}`);

      case 'update':
        return await client.request(`/api/v2/site/${siteUid}`, {
          method: 'POST',
          body: JSON.stringify(data)
        });

      case 'delete':
        // Check for devices first
        const devices = await client.request(`/api/v2/site/${siteUid}/devices`);
        if (devices.devices?.length > 0) {
          throw new Error(`Cannot delete site with ${devices.devices.length} devices`);
        }
        return await client.request(`/api/v2/site/${siteUid}`, {
          method: 'DELETE'
        });
    }
  } catch (error) {
    if (error.status === 404) {
      return { error: 'Site not found', siteUid };
    }
    throw error;
  }
}
```
