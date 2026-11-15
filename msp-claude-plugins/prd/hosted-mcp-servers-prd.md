# Hosted MCP Servers PRD

> Version: 1.5.0
> Created: 2026-02-05
> Updated: 2026-02-05
> Status: Draft - Awaiting Review

## Overview

This PRD defines the architecture and implementation plan for hosted MCP servers that enable Claude Desktop (and Claude Code) users to connect to MSP tools via OAuth, matching the experience of Anthropic's first-party integrations (Slack, Atlassian, Notion).

### Current State

- **autotask-mcp**: Local MCP server exists, requires API keys in config
- **Other vendors**: No MCP servers, commands use curl with env vars
- **User experience**: Copy/paste API credentials into settings.json

### Target State

- Unified MCP Gateway at `mcp.wyre.ai` with path-based routing per vendor
- OAuth authentication flow - users click "Connect" and authorize via browser
- No local API key management required
- Works seamlessly with Claude Desktop and Claude Code

---

## Architecture

### High-Level Flow

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  Claude Desktop │────▶│    MCP Gateway       │────▶│  Vendor APIs    │
│  or Claude Code │     │  (mcp.wyre.ai)       │     │  (Autotask,     │
└─────────────────┘     │                      │     │   Datto, etc.)  │
        │               │  - OAuth 2.1 + PKCE  │     └─────────────────┘
        │               │  - Credential store  │
        │               │  - Vendor handlers   │
        └──────────────▶└──────────────────────┘
           (browser)             │
                                 ▼
                        ┌──────────────────────┐
                        │  Credential Entry UI │
                        │  (user enters API    │
                        │   keys one time)     │
                        └──────────────────────┘
