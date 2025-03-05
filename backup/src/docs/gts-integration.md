// Path: docs/gts-integration.md

# Integrating Google TypeScript Style (GTS)

This document outlines the steps to integrate GTS (Google TypeScript Style) into the Axe Handle project while maintaining our existing project structure and conventions.

## What is GTS?

Google TypeScript Style (GTS) is Google's style guide for TypeScript code. It includes:

- Formatting rules (based on prettier)
- Linting rules (based on ESLint)
- TypeScript configuration standards
- Automatic fixing capabilities

## Integration Steps

### 1. Install GTS and Dependencies

```bash
npm install --save-dev gts typescript @types/node
```

### 2. Initialize GTS Configuration

Instead of using the automatic setup that would overwrite our existing configuration, we'll manually add the necessary files:

#### Create `.eslintrc.json`

```json
{
  "extends": "./node_modules/gts/",
  "rules": {
    // Override or add specific rules to match our existing standards
    "no-unused-vars": "warn",
    "node/no-unpublished-import": "off",
    // Add file naming conventions
    "filenames/match-regex": ["error", "^[a-z][a-zA-Z0-9]*$", true]
  }
}
```

#### Update `tsconfig.json`

Keep our existing tsconfig but add the GTS recommended settings:

```json
{
  "extends": "./node_modules/gts/tsconfig-google.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "dist",
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "declaration": true,
    "sourceMap": true,
    "forceConsistentCasingInFileNames": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "strictNullChecks": true,
    "resolveJsonModule": true
  },
  "include": [
    "src/**/*.ts",
    "test/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "generated"
  ]
}
```

#### Add `.prettierrc.js`

```js
module.exports = {
  ...require('gts/.prettierrc.json'),
  // Add our specific overrides
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  semi: true
};
```

### 3. Add npm Scripts

Update `package.json` to include GTS scripts:

```json
{
  "scripts": {
    // Existing scripts...
    "lint": "gts lint",
    "clean": "gts clean",
    "compile": "tsc",
    "fix": "gts fix",
    "prepare": "npm run compile",
    "pretest": "npm run compile",
    "posttest": "npm run lint"
  }
}
```

### 4. Integrate with Existing Code Standards

Create a custom ESLint plugin for our specific standards:

```js
// Path: tools/eslint-plugin-axe-handle.js
module.exports = {
  rules: {
    'file-header': {
      create: function(context) {
        return {
          Program: function(node) {
            const firstComment = context.getSourceCode().getAllComments()[0];
            if (!firstComment) {
              context.report({
                node: node,
                message: 'File should start with a header comment including path information'
              });
              return;
            }

            const filePathPattern = /Path: .+\n/;
            if (!filePathPattern.test(firstComment.value)) {
              context.report({
                node: firstComment,
                message: 'File header comment should include path information (e.g. "Path: src/utils/templateEngine.ts")'
              });
            }
          }
        };
      }
    }
  }
};
```

Update `.eslintrc.json` to use our custom plugin:

```json
{
  "extends": "./node_modules/gts/",
  "plugins": ["axe-handle"],
  "rules": {
    // Existing rules...
    "axe-handle/file-header": "warn"
  }
}
```

### 5. Fixing the TemplateEngine Implementation

Here's how to implement the TemplateEngine class following your project's conventions:

