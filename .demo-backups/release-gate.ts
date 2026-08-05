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
