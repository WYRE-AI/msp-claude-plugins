# Passwords Workflow Examples

## Secure Password Creation

```javascript
async function createSecurePassword(orgId, data) {
  // Create or get appropriate folder
  const folder = await ensureFolder(orgId, data.folderPath);

  // Create password with category
  const password = await createPassword({
    'organization-id': orgId,
    name: data.name,
    username: data.username,
    password: data.password,
    url: data.url,
    'password-category-id': data.categoryId,
    'password-folder-id': folder?.id,
    notes: `<p>Created: ${new Date().toLocaleDateString()}</p>
            <p>Purpose: ${data.purpose}</p>`
  });

  // Log the creation (your audit system)
  await logPasswordAction({
    action: 'created',
    passwordId: password.id,
    passwordName: data.name,
    organizationId: orgId,
    timestamp: new Date()
  });

  return password;
}
```

## Password Rotation Workflow

```javascript
async function rotatePassword(passwordId, newPassword, reason) {
  // Get current password info
  const current = await getPassword(passwordId);

  // Update with new password
  const updated = await updatePassword(passwordId, {
    password: newPassword,
    notes: `${current.attributes.notes || ''}
            <p><strong>Rotated:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Reason:</strong> ${reason}</p>`
  });

  // Log rotation
  await logPasswordAction({
    action: 'rotated',
    passwordId: passwordId,
    passwordName: current.attributes.name,
    reason: reason,
    timestamp: new Date()
  });

  return updated;
}
```

## Password Search by Context

```javascript
async function findPasswordForServer(orgId, serverName) {
  // Search for passwords mentioning this server
  const passwords = await fetchPasswords({
    filter: { 'organization-id': orgId }
  });

  // Filter by server name in name or notes
  return passwords.filter(p =>
    p.attributes.name.toLowerCase().includes(serverName.toLowerCase()) ||
    p.attributes.notes?.toLowerCase().includes(serverName.toLowerCase())
  );
}
```

## Password Category Report

```javascript
async function generatePasswordReport(orgId) {
  const passwords = await fetchPasswords({
    filter: { 'organization-id': orgId },
    include: 'password-category,password-folder'
  });

  const byCategory = {};
  passwords.forEach(p => {
    const category = p.relationships['password-category']?.data?.id || 'Uncategorized';
    if (!byCategory[category]) byCategory[category] = [];
    byCategory[category].push({
      name: p.attributes.name,
      username: p.attributes.username,
      url: p.attributes.url,
      lastUpdated: p.attributes['password-updated-at']
    });
  });

  return byCategory;
}
```

## Find Stale Passwords

```javascript
async function findStalePasswords(orgId, daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const passwords = await fetchPasswords({
    filter: { 'organization-id': orgId }
  });

  return passwords
    .filter(p => {
      const updated = p.attributes['password-updated-at'];
      return !updated || new Date(updated) < cutoffDate;
    })
    .map(p => ({
      id: p.id,
      name: p.attributes.name,
      lastUpdated: p.attributes['password-updated-at'] || 'Never',
      daysSinceUpdate: p.attributes['password-updated-at']
        ? Math.floor((new Date() - new Date(p.attributes['password-updated-at'])) / (1000 * 60 * 60 * 24))
        : 'Unknown'
    }));
}
```
