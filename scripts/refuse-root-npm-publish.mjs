#!/usr/bin/env node
/**
 * The repository root package.json is the GitHub-install manifest for
 * @wyre-ai/mcp-jev-guardrails. Publishing it would ship marketplace paths
 * (`packages/mcp-jev-guardrails/dist`) as the public module layout.
 * Publish the package directory instead.
 */
console.error(
  [
    "Refusing to publish the repository root.",
    "Publish packages/mcp-jev-guardrails to GitHub Packages:",
    "  cd packages/mcp-jev-guardrails && npm ci && npm test && npm publish",
    "Or run the Publish mcp-jev-guardrails workflow.",
    "Git installs use this root manifest; they do not publish it.",
  ].join("\n"),
);
process.exit(1);
