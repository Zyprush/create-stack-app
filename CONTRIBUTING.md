# Contributing to create-stack-app

Thank you for your interest in contributing to create-stack-app! This document provides guidelines and instructions for contributing.

## Development Setup

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Link globally for local testing:
   ```bash
   npm link
   ```

## Development Workflow

### Running Tests
```bash
npm run build
npm run lint
```

### Adding New Framework Support
1. Add the framework to `src/config.ts` in the `framework` schema
2. Update `src/planner.ts` to handle the new framework:
   - Add dependencies in `getDependencies()`
   - Add scripts in `getScripts()`
   - Add boilerplate files in `generateFrameworkFiles()`
3. Update the AI service prompts in `src/ai-service.ts`

### Adding New Integration
1. Add the integration to `src/config.ts` in the appropriate schema
2. Update `src/planner.ts`:
   - Add dependencies in `getDependencies()`
   - Add environment variables in `getEnv()`
   - Add boilerplate code in the appropriate functions
3. Update documentation in README.md

## Pull Request Process

1. Create a new branch for your feature or bug fix
2. Make your changes with clear commit messages
3. Ensure all tests pass
4. Update documentation if needed
5. Submit a pull request with a clear description of changes

## Code Style

- Use TypeScript with strict type checking
- Follow existing code patterns and conventions
- Use descriptive variable and function names
- Add comments for complex logic
- Ensure ESLint passes without errors

## Questions?

Feel free to open an issue for questions or discussions about new features.