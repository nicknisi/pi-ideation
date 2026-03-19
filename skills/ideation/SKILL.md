---
name: ideation
description: Transform raw brain dumps (dictated freestyle) into structured implementation artifacts. Use when user has messy ideas, scattered thoughts, or dictated stream-of-consciousness, or when they want to plan a feature, spec something out, or turn rough ideas into actionable specs. Produces contracts and implementation specs written to ./docs/ideation/{project-name}/.
---

# Ideation

Transform unstructured brain dumps into structured, actionable implementation artifacts through a confidence-gated workflow.

## Critical: Structured Questions at Decision Points

At every decision point, ask the user with structured options. If the `ask_user_question` tool is available, use it — it provides a TUI with selectable options. Otherwise, present numbered options in plain text.

Structured questions are required for:

- Clarifying questions during confidence scoring (Phase 2)
- Project name confirmation before writing artifacts
- Contract approval
- Workflow choice (PRDs vs straight to specs)
- Phase review feedback before spec generation
- Any decision point requiring user input

## Workflow Pipeline

```
INTAKE → CODEBASE EXPLORATION → CONTRACT FORMATION → PHASING → SPEC GENERATION → HANDOFF
              ↓                        ↓                  ↓            ↓               ↓
         Understand              confidence < 95%?    PRDs or     Repeatable?    Analyze deps
         existing code                ↓               straight      ↓               ↓
                                 ASK QUESTIONS        to specs?   Template +    Sequential?
                                      ↓                           per-phase     Parallel?
                                 (loop until ≥95%)                deltas        Subagents?
```

## Phase 1: Intake

Accept whatever the user provides:

- Scattered thoughts and half-formed ideas
- Voice dictation transcripts (messy, stream-of-consciousness)
- Bullet points mixed with rambling
- Topic jumping and tangents
- Contradictions and unclear statements
- Technical jargon mixed with vague descriptions

**Don't require organization. The mess is the input.**

Acknowledge receipt and begin analysis. Do not ask for clarification yet.

## Phase 2: Codebase Exploration

**Before scoring confidence or generating any artifacts, understand the existing codebase.** This is critical — specs written without understanding existing patterns, architecture, and conventions will be generic and wrong.

### 2.1 Determine if Exploration is Needed

Exploration is needed when:

- The brain dump references existing code, features, or systems
- The project directory contains source code (not a greenfield project)
- The user mentions extending, modifying, or integrating with existing functionality

Skip exploration for greenfield projects with no existing code.

### 2.2 Explore the Codebase

Use the `subagent` tool to run the `scout` agent, or explore directly with `grep`/`find`/`read`/`bash` to understand:

1. **Project structure** — What frameworks, languages, and patterns are in use?
2. **Relevant existing code** — What modules/files relate to the brain dump's scope?
3. **Conventions and patterns** — How are similar features implemented? What abstractions exist?
4. **Testing patterns** — How is the codebase tested? What infrastructure exists?
5. **Configuration and build** — What tools, package managers, and CI/CD are in use?
6. **Feedback infrastructure** — What fast-feedback tools exist? Test runner config, dev server setup, storybook, API testing scripts, CI shortcuts. These directly inform feedback loop design in specs: if the project has Storybook, prefer it as the UI playground; if it has a test runner with watch mode, use that for the inner-loop command. See `references/feedback-loop-guide.md` for the full infrastructure-to-playground mapping.

### 2.3 Record Findings

Retain exploration context for use in later phases. These inform:

- **Confidence scoring** — better understanding of the problem space
- **Contract** — realistic scope boundaries based on actual architecture
- **Specs** — "Pattern to follow" references, accurate file paths, correct abstractions

**Do not write exploration findings to files.** They're context for the ideation process, not an artifact.

## Phase 3: Contract Formation

### 3.1 Analyze the Brain Dump

Extract from the raw input + codebase exploration:

1. **Problem signals**: What pain point or need is being described?
2. **Goal signals**: What does the user want to achieve?
3. **Success signals**: How will they know it worked?
4. **Scope signals**: What's included? What's explicitly excluded?
5. **Contradictions**: Note any conflicting statements
6. **Codebase constraints**: What does the existing architecture enable or limit?

