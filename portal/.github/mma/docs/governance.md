---
title: "M3A Team — Governance Guide"
version: "1.0.0"
last-updated: "2026-04-11"
audience: "contributors, project leads, team maintainers"
---

# Governance Guide

This document describes the governance model for M3A Team: who can use it, how to contribute, how decisions are made, and how the 13 Laws are enforced.

---

## Table of Contents

1. [Usage Scope](#1-usage-scope)
2. [Contributing New Agents](#2-contributing-new-agents)
3. [Review Process for Agent Updates](#3-review-process-for-agent-updates)
4. [Versioning Policy](#4-versioning-policy)
5. [The 13 Laws and How Guardrails Work](#5-the-13-laws-and-how-guardrails-work)
6. [Escalation Process](#6-escalation-process)
7. [Maintainer Responsibilities](#7-maintainer-responsibilities)

---

## 1. Usage Scope

### Who Can Use M3A Team

M3A Team is **Minsait internal use only**. It is not published publicly and is not licensed for use outside the Minsait organization (Indra Company).

| Audience | Status |
|---|---|
| Minsait employees | ✅ Authorized |
| Indra employees on Minsait projects | ✅ Authorized (with project lead approval) |
| External contractors working on Minsait projects | ⚠️ Case-by-case — requires Minsait project lead authorization |
| Any external party outside Minsait/Indra | ❌ Not authorized |

See [LICENSE.md](../LICENSE.md) for the full legal text.

### What "Internal Use" Means

- You may use M3A Team on any Minsait internal or client-facing project.
- You may not redistribute M3A Team agents, scripts, or templates outside the Minsait GitHub organization.
- You may not publish derivative works (custom agents based on M3A Team) to public repositories without authorization.

---

## 2. Contributing New Agents

### When to Create a New Agent

Before creating a new agent, ask:

1. **Is this capability already covered?** Review `core/registry/agents.registry.yaml`. Many needs can be addressed by extending an existing agent.
2. **Is this general-purpose or project-specific?** Project-specific capabilities (e.g., an agent that understands a specific client's data model) should be created in the project's `.mma/` directory, not in the core framework.
3. **Can this be a skill instead?** A skill (`skills/m3a-*.prompt.md`) is appropriate for single-purpose, lightweight capabilities. A full agent is warranted when the capability requires persistent identity, a persona, and multi-turn interaction.

### New Agent Requirements

All new agents must:

1. **Have a clear, unique persona** — Choose a historical/philosophical figure whose archetype fits the specialty.
2. **Follow the standard frontmatter** — See `agents/m3a-orchestrator.agent.md` for the reference template.
3. **Implement the 13 Laws** — Specifically Laws 1 (heartbeat), 2 (output discipline), and 12 (honesty declaration).
4. **Be technology-agnostic** — No hardcoded project names, versions, or technology references.
5. **Use `{{PLACEHOLDER}}` for all project-specific references**.
6. **Include routing criteria** — What types of requests should `@m3a-orchestrator` route to this agent?
7. **Define clear boundaries** — What does this agent explicitly NOT do?

### Contribution Workflow

```
1. Open a Feature Request issue (label: agent-update)
       ↓
2. Discuss with maintainers — get approval before writing
       ↓
3. Create a feature branch: feature/add-m3a-[name]-agent
       ↓
4. Write the agent file following the standard template
       ↓
5. Add entry to core/registry/agents.registry.yaml
       ↓
6. Update templates/placeholders.md if new placeholders are introduced
       ↓
7. Update CHANGELOG.md
       ↓
8. Open a Pull Request — all checklist items must pass
       ↓
9. Review by at least 1 maintainer
       ↓
10. Merge to main
```

---

## 3. Review Process for Agent Updates

### Patch Updates (agent behavior tuning, wording)

- **Requirement:** 1 maintainer approval
- **Timeline:** Target 3 business days
- **Checklist:** PR checklist must pass, CI validation must pass

### Minor Updates (new capabilities within existing agent scope)

- **Requirement:** 1 maintainer approval + Laws reviewer confirmation
- **Timeline:** Target 5 business days
- **Additional:** Laws 2 and 12 must be verified in updated behavior

### Major Updates (restructuring agent identity, changing persona, adding new laws)

- **Requirement:** 2 maintainer approvals + team lead sign-off
- **Timeline:** Target 10 business days
- **Additional:** Must include rationale in PR, may require ADR if architectural impact

### Breaking Changes (renaming agents, changing invocation syntax)

- **Requirement:** Team lead approval + migration guide required
- **Rules:**
  - Deprecate old invocation in a minor release before removing in a major release
  - Document migration path in `docs/` and `CHANGELOG.md`
  - Notify all known M3A Team users via the Minsait internal channel

---

## 4. Versioning Policy

M3A Team follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html):

```
MAJOR.MINOR.PATCH
  │     │     └── Bug fixes, wording improvements (backward-compatible)
  │     └──────── New agents, new skills, new templates (backward-compatible)
  └────────────── Breaking changes: renaming, removing, or restructuring agents/APIs
```

### Version Bump Rules

| Change Type | Bump |
|---|---|
| Fix wording/behavior of existing agent | PATCH |
| Add new skill or template without agent changes | PATCH |
| Add new agent | MINOR |
| Add new workflow | MINOR |
| Change agent invocation syntax (e.g., `@m3a-dev` → `@m3a-developer`) | MAJOR |
| Remove or deprecate an agent | MAJOR |
| Change `mma.config.schema.json` in a breaking way | MAJOR |

### Pre-releases

Use suffixes for pre-release versions:

```
v1.2.0-alpha.1    — early development, not for production use
v1.2.0-beta.1     — feature complete, undergoing testing
v1.2.0-rc.1       — release candidate, final validation
```

---

## 5. The 13 Laws and How Guardrails Work

M3A Team enforces **12 inviolable laws** that govern agent behavior. These laws exist to prevent agents from acting outside their boundaries, generating unsafe outputs, or impersonating roles they do not hold.

### The 13 Laws (Summary)

| Law | Name | Core Rule |
|---|---|---|
| 1 | Heartbeat | Every Marcus Aurelius response starts with `⚡ [Agent] \| [action] → [destination]`. |
| 2 | Output Discipline | Agents output only what is in their defined format. No narration, no duplicating file contents. |
| 3 | Routing Discipline | Marcus Aurelius routes; specialists execute. Never execute what you should route. |
| 4 | No Direct Execution | The orchestrator does NOT write code, docs, or configs directly. |
| 5 | Human-in-the-Loop | Destructive, irreversible, or high-impact actions require explicit human confirmation. |
| 6 | No Hallucination | Agents must not invent facts, file paths, or technical details. Use "unknown" if information is missing. |
| 7 | Scope Boundary | Agents only act within their defined specialty. Do not cross into another agent's domain. |
| 8 | Traceability | Every generated artifact must be traceable to a decision, epic, or requirement. |
| 9 | Version Discipline | Agents must not upgrade dependencies, shift architectures, or change versions without an approved decision. |
| 10 | Security Veto | `@m3a-security` has unconditional veto power over any change that introduces a security risk. |
| 11 | No Auto-Rewrite | Agents never auto-rewrite code or docs without human sign-off on the plan. |
| 12 | Honesty Declaration | If an agent could not execute a required activation step, it must declare this before proceeding. |

### How Guardrails Are Enforced

Guardrails are embedded in the agent instruction files (`agents/m3a-*.agent.md`). They are not enforced programmatically — they rely on the AI model following the instructions.

**Escalation to humans** is mandatory when:
- A Law violation is detected
- A conflict between agents cannot be resolved
- A decision gate requires approval (Laws 5, 9, 11)
- `@m3a-security` issues a veto (Law 10)

---

## 6. Escalation Process

### Agent Conflict

If two agents give contradictory guidance:

1. The **orchestrator** (`@m3a-orchestrator`) adjudicates.
2. If unresolved, the conflict becomes a **human decision gate** — the user must choose.
3. The decision is logged in `.mma/knowledge/project-decisions-log.md`.

### Security Veto

If `@m3a-security` issues a `❌ SECURITY VETO`:

1. All related actions **stop immediately**.
2. The veto reason is recorded in `.mma/knowledge/project-decisions-log.md`.
3. A human must review and either:
   - Resolve the security issue and re-request
   - Override with an explicit risk acceptance decision (signed by project lead)

### Action Outside Agent Scope

If an agent is asked to act outside its scope:

1. The agent must **decline** and name the correct agent.
2. The orchestrator is notified if the user persists.
3. Custom agents for novel scopes can be created via the contribution process above.

---

## 7. Maintainer Responsibilities

The `@ealmeidaf_indra/m3a-team-maintainers` team is responsible for:

- Reviewing and merging pull requests (see CODEOWNERS)
- Releasing new versions (tagging, CHANGELOG, GitHub Release)
- Enforcing the versioning policy
- Reviewing proposed new agents for Laws compliance
- Maintaining `core/mma.config.schema.json` and `core/registry/`
- Publishing internal communications for breaking changes
- Deprecating and removing outdated content with appropriate notice periods

**Response time targets:**

| Activity | Target |
|---|---|
| Initial PR review | 3 business days |
| Bug fix PR merge | 5 business days |
| Feature PR merge | 10 business days |
| Release (after approval) | 2 business days |
