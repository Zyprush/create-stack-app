import type { ProjectConfig } from "./config.js";
import type { Blueprint } from "./types.js";
import { Context7Service, type DocumentationResult } from "./context7.js";
import { AIService, type AICodeGenerationRequest, type AICodeGenerationResult } from "./ai-service.js";

export interface EnhancedPlan extends Blueprint {
  agentInstructions: string;
  documentation: Record<string, DocumentationResult>;
  aiSuggestions: Record<string, AICodeGenerationResult>;
  researchPrompts: string[];
}

export class EnhancedPlanner {
  private context7Service: Context7Service;
  private aiService: AIService;
  
  constructor() {
    this.context7Service = new Context7Service();
    this.aiService = new AIService();
  }
  
  async createEnhancedPlan(config: ProjectConfig): Promise<EnhancedPlan> {
    // First, create the basic plan (dependencies, scripts, etc.)
    const basicPlan = await this.createBasicPlan(config);
    
    // Gather documentation using Context7
    const documentation = await this.gatherDocumentation(config);
    
    // Generate AI suggestions for implementation
    const aiSuggestions = await this.generateAISuggestions(config, documentation);
    
    // Create research prompts for further AI assistance
    const researchPrompts = this.createResearchPrompts(config, documentation);
    
    // Generate agent instructions
    const agentInstructions = this.generateAgentInstructions(config, basicPlan, documentation, aiSuggestions);
    
    return {
      ...basicPlan,
      agentInstructions,
      documentation,
      aiSuggestions,
      researchPrompts
    };
  }
  
  private async createBasicPlan(config: ProjectConfig): Promise<Blueprint> {
    // Import the original planner function
    const { planScaffold } = await import("./planner.js");
    return await planScaffold(config);
  }
  
  private async gatherDocumentation(config: ProjectConfig): Promise<Record<string, DocumentationResult>> {
    const documentation: Record<string, DocumentationResult> = {};
    
    // Get framework documentation
    const frameworkQuery = this.context7Service.getFrameworkQuery(config.framework);
    documentation.framework = {
      libraryId: "",
      documentation: `Framework: ${frameworkQuery.libraryName}\nQuery: ${frameworkQuery.query}`,
      examples: [],
      query: frameworkQuery.query
    };
    
    // Get documentation for each integration
    const integrations = [
      { key: "ui", value: config.ui },
      { key: "auth", value: config.auth },
      { key: "database", value: config.database },
      { key: "payments", value: config.payments },
      { key: "newsletter", value: config.newsletter },
      { key: "contact", value: config.contact },
      { key: "analytics", value: config.analytics },
      { key: "chat", value: config.chat }
    ];
    
    for (const integration of integrations) {
      if (integration.value !== "none") {
        const query = this.context7Service.getIntegrationQuery(integration.value, config.framework);
        documentation[integration.key] = {
          libraryId: "",
          documentation: `Integration: ${query.libraryName}\nQuery: ${query.query}`,
          examples: [],
          query: query.query
        };
      }
    }
    
    return documentation;
  }
  
  private async generateAISuggestions(
    config: ProjectConfig, 
    documentation: Record<string, DocumentationResult>
  ): Promise<Record<string, AICodeGenerationResult>> {
    const suggestions: Record<string, AICodeGenerationResult> = {};
    
    // Generate suggestions for framework setup
    this.aiService.createFrameworkPrompt(config.framework);
    suggestions.framework = this.aiService.getFallbackResult({
      framework: config.framework,
      integration: "framework",
      task: `Set up ${config.framework} project structure and configuration`,
      documentation: documentation.framework?.documentation
    });
    
    // Generate suggestions for each integration
    const integrations = [
      { key: "ui", value: config.ui, task: "Set up UI components and styling" },
      { key: "auth", value: config.auth, task: "Implement authentication system" },
      { key: "database", value: config.database, task: "Set up database connection and models" },
      { key: "payments", value: config.payments, task: "Implement payment processing" },
      { key: "newsletter", value: config.newsletter, task: "Set up newsletter subscription" },
      { key: "contact", value: config.contact, task: "Implement contact form" },
      { key: "analytics", value: config.analytics, task: "Set up analytics tracking" },
      { key: "chat", value: config.chat, task: "Implement chat widget" }
    ];
    
    for (const integration of integrations) {
      if (integration.value !== "none") {
        const request: AICodeGenerationRequest = {
          framework: config.framework,
          integration: integration.value,
          task: integration.task,
          documentation: documentation[integration.key]?.documentation
        };
        
        suggestions[integration.key] = this.aiService.getFallbackResult(request);
      }
    }
    
    return suggestions;
  }
  
  private createResearchPrompts(
    config: ProjectConfig, 
    documentation: Record<string, DocumentationResult>
  ): string[] {
    const prompts: string[] = [];
    
    // Framework research prompt
    prompts.push(this.aiService.createFrameworkPrompt(config.framework));
    
    // Integration research prompts
    const integrations = [
      { key: "ui", value: config.ui },
      { key: "auth", value: config.auth },
      { key: "database", value: config.database },
      { key: "payments", value: config.payments },
      { key: "newsletter", value: config.newsletter },
      { key: "contact", value: config.contact },
      { key: "analytics", value: config.analytics },
      { key: "chat", value: config.chat }
    ];
    
    for (const integration of integrations) {
      if (integration.value !== "none") {
        const request: AICodeGenerationRequest = {
          framework: config.framework,
          integration: integration.value,
          task: `Implement ${integration.value} in ${config.framework}`,
          documentation: documentation[integration.key]?.documentation
        };
        
        prompts.push(this.aiService.createIntegrationPrompt(request));
      }
    }
    
    return prompts;
  }
  
