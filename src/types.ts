import { z } from "zod";

export const BlueprintSchema = z.object({
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
  packageManager: z.enum(["npm", "bun", "pnpm", "yarn"]),
  dependencies: z.array(z.string()),
  devDependencies: z.array(z.string()),
  scripts: z.record(z.string(), z.string()),
  env: z.array(z.object({ key: z.string(), description: z.string() })),
  files: z.array(z.object({ path: z.string(), content: z.string() }))
});

export type Blueprint = z.infer<typeof BlueprintSchema>;

