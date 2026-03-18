// AI service for generating code templates and research prompts

export interface AICodeGenerationRequest {
  framework: string;
  integration: string;
  task: string;
  context?: string;
  documentation?: string;
}

export interface AICodeGenerationResult {
  code: string;
  explanation: string;
  files: Array<{ path: string; content: string }>;
  steps: string[];
  researchPrompt: string;
}

export class AIService {
  createIntegrationPrompt(request: AICodeGenerationRequest): string {
    const { framework, integration, task, context, documentation } = request;
    
    return `
Generate complete implementation code for ${integration} in a ${framework} project.

Task: ${task}

Framework: ${framework}
Integration: ${integration}

${context ? `Context: ${context}` : ''}
${documentation ? `Documentation summary: ${documentation.substring(0, 500)}...` : ''}

Please provide:
1. Complete code files needed for this integration
2. File paths relative to project root
3. Installation/configuration steps
4. Example usage in ${framework}
5. Environment variables needed
6. Common pitfalls and solutions

Focus on practical, production-ready code that follows best practices for ${framework}.
Include TypeScript types and proper error handling.
`;
  }
  
  createFrameworkPrompt(framework: string): string {
    return `
Create a complete project structure and configuration for ${framework} with TypeScript.

Include:
1. Recommended folder structure
2. Configuration files (tsconfig, build config, etc.)
3. Development setup (dev server, build commands)
4. Testing setup
5. Deployment configuration
6. Best practices for ${framework} projects

Provide specific code examples and file contents.
`;
  }
  
  processAIResponse(response: string, request: AICodeGenerationRequest): AICodeGenerationResult {
    const codeBlocks = this.extractCodeBlocks(response);
    const steps = this.extractSteps(response);
    const explanation = this.extractExplanation(response);
    const files = this.generateFileSuggestions(request, codeBlocks);
    
    return {
      code: codeBlocks.join("\n\n"),
      explanation,
      files,
      steps: steps.length > 0 ? steps : this.generateDefaultSteps(request),
      researchPrompt: this.createIntegrationPrompt(request)
    };
  }
  