```

### MCP Server Types by Auth Pattern

| Vendor | Auth Type | OAuth Support | Implementation Complexity |
|--------|-----------|---------------|---------------------------|
| Autotask | API Key + Secret | No native OAuth | Medium - proxy with stored creds |
| Datto RMM | API Key + Secret | No native OAuth | Medium - proxy with stored creds |
| IT Glue | API Key | No native OAuth | Low - proxy with stored creds |
| Syncro | API Key | No native OAuth | Low - proxy with stored creds |
| Atera | API Key | No native OAuth | Low - proxy with stored creds |
| SuperOps | Bearer Token | No native OAuth | Low - proxy with stored creds |
| HaloPSA | OAuth 2.0 | **Yes** | Low - native OAuth passthrough |
| ConnectWise PSA | API Key + Client ID | No native OAuth | Medium - proxy with stored creds |
| ConnectWise Automate | Token-based | No native OAuth | Medium - proxy with stored creds |

### The OAuth Challenge

Most MSP vendors don't support OAuth - they use API keys. Our hosted MCP servers must:

1. **Implement our own OAuth layer** - Users authenticate with our service
2. **Securely store vendor credentials** - Encrypted at rest, per-user
3. **Proxy requests** - MCP server uses stored credentials to call vendor APIs

```
User ──OAuth──▶ Our Auth ──stores──▶ User's API Keys ──▶ Vendor API
```

---

## MCP Gateway Architecture (Recommended)

### Why a Gateway?

Instead of deploying individual MCP servers per vendor, a **unified MCP Gateway** provides:

1. **Single entry point** - One URL, one auth flow, multiple vendors
2. **Simplified infrastructure** - One deployment, not 9+ separate services
3. **Centralized auth** - OAuth 2.1 with PKCE handled once at gateway level
4. **Session-aware routing** - Requests routed to correct vendor based on user context
5. **Easier credential management** - Per-tenant encrypted storage in one place

### Hybrid Architecture: Python Gateway + TypeScript MCP Servers

```
┌─────────────────┐     ┌──────────────────────────────────────────────────┐
│  Claude Desktop │     │         MCP Gateway (Python/FastAPI)             │
│  or Claude Code │────▶│         https://mcp.wyre.ai                      │
└─────────────────┘     │                                                  │
        │               │  ┌─────────────────────────────────────────────┐ │
        │               │  │           OAuth 2.1 + PKCE Layer            │ │
        │               │  │  - User authentication                      │ │
        │               │  │  - Session management                       │ │
        │               │  │  - Token refresh                            │ │
        └───────────────│  └─────────────────────────────────────────────┘ │
           (browser)    │                      │                            │
                        │                      ▼                            │
                        │  ┌─────────────────────────────────────────────┐ │
                        │  │         Credential Store (Encrypted)        │ │
                        │  │  - Per-user vendor API keys                 │ │
                        │  │  - AES-256 encryption at rest               │ │
                        │  │  - Tenant isolation                         │ │
                        │  └─────────────────────────────────────────────┘ │
                        │                      │                            │
                        │  ┌─────────────────────────────────────────────┐ │
                        │  │    Reverse Proxy (NGINX / FastAPI Router)   │ │
                        │  │  - Route /v1/{vendor}/* to MCP server       │ │
                        │  │  - Inject credentials in headers            │ │
                        │  └─────────────────────────────────────────────┘ │
                        └──────────────────────│───────────────────────────┘
                                               │
         ┌─────────────┬───────────────────────┼───────────────┬─────────────┐
         ▼             ▼                       ▼               ▼             ▼
  ┌────────────┐ ┌────────────┐        ┌────────────┐  ┌────────────┐ ┌────────────┐
  │ autotask   │ │ datto-rmm  │        │  itglue    │  │  syncro    │ │   atera    │
  │    mcp     │ │    mcp     │        │    mcp     │  │    mcp     │ │    mcp     │
  │(TypeScript)│ │(TypeScript)│        │(TypeScript)│  │(TypeScript)│ │(TypeScript)│
  │            │ │            │        │            │  │            │ │            │
  │ uses       │ │ uses       │        │ uses       │  │ uses       │ │ uses       │
  │ autotask-  │ │ node-datto-│        │ node-it-   │  │ node-      │ │ node-      │
  │ node       │ │ rmm        │        │ glue       │  │ syncro     │ │ atera      │
  └─────┬──────┘ └─────┬──────┘        └─────┬──────┘  └─────┬──────┘ └─────┬──────┘
        │              │                     │               │             │
        ▼              ▼                     ▼               ▼             ▼
  ┌──────────┐  ┌──────────┐          ┌──────────┐   ┌──────────┐  ┌──────────┐
  │ Autotask │  │ Datto    │          │ IT Glue  │   │  Syncro  │  │  Atera   │
  │   API    │  │   API    │          │   API    │   │   API    │  │   API    │
  └──────────┘  └──────────┘          └──────────┘   └──────────┘  └──────────┘
```

### Why Hybrid Architecture?

| Component | Language | Rationale |
|-----------|----------|-----------|
| **MCP Gateway** | Python | MCP Gateway Registry has auth/routing/credential storage built |
| **MCP Servers** | TypeScript | Leverage our existing node-* libraries |

**Credential Flow:**
1. User authenticates with gateway → enters Datto API key via web UI
2. Gateway stores encrypted credentials in vault
3. Request comes in: `GET /v1/datto-rmm/tools/list`
4. Gateway looks up user's Datto credentials from vault
5. Gateway proxies to `datto-rmm-mcp` with `X-API-Key` / `X-API-Secret` headers
6. TypeScript MCP server uses `node-datto-rmm` with injected credentials
7. Response returned through gateway to client

### Our Existing TypeScript Libraries

| Library | npm Package | Status |
|---------|-------------|--------|
| `node-datto-rmm` | `@wyre-technology/node-datto-rmm` | ✅ Published |
| `node-it-glue` | `@wyre-technology/node-it-glue` | ✅ Published |
| `node-syncro` | `@wyre-technology/node-syncro` | ✅ Published |
| `node-atera` | `@wyre-technology/node-atera` | ✅ Published |
| `node-superops` | `@wyre-technology/node-superops` | ✅ Published |
| `node-halopsa` | `@wyre-technology/node-halopsa` | ✅ Published |
| `autotask-node` | (local) | ✅ In use by autotask-mcp |

---

## GitHub Organization & Repository Structure

### Why a Dedicated GitHub Organization?

The hosted MCP servers are a distinct product from the msp-claude-plugins marketplace. A dedicated GitHub organization provides:

1. **Clear separation of concerns** - Plugins vs hosted infrastructure
2. **Independent access control** - Different maintainers for gateway vs MCP servers
3. **CI/CD isolation** - Separate workflows, secrets, and deployment pipelines
4. **Professional branding** - `wyre-mcp` clearly indicates hosted MCP services
5. **Scalability** - Easy to add new MCP servers without cluttering main org

### Organization Name

**Recommended: `wyre-mcp`**

Alternatives considered:
- `wyre-ai-mcp` - More explicit but longer
- `msp-mcp-servers` - Generic, doesn't brand to Wyre
- `wyremcp` - No separator, harder to read

### Repository Structure

```
github.com/wyre-mcp/
├── mcp-gateway/              # Fork of agentic-community/mcp-gateway-registry
│   ├── Python/FastAPI gateway
│   ├── OAuth 2.1 + PKCE
│   ├── Credential store
│   └── Terraform for Azure Container Apps
│
├── autotask-mcp/             # TypeScript MCP server
│   ├── Uses autotask-node
│   └── Accepts creds via headers
│
├── datto-rmm-mcp/            # TypeScript MCP server
│   ├── Uses @wyre-technology/node-datto-rmm
│   └── Accepts creds via headers
│
├── itglue-mcp/               # TypeScript MCP server
│   ├── Uses @wyre-technology/node-it-glue
│   └── Accepts creds via headers
│
├── syncro-mcp/               # TypeScript MCP server
│   ├── Uses @wyre-technology/node-syncro
│   └── Accepts creds via headers
│
├── atera-mcp/                # TypeScript MCP server
│   ├── Uses @wyre-technology/node-atera
│   └── Accepts creds via headers
│
├── superops-mcp/             # TypeScript MCP server
│   ├── Uses @wyre-technology/node-superops
│   └── Accepts creds via headers
│
├── halopsa-mcp/              # TypeScript MCP server
│   ├── Uses @wyre-technology/node-halopsa
│   └── Native OAuth passthrough
│
├── connectwise-psa-mcp/      # TypeScript MCP server (Phase 2)
│   └── New library needed
│
├── connectwise-automate-mcp/ # TypeScript MCP server (Phase 2)
│   └── New library needed
│
└── .github/                  # Org-level templates
    ├── ISSUE_TEMPLATE/
    ├── PULL_REQUEST_TEMPLATE.md
    └── workflows/            # Reusable workflows
```

### Repository Naming Convention

```
{vendor}-mcp
```

Examples:
- `autotask-mcp` (not `autotask-mcp-server` or `mcp-autotask`)
- `datto-rmm-mcp` (preserves "rmm" for clarity)
- `itglue-mcp` (not `it-glue-mcp` - match API naming)

### Repository Standards

Each MCP server repository should include:

```
{vendor}-mcp/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── tools/                # Tool implementations
│   └── handlers/             # Credential header parsing
├── tests/
├── Dockerfile                # For gateway deployment
├── package.json
├── tsconfig.json
├── README.md
├── CHANGELOG.md
├── LICENSE                   # Apache-2.0 or MIT
└── .github/
    └── workflows/
        ├── ci.yml            # Build, lint, test
        └── release.yml       # Semantic release + Docker push
```

### Deployment Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Organization: wyre-mcp                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   mcp-gateway repo          →  ghcr.io/wyre-mcp/mcp-gateway     │
│   autotask-mcp repo         →  ghcr.io/wyre-mcp/autotask-mcp    │
│   datto-rmm-mcp repo        →  ghcr.io/wyre-mcp/datto-rmm-mcp   │
│   itglue-mcp repo           →  ghcr.io/wyre-mcp/itglue-mcp      │
│   ...                       →  ...                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Azure Container Apps / Docker Compose           │
│                    https://mcp.wyre.ai                           │
└─────────────────────────────────────────────────────────────────┘
```

### Migration from Current Repos

| Current Location | New Location |
|-----------------|--------------|
| `WYRE-AI/autotask-mcp` | `wyre-mcp/autotask-mcp` |
| (new) | `wyre-mcp/mcp-gateway` (fork) |
| (new) | `wyre-mcp/datto-rmm-mcp` |
| (new) | `wyre-mcp/itglue-mcp` |
| (new) | `wyre-mcp/syncro-mcp` |
| (new) | `wyre-mcp/atera-mcp` |
| (new) | `wyre-mcp/superops-mcp` |
| (new) | `wyre-mcp/halopsa-mcp` |

### npm Package Scope

Option A: Use `@wyre-mcp` scope (requires npm org)
```json
"name": "@wyre-mcp/datto-rmm-mcp"
```

Option B: No npm publishing (Docker-only deployment)
- MCP servers run as containers, not installed via npm
- Simplifies distribution, avoids npm scope complexity

**Recommendation**: Option B - Docker-only. These servers are infrastructure, not libraries.

### Existing Gateway Solutions Evaluated

| Solution | Type | Auth | Pros | Cons |
|----------|------|------|------|------|
| **Microsoft MCP Gateway** | Kubernetes-native | Azure Entra ID | Enterprise-ready, SSO | Azure lock-in, complex |
| **Docker MCP Gateway** | Open-source | Configurable | Simple orchestration | No built-in auth |
| **MetaMCP** | Aggregator | None | Combines multiple servers | Docker-only, no auth layer |
| **MCPHub** | Unified hub | Basic | Vendor-agnostic | Early stage, limited docs |

### Recommendation: Fork MCP Gateway Registry

After deeper evaluation, **[MCP Gateway Registry](https://github.com/agentic-community/mcp-gateway-registry)** is the best foundation:

1. **Apache-2.0 license** - Full commercial use allowed
2. **Python/FastAPI** - Familiar stack, easy to extend
3. **OAuth 2.1 + PKCE already built** - `credentials-provider/oauth/` is production-ready
4. **Token refresh service exists** - Background refresher with configurable expiry buffer
5. **Secure file storage** - `.oauth-tokens/` with proper permissions
6. **700+ tests** - Solid test coverage
7. **Infrastructure as Code ready** - Terraform/Bicep adaptable for Azure
8. **Keycloak/Entra integration** - Enterprise SSO if needed later

**What's already built:**
- `credentials-provider/oauth/generic_oauth_flow.py` - Full OAuth 2.0/2.1 with PKCE
- `credentials-provider/token_refresher.py` - Background token refresh service
- `oauth_providers.yaml` - Config-driven multi-provider support
- Automatic MCP config generation for VS Code/Roocode

**What we need to add for MSP vendors:**
1. **API key storage pattern** - Adapt OAuth token storage for API keys
2. **Vendor credential entry UI** - Web pages for users to enter Datto/IT Glue/Syncro keys
3. **Vendor handlers** - Route `/v1/datto-rmm` → DattoHandler using stored credentials
4. **MSP provider configs** - Add vendor definitions to handle API key auth

### Gateway Endpoint Format

Single gateway with path-based routing:
```
https://mcp.wyre.ai/v1/autotask
https://mcp.wyre.ai/v1/datto-rmm
https://mcp.wyre.ai/v1/itglue
https://mcp.wyre.ai/v1/halopsa
https://mcp.wyre.ai/v1/syncro
https://mcp.wyre.ai/v1/atera
https://mcp.wyre.ai/v1/superops
https://mcp.wyre.ai/v1/connectwise-psa
https://mcp.wyre.ai/v1/connectwise-automate
```

### OAuth 2.1 with PKCE

Per MCP spec update (June 2025), use OAuth 2.1 with PKCE:

```
┌──────────────┐                              ┌───────────────────┐
│ Claude Client│                              │   MCP Gateway     │
└──────┬───────┘                              └─────────┬─────────┘
       │                                                │
       │  1. GET /v1/datto-rmm (no token)              │
       │───────────────────────────────────────────────▶│
       │                                                │
       │  2. 401 + WWW-Authenticate: Bearer            │
       │◀───────────────────────────────────────────────│
       │                                                │
       │  3. GET /oauth/authorize?                     │
       │     client_id=claude&                         │
       │     code_challenge=xxx&                       │
       │     redirect_uri=...                          │
       │───────────────────────────────────────────────▶│
       │                                                │
       │  4. Redirect to credential entry page         │
       │◀───────────────────────────────────────────────│
       │                                                │
       │  5. User enters vendor API credentials        │
       │                                                │
       │  6. Redirect back with auth code              │
       │◀───────────────────────────────────────────────│
       │                                                │
       │  7. POST /oauth/token                         │
       │     code=xxx&code_verifier=yyy                │
       │───────────────────────────────────────────────▶│
       │                                                │
       │  8. Access token + refresh token              │
       │◀───────────────────────────────────────────────│
       │                                                │
       │  9. GET /v1/datto-rmm (with token)            │
       │───────────────────────────────────────────────▶│
       │                                                │
       │  10. MCP tool results                         │
       │◀───────────────────────────────────────────────│
```

### Session-Aware Stateful Routing

Gateway maintains session state to:
- Map user sessions to stored credentials
- Route requests to correct vendor handler
- Handle credential refresh/rotation
- Track usage for rate limiting

```typescript
interface GatewaySession {
  userId: string;
  connectedVendors: {
    [vendor: string]: {
      credentialId: string;  // Reference to encrypted cred
      lastUsed: Date;
      tokenExpiry?: Date;
    }
  };
  sessionExpiry: Date;
}
```

---

## Implementation Priority

### Phase 1: Kaseya Stack (Validated Vendors)

Priority order based on:
- Autotask MCP already exists (adapt to hosted)
- Datto RMM and IT Glue complete the Kaseya trifecta
- These are "validated" plugins with production testing

| Priority | Vendor | Effort | Notes |
|----------|--------|--------|-------|
| P0 | **Datto RMM** | Medium | Most requested RMM, critical for Kaseya users |
| P0 | **IT Glue** | Low | Documentation platform, simple API key auth |
| P1 | **Autotask** | Low | Adapt existing autotask-mcp to hosted model |

### Phase 2: Community Vendors

| Priority | Vendor | Effort | Notes |
|----------|--------|--------|-------|
| P1 | HaloPSA | Low | Native OAuth - cleanest implementation |
| P2 | Syncro | Low | Simple API key |
| P2 | Atera | Low | Simple API key |
| P2 | SuperOps | Low | Bearer token |
| P2 | ConnectWise PSA | Medium | Multiple auth components |
| P3 | ConnectWise Automate | Medium | Token-based, complex |

---

## Technical Specifications

### Infrastructure Requirements (Gateway Model)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Cloud Infrastructure                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    MCP Gateway Service                     │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │              OAuth 2.1 + PKCE Provider               │ │  │
│  │  │  - Authorization endpoint                            │ │  │
│  │  │  - Token endpoint                                    │ │  │
│  │  │  - PKCE code challenge verification                  │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │                           │                                │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │              Session Manager                         │ │  │
│  │  │  - User session state                                │ │  │
│  │  │  - Connected vendors tracking                        │ │  │
│  │  │  - Rate limiting per user                            │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │                           │                                │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │              Vendor Handler Router                   │ │  │
│  │  │  /v1/autotask  → AutotaskHandler                     │ │  │
│  │  │  /v1/datto-rmm → DattoRMMHandler                     │ │  │
│  │  │  /v1/itglue    → ITGlueHandler                       │ │  │
│  │  │  /v1/halopsa   → HaloPSAHandler                      │ │  │
│  │  │  /v1/syncro    → SyncroHandler                       │ │  │
│  │  │  /v1/atera     → AteraHandler                        │ │  │
│  │  │  ...                                                 │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Secure Credential Store                       │  │
│  │  - Per-user encrypted API keys (AES-256)                  │  │
│  │  - Per-tenant isolation                                   │  │
│  │  - Audit logging (all credential access)                  │  │
│  │  - Automatic key rotation support                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack (Recommended)

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **MCP Gateway** | Python/FastAPI | Fork MCP Gateway Registry (auth/routing built) |
| **MCP Servers** | Node.js/TypeScript | Use our existing node-* libraries |
| Auth Layer | OAuth 2.1 + PKCE | MCP spec compliant (June 2025), already in Gateway Registry |
| Credential Store | File-based (encrypted) or Vault | Gateway Registry uses `.oauth-tokens/` with 0600 perms |
| Hosting | **Option A**: Azure Container Apps | Matches existing Wyre Azure footprint |
| | **Option B**: Fly.io or Railway | Simpler deployment, lower ops burden |
| | **Option C**: Docker Compose | Development and small deployments |
| Database | PostgreSQL or MongoDB | Sessions, audit logs (Gateway Registry supports both) |
| Cache | Redis (Upstash or ElastiCache) | Session state, rate limiting |

### Dual-Stack Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Compose / K8s                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  mcp-gateway (Python container)                          │   │
│  │  - FastAPI + NGINX                                       │   │
│  │  - Port 443 (external)                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│       ┌──────────────────────┼──────────────────────┐           │
│       ▼                      ▼                      ▼           │
│  ┌──────────┐          ┌──────────┐          ┌──────────┐      │
│  │ autotask │          │ datto-rmm│          │  itglue  │ ...  │
│  │   mcp    │          │   mcp    │          │   mcp    │      │
│  │ (Node.js)│          │ (Node.js)│          │ (Node.js)│      │
│  │ Port 3001│          │ Port 3002│          │ Port 3003│      │
│  └──────────┘          └──────────┘          └──────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Gateway Endpoint Format (Recommended)

Single domain with versioned path routing:
```
https://mcp.wyre.ai/v1/autotask
https://mcp.wyre.ai/v1/datto-rmm
https://mcp.wyre.ai/v1/itglue
https://mcp.wyre.ai/v1/halopsa
https://mcp.wyre.ai/v1/syncro
https://mcp.wyre.ai/v1/atera
https://mcp.wyre.ai/v1/superops
https://mcp.wyre.ai/v1/connectwise-psa
https://mcp.wyre.ai/v1/connectwise-automate
```

OAuth endpoints:
```
https://mcp.wyre.ai/oauth/authorize
https://mcp.wyre.ai/oauth/token
https://mcp.wyre.ai/oauth/revoke
```

User management:
```
https://mcp.wyre.ai/settings          # Manage connected vendors
https://mcp.wyre.ai/settings/vendors  # List connected vendors
https://mcp.wyre.ai/settings/revoke   # Revoke vendor access
```

---

## User Experience

### First-Time Connection (Claude Desktop)

1. User installs MSP plugin
2. Plugin's `.mcp.json` references hosted server:
   ```json
   {
     "mcpServers": {
       "datto-rmm": {
         "type": "http",
         "url": "https://mcp.wyre.ai/datto-rmm/mcp"
       }
     }
   }
   ```
3. Claude Desktop detects unauthenticated state
4. User clicks "Connect Datto RMM"
5. Browser opens → Our OAuth login page
6. User enters their Datto RMM API credentials (one time)
7. Credentials stored securely, session established
8. Claude Desktop now has access to Datto RMM tools

### Subsequent Usage

- Session persists (refresh tokens)
- No re-authentication required
- User can revoke access via settings page

### Credential Entry Page (Our OAuth Flow)

Since vendors don't have OAuth, we provide a secure credential entry page:

```
┌─────────────────────────────────────────────┐
│         Connect Datto RMM                   │
├─────────────────────────────────────────────┤
│                                             │
│  API Key:     [____________________]        │
│  API Secret:  [____________________]        │
│  Platform:    [concord-api ▼      ]         │
│                                             │
│  Your credentials are encrypted and stored  │
│  securely. We never see your raw keys.      │
│                                             │
│  [Get API Keys from Datto]  [Connect]       │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Security Considerations

### Credential Storage

- **Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Key derivation**: Per-user encryption keys derived from master key
- **No plaintext**: Credentials never stored unencrypted
- **Audit logging**: All access logged with timestamps

### Tenant Isolation

- Each user's credentials isolated
- No cross-user data access
- Rate limiting per user

### Compliance

- SOC 2 Type II considerations
- GDPR data residency options (EU hosting)
- Right to deletion (user can remove all stored credentials)

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Credential breach | Encryption + HSM key management |
| API key rotation | Users can update credentials anytime |
| Service outage | Fallback to local MCP server mode |
| Vendor API changes | Versioned MCP servers, graceful degradation |

---

## Datto RMM MCP Server Specification

### Tools to Implement

Based on Datto RMM API capabilities:

| Tool | Description | API Endpoint |
|------|-------------|--------------|
| `datto_list_devices` | List devices with filters | GET /api/v2/account/devices |
| `datto_get_device` | Get device details | GET /api/v2/device/{uid} |
| `datto_list_alerts` | List open alerts | GET /api/v2/account/alerts |
| `datto_resolve_alert` | Resolve an alert | POST /api/v2/alert/{uid}/resolve |
| `datto_list_sites` | List all sites | GET /api/v2/account/sites |
| `datto_get_site` | Get site details | GET /api/v2/site/{uid} |
| `datto_run_quickjob` | Execute a quick job | POST /api/v2/device/{uid}/quickjob |
| `datto_get_audit` | Get device audit data | GET /api/v2/device/{uid}/audit/{type} |

### Authentication

```
Base URL: https://{platform}-api.centrastage.net
Headers:
  Authorization: Bearer {api_key}:{api_secret}
```

---

## IT Glue MCP Server Specification

### Tools to Implement

| Tool | Description | API Endpoint |
|------|-------------|--------------|
| `itglue_search_organizations` | Search organizations | GET /organizations |
| `itglue_get_organization` | Get org details | GET /organizations/{id} |
| `itglue_search_configurations` | Search assets | GET /configurations |
| `itglue_get_configuration` | Get asset details | GET /configurations/{id} |
| `itglue_search_passwords` | Search passwords | GET /passwords |
| `itglue_get_password` | Get password (with audit) | GET /passwords/{id} |
| `itglue_search_documents` | Search documents | GET /documents |
| `itglue_search_flexible_assets` | Search flexible assets | GET /flexible_assets |

### Authentication

```
Base URL: https://api.itglue.com
Headers:
  x-api-key: {api_key}
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Connection success rate | > 95% |
| Auth flow completion | < 60 seconds |
| API latency overhead | < 100ms added |
| Credential storage security | Zero breaches |
| User adoption | 50% of plugin users connect within 30 days |

---

## Implementation Phases

### Phase 0a: GitHub Organization Setup (Day 1)
- [ ] Create `wyre-mcp` GitHub organization
- [ ] Configure org settings (member permissions, required reviews)
- [ ] Create org-level issue/PR templates
- [ ] Set up GitHub Container Registry (ghcr.io/wyre-mcp)
- [ ] Create org secrets for CI/CD (Azure credentials, registry tokens)
- [ ] Fork `agentic-community/mcp-gateway-registry` → `wyre-mcp/mcp-gateway`

### Phase 0b: Fork & Customize MCP Gateway (Week 1-2)
- [ ] Clone fork locally: `wyre-mcp/mcp-gateway`
- [ ] Set up local development environment (Docker Compose)
- [ ] Extend `credentials-provider/` to support API key storage (not just OAuth tokens)
- [ ] Add MSP-specific vendor configs to `oauth_providers.yaml` equivalent
- [ ] Create vendor credential entry UI (FastAPI routes + Jinja2 templates)
- [ ] Customize branding/domain for `mcp.wyre.ai`
- [ ] Deploy to Azure Container Apps using Terraform/Bicep
- [ ] Validate ingress auth works with Keycloak or custom OAuth

### Phase 1: Datto RMM MCP Server (Week 3)
- [ ] Create repo: `wyre-mcp/datto-rmm-mcp`
- [ ] Initialize TypeScript project (MCP SDK + @wyre-technology/node-datto-rmm)
- [ ] Implement tools: list_devices, get_device, list_alerts, resolve_alert, etc.
- [ ] Accept credentials via `X-API-Key` / `X-API-Secret` headers from gateway
- [ ] Create Dockerfile and CI/CD workflow
- [ ] Add gateway route `/v1/datto-rmm/*` → datto-rmm-mcp container
- [ ] Create Datto RMM credential entry page in gateway UI
- [ ] Integration testing with real Datto API
- [ ] Push Docker image to ghcr.io/wyre-mcp/datto-rmm-mcp
- [ ] Deploy alongside gateway

### Phase 2: IT Glue MCP Server (Week 4)
- [ ] Create repo: `wyre-mcp/itglue-mcp`
- [ ] Initialize TypeScript project (MCP SDK + @wyre-technology/node-it-glue)
- [ ] Implement tools: search_organizations, get_password, search_configs, etc.
- [ ] Accept credentials via `X-API-Key` header from gateway
- [ ] Create Dockerfile and CI/CD workflow
- [ ] Add gateway route `/v1/itglue/*` → itglue-mcp container
- [ ] Create IT Glue credential entry page in gateway UI
- [ ] Integration testing with real IT Glue API
- [ ] Push Docker image to ghcr.io/wyre-mcp/itglue-mcp
- [ ] Deploy alongside gateway

### Phase 3: Autotask Migration (Week 5)
- [ ] Fork/transfer `WYRE-AI/autotask-mcp` → `wyre-mcp/autotask-mcp`
- [ ] Adapt to accept credentials via `X-API-Key` / `X-API-Secret` headers
- [ ] Add gateway route `/v1/autotask/*` → autotask-mcp container
- [ ] Create Autotask credential entry page in gateway UI
- [ ] Update Dockerfile and CI/CD for ghcr.io/wyre-mcp
- [ ] Migration guide for existing local MCP users
- [ ] Deploy alongside gateway

### Phase 4: Community Vendor MCP Servers (Weeks 6-9)
- [ ] Create `wyre-mcp/syncro-mcp` (TypeScript + @wyre-technology/node-syncro)
- [ ] Create `wyre-mcp/atera-mcp` (TypeScript + @wyre-technology/node-atera)
- [ ] Create `wyre-mcp/superops-mcp` (TypeScript + @wyre-technology/node-superops)
- [ ] Create `wyre-mcp/halopsa-mcp` (TypeScript + @wyre-technology/node-halopsa, native OAuth)
- [ ] Create `wyre-mcp/connectwise-psa-mcp` (TypeScript, new library needed)
- [ ] Create `wyre-mcp/connectwise-automate-mcp` (TypeScript, new library needed)
- [ ] All repos follow standard structure with Dockerfile + CI/CD

### Phase 5: Production Hardening (Week 11+)
- [ ] Multi-region deployment for latency
- [ ] Enhanced monitoring and alerting
- [ ] Rate limiting per user/vendor
- [ ] Self-service credential rotation
- [ ] SOC 2 compliance documentation

---

## Open Questions

1. ~~**Domain**~~ → **Resolved: `mcp.wyre.ai`**
2. **Pricing**: Free tier? Per-user? Per-organization?
3. **Self-hosting option**: Provide Docker images for on-prem deployment?
4. **Local fallback**: Keep local MCP server option for air-gapped environments?
5. **Multi-tenant**: Support MSP managing multiple client credentials?
6. ~~**Hosting provider**: AWS (Lambda + API Gateway) vs Fly.io vs Railway vs Kubernetes?~~ → **Resolved: Azure Container Apps (matches existing Wyre footprint)**
7. ~~**Gateway vs Individual Servers**~~ → **Resolved: Unified gateway using MCP Gateway Registry as foundation**
8. **Fork strategy**: Fork entire repo or extract just credentials-provider?
9. ~~**GitHub Organization**~~ → **Resolved: `wyre-mcp` org with separate repos per MCP server**
10. ~~**npm Publishing**~~ → **Resolved: Docker-only deployment, no npm packages for MCP servers**

## Architecture Decision: Gateway vs Individual Servers

| Aspect | Individual Servers | Unified Gateway (Recommended) |
|--------|-------------------|------------------------------|
| Deployment complexity | 9+ separate deployments | Single deployment |
| Auth implementation | Per-server OAuth | Centralized OAuth once |
| Credential storage | Per-server stores | Unified credential store |
| Monitoring | Multiple dashboards | Single observability stack |
| Latency | Direct to vendor | +10-20ms routing overhead |
| Scaling | Scale each independently | Scale gateway horizontally |
| Cost | Higher (multiple services) | Lower (single service) |
| Maintenance | Higher (9+ codebases) | Lower (one codebase, handlers) |

**Recommendation**: Start with unified gateway. Individual servers remain an option for vendors requiring special handling or for self-hosted deployments.

---

## Dependencies

- MCP SDK (TypeScript)
- Existing node libraries: node-datto-rmm, node-it-glue (if usable)
- Cloud infrastructure account
- Domain and SSL certificates
- OAuth provider setup

---

## References

### Recommended Foundation
- **[MCP Gateway Registry](https://github.com/agentic-community/mcp-gateway-registry)** - Apache-2.0, Python/FastAPI, 700+ tests (RECOMMENDED)
- [Awesome MCP Gateways](https://github.com/e2b-dev/awesome-mcp-gateways) - Comprehensive list of gateway solutions

### MCP Protocol & SDK
- [MCP SDK Documentation](https://modelcontextprotocol.io/)
- [MCP OAuth 2.1 Specification (June 2025)](https://spec.modelcontextprotocol.io/specification/2025-03-26/basic/authentication/)
- [Anthropic knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins)

### Gateway Solutions Evaluated
- [MCP Mesh (decocms/mesh)](https://github.com/decocms/mesh) - Token vault, OAuth 2.1, BUT: SUL license
- [Jetski (hyprmcp)](https://github.com/hyprmcp/jetski) - OAuth 2.1, DCR, BUT: "still in infancy"
- [Scalekit](https://docs.scalekit.com/mcp/quickstart/) - Commercial, token vault, OAuth 2.1
- [Microsoft MCP Gateway](https://github.com/microsoft/mcp-gateway) - Kubernetes-native, Azure Entra ID
- [Docker MCP Gateway](https://github.com/docker/mcp-gateway) - Open-source orchestration

### Vendor API Documentation
- [Datto RMM API Docs](https://rmm.datto.com/help/en/Content/2SETUP/APIv2.htm)
- [IT Glue API Docs](https://api.itglue.com/developer/)
- [Autotask REST API Docs](https://ww5.autotask.net/help/DeveloperHelp/Content/APIs/REST/REST_API_Home.htm)
- [HaloPSA API Docs](https://halopsa.com/apidoc/)
- [Syncro API Docs](https://api-docs.syncromsp.com/)
- [Atera API Docs](https://app.atera.com/apidocs/)
- [SuperOps GraphQL API](https://developers.superops.ai/)
- [ConnectWise Manage API](https://developer.connectwise.com/Products/Manage/REST)
