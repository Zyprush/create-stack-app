import { BlueprintSchema, type Blueprint } from "./types.js";
import type { ProjectConfig } from "./config.js";

export async function planScaffold(config: ProjectConfig): Promise<Blueprint> {
  const dependencies: string[] = ["zod"];
  const devDependencies: string[] = [];
  const scripts: Record<string, string> = {};
  const env: Array<{ key: string; description: string }> = [];
  const files: Array<{ path: string; content: string }> = [];

  const libDir = getLibDir(config.framework);

  // UI deps
  if (config.ui === "material-ui") {
    dependencies.push("@mui/material", "@emotion/react", "@emotion/styled");
  }
  if (config.ui === "bootstrap") {
    dependencies.push("bootstrap");
  }

  // =====================
  // AUTH
  // =====================
  if (config.auth === "clerk") {
    if (config.framework === "next") {
      dependencies.push("@clerk/nextjs");
    } else if (config.framework === "remix") {
      dependencies.push("@clerk/remix");
    } else if (config.framework === "astro") {
      dependencies.push("@clerk/astro");
    } else if (config.framework === "nuxt") {
      dependencies.push("@clerk/vue");
    } else if (config.framework === "sveltekit") {
      dependencies.push("@clerk/sveltekit");
    } else if (config.framework === "qwik") {
      dependencies.push("@clerk/qwik");
    } else if (config.framework === "angular") {
      dependencies.push("@clerk/angular");
    } else {
      dependencies.push("@clerk/clerk-js");
    }
    env.push({ key: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", description: "Clerk publishable key" });
    env.push({ key: "CLERK_SECRET_KEY", description: "Clerk secret key (server)" });
  }

  if (config.auth === "firebase") {
    dependencies.push("firebase");
    const prefix = config.framework === "next" ? "NEXT_PUBLIC_" : "VITE_";
    const envAccess = config.framework === "next" 
      ? (key: string) => `process.env.${key}`
      : (key: string) => `import.meta.env.${key}`;
    
    env.push({ key: `${prefix}FIREBASE_API_KEY`, description: "Firebase API key" });
    env.push({ key: `${prefix}FIREBASE_AUTH_DOMAIN`, description: "Firebase auth domain" });
    env.push({ key: `${prefix}FIREBASE_PROJECT_ID`, description: "Firebase project ID" });
    env.push({ key: `${prefix}FIREBASE_STORAGE_BUCKET`, description: "Firebase storage bucket" });
    env.push({ key: `${prefix}FIREBASE_MESSAGING_SENDER_ID`, description: "Firebase messaging sender ID" });
    env.push({ key: `${prefix}FIREBASE_APP_ID`, description: "Firebase app ID" });
    
    const envVar = (key: string) => envAccess(`${prefix}${key}`);
    
    files.push({
      path: `${libDir}/firebase.ts`,
      content: `import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: ${envVar("FIREBASE_API_KEY")},
  authDomain: ${envVar("FIREBASE_AUTH_DOMAIN")},
  projectId: ${envVar("FIREBASE_PROJECT_ID")},
  storageBucket: ${envVar("FIREBASE_STORAGE_BUCKET")},
  messagingSenderId: ${envVar("FIREBASE_MESSAGING_SENDER_ID")},
  appId: ${envVar("FIREBASE_APP_ID")},
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
`
    });
  }

  if (config.auth === "auth0") {
    if (config.framework === "next") {
      dependencies.push("@auth0/nextjs-auth0");
    } else if (config.framework === "react" || config.framework === "vite-react") {
      dependencies.push("@auth0/auth0-react");
    } else if (config.framework === "angular") {
      dependencies.push("@auth0/auth0-angular");
    } else if (config.framework === "vue" || config.framework === "vite-vue" || config.framework === "nuxt") {
      dependencies.push("@auth0/auth0-vue");
    } else if (config.framework === "svelte" || config.framework === "sveltekit") {
      dependencies.push("@auth0/auth0-spa-js");
    } else {
      dependencies.push("auth0-js");
    }
    env.push({ key: "NEXT_PUBLIC_AUTH0_DOMAIN", description: "Auth0 domain (e.g. your-tenant.auth0.com)" });
    env.push({ key: "NEXT_PUBLIC_AUTH0_CLIENT_ID", description: "Auth0 client ID" });
    env.push({ key: "AUTH0_CLIENT_SECRET", description: "Auth0 client secret (server only)" });
  }

  if (config.auth === "oauth") {
    if (config.framework === "next") {
      dependencies.push("next-auth");
    } else if (config.framework === "sveltekit") {
      dependencies.push("@auth/sveltekit");
    } else if (config.framework === "remix") {
      dependencies.push("remix-auth");
    } else if (config.framework === "nuxt") {
      dependencies.push("next-auth", "@sidebase/nuxt-auth");
    } else if (config.framework === "qwik") {
      dependencies.push("@auth/qwik");
    } else if (config.framework === "solid") {
      dependencies.push("@solid-auth/session");
    } else {
      dependencies.push("oidc-client-ts");
    }
    env.push({ key: "AUTH_SECRET", description: "Auth secret for sessions" });
    env.push({ key: "AUTH_GOOGLE_ID", description: "Google OAuth client ID (optional)" });
    env.push({ key: "AUTH_GOOGLE_SECRET", description: "Google OAuth client secret (optional)" });
  }

  // =====================
  // DATABASE
  // =====================
  if (config.database === "prisma-postgresql") {
    dependencies.push("@prisma/client");
    devDependencies.push("prisma");
    scripts["db:generate"] = "prisma generate";
    scripts["db:push"] = "prisma db push";
    scripts["db:migrate"] = "prisma migrate dev";
    env.push({ key: "DATABASE_URL", description: "PostgreSQL connection string" });
    files.push({
      path: "prisma/schema.prisma",
      content: `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`
    });
    files.push({
      path: `${libDir}/prisma.ts`,
      content: `import { PrismaClient } from "@prisma/client";

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
`
    });
  }

  if (config.database === "mongodb") {
    dependencies.push("mongodb");
    // const prefix = config.framework === "next" ? "NEXT_PUBLIC_" : "VITE_"; // Unused but kept for reference
    env.push({ key: "MONGODB_URI", description: "MongoDB connection string" });
    const useImportMeta = config.framework !== "next";
    files.push({
      path: `${libDir}/mongodb.ts`,
      content: `import { MongoClient } from "mongodb";

const uri = ${useImportMeta ? "import.meta.env.VITE_MONGODB_URI" : "process.env.MONGODB_URI"};
if (!uri) throw new Error("Missing MONGODB_URI");

declare global {
  var __mongoClient: MongoClient | undefined;
}

export const mongoClient = globalThis.__mongoClient ?? new MongoClient(uri);
globalThis.__mongoClient = mongoClient;

export const db = mongoClient.db();
`
    });
  }

  if (config.database === "firebase") {
    dependencies.push("firebase", "firebase-admin");
    env.push({ key: "FIREBASE_PROJECT_ID", description: "Firebase project ID" });
    env.push({ key: "FIREBASE_CLIENT_EMAIL", description: "Firebase service account email" });
    env.push({ key: "FIREBASE_PRIVATE_KEY", description: "Firebase private key" });
  }

  if (config.database === "supabase") {
    dependencies.push("@supabase/supabase-js", "@supabase/ssr");
    const prefix = config.framework === "next" ? "NEXT_PUBLIC_" : "VITE_";
    const envAccess = config.framework === "next" 
      ? (key: string) => `process.env.${key}`
      : (key: string) => `import.meta.env.${key}`;
    
    env.push({ key: `${prefix}SUPABASE_URL`, description: "Supabase project URL" });
    env.push({ key: `${prefix}SUPABASE_ANON_KEY`, description: "Supabase anon key" });
    
    const envVar = (key: string) => envAccess(`${prefix}${key}`);
    
    files.push({
      path: `${libDir}/supabase.ts`,
      content: `import { createClient } from "@supabase/supabase-js";

const supabaseUrl = ${envVar("SUPABASE_URL")};
const supabaseAnonKey = ${envVar("SUPABASE_ANON_KEY")};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
`
    });
  }

  if (config.database === "convex") {
    dependencies.push("convex");
    const prefix = config.framework === "next" ? "NEXT_PUBLIC_" : "VITE_";
    const envAccess = config.framework === "next" 
      ? (key: string) => `process.env.${key}`
      : (key: string) => `import.meta.env.${key}`;
    
    env.push({ key: `${prefix}CONVEX_URL`, description: "Convex deployment URL" });
    const envVar = (key: string) => envAccess(`${prefix}${key}`);
    
    files.push({
      path: `${libDir}/convex.ts`,
      content: `import { ConvexHttpClient } from "convex/browser";

const url = ${envVar("CONVEX_URL")};
if (!url) throw new Error("Missing CONVEX_URL");

export const convex = new ConvexHttpClient(url);
`
    });
  }

  if (config.database === "planetscale") {
    dependencies.push("@planetscale/database");
    env.push({ key: "DATABASE_URL", description: "PlanetScale connection string" });
    const useImportMeta = config.framework !== "next";
    files.push({
      path: `${libDir}/planetscale.ts`,
      content: `import { connect } from "@planetscale/database";

const url = ${useImportMeta ? "import.meta.env.VITE_DATABASE_URL" : "process.env.DATABASE_URL"};
if (!url) throw new Error("Missing DATABASE_URL");

export const db = connect({ url });
`
    });
  }

  // =====================
  // PAYMENTS
  // =====================
  if (config.payments === "stripe") {
    dependencies.push("stripe", "@stripe/stripe-js");
    const prefix = config.framework === "next" ? "NEXT_PUBLIC_" : "VITE_";
    const envAccess = config.framework === "next" 
      ? (key: string) => `process.env.${key}`
      : (key: string) => `import.meta.env.${key}`;
    
    env.push({ key: `${prefix}STRIPE_PUBLISHABLE_KEY`, description: "Stripe publishable key" });
    env.push({ key: "STRIPE_SECRET_KEY", description: "Stripe secret key (server)" });
    env.push({ key: "STRIPE_WEBHOOK_SECRET", description: "Stripe webhook secret (server)" });
    
    const envVar = (key: string) => envAccess(`${prefix}${key}`);
    
    files.push({
      path: `${libDir}/stripe-client.ts`,
      content: `import { loadStripe } from "@stripe/stripe-js";

const key = ${envVar("STRIPE_PUBLISHABLE_KEY")};
if (!key) throw new Error("Missing STRIPE_PUBLISHABLE_KEY");

export const stripePromise = loadStripe(key);
`
    });
    files.push({
      path: `${libDir}/stripe.ts`,
      content: `import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY");

export const stripe = new Stripe(secretKey, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
});
`
    });
    if (hasServerRoutes(config.framework)) {
      files.push({
        path: getApiRoutePath(config.framework, "webhooks/stripe"),
        content: getStripeWebhookContent(config.framework)
      });
    }
  }

  if (config.payments === "paymongo") {
    env.push({ key: "PAYMONGO_SECRET_KEY", description: "PayMongo secret key" });
    env.push({ key: "PAYMONGO_PUBLIC_KEY", description: "PayMongo public key" });
    if (hasServerRoutes(config.framework)) {
      files.push({
        path: getApiRoutePath(config.framework, "webhooks/paymongo"),
        content: getPaymongoWebhookContent(config.framework)
      });
    }
  }

  // =====================
  // NEWSLETTER / EMAIL
  // =====================
  if (config.newsletter === "resend") {
    dependencies.push("resend");
    env.push({ key: "RESEND_API_KEY", description: "Resend API key" });
    files.push({
      path: `${libDir}/email.ts`,
      content: `import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) throw new Error("Missing RESEND_API_KEY");

export const resend = new Resend(apiKey);
`
    });
  }

  if (config.newsletter === "mailchimp") {
    dependencies.push("@mailchimp/mailchimp_marketing");
    env.push({ key: "MAILCHIMP_API_KEY", description: "Mailchimp API key" });
    env.push({ key: "MAILCHIMP_SERVER_PREFIX", description: "Mailchimp server prefix (e.g. us21)" });
    files.push({
      path: `${libDir}/mailchimp.ts`,
      content: `import mailchimp from "@mailchimp/mailchimp_marketing";

const apiKey = process.env.MAILCHIMP_API_KEY;
const server = process.env.MAILCHIMP_SERVER_PREFIX;

if (!apiKey || !server) throw new Error("Missing Mailchimp env vars");

mailchimp.setConfig({ apiKey, server });

export { mailchimp };
`
    });
  }

  if (config.newsletter === "convertkit") {
    env.push({ key: "CONVERTKIT_API_KEY", description: "ConvertKit API key" });
    env.push({ key: "CONVERTKIT_FORM_ID", description: "ConvertKit form ID" });
    files.push({
      path: `${libDir}/convertkit.ts`,
      content: `const apiKey = process.env.CONVERTKIT_API_KEY;
const formId = process.env.CONVERTKIT_FORM_ID;

if (!apiKey || !formId) throw new Error("Missing ConvertKit env vars");

export async function subscribeConvertKit(email: string) {
  const res = await fetch(\`https://api.convertkit.com/v3/forms/\${formId}/subscribe\`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, email }),
  });

  if (!res.ok) throw new Error("ConvertKit subscribe failed");
  return res.json();
}
`
    });
  }

  // =====================
  // CONTACT
  // =====================
  if (config.contact === "emailjs") {
    dependencies.push("@emailjs/browser");
    const prefix = config.framework === "next" ? "NEXT_PUBLIC_" : "VITE_";
    env.push({ key: `${prefix}EMAILJS_SERVICE_ID`, description: "EmailJS service ID" });
    env.push({ key: `${prefix}EMAILJS_TEMPLATE_ID`, description: "EmailJS template ID" });
    env.push({ key: `${prefix}EMAILJS_PUBLIC_KEY`, description: "EmailJS public key" });
  }

  // =====================
  // ANALYTICS
  // =====================
  if (config.analytics === "vercel") {
    if (config.framework === "next" || config.framework === "remix" || config.framework === "astro") {
      dependencies.push("@vercel/analytics");
    }
    if (config.framework === "sveltekit") {
      dependencies.push("@vercel/analytics");
    }
  }

  if (config.analytics === "google") {
    const prefix = config.framework === "next" ? "NEXT_PUBLIC_" : "VITE_";
    env.push({ key: `${prefix}GA_MEASUREMENT_ID`, description: "Google Analytics measurement ID (G-...)" });
  }

  if (config.analytics === "plausible") {
    const prefix = config.framework === "next" ? "NEXT_PUBLIC_" : "VITE_";
    env.push({ key: `${prefix}PLAUSIBLE_DOMAIN`, description: "Plausible analytics domain" });
  }

  if (config.analytics === "umami") {
    const prefix = config.framework === "next" ? "NEXT_PUBLIC_" : "VITE_";
    env.push({ key: `${prefix}UMAMI_WEBSITE_ID`, description: "Umami website ID" });
    env.push({ key: `${prefix}UMAMI_URL`, description: "Umami analytics URL" });
  }

  // =====================
  // CHAT
  // =====================
  if (config.chat === "crisp") {
    const prefix = config.framework === "next" ? "NEXT_PUBLIC_" : "VITE_";
    env.push({ key: `${prefix}CRISP_WEBSITE_ID`, description: "Crisp website ID" });
  }

  if (config.chat === "intercom") {
    const prefix = config.framework === "next" ? "NEXT_PUBLIC_" : "VITE_";
    env.push({ key: `${prefix}INTERCOM_APP_ID`, description: "Intercom app ID" });
  }

  if (config.chat === "twilio") {
    dependencies.push("twilio");
    env.push({ key: "TWILIO_ACCOUNT_SID", description: "Twilio account SID" });
    env.push({ key: "TWILIO_AUTH_TOKEN", description: "Twilio auth token" });
    env.push({ key: "TWILIO_PHONE_NUMBER", description: "Twilio phone number" });
  }

  // =====================
  // FRAMEWORK-SPECIFIC FILES
  // =====================
  const frameworkFiles = generateFrameworkFiles(config);
  files.push(...frameworkFiles);

  return BlueprintSchema.parse({
    framework: config.framework,
    packageManager: config.packageManager,
    dependencies: Array.from(new Set(dependencies)),
    devDependencies: Array.from(new Set(devDependencies)),
    scripts,
    env,
    files
  });
}

function getLibDir(framework: string): string {
  switch (framework) {
    case "next":
    case "remix":
    case "nuxt":
    case "sveltekit":
    case "astro":
      return "lib";
    case "qwik":
      return "src/lib";
    default:
      return "src/lib";
  }
}

function hasServerRoutes(framework: string): boolean {
  return ["next", "remix", "nuxt", "sveltekit", "astro", "qwik"].includes(framework);
}

function getApiRoutePath(framework: string, route: string): string {
  switch (framework) {
    case "next":
      return `src/app/api/${route}/route.ts`;
    case "remix":
      return `app/routes/api.${route.replace(/\//g, ".")}.ts`;
    case "nuxt":
      return `server/api/${route.replace(/\//g, "-")}.ts`;
    case "sveltekit":
      return `src/routes/api/${route}/+server.ts`;
    case "astro":
      return `src/pages/api/${route}.ts`;
    case "qwik":
      return `src/routes/api/${route}/index.ts`;
    default:
      return `api/${route}.ts`;
  }
}

function getStripeWebhookContent(framework: string): string {
  switch (framework) {
    case "next":
      return `import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const signature = (await headers()).get("stripe-signature");
  const body = await req.text();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("Stripe webhook event:", event.type);
  return NextResponse.json({ received: true });
}
`;
    case "remix":
      return `import type { ActionFunctionArgs } from "@remix-run/node";
import { stripe } from "~/lib/stripe";

export async function action({ request }: ActionFunctionArgs) {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return Response.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("Stripe webhook event:", event.type);
  return Response.json({ received: true });
}
`;
    case "sveltekit":
      return `import type { RequestHandler } from "./$types";
import { stripe } from "$lib/stripe";

export const POST: RequestHandler = async ({ request }) => {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return new Response(JSON.stringify({ error: "Missing signature or secret" }), { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }

  console.log("Stripe webhook event:", event.type);
  return new Response(JSON.stringify({ received: true }));
};
`;
    case "nuxt":
      return `import { stripe } from "~/lib/stripe";

export default defineEventHandler(async (event) => {
  const signature = getHeader(event, "stripe-signature");
  const body = await readRawBody(event);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret || !body) {
    return { error: "Missing signature or secret" };
  }

  try {
    const stripeEvent = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log("Stripe webhook event:", stripeEvent.type);
  } catch {
    return { error: "Invalid signature" };
  }

  return { received: true };
});
`;
    default:
      return "";
  }
}

function getPaymongoWebhookContent(framework: string): string {
  switch (framework) {
    case "next":
      return `import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const payload = await req.json();
  console.log("PayMongo webhook:", payload);
  return NextResponse.json({ received: true });
}
`;
    case "sveltekit":
      return `import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  const payload = await request.json();
  console.log("PayMongo webhook:", payload);
  return new Response(JSON.stringify({ received: true }));
};
`;
    default:
      return "";
  }
}

function generateFrameworkFiles(config: ProjectConfig): Array<{ path: string; content: string }> {
  const files: Array<{ path: string; content: string }> = [];
  // const template = config.appType;

  switch (config.framework) {
    case "next":
      files.push(...generateNextFiles(config));
      break;
    case "react":
    case "vite-react":
      files.push(...generateReactFiles(config));
      break;
    case "vite-vue":
    case "vue":
      files.push(...generateVueFiles(config));
      break;
    case "vite-vanilla":
      files.push(...generateVanillaFiles(config));
      break;
    case "angular":
      files.push(...generateAngularFiles(config));
      break;
    case "nuxt":
      files.push(...generateNuxtFiles(config));
      break;
    case "svelte":
      files.push(...generateSvelteFiles(config));
      break;
    case "sveltekit":
      files.push(...generateSvelteKitFiles(config));
      break;
    case "astro":
      files.push(...generateAstroFiles(config));
      break;
    case "remix":
      files.push(...generateRemixFiles(config));
      break;
    case "solid":
      files.push(...generateSolidFiles(config));
      break;
    case "qwik":
      files.push(...generateQwikFiles(config));
      break;
  }

  return files;
}

function generateNextFiles(config: ProjectConfig): Array<{ path: string; content: string }> {
  const files: Array<{ path: string; content: string }> = [];
  const analyticsScript = getAnalyticsScript(config);
  const chatScript = getChatScript(config);
  const clerkProvider = config.auth === "clerk";

  let layoutContent = `import "./globals.css";\nimport type { Metadata } from "next";\n`;
  
  if (config.analytics === "vercel") {
    layoutContent += `import { Analytics } from "@vercel/analytics/react";\n`;
  }
  if (clerkProvider) {
    layoutContent += `import { ClerkProvider } from "@clerk/nextjs";\n`;
  }
  if (analyticsScript || chatScript) {
    layoutContent += `import Script from "next/script";\n`;
  }

  layoutContent += `
export const metadata: Metadata = {
  title: "Create Stack App",
  description: "Scaffolded by create-stack-app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    ${clerkProvider ? "<ClerkProvider>" : ""}
    <html lang="en">
      <body>
        {children}
        ${config.analytics === "vercel" ? "<Analytics />" : ""}
        ${analyticsScript}
        ${chatScript}
      </body>
    </html>
    ${clerkProvider ? "</ClerkProvider>" : ""}
  );
}
`;

  files.push({ path: "src/app/layout.tsx", content: layoutContent });

  if (config.auth === "clerk") {
    files.push({
      path: "middleware.ts",
      content: `import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: ["/((?!_next|.*\\\\..*).*)", "/(api|trpc)(.*)"],
};
`
    });
  }

  if (config.auth === "auth0") {
    files.push({
      path: "src/app/api/auth/[auth0]/route.ts",
      content: `import { handleAuth } from "@auth0/nextjs-auth0";

export const GET = handleAuth();
`
    });
  }

  if (config.auth === "oauth") {
    files.push({
      path: "src/app/api/auth/[...nextauth]/route.ts",
      content: `import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers } = NextAuth({
  providers: process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? [Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET })]
    : [],
  secret: process.env.AUTH_SECRET,
});

export const GET = handlers.GET;
export const POST = handlers.POST;
`
    });
  }

  files.push({
    path: "src/app/page.tsx",
    content: `export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui", padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>Create Stack App</h1>
      <p>Template: ${config.appType}</p>
    </main>
  );
}
`
  });

  return files;
}

function generateReactFiles(config: ProjectConfig): Array<{ path: string; content: string }> {
  return [{
    path: "src/App.tsx",
    content: `export default function App() {
  return (
    <main style={{ fontFamily: "system-ui", padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>Create Stack App</h1>
      <p>Template: ${config.appType}</p>
    </main>
  );
}
`
  }];
}

function generateVueFiles(config: ProjectConfig): Array<{ path: string; content: string }> {
  return [{
    path: "src/App.vue",
    content: `<template>
  <main style="font-family: system-ui; padding: 24px; max-width: 900px; margin: 0 auto">
    <h1>Create Stack App</h1>
    <p>Template: ${config.appType}</p>
  </main>
</template>

<script setup lang="ts">
</script>
`
  }];
}

function generateVanillaFiles(config: ProjectConfig): Array<{ path: string; content: string }> {
  return [{
    path: "src/main.ts",
    content: `document.querySelector<HTMLDivElement>('#app')!.innerHTML = \`
  <main style="font-family: system-ui; padding: 24px; max-width: 900px; margin: 0 auto">
    <h1>Create Stack App</h1>
    <p>Template: ${config.appType}</p>
  </main>
\`;
`
  }];
}

function generateAngularFiles(config: ProjectConfig): Array<{ path: string; content: string }> {
  return [{
    path: "src/app/app.component.ts",
    content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <main style="font-family: system-ui; padding: 24px; max-width: 900px; margin: 0 auto">
      <h1>Create Stack App</h1>
      <p>Template: ${config.appType}</p>
    </main>
  \`
})
export class AppComponent {}
`
  }];
}

function generateNuxtFiles(config: ProjectConfig): Array<{ path: string; content: string }> {
  return [{
    path: "app.vue",
    content: `<template>
  <main style="font-family: system-ui; padding: 24px; max-width: 900px; margin: 0 auto">
    <h1>Create Stack App</h1>
    <p>Template: ${config.appType}</p>
  </main>
</template>

<script setup lang="ts">
</script>
`
  }];
}

function generateSvelteFiles(config: ProjectConfig): Array<{ path: string; content: string }> {
  return [{
    path: "src/App.svelte",
    content: `<main style="font-family: system-ui; padding: 24px; max-width: 900px; margin: 0 auto">
  <h1>Create Stack App</h1>
  <p>Template: ${config.appType}</p>
</main>
`
  }];
}

function generateSvelteKitFiles(config: ProjectConfig): Array<{ path: string; content: string }> {
  return [{
    path: "src/routes/+page.svelte",
    content: `<main style="font-family: system-ui; padding: 24px; max-width: 900px; margin: 0 auto">
  <h1>Create Stack App</h1>
  <p>Template: ${config.appType}</p>
</main>
`
  }];
}

function generateAstroFiles(config: ProjectConfig): Array<{ path: string; content: string }> {
  return [{
    path: "src/pages/index.astro",
    content: `---
---

<main style="font-family: system-ui; padding: 24px; max-width: 900px; margin: 0 auto">
  <h1>Create Stack App</h1>
  <p>Template: ${config.appType}</p>
</main>
`
  }];
}

function generateRemixFiles(config: ProjectConfig): Array<{ path: string; content: string }> {
  return [{
    path: "app/routes/_index.tsx",
    content: `export default function Index() {
  return (
    <main style={{ fontFamily: "system-ui", padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>Create Stack App</h1>
      <p>Template: ${config.appType}</p>
    </main>
  );
}
`
  }];
}

function generateSolidFiles(config: ProjectConfig): Array<{ path: string; content: string }> {
  return [{
    path: "src/App.tsx",
    content: `export default function App() {
  return (
    <main style={{ "font-family": "system-ui", padding: "24px", "max-width": "900px", margin: "0 auto" }}>
      <h1>Create Stack App</h1>
      <p>Template: ${config.appType}</p>
    </main>
  );
}
`
  }];
}

function generateQwikFiles(config: ProjectConfig): Array<{ path: string; content: string }> {
  return [{
    path: "src/routes/index.tsx",
    content: `import { component$ } from '@builder.io/qwik-city';

export default component$(() => {
  return (
    <main style={{ fontFamily: 'system-ui', padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Create Stack App</h1>
      <p>Template: ${config.appType}</p>
    </main>
  );
});
`
  }];
}

function getAnalyticsScript(config: ProjectConfig): string {
  if (config.analytics === "google") {
    return `{process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? (
            <>
              <Script src={\`https://www.googletagmanager.com/gtag/js?id=\${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}\`} strategy="afterInteractive" />
              <Script id="ga" strategy="afterInteractive">
                {\`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','\${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');\`}
              </Script>
            </>
          ) : null}`;
  }
  return "";
}

function getChatScript(config: ProjectConfig): string {
  if (config.chat === "crisp") {
    return `{process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID ? (
            <Script id="crisp" strategy="afterInteractive">
              {\`window.$crisp=[];window.CRISP_WEBSITE_ID='\${process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID}';(function(){var d=document;var s=d.createElement('script');s.src='https://client.crisp.chat/l.js';s.async=1;d.getElementsByTagName('head')[0].appendChild(s);})();\`}
            </Script>
          ) : null}`;
  }
  if (config.chat === "intercom") {
    return `{process.env.NEXT_PUBLIC_INTERCOM_APP_ID ? (
            <Script id="intercom" strategy="afterInteractive">
              {\`(function(){var w=window;var ic=w.Intercom;if(typeof ic==='function'){ic('reattach_activator');ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/\${process.env.NEXT_PUBLIC_INTERCOM_APP_ID}';var x=d.getElementsByTagName('script')[0];x.parentNode?.insertBefore(s,x);};if(document.readyState==='complete'){l();}else if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();window.intercomSettings={app_id:'\${process.env.NEXT_PUBLIC_INTERCOM_APP_ID}'};\`}
            </Script>
          ) : null}`;
  }
  return "";
}