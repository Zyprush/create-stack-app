# create-stack-app

A modern CLI to scaffold full-stack applications with frameworks, auth, databases, payments, and more.

## Quick Start

```bash
npx create-stack-app my-app
```

Or using npm:
```bash
npm create stack-app my-app
```

## Installation

### Global Installation
```bash
npm install -g create-stack-app
create-stack-app my-app
```

### One-time Usage (Recommended)
```bash
npx create-stack-app my-app
```

## Project Overview

**create-stack-app** is a modern CLI scaffolding tool designed to generate full-stack applications with a pre-configured stack of frameworks and integrations. It streamlines the initial setup process by orchestrating framework-specific CLI tools (like `create-next-app` or `create-vite`) and then layering on dependencies, configuration, and boilerplate code for various services.

### ✨ Features

- **Interactive CLI** - Guided prompts for framework and integration selection
- **Multiple Frameworks** - Next.js, React, Vite, Vue, Svelte, Astro, and more
- **Full-Stack Integrations** - Auth, databases, payments, analytics, email, chat
- **AI-Powered Setup** - Generates `AGENT.md` for AI-assisted integration completion
- **Production-Ready** - Includes TypeScript, ESLint, and proper configuration
- **Non-Destructive** - Never overwrites existing files

## Core Technologies
- **Runtime:** Node.js (18+)
- **Language:** TypeScript (ESM)
- **CLI Framework:** [Commander.js](https://github.com/tj/commander.js)
- **Interactivity:** [Prompts](https://github.com/terkelg/prompts)
- **Validation:** [Zod](https://zod.dev/)
- **Process Execution:** [Execa](https://github.com/sindresorhus/execa)
- **File System:** [fs-extra](https://github.com/jprichardson/node-fs-extra)

### Supported Stack Components
- **Frameworks:** Next.js (App Router), React, Vite (React/Vue/Vanilla), Angular, Vue, Nuxt, Svelte, SvelteKit, Astro, Remix, Solid, Qwik.
- **Auth:** Clerk, Firebase Auth, OAuth (Auth.js), Auth0.
- **Database:** Prisma (PostgreSQL), MongoDB, Supabase, Firebase, Convex, PlanetScale.
- **Payments:** Stripe, PayMongo.
- **Newsletter:** Resend, Mailchimp, ConvertKit.
- **Analytics:** Vercel Analytics, Google Analytics, Plausible, Umami.
- **Others:** EmailJS (Contact), Crisp/Intercom/Twilio (Chat).

## 🚀 Usage

### Basic Usage
```bash
npx create-stack-app my-app
```

### Command Options
```bash
npx create-stack-app my-app --yes       # Use defaults without prompting
npx create-stack-app my-app --in-place  # Generate in current directory
npx create-stack-app my-app --dry-run   # Show plan without writing files
```

### Examples
```bash
# Interactive setup with prompts
npx create-stack-app my-project

# Quick setup with defaults
npx create-stack-app my-project --yes

# Scaffold in current directory
npx create-stack-app --in-place
```

---

## 🛠️ Development

### Building and Running

### Development
To run the CLI in development mode without building:
```bash
npm install
npm run dev -- <target-dir>
```
*Note: Use `--in-place` to generate in the current directory.*

### Production Build
To build and run the production version:
```bash
npm run build
npm start -- <target-dir>
```

### Key Commands
- `npm run lint`: Runs ESLint for code quality.
- `npm run build`: Compiles TypeScript to the `dist/` directory.
- `npm run dev`: Uses `tsx` to run the source directly.

---

## Architecture

The project follows a linear pipeline: **Collect Config -> Plan -> Execute**.

1.  **CLI Entry (`src/cli.ts`):** Handles command-line arguments and options using Commander.
2.  **Creation Orchestrator (`src/create.ts`):** Manages the high-level flow, including directory checks and calling the config collector, planner, and executor.
3.  **Configuration (`src/config.ts`):** Uses Zod to define the `ProjectConfig` schema and Prompts to interactively gather user preferences.
4.  **Planner (`src/planner.ts`):** A deterministic engine that maps user configuration to a `Blueprint`. A blueprint contains:
    - Dependencies and devDependencies to install.
    - Scripts to add to `package.json`.
    - Environment variables for `.env.example`.
    - Boilerplate files to be written.
5.  **Enhanced Planner (`src/enhanced-planner.ts`):** Extends the basic plan with AI-driven instructions, generating an `AGENT.md` file for the scaffolded project.
6.  **Executor (`src/executor.ts`):** The "heavy lifter" that:
    - Runs the appropriate framework scaffolding command (e.g., `npx create-next-app`).
    - Installs additional packages.
    - Merges scripts into `package.json`.
    - Writes the boilerplate files and `.env.example`.
7.  **AI Service (`src/ai-service.ts`):** Provides prompts and parsing logic for generating integration-specific code and instructions.

---

## Development Conventions

- **ES Modules:** The project uses `"type": "module"` and requires `.js` extensions in imports within `.ts` files (standard Node.js ESM behavior).
- **TypeScript:** Strict type checking is enabled. Always use the `ProjectConfig` and `Blueprint` types for consistency.
- **Error Handling:** Use `program.error()` in the CLI entry and throw descriptive errors in the orchestrator.
- **Surgical Execution:** The executor only writes files if they don't already exist (avoiding overwriting files created by the framework's own scaffold).
- **Agent Integration:** A unique feature is the generation of `AGENT.md`, which is intended to be used by AI agents (like this one) to complete the setup of complex integrations that require manual API key configuration or additional boilerplate.

---

## Testing Project (`test/`)
The `test/` directory contains a sample Next.js project scaffolded by the tool, which can be used to verify that the generated output is correct and functional. It includes its own configuration and setup for testing the integrations (e.g., Firebase, Clerk).
