---
description: "MMA Update Latest — Chat-first upgrade wizard. Updates M3A Team to the latest GitHub release without overwriting user customizations. Detects project-level and user-level installs, auto-backs up all modified files, then offers [S]obrescrever / [M]erge per conflicting file. Always pulls from releases/latest — never from main branch."
agent: "agent"
---

# /m3a-update-latest — M3A Team Upgrade Wizard

> **Safe, chat-first upgrade from any MMA version to the latest release.**
> No terminal scripts. No data loss. Always backup-first.

---

## Behavior Rules

- **Backup before anything** — no file is ever overwritten without backup first
- **Always from releases/latest** — NEVER use main branch; always use the latest published GitHub release
- **Preserve user data** — `.github/mma/knowledge/`, `.github/mma/backlog/`, `.github/mma/logs/`, `config.yaml`, `copilot-instructions.md` are NEVER touched
- **Silent progress** — do not narrate every file; report conflicts only
- **One session** — complete the full upgrade in a single conversation flow
- **Borges fallback** — for merge decisions, delegate complex section analysis to `M3A: Docs`

---

## STEP 0 — Detect Install Scope

```
Detect where MMA is installed for this user:

A) Project-level:
   → .github/agents/m3a-orchestrator.agent.md EXISTS

B) User-level:
   → Linux:   ~/.config/Code/User/prompts/m3a-orchestrator.agent.md
   → macOS:   ~/Library/Application Support/Code/User/prompts/m3a-orchestrator.agent.md
   → Windows: %APPDATA%\Code\User\prompts\m3a-orchestrator.agent.md

IF both A and B detected:
  → Ask: "Found MMA in two locations. Which to upgrade?
    [1] Project only (.github/agents/)
    [2] User-level only (~/.config/Code/User/prompts/)
    [3] Both"

IF only one detected: proceed silently.
IF none detected: ❌ BLOCKED — MMA not installed. Run install.sh or install.ps1 first.
```

---

## STEP 1 — Detect Current Version

```
For each scope detected:

  User-level:
    PRIMARY:  read m3a-version.txt from the prompts folder:
              Linux:   ~/.config/Code/User/prompts/m3a-version.txt
              macOS:   ~/Library/Application Support/Code/User/prompts/m3a-version.txt
              Windows: %APPDATA%\Code\User\prompts\m3a-version.txt
    FALLBACK: if m3a-version.txt not found, read agent-version from
              m3a-orchestrator.agent.md frontmatter.

  Project-level:
    PRIMARY:  read mma.version from .github/mma/config.yaml
    FALLBACK: if config.yaml not found, read agent-version from
              .github/agents/m3a-orchestrator.agent.md frontmatter.

⚠️ NOTE: agent-version in the frontmatter tracks the version of that specific
agent file, NOT the framework release version. They are independent numbers.
Use agent-version ONLY as last-resort fallback.

Show: "Current version: vX.Y.Z"
```

---

## STEP 2 — Fetch Latest Release Version

```
Call GitHub API to get latest release:
  gh api repos/ealmeidaf_indra/m3a-team/releases/latest --jq '.tag_name'
  → Returns: "v1.3.0" (example)

IF current == latest:
  → "✅ Already on latest version (vX.Y.Z). Nothing to update."
  → STOP

IF latest > current:
  → "New version available: vX.Y.Z → vA.B.C"
  → "Proceed with upgrade? [Y/n]"
  → If N: STOP
```

---

## STEP 3 — Clone Latest Release to Temp Directory

```
Create temp directory:
  Linux/macOS: /tmp/m3a-update-YYYY-MM-DD-HHmm/
  Windows:     %TEMP%\m3a-update-YYYY-MM-DD-HHmm\

Download and extract latest release archive:
  gh release download --repo ealmeidaf_indra/m3a-team --archive=tar.gz --dir /tmp/m3a-update-YYYY-MM-DD-HHmm/

OR clone via git (shallow):
  git clone --depth=1 --branch vA.B.C https://github.com/ealmeidaf_indra/m3a-team.git /tmp/m3a-update-YYYY-MM-DD-HHmm/
```

---

## STEP 4 — Auto-Backup (Unconditional)

```
Before touching ANY file, create a timestamped backup:

Project-level:  .github/mma/backups/YYYY-MM-DD-HHmm/
User-level:
  Linux:    ~/.config/Code/User/mma/backups/YYYY-MM-DD-HHmm/
  macOS:    ~/Library/Application Support/Code/User/mma/backups/YYYY-MM-DD-HHmm/
  Windows:  %APPDATA%\Code\User\mma\backups\YYYY-MM-DD-HHmm\

Files to backup (per scope):
  agents/         → backup all *.agent.md files
  skills/         → backup all *.prompt.md files
  workflows/      → backup all *.workflow.yaml files
  core/           → backup all files
  templates/      → backup all files

After backup completes:
  → Log backup path in .github/mma/logs/m3a-update.log (project-level)
  → Report: "📦 Backup created: [path] — [N] files"

Ensure .github/mma/backups/ is listed in .gitignore:
  Check .gitignore for "mma/backups" entry.
  IF missing: append "# MMA backups\n.github/mma/backups/" to .gitignore
```

---

## STEP 5 — Conflict Detection

