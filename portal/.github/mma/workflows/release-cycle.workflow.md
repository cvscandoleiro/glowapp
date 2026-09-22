---
description: "Workflow for release cycle governance: ADRs, runbooks, release notes, and risk gates. Coordinates documentation and governance artifacts around release milestones."
workflow-id: "release-cycle"
workflow-version: "1.0.0"
command: "/m3a-release-cycle"
author: "Edimar Ferla de Almeida"
organization: "Minsait (Indra Company)"
last-updated: "2026-04-24"
---

# Workflow: Release Cycle Governance

> **Structured governance for release milestones.**
> ADRs + Runbooks + Release Notes + Risk Gates — all coordinated.

---

## Overview

This workflow coordinates the governance artifacts required for a release cycle.
It is referenced by multiple skills that produce individual artifacts:

| Skill | Artifact | Lead Agent |
|---|---|---|
| `/m3a-adr` | Architecture Decision Records | M3A: Architect |
| `/m3a-runbook` | Operational Runbooks | M3A: DevOps |
| `/m3a-release-notes` | Release Notes (CHANGELOG + HTML) | M3A: Docs |
| `/m3a-risk-gates` | Go/No-Go Gate Reports | M3A: Orchestrator |

---

## Pre-conditions

```
□ .github/mma/config.yaml exists
□ At least one completed epic or sprint
□ Version number defined for the release
```

---

## PHASE 1 — Pre-Release Checklist

Before triggering individual skills:

```
1. Verify all stories in release scope are done (passed /m3a-story-done)
2. Verify all epics in release scope are done (passed /m3a-epic-done)
3. Verify no open CRITICAL/HIGH CVEs in dependencies
4. Verify documentation is up to date
5. Verify ADRs are recorded for all significant decisions
```

---

## PHASE 2 — Artifact Generation

### 2.1 Architecture Decision Records
For any decision made during the release that lacks an ADR:
```
runSubagent("M3A: Architect", "/m3a-adr for decision: [topic]")
```

### 2.2 Operational Runbooks
For any new deployment procedure:
```
runSubagent("M3A: DevOps", "/m3a-runbook for procedure: [topic]")
```

### 2.3 Release Notes
```
runSubagent("M3A: Docs", "/m3a-release-notes for version: [X.Y.Z]")
```

### 2.4 Risk Gate
```
runSubagent("M3A: Orchestrator", "/m3a-risk-gates for version: [X.Y.Z]")
```
⚠️ Requires human go/no-go decision.

---

## PHASE 3 — Release Approval

```
All artifacts generated:
  □ ADRs: [list]
  □ Runbooks: [list]
  □ Release notes: CHANGELOG.md + HTML
  □ Risk gate report: [status]

Human decision required: GO / NO-GO
```

---

## Outputs

- `.github/mma/decisions/ADR-*.md` — decision records
- `docs/runbooks/runbook-*.md` — operational runbooks
- `CHANGELOG.md` — updated with release version
- `docs/html/release-notes-X.Y.Z.html` — executive release notes
- `docs/risk-gate-report-X.Y.Z.md` — risk gate report

---

## Changelog

**v1.0.0 (2026-04-24)** — Workflow created. Release cycle governance coordinating ADRs, runbooks, release notes, and risk gates.
