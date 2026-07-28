# Documents Workflow Examples

## Full Workflow: Restructure a Document

```javascript
async function restructureDocument(docId, newSections) {
  // 1. List existing sections
  const existing = await fetch(
    `${baseUrl}/documents/${docId}/relationships/sections`,
    { headers: { 'x-api-key': apiKey } }
  ).then(r => r.json());

  // 2. Delete all existing sections
  for (const section of existing.data) {
    await fetch(
      `${baseUrl}/documents/${docId}/relationships/sections/${section.id}`,
      { method: 'DELETE', headers: { 'x-api-key': apiKey } }
    );
  }

  // 3. Create new sections in order
  for (const section of newSections) {
    await fetch(
      `${baseUrl}/documents/${docId}/relationships/sections`,
      {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/vnd.api+json' },
        body: JSON.stringify({
          data: {
            type: 'document-sections',
            attributes: {
              'section-type': section.type,  // 'Document::Heading' or 'Document::Text'
              content: section.content
            }
          }
        })
      }
    );
  }

  // 4. Publish to make changes visible (must use PATCH, not POST)
  await fetch(
    `${baseUrl}/documents/${docId}/publish`,
    { method: 'PATCH', headers: { 'x-api-key': apiKey } }
  );
}
```

## Create Comprehensive Runbook

```javascript
async function createRunbook(orgId, runbookData) {
  // Ensure folder exists
  const folder = await ensureDocumentFolder(orgId, runbookData.folderPath);

  // Build content with embedded resources
  let content = `
    <h1>${runbookData.title}</h1>
    <h2>Overview</h2>
    <p>${runbookData.overview}</p>
  `;

  // Add prerequisites section
  if (runbookData.prerequisites?.length) {
    content += `
      <h2>Prerequisites</h2>
      <ul>${runbookData.prerequisites.map(p => `<li>${p}</li>`).join('')}</ul>
    `;
  }

  // Add procedure steps
  if (runbookData.steps?.length) {
    content += `
      <h2>Procedure</h2>
      <ol>${runbookData.steps.map(s => `<li>${s}</li>`).join('')}</ol>
    `;
  }

  // Embed related passwords
  if (runbookData.passwordIds?.length) {
    content += `
      <h2>Required Credentials</h2>
      ${runbookData.passwordIds.map(id =>
        `<div data-embedded-password-id="${id}"></div>`
      ).join('')}
    `;
  }

  // Create the document
  const doc = await createDocument({
    'organization-id': orgId,
    name: runbookData.title,
    'document-folder-id': folder?.id,
    content: content
  });

  // Create related items
  for (const configId of runbookData.relatedConfigs || []) {
    await createRelatedItem({
      'resource-id': doc.id,
      'resource-type': 'Document',
      'destination-id': configId,
      'destination-type': 'Configuration'
    });
  }

  return doc;
}
```

## Document Search

```javascript
async function searchDocuments(orgId, query) {
  const docs = await fetchDocuments({
    filter: { 'organization-id': orgId }
  });

  const queryLower = query.toLowerCase();
  return docs.filter(doc =>
    doc.attributes.name.toLowerCase().includes(queryLower) ||
    doc.attributes.content?.toLowerCase().includes(queryLower)
  );
}
```

## Export Documentation

```javascript
async function exportOrgDocumentation(orgId) {
  const docs = await fetchDocuments({
    filter: { 'organization-id': orgId },
    include: 'document-folder'
  });

  return docs.map(doc => ({
    name: doc.attributes.name,
    folder: doc.included?.find(i =>
      i.type === 'document-folders' &&
      i.id === doc.relationships['document-folder']?.data?.id
    )?.attributes?.name || 'Root',
    content: doc.attributes.content,
    createdAt: doc.attributes['created-at'],
    updatedAt: doc.attributes['updated-at']
  }));
}
```

## Documentation Health Check

```javascript
async function documentationHealthCheck(orgId) {
  const docs = await fetchDocuments({
    filter: { 'organization-id': orgId }
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return {
    totalDocuments: docs.length,
    recentlyUpdated: docs.filter(d =>
      new Date(d.attributes['updated-at']) > thirtyDaysAgo
    ).length,
    stale: docs.filter(d => {
      const updated = new Date(d.attributes['updated-at']);
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      return updated < yearAgo;
    }).map(d => ({
      name: d.attributes.name,
      lastUpdated: d.attributes['updated-at']
    })),
    empty: docs.filter(d =>
      !d.attributes.content || d.attributes.content.trim().length < 50
    ).map(d => d.attributes.name)
  };
}
```

## Clone Document Template

```javascript
async function cloneDocumentToOrg(templateDocId, targetOrgId, newName) {
  // Get template document
  const template = await getDocument(templateDocId);

  // Create new document with template content
  return await createDocument({
    'organization-id': targetOrgId,
    name: newName || template.attributes.name,
    content: template.attributes.content
  });
}
```

## Document Templates

### Standard Documentation Structure

**Network Overview:**
```html
<h1>Network Overview</h1>

<h2>Network Topology</h2>
<p>[Network diagram embedded here]</p>

<h2>IP Addressing</h2>
<table>
  <tr><th>Subnet</th><th>VLAN</th><th>Purpose</th></tr>
  <tr><td>192.168.1.0/24</td><td>1</td><td>Servers</td></tr>
  <tr><td>192.168.10.0/24</td><td>10</td><td>Workstations</td></tr>
</table>

<h2>Core Infrastructure</h2>
<p>[Embedded configuration items]</p>

<h2>Firewall Rules Summary</h2>
<p>[Rule overview]</p>

<h2>Related Credentials</h2>
<p>[Embedded passwords]</p>
```

**Disaster Recovery:**
```html
<h1>Disaster Recovery Plan</h1>

<h2>Contact Information</h2>
<p>[Primary contacts embedded]</p>

<h2>Critical Systems</h2>
<ol>
  <li>Domain Controller</li>
  <li>Email Server</li>
  <li>File Server</li>
</ol>

<h2>Recovery Procedures</h2>
<h3>Complete Site Failure</h3>
<ol>
  <li>Activate backup site</li>
  <li>Restore from cloud backup</li>
  <li>Verify DNS failover</li>
</ol>

<h2>Required Credentials</h2>
<p>[Recovery passwords embedded]</p>

<h2>Vendor Contacts</h2>
<p>[Vendor contact information]</p>
```
