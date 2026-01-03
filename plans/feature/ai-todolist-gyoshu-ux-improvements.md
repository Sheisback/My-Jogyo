# Gyoshu UX Improvements - Comprehensive Overhaul

> **Goal:** Transform the user journey from discovery to daily usage
> **Effort:** ~5 days | **Priority:** High
> **Created:** 2026-01-03

## Overview

Based on Oracle's deep analysis, this plan addresses:
1. **Installation gaps** - "I installed it but it doesn't run"
2. **First-run experience** - "I don't know what to do next"
3. **Documentation** - Separate user-facing from developer docs
4. **Polish** - Context-aware help and update mechanism

## Todo List

### Phase 1: Quick Wins (Day 1) — ~4 hours

- [x] 1. README - Add Troubleshooting Section
  - **File:** `README.md`
  - **Effort:** 30 min | **Parallelizable:** YES (with 2, 3, 4)
  - Add section covering top failure modes:
    - "No .venv found" error → create venv instructions
    - "Bridge failed to start" → Python version check, socket path issues
    - "Session locked" → `/gyoshu unlock` command
    - OpenCode not in PATH → installation link
  - **Success:** Section appears before License, covers top 4 failure modes

- [x] 2. README - Add Supported Platforms Statement
  - **File:** `README.md`
  - **Effort:** 15 min | **Parallelizable:** YES (with 1, 3, 4)
  - Add to Requirements section:
    - Linux (primary, tested on Ubuntu 22.04+)
    - macOS (supported, Intel & Apple Silicon)
    - Windows (WSL2 only, native not supported)
  - **Success:** Clear platform table in Requirements section

- [x] 3. README - Add Demo Media Placeholder
  - **File:** `README.md`
  - **Effort:** 15 min | **Parallelizable:** YES (with 1, 2, 4)
  - Add placeholder in Features section with TODO comment
  - Link to user-guide.md (created in Phase 3)
  - **Success:** Placeholder exists, links to tutorial

- [x] 4. README - Add "What Gets Created" Section
  - **File:** `README.md`
  - **Effort:** 30 min | **Parallelizable:** YES (with 1, 2, 3)
  - Show notebooks/ and reports/ structure
  - Clarify what Gyoshu does NOT modify (.venv, data/, etc.)
  - **Success:** Clear artifact visualization

- [x] 5. install.sh - Add --check Mode
  - **File:** `install.sh`
  - **Effort:** 1 hour | **Parallelizable:** NO (must complete before 6)
  - Add `--check` flag for smoke tests:
    1. Check OpenCode exists: `command -v opencode`
    2. Check Python 3.10+: `python3 --version`
    3. Check core packages: `python3 -c "import pandas; import numpy"`
    4. Print pass/fail summary
  - **Success:** Returns exit 0 on success, 1 on failure, clear output

- [x] 6. install.sh - Print Exact Next Commands
  - **File:** `install.sh`
  - **Effort:** 30 min | **Parallelizable:** NO (depends on 5)
  - Improve post-install message with numbered steps:
    1. Start OpenCode in your project
    2. Create Python environment (if needed)
    3. Start first research with wine_quality.csv example
  - **Success:** Shows actionable next steps with example commands

### Phase 2: First-Run Experience (Day 2-3) — ~8 hours

- [x] 7. Implement /gyoshu doctor Command
  - **File:** `src/command/gyoshu.md`
  - **Effort:** 2 hours | **Parallelizable:** NO (foundational)
  - Add `doctor` subcommand that checks:
    - OpenCode context (`process.env.OPENCODE`)
    - Python version (3.10+)
    - .venv exists (`.venv/bin/python`)
    - Bridge spawn test (`print("ok")`)
    - notebooks/ directory writable
    - Core packages importable (pandas, numpy)
  - Display table with ✅/❌/⚠️ status for each check
  - Provide actionable fix suggestions for failures
  - **Success:** All 6 checks verified, clear pass/fail output

- [x] 8. Align Python Env Support - Narrow README
  - **Files:** `README.md`, `AGENTS.md`
  - **Effort:** 1 hour | **Parallelizable:** YES (with 7)
  - Update README Python Environment section:
    - Remove claims of uv/poetry/conda support
    - Document .venv as primary (GYOSHU_PYTHON_PATH for custom)
    - Add note: "uv/poetry/conda support planned for future"
  - Update AGENTS.md "Python Environment Management" to match
  - **Success:** Docs match code reality (python-repl.ts only supports .venv)

- [x] 9. Create 60-Second First Research Tutorial
  - **File:** `docs/user-guide.md` (create)
  - **Effort:** 3 hours | **Parallelizable:** NO (depends on 7, 8)
  - Tutorial using bundled wine_quality.csv:
    - Step 1: Create Python environment (30 seconds)
    - Step 2: Run /gyoshu doctor (10 seconds)
    - Step 3: Start research (20 seconds)
  - Include expected output at each step
  - **Success:** Reproducible in <60 seconds for new user

