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
export default class TemplateEngine {
  private templateDir: string;
  private templates: Map<string, string> = new Map();
  private helpers: Record<string, Function> = {};

  /**
   * Creates a new Template Engine.
   * @param templateDir Directory containing templates
   */
  constructor(templateDir: string) {
    this.templateDir = templateDir;
    console.log(`TemplateEngine initialized with directory: ${templateDir}`);
  }

  /**
   * Loads all templates from the template directory.
   */
  public loadTemplates(): void {
    try {
      console.log(`Loading templates from directory: ${this.templateDir}`);
      
      // Check if template directory exists
      if (!fs.existsSync(this.templateDir)) {
        console.error(`Template directory not found: ${this.templateDir}`);
        throw createGeneratorError(
          3001,
          `Template directory not found: ${this.templateDir}`,
          { templateDir: this.templateDir }
        );
      }

      // List all files in the directory to verify access
      const dirContents = fs.readdirSync(this.templateDir);
      console.log(`Template directory contents: ${dirContents.join(', ')}`);

      // Get all .ejs files in the template directory
      this.walkDir(this.templateDir, (filePath) => {
        if (filePath.endsWith('.ejs')) {
          const relativePath = path.relative(this.templateDir, filePath);
          try {
            const templateContent = fs.readFileSync(filePath, 'utf-8');
            this.templates.set(relativePath, templateContent);
            console.log(`Loaded template: ${relativePath}`);
          } catch (err) {
            console.warn(`Failed to read template file: ${filePath}`, err);
          }
        }
      });

      console.log(`Loaded ${this.templates.size} templates`);
      if (this.templates.size === 0) {
        console.warn('No templates found. This may cause errors during generation.');
      }
    } catch (error) {
      console.error(`Template loading error:`, error);
      
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
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        try {
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            this.walkDir(filePath, callback);
          } else {
            callback(filePath);
          }
        } catch (err) {
          console.warn(`Error accessing path: ${filePath}`, err);
        }
      }
    } catch (err) {
      console.warn(`Error reading directory: ${dir}`, err);
    }
  }

  /**
   * Registers a custom helper function.
   * @param name Name of the helper function
   * @param fn Helper function implementation
   */
  public registerHelper(name: string, fn: Function): void {
    this.helpers[name] = fn;
    console.log(`Registered helper function: ${name}`);
  }

  /**
   * Renders a template with the given data.
   * @param templateName Name of the template to render
   * @param data Data to pass to the template
   * @returns Rendered template output
   */
  public renderTemplate(templateName: string, data: any): string {
    try {
      console.log(`Rendering template: ${templateName}`);
      
      // First, try to get the template by exact name
      let templateContent = this.templates.get(templateName);
      let templateSource = 'cache';
      
      // If not found, try framework-specific directory structure
      if (!templateContent) {
        // Look for files that end with the template name
        const matchingTemplates = Array.from(this.templates.keys())
          .filter(key => {
            const basename = path.basename(key);
            return basename === templateName || key.endsWith(`/${templateName}`) || key.endsWith(`\\${templateName}`);
          });
        
        if (matchingTemplates.length > 0) {
          templateContent = this.templates.get(matchingTemplates[0])!;
          templateSource = `matched as ${matchingTemplates[0]}`;
        }
      }
      
      // If still not found, try to load from file directly
      if (!templateContent) {
        const templatePath = path.join(this.templateDir, templateName);
        
        if (fs.existsSync(templatePath)) {
          try {
            templateContent = fs.readFileSync(templatePath, 'utf-8');
            this.templates.set(templateName, templateContent);
            templateSource = 'file';
          } catch (err) {
            console.warn(`Failed to read template file: ${templatePath}`, err);
          }
        }
      }
      
      // If still not found, search all subdirectories
      if (!templateContent) {
        // Search for the template in all subdirectories
        const possiblePaths = this.findFileInDir(this.templateDir, templateName);
        
        if (possiblePaths.length > 0) {
          try {
            templateContent = fs.readFileSync(possiblePaths[0], 'utf-8');
            this.templates.set(templateName, templateContent);
            templateSource = `found at ${possiblePaths[0]}`;
          } catch (err) {
            console.warn(`Failed to read template file: ${possiblePaths[0]}`, err);
          }
        }
      }
      
      if (!templateContent) {
        console.error(`Template not found: ${templateName}`);
        console.error(`Available templates: ${Array.from(this.templates.keys()).join(', ')}`);
        
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

      console.log(`Found template ${templateName} (source: ${templateSource})`);

      // Create a context with helpers
      const context = {
        ...data,
        ...this.helpers
      };

      // Render the template
      const result = ejs.render(templateContent, context, {
        filename: path.join(this.templateDir, templateName) // For including other templates
      });
      
      console.log(`Successfully rendered template: ${templateName}`);
      return result;
    } catch (error) {
      console.error(`Error rendering template ${templateName}:`, error);
      
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
   * Find a file by name in a directory recursively.
   * @param dir Directory to search
   * @param filename Filename to find
   * @returns Array of matching file paths
   */
  private findFileInDir(dir: string, filename: string): string[] {
    let results: string[] = [];
    
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        
        try {
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            results = results.concat(this.findFileInDir(filePath, filename));
          } else if (file === filename || file.endsWith('/' + filename) || file.endsWith('\\' + filename)) {
            results.push(filePath);
          }
        } catch (err) {
          // Ignore errors for individual files
        }
      }
    } catch (err) {
      // Ignore errors for directories
    }
    
    return results;
  }

  /**
   * Renders a template to a file.
   * @param templateName Name of the template to render
   * @param outputPath Path to output the rendered template
   * @param data Data to pass to the template
   */
  public renderToFile(templateName: string, outputPath: string, data: any): void {
    try {
      console.log(`Rendering template ${templateName} to file: ${outputPath}`);
      
      // Render the template
      const output = this.renderTemplate(templateName, data);

      // Create the output directory if it doesn't exist
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        console.log(`Creating output directory: ${outputDir}`);
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Write the rendered output to the file
      fs.writeFileSync(outputPath, output, 'utf-8');
      console.log(`Successfully wrote file: ${outputPath}`);
    } catch (error) {
      console.error(`Error writing template to file:`, error);
      
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

  /**
   * Lists all templates that have been loaded.
   * @returns Array of template names
   */
  public listLoadedTemplates(): string[] {
    return Array.from(this.templates.keys());
  }
}
