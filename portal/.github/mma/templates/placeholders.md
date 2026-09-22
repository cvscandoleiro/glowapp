# M3A Team — Complete Placeholder Catalog
# File: templates/placeholders.md
# Description: Authoritative reference for all {{PLACEHOLDER}} variables
# Version: 1.0.0
# Author: Edimar Ferla de Almeida
# Organization: Minsait (Indra Company)

---

## Placeholder Convention

All placeholders use **double curly braces with UPPERCASE underscore names:**

```
{{PLACEHOLDER_NAME}}
```

**Rules:**
1. Always uppercase, underscore-separated
2. Never use placeholders in M3A Team's own repo files (README, CHANGELOG, etc.)
3. Only use in `templates/`, `agents/`, `skills/`, `workflows/` directories
4. CI validation scans all template files and fails if hardcoded project names are detected
5. Placeholders are filled by `/m3a-init` from user answers → stored in `.github/mma/config.yaml`

---

## Placeholder Reference

---

### Project Identifiers

| Placeholder | Description | Example | Default | Set By |
|---|---|---|---|---|
| `{{PROJECT_NAME}}` | Full project name | `DRACO FIBER` | — | `/m3a-init` |
| `{{PROJECT_CODE}}` | Short acronym for file prefixes | `DRACO` | — | `/m3a-init` |
| `{{PROJECT_DESCRIPTION}}` | One-line project description | `Fiber optic network management platform` | — | `/m3a-init` |
| `{{PROJECT_TYPE}}` | Project classification | `existing` | — | `/m3a-init` |
| `{{PROJECT_SLUG}}` | URL-safe slug derived from code | `draco-fiber` | auto-derived | `/m3a-init` |

**`{{PROJECT_TYPE}}` valid values:** `new` | `existing` | `legacy` | `assessment` | `docs`

---

### Versioning

| Placeholder | Description | Example | Default | Set By |
|---|---|---|---|---|
| `{{VERSION_CURRENT}}` | AS-IS software version | `6.1.2` | — | `/m3a-init` |
| `{{VERSION_TARGET}}` | TO-BE target version | `7.0.0` | — | `/m3a-init` |
| `{{MMA_VERSION}}` | M3A Team framework version | `1.0.0` | current release | framework |

---

### Repository

| Placeholder | Description | Example | Default | Set By |
|---|---|---|---|---|
| `{{REPO_URL}}` | Remote repository URL | `https://github.com/Minsait-GA/draco` | — | `/m3a-init` |
| `{{REPO_BRANCH_DEFAULT}}` | Default branch name | `main` | `main` | `/m3a-init` |

---

### Organization

| Placeholder | Description | Example | Default | Set By |
|---|---|---|---|---|
| `{{ORG_NAME}}` | Short organization name | `Minsait` | `Minsait` | `/m3a-init` |
| `{{ORG_LEGAL}}` | Legal organization name | `Minsait (Indra Company)` | `Minsait (Indra Company)` | `/m3a-init` |
| `{{ORG_URL}}` | Organization website | `https://www.minsait.com` | `https://www.minsait.com` | `/m3a-init` |
| `{{CLIENT_NAME}}` | Client / end customer | `Telefonica Vivo` | — | `/m3a-init` |
| `{{BRANDING_TAGLINE}}` | Brand tagline for HTML portal | `Tech for impact` | `Tech for impact` | `/m3a-init` |

---

### Documentation & Metadata

| Placeholder | Description | Example | Default | Set By |
|---|---|---|---|---|
| `{{DOC_LANG}}` | Output language | `pt-BR` | `en-US` | `/m3a-init` |
| `{{DOC_DATE}}` | Document creation/update date | `2026-04-11` | today | agent |
| `{{DOC_AUTHOR}}` | Document author | `Engineering Team` | `{{ENG_A}}` | agent |
| `{{DOC_VERSION}}` | Document version | `1.0.0` | `1.0.0` | agent |
| `{{DOC_STATUS}}` | Document status | `draft` | `draft` | agent |
| `{{INIT_DATE}}` | Date `/m3a-init` was run | `2026-04-11` | auto | `/m3a-init` |

