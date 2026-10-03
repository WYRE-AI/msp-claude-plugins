import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(packageDir, "../..");

function readJson(file: string): Record<string, unknown> {
  return JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
}

const nested = readJson(path.join(packageDir, "package.json"));
const root = readJson(path.join(repoRoot, "package.json"));

describe("install manifests", () => {
  it("keeps the root GitHub-install manifest aligned with this package", () => {
    for (const key of ["name", "version", "description", "license", "author"] as const) {
      expect(root[key]).toBe(nested[key]);
    }
    expect(root.dependencies).toEqual(nested.dependencies);
    expect(root.engines).toEqual(nested.engines);
    expect(root.keywords).toEqual(nested.keywords);
    expect(root.private).toBeUndefined();
    expect(nested.private).toBeUndefined();
  });

  it("points the root manifest at the built library and refuses npm publish", () => {
    expect(root.main).toBe("./packages/mcp-jev-guardrails/dist/index.js");
    expect(root.types).toBe("./packages/mcp-jev-guardrails/dist/index.d.ts");
    expect(root.exports).toEqual({
      ".": {
        types: "./packages/mcp-jev-guardrails/dist/index.d.ts",
        import: "./packages/mcp-jev-guardrails/dist/index.js",
      },
    });
    expect(root.files).toEqual([
      "packages/mcp-jev-guardrails/dist",
      "packages/mcp-jev-guardrails/README.md",
    ]);
    expect(root.scripts).toMatchObject({
      prepare: "npm run build --prefix packages/mcp-jev-guardrails",
      prepublishOnly: "node scripts/refuse-root-npm-publish.mjs",
    });

    let status = 0;
    let stderr = "";
    try {
      execFileSync(process.execPath, ["scripts/refuse-root-npm-publish.mjs"], {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      const failed = error as { status?: number; stderr?: string };
      status = failed.status ?? 0;
      stderr = failed.stderr ?? "";
    }
    expect(status).toBe(1);
    expect(stderr).toContain("Refusing to publish the repository root.");
  });

  it("builds on install and publishes the package directory to GitHub Packages", () => {
    expect(nested.main).toBe("./dist/index.js");
    expect(nested.types).toBe("./dist/index.d.ts");
    expect(nested.exports).toEqual({
      ".": {
        types: "./dist/index.d.ts",
        import: "./dist/index.js",
      },
    });
    expect(nested.files).toEqual(["dist", "README.md"]);
    expect(nested.scripts).toMatchObject({
      build: "tsc",
      prepare: "npm run build",
      prepublishOnly: "npm test",
    });
    expect(nested.publishConfig).toEqual({
      registry: "https://npm.pkg.github.com",
    });
  });

  it("packs dist and leaves source, tests, and the rest of the repo out", () => {
    const stdout = execFileSync("npm", ["pack", "--dry-run", "--json"], {
      cwd: packageDir,
      encoding: "utf8",
    });
    const packed = JSON.parse(stdout) as Array<{ files: Array<{ path: string }> }>;
    const files = packed[0].files.map((file) => file.path);
    expect(files).toContain("dist/index.js");
    expect(files).toContain("dist/index.d.ts");
    expect(files.some((file) => file.startsWith("src/"))).toBe(false);
    expect(files.some((file) => file.startsWith("tests/"))).toBe(false);
    expect(files.some((file) => file.includes("node_modules"))).toBe(false);
    expect(files).not.toContain(".npmrc");
  });

  it("un-ignores dist for repository-root packs", () => {
    const npmignore = readFileSync(path.join(packageDir, ".npmignore"), "utf8");
    expect(npmignore).toContain("!dist/**");
    const gitignore = readFileSync(path.join(packageDir, ".gitignore"), "utf8");
    expect(gitignore).toContain("dist/");
  });
});