```
For each scope to update, compare file by file:

Scope directories to compare:
  agents/     (*.agent.md)
  skills/     (*.prompt.md)
  workflows/  (*.workflow.yaml)
  core/       (mma.config.schema.json, registry/*.yaml, defaults/*)
  templates/  (all files EXCEPT config/mma.config.template.yaml — always overwrite)
  assets/     (always overwrite silently — no user customizations expected)
  docs/       (*.html, *.md — compare)

For each file:
  IF identical (md5 match) → mark as [OK] → silent update
  IF new file in release (not in current install) → mark as [NEW] → silent add
  IF deleted in release (in current but not release) → mark as [OBSOLETE] → ask human
  IF modified by user (differs from release) → mark as [CONFLICT] → go to STEP 5a

Files NEVER compared or touched:
  .github/mma/knowledge/*
  .github/mma/backlog/*
  .github/mma/logs/*
  .github/mma/config.yaml
  .github/copilot-instructions.md
```

---

## STEP 5a — Per-Conflict Wizard

```
For each [CONFLICT] file, present:

  ⚠️ CONFLICT: agents/m3a-dev.agent.md
  Current version:  v1.2.0 | Released version: v1.3.0

  Options:
    [S] Sobrescrever — replace with the new version (your changes will be in backup)
    [M] Merge        — preserve your customizations + apply framework updates section by section

  → Collect answer before proceeding to next conflict
```

**Merge logic (option M):**

When user chooses [M] for a file:
- Split both files into sections by `## ` headings
- Compare section by section:

```
Section exists only in NEW version    → add silently
Section exists only in USER version   → preserve (append after matching position)
Section identical in both             → use new version silently
Section differs                       → show one-line diff summary, ask:
  [S] Use new version section  [U] Keep your version  [B] Keep both
```

For complex merge decisions, delegate to `runSubagent("M3A: Docs", "merge analysis for [file]: user version vs new version — identify user customizations vs framework updates")`.

---

## STEP 6 — Apply All Decisions

```
Process all files in order:

1. [NEW] files      → copy from temp to install location
2. [OK] files       → copy from temp to install location (silent)
3. [CONFLICT-S]     → copy from temp to install location
4. [CONFLICT-M]     → apply merged content
5. [OBSOLETE] files → ask: "[file] removed in new version. Delete? [Y/n]"

Log all operations in .github/mma/logs/m3a-update.log
```

---

## STEP 7 — Update Version Markers

```
Project-level:
  IF .github/mma/config.yaml EXISTS:
    → Update mma.version to the new release version
    → Update mma.installed-at to today's date
    → DO NOT touch any other field
  IF config.yaml DOES NOT EXIST:
    → Skip (user may not have run /m3a-init yet)

User-level:
  → Write new release version to m3a-version.txt:
    Linux:    ~/.config/Code/User/prompts/m3a-version.txt
    macOS:    ~/Library/Application Support/Code/User/prompts/m3a-version.txt
    Windows:  %APPDATA%\Code\User\prompts\m3a-version.txt
  Example content: v1.4.0
  (This is the canonical version source for user-level installs.)
```

---

## STEP 8 — Clean Temp Directory

```
Remove the temp directory created in STEP 3:
  Linux/macOS: rm -rf /tmp/m3a-update-YYYY-MM-DD-HHmm/
  Windows:     Remove-Item -Recurse -Force "%TEMP%\m3a-update-YYYY-MM-DD-HHmm\"
```

---

## STEP 9 — Final Report

```
Output:

✅ M3A Team updated: vX.Y.Z → vA.B.C

Summary:
  [N] files updated (silent)
  [N] new files added
  [N] conflicts resolved (S: [n] / M: [n])
  [N] files preserved (user-only sections kept)

Backup saved at: [path]
```

> **💡 Post-upgrade tip — Restore customizations**
>
> If you chose **[S] Sobrescrever** on any file and later noticed you lost a customization,
> your original version is safe in the backup above.
>
> To surgically recover only what you added — without touching framework content:
>
> ```
> /m3a-restore-customizations
> ```
>
> Borges will compare your backup against the current install and let you pick
> exactly which sections or lines to bring back.

---

## Safety Rules

1. **NEVER delete or overwrite backup directory** — once created, it is read-only from wizard perspective
2. **NEVER modify** `.github/mma/knowledge/`, `.github/mma/backlog/`, `.github/mma/logs/`, `config.yaml`, `copilot-instructions.md`
3. **NEVER pull from main branch** — only published releases (releases/latest)
4. **NEVER proceed** if GitHub API is unreachable — abort with error
5. **NEVER apply partial merge** — if merge step fails, fall back to [S] and warn the user

---

## Changelog

**v1.1.0 (2026-05-14)** — Fixed version detection: STEP 1 now reads `m3a-version.txt` (user-level) and `config.yaml → mma.version` (project-level) as primary source. `agent-version` from frontmatter demoted to fallback only — it tracks individual agent file versions, not the framework release version. STEP 7 now writes `m3a-version.txt` for user-level installs.

**v1.0.0 (2026-05-14)** — Initial version. Replaces terminal-based upgrade.sh / upgrade.ps1. Chat-first wizard with backup-first policy, section-level merge, and conflict detection per file.