**`{{DOC_STATUS}}` valid values:** `draft` | `review` | `approved` | `deprecated`

---

### Technology Stack

| Placeholder | Description | Example | Default | Set By |
|---|---|---|---|---|
| `{{STACK_RUNTIME}}` | Primary runtime + language | `Java 11 (Azul Zulu)` | — | `/m3a-init` |
| `{{STACK_RUNTIME_VERSION}}` | Runtime version string | `11.0.22` | — | `/m3a-init` |
| `{{STACK_RUNTIME_TARGET}}` | Target runtime (migration) | `Java 21 (Azul Zulu LTS)` | — | `/m3a-init` |
| `{{STACK_OS}}` | Operating system | `CentOS 7` | — | `/m3a-init` |
| `{{STACK_OS_TARGET}}` | Target OS (migration) | `Rocky Linux 9` | — | `/m3a-init` |
| `{{STACK_DB}}` | Database technology | `PostgreSQL 12.2` | — | `/m3a-init` |
| `{{STACK_DB_TARGET}}` | Target DB (migration) | `PostgreSQL 16` | — | `/m3a-init` |
| `{{STACK_CI}}` | CI/CD platform | `GitHub Actions` | — | `/m3a-init` |
| `{{STACK_DEPLOY}}` | Deployment target | `Kubernetes 1.27` | — | `/m3a-init` |

---

### Build Commands

| Placeholder | Description | Example | Default | Set By |
|---|---|---|---|---|
| `{{BUILD_COMMAND}}` | Full build command | `mvn clean install -s ~/.m2/settings.xml` | — | user |
| `{{BUILD_TEST_COMMAND}}` | Test run command | `mvn test` | — | user |
| `{{BUILD_SKIP_TESTS}}` | Build without tests | `mvn clean install -DskipTests` | — | user |

---

### HTML Portal & Branding

| Placeholder | Description | Example | Default | Set By |
|---|---|---|---|---|
| `{{PORTAL_TITLE}}` | Portal page H1 heading | `DRACO FIBER — Documentation Portal` | — | `/m3a-init` |
| `{{PORTAL_SUBTITLE}}` | Portal subtitle | `Technical Documentation v7.0.0` | — | `/m3a-init` |
| `{{PORTAL_HOME_URL}}` | Portal home link | `./index.html` | `./index.html` | framework |
| `{{NAV_HOME_LABEL}}` | Nav home label | `Home` | `Home` | framework |
| `{{ASSETS_BASE_PATH}}` | Relative path to approved MMA assets root | `../../assets/` | — | agent |
| `{{MINSAIT_LOGO_DARK_PATH}}` | Path to approved MMA logo for dark backgrounds | `assets/AF_MINSAIT_LOG_NEG.png` | — | agent |
| `{{MINSAIT_LOGO_LIGHT_PATH}}` | Path to approved MMA logo for light backgrounds | `assets/AF_MINSAIT_LOG_POS.png` | — | agent |
| `{{MINSAIT_FAVICON_PATH}}` | Path to approved MMA favicon / light symbol | `assets/AF_MINSAIT_SIM_POS.png` | — | agent |
| `{{FONTS_WOFF2_BASE_PATH}}` | Base path to approved ForFutureSans WOFF2 files | `assets/fonts/Web Fonts/WOFF2/` | — | agent |

Branding policy for placeholders: only the approved MMA assets above are valid for HTML generation. Do not use `assets/logos/...` or `assets/fonts/fonts.css` placeholders or derived values.

---

### Team & Attribution

