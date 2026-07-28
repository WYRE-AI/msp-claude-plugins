# Datto RMM Variable Field Reference

## Variable Object

```typescript
interface Variable {
  id: number;                   // Variable ID
  name: string;                 // Variable name
  value: string;                // Variable value
  description?: string;         // Optional description
  scope: VariableScope;         // "account" or "site"
  siteUid?: string;             // Site UID (for site variables)
  createdAt: number;            // Creation timestamp
  modifiedAt: number;           // Last modification
}

type VariableScope = 'account' | 'site';
```
