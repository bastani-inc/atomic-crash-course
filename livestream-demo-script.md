# Atomic Live-Stream Demo Script — 3 Hours, Technical Audience

Binary: `atomic`. Docs cited throughout: <https://docs.bastani.ai/>.
**One repo.** Every demo runs inside a single repository, `~/Documents/demos/atomic` — seed files, project-local resources (`.atomic/extensions`, `.atomic/skills`, `.atomic/prompts`, `.atomic/themes`, `.atomic/workflows`, `.atomic/agents`), the SDK sample, and a copy of this script. The only pieces Atomic discovers globally are `~/.atomic/agent/keybindings.json` and `~/.atomic/agent/models.json`; those two stay global and are called out where used.

Presenter rules:

- Every step below is runnable as written. Demos are **prompt-first**: wherever the agent can do the work, the step is a prompt you type into Atomic, not a shell command. Shell appears only where Atomic isn't running yet (launching sessions/panes) or where the CLI itself is the demo.
- Where a demo has two documented acceptable outcomes (noted inline), narrate whichever happens — both are correct behavior.
- `ask_user_question` and `todo` are driven by prompts, not hand-written tool-call JSON; the docs name them as default tools but publish no parameter schema.
- Stretch demos in the Appendix absorb buffer time or replace a demo that misbehaves live.

---

## Pre-stream checklist

Run everything in this section **before** going live.

