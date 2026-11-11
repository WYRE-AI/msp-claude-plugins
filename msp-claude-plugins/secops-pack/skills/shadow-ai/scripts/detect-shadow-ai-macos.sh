#!/bin/bash
# shellcheck disable=SC2034
# SC2034: TSV schema columns retained for review.
OS=mac
# BEGIN SAI SIGNATURES
SIGNATURES=$(cat <<'SAI_SIGNATURES'
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
SAI_SIGNATURES
)
# END SAI SIGNATURES
# Inventory only: no detected executable is launched. No temporary files.
# SAI_ROOT is a fixture root; adapters other than stdout are forbidden in fixtures.
LC_ALL=C
export LC_ALL
ROOT=${SAI_ROOT:-}
RMM=${RMM:-stdout}
FIELD=${FIELD:-ShadowAIInventory}
MAX_LEN=${MAX_LEN:-255}
case "$MAX_LEN" in ''|*[!0-9]*) echo 'Invalid MAX_LEN' >&2; exit 2;; esac
if [ "${#MAX_LEN}" -gt 5 ]; then exit 2; fi
if [ "$MAX_LEN" -lt 100 ] || [ "$MAX_LEN" -gt 65535 ]; then exit 2; fi
case "$RMM" in stdout|datto|ninjaone|ncentral|syncro|superops|cwautomate|atera|kaseyavsa) ;; *) exit 2;; esac
[ "$RMM" != datto ] || [ "$MAX_LEN" -le 255 ] || exit 2
case "$FIELD" in ''|*[!a-zA-Z0-9_]*) echo 'Invalid FIELD' >&2; exit 2;; esac
if [ -n "$ROOT" ]; then
    case "$ROOT" in /*) ;; *) exit 2;; esac
    [ "$RMM" = stdout ] || exit 2
fi
DEADLINE=$(( $(date +%s) + 120 ))
TAB=$(printf '\t')
# Expand one component at a time, never traversing a symlink, including ancestors.
# Each directory is capped at 2000 entries. Subshell recursion isolates variables.
expand() (
    if [ "$(date +%s)" -gt "$DEADLINE" ]; then printf '!\n'; exit; fi
    parent=$1 rest=$2
    if [ -L "$parent" ]; then printf '!\n'; exit; fi
    if [ ! -d "$parent" ]; then exit; fi
    if [ ! -r "$parent" ] || [ ! -x "$parent" ]; then printf '!\n'; exit; fi
    part=${rest%%/*}
    tail=
    [ "$part" = "$rest" ] || tail=${rest#*/}
    count=0
    # Intentional trusted-signature glob; spaces in parent and pattern preserved.
    # shellcheck disable=SC2086
    for entry in "$parent"/$part; do
        [ -e "$entry" ] || [ -L "$entry" ] || continue
        count=$((count + 1))
        if [ "$count" -gt 2000 ]; then printf '!\n'; break; fi
        if [ -L "$entry" ]; then printf '!\n'; continue; fi
        if [ -n "$tail" ]; then expand "$entry" "$tail"; else
            [ -r "$entry" ] || printf '!\n'
            printf '%s\n' "$entry"
        fi
    done
)
safe_expand() {
    expand / "${1#/}" | awk 'NR<=2000 {print} NR==2001 {print "!";exit}'
}
# Only JSON schema fields are read; endpoint strings never enter the result.
# Python is optional; missing interpreter/malformed/oversized JSON makes scan partial.
json_names() {
    if [ "$OS" = mac ] && [ -z "$ROOT" ] && [ -x /usr/bin/plutil ]; then
        if [ "$(wc -c < "$1")" -gt 1048576 ] || ! /usr/bin/plutil -lint "$1" >/dev/null 2>&1; then printf '!\n'; return; fi
        if [ "$2" = firefox ]; then
            addons=$(/usr/bin/plutil -extract addons json -o - "$1" 2>/dev/null) || { printf '!\n'; return; }
            case "$addons" in \[*) ;; *) printf '!\n'; return;; esac
            index=0
            while /usr/bin/plutil -extract "addons.$index" json -o - "$1" >/dev/null 2>&1; do
                if [ "$index" -ge 2000 ]; then printf '!\n'; break; fi
                active=$(/usr/bin/plutil -extract "addons.$index.active" raw -o - "$1" 2>/dev/null)
                if [ "$active" != false ]; then
                    /usr/bin/plutil -extract "addons.$index.defaultLocale.name" raw -o - "$1" 2>/dev/null || printf '!\n'
                fi
                index=$((index + 1))
            done
        else
            name=$(/usr/bin/plutil -extract name raw -o - "$1" 2>/dev/null) || { printf '!\n'; return; }
            if [ -z "$name" ]; then printf '!\n'; return; fi
            case "$name" in
                *__MSG_*)
                    locale=$(/usr/bin/plutil -extract default_locale raw -o - "$1" 2>/dev/null) || { printf '!\n'; return; }
                    key=${name#\_\_MSG_}; key=${key%__}
                    case "$locale:$key" in *[!a-zA-Z0-9_:@-]*|:*) printf '!\n'; return;; esac
                    messages=$(safe_expand "${1%/*}/_locales/$locale/messages.json")
                    case "$messages" in ''|*'!'*) printf '!\n'; return;; esac
                    if [ "$(wc -c < "$messages")" -gt 1048576 ]; then printf '!\n'; return; fi
                    /usr/bin/plutil -extract "$key.message" raw -o - "$messages" 2>/dev/null || printf '!\n';;
                *) printf '%s\n' "$name";;
            esac
        fi
        return
    fi
    if ! command -v python3 >/dev/null 2>&1; then printf '!\n'; return; fi
    python3 -I -S -B -c '