```typescript
// Path: src/utils/templateEngine.ts
// Provides a template engine for generating code from EJS templates.

import * as fs from 'fs/promises';
import * as path from 'path';
import * as ejs from 'ejs';
import { createGeneratorError } from './errorUtils';

/**
 * Template Engine.
 * Handles the loading and rendering of EJS templates.
 */
export class TemplateEngine {
  private templateDir: string;
  private templates: Map<string, string> = new Map();
  private helpers: Record<string, Function> = {};

  /**
   * Creates a new Template Engine.
   * @param templateDir Directory containing templates
   */
  constructor(templateDir: string) {
    this.templateDir = templateDir;
  }

  /**
   * Loads all templates from the template directory.
   */
  public loadTemplates(): void {
    try {
      // Check if template directory exists
      if (!fs.existsSync(this.templateDir)) {
        throw createGeneratorError(
          3001,
          `Template directory not found: ${this.templateDir}`,
          { templateDir: this.templateDir }
        );
      }

      // Get all .ejs files in the template directory
      this.walkDir(this.templateDir, (filePath) => {
        if (filePath.endsWith('.ejs')) {
          const relativePath = path.relative(this.templateDir, filePath);
          const templateContent = fs.readFileSync(filePath, 'utf-8');
          this.templates.set(relativePath, templateContent);
        }
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        // Error is already a generator error, rethrow
        throw error;
      }

      throw createGeneratorError(
        3002,
        `Failed to load templates from ${this.templateDir}`,
        { templateDir: this.templateDir },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Walks a directory recursively and calls the callback for each file.
   * @param dir Directory to walk
   * @param callback Callback to call for each file
   */
  private walkDir(dir: string, callback: (filePath: string) => void): void {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        this.walkDir(filePath, callback);
      } else {
        callback(filePath);
      }
    }
  }

  /**
   * Registers a custom helper function.
   * @param name Name of the helper function
   * @param fn Helper function implementation
   */
  public registerHelper(name: string, fn: Function): void {
    this.helpers[name] = fn;
  }

  /**
   * Renders a template with the given data.
   * @param templateName Name of the template to render
   * @param data Data to pass to the template
   * @returns Rendered template output
   */
  public renderTemplate(templateName: string, data: any): string {
    try {
      // Get template content
      const templateContent = this.templates.get(templateName);
      
      if (!templateContent) {
        throw createGeneratorError(
          3003,
          `Template not found: ${templateName}`,
          { templateName, availableTemplates: Array.from(this.templates.keys()) }
        );
      }

      // Create a context with helpers
      const context = {
        ...data,
        ...this.helpers
      };

      // Render the template
      return ejs.render(templateContent, context, {
        filename: path.join(this.templateDir, templateName) // For including other templates
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        // Error is already a generator error, rethrow
        throw error;
      }

      throw createGeneratorError(
        3004,
        `Failed to render template: ${templateName}`,
        { templateName },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Renders a template to a file.
   * @param templateName Name of the template to render
   * @param outputPath Path to output the rendered template
   * @param data Data to pass to the template
   */
  public renderToFile(templateName: string, outputPath: string, data: any): void {
    try {
      // Render the template
      const output = this.renderTemplate(templateName, data);

      // Create the output directory if it doesn't exist
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Write the rendered output to the file
      fs.writeFileSync(outputPath, output, 'utf-8');
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        // Error is already a generator error, rethrow
        throw error;
      }

      throw createGeneratorError(
        3005,
        `Failed to render template to file: ${outputPath}`,
        { templateName, outputPath },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}

export default TemplateEngine;
```

### 6. Enhancing the Existing Debug Capabilities

Instead of creating a new debug script, enhance the existing error handling:

```typescript
// Path: src/utils/errorUtils.ts

// Add to existing errorUtils.ts:

/**
 * Creates a detailed diagnostic report for an error.
 * Useful for debugging generator issues.
 */
export function createDiagnosticReport(error: Error | AxeError): string {
  let report = '--- Axe Handle Error Diagnostic Report ---\n\n';
  
  if ('code' in error) {
    const axeError = error as AxeError;
    report += `Error Code: ${axeError.code}\n`;
    report += `Message: ${axeError.message}\n\n`;
    
    if (axeError.details) {
      report += 'Details:\n';
      for (const [key, value] of Object.entries(axeError.details)) {
        report += `  ${key}: ${JSON.stringify(value)}\n`;
      }
      report += '\n';
    }
    
    if (axeError.cause) {
      report += 'Caused by:\n';
      if (axeError.cause instanceof Error) {
        report += `  ${axeError.cause.name}: ${axeError.cause.message}\n`;
        report += `  Stack: ${axeError.cause.stack}\n\n`;
      } else {
        report += `  ${JSON.stringify(axeError.cause)}\n\n`;
      }
    }
  } else {
    report += `Error: ${error.message}\n`;
    report += `Stack: ${error.stack}\n\n`;
  }
  
  // Add system information
  report += 'System Information:\n';
  report += `  Node.js: ${process.version}\n`;
  report += `  Platform: ${process.platform}\n`;
  report += `  Current Directory: ${process.cwd()}\n`;
  
  return report;
}

/**
 * Write a diagnostic report to a file.
 */
export function writeDiagnosticReport(error: Error | AxeError): string {
  const report = createDiagnosticReport(error);
  const reportPath = path.join(process.cwd(), 'axe-handle-error-report.log');
  
  try {
    fs.writeFileSync(reportPath, report, 'utf-8');
    return reportPath;
  } catch (e) {
    console.error(`Failed to write diagnostic report: ${e}`);
    return '';
  }
}
```

Then update the CLI error handling:

```typescript
// In cli.ts, update the error handling:

try {
  // ...code...
} catch (error) {
  console.error(chalk.red('\nAn error occurred during generation:'));
  
  if (error instanceof Error) {
    console.error(formatError(error));
    
    // Generate and save diagnostic report
    const reportPath = writeDiagnosticReport(error);
    if (reportPath) {
      console.error(chalk.yellow(`\nA detailed diagnostic report has been saved to: ${reportPath}`));
    }
  } else {
    console.error(chalk.red(`Unknown error: ${JSON.stringify(error, null, 2)}`));
  }
  
  process.exit(1);
}
```

## Conclusion

By integrating GTS into our build process and enhancing the existing error handling, we can maintain consistent code quality and make debugging easier without introducing separate scripts or disrupting the project structure.