1. **Runtime environment (recommended): [herdr](https://herdr.dev/) on an SSH node.** For the best experience, run the whole stream inside a herdr session on a remote box (Mac mini, Azure VM, EC2 instance, …) instead of tmux:

   ```bash
   ssh <your-node>
   curl -fsSL https://herdr.dev/install.sh | sh
   herdr
   ```

   Why herdr over tmux for this stream: it's an always-running server that holds real terminals open, so every Atomic session survives an SSH drop or a closed laptop lid mid-demo; the sidebar marks each agent **working / blocked / idle**, so during Part 5's three-session intercom demos you never hunt panes for whoever is waiting on you; you can reattach to the exact layout from any machine with a keyboard; and its CLI + socket API are agent-drivable — agents can split panes, start each other, and wait until a peer is genuinely blocked. Docs: <https://herdr.dev/docs/>. Create three terminals in the herdr session — **T1** (main), **T2** (worker / second session), **T3** (fresh session / shell) — these names are used throughout. tmux works as a fallback ([docs.bastani.ai/tmux](https://docs.bastani.ai/tmux)).
2. **Auth + models.** Run `atomic`, then `/login` for at least one provider. Confirm a working default model with a throwaway prompt. Optional for the local-models demo: install Ollama and `ollama pull llama3.1:8b`.
3. **The one demo repo.** Create it, trust it, and let Atomic seed it from a single bootstrap prompt:

   ```bash
   mkdir -p ~/Documents/demos/atomic && cd ~/Documents/demos/atomic && git init -q
   cp <path-to-this-script> ~/Documents/demos/atomic/livestream-demo-script.md
   atomic -a        # -a trusts project-local .atomic resources for this repo (docs.bastani.ai/security)
   ```

   Then paste this bootstrap prompt into Atomic (bodies are exact — the later demos quote them):

   ```text
   Seed this repo for a live demo. Create these files with EXACTLY this content, create the
   directories .atomic/extensions, .atomic/skills, .atomic/prompts, .atomic/themes,
   .atomic/workflows, and .atomic/agents, add a .gitignore containing "node_modules" and
   "sdk-demo/node_modules", then git-commit everything as "seed demo repo".

   greeter.ts:
   export function greet(name: string): string {
     return "Hello, " + name + "!";
   }

   export function shout(name: string): string {
     return greet(name).toUpperCase();
   }

   console.log(shout("stream"));

   AGENTS.md:
   # Project Instructions

   - This is a demo repository for a live stream.
   - Keep answers short.
   - TypeScript files run with `bun <file>.ts`.

   src-client.ts:
   export type User = { id: string; email: string | null };

   export function validate(user: User): boolean {
     return user.email.includes("@"); // bug: no null check
   }

   export async function fetchUser(id: string): Promise<User> {
     const res = await fetch(`https://example.invalid/users/${id}`);
     return (await res.json()) as User;
   }

   notes.md:
   Focus on null handling

   plan.md:
   Ship today
   ```

4. **Planted-flaw target for the security-review finale and the durability demo.** Still in the same Atomic session, prompt:

   ```text
   Create demo-app/server.js with EXACTLY this content, then commit it as "seed demo-app":

   const express = require("express");
   const app = express();

   const API_KEY = "sk-live-1234567890abcdef"; // hardcoded secret (planted)

   app.get("/user", (req, res) => {
     // TODO: validate input
     const query = "SELECT * FROM users WHERE name = '" + req.query.name + "'";
     res.json({ query, key: API_KEY });
   });

   // TODO: add error handling middleware

   app.listen(3000);
   ```

5. **Custom agent file** (Demo 5.2). Prompt:

   ```text
   Create .atomic/agents/strict-inspector.md with EXACTLY this content, then commit it:

   ---
   name: strict-inspector
   description: Inspect code for correctness and regressions
   tools: read, search, bash
   model: anthropic/claude-sonnet-4
   fallbackModels: openai/gpt-5-mini
   inheritProjectContext: true
   ---

   ## Role and goal
   Inspect the current diff for correctness and regressions without editing files.

   ## Success criteria
   Cite each actionable issue with file:line evidence and the observed failure or risk.

   ## Output and stop rule
   Return only issues worth fixing now. Stop when the relevant diff and affected call paths have been inspected, or name the evidence you could not access.
   ```

   Swap the two model IDs for ones your providers actually serve if the doc's examples are unavailable.
6. **Global leftovers.** Remove any stale `~/.atomic/agent/keybindings.json`. Everything else the stream creates is project-local under `~/Documents/demos/atomic/.atomic/`.
7. **Workflow backup files.** Type the workflow files live if you dare, but pre-create backup copies of `explain-file.ts`, `release-gate.ts`, and `security-review.ts` (bodies in Part 6) somewhere off-screen so a typo can't sink the finale. Dry-run the `security-review` and `loop-until-done` demos once; confirm workflow durability works on this machine (Postgres or embedded Postgres; Alpine/musl needs `DBOS_SYSTEM_DATABASE_URL` or runs non-durable — [docs.bastani.ai/workflows](https://docs.bastani.ai/workflows)).
8. **SDK demo dir** (needs network once) — inside the repo:

   ```bash
   mkdir -p ~/Documents/demos/atomic/sdk-demo && cd ~/Documents/demos/atomic/sdk-demo
   npm init -y
   npm install @bastani/atomic
   ```

9. **Terminals.** Three herdr terminals visible (T1/T2/T3 from step 1). A browser ready for the `/export` HTML.
10. **Clean git state** in `~/Documents/demos/atomic` right before Part 5 (worktree isolation requires it): `cd ~/Documents/demos/atomic && git add -A && git commit -q -m wip || true`.

---

## Run-of-show

| Clock | Segment | Demo | Min |
|-------|---------|------|-----|
| 0:00 | Intro | What Atomic is; four modes (interactive, print/JSON, RPC, SDK); today's arc | 5 |
| 0:05 | Part 1 — Core | 1.1 First session, `@` refs, `!` bash, live steering | 8 |
| 0:13 | | 1.2 Hashline edits: stale-safe patches | 8 |
| 0:21 | | 1.3 `ask_user_question`: the agent interviews you | 5 |
| 0:26 | | 1.4 `todo`: file-based task tracking | 4 |
| 0:30 | Part 2 — Sessions | 2.1 Branching: `/tree`, `/fork`, `/clone` | 10 |
| 0:40 | | 2.2 Verbatim compaction + `keepContext` | 8 |
| 0:48 | | 2.3 Sessions are just JSONL; `/export` | 5 |
| 0:53 | Buffer / Q&A | (or Appendix A.1 keybindings) | 3 |
| 0:56 | Part 3 — Customization | 3.1 Build an extension live | 8 |
| 1:04 | | 3.2 Full-screen custom TUI tool | 6 |
| 1:10 | | 3.3 Write a skill live | 7 |
| 1:17 | | 3.4 Custom theme, live hot reload | 5 |
| 1:22 | Part 4 — Platform | 4.1 Headless: pipes, `--tools`, JSON events | 6 |
| 1:28 | | 4.2 Local models via `models.json` (Ollama) | 6 |
| 1:34 | | 4.3 20-line SDK embed | 6 |
| 1:40 | Buffer / Q&A | (or Appendix A.4 prompt templates) | 3 |
| 1:43 | Part 5 — Subagents & Intercom | 5.1 Natural-language delegation | 4 |
| 1:47 | | 5.2 Worktree-isolated parallel edits | 8 |
| 1:55 | | 5.3 **Two-terminal intercom coordination** | 10 |
| 2:05 | | 5.4 `contact_supervisor` escalation | 10 |
| 2:15 | | 5.5 Intercom context handoff between sessions | 8 |
| 2:23 | Part 6 — Workflows | 6.1 Builtin tour: fan-out-and-synthesize | 6 |
| 2:29 | | 6.2 Hand-write `explain-file` live | 6 |
| 2:35 | | 6.3 HIL `release-gate` | 7 |
| 2:42 | | 6.4 Durability: quit and resume a run | 6 |
| 2:48 | | 6.5 **Finale: `security-review` with bounded repair loop** | 10 |
| 2:58 | Wrap | Recap, links, where to find docs | 2 |

Total: 3:00 with ~6 min of explicit buffer. Appendix demos are fully scripted spares.

---

# Part 1 — Core interactive experience (0:05–0:30)

## Demo 1.1 — First session: `@` refs, `!` bash, live steering

**Source:** [docs.bastani.ai/quickstart](https://docs.bastani.ai/quickstart); [docs.bastani.ai/usage](https://docs.bastani.ai/usage) ("Editor Features", "Message Queue"); [README](https://github.com/bastani-inc/atomic#readme) ("Interactive Mode"). **Duration:** 8 min.

**Summary:** Open the very first session and tour the TUI: reference files with `@`, run shell inline with `!`/`!!`, and steer the agent mid-task with queued messages. Establishes the interaction vocabulary every later demo builds on.

### 📖 Docs reference

**[README](https://github.com/bastani-inc/atomic#readme) — "Interactive Mode"**

> - **Startup header** - Shows shortcuts (`/hotkeys` for all), loaded AGENTS.md files, prompt templates, skills, and extensions
> - **Messages** - Your messages, assistant responses, tool calls and results, notifications, errors, and extension UI
> - **Editor** - Where you type; border color indicates thinking level
> - **Footer** - Working directory, session name, total token/cache usage, cost, context usage, current model

**[docs.bastani.ai/usage](https://docs.bastani.ai/usage) — "Editor Features"**

> | Feature | How |
> |---------|-----|
> | File reference | Type `@` to fuzzy-search project files |
> | Path completion | Press Tab to complete paths |
> | Multi-line input | SHIFT+Enter, or CTRL+Enter on Windows Terminal |
> | Images | Paste with CTRL+V, ALT+V on Windows, or drag into the terminal |
> | Shell command | `!command` runs and sends output to the model |
> | Hidden shell command | `!!command` runs without sending output to the model |
> | External editor | CTRL+G opens `$VISUAL` or `$EDITOR` |

**[docs.bastani.ai/usage](https://docs.bastani.ai/usage) — "Message Queue"**

> - **Enter** queues a steering message, delivered after the current assistant turn finishes executing its tool calls.
> - **ALT+Enter** queues a follow-up message, delivered after the agent finishes all work.

> - **ALT+Up** explicitly retrieves queued messages back to the editor without aborting active work or resuming a paused session. Even when retrieval empties the queue, the pause remains active until the next ordinary submission.

**What it shows:** The TUI layout, default tools, file references, inline shell, and the steering/follow-up message queue.

**Steps**

1. `cd ~/Documents/demos/atomic && atomic`
2. Point at the startup header (loaded AGENTS.md, skills, extensions), the editor, and the footer (cwd, tokens, cost, context %, model).
3. `/model` (or CTRL+L) to pick a model; SHIFT+Tab cycles thinking level — the editor border color changes.
4. Prompt (type `@` and fuzzy-pick the file): `Explain @greeter.ts in two sentences.`
5. `!bun greeter.ts` — output goes to the model. `!!ls -la` — runs without entering model context.
6. Give a longer task: `Add a farewell(name) function to greeter.ts, then write a one-paragraph doc comment for every function.` While it works, press Enter on: `Use "Goodbye" not "Farewell" in the string.` — delivered as a steering message after the current turn's tool calls.
7. ALT+Enter queues a follow-up: `Now run the file to prove it works.` Show ALT+Up retrieving queued messages.

**What to point out:** Default tools are `read`, `bash`, `edit`, `write`, `find`, `search`, `ask_user_question`, `todo` (usage.md "Tool Options"). Escape/CTRL+C abort cooperatively and hold the queue. `AGENTS.md` auto-loads from cwd.

## Demo 1.2 — Hashline edits: stale-safe patches with snapshot tags

**Source:** [docs.bastani.ai/tools](https://docs.bastani.ai/tools) ("Hashline editing anchors"). **Duration:** 8 min.

**Summary:** Atomic's edit tool patches files against a 4-hex snapshot tag instead of fragile string matching. You watch a surgical edit land, then sabotage the file behind the model's back and watch drift get detected instead of blindly overwritten.

### 📖 Docs reference

**[docs.bastani.ai/tools](https://docs.bastani.ai/tools) — "Hashline editing anchors"**

> `read`, `search`, `write`, and successful `edit` results for local text files emit an editable hashline header:
>
> ```text
> [src/example.ts#A1B2]
> 1:const value = 1;
> 2:console.log(value);
> ```
>
> The four-character tag is a snapshot of the file content seen by the model. The `edit` tool accepts hashline scripts anchored to that tag:
>
> ```text
> [src/example.ts#A1B2]
> replace 1..1:
> +const value = 2;
> insert tail:
> +// done
> ```

> Supported hashline operations include `replace N..M:`, `replace block N:`, `delete N..M`, `delete block N`, `insert before N:`, `insert after N:`, `insert after block N:`, `insert head:`, and `insert tail:`.

> Before writing, Atomic verifies the current file against the tagged snapshot. If the file drifted, `edit` first attempts a snapshot-based recovery for provably non-overlapping external changes and appends a warning when it preserves those changes; unknown tags, overlapping stale edits, and unrecoverable drift fail clearly with the current file hash (and anchor context for drifted files) and leave the file unchanged. Byte-identical no-op edits return a no-op warning without writing, and repeated identical no-ops escalate to an error to stop looped retries.

**What it shows:** `read`/`search`/`write`/successful `edit` emit `[path#TAG]` plus numbered lines; `edit` applies scripts anchored to that tag; drift is detected before writing.

**Steps**

1. Prompt: `Read greeter.ts, then change only the greeting punctuation from "!" to "?!" using a single edit.`
2. CTRL+O to expand tool output. Point at the `[greeter.ts#XXXX]` header on the read result and the edit script:

   ```text
   [greeter.ts#XXXX]
   replace 2..2:
   +  return "Hello, " + name + "?!";
   ```

3. Point out the compact edit success output with a **fresh tag** — no full-file reprint.
4. Drift safety: `!!printf '\n// external hotfix\n' >> greeter.ts` (hidden from the model), then prompt: `Now append "// reviewed" as the last line of greeter.ts.` Atomic either recovers (non-overlapping external change, with a warning) or fails clearly with the current hash — both are documented outcomes; never a blind write.
5. Name the ops: `replace N..M:`, `replace block N:`, `delete N..M`, `insert before/after N:`, `insert head:`/`insert tail:`.

**What to point out:** Line numbers refer to the tagged snapshot and never shift mid-call; tags are session-scoped; repeated no-op edits escalate to an error to break retry loops.

## Demo 1.3 — `ask_user_question`: the agent interviews you

**Source:** [docs.bastani.ai/quickstart](https://docs.bastani.ai/quickstart) ("`ask_user_question` - ask structured questions in the TUI"); [docs.bastani.ai/usage](https://docs.bastani.ai/usage) ("Tool Options" — the flag example is verbatim). **Duration:** 5 min.

**Summary:** The built-in human-in-the-loop primitive: mid-task, the agent swaps the editor for a structured question UI, and your answers land as structured data it must honor. Also shows turning the tool off to force autonomous decisions.

### 📖 Docs reference

**[docs.bastani.ai/quickstart](https://docs.bastani.ai/quickstart) — "Default tools and prompts"**

> - `ask_user_question` - ask structured questions in the TUI

**[docs.bastani.ai/usage](https://docs.bastani.ai/usage) — "Tool Options"**

> | Option | Description |
> |--------|-------------|
> | `--tools <list>`, `-t <list>` | Allowlist specific built-in, extension, and custom tools |
> | `--exclude-tools <list>`, `-xt <list>` | Denylist specific built-in, extension, and custom tools |
> | `--no-builtin-tools`, `-nbt` | Disable built-in tools but keep extension/custom tools enabled |
> | `--no-tools`, `-nt` | Disable all tools |
>
> Default built-in tools: `read`, `bash`, `edit`, `write`, `find`, `search`, `ask_user_question`, `todo`. `find.paths` accepts directories, files, or glob paths such as `*.ts` and honors `timeout`; `search` accepts `pattern`, optional `paths`, `i`, `gitignore`, and `skip` for regex content-search pagination. Use `--exclude-tools` to disable one or more tools while leaving the rest available, for example `atomic --exclude-tools ask_user_question`.

**What it shows:** The model pauses mid-task and presents a structured question UI instead of guessing.

**Steps**

1. Prompt:

   ```text
   Scaffold a config file for this project, but do NOT write anything yet.
   First use the ask_user_question tool to ask me: (1) which format — JSON,
   TOML, or YAML; (2) whether it should include explanatory comments.
   Then create the file exactly per my answers.
   ```

2. The editor is replaced by the structured question UI. Answer with arrows + Enter.
3. Show the agent honoring the answers.
4. Flip side: relaunch with `atomic --exclude-tools ask_user_question` and repeat — the agent must decide alone.

**What to point out:** Answers land as structured data in the transcript; this is the built-in human-in-the-loop primitive that workflows build on (you'll see the workflow-side version in Part 6).

## Demo 1.4 — `todo`: file-based task tracking in `.atomic/todos/`

**Source:** [docs.bastani.ai/quickstart](https://docs.bastani.ai/quickstart) ("`todo` - manage file-based todos"); [docs.bastani.ai/settings](https://docs.bastani.ai/settings) (inert state directories need no trust prompt). **Duration:** 4 min.

**Summary:** The agent plans work as durable todo files under `.atomic/todos/` — plain, greppable, git-shareable project state that survives restarts and needs no trust prompt.

### 📖 Docs reference

**[docs.bastani.ai/quickstart](https://docs.bastani.ai/quickstart) — "Default tools and prompts"**

> - `todo` - manage file-based todos

**[docs.bastani.ai/settings](https://docs.bastani.ai/settings) — "Project Trust"**

> If a bare directory starts without trust-gated inputs, Atomic may run the interactive session as implicitly trusted. Inert state directories such as `.atomic/todos/` and `.atomic/sessions/` do not require trust and do not disable deferred resource startup.

**What it shows:** Durable, inspectable plan state as plain project files.

**Steps**

1. Prompt: `Plan test coverage for greeter.ts with the todo tool: create one todo per exported function, then list all todos.`
2. `!ls -la .atomic/todos/` and `!cat .atomic/todos/*`
3. Prompt: `Write the test for greet() now, then mark its todo done and show the remaining list.`

**What to point out:** Todos survive restarts and are git-shareable; `.atomic/todos/` never triggers the trust prompt.

---

# Part 2 — Session mastery (0:30–0:53)

## Demo 2.1 — Branching: `/tree`, `/fork`, `/clone` (multiverse debugging)

**Source:** [docs.bastani.ai/sessions](https://docs.bastani.ai/sessions) ("Branching with /tree", "Tree Controls", comparison table); [README](https://github.com/bastani-inc/atomic#readme) ("Branching"); [docs.bastani.ai/compaction](https://docs.bastani.ai/compaction) ("Branch Summarization"). **Duration:** 10 min.

**Summary:** Sessions are trees, not logs. Rewind to any point with `/tree`, grow a second approach as a sibling branch in the same JSONL file, attach a branch summary when switching, and split off new session files with `/fork` and `/clone`.

### 📖 Docs reference

**[docs.bastani.ai/sessions](https://docs.bastani.ai/sessions) — "Tree Controls"**

> | Key | Action |
> |-----|--------|
> | ↑/↓ | Navigate visible entries |
> | ←/→ | Page up/down |
> | CTRL+←/CTRL+→ or ALT+←/ALT+→ | Fold/unfold or jump between branch segments |
> | SHIFT+L | Set or clear a label on the selected entry |
> | SHIFT+T | Toggle label timestamps |
> | Enter | Select entry |
> | Escape/CTRL+C | Cancel |
> | CTRL+O | Cycle filter mode |
>
> Filter modes are: default, no-tools, user-only, labeled-only, and all. Configure the default with `treeFilterMode` in [Settings](/settings).

**[docs.bastani.ai/sessions](https://docs.bastani.ai/sessions) — "`/tree`, `/fork`, and `/clone`"**

> | Feature | `/tree` | `/fork` | `/clone` |
> |---------|---------|---------|----------|
> | Output | Same session file | New session file | New session file |
> | View | Full tree | User-message selector | Current active branch |
> | Typical use | Explore alternatives in place | Start a new session from an earlier prompt | Duplicate current work before continuing |
> | Summary | Optional branch summary | None | None |

**[docs.bastani.ai/sessions](https://docs.bastani.ai/sessions) — "Branch Summaries"**

> When prompted, choose one of:
>
> 1. no summary
> 2. summarize with the default prompt
> 3. summarize with custom focus instructions

**[README](https://github.com/bastani-inc/atomic#readme) — "Branching"**

> **`--fork <path|id>`** - Fork an existing session file or partial session UUID directly from the CLI. This copies the full source session into a new session file in the current project.

**What it shows:** Sessions are trees in one JSONL file: rewind, branch, compare approaches, carry a summary across branches.

**Steps**

1. Prompt: `Approach A: add input validation to greet() using a thrown Error for empty names.` Let it finish.
2. Press **Escape twice** (default `doubleEscapeAction: "tree"`) or type `/tree`.
3. In the tree: ↑/↓ navigate; SHIFT+L labels the Approach-A result `approach-A`; CTRL+O cycles filters (default → no-tools → user-only → labeled-only → all).
4. Select the Approach-A user message — it returns to the editor. Edit to: `Approach B: add input validation to greet() that returns "Hello, stranger!" for empty names instead of throwing.` Submit → new branch, same file.
5. `/tree` again, switch back toward branch A → branch-summary prompt with three choices: no summary / default prompt / custom focus. Pick default; show the attached summary.
6. `/fork` — user-message selector; copies the active path into a **new session file** with the prompt pre-filled.
7. `/clone` — duplicates the current active branch into a new file, empty editor.
8. CLI: `/session` for the ID, then from another terminal: `atomic --fork <id>`.

**What to point out:** `/tree` = same file, full tree; `/fork` = new file from an earlier prompt; `/clone` = new file of the current branch. Nothing is ever lost.

## Demo 2.2 — Verbatim compaction + `keepContext`

**Source:** [docs.bastani.ai/compaction](https://docs.bastani.ai/compaction); [README](https://github.com/bastani-inc/atomic#readme) ("Compaction"); [docs.bastani.ai/settings](https://docs.bastani.ai/settings) ("Compaction"). **Duration:** 8 min.

**Summary:** Compaction here is deletion-only: the model picks line ranges to drop, retained lines stay byte-identical, and `<keepContext>` spans are mechanically protected from the planner. You prove it by compacting live and asking about a pinned rule afterward.

### 📖 Docs reference

**[docs.bastani.ai/compaction](https://docs.bastani.ai/compaction) — "What \"verbatim\" means"**

> The model never writes, summarizes, reorders, or normalizes retained text. Every retained non-marker line is byte-identical to an input line and remains in input order.

**[docs.bastani.ai/compaction](https://docs.bastani.ai/compaction) — "Markers and repeated compaction"**

> Each deleted span is replaced on its own line with exactly:
>
> ```text
> (filtered N lines)
> ```

**[docs.bastani.ai/compaction](https://docs.bastani.ai/compaction) — "`keepContext` tags"**

> Wrap any section you never want compressed in `<keepContext>` / `</keepContext>`. Tagged content survives compression verbatim regardless of the compression ratio:

> Every line of the span becomes a protected line, tag lines included, and the guarantee is mechanical rather than advisory: deletion ranges are split around protected lines after the planner responds, so a protected line survives even if the planner ignores its instructions.

**[docs.bastani.ai/settings](https://docs.bastani.ai/settings) — "Compaction"**

> | Setting | Type | Default | Description |
> |---------|------|---------|-------------|
> | `compaction.enabled` | boolean | `true` | Enable automatic verbatim line compaction |
> | `compaction.reserveTokens` | number | `16384` | Tokens reserved for the next model response; automatic threshold compaction begins before this reserve is consumed |
> | `compaction.compression_ratio` | number | `0.5` | Fraction of compactable transcript **lines to keep** (`0 < value < 1`) |
> | `compaction.preserve_recent` | number | `2` | Exact number of newest context-visible messages kept outside the compactable region; `0` keeps none |
> | `compaction.query` | string | last user message | Optional relevance focus for selecting older lines to retain |

**[README](https://github.com/bastani-inc/atomic#readme) — "Compaction"**

> **Manual:** `/compact` has no prompt arguments.
>
> **Automatic:** Enabled by default. Triggers on context overflow (recovers and retries) or when approaching the limit (proactive). Configure via `/settings` or `settings.json`. Automatic compaction uses the same verbatim deletion path.

**What it shows:** Deletion-only compaction — the model only picks line ranges to delete; retained text is byte-identical; `<keepContext>` spans are mechanically protected.

**Steps**

1. Fill the transcript: `Read greeter.ts, AGENTS.md, and every file under .atomic/todos, and summarize each.`
2. Pin a constraint (one pasted message):

   ```text
   <keepContext>
   Stream rule: never rename exported functions in this repo.
   </keepContext>
   Acknowledge the rule above.
   ```

3. Note footer context %, run `/compact` (no arguments).
4. Show the `✻ Context compacted` boundary card; expand to show `(filtered N lines)` markers and the surviving keepContext block.
5. Prove continuity: `What is the stream rule?`
6. Show the knobs in `.atomic/settings.json` (verbatim from compaction.md):

   ```json
   {
     "compaction": {
       "enabled": true,
       "reserveTokens": 16384,
       "compression_ratio": 0.5,
       "preserve_recent": 2
     }
   }
   ```

**What to point out:** Protection is mechanical — deletion ranges are split around protected lines after the planner responds. Auto-compaction triggers on threshold and on provider overflow, then retries the turn. Full history stays in the JSONL. `settings.fallbackModels` may be borrowed for the planner request and would then see the transcript — worth telling a technical audience.

## Demo 2.3 — Sessions are just JSONL: inspect, name, export

**Source:** [docs.bastani.ai/session-format](https://docs.bastani.ai/session-format); [docs.bastani.ai/sessions](https://docs.bastani.ai/sessions); [docs.bastani.ai/usage](https://docs.bastani.ai/usage) ("Exporting and Sharing Sessions", env-var table). **Duration:** 5 min.

**Summary:** Demystify persistence: the whole session — tree links, tool calls, compaction markers — is one JSONL file whose path is injected into every bash call as `$ATOMIC_SESSION_FILE`. Grep it, export it to HTML, resume it from the CLI.

### 📖 Docs reference

**[docs.bastani.ai/session-format](https://docs.bastani.ai/session-format) — "File Location"**

> ```
> ~/.atomic/agent/sessions/--<path>--/<timestamp>_<uuid>.jsonl
> ```
>
> Where `<path>` is the working directory with `/` replaced by `-`.

**[docs.bastani.ai/session-format](https://docs.bastani.ai/session-format) — "Entry Base"**

> ```typescript
> interface SessionEntryBase {
>   type: string;
>   id: string;           // 8-char hex ID
>   parentId: string | null;  // Parent entry ID (null for first entry)
>   timestamp: string;    // ISO timestamp
> }
> ```

**[docs.bastani.ai/usage](https://docs.bastani.ai/usage) — "Exporting and Sharing Sessions"**

> Use `/export [file]` to write a session to HTML.
>
> Use `/share` to upload a private GitHub gist with a shareable HTML link.
>
> Treat exported and shared sessions as sensitive: transcripts can contain source code, file paths, credentials, and other private data from your session. Review a session before sharing it, and only upload transcripts you are comfortable making accessible to anyone with the link.

**[docs.bastani.ai/usage](https://docs.bastani.ai/usage) — "Environment Variables"**

> Every foreground or background bash execution receives one execution-time snapshot of the active session:
>
> | Atomic variable | Exact compatibility alias | Value |
> |-----------------|---------------------------|-------|
> | `ATOMIC_SESSION_ID` | `PI_SESSION_ID` | Active session ID |
> | `ATOMIC_SESSION_FILE` | `PI_SESSION_FILE` | Active session JSONL path; omitted for unsaved sessions |
> | `ATOMIC_PROVIDER` | `PI_PROVIDER` | Active model provider; omitted when no model is selected |
> | `ATOMIC_MODEL` | `PI_MODEL` | Active model ID; omitted when no model is selected |
> | `ATOMIC_REASONING_LEVEL` | `PI_REASONING_LEVEL` | Active reasoning level |

**What it shows:** The whole session — tree, tool calls, compaction boundaries — is one greppable JSONL file with `id`/`parentId` links.

**Steps**

1. `/name Live-stream core demo`, then `/session` (file path, ID, messages, tokens, cost).
2. `!!head -c 600 "$ATOMIC_SESSION_FILE"` — `ATOMIC_SESSION_FILE` is injected into every bash execution.
3. Show the tree links (presenter-built one-liner over the documented JSONL shape):
   `!!cat "$ATOMIC_SESSION_FILE" | python3 -c "import sys,json; [print(json.loads(l).get('type'), json.loads(l).get('id'), '->', json.loads(l).get('parentId')) for l in sys.stdin if l.strip()]" | head -20`
4. `/export demo-session.html`, open in a browser.
5. Mention `/share` (private gist + HTML link) and its sensitivity warning — do not run live.
6. Resume: quit, then `atomic -c` or `atomic -r` (picker: CTRL+P path, CTRL+N named filter, CTRL+D delete).

**What to point out:** Files live at `~/.atomic/agent/sessions/--<path>--/<timestamp>_<uuid>.jsonl`; the `id`/`parentId` chain is why `/tree` needs no extra files.

---

# Part 3 — Customization crescendo (0:56–1:22)

## Demo 3.1 — Build an extension live: custom tool + `/hello` + `tool_call` gate

**Source:** [docs.bastani.ai/extensions](https://docs.bastani.ai/extensions) ("Quick Start", "Extension Locations"). **Duration:** 8 min.

**Summary:** Live-code the extension API: one TypeScript file registers an LLM-callable `greet` tool, a `/hello` command, and a `tool_call` interceptor that blocks `rm -rf` behind a confirm dialog — then hot-reload it without restarting.

### 📖 Docs reference

**[docs.bastani.ai/extensions](https://docs.bastani.ai/extensions) — "Extensions" (placement note):**

> **Placement for /reload:** Put extensions in `~/.atomic/agent/extensions/` (global) or `.atomic/extensions/` (project-local) for auto-discovery; legacy `.pi` paths remain supported. Use `atomic -e ./path.ts` only for quick tests. Extensions in auto-discovered locations can be hot-reloaded with `/reload`.

**[docs.bastani.ai/extensions](https://docs.bastani.ai/extensions) — "Quick Start":**

> Test with `--extension` (or `-e`) flag:
>
> ```bash
> atomic -e ./my-extension.ts
> ```

**[docs.bastani.ai/extensions](https://docs.bastani.ai/extensions) — "Extension Locations":**

> Extensions are auto-discovered from:
>
> | Location | Scope |
> |----------|-------|
> | `~/.atomic/agent/extensions/*.ts` | Global (all projects) |
> | `~/.atomic/agent/extensions/*/index.ts` | Global (subdirectory) |
> | `.atomic/extensions/*.ts` | Project-local |
> | `.atomic/extensions/*/index.ts` | Project-local (subdirectory) |

**[docs.bastani.ai/extensions](https://docs.bastani.ai/extensions) — "Events → tool_call":**

> Fired after `tool_execution_start`, before the tool executes. **Can block.** Use `isToolCallEventType` to narrow and get typed inputs.

**What it shows:** One TypeScript file adds an LLM-callable tool, a `/hello` command, and a `tool_call` interceptor.

**Setup (prompt-first)** — in the running Atomic session, have the agent write its own extension (body is the doc's Quick Start, verbatim):

```text
Create .atomic/extensions/my-extension.ts with EXACTLY the TypeScript content below, byte for byte:
```

```typescript
import type { ExtensionAPI } from "@bastani/atomic";
import { Type } from "typebox";

export default function (pi: ExtensionAPI) {
  // React to events
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify("Extension loaded!", "info");
  });

  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName === "bash" && event.input.command?.includes("rm -rf")) {
      const ok = await ctx.ui.confirm("Dangerous!", "Allow rm -rf?");
      if (!ok) return { block: true, reason: "Blocked by user" };
    }
  });

  // Register a custom tool
  pi.registerTool({
    name: "greet",
    label: "Greet",
    description: "Greet someone by name",
    parameters: Type.Object({
      name: Type.String({ description: "Name to greet" }),
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      return {
        content: [{ type: "text", text: `Hello, ${params.name}!` }],
        details: {},
      };
    },
  });

  // Register a command
  pi.registerCommand("hello", {
    description: "Say hello",
    handler: async (args, ctx) => {
      ctx.ui.notify(`Hello ${args || "world"}!`, "info");
    },
  });
}
```

**Steps**

1. `/reload` (or restart `atomic`) — the extension loads; the "Extension loaded!" notification proves it.
2. `/hello streamers` → notification "Hello streamers!".
3. Prompt: `Use the greet tool to greet the live stream audience.`
4. Prompt: `Run this exact bash command: rm -rf /tmp/does-not-exist-demo` → confirm dialog; pick No → the model receives "Blocked by user".
5. Edit the greeting text live, `/reload`, `/hello` again.

**What to point out:** Plain TypeScript with typed schemas — no manifest, no build step. `tool_call` handlers can block or mutate any tool call: policy, not just UI. Quick-test alternative: `atomic -e ./my-extension.ts`. Shipped guardrail examples: `permission-gate.ts`, `protected-paths.ts`, `confirm-destructive.ts`, `dirty-repo-guard.ts` (Appendix A.2 scripts the permission gate fully).

## Demo 3.2 — Custom full-screen TUI tool: interactive question component

**Source:** examples/extensions/question.ts (shipped, 285 lines); [docs.bastani.ai/extensions](https://docs.bastani.ai/extensions) ("Custom UI", `ctx.ui.custom()`). **Duration:** 6 min.

**Summary:** Beyond notifications: a tool mounts a full keyboard-driven TUI component (options list + inline editor) in place of the chat editor, using the same `ctx.ui.custom()` API behind the shipped Snake and Doom extensions.

### 📖 Docs reference

**[docs.bastani.ai/extensions](https://docs.bastani.ai/extensions) — "Custom UI → Custom Components":**

> For complex UI, use `ctx.ui.custom()`. This temporarily replaces the editor with your component until `done()` is called:

> The callback receives:
> - `tui` - TUI instance (for screen dimensions, focus management)
> - `theme` - Current theme for styling
> - `keybindings` - App keybinding manager (for checking shortcuts)
> - `done(value)` - Call to close component and return value

**[docs.bastani.ai/extensions](https://docs.bastani.ai/extensions) — "Interactive callback isolation":**

> Interactive Atomic sessions run the agent engine, extensions, tools, hooks, workflow code, and extension-owned render components in a supervised child process. The terminal host owns stdin and cached rendering, so a synchronous busy loop in one callback cannot stop keyboard handling, spinners, or render scheduling.

**[docs.bastani.ai/extensions](https://docs.bastani.ai/extensions) — "Examples Reference":**

> | Example | Description | Key APIs |
> |---------|-------------|----------|
> | `question.ts` | Width-wrapped single-question custom UI with option descriptions and typed answers | `registerTool`, `ui.custom` |

**examples/extensions/question.ts — header comment:**

> ```typescript
> /**
>  * Question Tool - Single question with options
>  * Full custom UI: options list + inline editor for "Type something..."
>  * Escape in editor returns to options, Escape in options cancels
>  */
> ```

**What it shows:** Extensions can register tools that mount full custom TUI components — options list with arrow-key navigation plus an inline editor.

**Setup (prompt-first)** — have the agent copy the shipped 285-line example instead of retyping it:

```text
Copy the shipped example extension into this repo:
cp /Users/tonystark/.cache/.bun/install/global/node_modules/@bastani/atomic/examples/extensions/question.ts .atomic/extensions/question.ts
```

**Steps**

1. `/reload`.
2. Prompt: `Use the question tool to ask me which database we should use for the demo app. Offer Postgres, SQLite, and Redis with one-line descriptions each.`
3. Navigate with ↑↓, show the "Type something." row opening an inline editor, Esc back, pick an option.
4. Point at the transcript: the tool call and result render with custom colored components (`renderCall`/`renderResult`), not raw JSON.

**What to point out:** `ctx.ui.custom()` gives extensions full keyboard-driven TUI components inside the agent loop — the shipped `snake.ts`, `space-invaders.ts`, and `doom-overlay/` use the same API. Extension UI runs in a supervised child process, so a buggy component cannot freeze the terminal.

## Demo 3.3 — Write a skill live and invoke it with `/skill:repo-stats`

**Source:** [docs.bastani.ai/skills](https://docs.bastani.ai/skills) (Locations, Skill Commands, SKILL.md format, frontmatter rules). **Duration:** 7 min.

**Summary:** Skills are progressive disclosure: only a name + description live in the system prompt, and the full SKILL.md plus a helper script load on demand when a task matches — or explicitly via `/skill:repo-stats`.

### 📖 Docs reference

**[docs.bastani.ai/skills](https://docs.bastani.ai/skills) — "How Skills Work":**

> 1. At startup, Atomic scans skill locations and extracts names and descriptions
> 2. The system prompt includes available skills in XML format per the [specification](https://agentskills.io/integrate-skills)
> 3. When a task matches, the agent uses `read` to load the full SKILL.md (models don't always do this; use prompting or `/skill:name` to force it)
> 4. The agent follows the instructions, using relative paths to reference scripts and assets
>
> This is progressive disclosure: only descriptions are always in context, full instructions load on-demand.

**[docs.bastani.ai/skills](https://docs.bastani.ai/skills) — "Skill Commands":**

> Skills register as `/skill:name` commands:
>
> ```bash
> /skill:brave-search           # Load and execute the skill
> /skill:pdf-tools extract      # Load skill with arguments
> ```
>
> Arguments after the command are appended to the skill content as `User: <args>`.

**[docs.bastani.ai/skills](https://docs.bastani.ai/skills) — "Frontmatter":**

> | Field | Required | Description |
> |-------|----------|-------------|
> | `name` | Yes | Max 64 chars. Lowercase a-z, 0-9, hyphens. Must match parent directory. |
> | `description` | Yes | Max 1024 chars. What the skill does and when to use it. |

**[docs.bastani.ai/skills](https://docs.bastani.ai/skills) — "Validation":**

> **Exception:** Skills with missing description are not loaded.

**[docs.bastani.ai/skills](https://docs.bastani.ai/skills) — "Using Skills from Other Harnesses":**

> To use skills from Claude Code or OpenAI Codex, add their directories to settings:
>
> ```json
> {
>   "skills": [
>     "~/.claude/skills",
>     "~/.codex/skills"
>   ]
> }
> ```

**What it shows:** Progressive disclosure — only the description sits in the system prompt; full instructions and a helper script load on demand.

**Setup (prompt-first)** — one prompt creates the whole skill:

`````text
Create a project-local skill:

1. .atomic/skills/repo-stats/SKILL.md with EXACTLY this content:

---
name: repo-stats
description: Summarize git repository activity with commit counts per author, busiest files, and recent-change hotspots. Use when the user asks who works on what, which files churn most, or for a repository activity report.
---

# Repo Stats

Produce a repository activity report.

## Usage

Run the helper script from this skill directory:

```bash
./scripts/stats.sh
```

It prints commits per author and the 10 most frequently changed files.
Present the output as a short markdown report with two sections:
"Top contributors" and "Churn hotspots". Note anything surprising.

2. .atomic/skills/repo-stats/scripts/stats.sh (make it executable) with EXACTLY this content:

#!/usr/bin/env bash
set -euo pipefail
echo "== Commits per author =="
git shortlog -sn --no-merges | head -20
echo
echo "== Most changed files (last 500 commits) =="
git log --pretty=format: --name-only -500 | grep -v '^$' | sort | uniq -c | sort -rn | head -10
`````

**Steps**

1. Restart `atomic` in any real git repo (use `~/Documents/demos/atomic` or this project).
2. Mention discovery: the skill's name and description now sit in the system prompt inventory.
3. Prompt: `Who are the main contributors to this repo and which files churn the most?` — the agent reads SKILL.md and runs the script.
4. Force-load form: `/skill:repo-stats` — skills register as `/skill:name` commands; args append as `User: <args>`.

**What to point out:** `name` must match the directory (lowercase-hyphen); a missing `description` means the skill will not load. Skills from other harnesses work — add `~/.claude/skills` to the `skills` array in settings. Packaging tie-in: drop `extensions/`, `skills/`, `prompts/`, `themes/` into a package with an `atomic` key in `package.json`, then `atomic install ./my-pkg` or `atomic install npm:@you/pkg`; try-before-install with `atomic -e ./my-pkg` ([docs.bastani.ai/packages](https://docs.bastani.ai/packages)).

## Demo 3.4 — Custom theme with live hot reload

**Source:** [docs.bastani.ai/themes](https://docs.bastani.ai/themes) (theme JSON verbatim; hot-reload behavior). **Duration:** 5 min.

**Summary:** The entire TUI is themeable from one JSON file with variables, schema-backed autocomplete, and instant hot reload of the active theme — finished with a crowd-pleaser where the agent designs a new theme on the spot.

### 📖 Docs reference

**[docs.bastani.ai/themes](https://docs.bastani.ai/themes) — "Creating a Custom Theme":**

> 3. Select the theme via `/settings`.
>
> **Hot reload:** When you edit the currently active custom theme file, Atomic reloads it automatically for immediate visual feedback.

**[docs.bastani.ai/themes](https://docs.bastani.ai/themes) — "Theme Format":**

> - `name` is required, must be unique, and must not contain `/`.
> - `vars` is optional. Define reusable colors here, then reference them in `colors` or `workingIndicator`.
> - `colors` must define all 51 required tokens.

> The `$schema` field enables editor auto-completion and validation.

**[docs.bastani.ai/themes](https://docs.bastani.ai/themes) — "Selecting a Theme":**

> Use `"theme": "light-theme/dark-theme"` for automatic mode. Atomic chooses the first theme when the terminal reports a light color scheme and the second theme for dark terminals, and it follows terminal color-scheme changes when supported.

**[docs.bastani.ai/themes](https://docs.bastani.ai/themes) — "Locations":**

> - Built-in: `dark`, `light`, `catppuccin-frappe`, `catppuccin-latte`, `catppuccin-macchiato`, `catppuccin-mocha`
> - Global: `~/.atomic/agent/themes/*.json` (legacy `~/.pi/agent/themes/*.json`)

**[docs.bastani.ai/themes](https://docs.bastani.ai/themes) — "Color Values":**

> Four formats are supported:
>
> | Format | Example | Description |
> |--------|---------|-------------|
> | Hex | `"#ff0000"` | 6-digit hex RGB |
> | 256-color | `39` | xterm 256-color palette index (0-255) |
> | Variable | `"primary"` | Reference to a `vars` entry |
> | Default | `""` | Terminal's default color |

**What it shows:** Full TUI theming from one JSON file; edits to the active theme reload instantly.

**Setup (prompt-first)** — prompt: `Create .atomic/themes/my-theme.json with EXACTLY the JSON below.`

```json
{
  "$schema": "https://raw.githubusercontent.com/bastani-inc/atomic/main/packages/coding-agent/src/modes/interactive/theme/theme-schema.json",
  "name": "my-theme",
  "vars": {
    "primary": "#00aaff",
    "secondary": 242
  },
  "colors": {
    "accent": "primary",
    "border": "primary",
    "borderAccent": "#00ffff",
    "borderMuted": "secondary",
    "success": "#00ff00",
    "error": "#ff0000",
    "warning": "#ffff00",
    "muted": "secondary",
    "dim": 240,
    "text": "",
    "thinkingText": "secondary",
    "selectedBg": "#2d2d30",
    "userMessageBg": "#2d2d30",
    "userMessageText": "",
    "customMessageBg": "#2d2d30",
    "customMessageText": "",
    "customMessageLabel": "primary",
    "toolPendingBg": "#1e1e2e",
    "toolSuccessBg": "#1e2e1e",
    "toolErrorBg": "#2e1e1e",
    "toolTitle": "primary",
    "toolOutput": "",
    "mdHeading": "#ffaa00",
    "mdLink": "primary",
    "mdLinkUrl": "secondary",
    "mdCode": "#00ffff",
    "mdCodeBlock": "",
    "mdCodeBlockBorder": "secondary",
    "mdQuote": "secondary",
    "mdQuoteBorder": "secondary",
    "mdHr": "secondary",
    "mdListBullet": "#00ffff",
    "toolDiffAdded": "#00ff00",
    "toolDiffRemoved": "#ff0000",
    "toolDiffContext": "secondary",
    "syntaxComment": "secondary",
    "syntaxKeyword": "primary",
    "syntaxFunction": "#00aaff",
    "syntaxVariable": "#ffaa00",
    "syntaxString": "#00ff00",
    "syntaxNumber": "#ff00ff",
    "syntaxType": "#00aaff",
    "syntaxOperator": "primary",
    "syntaxPunctuation": "secondary",
    "thinkingOff": "secondary",
    "thinkingMinimal": "primary",
    "thinkingLow": "#00aaff",
    "thinkingMedium": "#00ffff",
    "thinkingHigh": "#ff00ff",
    "thinkingXhigh": "#ff0000",
    "bashMode": "#ffaa00"
  }
}
```

**Steps**

1. In `atomic`, open `/settings` and select theme `my-theme`.
2. Prompt: `In .atomic/themes/my-theme.json, change the "primary" var to "#ff6600".` — the moment the edit lands, the TUI recolors (hot reload of the active theme). Manual alternative: edit the file in T3.
3. The TUI recolors immediately — editing the active custom theme hot-reloads it.
4. Show `"theme": "catppuccin-latte/catppuccin-mocha"` auto light/dark mode in settings.json.
5. Crowd-pleaser: prompt `Create a Gruvbox-inspired theme at ~/Documents/demos/atomic/.atomic/themes/gruvbox-live.json with all 51 required tokens, then tell me to select it in /settings.`

**What to point out:** `vars` + references keep palettes DRY; `$schema` gives editor autocomplete; six built-in themes; four color formats including terminal-default `""` and 256-color indices.

---

# Part 4 — Platform: headless, models, SDK (1:22–1:40)

## Demo 4.1 — Headless Atomic: print mode, pipes, and the JSON event stream

**Source:** [docs.bastani.ai/json](https://docs.bastani.ai/json); [docs.bastani.ai/usage](https://docs.bastani.ai/usage). **Duration:** 6 min.

**Summary:** Atomic as a Unix citizen — this one is deliberately shell-first because the CLI is the demo: pipe stdin into print mode, allowlist tools for a provably read-only reviewer, and stream the typed JSON event union into `jq`.

### 📖 Docs reference

**[docs.bastani.ai/json](https://docs.bastani.ai/json) — "JSON Event Stream Mode"** (lines 1–7):

> # JSON Event Stream Mode
>
> ```bash
> atomic --mode json "Your prompt"
> ```
>
> Outputs all session events as JSON lines to stdout. Useful for integrating Atomic into other tools or custom UIs.

**[docs.bastani.ai/json](https://docs.bastani.ai/json) — "Event Types"** (base `AgentEvent` union):

> ```typescript
> type AgentEvent =
>   // Agent lifecycle
>   | { type: "agent_start" }
>   | { type: "agent_end"; messages: AgentMessage[] }
>   // Turn lifecycle
>   | { type: "turn_start" }
>   | { type: "turn_end"; message: AgentMessage; toolResults: ToolResultMessage[] }
>   // Message lifecycle
>   | { type: "message_start"; message: AgentMessage }
>   | { type: "message_update"; message: AgentMessage; assistantMessageEvent: AssistantMessageEvent }
>   | { type: "message_end"; message: AgentMessage }
>   // Tool execution
>   | { type: "tool_execution_start"; toolCallId: string; toolName: string; args: any }
>   | { type: "tool_execution_update"; toolCallId: string; toolName: string; args: any; partialResult: any }
>   | { type: "tool_execution_end"; toolCallId: string; toolName: string; result: any; isError: boolean };
> ```

**[docs.bastani.ai/json](https://docs.bastani.ai/json) — "Output Format"**:

> Each line is a JSON object. The first line is the session header:
>
> ```json
> {"type":"session","version":3,"id":"uuid","timestamp":"...","cwd":"/path"}
> ```

**[docs.bastani.ai/usage](https://docs.bastani.ai/usage) — "CLI Reference › Modes"**:

> In print mode, Atomic also reads piped stdin and merges it into the initial prompt:
>
> ```bash
> cat README.md | atomic -p "Summarize this text"
> ```

**[docs.bastani.ai/usage](https://docs.bastani.ai/usage) — "CLI Reference › Tool Options" and "Examples"**:

> | Option | Description |
> |--------|-------------|
> | `--tools <list>`, `-t <list>` | Allowlist specific built-in, extension, and custom tools |

> ```bash
> # Read-only mode
> atomic --tools read,search,find,ls -p "Review the code"
> ```

**What it shows:** Atomic as a scriptable Unix citizen: pipe stdin in, stream structured events out, restrict tools for read-only automation.

**Steps** (run from `~/Documents/demos/atomic`)

1. Print mode with piped stdin:

   ```bash
   cat AGENTS.md | atomic -p "Summarize this text"
   ```

2. Attach files/images:

   ```bash
   atomic -p @greeter.ts "What does this file do?"
   ```

3. Read-only agent for CI-safe review:

   ```bash
   atomic --tools read,search,find,ls -p "Review the code"
   ```

4. JSON event stream + jq:

   ```bash
   atomic --mode json "List files" 2>/dev/null | jq -c 'select(.type == "message_end")'
   ```

5. Show the first raw line — the session header `{"type":"session","version":3,...}` — then scroll typed events: `agent_start`, `turn_start`, `message_update` deltas, `tool_execution_start/end`, `agent_end`.

**What to point out:** The event vocabulary is a published TypeScript union (`AgentSessionEvent`) — the same stream the SDK and RPC modes consume. `--tools` is an allowlist: a provably read-only agent. JSON mode keeps stdout JSONL-clean; diagnostics go to stderr.

## Demo 4.2 — Local models in one JSON file (Ollama) + provider tour

**Source:** [docs.bastani.ai/models](https://docs.bastani.ai/models); [docs.bastani.ai/providers](https://docs.bastani.ai/providers). **Duration:** 6 min.

**Summary:** One JSON file (global `~/.atomic/agent/models.json` — one of the two global-only pieces) adds any OpenAI-compatible local server; `/model` re-reads it on every open, so edits land without a restart. Ends with the `/login` subscription tour.

### 📖 Docs reference

**[docs.bastani.ai/models](https://docs.bastani.ai/models) — "Minimal Example"**:

> For local models (Ollama, LM Studio, vLLM), only `id` is required per model:
>
> ```json
> {
>   "providers": {
>     "ollama": {
>       "baseUrl": "http://localhost:11434/v1",
>       "api": "openai-completions",
>       "apiKey": "ollama",
>       "models": [
>         { "id": "llama3.1:8b" },
>         { "id": "qwen2.5-coder:7b" }
>       ]
>     }
>   }
> }
> ```
>
> The `apiKey` is required but Ollama ignores it, so any value works.

**[docs.bastani.ai/models](https://docs.bastani.ai/models) — "Minimal Example"** (`compat` quirks):

> Some OpenAI-compatible servers do not understand the `developer` role used for reasoning-capable models. For those providers, set `compat.supportsDeveloperRole` to `false` so Atomic sends the system prompt as a `system` message instead. If the server also does not support `reasoning_effort`, set `compat.supportsReasoningEffort` to `false` too.

**[docs.bastani.ai/models](https://docs.bastani.ai/models) — "Full Example"** (reload behavior):

> Atomic reloads the active agent directory's single `models.json` each time you open `/model`. Provider definitions, per-model overrides, dynamic catalogs, and isolated-engine model state are rebuilt from that fresh configuration, so edits take effect without restarting. Invalid edits report an error.

**[docs.bastani.ai/providers](https://docs.bastani.ai/providers) — "Subscriptions"**:

> Use `/login` in interactive mode, then select a provider:
>
> - ChatGPT Plus/Pro (Codex)
> - Claude Pro/Max
> - GitHub Copilot
> - OpenRouter
> - Kimi Code
> - xAI (Grok/X subscription)
> - Radius

**What it shows:** `~/.atomic/agent/models.json` adds any OpenAI-compatible local server; `/model` reloads it without restart.

**Setup (prompt-first)** — requires running Ollama with pulled models. Prompt: `Create ~/.atomic/agent/models.json with EXACTLY the JSON below.` (Global-only: Atomic reads models.json from the agent dir, not the project.)

```json
{
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434/v1",
      "api": "openai-completions",
      "apiKey": "ollama",
      "models": [
        { "id": "llama3.1:8b" },
        { "id": "qwen2.5-coder:7b" }
      ]
    }
  }
}
```

**Steps**

1. In `atomic`, open `/model` — the ollama entries appear alongside cloud models.
2. Select `llama3.1:8b`; prompt: `Write a haiku about terminals.` — fully local inference.
3. Edit `models.json` (add `"name": "Llama 3.1 8B (Local)"` to the model), reopen `/model` — Atomic reloads models.json each time `/model` opens; no restart.
4. Provider tour: `/login` shows subscription OAuth (ChatGPT Plus/Pro via Codex, Claude Pro/Max, GitHub Copilot, OpenRouter, Kimi Code, xAI, Radius); env vars like `ANTHROPIC_API_KEY` also work.
5. Mention `atomic --list-models` for scripted discovery.

**What to point out:** `apiKey` is required but Ollama ignores it — any value works. `compat.supportsDeveloperRole` / `supportsReasoningEffort` fix quirky local servers. Extensions can `pi.registerProvider()` to proxy or replace providers entirely ([docs.bastani.ai/custom-provider](https://docs.bastani.ai/custom-provider)). No Ollama on the machine? Show the file and the `/model` reload anyway; skip step 2.

## Demo 4.3 — Embed the agent: a 20-line SDK script

**Source:** [docs.bastani.ai/sdk](https://docs.bastani.ai/sdk) (Quick Start); examples/sdk/01-minimal.ts. **Duration:** 6 min.

**Summary:** The entire agent — tools, skills, extensions, sessions — is a library: ~20 lines of TypeScript create a session, subscribe to the same event stream as `--mode json`, and prompt it. Everything lives in `sdk-demo/` inside the one repo.

### 📖 Docs reference

**[docs.bastani.ai/sdk](https://docs.bastani.ai/sdk) — "Quick Start"**:

> ```typescript
> import { createAgentSession, ModelRuntime, SessionManager } from "@bastani/atomic";
>
> const modelRuntime = await ModelRuntime.create();
>
> const { session } = await createAgentSession({
>   sessionManager: SessionManager.inMemory(),
>   modelRuntime,
> });
>
> session.subscribe((event) => {
>   if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
>     process.stdout.write(event.assistantMessageEvent.delta);
>   }
> });
>
> await session.prompt("What files are in the current directory?");
> ```

**[docs.bastani.ai/sdk](https://docs.bastani.ai/sdk) — "Core Concepts › AgentSession"** (interface slice):

> ```typescript
> interface AgentSession {
>   // Send a prompt and wait for completion
>   prompt(text: string, options?: PromptOptions): Promise<void>;
>
>   // Queue messages during streaming
>   steer(text: string): Promise<void>;
>   followUp(text: string): Promise<void>;
> ```

> ```typescript
>   // Model and thinking control
>   setModel(model: Model): Promise<void>;
>   setThinkingLevel(level: ThinkingLevel): void;
>   cycleModel(): Promise<ModelCycleResult | undefined>;
>   cycleThinkingLevel(): ThinkingLevel | undefined;
> ```

**examples/sdk/01-minimal.ts** (header comment):

> ```typescript
> /**
>  * Minimal SDK Usage
>  *
>  * Uses all defaults: discovers skills, extensions, tools, context files
>  * from cwd and ~/.atomic/agent (legacy ~/.pi/agent also works). Model chosen from settings or first available.
>  */
> ```

**What it shows:** The whole agent — tools, skills, extensions, session persistence — as a library.

**Setup (prompt-first)** — checklist item 8 created `~/Documents/demos/atomic/sdk-demo`. Prompt: `Create sdk-demo/agent.ts with EXACTLY the TypeScript below.`

```typescript
import { createAgentSession, ModelRuntime, SessionManager } from "@bastani/atomic";

const modelRuntime = await ModelRuntime.create();

const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
  modelRuntime,
});

session.subscribe((event) => {
  if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
    process.stdout.write(event.assistantMessageEvent.delta);
  }
});

await session.prompt("What files are in the current directory?");
```

**Steps**

1. `cd ~/Documents/demos/atomic/sdk-demo && bun run agent.ts` (or `npx tsx agent.ts`) → streamed tokens from a full agent session. (The docs mandate no specific runner; both execute TS directly.)
2. Show the shipped example ladder: `ls /Users/tonystark/.cache/.bun/install/global/node_modules/@bastani/atomic/examples/sdk/` — 13 files from `01-minimal.ts` to `13-session-runtime.ts`.
3. Highlight the `AgentSession` surface from sdk.md: `prompt()`, `steer()`, `followUp()`, `subscribe()`, `setModel()`, `compact()`, `abort()`, `navigateTree()`.
4. Restriction knobs: `createAgentSession({ tools: ["read", "bash"] })` or `excludedTools: ["ask_user_question"]`.

**What to point out:** Same event union as `--mode json` — build a web UI on the identical stream. `SessionManager.inMemory()` vs persistent session files is one switch. README confirms the four modes: interactive, print/JSON, RPC, SDK.

---

# Part 5 — Subagents & Intercom (1:43–2:23)

All demos run in `~/Documents/demos/atomic`. Commit any dirt first: `git add -A && git commit -q -m wip`.

## Demo 5.1 — Natural-language delegation to a bundled specialist

**Source:** [docs.bastani.ai/subagents](https://docs.bastani.ai/subagents) ("Start with natural language", "Bundled agents"). **Duration:** 4 min.

**Summary:** Say what you want mapped and Atomic decides whether to delegate, which bounded specialist fits, and how to run it — a fresh-context, read-only child streams progress in the foreground and returns cited findings. Includes the explicit `subagent(...)` form and the one-file custom agent.

### 📖 Docs reference

**[docs.bastani.ai/subagents](https://docs.bastani.ai/subagents) — "Start with natural language"**

> ```text
> Map the authentication flow with focused subagents before we change it.
> ```
>
> Atomic decides whether delegation adds value, which specialist fits each bounded part, and whether the work should run as a single child, parallel group, chain, foreground run, or selective background run.

**[docs.bastani.ai/subagents](https://docs.bastani.ai/subagents) — "Bundled agents"**

> | Agent | Use it for | Edit files? |
> |---|---|---|
> | `codebase-locator` | Find relevant files, directories, tests, configs, and docs for a topic. | No |
> | `codebase-analyzer` | Explain how specific code works and trace data flow with file references. | No |
> | `codebase-pattern-finder` | Find similar implementations, conventions, and test examples to model after. | No |
> | `codebase-research-locator` | Locate prior `research/` and `specs/` documents related to the task. | No |
> | `codebase-research-analyzer` | Extract decisions, constraints, and still-relevant conclusions from prior local docs. | No |
> | `codebase-online-researcher` | Research official docs, ecosystem behavior, and open-source source references online; it may persist reusable research notes. | Research notes only |
> | `debugger` | Reproduce a concrete failure, prove its root cause, apply the smallest in-scope fix, and rerun the failing scenario. | Yes |
> | `code-simplifier` | Simplify recently changed code under its behavior-preservation “doors” rubric. | Yes |
> | `worker` | Implement an approved task or handoff, validate the narrow change, and escalate product, architecture, or scope decisions to its supervisor. | Yes |

**[docs.bastani.ai/subagents](https://docs.bastani.ai/subagents) — "Nested and fanout boundaries"**

> - Normal child sessions do not receive the `subagent` tool or the parent-only subagents skill.
> - The recursion guard defaults to a hard maximum of five delegated subagent levels. `ATOMIC_SUBAGENT_MAX_DEPTH`, extension `config.maxSubagentDepth`, and agent frontmatter can choose a lower value from `0` to `5`; higher values are clamped.

**[docs.bastani.ai/subagents](https://docs.bastani.ai/subagents) — "Custom agents" / "Context and execution modes"**

> | Scope | Path |
> |---|---|
> | User | `~/.atomic/agent/agents/**/*.md` |
> | Project | `.atomic/agents/**/*.md` |

> Single-agent calls also accept `reads: string[] | false`. Atomic prepends those files as read context for foreground and background execution through the same path resolver, including `/run agent[reads=a.md+b.md]`.

**What it shows:** Atomic decides on its own whether and how to delegate; a bounded read-only specialist runs with fresh context and returns cited findings.

**Steps**

1. T1: `cd ~/Documents/demos/atomic && atomic`
2. Prompt: `Map the validate/fetchUser flow with focused subagents before we change it.`
3. Narrate the foreground streaming: child progress appears in the conversation; the parent blocks until the result returns.
4. Explicit form: `Use subagent({ agent: "codebase-analyzer", task: "Trace the validate() data flow with file references." }) and summarize.`

**What to point out:** The bundled agent table (locator/analyzer/pattern-finder/debugger/worker…); read-only agents cannot edit; children never get the `subagent` tool (nested-delegation guard, max depth 5, `ATOMIC_SUBAGENT_MAX_DEPTH`); `@bastani/subagents` is bundled — no install. Custom agents are one Markdown file — you pre-created `.atomic/agents/strict-inspector.md`; if time allows, run `Run the strict-inspector agent on the current diff.` and show the documented reads form `/run strict-inspector[reads=notes.md+plan.md]`.

## Demo 5.2 — Worktree-isolated parallel implementation

**Source:** [docs.bastani.ai/subagents](https://docs.bastani.ai/subagents) ("Context and execution modes": `worktree: true`). **Duration:** 8 min.

**Summary:** Two editing children modify the same repository concurrently without clobbering each other: `worktree: true` gives each an isolated git worktree and returns a per-child diff to merge deliberately.

### 📖 Docs reference

**[docs.bastani.ai/subagents](https://docs.bastani.ai/subagents) — "Context and execution modes"**

> - `context: "fresh"` starts a separate child with only the task and selected agent context.
> - `context: "fork"` creates a real branched child session from the parent session leaf. It fails fast if the parent session cannot be forked; it does not silently downgrade to fresh context.
>
> For adversarial review or research, prefer fresh context so the specialist inspects the repository directly. Use forked context when a writer needs the parent conversation history in a separate branch.
>
> For parallel implementation work, `worktree: true` can give each child an isolated git worktree so concurrent edits do not clobber each other.

> Top-level parallel calls support up to 50 subagents after expanding each task's optional `count`. The extension's `parallel.maxTasks` setting defaults to 50 and can enforce a lower task limit; `parallel.concurrency` independently controls how many of those children run at once.

**[docs.bastani.ai/subagents](https://docs.bastani.ai/subagents) — "Foreground supervisor coordination"**

> Run-owned worktrees remain attached until every detached child closes, then Atomic captures their diffs before cleanup.

**What it shows:** Two editing children changing the same repo concurrently without clobbering, each producing its own diff.

**Steps**

1. Confirm clean git state (pre-stream item 10).
2. Prompt: `Run two worker subagents in parallel with worktree isolation: one adds a null-check to validate() in src-client.ts, the other adds a timeout to fetchUser(). Use worktree: true so their edits cannot clobber each other, and show me each child's diff when done.`
3. In T3 during the run: `git worktree list` — show the isolated worktrees live.
4. Show the per-child diffs in the result.

**What to point out:** Run-owned worktrees stay attached until every child closes; Atomic captures diffs before cleanup. `context: "fresh"` vs `context: "fork"` (fork is a real branched child from the parent session leaf and fails fast rather than silently downgrading). Up to 50 parallel children; `parallel.concurrency` bounds simultaneity.

## Demo 5.3 — MANDATORY: Two-terminal planner–worker intercom coordination

**Source:** [docs.bastani.ai/intercom](https://docs.bastani.ai/intercom) ("Quick Start", "Coordination Patterns", "send vs ask vs reply"). **Duration:** 10 min.

**Summary:** The centerpiece coordination demo: two live sessions in side-by-side herdr terminals name themselves `planner` and `worker`, then exchange fire-and-forget `send`s, a blocking `ask` that parks the worker until the planner answers, and a snippet attachment — all driven by plain prompts.

### 📖 Docs reference

**[docs.bastani.ai/intercom](https://docs.bastani.ai/intercom) — "Quick Start" → "From the Agent"**

> ```typescript
> // List active sessions
> intercom({ action: "list" })
> // → **Current session:**
> // → • executor (20d43841) — ~/projects/api (claude-sonnet-4) [self, idle]
> // → **Other sessions:**
> // → • research (6332faab) — ~/projects/api (claude-sonnet-4) [same cwd, thinking]
> ```

> ```typescript
> // Send with attachments (code snippets, files, or context)
> intercom({
>   action: "send",
>   to: "worker",
>   message: "Here's the fix:",
>   attachments: [{
>     type: "snippet",
>     name: "auth.ts",
>     language: "typescript",
>     content: "function validate(user: User) { ... }"
>   }]
> })
> ```

**[docs.bastani.ai/intercom](https://docs.bastani.ai/intercom) — "Coordination Patterns"**

> ```
> # Terminal 1                    # Terminal 2
> /name planner                   /name worker
> ```

> | Pattern | Action | Why |
> |---------|--------|-----|
> | **Task delegation** | Planner uses `send` | Fire-and-forget. Planner doesn't need to wait for an ack. |
> | **Clarification request** | Worker uses `ask` | Worker needs the answer to proceed. Blocks until reply. |
> | **Discovery escalation** | Worker uses `ask` | Worker needs approval before changing course. |
> | **Completion report** | Worker uses `ask` | Planner might have follow-up instructions or the next task. |

**[docs.bastani.ai/intercom](https://docs.bastani.ai/intercom) — "send vs ask vs reply"**

> **`ask`** sends the message and blocks until the recipient responds (10-minute timeout). The reply comes back as the tool result, so the agent continues in the same turn with full context.

**What it shows:** Two live `atomic` sessions messaging each other: fire-and-forget delegation, a blocking `ask` answered from the other terminal, threaded `reply`.

**Setup:** T1 and T2 both in `~/Documents/demos/atomic`, each running `atomic`.

**Steps**

1. T1: `/name planner`   T2: `/name worker`
2. T1 prompt: `List active intercom sessions.` → backed by `intercom({ action: "list" })`; show name, short ID, cwd, model, live status (`idle` / `thinking` / `tool:<name>`).
3. T1 prompt: `Send this to worker over intercom: "Task-1: Add a null check to validate() in src-client.ts. Ask me if anything's unclear."`
4. T2: the message appears inline with sender info and a reply hint. Then prompt: `Ask planner over intercom: "Should validate() return false for null email, or throw?" and wait for the answer before editing.`
5. T1 prompt: `Reply over intercom: "Return false for null email — never throw from validate()."`
6. T2: the reply returns as the `ask` tool result in the same turn; the worker edits the file. Show the diff.
7. Bonus: T1 press **ALT+M** (or `/intercom`) — the human session-picker + compose overlay; send a manual message.
8. Bonus: T1 prompt: `Send worker an intercom message "Here's the fix:" with a snippet attachment named auth.ts containing the corrected validate() body.` — the documented `attachments: [{ type: "snippet", name, language, content }]` shape.

**What to point out:** `ask` blocks with a 10-minute timeout and one pending ask per session ("Already waiting for a reply" on races). `send` is fire-and-forget; `confirmSend: true` in `~/.atomic/agent/intercom/config.json` adds an approval dialog. Messages persist in session history as `intercom_sent`/`intercom_received`. The broker auto-spawns over a local Unix socket / named pipe and exits 5 s after the last session disconnects; same-machine only. `/skill:intercom` bundles copy-paste patterns.

## Demo 5.4 — Subagent escalation to a human supervisor: `contact_supervisor`

**Source:** [docs.bastani.ai/intercom](https://docs.bastani.ai/intercom) ("Subagent Escalation: contact_supervisor", "Structured Interview Replies"); [docs.bastani.ai/subagents](https://docs.bastani.ai/subagents) ("Foreground supervisor coordination"). **Duration:** 10 min.

**Summary:** Delegated children get a supervisor hotline: a worker subagent blocks mid-run on `need_decision`, the human answers through intercom `reply`, and the child continues with the decision as its tool result — plus a structured `interview_request` answered with fenced JSON.

### 📖 Docs reference

**[docs.bastani.ai/intercom](https://docs.bastani.ai/intercom) — "Subagent Escalation: contact_supervisor" → "When the Tool Appears"**

> `contact_supervisor` only registers when the subagent runtime sets all of these environment variables:
>
> - `ATOMIC_SUBAGENT_ORCHESTRATOR_TARGET` — the supervisor session name or ID
> - `ATOMIC_SUBAGENT_RUN_ID` — the run identifier
> - `ATOMIC_SUBAGENT_CHILD_AGENT` — the agent type
> - `ATOMIC_SUBAGENT_CHILD_INDEX` — the child index within the run

**[docs.bastani.ai/intercom](https://docs.bastani.ai/intercom) — "The Three Reasons"**

> | Reason | Behavior | Use When |
> |--------|----------|----------|
> | `need_decision` | Sends a formatted ask to the supervisor and blocks until it replies (10-minute timeout) | The subagent is blocked, uncertain, needs approval, or faces a product/API/scope decision |
> | `interview_request` | Sends structured questions and blocks until the supervisor replies | The subagent needs multiple machine-readable answers from the supervisor in one exchange |
> | `progress_update` | Fire-and-forget update to the supervisor | Meaningful progress or unexpected discoveries that change the plan |

**[docs.bastani.ai/intercom](https://docs.bastani.ai/intercom) — "What the Supervisor Sees"**

> ```
> **From subagent-worker-78f659a3-1**
>
> Subagent needs a supervisor decision.
> Run: 78f659a3
> Agent: worker
> Child index: 0
>
> Which API should I use?
> ```

**[docs.bastani.ai/intercom](https://docs.bastani.ai/intercom) — "Structured Interview Replies"**

> ```json
> {
>   "responses": [
>     { "id": "api", "value": "Stable API" },
>     { "id": "constraints", "value": "Keep the public error shape unchanged." }
>   ]
> }
> ```

**[docs.bastani.ai/subagents](https://docs.bastani.ai/subagents) — "Foreground supervisor coordination"**

> Intercom connection remains tool-driven. Foreground and background launches do not import the heavy Intercom runtime or connect either the parent or bridged child automatically. If live child-to-parent coordination is needed, the parent model should invoke `intercom({ action: "status" })` before launch; the child then connects on its first `contact_supervisor` or `intercom` call.

**What it shows:** A delegated child blocks on `need_decision` mid-run, the human answers via `reply`, the child continues — plus a structured `interview_request`.

**Steps** (T1, the `planner` session)

1. Prompt: `Check intercom status.` — connects the parent so it can authorize the child's supervisor capability (documented requirement; do not skip).
2. Prompt: `Delegate to the worker subagent: "Harden validate() in src-client.ts. Before choosing between returning false or throwing on null email, you MUST escalate with contact_supervisor reason need_decision and wait for my answer. Then implement exactly what I decide."`
3. The escalation arrives formatted with run metadata (`Run: <id>`, `Agent: worker`, `Child index: 0`). Answer: `Reply over intercom: "Return false. Do not throw."`
4. The child receives the answer as its tool result and finishes; show the edit.
5. Optional structured variant — prompt: `Delegate to the worker subagent: "Before editing anything, send me a contact_supervisor interview_request titled 'Hardening choices' with two questions: a single-choice question id 'null' asking 'How should null email be handled?' with options ['Return false','Throw'], and a text question id 'tests' asking 'Which test command should I run?'. Wait for my structured answers, then implement."` Reply with the documented fenced JSON:

   ```json
   {
     "responses": [
       { "id": "null", "value": "Return false" },
       { "id": "tests", "value": "npx tsc --noEmit" }
     ]
   }
   ```

**What to point out:** Three reasons — `need_decision` (blocking), `interview_request` (blocking; question shape `{ id, type, question, options?, context? }`, types `single|multi|text|image|info`), `progress_update` (fire-and-forget). Normal sessions never see `contact_supervisor` — it registers only when the runtime sets the `ATOMIC_SUBAGENT_*` orchestrator env vars. Valid structured replies land in `details.structuredReply`. Foreground release lets the child's ask detach from the blocking parent tool call so parent and child cannot deadlock. This behavior depends on the child following task-text instructions (the documented pattern) — rehearsed pre-stream.

## Demo 5.5 — Intercom context handoff between sessions

**Source:** [docs.bastani.ai/intercom](https://docs.bastani.ai/intercom) ("The intercom Tool" — Actions table; "Attachments"; "How Connection Works"; "Receiving Messages"). **Duration:** 8 min.
**What it shows:** A context-rich session packages what it knows into intercom attachments (`context` + `snippet`) and hands it to a brand-new session in another pane, which then answers project questions without re-reading the repo.

**Summary:** The "it should just work" handoff: open a brand-new session in another pane, have it start an intercom session (status + list registers it with the broker), then tell the context-rich session to hand off its context — one message with `context` + `snippet` attachments — and the fresh session takes over without reading a single file.

### 📖 Docs reference

**[docs.bastani.ai/intercom](https://docs.bastani.ai/intercom) — "The intercom Tool" → "Actions"**

> | Action | Behavior |
> |--------|----------|
> | `list` | Returns the current session plus other active intercom-connected sessions with name, short ID, working directory, model, and live status (`idle`, `thinking`, or `tool:<name>`, derived from lifecycle events). Every displayed short ID is a valid target. |
> | `send` | Fire-and-forget delivery. Requires `to` and `message`; returns delivery confirmation or the delivery-failure reason. Cannot message the current session. |
> | `ask` | Sends a message and blocks until the recipient replies (10-minute timeout). The reply is returned as the tool result, so the agent continues in the same turn. |
> | `reply` | Replies to the intercom-triggered message of the current turn; otherwise falls back to the single unresolved inbound ask. With multiple pending asks, pass `to` or inspect with `pending` first. |
> | `pending` | Lists unresolved inbound asks with sender, message ID, elapsed time, and a short preview. |
> | `status` | Shows connection status, session ID, and the total count of active sessions. |

**[docs.bastani.ai/intercom](https://docs.bastani.ai/intercom) — "Attachments"**

> `send`, `ask`, and `reply` accept an `attachments` array of `{ type, name, content, language? }` objects where `type` is `"file"`, `"snippet"`, or `"context"`. Attachment content is included in the recipient's agent-visible message body. Attachments are supported in the protocol but not in the ALT+M compose overlay.

**[docs.bastani.ai/intercom](https://docs.bastani.ai/intercom) — "How Connection Works"**

> Name sessions with `/name` so they can target each other (for example `/name planner` and `/name worker`).

> The session list only shows intercom-connected sessions, not every open Atomic process on the machine.

**[docs.bastani.ai/intercom](https://docs.bastani.ai/intercom) — "Receiving Messages"**

> Attachment content is included in the agent-visible body, and messages are rendered inline and stored in Atomic session history.

**Setup:** T1 is the context-rich `planner` session from Demos 5.3/5.4 (it knows `validate()`/`fetchUser()` and the null-email decision). Open a new terminal pane, T3.

**Steps**

1. T3: `cd ~/Documents/demos/atomic && atomic` — a fresh session with zero context. First: `/name fresh` (documented: name sessions with `/name` so they can target each other).
2. T3 prompt: `Start an intercom session: check intercom status and list the active intercom sessions.` → backed by `intercom({ action: "status" })` and `intercom({ action: "list" })`. Invoking an intercom surface is what connects and registers the session with the broker — connections are lazy and tool-driven, so this step is required before anyone can target `fresh`.
3. T1 prompt: `List intercom sessions.` — `fresh` now appears with name, short ID, cwd, model, live status.
4. T1 prompt: `Hand off your project context to the session named "fresh" over intercom: send one message summarizing this repo and our decisions, with a context attachment named "project-briefing" containing the full handoff notes (what validate() and fetchUser() do, the null-email decision from earlier, remaining tasks), and a snippet attachment named "src-client.ts" (language typescript) containing the current validate() body.` — the documented `attachments: [{ type, name, content, language? }]` shape with `type: "context"` and `type: "snippet"`.
5. T3: the handoff arrives inline with sender info and a reply hint; attachment content is included in the agent-visible message body.
6. T3 prompt: `Using only the handed-off context — do not read any files — what does validate() return for a null email, and why was throwing rejected? What tasks remain?` — the fresh session answers from the transferred context alone.
7. Bonus: T3 prompt: `Ask planner over intercom: "Anything else I should know before I take over this work?"` — a blocking `ask` (10-minute timeout). T1 prompt: `Reply over intercom: "Run npx tsc --noEmit after any edit; nothing else pending."` — T3 receives the reply as its tool result and continues in the same turn.

**What to point out:** Three attachment types — `file`, `snippet`, `context` — travel on `send`, `ask`, and `reply`; content lands in the recipient's agent-visible body (protocol only, not the ALT+M compose overlay). The fresh session appeared in `list` only after it invoked an intercom surface: connections are lazy and tool-driven, and the list shows intercom-connected sessions, not every open Atomic process. The handoff is auditable — both sides persist `intercom_sent`/`intercom_received` entries in session history. Same machine only, over the local broker socket/pipe.

---

# Part 6 — Workflows finale (2:23–2:58)

All demos run in `~/Documents/demos/atomic`. Workflow files go in `.atomic/workflows/`.

## Demo 6.1 — Builtin tour: launch `fan-out-and-synthesize` from a slash command

**Source:** [docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) (Built-in Workflows, Running Workflows, Workflow Commands). **Duration:** 6 min.

**Summary:** Tour the nine bundled workflows, launch `fan-out-and-synthesize` from a slash command, and fly around the live DAG viewer — background-first execution, strict input validation, attachable stages.

### 📖 Docs reference

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "Built-in Workflows"**:

> Atomic bundles nine workflows: six reusable control-flow patterns, two autonomous implementation loops, and one end-to-end design workflow. They are available in every session. Use `/workflow list` to confirm the current set and `/workflow inputs <name>` to inspect a contract before launch.
>
> | Workflow | What it does | When to use |
> |---|---|---|
> | `classify-and-act` | Structured classifier → deterministic category action; low confidence can fall back to human selection. | Route mixed requests to isolated category-specific work. |
> | `fan-out-and-synthesize` | Structured partition → bounded parallel artifact branches → synthesis barrier. | Split independent slices, including repository research, and merge evidence. |
> | `adversarial-verification` | Worker → fresh rubric verifiers → reducer → bounded repair loop. | Independently prove or reject a candidate. |
> | `generate-and-filter` | Candidate fan-out → rubric dedupe/filter → optional judge → shortlist. | Explore more options than needed and keep the strongest distinct few. |
> | `tournament` | Whole-task attempts → balanced pairwise judges → bracket reducer. | Compare subjective or approach-sensitive solutions. |
> | `loop-until-done` | Durable ledger → iteration/evaluator loop → success or inspectable bound exhaustion. | Continue until explicit evidence proves completion. |
> | `goal` | Durable goal ledger → bounded sub-agent orchestration → parallel review → deterministic reducer. | Autonomous implementation that needs receipts and reviewer-gated completion. |
> | `ralph` | Prompt refinement → codebase research → delegated implementation → multi-model review loop. | Research-first autonomous implementation with bounded review and repair. |
> | `open-claude-design` | Guided discovery and reference research → HTML generation → feedback loop → export and handoff. | UI, page, component, theme, or design-token work. |

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "Running Workflows"** (background launch and strict validation):

> From interactive chat, named workflow launches run in the background so the parent chat stays available. Run `/workflow connect <run>` to see agents working and chat with and steer each stage.

> Runtime validation is strict: unknown input keys, missing required values, type mismatches, and invalid `select` choices fail before a named workflow run starts or before a child workflow starts.

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "Workflow run identifiers and the BACKGROUND panel"**:

> every command and workflow-tool action that accepts `runId` requires the **full 36-character UUID**, exactly as displayed. Typed prefixes are not accepted, and neither is a 32-character dashless form.

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "Workflow Commands"** (surface behavior):

> **Hierarchy chord** - `ctrl+x` is the workflow hierarchy chord: in an attached stage chat it means **return to graph**, and in the graph it means **return to main chat**.

**What it shows:** Nine bundled workflows, strict input validation, background execution, live graph viewer.

**Steps**

1. `/workflow list`
2. `/workflow inputs fan-out-and-synthesize`
3. `/workflow fan-out-and-synthesize prompt="Map this repository by independent subsystem and synthesize cited findings" max_branches=4`
4. Note the full 36-char run id returned; watch the BACKGROUND panel tick.
5. `/workflow connect <run-id>` (or press F2). Arrow-key around the graph; Enter on a node to attach; `ctrl+o` expands tool detail; `ctrl+x` returns to graph, then to main chat.
6. `/workflow status`

**What to point out:** Partition → bounded parallel branches → synthesis barrier. Validation rejects unknown keys and uncoerced types before launch. Background-first launch keeps chat usable. Run ids are never truncated by design. The other builtins: `classify-and-act`, `adversarial-verification`, `generate-and-filter`, `tournament`, `loop-until-done`, `goal`, `ralph`, `open-claude-design`.

## Demo 6.2 — Hand-write a workflow live: `explain-file`

**Source:** [docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) (Quick Start file body verbatim; Workflow Locations). **Duration:** 6 min.

**Summary:** A complete custom workflow is ~25 lines of plain TypeScript in `.atomic/workflows/` — the agent writes it, `/workflow reload` picks it up via jiti with no build step, and it runs immediately.

### 📖 Docs reference

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "Quick Start › Or hand-write the TypeScript"** (the file body in Setup below is verbatim from this section):

> Run `/workflow reload` or restart Atomic, then list and run it:
>
> ```text
> /workflow list
> /workflow inputs explain-file
> /workflow explain-file path="src/index.ts"
> ```

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "Workflow Locations"**:

> | Location | Scope | Notes |
> |----------|-------|-------|
> | `.atomic/extensions/workflow/config.json` | Project | `workflows.<name>.path`; project entries override global entries |
> | `.atomic/workflows/*.{ts,js,mjs,cjs}` | Project | Legacy `.pi/workflows/` is also checked |
> | `~/.atomic/agent/extensions/workflow/config.json` | Global | `workflows.<name>.path` for user-wide configured paths |
> | `~/.atomic/agent/workflows/*.{ts,js,mjs,cjs}` | Global | Legacy `~/.pi/agent/workflows/` is also checked |
> | Installed Atomic packages | Package | Uses package metadata or conventional `workflows/` directories |
> | Bundled workflows | Built-in | Shipped with `@bastani/workflows` |

> Atomic loads workflow files with [jiti](https://github.com/unjs/jiti), so TypeScript works without compilation.

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "Reloading workflow resources"**:

> Reload is safe while workflows are running: existing runs keep the definition and runtime snapshot they started with, while subsequent list/get/inputs/help/completion/invocation calls use the newly published registry.

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "How types flow" and "Running Workflows"** (picker):

> - TypeScript checks the `run` return against your declared outputs at **compile time** (a missing required output or wrong value type is a TypeScript error), and TypeBox `Value` checks it at **runtime** (rejecting undeclared keys and enforcing the declared shape recursively).

> In the TUI, `/workflow <name>` opens an inline input picker when the workflow declares inputs and either no arguments were supplied or required inputs are missing.

**What it shows:** A complete custom workflow is ~25 lines of plain TypeScript; hot reload without restart.

**Setup (prompt-first)** — prompt: `Create .atomic/workflows/explain-file.ts with EXACTLY the TypeScript below.`

```ts
import { workflow } from "@bastani/workflows";
import { Type } from "typebox";

export default workflow({
  name: "explain-file",
  description: "Explain a file with tracked workflow stages.",
  inputs: {
    path: Type.String({ description: "File path to explain." }),
  },
  outputs: {
    explanation: Type.String({
      description: "Explanation of the file's purpose, risks, and key symbols.",
    }),
  },
  run: async (ctx) => {
    const explanation = await ctx.task("explain", {
      prompt: `Read ${String(ctx.inputs.path)} and explain purpose, risks, and key symbols.`,
      context: "fresh",
    });

    return { explanation: explanation.text };
  },
});
```

**Steps**

1. The agent wrote the file in Setup (or type it live if you dare; backup pre-staged per checklist). Walk through its ~25 lines.
2. `/workflow reload`
3. `/workflow list` — `explain-file` now appears.
4. `/workflow inputs explain-file`
5. `/workflow explain-file path="src-client.ts"`
6. Run `/workflow explain-file` with **no** args to show the inline input picker (Escape cancels; `--no-picker` skips it).

**What to point out:** TypeBox schemas drive the picker and strict validation; `outputs` is a contract, not a convention (returning an undeclared key fails the run); jiti loads TS with no build; reload rescans in-process while running workflows keep their old definition. Bonus if ahead of schedule: Atomic can author workflows for you from a natural-language description (Appendix A.8).

## Demo 6.3 — Human-in-the-loop: `release-gate` with `ctx.ui.select/confirm/input`

**Source:** [docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) (ctx.ui API, awaiting-input nodes, `ctx.exit`, headless failure mode). **Duration:** 7 min.

**Summary:** Workflows can stop mid-code and wait for a human: `ctx.ui.select/confirm/input` suspend as awaiting-input graph nodes, `ctx.exit` ends a run early with declared partial outputs, and the same file fails with a named error in headless mode — HIL is interactive by design.

### 📖 Docs reference

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "`ctx.ui`" and primitive signatures**:

> Human-in-the-loop primitives that suspend at the callsite. They create awaiting-input graph nodes at runtime; see [Lifecycle Notices and Human Input](#lifecycle-notices-and-human-input).
>
> ```typescript
> ctx.ui.input(prompt: string): Promise<string>;
> ctx.ui.confirm(message: string): Promise<boolean>;
> ctx.ui.select<T extends string>(message: string, options: readonly T[]): Promise<T>;
> ```
>
> Prompts for one string-literal option. An empty options array throws before Atomic creates a prompt node.

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "Lifecycle Notices and Human Input"**:

> Human input is runtime-only: call `ctx.ui.input`, `ctx.ui.confirm`, `ctx.ui.select`, `ctx.ui.editor`, or `ctx.ui.custom<T>` when the workflow needs a decision. No builder-level declaration is required or supported.

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "Workflow Commands"**:

> Human-in-the-loop prompts appear as awaiting-input nodes in the workflow graph, not as ordinary chat modals — see [Lifecycle Notices and Human Input](#lifecycle-notices-and-human-input) for how to find and answer them.

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "`ctx.exit(options?)`"**:

> ```typescript
> ctx.exit(options?: WorkflowExitOptions<TOutputs>): never;
> ```
>
> Intentionally ends the current run from any call depth. `status` defaults to `"completed"`; the runtime persists and displays `reason`, and `outputs` may provide only declared, schema-valid, serializable output keys.

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "Running Workflows"** (headless failure mode):

> If you copy a HIL workflow example into a headless session, it can pass dispatch and then fail when execution reaches the prompt with an error such as `atomic-workflows: interactive ctx.ui.confirm is unavailable in headless (non-interactive) mode; run the workflow in interactive mode or remove the interactive prompt from this stage` (the primitive name varies, including `ctx.ui.custom`). Run those workflows interactively, or guard/remove runtime `ctx.ui.*` calls before using headless mode.

**What it shows:** Workflows suspend mid-code for human decisions; prompts render as awaiting-input graph nodes, not chat modals.

**Setup (prompt-first)** — prompt: `Create .atomic/workflows/release-gate.ts with EXACTLY the TypeScript below.`

```ts
import { workflow } from "@bastani/workflows";
import { Type } from "typebox";

export default workflow({
  name: "release-gate",
  description: "Summarize pending changes, then gate the release decision on human input.",
  inputs: {
    base: Type.String({ description: "Git ref to diff against.", default: "origin/main" }),
  },
  outputs: {
    decision: Type.String({ description: "ship or hold." }),
    risk: Type.String({ description: "Selected risk level." }),
    note: Type.Optional(Type.String({ description: "Release note supplied by the human." })),
    summary: Type.String({ description: "Model-written change summary." }),
  },
  run: async (ctx) => {
    const base = String(ctx.inputs.base);

    const summary = await ctx.task("summarize-changes", {
      prompt: `Run git diff --stat ${base} and summarize what changed in this checkout: features, fixes, and anything risky. Keep it under 15 lines.`,
      context: "fresh",
    });

    const risk = await ctx.ui.select("How risky does this change set look?", [
      "low",
      "medium",
      "high",
    ]);

    const ship = await ctx.ui.confirm(`Risk marked ${risk}. Ship this release?`);
    if (!ship) {
      return ctx.exit({
        status: "blocked",
        reason: "Presenter held the release.",
        outputs: { decision: "hold", risk, summary: summary.text },
      });
    }

    const note = await ctx.ui.input("One-line release note for the changelog:");
    return { decision: "ship", risk, note, summary: summary.text };
  },
});
```

**Steps**

1. Create the file; `/workflow reload`.
2. `/workflow release-gate base="HEAD~1"` (the repo has no `origin/main`; any real local ref works).
3. When the run pauses, show the awaiting-input node: `/workflow connect <run-id>` — the `AWAITING INPUT` banner shows the full run id.
4. Press Enter on the focused node and answer the select, confirm, and input prompts in sequence.
5. Re-run and answer "No" at the confirm to show `ctx.exit({ status: "blocked" })` returning partial declared outputs.

**What to point out:** HIL is runtime-only — no declaration needed. Prompts inside nested children surface in the same expanded parent graph. Agents can answer programmatically with `workflow({ action: "send", delivery: "answer" })`. The same file fails cleanly in headless mode with a named error — HIL is interactive-only by design. Compare with `ask_user_question` from Demo 1.3: same idea, durable-workflow edition.

## Demo 6.4 — Durability: quit a live run, resume it later

**Source:** [docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) (control commands, durability, resume picker). **Duration:** 6 min.

**Summary:** Kill a live workflow on purpose and get it back: runs checkpoint to DBOS/Postgres, `/workflow quit` pauses gracefully, and `/workflow resume` — even from a fresh Atomic process — replays completed checkpoints instead of re-running them.

### 📖 Docs reference

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "Workflow Commands"** (common controls):

> ```text
> /workflow status                       # list retained active and terminal runs
> /workflow connect <run-id>             # graph viewer, including terminal runs
> /workflow attach <run-id> <stage>      # chat with a single stage
> /workflow interrupt <run-id>           # pause resumably
> /workflow resume <run-id> [stage] msg  # forward a steer message and resume
> /workflow quit <run-id>                # pause gracefully and keep the run resumable
> /workflows [run-id]                    # retained alias for /workflow resume (history picker)
> ```

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "Durable Workflows and Cross-Session Resume"**:

> Atomic workflows use **DBOS/Postgres as their sole persistent workflow backend**. Atomic configures and launches DBOS lazily on the first workflow action, reuses that process-wide instance, and awaits readiness before workflow execution, resume, inspection, or deletion can access durable state.

> - **Only `ctx.*` blocks are checkpointed**: code outside `ctx.*` is not durable.

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "`/workflow resume` — cross-session resume selector"**:

> Running workflows never appear: fresh-heartbeat rows are excluded in every session to prevent double dispatch, and stale ones surface as `crashed`.

> Selecting a paused, resumable failed, blocked, or crash-recovery target follows the existing resume path unchanged: Atomic re-dispatches the workflow with its cached inputs and the **original workflow id**. Every nested invocation validates and reuses its durable boundary and child identity before dispatch. Previously completed `ctx.tool`, `ctx.ui`, stage/task/chain/parallel items, and child boundaries replay from checkpoints instead of executing again; only incomplete work continues.

**What it shows:** Workflows checkpoint to a DBOS/Postgres backend; a graceful quit survives and resumes — even across sessions — without re-running completed stages or `ctx.tool` calls.

**Steps**

1. Launch something long: `/workflow loop-until-done prompt="Find and fix every TODO comment in demo-app, one per iteration, and prove each fix" max_iterations=6`
2. After a stage or two completes: `/workflow quit <run-id>` — graceful pause; the run stays discoverable.
3. Optionally exit and restart `atomic` for effect.
4. `/workflow resume` (or `/workflows`) — pick the run from the newest-first picker.
5. Watch it skip completed checkpoints and continue the incomplete stage.

**What to point out:** Only `ctx.*` blocks are checkpointed; completed `ctx.tool` calls are replay cache hits. Running runs never appear in the picker — no double dispatch. This also demos the `loop-until-done` builtin: the loop pattern you're about to hand-write in the finale.

## Demo 6.5 — FINALE: `security-review` custom workflow with a bounded repair loop

**Source:** [docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) (authoring; the unrolled-loop DAG rule; `ctx.tool`; `schema` → `result.structured`; `reads`; `output`/`outputMode`; `ctx.ui.confirm`; `ctx.exit`; loop-until-done and adversarial-verification best practices). Doc-derived composition — every primitive is documented; dry-run before the stream. **Duration:** 10 min.

**Summary:** The finale composes every primitive into one hand-written `security-review` workflow: a fresh-context audit of the planted-flaw app, a schema-gated independent verifier, durable `ctx.tool` ledger writes, an HIL confirm gate before each repair, and a bounded unrolled repair loop that stays a DAG.

### 📖 Docs reference

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "Dynamic topology must remain acyclic"**:

> **Cyclic workflow graphs are unsupported. Workflow authors and coding agents MUST NOT create self-edges or dependency edges from the current frontier to an existing ancestor. Every materialized execution topology must remain a DAG. If a cycle cannot be removed, redesign or stop before launch.**
>
> Valid unrolled loop:
>
> ```text
> Implement
>    ↓
> Review 1
>    ↓
> Validate 1
>    ↓
> Repair 1
>    ↓
> Review 2
>    ↓
> Validate 2
> ```
>
> Each iteration creates new tracked nodes, so the materialized topology stays acyclic.

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "`schema`"**:

> Enables a schema-specific, single-use final-answer tool for that item. `ctx.stage`, `ctx.task`, `ctx.chain`, and `ctx.parallel` items accept a TypeBox schema or a plain JSON Schema descriptor object. The schema may describe an object, array, or primitive, and the captured JSON value becomes the schema-backed `stage.prompt(...)` result or `WorkflowTaskResult.structured`; task text remains formatted JSON for handoffs.

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "`output` / `outputMode`"**:

> Writes stage/task output to a path or disables output persistence with `false`. `outputMode` defaults to `inline`; `file-only` keeps the parent result compact by returning an artifact reference instead of full text and requires an output path.

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "`reads`"**:

> `reads` passes **paths, not content**. It prepends a `[Read from: <paths>]` directive to the prompt and the stage reads those files itself with its own read tool, so a stage sees whatever is on disk when it runs — not a snapshot taken when the path was passed.

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "`ctx.tool` — durable cached tool execution"**:

> The `ctx.tool(name, args, fn, options?)` primitive runs arbitrary TypeScript code as a first-class durable graph node and caches the result durably.

> On resume, if that ordinal tool call already completed (matched by call order plus content hash of `name` + `args`), the runtime returns the cached result without re-executing the function—ensuring completed side effects are not repeated while still preserving two intentional same-name/same-args calls as distinct ordered nodes.

**What it shows:** Everything at once: fresh-context audit, schema-backed verifier gate, durable `ctx.tool` ledger writes, a loop-until-done-style bounded repair loop with per-iteration node identity, and an HIL continue gate.

**Setup (prompt-first)** — prompt: `Create .atomic/workflows/security-review.ts with EXACTLY the TypeScript below.`

```ts
import { workflow } from "@bastani/workflows";
import { Type } from "typebox";
import { mkdir, writeFile } from "node:fs/promises";

export default workflow({
  name: "security-review",
  description:
    "Audit a target for security issues, then run a bounded repair/verify loop until clean or the bound is exhausted.",
  inputs: {
    target: Type.String({ description: "Directory, glob, or subsystem to audit." }),
    max_repairs: Type.Number({
      description: "Maximum repair iterations before stopping.",
      default: 3,
    }),
  },
  outputs: {
    result: Type.String({ description: "Final security posture summary." }),
    approved: Type.Boolean({ description: "True when verification found no P0/P1 blockers." }),
    iterations: Type.Number({ description: "Repair iterations actually used." }),
    audit_path: Type.String({ description: "Path to the initial audit artifact." }),
  },
  run: async (ctx) => {
    const target = String(ctx.inputs.target);
    const maxRepairs = Number(ctx.inputs.max_repairs);
    const runDir = ".atomic/workflows/runs/security-review";
    const auditPath = `${runDir}/audit.md`;

    await ctx.tool("prepare-run-dir", { runDir }, async () => {
      await mkdir(runDir, { recursive: true });
      return runDir;
    });

    await ctx.task("audit", {
      prompt: [
        `Audit ${target} for security issues: injection, secrets committed to source, unsafe deserialization, path traversal, missing input validation, and risky dependency usage.`,
        `For every finding record severity (P0-P3), file:line evidence, and a concrete fix.`,
        `Write the findings as a markdown checklist. If nothing is found, say so explicitly and list the evidence you checked.`,
      ].join("\n"),
      context: "fresh",
      output: auditPath,
      outputMode: "file-only",
    });

    const verdictSchema = Type.Object({
      approved: Type.Boolean({ description: "True when no P0/P1 findings remain." }),
      blockers: Type.Array(Type.String(), {
        description: "Open P0/P1 findings with file:line evidence.",
      }),
      summary: Type.String({ description: "One-paragraph security posture summary." }),
    });

    let iterations = 0;
    let approved = false;
    let summary = "";

    for (let i = 1; i <= maxRepairs + 1; i++) {
      const verify = await ctx.task(`verify-${i}`, {
        prompt: [
          "You are an independent security verifier with fresh context.",
          `Read the audit findings at ${auditPath}, then inspect the current code in ${target} yourself.`,
          "Confirm which findings are fixed and which remain. Report only evidence-backed defects.",
          "Call structured_output with your verdict.",
        ].join("\n"),
        context: "fresh",
        reads: [auditPath],
        schema: verdictSchema,
      });

      const verdict = verify.structured as {
        approved: boolean;
        blockers: string[];
        summary: string;
      };
      summary = verdict.summary;

      await ctx.tool(
        "record-iteration",
        { iteration: i, approved: verdict.approved, blockers: verdict.blockers },
        async () => {
          await writeFile(
            `${runDir}/ledger-${i}.json`,
            JSON.stringify({ iteration: i, ...verdict }, null, 2),
            "utf8",
          );
          return `ledger-${i}.json`;
        },
      );

      if (verdict.approved) {
        approved = true;
        break;
      }
      if (i > maxRepairs) {
        break;
      }

      const proceed = await ctx.ui.confirm(
        `Iteration ${i}: ${verdict.blockers.length} blocker(s) remain. Run repair iteration ${i}?`,
      );
      if (!proceed) {
        return ctx.exit({
          status: "blocked",
          reason: "User declined the repair loop.",
          outputs: { result: summary, iterations, audit_path: auditPath },
        });
      }

      iterations = i;
      await ctx.task(`repair-${i}`, {
        prompt: [
          `Fix ONLY these open security findings in ${target}:`,
          ...verdict.blockers.map((b) => `- ${b}`),
          "Do not refactor unrelated code. After each fix, state the file:line you changed and why it closes the finding.",
        ].join("\n"),
        context: "fresh",
      });
    }

    return { result: summary, approved, iterations, audit_path: auditPath };
  },
});
```

**Steps**

1. The agent wrote the file in Setup; reveal it section by section (audit → verifier schema → loop → gate); `/workflow reload`.
2. The target `demo-app/` with its planted SQL-string concatenation and hardcoded API key already exists (pre-stream item 4).
3. `/workflow inputs security-review`
4. `/workflow security-review target="demo-app" max_repairs=2`
5. `/workflow connect <run-id>` — narrate the graph as `audit` → `verify-1` → (confirm gate) → `repair-1` → `verify-2` materialize as **distinct nodes**.
6. Answer the `ctx.ui.confirm` gate to authorize each repair round.
7. When it goes green, show declared outputs in `/workflow status <run-id>` and the ledger files under `.atomic/workflows/runs/security-review/`.

**What to point out:** Loops are unrolled — `verify-2` is a new node, never an edge back to `audit` (the doc's DAG law). The verifier runs with fresh context, so the implementer can't grade its own homework. `schema` forces a machine-checkable verdict via `structured_output` — no regex gates. `ctx.tool` ledger writes are durably cached, so a resumed run will not re-write completed ledgers. `reads` passes paths, not stale content. Exhausting the bound produces an inspectable non-approved result instead of an infinite loop. This is the workflow-native answer to every earlier primitive: fresh-context subagents (Part 5), HIL (Demos 1.3/6.3), durable state (Demo 6.4).

---

# Wrap (2:58–3:00)

Recap the arc: one binary, four modes; every layer scriptable — tools, sessions, extensions, skills, themes, agents, workflows. Point at <https://docs.bastani.ai/> and the shipped `examples/` ladder, and note the whole demo — script, seeds, `.atomic/` resources, SDK sample — lives in the one `~/Documents/demos/atomic` repository. Mention `/mcp` and `/mcp setup` for MCP servers and the bundled web-access tools (`web_search`, `fetch_content`) as further exploration — both are bundled extensions (README; [docs.bastani.ai/extensions](https://docs.bastani.ai/extensions)), demoed another day since they lack a dedicated doc page to script against.

---

# Appendix — Fully scripted stretch/buffer demos

## A.1 — Keybindings + `/reload` + `/settings` (5 min)

**Source:** [docs.bastani.ai/keybindings](https://docs.bastani.ai/keybindings) ("Custom Configuration", "Emacs Example"); README commands table.

**Summary:** Every keystroke in the TUI is a namespaced, remappable action: drop an Emacs-flavored `keybindings.json` (global-only) and `/reload` it without restarting.

### 📖 Docs reference

**[docs.bastani.ai/keybindings](https://docs.bastani.ai/keybindings) — "Custom Configuration"**

> Create `~/.atomic/agent/keybindings.json`:

> Each action can have a single key or an array of keys. User config overrides defaults.

**[docs.bastani.ai/keybindings](https://docs.bastani.ai/keybindings) — "Emacs Example"**

> ```json
> {
>   "tui.editor.cursorUp": ["up", "ctrl+p"],
>   "tui.editor.cursorDown": ["down", "ctrl+n"],
>   "tui.editor.cursorLeft": ["left", "ctrl+b"],
>   "tui.editor.cursorRight": ["right", "ctrl+f"],
>   "tui.editor.cursorWordLeft": ["alt+left", "alt+b"],
>   "tui.editor.cursorWordRight": ["alt+right", "alt+f"],
>   "tui.editor.deleteCharForward": ["delete", "ctrl+d"],
>   "tui.editor.deleteCharBackward": ["backspace", "ctrl+h"],
>   "tui.input.newLine": ["shift+enter", "ctrl+j"]
> }
> ```

**[README](https://github.com/bastani-inc/atomic#readme) — "Commands"**

> | `/settings` | Thinking level, theme, message delivery, transport |
> | `/reload` | Reload keybindings, extensions, skills, prompts, and context files (themes hot-reload automatically) |
> | `/hotkeys` | Show all keyboard shortcuts |

**What it shows:** Every shortcut is a namespaced remappable action; config reloads without restart.

1. `/hotkeys` — every row is a keybinding id.
2. Prompt-first: `Create ~/.atomic/agent/keybindings.json (global-only — keybindings are not project-local) with EXACTLY this JSON:`

   ```json
   {
     "tui.editor.cursorUp": ["up", "ctrl+p"],
     "tui.editor.cursorDown": ["down", "ctrl+n"],
     "tui.editor.cursorLeft": ["left", "ctrl+b"],
     "tui.editor.cursorRight": ["right", "ctrl+f"],
     "tui.editor.cursorWordLeft": ["alt+left", "alt+b"],
     "tui.editor.cursorWordRight": ["alt+right", "alt+f"],
     "tui.editor.deleteCharForward": ["delete", "ctrl+d"],
     "tui.editor.deleteCharBackward": ["backspace", "ctrl+h"],
     "tui.input.newLine": ["shift+enter", "ctrl+j"]
   }
   ```

3. `/reload`, then demo CTRL+J newline.
4. Talking point: this rebinds CTRL+P, which defaults to `app.model.cycleForward` — a real conflict worth showing; user config overrides defaults.
5. `/settings` — thinking level, theme, steering/follow-up delivery, transport.
6. Restore: `rm ~/.atomic/agent/keybindings.json` then `/reload`.

## A.2 — Permission gate: guardrails incl. headless block (5 min)

**Source:** examples/extensions/permission-gate.ts (shipped, verbatim).

**Summary:** A shipped 34-line extension turns `tool_call` into a policy layer: dangerous bash patterns hit a confirm dialog in the TUI and are blocked by default in headless mode via `ctx.hasUI`.

### 📖 Docs reference

**[docs.bastani.ai/extensions](https://docs.bastani.ai/extensions) — "Events → tool_call":**

> Fired after `tool_execution_start`, before the tool executes. **Can block.** Use `isToolCallEventType` to narrow and get typed inputs.

> Behavior guarantees:
> - Mutations to `event.input` affect the actual tool execution
> - Later `tool_call` handlers see mutations made by earlier handlers
> - No re-validation is performed after your mutation
> - Return values from `tool_call` only control blocking via `{ block: true, reason?: string }`

**[docs.bastani.ai/extensions](https://docs.bastani.ai/extensions) — "ctx.hasUI":**

> `false` in print mode (`-p`) and JSON mode. `true` in interactive and RPC mode.

**[docs.bastani.ai/extensions](https://docs.bastani.ai/extensions) — "Examples Reference":**

> | Example | Description | Key APIs |
> |---------|-------------|----------|
> | `permission-gate.ts` | Block dangerous commands | `on("tool_call")`, `ui.confirm` |
> | `protected-paths.ts` | Block writes to specific paths | `on("tool_call")` |

**Setup (prompt-first)** — prompt: `Copy the shipped permission-gate example into this repo: cp /Users/tonystark/.cache/.bun/install/global/node_modules/@bastani/atomic/examples/extensions/permission-gate.ts .atomic/extensions/permission-gate.ts`

The complete file, for on-screen reading:

```typescript
/**
 * Permission Gate Extension
 *
 * Prompts for confirmation before running potentially dangerous bash commands.
 * Patterns checked: rm -rf, sudo, chmod/chown 777
 */

import type { ExtensionAPI } from "@bastani/atomic";

export default function (pi: ExtensionAPI) {
	const dangerousPatterns = [/\brm\s+(-rf?|--recursive)/i, /\bsudo\b/i, /\b(chmod|chown)\b.*777/i];

	pi.on("tool_call", async (event, ctx) => {
		if (event.toolName !== "bash") return undefined;

		const command = event.input.command as string;
		const isDangerous = dangerousPatterns.some((p) => p.test(command));

		if (isDangerous) {
			if (!ctx.hasUI) {
				// In non-interactive mode, block by default
				return { block: true, reason: "Dangerous command blocked (no UI for confirmation)" };
			}

			const choice = await ctx.ui.select(`⚠️ Dangerous command:\n\n  ${command}\n\nAllow?`, ["Yes", "No"]);

			if (choice !== "Yes") {
				return { block: true, reason: "Blocked by user" };
			}
		}

		return undefined;
	});
}
```

1. `/reload`. Prompt: `Run: sudo echo hi` → select dialog; pick No.
2. Show the tool result the model sees: "Blocked by user" — graceful recovery.
3. Headless proof: `atomic -p "Run this exact command with bash: sudo echo hi"` → blocked without prompting (`ctx.hasUI` is false).

## A.3 — Pirate mode: runtime system-prompt mutation (4 min)

**Source:** examples/extensions/pirate.ts (shipped, verbatim).

**Summary:** The fun one: a `/pirate` toggle plus a `before_agent_start` handler that rewrites the system prompt per turn — the same mechanism behind plan modes and per-repo compliance headers.

### 📖 Docs reference

**[docs.bastani.ai/extensions](https://docs.bastani.ai/extensions) — "Events → before_agent_start":**

> Fired after user submits prompt, before agent loop. Can inject a message and/or modify the system prompt.

**[docs.bastani.ai/extensions](https://docs.bastani.ai/extensions) — "Examples Reference":**

> | Example | Description | Key APIs |
> |---------|-------------|----------|
> | `pirate.ts` | Modify system prompt per-turn | `registerCommand`, `before_agent_start` |

**examples/extensions/pirate.ts — command + handler (excerpt):**

> ```typescript
> export default function pirateExtension(pi: ExtensionAPI) {
> 	let pirateMode = false;
>
> 	// Register /pirate command to toggle pirate mode
> 	pi.registerCommand("pirate", {
> 		description: "Toggle pirate mode (agent speaks like a pirate)",
> 		handler: async (_args, ctx) => {
> 			pirateMode = !pirateMode;
> 			ctx.ui.notify(pirateMode ? "Arrr! Pirate mode enabled!" : "Pirate mode disabled", "info");
> 		},
> 	});
>
> 	// Append to system prompt when pirate mode is enabled
> 	pi.on("before_agent_start", async (event) => {
> 		if (pirateMode) {
> 			return {
> 				systemPrompt:
> 					event.systemPrompt +
> ```

**Setup (prompt-first)** — prompt: `Copy the shipped pirate example into this repo: cp /Users/tonystark/.cache/.bun/install/global/node_modules/@bastani/atomic/examples/extensions/pirate.ts .atomic/extensions/pirate.ts`

1. `/reload`, then `/pirate` → "Arrr! Pirate mode enabled!".
2. Prompt: `Explain what a TypeScript generic is in two sentences.` — pirate-flavored but correct.
3. `/pirate` again to disable; repeat to show the per-turn toggle.
4. Point out: `before_agent_start` recomputes the system prompt each turn from extension state — the same mechanism powers per-repo rules, plan modes, compliance headers.

## A.4 — Prompt templates: reusable slash prompts with arguments (4 min)

**Source:** [docs.bastani.ai/prompt-templates](https://docs.bastani.ai/prompt-templates).

**Summary:** Markdown files in `.atomic/prompts/` become slash commands with positional args, defaults, and autocomplete hints — team-shareable prompt macros via git.

### 📖 Docs reference

**[docs.bastani.ai/prompt-templates](https://docs.bastani.ai/prompt-templates) — "Locations"**

> - Global: `~/.atomic/agent/prompts/*.md` (legacy `~/.pi/agent/prompts/*.md`)
> - Project: `.atomic/prompts/*.md` (legacy `.pi/prompts/*.md`, only after the project is trusted)

**[docs.bastani.ai/prompt-templates](https://docs.bastani.ai/prompt-templates) — "Format"**

> - The filename becomes the command name. `review.md` becomes `/review`.
> - `description` is optional. If missing, the first non-empty line is used.
> - `argument-hint` is optional. When set, the hint is displayed before the description in the autocomplete dropdown.

**[docs.bastani.ai/prompt-templates](https://docs.bastani.ai/prompt-templates) — "Arguments"**

> - `$1`, `$2`, ... positional args
> - `$@` or `$ARGUMENTS` for all args joined
> - `${1:-default}` uses arg 1 when present/non-empty, otherwise `default`
> - `${@:-default}` or `${ARGUMENTS:-default}` uses all arguments when present/non-empty, otherwise `default`
> - `${@:N}` for args from the Nth position (1-indexed)
> - `${@:N:L}` for `L` args starting at N

**Setup (prompt-first)** — prompt: `Create .atomic/prompts/review.md with EXACTLY this content:`

```markdown
---
description: Review staged git changes
---
Review the staged changes (`git diff --cached`). Focus on:
- Bugs and logic errors
- Security issues
- Error handling gaps
```

Then: `Create .atomic/prompts/component.md with EXACTLY this content:`

```markdown
---
description: Create a component
argument-hint: "<name> [features]"
---
Create a React component named $1 with features: ${@:2}
```

1. Restart `atomic` (or new session) in a git repo with staged changes.
2. Type `/` → autocomplete lists both templates with descriptions and the `argument-hint`.
3. `/review` → the body expands into the prompt.
4. `/component Button "onClick handler" "disabled support"` → show `$1` and `${@:2}` substitution.
5. Arg syntax: `$1`, `$@`/`$ARGUMENTS`, `${1:-default}`, `${@:N}`, `${@:N:L}`. Project-local `.atomic/prompts/` shares templates via git.

## A.5 — Parallel review composition with `/parallel-review` (7 min)

**Source:** [docs.bastani.ai/subagents](https://docs.bastani.ai/subagents) ("Review compositions").

**Summary:** One documented sentence fans a diff review out to fresh-context specialists (correctness, failure modes, conventions) and synthesizes only issues worth fixing — also available as the bundled `/parallel-review` template.

### 📖 Docs reference

**[docs.bastani.ai/subagents](https://docs.bastani.ai/subagents) — "Review compositions"**

> | Angle | Specialist pattern |
> |---|---|
> | Current behavior and regressions | `codebase-analyzer` inspects the changed flow and cites file/line evidence. |
> | Failure modes | `debugger` runs in inspect-only mode to reproduce or reason about likely failures without editing. |
> | Fit with project conventions | `codebase-pattern-finder` compares the patch with existing local examples. |
> | Prior decisions | `codebase-research-locator` finds relevant docs, then `codebase-research-analyzer` extracts applicable constraints. |
> | External API or library conformance | `codebase-online-researcher` checks authoritative sources and version-specific behavior. |

> ```text
> Review the current diff with fresh-context specialists: analyze correctness, inspect failure modes without editing, and compare the implementation to existing patterns. Synthesize only issues worth fixing now.
> ```

> Useful prompt templates include `/parallel-review`, `/review-loop`, `/parallel-research`, `/parallel-context-build`, `/parallel-handoff-plan`, and `/parallel-cleanup`. Treat them as reusable compositions, not as separate bundled agent names.

Prompt in `~/Documents/demos/atomic` to plant a review target: `Append to src-client.ts exactly this line: export function retry<T>(fn: () => Promise<T>): Promise<T> { return fn().catch(() => fn()); }`

1. Type the documented request verbatim: `Review the current diff with fresh-context specialists: analyze correctness, inspect failure modes without editing, and compare the implementation to existing patterns. Synthesize only issues worth fixing now.`
2. Alternatively run the bundled prompt template: `/parallel-review`
3. Point at concurrent children, then at the parent's synthesized issue list.
4. Other bundled templates: `/review-loop`, `/parallel-research`, `/parallel-context-build`, `/parallel-handoff-plan`, `/parallel-cleanup`.

## A.6 — Background (async) subagent runs: status, interrupt, resume, doctor (8 min)

**Source:** [docs.bastani.ai/subagents](https://docs.bastani.ai/subagents) ("Background work and control").

**Summary:** Delegation goes async: launch a detached child, check `status`, `interrupt` resumably, `resume` with a follow-up (even reviving a completed child), and diagnose the runtime with `doctor` — completion notices arrive over intercom.

### 📖 Docs reference

**[docs.bastani.ai/subagents](https://docs.bastani.ai/subagents) — "Background work and control"**

> ```ts
> subagent({ agent: "codebase-analyzer", task: "Trace the auth flow with file references.", async: true })
> subagent({ action: "status" })
> subagent({ action: "status", id: "<run-id>" })
> subagent({ action: "interrupt", id: "<run-id>" })
> subagent({ action: "resume", id: "<run-id>", message: "continue with the test failures" })
> subagent({ action: "doctor" })
> ```
>
> Use `interrupt` when you want a resumable stop. Use `resume` to send a follow-up to a reachable async child, or to revive a completed child from its saved session when the run has enough metadata. Use `doctor` for read-only setup diagnostics.
>
> Background runs are detached. Their acknowledgement explicitly says the run was launched and completion is pending: the launch tool call itself is terminal, while the detached child continues and will notify the originating session when it completes. If Atomic has no useful independent work in the meantime, it should end the turn instead of polling in a loop.

**[docs.bastani.ai/subagents](https://docs.bastani.ai/subagents) — "Fallback models" (attempt watchdog)**

> Each foreground and background model candidate is bounded by a per-attempt idle watchdog (default 5 minutes without child stdout, stderr, or JSON child events) and an absolute wall-clock cap (default 60 minutes). […] The defaults can be overridden with `ATOMIC_SUBAGENT_ATTEMPT_IDLE_TIMEOUT_MS` and `ATOMIC_SUBAGENT_ATTEMPT_TIMEOUT_MS`; `ATOMIC_SUBAGENT_ATTEMPT_KILL_GRACE_MS` controls SIGTERM-to-SIGKILL escalation.

1. Prompt: `Call subagent({ agent: "codebase-analyzer", task: "Trace the auth flow with file references.", async: true })`
2. Show the acknowledgement wording: launch is terminal, completion pending; the agent ends the turn rather than polling.
3. Prompt: `Show me the current async subagent runs.` (backed by `subagent({ action: "status" })`)
4. Then `subagent({ action: "interrupt", id: "<run-id>" })` and `subagent({ action: "resume", id: "<run-id>", message: "continue with the test failures" })`.
5. Finish with `subagent({ action: "doctor" })` — read-only diagnostics that also report Intercom bridge availability.
6. When the child completes, point at the completion notice arriving over Intercom in the parent session.
7. Talking points: `interrupt` is a resumable stop; `resume` can revive even a *completed* child; per-attempt idle watchdog (default 5 min) and 60-min wall-clock cap via `ATOMIC_SUBAGENT_ATTEMPT_*` env vars.

## A.7 — Intercom groups: isolation and read-only peeking (6 min)

**Source:** [docs.bastani.ai/intercom](https://docs.bastani.ai/intercom) ("Groups"); [docs.bastani.ai/subagents](https://docs.bastani.ai/subagents) ("Orchestrator model and group policy"). Requires Demo 5.3's sessions still alive.

**Summary:** Intercom groups are hard isolation, not filtering: a `redteam`-grouped session is invisible and unreachable from the default group, sends are rejected by the broker, and `list group:"redteam"` is the documented read-only peek.

### 📖 Docs reference

**[docs.bastani.ai/intercom](https://docs.bastani.ai/intercom) — "Groups"**

> Every session belongs to exactly one intercom **group**. Sessions with no group configured share the implicit `"default"` group (so ungrouped sessions all see and message each other, exactly as before). A session in group G can **only** message sessions in group G — cross-group sends are rejected by the broker, not merely hidden from discovery:
>
> - A cross-group target name is unresolvable (`list`/targeting only consider your own group), and a cross-group send by exact session ID is rejected with `"Target session is in a different intercom group"`.
> - `list`/`status` show your own group and only same-group peers. Pass `group: "name"` to `list`/`status` for a **read-only** peek at another group's membership. `send`/`ask` are always locked to your own group and error if you pass a different `group`.

> A session's home group is resolved with this precedence: explicit stage/task/subagent group > runtime-owned workflow invocation group or inherited launching-session group > env `ATOMIC_INTERCOM_GROUP` (legacy `PI_INTERCOM_GROUP`) > Intercom `config.json` `"group"` > `"default"`.

**[docs.bastani.ai/subagents](https://docs.bastani.ai/subagents) — "Orchestrator model and group policy"**

> Each workflow invocation automatically receives one stable, non-`"default"` Intercom group. Its stages and delegated children inherit that group across single, parallel, chain, async, and follow-up work unless a call explicitly overrides `group`. Outside workflows, children inherit the launching session's group. This isolates workflow runs from unrelated runs and the main chat while `contact_supervisor` retains its authorized cross-group route.

Third terminal (do not reuse Demo 5.5's `fresh` pane as-is — `ATOMIC_INTERCOM_GROUP` must be set at launch, so open a fresh pane or restart it):

```bash
cd ~/Documents/demos/atomic
ATOMIC_INTERCOM_GROUP=redteam atomic
```

In it: `/name redworker`, then prompt `Check intercom status.` so it connects.

1. T3 prompt: `List intercom sessions.` — planner/worker do NOT appear.
2. T1 prompt: `List intercom sessions in group "redteam".` → `intercom({ action: "list", group: "redteam" })`, the documented read-only peek.
3. T1 prompt: `Send an intercom message to redworker saying hi.` — the cross-group name is unresolvable; a send by exact session ID is rejected with "Target session is in a different intercom group".
4. Precedence: explicit subagent/stage group > workflow invocation group or inherited launching-session group > env `ATOMIC_INTERCOM_GROUP` > `config.json` `"group"` > `"default"`. `contact_supervisor` is the only authorized cross-group route.

## A.8 — Natural-language workflow authoring: describe it, Atomic writes it (6 min)

**Source:** [docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) (prompt text verbatim from the doc).

**Summary:** Skip hand-writing entirely: paste a plain-English description and Atomic designs the workflow, writes `.atomic/workflows/review-changes.ts`, reloads the registry, and reports where the code lives — ready to launch immediately.

### 📖 Docs reference

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "Quick Start › Just describe it"** (the paste-in prompt in step 1 is this doc's text verbatim):

> Describe the workflow you want in plain chat and Atomic will design and write it for you, using this page as its authoring reference:

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "Quick Start › Just describe it"** (what Atomic does):

> Atomic will:
>
> - ask clarifying questions when stage purpose, inputs, models, or handoffs are ambiguous,
> - write a `.atomic/workflows/<name>.ts` file using `workflow({...})`,
> - pick `ctx.task` / `ctx.chain` / `ctx.parallel` / `ctx.ui` per the [WorkflowContext primitives](#workflowcontext) and [task options](#task-and-stage-options) reference,
> - use `ctx.tool(name, args, fn)` for workflow-owned side effects so completed operations are durably checkpointed and do not run again after resume (see [`ctx.tool`](#ctxtool--durable-cached-tool-execution)),
> - run `/workflow reload` so Atomic rediscovers the workflow resource and you can launch it immediately,
> - then report the generated workflow folder so you can inspect the code it wrote, using `Custom workflow created. You can inspect its code at: <workflow-folder-path>` (for example, `.atomic/workflows/`); Atomic does this only for newly created custom workflows, never builtin or pre-existing workflows.

1. Paste into chat, verbatim:

   ```text
   Create a reusable Atomic workflow called review-changes.

   It should accept one required text input `target` for a diff, PR summary, or
   review focus.

   Run two independent reviewers in parallel with fresh context:
   - one focused on correctness, regressions, and missing tests
   - one focused on edge cases, maintainability, and hidden risks

   Then add a synthesis stage that consolidates both reviews, deduplicates
   overlap, keeps only evidence-backed issues, and separates blockers from
   optional suggestions.

   Return structured output with `consolidated_review` and `decision` fields.
   ```

2. Answer any clarifying questions it asks.
3. Open the generated `.atomic/workflows/review-changes.ts` on stream and read it aloud.
4. `/workflow review-changes target="the current git diff"`

## A.9 — Composition: `research-and-verify` nests two builtins with `ctx.workflow` (8 min)

**Source:** [docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) (builtin-composition example, verbatim).

**Summary:** Workflows compose like functions: a ~40-line parent imports two builtins and nests them with `ctx.workflow(...)`, mapping typed inputs and consuming declared outputs — research feeds adversarial verification with no copied prompts.

### 📖 Docs reference

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "Compose with builtin workflows"** (the `research-and-verify.ts` below is this section's example verbatim):

> Builtin workflow definitions work like user-defined child definitions. Import several from the barrel:
>
> ```ts
> import {
>   adversarialVerification,
>   classifyAndAct,
>   fanOutAndSynthesize,
>   generateAndFilter,
>   goal,
>   loopUntilDone,
>   openClaudeDesign,
>   ralph,
>   tournament,
> } from "@bastani/workflows/builtin";
> ```

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "Compose with builtin workflows"** (child result contract):

> | Field | Meaning |
> |---|---|
> | `workflow` | Normalized child workflow name. |
> | `runId` | Nested child run id. |
> | `status` | `completed`, or `skipped` / `cancelled` / `blocked` when the child intentionally ended with `ctx.exit(...)`. Failed or internally cancelled children make the parent child call fail. |
> | `exited` | `false` for normal child completion; `true` when the child used `ctx.exit(...)` (including `ctx.exit({ status: "completed" })`). |
> | `outputs` | Full declared child outputs when `exited === false`; partial declared child outputs when `exited === true`. |
> | `exitReason` | Optional child `ctx.exit({ reason })` text, present only on the `exited === true` branch. |

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "Compose with builtin workflows"** (nesting rules):

> Pass only workflow definitions to `ctx.workflow(...)`. Import reusable workflows with TypeScript `import` statements first; registry names are only for top-level named runs, not `ctx.workflow(...)` arguments. If a module is missing or does not export a workflow definition, workflow discovery fails when loading that module. Nested child workflows count against `maxDepth` (default `4` total workflow levels).

**Setup (prompt-first)** — prompt: `Create .atomic/workflows/research-and-verify.ts with EXACTLY the TypeScript below.`

```ts
import { workflow } from "@bastani/workflows";
import { Type } from "typebox";
import { adversarialVerification, fanOutAndSynthesize } from "@bastani/workflows/builtin";

export default workflow({
  name: "research-and-verify",
  description: "Map repository slices, synthesize evidence, and verify the report.",
  inputs: { topic: Type.String() },
  outputs: {
    report_path: Type.String(),
    approved: Type.Boolean(),
  },
  run: async (ctx) => {
    const research = await ctx.workflow(fanOutAndSynthesize, {
      inputs: {
        prompt: `Partition repository research for: ${ctx.inputs.topic}. Save cited findings per slice and synthesize conflicts.`,
        max_branches: 6,
      },
      stageName: "repository research",
    });
    if (research.exited === true) {
      return ctx.exit({ status: research.status, reason: research.exitReason ?? "research stopped early" });
    }

    const verification = await ctx.workflow(adversarialVerification, {
      inputs: { task: `Verify the cited report at ${research.outputs.synthesis_path}` },
      stageName: "verify research report",
    });
    if (verification.exited === true) {
      return ctx.exit({ status: verification.status, reason: verification.exitReason ?? "verification stopped early" });
    }

    return {
      report_path: research.outputs.synthesis_path,
      approved: verification.outputs.approved,
    };
  },
});
```

1. The agent wrote the file in Setup; `/workflow reload`.
2. `/workflow research-and-verify topic="how the session store works"`
3. `/workflow connect <run-id>` — child workflow stages flatten into one expanded parent graph; attach to a nested verifier stage.
4. Talking points: `ctx.workflow` takes the imported definition, never a string; typed `child.outputs` are a declared contract; `exited` forces early-exit handling; nesting counts against `maxDepth` (default 4).

## A.10 — Autonomous implementation loops: `ralph` and `goal` one-liners (5 min)

**Source:** [docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) (builtin table).

**Summary:** The two autonomous implementation loops in one-liners: `ralph` (refine → research → implement → multi-model review loop) and `goal` (ledgered orchestration with reviewer receipts and a TypeScript reducer verdict) — launched, narrated on the live graph, not awaited.

### 📖 Docs reference

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "Built-in Workflows"** (table rows for the two loops):

> | Workflow | What it does | When to use |
> |---|---|---|
> | `goal` | Durable goal ledger → bounded sub-agent orchestration → parallel review → deterministic reducer. | Autonomous implementation that needs receipts and reviewer-gated completion. |
> | `ralph` | Prompt refinement → codebase research → delegated implementation → multi-model review loop. | Research-first autonomous implementation with bounded review and repair. |

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "`goal`"**:

> Goal persists the literal objective and immutable acceptance criteria in a run ledger, delegates implementation through bounded orchestrator turns, records receipts, and asks independent reviewers to inspect the current delta. A TypeScript reducer returns `complete`, `blocked`, or `needs_human` rather than trusting free-form completion claims.
>
> ```text
> /workflow goal objective="Update the CLI docs for --json, add one example, and validate the docs build"
> /workflow goal objective="Implement specs/rate-limit.md and run focused checks" create_pr=true
> ```

**[docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) — "`ralph`"** (and the shared worktree/PR rule):

> ```text
> /workflow ralph prompt="Migrate the database layer to Drizzle" max_loops=3
> /workflow ralph prompt="Implement specs/rate-limit.md and validate burst behavior" create_pr=true
> ```
>
> Goal and Ralph both support reusable worktree binding through `git_worktree_dir` and `base_branch`. Use `create_pr=true` only for an explicitly authorized final action after implementation approval. For follow-up runs based on reviewer findings, pass the original task text as `acceptance_criteria` to prevent contract drift.

1. `/workflow inputs ralph` and `/workflow inputs goal` — show the contracts.
2. `/workflow ralph prompt="Add input validation to demo-app/server.js and prove it with a test" max_loops=3`
3. While it runs, `/workflow connect <run-id>` and narrate: refine → research → implement → independent model-family reviewers → repair loop. Do not wait for completion on stream.
4. Mention the doc's `goal` launch: `/workflow goal objective="Update the CLI docs for --json, add one example, and validate the docs build"` with `create_pr=true` as an explicit opt-in.
5. Talking points: reviewers must cite commands, output, and file:line evidence; a TypeScript reducer — not model prose — decides `complete`/`blocked`/`needs_human`; prompt text alone never authorizes a PR.

---

# Source index

| Demo | Primary sources (docs at <https://docs.bastani.ai/>; shipped examples under the installed `@bastani/atomic` package) |
|------|------|
| 1.1 | [docs.bastani.ai/quickstart](https://docs.bastani.ai/quickstart), [docs.bastani.ai/usage](https://docs.bastani.ai/usage), README.md |
| 1.2 | [docs.bastani.ai/tools](https://docs.bastani.ai/tools) |
| 1.3 | [docs.bastani.ai/quickstart](https://docs.bastani.ai/quickstart), [docs.bastani.ai/usage](https://docs.bastani.ai/usage) |
| 1.4 | [docs.bastani.ai/quickstart](https://docs.bastani.ai/quickstart), [docs.bastani.ai/settings](https://docs.bastani.ai/settings) |
| 2.1 | [docs.bastani.ai/sessions](https://docs.bastani.ai/sessions), README.md, [docs.bastani.ai/compaction](https://docs.bastani.ai/compaction) |
| 2.2 | [docs.bastani.ai/compaction](https://docs.bastani.ai/compaction), README.md, [docs.bastani.ai/settings](https://docs.bastani.ai/settings) |
| 2.3 | [docs.bastani.ai/session-format](https://docs.bastani.ai/session-format), [docs.bastani.ai/sessions](https://docs.bastani.ai/sessions), [docs.bastani.ai/usage](https://docs.bastani.ai/usage) |
| 3.1 | [docs.bastani.ai/extensions](https://docs.bastani.ai/extensions) |
| 3.2 | examples/extensions/question.ts, [docs.bastani.ai/extensions](https://docs.bastani.ai/extensions) |
| 3.3 | [docs.bastani.ai/skills](https://docs.bastani.ai/skills), [docs.bastani.ai/packages](https://docs.bastani.ai/packages) |
| 3.4 | [docs.bastani.ai/themes](https://docs.bastani.ai/themes) |
| 4.1 | [docs.bastani.ai/json](https://docs.bastani.ai/json), [docs.bastani.ai/usage](https://docs.bastani.ai/usage) |
| 4.2 | [docs.bastani.ai/models](https://docs.bastani.ai/models), [docs.bastani.ai/providers](https://docs.bastani.ai/providers), [docs.bastani.ai/custom-provider](https://docs.bastani.ai/custom-provider) |
| 4.3 | [docs.bastani.ai/sdk](https://docs.bastani.ai/sdk), examples/sdk/01-minimal.ts |
| 5.1–5.2 | [docs.bastani.ai/subagents](https://docs.bastani.ai/subagents) |
| 5.3–5.4 | [docs.bastani.ai/intercom](https://docs.bastani.ai/intercom), [docs.bastani.ai/subagents](https://docs.bastani.ai/subagents) |
| 5.5 | [docs.bastani.ai/intercom](https://docs.bastani.ai/intercom) |
| 6.1–6.5 | [docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) |
| A.1 | [docs.bastani.ai/keybindings](https://docs.bastani.ai/keybindings) |
| A.2 | examples/extensions/permission-gate.ts |
| A.3 | examples/extensions/pirate.ts |
| A.4 | [docs.bastani.ai/prompt-templates](https://docs.bastani.ai/prompt-templates) |
| A.5–A.6 | [docs.bastani.ai/subagents](https://docs.bastani.ai/subagents) |
| A.7 | [docs.bastani.ai/intercom](https://docs.bastani.ai/intercom), [docs.bastani.ai/subagents](https://docs.bastani.ai/subagents) |
| A.8–A.10 | [docs.bastani.ai/workflows](https://docs.bastani.ai/workflows) |
