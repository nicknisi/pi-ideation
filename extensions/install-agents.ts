/**
 * Agent Installer Extension
 *
 * Copies bundled agent definitions (scout, reviewer) to the user's
 * ~/.pi/agent/agents/ directory where pi-subagents discovers them.
 * Only installs if the files don't already exist or are older than
 * the bundled versions.
 *
 * Checks for pi-subagents at startup and warns if not installed.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const AGENTS_DIR = join(process.env.HOME || "", ".pi", "agent", "agents");
const PACKAGE_AGENTS_DIR = join(dirname(dirname(fileURLToPath(import.meta.url))), "agents");

const BUNDLED_AGENTS = ["scout.md", "reviewer.md"];

function installAgents() {
	if (!existsSync(AGENTS_DIR)) {
		mkdirSync(AGENTS_DIR, { recursive: true });
	}

	for (const agent of BUNDLED_AGENTS) {
		const src = join(PACKAGE_AGENTS_DIR, agent);
		const dest = join(AGENTS_DIR, agent);

		if (!existsSync(src)) continue;

		// Skip if destination exists and is newer than source
		if (existsSync(dest)) {
			const srcStat = statSync(src);
			const destStat = statSync(dest);
			if (destStat.mtimeMs >= srcStat.mtimeMs) continue;
		}

		const content = readFileSync(src, "utf-8");
		writeFileSync(dest, content);
	}
}

function hasSubagentTool(pi: ExtensionAPI): boolean {
	return pi.getAllTools().some((t) => t.name === "subagent");
}

export default function (pi: ExtensionAPI) {
	// Install agents on load
	try {
		installAgents();
	} catch {
		// Silently fail — agents are optional if pi-subagents isn't installed
	}

	// Check for pi-subagents on session start
	pi.on("session_start", async (_event, ctx) => {
		if (!hasSubagentTool(pi)) {
			ctx.ui.notify(
				"@nicknisi/pi-ideation: pi-subagents not found. Install with: pi install npm:pi-subagents",
				"warning",
			);
		}
	});
}
