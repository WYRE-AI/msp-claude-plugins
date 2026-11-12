#requires -Version 5.1
[CmdletBinding()]
param(
    [ValidateSet('stdout','datto','ninjaone','ncentral','syncro','superops','cwautomate','atera','kaseyavsa')]
    [string]$Rmm = 'stdout',
    [ValidatePattern('^[A-Za-z][A-Za-z0-9_]*$')][string]$Field = 'ShadowAIInventory',
    [ValidateRange(1,30)][int]$Udf = 30,
    [ValidateRange(100,65535)][int]$MaxLength = 255
)
# BEGIN SAI SIGNATURES
$SignatureData = @'
id	product	vendor	category	os	scope	kind	pattern	confidence	notes
cg	ChatGPT	OpenAI	desktop	win	m	uninstall	^ChatGPT( |$)	review	Publisher must match OpenAI; uninstall metadata is not a verified binary signature
cg	ChatGPT	OpenAI	desktop	mac	m	path	Applications/ChatGPT.app	review	Name/path evidence; validate publisher before sanction matching
cg	ChatGPT	OpenAI	desktop	mac	u	path	Applications/ChatGPT.app	review	Name/path evidence; validate publisher before sanction matching
cg	ChatGPT	OpenAI	desktop	mac	m	path	opt/homebrew/Caskroom/chatgpt	review	Name/path evidence; validate publisher before sanction matching
cg	ChatGPT	OpenAI	desktop	mac	m	path	usr/local/Caskroom/chatgpt	review	Name/path evidence; validate publisher before sanction matching
cg	ChatGPT	OpenAI	desktop	lin	m	path	opt/chatgpt*	review	Linux unofficial packaging/residue possible; name only, needs review
cg	ChatGPT	OpenAI	desktop	lin	u	path	.config/ChatGPT	review	Linux unofficial packaging/residue possible; name only, needs review
cg	ChatGPT	OpenAI	desktop	lin	u	path	.config/chatgpt	review	Linux unofficial packaging/residue possible; name only, needs review
cg	ChatGPT	OpenAI	desktop	lin	u	path	Applications/*ChatGPT*.AppImage	review	Linux unofficial packaging/residue possible; name only, needs review
cg	ChatGPT	OpenAI	desktop	lin	u	path	Downloads/*ChatGPT*.AppImage	review	Linux unofficial packaging/residue possible; name only, needs review
cg	ChatGPT	OpenAI	desktop	lin	u	path	.local/bin/*chatgpt*.AppImage	review	Linux unofficial packaging/residue possible; name only, needs review
cg	ChatGPT	OpenAI	desktop	lin	m	package	^chatgpt(-desktop)?$	review	Installed package name only; unofficial packages possible
cg	ChatGPT	OpenAI	desktop	win	u	path	AppData/Local/Programs/ChatGPT	review	Name/path evidence; validate publisher before sanction matching
cg	ChatGPT	OpenAI	desktop	win	u	path	AppData/Local/ChatGPT	review	Name/path evidence; validate publisher before sanction matching
cg	ChatGPT	OpenAI	desktop	win	u	path	AppData/Roaming/ChatGPT	review	Name/path evidence; validate publisher before sanction matching
cl	Claude	Anthropic	desktop	win	m	uninstall	^Claude( |$)	review	Publisher must match Anthropic; uninstall metadata is not a verified binary signature
cl	Claude	Anthropic	desktop	mac	m	path	Applications/Claude.app	review	Name/path evidence; validate publisher before sanction matching
cl	Claude	Anthropic	desktop	mac	u	path	Applications/Claude.app	review	Name/path evidence; validate publisher before sanction matching
cl	Claude	Anthropic	desktop	mac	m	path	opt/homebrew/Caskroom/claude	review	Name/path evidence; validate publisher before sanction matching
cl	Claude	Anthropic	desktop	mac	m	path	usr/local/Caskroom/claude	review	Name/path evidence; validate publisher before sanction matching
cl	Claude	Anthropic	desktop	lin	m	path	opt/claude*	review	Linux unofficial packaging/residue possible; name only, needs review
cl	Claude	Anthropic	desktop	lin	u	path	.config/Claude	review	Linux unofficial packaging/residue possible; name only, needs review
cl	Claude	Anthropic	desktop	lin	u	path	.config/claude	review	Linux unofficial packaging/residue possible; name only, needs review
cl	Claude	Anthropic	desktop	lin	u	path	Applications/*Claude*.AppImage	review	Linux unofficial packaging/residue possible; name only, needs review
cl	Claude	Anthropic	desktop	lin	u	path	Downloads/*Claude*.AppImage	review	Linux unofficial packaging/residue possible; name only, needs review
cl	Claude	Anthropic	desktop	lin	u	path	.local/bin/*claude*.AppImage	review	Linux unofficial packaging/residue possible; name only, needs review
cl	Claude	Anthropic	desktop	lin	m	package	^claude(-desktop)?$	review	Installed package name only; unofficial packages possible
cl	Claude	Anthropic	desktop	win	u	path	AppData/Local/Programs/Claude	review	Name/path evidence; validate publisher before sanction matching
cl	Claude	Anthropic	desktop	win	u	path	AppData/Local/Claude	review	Name/path evidence; validate publisher before sanction matching
cl	Claude	Anthropic	desktop	win	u	path	AppData/Roaming/Claude	review	Name/path evidence; validate publisher before sanction matching
cu	Cursor	Anysphere	desktop	win	m	uninstall	^Cursor( |$)	review	Publisher must match Anysphere; uninstall metadata is not a verified binary signature
cu	Cursor	Anysphere	desktop	mac	m	path	Applications/Cursor.app	review	Name/path evidence; validate publisher before sanction matching
cu	Cursor	Anysphere	desktop	mac	u	path	Applications/Cursor.app	review	Name/path evidence; validate publisher before sanction matching
cu	Cursor	Anysphere	desktop	mac	m	path	opt/homebrew/Caskroom/cursor	review	Name/path evidence; validate publisher before sanction matching
cu	Cursor	Anysphere	desktop	mac	m	path	usr/local/Caskroom/cursor	review	Name/path evidence; validate publisher before sanction matching
cu	Cursor	Anysphere	desktop	lin	m	path	opt/cursor*	review	Linux unofficial packaging/residue possible; name only, needs review
cu	Cursor	Anysphere	desktop	lin	u	path	.config/Cursor	review	Linux unofficial packaging/residue possible; name only, needs review
cu	Cursor	Anysphere	desktop	lin	u	path	.config/cursor	review	Linux unofficial packaging/residue possible; name only, needs review
cu	Cursor	Anysphere	desktop	lin	u	path	Applications/*Cursor*.AppImage	review	Linux unofficial packaging/residue possible; name only, needs review
cu	Cursor	Anysphere	desktop	lin	u	path	Downloads/*Cursor*.AppImage	review	Linux unofficial packaging/residue possible; name only, needs review
cu	Cursor	Anysphere	desktop	lin	u	path	.local/bin/*cursor*.AppImage	review	Linux unofficial packaging/residue possible; name only, needs review
cu	Cursor	Anysphere	desktop	lin	m	package	^cursor(-desktop)?$	review	Installed package name only; unofficial packages possible
cu	Cursor	Anysphere	desktop	win	u	path	AppData/Local/Programs/Cursor	review	Name/path evidence; validate publisher before sanction matching
cu	Cursor	Anysphere	desktop	win	u	path	AppData/Local/Cursor	review	Name/path evidence; validate publisher before sanction matching
cu	Cursor	Anysphere	desktop	win	u	path	AppData/Roaming/Cursor	review	Name/path evidence; validate publisher before sanction matching
wi	Windsurf	Cognition	desktop	win	m	uninstall	^Windsurf( |$)	review	Publisher must match Cognition; uninstall metadata is not a verified binary signature
wi	Windsurf	Cognition	desktop	mac	m	path	Applications/Windsurf.app	review	Name/path evidence; validate publisher before sanction matching
wi	Windsurf	Cognition	desktop	mac	u	path	Applications/Windsurf.app	review	Name/path evidence; validate publisher before sanction matching
wi	Windsurf	Cognition	desktop	mac	m	path	opt/homebrew/Caskroom/windsurf	review	Name/path evidence; validate publisher before sanction matching
wi	Windsurf	Cognition	desktop	mac	m	path	usr/local/Caskroom/windsurf	review	Name/path evidence; validate publisher before sanction matching
wi	Windsurf	Cognition	desktop	lin	m	path	opt/windsurf*	review	Linux unofficial packaging/residue possible; name only, needs review
wi	Windsurf	Cognition	desktop	lin	u	path	.config/Windsurf	review	Linux unofficial packaging/residue possible; name only, needs review
wi	Windsurf	Cognition	desktop	lin	u	path	.config/windsurf	review	Linux unofficial packaging/residue possible; name only, needs review
wi	Windsurf	Cognition	desktop	lin	u	path	Applications/*Windsurf*.AppImage	review	Linux unofficial packaging/residue possible; name only, needs review
wi	Windsurf	Cognition	desktop	lin	u	path	Downloads/*Windsurf*.AppImage	review	Linux unofficial packaging/residue possible; name only, needs review
wi	Windsurf	Cognition	desktop	lin	u	path	.local/bin/*windsurf*.AppImage	review	Linux unofficial packaging/residue possible; name only, needs review
wi	Windsurf	Cognition	desktop	lin	m	package	^windsurf(-desktop)?$	review	Installed package name only; unofficial packages possible
wi	Windsurf	Cognition	desktop	win	u	path	AppData/Local/Programs/Windsurf	review	Name/path evidence; validate publisher before sanction matching
wi	Windsurf	Cognition	desktop	win	u	path	AppData/Local/Windsurf	review	Name/path evidence; validate publisher before sanction matching
wi	Windsurf	Cognition	desktop	win	u	path	AppData/Roaming/Windsurf	review	Name/path evidence; validate publisher before sanction matching
px	Perplexity	Perplexity	desktop	win	m	uninstall	^Perplexity( |$)	review	Publisher must match Perplexity; uninstall metadata is not a verified binary signature
px	Perplexity	Perplexity	desktop	mac	m	path	Applications/Perplexity.app	review	Name/path evidence; validate publisher before sanction matching
px	Perplexity	Perplexity	desktop	mac	u	path	Applications/Perplexity.app	review	Name/path evidence; validate publisher before sanction matching
px	Perplexity	Perplexity	desktop	mac	m	path	opt/homebrew/Caskroom/perplexity	review	Name/path evidence; validate publisher before sanction matching
px	Perplexity	Perplexity	desktop	mac	m	path	usr/local/Caskroom/perplexity	review	Name/path evidence; validate publisher before sanction matching
px	Perplexity	Perplexity	desktop	lin	m	path	opt/perplexity*	review	Linux unofficial packaging/residue possible; name only, needs review
px	Perplexity	Perplexity	desktop	lin	u	path	.config/Perplexity	review	Linux unofficial packaging/residue possible; name only, needs review
px	Perplexity	Perplexity	desktop	lin	u	path	.config/perplexity	review	Linux unofficial packaging/residue possible; name only, needs review
px	Perplexity	Perplexity	desktop	lin	u	path	Applications/*Perplexity*.AppImage	review	Linux unofficial packaging/residue possible; name only, needs review
px	Perplexity	Perplexity	desktop	lin	u	path	Downloads/*Perplexity*.AppImage	review	Linux unofficial packaging/residue possible; name only, needs review
px	Perplexity	Perplexity	desktop	lin	u	path	.local/bin/*perplexity*.AppImage	review	Linux unofficial packaging/residue possible; name only, needs review
px	Perplexity	Perplexity	desktop	lin	m	package	^perplexity(-desktop)?$	review	Installed package name only; unofficial packages possible
px	Perplexity	Perplexity	desktop	win	u	path	AppData/Local/Programs/Perplexity	review	Name/path evidence; validate publisher before sanction matching
px	Perplexity	Perplexity	desktop	win	u	path	AppData/Local/Perplexity	review	Name/path evidence; validate publisher before sanction matching
px	Perplexity	Perplexity	desktop	win	u	path	AppData/Roaming/Perplexity	review	Name/path evidence; validate publisher before sanction matching
lm	LM Studio	LM Studio	local-llm	win	m	uninstall	^LM[ -]?Studio( |$)	review	Publisher must match LM Studio; uninstall metadata is not a verified binary signature
lm	LM Studio	LM Studio	local-llm	mac	m	path	Applications/LM Studio.app	review	Name/path evidence; validate publisher before sanction matching
lm	LM Studio	LM Studio	local-llm	mac	u	path	Applications/LM Studio.app	review	Name/path evidence; validate publisher before sanction matching
lm	LM Studio	LM Studio	local-llm	mac	m	path	opt/homebrew/Caskroom/lm-studio	review	Name/path evidence; validate publisher before sanction matching
lm	LM Studio	LM Studio	local-llm	mac	m	path	usr/local/Caskroom/lm-studio	review	Name/path evidence; validate publisher before sanction matching
lm	LM Studio	LM Studio	local-llm	lin	m	path	opt/lm-studio*	review	Linux unofficial packaging/residue possible; name only, needs review
lm	LM Studio	LM Studio	local-llm	lin	u	path	.config/LM Studio	review	Linux unofficial packaging/residue possible; name only, needs review
lm	LM Studio	LM Studio	local-llm	lin	u	path	.config/lm-studio	review	Linux unofficial packaging/residue possible; name only, needs review
lm	LM Studio	LM Studio	local-llm	lin	u	path	Applications/*LM*Studio*.AppImage	review	Linux unofficial packaging/residue possible; name only, needs review
lm	LM Studio	LM Studio	local-llm	lin	u	path	Downloads/*LM*Studio*.AppImage	review	Linux unofficial packaging/residue possible; name only, needs review
lm	LM Studio	LM Studio	local-llm	lin	u	path	.local/bin/*lm-studio*.AppImage	review	Linux unofficial packaging/residue possible; name only, needs review
lm	LM Studio	LM Studio	local-llm	lin	m	package	^lm-studio(-desktop)?$	review	Installed package name only; unofficial packages possible
lm	LM Studio	LM Studio	local-llm	win	u	path	AppData/Local/Programs/LM Studio	review	Name/path evidence; validate publisher before sanction matching
lm	LM Studio	LM Studio	local-llm	win	u	path	AppData/Local/LM Studio	review	Name/path evidence; validate publisher before sanction matching
lm	LM Studio	LM Studio	local-llm	win	u	path	AppData/Roaming/LM Studio	review	Name/path evidence; validate publisher before sanction matching
ol	Ollama	Ollama	local-llm	win	m	uninstall	^Ollama( |$)	review	Publisher must match Ollama; uninstall metadata is not a verified binary signature
ol	Ollama	Ollama	local-llm	mac	m	path	Applications/Ollama.app	review	Name/path evidence; validate publisher before sanction matching
ol	Ollama	Ollama	local-llm	mac	u	path	Applications/Ollama.app	review	Name/path evidence; validate publisher before sanction matching
ol	Ollama	Ollama	local-llm	mac	m	path	opt/homebrew/Caskroom/ollama	review	Name/path evidence; validate publisher before sanction matching
ol	Ollama	Ollama	local-llm	mac	m	path	usr/local/Caskroom/ollama	review	Name/path evidence; validate publisher before sanction matching
ol	Ollama	Ollama	local-llm	lin	m	path	opt/ollama*	review	Linux unofficial packaging/residue possible; name only, needs review
ol	Ollama	Ollama	local-llm	lin	u	path	.config/Ollama	review	Linux unofficial packaging/residue possible; name only, needs review
ol	Ollama	Ollama	local-llm	lin	u	path	.config/ollama	review	Linux unofficial packaging/residue possible; name only, needs review
ol	Ollama	Ollama	local-llm	lin	u	path	Applications/*Ollama*.AppImage	review	Linux unofficial packaging/residue possible; name only, needs review
ol	Ollama	Ollama	local-llm	lin	u	path	Downloads/*Ollama*.AppImage	review	Linux unofficial packaging/residue possible; name only, needs review
ol	Ollama	Ollama	local-llm	lin	u	path	.local/bin/*ollama*.AppImage	review	Linux unofficial packaging/residue possible; name only, needs review
ol	Ollama	Ollama	local-llm	lin	m	package	^ollama(-desktop)?$	review	Installed package name only; unofficial packages possible
ol	Ollama	Ollama	local-llm	win	u	path	AppData/Local/Programs/Ollama	review	Name/path evidence; validate publisher before sanction matching
ol	Ollama	Ollama	local-llm	win	u	path	AppData/Local/Ollama	review	Name/path evidence; validate publisher before sanction matching
ol	Ollama	Ollama	local-llm	win	u	path	AppData/Roaming/Ollama	review	Name/path evidence; validate publisher before sanction matching
ol	Ollama	Ollama	local-llm	mac	u	path	.ollama	review	Data directory can remain after uninstall; needs review
lm	LM Studio	LM Studio	local-llm	mac	u	path	.lmstudio	review	Data directory can remain after uninstall; needs review
lm	LM Studio	LM Studio	local-llm	mac	u	path	.cache/lm-studio	review	Data directory can remain after uninstall; needs review
cc	Claude Code	Anthropic	cli	mac	m	path	usr/local/lib/node_modules/@anthropic-ai/claude-code	high	Scoped npm package directory; not execution evidence
cc	Claude Code	Anthropic	cli	mac	m	path	usr/lib/node_modules/@anthropic-ai/claude-code	high	Scoped npm package directory; not execution evidence
cc	Claude Code	Anthropic	cli	mac	u	path	.npm-global/lib/node_modules/@anthropic-ai/claude-code	high	Scoped npm package directory; not execution evidence
cc	Claude Code	Anthropic	cli	mac	u	path	.local/lib/node_modules/@anthropic-ai/claude-code	high	Scoped npm package directory; not execution evidence
cx	Codex CLI	OpenAI	cli	mac	m	path	usr/local/lib/node_modules/@openai/codex	high	Scoped npm package directory; not execution evidence
cx	Codex CLI	OpenAI	cli	mac	m	path	usr/lib/node_modules/@openai/codex	high	Scoped npm package directory; not execution evidence
cx	Codex CLI	OpenAI	cli	mac	u	path	.npm-global/lib/node_modules/@openai/codex	high	Scoped npm package directory; not execution evidence
cx	Codex CLI	OpenAI	cli	mac	u	path	.local/lib/node_modules/@openai/codex	high	Scoped npm package directory; not execution evidence
gc	Gemini CLI	Google	cli	mac	m	path	usr/local/lib/node_modules/@google/gemini-cli	high	Scoped npm package directory; not execution evidence
gc	Gemini CLI	Google	cli	mac	m	path	usr/lib/node_modules/@google/gemini-cli	high	Scoped npm package directory; not execution evidence
gc	Gemini CLI	Google	cli	mac	u	path	.npm-global/lib/node_modules/@google/gemini-cli	high	Scoped npm package directory; not execution evidence
gc	Gemini CLI	Google	cli	mac	u	path	.local/lib/node_modules/@google/gemini-cli	high	Scoped npm package directory; not execution evidence
gh	GitHub Copilot CLI	GitHub	cli	mac	m	path	usr/local/lib/node_modules/@github/copilot	high	Scoped npm package directory; not execution evidence
gh	GitHub Copilot CLI	GitHub	cli	mac	m	path	usr/lib/node_modules/@github/copilot	high	Scoped npm package directory; not execution evidence
gh	GitHub Copilot CLI	GitHub	cli	mac	u	path	.npm-global/lib/node_modules/@github/copilot	high	Scoped npm package directory; not execution evidence
gh	GitHub Copilot CLI	GitHub	cli	mac	u	path	.local/lib/node_modules/@github/copilot	high	Scoped npm package directory; not execution evidence
ai	aider	aider	cli	mac	u	path	.local/lib/python*/site-packages/aider	review	Name/path evidence; validate publisher before sanction matching
ai	aider	aider	cli	mac	u	path	.local/share/pipx/venvs/aider-chat	review	Name/path evidence; validate publisher before sanction matching
cc	Claude Code	Anthropic	cli	mac	u	path	.local/bin/claude	review	Name/path evidence; validate publisher before sanction matching
cc	Claude Code	Anthropic	cli	mac	u	path	.claude/local/claude	review	Name/path evidence; validate publisher before sanction matching
cx	Codex CLI	OpenAI	cli	mac	u	path	.local/bin/codex	review	Name/path evidence; validate publisher before sanction matching
ve	GitHub Copilot (IDE)	GitHub	ide-ext	mac	u	vscode	github.copilot-*	high	Extension directory identity; https://marketplace.visualstudio.com/items?itemName=GitHub.copilot
va	Continue (IDE)	Continue	ide-ext	mac	u	vscode	continue.continue-*	high	Extension directory identity; https://marketplace.visualstudio.com/items?itemName=Continue.continue
vc	Cline (IDE)	Cline	ide-ext	mac	u	vscode	saoudrizwan.claude-dev-*	high	Extension directory identity; https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev
vr	Roo Code (IDE)	Roo Code	ide-ext	mac	u	vscode	rooveterinaryinc.roo-cline-*	review	Legacy extension directory heuristic; current marketplace URL returns 404, identity not re-verified
je	GitHub Copilot (JetBrains)	GitHub	ide-ext	mac	u	jetbrains	github-copilot*	review	Name/path evidence; validate publisher before sanction matching
je	GitHub Copilot (JetBrains)	GitHub	ide-ext	mac	u	jetbrains	copilot*	review	Name/path evidence; validate publisher before sanction matching
je	GitHub Copilot (JetBrains)	GitHub	ide-ext	mac	u	jetbrains	com.github.copilot*	review	Name/path evidence; validate publisher before sanction matching
bc	ChatGPT browser extension	various	browser-ext	mac	u	manifest	chatgpt	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
ba	Claude browser extension	various	browser-ext	mac	u	manifest	claude	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
bg	Gemini browser extension/PWA	various	browser-ext	mac	u	manifest	gemini	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
bp	Perplexity browser extension	various	browser-ext	mac	u	manifest	perplexity	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
bi	Copilot browser extension	various	browser-ext	mac	u	manifest	copilot	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
bm	Monica browser extension	Monica	browser-ext	mac	u	manifest	monica	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
bn	Merlin browser extension	Merlin	browser-ext	mac	u	manifest	merlin	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
bs	Sider browser extension	Sider	browser-ext	mac	u	manifest	sider	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
bx	MaxAI browser extension	MaxAI	browser-ext	mac	u	manifest	maxai	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
by	Grammarly AI browser extension	Grammarly	browser-ext	mac	u	manifest	grammarly.*(ai|assistant)|ai.*grammarly	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
ol	Ollama	Ollama	local-llm	lin	u	path	.ollama	review	Data directory can remain after uninstall; needs review
lm	LM Studio	LM Studio	local-llm	lin	u	path	.lmstudio	review	Data directory can remain after uninstall; needs review
lm	LM Studio	LM Studio	local-llm	lin	u	path	.cache/lm-studio	review	Data directory can remain after uninstall; needs review
cc	Claude Code	Anthropic	cli	lin	m	path	usr/local/lib/node_modules/@anthropic-ai/claude-code	high	Scoped npm package directory; not execution evidence
cc	Claude Code	Anthropic	cli	lin	m	path	usr/lib/node_modules/@anthropic-ai/claude-code	high	Scoped npm package directory; not execution evidence
cc	Claude Code	Anthropic	cli	lin	u	path	.npm-global/lib/node_modules/@anthropic-ai/claude-code	high	Scoped npm package directory; not execution evidence
cc	Claude Code	Anthropic	cli	lin	u	path	.local/lib/node_modules/@anthropic-ai/claude-code	high	Scoped npm package directory; not execution evidence
cx	Codex CLI	OpenAI	cli	lin	m	path	usr/local/lib/node_modules/@openai/codex	high	Scoped npm package directory; not execution evidence
cx	Codex CLI	OpenAI	cli	lin	m	path	usr/lib/node_modules/@openai/codex	high	Scoped npm package directory; not execution evidence
cx	Codex CLI	OpenAI	cli	lin	u	path	.npm-global/lib/node_modules/@openai/codex	high	Scoped npm package directory; not execution evidence
cx	Codex CLI	OpenAI	cli	lin	u	path	.local/lib/node_modules/@openai/codex	high	Scoped npm package directory; not execution evidence
gc	Gemini CLI	Google	cli	lin	m	path	usr/local/lib/node_modules/@google/gemini-cli	high	Scoped npm package directory; not execution evidence
gc	Gemini CLI	Google	cli	lin	m	path	usr/lib/node_modules/@google/gemini-cli	high	Scoped npm package directory; not execution evidence
gc	Gemini CLI	Google	cli	lin	u	path	.npm-global/lib/node_modules/@google/gemini-cli	high	Scoped npm package directory; not execution evidence
gc	Gemini CLI	Google	cli	lin	u	path	.local/lib/node_modules/@google/gemini-cli	high	Scoped npm package directory; not execution evidence
gh	GitHub Copilot CLI	GitHub	cli	lin	m	path	usr/local/lib/node_modules/@github/copilot	high	Scoped npm package directory; not execution evidence
gh	GitHub Copilot CLI	GitHub	cli	lin	m	path	usr/lib/node_modules/@github/copilot	high	Scoped npm package directory; not execution evidence
gh	GitHub Copilot CLI	GitHub	cli	lin	u	path	.npm-global/lib/node_modules/@github/copilot	high	Scoped npm package directory; not execution evidence
gh	GitHub Copilot CLI	GitHub	cli	lin	u	path	.local/lib/node_modules/@github/copilot	high	Scoped npm package directory; not execution evidence
ai	aider	aider	cli	lin	u	path	.local/lib/python*/site-packages/aider	review	Name/path evidence; validate publisher before sanction matching
ai	aider	aider	cli	lin	u	path	.local/share/pipx/venvs/aider-chat	review	Name/path evidence; validate publisher before sanction matching
cc	Claude Code	Anthropic	cli	lin	u	path	.local/bin/claude	review	Name/path evidence; validate publisher before sanction matching
cc	Claude Code	Anthropic	cli	lin	u	path	.claude/local/claude	review	Name/path evidence; validate publisher before sanction matching
cx	Codex CLI	OpenAI	cli	lin	u	path	.local/bin/codex	review	Name/path evidence; validate publisher before sanction matching
ve	GitHub Copilot (IDE)	GitHub	ide-ext	lin	u	vscode	github.copilot-*	high	Extension directory identity; https://marketplace.visualstudio.com/items?itemName=GitHub.copilot
va	Continue (IDE)	Continue	ide-ext	lin	u	vscode	continue.continue-*	high	Extension directory identity; https://marketplace.visualstudio.com/items?itemName=Continue.continue
vc	Cline (IDE)	Cline	ide-ext	lin	u	vscode	saoudrizwan.claude-dev-*	high	Extension directory identity; https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev
vr	Roo Code (IDE)	Roo Code	ide-ext	lin	u	vscode	rooveterinaryinc.roo-cline-*	review	Legacy extension directory heuristic; current marketplace URL returns 404, identity not re-verified
je	GitHub Copilot (JetBrains)	GitHub	ide-ext	lin	u	jetbrains	github-copilot*	review	Name/path evidence; validate publisher before sanction matching
je	GitHub Copilot (JetBrains)	GitHub	ide-ext	lin	u	jetbrains	copilot*	review	Name/path evidence; validate publisher before sanction matching
je	GitHub Copilot (JetBrains)	GitHub	ide-ext	lin	u	jetbrains	com.github.copilot*	review	Name/path evidence; validate publisher before sanction matching
bc	ChatGPT browser extension	various	browser-ext	lin	u	manifest	chatgpt	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
ba	Claude browser extension	various	browser-ext	lin	u	manifest	claude	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
bg	Gemini browser extension/PWA	various	browser-ext	lin	u	manifest	gemini	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
bp	Perplexity browser extension	various	browser-ext	lin	u	manifest	perplexity	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
bi	Copilot browser extension	various	browser-ext	lin	u	manifest	copilot	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
bm	Monica browser extension	Monica	browser-ext	lin	u	manifest	monica	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
bn	Merlin browser extension	Merlin	browser-ext	lin	u	manifest	merlin	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
bs	Sider browser extension	Sider	browser-ext	lin	u	manifest	sider	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
bx	MaxAI browser extension	MaxAI	browser-ext	lin	u	manifest	maxai	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
by	Grammarly AI browser extension	Grammarly	browser-ext	lin	u	manifest	grammarly.*(ai|assistant)|ai.*grammarly	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
ol	Ollama	Ollama	local-llm	win	u	path	.ollama	review	Data directory can remain after uninstall; needs review
lm	LM Studio	LM Studio	local-llm	win	u	path	.lmstudio	review	Data directory can remain after uninstall; needs review
lm	LM Studio	LM Studio	local-llm	win	u	path	.cache/lm-studio	review	Data directory can remain after uninstall; needs review
cc	Claude Code	Anthropic	cli	win	u	path	AppData/Roaming/npm/node_modules/@anthropic-ai/claude-code	high	Scoped npm package directory
cx	Codex CLI	OpenAI	cli	win	u	path	AppData/Roaming/npm/node_modules/@openai/codex	high	Scoped npm package directory
gc	Gemini CLI	Google	cli	win	u	path	AppData/Roaming/npm/node_modules/@google/gemini-cli	high	Scoped npm package directory
gh	GitHub Copilot CLI	GitHub	cli	win	u	path	AppData/Roaming/npm/node_modules/@github/copilot	high	Scoped npm package directory
ai	aider	aider	cli	win	u	path	.local/lib/python*/site-packages/aider	review	Name/path evidence; validate publisher before sanction matching
ai	aider	aider	cli	win	u	path	.local/share/pipx/venvs/aider-chat	review	Name/path evidence; validate publisher before sanction matching
cc	Claude Code	Anthropic	cli	win	u	path	.local/bin/claude	review	Name/path evidence; validate publisher before sanction matching
cc	Claude Code	Anthropic	cli	win	u	path	.claude/local/claude	review	Name/path evidence; validate publisher before sanction matching
cx	Codex CLI	OpenAI	cli	win	u	path	.local/bin/codex	review	Name/path evidence; validate publisher before sanction matching
ve	GitHub Copilot (IDE)	GitHub	ide-ext	win	u	vscode	github.copilot-*	high	Extension directory identity; https://marketplace.visualstudio.com/items?itemName=GitHub.copilot
va	Continue (IDE)	Continue	ide-ext	win	u	vscode	continue.continue-*	high	Extension directory identity; https://marketplace.visualstudio.com/items?itemName=Continue.continue
vc	Cline (IDE)	Cline	ide-ext	win	u	vscode	saoudrizwan.claude-dev-*	high	Extension directory identity; https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev
vr	Roo Code (IDE)	Roo Code	ide-ext	win	u	vscode	rooveterinaryinc.roo-cline-*	review	Legacy extension directory heuristic; current marketplace URL returns 404, identity not re-verified
je	GitHub Copilot (JetBrains)	GitHub	ide-ext	win	u	jetbrains	github-copilot*	review	Name/path evidence; validate publisher before sanction matching
je	GitHub Copilot (JetBrains)	GitHub	ide-ext	win	u	jetbrains	copilot*	review	Name/path evidence; validate publisher before sanction matching
je	GitHub Copilot (JetBrains)	GitHub	ide-ext	win	u	jetbrains	com.github.copilot*	review	Name/path evidence; validate publisher before sanction matching
bc	ChatGPT browser extension	various	browser-ext	win	u	manifest	chatgpt	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
ba	Claude browser extension	various	browser-ext	win	u	manifest	claude	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
bg	Gemini browser extension/PWA	various	browser-ext	win	u	manifest	gemini	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
bp	Perplexity browser extension	various	browser-ext	win	u	manifest	perplexity	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
bi	Copilot browser extension	various	browser-ext	win	u	manifest	copilot	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
bm	Monica browser extension	Monica	browser-ext	win	u	manifest	monica	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
bn	Merlin browser extension	Merlin	browser-ext	win	u	manifest	merlin	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
bs	Sider browser extension	Sider	browser-ext	win	u	manifest	sider	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
bx	MaxAI browser extension	MaxAI	browser-ext	win	u	manifest	maxai	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
by	Grammarly AI browser extension	Grammarly	browser-ext	win	u	manifest	grammarly.*(ai|assistant)|ai.*grammarly	review	Manifest name only; extension ID not verified; localized names unresolved => partial; name is not publisher validation
cp	Microsoft Copilot consumer app	Microsoft	desktop	win	m	appx	^Microsoft.Copilot$	high	Require Microsoft publisher; excludes Microsoft.MicrosoftOfficeHub / M365 Copilot and OS feature
mc	Microsoft 365 Copilot app	Microsoft	desktop	win	m	appx	^Microsoft.MicrosoftOfficeHub$	high	M365 app presence does not prove Copilot entitlement/use; require Microsoft publisher
ol	Ollama	Ollama	local-llm	lin	m	path	usr/local/bin/ollama	review	Name/path evidence; validate publisher before sanction matching
ol	Ollama	Ollama	local-llm	lin	m	path	usr/bin/ollama	review	Name/path evidence; validate publisher before sanction matching
ol	Ollama	Ollama	local-llm	lin	m	path	etc/systemd/system/ollama.service	review	Name/path evidence; validate publisher before sanction matching
ol	Ollama	Ollama	local-llm	lin	m	path	usr/lib/systemd/system/ollama.service	review	Name/path evidence; validate publisher before sanction matching
ol	Ollama	Ollama	local-llm	mac	m	path	opt/homebrew/Cellar/ollama	review	Name/path evidence; validate publisher before sanction matching
ol	Ollama	Ollama	local-llm	mac	m	path	usr/local/Cellar/ollama	review	Name/path evidence; validate publisher before sanction matching
cc	Claude Code	Anthropic	cli	mac	m	path	opt/homebrew/Cellar/claude-code	review	Name/path evidence; validate publisher before sanction matching
cc	Claude Code	Anthropic	cli	mac	m	path	usr/local/Cellar/claude-code	review	Name/path evidence; validate publisher before sanction matching
cx	Codex CLI	OpenAI	cli	mac	m	path	opt/homebrew/Cellar/codex	review	Name/path evidence; validate publisher before sanction matching
cx	Codex CLI	OpenAI	cli	mac	m	path	usr/local/Cellar/codex	review	Name/path evidence; validate publisher before sanction matching
gc	Gemini CLI	Google	cli	mac	m	path	opt/homebrew/Cellar/gemini-cli	review	Name/path evidence; validate publisher before sanction matching
gc	Gemini CLI	Google	cli	mac	m	path	usr/local/Cellar/gemini-cli	review	Name/path evidence; validate publisher before sanction matching
ai	aider	aider	cli	mac	m	path	opt/homebrew/Cellar/aider-chat	review	Name/path evidence; validate publisher before sanction matching
ai	aider	aider	cli	mac	m	path	usr/local/Cellar/aider-chat	review	Name/path evidence; validate publisher before sanction matching
ai	aider	aider	cli	lin	m	path	usr/local/lib/python*/site-packages/aider	review	Name/path evidence; validate publisher before sanction matching
ai	aider	aider	cli	lin	m	path	usr/lib/python*/site-packages/aider	review	Name/path evidence; validate publisher before sanction matching
gp	Gemini PWA/shortcut	Google (unverified)	desktop	mac	u	pwa	gemini	review	Shortcut/manifest name only; no native Gemini desktop signature; https://gemini.google.com/
gp	Gemini PWA/shortcut	Google (unverified)	desktop	lin	u	pwa	gemini	review	Shortcut/manifest name only; no native Gemini desktop signature; https://gemini.google.com/
gp	Gemini PWA/shortcut	Google (unverified)	desktop	win	u	pwa	gemini	review	Shortcut/manifest name only; no native Gemini desktop signature; https://gemini.google.com/
cg	ChatGPT	OpenAI	desktop	win	m	path	Program Files/ChatGPT	review	Name/path evidence; validate publisher before sanction matching
cg	ChatGPT	OpenAI	desktop	win	m	path	Program Files (x86)/ChatGPT	review	Name/path evidence; validate publisher before sanction matching
cg	ChatGPT	OpenAI	desktop	win	m	path	ProgramData/ChatGPT	review	Name/path evidence; validate publisher before sanction matching
cl	Claude	Anthropic	desktop	win	m	path	Program Files/Claude	review	Name/path evidence; validate publisher before sanction matching
cl	Claude	Anthropic	desktop	win	m	path	Program Files (x86)/Claude	review	Name/path evidence; validate publisher before sanction matching
cl	Claude	Anthropic	desktop	win	m	path	ProgramData/Claude	review	Name/path evidence; validate publisher before sanction matching
cu	Cursor	Anysphere	desktop	win	m	path	Program Files/Cursor	review	Name/path evidence; validate publisher before sanction matching
cu	Cursor	Anysphere	desktop	win	m	path	Program Files (x86)/Cursor	review	Name/path evidence; validate publisher before sanction matching
cu	Cursor	Anysphere	desktop	win	m	path	ProgramData/Cursor	review	Name/path evidence; validate publisher before sanction matching
wi	Windsurf	Cognition	desktop	win	m	path	Program Files/Windsurf	review	Name/path evidence; validate publisher before sanction matching
wi	Windsurf	Cognition	desktop	win	m	path	Program Files (x86)/Windsurf	review	Name/path evidence; validate publisher before sanction matching
wi	Windsurf	Cognition	desktop	win	m	path	ProgramData/Windsurf	review	Name/path evidence; validate publisher before sanction matching
px	Perplexity	Perplexity	desktop	win	m	path	Program Files/Perplexity	review	Name/path evidence; validate publisher before sanction matching
px	Perplexity	Perplexity	desktop	win	m	path	Program Files (x86)/Perplexity	review	Name/path evidence; validate publisher before sanction matching
px	Perplexity	Perplexity	desktop	win	m	path	ProgramData/Perplexity	review	Name/path evidence; validate publisher before sanction matching
lm	LM Studio	LM Studio	local-llm	win	m	path	Program Files/LM Studio	review	Name/path evidence; validate publisher before sanction matching
lm	LM Studio	LM Studio	local-llm	win	m	path	Program Files (x86)/LM Studio	review	Name/path evidence; validate publisher before sanction matching
lm	LM Studio	LM Studio	local-llm	win	m	path	ProgramData/LM Studio	review	Name/path evidence; validate publisher before sanction matching
ol	Ollama	Ollama	local-llm	win	m	path	Program Files/Ollama	review	Name/path evidence; validate publisher before sanction matching
ol	Ollama	Ollama	local-llm	win	m	path	Program Files (x86)/Ollama	review	Name/path evidence; validate publisher before sanction matching
ol	Ollama	Ollama	local-llm	win	m	path	ProgramData/Ollama	review	Name/path evidence; validate publisher before sanction matching
cc	Claude Code	Anthropic	cli	win	u	path	.local/bin/claude.exe	review	Name/path evidence; validate publisher before sanction matching
cx	Codex CLI	OpenAI	cli	win	u	path	.local/bin/codex.exe	review	Name/path evidence; validate publisher before sanction matching
cu	Cursor	Cursor	desktop	lin	m	package	^(com\.|ai\.|io\.|org\.)[a-z0-9.-]*cursor$	review	Reverse-DNS Flatpak name heuristic; unofficial packaging possible
wi	Windsurf	Windsurf	desktop	lin	m	package	^(com\.|ai\.|io\.|org\.)[a-z0-9.-]*windsurf$	review	Reverse-DNS Flatpak name heuristic; unofficial packaging possible
cl	Claude	Claude	desktop	lin	m	package	^(com\.|ai\.|io\.|org\.)[a-z0-9.-]*claude$	review	Reverse-DNS Flatpak name heuristic; unofficial packaging possible
lm	LM Studio	LM Studio	local-llm	lin	m	package	^(com\.|ai\.|io\.|org\.)[a-z0-9.-]*lm[-.]?studio$	review	Reverse-DNS Flatpak name heuristic; unofficial packaging possible
ol	Ollama	Ollama	local-llm	lin	m	package	^(com\.|ai\.|io\.|org\.)[a-z0-9.-]*ollama$	review	Reverse-DNS Flatpak name heuristic; unofficial packaging possible
gm	Gemini desktop	Google	desktop	mac	m	path	Applications/Gemini.app	review	Native app exists; path-only signature; https://support.google.com/gemini/answer/17011627
gm	Gemini desktop	Google	desktop	mac	u	path	Applications/Gemini.app	review	Native app exists; path-only signature; https://support.google.com/gemini/answer/17011627
gm	Gemini desktop	Google	desktop	win	m	uninstall	^Gemini( |$)	review	Require Google publisher; https://support.google.com/gemini/answer/18263854
gm	Gemini desktop	Google	desktop	win	m	path	Program Files/Google/Gemini	review	Installation path heuristic, not verified package ID; https://support.google.com/gemini/answer/18263854
gm	Gemini desktop	Google	desktop	win	u	path	AppData/Local/Google/Gemini	review	Installation path heuristic, not verified package ID; https://support.google.com/gemini/answer/18263854
cg	ChatGPT	ChatGPT	desktop	lin	u	path	Applications/*chatgpt*.AppImage	review	AppImage filename only; unofficial builds/residue possible
cg	ChatGPT	ChatGPT	desktop	lin	u	path	Downloads/*chatgpt*.AppImage	review	AppImage filename only; unofficial builds/residue possible
cl	Claude	Claude	desktop	lin	u	path	Applications/*claude*.AppImage	review	AppImage filename only; unofficial builds/residue possible
cl	Claude	Claude	desktop	lin	u	path	Downloads/*claude*.AppImage	review	AppImage filename only; unofficial builds/residue possible
cu	Cursor	Cursor	desktop	lin	u	path	Applications/*cursor*.AppImage	review	AppImage filename only; unofficial builds/residue possible
cu	Cursor	Cursor	desktop	lin	u	path	Downloads/*cursor*.AppImage	review	AppImage filename only; unofficial builds/residue possible
wi	Windsurf	Windsurf	desktop	lin	u	path	Applications/*windsurf*.AppImage	review	AppImage filename only; unofficial builds/residue possible
wi	Windsurf	Windsurf	desktop	lin	u	path	Downloads/*windsurf*.AppImage	review	AppImage filename only; unofficial builds/residue possible
lm	LM Studio	LM Studio	local-llm	lin	u	path	Applications/*lm-studio*.AppImage	review	AppImage filename only; unofficial builds/residue possible
lm	LM Studio	LM Studio	local-llm	lin	u	path	Downloads/*lm-studio*.AppImage	review	AppImage filename only; unofficial builds/residue possible
px	Perplexity	Perplexity	desktop	lin	u	path	Applications/*perplexity*.AppImage	review	AppImage filename only; unofficial builds/residue possible
px	Perplexity	Perplexity	desktop	lin	u	path	Downloads/*perplexity*.AppImage	review	AppImage filename only; unofficial builds/residue possible
cg	ChatGPT	ChatGPT	desktop	lin	m	shortcut	^ChatGPT( |$)	review	Desktop Name metadata only; not app execution evidence
cg	ChatGPT	ChatGPT	desktop	lin	u	shortcut	^ChatGPT( |$)	review	Desktop Name metadata only; not app execution evidence
cl	Claude	Claude	desktop	lin	m	shortcut	^Claude( |$)	review	Desktop Name metadata only; not app execution evidence
cl	Claude	Claude	desktop	lin	u	shortcut	^Claude( |$)	review	Desktop Name metadata only; not app execution evidence
cu	Cursor	Cursor	desktop	lin	m	shortcut	^Cursor( |$)	review	Desktop Name metadata only; not app execution evidence
cu	Cursor	Cursor	desktop	lin	u	shortcut	^Cursor( |$)	review	Desktop Name metadata only; not app execution evidence
wi	Windsurf	Windsurf	desktop	lin	m	shortcut	^Windsurf( |$)	review	Desktop Name metadata only; not app execution evidence
wi	Windsurf	Windsurf	desktop	lin	u	shortcut	^Windsurf( |$)	review	Desktop Name metadata only; not app execution evidence
lm	LM Studio	LM Studio	local-llm	lin	m	shortcut	^LM Studio( |$)	review	Desktop Name metadata only; not app execution evidence
lm	LM Studio	LM Studio	local-llm	lin	u	shortcut	^LM Studio( |$)	review	Desktop Name metadata only; not app execution evidence
px	Perplexity	Perplexity	desktop	lin	m	shortcut	^Perplexity( |$)	review	Desktop Name metadata only; not app execution evidence
px	Perplexity	Perplexity	desktop	lin	u	shortcut	^Perplexity( |$)	review	Desktop Name metadata only; not app execution evidence
ol	Ollama	Ollama	local-llm	lin	m	shortcut	^Ollama( |$)	review	Desktop Name metadata only; not app execution evidence
ol	Ollama	Ollama	local-llm	lin	u	shortcut	^Ollama( |$)	review	Desktop Name metadata only; not app execution evidence
gp	Gemini PWA/shortcut	Google (unverified)	desktop	mac	u	path	Applications/Chrome Apps.localized/Gemini.app	review	PWA shortcut name only; no claim of native installation
gp	Gemini PWA/shortcut	Google (unverified)	desktop	win	u	path	AppData/Roaming/Microsoft/Windows/Start Menu/Programs/Chrome Apps/Gemini.lnk	review	PWA shortcut name only; no claim of native installation
cc	Claude Code	Anthropic	cli	lin	u	path	.nvm/versions/node/*/lib/node_modules/@anthropic-ai/claude-code	high	Scoped npm package metadata; do not launch CLI
cx	Codex CLI	OpenAI	cli	lin	u	path	.nvm/versions/node/*/lib/node_modules/@openai/codex	high	Scoped npm package metadata; do not launch CLI
gc	Gemini CLI	Google	cli	lin	u	path	.nvm/versions/node/*/lib/node_modules/@google/gemini-cli	high	Scoped npm package metadata; do not launch CLI
gh	GitHub Copilot CLI	GitHub	cli	lin	u	path	.nvm/versions/node/*/lib/node_modules/@github/copilot	high	Scoped npm package metadata; do not launch CLI
cc	Claude Code	Anthropic	cli	lin	u	path	.local/share/claude/versions/*	review	Native installer version files; no symlink traversal
cc	Claude Code	Anthropic	cli	mac	u	path	.nvm/versions/node/*/lib/node_modules/@anthropic-ai/claude-code	high	Scoped npm package metadata; do not launch CLI
cc	Claude Code	Anthropic	cli	mac	m	path	opt/homebrew/lib/node_modules/@anthropic-ai/claude-code	high	Homebrew npm global package directory
cx	Codex CLI	OpenAI	cli	mac	u	path	.nvm/versions/node/*/lib/node_modules/@openai/codex	high	Scoped npm package metadata; do not launch CLI
cx	Codex CLI	OpenAI	cli	mac	m	path	opt/homebrew/lib/node_modules/@openai/codex	high	Homebrew npm global package directory
gc	Gemini CLI	Google	cli	mac	u	path	.nvm/versions/node/*/lib/node_modules/@google/gemini-cli	high	Scoped npm package metadata; do not launch CLI
gc	Gemini CLI	Google	cli	mac	m	path	opt/homebrew/lib/node_modules/@google/gemini-cli	high	Homebrew npm global package directory
gh	GitHub Copilot CLI	GitHub	cli	mac	u	path	.nvm/versions/node/*/lib/node_modules/@github/copilot	high	Scoped npm package metadata; do not launch CLI
gh	GitHub Copilot CLI	GitHub	cli	mac	m	path	opt/homebrew/lib/node_modules/@github/copilot	high	Homebrew npm global package directory
cc	Claude Code	Anthropic	cli	mac	u	path	.local/share/claude/versions/*	review	Native installer version files; no symlink traversal
ve	GitHub Copilot (IDE)	GitHub	ide-ext	win	u	vscode	github.copilot-chat-*	review	Extension directory identity; https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat
ve	GitHub Copilot (IDE)	GitHub	ide-ext	mac	u	vscode	github.copilot-chat-*	review	Extension directory identity; https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat
ve	GitHub Copilot (IDE)	GitHub	ide-ext	lin	u	vscode	github.copilot-chat-*	review	Extension directory identity; https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat
ja	JetBrains AI Assistant	various	ide-ext	win	u	jetbrains	ai-assistant*	review	Plugin directory name heuristic; needs review
ja	JetBrains AI Assistant	various	ide-ext	mac	u	jetbrains	ai-assistant*	review	Plugin directory name heuristic; needs review
ja	JetBrains AI Assistant	various	ide-ext	lin	u	jetbrains	ai-assistant*	review	Plugin directory name heuristic; needs review
ja	JetBrains AI Assistant	various	ide-ext	win	u	jetbrains	llm*	review	Plugin directory name heuristic; needs review
ja	JetBrains AI Assistant	various	ide-ext	mac	u	jetbrains	llm*	review	Plugin directory name heuristic; needs review
ja	JetBrains AI Assistant	various	ide-ext	lin	u	jetbrains	llm*	review	Plugin directory name heuristic; needs review
va	Continue (IDE)	various	ide-ext	win	u	jetbrains	continue*	review	Plugin directory name heuristic; needs review
va	Continue (IDE)	various	ide-ext	mac	u	jetbrains	continue*	review	Plugin directory name heuristic; needs review
va	Continue (IDE)	various	ide-ext	lin	u	jetbrains	continue*	review	Plugin directory name heuristic; needs review
cg	ChatGPT	OpenAI	desktop	win	m	appx	^OpenAI\.ChatGPT(-Desktop)?$	review	Appx name plus declared publisher match; https://learn.chatgpt.com/docs/enterprise/windows-deployment
od	OpenAI desktop (ChatGPT/Codex)	OpenAI	desktop	win	m	appx	^OpenAI\.Codex$	review	Appx name plus declared publisher match; https://learn.chatgpt.com/docs/enterprise/windows-deployment
cl	Claude	Anthropic	desktop	win	m	appx	^Claude$	review	MSIX name heuristic plus declared Anthropic publisher; https://claude.com/download
cg	ChatGPT	OpenAI	desktop	win	u	path	AppData/Local/Packages/OpenAI.ChatGPT-Desktop_*	review	Package data directory can remain after uninstall; needs review
cl	Claude	Anthropic	desktop	win	u	path	AppData/Local/Packages/Claude_*	review	Package data directory can remain after uninstall; needs review
cg	ChatGPT	OpenAI	desktop	win	u	uninstall	^ChatGPT( |$)	review	Publisher must match OpenAI; uninstall metadata is not a verified binary signature; also scan loaded HKU/per-user package dirs
cg	ChatGPT	OpenAI	desktop	lin	u	package	^chatgpt(-desktop)?$	review	Installed package name only; unofficial packages possible; also scan loaded HKU/per-user package dirs
cl	Claude	Anthropic	desktop	win	u	uninstall	^Claude( |$)	review	Publisher must match Anthropic; uninstall metadata is not a verified binary signature; also scan loaded HKU/per-user package dirs
cl	Claude	Anthropic	desktop	lin	u	package	^claude(-desktop)?$	review	Installed package name only; unofficial packages possible; also scan loaded HKU/per-user package dirs
cu	Cursor	Anysphere	desktop	win	u	uninstall	^Cursor( |$)	review	Publisher must match Anysphere; uninstall metadata is not a verified binary signature; also scan loaded HKU/per-user package dirs
cu	Cursor	Anysphere	desktop	lin	u	package	^cursor(-desktop)?$	review	Installed package name only; unofficial packages possible; also scan loaded HKU/per-user package dirs
wi	Windsurf	Cognition	desktop	win	u	uninstall	^Windsurf( |$)	review	Publisher must match Cognition; uninstall metadata is not a verified binary signature; also scan loaded HKU/per-user package dirs
wi	Windsurf	Cognition	desktop	lin	u	package	^windsurf(-desktop)?$	review	Installed package name only; unofficial packages possible; also scan loaded HKU/per-user package dirs
px	Perplexity	Perplexity	desktop	win	u	uninstall	^Perplexity( |$)	review	Publisher must match Perplexity; uninstall metadata is not a verified binary signature; also scan loaded HKU/per-user package dirs
px	Perplexity	Perplexity	desktop	lin	u	package	^perplexity(-desktop)?$	review	Installed package name only; unofficial packages possible; also scan loaded HKU/per-user package dirs
lm	LM Studio	LM Studio	local-llm	win	u	uninstall	^LM[ -]?Studio( |$)	review	Publisher must match LM Studio; uninstall metadata is not a verified binary signature; also scan loaded HKU/per-user package dirs
lm	LM Studio	LM Studio	local-llm	lin	u	package	^lm-studio(-desktop)?$	review	Installed package name only; unofficial packages possible; also scan loaded HKU/per-user package dirs
ol	Ollama	Ollama	local-llm	win	u	uninstall	^Ollama( |$)	review	Publisher must match Ollama; uninstall metadata is not a verified binary signature; also scan loaded HKU/per-user package dirs
ol	Ollama	Ollama	local-llm	lin	u	package	^ollama(-desktop)?$	review	Installed package name only; unofficial packages possible; also scan loaded HKU/per-user package dirs
cu	Cursor	Cursor	desktop	lin	u	package	^(com\.|ai\.|io\.|org\.)[a-z0-9.-]*cursor$	review	Reverse-DNS Flatpak name heuristic; unofficial packaging possible; also scan loaded HKU/per-user package dirs
wi	Windsurf	Windsurf	desktop	lin	u	package	^(com\.|ai\.|io\.|org\.)[a-z0-9.-]*windsurf$	review	Reverse-DNS Flatpak name heuristic; unofficial packaging possible; also scan loaded HKU/per-user package dirs
cl	Claude	Claude	desktop	lin	u	package	^(com\.|ai\.|io\.|org\.)[a-z0-9.-]*claude$	review	Reverse-DNS Flatpak name heuristic; unofficial packaging possible; also scan loaded HKU/per-user package dirs
lm	LM Studio	LM Studio	local-llm	lin	u	package	^(com\.|ai\.|io\.|org\.)[a-z0-9.-]*lm[-.]?studio$	review	Reverse-DNS Flatpak name heuristic; unofficial packaging possible; also scan loaded HKU/per-user package dirs
ol	Ollama	Ollama	local-llm	lin	u	package	^(com\.|ai\.|io\.|org\.)[a-z0-9.-]*ollama$	review	Reverse-DNS Flatpak name heuristic; unofficial packaging possible; also scan loaded HKU/per-user package dirs
gm	Gemini desktop	Google	desktop	win	u	uninstall	^Gemini( |$)	review	Require Google publisher; https://support.google.com/gemini/answer/18263854; also scan loaded HKU/per-user package dirs
cc	Claude Code	Anthropic	cli	win	m	path	Program Files/nodejs/node_modules/@anthropic-ai/claude-code	high	Scoped npm package name; read directories only
cx	Codex CLI	OpenAI	cli	win	m	path	Program Files/nodejs/node_modules/@openai/codex	high	Scoped npm package name; read directories only
gc	Gemini CLI	Google	cli	win	m	path	Program Files/nodejs/node_modules/@google/gemini-cli	high	Scoped npm package name; read directories only
gh	GitHub Copilot CLI	GitHub	cli	win	m	path	Program Files/nodejs/node_modules/@github/copilot	high	Scoped npm package name; read directories only
gh	GitHub Copilot CLI	GitHub	cli	win	u	path	AppData/Local/GitHub CLI/extensions/gh-copilot	review	Legacy gh-copilot extension directory; may be residue
gh	GitHub Copilot CLI	GitHub	cli	mac	u	path	.local/share/gh/extensions/gh-copilot	review	Legacy gh-copilot extension directory; may be residue
gh	GitHub Copilot CLI	GitHub	cli	lin	u	path	.local/share/gh/extensions/gh-copilot	review	Legacy gh-copilot extension directory; may be residue
'@
# END SAI SIGNATURES
# Metadata is evidence, never code. Do not launch detected programs or load hives.
$ErrorActionPreference = 'Stop'
$script:Deadline = [DateTime]::UtcNow.AddSeconds(120)
$script:ScanStatus = 'ok'
$script:Hits = @{}
$Signatures = @($SignatureData | ConvertFrom-Csv -Delimiter "`t" | Where-Object { $_.os -eq 'win' })
function Write-PartialStatus { $script:ScanStatus = 'partial' }
function Add-Hit([string]$Id, [string]$Scope) { $script:Hits["$Id.$Scope"] = $true }
function Get-SafeMatch([string]$Base, [string]$Pattern) {
    # Resolve trusted glob one component at a time; never enter reparse points.
    if ([DateTime]::UtcNow -gt $script:Deadline) { Write-PartialStatus; return }
    try {
        $item = Get-Item -LiteralPath $Base -Force
        if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { Write-PartialStatus; return }
        $current = @($item)
        foreach ($part in ($Pattern -split '[/\\]')) {
            $next = @()
            :parents foreach ($parent in $current) {
                if ([DateTime]::UtcNow -gt $script:Deadline) { Write-PartialStatus; return }
                if (-not $parent.PSIsContainer) { continue }
                $children = @(Get-ChildItem -LiteralPath $parent.FullName -Force | Select-Object -First 2001)
                if ($children.Count -gt 2000) { Write-PartialStatus }
                foreach ($child in ($children | Select-Object -First 2000)) {
                    if ($child.Name -notlike $part) { continue }
                    if ($child.Attributes -band [IO.FileAttributes]::ReparsePoint) { Write-PartialStatus; continue }
                    $next += $child
                    if ($next.Count -ge 2000) { Write-PartialStatus; break parents }
                }
            }
            $current = $next
        }
        $current
    } catch { Write-PartialStatus }
}
function Read-JsonFile([IO.FileSystemInfo]$File) {
    try {
        if ($File -isnot [System.IO.FileInfo] -or ($File.Attributes -band [IO.FileAttributes]::ReparsePoint)) { Write-PartialStatus; return }
        if ($File.Length -gt 1MB) { Write-PartialStatus; return }
        Get-Content -LiteralPath $File.FullName -Raw | ConvertFrom-Json
    } catch { Write-PartialStatus }
}
function Test-MetadataName([string]$Name, [string]$Kind, [string]$Scope) {
    if ([string]::IsNullOrWhiteSpace($Name)) { Write-PartialStatus; return }
    if ($Name -match '__MSG_' -or $Name -match '[\r\n]') { Write-PartialStatus; return }
    foreach ($sig in $Signatures) {
        if ($sig.kind -eq $Kind -and $Name -match $sig.pattern) { Add-Hit $sig.id $Scope }
    }
}
function Read-Uninstall([string]$Path, [string]$Scope) {
    try {
        if (-not (Test-Path -LiteralPath $Path)) { return }
        $keys = @(Get-ChildItem -LiteralPath $Path | Select-Object -First 2001)
        if ($keys.Count -gt 2000) { Write-PartialStatus }
        foreach ($key in ($keys | Select-Object -First 2000)) {
            try {
                $app = Get-ItemProperty -LiteralPath $key.PSPath
                foreach ($sig in $Signatures) {
                    if ($sig.kind -eq 'uninstall' -and $app.DisplayName -match $sig.pattern -and $app.Publisher -match [regex]::Escape($sig.vendor)) { Add-Hit $sig.id $Scope }
                }
            } catch { Write-PartialStatus }
        }
    } catch { Write-PartialStatus }
}
function Read-Profile([string]$Base) {
    foreach ($sig in $Signatures) {
        if ($sig.scope -ne 'u') { continue }
        $patterns = @()
        switch ($sig.kind) {
            path { $patterns = @($sig.pattern) }
            vscode {
                $patterns = @('.vscode','.vscode-insiders','.vscode-oss','.vscodium','.cursor','.windsurf') | ForEach-Object { "$_/extensions/$($sig.pattern)" }
            }
            jetbrains {
                $patterns = @("AppData/Roaming/JetBrains/*/plugins/$($sig.pattern)","AppData/Local/JetBrains/*/plugins/$($sig.pattern)")
            }
        }
        foreach ($pattern in $patterns) {
            if (@(Get-SafeMatch $Base $pattern).Count) { Add-Hit $sig.id 'u' }
        }
    }
    foreach ($browser in @('Google/Chrome','Microsoft/Edge','BraveSoftware/Brave-Browser','Chromium')) {
        foreach ($file in @(Get-SafeMatch $Base "AppData/Local/$browser/User Data/*/Extensions/*/*/manifest.json")) {
            $manifest = Read-JsonFile $file
            if ($manifest) { Test-MetadataName -Name $manifest.name -Kind 'manifest' -Scope 'u' }
        }
        foreach ($file in @(Get-SafeMatch $Base "AppData/Local/$browser/User Data/*/Web Applications/Manifest Resources/*/manifest.json")) {
            $manifest = Read-JsonFile $file
            if ($manifest) { Test-MetadataName -Name $manifest.name -Kind 'pwa' -Scope 'u' }
        }
    }
    foreach ($file in @(Get-SafeMatch $Base 'AppData/Roaming/Mozilla/Firefox/Profiles/*/extensions.json')) {
        $manifest = Read-JsonFile $file
        if ($manifest) {
            if ($null -eq $manifest.addons) { Write-PartialStatus; continue }
            if (@($manifest.addons).Count -gt 2000) { Write-PartialStatus }
            foreach ($addon in ($manifest.addons | Select-Object -First 2000)) {
                if ($addon.active -ne $false) { Test-MetadataName -Name $addon.defaultLocale.name -Kind 'manifest' -Scope 'u' }
            }
        }
    }
}
$fixture = $env:SAI_ROOT
if ($fixture) {
    if ($Rmm -ne 'stdout') { throw 'Fixture mode permits stdout only' }
    $machineRoot = $fixture
    Write-PartialStatus # registry/Appx are intentionally excluded from fixture mode
} else {
    $machineRoot = "$($env:SystemDrive)\"
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { Write-PartialStatus }
    if ([Environment]::Is64BitOperatingSystem -and -not [Environment]::Is64BitProcess) { Write-PartialStatus }
    foreach ($path in @('HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall','HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall')) { Read-Uninstall $path 'm' }
    try {
        foreach ($hive in Get-ChildItem -LiteralPath 'Registry::HKEY_USERS') {
            if ($hive.PSChildName -match '^S-[0-9]+(-[0-9]+)+$') {
                Read-Uninstall "$($hive.PSPath)\Software\Microsoft\Windows\CurrentVersion\Uninstall" 'u'
                Read-Uninstall "$($hive.PSPath)\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall" 'u'
            }
        }
    } catch { Write-PartialStatus }
    try { $packages = @(Get-AppxPackage -AllUsers) } catch {
        Write-PartialStatus
        try { $packages = @(Get-AppxPackage) } catch { $packages = @() }
    }
    foreach ($package in $packages) {
        foreach ($sig in $Signatures) {
            if ($sig.kind -eq 'appx' -and $package.Name -match $sig.pattern -and (($sig.vendor -eq 'Microsoft' -and $package.Publisher -match '(^|,\s*)CN=Microsoft Corporation(,|$)') -or ($sig.vendor -ne 'Microsoft' -and $package.Publisher -match [regex]::Escape($sig.vendor)))) { Add-Hit $sig.id 'm' }
        }
    }
}
foreach ($sig in $Signatures) {
    if ($sig.kind -eq 'path' -and $sig.scope -eq 'm') {
        if (@(Get-SafeMatch $machineRoot $sig.pattern).Count) { Add-Hit $sig.id 'm' }
    }
}
# Standard profiles plus ProfileList paths (custom profile locations), without hive loads.
$userProfilePaths = @{}
foreach ($userProfile in @(Get-SafeMatch $machineRoot 'Users/*')) {
    if ($userProfile.PSIsContainer) { $userProfilePaths[$userProfile.FullName] = $true }
}
if (-not $fixture) {
    try {
        foreach ($key in Get-ChildItem 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\ProfileList') {
            $path = [Environment]::ExpandEnvironmentVariables((Get-ItemProperty $key.PSPath).ProfileImagePath)
            if ($path -and $path.StartsWith('\\')) { Write-PartialStatus; continue }
            if ($path -and (Test-Path -LiteralPath $path)) {
                # Validate every ancestor, not just the leaf, before accepting custom roots.
                $drive = [IO.Path]::GetPathRoot($path)
                foreach ($userProfile in @(Get-SafeMatch $drive $path.Substring($drive.Length))) { $userProfilePaths[$userProfile.FullName] = $true }
            } elseif ($path) { Write-PartialStatus }
        }
    } catch { Write-PartialStatus }
}
foreach ($path in $userProfilePaths.Keys) { Read-Profile $path }
$priority = @{}
foreach ($sig in $Signatures) { $priority[$sig.id] = $(if ($sig.category -in @('desktop','cli','local-llm')) { 0 } else { 1 }) }
$ordered = @($script:Hits.Keys | Sort-Object @{Expression={ $priority[($_ -split '\.')[0]] }}, @{Expression={ $_ }})
$total = $ordered.Count
$ts = [DateTime]::UtcNow.ToString("yyyyMMdd'T'HHmmss'Z'")
$prefix = "SAI1;v=1.0.0;ts=$ts;os=win;st=$script:ScanStatus;n=$total;f="
$kept = $total
do {
    $tokens = if ($kept -gt 0) { ($ordered | Select-Object -First $kept) -join ',' } else { '' }
    $result = "$prefix$tokens;tr=$($total-$kept)"
    if ($result.Length -le $MaxLength) { break }
    $kept--
} while ($kept -ge 0)
# These are the only permitted writes. No adapter accepts endpoint-derived field names.
switch ($Rmm) {
    datto {
        if ($MaxLength -gt 255) { throw 'Datto UDF limit is 255' }
        New-ItemProperty -Path 'HKLM:\SOFTWARE\CentraStage' -Name "Custom$Udf" -PropertyType String -Value $result -Force | Out-Null
    }
    ninjaone { Ninja-Property-Set $Field $result | Out-Null }
    syncro {
        # RMM-provided module, loaded only for the explicitly selected field adapter.
        Import-Module $env:SyncroModule
        Set-Asset-Field -Name $Field -Value $result | Out-Null
    }
    superops {
        if (-not (Get-Command Send-CustomField -ErrorAction SilentlyContinue)) {
            $moduleVariable = Get-Variable -Name SuperOpsModule -ErrorAction SilentlyContinue
            if (-not $moduleVariable) { throw 'SuperOps module variable is unavailable' }
            Import-Module $moduleVariable.Value
        }
        Send-CustomField -CustomFieldName $Field -Value $result | Out-Null
    }
    # AMP / EDF / procedure / script-based custom-field mapping is operator-owned.
    default { }
}
Write-Output $result