import json,sys,os,re
try:
 with open(sys.argv[1], "rb") as f: raw=f.read(1048577)
 if len(raw)>1048576: raise ValueError()
 obj=json.loads(raw)
 if not isinstance(obj,dict): raise ValueError()
 if sys.argv[2]=="firefox" and not isinstance(obj.get("addons"),list): raise ValueError()
 if sys.argv[2]=="firefox" and len(obj.get("addons",[]))>2000: raise ValueError()
 names=([a.get("defaultLocale",{}).get("name", "") for a in obj.get("addons",[]) if a.get("active",True)] if sys.argv[2]=="firefox" else [obj.get("name", "")])
 for name in names:
  if isinstance(name,str) and name.startswith("__MSG_"):
   locale=obj.get("default_locale", "")
   token=re.fullmatch(r"__MSG_([A-Za-z0-9_@]+)__",name)
   if not token or not re.fullmatch(r"[A-Za-z0-9_-]+",locale): raise ValueError()
   folder=os.path.dirname(sys.argv[1])
   for part in ["_locales",locale,"messages.json"]:
    folder=os.path.join(folder,part)
    if os.path.islink(folder): raise ValueError()
   with open(folder,"rb") as f: messages=f.read(1048577)
   if len(messages)>1048576: raise ValueError()
   name=json.loads(messages)[token.group(1)]["message"]
  if not isinstance(name,str) or not name or "__MSG_" in name or "\n" in name or "\r" in name: print("!")
  else: print(name)
except Exception: print("!")
' "$1" "$2" 2>/dev/null || printf '!\n'
}
match_names() {
    # $NAMES is bounded metadata; only canonical IDs are emitted.
    while IFS="$TAB" read -r sid product vendor category sos scope kind pattern confidence notes; do
        if [ "$sos" != "$OS" ] || [ "$kind" != "$1" ]; then continue; fi
        if printf '%s\n' "$NAMES" | grep -Eiq -- "$pattern"; then printf '%s.%s\n' "$sid" "$2"; fi
    done <<EOF
$SIGNATURES
EOF
}
scan_root() (
    base=$1 target_scope=$2
    if [ "$(date +%s)" -gt "$DEADLINE" ]; then printf '!\n'; exit; fi
    while IFS="$TAB" read -r sid product vendor category sos scope kind pattern confidence notes; do
        if [ "$sos" != "$OS" ] || [ "$scope" != "$target_scope" ]; then continue; fi
        if [ "$(date +%s)" -gt "$DEADLINE" ]; then printf '!\n'; break; fi
        case "$kind" in
            path) paths=$(safe_expand "$base/$pattern");;
            vscode)
                paths=
                for editor in .vscode .vscode-insiders .vscode-oss .vscodium .cursor .windsurf; do
                    paths="$paths
$(safe_expand "$base/$editor/extensions/$pattern")"
                done;;
            jetbrains)
                if [ "$OS" = mac ]; then
                    paths=$(safe_expand "$base/Library/Application Support/JetBrains/*/plugins/$pattern")
                else
                    paths=$(safe_expand "$base/.local/share/JetBrains/*/$pattern")
                    paths="$paths
