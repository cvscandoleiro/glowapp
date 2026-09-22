---
description: "MMA Init Knowledge — Systematic AS-IS analysis skill. Run /m3a-init-knowledge for existing or legacy projects. Orchestrates deep analysis of all modules/components, builds the complete knowledge base in .github/mma/knowledge/, identifies technical debt, CVEs, and risks."
agent: "agent"
---

# /m3a-init-knowledge — AS-IS Knowledge Bootstrap

> **Systematic project analysis workflow.** Builds the knowledge base from real code — not assumptions.

---

## Mandatory Precondition

```
IF .github/mma/config.yaml DOES NOT EXIST:
  → ⚠️ "Run /m3a-init first to configure the project."
  → STOP.

IF project.type = "new" in config:
  → ⚠️ "This workflow is for existing/legacy projects.
     For new projects, use /m3a-init-epic."
  → STOP (unless the human insists — in that case warn and proceed).
```

---

## What This Workflow Does

Executes the complete AS-IS analysis of the project, producing:

```
.github/mma/knowledge/
├── project-overview.md          ← Overview: LOC, modules, technologies
├── project-architecture.md      ← Module structure, dependencies, build order
├── project-conventions.md       ← Code patterns, encoding, package structure
├── dependencies.md               ← Full dependency inventory + CVEs
├── technical-debt.md             ← Identified and prioritized technical debt
├── security-findings.md          ← Active CVEs, OWASP risks, recommendations
├── module-[name].md              ← One file per analyzed module/component
└── agents-changelog.md           ← (initialized if not already existing)

docs/
├── deep-analysis-[module].md     ← Deep scan per module (requested depth)
└── security/
    └── cve-audit-[date].md       ← CVE report
```

---

## STEP 1 — Briefing and Scope

### 1.1 Present the workflow to the user

```
"📊 /m3a-init-knowledge — AS-IS Analysis of {{PROJECT_NAME}}

This workflow systematically analyzes each module/component of the project
and builds the complete knowledge base.

Depending on the chosen depth, it may require multiple sessions.
Let's define the scope before starting?"
```

### 1.2 Ask for depth

```
"What analysis depth?

[1] Quick (1-2 sessions)
    - Module inventory + main dependencies
    - High-severity CVEs only
    - Architecture overview
    
[2] Standard (2-4 sessions) ← recommended
    - Everything from Quick +
    - Intermediate analysis of each module
    - CRITICAL + HIGH CVEs
    - Code patterns per module
    - Technical debt estimate
    
[3] Deep (4-8 sessions)
    - Everything from Standard +
    - Deep dive on critical modules
    - All CVEs (including MEDIUM)
    - Business logic mapped by domain
    - Compatibility analysis for migration"
```

### 1.3 Ask for priority modules

```
"Are there modules that need priority analysis?
(E.g.: the payments module, the data layer, the most critical service)

Or analyze all in order of criticality?"
```

---

## STEP 2 — Project Structure Discovery

Before analyzing modules, map the project:

### 2.1 Initial inventory

```
Execute:
1. List directory structure at level 2
2. Identify the type of each module:
   - By manifest: pom.xml, package.json, requirements.txt, go.mod, etc.
   - By structure: src/, lib/, test/, etc.
3. Identify root module / entry point
4. Map dependencies between modules (intra-project)
5. Identify build order (if multi-module)
```

### 2.2 Output: project-overview.md

```markdown
---
generated-by: /m3a-init-knowledge
generated-at: YYYY-MM-DD
depth: [quick|standard|deep]
---

# {{PROJECT_NAME}} — AS-IS Overview

## Codebase Metrics
| Metric | Value |
|---|---|
| Main language | [language] |
| Modules/packages | [N] |
| Estimated LOC | [N] (approximate) |
| Code files | [N] |
| Config files | [N] |
| Scripts | [N] |

## Identified Modules
| Module | Type | Criticality | Analysis priority |
|---|---|---|---|
| [name] | app | high | 1 |

## Build/Deploy Order
[Diagram or list if multi-module]

## Confirmed Technologies
[Validate against config.yaml — update if necessary]
```

---

## STEP 3 — Analysis per Module

For each identified module, run analysis at the chosen depth.

### Analyst Orchestration

```
For each module [M] in the prioritized list:
  runSubagent("M3A: Analyst", "[depth] analysis of module [M] — 
    project {{PROJECT_NAME}} — 
    output: .github/mma/knowledge/module-[M].md + docs/deep-analysis-[M].md")
```

