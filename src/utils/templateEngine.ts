// Path: src/utils/templateEngine.ts
// Provides a template engine for generating code from Eta templates.

import * as fs from 'fs';
import * as path from 'path';
import * as eta from 'eta';
import { createGeneratorError } from './errorUtils';
import { logger, LogCategory } from './logger';

/**
 * Template Engine.
 * Handles the loading and rendering of Eta templates.
 */
export default class TemplateEngine {
  private templateDir: string;
  private templates: Map<string, string> = new Map();
  private helpers: Record<string, Function> = {};
  private isVerbose: boolean = false;

  /**
   * Creates a new Template Engine.
   * @param templateDir Directory containing templates
   * @param isVerbose Whether to enable verbose logging
   */
  constructor(templateDir: string, isVerbose: boolean = false) {
    this.templateDir = templateDir;
    this.isVerbose = isVerbose;
    logger.debug(`TemplateEngine initialized with directory: ${templateDir}`, LogCategory.TEMPLATE);

    // Configure Eta
    eta.configure({
      cache: true,
      autoEscape: false,
      views: templateDir,
      useWith: true 
    });
  }

  /**
   * Loads all templates from the template directory.
   */
  public loadTemplates(): void {
    try {
      logger.debug(`Loading templates from directory: ${this.templateDir}`, LogCategory.TEMPLATE);
      
      // Check if template directory exists
      if (!fs.existsSync(this.templateDir)) {
        logger.error(`Template directory not found: ${this.templateDir}`, LogCategory.TEMPLATE);
        throw createGeneratorError(
          3001,
          `Template directory not found: ${this.templateDir}`,
          { templateDir: this.templateDir }
        );
      }

      // List all files in the directory to verify access
      const dirContents = fs.readdirSync(this.templateDir);
      logger.debug(`Template directory contents: ${dirContents.join(', ')}`, LogCategory.TEMPLATE);

      // Get all templates in the directory structure - supporting both .eta and .ejs
      this.walkDir(this.templateDir, (filePath) => {
        if (filePath.endsWith('.eta') || filePath.endsWith('.ejs')) {
          const relativePath = path.relative(this.templateDir, filePath);
          try {
            const templateContent = fs.readFileSync(filePath, 'utf-8');
            this.templates.set(relativePath, templateContent);
            
            // Also store a version without the extension for easier lookup
            const baseNameWithoutExt = path.basename(relativePath, path.extname(relativePath));
            const dirName = path.dirname(relativePath);
            if (dirName === '.') {
              // Root template
              this.templates.set(baseNameWithoutExt, templateContent);
            } else {
              // Template in subdirectory
              this.templates.set(path.join(dirName, baseNameWithoutExt), templateContent);
            }
            
            logger.debug(`Loaded template: ${relativePath}`, LogCategory.TEMPLATE);
          } catch (err) {
            logger.error(`Failed to read template file: ${filePath}, error: ${err}`, LogCategory.TEMPLATE);
          }
        }
      });

      logger.info(`Loaded ${this.templates.size} templates`, LogCategory.TEMPLATE);
      if (this.templates.size === 0) {
        logger.warn('No templates found. This may cause errors during generation.', LogCategory.TEMPLATE);
      }
    } catch (error) {
      logger.error(`Template loading error: ${error}`, LogCategory.TEMPLATE);
      
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
          logger.error(`Error accessing path: ${filePath}, error: ${err}`, LogCategory.TEMPLATE);
        }
      }
    } catch (err) {
      logger.error(`Error reading directory: ${dir}, error: ${err}`, LogCategory.TEMPLATE);
    }
  }

  /**
   * Registers a custom helper function.
   * @param name Name of the helper function
   * @param fn Helper function implementation
   */
  public registerHelper(name: string, fn: Function): void {
    this.helpers[name] = fn;
    logger.debug(`Registered helper function: ${name}`, LogCategory.TEMPLATE);
  }

  /**
   * Finds the best template match for the given name.
   * Searches in various locations to accommodate different template organization styles.
   * @param templateName Template name (with or without extension)
   * @returns The template path and content, or null if not found
   */
  private findTemplate(templateName: string): { path: string; content: string } | null {
    // Check for various forms of the template name
    let templateContent: string | undefined;
    
    // Step 1: Direct lookup in cache
    templateContent = this.templates.get(templateName);
    if (templateContent) {
      return { path: templateName, content: templateContent };
    }
    
    // Step 2: Try with extensions
    if (!templateName.endsWith('.eta') && !templateName.endsWith('.ejs')) {
      templateContent = this.templates.get(`${templateName}.eta`);
      if (templateContent) {
        return { path: `${templateName}.eta`, content: templateContent };
      }
      
      templateContent = this.templates.get(`${templateName}.ejs`);
      if (templateContent) {
        return { path: `${templateName}.ejs`, content: templateContent };
      }
    }
    
    // Step 3: Look for framework-specific paths (e.g., express/category/template)
    // Look for templates in express subdirectory
    for (const key of this.templates.keys()) {
      // Look for matches like "express/server/server" or "express/server/server.eta"
      if (
        key.includes(`/${templateName}`) || 
        key.includes(`/${templateName}.`) ||
        key.endsWith(`/${templateName}`)
      ) {
        templateContent = this.templates.get(key);
        if (templateContent) {
          return { path: key, content: templateContent };
        }
      }
      
      // Also try matching just the base name
      const baseName = path.basename(key, path.extname(key));
      if (baseName === templateName) {
        templateContent = this.templates.get(key);
        if (templateContent) {
          return { path: key, content: templateContent };
        }
      }
    }
    
    // Step 4: Try the file system directly
    const expressDir = path.join(this.templateDir, 'express');
    
    // Try several potential locations
    const potentialLocations = [
      path.join(this.templateDir, templateName),
      path.join(this.templateDir, `${templateName}.eta`),
      path.join(this.templateDir, `${templateName}.ejs`),
      // Try direct in express directory
      path.join(expressDir, templateName),
      path.join(expressDir, `${templateName}.eta`),
      path.join(expressDir, `${templateName}.ejs`),
      // Try in category subdirectory
      path.join(expressDir, templateName, `${templateName}.eta`),
      path.join(expressDir, templateName, `${templateName}.ejs`),
      // Try as a subdirectory of category
      path.join(expressDir, path.dirname(templateName), path.basename(templateName), `${path.basename(templateName)}.eta`),
      path.join(expressDir, path.dirname(templateName), path.basename(templateName), `${path.basename(templateName)}.ejs`)
    ];
    
    for (const location of potentialLocations) {
      if (fs.existsSync(location)) {
        try {
          templateContent = fs.readFileSync(location, 'utf-8');
          // Cache for future use
          this.templates.set(templateName, templateContent);
          logger.debug(`Found template at: ${location}`, LogCategory.TEMPLATE);
          return { path: location, content: templateContent };
        } catch (err) {
          logger.error(`Error reading template file ${location}: ${err}`, LogCategory.TEMPLATE);
        }
      }
    }
    
    // Template not found
    return null;
  }

  /**
   * Renders a template with the given data.
   * @param templateName Name of the template to render
   * @param data Data to pass to the template
   * @returns Rendered template output
   */
  public renderTemplate(templateName: string, data: any): string {
    try {
      logger.debug(`Rendering template: ${templateName}`, LogCategory.TEMPLATE);
      
      // Find the template
      const template = this.findTemplate(templateName);
      
      if (!template) {
        logger.error(`Template not found: ${templateName}`, LogCategory.TEMPLATE);
        
        // List available templates to help with debugging
        const availableTemplates = Array.from(this.templates.keys())
          .filter(t => !t.includes('/node_modules/'))
          .sort();
          
        logger.error(`Available templates (${availableTemplates.length}):`, LogCategory.TEMPLATE);
        availableTemplates.slice(0, 20).forEach(t => {
          logger.error(`  - ${t}`, LogCategory.TEMPLATE);
        });
        
        throw createGeneratorError(
          3003,
          `Template not found: ${templateName}`,
          { 
            templateName, 
            templateDir: this.templateDir,
            availableTemplates: availableTemplates.slice(0, 20) // List first 20 templates
          }
        );
      }

      logger.debug(`Using template: ${template.path}`, LogCategory.TEMPLATE);

      // Create a context with helpers
      const context = {
        ...data,
        ...this.helpers
      };

      // Render the template
      try {
        // Attempt to render with Eta
        const result = eta.render(template.content, context);
        
        if (result === undefined || result === null) {
          throw new Error('Eta rendering returned undefined or null');
        }
        
        logger.debug(`Successfully rendered template: ${templateName}`, LogCategory.TEMPLATE);
        return result;
      } catch (renderError) {
        logger.error(`Error during Eta rendering: ${renderError}`, LogCategory.TEMPLATE);
        
        // Try rendering with a more basic approach as fallback
        logger.warn('Attempting fallback rendering...', LogCategory.TEMPLATE);
        
        // Extract some template details for error context
        const templatePreview = template.content.substring(0, 100) + '...';
        const dataKeys = Object.keys(data);
        
        throw createGeneratorError(
          3004,
          `Failed to render template: ${renderError instanceof Error ? renderError.message : String(renderError)}`,
          { 
            templateName,
            templatePath: template.path,
            templatePreview,
            availableData: dataKeys,
            renderError: renderError instanceof Error ? renderError.message : String(renderError)
          },
          renderError instanceof Error ? renderError : new Error(String(renderError))
        );
      }
    } catch (error) {
      // If error is not already a generator error, wrap it
      if (error instanceof Error && !('code' in error)) {
        throw createGeneratorError(
          3005,
          `Template rendering error: ${error.message}`,
          { templateName },
          error
        );
      }
      
      throw error;
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
      logger.debug(`Rendering template ${templateName} to file: ${outputPath}`, LogCategory.TEMPLATE);
      
      // Render the template
      const output = this.renderTemplate(templateName, data);

      // Create the output directory if it doesn't exist
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        logger.debug(`Creating output directory: ${outputDir}`, LogCategory.TEMPLATE);
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Write the rendered output to the file
      fs.writeFileSync(outputPath, output, 'utf-8');
      logger.info(`Successfully wrote file: ${outputPath}`, LogCategory.TEMPLATE);
    } catch (error) {
      logger.error(`Error writing template to file: ${error}`, LogCategory.TEMPLATE);
      
      if (error instanceof Error && !('code' in error)) {
        throw createGeneratorError(
          3006,
          `Failed to render template to file: ${outputPath}`,
          { templateName, outputPath },
          error
        );
      }
      
      throw error;
    }
  }

  /**
   * Lists all templates that have been loaded.
   * @returns Array of template names
   */
  public listLoadedTemplates(): string[] {
    return Array.from(this.templates.keys());
  }
  
  /**
   * Enable verbose logging
   */
  public enableVerboseLogging(): void {
    this.isVerbose = true;
  }
}