| Placeholder | Description | Example | Default | Set By |
|---|---|---|---|---|
| `{{TEAM_NAME}}` | Team identifier | `M3A Team` | `M3A Team` | `/m3a-init` |
| `{{TEAM_SIZE}}` | Team size category | `small` | — | `/m3a-init` |
| `{{ENG_A}}` | Engineer A (Layer 2 attribution) | `J. Silva` | `Eng. A` | `/m3a-init` |
| `{{ENG_B}}` | Engineer B (Layer 2 attribution) | `M. García` | `Eng. B` | `/m3a-init` |
| `{{ENG_C}}` | Engineer C (Layer 2 attribution) | `L. Costa` | `Eng. C` | `/m3a-init` |
| `{{ASSIGNEE}}` | Story/task assignee | `m3a-dev` | — | user/agent |

**`{{TEAM_SIZE}}` valid values:** `solo` | `small` | `medium` | `large`

---

### Paths (Project-Level)

| Placeholder | Description | Default |
|---|---|---|
| `{{PATH_KNOWLEDGE}}` | Knowledge base directory | `.github/mma/knowledge/` |
| `{{PATH_AGENTS}}` | Agent files directory | `.github/agents/` |
| `{{PATH_PROMPTS}}` | Prompt/skill files | `.github/prompts/` |
| `{{PATH_BACKLOG}}` | Backlog root | `.github/mma/backlog/` |
| `{{PATH_EPICS}}` | Epics directory | `.github/mma/backlog/epics/` |
| `{{PATH_STORIES}}` | Stories directory | `.github/mma/backlog/stories/` |
| `{{PATH_WORKFLOWS}}` | Workflow configs | `.github/mma/workflows/` |
| `{{PATH_DECISIONS}}` | ADR/decisions directory | `.github/mma/decisions/` |
| `{{PATH_DOCS}}` | Documentation root | `docs/` |
| `{{PATH_HTML}}` | HTML documentation | `docs/html/` |
| `{{PATH_SPRINT_STATUS}}` | Sprint status YAML | `.github/mma/backlog/sprints/sprint-status.yaml` |

*Note: Paths use defaults from `core/defaults/mma.defaults.yaml` and can be overridden in `.github/mma/config.yaml`.*

---

### Backlog Item IDs

| Placeholder | Description | Example | Set By |
|---|---|---|---|
| `{{EPIC_NUMBER}}` | Epic sequential number | `001` | agent/user |
| `{{EPIC_TITLE}}` | Epic title | `Upgrade Runtime to Java 21` | user |
| `{{EPIC_PRIORITY}}` | Epic priority level | `high` | agent/PM |
| `{{EPIC_COMPLEXITY}}` | Epic complexity score | `complex` | m3a-dev |
| `{{EPIC_SLUG}}` | URL-safe epic title slug | `upgrade-runtime-java21` | agent |
| `{{STORY_NUMBER}}` | Story sequential number | `042` | agent/SM |
| `{{STORY_TITLE}}` | Story title | `Update app_server setenv.sh` | user |
| `{{STORY_PRIORITY}}` | Story priority | `high` | agent/SM |
| `{{STORY_POINTS}}` | Story points estimate | `5` | agent/SM |
| `{{STORY_SLUG}}` | URL-safe story title slug | `update-setenv-sh` | agent |
| `{{SPRINT_NUMBER}}` | Sprint number | `3` | SM |
| `{{SPRINT_TARGET}}` | Target sprint for delivery | `4` | SM |

---

### ADR Fields

| Placeholder | Description | Example | Set By |
|---|---|---|---|
| `{{ADR_NUMBER}}` | ADR sequential number (3 digits) | `001` | agent |
| `{{ADR_TITLE}}` | ADR title | `Use PostgreSQL 16 as target DB` | user |
| `{{ADR_STATUS}}` | ADR status | `proposed` | agent |
| `{{ADR_SLUG}}` | URL-safe ADR title slug | `use-postgresql-16-target-db` | agent |

**`{{ADR_STATUS}}` valid values:** `proposed` | `accepted` | `rejected` | `deprecated` | `superseded`

---

### Runbook Fields

