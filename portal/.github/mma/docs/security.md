---
title: "M3A Team — Security Policy"
version: "1.0.0"
last-updated: "2026-04-11"
audience: "all users, security teams, project leads"
---

# Security Policy

This document describes the security model, data handling practices, and usage policies for M3A Team.

---

## Table of Contents

1. [Usage Scope](#1-usage-scope)
2. [What Data Goes Where](#2-what-data-goes-where)
3. [LLM Data Handling Considerations](#3-llm-data-handling-considerations)
4. [Guardrails Description](#4-guardrails-description)
5. [Internal Usage Policy Enforcement](#5-internal-usage-policy-enforcement)
6. [Incident Reporting](#6-incident-reporting)
7. [Vulnerability Disclosure](#7-vulnerability-disclosure)

---

## 1. Usage Scope

M3A Team is **Minsait internal use only**. It must not be used on:

- Personal projects unrelated to Minsait work
- Client projects without the client's knowledge and consent regarding AI tool usage
- Any project that prohibits AI-assisted development in its contractual terms

Before using M3A Team on a client project, verify:

1. The client contract does not prohibit AI-assisted development.
2. The project's AI usage policy permits sending code context to LLM providers.
3. Any client-specific data classification requirements are understood.

---

## 2. What Data Goes Where

Understanding the data flow is essential for compliance with Minsait's data protection policies.

### Local Data (stays on your machine)

| Data | Location | Notes |
|---|---|---|
| Project configuration | `.mma/config.yaml` | Contains project name, stack, client. Commit with care. |
| Knowledge base | `.mma/knowledge/` | May contain architectural decisions, technical debt descriptions |
| Backlog / sprint data | `.mma/backlog/` | Contains epic and story descriptions |
| Init logs | `.mma/logs/m3a-init.log` | Timestamped record of onboarding answers |
| Agent files | `.github/agents/` | Prompt templates — no credentials |
| Generated HTML docs | `docs/portal/` | Documentation pages — no credentials |

### Data Sent to LLM Providers

When you interact with M3A Team agents in your IDE's AI assistant, the following is sent to the LLM provider (e.g., GitHub Copilot → Azure OpenAI, or Cursor → Anthropic):

- Your chat messages and agent invocations
- The contents of agent files loaded as context (`.github/agents/`)
- Any files you attach or reference in the chat
- Portions of your codebase that the IDE sends as context

**What is NOT automatically sent:**
- `.mma/config.yaml` (unless you explicitly reference it)
- Private credentials or secrets (assuming `.gitignore` is correctly configured)
- Files listed in `.gitignore`

### Data NOT Stored in This Repository

The following must **never** be committed to this repository:

- Client passwords, API keys, database credentials
- Proprietary client source code
- Personal identifiable information (PII)
- Internal network addresses, IP ranges, or infrastructure topology
- SSL certificates, private keys

---

## 3. LLM Data Handling Considerations

M3A Team runs within your organization's licensed AI assistant. The data governance of AI-processed data is determined by your AI provider agreement, not by M3A Team.

### GitHub Copilot Users

- Code shared via GitHub Copilot Chat is subject to the [GitHub Copilot Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-copilot-privacy-statement).
- Enterprise Copilot deployments typically exclude training data usage — verify with your GitHub Copilot administrator.

### General Guidance

1. **Do not paste secrets into chat.** If an agent asks for configuration values, do not include passwords or tokens in the chat response.
2. **Minimize client data in context.** When running analysis workflows, be selective about which files you attach.
3. **Use `.mma/config.yaml`** for project metadata instead of repeating it in chat — agents read this automatically.
4. **Understand your AI usage policy.** Contact your Minsait data protection officer (DPO) if uncertain about what project data can be sent to external AI providers.

---

## 4. Guardrails Description

M3A Team implements behavioral guardrails through the **13 Laws** embedded in each agent's instruction file. These are prompt-level controls, not cryptographic enforcement.

### Active Guardrails

| Guardrail | Law | Description |
|---|---|---|
| Heartbeat verification | Law 1 | Every orchestrator response must start with `⚡` — absence signals out-of-identity behavior |
| Output discipline | Law 2 | Agents may not duplicate file contents in chat, reducing data leakage risk |
| No auto-rewrite | Law 11 | Agents never modify code without human plan approval |
| Security veto | Law 10 | `@m3a-security` can unconditionally halt any action |
| Honesty declaration | Law 12 | Agents must declare if they could not load required context |
| Human-in-the-loop | Law 5 | Destructive actions require explicit human confirmation |

### Limitations

Guardrails are **prompt-level instructions**. They can be circumvented if:
- The user explicitly instructs the agent to ignore them
- The AI model fails to follow instructions reliably

Guardrails are **not a substitute** for:
- Code review
- Security scanning (SAST, DAST, dependency scanning)
- Human judgment on architectural and security decisions

---

## 5. Internal Usage Policy Enforcement

### Access Control

- M3A Team repository is private in the `Minsait-GA` GitHub organization.
- Access is controlled via GitHub organization membership.
- External collaborators require explicit invitation and project lead approval.

### Audit Trail

M3A Team generates a local audit trail at `.mma/logs/m3a-init.log`. This log records:
- Timestamp of initialization
- Project configuration choices made during `/m3a-init`
- Agent activation events

This log is stored locally and is not centrally aggregated.

### Non-Compliance

Use of M3A Team in violation of this policy (e.g., sharing with external parties, using on prohibited projects) should be reported to your Minsait project lead and the M3A Team maintainers.

---

## 6. Incident Reporting

### Security Issues in M3A Team Itself

If you discover a security vulnerability in M3A Team (e.g., a script that could execute malicious code, or an agent instruction that could be used for prompt injection):

1. **Do NOT open a public GitHub issue.**
2. Report directly to the M3A Team maintainers via Minsait's internal security channel.
3. Include: description of the vulnerability, potential impact, steps to reproduce.
4. Maintainers will acknowledge within 2 business days and provide a fix timeline.

### Suspected Data Incidents

If you believe project data was inappropriately shared or exposed through M3A Team usage:

1. Stop using M3A Team on the affected project immediately.
2. Report to your Minsait project lead/manager.
3. Follow Minsait's standard incident response procedure.
4. Notify the M3A Team maintainers if the root cause is in the framework itself.

---

## 7. Vulnerability Disclosure

### Responsible Disclosure Policy

M3A Team follows a **coordinated disclosure** model:

1. Reporter identifies and privately reports a vulnerability.
2. Maintainers confirm, assess severity, and develop a fix.
3. Fix is released and a security advisory is published in the GitHub repository.
4. Reporter is credited (with permission) in the advisory.

### Severity Classification

| Severity | Description | Target Fix Time |
|---|---|---|
| Critical | Remote code execution, credentials exposure | 24 hours |
| High | Significant data exposure, privilege escalation | 72 hours |
| Medium | Limited data exposure, behavioral bypass | 7 business days |
| Low | Informational, minor policy violation | 30 business days |

### Out of Scope

The following are **not** in scope for vulnerability reports:
- AI model hallucinations (report to the AI provider)
- Correct agent behavior that produces unexpected results for a specific project
- Issues in third-party tools used alongside M3A Team (VS Code, GitHub Copilot, etc.)
