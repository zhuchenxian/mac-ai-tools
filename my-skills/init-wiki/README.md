# init-wiki skill

Initializes a Karpathy-pattern wiki from scratch — folder structure, meta files, and section stubs, all parameterised to your topic and audience.

---

## What gets created

```
<path>/
├── raw/                                  read-only source stubs (drop files here manually)
├── wiki/
│   ├── INDEX.md                          navigable catalog — Claude updates on every ingest
│   ├── LOG.md                            append-only activity log
│   ├── 00-wiki-system/
│   │   └── wiki-system-index.md          seeded with pattern overview + workflows
│   └── <NN>-<slug>/
│       └── <topic>-index.md             stub — one per section
├── templates/                            empty — optional page scaffolds
├── README.md
├── SCHEMA.md                             full operating manual Claude reads first
└── AGENTS.md                            CLAUDE.md — agent behaviour rules
```

**Key conventions baked in:**
- Section index files are named `{topic}-index.md` (not `index.md`) so each file is identifiable by name in Obsidian graph view
- Subsection files use lowercase kebab-case descriptive names (e.g. `rerankers.md`, `apple-calendar-mcp.md`)
- Every page opens with a Page Format header: Summary, Tags, Sources, Updated
- raw/ is strictly read-only — Claude never modifies it

---

## SCHEMA.md includes

- Ingestion workflow (web articles, PDFs, local files, logs)
- **Link-following rule** — off by default; enable per-source with `follow-links: true` in raw/ stub frontmatter
- **Section File Structure rule** — when to split a section into subsection files vs keep in the index
- Query response format (Answer / Detail with citations / Sources / GAP flag)
- Health check / lint workflow
- Page Format standard
- Cross-referencing rules

---

## Install

### Claude Code

```
Read the file SKILL.md in this directory. Create the directory ~/.claude/skills/init-wiki/ and copy SKILL.md into it.
```

### OpenClaw / clawd

```
Read the file SKILL.md in this directory. Create the directory ~/.openclaw/skills/init-wiki/ and copy SKILL.md into it.
```

### Codex

```
Read the file SKILL.md in this directory and append its content to ~/.codex/instructions.md, creating the file if it doesn't exist.
```

---

## Usage

Once installed, trigger with:

```
/init-wiki
```

The skill will ask for:
- **Wiki name** — display name (e.g. `LLM Wiki`)
- **Topic** — one-line description (e.g. `AI Agent Engineering`)
- **Audience** — sets the style register (e.g. `senior AI agent engineer`)
- **Path** — filesystem path (e.g. `~/my-wiki/llm-wiki`)
- **Sections** — optional numbered list; defaults to a generic 6-section structure

---

## Ingest workflow (after init)

```bash
# Drop a clipped web article into raw/, then:
claude 'I just added a new source to the raw folder. Please read it and update the wiki.'

# Or pass a URL directly:
claude 'Ingest https://... into <wiki-slug>'

# Enable link-following for a source by adding to its raw/ stub:
# ---
# source-url: https://example.com
# follow-links: true
# ---

# Query
claude 'Query <wiki-slug>: <question>'

# Monthly health check
claude 'Health check <wiki-slug>'
```

---

## Reference: the Karpathy pattern

> Obsidian is the IDE. The LLM is the programmer. The wiki is the codebase.

Knowledge is synthesised at **ingestion time**, not re-discovered on every query. Each new source is merged into existing pages, cross-referenced, and never duplicated. The wiki compounds over time — queries are fast because the work is already done.