  private extractCodeBlocks(content: string): string[] {
    const codeBlocks: string[] = [];
    if (!content) return codeBlocks;
    
    const codeBlockRegex = /```(?:[a-zA-Z0-9]+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      codeBlocks.push(match[1].trim());
    }
    
    return codeBlocks;
  }
  
  private extractSteps(content: string): string[] {
    const steps: string[] = [];
    if (!content) return steps;
    
    // Look for numbered steps
    const stepRegex = /\d+\.\s+(.*?)(?=\n\d+\.|\n\n|$)/g;
    let stepMatch;
    
    while ((stepMatch = stepRegex.exec(content)) !== null) {
      steps.push(stepMatch[1].trim());
    }
    
    // Also look for bullet points
    const bulletRegex = /[-*]\s+(.*?)(?=\n[-*]|\n\n|$)/g;
    let bulletMatch;
    
    while ((bulletMatch = bulletRegex.exec(content)) !== null) {
      steps.push(bulletMatch[1].trim());
    }
    
    return steps.slice(0, 10); // Limit to 10 steps
  }
  
  private extractExplanation(content: string): string {
    if (!content) return "Implementation guidance based on best practices.";
    
    // Try to find a summary paragraph
    const paragraphs = content.split("\n\n");
    for (const paragraph of paragraphs) {
      if (paragraph.length > 50 && 
          paragraph.length < 300 && 
          !paragraph.includes("```") &&
          !paragraph.match(/^\d+\./) &&
          !paragraph.match(/^[-*]/)) {
        return paragraph.trim();
      }
    }
    
    // Fallback: first non-code paragraph
    for (const paragraph of paragraphs) {
      if (!paragraph.includes("```") && paragraph.trim().length > 20) {
        return paragraph.substring(0, 200).trim() + "...";
      }
    }
    
    return "Implementation guidance based on best practices.";
  }
  
  private generateFileSuggestions(request: AICodeGenerationRequest, codeBlocks: string[]): Array<{ path: string; content: string }> {
    const { framework, integration } = request;
    const files: Array<{ path: string; content: string }> = [];
    
    const libDir = this.getLibDir(framework);
    
    // Map integration types to suggested file structures
    const fileTemplates: Record<string, Array<{ path: string; description: string }>> = {
      "clerk": [
        { path: `${libDir}/auth.ts`, description: "Clerk authentication configuration" },
        { path: `${libDir}/auth-provider.tsx`, description: "Auth provider component" },
        { path: `src/components/auth/login-form.tsx`, description: "Login form component" },
        { path: `src/components/auth/protected-route.tsx`, description: "Protected route wrapper" }
      ],
      "firebase": [
        { path: `${libDir}/firebase.ts`, description: "Firebase configuration" },
        { path: `${libDir}/auth.ts`, description: "Firebase auth setup" },
        { path: `src/components/auth/firebase-login.tsx`, description: "Firebase login component" }
      ],
      "prisma-postgresql": [
        { path: `prisma/schema.prisma`, description: "Prisma schema" },
        { path: `${libDir}/db.ts`, description: "Database client" },
        { path: `src/lib/seed.ts`, description: "Database seed script" }
      ],
      "stripe": [
        { path: `${libDir}/stripe.ts`, description: "Stripe configuration" },
        { path: `src/app/api/stripe/webhook/route.ts`, description: "Stripe webhook handler" },
        { path: `src/components/payments/checkout-button.tsx`, description: "Stripe checkout component" }
      ],
      "resend": [
        { path: `${libDir}/email.ts`, description: "Email service configuration" },
        { path: `src/app/api/email/route.ts`, description: "Email API endpoint" },
        { path: `src/components/newsletter/signup-form.tsx`, description: "Newsletter signup form" }
      ]
    };
    
    const templates = fileTemplates[integration] || [
      { path: `${libDir}/${integration}.ts`, description: `${integration} configuration` }
    ];
    
    // Assign code blocks to files
    templates.forEach((template, index) => {
      const code = codeBlocks[index] || `// ${template.description}\n// Configure ${integration} for ${framework}`;
      files.push({
        path: template.path,
        content: code
      });
    });
    
    return files;
  }
  
  private getLibDir(framework: string): string {
    const libDirs: Record<string, string> = {
      "next": "src/lib",
      "react": "src/lib",
      "vite-react": "src/lib",
      "vite-vue": "src/lib",
      "vite-vanilla": "src/lib",
      "angular": "src/app/lib",
      "vue": "src/lib",
      "nuxt": "lib",
      "svelte": "src/lib",
      "sveltekit": "src/lib",
      "astro": "src/lib",
      "remix": "app/lib",
      "solid": "src/lib",
      "qwik": "src/lib"
    };
    
    return libDirs[framework] || "src/lib";
  }
  
  private generateDefaultSteps(request: AICodeGenerationRequest): string[] {
    const { framework, integration } = request;
    
    return [
      `Install ${integration} dependencies`,
      `Configure ${integration} environment variables`,
      `Set up ${integration} configuration files`,
      `Implement ${integration} services/utilities`,
      `Create ${integration} components/hooks`,
      `Test ${integration} integration`,
      `Add ${integration} to your ${framework} application`
    ];
  }
  
  getFallbackResult(request: AICodeGenerationRequest): AICodeGenerationResult {
    const { framework, integration } = request;
    const libDir = this.getLibDir(framework);
    
    return {
      code: `// Basic ${integration} setup for ${framework}\n// Refer to official documentation for complete implementation`,
      explanation: `Setup instructions for ${integration} in ${framework}. Check official docs for latest practices.`,
      files: [{
        path: `${libDir}/${integration}.ts`,
        content: `// ${integration} configuration for ${framework}\n// Add your API keys and configuration here\n\nexport const config = {\n  // Configure ${integration}\n};\n`
      }],
      steps: this.generateDefaultSteps(request),
      researchPrompt: this.createIntegrationPrompt(request)
    };
  }
}