# @nicknisi/pi-ideation

Transform brain dumps into structured implementation specs with confidence-gated workflows, codebase exploration, and automated review cycles.

A [pi](https://github.com/badlogic/pi-mono) package ported from [claude-plugins/ideation](https://github.com/nicknisi/claude-plugins).

## Installation

```bash
pi install npm:@nicknisi/pi-ideation
```

### Recommended packages

These packages enhance the ideation workflow. The skills work without them but with reduced functionality. A warning is shown at session start for any missing packages.

| Package | Install | What it adds |
|---------|---------|-------------|
| [pi-subagents](https://github.com/nicobailon/pi-subagents) | `pi install npm:pi-subagents` | Scout/reviewer agents, parallel execution, chains |
| [pi-askuserquestion](https://github.com/ghoseb/pi-askuserquestion) | `pi install git:github.com/ghoseb/pi-askuserquestion` | Structured TUI for clarifying questions |

Without pi-subagents, execute-spec falls back to inline codebase exploration and skips the automated review cycle. Without pi-askuserquestion, the LLM asks questions as numbered plain-text options instead of an interactive TUI.

## What's Included

### Skills

| Skill | Command | Description |
|-------|---------|-------------|
| **ideation** | `/skill:ideation` | Transform messy ideas into structured contracts and implementation specs |
| **execute-spec** | `/skill:execute-spec` | Execute a spec with scout → build → review cycles |

### Agents (for pi-subagents)

| Agent | Description |
|-------|-------------|
| **scout** | Read-only codebase exploration. Scores implementation readiness across 5 dimensions. |
| **reviewer** | Spec-aware code review. Compares git diff against the spec and produces structured findings. |

Agents are automatically installed to `~/.pi/agent/agents/` on first load.

## Usage

### Ideation (planning)

```
/skill:ideation

I have this idea for a feature... [brain dump here]
```

The ideation skill will:
1. Accept your messy input
2. Explore the codebase (if not greenfield)
3. Ask clarifying questions until confidence ≥ 95%
4. Generate a contract for approval
5. Break scope into phases
6. Generate implementation specs
7. Create an execution plan

Artifacts are written to `./docs/ideation/{project-name}/`.

### Execute Spec (implementation)

```
/skill:execute-spec docs/ideation/my-feature/spec-phase-1.md
```

The execute-spec skill will:
1. Run the **scout** agent to map the codebase
2. Build components incrementally with feedback loops
3. Run validation commands
4. Invoke the **reviewer** agent (up to 3 cycles)
5. Commit on review pass

For parallel execution of independent components:

```
/skill:execute-spec --parallel docs/ideation/my-feature/spec-phase-1.md
```

### Using agents directly

With pi-subagents installed:

```
/run scout "analyze the auth module for phase 2 implementation"
/run reviewer "review changes against docs/ideation/auth/spec-phase-1.md"
/chain scout "explore codebase" -> worker "implement spec" -> reviewer "review against spec"
```

## Bundled References

The ideation skill includes reference templates and examples:

- `references/contract-template.md` — Contract template
- `references/prd-template.md` — PRD template
- `references/spec-template.md` — Implementation spec template
- `references/confidence-rubric.md` — Confidence scoring criteria
- `references/feedback-loop-guide.md` — Feedback loop design guide
- `references/workflow-example.md` — End-to-end workflow walkthrough
- `examples/contract-example.md` — Example contract
- `examples/prd-example.md` — Example PRD
- `examples/spec-example.md` — Example spec

## License

MIT
