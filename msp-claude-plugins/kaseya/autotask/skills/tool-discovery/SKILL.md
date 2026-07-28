---
name: "Autotask Tool Discovery"
description: >
  The Autotask MCP lazy-loading pattern - four meta-tools (list_categories, list_category_tools,
  execute_tool, router) that expose the full 39+ tool catalog progressively instead of loading
  every tool schema upfront, plus the natural-language router for intent-based tool lookup.
when_to_use: >-
  When Autotask MCP tools aren't loading, when you can't find the right Autotask tool to call, or
  when working with a lazy-loaded MCP connection where only meta-tools are available. Use when:
  autotask tools not loading, can't find autotask tool, autotask tool discovery, which autotask
  tool, autotask lazy loading, autotask mcp not working, discover autotask tools, autotask meta
  tools, or autotask router.
---

# Autotask Tool Discovery & Lazy Loading

## Overview

The Autotask MCP server can run in **lazy loading mode**, where only 4 meta-tools are exposed initially instead of all 39+ tools. This is common on remote MCP connections (e.g., Claude.ai connectors) where loading all tool schemas upfront would be expensive.

If you can see Autotask tools listed but can't call them, or if only a few Autotask tools appear — use this progressive discovery pattern.

## Available Meta-Tools

When lazy loading is active, these 4 tools are always available:

| Meta-Tool | Purpose |
|-----------|---------|
| `autotask_list_categories` | List all tool categories with descriptions |
| `autotask_list_category_tools` | Get full tool schemas for a category |
| `autotask_execute_tool` | Execute any tool by name with arguments |
| `autotask_router` | Describe what you want in natural language, get the right tool |

## Progressive Discovery Pattern

### Step 1: List Available Categories

```
Tool: autotask_list_categories
Args: {}
```

Returns all categories:

| Category | Description |
|----------|-------------|
| `utility` | Connection testing, field/picklist discovery |
| `companies` | Search, create, update companies |
| `contacts` | Search and create contacts |
| `tickets` | Tickets, notes, attachments |
| `projects` | Projects, tasks, project notes |
| `time_and_billing` | Time entries, billing items, expenses |
| `financial` | Quotes, quote items, opportunities, invoices, contracts |
| `products_and_services` | Products, services, service bundles |
| `resources` | Search for technicians/staff |
| `configuration_items` | Assets/devices |
| `company_notes` | Company note management |

### Step 2: Get Tools for a Category

```
Tool: autotask_list_category_tools
Args: { "category": "time_and_billing" }
```

Returns full schemas for every tool in that category, including parameter names, types, descriptions, and required fields.

### Step 3: Execute a Tool

```
Tool: autotask_execute_tool
Args: {
  "toolName": "autotask_search_resources",
  "arguments": { "searchTerm": "Aaron" }
}
```

This executes the tool as if you called it directly. The response format is identical.

## Intelligent Router (Shortcut)

If you're unsure which tool or category to use, skip the discovery steps and use the router:

```
Tool: autotask_router
Args: { "intent": "find tickets for Acme Corp" }
```

The router returns:
- The **recommended tool name**
- **Pre-filled parameters** based on your intent
- A description of what the tool does

### Router Examples

| Intent | Suggested Tool |
|--------|---------------|
| "find tickets for Acme Corp" | `autotask_search_tickets` with company filter |
| "log 2 hours on ticket 12345" | `autotask_create_time_entry` with ticket/hours filled |
| "create a quote for client" | `autotask_create_quote` with company lookup |
| "look up Aaron's resource ID" | `autotask_search_resources` with search term |
| "create an expense report" | `autotask_create_expense_report` |
| "add a firewall to a quote" | `autotask_create_quote_item` with product search |

After the router suggests a tool, use `autotask_execute_tool` to run it.

## When to Use Each Approach

| Situation | Approach |
|-----------|----------|
| Know exactly which tool you need | Call it directly (if schema loaded) or `autotask_execute_tool` |
| Know the category but not the tool | `autotask_list_category_tools` → `autotask_execute_tool` |
| Don't know where to start | `autotask_list_categories` → pick category → explore |
| Natural language request | `autotask_router` → `autotask_execute_tool` |
| Tools aren't loading at all | Start with `autotask_list_categories` to verify connection |

## Common Category → Tool Mapping

### Need to work with expenses?
```
Category: time_and_billing
Tools: autotask_create_expense_report, autotask_create_expense_item,
       autotask_get_expense_report, autotask_search_expense_reports
```

### Need to build a quote?
```
Category: financial
Tools: autotask_create_quote, autotask_create_quote_item,
       autotask_update_quote_item, autotask_delete_quote_item,
       autotask_search_quotes, autotask_get_quote
```

### Need to find a person?
```
Category: resources
Tools: autotask_search_resources
```

### Need to log time?
```
Category: time_and_billing
Tools: autotask_create_time_entry, autotask_search_time_entries
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No Autotask tools visible at all | Check MCP connection status; verify API credentials |
| Only 3-4 tools visible | Lazy loading is active — use the meta-tools above |
| `autotask_execute_tool` returns error | Check tool name spelling; use `autotask_list_category_tools` to verify |
| Router suggests wrong tool | Be more specific in your intent description |
| Tool exists but returns auth error | API user may lack permissions for that entity type |

## Best Practices

1. **Start with the router** when handling a user request — it's the fastest path to the right tool
2. **Cache category knowledge** — once you've listed categories, you don't need to list them again in the same session
3. **Use execute_tool** for all calls when in lazy loading mode — don't try to call tools directly if their schemas aren't loaded
4. **Fall back gracefully** — if one approach doesn't work, try another (router → category listing → direct execute)

## Related Skills

- [Autotask API Patterns](../api-patterns/SKILL.md) - Query building and authentication
- [Autotask Tickets](../tickets/SKILL.md) - Ticket management
- [Autotask Expenses](../expenses/SKILL.md) - Expense report management
- [Autotask Quotes](../quotes/SKILL.md) - Quote and line item management