### 3.2 Calculate Confidence Score

Read `references/confidence-rubric.md` for detailed scoring criteria.

**Score conservatively.** When uncertain between two levels, choose the lower one. One extra round of questions costs minutes; a bad contract costs hours. Do not inflate scores to move forward faster.

Score each dimension (0-20 points):

| Dimension        | Question                                                       |
| ---------------- | -------------------------------------------------------------- |
| Problem Clarity  | Do I understand what problem we're solving and why it matters? |
| Goal Definition  | Are the goals specific and measurable?                         |
| Success Criteria | Can I write tests or validation steps for "done"?              |
| Scope Boundaries | Do I know what's in and out of scope?                          |
| Consistency      | Are there contradictions I need resolved?                      |

**Total: /100 points**

### 3.3 Confidence Thresholds

| Score | Action                                                    |
| ----- | --------------------------------------------------------- |
| < 70  | Major gaps. Ask 5+ questions targeting lowest dimensions. |
| 70-84 | Moderate gaps. Ask 3-5 targeted questions.                |
| 85-94 | Minor gaps. Ask 1-2 specific questions.                   |
| ≥ 95  | Ready to generate contract.                               |

### 3.4 Ask Clarifying Questions

When confidence < 95%, ask clarifying questions with structured options.

**Effective question format** (applies to both `ask_user_question` tool and plain text):

- Provide 2-4 options per question when choices are clear
- Note when multiple answers apply
- Keep questions focused and specific
- Include descriptions that explain implications of each choice

**Question strategy**:

- Target the lowest-scoring dimension first
- Be specific, not open-ended
- Offer options when possible ("Is it A, B, or C?")
- Reference what was stated ("You mentioned X, did you mean...?")
- Limit to 3-5 questions per round
- After each round, recalculate confidence

See `references/confidence-rubric.md` for question templates by dimension and best practices.

### 3.5 Generate Contract

When confidence ≥ 95%, generate the contract document.

1. Confirm project name if not obvious from context
2. Convert to kebab-case for directory name
3. Create output directory: `./docs/ideation/{project-name}/`
4. Write `contract.md` using `references/contract-template.md`
5. Ask the user for approval:

```
Question: "Does this contract accurately capture your intent?"
Options:
- "Approved" - Contract is accurate, proceed
- "Needs changes" - Some parts need revision
- "Missing scope" - Important items are not captured
- "Start over" - Fundamentally off track, re-analyze
```

**If not approved:** Revise the contract based on feedback. Do not re-score confidence unless the feedback reveals a fundamental misunderstanding — in that case, return to Phase 3.2 and re-score. Otherwise, edit `contract.md` directly and re-present for approval. Iterate until approved.

**Do not proceed until contract is explicitly approved.**

## Phase 4: Phasing & Specification

After contract is approved, determine phases and generate specs. PRDs are optional.

### 4.1 Choose Workflow

Ask the user:

```
How should we proceed from the contract?
Options:
- "Straight to specs" — Recommended for technical projects.
  Contract defines what, specs define how. Faster.
- "PRDs then specs" — Recommended for large scope or cross-functional
  teams. Adds a requirements layer for stakeholder alignment.
```

### 4.2 Determine Phases

Regardless of PRD choice, analyze the contract and break scope into logical implementation phases.

**Small-project shortcut:** If the scope is small enough to implement in a single phase (1-3 components, touches fewer than ~10 files), skip phasing entirely. Generate a single `spec.md` (no phase number needed) and proceed directly to handoff. Not every project needs multiple phases — don't force structure where simplicity suffices.

**Phasing criteria** (for multi-phase projects):

- Dependencies (what must be built first?)
- Risk (tackle high-risk items early)
- Value delivery (can users benefit after each phase?)
- Complexity (balance phases for consistent effort)

Typical phasing:

- Phase 1: Core functionality / infrastructure
- Phase 2+: Features, enhancements, additional integrations
- Phase N: Future considerations

**Detect repeatable patterns:** If 3+ phases follow the same structure with different inputs (e.g., "add SDK support for {language}"), note this — it affects how specs are generated (see 4.4).

### 4.3 Generate PRDs (only if user chose "PRDs then specs")

