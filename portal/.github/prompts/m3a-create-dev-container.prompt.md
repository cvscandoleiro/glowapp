---
description: "MMA Create Dev Container — Generates a .devcontainer/ configuration tailored to the project stack. Reads stack from .github/mma/config.yaml. Generates devcontainer.json, Dockerfile, and postCreateCommand scripts."
agent: "agent"
---

# /m3a-create-dev-container — Generate Dev Container

> **Creates a `.devcontainer/` configuration tailored to your project stack.**
> Reads stack info from `.github/mma/config.yaml` — no guessing.

---

## Behavior Rule

- **Stack-aware** — reads runtime, framework, DB from config.yaml
- **Non-destructive** — if `.devcontainer/` exists, asks before overwriting
- **Complete** — generates `devcontainer.json`, `Dockerfile`, and setup scripts
- **Tested patterns** — uses known-good base images per stack

---

## STEP 0 — Verify Context

```
IF .github/mma/config.yaml DOES NOT EXIST:
  → "⚠️ Run /m3a-init first."
  → STOP

Read stack from config:
  - stack.runtime (e.g., Java 11, Node 18, Python 3.11)
  - stack.framework (e.g., Spring Boot, Express, Django)
  - stack.database (e.g., PostgreSQL 14, MySQL 8, MongoDB 6)
  - stack.os (e.g., Linux, Alpine)

IF .devcontainer/ ALREADY EXISTS:
  → "⚠️ .devcontainer/ already exists. Overwrite? [y/N]"
  → If N → STOP
```

---

## STEP 1 — Base Image Selection

Map stack to base image:

| Runtime | Base Image |
|---|---|
| Java 8–11 | `mcr.microsoft.com/devcontainers/java:11` |
| Java 17+ | `mcr.microsoft.com/devcontainers/java:17` |
| Node 16–18 | `mcr.microsoft.com/devcontainers/javascript-node:18` |
| Node 20+ | `mcr.microsoft.com/devcontainers/javascript-node:20` |
| Python 3.x | `mcr.microsoft.com/devcontainers/python:3` |
| .NET 6+ | `mcr.microsoft.com/devcontainers/dotnet:6.0` |
| Go | `mcr.microsoft.com/devcontainers/go:latest` |
| Multi-stack | `mcr.microsoft.com/devcontainers/universal:2` |

---

## STEP 2 — Generate Files

### devcontainer.json
```json
{
  "name": "{{PROJECT_NAME}} Dev Container",
  "build": { "dockerfile": "Dockerfile" },
  "features": { /* stack-specific features */ },
  "customizations": {
    "vscode": {
      "extensions": [ /* stack-specific extensions */ ]
    }
  },
  "postCreateCommand": "bash .devcontainer/post-create.sh",
  "forwardPorts": [ /* DB ports, app ports */ ]
}
```

### Dockerfile
Based on the selected base image, add stack-specific tooling.

### post-create.sh
Install dependencies, seed database, run initial build.

---

## STEP 3 — Output

```
✅ Dev container created:
  .devcontainer/
  ├── devcontainer.json
  ├── Dockerfile
  └── post-create.sh

To use: Ctrl+Shift+P → "Dev Containers: Reopen in Container"
```

---

## Changelog

**v1.0.0 (2026-04-24)** — Skill created. Stack-aware dev container generation from config.yaml.