### Required structure of module-[name].md

```markdown
---
module: "[name]"
analyzed-at: YYYY-MM-DD
analysis-depth: surface | intermediate | deep
analyzed-by: M3A: Analyst
---

# Module: [name]

## Summary
[What this module does in 2-3 lines]

## Structure
[Main directories and files]

## Direct Dependencies
| Dependency | Version | EOL? | CVEs | Notes |
|---|---|---|---|---|

## Code Patterns
[Identified patterns: DAO pattern, singleton, observer, etc.]

## Integration Points
| Type | Target | Protocol | Notes |
|---|---|---|---|
| Inbound | [service] | REST | |
| Outbound | [database] | JDBC | |

## Identified Risks
| Risk | Severity | Description | Recommended action |
|---|---|---|---|

## Technical Debt
| ID | Description | Rough effort | Priority |
|---|---|---|---|

## Analysis Notes
[Specific findings — evidence with file/line when possible]
```

---

## STEP 4 — Dependency and CVE Audit

After module analysis, run security audit:

```
runSubagent("M3A: Security", "/m3a-dependency-audit — 
  project {{PROJECT_NAME}} —
  output: .github/mma/knowledge/dependencies.md + docs/security/cve-audit-[date].md")
```

### Structure of dependencies.md

```markdown
# {{PROJECT_NAME}} — Dependency Inventory

Generated: YYYY-MM-DD | Depth: [chosen]

## Executive Summary
| Category | Count |
|---|---|
| Total dependencies | [N] |
| With CRITICAL CVE | [N] |
| With HIGH CVE | [N] |
| EOL (unsupported) | [N] |

## Dependencies by Module
[Table per module with dependencies, versions, CVEs]

## EOL Dependencies
[List of components without active support]

## Priority CVEs
| CVE ID | Component | CVSS | Brief description | Recommended action |
|---|---|---|---|---|
```

---

## STEP 5 — Synthesis: Technical Debt and Risks

At the end, consolidate findings into two documents:

### 5.1 technical-debt.md

```markdown
# {{PROJECT_NAME}} — AS-IS Technical Debt

Generated: YYYY-MM-DD

## Debt Categories

### Security (active CVEs)
[Prioritized list — CRITICAL first]

### EOL Technology
[Components without support — with EOL date]

### Architecture
[Structural issues: coupling, duplication, god classes, etc.]

### Testing
[Current coverage, missing tests in critical areas]

### Documentation
[Missing or outdated documentation]

## Prioritization Matrix
| ID | Type | Description | Effort | Impact | Priority |
|---|---|---|---|---|---|

## Total Effort Estimate
[Total rough estimate in engineer-days to address identified debt]
```

### 5.2 Update project-architecture.md

```
runSubagent("M3A: Architect", "update project-architecture.md with 
  complete AS-IS analysis of {{PROJECT_NAME}} —
  include: modules, inter-module dependencies, 
  integration points, build order")
```

---

## STEP 6 — Confirmation and Next Steps

At the end of all analyses:

```
✅ /m3a-init-knowledge complete!

Knowledge base generated:
✅ .github/mma/knowledge/project-overview.md
✅ .github/mma/knowledge/project-architecture.md  
✅ .github/mma/knowledge/dependencies.md
✅ .github/mma/knowledge/technical-debt.md
✅ .github/mma/knowledge/security-findings.md
✅ .github/mma/knowledge/module-[N modules analyzed].md

Recommended next steps:

→ Review technical-debt.md with @m3a-pm to prioritize epics
→ Run /m3a-init-epic to create modernization epics
→ Invite @m3a-architect to plan TO-BE strategy
→ Run /m3a-dependency-audit to update CVEs periodically
```

---

## Completeness Validation

Before marking the workflow as complete, verify:

```
□ project-overview.md exists and has codebase metrics?
□ project-architecture.md has module structure and dependencies?
□ At least 1 module-[name].md per identified module?
□ dependencies.md has full inventory?
□ technical-debt.md has prioritization?
□ security-findings.md has CRITICAL CVEs identified (or confirmation of absence)?
□ config.yaml updated with confirmed information?
```

---

## Changelog

**v1.0.0 (2026-04-11)** — Skill created. Systematic AS-IS scan workflow. Structured outputs to .github/mma/knowledge/. Supports any stack.
