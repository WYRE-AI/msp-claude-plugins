# Datto RMM Site Field Reference

## Site Object

```typescript
interface Site {
  // Identifiers
  uid: string;                    // Unique site ID
  siteId: number;                 // Legacy numeric ID
  name: string;                   // Site display name
  description?: string;           // Site description

  // Configuration
  onDemand: boolean;              // On-demand site (no scheduled tasks)
  splapiEnabled: boolean;         // Service Provider Level API enabled
  proxySettings?: ProxySettings;  // HTTP proxy configuration

  // Counts
  devicesCount: number;           // Number of devices
  openAlertsCount: number;        // Active alerts

  // Timestamps (Unix milliseconds)
  createdAt: number;              // When site was created
  modifiedAt: number;             // Last modification

  // Settings
  settings: SiteSettings;
}

interface ProxySettings {
  enabled: boolean;
  host: string;
  port: number;
  username?: string;
  bypassList?: string[];          // Hosts to bypass proxy
}

interface SiteSettings {
  autoPatchApproval: boolean;
  patchWindow: PatchWindow;
  notificationEmail?: string;
  timezone: string;
}

interface PatchWindow {
  dayOfWeek: number;              // 0=Sunday, 6=Saturday
  startHour: number;              // 0-23
  durationHours: number;
}
```
