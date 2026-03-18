import path from "node:path";

import prompts from "prompts";
import fs from "fs-extra";

import { collectProjectConfig } from "./config.js";

import { executePlan } from "./executor.js";
import { EnhancedPlanner } from "./enhanced-planner.js";

export async function runCreate(input: { dir: string; yes: boolean; dryRun: boolean; inPlace: boolean }) {
  const targetDir = path.resolve(process.cwd(), input.dir);

  const exists = await fs.pathExists(targetDir);
  if (exists) {
    const entries = await fs.readdir(targetDir);
    const isEmpty = entries.length === 0;
    if (!isEmpty && !input.inPlace) {
      throw new Error(
        `Target directory is not empty: ${path.relative(process.cwd(), targetDir) || "."}. ` +
          "Choose a new folder name or pass --in-place."
      );
    }
  }

  const config = await collectProjectConfig({
    targetDir,
    yes: input.yes
  });

  // Use enhanced planner for better setup instructions
  const enhancedPlanner = new EnhancedPlanner();
  const plan = await enhancedPlanner.createEnhancedPlan(config);

  if (input.dryRun) {
    // Intentionally minimal output for dry-run mode
    process.stdout.write(JSON.stringify(plan, null, 2) + "\n");
    return;
  }

  const { confirm } = input.yes
    ? { confirm: true }
    : await prompts({
        type: "confirm",
        name: "confirm",
        message: `Create project in ${path.relative(process.cwd(), targetDir) || "."}?`,
        initial: true
      });

  if (!confirm) return;

  await executePlan({ targetDir, plan });
}
