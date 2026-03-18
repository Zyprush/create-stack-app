// Context7 tools will be called directly when needed
// This service provides query templates and result processing

export interface DocumentationResult {
  libraryId: string;
  documentation: string;
  examples: string[];
  query: string;
}

export class Context7Service {
  getFrameworkQuery(framework: string): { libraryName: string; query: string } {
    const frameworkMap: Record<string, { name: string; query: string }> = {
      "next": { name: "Next.js", query: "How to set up a Next.js project with TypeScript, App Router, and basic configuration" },
      "react": { name: "React", query: "How to set up a React project with TypeScript and routing" },
      "vite-react": { name: "Vite", query: "How to set up a Vite + React project with TypeScript" },
      "vite-vue": { name: "Vite", query: "How to set up a Vite + Vue project with TypeScript" },
      "vite-vanilla": { name: "Vite", query: "How to set up a Vite project with TypeScript" },
      "angular": { name: "Angular", query: "How to set up an Angular project with TypeScript and routing" },
      "vue": { name: "Vue.js", query: "How to set up a Vue.js project with TypeScript" },
      "nuxt": { name: "Nuxt.js", query: "How to set up a Nuxt.js project with TypeScript" },
      "svelte": { name: "Svelte", query: "How to set up a Svelte project with TypeScript" },
      "sveltekit": { name: "SvelteKit", query: "How to set up a SvelteKit project with TypeScript" },
      "astro": { name: "Astro", query: "How to set up an Astro project with TypeScript" },
      "remix": { name: "Remix", query: "How to set up a Remix (React Router) project with TypeScript" },
      "solid": { name: "SolidJS", query: "How to set up a SolidJS project with TypeScript" },
      "qwik": { name: "Qwik", query: "How to set up a Qwik project with TypeScript" }
    };
    
    const frameworkInfo = frameworkMap[framework] || { name: framework, query: `How to set up ${framework} project` };
    return { libraryName: frameworkInfo.name, query: frameworkInfo.query };
  }
  
  getIntegrationQuery(integration: string, framework: string): { libraryName: string; query: string } {
    const integrationMap: Record<string, { name: string; query: string }> = {
      "clerk": { name: "Clerk", query: `How to set up Clerk authentication in ${framework}` },
      "firebase": { name: "Firebase", query: `How to set up Firebase authentication and services in ${framework}` },
      "auth0": { name: "Auth0", query: `How to set up Auth0 authentication in ${framework}` },
      "prisma-postgresql": { name: "Prisma", query: `How to set up Prisma with PostgreSQL in ${framework}` },
      "mongodb": { name: "MongoDB", query: `How to set up MongoDB in ${framework}` },
      "supabase": { name: "Supabase", query: `How to set up Supabase in ${framework}` },
      "planetscale": { name: "PlanetScale", query: `How to set up PlanetScale database in ${framework}` },
      "stripe": { name: "Stripe", query: `How to set up Stripe payments in ${framework}` },
      "resend": { name: "Resend", query: `How to set up Resend for emails in ${framework}` },
      "mailchimp": { name: "Mailchimp", query: `How to set up Mailchimp newsletter in ${framework}` },
      "emailjs": { name: "EmailJS", query: `How to set up EmailJS contact forms in ${framework}` },
      "vercel": { name: "Vercel Analytics", query: `How to set up Vercel Analytics in ${framework}` },
      "google": { name: "Google Analytics", query: `How to set up Google Analytics in ${framework}` },
      "plausible": { name: "Plausible Analytics", query: `How to set up Plausible Analytics in ${framework}` },
      "umami": { name: "Umami Analytics", query: `How to set up Umami Analytics in ${framework}` },
      "crisp": { name: "Crisp", query: `How to set up Crisp chat in ${framework}` },
      "intercom": { name: "Intercom", query: `How to set up Intercom chat in ${framework}` },
      "twilio": { name: "Twilio", query: `How to set up Twilio chat in ${framework}` },
      "tailwind-shadcn": { name: "shadcn/ui", query: `How to set up Tailwind CSS with shadcn/ui in ${framework}` },
      "material-ui": { name: "Material-UI", query: `How to set up Material-UI in ${framework}` },
      "bootstrap": { name: "Bootstrap", query: `How to set up Bootstrap in ${framework}` }
    };
    
    const integrationInfo = integrationMap[integration] || { name: integration, query: `How to set up ${integration} in ${framework}` };
    return { libraryName: integrationInfo.name, query: integrationInfo.query };
  }
  
  processDocumentationResult(result: any): DocumentationResult {
    if (!result) {
      return {
        libraryId: "",
        documentation: "No documentation available",
        examples: [],
        query: ""
      };
    }
    
    return {
      libraryId: result.libraryId || "",
      documentation: result.documentation || result.content || "Documentation loaded",
      examples: this.extractExamples(result.documentation || result.content || ""),
      query: result.query || ""
    };
  }
  
  private extractExamples(docs: string): string[] {
    const examples: string[] = [];
    if (!docs) return examples;
    
    const codeBlockRegex = /```(?:[a-zA-Z0-9]+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(docs)) !== null) {
      examples.push(match[1].trim());
    }
    
    return examples.slice(0, 3); // Return only first 3 examples
  }
}