| Placeholder | Description | Example | Set By |
|---|---|---|---|
| `{{RUNBOOK_NUMBER}}` | Runbook sequential number | `001` | agent |
| `{{RUNBOOK_TITLE}}` | Runbook title | `Database Backup Procedure` | user |
| `{{RUNBOOK_DURATION}}` | Estimated execution time | `15-30 minutes` | agent |
| `{{RUNBOOK_SLUG}}` | URL-safe runbook title slug | `database-backup` | agent |

---

### Troubleshooting Fields

| Placeholder | Description | Example | Set By |
|---|---|---|---|
| `{{TROUBLESHOOTING_TOPIC}}` | Troubleshooting guide topic | `Application Startup Failures` | user |
| `{{TROUBLESHOOTING_SLUG}}` | URL-safe topic slug | `startup-failures` | agent |

---

### Governance

| Placeholder | Description | Example | Default | Set By |
|---|---|---|---|---|
| `{{GOVERNANCE_QUALITY_GATES}}` | Quality gates enabled | `true` | `true` | `/m3a-init` |
| `{{GOVERNANCE_ADR_REQUIRED}}` | ADRs required | `false` | `false` | `/m3a-init` |
| `{{GOVERNANCE_RISK_GATES}}` | Risk gates enabled | `false` | `false` | `/m3a-init` |
| `{{GOVERNANCE_SPRINT_TRACKING}}` | Sprint tracking enabled | `true` | `false` | `/m3a-init` |
| `{{DOCS_MODE}}` | Documentation mode | `portal` | `markdown` | `/m3a-init` |

**`{{DOCS_MODE}}` valid values:** `markdown` | `markdown+html` | `portal`

---

### Dynamic Content Sections

These placeholders represent multi-line content blocks populated by agents during `/m3a-init-knowledge`.
They are NOT simple key-value pairs — they expand to full Markdown sections.

| Placeholder | Description | Set By |
|---|---|---|
| `{{BUILD_COMMANDS}}` | Build, test, and run commands for the project | `/m3a-init-knowledge` (agent) |
| `{{ARCHITECTURE_SUMMARY}}` | AS-IS architecture summary (modules, layers, dependencies) | `/m3a-init-knowledge` (agent) |
| `{{KEY_CONVENTIONS}}` | Project coding conventions, naming rules, patterns | `/m3a-init-knowledge` (agent) |
| `{{DOCS_MODE}}` | Documentation mode | `portal` | `markdown` | `/m3a-init` |

---

## Usage Guide

### In Templates (Markdown)

```markdown
# {{PROJECT_NAME}} — Architecture Overview
**Version:** {{VERSION_CURRENT}} → {{VERSION_TARGET}}
**Stack:** {{STACK_RUNTIME}} / {{STACK_OS}} / {{STACK_DB}}
```

### In YAML Templates

```yaml
project:
  name: "{{PROJECT_NAME}}"
  type: "{{PROJECT_TYPE}}"
  version_current: "{{VERSION_CURRENT}}"
```

### In Shell Scripts

```bash
PROJECT_NAME="{{PROJECT_NAME}}"
PROJECT_CODE="{{PROJECT_CODE}}"
```

### In HTML Templates

```html
<title>{{PORTAL_TITLE}}</title>
<h1>{{PROJECT_NAME}}</h1>
<p class="tagline">{{BRANDING_TAGLINE}}</p>
```

---

## Sanitization Checklist

Before committing any template or agent file, verify:

- [ ] No occurrences of known project names (`DRACO`, `FIBER`, specific client names)
- [ ] No hardcoded version numbers (`v6.1.2`, `v7.0.0`, `Java 11`)
- [ ] No hardcoded organization-specific paths
- [ ] No hardcoded stack values (`PostgreSQL 12.2`, `CentOS 7`)
- [ ] All variable values use `{{PLACEHOLDER}}` format

```bash
# Quick sanitization check
grep -rn "DRACO\|draco\|v7\.0\.0\|CentOS 7\|PostgreSQL 12" templates/ agents/ skills/ workflows/
```

---

*File maintained by Minsait (Indra Company) — M3A Team*
*Version: 1.0.0 | Updated: 2026-04-11*
