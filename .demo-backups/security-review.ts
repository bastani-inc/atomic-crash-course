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
