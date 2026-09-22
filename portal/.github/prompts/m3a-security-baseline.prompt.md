---
description: "MMA Security Baseline — Establishes OWASP Top 10 baseline, secrets management policy, and hardening checklist for the project stack. Outputs a security-baseline.md artifact."
agent: "agent"
---

# /m3a-security-baseline — Security Baseline

> **OWASP Top 10 baseline + secrets management + hardening.**
> Stack-specific. Actionable. Mandatory for production systems.

---

## Behavior Rule

- **OWASP-aligned** — covers all OWASP Top 10 categories
- **Stack-specific** — adapts controls to the project's runtime and framework
- **Checklist format** — actionable items, not just theory
- **Living document** — updated as threats evolve

---

## STEP 0 — Verify Context

```
IF .github/mma/config.yaml DOES NOT EXIST:
  → "⚠️ Run /m3a-init first."
  → STOP

Read:
  - .github/mma/config.yaml → stack, deploy target
  - .github/mma/knowledge/security-findings.md → existing findings (if any)
  - .github/mma/knowledge/dependencies.md → dependency landscape
```

---

## STEP 1 — Generate Security Baseline

```markdown
# Security Baseline — {{PROJECT_NAME}}

**Date:** {{DATE}}
**Stack:** {{STACK_RUNTIME}} / {{STACK_FRAMEWORK}}
**Standard:** OWASP Top 10 (2021)

## OWASP Top 10 Checklist

### A01:2021 — Broken Access Control
- [ ] Role-based access control implemented
- [ ] Default deny — all endpoints require authentication unless explicitly public
- [ ] CORS configured restrictively
- [ ] Directory listing disabled

### A02:2021 — Cryptographic Failures
- [ ] TLS 1.2+ enforced for all connections
- [ ] Sensitive data encrypted at rest
- [ ] No hardcoded secrets in source code
- [ ] Strong password hashing (bcrypt/scrypt/argon2)

### A03:2021 — Injection
- [ ] Parameterized queries for all database operations
- [ ] Input validation on all user inputs
- [ ] Output encoding for all rendered content
- [ ] No dynamic code execution from user input

### A04:2021 — Insecure Design
- [ ] Threat modeling performed for critical flows
- [ ] Rate limiting on authentication endpoints
- [ ] Business logic abuse prevention

### A05:2021 — Security Misconfiguration
- [ ] Default credentials removed/changed
- [ ] Error messages do not leak stack traces
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
- [ ] Unnecessary features/endpoints disabled

### A06:2021 — Vulnerable and Outdated Components
- [ ] Dependency audit performed (/m3a-dependency-audit)
- [ ] No CRITICAL/HIGH CVEs in production dependencies
- [ ] Automated dependency scanning in CI/CD

### A07:2021 — Identification and Authentication Failures
- [ ] Multi-factor authentication available
- [ ] Session management follows best practices
- [ ] Password policy enforced

### A08:2021 — Software and Data Integrity Failures
- [ ] CI/CD pipeline integrity verified
- [ ] Dependencies from trusted sources only
- [ ] Code signing or verification in place

### A09:2021 — Security Logging and Monitoring Failures
- [ ] Security events logged (auth failures, access denials)
- [ ] Log integrity protected
- [ ] Alerting configured for critical events

### A10:2021 — Server-Side Request Forgery (SSRF)
- [ ] URL validation on all server-side requests
- [ ] Allowlist for external service calls
- [ ] Network segmentation for internal services

## Secrets Management Policy

- Secrets stored in: [vault / environment variables / cloud secrets manager]
- Rotation policy: [frequency]
- Access audit: [how often]
- Emergency revocation: [procedure]

## Hardening Checklist

### Application
- [ ] Debug mode disabled in production
- [ ] Admin interfaces not exposed to public
- [ ] File upload restrictions enforced

### Infrastructure
- [ ] Firewall rules follow least-privilege
- [ ] SSH key-based auth only (no passwords)
- [ ] Container images scanned for vulnerabilities
```

---

## STEP 2 — Output

Save to: `.github/mma/knowledge/security-baseline.md`

```
✅ Security baseline established: .github/mma/knowledge/security-baseline.md
  OWASP Top 10: [N]/10 categories addressed
```

---

## Changelog

**v1.0.0 (2026-04-24)** — Skill created. OWASP Top 10 baseline with secrets management and hardening.
