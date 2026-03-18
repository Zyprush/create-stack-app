import path from "node:path";

import { execa } from "execa";
import fs from "fs-extra";

import type { Blueprint } from "./types.js";
import type { EnhancedPlan } from "./enhanced-planner.js";

export async function executePlan(input: { targetDir: string; plan: Blueprint | EnhancedPlan }) {
  await fs.ensureDir(input.targetDir);

  const pm = input.plan.packageManager;
  const createCmd = pm === "npm" ? ["npm", "exec"] : pm === "yarn" ? ["yarn", "create"] : pm === "bun" ? ["bunx"] : ["pnpm", "create"];
  const installCmd = pm === "npm" ? ["npm", "install"] : pm === "yarn" ? ["yarn", "add"] : [pm, "add"];
  const installDevCmd = pm === "npm" ? ["npm", "install", "-D"] : pm === "yarn" ? ["yarn", "add", "-D"] : [pm, "add", "-D"];

  // 1) Scaffold framework
  switch (input.plan.framework) {
    case "next":
      await scaffoldNext({ targetDir: input.targetDir, createCmd });
      break;
    case "react":
      await scaffoldReact({ targetDir: input.targetDir, packageManager: pm });
      break;
    case "vite-react":
      await scaffoldVite({ targetDir: input.targetDir, createCmd, template: "react-ts" });
      break;
    case "vite-vue":
      await scaffoldVite({ targetDir: input.targetDir, createCmd, template: "vue-ts" });
      break;
    case "vite-vanilla":
      await scaffoldVite({ targetDir: input.targetDir, createCmd, template: "vanilla-ts" });
      break;
    case "angular":
      await scaffoldAngular({ targetDir: input.targetDir, packageManager: pm });
      break;
    case "vue":
      await scaffoldVue({ targetDir: input.targetDir, createCmd });
      break;
    case "nuxt":
      await scaffoldNuxt({ targetDir: input.targetDir, packageManager: pm });
      break;
    case "svelte":
      await scaffoldVite({ targetDir: input.targetDir, createCmd, template: "svelte-ts" });
      break;
    case "sveltekit":
      await scaffoldSvelteKit({ targetDir: input.targetDir, packageManager: pm });
      break;
    case "astro":
      await scaffoldAstro({ targetDir: input.targetDir, createCmd });
      break;
    case "remix":
      await scaffoldRemix({ targetDir: input.targetDir, createCmd });
      break;
    case "solid":
      await scaffoldSolid({ targetDir: input.targetDir, packageManager: pm });
      break;
    case "qwik":
      await scaffoldQwik({ targetDir: input.targetDir, createCmd });
      break;
    default:
      throw new Error(`Unknown framework: ${input.plan.framework}`);
  }

  // 2) Install deps
  await installPackages({
    cwd: input.targetDir,
    installCmd,
    installDevCmd,
    dependencies: input.plan.dependencies,
    devDependencies: input.plan.devDependencies
  });

  // 3) Merge package.json additions (scripts)
  await mergePackageJson({
    cwd: input.targetDir,
    scripts: input.plan.scripts
  });

  // 4) Write basic files (only if they don't exist from scaffold)
  for (const file of input.plan.files) {
    const abs = path.join(input.targetDir, file.path);
    // Only write if file doesn't exist (scaffold may have created it)
    if (!(await fs.pathExists(abs))) {
      await fs.ensureDir(path.dirname(abs));
      await fs.writeFile(abs, file.content, "utf8");
    }
  }

  // 5) Create .env.example
  await writeEnvExample({
    cwd: input.targetDir,
    env: input.plan.env
  });

  // 6) If enhanced plan, create AGENT.md
  if ("agentInstructions" in input.plan) {
    const enhancedPlan = input.plan as EnhancedPlan;
    await createAgentInstructions(input.targetDir, enhancedPlan);
  }
}

async function createAgentInstructions(targetDir: string, plan: EnhancedPlan) {
  const agentPath = path.join(targetDir, "AGENT.md");
  
  // Use the agent instructions from the enhanced plan
  const content = plan.agentInstructions;
  
  await fs.writeFile(agentPath, content, "utf8");
  console.log(`\n📋 AGENT.md created at ${agentPath}`);
  console.log("This file contains complete instructions for setting up all integrations.");
  console.log("Give this file to your AI agent to complete the project setup.\n");
}