$(safe_expand "$base/.local/share/JetBrains/*/plugins/$pattern")"
                fi;;
            *) continue;;
        esac
        if printf '%s\n' "$paths" | grep -q '^!$'; then printf '!\n'; fi
        if printf '%s\n' "$paths" | grep -q '^/'; then printf '%s.%s\n' "$sid" "$scope"; fi
    done <<EOF
$SIGNATURES
EOF
    [ "$target_scope" = u ] || exit
    if [ "$OS" = mac ]; then
        browsers='Library/Application Support/Google/Chrome
Library/Application Support/Microsoft Edge
Library/Application Support/BraveSoftware/Brave-Browser'
        firefox='Library/Application Support/Firefox/Profiles'
    else
        browsers='.config/google-chrome
.config/chromium
.config/microsoft-edge
.config/BraveSoftware/Brave-Browser
snap/chromium/common/chromium
.var/app/com.google.Chrome/config/google-chrome
.var/app/org.chromium.Chromium/config/chromium
.var/app/com.microsoft.Edge/config/microsoft-edge
.var/app/com.brave.Browser/config/BraveSoftware/Brave-Browser'
        firefox='.mozilla/firefox
snap/firefox/common/.mozilla/firefox
.var/app/org.mozilla.firefox/.mozilla/firefox'
    fi
    oldifs=$IFS
    IFS='
'
    for browser in $browsers; do
        manifests=$(safe_expand "$base/$browser/*/Extensions/*/*/manifest.json")
        for manifest in $manifests; do
            if [ "$manifest" = '!' ]; then printf '!\n'; continue; fi
            NAMES=$(json_names "$manifest" chromium)
            printf '%s\n' "$NAMES" | grep -q '^!$' && printf '!\n'
            match_names manifest u
        done
        # Installed PWA web-app manifests use the same JSON schema when present.
        manifests=$(safe_expand "$base/$browser/*/Web Applications/Manifest Resources/*/manifest.json")
        for manifest in $manifests; do
            if [ "$manifest" = '!' ]; then printf '!\n'; continue; fi
            NAMES=$(json_names "$manifest" chromium)
            printf '%s\n' "$NAMES" | grep -q '^!$' && printf '!\n'
            match_names pwa u
        done
    done
    for browser in $firefox; do
        manifests=$(safe_expand "$base/$browser/*/extensions.json")
        for manifest in $manifests; do
            if [ "$manifest" = '!' ]; then printf '!\n'; continue; fi
            NAMES=$(json_names "$manifest" firefox)
            printf '%s\n' "$NAMES" | grep -q '^!$' && printf '!\n'
            match_names manifest u
        done
    done
    IFS=$oldifs
    if [ "$OS" = lin ]; then
        for place in .local/share/flatpak/app .local/share/applications; do
            entries=$(safe_expand "$base/$place/*")
            NAMES=$(printf '%s\n' "$entries" | sed 's|.*/||')
            match_names package u
            printf '%s\n' "$entries" | grep -q '^!$' && printf '!\n'
            if [ "$place" = .local/share/applications ]; then
                IFS='
