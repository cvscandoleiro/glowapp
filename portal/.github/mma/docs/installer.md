---
title: "M3A Team — Installer Guide"
version: "1.0.0"
last-updated: "2026-04-11"
audience: "developers, DevOps engineers, project leads"
---

# Installer Guide

This document describes how to install M3A Team (Multi-Agent AI Architecture) on a project or user workstation.

---

## Table of Contents

1. [Architecture: Project-Level vs User-Level](#1-architecture-project-level-vs-user-level)
2. [Prerequisites](#2-prerequisites)
3. [Installation — Linux](#3-installation--linux)
4. [Installation — macOS](#4-installation--macos)
5. [Installation — Windows](#5-installation--windows)
6. [What Gets Installed Where](#6-what-gets-installed-where)
7. [Security Considerations](#7-security-considerations)
8. [Running /m3a-doctor](#8-running-m3a-doctor)
9. [Troubleshooting](#9-troubleshooting)
10. [Upgrading](#10-upgrading)
11. [Uninstalling](#11-uninstalling)

---

## 1. Architecture: Project-Level vs User-Level

M3A Team supports two installation modes. Choose based on your workflow:

### Mode A — Project-Level (Recommended for Teams)

```
<project-root>/
├── .m3a-team/          ← M3A Team cloned here (git-ignored)
├── .github/
│   ├── agents/         ← 12 agent files (copied)
│   └── prompts/        ← All skill files (copied)
└── .mma/               ← Created by /m3a-init (NOT by install)
```

**When to use:**
- Team of developers working on the same project
- You want the agent version pinned to the project
- CI/CD requires reproducible agent behavior

**Characteristics:**
- One install per project
- Agent version is tracked in the project repository
- Every developer on the team gets the same environment

### Mode B — User-Level (Single Developer, Multiple Projects)

```
~/.m3a-team/             ← M3A Team installed globally (Linux/macOS)
%USERPROFILE%\.m3a-team\ ← (Windows)
```

**When to use:**
- Solo developers or consultants across many projects
- You want to install once and reuse

**Characteristics:**
- One install, multiple projects
- Agent version is tied to your local install, not the project
- Still requires `/m3a-init` per project

> **Critical Rule:** Installation ≠ Activation.  
> After installing, you must run `/m3a-init` inside your project to activate M3A Team.  
> Until `/m3a-init` completes, no agents are contextual to your project.

---

## 2. Prerequisites

| Requirement | Minimum Version | Notes |
|---|---|-|
| `git` | 2.x | Required for cloning the framework |
| `gh` CLI | 2.x | Required — repo is private, `gh` handles auth |
| `bash` | 4.x | For Linux/macOS install scripts |
| `PowerShell` | 5.1+ | For Windows (PowerShell 7 recommended) |
| GitHub access | — | Must be authenticated: `gh auth login` |
| Network | — | Access to `github.com/ealmeidaf_indra` required |

> **Note:** The repository is private. Direct `curl`/`iwr` without authentication returns 404.
> All install commands below use `gh repo clone` which handles auth automatically.

---

## 3. Installation — Linux

### Project-Level

```bash
# From your project root directory (always installs latest stable release)
tag=$(gh api repos/ealmeidaf_indra/m3a-team/releases/latest --jq '.tag_name') \
  && tmp=$(mktemp -d) \
  && gh repo clone ealmeidaf_indra/m3a-team "$tmp" -- --depth 1 -b "$tag" -q -c advice.detachedHead=false \
  && bash "$tmp/scripts/install.sh" --mode=project \
  && rm -rf "$tmp"

# Install a specific version
tmp=$(mktemp -d) \
  && gh repo clone ealmeidaf_indra/m3a-team "$tmp" -- --depth 1 -b v1.2.0 -q -c advice.detachedHead=false \
  && bash "$tmp/scripts/install.sh" --mode=project \
  && rm -rf "$tmp"
```

### User-Level

```bash
# Installs to ~/.m3a-team/ (always installs latest stable release)
tag=$(gh api repos/ealmeidaf_indra/m3a-team/releases/latest --jq '.tag_name') \
  && tmp=$(mktemp -d) \
  && gh repo clone ealmeidaf_indra/m3a-team "$tmp" -- --depth 1 -b "$tag" -q -c advice.detachedHead=false \
  && bash "$tmp/scripts/install.sh" --mode=user \
  && rm -rf "$tmp"
```

### Post-Install

```bash
# Activate on your project
/m3a-init                    # run this in your IDE/Copilot chat
```

---

## 4. Installation — macOS

The macOS installation is identical to Linux. Prerequisites:

```bash
# Ensure git is available
git --version

# Ensure bash 4.x (macOS ships bash 3.x, upgrade via Homebrew)
brew install bash
```

Then follow the [Linux installation steps](#3-installation--linux).

---

## 5. Installation — Windows

### Project-Level (PowerShell)

```powershell
# From your project root directory (always installs latest stable release)
$tag=$(gh api repos/ealmeidaf_indra/m3a-team/releases/latest --jq '.tag_name')
$tmp = Join-Path $env:TEMP "m3a-$(Get-Random)"
gh repo clone ealmeidaf_indra/m3a-team $tmp -- --depth 1 -b $tag --quiet -c advice.detachedHead=false
if($LASTEXITCODE -eq 0){ & "$tmp\scripts\install.ps1" -Mode project }else{ Write-Host "[ERR] Clone failed. Run 'gh auth login' and retry." -ForegroundColor Red }
if(Test-Path $tmp){ Remove-Item -Recurse -Force $tmp }

# Install specific version
$tmp = Join-Path $env:TEMP "m3a-$(Get-Random)"
gh repo clone ealmeidaf_indra/m3a-team $tmp -- --depth 1 -b v1.2.0 --quiet -c advice.detachedHead=false
if($LASTEXITCODE -eq 0){ & "$tmp\scripts\install.ps1" -Mode project }else{ Write-Host "[ERR] Clone failed. Run 'gh auth login' and retry." -ForegroundColor Red }
if(Test-Path $tmp){ Remove-Item -Recurse -Force $tmp }
```

### User-Level (PowerShell)

```powershell
# Installs to %USERPROFILE%\.m3a-team\ (always installs latest stable release)
$tag=$(gh api repos/ealmeidaf_indra/m3a-team/releases/latest --jq '.tag_name')
$tmp = Join-Path $env:TEMP "m3a-$(Get-Random)"
gh repo clone ealmeidaf_indra/m3a-team $tmp -- --depth 1 -b $tag --quiet -c advice.detachedHead=false
if($LASTEXITCODE -eq 0){ & "$tmp\scripts\install.ps1" -Mode user }else{ Write-Host "[ERR] Clone failed. Run 'gh auth login' and retry." -ForegroundColor Red }
if(Test-Path $tmp){ Remove-Item -Recurse -Force $tmp }
```

### Post-Install (Windows)

```powershell
# Activate on your project
# Run in your IDE Copilot chat:
/m3a-init
```

---

## 6. What Gets Installed Where

### Project-Level Install

| Path | Description |
|---|---|
| `.m3a-team/` | Full M3A Team clone (git-ignored) |
| `.github/agents/` | 12 compiled agent `.md` files |
| `.github/prompts/` | All skill/prompt files |
| `.github/copilot-instructions.md` | Template — filled after `/m3a-init` |

> **NOT created by install:** `.mma/config.yaml` — this requires `/m3a-init`.

### User-Level Install

| Path (Linux/macOS) | Path (Windows) | Description |
|---|---|---|
| `~/.m3a-team/` | `%USERPROFILE%\.m3a-team\` | Full M3A Team install |
| `~/.local/bin/mma` | `%USERPROFILE%\.m3a-team\bin\mma.ps1` | CLI helper in PATH |

---

## 7. Security Considerations

- **Organization-scoped:** M3A Team is restricted to `github.com/Minsait-GA`. The installer verifies your GitHub token is authenticated against the Minsait organization. Anonymous downloads are blocked.
- **Agent files contain no secrets:** Agent `.md` files are prompt templates. They do not contain API keys, passwords, or credentials.
- **`.mma/config.yaml` is local:** The project configuration file stays in your repository. It should be reviewed before committing — ensure no confidential data (client names, IP ranges) is stored in a public repository.
- **No telemetry:** M3A Team does not send any telemetry or usage data.
- **LLM data handling:** Agents run within your IDE's AI assistant. Refer to your organization's AI usage policy for guidance on what project data is sent to AI providers.

---

## 8. Running /m3a-doctor

After installation, run the doctor script to validate your environment:

```bash
./scripts/doctor.sh    # Linux/macOS
```

### Doctor Output Explained

| Symbol | Meaning |
|---|---|
| `✅` | Check passed — this component is correctly installed |
| `⚠️` | Warning — optional component missing or degraded |
| `❌` | Error — required component missing or misconfigured |

### Example Output

```
══════════════════════════════════════════════
  M3A Team — Environment Doctor
  Version: v1.0.0
══════════════════════════════════════════════

✅ .m3a-team/ directory found
✅ All 12 agents accessible
✅ All 25 skill files accessible
✅ core/mma.config.schema.json found
✅ git available (version 2.43.0)
⚠️  .mma/config.yaml not found — run /m3a-init to activate
❌  docs/portal/ not found — optional: run /m3a-create-doc-portal

══════════════════════════════════════════════
  Summary: 5 passed, 1 warning, 1 error (optional)
  Status: READY FOR /m3a-init
══════════════════════════════════════════════
```

- The `⚠️` for `.mma/config.yaml` is expected on a fresh install — resolve by running `/m3a-init`.
- The `❌` for `docs/portal/` is optional and can be created later with `/m3a-create-doc-portal`.

---

## 9. Troubleshooting

### Error: "Permission denied accessing ealmeidaf_indra/m3a-team"

**Cause:** Your GitHub account is not a member of the Minsait organization, or your token lacks `repo` scope.

**Fix:**
1. Verify you are authenticated: `gh auth status`
2. Request organization membership from your Minsait team lead.
3. Re-run the installer.

### Error: "Agent files not found after install"

**Cause:** The install completed but files were not copied to `.github/agents/`.

**Fix:**
```bash
# Re-run copy step manually
cp .m3a-team/agents/*.agent.md .github/agents/
cp .m3a-team/skills/*.prompt.md .github/prompts/
```

### Error: "/m3a-init not recognized as a command"

**Cause:** M3A Team is installed but not activated. The `/m3a-init` command runs inside your IDE's AI assistant (GitHub Copilot, Cursor, etc.), not the terminal.

**Fix:** Open your IDE, open the AI chat panel, and type `/m3a-init`.

### Error: "YAML validation failed in config.yaml"

**Cause:** The `.mma/config.yaml` generated by `/m3a-init` has invalid YAML.

**Fix:**
```bash
# Validate manually
python -c "import yaml; yaml.safe_load(open('.mma/config.yaml'))"
# Fix any reported syntax errors, then re-run /m3a-init or edit manually
```

### Error: "install.sh: bash: version 3.x not supported"

**Cause:** macOS ships with Bash 3.2 (GPL2 restriction). The installer requires Bash 4+.

**Fix:**
```bash
brew install bash
/usr/local/bin/bash scripts/install.sh --mode=project
```

---

## 10. Upgrading

```bash
# Linux/macOS
curl -sSL https://raw.githubusercontent.com/ealmeidaf_indra/m3a-team/main/scripts/install.sh \
  | bash -s -- --upgrade

# Windows
Install-MMA -Upgrade

# Or manually
cd .m3a-team
git fetch origin
git checkout v1.1.0   # specific version
```

After upgrading, re-copy agent files:

```bash
cp .m3a-team/agents/*.agent.md .github/agents/
cp .m3a-team/skills/*.prompt.md .github/prompts/
```

> **Note:** Upgrading does NOT modify `.mma/config.yaml` — your project configuration is preserved.

---

## 11. Uninstalling

### Remove project-level install

```bash
# Remove M3A Team from a project (keeps .mma/ config)
rm -rf .m3a-team/ .github/agents/ .github/prompts/

# Full removal including project config (IRREVERSIBLE)
rm -rf .m3a-team/ .mma/ .github/agents/ .github/prompts/ .github/copilot-instructions.md
```

### Remove user-level install (Linux/macOS)

```bash
rm -rf ~/.m3a-team/
# Remove PATH entry from ~/.bashrc or ~/.zshrc:
# Delete the line: export PATH="$HOME/.m3a-team/bin:$PATH"
```

### Remove user-level install (Windows)

```powershell
Remove-Item -Recurse -Force "$env:USERPROFILE\.m3a-team"
# Remove the mma alias from your PowerShell profile
```
