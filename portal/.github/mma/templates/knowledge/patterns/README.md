# M3A Team — Agent Pattern Library

This folder stores successful patterns learned by each agent during project sessions.

**Purpose:** Allow agents to leverage past successes without repeating mistakes. Lightweight alternative to vector DB — pure markdown, fully stateless-compatible.

**Format:** One file per agent. Each entry: context + action + result.

**Size constraint:** Each file MUST stay ≤ 300 tokens (enforced by agents).

**Auto-loaded by:** M3A: Orchestrator (STEP 3) — only loads the pattern file relevant to the current agent being invoked.

---

## Files in this folder

| File | Agent | Auto-loaded when |
|---|---|---|
| `architect.md` | Vitruvius | Architecture analysis or ADR requested |
| `developer.md` | Knuth | Implementation or code review requested |
| `qa.md` | Popper | Testing or quality review requested |
| `security.md` | Hobbes | Security audit or OWASP review requested |
| `dba.md` | Codd | Database or schema work requested |
| `devops.md` | Atlas | CI/CD, Docker, or infra requested |
| `pm.md` | Drucker | Epic or backlog work requested |
| `docs.md` | Borges | Documentation or HTML requested |
