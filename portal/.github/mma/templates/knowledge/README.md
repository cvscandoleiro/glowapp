# {{PROJECT_NAME}} — Knowledge Base

> This directory contains the authoritative technical knowledge base for `{{PROJECT_NAME}}`.
> Every agent reads this directory on activation (Law 1).
> Every agent updates this directory when new knowledge is discovered (Law 4).

---

## Directory Structure

```
{{PATH_KNOWLEDGE}}
├── README.md                        ← This file — index and guide
├── team-config.md                   ← 13 Laws + Agent table + Project governance
├── project-architecture.md          ← AS-IS architecture, modules, dependencies
├── project-conventions.md           ← Coding conventions, patterns, standards
├── project-decisions-log.md         ← Chronological decision log (ADR references)
└── agents-changelog.md              ← Agent version history (Law 11)
```

---

## File Descriptions

### `team-config.md`
**Purpose:** Governing laws and team configuration.
**Contents:**
- 13 inviolable laws
- Agent table with personas
- Project context (stack, paths, governance settings)
- Governance overrides

**Updated by:** Orchestrator agent (on law changes or project reconfiguration)
**Read by:** All agents on every activation

---

### `project-architecture.md`
**Purpose:** Technical AS-IS snapshot of the system architecture.
**Contents:**
- Module/component inventory
- Technology stack details
- Integration points
- Known constraints and risks
- Dependency map

**Updated by:** Analyst (deep scan), Architect (TO-BE updates)
**Read by:** All agents (dev, qa, security, devops especially)

---

### `project-conventions.md`
**Purpose:** Project-specific patterns and standards discovered in the codebase.
**Contents:**
- Package/namespace structure
- Naming conventions
- Build commands (exact commands that work)
- Configuration patterns
- Known pitfalls and gotchas
- Encoding or charset specifics

**Updated by:** Developer (when discovering patterns), Analyst (during scans)
**Read by:** Developer (before every implementation), Architect, DevOps

---

### `project-decisions-log.md`
**Purpose:** Chronological record of significant decisions made during the project.
**Contents:**
- ADR registry (ID, title, status, date)
- Learning log (discoveries that don't warrant a full ADR)
- Pending decisions
- Superseded decisions

**Updated by:** Architect (ADR creation), any agent (learning log)
**Read by:** Architect, PM, Orchestrator

---

### `agents-changelog.md`
**Purpose:** Version history for all agent files (Law 11).
**Contents:**
- Per-agent version history
- Date, version, what changed

**Format:**
```
## m3a-[agent-name]
- X.Y.Z (YYYY-MM-DD): [What changed — PATCH/MINOR/MAJOR reason]
```

**Updated by:** Any agent that receives an update (mandatory per Law 11)
**Read by:** Orchestrator (validates compliance)

---

## Knowledge Base Rules

### Rule 1: Append, Don't Replace

When adding a learning entry or updating a section, **append** the new information
unless the old information is factually incorrect. Preserve history.

### Rule 2: Timestamp All Entries

Every addition to the learning log must include:
```
**[YYYY-MM-DD] [AgentName]:** [Learning] | Context: [situation]
```

### Rule 3: Link Don't Duplicate

If detailed documentation exists in `docs/`, reference it from the knowledge base
rather than duplicating content.

### Rule 4: Technical Precision

Knowledge base entries should be technically precise:
- Include specific file paths when referencing code
- Include actual version numbers
- Include observed behavior, not assumptions

---

## Quick Reference: Key Paths

| Resource | Path |
|---|---|
| Knowledge base | `{{PATH_KNOWLEDGE}}` |
| Agent files | `{{PATH_AGENTS}}` |
| Prompt files | `{{PATH_PROMPTS}}` |
| Epics | `{{PATH_EPICS}}` |
| Stories | `{{PATH_STORIES}}` |
| Sprint status | `{{PATH_SPRINT_STATUS}}` |
| Decisions/ADRs | `{{PATH_DECISIONS}}` |
| Documentation output | `{{PATH_DOCS}}` |
| HTML documentation | `{{PATH_HTML}}` |
| Project config | `.github/mma/config.yaml` |

---

## Adding New Knowledge Files

For significant topic areas, agents may create additional `.md` files in this directory.

**Recommended naming pattern:**
- `module-[name].md` — deep analysis of a specific module
- `dependency-[name].md` — specific dependency notes
- `cve-summary.md` — CVE tracking
- `upgrade-notes.md` — migration-specific findings

**Before creating a new file:**
1. Check if information fits in an existing file (Law 3 — Anti-Duplicate)
2. If new file warranted, add it to the index above

---

*Path: `{{PATH_KNOWLEDGE}}README.md`*
*Maintained by {{ORG_LEGAL}} — {{TEAM_NAME}}*
