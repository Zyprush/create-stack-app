import path from "node:path";

import prompts from "prompts";
import fs from "fs-extra";
import { execa } from "execa";

import { collectProjectConfig } from "./config.js";

import { executePlan } from "./executor.js";
import { EnhancedPlanner } from "./enhanced-planner.js";

interface Editor {
  name: string;
  command: string;
  args: string[];
}

const EDITORS: Editor[] = [
  { name: "Cursor", command: "cursor", args: ["."] },
  { name: "Claude Code", command: "claude", args: ["."] },
  { name: "Codex", command: "codex", args: ["."] },
  { name: "Zed", command: "zed", args: ["."] },
  { name: "VS Code", command: "code", args: ["."] },
  { name: "Vim", command: "vim", args: ["."] },
  { name: "None (just cd)", command: "none", args: [] }
];

async function checkEditorAvailable(editor: Editor): Promise<boolean> {
  if (editor.command === "none") return true;
  try {
    await execa("which", [editor.command]);
    return true;
  } catch {
    return false;
  }
}

async function promptEditor(targetDir: string): Promise<void> {
  const availableEditors: Editor[] = [];
  for (const editor of EDITORS) {
    if (await checkEditorAvailable(editor)) {
      availableEditors.push(editor);
    }
  }

  if (availableEditors.length === 0) {
    console.log(`\ncd ${path.basename(targetDir)}`);
    return;
  }

  const choices = availableEditors.map((e) => ({
    title: e.name,
    value: e
  }));

  const { editor } = await prompts({
    type: "select",
    name: "editor",
    message: "Open in editor?",
    choices,
    initial: 0
  });

  if (!editor) return;

  if (editor.command === "none") {
    console.log(`\ncd ${path.basename(targetDir)}`);
    return;
  }

  console.log(`\ncd ${path.basename(targetDir)} && ${editor.command} .`);
  try {
    await execa(editor.command, editor.args, { cwd: targetDir, detached: true });
  } catch (err) {
    console.error(`Failed to open ${editor.name}:`, err);
    console.log(`\ncd ${path.basename(targetDir)}`);
  }
}

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
    process.stdout.write(JSON.stringify(plan, null, 2) + "\n");
    return;
  }

  await executePlan({ targetDir, plan });

  await promptEditor(targetDir);
}
