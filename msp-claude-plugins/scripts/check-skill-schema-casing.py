#!/usr/bin/env python3
"""
Casing-consistency linter for msp-claude-plugins' autotask skill docs (WYREAI-374).

Diffs the "Tool: X / Args: { ... }" examples embedded in the autotask
SKILL.md files against the live tool schemas in autotask-mcp's
src/handlers/tool.definitions.ts. Flags:
  - CASING: a key in the example matches a real schema property except for case
  - UNKNOWN: a key in the example does not match any schema property at all
  - UNKNOWN_TOOL: the example references a tool name that doesn't exist in the schema

This is deliberately a static example-vs-schema key diff, not a full JSON
Schema / type validator. It needs a local checkout of autotask-mcp (a
separate repo) alongside this one.

Usage:
    python3 scripts/check-skill-schema-casing.py \
        --schema /path/to/autotask-mcp/src/handlers/tool.definitions.ts \
        --skills kaseya/autotask/skills
"""
import argparse
import re
import sys
from pathlib import Path


def top_level_keys(block, key_re, quote_char=None):
    """Walk `block` (starting at its own outer '{') tracking brace depth with
    a plain char scan, capturing keys matched by key_re only when depth==1
    (i.e. directly inside the outer brace, not in a nested object)."""
    keys = set()
    depth = 0
    i = 0
    n = len(block)
    while i < n:
        c = block[i]
        if c == "{":
            depth += 1
            i += 1
            continue
        if c == "}":
            depth -= 1
            i += 1
            continue
        if depth == 1:
            if quote_char is None and (c.isalpha() or c in "_$"):
                m = key_re.match(block, i)
                if m:
                    keys.add(m.group(1))
                    i = m.end()
                    continue
            elif quote_char is not None and c == quote_char:
                m = key_re.match(block, i)
                if m:
                    keys.add(m.group(1))
                    i = m.end()
                    continue
        i += 1
    return keys


JS_KEY_RE = re.compile(r"([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:")
JSON_KEY_RE = re.compile(r'"([a-zA-Z_$][a-zA-Z0-9_$]*)"\s*:')


def resolve_shared_constants(text):
    """Some tool defs point `properties:` at a shared CONST_NAME object instead
    of an inline literal (e.g. CONTRACT_SHELL_PROPERTIES, reused by both
    autotask_create_contract and the per-item schema inside
    autotask_create_contracts_bulk). Returns {const_name: set(keys)}."""
    consts = {}
    for m in re.finditer(r"const ([A-Z_][A-Z0-9_]*)\s*=\s*\{", text):
        const_name = m.group(1)
        brace_start = m.end() - 1
        depth = 0
        j = brace_start
        while j < len(text):
            if text[j] == "{":
                depth += 1
            elif text[j] == "}":
                depth -= 1
                if depth == 0:
                    break
            j += 1
        block = text[brace_start : j + 1]
        consts[const_name] = top_level_keys(block, JS_KEY_RE, quote_char=None)
    return consts


def parse_schema(text):
    """Returns {tool_name: set(property_names)}."""
    consts = resolve_shared_constants(text)
    tools = {}
    name_re = re.compile(r"name:\s*'(autotask_[a-zA-Z0-9_]+)'")
    matches = list(name_re.finditer(text))
    for i, m in enumerate(matches):
        tool_name = m.group(1)
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        block = text[start:end]
        props_idx = block.find("properties:")
        if props_idx == -1:
            tools[tool_name] = set()
            continue
        const_m = re.match(r"properties:\s*([A-Z_][A-Z0-9_]*)", block[props_idx:])
        if const_m and const_m.group(1) in consts:
            tools[tool_name] = consts[const_m.group(1)]
            continue
        brace_start = block.find("{", props_idx)
        depth = 0
        j = brace_start
        while j < len(block):
            if block[j] == "{":
                depth += 1
            elif block[j] == "}":
                depth -= 1
                if depth == 0:
                    break
            j += 1
        props_block = block[brace_start : j + 1]
        tools[tool_name] = top_level_keys(props_block, JS_KEY_RE, quote_char=None)
    return tools


def extract_examples(md_text):
    """Yields (tool_name, {arg_keys}) for every Tool:/Args: fenced example block.

    Finds the Args block's opening '{' and walks forward tracking brace depth
    to find its true matching close, rather than regexing for a fixed
    terminator (one-line and multi-line Args blocks both occur)."""
    header_re = re.compile(r"Tool:\s*(autotask_[a-zA-Z0-9_]+)\s*\n\s*Args:\s*\{")
    for m in header_re.finditer(md_text):
        tool_name = m.group(1)
        brace_start = m.end() - 1  # position of the opening '{'
        depth = 0
        i = brace_start
        n = len(md_text)
        while i < n:
            if md_text[i] == "{":
                depth += 1
            elif md_text[i] == "}":
                depth -= 1
                if depth == 0:
                    break
            i += 1
        args_block = md_text[brace_start : i + 1]
        # Examples use either JSON-style ("key": ...) or JS-object-literal
        # (key: ...) syntax; try both and merge, since which one a given
        # SKILL.md uses is not consistent across this codebase.
        keys = top_level_keys(args_block, JSON_KEY_RE, quote_char='"')
        keys |= top_level_keys(args_block, JS_KEY_RE, quote_char=None)
        yield tool_name, keys


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "--schema",
        required=True,
        type=Path,
        help="Path to autotask-mcp's src/handlers/tool.definitions.ts (a separate repo checkout)",
    )
    parser.add_argument(
        "--skills",
        required=True,
        type=Path,
        help="Path to the autotask skills directory (contains one subdir per skill, each with a SKILL.md)",
    )
    args = parser.parse_args()

    schema_text = args.schema.read_text()
    tools = parse_schema(schema_text)
    print(f"Parsed {len(tools)} tool schemas from {args.schema}", file=sys.stderr)

    findings = []
    for md_path in sorted(args.skills.glob("*/SKILL.md")):
        md_text = md_path.read_text()
        for tool_name, arg_keys in extract_examples(md_text):
            if tool_name not in tools:
                findings.append((md_path, tool_name, None, "UNKNOWN_TOOL"))
                continue
            schema_keys = tools[tool_name]
            schema_keys_lower = {k.lower(): k for k in schema_keys}
            for key in sorted(arg_keys):
                if key in schema_keys:
                    continue
                lower = key.lower()
                if lower in schema_keys_lower:
                    findings.append(
                        (md_path, tool_name, key, f"CASING (schema has '{schema_keys_lower[lower]}')")
                    )
                else:
                    findings.append((md_path, tool_name, key, "UNKNOWN"))

    if not findings:
        print("No mismatches found.")
        return 0

    for path, tool_name, key, kind in findings:
        label = f"arg '{key}'" if key is not None else "(tool name itself)"
        print(f"{path}: {tool_name} {label} -> {kind}")
    print(f"\n{len(findings)} finding(s) across {len(set(f[0] for f in findings))} file(s).")
    return 1


if __name__ == "__main__":
    sys.exit(main())
