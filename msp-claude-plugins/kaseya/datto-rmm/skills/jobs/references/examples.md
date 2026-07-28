# Datto RMM Job Workflow Examples

## Find Component by Name

```javascript
async function findComponentByName(client, name) {
  const response = await client.request('/api/v2/components?max=250');
  const components = response.components || [];

  // Exact match
  const exact = components.find(c =>
    c.name.toLowerCase() === name.toLowerCase()
  );
  if (exact) return { found: true, component: exact };

  // Partial match
  const matches = components.filter(c =>
    c.name.toLowerCase().includes(name.toLowerCase())
  );

  if (matches.length === 0) {
    return { found: false, suggestions: [] };
  }

  if (matches.length === 1) {
    return { found: true, component: matches[0] };
  }

  return {
    found: false,
    ambiguous: true,
    suggestions: matches.map(c => ({
      name: c.name,
      uid: c.uid,
      category: c.category
    }))
  };
}
```

## Batch Job Execution

```javascript
async function runJobOnMultipleDevices(client, deviceUids, componentUid, variables = {}) {
  const jobs = [];

  for (const deviceUid of deviceUids) {
    try {
      const response = await client.request(
        `/api/v2/device/${deviceUid}/quickjob`,
        {
          method: 'POST',
          body: JSON.stringify({ componentUid, variables })
        }
      );
      jobs.push({
        deviceUid,
        jobUid: response.jobUid,
        status: 'queued'
      });
    } catch (error) {
      jobs.push({
        deviceUid,
        error: error.message,
        status: 'failed'
      });
    }

    // Respect rate limits
    await sleep(100);
  }

  return jobs;
}
```

## Monitor Running Jobs

```javascript
async function monitorJobs(client, jobUids, options = {}) {
  const { onUpdate, timeoutMs = 600000, pollIntervalMs = 10000 } = options;
  const startTime = Date.now();
  const results = new Map();

  // Initialize tracking
  jobUids.forEach(uid => results.set(uid, { status: 'unknown' }));

  while (true) {
    let allComplete = true;

    for (const jobUid of jobUids) {
      const current = results.get(jobUid);
      if (['completed', 'failed', 'timeout'].includes(current.status)) {
        continue;
      }

      try {
        const job = await client.request(`/api/v2/job/${jobUid}`);
        results.set(jobUid, job);

        if (!['completed', 'failed', 'timeout'].includes(job.status)) {
          allComplete = false;
        }

        if (onUpdate) {
          onUpdate(jobUid, job);
        }
      } catch (error) {
        results.set(jobUid, { status: 'error', error: error.message });
      }
    }

    if (allComplete) break;

    if (Date.now() - startTime > timeoutMs) {
      break;
    }

    await sleep(pollIntervalMs);
  }

  return Array.from(results.entries()).map(([jobUid, data]) => ({
    jobUid,
    ...data
  }));
}
```

## Job Result Summary

```javascript
function summarizeJobResult(job) {
  const duration = job.completedAt && job.startedAt
    ? Math.round((job.completedAt - job.startedAt) / 1000)
    : null;

  return {
    jobUid: job.jobUid,
    device: job.hostname,
    component: job.componentName,
    status: job.status,
    exitCode: job.exitCode,
    duration: duration ? `${duration}s` : 'N/A',
    success: job.status === 'completed' && job.exitCode === 0,
    output: job.stdout?.substring(0, 500) || '',
    errors: job.stderr?.substring(0, 500) || ''
  };
}
```

## Safe Job Execution

Verifies the device is online and all required component variables are
present before creating the job:

```javascript
async function safeRunJob(client, deviceUid, componentUid, variables = {}) {
  // Verify device is online
  const device = await client.request(`/api/v2/device/${deviceUid}`);

  if (device.status !== 'online') {
    return {
      success: false,
      error: `Device is ${device.status}`,
      lastSeen: new Date(device.lastSeen).toISOString()
    };
  }

  // Verify component exists and get required variables
  const component = await client.request(`/api/v2/component/${componentUid}`);

  // Check required variables
  const missingVars = component.variables
    .filter(v => v.required && !variables[v.name])
    .map(v => v.name);

  if (missingVars.length > 0) {
    return {
      success: false,
      error: `Missing required variables: ${missingVars.join(', ')}`
    };
  }

  // Run the job
  try {
    const response = await client.request(
      `/api/v2/device/${deviceUid}/quickjob`,
      {
        method: 'POST',
        body: JSON.stringify({ componentUid, variables })
      }
    );
    return { success: true, jobUid: response.jobUid };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```
