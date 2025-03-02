// Path: src/utils/templateEngine.ts
// Provides a template engine for generating code from EJS templates.

import * as fs from 'fs';
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
      // First, try to get the template by exact name
      let templateContent = this.templates.get(templateName);
      
      // If not found, try to find it in the templates directory
      if (!templateContent) {
        const templatePath = path.join(this.templateDir, templateName);
        if (fs.existsSync(templatePath)) {
          templateContent = fs.readFileSync(templatePath, 'utf-8');
          // Cache the template for future use
          this.templates.set(templateName, templateContent);
        }
      }
      
      // If still not found, check if it's in a subdirectory
      if (!templateContent) {
        // Look for files matching the template name in any subdirectory
        const matchingTemplates = Array.from(this.templates.keys())
          .filter(key => key.endsWith(`/${templateName}`) || key.endsWith(`\\${templateName}`));
        
        if (matchingTemplates.length > 0) {
          templateContent = this.templates.get(matchingTemplates[0]);
        }
      }
      
      if (!templateContent) {
        throw createGeneratorError(
          3003,
          `Template not found: ${templateName}`,
          { 
            templateName, 
            templateDir: this.templateDir,
            availableTemplates: Array.from(this.templates.keys()).join(', ')
          }
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
