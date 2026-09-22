# M3A Team — Collaboration Templates

Pre-defined workflow blueprints optimized by task type. The Orchestrator auto-selects the appropriate template based on task complexity classification.

**Token savings:** 10-15% per workflow vs. generic gate (pre-optimized agent set).

## Available Templates

| Template | Task Type | Agents | Avg Token Saving |
|---|---|---|---|
| `feature-development.yaml` | New feature from story | PM → Architect → Developer → QA → Security → Docs | -12% |
| `bug-fix.yaml` | Bug fix | Developer → QA → (Security if security-related) | -18% |
| `security-audit.yaml` | Security review | Analyst → Security → Architect → Developer | -10% |
| `refactoring.yaml` | Code refactoring | Architect → Developer → QA → (DBA if DB) | -15% |

## Auto-Selection Rules

The Orchestrator applies this template AFTER complexity classification:

```
COMPLEX + feature keyword → feature-development
COMPLEX + bug keyword → bug-fix
COMPLEX + security keyword → security-audit
COMPLEX + refactor keyword → refactoring
MODERATE + bug → bug-fix (lightweight)
```

## Project Overrides

Projects can override templates by creating files in `.github/mma/workflow-overrides/[template-name].yaml`.
