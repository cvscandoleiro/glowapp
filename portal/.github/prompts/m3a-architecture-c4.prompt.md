---
description: "MMA Architecture C4 — Generates C4 diagrams (Context, Container, Component levels) in Mermaid format. Uses project stack from config.yaml. Outputs to architecture-c4.md."
agent: "agent"
---

# /m3a-architecture-c4 — Generate C4 Diagrams

> **Visualize your architecture at multiple zoom levels.**
> Context → Container → Component — all in Mermaid.

---

## Behavior Rule

- **Stack-aware** — reads modules and dependencies from knowledge base
- **Mermaid output** — diagrams render in VS Code, GitHub, and portals
- **Incremental** — can generate one level or all three
- **Template-driven** — uses `templates/markdown/architecture-c4.md`

---

## STEP 0 — Verify Context

```
IF .github/mma/config.yaml DOES NOT EXIST:
  → "⚠️ Run /m3a-init first."
  → STOP

Read:
  - .github/mma/config.yaml → stack, project name
  - .github/mma/knowledge/project-architecture.md → modules, dependencies
  - .github/mma/knowledge/dependencies.md → external systems
```

---

## STEP 1 — Diagram Scope

```
"Which C4 levels do you want to generate?

[1] Context — system boundaries and external actors (recommended first)
[2] Container — runtime units (apps, DBs, message queues)
[3] Component — internal structure of a specific container
[4] All three levels

If Component: which container should I zoom into?"
```

---

## STEP 2 — Generate Diagrams

### Level 1: Context
```mermaid
C4Context
  title System Context diagram for {{PROJECT_NAME}}

  Person(user, "User", "Description")
  System(system, "{{PROJECT_NAME}}", "Description")
  System_Ext(ext1, "External System", "Description")

  Rel(user, system, "Uses")
  Rel(system, ext1, "Calls")
```

### Level 2: Container
```mermaid
C4Container
  title Container diagram for {{PROJECT_NAME}}

  Person(user, "User")
  Container(web, "Web App", "{{STACK_FRAMEWORK}}", "Description")
  Container(api, "API", "{{STACK_RUNTIME}}", "Description")
  ContainerDb(db, "Database", "{{STACK_DB}}", "Description")

  Rel(user, web, "Uses", "HTTPS")
  Rel(web, api, "Calls", "REST/JSON")
  Rel(api, db, "Reads/Writes", "SQL")
```

### Level 3: Component
```mermaid
C4Component
  title Component diagram for [Container Name]

  Component(ctrl, "Controller", "{{STACK_FRAMEWORK}}", "Handles HTTP requests")
  Component(svc, "Service", "{{STACK_RUNTIME}}", "Business logic")
  Component(repo, "Repository", "JPA/ORM", "Data access")

  Rel(ctrl, svc, "Calls")
  Rel(svc, repo, "Uses")
```

---

## STEP 3 — Output

Save to: `docs/architecture-c4.md` (or `.github/mma/knowledge/project-architecture.md` appendix)

```
✅ C4 diagrams generated: docs/architecture-c4.md
  - Level 1: Context ✅
  - Level 2: Container ✅
  - Level 3: Component ✅ (for [container])
```

---

## Changelog

**v1.0.0 (2026-04-24)** — Skill created. C4 diagram generation in Mermaid from project knowledge base.
