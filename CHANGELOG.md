# Changelog

All notable changes to Gyoshu (My-Jogyo) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-01-05

### Added

- **npm/bun package support** - Install via `bunx gyoshu install` or `npm install -g gyoshu`
- CLI tool (`bin/gyoshu.js`) with install/uninstall/check commands
- New agent files: executor, plan-reviewer, plan, task-orchestrator
- New command files: analyze-knowledge, analyze-plans, execute, generate-policy, generate-suggestions, learn, planner

### Changed

- Moved test files from `src/` to dedicated `tests/` directory
- Reorganized project structure for cleaner npm packaging

### Deprecated

- **literature-client** - Removed due to unreliable external API (Crossref/arXiv)
- **literature-search tool** - Removed (dependent on literature-client)
- Citations in reports now use fallback identifiers only (DOI links, arXiv IDs)

### Fixed

- Test imports updated for new directory structure

## [Unreleased]

### Added

- `/gyoshu doctor` command for system health checks and diagnostics
- 60-second first research tutorial in User Guide
- Troubleshooting section in README with common issues and fixes
- Supported platforms documentation (Linux, macOS, Windows WSL2)
- "What Gets Created" section showing notebooks/ and reports/ structure
- `install.sh --check` mode for pre-flight system verification
- Improved post-install guidance with numbered steps
- Comprehensive User Guide (`docs/user-guide.md`)
- FAQ document (`docs/faq.md`) with 14+ common questions
- Context-aware status display with tutorial hints for new users
- Demo media placeholder in README
- Update mechanism documentation in README

### Changed

- Python environment documentation now accurately reflects .venv-only support
- Removed claims of uv/poetry/conda support (planned for future release)
- Status display now shows helpful suggestions based on context
- install.sh now prints exact next commands after installation

---

[Unreleased]: https://github.com/Yeachan-Heo/My-Jogyo/compare/main...HEAD