'
                for file in $entries; do
                    [ "$file" = '!' ] && continue
                    [ -f "$file" ] || continue
                    case "$file" in *.desktop) ;; *) continue;; esac
                    if [ ! -r "$file" ] || [ "$(wc -c < "$file")" -gt 1048576 ]; then printf '!\n'; continue; fi
                    NAMES=$(sed -n 's/^Name=//p' "$file" 2>/dev/null) || printf '!\n'
                    match_names pwa u
                    match_names shortcut u
                done
                IFS=$oldifs
            fi
        done
    fi
)
scan() {
    scan_root "${ROOT:-/}" m
    if [ "$(id -u)" -ne 0 ]; then printf '!\n'; fi
    if [ "$OS" = mac ]; then profile_pattern=Users; else profile_pattern=home; fi
    profiles=$(safe_expand "$ROOT/$profile_pattern/*")
    oldifs=$IFS
    IFS='
'
    if [ "$OS" = mac ]; then admin_profile="$ROOT/var/root"; else admin_profile="$ROOT/root"; fi
    for profile in $profiles "$admin_profile"; do
        if [ "$profile" = '!' ]; then printf '!\n'; continue; fi
        if [ "$(date +%s)" -gt "$DEADLINE" ]; then printf '!\n'; break; fi
        [ -d "$profile" ] || continue
        scan_root "$profile" u
    done
    IFS=$oldifs
    if [ "$OS" = lin ]; then
        # Read dpkg DB directly, avoiding locks and helper executables.
        db="$ROOT/var/lib/dpkg/status"
        paths=$(safe_expand "$db")
        if [ "$paths" = '!' ]; then printf '!\n'; elif [ -f "$db" ]; then
            NAMES=$(awk 'BEGIN {RS=""; FS="\n"} /Status: install ok installed/ {for(i=1;i<=NF;i++) if($i ~ /^Package: /) print substr($i,10)}' "$db" 2>/dev/null) || printf '!\n'
            match_names package m
        fi
        # RPM only with a hard timeout and never in fixture mode. No snap/flatpak launch.
        if [ -z "$ROOT" ] && command -v rpm >/dev/null 2>&1; then
            if command -v timeout >/dev/null 2>&1; then
                NAMES=$(timeout 10 rpm -qa --qf '%{NAME}\n' 2>/dev/null) || printf '!\n'
                match_names package m
            else printf '!\n'; fi
        fi
        for place in snap var/lib/flatpak/app usr/share/applications; do
            entries=$(safe_expand "$ROOT/$place/*")
            printf '%s\n' "$entries" | grep -q '^!$' && printf '!\n'
            # Package patterns match basenames; Flatpak reverse DNS names are conservatively reviewed.
            NAMES=$(printf '%s\n' "$entries" | sed 's|.*/||')
            match_names package m
            if [ "$place" = usr/share/applications ]; then
                IFS='
'
                for file in $entries; do
                    [ "$file" = '!' ] && continue
                    [ -f "$file" ] || continue
                    case "$file" in *.desktop) ;; *) continue;; esac
                    if [ ! -r "$file" ] || [ "$(wc -c < "$file")" -gt 1048576 ]; then printf '!\n'; continue; fi
                    NAMES=$(sed -n 's/^Name=//p' "$file" 2>/dev/null) || printf '!\n'
                    match_names pwa m
                    match_names shortcut m
                done
                IFS=$oldifs
            fi
        done
    fi
}
RAW=$(scan)
STATUS=ok
printf '%s\n' "$RAW" | grep -q '^!$' && STATUS=partial
# Sort by canonical category priority, then ID/scope; deduplicate evidence sources.
HITS=$(printf '%s\n' "$RAW" | awk -F. '/^[a-z][a-z0-9]*\.[mu]$/ {print}' | sort -u)
ORDERED=$(printf '%s\n' "$SIGNATURES" | awk -F '\t' '{p=($4=="desktop"||$4=="cli"||$4=="local-llm")?0:1; if($1!="id") print p" "$1}' | sort -u | while read -r priority sid; do
    printf '%s\n' "$HITS" | grep -E "^$sid\.[mu]$" || :
done)
TOTAL=$(printf '%s\n' "$HITS" | awk 'NF {n++} END {print n+0}')
TS=$(date -u '+%Y%m%dT%H%M%SZ')
PREFIX="SAI1;v=1.0.0;ts=$TS;os=$OS;st=$STATUS;n=$TOTAL;f="
TOKENS=$(printf '%s\n' "$ORDERED" | paste -sd, -)
DROPPED=0
while :; do
    RESULT="$PREFIX$TOKENS;tr=$DROPPED"
    [ "${#RESULT}" -le "$MAX_LEN" ] && break
    case "$TOKENS" in *,*) TOKENS=${TOKENS%,*};; *) TOKENS=;; esac
    DROPPED=$((DROPPED + 1))
done
case "$RMM" in
    ninjaone)
        if [ "$OS" = mac ]; then cli=/Applications/NinjaRMMAgent/programdata/ninjarmm-cli; else cli=/opt/NinjaRMMAgent/programdata/ninjarmm-cli; fi
        "$cli" set "$FIELD" "$RESULT" >/dev/null || exit 3;;
    superops)
        # Linux: select Bash in the RMM runner; module functions use Bash syntax.
        if [ -z "${BASH_VERSION:-}" ] || [ -z "${SuperOpsModule:-}" ]; then
            echo 'SuperOps adapter requires Bash and the RMM-provided module' >&2; exit 3
        fi
        # shellcheck disable=SC1090
        . "$SuperOpsModule"
        Send-CustomField "$FIELD" "$RESULT" >/dev/null || exit 3;;
    syncro)
        if [ "$OS" = mac ]; then
            syncro set-asset-field --name="$FIELD" --value="$RESULT" >/dev/null || exit 3
        else echo 'Syncro Linux field adapter not verified; stdout only' >&2; fi;;
    # Other platforms use operator-managed output mapping or stdout-only fallback.
    *) ;;
esac
printf '%s\n' "$RESULT"
