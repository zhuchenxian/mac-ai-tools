# create-universal-skill

Scaffolds a new universal skill package — SKILL.md, README.md with per-agent install prompts, scripts/, and reference/.

---

## Install

### Claude Code

```
Read the file SKILL.md in this directory. Create the directory ~/.claude/skills/create-universal-skill/ and copy SKILL.md into it.
```

### OpenClaw

```
Read the file SKILL.md in this directory. Create the directory ~/.openclaw/skills/create-universal-skill/ and copy SKILL.md into it.
```

### Codex

```
Read the file SKILL.md in this directory and append its content to ~/.codex/instructions.md, creating the file if it doesn't exist.
```

---

## Usage

Once installed, trigger with:

```
/create-universal-skill
```

The skill asks for the skill name, description, trigger phrases, tools, and output path, then generates the full package structure.
