---
title: "{{PROJECT_NAME}} — Quality Gates"
version: "{{DOC_VERSION}}"
status: "{{DOC_STATUS}}"
date: "{{DOC_DATE}}"
project: "{{PROJECT_CODE}}"
organization: "{{ORG_LEGAL}}"
---

# {{PROJECT_NAME}} — Quality Gates

> Definition of Done checklists per delivery type.
> Enforced by the QA agent. No story can reach `done` without passing its applicable gate.

---

## 1. Feature Delivery Gate

*Applied to: stories implementing new features or major enhancements.*

### Code Quality

- [ ] Code compiles without errors or warnings
- [ ] Static analysis passes (no new critical/high issues)
- [ ] No hardcoded credentials, tokens, or secrets
- [ ] No debug code or temporary workarounds left in production code
- [ ] Encoding/charset consistent with project standard (`{{STACK_RUNTIME}}` settings)

### Testing

- [ ] Unit tests written for all new logic (Red-Green-Refactor cycle complete)
- [ ] All unit tests pass (`{{BUILD_TEST_COMMAND}}` green)
- [ ] Integration tests pass where applicable
- [ ] Test coverage does not drop below defined threshold
- [ ] Edge cases and boundary conditions tested

### Functional Validation

- [ ] All acceptance criteria (ACs) verified and checked
- [ ] Tested in environment matching `{{STACK_OS}}`
- [ ] No regressions in related functionality
- [ ] User-visible behavior matches story description

### Documentation

- [ ] Code comments added for non-obvious logic
- [ ] API changes documented (if applicable)
- [ ] Knowledge base updated if new technical insight was discovered
- [ ] Changelog entry added under `[Unreleased]`

### Security (Hobbes Gate)

- [ ] No new OWASP Top 10 vulnerabilities introduced
- [ ] Input validation applied at all system boundaries
- [ ] No new dependencies with CRITICAL or HIGH CVEs (or exception documented in ADR)
- [ ] Secrets management follows project policy

### Build Gate (Law 12)

- [ ] `BUILD SUCCESS` with zero errors on target module
- [ ] Build command: `{{BUILD_COMMAND}}`
- [ ] Evidence recorded in story file

---

## 2. Hotfix / Patch Gate

*Applied to: critical bug fixes in production or release branches.*

### Minimal Scope

- [ ] Fix is the smallest possible change to resolve the issue
- [ ] No unrelated refactoring or improvements in the same commit
- [ ] Root cause identified and documented

### Testing

- [ ] Regression test added to prevent recurrence
- [ ] All existing tests still pass
- [ ] Fix verified in same environment where bug occurred

### Documentation

- [ ] Bug description and fix documented in change log
- [ ] Incident report updated (if applicable)
- [ ] `.github/mma/knowledge/` updated with root cause if systemic

### Build Gate (Law 12)

- [ ] `BUILD SUCCESS` with zero errors
- [ ] Evidence recorded in story or hotfix ticket

---

## 3. Migration / Upgrade Gate

*Applied to: dependency upgrades, runtime migrations, OS changes, DB schema migrations.*

### Pre-Migration

- [ ] Rollback plan documented and tested
- [ ] Backup of affected systems confirmed
- [ ] Risk gates reviewed and approved (if `governance.risk_gates: true`)
- [ ] Human sign-off obtained before proceeding
- [ ] ADR created for the migration decision

### Compatibility

- [ ] Compatibility matrix validated (runtime, OS, DB, dependencies)
- [ ] All transitive dependency conflicts resolved
- [ ] CVE scan run post-upgrade — no new CRITICAL issues
- [ ] No breaking API or behavioral changes (or all downstream consumers updated)

### Testing

- [ ] Full regression test suite passes on migrated stack
- [ ] Performance benchmarks compared before/after (within acceptable delta)
- [ ] Integration tests pass with all external systems

### Deployment

- [ ] Deployment runbook tested in staging
- [ ] Monitoring and alerting configured post-migration
- [ ] Smoke tests pass in target environment

### Build Gate (Law 12)

- [ ] `BUILD SUCCESS` on target stack
- [ ] Evidence recorded with OS/runtime/DB versions

---

## 4. Infrastructure / DevOps Gate

*Applied to: Docker changes, Kubernetes manifests, CI/CD pipeline updates, scripts.*

### Safety

- [ ] Changes are idempotent (safe to run multiple times)
- [ ] No hardcoded environment-specific values in scripts or manifests
- [ ] No sensitive data in container images or CI/CD configs
- [ ] Container image scanned for CVEs before push

### Validation

- [ ] Script syntax validated (`bash -n` for shell / PowerShell syntax check)
- [ ] Docker build completes successfully
- [ ] Kubernetes manifests validated (`kubectl --dry-run=client`)
- [ ] CI/CD pipeline runs green on test branch

### Documentation

- [ ] Runbook updated for operational procedures
- [ ] `.github/mma/knowledge/` updated for infrastructure changes

---

## 5. Documentation Gate

*Applied to: documentation-only deliverables (portals, reports, runbooks, ADRs).*

### Completeness

- [ ] No placeholders left unfilled (no `{{PLACEHOLDER}}` strings in published output)
- [ ] All sections present and non-trivial
- [ ] Links verified and functional

### Quality

- [ ] Reviewed for technical accuracy
- [ ] Language and tone consistent with project standards
- [ ] Minsait branding applied correctly (for HTML outputs)
- [ ] Layer 2 documents do not mention AI agent names

### Review

- [ ] Reviewed by {{ENG_A}} or {{ENG_B}}
- [ ] Published to correct location

---

## Gate Override Process

> Quality gates are mandatory. Overrides require documented justification.

If a gate criterion cannot be met:

1. Document the exception in the story or epic file with:
   - The specific criterion being waived
   - Business or technical justification
   - Compensating control (what mitigates the risk)
   - Approval from {{ENG_A}} or project lead
2. Create a follow-up story to resolve the exception within 2 sprints

---

*Document maintained by {{ORG_LEGAL}} — {{TEAM_NAME}}*
*Generated with M3A Team — Minsait Multi Agents Framework*
