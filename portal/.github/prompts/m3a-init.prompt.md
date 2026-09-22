---
description: "MMA Init — Mandatory onboarding skill. Run /m3a-init BEFORE any productive work on the project. Asks 3 essential questions, auto-discovers the project stack, then generates all configuration files. Supports new, existing, legacy, and assessment projects."
agent: "agent"
---

# /m3a-init — M3A Team Onboarding

> **Welcome to the M3A Team — Multi-Agent AI Architecture**

This is the mandatory entry point. No productive work can begin until `/m3a-init` is completed.

---

## Behavior Rules

- **Minimal interaction** — ask only what cannot be auto-discovered
- **Auto-discover first** — scan workspace files BEFORE asking anything technical
- **All questions in one block** — never ask one question at a time across multiple messages
- **Infer aggressively** — if a file reveals the stack, record it silently without asking
- **Proceed without confirmation** — after the user answers the questions, execute all steps automatically without asking "shall we proceed?" or showing intermediate summaries
- **Language enforcement** — after the user selects a language, ALL subsequent responses (including this skill's STEP 4 and 5 output) MUST be in that language. The `chat.language` value in `config.yaml` is the binding instruction for every agent in the project.

---

## STEP 0 — Check Current State

```
IF .github/mma/config.yaml EXISTS AND project.initialized = true:
  → Show one-line summary: "M3A Team already configured for [PROJECT_NAME]. Re-initialize? [y/N]"
  → If N or no response: STOP — "Use the available agents."
  → If Y: proceed to STEP 1

IF .github/agents/ DOES NOT EXIST OR is empty:
  → Check for user-level install: does the user MMA store exist?
    - Windows: `%APPDATA%\Code\User\mma\`
    - macOS: `~/Library/Application Support/Code/User/mma/`
    - Linux: `~/.config/Code/User/mma/`
  → IF user MMA store EXISTS → user-level install detected → proceed to STEP 1
  → IF user MMA store DOES NOT EXIST:
    → ⚠️ "Run the install script first. Agents are not present."
    → Show one-liner for the platform and STOP.

IF .github/mma/config.yaml EXISTS but project.initialized = false:
  → Proceed to STEP 1 immediately (install already ran, just personalize)

IF .github/mma/config.yaml DOES NOT EXIST:
  → Proceed to STEP 1 immediately
```

---

## STEP 1 — Auto-Discovery (silent, no user interaction)

Before asking ANYTHING, scan the workspace to auto-detect:

| Signal | Files to check |
|---|---|
| Runtime / Language | `pom.xml`, `package.json`, `requirements.txt`, `go.mod`, `Gemfile`, `*.csproj`, `build.gradle` |
| Framework | `pom.xml` dependencies, `package.json` dependencies, `settings.gradle` |
| Database | `pom.xml`, `application.properties`, `application.yml`, `*.env`, `docker-compose.yml` |
| OS / Deploy | `Dockerfile`, `docker-compose.yml`, `*.yaml` in `k8s/` or `kubernetes/` |
| CI/CD | `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`, `azure-pipelines.yml` |
| Frontend | `package.json` (react/vue/angular deps), `src/main/webapp/`, `*.jsp` |
| Repo URL | `.git/config` |
| Project name | Root folder name, `package.json`.name, `pom.xml` artifactId |
| Versions | Same files as above |

Record all discovered values silently as `DISCOVERED_*` variables.

---

## STEP 2 — Ask Only What Could Not Be Auto-Discovered

After scanning, send a **single message** with ONLY the questions that remain unanswered.
Maximum 3 questions. Minimum 0 (if everything was discovered, skip this step entirely).

The 4 possible questions (only ask what is missing):

**Q1 — Project type** (always ask this — cannot be inferred):
```
What best describes this project?
[1] new       — being built from scratch
[2] existing  — active system, ongoing development
[3] legacy    — older system, modernization/maintenance
[4] assessment — analysis only, no implementation
```

**Q2 — Project name** (only if not auto-discovered):
```
Project name? (e.g. "Billing API", "HR Portal")
```

**Q3 — Language** (always ask this — affects all agent responses and generated docs):
```
Preferred language?
[1] en-US  — English (default)
[2] pt-BR  — Portuguese (Brazil)
[3] es-ES  — Spanish (Spain)
[4] other  — type your locale (e.g. fr-FR, de-DE)
```

This controls two things:
- **Chat language** — the language agents use when responding to you
- **Docs language** — the language used in all generated documentation

Format the message as:
```
⚡ M3A Team — Quick Setup

I scanned the workspace and found: [one-line summary of what was discovered]

I need [N] more detail(s):

[questions]

Answer inline, e.g.: "existing / pt-BR" or "1 / 2"
```

---

## STEP 3 — Auto-Complete Missing Values

After receiving the user's answers, fill in any remaining blanks with safe defaults:

| Field | Default if unknown |
|---|---|
| `runtime` | "unknown — run /m3a-analyst to discover" |
| `framework` | "none detected" |
| `database` | "none detected" |
| `os` | "linux/container" |
| `cicd` | "none" |
| `frontend` | "none" |
| `repo` | read from `.git/config` or "not provided" |
| `docs.language` | "en-US" |
| `chat.language` | "en-US" |
| `docs.mode` | "markdown-only" |
| `quality-gates` | true |
| `adr-required` | true |
| `team.size` | 1 |

---

## STEP 4 — Create All Artifacts (no confirmation needed)

Execute all creation steps silently and in order. Do not ask "shall I proceed?".

### 4.1 Set up `.github/` structure

**Detect install mode** (before doing anything else):

```
IF .github/agents/ EXISTS → project-level install
  → ecosystem already in .github/mma/ from install → skip copy step

IF .github/agents/ DOES NOT EXIST → user-level install
  → copy ecosystem from user MMA store → .github/mma/
```

**User-level install: copy ecosystem from user MMA store**

Run terminal command:
- **Windows:** `$s="$env:APPDATA\Code\User\mma"; if (Test-Path $s) { New-Item -Force -ItemType Directory .github\mma | Out-Null; Copy-Item -Recurse -Force "$s\*" ".github\mma\" } else { Write-Warning "User MMA store not found. Run install.ps1 -Mode user first." }`
- **macOS:** `s="$HOME/Library/Application Support/Code/User/mma"; [ -d "$s" ] && mkdir -p .github/mma && cp -rn "$s/." .github/mma/ || echo "⚠️ User MMA store not found. Run install.sh --mode=user first."`
- **Linux:** `s="$HOME/.config/Code/User/mma"; [ -d "$s" ] && mkdir -p .github/mma && cp -rn "$s/." .github/mma/ || echo "⚠️ User MMA store not found. Run install.sh --mode=user first."`

**After copy (both install modes), verify these exist** (create stubs if absent):

```
.github/
├── agents/          ← project-level only (user-level: agents are in VS Code user folder)
├── prompts/         ← project-level only (user-level: skills are in VS Code user folder)
├── copilot-instructions.md
└── mma/
    ├── workflows/   ← from install / user MMA store
    ├── templates/   ← from install / user MMA store
    ├── core/        ← from install / user MMA store
    ├── assets/      ← from install / user MMA store
    ├── docs/        ← from install / user MMA store
    ├── config.yaml  ← placeholder (created here if absent)
    ├── knowledge/
    ├── backlog/
    └── logs/
```

Only create what is missing. Never overwrite `agents/` or `prompts/`.

Ensure these knowledge stubs exist (create if absent):
```
.github/mma/knowledge/
├── team-config.md             ← 12 MMA Laws adapted for project
├── project-architecture.md   ← stub
├── project-conventions.md    ← stub
└── project-decisions-log.md  ← empty
```

### 4.2 Update `.github/mma/config.yaml`

If the file does not yet exist (user-level install — first `/m3a-init` in this project):
- Copy from `.github/mma/templates/config/mma.config.template.yaml` to `.github/mma/config.yaml`

Replace `{{PLACEHOLDER}}` tokens with collected values:

```yaml
# Generated by /m3a-init on YYYY-MM-DD
# M3A Team — Multi-Agent AI Architecture

project:
  name: "{{PROJECT_NAME}}"
  code: "{{PROJECT_CODE}}"
  type: "{{PROJECT_TYPE}}"
  client: "{{CLIENT_NAME}}"
  repo: "{{REPO_URL}}"
  initialized: true
  initialized-at: "YYYY-MM-DD"

stack:
  runtime: "{{RUNTIME}}"
  runtime-version: "{{RUNTIME_VERSION}}"
  framework: "{{FRAMEWORK}}"
  os: "{{OS}}"
  database:
    type: "{{DB_TYPE}}"
    version: "{{DB_VERSION}}"
  frontend: "{{FRONTEND}}"
  cicd: "{{CICD_PLATFORM}}"

docs:
  language: "{{OUTPUT_LANGUAGE}}"  # en-US | pt-BR | es-ES | ...
  mode: "{{DOCS_MODE}}"

chat:
  language: "{{CHAT_LANGUAGE}}"      # language for all agent responses

governance:
  quality-gates: {{QUALITY_GATES_ENABLED}}
  adr-required: {{ADR_REQUIRED}}
  multi-agent-review: true

team:
  size: {{TEAM_SIZE}}

mma:
  version: "{{MMA_VERSION}}"    # preserved from install
  installed-at: "{{INSTALL_DATE}}"
  install-mode: "{{INSTALL_MODE}}"
```

### 4.3 Generate `.github/mma/knowledge/team-config.md`

Create with the 12 M3A Team Laws generalized for the project.

### 4.4 Generate `.github/mma/backlog/sprints/sprint-status.yaml`

Initialize with sprint 0 (setup sprint). Status: `setup`.

### 4.5 Update `.github/copilot-instructions.md`

If the file does not yet exist (user-level install):
- Copy from `.github/mma/templates/copilot-instructions.md` to `.github/copilot-instructions.md`

Replace all `{{PLACEHOLDER}}` tokens with collected values.
Log the update in `.github/mma/logs/m3a-init.log`.

---

## STEP 5 — Done: Single Summary Message

After all artifacts are created, output ONE message:

```
✅ M3A Team configured for {{PROJECT_NAME}}

Stack detected: {{RUNTIME}} / {{FRAMEWORK}} / {{DB_TYPE}}
Language:       {{CHAT_LANGUAGE}} (chat + docs)

Files personalized:
  .github/copilot-instructions.md   (routing rules + project name)
  .github/mma/config.yaml           (project settings)
  .github/mma/knowledge/team-config.md
  .github/mma/backlog/sprints/sprint-status.yaml

Already present from install:
  .github/agents/    ({{N}} agents)
  .github/prompts/   (skills)

Next steps:
```

**If type = new:**
```
  → @m3a-architect  to design the initial architecture
  → @m3a-pm         to create the first epics
```

**If type = existing or legacy:**
```
  → @m3a-analyst    to run full AS-IS analysis
  → @m3a-orchestrator to start planning
```

**If type = assessment:**
```
  → @m3a-analyst    to run diagnostics
  → @m3a-security   to audit CVEs and risks
```



---

## Changelog

**v3.0.0 (2026-04-12)** — Aligned with new install architecture. Install now places all files directly in .github/. /m3a-init only personalizes — no more copying agents/prompts. .github/mma/ → .github/mma/. Added guard: stop if .github/agents/ is empty (install not run yet).

**v4.0.0 (2026-05-14)** — Removed minimal/full setup mode concept. MMA always installs all 12 agents. Removed /m3a-upgrade hint.

**v3.1.0 (2026-04-12)** — Removed 'custom' setup mode. Added /m3a-upgrade hint in minimal output.

**v2.0.0 (2026-04-12)** — Complete redesign. Replaced 17-step conversational interview with: auto-discovery scan + single 3-question message + silent artifact creation.

**v1.0.0 (2026-04-11)** — Initial version. Full conversational onboarding, 17 steps.
