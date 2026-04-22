#!/usr/bin/env tsx
/**
 * setup.ts — one-time setup for apple-calendar-mcp
 *
 * Creates a local Python venv and installs the required pyobjc packages.
 * Run once after `npm install`:
 *
 *   npm run setup
 *
 * After setup, grant Calendar access to the venv Python binary:
 *   System Settings → Privacy & Security → Calendars → add:
 *   <this directory>/venv/bin/python3
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const VENV_DIR  = join(__dirname, "venv");
const VENV_PY   = join(VENV_DIR, "bin", "python3");
const PACKAGES  = ["pyobjc-framework-EventKit"];

function run(cmd: string) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

// 1. Create venv if missing
if (!existsSync(VENV_DIR)) {
  console.log("Creating Python venv...");
  run(`python3 -m venv "${VENV_DIR}"`);
} else {
  console.log("Venv already exists, skipping creation.");
}

// 2. Install / upgrade packages
console.log("\nInstalling pyobjc packages...");
run(`"${VENV_PY}" -m pip install --upgrade pip --quiet`);
run(`"${VENV_PY}" -m pip install ${PACKAGES.join(" ")} --quiet`);

// 3. Verify
console.log("\nVerifying EventKit import...");
try {
  execSync(`"${VENV_PY}" -c "from EventKit import EKEventStore; print('OK')"`, {
    encoding: "utf8",
  });
  console.log("EventKit import: OK");
} catch {
  console.error("EventKit import failed — pyobjc may not support this macOS version.");
  process.exit(1);
}

console.log(`
Setup complete.

Next step — grant Calendar access to the venv Python:
  System Settings → Privacy & Security → Calendars → click +
  Add: ${VENV_PY}
`);
