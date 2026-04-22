import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execSync } from "child_process";
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { tmpdir } from "os";
import { extname, join, dirname } from "path";
import { fileURLToPath } from "url";

// ── Config ────────────────────────────────────────────────────────────────────
const __dirname   = dirname(fileURLToPath(import.meta.url));
const CALENDAR    = process.env.CALENDAR_NAME ?? "Family";
const PYTHON3     = process.env.PYTHON3 ?? join(__dirname, "venv", "bin", "python3");
const LIST_SCRIPT = join(__dirname, "list_events.py");

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return (s ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function asDateBlock(varName: string, dt: Date): string {
  return [
    `set ${varName} to current date`,
    `set year of ${varName} to ${dt.getFullYear()}`,
    `set month of ${varName} to ${dt.getMonth() + 1}`,
    `set day of ${varName} to ${dt.getDate()}`,
    `set hours of ${varName} to ${dt.getHours()}`,
    `set minutes of ${varName} to ${dt.getMinutes()}`,
    `set seconds of ${varName} to ${dt.getSeconds()}`,
  ].join("\n");
}

function parseISO(s: string, defaultHour = 9): Date | null {
  if (!s) return null;
  const full = new Date(s);
  if (!isNaN(full.getTime())) return full;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]), defaultHour, 0, 0);
  }
  return null;
}

function runAppleScript(script: string): string {
  // Write to temp file to avoid shell quoting issues
  const tmp = join(tmpdir(), `apple-cal-mcp-${Date.now()}.scpt`);
  try {
    writeFileSync(tmp, script, "utf8");
    return execSync(`osascript "${tmp}"`, { encoding: "utf8", timeout: 60_000 }).trim();
  } finally {
    try { unlinkSync(tmp); } catch {}
  }
}

// ── Tool implementations ──────────────────────────────────────────────────────

async function addCalendarEvent(params: {
  title: string;
  start_datetime: string;
  end_datetime?: string;
  location?: string;
  description?: string;
  all_day?: boolean;
}): Promise<string> {
  const { title, start_datetime, end_datetime, location, description, all_day } = params;

  const start = parseISO(start_datetime);
  if (!start) return `Error: could not parse start_datetime "${start_datetime}"`;

  let end = end_datetime ? parseISO(end_datetime) : null;
  if (!end) end = new Date(start.getTime() + 60 * 60 * 1000);

  const props: string[] = [
    `summary:"${esc(title)}"`,
    "start date:startDate",
    "end date:endDate",
  ];
  if (all_day)    props.push("allday event:true");
  if (location)   props.push(`location:"${esc(location)}"`);
  if (description) props.push(`description:"${esc(description)}"`);

  const script = `
${asDateBlock("startDate", start)}
${asDateBlock("endDate", end)}
tell application "Calendar"
  tell calendar "${CALENDAR}"
    set newEvent to make new event with properties {${props.join(", ")}}
  end tell
  reload calendars
end tell
return "ok"`;

  try {
    runAppleScript(script);
    const locale = process.env.LOCALE ?? undefined;
    const dateStr = all_day
      ? start.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" })
      : start.toLocaleString(locale, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

    let msg = `Added to ${CALENDAR} calendar: "${title}" on ${dateStr}`;
    if (location) msg += ` @ ${location}`;
    return msg;
  } catch (err: any) {
    return `Error adding event: ${err.message}`;
  }
}

async function listCalendarEvents(params: { days_ahead?: number }): Promise<string> {
  const daysAhead = params.days_ahead ?? 14;
  const now    = new Date();
  const today  = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const future = new Date(today.getTime() + (daysAhead + 1) * 86_400_000);
  const fromTs = Math.floor(today.getTime() / 1000);
  const toTs   = Math.floor(future.getTime() / 1000);

  // Primary: Python/EventKit — properly expands recurring event instances.
  // Requires Calendar TCC access inherited from the MCP client (e.g. Openclaw, Claude Desktop).
  try {
    const raw = execSync(
      `"${PYTHON3}" "${LIST_SCRIPT}" ${fromTs} ${toTs} "${CALENDAR}"`,
      { encoding: "utf8", timeout: 20_000 },
    );
    const events = JSON.parse(raw) as Array<{
      title: string; start: string; end: string;
      location: string; all_day: boolean; recurring: boolean;
    }>;
    if (!("error" in (events as any))) {
      if (!events.length) return `No events in ${CALENDAR} calendar in the next ${daysAhead} days.`;
      const lines = events.map((e) => {
        const when = e.all_day ? e.start.slice(0, 10) : e.start.replace("T", " ").slice(0, 16);
        const loc  = e.location ? ` @ ${e.location}` : "";
        const tag  = e.recurring ? " (recurring)" : "";
        return `- ${e.title}${tag}${loc} — ${when}`;
      });
      return `${CALENDAR} calendar — next ${daysAhead} day(s):\n${lines.join("\n")}`;
    }
    // EventKit returned an error (e.g. Calendar not found) — fall through to AppleScript
  } catch {
    // Python unavailable or timed out — fall through to AppleScript
  }

  // Fallback: AppleScript — always available on macOS but does not expand
  // recurring event instances (only matches master event's original start date).
  const script = `
${asDateBlock("fromDate", today)}
${asDateBlock("toDate", future)}
tell application "Calendar"
  tell calendar "${CALENDAR}"
    set evts to every event whose start date >= fromDate and start date <= toDate
    set output to ""
    repeat with e in evts
      set eStart to start date of e
      set eTitle to summary of e
      set eLoc to location of e
      if eLoc is missing value then
        set eLoc to ""
      else
        set eLoc to do shell script "echo " & quoted form of (eLoc as string) & " | tr '\\n' ' '"
      end if
      set allDay to allday event of e
      set dateStr to ((year of eStart) as string) & "-" & ¬
        text -2 thru -1 of ("0" & ((month of eStart) as integer) as string) & "-" & ¬
        text -2 thru -1 of ("0" & (day of eStart) as string)
      if not allDay then
        set dateStr to dateStr & "T" & ¬
          text -2 thru -1 of ("0" & (hours of eStart) as string) & ":" & ¬
          text -2 thru -1 of ("0" & (minutes of eStart) as string)
      end if
      set output to output & dateStr & "|" & eTitle & "|" & eLoc & linefeed
    end repeat
    return output
  end tell
end tell`;

  try {
    const raw = runAppleScript(script).trim();
    if (!raw) return `No events in ${CALENDAR} calendar in the next ${daysAhead} days.`;
    const lines = raw.split("\n").filter(Boolean).map((line) => {
      const [when, title, loc] = line.split("|");
      return `- ${title}${loc ? ` @ ${loc}` : ""} — ${when}`;
    });
    lines.sort();
    return `${CALENDAR} calendar — next ${daysAhead} day(s) [note: recurring events may be incomplete]:\n${lines.join("\n")}`;
  } catch (err: any) {
    return `Error reading calendar: ${err.message}`;
  }
}

const OLLAMA_URL   = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434/api/chat";
const VISION_MODEL = process.env.VISION_MODEL ?? "gemma4:e4b";
const IMAGE_EXTS   = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".heic"]);

