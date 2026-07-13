# Creating custom Claude Code plugin marketplaces

**Any GitHub repository can become a Claude Code plugin marketplace** by adding a `.claude-plugin/marketplace.json` manifest file—no registration process required. Users install your marketplace with `/plugin marketplace add owner/repo`, then browse and install individual plugins from your catalog. The system launched in October 2025 as public beta and is now the primary distribution method for Claude Code extensions.

## The marketplace.json manifest file format

The marketplace manifest lives at `.claude-plugin/marketplace.json` in your repository root. Only three top-level fields are required: `name`, `owner`, and `plugins`.

```json
{
  "$schema": "https://www.schemastore.org/claude-code-marketplace.json",
  "name": "my-marketplace",
  "description": "Custom tools for development teams",
  "version": "1.0.0",
  "owner": {
    "name": "Your Name or Organization",
    "email": "contact@example.com"
  },
  "plugins": [
    {
      "name": "code-formatter",
      "source": "./plugins/formatter",
      "description": "Automatic code formatting on save",
      "version": "2.1.0",
      "category": "development"
    },
    {
      "name": "external-tool",
      "source": {
        "source": "github",
        "repo": "company/deploy-plugin"
      },
      "description": "Deployment automation from external repo"
    }
  ]
}
```

The `plugins` array supports three source types for referencing plugins:

- **Relative paths** for plugins within the same repository: `"source": "./plugins/my-plugin"`
- **GitHub shorthand** for external repositories: `"source": {"source": "github", "repo": "owner/repo"}`
- **Git URLs** for any git host: `"source": {"source": "url", "url": "https://gitlab.com/team/plugin.git"}`

Each plugin entry requires only `name` and `source`. Optional fields include `description`, `version`, `author`, `category`, `tags`, `homepage`, `repository`, and `license`. The `strict` boolean (default `true`) determines whether the referenced plugin must have its own `plugin.json`—setting it to `false` allows the marketplace entry to serve as the complete manifest.

**Reserved marketplace names** that cannot be used include: `claude-code-marketplace`, `claude-plugins-official`, `anthropic-marketplace`, `anthropic-plugins`, `agent-skills`, and `life-sciences`.

## Registering and distributing your marketplace

No formal registration exists. Push your repository to GitHub (or any git host), and users add it directly:

```bash
# GitHub repository format (most common)
/plugin marketplace add yourname/your-marketplace

# Full git URL for non-GitHub hosts
/plugin marketplace add https://gitlab.com/company/plugins.git

# Local path for development testing
/plugin marketplace add ./path/to/marketplace
```

Claude Code downloads the `marketplace.json` catalog and makes its plugins available for installation. The marketplace itself doesn't install any plugins—users selectively install what they need.

For team distribution, configure automatic marketplace availability in `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "team-tools": {
      "source": {
        "source": "github",
        "repo": "your-org/claude-plugins"
      }
    }
  },
  "enabledPlugins": {
    "formatter@team-tools": true
  }
}
```

When team members trust the repository folder, Claude Code automatically installs configured marketplaces.

## CLI commands for marketplace and plugin management

The plugin system exposes both terminal CLI commands (`claude plugin`) and interactive REPL commands (`/plugin`).

**Marketplace management:**
```bash
claude plugin marketplace add owner/repo    # Add a marketplace
claude plugin marketplace list              # List configured marketplaces
claude plugin marketplace update name       # Refresh marketplace catalog
claude plugin marketplace remove name       # Remove marketplace and its plugins
```

**Plugin installation and management:**
```bash
# Install with scope options
claude plugin install formatter@my-marketplace --scope user     # Default: personal, all projects
claude plugin install formatter@my-marketplace --scope project  # Shared in .claude/settings.json
claude plugin install formatter@my-marketplace --scope local    # Personal, this repo only (gitignored)

# Other operations
claude plugin uninstall plugin-name
claude plugin enable plugin-name@marketplace
claude plugin disable plugin-name@marketplace
claude plugin update plugin-name
claude plugin list
```

Running `/plugin` in the REPL opens an interactive browser with Discover, Installed, Search, and Errors tabs.

## Repository structure for valid marketplaces

A minimal marketplace repository requires only the manifest file, but most follow this pattern:

```
my-marketplace/
├── .claude-plugin/
│   └── marketplace.json          # Required: marketplace catalog
├── plugins/
│   ├── plugin-one/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json       # Required: plugin manifest
│   │   ├── commands/             # Slash commands
│   │   ├── agents/               # Agent definitions
│   │   ├── skills/               # Domain knowledge
│   │   └── .mcp.json             # MCP server configs
│   └── plugin-two/
│       └── ...
├── README.md
└── LICENSE
```

**Critical structure rules**: Component directories (`commands/`, `agents/`, `skills/`, `hooks/`) must exist at the plugin root level, not inside `.claude-plugin/`. Only `plugin.json` or `marketplace.json` belongs in the `.claude-plugin/` directory.

## How Anthropic's knowledge-work-plugins is configured

The `anthropics/knowledge-work-plugins` repository demonstrates the standard marketplace pattern with **11 plugins** for knowledge workers. Its structure:

```
knowledge-work-plugins/
├── .claude-plugin/
│   └── marketplace.json
├── bio-research/
├── customer-support/
├── data/
├── enterprise-search/
├── finance/
├── legal/
├── marketing/
├── product-management/
├── productivity/
├── sales/
└── cowork-plugin-management/
```

Each plugin directory contains the standard structure with `.claude-plugin/plugin.json`, optional `commands/`, `skills/`, `agents/`, and `.mcp.json` for tool integrations. The marketplace.json references each plugin with relative paths like `"source": "./sales"`.

Anthropic maintains several official repositories:
- **anthropics/claude-plugins-official**: Curated plugins including TypeScript LSP, PR review, Linear, Notion, Slack, Sentry integrations
- **anthropics/life-sciences**: MCP servers for PubMed, BioRender, Benchling, 10x Genomics
- **anthropics/claude-code**: Bundled plugins for agent SDK development, commit workflows, code review

## Marketplaces versus individual plugins

**Marketplaces are catalogs; plugins are packages.** This distinction is fundamental to the system architecture.

A marketplace repository contains a `marketplace.json` that lists available plugins and their sources. It's a directory—users browse it and choose what to install. A plugin is a self-contained package with commands, agents, skills, hooks, or MCP servers that extends Claude Code's capabilities.

Plugins can exist in three forms:
1. **Within a marketplace** as subdirectories referenced by relative paths
2. **In external repositories** referenced by the marketplace via GitHub or git URLs  
3. **Standalone** without any marketplace, installed via direct repository reference

When `strict: true` (the default), each plugin must have its own `.claude-plugin/plugin.json` manifest. The marketplace entry provides discovery metadata while the plugin manifest provides authoritative configuration. When `strict: false`, the marketplace entry alone suffices—useful for simple plugins without complex configuration.

## Official documentation and resources

Anthropic provides comprehensive documentation at **code.claude.com/docs**:

- **Plugin Marketplaces guide**: https://code.claude.com/docs/en/plugin-marketplaces
- **Create Plugins guide**: https://code.claude.com/docs/en/plugins  
- **Plugins Reference**: https://code.claude.com/docs/en/plugins-reference
- **Discovery guide**: https://code.claude.com/docs/en/discover-plugins

The official blog announcement from October 2025 (claude.com/blog/claude-code-plugins) introduced the system. For editor validation, point `$schema` at the real SchemaStore entry: `https://www.schemastore.org/claude-code-marketplace.json` (SchemaStore also publishes a companion plugin.json schema). The older `https://anthropic.com/claude-code/marketplace.schema.json` URL seen in some manifests returns 404 and should not be used.

## Development and testing workflow

Test plugins locally before publishing:

```bash
# Load plugin directly without installation
claude --plugin-dir ./path/to/my-plugin

# Validate manifest syntax
claude plugin validate .

# Debug plugin loading
claude --debug
```

The debug flag shows plugin loading details, manifest parsing errors, command registration, and MCP server initialization. Common validation errors include missing `name` field, malformed JSON, component directories placed inside `.claude-plugin/` instead of at root level, and incorrect source paths in marketplace.json.

## Conclusion

Creating a Claude Code plugin marketplace requires only a properly formatted `marketplace.json` in a `.claude-plugin/` directory at your repository root. The system is deliberately simple: no registration, no approval process, no hosting requirements beyond git. Official Anthropic marketplaces like `knowledge-work-plugins` demonstrate the pattern of organizing multiple domain-specific plugins within a single repository, each with standardized structure for commands, skills, agents, and MCP server integrations. The distinction between marketplaces (catalogs) and plugins (packages) enables flexible distribution—plugins can live within marketplaces, in separate repositories, or both simultaneously.