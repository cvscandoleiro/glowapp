---
title: "{{PROJECT_NAME}} — Project Overview"
version: "{{DOC_VERSION}}"
status: "{{DOC_STATUS}}"
date: "{{DOC_DATE}}"
organization: "{{ORG_LEGAL}}"
project_code: "{{PROJECT_CODE}}"
---

# {{PROJECT_NAME}}

> **{{BRANDING_TAGLINE}}**

**Organization:** {{ORG_LEGAL}}
**Client:** {{CLIENT_NAME}}
**Repository:** {{REPO_URL}}
**Current Version:** {{VERSION_CURRENT}}
**Target Version:** {{VERSION_TARGET}}
**Language:** {{DOC_LANG}}
**Status:** {{DOC_STATUS}}
**Date:** {{DOC_DATE}}

---

## 1. Executive Summary

{{PROJECT_DESCRIPTION}}

*[Provide a concise 3–5 sentence summary of what this project is, what problem it solves, and who it serves.]*

---

## 2. Project Scope

### 2.1 In-Scope

- *[List capabilities, modules, and systems explicitly within scope]*
- *[Be specific — avoid broad statements like "everything related to X"]*

### 2.2 Out-of-Scope

- *[List what is explicitly excluded from this project]*
- *[Prevents scope creep and misaligned expectations]*

### 2.3 Project Type

**Type:** {{PROJECT_TYPE}}

*Applicable classifications: `new` (greenfield) | `existing` (ongoing) | `legacy` (modernization) | `assessment` (diagnosis only) | `docs` (documentation only)*

---

## 3. Business Context

### 3.1 Problem Statement

*[Describe the core business problem or opportunity this project addresses.]*
*[Why does this project exist? What would happen without it?]*

### 3.2 Business Goals

| Goal | Priority | Success Metric |
|---|---|---|
| *[Goal 1]* | High | *[Measurable metric]* |
| *[Goal 2]* | Medium | *[Measurable metric]* |

### 3.3 Key Stakeholders

| Role | Name / Team | Interest |
|---|---|---|
| Project Sponsor | *[Name or team]* | *[What they care about]* |
| Technical Lead | *[Name or team]* | *[Scope of responsibility]* |
| Client Representative | {{CLIENT_NAME}} | *[Outcomes expected]* |

---

## 4. Technical Overview

### 4.1 Technology Stack

| Layer | Component | Version |
|---|---|---|
| Runtime | {{STACK_RUNTIME}} | {{STACK_RUNTIME_VERSION}} |
| Operating System | {{STACK_OS}} | — |
| Database | {{STACK_DB}} | — |
| CI/CD | {{STACK_CI}} | — |
| Deployment | {{STACK_DEPLOY}} | — |

### 4.2 Key Architectural Characteristics

- *[List non-functional requirements that drive architectural decisions]*
- *[Examples: availability, latency, throughput, security posture, compliance]*

### 4.3 Existing Architecture (AS-IS)

*[For existing/legacy projects — describe the current system at a high level.]*
*[For new projects — describe any constraints or starting points.]*
*[Reference: docs/architecture-c4.md for detailed diagrams.]*

---

## 5. Roadmap Summary

*[High-level phases and milestones. Detail is in the backlog.]*

| Phase | Description | Target |
|---|---|---|
| Phase 1 | *[Description]* | *[Target date or sprint]* |
| Phase 2 | *[Description]* | *[Target date or sprint]* |
| Phase 3 | *[Description]* | *[Target date or sprint]* |

*Full backlog: `.github/mma/backlog/epics/`*

---

## 6. Decision Points

*[Link to key decisions made for this project.]*
*[Full log: `.github/mma/decisions/decisions-log.md`]*

| Decision | Reference | Status |
|---|---|---|
| *[Decision title]* | ADR-NNN | *[approved/pending]* |

---

## 7. Risk Summary

*[Top 3–5 risks. Full risk register: `docs/risk-register.md`]*

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| *[Risk description]* | *[H/M/L]* | *[H/M/L]* | *[Mitigation strategy]* |

---

## 8. Document History

| Version | Date | Author | Summary |
|---|---|---|---|
| {{DOC_VERSION}} | {{DOC_DATE}} | {{ENG_A}} | Initial document |

---

*Document maintained by {{ORG_LEGAL}} — {{TEAM_NAME}}*
*Generated with M3A Team — Minsait Multi Agents Framework*
