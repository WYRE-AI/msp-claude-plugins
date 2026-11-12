# Endpoint script coverage and maintenance

The skill reads these results using tools such as `datto_get_device`;
it never executes the detection scripts. Operators deploy only one standalone
OS script. Each embeds [signatures.tsv](../scripts/signatures.tsv) between
`BEGIN SAI SIGNATURES` / `END SAI SIGNATURES` markers. Signature version and
contract rules are documented in [output-contract.md](output-contract.md).

## Coverage

M = machine; U = every standard user profile, not only the account running
the script. Hits aggregate scope, not user identity. All path/name heuristics
are review evidence; remnants and unofficial packages can match.

| Product / signal | Windows | macOS | Linux |
|------------------|---------|-------|-------|
| ChatGPT desktop (`cg`) | M uninstall/Appx; U Programs/Local/Roaming/package data | M/U Applications; M casks | M package/opt/desktop names; U config/AppImage/desktop names; unofficial clients possible |
| Claude desktop (`cl`) | M uninstall/Appx; U application/package data | M/U Applications; M casks | M package/opt/desktop names; U config/AppImage/desktop names |
| Consumer Microsoft Copilot (`cp`) / M365 hub (`mc`) | M Appx, exact distinct package names plus Microsoft publisher | No native signature; browser signal only | No native signature; browser signal only |
| Gemini desktop (`gm`) / PWA (`gp`) | M publisher-checked uninstall; M/U path heuristic; U PWA shortcut/manifest | M/U Gemini.app; U PWA shortcut/manifest | U PWA manifests and M/U desktop shortcuts only; no invented native package |
| Perplexity (`px`) | M uninstall; M/U known paths | M/U Applications; M casks | M package/opt/desktop names; U config/AppImage/desktop names |
| Cursor (`cu`), Windsurf (`wi`) | M uninstall; M/U known paths | M/U Applications; M casks | M package/opt/desktop names; U config/AppImage/desktop names |
| Ollama (`ol`) | M uninstall/known paths; U paths/data | M/U app; M casks/Cellar; U data | M binaries/unit/package/opt; U config/data; Python library excluded |
| LM Studio (`lm`) | M uninstall/known paths; U paths/data | M/U app; M casks; U data | M package/opt/desktop names; U config/AppImage/data/cache |
| Claude Code (`cc`), Codex (`cx`), Gemini CLI (`gc`), Copilot CLI (`gh`) | M/U scoped npm dirs; U native Claude/Codex executables and legacy gh extension | M global npm/Homebrew; U npm/nvm/native Claude/Codex/legacy gh dirs | M global npm; U npm/nvm/native Claude/Codex/legacy gh dirs |
| aider (`ai`) | U Python/pipx directory heuristic | M Homebrew; U Python/pipx dirs | M/U Python site-packages; U pipx dirs |
| VS Code AI (`ve`, `va`, `vc`, `vr`) | U VS Code/Insiders/VSCodium/Cursor/Windsurf extension dirs | Same U editor variants | Same U editor variants |
| JetBrains AI (`je`, `ja`, `va`) | U Roaming/Local JetBrains plugin dirs | U Library/Application Support/JetBrains plugin dirs | U .local/share/JetBrains IDE/plugin dirs |
| Browser AI (`bc`–`by`, see TSV) | U Chrome/Edge/Brave/Chromium manifests; Firefox extensions.json | Same under Library/Application Support | Same under .config/.mozilla plus selected snap/Flatpak browser profile roots |

Browser manifest-name signals: ChatGPT, Claude, Gemini, Perplexity, Copilot,
Monica, Merlin, Sider, MaxAI, Grammarly **only when its name also indicates
AI/assistant**. No browser extension IDs are claimed verified: every browser
match uses manifest names and requires review. Chromium default-locale
messages are resolved when readable; otherwise partial. Firefox uses active
addons' defaultLocale.name. Built-in browser AI features and web-only visits
are outside this signal. PWA coverage is best effort; a shortcut need not
prove an active installed app.

