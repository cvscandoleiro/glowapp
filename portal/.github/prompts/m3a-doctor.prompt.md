---
description: "M3A Doctor — Installation health check and auto-fix. Validates all required files, YAML syntax, registry consistency, and orphaned references. Friendly output for non-technical users."
agent: "agent"
---

# /m3a-doctor — M3A Team Health Check

> **Validates your M3A installation and reports issues with clear, actionable guidance.**
> Non-technical friendly output: ✅ OK / ⚠️ Warning / ❌ Error per item.

---

## Behavior Rules

- **Read-only by default** — never modifies files without explicit `--fix` flag or user confirmation
- **Non-technical output** — no stack traces, no raw YAML errors; plain English per issue
- **Auto-fix scope** — only registry sync and agent version mismatch; never touches knowledge/ or backlog/
- **Always runs check-consistency.sh** if available in `scripts/`

---

## STEP 1 — Detect Install Location

```
Scan for M3A installation:

A) Project-level: .github/agents/m3a-orchestrator.agent.md EXISTS
   → INSTALL_TYPE = project
   → AGENTS_PATH = .github/agents/
   → MMA_PATH = .github/mma/

B) User-level: $VSCODE_USER_PROMPTS/m3a-orchestrator.agent.md EXISTS
   → INSTALL_TYPE = user
   → AGENTS_PATH = $VSCODE_USER_PROMPTS/
   → MMA_PATH = null (user-level has no mma/ folder)

C) Neither found → report not installed and stop
```

---

## STEP 2 — Required Files Check

For each item below, report ✅ / ❌:

**Project-level required files:**
```
.github/mma/config.yaml
.github/mma/knowledge/team-config.md
.github/mma/knowledge/decisions-log.md (or project-decisions-log.md)
.github/mma/backlog/sprints/sprint-status.yaml
.github/agents/m3a-orchestrator.agent.md
.github/agents/ (all 12 agents present)
```

**User-level required files:**
```
$VSCODE_USER_PROMPTS/m3a-orchestrator.agent.md
$VSCODE_USER_PROMPTS/m3a-version.txt
```

---

## STEP 3 — Agent Version Sync Check

For each agent file:
```
Read frontmatter: agent-version: "X.Y.Z"
Read body: **Version:** X.Y.Z
IF mismatch → ⚠️ report which file and both values
IF match → ✅
```

Auto-fix available: sync body version to match frontmatter (with user confirmation).

---

## STEP 4 — Registry Consistency Check

```
Read core/registry/skills.registry.yaml (or .github/mma equivalent)
For each skill entry → check that the file: path exists
IF missing file → ⚠️ orphaned registry entry
Read core/registry/workflows.registry.yaml
For each workflow entry → check that the file: path exists
IF missing file → ⚠️ orphaned registry entry
```

Auto-fix: remove orphaned entries (with user confirmation).

---

## STEP 5 — Hooks Check

```
IF .github/mma/hooks/tool-guardian.yaml EXISTS → ✅ Tool Guardian active
IF NOT EXISTS → ⚠️ Tool Guardian not installed
  → Offer to install from template
```

---

## STEP 6 — Pattern Library Check

```
IF .github/mma/knowledge/patterns/ EXISTS → ✅ Pattern library initialized
IF NOT EXISTS → ℹ️ Pattern library not initialized (optional feature)
  → Offer to initialize from template
```

---

## STEP 7 — Run check-consistency.sh (if available)

```
IF scripts/check-consistency.sh EXISTS:
  → Run it and capture output
  → Parse results: PASS / WARN / FAIL per check
  → Include in final report
```

---

## STEP 8 — Final Report

Emit a table:

```
🏥 M3A Doctor — Health Report
Installation: [project-level / user-level] | Project: {{PROJECT_NAME}}

✅ config.yaml ......................... found
✅ team-config.md ...................... found
✅ 12 agents ........................... all present
⚠️ skills.registry.yaml ............... 1 orphaned entry: m3a-old-skill
✅ workflows.registry.yaml ............. consistent
✅ Tool Guardian ....................... active
ℹ️ Pattern Library ..................... not initialized

Found: [N] issues — [N] auto-fixable.
Run /m3a-doctor --fix to auto-correct fixable issues.
```

---

## Auto-Fix Mode (`/m3a-doctor --fix`)

When `--fix` is appended:
1. List all auto-fixable issues
2. Ask human: "Fix these [N] issues? (yes/no)"
3. IF yes → apply fixes one by one, report each
4. IF no → report only, no changes

**Auto-fixable:**
- ✅ Orphaned registry entries (remove)
- ✅ Agent version mismatch (sync body to frontmatter)
- ✅ Missing pattern library folder (create from template)
- ✅ Missing tool-guardian.yaml (install from template)

**NOT auto-fixable (human must fix):**
- ❌ Missing required files (config.yaml, team-config.md)
- ❌ YAML syntax errors
- ❌ Missing agents
