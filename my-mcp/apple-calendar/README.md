# apple-calendar-mcp

An MCP server for Apple Calendar on macOS. Add events, list upcoming events (including recurring), and extract schedule information from images and documents.

## Limitations

- **macOS only** — requires AppleScript and EventKit
- **Recurring events** require the MCP client app to have Calendar access (System Settings → Privacy & Security → Calendars). Falls back to non-recurring results otherwise
- **Image extraction** requires Ollama running locally with a vision model. No cloud fallback
- **Locale** defaults to system locale in confirmation messages; override with `LOCALE` env var
- **Read/write only** — no delete or update event support
- **Single calendar** — reads and writes to one calendar at a time (set via `CALENDAR_NAME`)

## Agent usage

Follow these rules when using these tools:

**Adding events**
- Call `apple_calendar_read_media` first if the user provides a file or image path, then use the extracted content together with the user's message to form the event details
- Synthesize a concise, specific title from who/what/where — e.g. `Kayden Dentist - Dr Tan` not `Dentist Appointment`
- Use the exact time from the message; only use `all_day=true` when no time is mentioned
- Put the full original content (all details, notes, attendees) in the `description` field — do not omit anything

**Listing events**
- Use `days_ahead=0` for today's events, `days_ahead=7` for the week ahead
- Recurring events are shown with `(recurring)` tag when EventKit is available

**Reading media**
- Always call this before `add_event` when a file path is present
- After extraction, synthesize — do not copy raw text verbatim into event fields

## Tools

| Tool | When to use |
|---|---|
| `apple_calendar_add_event` | User mentions an event, appointment, or schedule item |
| `apple_calendar_list_events` | User asks what's on the calendar or wants to check existing events |
| `apple_calendar_read_media` | A file or image path is provided — call this first, then add_event |

## Requirements

- macOS (AppleScript and EventKit)
- Node.js 18+
- Python 3.9+ with `pyobjc-framework-EventKit` (for recurring event support)
- Ollama with a vision model — **only needed for image files** (optional)

## Setup

```bash
npm install
npm run setup   # creates local venv and installs pyobjc
```

## Configuration

### Claude Desktop

```json
{
  "mcpServers": {
    "apple-calendar": {
      "command": "npx",
      "args": ["tsx", "/path/to/apple-calendar-mcp/index.ts"],
      "env": { "CALENDAR_NAME": "Family" }
    }
  }
}
```

### Openclaw

```bash
openclaw mcp set apple-calendar '{"command":"npx","args":["tsx","/path/to/apple-calendar-mcp/index.ts"],"env":{"CALENDAR_NAME":"Family"}}'
```

### Claude Code

```json
{
  "mcpServers": {
    "apple-calendar": {
      "command": "npx",
      "args": ["tsx", "/path/to/apple-calendar-mcp/index.ts"],
      "env": { "CALENDAR_NAME": "Family" }
    }
  }
}
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `CALENDAR_NAME` | `Family` | Apple Calendar name to read/write |
| `PYTHON3` | `venv/bin/python3` | Python binary for EventKit |
| `OLLAMA_URL` | `http://127.0.0.1:11434/api/chat` | Ollama endpoint (images only) |
| `VISION_MODEL` | `gemma4:e4b` | Ollama vision model (images only) |
| `LOCALE` | system default | Locale for date formatting in confirmations (e.g. `en-SG`, `en-US`) |

## How it works

### `apple_calendar_add_event`
AppleScript — works with any macOS MCP client, no extra dependencies.

### `apple_calendar_list_events`
Tries Python/EventKit first, which correctly expands recurring event instances. Requires the MCP client app (e.g. Openclaw, Claude Desktop) to have Calendar access in **System Settings → Privacy & Security → Calendars**. Falls back to AppleScript automatically — non-recurring events still work, but recurring instances may be missing.

### `apple_calendar_read_media`

| File type | Method | Requires |
|---|---|---|
| Images (jpg, png, webp, heic…) | Ollama vision model | Ollama running locally |
| PDF | `pdftotext` → `pdfminer` → Spotlight | Nothing extra (best-effort) |
| Plain text | Direct read | Nothing |

If Ollama is not running, image extraction returns an error but other tools are unaffected.