async function readMedia(params: { file_path: string }, signal?: AbortSignal): Promise<string> {
  const { file_path } = params;
  if (!existsSync(file_path)) return `File not found: ${file_path}`;

  const ext = extname(file_path).toLowerCase();

  if (IMAGE_EXTS.has(ext)) {
    try {
      const imageB64 = readFileSync(file_path).toString("base64");
      const res = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: VISION_MODEL,
          messages: [{
            role: "user",
            content: "Extract ALL event, appointment, and schedule information from this image. " +
              "For each event list: name, date, time, location, and any other details. " +
              "Be thorough — include every date and item you can see.",
            images: [imageB64],
          }],
          stream: false,
        }),
        signal: signal ?? AbortSignal.timeout(90_000),
      });
      const data = (await res.json()) as any;
      return data?.message?.content?.trim() || "No content extracted from image.";
    } catch (err: any) {
      return `Image read error: ${err.message}`;
    }
  }

  if (ext === ".pdf") {
    try {
      const text = execSync(`pdftotext "${file_path}" - 2>/dev/null`, { encoding: "utf8", timeout: 15_000 });
      if (text.trim()) return text.slice(0, 5000);
    } catch {}
    try {
      const text = execSync(
        `"${PYTHON3}" -c "from pdfminer.high_level import extract_text; print(extract_text('${file_path}'))"`,
        { encoding: "utf8", timeout: 20_000 },
      );
      if (text.trim()) return text.slice(0, 5000);
    } catch {}
    try {
      const raw = execSync(`mdls -name kMDItemTextContent "${file_path}" 2>/dev/null`, { encoding: "utf8", timeout: 10_000 });
      const text = raw.replace(/^kMDItemTextContent\s*=\s*"/, "").replace(/"$/, "").trim();
      if (text && text !== "(null)") return text.slice(0, 5000);
    } catch {}
    return "Could not extract text from PDF — please describe the events manually.";
  }

  try {
    return readFileSync(file_path, "utf8").slice(0, 5000);
  } catch (err: any) {
    return `Could not read file: ${err.message}`;
  }
}

// ── MCP Server ────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: "apple-calendar",
  version: "1.0.0",
});

server.tool(
  "apple_calendar_add_event",
  `Add an event to the ${CALENDAR} Apple Calendar. ` +
  "Synthesize the best title from the user's message — extract who, what, and where into a concise title rather than copying the user's words verbatim. " +
  "Set the exact time if one is mentioned; use all_day=true only when no specific time is given. " +
  "Always populate the description with the full original content — every detail from the message and any extracted media.",
  {
    title:          z.string().describe("Short, clear event title synthesized from the user's message and any extracted file content. Prefer specific over generic — e.g. 'Kayden Dentist - Dr Tan' over 'Dentist Appointment', 'Mia School Sports Day' over 'School Event'."),
    start_datetime: z.string().describe("Start in ISO 8601: YYYY-MM-DDTHH:MM:SS, or YYYY-MM-DD for all-day"),
    end_datetime:   z.string().optional().describe("End in ISO 8601. Omit to default to 1 hour after start."),
    location:       z.string().optional().describe("Venue or address"),
    description:    z.string().optional().describe("Full details, notes, attendees"),
    all_day:        z.boolean().optional().describe("True if no specific time is mentioned"),
  },
  async (params) => ({
    content: [{ type: "text" as const, text: await addCalendarEvent(params) }],
  }),
);

server.tool(
  "apple_calendar_list_events",
  `List upcoming events in the ${CALENDAR} Apple Calendar.`,
  {
    days_ahead: z.number().int().optional().describe("How many days ahead to check (default 14)"),
  },
  async (params) => ({
    content: [{ type: "text" as const, text: await listCalendarEvents(params) }],
  }),
);

server.tool(
  "apple_calendar_read_media",
  "Read an image or document and extract event/schedule content. " +
  "Call this FIRST whenever a file path is provided, before calling add_event. " +
  "After getting the extracted content, combine it with what the user said to form the best possible event title, date, location, and description — " +
  "do not just copy raw text, synthesize it.",
  {
    file_path: z.string().describe("Absolute path to the image or document file"),
  },
  async (params) => ({
    content: [{ type: "text" as const, text: await readMedia(params) }],
  }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
