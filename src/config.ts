import prompts from "prompts";
import { z } from "zod";

export const ProjectConfigSchema = z.object({
  targetDir: z.string().min(1),
  packageManager: z.enum(["npm", "bun", "pnpm", "yarn"]),
  appType: z.enum(["landing", "portfolio", "saas", "blog", "docs", "ecommerce", "other"]),
  framework: z.enum([
    "next",
    "react",
    "vite-react",
    "vite-vue",
    "vite-vanilla",
    "angular",
    "vue",
    "nuxt",
    "svelte",
    "sveltekit",
    "astro",
    "remix",
    "solid",
    "qwik"
  ]),
  ui: z.enum(["tailwind-shadcn", "material-ui", "bootstrap", "none"]),
  auth: z.enum(["clerk", "firebase", "oauth", "auth0", "none"]),
  database: z.enum(["prisma-postgresql", "mongodb", "firebase", "convex", "supabase", "planetscale", "none"]),
  payments: z.enum(["stripe", "paymongo", "clerk", "none"]),
  newsletter: z.enum(["resend", "mailchimp", "convertkit", "none"]),
  contact: z.enum(["emailjs", "none"]),
  analytics: z.enum(["vercel", "google", "plausible", "umami", "none"]),
  chat: z.enum(["crisp", "intercom", "twilio", "none"])
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

export async function collectProjectConfig(input: { targetDir: string; yes: boolean }): Promise<ProjectConfig> {
  const defaults: ProjectConfig = {
    targetDir: input.targetDir,
    packageManager: "npm",
    appType: "saas",
    framework: "vite-react",
    ui: "tailwind-shadcn",
    auth: "clerk",
    database: "prisma-postgresql",
    payments: "stripe",
    newsletter: "resend",
    contact: "emailjs",
    analytics: "vercel",
    chat: "none"
  };

  if (input.yes) return ProjectConfigSchema.parse(defaults);

  const answers = await prompts(
    [
      {
        type: "select",
        name: "packageManager",
        message: "Package manager",
        choices: [
          { title: "npm", value: "npm" },
          { title: "bun", value: "bun" },
          { title: "pnpm", value: "pnpm" },
          { title: "yarn", value: "yarn" }
        ],
        initial: 0
      },
      {
        type: "select",
        name: "appType",
        message: "App type",
        choices: [
          { title: "Landing page", value: "landing" },
          { title: "Portfolio", value: "portfolio" },
          { title: "SaaS", value: "saas" },
          { title: "Blog", value: "blog" },
          { title: "Docs", value: "docs" },
          { title: "E-commerce", value: "ecommerce" },
          { title: "Other", value: "other" }
        ],
        initial: 2
      },
      {
        type: "select",
        name: "framework",
        message: "Framework",
        choices: [
          { title: "Next.js (App Router)", value: "next" },
          { title: "React (CRA)", value: "react" },
          { title: "Vite + React", value: "vite-react" },
          { title: "Vite + Vue", value: "vite-vue" },
          { title: "Vite (Vanilla JS/TS)", value: "vite-vanilla" },
          { title: "Angular", value: "angular" },
          { title: "Vue", value: "vue" },
          { title: "Nuxt", value: "nuxt" },
          { title: "Svelte (Vite)", value: "svelte" },
          { title: "SvelteKit", value: "sveltekit" },
          { title: "Astro", value: "astro" },
          { title: "Remix", value: "remix" },
          { title: "Solid", value: "solid" },
          { title: "Qwik", value: "qwik" }
        ],
        initial: 0
      },
      {
        type: "select",
        name: "ui",
        message: "UI",
        choices: [
          { title: "Tailwind + shadcn/ui", value: "tailwind-shadcn" },
          { title: "Material UI", value: "material-ui" },
          { title: "Bootstrap", value: "bootstrap" },
          { title: "None", value: "none" }
        ],
        initial: 0
      },
      {
        type: "select",
        name: "auth",
        message: "Auth",
        choices: [
          { title: "Clerk", value: "clerk" },
          { title: "Firebase Auth", value: "firebase" },
          { title: "OAuth (Auth.js)", value: "oauth" },
          { title: "Auth0", value: "auth0" },
          { title: "None", value: "none" }
        ],
        initial: 0
      },
      {
        type: "select",
        name: "database",
        message: "Database",
        choices: [
          { title: "Prisma + PostgreSQL", value: "prisma-postgresql" },
          { title: "MongoDB", value: "mongodb" },
          { title: "Supabase", value: "supabase" },
          { title: "Firebase", value: "firebase" },
          { title: "Convex", value: "convex" },
          { title: "PlanetScale", value: "planetscale" },
          { title: "None", value: "none" }
        ],
        initial: 0
      },
      {
        type: "select",
        name: "payments",
        message: "Payments",
        choices: [
          { title: "Stripe", value: "stripe" },
          { title: "PayMongo", value: "paymongo" },
          { title: "Clerk billing", value: "clerk" },
          { title: "None", value: "none" }
        ],
        initial: 0
      },
      {
        type: "select",
        name: "newsletter",
        message: "Newsletter / email",
        choices: [
          { title: "Resend", value: "resend" },
          { title: "Mailchimp", value: "mailchimp" },
          { title: "ConvertKit", value: "convertkit" },
          { title: "None", value: "none" }
        ],
        initial: 0
      },
      {
        type: "select",
        name: "contact",
        message: "Contact",
        choices: [
          { title: "EmailJS", value: "emailjs" },
          { title: "None", value: "none" }
        ],
        initial: 0
      },
      {
        type: "select",
        name: "analytics",
        message: "Analytics",
        choices: [
          { title: "Vercel Analytics", value: "vercel" },
          { title: "Google Analytics", value: "google" },
          { title: "Plausible", value: "plausible" },
          { title: "Umami", value: "umami" },
          { title: "None", value: "none" }
        ],
        initial: 0
      },
      {
        type: "select",
        name: "chat",
        message: "Chat",
        choices: [
          { title: "None", value: "none" },
          { title: "Crisp", value: "crisp" },
          { title: "Intercom", value: "intercom" },
          { title: "Twilio", value: "twilio" }
        ],
        initial: 0
      }
    ],
    {
      onCancel: () => {
        throw new Error("Cancelled");
      }
    }
  );

  const merged: ProjectConfig = ProjectConfigSchema.parse({
    ...defaults,
    ...answers,
    targetDir: input.targetDir
  });

  return merged;
}

