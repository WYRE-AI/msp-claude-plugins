export interface McpServer {
  id: string;
  name: string;
  npmPackage: string;
  description: string;
  category: 'psa' | 'rmm' | 'documentation' | 'security' | 'accounting' | 'network' | 'sales';
  repoUrl: string;
  companionPluginId?: string;
  envVars: EnvVar[];
  /**
   * Step-by-step instructions for acquiring the API credentials this MCP server needs.
   * Surfaced on the per-vendor page between Authentication (the env-var table) and Architecture.
   * Optional during rollout — vendors without populated content render the existing template unchanged.
   * Vendors flagged pendingVerification: true display a "Portal verification pending — contact support if blocked" note.
   */
  credentialAcquisition?: CredentialAcquisition;
  domains: Domain[];
  architecture: string;
  installCommand: string;
  dockerAvailable: boolean;
  mcpbAvailable: boolean;
  rateLimit?: string;
}

export interface EnvVar {
  name: string;
  required: boolean;
  description: string;
}

export interface CredentialAcquisition {
  /** Optional direct URL to the vendor portal where credentials are created. */
  portalUrl?: string;
  /** Prerequisites — what level of vendor-portal access is required before completing the steps. */
  prerequisites?: string[];
  /** Step-by-step navigation in the vendor portal to create the credentials. */
  steps?: CredentialStep[];
  /** Required scopes/permissions to set during credential creation, if applicable. */
  requiredScopes?: string[];
  /** Notes on credential format expectations (length, prefix, expiration). */
  formatNotes?: string;
  /** Optional notes on credential rotation/expiry behavior. */
  rotationNotes?: string;
  /**
   * When true, the rendered page shows a "Portal verification pending — contact support if blocked" note
   * above the steps. Use for vendors where steps couldn't be confidently authored without portal-access testing.
   */
  pendingVerification?: boolean;
}

export interface CredentialStep {
  /** Action verb-first description of the step. */
  action: string;
  /** Optional sub-bullets for clarifying detail. */
  notes?: string[];
}

export interface Domain {
  name: string;
  description: string;
  tools: Tool[];
}

export interface Tool {
  name: string;
  description: string;
}

