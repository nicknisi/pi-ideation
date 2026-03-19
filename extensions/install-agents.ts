/**
 * Peer dependency checker for pi-ideation.
 *
 * Warns on session start if recommended packages are missing.
 *
 * Note: bundled agents (scout, reviewer) live in this package's agents/
 * directory but are NOT auto-installed into ~/.pi/agent/agents/. To use
 * them with pi-subagents, manually symlink or copy them:
 *
 *   ln -s "$(npm root -g)/@nicknisi/pi-ideation/agents/scout.md" ~/.pi/agent/agents/
 *   ln -s "$(npm root -g)/@nicknisi/pi-ideation/agents/reviewer.md" ~/.pi/agent/agents/
 *
 * The execute-spec skill degrades gracefully without them — it falls back
 * to inline exploration (no scout) and validation-only mode (no reviewer).
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

function hasTool(pi: ExtensionAPI, name: string): boolean {
	return pi.getAllTools().some((t) => t.name === name);
}

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		const missing: string[] = [];

		if (!hasTool(pi, "subagent")) {
			missing.push("pi-subagents (pi install npm:pi-subagents)");
		}
		if (!hasTool(pi, "ask_user_question")) {
			missing.push("pi-askuserquestion (pi install git:github.com/ghoseb/pi-askuserquestion)");
		}

		if (missing.length > 0) {
			ctx.ui.notify(
				`@nicknisi/pi-ideation: missing recommended packages:\n${missing.join("\n")}`,
				"warning",
			);
		}
	});
}