- [x] 10. Update Status Display with Tutorial Hint
  - **File:** `src/command/gyoshu.md`
  - **Effort:** 30 min | **Parallelizable:** NO (depends on 9)
  - When no researches found, show:
    - Tutorial suggestion with wine_quality.csv command
    - /gyoshu doctor recommendation
  - **Success:** First-time users see helpful guidance

### Phase 3: Polish (Day 4-5) — ~8 hours

- [x] 11. Expand docs/user-guide.md (Full Version)
  - **File:** `docs/user-guide.md`
  - **Effort:** 3 hours | **Parallelizable:** YES (with 12, 13, 14)
  - Expand tutorial from Task 9 into comprehensive guide:
    - Getting Started (60-second tutorial)
    - Core Concepts (research, runs, notebooks, markers)
    - Workflows (interactive, autonomous, REPL)
    - Managing Research (continue, search, list, report)
    - Troubleshooting (/gyoshu doctor, common issues)
  - **Success:** Covers all /gyoshu subcommands with examples

- [x] 12. Create docs/faq.md
  - **File:** `docs/faq.md` (create)
  - **Effort:** 2 hours | **Parallelizable:** YES (with 11, 13, 14)
  - Answer 10+ common questions:
    - Installation: Windows support? Python version? Updates?
    - Usage: Where are notebooks? How to continue? Output markers?
    - Troubleshooting: No .venv? Session locked? Bridge failed?
    - Integration: Jupyter Lab? Git?
  - **Success:** Each answer includes example commands

- [x] 13. Create CHANGELOG.md
  - **File:** `CHANGELOG.md` (create)
  - **Effort:** 1 hour | **Parallelizable:** YES (with 11, 12, 14)
  - Follow Keep a Changelog format
  - Document all changes from this UX improvement
  - Include placeholder for release date
  - **Success:** Properly formatted, documents all changes

- [x] 14. Document Update Mechanism in README
  - **File:** `README.md`
  - **Effort:** 30 min | **Parallelizable:** YES (with 11, 12, 13)
  - Add "Updating" section:
    - Option 1: Re-run installer (curl command)
    - Option 2: Pull and re-install
    - Check version with /gyoshu doctor
    - Link to CHANGELOG.md
  - **Success:** Clear update instructions

- [x] 15. Enhance /gyoshu Status with Next Best Action
  - **File:** `src/command/gyoshu.md`
  - **Effort:** 1 hour | **Parallelizable:** NO (depends on 11-14)
  - Context-aware status display:
    - No researches: Show tutorial + getting started
    - Active research: Show continue command
    - Completed only: Show options (continue/new)
  - **Success:** Three distinct scenarios with smart suggestions

---

## Implementation Sequence

```
Day 1 (Tasks 1-6):
├── [Parallel] Tasks 1, 2, 3, 4 (README sections)
├── [Sequential] Task 5 (install.sh --check)
└── [Sequential] Task 6 (install.sh next commands)

Day 2-3 (Tasks 7-10):
├── [Parallel] Task 7, 8 (doctor command + env alignment)
├── [Sequential] Task 9 (tutorial, depends on 7, 8)
└── [Sequential] Task 10 (status hint, depends on 9)

Day 4-5 (Tasks 11-15):
├── [Parallel] Tasks 11, 12, 13, 14 (docs + changelog)
└── [Sequential] Task 15 (enhanced status, depends on all)
```

---

## Files Summary

| File | Action | Tasks |
|------|--------|-------|
| `README.md` | Modify | 1, 2, 3, 4, 8, 14 |
| `install.sh` | Modify | 5, 6 |
| `src/command/gyoshu.md` | Modify | 7, 10, 15 |
| `AGENTS.md` | Modify | 8 |
| `docs/user-guide.md` | Create | 9, 11 |
| `docs/faq.md` | Create | 12 |
| `CHANGELOG.md` | Create | 13 |

---

## Definition of Done

- [x] `./install.sh --check` passes on fresh Linux install
- [x] `/gyoshu doctor` shows all checks passing
- [x] `/gyoshu` (no args) shows context-aware next actions
- [x] 60-second tutorial is reproducible
- [x] README troubleshooting covers all error paths
- [x] No uv/poetry/conda claims in docs
- [x] CHANGELOG.md documents all changes
- [x] All source tests pass (`bun test src/`)

---

## Must NOT Have

- Claims of uv/poetry/conda support (until implemented)
- Broken links in docs
- New npm/pip dependencies
- Changes to src/tool/*.ts (docs-only for env alignment)
- Auto-generated documentation
