---
description: "MMA Restore Customizations — Post-upgrade recovery skill. Borges analyzes backup vs current installation, identifies user-added sections and modified lines, then restores selected customizations surgically into the updated files."
agent: "agent"
---

# /m3a-restore-customizations — Restore User Customizations After Upgrade

> **Recover your customizations after an MMA upgrade.**
> Borges identifies exactly what you added or changed — and puts it back precisely.

---

## Behavior Rules

- **Non-destructive** — never overwrites framework updates; only injects user customizations
- **Borges-led** — `M3A: Docs` performs the diff analysis per file
- **Surgical application** — user customizations are inserted at the correct positions in current files
- **Selective** — user chooses what to restore; nothing is restored without explicit selection
- **One-time operation** — after running, log restoration in `.github/mma/logs/m3a-update.log`

---

## STEP 0 — Detect Scope

```
Same detection logic as /m3a-update-latest STEP 0:
  Project-level: .github/agents/ exists
  User-level:    OS-specific prompts folder

IF both: ask [1] Project / [2] User / [3] Both
```

---

## STEP 1 — List Available Backups

```
Scan backup directory for each scope:
  Project-level: .github/mma/backups/
  User-level:    OS-specific backups folder

List backups in reverse chronological order:

  Available backups:
  [1] 2026-05-14-1430  (from v1.4.0 → upgraded to v1.5.0)  — 23 files
  [2] 2026-04-20-0900  (from v1.3.0 → upgraded to v1.4.0)  — 18 files

  Which backup to restore from? [1/2/...]
  (Tip: choose the most recent one unless you need to recover older changes)

IF no backups found:
  → "No backups found at [path]."
  → "Run /m3a-update-latest first to create a backup before upgrading."
  → STOP
```

---

## STEP 2 — Borges Analysis

```
For the selected backup, delegate to:
  runSubagent("M3A: Docs", "restore-customizations analysis:
    backup_path: [selected backup path]
    current_path: [current install path]
    scope: [project/user]
    task: Compare each agent/skill/workflow file in backup vs current.
          For each file, identify:
          1. Sections present ONLY in backup (user-added sections)
          2. Lines within shared sections that differ (user modifications)
          3. Sections present ONLY in current (new framework additions — do NOT restore)
          Return a structured list: [file, type=section|line, description, backup_content]")
```

---

## STEP 3 — Present Customization List

```
After Borges returns analysis, present to user:

  Customizations found in backup (2026-05-14-1430):

  [1] agents/m3a-dev.agent.md — Section: ## My Project Rules (user-added)
  [2] agents/m3a-dev.agent.md — Modified: "Think Before Coding" instruction (line 47)
  [3] agents/m3a-orchestrator.agent.md — Section: ## Project-Specific Rules (user-added)
  [4] agents/m3a-security.agent.md — Modified: severity matrix (user-customized table)

  Which to restore?
  Type numbers separated by spaces, [A] for all, or [N] for none:

IF no customizations found:
  → "No user customizations detected in this backup."
  → "Your backup was identical to the framework version — nothing to restore."
  → STOP
```

---

## STEP 4 — Apply Selected Restorations

```
For each selected item, apply surgically:

Type: section (user-added)
  → Locate insertion point in current file (based on surrounding context)
  → Append the section after the nearest matching section OR at end of file
  → Preserve all framework content untouched

Type: line modification (user-changed line within shared section)
  → Locate the line in the current file (by section + line context)
  → IF line still exists unchanged from framework → replace with user version
  → IF line was also changed by framework update → warn: "Line modified by both
     you and the framework update. Current: [text]. Yours: [text]. Keep [C]urrent / [U]ours?"

Log each restoration in .github/mma/logs/m3a-update.log:
  [TIMESTAMP] Restored: [file] — [description]
```

---

## STEP 5 — Final Report

```
Output:

✅ Customizations restored

Restored:
  [N] user-added sections
  [N] user-modified lines

Skipped (not selected):
  [N] items

Conflicts (required manual decision):
  [N] items — see log for details

Log: .github/mma/logs/m3a-update.log
```

---

## Safety Rules

1. **NEVER overwrite framework-added sections** with user content
2. **NEVER remove any section** that was added by the upgrade
3. **NEVER restore** if the target file no longer exists in current install (obsolete file)
4. **ALWAYS warn** before any line-level merge conflict — never auto-resolve silently
5. **Log everything** — every restoration must be traceable in m3a-update.log

---

## Changelog

**v1.0.0 (2026-05-14)** — Initial version. Companion skill to /m3a-update-latest for post-upgrade customization recovery.
