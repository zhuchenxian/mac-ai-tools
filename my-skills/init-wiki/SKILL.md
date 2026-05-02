---
name: init-wiki
description: Initialize a new Karpathy-pattern wiki from scratch. Creates the full folder structure (raw/, wiki/, templates/), all meta files (README.md, SCHEMA.md, AGENTS.md, wiki/INDEX.md, wiki/LOG.md), and numbered section stubs — all parameterised to the wiki's topic and purpose. Use when the user says "init wiki", "create a new wiki", "set up a wiki for <topic>", or "initialise wiki at <path>".
tools: Read, Write, Bash
model: sonnet
---

# init-wiki

Initialize a new Karpathy-pattern wiki. The Karpathy pattern: Obsidian = IDE, LLM = programmer, wiki = codebase. Knowledge is synthesised at ingestion time and compounds — never re-discovered on every query.

## Step 1 — Gather parameters

If any of the following are missing from the user's request, ask for them before proceeding:

| Parameter | Example | Notes |
|-----------|---------|-------|
| `WIKI_NAME` | `LLM Wiki` | Display name used in headings |
| `TOPIC` | `AI Agent Engineering` | One-line description of what this wiki covers |
| `AUDIENCE` | `senior AI agent engineer` | Who the wiki is written for — sets style register |
| `PATH` | `~/my-wiki/llm-wiki` | Filesystem path — expand `~` to the actual home dir |
| `SECTIONS` | (optional) | Numbered section list; use the defaults below if not provided |