async function scaffoldNext(input: { targetDir: string; createCmd: string[] }) {
  const cmd = input.createCmd[0];
  const args = input.createCmd.slice(1);
  const dirName = path.basename(input.targetDir);
  const parentDir = path.dirname(input.targetDir);

  // Handle bun specially - bunx doesn't need "create" prefix
  if (cmd === "bunx") {
    await execa(
      cmd,
      ["create-next-app@latest", dirName, "--ts", "--eslint", "--tailwind", "--app", "--src-dir", "--no-turbopack", "--yes", "--skip-install"],
      { cwd: parentDir, stdio: "inherit" }
    );
  } else {
    await execa(
      cmd,
      [...args, "create-next-app@latest", dirName, "--", "--ts", "--eslint", "--tailwind", "--app", "--src-dir", "--no-turbopack", "--yes", "--skip-install"],
      { cwd: parentDir, stdio: "inherit" }
    );
  }
}

async function scaffoldReact(input: { targetDir: string; packageManager: string }) {
  const pm = input.packageManager;
  const dirName = path.basename(input.targetDir);
  const parentDir = path.dirname(input.targetDir);

  if (pm === "npm") {
    await execa("npx", ["create-react-app", dirName, "--template", "typescript"], { cwd: parentDir, stdio: "inherit" });
  } else if (pm === "yarn") {
    await execa("yarn", ["create", "react-app", dirName, "--template", "typescript"], { cwd: parentDir, stdio: "inherit" });
  } else if (pm === "pnpm") {
    await execa("pnpm", ["create", "react-app", dirName, "--template", "typescript"], { cwd: parentDir, stdio: "inherit" });
  } else {
    await execa("bunx", ["create-react-app", dirName, "--template", "typescript"], { cwd: parentDir, stdio: "inherit" });
  }
}

async function scaffoldVite(input: { targetDir: string; createCmd: string[]; template: string }) {
  const cmd = input.createCmd[0];
  const baseArgs = input.createCmd.slice(1);
  const dirName = path.basename(input.targetDir);
  const parentDir = path.dirname(input.targetDir);

  // Handle bun specially
  if (cmd === "bunx") {
    await execa(cmd, ["create-vite@latest", dirName, "--template", input.template], {
      cwd: parentDir,
      stdio: "inherit"
    });
  } else {
    await execa(cmd, [...baseArgs, "create-vite@latest", dirName, "--", "--template", input.template], {
      cwd: parentDir,
      stdio: "inherit"
    });
  }
}

async function scaffoldAngular(input: { targetDir: string; packageManager: string }) {
  const pm = input.packageManager;
  const dirName = path.basename(input.targetDir);
  const parentDir = path.dirname(input.targetDir);

  if (pm === "npm") {
    await execa("npx", ["@angular/cli@latest", "new", dirName, "--style", "css", "--routing", "--ssr", "--skip-git", "--skip-tests"], { cwd: parentDir, stdio: "inherit" });
  } else if (pm === "yarn") {
    await execa("yarn", ["dlx", "@angular/cli@latest", "new", dirName, "--style", "css", "--routing", "--ssr", "--skip-git", "--skip-tests"], { cwd: parentDir, stdio: "inherit" });
  } else if (pm === "pnpm") {
    await execa("pnpx", ["@angular/cli@latest", "new", dirName, "--style", "css", "--routing", "--ssr", "--skip-git", "--skip-tests"], { cwd: parentDir, stdio: "inherit" });
  } else {
    await execa("bunx", ["@angular/cli@latest", "new", dirName, "--style", "css", "--routing", "--ssr", "--skip-git", "--skip-tests"], { cwd: parentDir, stdio: "inherit" });
  }
}

async function scaffoldVue(input: { targetDir: string; createCmd: string[] }) {
  const cmd = input.createCmd[0];
  const baseArgs = input.createCmd.slice(1);
  const dirName = path.basename(input.targetDir);
  const parentDir = path.dirname(input.targetDir);

  // Handle bun specially
  if (cmd === "bunx") {
    await execa(cmd, ["@vue/cli@latest", dirName, "--default"], {
      cwd: parentDir,
      stdio: "inherit"
    });
  } else {
    await execa(cmd, [...baseArgs, "@vue/cli@latest", dirName, "--default"], {
      cwd: parentDir,
      stdio: "inherit"
    });
  }
}

async function scaffoldNuxt(input: { targetDir: string; packageManager: string }) {
  const pm = input.packageManager;
  const dirName = path.basename(input.targetDir);
  const parentDir = path.dirname(input.targetDir);
  const cmd = pm === "npm" ? "npx" : pm === "yarn" ? "yarn" : pm === "pnpm" ? "pnpx" : "bunx";

  await execa(cmd, ["nuxi@latest", "init", dirName, "--no-install"], { cwd: parentDir, stdio: "inherit" });
}