export const mcpServers: McpServer[] = [
  {
    id: 'connectwise-automate',
    name: 'ConnectWise Automate MCP',
    npmPackage: '@wyre-technology/connectwise-automate-mcp',
    description: 'MCP server for ConnectWise Automate RMM with decision tree architecture for managing computers, clients, alerts, and scripts.',
    category: 'rmm',
    repoUrl: 'https://github.com/wyre-technology/connectwise-automate-mcp',
    companionPluginId: 'connectwise-automate',
    envVars: [
      { name: 'CW_AUTOMATE_SERVER_URL', required: true, description: 'Your ConnectWise Automate server URL' },
      { name: 'CW_AUTOMATE_CLIENT_ID', required: true, description: 'Integrator Client ID' },
      { name: 'CW_AUTOMATE_USERNAME', required: true, description: 'Integrator username or user credentials' },
      { name: 'CW_AUTOMATE_PASSWORD', required: true, description: 'Integrator password or user password' },
      { name: 'CW_AUTOMATE_2FA_CODE', required: false, description: 'Two-factor authentication code (if required)' }
    ],
    credentialAcquisition: { portalUrl: 'https://docs.connectwise.com/ConnectWise_Automate_Documentation', pendingVerification: true, prerequisites: ['ConnectWise Automate server access (cloud or self-hosted)', 'Integrator Client ID from the ConnectWise Developer Network'], steps: [{ action: 'Obtain CW_AUTOMATE_CLIENT_ID by registering an integration at developer.connectwise.com/ClientID.' }, { action: 'Set CW_AUTOMATE_SERVER_URL to your ConnectWise Automate server URL.' }, { action: 'Create or obtain an integrator user account and set CW_AUTOMATE_USERNAME and CW_AUTOMATE_PASSWORD.' }, { action: 'If 2FA is required, set CW_AUTOMATE_2FA_CODE.' }] },
    domains: [
      {
        name: 'Computers',
        description: 'Manage endpoints, search by criteria, reboot, and run scripts.',
        tools: [
          { name: 'List computers', description: 'List computers with filtering options' },
          { name: 'Get computer details', description: 'Get detailed computer information' },
          { name: 'Search computers', description: 'Search computers by name or criteria' },
          { name: 'Reboot computer', description: 'Reboot a computer remotely' },
          { name: 'Run script', description: 'Execute scripts on computers' }
        ]
      },
      {
        name: 'Clients',
        description: 'Manage customer/client records.',
        tools: [
          { name: 'List clients', description: 'List all clients' },
          { name: 'Get client details', description: 'Get client information' },
          { name: 'Create client', description: 'Create a new client' },
          { name: 'Update client', description: 'Update existing client' }
        ]
      },
      {
        name: 'Alerts',
        description: 'Monitor and manage alerts from devices.',
        tools: [
          { name: 'List alerts', description: 'List alerts with filtering' },
          { name: 'Get alert details', description: 'Get detailed alert information' },
          { name: 'Acknowledge alert', description: 'Acknowledge an alert' }
        ]
      },
      {
        name: 'Scripts',
        description: 'Manage and execute automation scripts.',
        tools: [
          { name: 'List scripts', description: 'List available scripts' },
          { name: 'Get script details', description: 'Get script information' },
          { name: 'Execute script', description: 'Run a script on a computer' }
        ]
      }
    ],
    architecture: 'Decision tree with lazy-loaded domain handlers. Navigate to a domain first, then use domain-specific tools.',
    installCommand: 'npx @wyre-technology/connectwise-automate-mcp',
    dockerAvailable: true,
    mcpbAvailable: true,
    rateLimit: '60 requests per minute'
  },
  {
    id: 'ninjaone',
    name: 'NinjaOne MCP',
    npmPackage: '@wyre-technology/ninjaone-mcp',
    description: 'MCP server for NinjaOne (NinjaRMM) with hierarchical tool loading for managing devices, organizations, alerts, and tickets.',
    category: 'rmm',
    repoUrl: 'https://github.com/wyre-technology/ninjaone-mcp',
    companionPluginId: 'ninjaone-rmm',
    envVars: [
      { name: 'NINJAONE_CLIENT_ID', required: true, description: 'OAuth 2.0 Client ID' },
      { name: 'NINJAONE_CLIENT_SECRET', required: true, description: 'OAuth 2.0 Client Secret' },
      { name: 'NINJAONE_REGION', required: false, description: 'Region: us (default), eu, or oc' }
    ],
    credentialAcquisition: {
      portalUrl: 'https://www.ninjaone.com/',
      prerequisites: [
        'NinjaOne account with Administrator role',
        'Knowledge of your NinjaOne deployment region (us | eu | oc — visible in your NinjaOne portal URL)',
        'Awareness that NinjaOne uses OAuth 2.0; you create an "API Application" record to issue tokens'
      ],
      steps: [
        { action: 'Sign in to your NinjaOne console as an Administrator.' },
        { action: 'Navigate to Administration → Apps → API.' },
        { action: 'Click "Add" to create a new API Application.' },
        { action: 'Fill in:', notes: ['Application Name: "WYRE Gateway"', 'Application Platform: API Services (machine-to-machine, NOT user-facing)', 'Redirect URI: not required for client_credentials grant', 'Scope: select scopes per least-privilege for the entities you need (monitoring, management, control)'] },
        { action: 'Save the application. NinjaOne generates NINJAONE_CLIENT_ID and NINJAONE_CLIENT_SECRET.', notes: ['Save NINJAONE_CLIENT_SECRET before leaving — NinjaOne only shows it once.'] },
        { action: 'Set NINJAONE_REGION to your deployment region (us is default; eu / oc if applicable).' }
      ],
      requiredScopes: [
        'monitoring (read endpoints, alerts)',
        'management (modify endpoints — devices, organizations)',
        'control (run actions on endpoints — reboots, scripts)',
        'Adjust per the tools you intend to use; least-privilege is recommended (start with monitoring only, add as needed)'
      ],
      formatNotes: 'Client ID is a UUID. Client Secret is a long random string. NINJAONE_REGION enum: us | eu | oc.',
      rotationNotes: 'Regenerate the client_secret from the same API Application page. Old secret remains valid until explicitly revoked; supports zero-downtime rotation.'
    },
    domains: [
      {
        name: 'Devices',
        description: 'Manage endpoints, reboot devices, view services and alerts.',
        tools: [
          { name: 'ninjaone_devices_list', description: 'List devices with filters' },
          { name: 'ninjaone_devices_get', description: 'Get device details' },
          { name: 'ninjaone_devices_reboot', description: 'Schedule a device reboot' },
          { name: 'ninjaone_devices_services', description: 'List Windows services on a device' },
          { name: 'ninjaone_devices_alerts', description: 'Get device-specific alerts' },
          { name: 'ninjaone_devices_activities', description: 'View device activity log' }
        ]
      },
      {
        name: 'Organizations',
        description: 'Manage customer organizations and their resources.',
        tools: [
          { name: 'ninjaone_organizations_list', description: 'List organizations' },
          { name: 'ninjaone_organizations_get', description: 'Get organization details' },
          { name: 'ninjaone_organizations_create', description: 'Create a new organization' },
          { name: 'ninjaone_organizations_locations', description: 'List organization locations' },
          { name: 'ninjaone_organizations_devices', description: 'List devices for an organization' }
        ]
      },
      {
        name: 'Alerts',
        description: 'View and manage alerts across all devices.',
        tools: [
          { name: 'ninjaone_alerts_list', description: 'List alerts with filters' },
          { name: 'ninjaone_alerts_reset', description: 'Reset/dismiss a single alert' },
          { name: 'ninjaone_alerts_reset_all', description: 'Reset all alerts for a device or org' },
          { name: 'ninjaone_alerts_summary', description: 'Get alert count summary' }
        ]
      },
      {
        name: 'Tickets',
        description: 'Manage service tickets.',
        tools: [
          { name: 'ninjaone_tickets_list', description: 'List tickets with filters' },
          { name: 'ninjaone_tickets_get', description: 'Get ticket details' },
          { name: 'ninjaone_tickets_create', description: 'Create a new ticket' },
          { name: 'ninjaone_tickets_update', description: 'Update an existing ticket' },
          { name: 'ninjaone_tickets_add_comment', description: 'Add a comment to a ticket' },
          { name: 'ninjaone_tickets_comments', description: 'Get ticket comments' }
        ]
      }
    ],
    architecture: 'Hierarchical tool loading with navigation-based domain selection and lazy-loaded handlers.',
    installCommand: 'npx @wyre-technology/ninjaone-mcp',
    dockerAvailable: true,
    mcpbAvailable: true,
    rateLimit: 'Varies by endpoint'
  },
  {
    id: 'halopsa',
    name: 'HaloPSA MCP',
    npmPackage: '@wyre-technology/halopsa-mcp',
    description: 'MCP server for HaloPSA with decision tree architecture for managing tickets, clients, assets, agents, and invoices.',
    category: 'psa',
    repoUrl: 'https://github.com/wyre-technology/halopsa-mcp',
    companionPluginId: 'halopsa',
    envVars: [
      { name: 'HALOPSA_CLIENT_ID', required: true, description: 'OAuth 2.0 Client ID' },
      { name: 'HALOPSA_CLIENT_SECRET', required: true, description: 'OAuth 2.0 Client Secret' },
      { name: 'HALOPSA_TENANT', required: true, description: 'Tenant name (e.g., yourcompany)' },
      { name: 'HALOPSA_BASE_URL', required: false, description: 'Explicit base URL (alternative to tenant)' }
    ],
    credentialAcquisition: {
      portalUrl: 'https://halopsa.com/',
      prerequisites: [
        'HaloPSA tenant with Administrator role',
        'Knowledge of your tenant subdomain (e.g., yourcompany.halopsa.com)'
      ],
      steps: [
        { action: 'Sign in to your HaloPSA tenant as an Administrator.' },
        { action: 'Navigate to Configuration → Integrations → Custom OAuth Apps.' },
        { action: 'Click "Add" to create a new OAuth app.' },
        { action: 'Fill in:', notes: ['Name: "WYRE Gateway"', 'Authentication Method: Client ID and Secret (Services)', 'Login Type: System (not Agent)'] },
        { action: 'Save the app. HaloPSA generates HALOPSA_CLIENT_ID and HALOPSA_CLIENT_SECRET.', notes: ['Save HALOPSA_CLIENT_SECRET before leaving — HaloPSA only shows it once.'] },
        { action: 'On the same OAuth app page, assign Permissions for the entities you need (Tickets, Clients, Assets, etc.). Least-privilege per your gateway scope.' },
        { action: 'Set HALOPSA_TENANT to your subdomain (the prefix before .halopsa.com). If using a custom domain, set HALOPSA_BASE_URL to the full URL instead.' }
      ],
      requiredScopes: [
        'Tickets (read/write as needed)',
        'Clients (read/write as needed)',
        'Assets (read/write as needed)',
        'Adjust per the tools you intend to use'
      ],
      formatNotes: 'Client ID is a GUID. Client Secret is a long random string. Tenant is the subdomain prefix (e.g., "acme" for acme.halopsa.com).',
      rotationNotes: 'OAuth apps can be regenerated from the same Configuration page. Rotation does not require gateway downtime if you have a brief window of overlap.'
    },
    domains: [
      {
        name: 'Tickets',
        description: 'Manage support tickets, create new tickets, update status, add actions/notes.',
        tools: [
          { name: 'halopsa_tickets_list', description: 'List tickets with filters' },
          { name: 'halopsa_tickets_get', description: 'Get ticket details' },
          { name: 'halopsa_tickets_create', description: 'Create a new ticket' },
          { name: 'halopsa_tickets_update', description: 'Update an existing ticket' },
          { name: 'halopsa_tickets_add_action', description: 'Add a note/action to a ticket' }
        ]
      },
      {
        name: 'Clients',
        description: 'Manage companies/clients.',
        tools: [
          { name: 'halopsa_clients_list', description: 'List clients' },
          { name: 'halopsa_clients_get', description: 'Get client details' },
          { name: 'halopsa_clients_create', description: 'Create a new client' },
          { name: 'halopsa_clients_search', description: 'Search clients by name' }
        ]
      },
      {
        name: 'Assets',
        description: 'Manage configuration items/assets.',
        tools: [
          { name: 'halopsa_assets_list', description: 'List assets with filters' },
          { name: 'halopsa_assets_get', description: 'Get asset details' },
          { name: 'halopsa_assets_search', description: 'Search assets' },
          { name: 'halopsa_assets_list_types', description: 'List available asset types' }
        ]
      },
      {
        name: 'Agents',
        description: 'View technicians and teams.',
        tools: [
          { name: 'halopsa_agents_list', description: 'List agents/technicians' },
          { name: 'halopsa_agents_get', description: 'Get agent details' },
          { name: 'halopsa_teams_list', description: 'List teams' }
        ]
      },
      {
        name: 'Invoices',
        description: 'View billing and invoices.',
        tools: [
          { name: 'halopsa_invoices_list', description: 'List invoices with filters' },
          { name: 'halopsa_invoices_get', description: 'Get invoice details' }
        ]
      }
    ],
    architecture: 'Decision tree with lazy-loaded domain handlers. Navigate to a domain first, then use domain-specific tools.',
    installCommand: 'npx @wyre-technology/halopsa-mcp',
    dockerAvailable: true,
    mcpbAvailable: true,
    rateLimit: '500 requests per 3 minutes'
  },
  {
    id: 'itglue',
    name: 'IT Glue MCP',
    npmPackage: '@wyre-technology/itglue-mcp',
    description: 'MCP server providing Claude with access to IT Glue documentation, asset management, organizations, passwords, and flexible assets.',
    category: 'documentation',
    repoUrl: 'https://github.com/wyre-technology/itglue-mcp',
    companionPluginId: 'it-glue',
    envVars: [
      { name: 'ITGLUE_API_KEY', required: true, description: 'Your IT Glue API key (format: ITG.xxx)' },
      { name: 'ITGLUE_REGION', required: false, description: 'API region: us (default), eu, or au' }
    ],
    credentialAcquisition: {
      portalUrl: 'https://www.itglue.com/',
      prerequisites: [
        'IT Glue account with Administrator role',
        'IT Glue tier that includes API access (verify your plan includes API)'
      ],
      steps: [
        { action: 'Sign in to your IT Glue instance as an Administrator.' },
        { action: 'Navigate to Account → Settings → API Keys.' },
        { action: 'Click "Generate API Key".' },
        { action: 'Set a descriptive name (e.g., "WYRE Gateway"). Select permissions per least-privilege.' },
        { action: 'Copy the generated key (shown once) to ITGLUE_API_KEY.' },
        { action: 'Set ITGLUE_REGION to your regional deployment if non-US: eu or au.' }
      ],
      formatNotes: 'API key starts with "ITG." prefix (e.g., "ITG.xxx"). Region must be us (default), eu, or au.',
      rotationNotes: 'Generate new key via Account → Settings → API Keys; old key revokable from the same page.'
    },
    domains: [
      {
        name: 'Organizations',
        description: 'Search and retrieve organization records.',
        tools: [
          { name: 'search_organizations', description: 'Search organizations with filtering' },
          { name: 'get_organization', description: 'Get a specific organization by ID' }
        ]
      },
      {
        name: 'Configurations',
        description: 'Manage devices and configuration items.',
        tools: [
          { name: 'search_configurations', description: 'Search configurations with filtering' },
          { name: 'get_configuration', description: 'Get a specific configuration by ID' }
        ]
      },
      {
        name: 'Passwords',
        description: 'Secure credential storage and retrieval.',
        tools: [
          { name: 'search_passwords', description: 'Search password entries (metadata only)' },
          { name: 'get_password', description: 'Get a specific password including value' }
        ]
      },
      {
        name: 'Documents',
        description: 'Search and manage documentation.',
        tools: [
          { name: 'search_documents', description: 'Search documents with filtering' }
        ]
      },
      {
        name: 'Flexible Assets',
        description: 'Custom structured documentation types.',
        tools: [
          { name: 'search_flexible_assets', description: 'Search flexible assets by type' }
        ]
      }
    ],
    architecture: 'Flat tool exposure — all tools available immediately. Includes a health check utility tool.',
    installCommand: 'npx @wyre-technology/itglue-mcp',
    dockerAvailable: true,
    mcpbAvailable: false,
    rateLimit: '3000 requests per 5 minutes'
  },
  {
    id: 'superops',
    name: 'SuperOps.ai MCP',
    npmPackage: '@wyre-technology/superops-mcp',
    description: 'MCP server for SuperOps.ai PSA/RMM platform with GraphQL API support for clients, tickets, assets, and technicians.',
    category: 'psa',
    repoUrl: 'https://github.com/wyre-technology/superops-mcp',
    companionPluginId: 'superops',
    envVars: [
      { name: 'SUPEROPS_API_TOKEN', required: true, description: 'Your SuperOps.ai API token' },
      { name: 'SUPEROPS_SUBDOMAIN', required: true, description: 'Your SuperOps subdomain' },
      { name: 'SUPEROPS_REGION', required: false, description: 'Region: us (default) or eu' }
    ],
    credentialAcquisition: { portalUrl: 'https://superops.ai/', pendingVerification: true, prerequisites: ['SuperOps.ai account with Administrator access'], steps: [{ action: 'Sign in to your SuperOps.ai portal as an Administrator.' }, { action: 'Navigate to Settings → API tokens.' }, { action: 'Generate a new API token.' }, { action: 'Save to SUPEROPS_API_TOKEN.' }, { action: 'Set SUPEROPS_SUBDOMAIN to your tenant subdomain and SUPEROPS_REGION (us default, eu if applicable).' }] },
    domains: [
      {
        name: 'Clients',
        description: 'Manage client records.',
        tools: [
          { name: 'superops_clients_list', description: 'List clients with filters' },
          { name: 'superops_clients_get', description: 'Get client details' },
          { name: 'superops_clients_search', description: 'Search clients by name/domain' }
        ]
      },
      {
        name: 'Tickets',
        description: 'Manage support tickets.',
        tools: [
          { name: 'superops_tickets_list', description: 'List tickets with filters' },
          { name: 'superops_tickets_get', description: 'Get ticket details' },
          { name: 'superops_tickets_create', description: 'Create a new ticket' },
          { name: 'superops_tickets_update', description: 'Update ticket status/assignment' },
          { name: 'superops_tickets_add_note', description: 'Add note to ticket' },
          { name: 'superops_tickets_log_time', description: 'Log time on ticket' }
        ]
      },
      {
        name: 'Assets',
        description: 'Manage assets and endpoints.',
        tools: [
          { name: 'superops_assets_list', description: 'List assets/endpoints' },
          { name: 'superops_assets_get', description: 'Get asset details' },
          { name: 'superops_assets_software', description: 'Get software inventory' },
          { name: 'superops_assets_patches', description: 'Get patch status' }
        ]
      },
      {
        name: 'Technicians',
        description: 'Manage technician records.',
        tools: [
          { name: 'superops_technicians_list', description: 'List technicians' },
          { name: 'superops_technicians_get', description: 'Get technician details' },
          { name: 'superops_technicians_groups', description: 'List technician groups' }
        ]
      },
      {
        name: 'Custom',
        description: 'Run custom GraphQL queries and mutations.',
        tools: [
          { name: 'superops_custom_query', description: 'Run custom GraphQL query' },
          { name: 'superops_custom_mutation', description: 'Run custom GraphQL mutation' }
        ]
      }
    ],
    architecture: 'Decision tree with lazy-loaded domain handlers and custom GraphQL support.',
    installCommand: 'npx @wyre-technology/superops-mcp',
    dockerAvailable: true,
    mcpbAvailable: false,
    rateLimit: '800 requests per minute'
  },
  {
    id: 'atera',
    name: 'Atera MCP',
    npmPackage: '@wyre-technology/atera-mcp',
    description: 'MCP server for Atera RMM with decision tree navigation for managing customers, agents, tickets, alerts, and contacts.',
    category: 'psa',
    repoUrl: 'https://github.com/wyre-technology/atera-mcp',
    companionPluginId: 'atera',
    envVars: [
      { name: 'ATERA_API_KEY', required: true, description: 'Your Atera API key from Admin > API' }
    ],
    credentialAcquisition: {
      portalUrl: 'https://app.atera.com/',
      prerequisites: [
        'Atera account with Administrator role'
      ],
      steps: [
        { action: 'Sign in to your Atera portal as an Administrator.' },
        { action: 'Navigate to Admin → API.' },
        { action: 'Click to generate a new API key.' },
        { action: 'Copy the key to ATERA_API_KEY.' }
      ],
      formatNotes: 'Atera API key is a long random string. Atera does not currently support multiple concurrent API keys — rotating issues a new key and invalidates the old one.',
      rotationNotes: 'Rotation requires brief gateway downtime since old key is invalidated when new one is generated.'
    },
    domains: [
      {
        name: 'Customers',
        description: 'Manage customer (company) records.',
        tools: [
          { name: 'atera_customers_list', description: 'List customers with pagination' },
          { name: 'atera_customers_get', description: 'Get customer by ID' },
          { name: 'atera_customers_create', description: 'Create new customer' }
        ]
      },
      {
        name: 'Agents',
        description: 'Manage devices/endpoints with the Atera agent.',
        tools: [
          { name: 'atera_agents_list', description: 'List agents with optional customer filter' },
          { name: 'atera_agents_get', description: 'Get agent by ID' },
          { name: 'atera_agents_get_by_machine', description: 'Get agent by machine name' }
        ]
      },
      {
        name: 'Tickets',
        description: 'Manage service tickets.',
        tools: [
          { name: 'atera_tickets_list', description: 'List tickets with filters' },
          { name: 'atera_tickets_get', description: 'Get ticket by ID' },
          { name: 'atera_tickets_create', description: 'Create new ticket' },
          { name: 'atera_tickets_update', description: 'Update existing ticket' }
        ]
      },
      {
        name: 'Alerts',
        description: 'Monitor alerts from devices and agents.',
        tools: [
          { name: 'atera_alerts_list', description: 'List alerts with filters' },
          { name: 'atera_alerts_get', description: 'Get alert by ID' },
          { name: 'atera_alerts_by_agent', description: 'List alerts for an agent' },
          { name: 'atera_alerts_by_device', description: 'List alerts for a device' }
        ]
      },
      {
        name: 'Contacts',
        description: 'Manage customer contacts.',
        tools: [
          { name: 'atera_contacts_list', description: 'List all contacts' },
          { name: 'atera_contacts_get', description: 'Get contact by ID' },
          { name: 'atera_contacts_by_customer', description: 'List contacts for a customer' }
        ]
      }
    ],
    architecture: 'Decision tree with lazy-loaded domain handlers. Navigate to a domain first, then use domain-specific tools.',
    installCommand: 'npx @wyre-technology/atera-mcp',
    dockerAvailable: true,
    mcpbAvailable: false,
    rateLimit: '700 requests per minute'
  },
  {
    id: 'syncro',
    name: 'Syncro MCP',
    npmPackage: '@wyre-technology/syncro-mcp',
    description: 'MCP server for Syncro MSP with decision tree architecture for managing customers, tickets, assets, contacts, and invoices.',
    category: 'psa',
    repoUrl: 'https://github.com/wyre-technology/syncro-mcp',
    companionPluginId: 'syncro',
    envVars: [
      { name: 'SYNCRO_API_KEY', required: true, description: 'Your Syncro API key' },
      { name: 'SYNCRO_SUBDOMAIN', required: false, description: 'Your Syncro subdomain (if applicable)' }
    ],
    credentialAcquisition: {
      portalUrl: 'https://syncromsp.com/',
      prerequisites: [
        'Syncro account with Administrator role'
      ],
      steps: [
        { action: 'Sign in to your Syncro portal as an Administrator.' },
        { action: 'Navigate to Admin → API → API Tokens.' },
        { action: 'Click "New Token".' },
        { action: 'Set a descriptive name and select permissions per least-privilege for the entities you need.' },
        { action: 'Save and copy the generated token to SYNCRO_API_KEY.' },
        { action: 'If your Syncro instance uses a custom subdomain, set SYNCRO_SUBDOMAIN (typically not needed).' }
      ],
      formatNotes: 'API token is a long random string.',
      rotationNotes: 'Generate new token via Admin → API; revoke old token from the same page.'
    },
    domains: [
      {
        name: 'Customers',
        description: 'Manage customer accounts.',
        tools: [
          { name: 'syncro_customers_list', description: 'List customers with filters' },
          { name: 'syncro_customers_get', description: 'Get customer by ID' },
          { name: 'syncro_customers_create', description: 'Create new customer' },
          { name: 'syncro_customers_search', description: 'Search customers by query' }
        ]
      },
      {
        name: 'Tickets',
        description: 'Manage support tickets.',
        tools: [
          { name: 'syncro_tickets_list', description: 'List tickets with filters' },
          { name: 'syncro_tickets_get', description: 'Get ticket by ID' },
          { name: 'syncro_tickets_create', description: 'Create new ticket' },
          { name: 'syncro_tickets_update', description: 'Update existing ticket' },
          { name: 'syncro_tickets_add_comment', description: 'Add comment to ticket' }
        ]
      },
      {
        name: 'Assets',
        description: 'Manage configuration items.',
        tools: [
          { name: 'syncro_assets_list', description: 'List assets with filters' },
          { name: 'syncro_assets_get', description: 'Get asset by ID' },
          { name: 'syncro_assets_search', description: 'Search assets' }
        ]
      },
      {
        name: 'Contacts',
        description: 'Manage customer contacts.',
        tools: [
          { name: 'syncro_contacts_list', description: 'List contacts' },
          { name: 'syncro_contacts_get', description: 'Get contact by ID' },
          { name: 'syncro_contacts_create', description: 'Create new contact' }
        ]
      },
      {
        name: 'Invoices',
        description: 'View and manage billing.',
        tools: [
          { name: 'syncro_invoices_list', description: 'List invoices with filters' },
          { name: 'syncro_invoices_get', description: 'Get invoice by ID' },
          { name: 'syncro_invoices_create', description: 'Create new invoice' },
          { name: 'syncro_invoices_email', description: 'Email an invoice' }
        ]
      }
    ],
    architecture: 'Decision tree with lazy-loaded domain handlers. Navigate to a domain first, then use domain-specific tools.',
    installCommand: 'npx @wyre-technology/syncro-mcp',
    dockerAvailable: true,
    mcpbAvailable: false,
    rateLimit: '180 requests per minute'
  },
  {
    id: 'datto-rmm',
    name: 'Datto RMM MCP',
    npmPackage: '@wyre-technology/datto-rmm-mcp',
    description: 'MCP server for Datto RMM providing device management, monitoring alerts, patch management, and remote job execution.',
    category: 'rmm',
    repoUrl: 'https://github.com/wyre-technology/datto-rmm-mcp',
    companionPluginId: 'datto-rmm',
    envVars: [
      { name: 'DATTO_API_KEY', required: true, description: 'Datto RMM API key' },
      { name: 'DATTO_API_SECRET', required: true, description: 'Datto RMM API secret' },
      { name: 'DATTO_PLATFORM', required: true, description: 'Platform: pinotage, concord, or merlot' }
    ],
    credentialAcquisition: {
      portalUrl: 'https://www.datto.com/products/rmm/',
      prerequisites: [
        'Datto RMM account with Administrator role',
        'Knowledge of your Datto RMM platform region (pinotage = US, concord = US-east, merlot = EU; check your Datto URL to determine)'
      ],
      steps: [
        { action: 'Sign in to your Datto RMM instance as an Administrator.' },
        { action: 'Navigate to Setup → Users → Create API user (or convert an existing user to API access).' },
        { action: 'Generate the API key + secret pair. Save both before leaving — Datto only shows the secret once.' },
        { action: 'Assign the API user to the security level that grants access to the entities/sites you need.' },
        { action: 'Set DATTO_API_KEY, DATTO_API_SECRET, and DATTO_PLATFORM to the correct region (pinotage / concord / merlot).' }
      ],
      formatNotes: 'API key + secret are long random strings. DATTO_PLATFORM must be one of: pinotage, concord, merlot. Check the URL of your Datto RMM portal to determine which.',
      rotationNotes: 'Rotate via the Setup → Users page. Old credentials remain valid until you regenerate.'
    },
    domains: [
      { name: 'Devices', description: 'Manage and monitor endpoints.', tools: [
        { name: 'List devices', description: 'List devices with filters' },
        { name: 'Get device details', description: 'Get detailed device info' },
        { name: 'Search devices', description: 'Search by name/criteria' }
      ]},
      { name: 'Alerts', description: 'Monitor device alerts.', tools: [
        { name: 'List alerts', description: 'List alerts with filters' },
        { name: 'Get alert details', description: 'Get alert info' },
        { name: 'Resolve alert', description: 'Resolve/dismiss an alert' }
      ]},
      { name: 'Jobs', description: 'Remote job execution.', tools: [
        { name: 'List jobs', description: 'List scheduled/completed jobs' },
        { name: 'Create job', description: 'Create a remote job' }
      ]},
      { name: 'Patches', description: 'Patch management.', tools: [
        { name: 'List patches', description: 'List available patches' },
        { name: 'Approve patches', description: 'Approve patches for deployment' }
      ]}
    ],
    architecture: 'Flat tool exposure with domain-organized handlers.',
    installCommand: 'npx @wyre-technology/datto-rmm-mcp',
    dockerAvailable: true,
    mcpbAvailable: false,
    rateLimit: '600 requests per minute'
  },
  {
    id: 'autotask',
    name: 'Autotask MCP',
    npmPackage: '@wyre-technology/autotask-mcp',
    description: 'MCP server for Kaseya Autotask PSA — access companies, contacts, tickets, time entries, projects, contracts, and billing through AI assistants.',
    category: 'psa',
    repoUrl: 'https://github.com/wyre-technology/autotask-mcp',
    companionPluginId: 'autotask',
    envVars: [
      { name: 'AUTOTASK_USERNAME', required: true, description: 'Autotask API username (email)' },
      { name: 'AUTOTASK_SECRET', required: true, description: 'Autotask API secret key' },
      { name: 'AUTOTASK_INTEGRATION_CODE', required: true, description: 'Autotask integration code' }
    ],
    credentialAcquisition: {
      portalUrl: 'https://ww1.autotask.net/',
      prerequisites: [
        'Autotask account with Administrator-level role (required to create API users)',
        'A decision on API user name + ownership — API users count against Autotask resource limits'
      ],
      steps: [
        { action: 'Sign in to your Autotask instance as an Administrator.' },
        { action: 'Navigate to Admin → Resources/Users → New → "API User (system) (API-only)".' },
        { action: 'Fill in the API user details. Use a clear name (e.g., "WYRE Gateway API") so it is identifiable in audit logs.' },
        { action: 'Generate the API tracking identifier (this becomes AUTOTASK_INTEGRATION_CODE).', notes: ['Save it before leaving the page — Autotask only shows it once.'] },
        { action: 'Set the username (becomes AUTOTASK_USERNAME — this is the email-format Autotask username, NOT a real email).' },
        { action: 'Generate or set the secret (becomes AUTOTASK_SECRET).' },
        { action: 'Assign the API user to a Security Level that grants access to the entities you need (Companies, Tickets, Time Entries, etc.). Least-privilege per your gateway scope.' },
        { action: 'Save the API user. Use the three values in your environment.' }
      ],
      requiredScopes: [
        'Companies (read/write as needed)',
        'Tickets (read/write as needed)',
        'Time Entries (read/write as needed)',
        'Adjust per the tools you intend to use from the gateway'
      ],
      formatNotes: 'Username is in email format. Integration code is a 32-character GUID. Secret is a long random string. All three are required.',
      rotationNotes: 'Autotask API users do not expire automatically. Rotate secrets manually if compromised (regenerate via the same API user page).'
    },
    domains: [
      { name: 'Tickets', description: 'Service ticket management.', tools: [
        { name: 'List tickets', description: 'List/search tickets with filters' },
        { name: 'Get ticket', description: 'Get ticket details' },
        { name: 'Create ticket', description: 'Create a new ticket' },
        { name: 'Update ticket', description: 'Update ticket fields' },
        { name: 'Add note', description: 'Add note to ticket' }
      ]},
      { name: 'Companies', description: 'CRM company management.', tools: [
        { name: 'List companies', description: 'List/search companies' },
        { name: 'Get company', description: 'Get company details' },
        { name: 'Create company', description: 'Create a new company' }
      ]},
      { name: 'Contacts', description: 'Contact management.', tools: [
        { name: 'List contacts', description: 'List/search contacts' },
        { name: 'Get contact', description: 'Get contact details' }
      ]},
      { name: 'Time Entries', description: 'Time tracking and billing.', tools: [
        { name: 'List time entries', description: 'List time entries with filters' },
        { name: 'Create time entry', description: 'Log time against ticket/project' }
      ]},
      { name: 'Projects', description: 'Project management.', tools: [
        { name: 'List projects', description: 'List projects' },
        { name: 'Get project', description: 'Get project details' }
      ]},
      { name: 'Contracts', description: 'Service agreements.', tools: [
        { name: 'List contracts', description: 'List contracts' },
        { name: 'Get contract', description: 'Get contract details' }
      ]}
    ],
    architecture: 'Comprehensive flat tool exposure with intelligent caching and ID-to-name resolution.',
    installCommand: 'npx @wyre-technology/autotask-mcp',
    dockerAvailable: true,
    mcpbAvailable: true,
    rateLimit: '10,000 requests per hour'
  },
  {
    id: 'liongard',
    name: 'Liongard MCP',
    npmPackage: '@wyre-technology/liongard-mcp',
    description: 'MCP server for Liongard with decision tree architecture for managing environments, inspections, systems, detections, alerts, and configuration monitoring.',
    category: 'rmm',
    repoUrl: 'https://github.com/wyre-technology/liongard-mcp',
    companionPluginId: 'liongard',
    envVars: [
      { name: 'LIONGARD_INSTANCE', required: true, description: 'Your Liongard instance subdomain (e.g., yourcompany)' },
      { name: 'LIONGARD_API_KEY', required: true, description: 'Your Liongard API key (X-ROAR-API-KEY)' }
    ],
    credentialAcquisition: { portalUrl: 'https://app.liongard.com/', pendingVerification: true, steps: [{ action: 'Sign in to your Liongard instance.' }, { action: 'Navigate to Settings → API Keys.' }, { action: 'Generate a new API key.' }, { action: 'Save to LIONGARD_API_KEY (used as X-ROAR-API-KEY header).' }, { action: 'Set LIONGARD_INSTANCE to your subdomain.' }] },
    domains: [
      {
        name: 'Environments',
        description: 'Manage Liongard environments (customers/tenants).',
        tools: [
          { name: 'liongard_environments_list', description: 'List environments with filters' },
          { name: 'liongard_environments_get', description: 'Get environment details' },
          { name: 'liongard_environments_create', description: 'Create a new environment' },
          { name: 'liongard_environments_update', description: 'Update an existing environment' }
        ]
      },
      {
        name: 'Agents',
        description: 'Manage Liongard collector agents.',
        tools: [
          { name: 'liongard_agents_list', description: 'List agents' },
          { name: 'liongard_agents_get', description: 'Get agent details' }
        ]
      },
      {
        name: 'Systems',
        description: 'Manage inspectors (system types) and their configurations.',
        tools: [
          { name: 'liongard_systems_list', description: 'List available inspectors' },
          { name: 'liongard_systems_get', description: 'Get inspector details' }
        ]
      },
      {
        name: 'Launchpoints',
        description: 'Manage launchpoint configurations that connect inspectors to environments.',
        tools: [
          { name: 'liongard_launchpoints_list', description: 'List launchpoints with filters' },
          { name: 'liongard_launchpoints_get', description: 'Get launchpoint details' },
          { name: 'liongard_launchpoints_create', description: 'Create a new launchpoint' }
        ]
      },
      {
        name: 'Detections',
        description: 'Monitor configuration changes and compliance detections.',
        tools: [
          { name: 'liongard_detections_list', description: 'List detections with filters' },
          { name: 'liongard_detections_get', description: 'Get detection details' }
        ]
      },
      {
        name: 'Alerts',
        description: 'View and manage Liongard alerts.',
        tools: [
          { name: 'liongard_alerts_list', description: 'List alerts with filters' },
          { name: 'liongard_alerts_get', description: 'Get alert details' }
        ]
      },
      {
        name: 'Metrics',
        description: 'View compliance metrics and scoring.',
        tools: [
          { name: 'liongard_metrics_list', description: 'List metrics' },
          { name: 'liongard_metrics_get', description: 'Get metric details' }
        ]
      },
      {
        name: 'Timeline',
        description: 'View inspection history and configuration timeline.',
        tools: [
          { name: 'liongard_timeline_list', description: 'List timeline entries' },
          { name: 'liongard_timeline_get', description: 'Get timeline entry details' }
        ]
      },
      {
        name: 'Inventory',
        description: 'Manage identity and device inventory.',
        tools: [
          { name: 'liongard_inventory_identities', description: 'List identity records' },
          { name: 'liongard_inventory_devices', description: 'List device profiles' }
        ]
      }
    ],
    architecture: 'Decision tree with lazy-loaded domain handlers. Navigate to a domain first, then use domain-specific tools.',
    installCommand: 'npx @wyre-technology/liongard-mcp',
    dockerAvailable: true,
    mcpbAvailable: false,
    rateLimit: '300 requests per minute'
  },
  {
    id: 'connectwise-manage',
    name: 'ConnectWise Manage MCP',
    npmPackage: '@wyre-technology/connectwise-manage-mcp',
    description: 'MCP server for ConnectWise Manage (PSA) providing ticket management, company/contact CRM, project management, and time tracking.',
    category: 'psa',
    repoUrl: 'https://github.com/wyre-technology/connectwise-manage-mcp',
    companionPluginId: 'connectwise-psa',
    envVars: [
      { name: 'CW_MANAGE_COMPANY_ID', required: true, description: 'ConnectWise company identifier' },
      { name: 'CW_MANAGE_PUBLIC_KEY', required: true, description: 'API member public key' },
      { name: 'CW_MANAGE_PRIVATE_KEY', required: true, description: 'API member private key' },
      { name: 'CW_MANAGE_CLIENT_ID', required: true, description: 'ConnectWise client ID' }
    ],
    credentialAcquisition: {
      portalUrl: 'https://developer.connectwise.com/ClientID',
      prerequisites: [
        'ConnectWise Manage account with Administrator role',
        'Knowledge of your ConnectWise company identifier (the prefix in your ConnectWise URL)',
        'An "Integrator" user role configured for API access (NOT a regular member role — see Member Maintenance docs)',
        'ConnectWise Developer Network account (free) to obtain CW_MANAGE_CLIENT_ID at developer.connectwise.com/ClientID'
      ],
      steps: [
        { action: 'Visit https://developer.connectwise.com/ClientID and sign in (or register a free ConnectWise Developer Network account).' },
        { action: 'Request a Client ID for your integration. Fill in: integration name (e.g., "WYRE Gateway"), description, ConnectWise product (Manage), and integration owner contact details.' },
        { action: 'Save the issued Client ID to CW_MANAGE_CLIENT_ID. This identifies your integration globally to ConnectWise.' },
        { action: 'Sign in to your ConnectWise Manage instance as an Administrator.' },
        { action: 'Navigate to System → Members → API Members.' },
        { action: 'Click "+" to create a new API Member, or edit an existing one.' },
        { action: 'Set the API Member name (descriptive, e.g., "WYRE Gateway").' },
        { action: 'Set the role to one with appropriate permissions for the entities you need.' },
        { action: 'In the API Keys tab on the API Member, generate a new key pair.', notes: ['Save BOTH the public key (becomes CW_MANAGE_PUBLIC_KEY) and the private key (becomes CW_MANAGE_PRIVATE_KEY)', 'ConnectWise only shows the private key once.'] },
        { action: 'Set CW_MANAGE_COMPANY_ID to your ConnectWise company identifier (the prefix in your portal URL).' }
      ],
      requiredScopes: [
        'Configure the API Member\'s role to grant access to the entities you need (Tickets, Companies, Time Entries, etc.). Least-privilege per your gateway scope.'
      ],
      formatNotes: 'Public/private keys are long random strings. Company ID is the URL prefix. Client ID is a UUID issued by ConnectWise Developer Network.',
      rotationNotes: 'Regenerate from the same API Member → API Keys tab. Old key pair invalidated when new pair is generated.'
    },
    domains: [
      { name: 'Tickets', description: 'Service ticket management.', tools: [
        { name: 'List tickets', description: 'List tickets with filters' },
        { name: 'Get ticket', description: 'Get ticket details' },
        { name: 'Create ticket', description: 'Create a new ticket' },
        { name: 'Update ticket', description: 'Update ticket fields' }
      ]},
      { name: 'Companies', description: 'Company management.', tools: [
        { name: 'List companies', description: 'List companies' },
        { name: 'Get company', description: 'Get company details' }
      ]},
      { name: 'Contacts', description: 'Contact management.', tools: [
        { name: 'List contacts', description: 'List contacts' },
        { name: 'Get contact', description: 'Get contact details' }
      ]},
      { name: 'Projects', description: 'Project management.', tools: [
        { name: 'List projects', description: 'List projects' },
        { name: 'Get project', description: 'Get project details' }
      ]}
    ],
    architecture: 'Decision tree with lazy-loaded domain handlers.',
    installCommand: 'npx @wyre-technology/connectwise-manage-mcp',
    dockerAvailable: true,
    mcpbAvailable: true,
    rateLimit: '60 requests per minute'
  },
  {
    id: 'hudu',
    name: 'Hudu MCP',
    npmPackage: '@wyre-technology/hudu-mcp',
    description: 'MCP server for Hudu IT documentation platform — manage companies, assets, articles, passwords, websites, folders, procedures, and activity logs.',
    category: 'documentation',
    repoUrl: 'https://github.com/wyre-technology/hudu-mcp',
    companionPluginId: 'hudu',
    envVars: [
      { name: 'HUDU_BASE_URL', required: true, description: 'Your Hudu instance URL (e.g., https://acme.huducloud.com)' },
      { name: 'HUDU_API_KEY', required: true, description: 'Hudu API key from Admin > API Keys' }
    ],
    credentialAcquisition: {
      portalUrl: 'https://www.hudu.com/',
      prerequisites: [
        'Hudu account with Administrator role',
        'Knowledge of your Hudu instance URL (e.g., https://acme.huducloud.com)'
      ],
      steps: [
        { action: 'Sign in to your Hudu instance as an Administrator.' },
        { action: 'Navigate to Admin → API Keys.' },
        { action: 'Click "New API Key".' },
        { action: 'Set a descriptive name (e.g., "WYRE Gateway") and set permission scopes per least-privilege for the entities you need.' },
        { action: 'Save the key. Hudu shows it once — copy to HUDU_API_KEY immediately.' },
        { action: 'Set HUDU_BASE_URL to your Hudu instance URL including the protocol.' }
      ],
      formatNotes: 'API key is a long random string. HUDU_BASE_URL must include https:// and the full hostname (e.g., https://acme.huducloud.com).',
      rotationNotes: 'Generate a new key via Admin → API Keys → New API Key. Revoke the old key once the new one is verified working.'
    },
    domains: [
      {
        name: 'Companies',
        description: 'Manage client companies.',
        tools: [
          { name: 'hudu_list_companies', description: 'List companies with filters' },
          { name: 'hudu_get_company', description: 'Get company by ID' },
          { name: 'hudu_create_company', description: 'Create a company' },
          { name: 'hudu_update_company', description: 'Update a company' },
          { name: 'hudu_delete_company', description: 'Delete a company' },
          { name: 'hudu_archive_company', description: 'Archive a company' },
          { name: 'hudu_unarchive_company', description: 'Unarchive a company' }
        ]
      },
      {
        name: 'Assets',
        description: 'Manage IT assets and asset layouts.',
        tools: [
          { name: 'hudu_list_assets', description: 'List assets with filters' },
          { name: 'hudu_get_asset', description: 'Get asset by ID' },
          { name: 'hudu_create_asset', description: 'Create an asset' },
          { name: 'hudu_update_asset', description: 'Update an asset' },
          { name: 'hudu_delete_asset', description: 'Delete an asset' },
          { name: 'hudu_archive_asset', description: 'Archive an asset' },
          { name: 'hudu_list_asset_layouts', description: 'List asset layouts' },
          { name: 'hudu_get_asset_layout', description: 'Get asset layout by ID' },
          { name: 'hudu_create_asset_layout', description: 'Create an asset layout' },
          { name: 'hudu_update_asset_layout', description: 'Update an asset layout' }
        ]
      },
      {
        name: 'Passwords',
        description: 'Manage asset passwords (credentials).',
        tools: [
          { name: 'hudu_list_asset_passwords', description: 'List asset passwords' },
          { name: 'hudu_get_asset_password', description: 'Get asset password by ID' },
          { name: 'hudu_create_asset_password', description: 'Create an asset password' },
          { name: 'hudu_update_asset_password', description: 'Update an asset password' },
          { name: 'hudu_delete_asset_password', description: 'Delete an asset password' }
        ]
      },
      {
        name: 'Articles',
        description: 'Manage knowledge base articles.',
        tools: [
          { name: 'hudu_list_articles', description: 'List knowledge base articles' },
          { name: 'hudu_get_article', description: 'Get article by ID' },
          { name: 'hudu_create_article', description: 'Create an article' },
          { name: 'hudu_update_article', description: 'Update an article' },
          { name: 'hudu_delete_article', description: 'Delete an article' },
          { name: 'hudu_archive_article', description: 'Archive an article' }
        ]
      },
      {
        name: 'Websites',
        description: 'Manage monitored websites.',
        tools: [
          { name: 'hudu_list_websites', description: 'List monitored websites' },
          { name: 'hudu_get_website', description: 'Get website by ID' },
          { name: 'hudu_create_website', description: 'Create a website' },
          { name: 'hudu_update_website', description: 'Update a website' },
          { name: 'hudu_delete_website', description: 'Delete a website' }
        ]
      },
      {
        name: 'Utilities',
        description: 'Folders, procedures, activity logs, relations, and Magic Dash.',
        tools: [
          { name: 'hudu_list_folders', description: 'List folders' },
          { name: 'hudu_list_procedures', description: 'List procedures' },
          { name: 'hudu_list_activity_logs', description: 'List activity logs' },
          { name: 'hudu_list_relations', description: 'List relations' },
          { name: 'hudu_list_magic_dash', description: 'List Magic Dash items' },
          { name: 'hudu_test_connection', description: 'Test API connectivity' }
        ]
      }
    ],
    architecture: 'Flat tool exposure with lazy SDK initialization. All 39 tools available immediately.',
    installCommand: 'npx @wyre-technology/hudu-mcp',
    dockerAvailable: true,
    mcpbAvailable: false,
    rateLimit: '300 requests per minute'
  },
  {
    id: 'rocketcyber',
    name: 'RocketCyber MCP',
    npmPackage: '@wyre-technology/rocketcyber-mcp',
    description: 'MCP server for RocketCyber managed SOC — read-only access to accounts, agents, incidents, events, firewalls, apps, and security status.',
    category: 'security',
    repoUrl: 'https://github.com/wyre-technology/rocketcyber-mcp',
    companionPluginId: 'rocketcyber',
    envVars: [
      { name: 'ROCKETCYBER_API_KEY', required: true, description: 'RocketCyber API key from Provider Settings > API tab' },
      { name: 'ROCKETCYBER_REGION', required: false, description: 'Region: us (default) or eu' }
    ],
    credentialAcquisition: {
      portalUrl: 'https://www.rocketcyber.com/',
      prerequisites: [
        'RocketCyber provider-level account access (NOT customer-level — credentials live in Provider Settings)'
      ],
      steps: [
        { action: 'Sign in to your RocketCyber Provider portal.' },
        { action: 'Navigate to Provider Settings → API tab.' },
        { action: 'Generate a new API key.' },
        { action: 'Copy the key to ROCKETCYBER_API_KEY.' },
        { action: 'If your RocketCyber deployment is EU-hosted, set ROCKETCYBER_REGION=eu. Default is us.' }
      ],
      formatNotes: 'API key is a long random string. Region must be us (default) or eu.',
      rotationNotes: 'Provider Settings → API tab supports key rotation. Old key remains valid until explicitly revoked.'
    },
    domains: [
      {
        name: 'Account',
        description: 'View account information.',
        tools: [
          { name: 'rocketcyber_get_account', description: 'Get account info' }
        ]
      },
      {
        name: 'Incidents',
        description: 'View and triage security incidents.',
        tools: [
          { name: 'rocketcyber_list_incidents', description: 'List security incidents' }
        ]
      },
      {
        name: 'Agents',
        description: 'Monitor RocketAgent deployment and health.',
        tools: [
          { name: 'rocketcyber_list_agents', description: 'List monitored agents' }
        ]
      },
      {
        name: 'Events',
        description: 'View security events and summaries.',
        tools: [
          { name: 'rocketcyber_list_events', description: 'List security events' },
          { name: 'rocketcyber_get_event_summary', description: 'Get event summary/stats' }
        ]
      },
      {
        name: 'Security Status',
        description: 'View firewall, app, Defender, and Office 365 status.',
        tools: [
          { name: 'rocketcyber_list_firewalls', description: 'List firewall devices' },
          { name: 'rocketcyber_list_apps', description: 'List managed apps' },
          { name: 'rocketcyber_get_defender', description: 'Get Defender status' },
          { name: 'rocketcyber_get_office', description: 'Get Office 365 status' }
        ]
      },
      {
        name: 'Utilities',
        description: 'Connection testing.',
        tools: [
          { name: 'rocketcyber_test_connection', description: 'Test API connectivity' }
        ]
      }
    ],
    architecture: 'Flat tool exposure with lazy SDK initialization. All 10 tools available immediately (read-only).',
    installCommand: 'npx @wyre-technology/rocketcyber-mcp',
    dockerAvailable: true,
    mcpbAvailable: false,
    rateLimit: '60 requests per minute'
  },
  {
    id: 'blumira',
    name: 'Blumira MCP',
    npmPackage: 'blumira-mcp',
    description: 'MCP server for the Blumira SIEM platform. Access security findings, agents, users, resolutions, and MSP multi-account management.',
    category: 'security',
    repoUrl: 'https://github.com/wyre-technology/blumira-mcp',
    envVars: [
      { name: 'BLUMIRA_JWT_TOKEN', required: true, description: 'JWT authentication token from your Blumira account' },
    ],
    credentialAcquisition: { portalUrl: 'https://app.blumira.com/', pendingVerification: true, steps: [{ action: 'Sign in to your Blumira account.' }, { action: 'Navigate to account settings → API Tokens.' }, { action: 'Generate a JWT token.' }, { action: 'Save to BLUMIRA_JWT_TOKEN.' }] },
    domains: [
      {
        name: 'Findings',
        description: 'View, resolve, and comment on security findings.',
        tools: [
          { name: 'List findings', description: 'List security findings with filtering' },
          { name: 'Get finding', description: 'Get details for a specific finding' },
          { name: 'Resolve finding', description: 'Mark a finding as resolved' },
          { name: 'Assign finding', description: 'Assign a finding to a user' },
          { name: 'List comments', description: 'List comments on a finding' },
          { name: 'Add comment', description: 'Add a comment to a finding' },
        ]
      },
      {
        name: 'Agents & Devices',
        description: 'Manage Blumira agents and monitored devices.',
        tools: [
          { name: 'List devices', description: 'List monitored devices' },
          { name: 'Get device', description: 'Get details for a specific device' },
          { name: 'List agent keys', description: 'List agent deployment keys' },
        ]
      },
      {
        name: 'MSP Management',
        description: 'Multi-account management for MSP environments.',
        tools: [
          { name: 'List MSP accounts', description: 'List all managed accounts' },
          { name: 'Get MSP findings', description: 'View findings across all accounts' },
          { name: 'List MSP devices', description: 'List devices across all accounts' },
          { name: 'List MSP users', description: 'List users across all accounts' },
        ]
      },
    ],
    architecture: 'Single TypeScript MCP server supporting both stdio and Streamable HTTP transports.',
    installCommand: 'npx blumira-mcp',
    dockerAvailable: true,
    mcpbAvailable: false,
  },
  {
    id: 'domotz',
    name: 'Domotz MCP',
    npmPackage: 'domotz-mcp',
    description: 'MCP server for Domotz network monitoring. Monitor agents, devices, network topology, metrics, alerts, and power outlets.',
    category: 'network',
    repoUrl: 'https://github.com/wyre-technology/domotz-mcp',
    envVars: [
      { name: 'DOMOTZ_API_KEY', required: true, description: 'Your Domotz API key' },
      { name: 'DOMOTZ_REGION', required: false, description: 'API region endpoint (default: us-east-1)' },
    ],
    credentialAcquisition: { portalUrl: 'https://app.domotz.com/', pendingVerification: true, steps: [{ action: 'Sign in to your Domotz account.' }, { action: 'Navigate to Account Settings → API.' }, { action: 'Generate an API key and copy to DOMOTZ_API_KEY.' }, { action: 'Set DOMOTZ_REGION if non-default (default: us-east-1).' }] },
    domains: [
      {
        name: 'Agents',
        description: 'List and inspect Domotz monitoring agents.',
        tools: [
          { name: 'List agents', description: 'List all Domotz agents' },
          { name: 'Get agent', description: 'Get details for a specific agent' },
        ]
      },
      {
        name: 'Devices',
        description: 'Monitor and inspect network devices.',
        tools: [
          { name: 'List devices', description: 'List all devices on an agent' },
          { name: 'Get device', description: 'Get details for a specific device' },
          { name: 'Device uptime', description: 'Get device uptime history' },
          { name: 'Device history', description: 'Get device status history' },
          { name: 'Device inventory', description: 'Get device inventory details' },
        ]
      },
      {
        name: 'Network',
        description: 'View network topology and detect conflicts.',
        tools: [
          { name: 'Network topology', description: 'Get network topology map' },
          { name: 'Network interfaces', description: 'List network interfaces' },
          { name: 'IP conflicts', description: 'Detect IP address conflicts' },
        ]
      },
      {
        name: 'Metrics & Alerts',
        description: 'Monitor SNMP sensors and alert profiles.',
        tools: [
          { name: 'List metric variables', description: 'List available SNMP metric variables' },
          { name: 'Variable history', description: 'Get metric variable history' },
          { name: 'SNMP sensors', description: 'List SNMP sensors' },
          { name: 'Alert profiles', description: 'List alert profiles' },
          { name: 'Device alerts', description: 'List alerts for a device' },
        ]
      },
    ],
    architecture: 'Single TypeScript MCP server supporting both stdio and Streamable HTTP transports.',
    installCommand: 'npx domotz-mcp',
    dockerAvailable: true,
    mcpbAvailable: false,
  },
  {
    id: 'huntress',
    name: 'Huntress MCP',
    npmPackage: 'huntress-mcp',
    description: 'MCP server for the Huntress cybersecurity platform. Manage agents, organizations, incidents, escalations, signals, and users.',
    category: 'security',
    repoUrl: 'https://github.com/wyre-technology/huntress-mcp',
    envVars: [
      { name: 'HUNTRESS_API_KEY', required: true, description: 'Your Huntress API public key' },
      { name: 'HUNTRESS_API_SECRET', required: true, description: 'Your Huntress API secret key' },
    ],
    credentialAcquisition: {
      portalUrl: 'https://www.huntress.com/',
      prerequisites: [
        'Huntress account with Administrator-level access (required to create API keys)'
      ],
      steps: [
        { action: 'Sign in to your Huntress portal as an Administrator.' },
        { action: 'Navigate to your account-settings area (typically: profile icon → Account Settings → API Keys, or per your account-level navigation).' },
        { action: 'Click to create a new API key pair.' },
        { action: 'Save both the API key (becomes HUNTRESS_API_KEY) and the secret (becomes HUNTRESS_API_SECRET).' },
        { action: 'Huntress only shows the secret once — copy it immediately.' }
      ],
      formatNotes: 'Both API key and secret are long random strings. Used together for Basic Auth-style requests.',
      rotationNotes: 'Generate new key/secret pair; revoke old pair when the new pair is verified working.'
    },
    domains: [
      {
        name: 'Agents',
        description: 'View and manage Huntress agents across organizations.',
        tools: [
          { name: 'List agents', description: 'List agents with filtering' },
          { name: 'Get agent', description: 'Get details for a specific agent' },
        ]
      },
      {
        name: 'Organizations',
        description: 'Manage customer organizations.',
        tools: [
          { name: 'List organizations', description: 'List all organizations' },
          { name: 'Get organization', description: 'Get organization details' },
          { name: 'Create organization', description: 'Create a new organization' },
          { name: 'Update organization', description: 'Update an organization' },
          { name: 'Delete organization', description: 'Delete an organization' },
        ]
      },
      {
        name: 'Incidents & Escalations',
        description: 'Triage, resolve, and bulk-manage security incidents.',
        tools: [
          { name: 'List incidents', description: 'List incidents with filtering' },
          { name: 'Get incident', description: 'Get incident details and remediations' },
          { name: 'Resolve incident', description: 'Mark an incident as resolved' },
          { name: 'Bulk approve remediations', description: 'Approve remediations in bulk' },
          { name: 'List escalations', description: 'List escalated incidents' },
          { name: 'Resolve escalation', description: 'Resolve an escalation' },
        ]
      },
      {
        name: 'Signals',
        description: 'View and investigate threat signals.',
        tools: [
          { name: 'List signals', description: 'List threat signals' },
          { name: 'Get signal', description: 'Get signal details' },
        ]
      },
      {
        name: 'Users',
        description: 'Manage Huntress platform users.',
        tools: [
          { name: 'List users', description: 'List platform users' },
          { name: 'Get user', description: 'Get user details' },
          { name: 'Create user', description: 'Create a new user' },
          { name: 'Update user', description: 'Update a user' },
          { name: 'Delete user', description: 'Delete a user' },
        ]
      },
    ],
    architecture: 'Single TypeScript MCP server supporting both stdio and Streamable HTTP transports.',
    installCommand: 'npx huntress-mcp',
    dockerAvailable: true,
    mcpbAvailable: false,
  },
  {
    id: 'qbo',
    name: 'QuickBooks Online MCP',
    npmPackage: '@wyre-technology/qbo-mcp',
    description: 'MCP server for QuickBooks Online. Manage customers, invoices, expenses, payments, and run financial reports.',
    category: 'accounting',
    repoUrl: 'https://github.com/wyre-technology/qbo-mcp',
    envVars: [
      { name: 'QBO_ACCESS_TOKEN', required: true, description: 'OAuth 2.0 access token for QuickBooks Online' },
      { name: 'QBO_REALM_ID', required: true, description: 'Your QuickBooks Online company ID (realm ID)' },
    ],
    credentialAcquisition: {
      portalUrl: 'https://developer.intuit.com/',
      prerequisites: [
        'QuickBooks Online subscription (any tier)',
        'Intuit Developer account at https://developer.intuit.com/',
        'Awareness that QBO uses OAuth 2.0; you create a developer app to issue tokens'
      ],
      steps: [
        { action: 'Sign in to your Intuit Developer account at https://developer.intuit.com/.' },
        { action: 'Navigate to Dashboard → Apps → Create an app.' },
        { action: 'Select "QuickBooks Online and Payments" as the scope.' },
        { action: 'Configure the app: name, target environment (Sandbox for testing, Production for live), and OAuth 2.0 redirect URI per your deployment.' },
        { action: 'In the app\'s "Keys & OAuth" section, note the Client ID and Client Secret.' },
        { action: 'Walk through the OAuth 2.0 authorization flow to obtain an access_token + refresh_token.', notes: ['QBO access tokens expire after 1 hour; the refresh_token (valid ~100 days) is used to issue new access tokens.', 'See https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0 for the canonical flow.'] },
        { action: 'Set QBO_ACCESS_TOKEN and QBO_REALM_ID (the QuickBooks Online company ID — visible during OAuth callback as "realmId").' }
      ],
      requiredScopes: [
        'com.intuit.quickbooks.accounting (for accounting entities — Items, Customers, Invoices, etc.)',
        'com.intuit.quickbooks.payments (only if using payment endpoints)'
      ],
      formatNotes: 'Access token is a JWT-like string (long, base64-ish). Realm ID is a numeric company ID (e.g., "1234567890").',
      rotationNotes: 'Access token refreshes every hour via the refresh_token. Refresh_token rotates every ~100 days — store the latest refresh_token to maintain access. Gateway should implement automatic token refresh.'
    },
    domains: [
      {
        name: 'Customers',
        description: 'Manage customer records.',
        tools: [
          { name: 'List customers', description: 'List customers with filtering' },
          { name: 'Get customer', description: 'Get customer details' },
          { name: 'Create customer', description: 'Create a new customer' },
          { name: 'Search customers', description: 'Search customers by name or email' },
        ]
      },
      {
        name: 'Invoices',
        description: 'Create and manage invoices.',
        tools: [
          { name: 'List invoices', description: 'List invoices with filtering' },
          { name: 'Get invoice', description: 'Get invoice details' },
          { name: 'Create invoice', description: 'Create a new invoice' },
          { name: 'Send invoice', description: 'Email an invoice to a customer' },
        ]
      },
      {
        name: 'Expenses',
        description: 'View purchases and bills.',
        tools: [
          { name: 'List purchases', description: 'List expense purchases' },
          { name: 'List bills', description: 'List vendor bills' },
          { name: 'Get purchase', description: 'Get purchase details' },
          { name: 'Get bill', description: 'Get bill details' },
        ]
      },
      {
        name: 'Payments',
        description: 'Record and view customer payments.',
        tools: [
          { name: 'List payments', description: 'List payments received' },
          { name: 'Get payment', description: 'Get payment details' },
          { name: 'Create payment', description: 'Record a customer payment' },
        ]
      },
      {
        name: 'Reports',
        description: 'Generate financial reports.',
        tools: [
          { name: 'Profit & Loss', description: 'Generate a P&L report' },
          { name: 'Balance Sheet', description: 'Generate a balance sheet report' },
          { name: 'Aged Receivables', description: 'Generate aged receivables report' },
          { name: 'Aged Payables', description: 'Generate aged payables report' },
          { name: 'Customer Sales', description: 'Generate customer sales report' },
        ]
      },
    ],
    architecture: 'Single TypeScript MCP server supporting both stdio and Streamable HTTP transports.',
    installCommand: 'npx @wyre-technology/qbo-mcp',
    dockerAvailable: true,
    mcpbAvailable: false,
  },
  {
    id: 'salesbuildr',
    name: 'SalesBuildr MCP',
    npmPackage: '@wyre-technology/salesbuildr-mcp',
    description: 'MCP server for SalesBuildr. Manage companies, contacts, products, opportunities, and quotes in your sales pipeline.',
    category: 'sales',
    repoUrl: 'https://github.com/wyre-technology/salesbuildr-mcp',
    envVars: [
      { name: 'SALESBUILDR_API_KEY', required: true, description: 'Your SalesBuildr API key' },
      { name: 'SALESBUILDR_BASE_URL', required: false, description: 'Tenant-specific base URL (e.g. https://mytenant.salesbuildr.com)' },
    ],
    credentialAcquisition: { portalUrl: 'https://salesbuildr.com/', pendingVerification: true, steps: [{ action: 'Sign in to your SalesBuildr tenant.' }, { action: 'Navigate to API settings to generate an API key.' }, { action: 'Save the key to SALESBUILDR_API_KEY.' }, { action: 'Optionally set SALESBUILDR_BASE_URL to your tenant-specific URL (e.g., https://mytenant.salesbuildr.com).' }] },
    domains: [
      {
        name: 'Companies',
        description: 'Manage customer company records.',
        tools: [
          { name: 'List companies', description: 'List companies with filtering' },
          { name: 'Get company', description: 'Get company details' },
          { name: 'Create company', description: 'Create a new company' },
          { name: 'Update company', description: 'Update a company record' },
          { name: 'Delete company', description: 'Delete a company' },
        ]
      },
      {
        name: 'Contacts',
        description: 'Manage contacts within companies.',
        tools: [
          { name: 'List contacts', description: 'List contacts with filtering' },
          { name: 'Get contact', description: 'Get contact details' },
          { name: 'Create contact', description: 'Create a new contact' },
          { name: 'Update contact', description: 'Update a contact' },
          { name: 'Delete contact', description: 'Delete a contact' },
        ]
      },
      {
        name: 'Products',
        description: 'Browse the product catalog.',
        tools: [
          { name: 'List products', description: 'List available products' },
          { name: 'Get product', description: 'Get product details and pricing' },
        ]
      },
      {
        name: 'Opportunities',
        description: 'Track sales opportunities.',
        tools: [
          { name: 'List opportunities', description: 'List opportunities with filtering' },
          { name: 'Get opportunity', description: 'Get opportunity details' },
          { name: 'Create opportunity', description: 'Create a new opportunity' },
          { name: 'Update opportunity', description: 'Update an opportunity' },
        ]
      },
      {
        name: 'Quotes',
        description: 'Create and manage sales quotes.',
        tools: [
          { name: 'List quotes', description: 'List quotes with filtering' },
          { name: 'Get quote', description: 'Get quote details' },
          { name: 'Create quote', description: 'Create a new quote' },
        ]
      },
    ],
    architecture: 'Single TypeScript MCP server supporting both stdio and Streamable HTTP transports.',
    installCommand: 'npx @wyre-technology/salesbuildr-mcp',
    dockerAvailable: true,
    mcpbAvailable: false,
  },
  {
    id: 'spamtitan',
    name: 'SpamTitan MCP',
    npmPackage: '@wyre-technology/spamtitan-mcp',
    description: 'MCP server for SpamTitan email security. Manage quarantine, allowlists, blocklists, and view email filtering statistics.',
    category: 'security',
    repoUrl: 'https://github.com/wyre-technology/spamtitan-mcp',
    envVars: [
      { name: 'SPAMTITAN_API_KEY', required: true, description: 'Your SpamTitan API key' },
      { name: 'SPAMTITAN_BASE_URL', required: false, description: 'SpamTitan API base URL (default: https://api-spamtitan.titanhq.com)' },
    ],
    credentialAcquisition: { portalUrl: 'https://www.titanhq.com/spamtitan/', pendingVerification: true, steps: [{ action: 'Sign in to your SpamTitan admin portal.' }, { action: 'Navigate to API settings to generate an API key.' }, { action: 'Save the key to SPAMTITAN_API_KEY.' }, { action: 'Optionally set SPAMTITAN_BASE_URL if using a non-default endpoint (default: https://api-spamtitan.titanhq.com).' }] },
    domains: [
      {
        name: 'Quarantine',
        description: 'View and manage quarantined email messages.',
        tools: [
          { name: 'Get quarantine queue', description: 'List messages in quarantine' },
          { name: 'Release message', description: 'Release a quarantined message to the recipient' },
          { name: 'Delete message', description: 'Delete a quarantined message' },
        ]
      },
      {
        name: 'Allow & Block Lists',
        description: 'Manage sender allowlists and blocklists.',
        tools: [
          { name: 'Manage allowlist', description: 'Add or remove entries from the allowlist' },
          { name: 'Manage blocklist', description: 'Add or remove entries from the blocklist' },
        ]
      },
      {
        name: 'Statistics',
        description: 'View email filtering statistics.',
        tools: [
          { name: 'Get stats', description: 'Get email filtering statistics and summary' },
        ]
      },
    ],
    architecture: 'Single TypeScript MCP server supporting both stdio and Streamable HTTP transports.',
    installCommand: 'npx @wyre-technology/spamtitan-mcp',
    dockerAvailable: true,
    mcpbAvailable: false,
  },
  {
    id: 'xero',
    name: 'Xero MCP',
    npmPackage: '@wyre-technology/xero-mcp',
    description: 'MCP server for Xero accounting. Manage contacts, invoices, payments, chart of accounts, and run financial reports.',
    category: 'accounting',
    repoUrl: 'https://github.com/wyre-technology/xero-mcp',
    envVars: [
      { name: 'XERO_ACCESS_TOKEN', required: true, description: 'OAuth 2.0 access token for Xero' },
      { name: 'XERO_TENANT_ID', required: true, description: 'Your Xero organisation/tenant ID' },
    ],
    credentialAcquisition: {
      portalUrl: 'https://developer.xero.com/',
      prerequisites: [
        'Xero account (any tier with API access)',
        'Xero Developer account at https://developer.xero.com/',
        'Awareness that Xero uses OAuth 2.0; you create a Xero app to issue tokens'
      ],
      steps: [
        { action: 'Sign in to your Xero Developer portal at https://developer.xero.com/.' },
        { action: 'Navigate to My Apps → New App.' },
        { action: 'Select "Web app" (or "Custom connection" for server-to-server).' },
        { action: 'Configure the app: name, company URL, OAuth 2.0 redirect URI per your deployment.' },
        { action: 'Note the Client ID and Client Secret from the app\'s configuration page.' },
        { action: 'Walk through the OAuth 2.0 authorization flow to obtain an access_token + refresh_token.', notes: ['Xero access tokens expire after 30 minutes; refresh_token expires after 60 days of inactivity.', 'See https://developer.xero.com/documentation/guides/oauth2/auth-flow for the canonical flow.'] },
        { action: 'Set XERO_ACCESS_TOKEN and XERO_TENANT_ID (the Xero organisation/tenant ID — call the /connections endpoint after OAuth to retrieve it).' }
      ],
      requiredScopes: [
        'accounting.transactions (for invoicing, payments)',
        'accounting.contacts (for contact lookups)',
        'accounting.settings (for organisation/account list)',
        'Adjust per the tools you intend to use'
      ],
      formatNotes: 'Access token is a JWT (long, base64). Tenant ID is a GUID.',
      rotationNotes: 'Access token refreshes every 30 min via refresh_token. Refresh_token rotates after 60 days of inactivity — keep gateway active or implement scheduled token refresh.'
    },
    domains: [
      {
        name: 'Contacts',
        description: 'Manage customers and suppliers.',
        tools: [
          { name: 'List contacts', description: 'List contacts with filtering' },
          { name: 'Get contact', description: 'Get contact details' },
          { name: 'Create contact', description: 'Create a new contact' },
          { name: 'Search contacts', description: 'Search contacts by name or email' },
        ]
      },
      {
        name: 'Invoices',
        description: 'Create and manage sales invoices.',
        tools: [
          { name: 'List invoices', description: 'List invoices with filtering' },
          { name: 'Get invoice', description: 'Get invoice details' },
          { name: 'Create invoice', description: 'Create a new invoice' },
          { name: 'Update invoice status', description: 'Approve, void, or submit an invoice' },
        ]
      },
      {
        name: 'Payments',
        description: 'Record and view payments.',
        tools: [
          { name: 'List payments', description: 'List payments with filtering' },
          { name: 'Get payment', description: 'Get payment details' },
          { name: 'Create payment', description: 'Record a payment against an invoice' },
        ]
      },
      {
        name: 'Accounts',
        description: 'Browse the chart of accounts.',
        tools: [
          { name: 'List accounts', description: 'List chart of accounts' },
          { name: 'Get account', description: 'Get account details' },
        ]
      },
      {
        name: 'Reports',
        description: 'Generate financial reports.',
        tools: [
          { name: 'Profit & Loss', description: 'Generate a P&L report' },
          { name: 'Balance Sheet', description: 'Generate a balance sheet report' },
          { name: 'Aged Receivables', description: 'Generate aged receivables report' },
          { name: 'Aged Payables', description: 'Generate aged payables report' },
        ]
      },
    ],
    architecture: 'Single TypeScript MCP server supporting both stdio and Streamable HTTP transports.',
    installCommand: 'npx @wyre-technology/xero-mcp',
    dockerAvailable: true,
    mcpbAvailable: false,
  },
  {
    id: 'abnormal',
    name: 'Abnormal Security MCP',
    npmPackage: '@wyre-technology/abnormal-mcp',
    description: 'MCP server for Abnormal Security — AI-powered email threat detection, message analysis, abuse mailbox triage, and security case investigation.',
    category: 'security',
    repoUrl: 'https://github.com/wyre-technology/abnormal-mcp',
    companionPluginId: 'abnormal-security',
    envVars: [
      { name: 'ABNORMAL_API_TOKEN', required: true, description: 'Abnormal Security API token (generate in the Abnormal portal under Settings → API)' }
    ],
    credentialAcquisition: { portalUrl: 'https://abnormalsecurity.com/', pendingVerification: true, steps: [{ action: 'Sign in to the Abnormal Security portal as an Administrator.' }, { action: 'Navigate to Settings → API to generate an API token.' }, { action: 'Save the token to ABNORMAL_API_TOKEN.' }] },
    domains: [
      {
        name: 'Threats',
        description: 'Detected threat cases with full details and AI analysis.',
        tools: [
          { name: 'abnormal_threats_list', description: 'List detected threat cases (paginated)' },
          { name: 'abnormal_threats_get', description: 'Get full details of a specific threat by ID' }
        ]
      },
      {
        name: 'Messages',
        description: 'Per-threat message inspection: headers, URLs, attachments, AI analysis.',
        tools: [
          { name: 'abnormal_messages_list', description: 'List messages within a threat case' },
          { name: 'abnormal_messages_get', description: 'Get detailed message analysis (headers, URLs, attachments, AI analysis)' }
        ]
      },
      {
        name: 'Remediation',
        description: 'Trigger or check remediation actions for messages.',
        tools: [
          { name: 'abnormal_remediation_manage', description: 'Trigger or check remediation actions for a message' }
        ]
      },
      {
        name: 'Abuse',
        description: 'User-reported phishing via the Abuse Mailbox.',
        tools: [
          { name: 'abnormal_abuse_list', description: 'List phishing emails reported via the Abuse Mailbox' }
        ]
      },
      {
        name: 'Cases',
        description: 'Active security investigation cases.',
        tools: [
          { name: 'abnormal_cases_list', description: 'List active security investigation cases' },
          { name: 'abnormal_cases_get', description: 'Get details of a specific case' }
        ]
      }
    ],
    architecture: 'Decision-tree MCP server — start with abnormal_navigate to select a domain, then call domain-specific tools.',
    installCommand: 'npx @wyre-technology/abnormal-mcp',
    dockerAvailable: true,
    mcpbAvailable: true,
  },
  {
    id: 'avanan',
    name: 'Avanan MCP',
    npmPackage: '@wyre-technology/avanan-mcp',
    description: 'MCP server for Check Point Avanan (Harmony Email & Collaboration) — email security events, anti-phishing actions, exception management, and threat search.',
    category: 'security',
    repoUrl: 'https://github.com/wyre-technology/avanan-mcp',
    companionPluginId: 'checkpoint-avanan',
    envVars: [
      { name: 'CHECKPOINT_CLIENT_ID', required: true, description: 'Check Point Infinity Portal API key (Client ID)' },
      { name: 'CHECKPOINT_CLIENT_SECRET', required: true, description: 'Check Point Infinity Portal API secret' },
      { name: 'CHECKPOINT_REGION', required: true, description: 'Check Point region (e.g., us, eu, ap)' }
    ],
    credentialAcquisition: { portalUrl: 'https://portal.checkpoint.com/', pendingVerification: true, prerequisites: ['Check Point Infinity Portal account with API access enabled'], steps: [{ action: 'Sign in to the Check Point Infinity Portal.' }, { action: 'Navigate to Global Settings → API Keys.' }, { action: 'Generate a new API key (Client ID + Secret).' }, { action: 'Set CHECKPOINT_CLIENT_ID, CHECKPOINT_CLIENT_SECRET, and CHECKPOINT_REGION (us, eu, ap).' }] },
    domains: [
      {
        name: 'Events',
        description: 'Email security events — phishing, malware, BEC, DLP detections.',
        tools: [
          { name: 'List events', description: 'List Avanan security events with filters' },
          { name: 'Get event', description: 'Get details for a specific event' }
        ]
      },
      {
        name: 'Actions',
        description: 'Take action on detected threats — quarantine, release, restore.',
        tools: [
          { name: 'Quarantine message', description: 'Quarantine an email message' },
          { name: 'Release message', description: 'Release a quarantined message' }
        ]
      },
      {
        name: 'Exceptions',
        description: 'Manage allowlist / blocklist exception rules.',
        tools: [
          { name: 'List exceptions', description: 'List exception rules' },
          { name: 'Create exception', description: 'Create a new exception rule' }
        ]
      },
      {
        name: 'Search',
        description: 'Search messages and events across the tenant.',
        tools: [
          { name: 'Search messages', description: 'Search messages by sender, subject, recipient, time range' }
        ]
      }
    ],
    architecture: 'Single TypeScript MCP server with flat tool exposure, authenticating via Check Point Infinity Portal OAuth client credentials.',
    installCommand: 'npx @wyre-technology/avanan-mcp',
    dockerAvailable: true,
    mcpbAvailable: true,
  },
  {
    id: 'ironscales',
    name: 'Ironscales MCP',
    npmPackage: '@wyre-technology/ironscales-mcp',
    description: 'MCP server for Ironscales — phishing incident management, email classification, allowlist management, and automated remediation.',
    category: 'security',
    repoUrl: 'https://github.com/wyre-technology/ironscales-mcp',
    companionPluginId: 'ironscales',
    envVars: [
      { name: 'IRONSCALES_API_KEY', required: true, description: 'Ironscales API key (generate in the Ironscales partner portal)' },
      { name: 'IRONSCALES_COMPANY_ID', required: true, description: 'Ironscales company / tenant identifier' }
    ],
    credentialAcquisition: { portalUrl: 'https://portal.ironscales.com/', pendingVerification: true, prerequisites: ['Ironscales partner portal access'], steps: [{ action: 'Sign in to the Ironscales partner portal.' }, { action: 'Navigate to API settings to generate an API key.' }, { action: 'Save the key to IRONSCALES_API_KEY.' }, { action: 'Set IRONSCALES_COMPANY_ID to your tenant identifier.' }] },
    domains: [
      {
        name: 'Incidents',
        description: 'Phishing incident lifecycle — list, classify, resolve.',
        tools: [
          { name: 'ironscales_incidents_list', description: 'List incidents with filters' },
          { name: 'ironscales_incidents_get', description: 'Get incident details' },
          { name: 'ironscales_incidents_classify', description: 'Classify an incident (phishing / safe / spam)' }
        ]
      },
      {
        name: 'Allowlist',
        description: 'Manage sender / domain allowlist entries.',
        tools: [
          { name: 'ironscales_allowlist_list', description: 'List allowlist entries' },
          { name: 'ironscales_allowlist_add', description: 'Add a sender or domain to the allowlist' },
          { name: 'ironscales_allowlist_remove', description: 'Remove an allowlist entry' }
        ]
      },
      {
        name: 'Email',
        description: 'Per-email metadata and analysis.',
        tools: [
          { name: 'ironscales_email_get', description: 'Get email metadata and analysis' }
        ]
      },
      {
        name: 'Remediation',
        description: 'Mailbox-wide remediation actions.',
        tools: [
          { name: 'ironscales_remediation_apply', description: 'Apply remediation action across affected mailboxes' }
        ]
      },
      {
        name: 'Stats',
        description: 'Tenant-level phishing statistics and reporting.',
        tools: [
          { name: 'ironscales_stats_summary', description: 'Get tenant-level phishing statistics summary' }
        ]
      }
    ],
    architecture: 'Decision-tree MCP server with per-domain handlers and Streamable HTTP transport for hosted deployments.',
    installCommand: 'npx @wyre-technology/ironscales-mcp',
    dockerAvailable: true,
    mcpbAvailable: true,
  },
  {
    id: 'knowbe4',
    name: 'KnowBe4 MCP',
    npmPackage: '@wyre-technology/knowbe4-mcp',
    description: 'MCP server for KnowBe4 — security awareness training enrollment, phishing simulation results, user risk scoring, and group management.',
    category: 'security',
    repoUrl: 'https://github.com/wyre-technology/knowbe4-mcp',
    companionPluginId: 'knowbe4',
    envVars: [
      { name: 'KNOWBE4_API_KEY', required: true, description: 'KnowBe4 API key (generate under Account Settings → API)' },
      { name: 'KNOWBE4_REGION', required: false, description: 'KnowBe4 region: us | eu | ca | uk | de (defaults to us)' },
      { name: 'KNOWBE4_BASE_URL', required: false, description: 'Explicit base URL override (alternative to region)' }
    ],
    credentialAcquisition: {
      portalUrl: 'https://www.knowbe4.com/',
      prerequisites: [
        'KnowBe4 account with Administrator role (required to access Account Settings)',
        'Knowledge of your KnowBe4 deployment region (us | eu | ca | uk | de — visible in your KB4 portal URL)'
      ],
      steps: [
        { action: 'Sign in to your KnowBe4 console as an Administrator.' },
        { action: 'Click the user icon (top-right) → Account Settings.' },
        { action: 'Navigate to Account Integrations → API.' },
        { action: 'Click "Generate Token" to create a new Reporting API token.', notes: ['KnowBe4 reads-only by default; the token is for reporting/analytics, not write-access to training assignments.'] },
        { action: 'Copy the generated token (shown once) to KNOWBE4_API_KEY.' },
        { action: 'Set KNOWBE4_REGION to your deployment region (us is default; eu / ca / uk / de if applicable).' }
      ],
      requiredScopes: [
        'KnowBe4 Reporting API tokens are scoped at the account level — no per-endpoint scope selection is available.'
      ],
      formatNotes: 'API token is a long random string. KNOWBE4_REGION enum: us | eu | ca | uk | de.',
      rotationNotes: 'Generate a new token via Account Settings → API; the old token remains valid in parallel until you explicitly revoke it.'
    },
    domains: [
      {
        name: 'Account',
        description: 'Tenant account metadata and subscription info.',
        tools: [
          { name: 'knowbe4_account_get', description: 'Get account / subscription details' }
        ]
      },
      {
        name: 'Users',
        description: 'Manage trainees and user risk scores.',
        tools: [
          { name: 'knowbe4_users_list', description: 'List users with filters' },
          { name: 'knowbe4_users_get', description: 'Get user details + risk score' }
        ]
      },
      {
        name: 'Groups',
        description: 'User group membership for training enrollment.',
        tools: [
          { name: 'knowbe4_groups_list', description: 'List groups' },
          { name: 'knowbe4_groups_get', description: 'Get group details and members' }
        ]
      },
      {
        name: 'Training',
        description: 'Training campaign enrollment and progress.',
        tools: [
          { name: 'knowbe4_training_campaigns_list', description: 'List training campaigns' },
          { name: 'knowbe4_training_enrollments_list', description: 'List enrollments for a campaign' }
        ]
      },
      {
        name: 'Phishing',
        description: 'Phishing simulation campaigns and per-user results.',
        tools: [
          { name: 'knowbe4_phishing_campaigns_list', description: 'List phishing simulation campaigns' },
          { name: 'knowbe4_phishing_results_list', description: 'List per-user phishing simulation results' }
        ]
      },
      {
        name: 'Reporting',
        description: 'Aggregate reporting on training + phishing performance.',
        tools: [
          { name: 'knowbe4_reporting_summary', description: 'Get tenant-level training + phishing summary' }
        ]
      }
    ],
    architecture: 'Decision-tree MCP server with per-domain handlers, supporting multiple KnowBe4 regions (US/EU/CA/UK/DE).',
    installCommand: 'npx @wyre-technology/knowbe4-mcp',
    dockerAvailable: true,
    mcpbAvailable: true,
  },
  {
    id: 'mimecast',
    name: 'Mimecast MCP',
    npmPackage: '@wyre-technology/mimecast-mcp',
    description: 'MCP server for Mimecast Email Security — message tracking, threat intelligence search, and held-message queue management.',
    category: 'security',
    repoUrl: 'https://github.com/wyre-technology/mimecast-mcp',
    companionPluginId: 'mimecast',
    envVars: [
      { name: 'MIMECAST_CLIENT_ID', required: true, description: 'Mimecast API 2.0 client ID' },
      { name: 'MIMECAST_CLIENT_SECRET', required: true, description: 'Mimecast API 2.0 client secret' },
      { name: 'MIMECAST_REGION', required: true, description: 'Mimecast region: us | eu | de | za | au | jer | offshore' }
    ],
    credentialAcquisition: { portalUrl: 'https://www.mimecast.com/', pendingVerification: true, prerequisites: ['Mimecast administration portal access', 'Mimecast API 2.0 enabled on your account'], steps: [{ action: 'Sign in to your Mimecast Administration Console.' }, { action: 'Navigate to Services → API Integrations.' }, { action: 'Create a new API 2.0 integration; save Client ID and Client Secret.' }, { action: 'Set MIMECAST_CLIENT_ID, MIMECAST_CLIENT_SECRET, and MIMECAST_REGION (us, eu, de, za, au, jer, or offshore per your deployment).' }] },
    domains: [
      {
        name: 'Messages',
        description: 'Search and trace email messages flowing through Mimecast.',
        tools: [
          { name: 'mimecast_messages_search', description: 'Search messages by sender / recipient / subject / time range' },
          { name: 'mimecast_messages_trace', description: 'Trace a specific message through the Mimecast pipeline' }
        ]
      },
      {
        name: 'Threats',
        description: 'Threat intelligence and URL / attachment detections.',
        tools: [
          { name: 'mimecast_threats_list', description: 'List detected threats with filters' },
          { name: 'mimecast_threats_get', description: 'Get full threat record by ID' }
        ]
      },
      {
        name: 'Queue',
        description: 'Held / quarantined message queue management.',
        tools: [
          { name: 'mimecast_queue_list', description: 'List held / quarantined messages' },
          { name: 'mimecast_queue_release', description: 'Release a held message to its recipient' },
          { name: 'mimecast_queue_reject', description: 'Reject a held message' }
        ]
      }
    ],
    architecture: 'Single TypeScript MCP server using Mimecast API 2.0 OAuth client credentials, supporting all Mimecast cloud regions.',
    installCommand: 'npx @wyre-technology/mimecast-mcp',
    dockerAvailable: true,
    mcpbAvailable: true,
  },
  {
    id: 'proofpoint',
    name: 'Proofpoint MCP',
    npmPackage: '@wyre-technology/proofpoint-mcp',
    description: 'MCP server for Proofpoint Email Protection — TAP (Targeted Attack Protection), threat intelligence, URL Defense, DLP, forensics, and quarantine management.',
    category: 'security',
    repoUrl: 'https://github.com/wyre-technology/proofpoint-mcp',
    companionPluginId: 'proofpoint',
    envVars: [
      { name: 'PROOFPOINT_SERVICE_PRINCIPAL', required: true, description: 'Proofpoint TAP service principal' },
      { name: 'PROOFPOINT_SERVICE_SECRET', required: true, description: 'Proofpoint TAP service secret' },
      { name: 'PROOFPOINT_BASE_URL', required: false, description: 'Explicit base URL override (defaults to TAP production endpoint)' }
    ],
    credentialAcquisition: { portalUrl: 'https://www.proofpoint.com/', pendingVerification: true, prerequisites: ['Proofpoint TAP (Targeted Attack Protection) license + admin access'], steps: [{ action: 'Sign in to the Proofpoint TAP admin portal.' }, { action: 'Navigate to Settings → Connected Applications or similar to create a service principal.' }, { action: 'Generate a service principal + secret pair.' }, { action: 'Set PROOFPOINT_SERVICE_PRINCIPAL and PROOFPOINT_SERVICE_SECRET.' }, { action: 'Optionally set PROOFPOINT_BASE_URL if using a non-default endpoint.' }] },
    domains: [
      {
        name: 'TAP (Targeted Attack Protection)',
        description: 'Targeted attack campaigns and threat actor tracking.',
        tools: [
          { name: 'proofpoint_tap_campaigns_list', description: 'List TAP campaigns' },
          { name: 'proofpoint_tap_threats_list', description: 'List TAP threats' }
        ]
      },
      {
        name: 'Threat Intel',
        description: 'Threat intelligence enrichment for indicators (URLs, hashes, IPs).',
        tools: [
          { name: 'proofpoint_threat_intel_lookup', description: 'Look up a threat indicator (URL / hash / IP)' }
        ]
      },
      {
        name: 'URL Defense',
        description: 'URL Defense rewrites and click-tracking.',
        tools: [
          { name: 'proofpoint_url_defense_decode', description: 'Decode a URL Defense rewritten link' }
        ]
      },
      {
        name: 'Events',
        description: 'Email security events stream.',
        tools: [
          { name: 'proofpoint_events_list', description: 'List recent email security events' }
        ]
      },
      {
        name: 'People',
        description: 'Very Attacked Persons (VAPs) and per-user risk.',
        tools: [
          { name: 'proofpoint_people_vap_list', description: 'List Very Attacked Persons (VAPs)' }
        ]
      },
      {
        name: 'Forensics',
        description: 'Per-threat forensic detail.',
        tools: [
          { name: 'proofpoint_forensics_get', description: 'Get forensic details for a threat' }
        ]
      },
      {
        name: 'Quarantine',
        description: 'Held / quarantined message inspection and release.',
        tools: [
          { name: 'proofpoint_quarantine_list', description: 'List quarantined messages' },
          { name: 'proofpoint_quarantine_release', description: 'Release a quarantined message' }
        ]
      },
      {
        name: 'DLP',
        description: 'Data loss prevention incidents.',
        tools: [
          { name: 'proofpoint_dlp_incidents_list', description: 'List DLP incidents' }
        ]
      },
      {
        name: 'Policy',
        description: 'Email security policy inspection.',
        tools: [
          { name: 'proofpoint_policy_list', description: 'List configured email security policies' }
        ]
      },
      {
        name: 'Smart Search',
        description: 'Smart search across the email security corpus.',
        tools: [
          { name: 'proofpoint_smart_search_query', description: 'Run a smart search query' }
        ]
      },
      {
        name: 'Reports',
        description: 'Aggregate security reports.',
        tools: [
          { name: 'proofpoint_reports_summary', description: 'Get summary report' }
        ]
      }
    ],
    architecture: 'Single TypeScript MCP server with comprehensive flat tool exposure across TAP, threat intel, URL Defense, DLP, forensics, and policy domains.',
    installCommand: 'npx @wyre-technology/proofpoint-mcp',
    dockerAvailable: true,
    mcpbAvailable: true,
  },
  {
    id: 'rootly',
    name: 'Rootly MCP',
    npmPackage: '@wyre-technology/rootly-mcp',
    description: 'MCP server for Rootly incident management — incidents, alerts, on-call schedules, teams, and severity management.',
    category: 'security',
    repoUrl: 'https://github.com/wyre-technology/rootly-mcp',
    companionPluginId: 'rootly',
    envVars: [
      { name: 'ROOTLY_API_KEY', required: true, description: 'Rootly API key (generate in Rootly under Settings → API Keys)' }
    ],
    credentialAcquisition: { portalUrl: 'https://app.rootly.com/', pendingVerification: true, steps: [{ action: 'Sign in to your Rootly account.' }, { action: 'Navigate to Settings → API Keys.' }, { action: 'Generate a new API key.' }, { action: 'Save to ROOTLY_API_KEY.' }] },
    domains: [
      {
        name: 'Incidents',
        description: 'Incident lifecycle — list, get, create, update, resolve.',
        tools: [
          { name: 'rootly_incidents_list', description: 'List incidents with optional status/severity filters' },
          { name: 'rootly_incidents_get', description: 'Get a single incident by ID' },
          { name: 'rootly_incidents_create', description: 'Create a new incident' },
          { name: 'rootly_incidents_update', description: 'Update title, summary, status, or severity' },
          { name: 'rootly_incidents_resolve', description: 'Resolve an incident' }
        ]
      },
      {
        name: 'Alerts',
        description: 'Alert lifecycle — list, acknowledge, resolve, create, update.',
        tools: [
          { name: 'rootly_alerts_list', description: 'List alerts with optional status filter' },
          { name: 'rootly_alerts_acknowledge', description: 'Acknowledge an alert' },
          { name: 'rootly_alerts_resolve', description: 'Resolve an alert' },
          { name: 'rootly_alerts_create', description: 'Create a new alert' },
          { name: 'rootly_alerts_update', description: 'Update alert status or summary' }
        ]
      },
      {
        name: 'Schedules',
        description: 'On-call schedule visibility.',
        tools: [
          { name: 'rootly_schedules_list', description: 'List on-call schedules' },
          { name: 'rootly_schedules_get', description: 'Get a single on-call schedule' }
        ]
      },
      {
        name: 'Org',
        description: 'Org-level lookups: teams, severities, current user.',
        tools: [
          { name: 'rootly_org_list_teams', description: 'List teams' },
          { name: 'rootly_org_list_severities', description: 'List severity levels' },
          { name: 'rootly_org_current_user', description: 'Get current authenticated user' }
        ]
      }
    ],
    architecture: 'Decision-tree MCP server — start with rootly_navigate to select a domain, then call domain-specific tools.',
    installCommand: 'npx @wyre-technology/rootly-mcp',
    dockerAvailable: true,
    mcpbAvailable: true,
  },
  {
    id: 'sherweb',
    name: 'Sherweb MCP',
    npmPackage: '@wyre-technology/sherweb-mcp',
    description: 'MCP server for Sherweb Partner API — distributor billing, service provider customers, subscriptions, and payable charges.',
    category: 'sales',
    repoUrl: 'https://github.com/wyre-technology/sherweb-mcp',
    companionPluginId: 'sherweb',
    envVars: [
      { name: 'SHERWEB_CLIENT_ID', required: true, description: 'Sherweb Partner API client ID' },
      { name: 'SHERWEB_CLIENT_SECRET', required: true, description: 'Sherweb Partner API client secret' },
      { name: 'SHERWEB_SUBSCRIPTION_KEY', required: true, description: 'Sherweb subscription key (per Partner API tenant)' }
    ],
    credentialAcquisition: { portalUrl: 'https://www.sherweb.com/partners/', pendingVerification: true, prerequisites: ['Sherweb Partner account with Partner API access'], steps: [{ action: 'Sign in to your Sherweb Partner portal.' }, { action: 'Navigate to API access to generate Client ID + Client Secret pair.' }, { action: 'Obtain a per-tenant Subscription Key for the Partner API tier.' }, { action: 'Set SHERWEB_CLIENT_ID, SHERWEB_CLIENT_SECRET, and SHERWEB_SUBSCRIPTION_KEY.' }] },
    domains: [
      {
        name: 'Customers',
        description: 'Manage end-customer organizations under your Sherweb partner account.',
        tools: [
          { name: 'sherweb_customers_list', description: 'List end-customers' },
          { name: 'sherweb_customers_get', description: 'Get customer details' }
        ]
      },
      {
        name: 'Subscriptions',
        description: 'Subscription inventory and lifecycle.',
        tools: [
          { name: 'sherweb_subscriptions_list', description: 'List subscriptions across customers' },
          { name: 'sherweb_subscriptions_get', description: 'Get a single subscription' }
        ]
      },
      {
        name: 'Catalog',
        description: 'Available product catalog from Sherweb.',
        tools: [
          { name: 'sherweb_catalog_list', description: 'List catalog products' },
          { name: 'sherweb_catalog_get', description: 'Get product details' }
        ]
      },
      {
        name: 'Billing',
        description: 'Payable charges and billing items.',
        tools: [
          { name: 'sherweb_billing_payables_list', description: 'List payable charges' },
          { name: 'sherweb_billing_payables_get', description: 'Get a single payable charge' }
        ]
      }
    ],
    architecture: 'Single TypeScript MCP server with per-domain handlers, authenticating via Sherweb Partner API OAuth (client credentials + subscription key).',
    installCommand: 'npx @wyre-technology/sherweb-mcp',
    dockerAvailable: true,
    mcpbAvailable: true,
  },
];

export function getMcpServerById(id: string): McpServer | undefined {
  return mcpServers.find(s => s.id === id);
}

export function getMcpServersByCategory(category: 'psa' | 'rmm' | 'documentation' | 'security' | 'accounting' | 'network' | 'sales'): McpServer[] {
  return mcpServers.filter(s => s.category === category);
}

export function getMcpServerByPluginId(pluginId: string): McpServer | undefined {
  return mcpServers.find(s => s.companionPluginId === pluginId);
}
