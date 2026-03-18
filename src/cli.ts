#!/usr/bin/env node
import { Command } from "commander";

import { runCreate } from "./create.js";

const program = new Command()
  .name("create-stack-app")
  .description("Scaffold a modern full-stack app")
  .argument("[dir]", "Target directory (recommended: a new folder name)")
  .option("--yes", "Use defaults without prompting", false)
  .option("--in-place", "Allow generating into the current directory", false)
  .option("--dry-run", "Plan only; do not write files", false)
  .parse(process.argv);

const opts = program.opts<{ yes: boolean; inPlace: boolean; dryRun: boolean }>();
const dir = program.args[0];

if (!dir && !opts.inPlace) {
  program.error("Missing <dir>. Example: create-stack-app my-app (or pass --in-place).");
}

await runCreate({ dir: dir ?? ".", yes: opts.yes, dryRun: opts.dryRun, inPlace: opts.inPlace });