**Default sections** (use these if the user doesn't specify):

```
00 — Wiki System      | How this wiki works — meta
01 — Overview         | Core concepts and mental models
02 — Key Concepts     | Terminology, definitions, building blocks
03 — How-To           | Step-by-step patterns and recipes
04 — Reference        | Tables, specs, quick lookups
05 — Case Studies     | Real examples and post-mortems
```

## Step 2 — Create directory structure

```bash
mkdir -p <PATH>/raw
mkdir -p <PATH>/wiki
mkdir -p <PATH>/templates
```

Then create one folder per section in `wiki/`:

```bash
mkdir -p <PATH>/wiki/<NN>-<slug>/
```

**File naming rule**: section index files are named `{topic}-index.md`, NOT `index.md`. This makes each file identifiable by name in Obsidian graph view.

- Strip the `NN-` number prefix from the folder name
- Append `-index.md`
- Examples: `wiki/00-wiki-system/` → `wiki-system-index.md`, `wiki/03-agent-architecture/` → `agent-architecture-index.md`

## Step 3 — Write the files

Write each file below, substituting `WIKI_NAME`, `TOPIC`, `AUDIENCE`, `PATH`, `WIKI_SLUG` (lowercase kebab-case of WIKI_NAME), and the section list throughout.

---

### README.md (root)

```markdown
# <WIKI_NAME>

Personal knowledge base for <TOPIC>.
A **persistent, compounding artifact** — maintained by Claude using the Karpathy wiki pattern.

Built <YYYY-MM-DD>

---

## How it works

Knowledge is synthesised at **ingestion time**, not re-discovered on every query.

Karpathy's framing: **Obsidian is the IDE, the LLM is the programmer, the wiki is the codebase.**

```
raw/  →  wiki/  ←  SCHEMA.md (operating rules)
             ↕
       wiki/INDEX.md + wiki/LOG.md
```

See [wiki/00-wiki-system/wiki-system-index.md](wiki/00-wiki-system/wiki-system-index.md) for workflows.
See [SCHEMA.md](SCHEMA.md) for the full operating manual.
See [wiki/INDEX.md](wiki/INDEX.md) for the full page catalog.

---

## Quick commands

```bash
# Ingest a web article
claude 'Ingest https://... into <WIKI_SLUG>'

# Ingest a local file (drop into raw/ first)
claude 'I just added a new source to the raw folder. Please read it and update the wiki.'

# Query
claude 'Query <WIKI_SLUG>: <question>'

# Lint / health check
claude 'Health check <WIKI_SLUG>'
```

---

## Structure

| Section | Topic | Status |
|---------|-------|--------|
<one row per section — link to {topic}-index.md file, NOT folder:
| [NN — Title](wiki/NN-slug/topic-index.md) | Topic description | stub |>
```

---

### SCHEMA.md (root)

```markdown
# Wiki Schema — <WIKI_NAME> Operating Manual

This document defines the structure, ingestion rules, and maintenance workflows for this wiki.
Claude reads this file first on every wiki-related task to understand how to behave.

---

## Purpose

This wiki is a **persistent, compounding knowledge artifact** for **<TOPIC>**, maintained by Claude.
Rather than re-discovering knowledge on every query, Claude synthesises new material into
existing pages at ingestion time. Knowledge accumulates and cross-references itself over time.

Karpathy's framing: **Obsidian is the IDE, the LLM is the programmer, the wiki is the codebase.**
You rarely write the wiki yourself — Claude does the writing and organising.

---

## Architecture

```
raw/  ──►  wiki/  ◄──  SCHEMA.md (this file)
               │
   NN-section/{topic}-index.md     (navigation only — topic table + links)
   NN-section/<topic-slug>.md      (one file per concept — all content lives here)
               │
          INDEX.md + LOG.md
```

| Layer | Path | Role |
|-------|------|------|
| Raw sources | `<PATH>/raw/` | **Read-only** — immutable inputs, never edited by Claude |
| Wiki | `<PATH>/wiki/` | Living markdown, maintained by Claude |
| Schema | `<PATH>/SCHEMA.md` | Operating rules (this file) |
| Index | `<PATH>/wiki/INDEX.md` | Navigable catalog, updated on every ingest |
| Log | `<PATH>/wiki/LOG.md` | Append-only activity record |
| Templates | `<PATH>/templates/` | Page scaffolds for new sections |

**raw/ source content is read-only.** Claude never rewrites or edits the content of source files in `raw/`. New source files are added manually.

**Exception — stub `## Ingested into` section:** Claude-created stub files may have their `## Ingested into` section added or updated after each ingest. This is the only permitted write to `raw/`.

---

## Page Types

Two distinct page roles exist within every section folder:

| Type | File | Purpose |
|------|------|---------|
| Navigation page | `NN-section/{topic}-index.md` | Topic table + quick links only — **no content prose** |
| Topic page | `NN-section/<topic-slug>.md` | Full content for exactly one concept |

`{topic}-index.md` must never contain substantive content — it is a table of contents that links to topic files. All knowledge lives in topic files.

---

## Ingestion Sources

### 1. Web articles & blog posts
- Provide the URL; Claude fetches, synthesises, and merges into the relevant section
- **Obsidian Web Clipper** (Chrome extension): converts any web article to a markdown file — drag the `.md` into `raw/` then trigger ingest

### 2. PDFs and local files
- Drop PDFs, plain text, or markdown files directly into `raw/`
- Claude Code reads PDFs natively — no conversion needed
- Trigger: `claude 'I just added a new source to the raw folder. Please read it and update the wiki.'`

### 3. Other sources
- Add domain-specific source types here as the wiki grows

---

## Operations

### Ingest
**Triggers**:
- `claude 'Ingest <source> into <WIKI_SLUG>'`
- `claude 'I just added a new source to the raw folder. Please read it and update the wiki.'`

1. Read SCHEMA.md to identify the relevant section(s)
2. Read the target section's `{topic}-index.md` to see what topic files already exist
3. Synthesise new material — do not paste verbatim; compress, cross-reference, opine
4. For each distinct concept in the source, **create or update a dedicated topic file** (`NN-section/<topic-slug>.md`) — never append content to `{topic}-index.md`
5. Update the section's `{topic}-index.md` topic table to link to any new or updated topic files
6. Save a stub in `raw/` if the source doesn't already have one
7. Update `wiki/INDEX.md` if new topic files were added
8. Update the source's `raw/` stub: add or update the `## Ingested into` section with links to every wiki file touched, one bullet per file with a short description of what was extracted
9. Append an entry to `wiki/LOG.md`: `[YYYY-MM-DD] INGEST: <source> → <sections touched>`

### Link-following during ingest

**Default: do not follow links.** When ingesting a web page or markdown file clipped from a web page, only process the page itself.

**To enable for a specific source**, add `follow-links: true` to the raw/ stub's YAML frontmatter:

```markdown
---
source-url: https://example.com/article
follow-links: true
---
```

Rules when `follow-links: true`:
- Follow links **one level deep only** (no recursive crawling)
- Only follow links on the **same domain**
- Skip navigation, footer, and sidebar links — prefer body prose links
- Synthesise linked pages into the same wiki section as the parent

### Query
**Trigger**: `claude 'Query <WIKI_SLUG>: <question>'`

1. Read `wiki/INDEX.md` to locate relevant sections
2. Read those section files
3. Respond using this format:

```
**Answer:** Direct answer in 1–3 sentences.

**Detail:**
<bullet points or short prose, each claim with an inline citation>
[source: NN-section/{topic}-index.md]

**Sources:** [NN-section/{topic}-index.md], [raw/source-stub.md]

[GAP: no coverage of X — suggest ingesting Y]
```

- `[GAP: ...]` only included when knowledge is missing or stale
- Multiple sources listed on the Sources line, comma-separated

### Health check / Lint
**Triggers**: `claude 'Health check <WIKI_SLUG>'` or `claude 'Lint the wiki'`

1. Scan all `wiki/*/{topic}-index.md` navigation pages and all `wiki/*/<topic-slug>.md` topic files
2. Flag: contradictions, stale claims, empty stubs, missing cross-links, orphan topic files not linked from their section index, `{topic}-index.md` pages that contain content prose (violation of navigation-only rule), unlinked concepts
3. Output a prioritised findings report
4. Append: `[YYYY-MM-DD] HEALTH: <summary of findings>`

---

## Section File Structure

Each section folder (`wiki/NN-name/`) contains a `{topic}-index.md` navigation file plus one file per concept. The `-index` suffix makes the navigation file identifiable by name in Obsidian graph view.

**Naming rule**: strip the `NN-` number prefix from the folder name, append `-index.md`.
Example: folder `03-agent-architecture` → `agent-architecture-index.md`.

Every distinct concept gets its own topic file — always:

```
wiki/05-case-studies/
├── case-studies-index.md     ← navigation only: topic table + links, no prose
├── project-alpha.md          ← full content for this concept
└── project-beta.md           ← full content for this concept
```

Rules:
- `{topic}-index.md` is a **navigation page only**: topic table linking to all concept files, quick links, no substantive prose
- Topic file names: lowercase, hyphenated, concept-descriptive (e.g. `generators.md`, `fix-session-layer.md`)
- Apply the Page Format header block to every topic file
- **Never** put content prose into `{topic}-index.md` — if you find yourself writing explanation there, it belongs in a topic file instead

---

## Cross-referencing Rules

- When a concept appears in multiple sections, link to the canonical topic file; don't duplicate prose
- Use relative markdown links within `wiki/`: `[concept](../NN-section/topic-slug.md)`
- Link to the specific topic file, not to `{topic}-index.md`, unless pointing at the section overview
- Cross-links between section indexes use: `[Section Name](../NN-section/{topic}-index.md)`

---

## Page Format

Two header formats — one per page type.

**Navigation pages** (`{topic}-index.md`) use a reduced header:

```markdown
# NN — Section Title

**Summary:** One paragraph overview of what this section covers.  
**Updated:** YYYY-MM-DD

---

## Topics

| Topic | File | Key concepts |
|-------|------|-------------|
| Topic Name | [topic-slug.md](topic-slug.md) | concept-a, concept-b |

## Quick links

- [Back to Index](../INDEX.md)
- [NN+1 — Next Section](../NN+1-next-section/{slug}-index.md)
```

**Topic pages** (`<topic-slug>.md`) use the full header:

```markdown
# Topic Title

**Summary:** One-paragraph overview of what this topic covers and why it matters.  
**Tags:** `tag-one` `tag-two`  
**Sources:** [source-name](../../raw/source-file.md), [other-source](../../raw/other.md)  
**Updated:** YYYY-MM-DD

---

<content>

## Further reading

- Links to related topic files in other sections
```

Rules:
- **Summary** — one paragraph, no filler. Written at ingestion time, updated when the page changes substantially.
- **Tags** — lowercase, hyphenated, no `#`. Describe the concept domain, not the section number. Navigation pages omit Tags.
- **Sources** — link to the raw/ stub(s) the page was built from. Navigation pages omit Sources.
- **Updated** — date of last meaningful content change.

---

## Style Rules

- Write for **<AUDIENCE>** — no filler, no "this section covers..." intros
- Each page must start with the Page Format header block above
- Prefer tables and bullet points over long prose
- Every claim should reference its source wiki page or raw stub
- Where behaviour differs across implementations, use a side-by-side comparison table

---

## Limitations

- **Scale**: optimal at ~100 articles. Tens of thousands of pages need dedicated vector infrastructure (RAG).
- **Garbage in, garbage out**: curation is the human's job.
- **AI errors**: use the lint operation periodically — especially early in the wiki's life.
- **Schema evolution**: update SCHEMA.md as the wiki grows and new patterns emerge.

---

## Section Registry

| # | Folder | Canonical topics |
|---|--------|-----------------|
<one row per section: | NN | `wiki/NN-slug/` | Topic description |>
```

---

### AGENTS.md (root)

```markdown
# CLAUDE.md — <WIKI_NAME>

This is a personal knowledge base for <TOPIC>, maintained using the Karpathy persistent wiki pattern.

## First: always read SCHEMA.md

Before any wiki task, read `SCHEMA.md`. It defines the architecture, ingestion sources, workflows,
file naming conventions, cross-referencing rules, and style guide. Do not skip this.

## What this wiki is

A living markdown knowledge base. Knowledge is synthesised at ingestion time and compounds over time —
merge new material into existing pages or create subsection files rather than appending or duplicating.

## Primary triggers and what to do

| User says | Action |
|-----------|--------|
| `Ingest <source> into <WIKI_SLUG>` | Read SCHEMA.md → save stub to `raw/` → identify section(s) → merge content into `wiki/` → update wiki/INDEX.md → append to wiki/LOG.md |
| `I just added a new source to the raw folder...` | Read new file(s) in `raw/` → same as Ingest |
| `Query <WIKI_SLUG>: <question>` | Read wiki/INDEX.md → read relevant sections → answer with citations → flag gaps |
| `Health check <WIKI_SLUG>` / `Lint the wiki` | Scan all wiki/*/{topic}-index.md and subsection files → report issues → append to wiki/LOG.md |

## Key files

| File/Folder | Role |
|-------------|------|
| `SCHEMA.md` | Full operating manual — read first |
| `wiki/INDEX.md` | Catalog — update on every ingest |
| `wiki/LOG.md` | Append-only log — always append, never edit |
| `wiki/` | All numbered topic sections live here |
| `raw/` | Immutable raw source stubs — never edit, only add |
| `templates/` | Page scaffolds for new sections |

## File naming

Section index files are named `{topic}-index.md` (e.g. `wiki-system-index.md`, `case-studies-index.md`),
not `index.md`. This makes each file identifiable by name in Obsidian graph view.

Subsection files use lowercase kebab-case descriptive names (e.g. `apple-calendar-mcp.md`, `rerankers.md`).

## Style

- Lead every page with the Page Format header (Summary, Tags, Sources, Updated)
- Prefer tables and bullets over prose
- Cross-link to canonical pages; do not duplicate content across sections
- Write for <AUDIENCE> — no filler, assume domain competence
```

---

### wiki/INDEX.md

```markdown
# Index — <WIKI_NAME>

Navigable catalog of all wiki pages. Updated by Claude on every ingest.
Last updated: <YYYY-MM-DD>

---

## Meta

- [How this wiki works](00-wiki-system/wiki-system-index.md)
- [Schema / operating manual](../SCHEMA.md)
- [Activity log](LOG.md)

---

<sections grouped by theme — one bullet per section index, indented bullets for subsection files>

Example format:
- [Section Name](NN-slug/topic-index.md) — brief description
  - [Subtopic](NN-slug/subtopic.md) — what it covers

---

## Raw Sources

_(none yet — populated as sources are ingested)_
```

---

### wiki/LOG.md

```markdown
# Activity Log — <WIKI_NAME>

Append-only. Each entry: `[YYYY-MM-DD] TYPE: description`
Types: INGEST | QUERY | HEALTH | RESTRUCTURE

---

[<YYYY-MM-DD>] RESTRUCTURE: Initial scaffold — Karpathy wiki pattern. Created raw/, wiki/, templates/, SCHEMA.md, AGENTS.md, README.md, wiki/INDEX.md, wiki/LOG.md. Sections: <comma-separated section names>.
```

---

### wiki/00-wiki-system/wiki-system-index.md

```markdown
# 00 — Wiki System

**Summary:** How this wiki is structured and maintained — the Karpathy persistent wiki pattern, folder layout, ingestion workflow, and operational commands. Knowledge is synthesised at ingestion time by Claude; you curate what goes in and what questions to ask.  
**Tags:** `wiki-system` `karpathy-pattern` `meta`  
**Sources:** _(none yet)_  
**Updated:** <YYYY-MM-DD>

---

## The pattern (Karpathy, 2025)

Rather than re-querying raw sources on every question, an LLM maintains a **persistent wiki**
that synthesises knowledge at ingestion time. Knowledge compounds: each new source is merged
into existing pages, cross-referenced, and never duplicated.

```
raw/  →  wiki/  ←  SCHEMA.md
             ↕
       INDEX.md + LOG.md
```

The LLM handles tedious synthesis; you handle curation — choosing what to ingest and when.

---

## Workflows

```bash
# Ingest
claude 'Ingest <source> into <WIKI_SLUG>'
claude 'I just added a new source to the raw folder. Please read it and update the wiki.'

# Query
claude 'Query <WIKI_SLUG>: <question>'

# Lint
claude 'Health check <WIKI_SLUG>'
```

---

## Files

| File | Role |
|------|------|
| [SCHEMA.md](../../SCHEMA.md) | Full operating rules — Claude reads this first |
| [INDEX.md](../INDEX.md) | Navigable catalog of all pages |
| [LOG.md](../LOG.md) | Append-only activity history |
```

---

### wiki/<NN>-<slug>/<topic>-index.md (stub — all sections except 00)

```markdown
# <NN> — <Section Title>

**Summary:** _To be populated — ingest a source to fill this section._  
**Updated:** <YYYY-MM-DD>

---

## Topics

_(none yet — topic files created here on first ingest)_

## Quick links

- [Back to Index](../INDEX.md)
```

---

## Step 4 — Confirm and report

After creating all files, report:

```
Wiki initialised at <PATH>

Structure:
  raw/                                   (empty — drop sources here)
  templates/                             (empty — optional page scaffolds)
  wiki/
    INDEX.md
    LOG.md
    00-wiki-system/
      wiki-system-index.md               (seeded with pattern overview + workflows)
    <NN>-<slug>/
      <topic>-index.md                   (stub — one per section)
  README.md
  SCHEMA.md
  AGENTS.md

File naming convention:
  Section indexes: {topic}-index.md  (NOT index.md — enables Obsidian graph view legibility)
  Subsection files: lowercase-kebab-descriptive.md

Next steps:
  1. Open the folder as an Obsidian vault
  2. Drop your first source into raw/
  3. Run: claude 'I just added a new source to the raw folder. Please read it and update the wiki.'
  4. After a few ingests, run: claude 'Health check <WIKI_SLUG>'
```
