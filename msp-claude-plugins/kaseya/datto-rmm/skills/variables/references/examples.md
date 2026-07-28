# Datto RMM Variable Workflow Examples

## Bulk Variable Setup

```javascript
async function setupSiteVariables(client, siteUid, variables) {
  const results = [];

  for (const [name, value] of Object.entries(variables)) {
    try {
      await client.request(`/api/v2/site/${siteUid}/variables`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          value,
          description: `Auto-created: ${new Date().toISOString()}`
        })
      });
      results.push({ name, success: true });
    } catch (error) {
      results.push({ name, success: false, error: error.message });
    }

    await sleep(100);
  }

  return results;
}
```

## Variable Audit Report

```javascript
async function auditVariables(client, siteUids) {
  const report = {
    account: [],
    sites: {}
  };

  // Get account variables
  const accountVars = await client.request('/api/v2/account/variables');
  report.account = accountVars.variables || [];

  // Get site variables
  for (const siteUid of siteUids) {
    try {
      const siteVars = await client.request(`/api/v2/site/${siteUid}/variables`);
      report.sites[siteUid] = siteVars.variables || [];
    } catch (error) {
      report.sites[siteUid] = { error: error.message };
    }

    await sleep(100);
  }

  return report;
}
```

## Find Variable Usage

```javascript
async function findVariableOverrides(client, variableName) {
  const accountVars = await client.request('/api/v2/account/variables');
  const accountVar = accountVars.variables?.find(v => v.name === variableName);

  const sitesResponse = await client.request('/api/v2/sites?max=250');
  const sites = sitesResponse.sites || [];

  const overrides = [];

  for (const site of sites) {
    try {
      const siteVars = await client.request(`/api/v2/site/${site.uid}/variables`);
      const siteVar = siteVars.variables?.find(v => v.name === variableName);

      if (siteVar) {
        overrides.push({
          siteName: site.name,
          siteUid: site.uid,
          value: siteVar.value,
          isOverride: accountVar ? true : false
        });
      }
    } catch (error) {
      // Skip sites with errors
    }

    await sleep(100);
  }

  return {
    variableName,
    accountValue: accountVar?.value || null,
    overrides,
    overrideCount: overrides.length
  };
}
```

## Variable Template Application

```javascript
async function applyVariableTemplate(client, siteUid, template) {
  /*
   * Template format:
   * {
   *   "BACKUP_PATH": "D:\\Backups\\{SITE_NAME}",
   *   "LOG_RETENTION_DAYS": "30",
   *   "ADMIN_EMAIL": "{inherit}"
   * }
   */

  const site = await client.request(`/api/v2/site/${siteUid}`);
  const results = [];

  for (const [name, valueTemplate] of Object.entries(template)) {
    // Skip inherited variables
    if (valueTemplate === '{inherit}') {
      results.push({ name, action: 'inherited' });
      continue;
    }

    // Replace placeholders
    const value = valueTemplate
      .replace('{SITE_NAME}', site.name)
      .replace('{SITE_UID}', siteUid);

    try {
      await client.request(`/api/v2/site/${siteUid}/variables`, {
        method: 'POST',
        body: JSON.stringify({ name, value })
      });
      results.push({ name, action: 'created', value });
    } catch (error) {
      if (error.message?.includes('already exists')) {
        // Update existing
        const existing = await findVariableByName(client, siteUid, name);
        if (existing) {
          await client.request(`/api/v2/site/${siteUid}/variable/${existing.id}`, {
            method: 'PUT',
            body: JSON.stringify({ value })
          });
          results.push({ name, action: 'updated', value });
        }
      } else {
        results.push({ name, action: 'error', error: error.message });
      }
    }

    await sleep(100);
  }

  return results;
}

async function findVariableByName(client, siteUid, name) {
  const response = await client.request(`/api/v2/site/${siteUid}/variables`);
  return response.variables?.find(v => v.name === name);
}
```

## Safe Variable Operations

Validates naming rules and creates-or-updates depending on whether the
variable already exists:

```javascript
async function safeSetVariable(client, scope, siteUid, name, value) {
  // Validate name
  if (name.startsWith('CS_') || name.startsWith('DATTO_')) {
    return { success: false, error: 'Reserved prefix' };
  }

  if (!/^[A-Z][A-Z0-9_]*$/.test(name)) {
    return { success: false, error: 'Invalid name format. Use SCREAMING_SNAKE_CASE' };
  }

  const baseUrl = scope === 'site'
    ? `/api/v2/site/${siteUid}/variables`
    : '/api/v2/account/variables';

  try {
    // Try to create
    await client.request(baseUrl, {
      method: 'POST',
      body: JSON.stringify({ name, value })
    });
    return { success: true, action: 'created' };
  } catch (error) {
    if (error.status === 400) {
      // Try to update
      const existing = scope === 'site'
        ? await findVariableByName(client, siteUid, name)
        : await findAccountVariableByName(client, name);

      if (existing) {
        const updateUrl = scope === 'site'
          ? `/api/v2/site/${siteUid}/variable/${existing.id}`
          : `/api/v2/account/variable/${existing.id}`;

        await client.request(updateUrl, {
          method: 'PUT',
          body: JSON.stringify({ value })
        });
        return { success: true, action: 'updated' };
      }
    }

    return { success: false, error: error.message };
  }
}

async function findAccountVariableByName(client, name) {
  const response = await client.request('/api/v2/account/variables');
  return response.variables?.find(v => v.name === name);
}
```
