# Atomic crash course

A hands-on course for [Atomic](https://github.com/bastani-inc/atomic), the coding agent
that runs in your terminal. Six parts, thirty-ish lessons, roughly three hours end to end.
Every lesson is a thing you type and a thing you should see.

**Repo:** <https://github.com/bastani-inc/atomic> · **Docs:** <https://docs.bastani.ai/>

You start with a plain chat session and finish having written your own tools, skills,
themes, subagents, and a durable workflow with a bounded repair loop. The repo you are
reading this in **is** the workspace: the seed files the lessons edit are already here.

## Before you start

Install Atomic and run `/login` once for at least one provider — see the
[quickstart](https://docs.bastani.ai/quickstart).

Two lessons want extra pieces: [Ollama](https://ollama.com/) with
`ollama pull llama3.1:8b` for 4.2, and a Postgres reachable by Atomic for durable workflow
resume in 6.4, which degrades to non-durable without one.

## Setup

Clone this repo and open it with Atomic:

```bash
git clone https://github.com/bastani-inc/atomic-crash-course
cd atomic-crash-course
atomic -a
```

`-a` trusts this repo's project-local `.atomic/` resources — the extensions, skills,
themes, agents, and workflows the lessons create. Without it, Atomic ignores them. See
[project trust](https://docs.bastani.ai/security) and
[settings](https://docs.bastani.ai/settings).

The seed files are already committed:

| File | Used by |
|---|---|
| `greeter.ts` | Lessons 1.1, 1.2 |
| `src-client.ts` | Lessons 2.x, 5.x — has a planted null-check bug |
| `demo-app/server.js` | Lessons 6.4, 6.5 — has a planted hardcoded secret and a SQL injection |
| `notes.md`, `plan.md` | Context-reference lessons |
| `AGENTS.md` | Loaded automatically; keeps answers short |
| `.atomic/agents/strict-inspector.md` | Lesson 5.2 |
| `sdk-demo/` | Lesson 4.3 |

Two things to check before Part 4 and Part 5:

```bash
cd sdk-demo && npm install && cd ..   # once, needs network
git add -A && git commit -m wip       # worktree isolation needs a clean tree
```

The lessons write new files into `.atomic/`. To reset between runs,
`git clean -fd .atomic/` and re-checkout the seeds.

## How to read a lesson

Every lesson has the same three parts:

- **Try it** — numbered steps. A ```bash block is a shell command. A ```text block is a
  prompt you paste into Atomic verbatim.
- **What to notice** — the point of the exercise. Read it after you run the steps.
- **Reference** — the docs page that covers the feature properly.

Where two different results are both correct, the lesson says so. Model IDs in examples
may need swapping for ones your providers actually serve.

## Contents

**[Part 1 — Core interactive experience](#part-1--core-interactive-experience)**
· [1.1 Your first session](#11-your-first-session)
· [1.2 Hashline edits](#12-hashline-edits)
· [1.3 The agent interviews you](#13-the-agent-interviews-you)
· [1.4 File-based todos](#14-file-based-todos)

**[Part 2 — Session mastery](#part-2--session-mastery)**
· [2.1 Branching with tree, fork, clone](#21-branching-with-tree-fork-clone)
· [2.2 Verbatim compaction](#22-verbatim-compaction)
· [2.3 Sessions are just JSONL](#23-sessions-are-just-jsonl)

**[Part 3 — Customization](#part-3--customization)**
· [3.1 Build an extension](#31-build-an-extension)
· [3.2 Block a dangerous command](#32-block-a-dangerous-command)
· [3.3 Full-screen TUI tool](#33-full-screen-tui-tool)
· [3.4 Write a skill](#34-write-a-skill)
· [3.5 Custom theme](#35-custom-theme)

**[Part 4 — Platform](#part-4--platform)**
· [4.1 Headless print and JSON mode](#41-headless-print-and-json-mode)
· [4.2 Local models via models.json](#42-local-models-via-modelsjson)
· [4.3 Embed the agent with the SDK](#43-embed-the-agent-with-the-sdk)

**[Part 5 — Subagents and intercom](#part-5--subagents-and-intercom)**
· [5.1 Delegating to bundled specialists](#51-delegating-to-bundled-specialists)
· [5.2 Worktree-isolated parallel work](#52-worktree-isolated-parallel-work)
· [5.3 Planner–worker intercom coordination](#53-plannerworker-intercom-coordination)
· [5.4 Escalating to a human supervisor](#54-escalating-to-a-human-supervisor)
· [5.5 Intercom context handoff](#55-intercom-context-handoff)
· [5.6 A handoff command of your own](#56-a-handoff-command-of-your-own)

**[Part 6 — Workflows](#part-6--workflows)**
· [6.1 Touring the builtins](#61-touring-the-builtins)
· [6.2 Writing your own workflow](#62-writing-your-own-workflow)
· [6.3 Human-in-the-loop gates](#63-human-in-the-loop-gates)
· [6.4 Durability and resume](#64-durability-and-resume)
· [6.5 Security review with a repair loop](#65-security-review-with-a-repair-loop)

**[Extras](#extras)** — ten optional lessons: keybindings, permission gates, runtime
prompt mutation, prompt templates, parallel review, background subagents, intercom groups,
natural-language workflow authoring, workflow nesting, and autonomous loops.

---

## Part 1 — Core interactive experience

The interaction vocabulary every later part builds on: the TUI, file references, inline
shell, steering, safe edits, structured questions, and durable todos.

### 1.1 Your first session

Open a session and learn the four ways you talk to Atomic: prompts, `@` file references,
`!` shell commands, and queued steering messages.

**Try it**

1. From the repo root, start a session:

   ```bash
   atomic
   ```

2. Read the startup header. It lists your shortcuts (`/hotkeys` shows them all), the
   `AGENTS.md` files it loaded, and any prompt templates, skills, and extensions it found.
   The footer shows working directory, session name, token and cache usage, cost, context
   usage, and the current model.
3. Press CTRL+L (or type `/model`) to pick a model. Press SHIFT+Tab to cycle the thinking
   level — the editor border changes color with it.
4. Type `@`, fuzzy-pick `greeter.ts`, and send:

   ```text
   Explain @greeter.ts in two sentences.
   ```

5. Run shell without leaving the editor. `!` sends the output to the model; `!!` keeps it
   out of the model's context:

   ```text
   !bun greeter.ts
   !!ls -la
   ```

6. Start a longer task:

   ```text
   Add a farewell(name) function to greeter.ts, then write a one-paragraph doc comment for every function.
   ```

   While it works, type the correction below and press **Enter**. It is delivered as a
   steering message once the current turn finishes its tool calls:

   ```text
   Use "Goodbye" not "Farewell" in the string.
   ```

7. Now type the next message and press **ALT+Enter**. That queues a follow-up, delivered
   only after the agent finishes all work. Press **ALT+Up** to pull queued messages back
   into the editor:

   ```text
   Now run the file to prove it works.
   ```

**Editor keys**

| Feature | How |
|---------|-----|
| File reference | Type `@` to fuzzy-search project files |
| Path completion | Press Tab to complete paths |
| Multi-line input | SHIFT+Enter, or CTRL+Enter on Windows Terminal |
| Images | Paste with CTRL+V, ALT+V on Windows, or drag into the terminal |
| Shell command | `!command` runs and sends output to the model |
| Hidden shell command | `!!command` runs without sending output to the model |
| External editor | CTRL+G opens `$VISUAL` or `$EDITOR` |

**What to notice**

- The default tools are `read`, `bash`, `edit`, `write`, `find`, `search`,
  `ask_user_question`, and `todo`.
- Enter queues a steering message for the next turn boundary; ALT+Enter queues a follow-up
  for after all work completes. ALT+Up retrieves the queue without aborting the run.
- Escape and CTRL+C abort cooperatively and hold the queue, so nothing you typed is lost.
- `AGENTS.md` auto-loads from the working directory.

**Reference:** [quickstart](https://docs.bastani.ai/quickstart) · [usage](https://docs.bastani.ai/usage)

### 1.2 Hashline edits

Atomic patches files against a 4-hex snapshot tag instead of matching strings. You land a
surgical edit, then change the file behind the model's back and watch it detect the drift.

**Try it**

1. Send:

   ```text
   Read greeter.ts, then change only the greeting punctuation from "!" to "?!" using a single edit.
   ```

2. Press CTRL+O to expand tool output. The `read` result carries a `[greeter.ts#XXXX]`
   header with numbered lines, and the edit is a script anchored to that tag:

   ```text
   [greeter.ts#XXXX]
   replace 2..2:
   +  return "Hello, " + name + "?!";
   ```

3. Look at the edit result. It is compact and carries a **fresh tag** — no full-file reprint.
4. Change the file without telling the model, then ask for another edit:

   ```text
   !!printf '\n// external hotfix\n' >> greeter.ts
   ```

   ```text
   Now append "// reviewed" as the last line of greeter.ts.
   ```

   You will see either a recovery with a warning (the external change was provably
   non-overlapping and was preserved) or a clear failure quoting the current file hash —
   both are correct. You never get a blind overwrite.

**The operations**

`replace N..M:`, `replace block N:`, `delete N..M`, `delete block N`, `insert before N:`,
`insert after N:`, `insert after block N:`, `insert head:`, `insert tail:`.

**What to notice**

- Line numbers refer to the tagged snapshot, so they never shift mid-call.
- Tags are session-scoped. Unknown tags, overlapping stale edits, and unrecoverable drift
  all fail without writing.
- A byte-identical no-op edit returns a warning; repeated identical no-ops escalate to an
  error to break retry loops.

**Reference:** [tools](https://docs.bastani.ai/tools)

### 1.3 The agent interviews you

`ask_user_question` is the built-in human-in-the-loop primitive. Mid-task the agent
replaces the editor with a structured question UI and must honor your answers.

**Try it**

1. Send:

   ```text
   Scaffold a config file for this project, but do NOT write anything yet.
   First use the ask_user_question tool to ask me: (1) which format — JSON,
   TOML, or YAML; (2) whether it should include explanatory comments.
   Then create the file exactly per my answers.
   ```

2. The editor is replaced by the question UI. Answer with the arrow keys and Enter.
3. Watch the agent build the file from your answers.
4. Now take the tool away and repeat the same prompt. The agent has to decide alone:

   ```bash
   atomic --exclude-tools ask_user_question
   ```

**Tool flags**

| Option | Description |
|--------|-------------|
| `--tools <list>`, `-t <list>` | Allowlist specific built-in, extension, and custom tools |
| `--exclude-tools <list>`, `-xt <list>` | Denylist specific built-in, extension, and custom tools |
| `--no-builtin-tools`, `-nbt` | Disable built-in tools but keep extension/custom tools enabled |
| `--no-tools`, `-nt` | Disable all tools |

**What to notice**

- Answers land in the transcript as structured data, not as prose the model can re-read
  loosely.
- This is the primitive workflows build on; you meet the workflow-side version in Part 6.
- `--exclude-tools` removes one tool and leaves the rest available.

**Reference:** [quickstart](https://docs.bastani.ai/quickstart) · [usage](https://docs.bastani.ai/usage)

### 1.4 File-based todos

The agent plans work as durable files under `.atomic/todos/`: plain text, greppable,
git-shareable, and alive across restarts.

**Try it**

1. Send:

   ```text
   Plan test coverage for greeter.ts with the todo tool: create one todo per exported function, then list all todos.
   ```

2. Look at what it wrote:

   ```text
   !ls -la .atomic/todos/
   !cat .atomic/todos/*
   ```

3. Send:

   ```text
   Write the test for greet() now, then mark its todo done and show the remaining list.
   ```

**What to notice**

- Todos are ordinary project files, so they survive restarts and travel through git.
- `.atomic/todos/` is an inert state directory. Like `.atomic/sessions/`, it never triggers
  the project trust prompt.

**Reference:** [quickstart](https://docs.bastani.ai/quickstart) · [settings](https://docs.bastani.ai/settings)

---

## Part 2 — Session mastery

Sessions are trees in a single JSONL file. This part covers branching, deletion-only
compaction, and the on-disk format.

### 2.1 Branching with tree, fork, clone

Rewind to any earlier point, grow a second approach as a sibling branch, and split work
into new session files.

**Try it**

1. Send an approach and let it finish:

   ```text
   Approach A: add input validation to greet() using a thrown Error for empty names.
   ```

2. Press **Escape twice** (the default `doubleEscapeAction` is `tree`) or type `/tree`.
3. Move with ↑/↓. Press SHIFT+L on the Approach-A result and label it `approach-A`. Press
   CTRL+O to cycle filters: default, no-tools, user-only, labeled-only, all.
4. Select the Approach-A **user message**. It returns to the editor for editing. Replace it
   and submit — you get a new branch in the same file:

   ```text
   Approach B: add input validation to greet() that returns "Hello, stranger!" for empty names instead of throwing.
   ```

5. Type `/tree` again and switch back toward branch A. Atomic offers a branch summary with
   three choices: no summary, the default prompt, or custom focus instructions. Pick the
   default and read the summary it attaches.
6. Type `/fork`. You get a user-message selector, and the active path is copied into a
   **new session file** with that prompt pre-filled.
7. Type `/clone`. The current active branch is duplicated into a new file with an empty
   editor.
8. Type `/session` to get the session ID, then from a second terminal:

   ```bash
   atomic --fork <id>
   ```

**Tree controls**

| Key | Action |
|-----|--------|
| ↑/↓ | Navigate visible entries |
| ←/→ | Page up/down |
| CTRL+←/CTRL+→ or ALT+←/ALT+→ | Fold/unfold or jump between branch segments |
| SHIFT+L | Set or clear a label on the selected entry |
| SHIFT+T | Toggle label timestamps |
| Enter | Select entry |
| Escape/CTRL+C | Cancel |
| CTRL+O | Cycle filter mode |

**Which command to use**

| Feature | `/tree` | `/fork` | `/clone` |
|---------|---------|---------|----------|
| Output | Same session file | New session file | New session file |
| View | Full tree | User-message selector | Current active branch |
| Typical use | Explore alternatives in place | Start a new session from an earlier prompt | Duplicate current work before continuing |
| Summary | Optional branch summary | None | None |

**What to notice**

- Branching never deletes anything. Both approaches stay in the file.
- Set the default filter with `treeFilterMode` in settings.
- `--fork <path|id>` also works from the CLI and accepts a partial session UUID.

**Reference:** [sessions](https://docs.bastani.ai/sessions) · [compaction](https://docs.bastani.ai/compaction)

### 2.2 Verbatim compaction

Every other coding agent runtime compacts a full context window by summarizing it: a model
rewrites your transcript and you keep the rewrite. Atomic is the only one shipping today
that compacts **verbatim**. Nothing is rewritten. The planner only chooses line ranges to
delete, and every line that survives is byte-identical and still in order — so a quoted
error, a file path, or an exact command cannot come back subtly wrong. Spans you wrap in
`<keepContext>` are protected mechanically.

**Try it**

1. Fill the transcript:

   ```text
   Read greeter.ts, AGENTS.md, and every file under .atomic/todos, and summarize each.
   ```

2. Pin a constraint as a single message:

   ```text
   <keepContext>
   Repo rule: never rename exported functions in this repo.
   </keepContext>
   Acknowledge the rule above.
   ```

3. Note the context percentage in the footer, then run `/compact`. It takes no arguments.
4. Find the `✻ Context compacted` boundary card and expand it. Each deleted span is one
   line reading `(filtered N lines)`. Your `keepContext` block is still there, intact.
5. Prove the pinned rule survived:

   ```text
   What is the repo rule?
   ```

6. The knobs live in `.atomic/settings.json`:

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

**Pinning with `<keepContext>`**

Compaction ranks lines one at a time, and it is biased toward keeping what looks like the
task. A long restated objective survives; the single line that bounds it is the cheaper
deletion. That is how a long session drifts into confidently doing a broader version of
what you asked for. `<keepContext>` is the fix: the tagged span, including the tag lines,
is protected verbatim no matter how hard the transcript is compressed.

Tag the short things that change the meaning of the work:

- Constraints and prohibitions — "never rename exported functions", "do not touch `main`".
- Acceptance criteria and contracts the result is judged against.
- Identifiers a session must not lose — a branch name, a worktree path, an issue number,
  a run ID.
- A late correction. A mid-run instruction is one short message competing with a whole
  transcript, so it is exactly the thing compaction drops first.

Do not tag bulk material. Protected lines count against the keep budget rather than raising
it, so a large pinned block forces everything around it to compress harder. Pin the rule,
not the file the rule applies to — pass bulk context as files the agent can re-read.

**Compaction settings**

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `compaction.enabled` | boolean | `true` | Enable automatic verbatim line compaction |
| `compaction.reserveTokens` | number | `16384` | Tokens reserved for the next model response; automatic threshold compaction begins before this reserve is consumed |
| `compaction.compression_ratio` | number | `0.5` | Fraction of compactable transcript **lines to keep** (`0 < value < 1`) |
| `compaction.preserve_recent` | number | `2` | Exact number of newest context-visible messages kept outside the compactable region; `0` keeps none |
| `compaction.query` | string | last user message | Optional relevance focus for selecting older lines to retain |

**What to notice**

- The model never writes, summarizes, reorders, or normalizes retained text.
- Protection is mechanical, not advisory: deletion ranges are split around protected lines
  *after* the planner responds, so a protected line survives even if the planner ignores
  its instructions.
- Automatic compaction is on by default. It triggers when you approach the limit and also
  recovers from provider context overflow by compacting and retrying the turn.
- The full history stays in the JSONL file; only the model's view shrinks.
- `settings.fallbackModels` may be borrowed for the planner request, and that model would
  then see the transcript.

**Reference:** [compaction](https://docs.bastani.ai/compaction) · [settings](https://docs.bastani.ai/settings)

### 2.3 Sessions are just JSONL

The whole session — tree links, tool calls, compaction markers — is one JSONL file. Its
path is injected into every bash call as `$ATOMIC_SESSION_FILE`.

**Try it**

1. Name the session, then inspect it:

   ```text
   /name Atomic crash course
   /session
   ```

   You get the file path, ID, message count, tokens, and cost.
2. Read the raw file from inside the session:

   ```text
   !!head -c 600 "$ATOMIC_SESSION_FILE"
   ```

3. Walk the `id` → `parentId` chain that makes the tree work:

   ```text
   !!cat "$ATOMIC_SESSION_FILE" | python3 -c "import sys,json; [print(json.loads(l).get('type'), json.loads(l).get('id'), '->', json.loads(l).get('parentId')) for l in sys.stdin if l.strip()]" | head -20
   ```

4. Export to HTML and open it in a browser:

   ```text
   /export demo-session.html
   ```

5. `/share` uploads a private GitHub gist and returns a shareable link. Treat exports and
   shares as sensitive: transcripts can contain source code, file paths, and credentials.
   Review before sharing.
6. Quit, then resume. `-c` continues the most recent session; `-r` opens a picker where
   CTRL+P filters by path, CTRL+N by name, and CTRL+D deletes:

   ```bash
   atomic -c
   atomic -r
   ```

**Where files live**

```text
~/.atomic/agent/sessions/--<path>--/<timestamp>_<uuid>.jsonl
```

`<path>` is the working directory with `/` replaced by `-`. Every entry shares a base shape:

```typescript
interface SessionEntryBase {
  type: string;
  id: string;               // 8-char hex ID
  parentId: string | null;  // Parent entry ID (null for first entry)
  timestamp: string;        // ISO timestamp
}
```

**Session environment variables**

Every foreground or background bash execution receives one execution-time snapshot of the
active session:

| Atomic variable | Compatibility alias | Value |
|-----------------|---------------------|-------|
| `ATOMIC_SESSION_ID` | `PI_SESSION_ID` | Active session ID |
| `ATOMIC_SESSION_FILE` | `PI_SESSION_FILE` | Active session JSONL path; omitted for unsaved sessions |
| `ATOMIC_PROVIDER` | `PI_PROVIDER` | Active model provider; omitted when no model is selected |
| `ATOMIC_MODEL` | `PI_MODEL` | Active model ID; omitted when no model is selected |
| `ATOMIC_REASONING_LEVEL` | `PI_REASONING_LEVEL` | Active reasoning level |

**What to notice**

- The `id`/`parentId` chain is why `/tree` needs no extra index files.
- The format is plain JSONL, so grep, jq, and python all work on it directly.

**Reference:** [session-format](https://docs.bastani.ai/session-format) · [sessions](https://docs.bastani.ai/sessions) · [usage](https://docs.bastani.ai/usage)

---

## Part 3 — Customization

Four ways to reshape Atomic itself: extensions add tools and commands, custom UI components take over the screen, skills load instructions on demand, and themes recolor the whole TUI. Everything here is project-local, lives in `.atomic/`, and hot-reloads.

### 3.1 Build an extension

An extension is one TypeScript file. No manifest, no build step. This one reacts to a
session event, registers an LLM-callable `greet` tool, and adds a `/hello` command.

Atomic auto-discovers extensions from four locations:

| Location | Scope |
|----------|-------|
| `~/.atomic/agent/extensions/*.ts` | Global (all projects) |
| `~/.atomic/agent/extensions/*/index.ts` | Global (subdirectory) |
| `.atomic/extensions/*.ts` | Project-local |
| `.atomic/extensions/*/index.ts` | Project-local (subdirectory) |

Only extensions in those locations can be hot-reloaded with `/reload`.

**Try it**

In a running Atomic session, have the agent write the extension for you. Paste this prompt and the TypeScript block after it as one message:

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

Then, in the same session:

1. Run `/reload`. The `Extension loaded!` notification confirms it loaded.
2. Run the new command: `/hello world`. You get a notification back.
3. Make the model call your tool:

   ```text
   Use the greet tool to greet someone named Ada.
   ```

4. Edit the greeting text in the file, run `/reload`, and run `/hello` again to see the change.

**What to notice**

- Plain TypeScript with TypeBox schemas. The tool signature you declare is the schema the model sees.
- Three different surfaces from one file: an event handler, a tool the model can call, and a slash command only you can call.
- `/reload` re-reads auto-discovered extensions without restarting the session. For a file outside those locations, quick-test it with `atomic -e ./my-extension.ts`.

**Reference:** [extensions](https://docs.bastani.ai/extensions)

### 3.2 Block a dangerous command

Same API, different job. Extensions are also a policy layer: the `tool_call` event fires
before a tool runs, and returning `{ block: true, reason }` stops it. Here you put a confirm
dialog in front of `rm -rf`.

**Try it**

1. Paste this prompt and the TypeScript block after it as one message:

   ```text
   Create .atomic/extensions/safe-bash.ts with EXACTLY the TypeScript content below, byte for byte:
   ```

   ```typescript
   import type { ExtensionAPI } from "@bastani/atomic";

   export default function (pi: ExtensionAPI) {
     pi.on("tool_call", async (event, ctx) => {
       if (event.toolName !== "bash") return;
       if (!event.input.command?.includes("rm -rf")) return;

       const ok = await ctx.ui.confirm("Dangerous!", "Allow rm -rf?");
       if (!ok) return { block: true, reason: "Blocked by user" };
     });
   }
   ```

2. Run `/reload`, then trip the interceptor:

   ```text
   Run this exact bash command: rm -rf /tmp/does-not-exist-demo
   ```

   A confirm dialog appears. Choose **No**.
3. Expand the tool output with CTRL+O. The model receives `Blocked by user` as the tool
   result and carries on instead of failing.
4. Run it again and choose **Yes**. The command executes normally.

**What to notice**

- The handler returns nothing for calls it does not care about. Returning `undefined` means
  "no opinion", so an interceptor stays cheap.
- The block reason goes to the model as the tool result, so it can explain itself or pick
  another approach. It is not a crash.
- This gate only covers one string in one tool. [A.2](#a2-permission-gate-extension) builds
  the real version: a pattern list, and a hard block when there is no UI to confirm with.
- Atomic ships more guardrails built the same way: `permission-gate.ts`,
  `protected-paths.ts`, `confirm-destructive.ts`, and `dirty-repo-guard.ts`.

**Reference:** [extensions](https://docs.bastani.ai/extensions)

### 3.3 Full-screen TUI tool

Extensions are not limited to notifications. `ctx.ui.custom()` replaces the chat editor with your own keyboard-driven component until you call `done()`. The shipped `question.ts` example uses it to render an options list plus an inline editor.

The `ctx.ui.custom()` callback receives:

- `tui` — TUI instance, for screen dimensions and focus management
- `theme` — current theme, for styling
- `keybindings` — app keybinding manager, for checking shortcuts
- `done(value)` — call to close the component and return a value

**Try it**

1. Copy the shipped 285-line example into this repo rather than retyping it:

   ```bash
   cp "$(find ~/.cache/.bun ~/.bun ~/.local/share/bun /usr/local/lib /opt/homebrew/lib -path '*@bastani/atomic/examples/extensions/question.ts' -print -quit 2>/dev/null)" .atomic/extensions/question.ts
   ```

2. Run `/reload`.
3. Ask the model to use it:

   ```text
   Use the question tool to ask me which database we should use for the demo app. Offer Postgres, SQLite, and Redis with one-line descriptions each.
   ```

4. Navigate the options with ↑ and ↓. Select the `Type something...` row to open an inline editor, press Escape to go back to the options, then pick an option.
5. Look at the transcript. The tool call and its result render as custom colored components via `renderCall` and `renderResult`, not as raw JSON.

**What to notice**

- The same API backs the shipped `snake.ts`, `space-invaders.ts`, and `doom-overlay/` extensions.
- Extensions, tools, hooks, and render components run in a supervised child process. The terminal host keeps stdin and rendering, so a busy loop in one callback cannot freeze your keyboard or the spinner.
- Escape in the editor returns to the options list; Escape in the options list cancels the whole tool call.

**Reference:** [extensions](https://docs.bastani.ai/extensions)

### 3.4 Write a skill

A skill is a folder with a `SKILL.md` and optional helper scripts. Only its name and description sit in the system prompt. The full instructions load on demand when a task matches, or when you force it with `/skill:name`.

`SKILL.md` frontmatter has two required fields:

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Max 64 chars. Lowercase a-z, 0-9, hyphens. Must match the parent directory. |
| `description` | Yes | Max 1024 chars. What the skill does and when to use it. |

A skill with no `description` is not loaded at all.

**Try it**

One prompt creates the whole skill. Paste it into a running session:

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

Then:

1. Restart `atomic` from the repo root so the skill is discovered. Its name and description now sit in the system prompt inventory.
2. Trigger it indirectly, without naming the skill:

   ```text
   Who are the main contributors to this repo and which files churn the most?
   ```

   The agent reads `SKILL.md`, then runs the helper script.
3. Force-load it instead: run `/skill:repo-stats`. Anything you type after the command is appended to the skill content as `User: <args>`.
4. Skills also ship with Atomic. Take a deliberately vague prompt and have one rewrite it:

   ```text
   /skill:prompt-engineer Rewrite this vague prompt into a precise one I can paste back: "make the client code better"
   ```

   The skill's full instructions load, and you get back a prompt with a concrete target
   file, a definition of "better", constraints, and a success check — instead of an agent
   guessing what you meant.
5. Paste the rewritten prompt into the same session and compare the result with what
   `make the client code better` would have produced against `src-client.ts`.

**Bundled skills worth knowing**

| Skill | Use it for |
|---|---|
| `prompt-engineer` | Turn a vague ask into a precise one. Also for writing and debugging prompts. |
| `tdd` | Red-green-refactor. Forces a failing test before the fix. |
| `playwright-cli` | Drive a real browser: click through a page, assert behavior, record what happened. |
| `tmux` | Control interactive CLIs — send keys, capture output, watch for a prompt. |
| `impeccable` | Frontend work: layout, hierarchy, spacing, color, motion, accessibility, UX copy. |

Others ship too: `liteparse` (pull data out of PDF/DOCX/XLSX), `subagent`, `intercom`,
`create-spec`, `research-codebase`, and `skill-creator`. Run `/skill:` and let the
completion list show you what is loaded.

**What to notice**

- Progressive disclosure: the description is always in context, the instructions are not. That is why a vague description means the skill never fires.
- Models do not always load a matching skill on their own. `/skill:name` is the deterministic path.
- The bundled skills are the same format as the one you just wrote. Read one for a working example of a good description and a helper script.
- Skills written for other harnesses work unchanged. Add their directories to the `skills` array in settings:

  ```json
  {
    "skills": [
      "~/.claude/skills",
      "~/.codex/skills"
    ]
  }
  ```

- To share your own, put `extensions/`, `skills/`, `prompts/`, and `themes/` in a package with an `atomic` key in `package.json`, then run `atomic install ./my-pkg` or `atomic install npm:@you/pkg`. Try before installing with `atomic -e ./my-pkg`.

**Reference:** [skills](https://docs.bastani.ai/skills) · [packages](https://docs.bastani.ai/packages)

### 3.5 Custom theme

The entire TUI is themeable from one JSON file. `vars` keeps the palette DRY, `$schema` gives you editor autocomplete, and editing the currently active theme reloads it instantly.

Colors accept four formats:

| Format | Example | Description |
|--------|---------|-------------|
| Hex | `"#ff0000"` | 6-digit hex RGB |
| 256-color | `39` | xterm 256-color palette index (0-255) |
| Variable | `"primary"` | Reference to a `vars` entry |
| Default | `""` | Terminal's default color |

`name` is required, must be unique, and must not contain `/`. `colors` must define all 51 tokens. `vars` is optional.

**Try it**

Have the agent write the theme file. Paste this prompt and the JSON block after it as one message:

```text
Create .atomic/themes/my-theme.json with EXACTLY the JSON below.
```

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

Then:

1. Open `/settings` and select the theme `my-theme`.
2. Change one variable and watch the TUI recolor as the edit lands:

   ```text
   In .atomic/themes/my-theme.json, change the "primary" var to "#ff6600".
   ```

   Editing the file yourself in a second terminal has the same effect.
3. In `settings.json`, set `"theme": "catppuccin-latte/catppuccin-mocha"` to follow your terminal's light/dark scheme automatically.
4. Let the agent design one from scratch:

   ```text
   Create a Gruvbox-inspired theme at .atomic/themes/gruvbox-live.json with all 51 required tokens, then tell me to select it in /settings.
   ```

**What to notice**

- Hot reload only applies to the theme that is currently active. Editing an inactive theme file changes nothing until you select it.
- Six themes ship built in: `dark`, `light`, `catppuccin-frappe`, `catppuccin-latte`, `catppuccin-macchiato`, and `catppuccin-mocha`.
- Global themes live in `~/.atomic/agent/themes/*.json`; the project-local ones you just wrote live in `.atomic/themes/`.
- `""` means the terminal's own default color, which is how a theme stays readable on a background it was not designed for.

**Reference:** [themes](https://docs.bastani.ai/themes) · [settings](https://docs.bastani.ai/settings)

---

## Part 4 — Platform

Atomic is not only a TUI. The same agent runs headless in a pipe, talks to any
OpenAI-compatible model server, and embeds in your own TypeScript as a library.
Run everything in this Part from the repo root unless a step says otherwise.

### 4.1 Headless print and JSON mode

Atomic reads stdin, writes to stdout, and can emit its entire session as typed JSON
lines. This is the shell-first lesson: the CLI itself is the subject.

**Try it**

1. Pipe a file in. Print mode merges piped stdin into your prompt:

   ```bash
   cat AGENTS.md | atomic -p "Summarize this text"
   ```

2. Attach a file with `@` instead:

   ```bash
   atomic -p @greeter.ts "What does this file do?"
   ```

3. Build a read-only reviewer by allowlisting tools. With no `edit`, `write`, or
   `bash` in the list, the agent cannot change anything:

   ```bash
   atomic --tools read,search,find,ls -p "Review the code"
   ```

4. Switch to the JSON event stream and filter it with `jq`:

   ```bash
   atomic --mode json "List files" 2>/dev/null | jq -c 'select(.type == "message_end")'
   ```

5. Drop the `jq` filter and read the raw stream. The first line is the session header,
   `{"type":"session","version":3,"id":"uuid","timestamp":"...","cwd":"/path"}`, followed
   by typed events: `agent_start`, `turn_start`, `message_update` deltas,
   `tool_execution_start`, `tool_execution_end`, `agent_end`.

The tool flags you will reuse throughout this course:

| Option | Description |
|--------|-------------|
| `--tools <list>`, `-t <list>` | Allowlist specific built-in, extension, and custom tools |
| `--exclude-tools <list>`, `-xt <list>` | Denylist specific tools |
| `--no-builtin-tools`, `-nbt` | Disable built-in tools, keep extension and custom tools |
| `--no-tools`, `-nt` | Disable all tools |

**What to notice**

- The event vocabulary is a published TypeScript union, `AgentEvent`, with variants for
  agent, turn, message, and tool-execution lifecycles. The SDK and RPC modes consume the
  identical stream.
- `--tools` is an allowlist, so a read-only agent is provable rather than promised.
- JSON mode keeps stdout clean JSONL. Diagnostics go to stderr, which is why step 4
  redirects it.

**Reference:** [json](https://docs.bastani.ai/json) · [usage](https://docs.bastani.ai/usage)

### 4.2 Local models via models.json

One JSON file adds any OpenAI-compatible server, including Ollama, LM Studio, and vLLM.
Atomic re-reads it every time you open `/model`, so edits land without a restart.

This lesson uses `~/.atomic/agent/models.json`. It is global on purpose: Atomic reads
`models.json` from the agent directory, not from the project. To run local inference you
need Ollama running with `ollama pull llama3.1:8b`. Without it, you can still do steps 1,
3, 4, and 5 and skip step 2.

**Try it**

1. Ask Atomic to write the config for you:

   ```text
   Create ~/.atomic/agent/models.json with EXACTLY the JSON below.
   ```

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

   For a local model only `id` is required.

2. Open `/model`. The ollama entries appear alongside your cloud models. Select
   `llama3.1:8b` and prompt:

   ```text
   Write a haiku about terminals.
   ```

   That inference runs entirely on your machine.

3. Edit `models.json` and add `"name": "Llama 3.1 8B (Local)"` to the model entry. Reopen
   `/model`. The new label is there — no restart. An invalid edit reports an error instead.

4. Run `/login` for the subscription tour. Atomic supports ChatGPT Plus/Pro (Codex),
   Claude Pro/Max, GitHub Copilot, OpenRouter, Kimi Code, xAI, and Radius. Environment
   variables such as `ANTHROPIC_API_KEY` also work.

5. For scripted discovery, run `atomic --list-models` in a shell.

**What to notice**

- `apiKey` is required by the schema but Ollama ignores it, so any value works.
- Two `compat` flags fix strict servers: set `compat.supportsDeveloperRole` to `false`
  when the server rejects the `developer` role, and `compat.supportsReasoningEffort` to
  `false` when it rejects `reasoning_effort`.
- Extensions can call `pi.registerProvider()` to proxy or replace a provider outright.

**Reference:** [models](https://docs.bastani.ai/models) · [providers](https://docs.bastani.ai/providers) · [custom-provider](https://docs.bastani.ai/custom-provider)

### 4.3 Embed the agent with the SDK

The whole agent — tools, skills, extensions, session persistence — is a library. Twenty
lines of TypeScript create a session, subscribe to the same event stream as `--mode json`,
and prompt it. This lesson uses the `sdk-demo/` directory, which already has
`@bastani/atomic` installed.

**Try it**

1. Ask Atomic to create the script:

   ```text
   Create sdk-demo/agent.ts with EXACTLY the TypeScript below.
   ```

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

2. Run it. Both runners execute the TypeScript directly:

   ```bash
   cd sdk-demo && bun run agent.ts
   ```

   You should see tokens stream in from a full agent session.

3. Browse the shipped example ladder, 13 files from minimal to full session runtime:

   ```bash
   ls sdk-demo/node_modules/@bastani/atomic/examples/sdk/
   ```

4. Read the `AgentSession` surface you just used. The interface also exposes
   `steer()` and `followUp()` for queueing during streaming, plus `setModel()`,
   `setThinkingLevel()`, `compact()`, `abort()`, and `navigateTree()`:

   ```typescript
   interface AgentSession {
     // Send a prompt and wait for completion
     prompt(text: string, options?: PromptOptions): Promise<void>;

     // Queue messages during streaming
     steer(text: string): Promise<void>;
     followUp(text: string): Promise<void>;
   ```

5. Restrict what an embedded agent may do with the same vocabulary as the CLI:
   `createAgentSession({ tools: ["read", "bash"] })` or
   `createAgentSession({ excludedTools: ["ask_user_question"] })`.

**What to notice**

- With no options, the SDK discovers skills, extensions, tools, and context files from the
  cwd and `~/.atomic/agent`, and picks a model from settings or the first available one.
- The events are the same union as `--mode json`, so a web UI and a shell pipeline consume
  one stream.
- `SessionManager.inMemory()` versus a persistent session manager is a single-line switch
  between throwaway and resumable sessions.
- These are the four ways to run Atomic: interactive, print/JSON, RPC, and SDK.

**Reference:** [sdk](https://docs.bastani.ai/sdk) · [json](https://docs.bastani.ai/json)

---

## Part 5 — Subagents and intercom

Atomic can split work across child agents and let independent sessions talk to each
other. Run every lesson from the repo root, and commit outstanding changes first —
lesson 5.2 needs a clean worktree:

```bash
git add -A && git commit -q -m wip
```

Terminal names used below (`Terminal A`, `Terminal B`, `Terminal C`) are just labels
for separate terminals or panes. Each one starts in the repo root.

### 5.1 Delegating to bundled specialists

Ask for work in plain language and Atomic decides whether to delegate, which bounded
specialist fits, and how to run it. A read-only child starts with fresh context,
streams its progress into your conversation, and returns cited findings.

**Try it**

1. Start a session:

   ```bash
   atomic
   ```

2. Delegate without naming a tool. Type this prompt:

   ```text
   Map the validate/fetchUser flow with focused subagents before we change it.
   ```

3. Watch the foreground stream. Child progress appears inline and the parent waits
   until the result returns.
4. Call a specialist explicitly:

   ```text
   Use subagent({ agent: "codebase-analyzer", task: "Trace the validate() data flow with file references." }) and summarize.
   ```

5. Run the custom agent you created during setup:

   ```text
   Run the strict-inspector agent on the current diff.
   ```

6. Preload files as read context with the `reads` form:

   ```text
   /run strict-inspector[reads=notes.md+plan.md]
   ```

**What to notice**

- `@bastani/subagents` ships with Atomic. Nothing to install.
- Read-only agents cannot edit files, so an analysis run cannot damage your tree.
- Children never receive the `subagent` tool. Nesting is capped at five levels and
  can be lowered with `ATOMIC_SUBAGENT_MAX_DEPTH`, the extension's
  `config.maxSubagentDepth`, or agent frontmatter. Higher values are clamped.
- A custom agent is a single Markdown file: `.atomic/agents/**/*.md` for the project,
  `~/.atomic/agent/agents/**/*.md` for your user scope.

The bundled agents:

| Agent | Use it for | Edits files? |
|---|---|---|
| `codebase-locator` | Find relevant files, directories, tests, configs, and docs for a topic. | No |
| `codebase-analyzer` | Explain how specific code works and trace data flow with file references. | No |
| `codebase-pattern-finder` | Find similar implementations, conventions, and test examples to model after. | No |
| `codebase-research-locator` | Locate prior `research/` and `specs/` documents related to the task. | No |
| `codebase-research-analyzer` | Extract decisions, constraints, and still-relevant conclusions from prior local docs. | No |
| `codebase-online-researcher` | Research official docs, ecosystem behavior, and open-source references online. | Research notes only |
| `debugger` | Reproduce a failure, prove its root cause, apply the smallest fix, and rerun it. | Yes |
| `code-simplifier` | Simplify recently changed code under its behavior-preservation rubric. | Yes |
| `worker` | Implement an approved task, validate the change, and escalate scope decisions. | Yes |

**Reference:** [subagents](https://docs.bastani.ai/subagents)

### 5.2 Worktree-isolated parallel work

Two editing children can change the same repository at once. Setting `worktree: true`
gives each child its own git worktree, so concurrent edits cannot clobber each other,
and you get a separate diff per child to merge deliberately.

**Try it**

This lesson needs two terminals, both in the repo root: Terminal A runs Atomic,
Terminal B is a plain shell.

1. **Terminal B** — confirm the working tree is clean:

   ```bash
   git status --short
   ```

2. **Terminal A** — start Atomic and prompt:

   ```text
   Run two worker subagents in parallel with worktree isolation: one adds a null-check to validate() in src-client.ts, the other adds a timeout to fetchUser(). Use worktree: true so their edits cannot clobber each other, and show me each child's diff when done.
   ```

3. **Terminal B** — while the run is in flight, list the isolated worktrees:

   ```bash
   git worktree list
   ```

4. **Terminal A** — read the per-child diffs in the result.

**What to notice**

- Run-owned worktrees stay attached until every child closes. Atomic captures their
  diffs before cleanup, so nothing is lost when the worktrees disappear.
- `context: "fresh"` starts a child with only the task and its agent context.
  `context: "fork"` branches a real child session from the parent leaf and fails fast
  rather than silently downgrading to fresh.
- Prefer fresh context for review and research, forked context when a writer needs
  the parent conversation.
- A top-level parallel call supports up to 50 children (`parallel.maxTasks`), while
  `parallel.concurrency` bounds how many run at the same time.

**Reference:** [subagents](https://docs.bastani.ai/subagents)

### 5.3 Planner–worker intercom coordination

Two independent Atomic sessions can message each other. You name them, send a
fire-and-forget task, then have the worker block on a question until the planner
answers. Everything is driven by ordinary prompts.

**Try it**

This lesson needs two terminals, both in the repo root, each running `atomic`.

1. Name the sessions. **Terminal A**: `/name planner`. **Terminal B**: `/name worker`.
2. **Terminal A** — see who is connected:

   ```text
   List active intercom sessions.
   ```

   The result shows each session's name, short ID, working directory, model, and live
   status (`idle`, `thinking`, or `tool:<name>`). Every short ID shown is a valid target.
3. **Terminal A** — delegate:

   ```text
   Send this to worker over intercom: "Task-1: Add a null check to validate() in src-client.ts. Ask me if anything's unclear."
   ```

4. **Terminal B** — the message arrives inline with sender info and a reply hint. Now
   block on a question:

   ```text
   Ask planner over intercom: "Should validate() return false for null email, or throw?" and wait for the answer before editing.
   ```

5. **Terminal A** — answer it:

   ```text
   Reply over intercom: "Return false for null email — never throw from validate()."
   ```

6. **Terminal B** — the reply comes back as the `ask` tool result in the same turn and
   the worker edits the file. Check the diff.
7. **Terminal A** — press **ALT+M** (or run `/intercom`) to open the human session
   picker and compose overlay, then send a message by hand.
8. **Terminal A** — attach code to a message:

   ```text
   Send worker an intercom message "Here's the fix:" with a snippet attachment named auth.ts containing the corrected validate() body.
   ```

**What to notice**

- `send` is fire-and-forget. `ask` blocks until the recipient replies, with a
  10-minute timeout and one pending ask per session — a second concurrent ask returns
  "Already waiting for a reply".
- Because the `ask` reply returns as the tool result, the worker keeps its full
  context and continues in the same turn.
- Messages persist in session history as `intercom_sent` and `intercom_received`, so
  the exchange is auditable afterwards.
- The broker auto-spawns over a local Unix socket or named pipe and exits five seconds
  after the last session disconnects. It is same-machine only.
- Set `confirmSend: true` in `~/.atomic/agent/intercom/config.json` to require an
  approval dialog before outbound messages. `/skill:intercom` bundles copy-paste patterns.

Which verb to use:

| Situation | Verb | Why |
|---|---|---|
| Task delegation | `send` | Fire-and-forget; the planner does not need an ack. |
| Clarification request | `ask` | The worker needs the answer to proceed, so it blocks. |
| Discovery escalation | `ask` | The worker needs approval before changing course. |
| Completion report | `ask` | The planner may have follow-up instructions. |

**Reference:** [intercom](https://docs.bastani.ai/intercom)

### 5.4 Escalating to a human supervisor

Delegated children get a hotline to their supervisor. A worker subagent blocks
mid-run on `need_decision`, you answer over intercom, and the child continues with
your decision as its tool result. A structured `interview_request` collects several
machine-readable answers in one exchange.

**Try it**

Continue in the `planner` session from lesson 5.3.

1. Connect the parent so it can authorize the child's supervisor capability. This step
   is required; intercom connections are lazy and tool-driven.

   ```text
   Check intercom status.
   ```

2. Delegate work that must escalate:

   ```text
   Delegate to the worker subagent: "Harden validate() in src-client.ts. Before choosing between returning false or throwing on null email, you MUST escalate with contact_supervisor reason need_decision and wait for my answer. Then implement exactly what I decide."
   ```

3. The escalation arrives formatted with run metadata (`Run: <id>`, `Agent: worker`,
   `Child index: 0`). Answer it:

   ```text
   Reply over intercom: "Return false. Do not throw."
   ```

4. The child receives your answer as its tool result and finishes. Review the edit.
5. Try the structured variant:

   ```text
   Delegate to the worker subagent: "Before editing anything, send me a contact_supervisor interview_request titled 'Hardening choices' with two questions: a single-choice question id 'null' asking 'How should null email be handled?' with options ['Return false','Throw'], and a text question id 'tests' asking 'Which test command should I run?'. Wait for my structured answers, then implement."
   ```

6. Reply with fenced JSON:

   ```json
   {
     "responses": [
       { "id": "null", "value": "Return false" },
       { "id": "tests", "value": "npx tsc --noEmit" }
     ]
   }
   ```

**What to notice**

- Normal sessions never see `contact_supervisor`. It registers only when the subagent
  runtime sets `ATOMIC_SUBAGENT_ORCHESTRATOR_TARGET`, `ATOMIC_SUBAGENT_RUN_ID`,
  `ATOMIC_SUBAGENT_CHILD_AGENT`, and `ATOMIC_SUBAGENT_CHILD_INDEX`.
- Interview questions use the shape `{ id, type, question, options?, context? }` with
  types `single`, `multi`, `text`, `image`, and `info`. A valid structured reply lands
  in `details.structuredReply`.
- The child's ask detaches from the blocking parent tool call, so parent and child
  cannot deadlock.
- Escalation depends on the child following its task text, which is the documented
  pattern. If the child implements without asking, restate the requirement and rerun.

The three reasons:

| Reason | Behavior | Use when |
|---|---|---|
| `need_decision` | Sends a formatted ask and blocks until the supervisor replies (10-minute timeout). | The child is blocked, uncertain, needs approval, or faces a product, API, or scope decision. |
| `interview_request` | Sends structured questions and blocks until the supervisor replies. | The child needs several machine-readable answers in one exchange. |
| `progress_update` | Fire-and-forget update. | Meaningful progress or a discovery that changes the plan. |

**Reference:** [intercom](https://docs.bastani.ai/intercom) · [subagents](https://docs.bastani.ai/subagents)

### 5.5 Intercom context handoff

A session that already knows the project can package what it knows into attachments
and hand it to a brand-new session. The new session then answers project questions
without reading a single file.

**Try it**

This lesson needs two terminals: Terminal A is the `planner` session from lessons 5.3
and 5.4, and Terminal C is a new terminal in the repo root.

1. **Terminal C** — start a session with zero context and name it:

   ```bash
   atomic
   ```

   ```text
   /name fresh
   ```

2. **Terminal C** — register with the broker. Connections are lazy, so this step is
   required before anyone can target `fresh`:

   ```text
   Start an intercom session: check intercom status and list the active intercom sessions.
   ```

3. **Terminal A** — confirm the new session is visible:

   ```text
   List intercom sessions.
   ```

4. **Terminal A** — hand off the context:

   ```text
   Hand off your project context to the session named "fresh" over intercom: send one message summarizing this repo and our decisions, with a context attachment named "project-briefing" containing the full handoff notes (what validate() and fetchUser() do, the null-email decision from earlier, remaining tasks), and a snippet attachment named "src-client.ts" (language typescript) containing the current validate() body.
   ```

5. **Terminal C** — the handoff arrives inline with sender info and a reply hint.
   Attachment content is part of the agent-visible message body.
6. **Terminal C** — prove the transfer worked:

   ```text
   Using only the handed-off context — do not read any files — what does validate() return for a null email, and why was throwing rejected? What tasks remain?
   ```

7. **Terminal C** — ask a blocking follow-up:

   ```text
   Ask planner over intercom: "Anything else I should know before I take over this work?"
   ```

8. **Terminal A** — answer, and Terminal C continues in the same turn:

   ```text
   Reply over intercom: "Run npx tsc --noEmit after any edit; nothing else pending."
   ```

**What to notice**

- `send`, `ask`, and `reply` all accept `attachments`, an array of
  `{ type, name, content, language? }` where `type` is `"file"`, `"snippet"`, or
  `"context"`. Attachments work over the protocol but not in the ALT+M compose overlay.
- `fresh` appeared in the session list only after it invoked an intercom surface. The
  list shows intercom-connected sessions, not every Atomic process on the machine.
- Both sides persist `intercom_sent` and `intercom_received` entries, so a handoff is
  auditable later.

The `intercom` actions:

| Action | Behavior |
|---|---|
| `list` | Returns the current session plus other connected sessions with name, short ID, working directory, model, and live status. Every short ID shown is a valid target. |
| `send` | Fire-and-forget delivery. Requires `to` and `message`. Cannot message the current session. |
| `ask` | Sends a message and blocks until the recipient replies (10-minute timeout). The reply returns as the tool result. |
| `reply` | Replies to the intercom message of the current turn, otherwise to the single unresolved inbound ask. With several pending, pass `to` or check `pending` first. |
| `pending` | Lists unresolved inbound asks with sender, message ID, elapsed time, and a preview. |
| `status` | Shows connection status, session ID, and the number of active sessions. |

**Reference:** [intercom](https://docs.bastani.ai/intercom)

### 5.6 A handoff command of your own

The usual way to move work between agents is a file: compact the conversation into a
markdown brief, drop it in a temp directory, point a fresh agent at the path. It works, and
it has three known failure modes. The path differs per machine and gets cleared. The
document is a dead copy the moment it is written. And the next agent treats it as a
contract it cannot cross-examine, so one belief written as a fact poisons everything after
it.

Intercom removes all three. You deliver the brief straight into a running session, and the
session that wrote it is still on the other end of `ask`. The primary source stays alive.
Wrap it in a prompt template and you have a `/handoff` command that encodes your own rules
for what travels.

**Try it**

This lesson needs the two sessions from 5.5: `planner` in Terminal A and `fresh` in
Terminal C.

1. **Terminal A** — create the template:

   ```text
   Create .atomic/prompts/handoff.md with EXACTLY this content:

   ---
   description: Hand this session's context to another Atomic session over intercom
   argument-hint: "<session-name> <what the next session should do>"
   ---
   Hand off to the intercom session named "$1". The next session's job: ${@:2}

   Build the brief for THAT job only, then deliver it with one intercom `send`.

   Message body, in this order:
   1. One sentence naming what the next session is taking over.
   2. A `<keepContext>` block, under ten lines, holding only what it must not lose:
      constraints, acceptance criteria, branch, worktree path, file paths, issue or run ids.
   3. In flight: what is half-done right now and the next concrete action.
   4. Open questions, each tagged `verified` or `assumed`.

   Rules:
   - Reference settled work by path, URL, or commit sha. Never paste a spec, diff, or file
     body into the prose.
   - Anything this session did not itself run or read is `assumed`. Never promote a belief
     to a fact.
   - Redact secrets, tokens, and keys. If one is load-bearing, name the env var instead.
   - Put supporting excerpts in `attachments`, not in the prose: `type: "snippet"` with a
     `language` for code, `type: "context"` for notes. Name each one for what it is.
   - End with: "Reply over intercom if anything above is assumed rather than verified —
     this session is still open."

   Then print the brief you sent so I can read it.
   ```

2. **Terminal A** — run `/reload`, then use it:

   ```text
   /handoff fresh take over the null-email fix in src-client.ts and get it type-checking
   ```

3. **Terminal A** — read the printed brief before moving on. Check that every `assumed`
   line really is assumed, and that no file body got pasted in.
4. **Terminal C** — the brief arrives inline. Put it to work without reading anything:

   ```text
   Using only the handoff you just received, tell me the next concrete action and the
   constraints I have to respect. Then do it.
   ```

5. **Terminal C** — cross-examine the source, which a file could not do:

   ```text
   Ask planner over intercom: "Your brief marks the null-email decision as assumed. What did you actually verify?"
   ```

6. **Terminal A** — answer. Terminal C continues in the same turn with a corrected premise.

**What to notice**

- `${@:2}` is the whole compression key. The template does not summarize the session, it
  summarizes the session *for a stated job*, so a long thread collapses to the slice that
  bears on that job.
- The `<keepContext>` block is written by the sender and enforced in the receiver. Those
  lines survive the receiving session's compaction verbatim, so the constraints outlive the
  briefing that carried them.
- `verified` versus `assumed` is the fix for the criticism that handoffs carry the what and
  not the why. The receiver can see which claims are load-bearing guesses and `ask` about
  exactly those.
- Attachments keep bulk out of the prose. The message stays readable; the code arrives
  intact with its language tag.
- The template is a file in `.atomic/prompts/`, so it is in git. Your team's handoff rules
  become a reviewable artifact instead of a habit.
- Same machine, same repo, and you only want a copy of the context? `/fork` is cheaper.
  Reach for this when the other end is a separate session with its own model, its own
  working directory, and its own job.

Prior art: Matt Pocock's [`handoff` skill](https://github.com/mattpocock/skills/blob/main/docs/productivity/handoff.md),
which writes the same kind of brief to a file. Read it for the discipline about what
belongs in one; this lesson changes where it lands.

**Reference:** [intercom](https://docs.bastani.ai/intercom) · [prompt-templates](https://docs.bastani.ai/prompt-templates) · [compaction](https://docs.bastani.ai/compaction)

---

## Part 6 — Workflows

Workflows are durable, inspectable TypeScript programs that drive agents. Run these lessons from the repo root. Custom workflow files go in `.atomic/workflows/`.

Workflows do not replace skills, tools, and subagents — they orchestrate them. A stage is
an agent session: it loads the same skills, calls the same tools, and can delegate to the
same subagents you used in Parts 3 and 5. The division of labor is worth holding onto:

| Primitive | Answers |
|---|---|
| Tool | *Can* the agent do this? A capability, and a durable gate when the workflow owns it. |
| Skill | *How* should it be done here? Instructions that load on demand for the stage that needs them. |
| Subagent | *Who* does this piece? A bounded specialist with its own context window. |
| Workflow | *In what order, and how do we know it worked?* Structure, evidence, stop conditions. |

So a verification stage can load `tdd` to force a failing test first, `playwright-cli` to
drive a real browser, or `impeccable` to judge a UI — and the workflow decides when that
stage runs, what counts as passing, and what happens when it does not.

The bundled workflows in 6.1 are a starting set, not the ceiling. The point of the system
is that you can assemble your own **verifiable graph** out of the same primitives: stages
with their own models and prompts, `ctx.tool(...)` for durable gates that actually run a
build, a test, or a request, `ctx.workflow(...)` to nest one graph inside another,
structured outputs to pass typed results between stages, human-in-the-loop prompts, and
bounded repair loops with an explicit stop condition. A stage can claim it fixed something;
a `ctx.tool` gate proves it. Verification runs on real tool results, not on the model's
word.

You do not have to hand-write the file to get one. Describe the graph you want and Atomic
writes it ([A.8](#a8-natural-language-workflow-authoring)). Asks of this shape produce real
graphs:

```text
Spawn adversarial verification workflow that conforms to the code style or patterns in the codebase and proposes removals of anti patterns focus on the current diff.
```

```text
Spawn adversarial verification and check for bottlenecks or inefficiencies in the code. Make actual requests between entry points of the codebase to identify latency regressions or improvements focus on the current diff.
```

```text
Spawn adversarial verification that review the changes on this diff and confirms via real usage and all tests (no smoke checks). Post evidence of any UX testing as video to the PR.
```

Each one has the same skeleton: a fresh-context skeptic that cannot see the implementer's
reasoning, a bounded set of probes it must justify, gates that execute those probes, and a
repair loop that stops on evidence. Only the probe — pattern match, latency measurement,
full test run plus a recorded session — changes. 6.5 builds this shape by hand so you can
see every piece.

### 6.1 Touring the builtins

Atomic bundles nine workflows. This lesson launches one in the background and flies around the live graph viewer.

The bundled set:

| Workflow | What it does | When to use |
|---|---|---|
| `classify-and-act` | Structured classifier, then a deterministic category action; low confidence can fall back to human selection. | Route mixed requests to isolated category-specific work. |
| `fan-out-and-synthesize` | Structured partition, bounded parallel artifact branches, synthesis barrier. | Split independent slices, including repository research, and merge evidence. |
| `adversarial-verification` | Worker, fresh rubric verifiers, reducer, bounded repair loop. | Independently prove or reject a candidate. |
| `generate-and-filter` | Candidate fan-out, rubric dedupe/filter, optional judge, shortlist. | Explore more options than needed and keep the strongest distinct few. |
| `tournament` | Whole-task attempts, balanced pairwise judges, bracket reducer. | Compare subjective or approach-sensitive solutions. |
| `loop-until-done` | Durable ledger, iteration/evaluator loop, success or inspectable bound exhaustion. | Continue until explicit evidence proves completion. |
| `goal` | Durable goal ledger, bounded sub-agent orchestration, parallel review, deterministic reducer. | Autonomous implementation that needs receipts and reviewer-gated completion. |
| `ralph` | Prompt refinement, codebase research, delegated implementation, multi-model review loop. | Research-first autonomous implementation with bounded review and repair. |
| `open-claude-design` | Guided discovery and reference research, HTML generation, feedback loop, export and handoff. | UI, page, component, theme, or design-token work. |

**Try it**

1. Start Atomic from the repo root and list what is available:

   ```text
   /workflow list
   ```

2. Inspect a contract before launching it:

   ```text
   /workflow inputs fan-out-and-synthesize
   ```

3. Launch it:

   ```text
   /workflow fan-out-and-synthesize prompt="Map this repository by independent subsystem and synthesize cited findings" max_branches=4
   ```

4. Copy the full 36-character run id from the response. Watch the BACKGROUND panel tick.
5. Open the graph viewer with `/workflow connect <run-id>` or press F2. Arrow-key around the graph, press Enter on a node to attach to it, press `ctrl+o` to expand tool detail. `ctrl+x` is the hierarchy chord: from an attached stage it returns to the graph, from the graph it returns to main chat.
6. Check on everything you have running:

   ```text
   /workflow status
   ```

**What to notice**

- The shape is partition, then bounded parallel branches, then a synthesis barrier.
- Validation is strict and happens before launch: unknown input keys, missing required values, type mismatches, and invalid `select` choices all fail up front.
- Named launches run in the background so the parent chat stays usable.
- Run ids are never truncated. Every command that takes a `runId` needs the full 36-character UUID, exactly as displayed — prefixes and the 32-character dashless form are both rejected.

**Reference:** [workflows](https://docs.bastani.ai/workflows)

### 6.2 Writing your own workflow

A complete custom workflow is about 25 lines of plain TypeScript. Atomic loads it with [jiti](https://github.com/unjs/jiti), so there is no build step.

**Try it**

1. Ask Atomic to write the file:

   ```text
   Create .atomic/workflows/explain-file.ts with EXACTLY the TypeScript below.
   ```

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

2. Pick it up without restarting:

   ```text
   /workflow reload
   ```

3. Confirm it registered, then inspect and run it:

   ```text
   /workflow list
   /workflow inputs explain-file
   /workflow explain-file path="src-client.ts"
   ```

4. Run `/workflow explain-file` with no arguments. An inline input picker opens. Escape cancels it, and `--no-picker` skips it entirely.

**What to notice**

- TypeBox schemas do double duty: they drive the input picker and the strict runtime validation.
- `outputs` is a contract, not a convention. TypeScript checks your `run` return at compile time, and TypeBox checks it at runtime, rejecting undeclared keys.
- `/workflow reload` rescans in-process. Runs already in flight keep the definition they started with.
- Workflows resolve from several locations, project before global:

  | Location | Scope |
  |----------|-------|
  | `.atomic/extensions/workflow/config.json` (`workflows.<name>.path`) | Project |
  | `.atomic/workflows/*.{ts,js,mjs,cjs}` | Project |
  | `~/.atomic/agent/extensions/workflow/config.json` | Global |
  | `~/.atomic/agent/workflows/*.{ts,js,mjs,cjs}` | Global |
  | Installed Atomic packages | Package |
  | Bundled workflows from `@bastani/workflows` | Built-in |

**Reference:** [workflows](https://docs.bastani.ai/workflows)

### 6.3 Human-in-the-loop gates

Workflows can stop mid-code and wait for you. The `ctx.ui` primitives suspend at the callsite and appear as awaiting-input nodes in the graph.

The three primitives used here:

```ts
ctx.ui.input(prompt: string): Promise<string>;
ctx.ui.confirm(message: string): Promise<boolean>;
ctx.ui.select<T extends string>(message: string, options: readonly T[]): Promise<T>;
```

**Try it**

1. Ask Atomic to write the file:

   ```text
   Create .atomic/workflows/release-gate.ts with EXACTLY the TypeScript below.
   ```

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
           reason: "Release held by the operator.",
           outputs: { decision: "hold", risk, summary: summary.text },
         });
       }

       const note = await ctx.ui.input("One-line release note for the changelog:");
       return { decision: "ship", risk, note, summary: summary.text };
     },
   });
   ```

2. Reload and launch it. This repo has no `origin/main`, so pass a real local ref:

   ```text
   /workflow reload
   /workflow release-gate base="HEAD~1"
   ```

3. The run pauses. Connect to it with `/workflow connect <run-id>`; the `AWAITING INPUT` banner shows the full run id.
4. Press Enter on the focused node, then answer the select, confirm, and input prompts in sequence.
5. Run it again and answer "No" at the confirm. `ctx.exit({ status: "blocked" })` ends the run early and still returns the declared partial outputs.

**What to notice**

- Human input is runtime-only. There is no builder-level declaration to write.
- Prompts render as awaiting-input graph nodes, not as chat modals, and prompts raised inside nested children surface in the same expanded parent graph.
- Agents can answer these programmatically with `workflow({ action: "send", delivery: "answer" })`.
- The same file fails in headless mode with a named error such as `atomic-workflows: interactive ctx.ui.confirm is unavailable in headless (non-interactive) mode`. Human-in-the-loop workflows are interactive by design; guard or remove `ctx.ui.*` calls before running headless.
- This is the durable-workflow edition of the `ask_user_question` tool from lesson 1.3.

**Reference:** [workflows](https://docs.bastani.ai/workflows)

### 6.4 Durability and resume

Kill a live workflow on purpose and get it back. Runs checkpoint as they go, so a resumed run replays completed work instead of redoing it.

The control commands:

```text
/workflow status                       # list retained active and terminal runs
/workflow connect <run-id>             # graph viewer, including terminal runs
/workflow attach <run-id> <stage>      # chat with a single stage
/workflow interrupt <run-id>           # pause resumably
/workflow resume <run-id> [stage] msg  # forward a steer message and resume
/workflow quit <run-id>                # pause gracefully and keep the run resumable
/workflows [run-id]                    # retained alias for /workflow resume (history picker)
```

**Try it**

1. Launch something long-running:

   ```text
   /workflow loop-until-done prompt="Find and fix every TODO comment in demo-app, one per iteration, and prove each fix" max_iterations=6
   ```

2. Once a stage or two has completed, pause it gracefully:

   ```text
   /workflow quit <run-id>
   ```

3. Exit Atomic and start it again, to prove the run outlives the process.
4. Reopen the newest-first history picker and select the run:

   ```text
   /workflow resume
   ```

5. Watch it skip the completed checkpoints and continue the incomplete stage.

**What to notice**

- Durability requires Postgres. Atomic uses DBOS with Postgres as its sole persistent workflow backend, launched lazily on the first workflow action. On Alpine or musl you may need `DBOS_SYSTEM_DATABASE_URL`, or the run executes non-durably.
- Only `ctx.*` blocks are checkpointed. Code outside a `ctx.*` call is not durable.
- Completed `ctx.tool`, `ctx.ui`, stage, task, chain, parallel, and child-boundary items replay from cache; only incomplete work runs again.
- Running workflows never appear in the resume picker, which prevents double dispatch. Stale ones surface as `crashed`.

**Reference:** [workflows](https://docs.bastani.ai/workflows)

### 6.5 Security review with a repair loop

This composes everything: a fresh-context audit, a schema-gated independent verifier, durable ledger writes, a human confirm gate before each repair, and a bounded repair loop that stays acyclic.

Cyclic workflow graphs are unsupported. A loop is expressed by unrolling it, so each iteration creates new tracked nodes and the materialized topology remains a DAG:

```text
Implement
   ↓
Review 1
   ↓
Validate 1
   ↓
Repair 1
   ↓
Review 2
   ↓
Validate 2
```

**Try it**

1. Ask Atomic to write the file:

   ```text
   Create .atomic/workflows/security-review.ts with EXACTLY the TypeScript below.
   ```

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

2. Read the file top to bottom: audit, verifier schema, loop, gate. Then reload:

   ```text
   /workflow reload
   ```

3. The target is `demo-app/`, which carries a planted SQL string concatenation and a hardcoded API key from the Setup section. Inspect the contract, then launch:

   ```text
   /workflow inputs security-review
   /workflow security-review target="demo-app" max_repairs=2
   ```

4. Connect to the run with `/workflow connect <run-id>` and watch `audit`, `verify-1`, the confirm gate, `repair-1`, and `verify-2` materialize as distinct nodes.
5. Answer the `ctx.ui.confirm` gate to authorize each repair round.
6. When the run finishes clean, inspect the declared outputs with `/workflow status <run-id>` and the ledger files under `.atomic/workflows/runs/security-review/`.

**What to notice**

- The loop is unrolled. `verify-2` is a new node, never an edge back to `audit`.
- The verifier runs with fresh context, so the agent that wrote the fix does not grade it.
- `schema` attaches a single-use `structured_output` tool to that task and puts the captured JSON on `result.structured`, which forces a machine-checkable verdict instead of a regex gate.
- `ctx.tool` runs your TypeScript as a durable graph node and caches the result by call order plus a content hash of the name and args, so a resumed run does not rewrite completed ledgers.
- `reads` passes paths, not content. The stage reads the file itself when it runs, so it sees what is on disk at that moment.
- `outputMode: "file-only"` keeps the parent result compact by returning an artifact reference instead of the full audit text.
- Exhausting `max_repairs` produces an inspectable non-approved result rather than an endless loop.

**Reference:** [workflows](https://docs.bastani.ai/workflows)

---

## Extras

These ten lessons are optional. Each one stands alone, so take them in any order once you
have finished the main course. They cover configuration, guardrails, prompt macros, async
delegation, intercom isolation, and three more ways to drive workflows.

### A.1 Keybindings and hot reload

Every keystroke in the TUI is a namespaced, remappable action. You change them in one JSON
file and reload without restarting.

**Try it**

1. Run `/hotkeys`. Each row is a keybinding id you can override.
2. Keybindings are global only — there is no project-local override. Type this prompt:

   ```text
   Create ~/.atomic/agent/keybindings.json (global-only — keybindings are not project-local) with EXACTLY this JSON:
   ```

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

3. Run `/reload`, then press CTRL+J. You get a newline instead of a submit.
4. Run `/settings` to see thinking level, theme, message delivery, and transport.
5. Restore the defaults: `rm ~/.atomic/agent/keybindings.json`, then `/reload`.

**What to notice**

- Each action takes a single key or an array of keys, and your config overrides the defaults.
- This file rebinds CTRL+P, which defaults to `app.model.cycleForward`. That collision is real, and your config wins.
- `/reload` picks up keybindings, extensions, skills, prompts, and context files. Themes hot-reload on their own.

**Reference:** [keybindings](https://docs.bastani.ai/keybindings)

### A.2 Permission gate extension

A 34-line shipped extension turns the `tool_call` event into a policy layer. Dangerous bash
commands raise a confirm dialog in the TUI, and are blocked outright when there is no UI.

**Try it**

1. Create `.atomic/extensions/permission-gate.ts` with this exact content. It ships with the
   package as `examples/extensions/permission-gate.ts`, so you can also prompt Atomic to
   find and copy it out of the installed `@bastani/atomic` package.

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

2. Run `/reload`, then prompt:

   ```text
   Run: sudo echo hi
   ```

   A select dialog appears. Pick **No**.
3. Expand the tool output. The model receives `Blocked by user` as the tool result and
   recovers instead of failing.
4. Prove the headless path from a shell in the repo root:

   ```bash
   atomic -p "Run this exact command with bash: sudo echo hi"
   ```

   It blocks with no prompt, because `ctx.hasUI` is `false`.

**What to notice**

- `tool_call` fires before the tool executes and can block by returning `{ block: true, reason }`.
- Mutations to `event.input` change the real tool call, later handlers see earlier mutations, and nothing is re-validated afterwards.
- `ctx.hasUI` is `false` in print mode (`-p`) and JSON mode, `true` in interactive and RPC mode. Fail closed when there is no human to ask.

**Reference:** [extensions](https://docs.bastani.ai/extensions)

### A.3 Runtime system-prompt mutation

A `/pirate` toggle plus a `before_agent_start` handler rewrites the system prompt on every
turn. The same mechanism powers plan modes, per-repo rules, and compliance headers.

**Try it**

1. Copy the shipped `examples/extensions/pirate.ts` out of the installed `@bastani/atomic`
   package into `.atomic/extensions/pirate.ts`. Prompt:

   ```text
   Find the shipped example examples/extensions/pirate.ts inside the installed @bastani/atomic package and copy it to .atomic/extensions/pirate.ts
   ```

   The interesting half of that file is the command registration plus the per-turn handler
   (excerpt):

   ```typescript
   export default function pirateExtension(pi: ExtensionAPI) {
   	let pirateMode = false;

   	// Register /pirate command to toggle pirate mode
   	pi.registerCommand("pirate", {
   		description: "Toggle pirate mode (agent speaks like a pirate)",
   		handler: async (_args, ctx) => {
   			pirateMode = !pirateMode;
   			ctx.ui.notify(pirateMode ? "Arrr! Pirate mode enabled!" : "Pirate mode disabled", "info");
   		},
   	});

   	// Append to system prompt when pirate mode is enabled
   	pi.on("before_agent_start", async (event) => {
   		if (pirateMode) {
   			return {
   				systemPrompt:
   					event.systemPrompt +
   ```

2. Run `/reload`, then `/pirate`. You get the notification `Arrr! Pirate mode enabled!`.
3. Prompt:

   ```text
   Explain what a TypeScript generic is in two sentences.
   ```

   The answer is pirate-flavored and still correct.
4. Run `/pirate` again to disable it, then ask once more to see the toggle take effect per turn.

**What to notice**

- `before_agent_start` fires after you submit and before the agent loop. It can inject a message, modify the system prompt, or both.
- The system prompt is recomputed from extension state on every turn, so a toggle takes effect immediately with no restart.

**Reference:** [extensions](https://docs.bastani.ai/extensions)

### A.4 Prompt templates with arguments

Markdown files in `.atomic/prompts/` become slash commands with positional arguments,
defaults, and autocomplete hints. They travel with the repo through git.

**Try it**

1. Create `.atomic/prompts/review.md`:

   ```markdown
   ---
   description: Review staged git changes
   ---
   Review the staged changes (`git diff --cached`). Focus on:
   - Bugs and logic errors
   - Security issues
   - Error handling gaps
   ```

2. Create `.atomic/prompts/component.md`:

   ```markdown
   ---
   description: Create a component
   argument-hint: "<name> [features]"
   ---
   Create a React component named $1 with features: ${@:2}
   ```

3. Restart `atomic`, or start a new session, in the repo root with some staged changes.
4. Type `/`. Autocomplete lists both templates with their descriptions and the `argument-hint`.
5. Run `/review`. The body expands into your prompt.
6. Run `/component Button "onClick handler" "disabled support"` and watch `$1` and `${@:2}` substitute.

**What to notice**

- The filename becomes the command name: `review.md` becomes `/review`. `description` is optional and falls back to the first non-empty line.
- Templates load from `~/.atomic/agent/prompts/*.md` globally and `.atomic/prompts/*.md` per project, the latter only after you trust the project.
- The argument syntax:

  | Syntax | Meaning |
  |---|---|
  | `$1`, `$2`, … | Positional arguments |
  | `$@` or `$ARGUMENTS` | All arguments, joined |
  | `${1:-default}` | Argument 1 when present and non-empty, otherwise `default` |
  | `${@:-default}` | All arguments when present and non-empty, otherwise `default` |
  | `${@:N}` | Arguments from the Nth position (1-indexed) |
  | `${@:N:L}` | `L` arguments starting at N |

**Reference:** [prompt-templates](https://docs.bastani.ai/prompt-templates)

### A.5 Parallel review composition

One sentence fans a diff review out to fresh-context specialists and synthesizes only the
issues worth fixing. The bundled `/parallel-review` template does the same thing.

**Try it**

1. From the repo root, plant something to review:

   ```text
   Append to src-client.ts exactly this line: export function retry<T>(fn: () => Promise<T>): Promise<T> { return fn().catch(() => fn()); }
   ```

2. Type the request in plain language:

   ```text
   Review the current diff with fresh-context specialists: analyze correctness, inspect failure modes without editing, and compare the implementation to existing patterns. Synthesize only issues worth fixing now.
   ```

3. Or run the bundled template instead: `/parallel-review`
4. Watch the children run concurrently, then read the parent's synthesized issue list.

**What to notice**

- Each angle maps to a specialist: `codebase-analyzer` for behavior and regressions, `debugger` in inspect-only mode for failure modes, `codebase-pattern-finder` for fit with local conventions, `codebase-research-locator` and `codebase-research-analyzer` for prior decisions, `codebase-online-researcher` for external API conformance.
- The parent keeps only evidence-backed issues, so the children's raw output never lands in your context.
- Related bundled templates: `/review-loop`, `/parallel-research`, `/parallel-context-build`, `/parallel-handoff-plan`, `/parallel-cleanup`. They are reusable compositions, not separate agent names.

**Reference:** [subagents](https://docs.bastani.ai/subagents)

### A.6 Background subagent runs

Delegation goes async. You launch a detached child, check on it, stop it resumably, resume
it with a follow-up, and diagnose the runtime.

**Try it**

1. Launch a detached child:

   ```text
   Call subagent({ agent: "codebase-analyzer", task: "Trace the auth flow with file references.", async: true })
   ```

2. Read the acknowledgement. It says the run was launched and completion is pending, and the
   agent ends the turn rather than polling.
3. Check on it in plain language:

   ```text
   Show me the current async subagent runs.
   ```

   That is backed by `subagent({ action: "status" })`. The full control surface:

   ```ts
   subagent({ agent: "codebase-analyzer", task: "Trace the auth flow with file references.", async: true })
   subagent({ action: "status" })
   subagent({ action: "status", id: "<run-id>" })
   subagent({ action: "interrupt", id: "<run-id>" })
   subagent({ action: "resume", id: "<run-id>", message: "continue with the test failures" })
   subagent({ action: "doctor" })
   ```

4. Stop and restart the run with `subagent({ action: "interrupt", id: "<run-id>" })` then
   `subagent({ action: "resume", id: "<run-id>", message: "continue with the test failures" })`.
5. Finish with `subagent({ action: "doctor" })` for read-only diagnostics, including whether
   the Intercom bridge is available.
6. When the child finishes, its completion notice arrives in your session over Intercom.

**What to notice**

- `interrupt` is a resumable stop, and `resume` can revive even a completed child from its saved session when the run has enough metadata.
- Background runs are detached: the launch tool call is terminal, and the child notifies the originating session later.
- Each model attempt is bounded by an idle watchdog (5 minutes without child output by default) and a 60-minute wall-clock cap. Override with `ATOMIC_SUBAGENT_ATTEMPT_IDLE_TIMEOUT_MS` and `ATOMIC_SUBAGENT_ATTEMPT_TIMEOUT_MS`; `ATOMIC_SUBAGENT_ATTEMPT_KILL_GRACE_MS` controls SIGTERM-to-SIGKILL escalation.

**Reference:** [subagents](https://docs.bastani.ai/subagents)

### A.7 Intercom group isolation

Groups are hard isolation, not a display filter. A session in another group is invisible,
unreachable, and rejected by the broker. Read-only peeking is the one exception.

**Try it**

This lesson needs the two sessions from lesson 5.3 still running, plus a third terminal in
the repo root.

1. **Terminal C** — the group must be set at launch, so start a fresh session rather than
   reusing an existing one:

   ```bash
   ATOMIC_INTERCOM_GROUP=redteam atomic
   ```

   In it, run `/name redworker`, then prompt `Check intercom status.` so it connects.
2. **Terminal C** — prompt:

   ```text
   List intercom sessions.
   ```

   The planner and worker sessions do not appear.
3. **Terminal A** — take the documented read-only peek:

   ```text
   List intercom sessions in group "redteam".
   ```

   That runs `intercom({ action: "list", group: "redteam" })`.
4. **Terminal A** — try to cross the boundary:

   ```text
   Send an intercom message to redworker saying hi.
   ```

   The name is unresolvable, and a send by exact session ID is rejected with
   `Target session is in a different intercom group`.

**What to notice**

- Every session belongs to exactly one group. Sessions with no group share the implicit `default` group.
- `list` and `status` accept a `group` argument for a read-only peek. `send` and `ask` are always locked to your own group and error if you pass a different one.
- Group precedence: explicit stage/task/subagent group, then a workflow invocation group or inherited launching-session group, then `ATOMIC_INTERCOM_GROUP`, then Intercom `config.json` `"group"`, then `"default"`.
- Each workflow invocation gets its own stable non-`default` group, which isolates runs from your main chat. `contact_supervisor` is the only authorized cross-group route.

**Reference:** [intercom](https://docs.bastani.ai/intercom) · [subagents](https://docs.bastani.ai/subagents)

### A.8 Natural-language workflow authoring

You do not have to hand-write a workflow. Describe what you want, and Atomic designs it,
writes the file, reloads the registry, and tells you where the code lives.

**Try it**

1. Paste this into chat verbatim:

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
3. Open the generated `.atomic/workflows/review-changes.ts` and read what it wrote.
4. Run it: `/workflow review-changes target="the current git diff"`

**What to notice**

- Atomic asks clarifying questions when stage purpose, inputs, models, or handoffs are ambiguous, rather than guessing.
- It picks `ctx.task`, `ctx.chain`, `ctx.parallel`, and `ctx.ui` for you, and uses `ctx.tool(name, args, fn)` for workflow-owned side effects so completed operations are checkpointed and do not re-run after a resume.
- It runs `/workflow reload` itself, so the workflow is launchable immediately.
- It reports the folder only for newly created custom workflows, never for builtin or pre-existing ones.

**Reference:** [workflows](https://docs.bastani.ai/workflows)

### A.9 Nesting builtin workflows

Workflows compose like functions. A short parent imports two builtins and nests them with
`ctx.workflow(...)`, mapping typed inputs and consuming declared outputs. No prompts get
copied between them.

**Try it**

1. Create `.atomic/workflows/research-and-verify.ts` with exactly this content. It feeds a
   research workflow's synthesis into an adversarial verifier:

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

2. Run `/workflow reload`.
3. Launch it: `/workflow research-and-verify topic="how the session store works"`
4. Run `/workflow connect <run-id>`. Child stages flatten into one expanded parent graph, so
   you can attach to a nested verifier stage directly.

**What to notice**

- `ctx.workflow(...)` takes an imported workflow definition, never a registry name string. Registry names are only for top-level named runs. A module that does not export a workflow definition fails discovery at load time.
- Every builtin is importable from one barrel: `adversarialVerification`, `classifyAndAct`, `fanOutAndSynthesize`, `generateAndFilter`, `goal`, `loopUntilDone`, `openClaudeDesign`, `ralph`, and `tournament` from `@bastani/workflows/builtin`.
- The child result is a typed contract you must handle:

  | Field | Meaning |
  |---|---|
  | `workflow` | Normalized child workflow name |
  | `runId` | Nested child run id |
  | `status` | `completed`, or `skipped` / `cancelled` / `blocked` when the child ended with `ctx.exit(...)` |
  | `exited` | `false` on normal completion, `true` when the child used `ctx.exit(...)` |
  | `outputs` | Full declared outputs when `exited === false`, partial when `exited === true` |
  | `exitReason` | Optional `ctx.exit({ reason })` text, present only when `exited === true` |

- Failed or internally cancelled children fail the parent call. Nested children count against `maxDepth`, which defaults to 4 total workflow levels.

**Reference:** [workflows](https://docs.bastani.ai/workflows)

### A.10 Autonomous implementation loops

Two builtins run implementation end to end. `ralph` refines, researches, implements, and
reviews in a loop. `goal` keeps a durable ledger and gates completion on reviewer receipts.

**Try it**

1. Inspect the contracts first: `/workflow inputs ralph` and `/workflow inputs goal`.
2. Launch a run against the planted flaws in `demo-app/server.js`:

   ```text
   /workflow ralph prompt="Add input validation to demo-app/server.js and prove it with a test" max_loops=3
   ```

3. While it runs, attach with `/workflow connect <run-id>` and follow the stages: refine,
   research, implement, independent model-family reviewers, then the repair loop. You do not
   have to wait for it to finish.
4. The `goal` equivalent, with the PR flag as an explicit opt-in:

   ```text
   /workflow goal objective="Update the CLI docs for --json, add one example, and validate the docs build"
   /workflow goal objective="Implement specs/rate-limit.md and run focused checks" create_pr=true
   ```

   And the other `ralph` form:

   ```text
   /workflow ralph prompt="Migrate the database layer to Drizzle" max_loops=3
   /workflow ralph prompt="Implement specs/rate-limit.md and validate burst behavior" create_pr=true
   ```

**What to notice**

- `goal` persists the objective and immutable acceptance criteria in a run ledger, records receipts, and asks independent reviewers to inspect the current delta. A TypeScript reducer returns `complete`, `blocked`, or `needs_human` instead of trusting a free-form completion claim.
- `ralph` is the research-first loop: prompt refinement, codebase research, delegated implementation, then bounded multi-model review and repair.
- Both support reusable worktree binding through `git_worktree_dir` and `base_branch`. Use `create_pr=true` only as an explicitly authorized final action after implementation is approved. Prompt text alone never authorizes a PR.
- For follow-up runs based on reviewer findings, pass the original task text as `acceptance_criteria` to prevent contract drift.

**Reference:** [workflows](https://docs.bastani.ai/workflows)

## Source index

Docs live at <https://docs.bastani.ai/>. Shipped examples live under the installed
`@bastani/atomic` package.

- **1.1 First session** — [quickstart](https://docs.bastani.ai/quickstart), [usage](https://docs.bastani.ai/usage), README
- **1.2 Hashline edits** — [tools](https://docs.bastani.ai/tools)
- **1.3 `ask_user_question`** — [quickstart](https://docs.bastani.ai/quickstart), [usage](https://docs.bastani.ai/usage)
- **1.4 `todo`** — [quickstart](https://docs.bastani.ai/quickstart), [settings](https://docs.bastani.ai/settings)
- **2.1 Branching** — [sessions](https://docs.bastani.ai/sessions), [compaction](https://docs.bastani.ai/compaction), README
- **2.2 Compaction** — [compaction](https://docs.bastani.ai/compaction), [settings](https://docs.bastani.ai/settings), README
- **2.3 Session format** — [session-format](https://docs.bastani.ai/session-format), [sessions](https://docs.bastani.ai/sessions), [usage](https://docs.bastani.ai/usage)
- **3.1–3.2 Extensions** — [extensions](https://docs.bastani.ai/extensions)
- **3.3 Custom TUI tool** — [extensions](https://docs.bastani.ai/extensions), `examples/extensions/question.ts`
- **3.4 Skills** — [skills](https://docs.bastani.ai/skills), [packages](https://docs.bastani.ai/packages)
- **3.5 Themes** — [themes](https://docs.bastani.ai/themes)
- **4.1 Headless and JSON** — [json](https://docs.bastani.ai/json), [usage](https://docs.bastani.ai/usage)
- **4.2 Models and providers** — [models](https://docs.bastani.ai/models), [providers](https://docs.bastani.ai/providers), [custom-provider](https://docs.bastani.ai/custom-provider)
- **4.3 SDK** — [sdk](https://docs.bastani.ai/sdk), `examples/sdk/01-minimal.ts`
- **5.1–5.2 Delegation and worktrees** — [subagents](https://docs.bastani.ai/subagents)
- **5.3–5.4 Intercom coordination and escalation** — [intercom](https://docs.bastani.ai/intercom), [subagents](https://docs.bastani.ai/subagents)
- **5.5–5.6 Context handoff** — [intercom](https://docs.bastani.ai/intercom), [prompt-templates](https://docs.bastani.ai/prompt-templates)
- **6.1–6.5 Workflows** — [workflows](https://docs.bastani.ai/workflows)
- **A.1 Keybindings** — [keybindings](https://docs.bastani.ai/keybindings)
- **A.2 Permission gate** — `examples/extensions/permission-gate.ts`
- **A.3 Pirate mode** — `examples/extensions/pirate.ts`
- **A.4 Prompt templates** — [prompt-templates](https://docs.bastani.ai/prompt-templates)
- **A.5–A.6 Review compositions and async runs** — [subagents](https://docs.bastani.ai/subagents)
- **A.7 Intercom groups** — [intercom](https://docs.bastani.ai/intercom), [subagents](https://docs.bastani.ai/subagents)
- **A.8–A.10 Workflow authoring, composition, loops** — [workflows](https://docs.bastani.ai/workflows)

---

## Where to go next

One binary, four modes: interactive TUI, headless print/JSON, RPC, and the SDK. Every
layer you touched is scriptable and project-local — tools, sessions, extensions, skills,
themes, agents, workflows.

Two things this course did not cover, both worth an afternoon:

- `/mcp` and `/mcp setup` connect MCP servers.
- The bundled web tools `web_search` and `fetch_content` are themselves extensions — read
  them for a working example of a non-trivial extension.

Full docs: <https://docs.bastani.ai/>. Source, issues, and the shipped `examples/` ladder:
<https://github.com/bastani-inc/atomic>.