For each phase, generate `prd-phase-{n}.md` using `references/prd-template.md`.

Include:

- Phase overview and rationale
- User stories for this phase
- Functional requirements (grouped)
- Non-functional requirements
- Dependencies (prerequisites and outputs)
- Acceptance criteria

Present all PRDs for review:

```
Do these PRD phases look correct?
Options:
- "Approved" - Phases and requirements look good, proceed to specs
- "Adjust phases" - Need to move features between phases
- "Missing requirements" - Some requirements are missing or unclear
- "Start over" - Need to revisit the contract
```

Iterate until user explicitly approves.

### 4.4 Generate Implementation Specs

Generate specs using `references/spec-template.md`. How specs are generated depends on whether phases are repeatable:

#### Standard phases (each is unique)

For each phase, generate a full `spec-phase-{n}.md` with:

- Technical approach
- File changes (new and modified)
- Implementation details with code patterns
- Testing requirements
- Error handling
- Validation commands
- Feedback strategy (top-level inner-loop command and playground type)
- Per-component feedback loops (where applicable)

**Reference existing code:** When the codebase exploration (Phase 2) identified relevant patterns, include "Pattern to follow: `path/to/similar/file.ts`" in the spec's implementation details. This gives the executing agent concrete examples to follow.

**Designing feedback loops:** For each iterative component, define a playground (environment to interact with), experiment (parameterized check), and check command (fastest single validation). Match the feedback mechanism to the component type — data layers use tests, UI uses dev server, APIs use curl scripts, config/types skip loops entirely. See `references/feedback-loop-guide.md` for the full component-type mapping and design criteria.

#### Repeatable phases (3+ phases follow the same pattern)

When multiple phases share the same structure (e.g., "add support for {SDK}"), avoid generating N nearly-identical full specs. Instead:

1. **Generate one full template spec** — `spec-template-{pattern-name}.md` — with detailed implementation steps, using placeholders for the variable parts.

