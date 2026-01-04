# Gyoshu Independence Contract

> **Gyoshu works completely standalone.** It requires only the OpenCode platform SDK and core tools.

This document formalizes Gyoshu's independence from other OpenCode extensions, particularly [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode).

---

## What Gyoshu Depends On

### Platform SDK (Peer Dependency)

| Dependency | Purpose | Installation |
|------------|---------|--------------|
| `@opencode-ai/plugin` | OpenCode extension SDK for tool definitions and agent integration | **Provided by OpenCode at runtime** |

This is a **peer dependency** provided by the OpenCode platform itself—you do NOT need to install it separately. When you run OpenCode, the SDK is automatically available to all extensions. This is the standard pattern used by all OpenCode extensions, similar to how React components don't bundle React itself.

### Core OpenCode Tools (Always Available)

These tools are part of the OpenCode platform and are always available:

| Tool | Purpose |
|------|---------|
| `read` | Read files from the filesystem |
| `write` | Write files to the filesystem |
| `glob` | Find files by pattern |
| `grep` | Search file contents |
| `bash` | Execute shell commands |
| `webfetch` | Fetch content from URLs |

### Optional MCP Tools (Graceful Fallback)

These MCP tools enhance Gyoshu when available, but are **NOT required**:

| Tool | Purpose | Fallback |
|------|---------|----------|
| `context7_*` | Library documentation lookup | `webfetch` to official docs |
| `grep_app_searchGitHub` | GitHub code search | Local `glob` + `grep` |

When MCP tools are unavailable, Gyoshu automatically uses fallback strategies documented in `src/agent/jogyo-insight.md`.

---

## What Gyoshu Does NOT Depend On

### No oh-my-opencode Agents

Gyoshu does **NOT** use any oh-my-opencode agents:

| Agent | Status |
|-------|--------|
| `@librarian` | ❌ NOT used - Use `@jogyo-insight` instead |
| `@oracle` | ❌ NOT used - Gyoshu has own planning in `@gyoshu` |
| `@explore` | ❌ NOT used - Use `@jogyo-insight` + local grep/glob |
| `@executor` | ❌ NOT used - Use `@jogyo` for code execution |

> **Note**: This independence refers to **agent delegation**, not child_process spawns. Gyoshu uses child_process to spawn the Python bridge, run system commands like `df` and `ps`, and invoke PDF converters—these are normal operations unrelated to oh-my-opencode.

### Gyoshu's Own Agent Stack

Gyoshu includes everything it needs for research:

| Agent | Role | What They Do |
|-------|------|--------------|
| `@gyoshu` | Professor | Plans research, orchestrates workflow |
| `@jogyo` | TA | Executes Python code, runs experiments |
| `@baksa` | PhD Reviewer | Challenges claims, verifies evidence |
| `@jogyo-insight` | Evidence Gatherer | Searches docs, finds examples |
| `@jogyo-feedback` | Learning Explorer | Reviews past sessions for patterns |
| `@jogyo-paper-writer` | Report Writer | Transforms findings into narrative reports |

---

## Verification

To verify Gyoshu's independence, run these checks:

### 1. No External Agent References

```bash
# Should return no matches
grep -ri "@librarian\|@oracle\|@explore\|@executor" src/ --include="*.md" --include="*.ts"
```

### 2. All Agent Files Exist

```bash
# Should list 6 agent files
ls src/agent/*.md
```

Expected: `baksa.md`, `gyoshu.md`, `jogyo.md`, `jogyo-feedback.md`, `jogyo-insight.md`, `jogyo-paper-writer.md`

### 3. Fallback Documentation Exists

```bash
# Should find the section
grep -l "Tool Fallbacks" src/agent/jogyo-insight.md
```

### 4. Tests Pass

```bash
# Python tests (bridge functionality)
pytest

# TypeScript tests (tools and utilities)
bun test
```

---

## Optional Companion

Gyoshu CAN work alongside oh-my-opencode for product development workflows, but this is **entirely optional**:

| Tool | Focus | Independent? |
|------|-------|--------------|
| **Gyoshu** | Research & Analysis | ✅ Fully standalone |
| **Oh-My-OpenCode** | Product Development | ✅ Fully standalone |

You do NOT need Oh-My-OpenCode to use Gyoshu. Each tool works independently.

---

## Namespacing (Collision Prevention)

All Gyoshu components use consistent prefixes to avoid conflicts:

- **Commands**: `/gyoshu`, `/gyoshu-auto`
- **Tools**: `python-repl`, `notebook-writer`, `session-manager`, `research-manager`, `gyoshu-*`
- **Agents**: `gyoshu`, `jogyo`, `jogyo-*`, `baksa`
- **Storage**: `./notebooks/`, `./reports/`

---

*Last verified: 2026-01-04*