  private generateAgentInstructions(
    config: ProjectConfig,
    basicPlan: Blueprint,
    documentation: Record<string, DocumentationResult>,
    aiSuggestions: Record<string, AICodeGenerationResult>
  ): string {
    const instructions: string[] = [];
    
    instructions.push(`# Project Setup Instructions for ${config.framework.toUpperCase()}`);
    instructions.push("");
    instructions.push("## Project Configuration");
    instructions.push(`- **Framework**: ${config.framework}`);
    instructions.push(`- **Package Manager**: ${config.packageManager}`);
    instructions.push(`- **App Type**: ${config.appType}`);
    instructions.push("");
    
    instructions.push("## Integrations to Implement");
    const integrations = [
      { key: "UI", value: config.ui },
      { key: "Authentication", value: config.auth },
      { key: "Database", value: config.database },
      { key: "Payments", value: config.payments },
      { key: "Newsletter", value: config.newsletter },
      { key: "Contact Form", value: config.contact },
      { key: "Analytics", value: config.analytics },
      { key: "Chat", value: config.chat }
    ];
    
    for (const integration of integrations) {
      if (integration.value !== "none") {
        instructions.push(`- **${integration.key}**: ${integration.value}`);
      }
    }
    instructions.push("");
    
    instructions.push("## Dependencies Installed");
    instructions.push("### Production Dependencies");
    basicPlan.dependencies.forEach(dep => {
      instructions.push(`- ${dep}`);
    });
    instructions.push("");
    
    instructions.push("### Development Dependencies");
    basicPlan.devDependencies.forEach(dep => {
      instructions.push(`- ${dep}`);
    });
    instructions.push("");
    
    instructions.push("## Environment Variables Needed");
    basicPlan.env.forEach(env => {
      instructions.push(`- ${env.key}: ${env.description}`);
    });
    instructions.push("");
    
    instructions.push("## Implementation Tasks");
    
    // Framework setup
    if (aiSuggestions.framework) {
      instructions.push("### 1. Framework Setup");
      instructions.push(aiSuggestions.framework.explanation);
      instructions.push("");
      instructions.push("**Steps:**");
      aiSuggestions.framework.steps.forEach((step, index) => {
        instructions.push(`${index + 1}. ${step}`);
      });
      instructions.push("");
      
      if (aiSuggestions.framework.files.length > 0) {
        instructions.push("**Suggested Files:**");
        aiSuggestions.framework.files.forEach(file => {
          instructions.push(`- \`${file.path}\`: ${file.content.substring(0, 50)}...`);
        });
        instructions.push("");
      }
    }
    
    // Integration setups
    const integrationTasks = [
      { key: "ui", title: "UI Components" },
      { key: "auth", title: "Authentication" },
      { key: "database", title: "Database" },
      { key: "payments", title: "Payments" },
      { key: "newsletter", title: "Newsletter" },
      { key: "contact", title: "Contact Form" },
      { key: "analytics", title: "Analytics" },
      { key: "chat", title: "Chat" }
    ];
    
    for (const task of integrationTasks) {
      if (aiSuggestions[task.key]) {
        instructions.push(`### ${Object.keys(aiSuggestions).indexOf(task.key) + 2}. ${task.title} Setup`);
        instructions.push(aiSuggestions[task.key].explanation);
        instructions.push("");
        instructions.push("**Steps:**");
        aiSuggestions[task.key].steps.forEach((step, index) => {
          instructions.push(`${index + 1}. ${step}`);
        });
        instructions.push("");
        
        if (aiSuggestions[task.key].files.length > 0) {
          instructions.push("**Suggested Files:**");
          aiSuggestions[task.key].files.forEach(file => {
            instructions.push(`- \`${file.path}\``);
          });
          instructions.push("");
        }
      }
    }
    
    instructions.push("## Next Steps for AI Agent");
    instructions.push("1. Review the generated code suggestions");
    instructions.push("2. Use Context7 to fetch latest documentation for each integration");
    instructions.push("3. Implement complete configuration for each integration");
    instructions.push("4. Create example pages/components");
    instructions.push("5. Test all integrations");
    instructions.push("6. Add proper error handling and TypeScript types");
    instructions.push("7. Create project documentation");
    instructions.push("");
    
    instructions.push("## Research Prompts");
    instructions.push("Use these prompts with AI research tools:");
    this.createResearchPrompts(config, documentation).forEach((prompt, index) => {
      instructions.push(`### Prompt ${index + 1}`);
      instructions.push("```");
      instructions.push(prompt.substring(0, 200) + "...");
      instructions.push("```");
      instructions.push("");
    });
    
    return instructions.join("\n");
  }
}