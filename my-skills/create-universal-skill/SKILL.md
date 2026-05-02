---
name: create-universal-skill
description: Scaffold a new universal skill package — SKILL.md, README.md with per-agent install prompts, scripts/, and reference/. Use when the user says "create a skill", "new skill", "build a skill called X", or "create universal skill".
tools: Read, Write, Bash
model: sonnet
---

# create-universal-skill

Scaffold a new universal skill package that works across Claude Code, OpenClaw, and Codex.

## Step 1 — Gather parameters

If any are missing, ask before proceeding:

| Parameter | Example | Notes |
|-----------|---------|-------|
| `SKILL_NAME` | `init-wiki` | Lowercase, hyphenated — becomes the directory name and slash command |
| `DESCRIPTION` | `Initialize a Karpathy-pattern wiki` | One-line description for the frontmatter and README |
| `TRIGGERS` | `"init wiki", "create a new wiki"` | Natural language phrases that should invoke this skill |
| `TOOLS` | `Read, Write, Bash` | Comma-separated list of tools the skill needs |
| `PATH` | `~/my-workspace/my-skills` | Where to create the package (expand `~` to actual home dir) |

## Step 2 — Create directory structure

```bash
mkdir -p <PATH>/<SKILL_NAME>/scripts
mkdir -p <PATH>/<SKILL_NAME>/reference
```

## Step 3 — Write SKILL.md

Write `<PATH>/<SKILL_NAME>/SKILL.md`:

```
---
name: <SKILL_NAME>
description: <DESCRIPTION>. Use when the user says <TRIGGERS>.
tools: <TOOLS>
model: sonnet
---

# <SKILL_NAME>

<DESCRIPTION>

## Step 1 — Gather parameters

If any are missing, ask before proceeding:

| Parameter | Example | Notes |
|-----------|---------|-------|
| ... | ... | ... |

## Step 2 — [Main action]

[Describe the steps the skill performs]

## Step 3 — Confirm and report

After completing, report what was done.
```

## Step 4 — Write README.md

Write `<PATH>/<SKILL_NAME>/README.md`:

```
# <SKILL_NAME>

<DESCRIPTION>

---

## Install

### Claude Code

[prompt]
Read the file SKILL.md in this directory. Create the directory ~/.claude/skills/<SKILL_NAME>/ and copy SKILL.md into it.
[/prompt]

### OpenClaw

[prompt]
Read the file SKILL.md in this directory. Create the directory ~/.openclaw/skills/<SKILL_NAME>/ and copy SKILL.md into it.
[/prompt]

### Codex

[prompt]
Read the file SKILL.md in this directory and append its content to ~/.codex/instructions.md, creating the file if it doesn't exist.
[/prompt]

---

## Usage

Once installed, trigger with:

/<SKILL_NAME>

[Describe what the skill asks for and what it produces]
```

Replace `[prompt]...[/prompt]` blocks with fenced code blocks (triple backticks) in the actual file.

## Step 5 — Confirm and report

After creating all files, report:

```
Skill package created at <PATH>/<SKILL_NAME>/

  SKILL.md        ← skill definition (fill in your steps)
  README.md       ← install prompts for Claude Code / OpenClaw / Codex
  scripts/        ← add helper scripts here
  reference/      ← add reference markdown here

To install in Claude Code:
  Read the file SKILL.md in this directory. Create the directory ~/.claude/skills/<SKILL_NAME>/ and copy SKILL.md into it.

Then test with: /<SKILL_NAME>
```