async function scaffoldSvelteKit(input: { targetDir: string; packageManager: string }) {
  const pm = input.packageManager;
  const dirName = path.basename(input.targetDir);
  const parentDir = path.dirname(input.targetDir);
  const cmd = pm === "npm" ? "npx" : pm === "yarn" ? "npx" : pm === "pnpm" ? "pnpx" : "bunx";

  await execa(cmd, ["sv", "create", dirName, "--template", "minimal", "--types", "ts", "--no-install", "--no-add-ons"], {
    cwd: parentDir,
    stdio: "inherit"
  });
}

async function scaffoldAstro(input: { targetDir: string; createCmd: string[] }) {
  const cmd = input.createCmd[0];
  const baseArgs = input.createCmd.slice(1);
  const dirName = path.basename(input.targetDir);
  const parentDir = path.dirname(input.targetDir);

  // Handle bun specially
  if (cmd === "bunx") {
    await execa(cmd, ["create-astro@latest", dirName, "--template", "basics", "--no-install", "--no-git", "--yes"], {
      cwd: parentDir,
      stdio: "inherit"
    });
  } else {
    await execa(cmd, [...baseArgs, "create-astro@latest", dirName, "--template", "basics", "--no-install", "--no-git", "--yes"], {
      cwd: parentDir,
      stdio: "inherit"
    });
  }
}

async function scaffoldRemix(input: { targetDir: string; createCmd: string[] }) {
  const cmd = input.createCmd[0];
  const baseArgs = input.createCmd.slice(1);
  const dirName = path.basename(input.targetDir);
  const parentDir = path.dirname(input.targetDir);

  // Handle bun specially
  if (cmd === "bunx") {
    await execa(cmd, ["create-react-router@latest", dirName, "--template", "remix-run/react-router/templates/basic", "--no-install", "--yes"], {
      cwd: parentDir,
      stdio: "inherit"
    });
  } else {
    await execa(cmd, [...baseArgs, "create-react-router@latest", dirName, "--template", "remix-run/react-router/templates/basic", "--no-install", "--yes"], {
      cwd: parentDir,
      stdio: "inherit"
    });
  }
}

async function scaffoldSolid(input: { targetDir: string; packageManager: string }) {
  const pm = input.packageManager;
  const dirName = path.basename(input.targetDir);
  const parentDir = path.dirname(input.targetDir);
  const cmd = pm === "npm" ? "npx" : pm === "yarn" ? "yarn" : pm === "pnpm" ? "pnpx" : "bunx";

  await execa(cmd, ["create-solid@latest", dirName, "--no-install"], { cwd: parentDir, stdio: "inherit" });
}

async function scaffoldQwik(input: { targetDir: string; createCmd: string[] }) {
  const cmd = input.createCmd[0];
  const baseArgs = input.createCmd.slice(1);
  const dirName = path.basename(input.targetDir);
  const parentDir = path.dirname(input.targetDir);

  // Handle bun specially
  if (cmd === "bunx") {
    await execa(cmd, ["create-qwik@latest", "empty", dirName], {
      cwd: parentDir,
      stdio: "inherit"
    });
  } else {
    await execa(cmd, [...baseArgs, "create-qwik@latest", "empty", dirName], {
      cwd: parentDir,
      stdio: "inherit"
    });
  }
}

async function installPackages(input: { cwd: string; installCmd: string[]; installDevCmd: string[]; dependencies: string[]; devDependencies: string[] }) {
  if (input.dependencies.length > 0) {
    const cmd = input.installCmd[0];
    const args = input.installCmd.slice(1);
    await execa(cmd, [...args, ...input.dependencies], { cwd: input.cwd, stdio: "inherit" });
  }
  if (input.devDependencies.length > 0) {
    const cmd = input.installDevCmd[0];
    const args = input.installDevCmd.slice(1);
    await execa(cmd, [...args, ...input.devDependencies], { cwd: input.cwd, stdio: "inherit" });
  }
}

async function mergePackageJson(input: { cwd: string; scripts: Record<string, string> }) {
  if (Object.keys(input.scripts).length === 0) return;

  const pkgPath = path.join(input.cwd, "package.json");
  const pkg = (await fs.readJson(pkgPath)) as { scripts?: Record<string, string> };
  pkg.scripts = { ...(pkg.scripts ?? {}), ...input.scripts };
  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
}

async function writeEnvExample(input: { cwd: string; env: Array<{ key: string; description: string }> }) {
  if (input.env.length === 0) return;

  const lines = input.env.flatMap((e) => [`# ${e.description}`, `${e.key}=`, ""]);
  const content = lines.join("\n").trimEnd() + "\n";
  await fs.writeFile(path.join(input.cwd, ".env.example"), content, "utf8");
}