VS Code identities include GitHub Copilot/Chat, Continue, Cline, and a legacy
Roo directory heuristic (current marketplace listing could not be re-verified).
JetBrains names are heuristics for Copilot, AI Assistant, and Continue;
custom/archived/renamed plugin layouts may be missed. Relevant references:
[VS Code extension locations](https://code.visualstudio.com/api/working-with-extensions/publishing-extension),
[JetBrains plugin directories](https://www.jetbrains.com/help/idea/directories-used-by-the-ide-to-store-settings-caches-plugins-and-logs.html),
[Copilot marketplace identity](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot),
[Continue](https://marketplace.visualstudio.com/items?itemName=Continue.continue),
[Cline](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev).
Gemini native apps now exist: [Windows](https://support.google.com/gemini/answer/18263854),
[Mac](https://support.google.com/gemini/answer/17011627).
Copilot variants: [Windows consumer package](https://learn.microsoft.com/en-nz/windows/client-management/manage-windows-copilot),
[M365 app transition](https://support.microsoft.com/en-us/microsoft-365-copilot/the-microsoft-365-app-transition-to-the-microsoft-365-copilot-app).

## Bounds and dependencies

Scanners never install, run detected applications, load user hives, or send
network requests. Only explicit RMM output adapters write the fixed-format
result. Default stdout writes no endpoint files/registry. Shells use bounded
component globs without following symlinks; PowerShell rejects reparse points.
A skipped link marks partial, even when it is a legitimate launcher or package
manager link. Traversal checks cannot eliminate filesystem replacement races;
this is inventory, not a hostile-filesystem forensic sandbox.

Each matching directory expansion is capped at 2000 entries, metadata at
1 MiB, and scanning has a cooperative 120-second deadline. RPM queries require
an available 10-second timeout helper; otherwise partial. Configure a larger
outer RMM script timeout (for example 180 seconds) to allow result output.
The deadline cannot interrupt an OS call blocked on storage; outer RMM timeout
is the hard stop. No unrestricted recursive search, brew, snap, or flatpak
process is launched. Linux reads dpkg status and snap/Flatpak directory names.

Windows supports PowerShell 5.1/7; prefer a 64-bit elevated runner (32-bit on
64-bit Windows marks partial). It reads both HKLM uninstall paths, already
loaded HKU SIDs, and ProfileList locations; never loads offline hives.
macOS is Bash 3.2-compatible and uses built-in plutil on real Macs. Fixture
runs and Linux use optional Python 3 for JSON, isolated with bytecode disabled;
if browser metadata exists but Python is unavailable, mark partial. No
Python installation is performed. macOS scans /Users and /var/root; Linux
scans /home and /root. Custom/mounted/network homes, nonstandard XDG paths,
portable/remote editors, and hidden alternate install roots are not exhaustive.

## Add or change a signature

Edit TSV rows (ten tab-separated columns; no tabs/newlines inside cells).
Reuse an ID for the same product; allocate a short lowercase ID for a new
product. Document OS, scope, implemented match kind, confidence and source.
Supported kinds: path, uninstall (Windows name + vendor), appx (Windows name
+ declared publisher), package (Linux installed package/directory name),
vscode, jetbrains, manifest, pwa, shortcut. Path patterns are relative to the
machine/profile root and expand a component at a time. Regexes must work in
both POSIX ERE and PowerShell where shared. No arbitrary commands or eval.
Keep browser IDs absent until independently verified; name-only heuristics
must say so. Since one ID can represent several match rows, the compact
reader uses the weakest confidence applicable to that ID/OS/scope.

From the repo root:

```text
node msp-claude-plugins/secops-pack/skills/shadow-ai/scripts/sync-signatures.mjs
node msp-claude-plugins/secops-pack/skills/shadow-ai/scripts/sync-signatures.mjs --check
python3 msp-claude-plugins/secops-pack/skills/shadow-ai/scripts/test-fixtures.py
```

Add a fixture demonstrating the actual detection and a negative case. Run
ShellCheck in Bash mode for macOS and sh mode for Linux, plus PSScriptAnalyzer
where available. Bump script version in all scanners and update the parser's
supported version when behavior changes. Do not hand-edit generated blocks.
Live Windows/macOS/RMM pilots remain the operator's responsibility; fixtures
on Linux verify behavior but cannot exercise those vendor agents or APIs.
