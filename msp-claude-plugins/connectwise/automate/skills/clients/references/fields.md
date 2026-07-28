# Client Field Reference

## Client Fields

```typescript
interface Client {
  // Identifiers
  ClientID: number;             // Primary key
  Name: string;                 // Display name
  ExternalID: string;           // External reference

  // Contact Information
  Address1: string;             // Street address line 1
  Address2: string;             // Street address line 2
  City: string;                 // City
  State: string;                // State/Province
  Zip: string;                  // Postal code
  Country: string;              // Country
  Phone: string;                // Primary phone
  Fax: string;                  // Fax number
  Website: string;              // Website URL

  // Primary Contact
  ContactName: string;          // Primary contact name
  ContactEmail: string;         // Primary contact email
  ContactPhone: string;         // Primary contact phone

  // Settings
  Comment: string;              // Client notes
  DefaultRouterAddress: string; // Default gateway
  DateAdded: string;            // Creation date

  // Counts
  ComputerCount: number;        // Total computers
  LocationCount: number;        // Total locations

  // Extra Data Fields
  ExtraData: {
    [key: string]: string;
  };
}
```

## Location Fields

```typescript
interface Location {
  // Identifiers
  LocationID: number;           // Primary key
  ClientID: number;             // Parent client
  Name: string;                 // Location name

  // Address
  Address1: string;
  Address2: string;
  City: string;
  State: string;
  Zip: string;
  Country: string;
  Phone: string;

  // Network
  Router: string;               // Default router IP
  NetworkProbe: number;         // Network probe computer ID

  // Settings
  Comment: string;              // Location notes
  DateAdded: string;            // Creation date

  // Counts
  ComputerCount: number;        // Computers at this location

  // Extra Data Fields
  ExtraData: {
    [key: string]: string;
  };
}
```

## Group Fields

```typescript
interface Group {
  GroupID: number;              // Primary key
  Name: string;                 // Group name
  FullPath: string;             // Full hierarchy path
  ParentID: number;             // Parent group ID
  ClientID: number;             // 0 for global groups
  Template: number;             // Template group ID
  AutoJoinScript: number;       // Auto-join script ID

  // Limits
  LimitToParent: number;        // Limit to parent group
  NetworkProbe: number;         // Network probe

  // Scripts
  Scripts: number[];            // Associated script IDs
  Monitors: number[];           // Associated monitor IDs
}
```