2. **Generate lightweight per-phase delta files** — `spec-phase-{n}.md` — containing only:
   - Phase-specific inputs (e.g., language name, package manager, framework)
   - Deviations from the template (what's different about this phase)
   - Any phase-specific concerns or edge cases
   - Reference to the template: "Follow `spec-template-{pattern-name}.md` with the inputs below"

This approach:
- Saves significant context window space
- Makes the per-phase differences obvious
- Avoids copy-paste errors across specs
- Makes it easy to update the shared pattern in one place

### 4.5 Present Phases for Review

Whether using PRDs or straight-to-specs, present the phase breakdown and specs for user approval before proceeding to handoff.

**Before presenting specs, evaluate feedback loop quality** using the Spec Feedback Quality checklist from `references/confidence-rubric.md`. Self-review each spec:

- **Strong**: All iterative components have feedback loops, inner-loop command defined, trivial components correctly skipped → present spec as-is
- **Adequate**: Most components have loops but some gaps → present spec with a note about what's missing
- **Weak**: No Feedback Strategy section, or complex components missing loops entirely → revise spec before presenting

If Weak, fix the gaps first. Don't present a spec without feedback loops for its iterative components.

Ask the user:

```
Do these specs look correct?

1. **Approved** - Specs look good, proceed to execution handoff
2. **Adjust approach** - Implementation strategy needs changes
3. **Missing components** - Some files or steps are missing
4. **Revisit phases** - Phase breakdown needs restructuring
```

If not approved, revise the relevant specs based on feedback and re-present. Iterate until approved.

## Phase 5: Execution Handoff

After specs are generated, analyze orchestration options and hand off for implementation.

### 5.1 Analyze Orchestration Strategy

Analyze the phase dependency graph to determine the best execution strategy.

**Detect parallelizable phases:**

- Examine which phases are blocked by what
- If 2+ phases share the same single blocker (e.g., all blocked only by Phase 1), they are **parallelizable**
- If phases form a linear chain (Phase 2 → Phase 3 → Phase 4), they are **sequential**
- Mixed graphs have both parallel and sequential segments

**Determine recommended strategy:**

| Pattern | Recommendation |
|---------|----------------|
| All phases sequential (chain) | **Sequential execution** — one session at a time |
| 2+ independent phases | **Parallel subagents** — use `/chain` or `/parallel` commands |
| Mixed dependencies | **Hybrid** — sequential for dependent chain, parallel for independent group |

### 5.2 Write Execution Plan to Contract

Append the `## Execution Plan` section to the contract file (`./docs/ideation/{project-name}/contract.md`). This makes the contract fully self-contained — someone can pick it up cold and know exactly how to execute.

Use the Execution Plan section from the contract template. Fill in:

1. **Dependency Graph** — ASCII art showing which phases block which. Keep it simple.
2. **Execution Steps** — ordered list with the exact `/skill:execute-spec` commands. Mark which are sequential vs parallel.
3. **Parallel Execution Commands** — only if 2+ phases are parallelizable. Ready-to-use `/chain` or `/parallel` commands for pi-subagents. **Omit this subsection entirely** for fully sequential projects.

**Shared file detection:** Before writing parallel commands, scan spec files' "Modified Files" sections. If multiple specs modify the same files, include a coordination note:

```
Coordinate on shared files ({list}) to avoid merge conflicts —
only one subagent should modify a shared file at a time.
```

**Batching:** If more than 5 parallelizable phases, note in the execution steps to start with the highest-priority batch first.

### 5.3 Present Handoff Summary

After writing the execution plan, present a brief conversational summary.

**Always include:**

```
Ideation complete. Artifacts written to `./docs/ideation/{project-name}/`.

The contract includes the full execution plan — dependency graph
and commands. Open `contract.md` to pick up implementation from
any session.
```

**Then show the first step** — either the first `/skill:execute-spec` command for sequential execution, or the `/chain`/`/parallel` command for parallel execution.

**Parallel execution context** (include when the execution plan has parallel phases):

```
For parallel phases, use pi-subagents:

  /chain scout "analyze codebase" -> worker "execute spec-phase-2.md" -> reviewer "review"
  /parallel worker "execute spec-phase-3.md" -> worker "execute spec-phase-4.md"

Each subagent gets its own context window and works independently.
```

### 5.4 Why Fresh Sessions?

- Ideation consumes significant context (contract, specs, exploration)
- Execution benefits from clean context focused on the spec
- Human review between phases catches issues early
- Each phase is independently committable

## Output Artifacts

All artifacts written to `./docs/ideation/{project-name}/`:

```
contract.md                        # Lean contract (problem, goals, success, scope)
prd-phase-1.md                     # Phase 1 requirements (only if PRDs chosen)
...
spec-phase-1.md                    # Phase 1 implementation spec (always full)
spec-template-{pattern}.md         # Shared template for repeatable phases (if applicable)
spec-phase-{n}.md                  # Per-phase delta referencing template (if repeatable)
...
```

## Bundled Resources

### References

- `references/contract-template.md` - Template for lean contract document
- `references/prd-template.md` - Template for phased PRD documents
- `references/spec-template.md` - Template for implementation specs
- `references/confidence-rubric.md` - Detailed scoring criteria for confidence assessment and spec feedback quality
- `references/feedback-loop-guide.md` - Component-type mapping and design criteria for spec feedback loops
- `references/workflow-example.md` - End-to-end workflow walkthrough

### Examples

Completed artifact examples for reference when generating output:

- `examples/contract-example.md` - A filled-in contract for a bookmark feature
- `examples/prd-example.md` - A filled-in PRD for the same feature (Phase 1)
- `examples/spec-example.md` - A filled-in spec for the same feature

When generating artifacts, reference these examples for tone, structure, and level of detail.

## Important Notes

- **Ask clarifying questions** at every decision point with structured options.
- **Explore the codebase** before scoring confidence (unless greenfield).
- **Score confidence conservatively.** When uncertain, score lower.
- Never skip the confidence check. Don't assume understanding.
- Always write artifacts to files. Don't just display them.
- Each phase should be independently valuable.
- Specs should be detailed enough to implement without re-reading PRDs or the contract.
- Keep contracts lean. Heavy docs slow iteration.
- **Reference existing code patterns** in specs — "Pattern to follow" with real file paths.
- **Use template + delta** for repeatable phases — don't generate N identical specs.
- **Small projects don't need phases.** If scope is 1-3 components, generate a single spec.
